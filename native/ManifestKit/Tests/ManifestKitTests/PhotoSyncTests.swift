// Photo sync tests (lane N10, native-parity-table, listphotos-is-three-valued, photo-sync-cannot-conflict).
//
// Photos sync through the Worker /photos route (worker/core.mjs). This lane builds the photo sync against
// a protocol, PhotoTransport, and leaves the HTTP wiring to lane N4a's client. Debt for the builder to
// record: the HTTP transport (Bearer header, base URL, the 413 line) is not built. Tests use a fake.
//
// What the tests pin, each from the web (src/app.jsx pushPhotos and pullPhotos, src/photo-rules.mjs):
//   - The plan is photoPlan from the rules bundle, over three sets: the referenced ids, the ids this
//     device holds, and the ids the Worker holds. Swift holds no copy of it (rules-run-in-javascriptcore).
//   - GET /photos lists file NAMES such as pho-a.jpg. They go through photoIdFromName before the plan.
//     A name passed as an id would look like a photo the Worker lacks, and upload it again.
//   - An unknown Worker list, or an unreadable local store, changes nothing and reports nothing lost.
//   - A photo over the Worker cap (PhotoTransportError.tooLarge) must not block the ones behind it.
//     Any other upload failure stops the run, and the next run resumes from the set difference.
//     A failed download skips that photo and the rest download (pullPhotos: "one bad fetch
//     shouldn't cost the other eleven").
//   - One run sends at most 25 photos (PHOTO_BATCH).
//   - Stop: the person can stop an upload. It cancels the call in flight, starts no more, and leaves
//     the next run free to resume. A stop with nothing running is not remembered. A Stop while the
//     Worker list is being read ends the run as stopped, not as an unknown list.
//
// Contract the tests name:
//   public enum PhotoTransportError: Error, Equatable, Sendable { case tooLarge }   // a 413
//   public protocol PhotoTransport: Sendable {
//       func list() async throws -> [String]?       // names as GET /photos gives them; nil: unknown
//       func put(name: String, data: Data) async throws   // POST /photos/<name>
//       func get(name: String) async throws -> Data?      // GET /photos/<name>; nil on a 404
//   }
//   public struct PhotoSyncReport: Equatable, Sendable {
//       known, unreadable, stopped, failed: Bool
//       pushed, pulled, lost, tooBig: [String]
//       left: Int            // wanted pushes not made: failed, stopped, over the batch, not tried
//   }
//   @MainActor @Observable public final class PhotoSync {
//       public struct Progress: Equatable, Sendable { public init(done: Int, total: Int) }
//       public static let batchSize: Int                       // 25
//       public init(store: PhotoStore, transport: PhotoTransport, engine: RulesEngine)
//       public private(set) var running: Bool
//       public private(set) var progress: Progress?            // while a push runs
//       public func push(referenced: [String]) async -> PhotoSyncReport
//       public func pull(referenced: [String]) async -> PhotoSyncReport
//       public func stop()                                     // cancels the run in flight, if any
//   }

import Foundation
import XCTest
@testable import ManifestKit

struct PhotoFakeNetworkDown: Error {}

