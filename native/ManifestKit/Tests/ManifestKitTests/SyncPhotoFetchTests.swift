// Photo fetch order on the sync client (native-merge-skips-photo-fetch, lane photo-fetch-order).
//
// Both flows call photoSync.pull(referenced:) after the photo-id keep and before the press gate and the
// apply. The referenced ids are those of the reply's live envelopes. The tests pin:
//   - a photo the reply names is fetched before the reply reaches the ledger, on a GET and on a POST (1, 2)
//   - only live envelopes' photo ids are requested, and a reply with none makes no photo call (3, 4)
//   - a failed photo fetch changes neither the outcome nor the advisory, and keeps the id (5)
//   - syncing is true while any call is out: while a photo fetch is held, while one of two overlapping
//     calls is out after the other ended, and while a retry's POST is out; false once nothing is out (6, 7, 8)
//   - a reply applies while a PhotoSync run is already out, and that run's fetch is skipped (9)
//
// Contract the tests name (the only new API, on SyncClient):
//   public var photoSync: PhotoSync?   // nil: no photo fetch
//   public var syncing: Bool { get }   // true while any call is out: a run() in flight, or the retry's POST
//
// Red-first. On main this file fails to compile only on `photoSync` and `syncing`. The red run is the macOS
// CI run: the test-author has no Swift toolchain, so no local run was made.
//
// Fakes. PhotoFakeTransport (PhotoSyncTests.swift) is the Worker. It has no hook on get() and no gate, so
// SyncPhotoWire wraps it and runs a test's hook first. PhotoCallHold is a gate with an arrival wait, so no
// test polls. SleepGate (StubURLProtocol.swift) holds the retry's delay. Nothing here sleeps or reads a clock.

import Foundation
import XCTest
@testable import ManifestKit

/// The envelope with this id in the store's ledger, nil when there is none.
private func syncPhotoEnvelope(_ store: LedgerStore, _ id: String) -> [String: Any]? {
    (store.snapshot()["envelopes"] as? [[String: Any]])?.first { ($0["id"] as? String) == id }
}

/// What a test's photo hook saw, read after the call ends.
@MainActor
final class SyncPhotoProbe {
    private let store: LedgerStore
    /// The Worker file name of each get(), in order.
    private(set) var getNames: [String] = []
    /// For each get(), whether the ledger held the envelope when the get began.
    private(set) var heldAtGet: [Bool] = []

    init(store: LedgerStore) { self.store = store }

    func sawGet(_ file: String, envelope id: String) {
        getNames.append(file)
        heldAtGet.append(syncPhotoEnvelope(store, id) != nil)
    }
}

/// The Worker as the client's photo sync sees it. list() and put() go to the fake. get() and put() run the
/// test's hook first, which may hold the call.
@MainActor
final class SyncPhotoWire: PhotoTransport {
    let inner: PhotoFakeTransport
    /// Runs at the start of each get(), before the Worker answers.
    var onGet: (@MainActor (String) async -> Void)?
    /// Runs at the start of each put(), before the Worker takes the bytes.
    var onPut: (@MainActor (String) async -> Void)?

    init(inner: PhotoFakeTransport) { self.inner = inner }

    func list() async throws -> [String]? {
        try await inner.list()
    }

    func put(name: String, data: Data) async throws {
        await onPut?(name)
        try await inner.put(name: name, data: data)
    }

    func get(name: String) async throws -> Data? {
        await onGet?(name)
        return try await inner.get(name: name)
    }
}

/// Holds one photo call until the test releases it. `awaitEntry()` returns once a call has entered the hold,
/// so no test polls. A release that comes first is kept for the next call.
@MainActor
final class PhotoCallHold {
    private var entries = 0
    private var credits = 0
    private var entryWaiters: [CheckedContinuation<Void, Never>] = []
    private var holders: [CheckedContinuation<Void, Never>] = []

    /// The hook body: records the entry, then waits for release().
    func enter() async {
        entries += 1
        let waiting = entryWaiters
        entryWaiters = []
        for waiter in waiting { waiter.resume() }
        if credits > 0 {
            credits -= 1
            return
        }
        await withCheckedContinuation { holders.append($0) }
    }

    /// Returns once a call has entered the hold, at once when one already has.
    func awaitEntry() async {
        if entries > 0 { return }
        await withCheckedContinuation { entryWaiters.append($0) }
    }

    /// Lets the oldest held call go on, or keeps the release for the next call.
    func release() {
        if holders.isEmpty {
            credits += 1
        } else {
            holders.removeFirst().resume()
        }
    }
}

/// The photo parts a test holds on to.
struct SyncPhotoRig {
    let photos: PhotoStore
    let worker: PhotoFakeTransport
    let wire: SyncPhotoWire
    let sync: PhotoSync
}

final class SyncPhotoFetchTests: SyncTestCase {
    typealias Kit = PhotoTestKit

