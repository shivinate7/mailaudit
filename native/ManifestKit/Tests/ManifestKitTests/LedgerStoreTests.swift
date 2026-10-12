// Ledger store tests (lane N3, native-ledger-is-raw-json).
//
// The store keeps ledger.json as raw JSON. An edit changes only `received`,
// `receivedAt`, `envelopes` and `stamps`. Every other field passes through.
//
// Red-first. The builder adds the types named below in
// native/ManifestKit/Sources/ManifestKit/LedgerStore.swift. Until a stub exists the
// file does not compile. The stub the builder starts from returns wrong values, so
// each test fails on an XCTAssert and not on a compile error (testing-throwing-assert-bad-kill).
//
// Contract the tests name:
//   public final class LedgerStore {
//       public init(fileURL: URL, now: @escaping () -> Double)
//       public private(set) var generation: Int
//       public func load() throws          // reads the file, sets defaults
//       public func save() throws          // writes the file atomically
//       public func setReceived(_ key: String, count: Int)   // count 0 is an un-check
//       public func setStamp(_ key: String, kind: String, note: String, at: String)
//       public func removeStamp(_ key: String)               // writes kind: ""
//       public func discardEnvelope(_ id: String)            // writes a tombstone
//   }
//
// Fake fixtures only. This file reads no Keychain item and no device key.

import Foundation
import XCTest
@testable import ManifestKit

final class LedgerStoreTests: XCTestCase {
    /// native/ManifestKit/Tests/ManifestKitTests/<this file> -> repo root.
    static let root: URL = URL(fileURLWithPath: #filePath)
        .resolvingSymlinksInPath()
        .deletingLastPathComponent()  // ManifestKitTests
        .deletingLastPathComponent()  // Tests
        .deletingLastPathComponent()  // ManifestKit
        .deletingLastPathComponent()  // native
        .deletingLastPathComponent()  // repo root

    static let fixtureURL = root.appending(path: "shared/fixtures/ledger.json")

    /// A fixed clock. Same instant as the golden tests.
    static let t0: Double = 1_786_543_380_000

    /// The package key gkOf builds, as orderId::seller. Taken from the shared fixture.
    static let packageKey = "A1::Alpha Cards"
    /// An item key from the shared fixture.
    static let itemKey = "A1|0|pLightningBolt"

    var dir: URL!
    var clock: Double = LedgerStoreTests.t0

    var fileURL: URL { dir.appending(path: "ledger.json") }

    override func setUpWithError() throws {
        dir = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        clock = Self.t0
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: dir)
    }

    // MARK: helpers

    func makeStore() -> LedgerStore {
        LedgerStore(fileURL: fileURL, now: { self.clock })
    }

    /// The fixture holds only `items`. The seed adds `mailday` (1 by default; nil omits
    /// it). Extra fields go in as given.
    @discardableResult
    func writeSeed(mailday: Any? = 1, extra: [String: Any] = [:]) throws -> [String: Any] {
        let fixtureData = try Data(contentsOf: Self.fixtureURL)
        let fixture = try XCTUnwrap(JSONSerialization.jsonObject(with: fixtureData) as? [String: Any])
        let items = try XCTUnwrap(fixture["items"])
        var seed: [String: Any] = ["items": items]
        if let mailday { seed["mailday"] = mailday }
        for (key, value) in extra { seed[key] = value }
        let data = try JSONSerialization.data(withJSONObject: seed, options: [.sortedKeys])
        try data.write(to: fileURL)
        return seed
    }