/// The Worker, as the sync sees it. An actor, because the test target compiles in Swift 6 mode.
actor PhotoFakeTransport: PhotoTransport {
    enum ListMode { case names, unknown, down, hang }
    enum PutMode { case ok, tooLarge, fail, hang }

    private(set) var held: [String: Data]
    private var listMode: ListMode
    private var defaultPut: PutMode
    private var putModes: [String: PutMode]
    private var getFailNames: Set<String>
    private let onPutStart: (@Sendable (String) -> Void)?
    private let onListStart: (@Sendable () -> Void)?

    private(set) var listCalls = 0
    private(set) var putStarted: [String] = []
    private(set) var putCancelled: [String] = []
    private(set) var getCalls: [String] = []
    private(set) var listCancelled = 0

    /// A put or list in `.hang` mode waits this long unless it is cancelled. A run that Stop does not
    /// cancel still ends, so a missing Stop fails an assert and does not hang the suite.
    static let hangSeconds = 4

    init(held: [String: Data] = [:], list: ListMode = .names, put: PutMode = .ok,
         putModes: [String: PutMode] = [:], getFailNames: Set<String> = [],
         onPutStart: (@Sendable (String) -> Void)? = nil,
         onListStart: (@Sendable () -> Void)? = nil) {
        self.held = held
        self.listMode = list
        self.defaultPut = put
        self.putModes = putModes
        self.getFailNames = getFailNames
        self.onPutStart = onPutStart
        self.onListStart = onListStart
    }

    func setPut(_ name: String, _ mode: PutMode) { putModes[name] = mode }
    func setDefaultPut(_ mode: PutMode) { defaultPut = mode }

    func list() async throws -> [String]? {
        listCalls += 1
        onListStart?()
        switch listMode {
        case .names: return held.keys.sorted()
        case .unknown: return nil
        case .down: throw PhotoFakeNetworkDown()
        case .hang:
            do { try await Task.sleep(for: .seconds(Self.hangSeconds)) } catch {
                listCancelled += 1
                throw error
            }
            return held.keys.sorted()
        }
    }

    func put(name: String, data: Data) async throws {
        putStarted.append(name)
        onPutStart?(name)
        switch putModes[name] ?? defaultPut {
        case .ok: held[name] = data
        case .tooLarge: throw PhotoTransportError.tooLarge
        case .fail: throw PhotoFakeNetworkDown()
        case .hang:
            do { try await Task.sleep(for: .seconds(Self.hangSeconds)) } catch {
                putCancelled.append(name)
                throw error
            }
            held[name] = data
        }
    }

    func get(name: String) async throws -> Data? {
        getCalls.append(name)
        if getFailNames.contains(name) { throw PhotoFakeNetworkDown() }
        return held[name]
    }
}

@MainActor
final class PhotoSyncTests: XCTestCase {
    typealias Kit = PhotoTestKit

    var dir: URL!
    override func setUp() async throws { dir = try Kit.tempDir("n10-sync") }
    override func tearDown() async throws { try? FileManager.default.removeItem(at: dir) }

    // MARK: helpers

    struct Rig {
        let store: PhotoStore
        let sync: PhotoSync
        let fake: PhotoFakeTransport
        let engine: RulesEngine
    }

    func data(_ id: String) -> Data { Data("bytes of \(id)".utf8) }

    /// A Worker file name as the rules bundle makes it, so no extension is written by hand here.
    func fname(_ rig: Rig, _ id: String, _ mime: String = "image/jpeg") async throws -> String {
        try await Kit.fileName(id, mime: mime, engine: rig.engine)
    }

    /// `local` is the ids this device holds. `worker` maps a Worker file name to its bytes.
    func makeRig(local: [String] = [], localPNG: [String] = [], worker: [String: Data] = [:],
                 list: PhotoFakeTransport.ListMode = .names, put: PhotoFakeTransport.PutMode = .ok,
                 putModes: [String: PhotoFakeTransport.PutMode] = [:], getFailNames: Set<String> = [],
                 onPutStart: (@Sendable (String) -> Void)? = nil,
                 onListStart: (@Sendable () -> Void)? = nil,
                 storeFolder: URL? = nil) async throws -> Rig {
        let engine = try Kit.engine()
        let store = PhotoStore(folder: storeFolder ?? dir.appending(path: "photos", directoryHint: .isDirectory), engine: engine)
        for id in local { try await store.put(id: id, blob: PhotoBlob(data: data(id), mime: "image/jpeg")) }
        for id in localPNG { try await store.put(id: id, blob: PhotoBlob(data: data(id), mime: "image/png")) }
        let fake = PhotoFakeTransport(held: worker, list: list, put: put, putModes: putModes,
                                      getFailNames: getFailNames, onPutStart: onPutStart,
                                      onListStart: onListStart)
        return Rig(store: store, sync: PhotoSync(store: store, transport: fake, engine: engine), fake: fake, engine: engine)
    }

    // MARK: the plan

    /// The Worker lists names. pho-a-1.jpg is the photo this device already holds as pho-a-1, so
    /// nothing is uploaded and nothing is fetched.
    func testWorkerNamesGoThroughPhotoIdFromNameBeforeThePlan() async throws {
        let rig = try await makeRig(local: ["pho-a-1"], worker: ["pho-a-1.jpg": data("pho-a-1")])

        let report = await rig.sync.push(referenced: ["pho-a-1"])

        XCTAssertTrue(report.known)
        let started = await rig.fake.putStarted
        XCTAssertEqual(started, [], "a name read as an id uploads the photo the Worker already has")
        XCTAssertEqual(report.pushed, [])
        XCTAssertEqual(report.lost, [])
    }