    /// The bytes the Worker holds for each photo in these tests.
    static let photo = Data("bytes of a photo".utf8)

    enum Flow { case get, post }

    /// The Worker's file name for a photo id, as the rules bundle makes it.
    func photoFile(_ id: String) async throws -> String {
        let engine = try Kit.engine()
        return try await Kit.fileName(id, mime: "image/jpeg", engine: engine)
    }

    /// The client's photo side, as the app wires it: one PhotoStore for the client and for PhotoSync, and a
    /// Worker holding `worker`, keyed by file name. `getFail` names the files whose fetch fails.
    func wirePhotos(_ client: SyncClient, worker: [String: Data] = [:], getFail: Set<String> = []) throws -> SyncPhotoRig {
        let engine = try Kit.engine()
        let photos = PhotoStore(folder: dir.appending(path: "photos", directoryHint: .isDirectory), engine: engine)
        let inner = PhotoFakeTransport(held: worker, getFailNames: getFail)
        let wire = SyncPhotoWire(inner: inner)
        let sync = PhotoSync(store: photos, transport: wire, engine: engine)
        client.photoStore = photos
        client.photoSync = sync
        return SyncPhotoRig(photos: photos, worker: inner, wire: wire, sync: sync)
    }

    /// A 200 answer whose ledger carries these envelopes, at rev 2.
    func photoAnswer(_ envelopes: [[String: Any]]) throws -> StubNet.Reply {
        let doc = try ledger(extra: ["envelopes": envelopes])
        return ok(doc, rev: 2)
    }

    // MARK: fetch order

    /// Cases 1 and 2. The reply names a live photo the device lacks. The fetch begins before the ledger holds
    /// the envelope, and the reply then applies and the photo lands.
    func checkFetchComesBeforeTheApply(_ flow: Flow) async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let file = try await photoFile("pho-aaa-1")
        let rig = try wirePhotos(client, worker: [file: Self.photo])
        let probe = SyncPhotoProbe(store: store)
        rig.wire.onGet = { name in probe.sawGet(name, envelope: "e1") }
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"])]))