    func readSaved() throws -> [String: Any] {
        let data = try Data(contentsOf: fileURL)
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    /// Compares two JSON fragments by their canonical bytes, so key order and number
    /// type (Int or Double) do not matter.
    func assertSameJSON(_ actual: Any?, _ expected: Any, _ message: String, line: UInt = #line) {
        guard let actual else {
            XCTFail("\(message): field missing", line: line)
            return
        }
        let a = try? JSONSerialization.data(withJSONObject: actual, options: [.sortedKeys, .fragmentsAllowed])
        let e = try? JSONSerialization.data(withJSONObject: expected, options: [.sortedKeys, .fragmentsAllowed])
        XCTAssertEqual(a, e, message, line: line)
    }

    /// Finds one envelope record by id in the saved `envelopes` array.
    func envelope(_ id: String, in saved: [String: Any], line: UInt = #line) throws -> [String: Any] {
        let list = try XCTUnwrap(saved["envelopes"] as? [[String: Any]], "envelopes array", line: line)
        return try XCTUnwrap(list.first { ($0["id"] as? String) == id }, "envelope \(id) present", line: line)
    }

    // MARK: unknown fields

    /// A field the client does not know must survive a save. The Worker merge needs it.
    func testUnknownFieldRoundTripsThroughSave() throws {
        let future: [String: Any] = ["nested": [1, "two", true] as [Any], "flag": false]
        try writeSeed(extra: ["futureField": future])

        let store = makeStore()
        try store.load()
        store.setReceived(Self.itemKey, count: 1)  // an edit, so the save writes
        try store.save()

        let saved = try readSaved()
        assertSameJSON(saved["futureField"], future, "unknown field survives save")
        // Without this, a save that writes nothing would still pass the line above.
        let received = saved["received"] as? [String: Any] ?? [:]
        XCTAssertEqual(received[Self.itemKey] as? Int, 1, "the edit landed in the saved file")
    }

    // MARK: check and un-check

    func testCheckWritesCountAndReceivedAt() throws {
        try writeSeed()
        let store = makeStore()
        try store.load()
        clock = Self.t0 + 5_000
        store.setReceived(Self.itemKey, count: 1)
        try store.save()

        let saved = try readSaved()
        let received = try XCTUnwrap(saved["received"] as? [String: Any])
        XCTAssertEqual(received[Self.itemKey] as? Int, 1, "a check writes its count")
        let receivedAt = try XCTUnwrap(saved["receivedAt"] as? [String: Any])
        XCTAssertEqual(receivedAt[Self.itemKey] as? Double, Self.t0 + 5_000, "a check writes receivedAt")
    }

    /// An un-check drops the key from `received`, and writes its time to `receivedAt`.
    /// It must not write `received` as 0.
    func testUncheckWritesReceivedAtAndDropsReceived() throws {
        try writeSeed(extra: [
            "received": [Self.itemKey: 1],
            "receivedAt": [Self.itemKey: Self.t0 - 1_000],
        ])
        let store = makeStore()
        try store.load()
        clock = Self.t0 + 5_000
        store.setReceived(Self.itemKey, count: 0)
        try store.save()

        let saved = try readSaved()
        let received = try XCTUnwrap(saved["received"] as? [String: Any])
        XCTAssertNil(received[Self.itemKey], "an un-check drops the key from received")
        let receivedAt = try XCTUnwrap(saved["receivedAt"] as? [String: Any])
        XCTAssertEqual(receivedAt[Self.itemKey] as? Double, Self.t0 + 5_000, "an un-check writes receivedAt")
    }

    // MARK: stamps

    /// Removing a stamp keeps the package key, with `kind: ""`, so it can win a merge.
    func testStampRemovalWritesTombstoneKindEmpty() throws {
        try writeSeed(extra: [
            "stamps": [Self.packageKey: ["kind": "claim", "at": "2026-08-01", "note": "", "updatedAt": Self.t0 - 1_000]],
        ])
        let store = makeStore()
        try store.load()
        clock = Self.t0 + 5_000
        store.removeStamp(Self.packageKey)
        try store.save()

        let stamps = try XCTUnwrap(try readSaved()["stamps"] as? [String: Any])
        let stamp = try XCTUnwrap(stamps[Self.packageKey] as? [String: Any],
                                  "a removal keeps the key as a tombstone")
        XCTAssertEqual(stamp["kind"] as? String, "", "a stamp removal writes kind: \"\"")
        XCTAssertEqual(stamp["updatedAt"] as? Double, Self.t0 + 5_000, "a removal writes a fresh updatedAt")
    }

    // MARK: envelopes

    /// A discard leaves the record in `envelopes` as a tombstone. It sets `deletedAt`,
    /// and empties `entries` and `photos`.
    func testDiscardWritesEnvelopeTombstone() throws {
        try writeSeed(extra: [
            "envelopes": [[
                "id": "env-1",
                "createdAt": Self.t0 - 86_400_000,
                "updatedAt": Self.t0 - 1_000,
                "note": "",
                "entries": [["name": "Counterspell", "qty": 1]],
                "photos": ["p1"],
            ] as [String: Any]],
        ])
        let store = makeStore()
        try store.load()
        clock = Self.t0 + 5_000
        store.discardEnvelope("env-1")
        try store.save()

        let env = try envelope("env-1", in: try readSaved())
        XCTAssertEqual(env["deletedAt"] as? Double, Self.t0 + 5_000, "a discard sets deletedAt")
        XCTAssertEqual((env["entries"] as? [Any])?.count, 0, "a discard empties entries")
        XCTAssertEqual((env["photos"] as? [Any])?.count, 0, "a discard empties photos")
        XCTAssertEqual(env["updatedAt"] as? Double, Self.t0 + 5_000, "a discard bumps updatedAt so it wins a merge")
    }

    // MARK: generation

    /// Each edit bumps `generation` by exactly one. The sync client reads it to decide
    /// whether a reply still applies.
    func testEachEditBumpsGenerationByOne() throws {
        try writeSeed(extra: [
            "stamps": [Self.packageKey: ["kind": "claim", "at": "2026-08-01", "note": "", "updatedAt": Self.t0 - 1_000]],
            "envelopes": [[
                "id": "env-1",
                "createdAt": Self.t0 - 86_400_000,
                "updatedAt": Self.t0 - 1_000,
                "note": "",
                "entries": [["name": "Counterspell", "qty": 1]],
                "photos": [],
            ] as [String: Any]],
        ])
        let store = makeStore()
        try store.load()

        var before = store.generation
        store.setReceived(Self.itemKey, count: 1)
        XCTAssertEqual(store.generation, before + 1, "setReceived bumps generation by one")

        before = store.generation
        store.setReceived(Self.itemKey, count: 0)
        XCTAssertEqual(store.generation, before + 1, "an un-check bumps generation by one")

        before = store.generation
        store.setStamp(Self.packageKey, kind: "refunded", note: "", at: "2026-08-02")
        XCTAssertEqual(store.generation, before + 1, "setStamp bumps generation by one")

        before = store.generation
        store.removeStamp(Self.packageKey)
        XCTAssertEqual(store.generation, before + 1, "removeStamp bumps generation by one")

        before = store.generation
        store.discardEnvelope("env-1")
        XCTAssertEqual(store.generation, before + 1, "discardEnvelope bumps generation by one")
    }

    // MARK: load defaults

    /// A ledger with only `mailday` and `items` loads with the defaults. The save writes
    /// `mailday: 1`, because the Worker requires it.
    func testLoadSetsDefaultsForMissingFields() throws {
        try writeSeed()
        let store = makeStore()
        try store.load()
        try store.save()

        let saved = try readSaved()
        XCTAssertEqual(saved["mailday"] as? Int, 1, "the save writes mailday 1")
        XCTAssertEqual((saved["items"] as? [Any])?.count, 12, "items come from the shared fixture (12 rows)")
        XCTAssertEqual((saved["received"] as? [String: Any])?.count ?? -1, 0, "received defaults to {}")
        XCTAssertEqual((saved["receivedAt"] as? [String: Any])?.count ?? -1, 0, "receivedAt defaults to {}")
        XCTAssertEqual((saved["stamps"] as? [String: Any])?.count ?? -1, 0, "stamps defaults to {}")
        XCTAssertEqual((saved["envelopes"] as? [Any])?.count ?? -1, 0, "envelopes defaults to []")
    }

    // MARK: refusals

    /// A file with no `mailday` is an older ledger. It loads, and the save writes mailday 1.
    func testLoadAcceptsMissingMaildayAndSavesAsOne() throws {
        try writeSeed(mailday: nil)
        let store = makeStore()
        try store.load()
        try store.save()

        XCTAssertEqual(try readSaved()["mailday"] as? Int, 1, "a file with no mailday loads and saves as 1")
    }

    /// A `mailday` of 2 is a newer format. load() must throw. A save after the refused
    /// load must throw too, and the file must stay as it was. On current code load()
    /// forces mailday to 1, so the file is overwritten.
    func testLoadRefusesMaildayTwoAndSaveWritesNothing() throws {
        try writeSeed(mailday: 2)
        let before = try Data(contentsOf: fileURL)
        let store = makeStore()

        XCTAssertThrowsError(try store.load(), "a mailday 2 file makes load throw")
        XCTAssertThrowsError(try store.save(), "a save after a refused mailday 2 load throws")
        let after = try Data(contentsOf: fileURL)
        XCTAssertEqual(after, before, "a refused mailday 2 load leaves the file unchanged")
    }

    /// save() before a successful load() must throw and write nothing. The seed file is
    /// real, so a save that writes `{}` over it shows as a byte change.
    func testSaveBeforeLoadThrowsAndWritesNothing() throws {
        try writeSeed(extra: ["received": [Self.itemKey: 1]])
        let before = try Data(contentsOf: fileURL)
        let store = makeStore()

        XCTAssertThrowsError(try store.save(), "save before load throws")
        let after = try Data(contentsOf: fileURL)
        XCTAssertEqual(after, before, "a save before load leaves the seed file unchanged")
    }

    /// An `envelopes` value that is not an array is malformed, not missing. load() must
    /// throw, and a save after it must throw and write nothing. A missing `envelopes`
    /// still defaults to [] (see testLoadSetsDefaultsForMissingFields).
    func testLoadRefusesMalformedEnvelopesAndSaveWritesNothing() throws {
        try writeSeed(extra: ["envelopes": "not-an-array"])
        let before = try Data(contentsOf: fileURL)
        let store = makeStore()

        XCTAssertThrowsError(try store.load(), "a non-array envelopes makes load throw")
        XCTAssertThrowsError(try store.save(), "a save after a refused envelopes load throws")
        let after = try Data(contentsOf: fileURL)
        XCTAssertEqual(after, before, "a refused envelopes load leaves the file unchanged")
    }

    /// `received`, `receivedAt` and `stamps` are maps. A value that is not an object is
    /// malformed, like a non-array `envelopes`: load() throws, a save after it throws,
    /// and the file stays as it was. An absent field still defaults to {}
    /// (see testLoadSetsDefaultsForMissingFields).
    func assertRefusesMalformedMap(_ field: String, _ value: Any, line: UInt = #line) throws {
        try writeSeed(extra: [field: value])
        let before = try Data(contentsOf: fileURL)
        let store = makeStore()

        XCTAssertThrowsError(try store.load(), "a non-object \(field) makes load throw", line: line)
        XCTAssertThrowsError(try store.save(), "a save after a refused \(field) load throws", line: line)
        let after = try Data(contentsOf: fileURL)
        XCTAssertEqual(after, before, "a refused \(field) load leaves the file unchanged", line: line)
    }

    func testLoadRefusesArrayReceivedAndSaveWritesNothing() throws {
        try assertRefusesMalformedMap("received", [Any]())
    }

    func testLoadRefusesStringReceivedAndSaveWritesNothing() throws {
        try assertRefusesMalformedMap("received", "x")
    }

    func testLoadRefusesArrayReceivedAtAndSaveWritesNothing() throws {
        try assertRefusesMalformedMap("receivedAt", [Any]())
    }

    func testLoadRefusesStringReceivedAtAndSaveWritesNothing() throws {
        try assertRefusesMalformedMap("receivedAt", "x")
    }

    func testLoadRefusesArrayStampsAndSaveWritesNothing() throws {
        try assertRefusesMalformedMap("stamps", [Any]())
    }

    func testLoadRefusesStringStampsAndSaveWritesNothing() throws {
        try assertRefusesMalformedMap("stamps", "x")
    }

    /// A good load, then the file is replaced with bytes that are not a ledger. The
    /// reload must throw, and a save after it must throw and leave the replacement as
    /// it was. On current code the failed reload keeps the old loaded state, so save()
    /// writes the old document over the replacement.
    func testFailedReloadOfTopLevelArrayLeavesStoreUnloaded() throws {
        try writeSeed()
        let store = makeStore()
        try store.load()
        try assertFailedReloadKeepsFile(store, replacement: Data("[]".utf8))
    }

    /// Same as above, with invalid JSON as the replacement.
    func testFailedReloadOfInvalidJSONLeavesStoreUnloaded() throws {
        try writeSeed()
        let store = makeStore()
        try store.load()
        try assertFailedReloadKeepsFile(store, replacement: Data("{not json".utf8))
    }

    /// Writes `replacement` over the ledger, then checks that a reload throws, a save
    /// throws, and the bytes on disk stay exactly as `replacement` left them.
    func assertFailedReloadKeepsFile(_ store: LedgerStore, replacement: Data, line: UInt = #line) throws {
        try replacement.write(to: fileURL)
        XCTAssertThrowsError(try store.load(), "a reload of a non-ledger file throws", line: line)
        XCTAssertThrowsError(try store.save(), "a save after a failed reload throws", line: line)
        let after = try Data(contentsOf: fileURL)
        XCTAssertEqual(after, replacement, "a failed reload then save leaves the replaced file unchanged", line: line)
    }
}