    /// Push exactly: referenced, held here, missing on the Worker. A blob nothing references is not ours to
    /// publish, and a photo neither side holds is lost. The file name carries the type.
    func testPushSendsOnlyWhatIsReferencedHeldAndMissingOnTheWorker() async throws {
        let rig = try await makeRig(
            local: ["pho-a-1", "pho-c-1"], localPNG: ["pho-b-1"],
            worker: ["pho-a-1.jpg": data("pho-a-1")])

        let report = await rig.sync.push(referenced: ["pho-a-1", "pho-b-1", "pho-d-1"])

        let nameB = try await fname(rig, "pho-b-1", "image/png")
        let started = await rig.fake.putStarted
        XCTAssertEqual(started, [nameB], "only pho-b-1 is referenced, held and missing")
        let worker = await rig.fake.held
        XCTAssertEqual(worker[nameB], data("pho-b-1"), "the bytes sent must be the stored bytes")
        XCTAssertEqual(report.pushed, ["pho-b-1"])
        XCTAssertEqual(report.lost, ["pho-d-1"], "neither side holds pho-d-1")
        XCTAssertTrue(report.known)
        XCTAssertFalse(report.stopped)
        XCTAssertFalse(report.failed)
        XCTAssertEqual(report.left, 0)
    }

    /// listphotos-is-three-valued: a Worker that cannot say (nil, or a throw) is unknown, never empty.
    /// Read as empty, every photo would upload and every missing photo would be lost.
    func testAnUnknownWorkerListChangesNothingAndLosesNothing() async throws {
        for mode in [PhotoFakeTransport.ListMode.unknown, .down] {
            let rig = try await makeRig(local: ["pho-a-1"], list: mode)

            let report = await rig.sync.push(referenced: ["pho-a-1", "pho-gone-1"])

            XCTAssertFalse(report.known, "\(mode): the list was not read")
            XCTAssertEqual(report.pushed, [], "\(mode)")
            XCTAssertEqual(report.lost, [], "\(mode): an unknown list reports nothing lost")
            let started = await rig.fake.putStarted
            let fetched = await rig.fake.getCalls
            XCTAssertEqual(started, [], "\(mode)")
            XCTAssertEqual(fetched, [], "\(mode)")
        }
    }

    /// photo-ids-unreadable-local: a local store that cannot be read is not an empty one. The run
    /// stops before any transfer, and says so.
    func testAnUnreadableLocalStoreStopsBeforeAnyTransfer() async throws {
        let blocked = dir.appending(path: "blocked")
        try Data("a file where the folder should be".utf8).write(to: blocked)
        let rig = try await makeRig(worker: ["pho-w-1.jpg": data("pho-w-1")], storeFolder: blocked)

        let pushed = await rig.sync.push(referenced: ["pho-a-1"])
        let pulled = await rig.sync.pull(referenced: ["pho-w-1"])

        for (what, report) in [("push", pushed), ("pull", pulled)] {
            XCTAssertTrue(report.unreadable, what)
            XCTAssertEqual(report.pushed, [], what)
            XCTAssertEqual(report.pulled, [], what)
            XCTAssertEqual(report.lost, [], what + ": every id would look lost if the store read as empty")
        }
        let started = await rig.fake.putStarted
        let fetched = await rig.fake.getCalls
        XCTAssertEqual(started, [])
        XCTAssertEqual(fetched, [])
    }

    // MARK: failures

    /// One photo over the Worker cap must not block the ones behind it.
    func testAPhotoOverTheCapDoesNotBlockTheOnesBehindIt() async throws {
        let rig = try await makeRig(local: ["pho-a-1", "pho-b-1", "pho-c-1"])
        await rig.fake.setPut(try await fname(rig, "pho-a-1"), .tooLarge)

        let report = await rig.sync.push(referenced: ["pho-a-1", "pho-b-1", "pho-c-1"])

        XCTAssertEqual(report.tooBig, ["pho-a-1"])
        XCTAssertEqual(report.pushed, ["pho-b-1", "pho-c-1"])
        XCTAssertFalse(report.failed, "a photo over the cap is not a failed run")
        XCTAssertEqual(report.left, 0, "a photo over the cap is not left to send")
    }

