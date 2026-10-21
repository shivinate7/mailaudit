// Photo capture tests (lane N10, photos-stay-out-of-the-ledger, native-ledger-is-raw-json).
//
// A photo lives in the photos folder. The ledger carries only its id, in the envelope's `photos` list.
// The blob never enters ledger.json, so a push never carries a picture and a merge never has to
// choose between two. Capture shrinks the picture first (label-photos-downscale-to-2000px), writes
// the blob, and only then commits the id to a LIVE envelope, with a fresh `updatedAt` so the
// two-device merge sees an edit (mergeEnvelopes keys on it). The ledger edit follows the store's
// own commit pattern: it saves, and a failed save puts the store back as it was.
//
// Contract the tests name:
//   @MainActor public final class PhotoCapture {
//       public init(store: PhotoStore, ledger: LedgerStore)
//       public static func newID() -> String        // pho-<time>-<seq><random>, the shape photoIdFromName reads
//       /// shrink, store the blob, then commit the id. Returns the new id.
//       public func add(_ data: Data, toEnvelope envelopeID: String) async throws -> String
//   }
//   public extension LedgerStore {                  // two small additions to LedgerStore.swift
//       func photoIDs() -> [String]                 // ids of live envelopes, each once, in envelope order
//       /// Appends `id` to the live envelope's `photos`, sets its `updatedAt` to now, bumps `generation`,
//       /// and saves. A save that fails restores the store. Throws when no live envelope has that id.
//       func commitPhoto(_ id: String, toEnvelope envelopeID: String) throws
//   }
//
// Red-first: see PhotoStubs.swift.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PhotoCaptureTests: XCTestCase {
    typealias Kit = PhotoTestKit

    var dir: URL!         // holds ledger.json
    var photoDir: URL!    // holds the photos folder, apart from the ledger so one can fail alone
    var ledgerURL: URL { dir.appending(path: "ledger.json") }

    override func setUp() async throws {
        dir = try Kit.tempDir("n10-ledger")
        photoDir = try Kit.tempDir("n10-photos")
    }

    override func tearDown() async throws {
        try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path)
        try? FileManager.default.removeItem(at: dir)
        try? FileManager.default.removeItem(at: photoDir)
    }

    // MARK: helpers

    func makeLedger(_ envelopes: [[String: Any]]) throws -> (LedgerStore, Data) {
        let bytes = try Kit.writeLedger(to: ledgerURL, envelopes: envelopes)
        let ledger = LedgerStore(fileURL: ledgerURL, now: { Kit.t0 })
        try ledger.load()
        return (ledger, bytes)
    }

    func makeStore() throws -> PhotoStore {
        PhotoStore(folder: photoDir.appending(path: "photos", directoryHint: .isDirectory), engine: try Kit.engine())
    }

    // MARK: a photo blob never enters the ledger

    func testTheBlobNeverEntersLedgerJson() async throws {
        let (ledger, before) = try makeLedger([Kit.liveEnvelope("env-1")])
        let store = try makeStore()
        let capture = PhotoCapture(store: store, ledger: ledger)
        let source = Kit.png(width: 1000, height: 800, noise: true)

        let id = try await capture.add(source, toEnvelope: "env-1")

        let stored = try await store.get(id: id)
        let blob = try XCTUnwrap(stored, "the blob should be in the photos folder")
        XCTAssertGreaterThan(blob.data.count, 100_000, "the blob should be big, or the checks below prove nothing")
        let bytes = try Data(contentsOf: ledgerURL)
        XCTAssertLessThan(bytes.count, before.count + 400, "the ledger may grow by an id and a time, not a picture")
        XCTAssertNil(bytes.range(of: blob.data.prefix(64)), "raw blob bytes are in ledger.json")
        let b64 = Data(blob.data.prefix(48).base64EncodedString().utf8)
        XCTAssertNil(bytes.range(of: b64), "base64 blob bytes are in ledger.json")
        let doc = try Kit.readLedger(ledgerURL)
        XCTAssertEqual(Set(doc.keys), ["mailday", "items", "received", "receivedAt", "stamps", "envelopes"],
                       "capture must add no top-level field, and never a photos map")
        let env = try XCTUnwrap(Kit.envelope("env-1", in: doc))
        XCTAssertEqual(env["photos"] as? [String], [id], "the envelope carries the id and nothing else")
    }

    /// The edit touches only the live envelope's `photos` and `updatedAt`.
    func testTheEnvelopeGainsTheIdIsRestampedAndNothingElseMoves() async throws {
        let other = Kit.liveEnvelope("env-2", photos: ["pho-x-1"])
        let (ledger, _) = try makeLedger([Kit.liveEnvelope("env-1", photos: ["pho-old-1"]), other])
        let capture = PhotoCapture(store: try makeStore(), ledger: ledger)
        XCTAssertEqual(ledger.generation, 0)

        let id = try await capture.add(Kit.png(width: 800, height: 600), toEnvelope: "env-1")

        XCTAssertEqual(ledger.generation, 1, "one capture is one edit")
        let doc = try Kit.readLedger(ledgerURL)
        let env = try XCTUnwrap(Kit.envelope("env-1", in: doc))
        XCTAssertEqual(env["photos"] as? [String], ["pho-old-1", id])
        XCTAssertEqual(env["updatedAt"] as? Double, Kit.t0, "the envelope needs a fresh updatedAt to win a merge")
        XCTAssertEqual(env["createdAt"] as? Int, 1_000)
        XCTAssertEqual(env["note"] as? String, "")
        XCTAssertEqual((env["entries"] as? [[String: Any]])?.count, 1)
        XCTAssertEqual(Kit.envelope("env-2", in: doc) as NSDictionary?, other as NSDictionary, "another envelope moved")
    }

    /// Downscale comes before the write: the stored blob is the shrunk one.
    func testTheStoredBlobIsTheShrunkOne() async throws {
        let (ledger, _) = try makeLedger([Kit.liveEnvelope("env-1")])
        let store = try makeStore()
        let capture = PhotoCapture(store: store, ledger: ledger)

        let id = try await capture.add(Kit.png(width: 3024, height: 4032), toEnvelope: "env-1")

        let stored = try await store.get(id: id)
        let blob = try XCTUnwrap(stored)
        XCTAssertEqual(Kit.info(blob.data)?.upright, Kit.Size(w: 1500, h: 2000))
        XCTAssertEqual(blob.mime, "image/jpeg")
    }

    // MARK: refusals change nothing

    /// An envelope that is not there, or was discarded, takes no photo. The check comes before the
    /// write, so no blob is left behind for the sweep.
    func testAMissingOrDiscardedEnvelopeIsRefusedBeforeAnyBlobIsWritten() async throws {
        let (ledger, before) = try makeLedger([Kit.liveEnvelope("env-1"), Kit.deletedEnvelope("env-gone")])
        let store = try makeStore()
        let capture = PhotoCapture(store: store, ledger: ledger)

        for target in ["env-nope", "env-gone"] {
            do {
                _ = try await capture.add(Kit.png(width: 800, height: 600), toEnvelope: target)
                XCTFail("\(target) should be refused")
            } catch {}
        }

        let held = await store.heldIds()
        XCTAssertEqual(held, [], "a refused capture left a blob behind")
        XCTAssertEqual(try Data(contentsOf: ledgerURL), before, "a refused capture changed the ledger")
        XCTAssertEqual(ledger.generation, 0)
    }

    /// The blob is written first. When that fails, the ledger never names a photo that is not there.
    func testABlobThatCannotBeWrittenLeavesTheLedgerAlone() async throws {
        let (ledger, before) = try makeLedger([Kit.liveEnvelope("env-1")])
        let blocked = photoDir.appending(path: "photos")
        try Data("a file where the folder should be".utf8).write(to: blocked)
        let capture = PhotoCapture(store: PhotoStore(folder: blocked, engine: try Kit.engine()), ledger: ledger)

        do {
            _ = try await capture.add(Kit.png(width: 800, height: 600), toEnvelope: "env-1")
            XCTFail("a blob that cannot be written should throw")
        } catch {}

        XCTAssertEqual(try Data(contentsOf: ledgerURL), before)
        XCTAssertEqual(ledger.generation, 0)
        XCTAssertEqual(ledger.photoIDs(), [])
    }

    /// A ledger that cannot be saved keeps no id in memory either. The blob stays; the orphan
    /// sweep drops a photo no envelope uses (orphan-sweep-drops-unused-photos).
    func testALedgerSaveThatFailsRestoresTheStore() async throws {
        let (ledger, before) = try makeLedger([Kit.liveEnvelope("env-1")])
        let capture = PhotoCapture(store: try makeStore(), ledger: ledger)
        try FileManager.default.setAttributes([.posixPermissions: 0o555], ofItemAtPath: dir.path)
        try XCTSkipIf(FileManager.default.isWritableFile(atPath: dir.path),
                      "the folder stays writable here, so the save cannot be refused")

        do {
            _ = try await capture.add(Kit.png(width: 800, height: 600), toEnvelope: "env-1")
            XCTFail("a ledger save that fails should throw")
        } catch {}

        XCTAssertEqual(ledger.generation, 0, "a failed save must restore the generation")
        XCTAssertEqual(ledger.photoIDs(), [], "a failed save must not leave the id in memory")
        XCTAssertEqual(try Data(contentsOf: ledgerURL), before)
    }

    // MARK: ids

    /// The id must be a name the Worker route accepts: photoIdFromName(<id>.jpg) gives the id back.
    /// An id it refuses would answer 400 on every upload.
    func testNewIdsAreWorkerNamesAndNeverRepeat() async throws {
        let engine = try Kit.engine()
        let ids = (0..<50).map { _ in PhotoCapture.newID() }

        XCTAssertEqual(Set(ids).count, 50, "two captures made the same id")
        var refused: [String] = []
        for id in ids {
            let back = try await Kit.idFromName("\(id).jpg", engine: engine)
            if !id.hasPrefix("pho-") || back != id { refused.append(id) }
        }
        XCTAssertEqual(refused, [], "the Worker route would refuse these ids")
    }

    // MARK: what the ledger references

    /// photoIDs is what photoPlan takes as `referenced`: ids of LIVE envelopes only, each once.
    /// A photo left on a discarded envelope is not ours to publish.
    func testPhotoIDsListsLiveEnvelopesOnceInOrder() throws {
        var ghost = Kit.deletedEnvelope("env-gone")
        ghost["photos"] = ["pho-ghost-1"]
        let (ledger, _) = try makeLedger([
            Kit.liveEnvelope("env-1", photos: ["pho-b-1", "pho-a-1"]),
            ghost,
            Kit.liveEnvelope("env-2", photos: ["pho-a-1", "pho-c-1"]),
        ])

        XCTAssertEqual(ledger.photoIDs(), ["pho-b-1", "pho-a-1", "pho-c-1"])
    }
}