        let outcome: SyncOutcome
        switch flow {
        case .get: outcome = await client.pull()
        case .post: outcome = await client.push()
        }
        XCTAssertEqual(probe.getNames, [file], "the reply's photo was fetched")
        XCTAssertEqual(probe.heldAtGet, [false], "the fetch began before the ledger held the reply's envelope")
        XCTAssertEqual(outcome, .applied, "the reply applies")
        let blob = try await rig.photos.get(id: "pho-aaa-1")
        XCTAssertEqual(blob?.data, Self.photo, "the photo is in the PhotoStore after the apply")
    }

    // Case 1.
    func testAGetFetchesThePhotoBeforeTheApply() async throws {
        try await checkFetchComesBeforeTheApply(.get)
    }

    // Case 2.
    func testAPostFetchesThePhotoBeforeTheApply() async throws {
        try await checkFetchComesBeforeTheApply(.post)
    }

    // Case 3. The tombstone names a photo the Worker holds. It must not be fetched, because its envelope is deleted.
    func testOnlyTheLiveEnvelopesPhotosAreFetched() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let live = try await photoFile("pho-aaa-1")
        let dead = try await photoFile("pho-ddd-9")
        let rig = try wirePhotos(client, worker: [live: Self.photo, dead: Self.photo])
        let probe = SyncPhotoProbe(store: store)
        rig.wire.onGet = { name in probe.sawGet(name, envelope: "e1") }
        var tombstone = Kit.deletedEnvelope("e2")
        tombstone["photos"] = ["pho-ddd-9"]
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"]), tombstone]))

        let outcome = await client.pull()
        XCTAssertEqual(outcome, .applied, "the reply applies")
        XCTAssertEqual(probe.getNames, [live], "only the live envelope's photo is fetched; the tombstone's is not")
    }

    // Case 4. No photo id in the reply means no call to the photo transport, on either flow.
    func testAReplyWithNoPhotoIdsMakesNoPhotoCall() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let file = try await photoFile("pho-aaa-1")
        let rig = try wirePhotos(client, worker: [file: Self.photo])
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: [])]),
                    try photoAnswer([Kit.liveEnvelope("e1", photos: [])]))

        let pulled = await client.pull()
        let pushed = await client.push()
        XCTAssertEqual(pulled, .applied, "the GET reply applies")
        XCTAssertEqual(pushed, .applied, "the POST reply applies")
        let listed = await rig.worker.listCalls
        XCTAssertEqual(listed, 0, "no photo list was read, on either flow")
        let fetched = await rig.worker.getCalls
        XCTAssertEqual(fetched, [], "and no photo was fetched")
    }

    // Case 5. The fetch fails: the apply still lands, no advisory is set, and the id stays in the ledger.
    func testAFailedPhotoFetchKeepsTheApplyAndTheId() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let file = try await photoFile("pho-aaa-1")
        let rig = try wirePhotos(client, worker: [file: Self.photo], getFail: [file])
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"])]))

        let outcome = await client.pull()
        let attempted = await rig.worker.getCalls
        XCTAssertEqual(attempted, [file], "anchor: the fetch was attempted, and it failed")
        XCTAssertEqual(outcome, .applied, "a failed photo fetch leaves the outcome alone")
        XCTAssertNil(client.advisory, "and sets no advisory")
        XCTAssertEqual(syncPhotoEnvelope(store, "e1")?["photos"] as? [String], ["pho-aaa-1"],
                       "the id stays in the ledger")
    }

    // MARK: syncing

    // Case 6. syncing follows one call: false before it, true while its photo fetch is held, false after it returns.
    func testSyncingIsTrueWhileAPhotoFetchIsHeld() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let file = try await photoFile("pho-aaa-1")
        let rig = try wirePhotos(client, worker: [file: Self.photo])
        let hold = PhotoCallHold()
        rig.wire.onGet = { _ in await hold.enter() }
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"])]))

        XCTAssertFalse(client.syncing, "before any call, nothing is out")
        let call = Task { await client.pull() }
        await hold.awaitEntry()
        XCTAssertTrue(client.syncing, "while the photo fetch is held, a call is out")
        hold.release()
        let outcome = await call.value
        XCTAssertEqual(outcome, .applied, "the held call ends with its apply")
        XCTAssertFalse(client.syncing, "after the call returns, nothing is out")
    }

    // Case 7. Two calls overlap. The first to end is the POST, which fails at once. The GET is still held in the
    // photo fetch, so syncing must stay true. After the GET ends too, it is false.
    func testSyncingStaysTrueUntilTheLastOverlappingCallEnds() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let file = try await photoFile("pho-aaa-1")
        let rig = try wirePhotos(client, worker: [file: Self.photo])
        let hold = PhotoCallHold()
        rig.wire.onGet = { _ in await hold.enter() }
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"])]),
                    failure(400, "bad ledger"))

        let first = Task { await client.pull() }
        await hold.awaitEntry()
        let second = Task { await client.push() }
        let secondOutcome = await second.value
        XCTAssertEqual(secondOutcome, .badShape, "anchor: the second call ended while the first is held")
        XCTAssertTrue(client.syncing, "the first call is still out, so syncing stays true")
        hold.release()
        let firstOutcome = await first.value
        XCTAssertEqual(firstOutcome, .applied, "the first call ends with its apply")
        XCTAssertFalse(client.syncing, "both calls have ended, so nothing is out")
    }

    // Case 8. A failed push schedules a retry. While the retry's POST is held in the photo fetch, syncing is true.
    func testSyncingIsTrueWhileARetrysPostIsHeld() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let file = try await photoFile("pho-aaa-1")
        let rig = try wirePhotos(client, worker: [file: Self.photo])
        let hold = PhotoCallHold()
        rig.wire.onGet = { _ in await hold.enter() }
        net.enqueue(failure(500, "unavailable"), try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"])]))

        let failedPush = await client.push()
        XCTAssertEqual(failedPush, .unknown, "anchor: the first POST failed")
        XCTAssertNotNil(client.retryInMs, "and a retry is scheduled")
        gate.release()  // the retry's delay is over
        await hold.awaitEntry()
        XCTAssertTrue(client.syncing, "the retry's POST is out, held in the photo fetch")
        hold.release()
    }

    // MARK: a photo run already out

    // Case 9. A PhotoSync push is held in its put when the sync reply arrives. The reply still applies: the
    // client's photo pull returns an empty report while that run is out, so the fetch is skipped.
    func testAReplyAppliesWhileAPhotoRunIsHeldInAPut() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let rig = try wirePhotos(client)
        try await rig.photos.put(id: "pho-loc-1", blob: PhotoBlob(data: Self.photo, mime: "image/jpeg"))
        let hold = PhotoCallHold()
        rig.wire.onPut = { _ in await hold.enter() }
        net.enqueue(try photoAnswer([Kit.liveEnvelope("e1", photos: ["pho-aaa-1"])]))

        let push = Task { await rig.sync.push(referenced: ["pho-loc-1"]) }
        await hold.awaitEntry()
        XCTAssertTrue(rig.sync.running, "anchor: a photo run is out, held in its put")
        let outcome = await client.pull()
        XCTAssertEqual(outcome, .applied, "the reply applies while the photo run is out")
        XCTAssertEqual(syncPhotoEnvelope(store, "e1")?["photos"] as? [String], ["pho-aaa-1"],
                       "and its envelope is in the ledger")
        let fetched = await rig.worker.getCalls
        XCTAssertEqual(fetched, [], "the fetch during the push was skipped")
        hold.release()
        let report = await push.value
        XCTAssertEqual(report.pushed, ["pho-loc-1"], "anchor: the held push finishes")
    }
}