    /// Any other failure stops the run: do not grind on a Worker that is down. The next run resumes
    /// from the set difference, so nothing sent is sent twice.
    func testAnyOtherFailureStopsTheRunAndTheNextRunResumes() async throws {
        let rig = try await makeRig(local: ["pho-a-1", "pho-b-1", "pho-c-1"])
        let nameB = try await fname(rig, "pho-b-1")
        await rig.fake.setPut(nameB, .fail)
        let refs = ["pho-a-1", "pho-b-1", "pho-c-1"]

        let first = await rig.sync.push(referenced: refs)

        XCTAssertEqual(first.pushed, ["pho-a-1"])
        XCTAssertTrue(first.failed)
        XCTAssertFalse(first.stopped, "a failure is not a Stop")
        XCTAssertEqual(first.left, 2, "pho-b-1 failed and pho-c-1 was never tried")
        let started = await rig.fake.putStarted
        XCTAssertEqual(started.count, 2, "the run must not try pho-c-1 after the failure")

        await rig.fake.setPut(nameB, .ok)
        let second = await rig.sync.push(referenced: refs)

        XCTAssertEqual(second.pushed, ["pho-b-1", "pho-c-1"], "the next run sends only what is missing")
        XCTAssertFalse(second.failed)
    }

    /// One run sends at most 25, so a first backfill cannot sit uploading for minutes.
    func testOneRunSendsAtMostTwentyFivePhotos() async throws {
        let ids = (1...27).map { "pho-n-\($0)" }
        let rig = try await makeRig(local: ids)
        XCTAssertEqual(PhotoSync.batchSize, 25)

        let first = await rig.sync.push(referenced: ids)

        XCTAssertEqual(first.pushed, Array(ids.prefix(25)))
        XCTAssertEqual(first.left, 2)
        let second = await rig.sync.push(referenced: ids)
        XCTAssertEqual(second.pushed, Array(ids.suffix(2)), "the next run sends the rest")
        XCTAssertEqual(second.left, 0)
    }

    // MARK: Stop

    /// The photo upload has Stop. It cancels the call in flight, starts no more, and says it stopped.
    /// Nothing is marked sent, and the next run sends everything.
    func testStopCancelsTheUploadInFlightAndStartsNoMore() async throws {
        let started = expectation(description: "the first put began")
        started.assertForOverFulfill = false
        let ids = ["pho-a-1", "pho-b-1", "pho-c-1"]
        let rig = try await makeRig(local: ids, put: .hang, onPutStart: { _ in started.fulfill() })
        let first = try await fname(rig, "pho-a-1")

        let run = Task { await rig.sync.push(referenced: ids) }
        await fulfillment(of: [started], timeout: 3)  // a timeout fails the test by itself
        XCTAssertTrue(rig.sync.running, "a Stop control shows only while an upload runs")
        XCTAssertEqual(rig.sync.progress, PhotoSync.Progress(done: 0, total: 3))

        rig.sync.stop()
        let report = await run.value

        XCTAssertTrue(report.stopped)
        XCTAssertFalse(report.failed, "a Stop is not a failure")
        XCTAssertEqual(report.pushed, [])
        XCTAssertEqual(report.left, 3)
        XCTAssertFalse(rig.sync.running)
        let begun = await rig.fake.putStarted
        let cancelled = await rig.fake.putCancelled
        XCTAssertEqual(begun, [first], "no second put may start after Stop")
        XCTAssertEqual(cancelled, [first], "the call in flight must be told to stop")

        await rig.fake.setDefaultPut(.ok)
        let again = await rig.sync.push(referenced: ids)

        XCTAssertEqual(again.pushed, ids, "after a Stop the next run sends everything")
        XCTAssertFalse(again.stopped)
        XCTAssertFalse(rig.sync.running)
    }

    /// A Stop with nothing running does nothing, and does not cancel the run that comes next.
    func testStopWithNothingRunningIsNotRemembered() async throws {
        let rig = try await makeRig(local: ["pho-a-1"])

        rig.sync.stop()
        let report = await rig.sync.push(referenced: ["pho-a-1"])

        XCTAssertEqual(report.pushed, ["pho-a-1"])
        XCTAssertFalse(report.stopped)
    }

    /// A Stop while the Worker list is being read cancels that call. The run ends as stopped, not as an
    /// unknown list (known is false either way, so only `stopped` tells the person what happened), and
    /// no photo moves. Push and pull share the survey, so both are run.
    func testStopDuringTheListEndsTheRunAsStopped() async throws {
        for pull in [false, true] {
            let what = pull ? "pull" : "push"
            let listing = expectation(description: "\(what): the list call began")
            listing.assertForOverFulfill = false
            let rig = try await makeRig(local: ["pho-a-1"], worker: ["pho-w-1.jpg": data("pho-w-1")],
                                        list: .hang, onListStart: { listing.fulfill() })

            let run = Task {
                pull ? await rig.sync.pull(referenced: ["pho-a-1", "pho-w-1"])
                     : await rig.sync.push(referenced: ["pho-a-1", "pho-w-1"])
            }
            await fulfillment(of: [listing], timeout: 3)  // a timeout fails the test by itself
            XCTAssertTrue(rig.sync.running, what)

            rig.sync.stop()
            let report = await run.value

            let cancelled = await rig.fake.listCancelled
            XCTAssertEqual(cancelled, 1, "\(what): the list call in flight must be told to stop")
            XCTAssertTrue(report.stopped, "\(what): a Stop during the list is a Stop")
            XCTAssertFalse(report.failed, "\(what): a Stop is not a failure")
            XCTAssertFalse(report.known, "\(what): the list was not read")
            XCTAssertEqual(report.pushed, [], what)
            XCTAssertEqual(report.pulled, [], what)
            XCTAssertEqual(report.lost, [], what)
            let started = await rig.fake.putStarted
            let fetched = await rig.fake.getCalls
            XCTAssertEqual(started, [], what)
            XCTAssertEqual(fetched, [], what)
            XCTAssertFalse(rig.sync.running, what)
        }
    }

    // MARK: pull

    /// Pull fetches what the Worker holds and this device lacks, by the Worker's own names, and keeps
    /// each type: the type comes back from the file name (mimeFromName).
    func testPullDownloadsWhatTheWorkerHoldsAndThisDeviceLacks() async throws {
        let rig = try await makeRig(
            local: ["pho-a-1"],
            worker: ["pho-a-1.jpg": data("pho-a-1"), "pho-b-1.jpg": data("pho-b-1"), "pho-c-1.png": data("pho-c-1")])

        let report = await rig.sync.pull(referenced: ["pho-a-1", "pho-b-1", "pho-c-1", "pho-d-1"])

        XCTAssertEqual(report.pulled, ["pho-b-1", "pho-c-1"])
        XCTAssertEqual(report.lost, ["pho-d-1"], "neither side holds pho-d-1")
        let fetched = await rig.fake.getCalls
        XCTAssertEqual(fetched, ["pho-b-1.jpg", "pho-c-1.png"], "fetch by the Worker's own names")
        let b = try await rig.store.get(id: "pho-b-1")
        let c = try await rig.store.get(id: "pho-c-1")
        XCTAssertEqual(b, PhotoBlob(data: data("pho-b-1"), mime: "image/jpeg"))
        XCTAssertEqual(c, PhotoBlob(data: data("pho-c-1"), mime: "image/png"))
        let started = await rig.fake.putStarted
        XCTAssertEqual(started, [], "a pull sends nothing")
    }

    /// A failed download skips that photo and the rest download (pullPhotos: one bad fetch must not cost
    /// the others). The failure is the middle photo, so a pull that stops at it shows up as a missing
    /// third. The skipped photo is still wanted, so it is left for the next run. Whether the report also
    /// says `failed` is not pinned: the web shows nothing for a skipped fetch.
    func testAFailedDownloadSkipsThatPhotoAndTheRestDownload() async throws {
        let rig = try await makeRig(
            worker: ["pho-b-1.jpg": data("pho-b-1"), "pho-c-1.jpg": data("pho-c-1"), "pho-d-1.jpg": data("pho-d-1")],
            getFailNames: ["pho-c-1.jpg"])

        let report = await rig.sync.pull(referenced: ["pho-b-1", "pho-c-1", "pho-d-1"])

        XCTAssertEqual(report.pulled, ["pho-b-1", "pho-d-1"], "the photo after the failure still downloads")
        let fetched = await rig.fake.getCalls
        XCTAssertEqual(fetched, ["pho-b-1.jpg", "pho-c-1.jpg", "pho-d-1.jpg"], "every wanted photo is tried")
        let held = await rig.store.heldIds()
        XCTAssertEqual(held, ["pho-b-1", "pho-d-1"], "only the two photos that downloaded are stored")
        XCTAssertEqual(report.left, 1, "the skipped photo is still wanted")
    }
}
