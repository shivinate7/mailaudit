// Ledger store tests (lane N3, native-ledger-is-raw-json).
//
// The store keeps ledger.json as raw JSON. An edit changes only `received`,
// `receivedAt`, `envelopes` and `stamps`. Every other field passes through.
//
// Owner ruling 2026-10-12 ("Keep a copy, then go on"): a damaged `received`,
// `receivedAt`, `stamps` or `envelopes` (a wrong shape, a JSON null, or one bad
// entry) is copied first. The original bytes go to ledger.kept-<ISO time>.json
// beside the ledger. Then every readable entry is kept, the broken ones are
// dropped, and the dropped count is reported. A save writes the mended ledger.
// The refusals that remain are the orchestrator fallbacks: an unwritable copy,
// and text that is not a JSON object.
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
//       public private(set) var droppedCount: Int   // entries dropped by the last good load
//       public func load() throws          // copies a damaged file, mends it, sets defaults
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
    /// A key that no fixture row holds, used for a broken entry.
    static let brokenKey = "A9|0|pBroken"

    var dir: URL!
    var clock: Double = LedgerStoreTests.t0

    var fileURL: URL { dir.appending(path: "ledger.json") }

    override func setUpWithError() throws {
        dir = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        clock = Self.t0
    }

    override func tearDownWithError() throws {
        // A test may leave the folder read-only. Restore it so the folder can be removed.
        try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path)
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

    /// The kept copies beside the ledger: ledger.kept-<ISO time>.json.
    func keptCopies() throws -> [URL] {
        try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            .filter { $0.lastPathComponent.hasPrefix("ledger.kept-") && $0.pathExtension == "json" }
    }

    /// Seeds one damaged field, then loads and saves. The kept copy must hold the
    /// original bytes, the saved field must be the mended value, and the dropped
    /// count must match.
    func assertMends(_ field: String, _ damaged: Any, to expected: Any, dropped: Int, line: UInt = #line) throws {
        try writeSeed(extra: [field: damaged])
        let original = try Data(contentsOf: fileURL)
        let store = makeStore()

        XCTAssertNoThrow(try store.load(), "a damaged \(field) loads after its copy is kept", line: line)
        XCTAssertEqual(store.droppedCount, dropped, "the dropped count for \(field)", line: line)
        XCTAssertNoThrow(try store.save(), "the mended \(field) saves", line: line)

        let copies = try keptCopies()
        XCTAssertEqual(copies.count, 1, "one kept copy sits beside the ledger", line: line)
        if let copy = copies.first {
            XCTAssertEqual(try Data(contentsOf: copy), original, "the kept copy holds the original bytes", line: line)
        }
        assertSameJSON(try readSaved()[field], expected, "the saved \(field) is the mended value", line: line)
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

    /// The web's removal writes `{kind: "", note: "", at: "", updatedAt}` (src/app.jsx setStamp), so a restore or a
    /// backup cannot bring the removed stamp's note or date back. Native kept both and blanked only kind. The store is
    /// the one writer of the tombstone (stamp-removal-writes-a-tombstone), so the check is here, saved and in memory.
    func testStampRemovalClearsTheNoteAndTheDateAsTheWebDoes() throws {
        try writeSeed(extra: [
            "stamps": [Self.packageKey: ["kind": "claim", "at": "2026-08-01", "note": "called twice", "updatedAt": Self.t0 - 1_000]],
        ])
        let store = makeStore()
        try store.load()
        clock = Self.t0 + 5_000
        store.removeStamp(Self.packageKey)
        try store.save()

        let saved = try XCTUnwrap((try readSaved()["stamps"] as? [String: Any])?[Self.packageKey] as? [String: Any],
                                  "a removal keeps the key as a tombstone")
        for (label, stamp) in [("saved", saved), ("in memory", try XCTUnwrap(store.stamps()[Self.packageKey]))] {
            XCTAssertEqual(stamp["kind"] as? String, "", "\(label): kind is cleared")
            XCTAssertEqual(stamp["note"] as? String, "", "\(label): the note is cleared, not kept")
            XCTAssertEqual(stamp["at"] as? String, "", "\(label): the date is cleared, not kept")
            XCTAssertEqual(stamp["updatedAt"] as? Double, Self.t0 + 5_000, "\(label): a fresh updatedAt")
        }
    }

    // MARK: envelopes

    /// A discard leaves the record in `envelopes` as a tombstone. It sets `deletedAt`,
    /// and empties `entries` and `photos`.
    func testDiscardWritesEnvelopeTombstone() throws {
        let entry: [String: Any] = ["name": "Counterspell", "qty": 1]
        try writeSeed(extra: [
            "envelopes": [[
                "id": "env-1",
                "createdAt": Self.t0 - 86_400_000,
                "updatedAt": Self.t0 - 1_000,
                "note": "",
                "entries": [entry],
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
        let entry: [String: Any] = ["name": "Counterspell", "qty": 1]
        try writeSeed(extra: [
            "stamps": [Self.packageKey: ["kind": "claim", "at": "2026-08-01", "note": "", "updatedAt": Self.t0 - 1_000]],
            "envelopes": [[
                "id": "env-1",
                "createdAt": Self.t0 - 86_400_000,
                "updatedAt": Self.t0 - 1_000,
                "note": "",
                "entries": [entry],
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

    // MARK: mailday

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

    // MARK: damaged fields: copy, mend, count, save

    /// A `received` entry that is not a number is dropped. The readable entry stays.
    func testDamagedReceivedEntryIsDroppedAndTheRestKept() throws {
        try assertMends("received", [Self.itemKey: 1, Self.brokenKey: "x"],
                        to: [Self.itemKey: 1], dropped: 1)
    }

    /// A `received` that is an array is damage to the whole field. It is mended to {}.
    func testReceivedArrayIsMendedToEmptyMapAndCountsOne() throws {
        try assertMends("received", [Any](), to: [String: Any](), dropped: 1)
    }

    /// JSON null is damage, not absence. It is mended to {} and counts one.
    func testReceivedNullIsDamagedNotAbsent() throws {
        try assertMends("received", NSNull(), to: [String: Any](), dropped: 1)
    }

    /// A `receivedAt` entry that is not a number is dropped. The readable entry stays.
    func testDamagedReceivedAtEntryIsDroppedAndTheRestKept() throws {
        try assertMends("receivedAt", [Self.itemKey: Self.t0 - 1_000, Self.brokenKey: "x"],
                        to: [Self.itemKey: Self.t0 - 1_000], dropped: 1)
    }

    /// A `receivedAt` that is a string is damage to the whole field. It is mended to {}.
    func testReceivedAtStringIsMendedToEmptyMapAndCountsOne() throws {
        try assertMends("receivedAt", "x", to: [String: Any](), dropped: 1)
    }

    /// A `stamps` entry that is not an object is dropped. The stamp object stays.
    func testDamagedStampsEntryIsDroppedAndTheRestKept() throws {
        let stamp: [String: Any] = ["kind": "claim", "at": "2026-08-01", "note": "", "updatedAt": Self.t0 - 1_000]
        try assertMends("stamps", [Self.packageKey: stamp, "A9::Broken Seller": "x"],
                        to: [Self.packageKey: stamp], dropped: 1)
    }

    /// A `stamps` that is an array is damage to the whole field. It is mended to {}.
    func testStampsArrayIsMendedToEmptyMapAndCountsOne() throws {
        try assertMends("stamps", [Any](), to: [String: Any](), dropped: 1)
    }

    /// An `envelopes` record with no string `id`, and a record that is not an object,
    /// are both dropped. The readable record stays.
    func testDamagedEnvelopesAreDroppedAndTheRestKept() throws {
        let entry: [String: Any] = ["name": "Counterspell", "qty": 1]
        let env: [String: Any] = [
            "id": "env-1",
            "createdAt": Self.t0 - 86_400_000,
            "updatedAt": Self.t0 - 1_000,
            "note": "",
            "entries": [entry],
            "photos": [],
        ]
        let noId: [String: Any] = ["createdAt": Self.t0 - 86_400_000, "note": "", "entries": [entry]]
        let damaged: [Any] = [env, noId, "x"]
        try assertMends("envelopes", damaged, to: [env], dropped: 2)
    }

    /// An `envelopes` value that is not an array is damage to the whole field. It is
    /// mended to [] and counts one. A missing `envelopes` still defaults to []
    /// (see testLoadSetsDefaultsForMissingFields).
    func testEnvelopesNotAnArrayIsMendedToEmptyListAndCountsOne() throws {
        try assertMends("envelopes", "not-an-array", to: [Any](), dropped: 1)
    }

    /// JSON null in `receivedAt` is damage, not absence. It is mended to {} and counts one.
    func testReceivedAtNullIsDamagedNotAbsent() throws {
        try assertMends("receivedAt", NSNull(), to: [String: Any](), dropped: 1)
    }

    /// JSON null in `stamps` is damage, not absence. It is mended to {} and counts one.
    func testStampsNullIsDamagedNotAbsent() throws {
        try assertMends("stamps", NSNull(), to: [String: Any](), dropped: 1)
    }

    /// JSON null in `envelopes` is damage, not absence. It is mended to [] and counts one.
    func testEnvelopesNullIsDamagedNotAbsent() throws {
        try assertMends("envelopes", NSNull(), to: [Any](), dropped: 1)
    }

    /// A clean ledger loads with no kept copy and a dropped count of 0.
    func testCleanLoadMakesNoCopyAndCountsZero() throws {
        try writeSeed(extra: ["received": [Self.itemKey: 1], "stamps": [String: Any](), "envelopes": [Any]()])
        let store = makeStore()

        XCTAssertNoThrow(try store.load(), "a clean ledger loads")
        XCTAssertEqual(store.droppedCount, 0, "a clean load drops nothing")
        XCTAssertEqual(try keptCopies().count, 0, "a clean load keeps no copy")
    }

    /// The mend is saved at once. Without any edit, the file on disk holds the mended
    /// `received` after load, so a relaunch reads the mended ledger, not the damage.
    func testLoadSavesTheMendAtOnce() throws {
        try writeSeed(extra: ["received": "x"])
        try makeStore().load()

        let saved = try readSaved()
        assertSameJSON(saved["received"], [String: Any](), "the mended received is on disk before any edit")
        XCTAssertEqual(saved["mailday"] as? Int, 1, "the mended ledger is saved with mailday 1")
    }

    /// A relaunch after a mend reads the saved, mended ledger. It drops nothing and
    /// makes no second copy, even when the clock has moved on.
    func testRelaunchAfterMendMakesNoSecondCopy() throws {
        try writeSeed(extra: ["received": "x"])
        try makeStore().load()

        clock += 60_000
        let relaunch = makeStore()
        XCTAssertNoThrow(try relaunch.load(), "the relaunch loads")
        XCTAssertEqual(relaunch.droppedCount, 0, "the relaunch drops nothing, the mend was saved")
        XCTAssertEqual(try keptCopies().count, 1, "a relaunch after a mend makes no second copy")
    }

    /// Two damaged loads at the same instant both succeed. Each keeps its own copy with
    /// the original bytes, so a kept name never collides with an earlier one.
    func testTwoDamagedLoadsInOneSecondBothSucceed() throws {
        try writeSeed(extra: ["received": "x"])
        let first = try Data(contentsOf: fileURL)
        XCTAssertNoThrow(try makeStore().load(), "the first damaged load succeeds")

        try writeSeed(extra: ["stamps": "y"])
        let second = try Data(contentsOf: fileURL)
        XCTAssertNoThrow(try makeStore().load(), "a second damaged load in the same instant succeeds")

        let copies = try keptCopies()
        XCTAssertEqual(copies.count, 2, "each damaged load keeps its own copy")
        let bytes = Set(try copies.map { try Data(contentsOf: $0) })
        XCTAssertEqual(bytes, [first, second], "the two copies hold the two originals")
    }

    /// A good edit after a mend. The edit saves, and the kept copy still holds the
    /// original bytes.
    func testEditAfterMendSavesAndKeepsTheOriginalCopy() throws {
        try writeSeed(extra: ["received": "x"])
        let original = try Data(contentsOf: fileURL)
        let store = makeStore()
        try store.load()
        store.setReceived(Self.itemKey, count: 1)
        XCTAssertNoThrow(try store.save(), "an edit after a mend saves")

        let received = try XCTUnwrap(try readSaved()["received"] as? [String: Any])
        XCTAssertEqual(received[Self.itemKey] as? Int, 1, "the edit landed after the mend")
        let copies = try keptCopies()
        XCTAssertEqual(copies.count, 1, "the kept copy is still there after the save")
        if let copy = copies.first {
            XCTAssertEqual(try Data(contentsOf: copy), original, "the kept copy still holds the original bytes")
        }
    }

    // MARK: fallbacks: refuse and change nothing

    /// When the copy cannot be written, load() throws and the ledger is not mended. A
    /// save after it throws, and the file stays as it was. The folder is made read-only
    /// so the copy cannot be created. Skipped where the folder stays writable, such as
    /// when the tests run as root.
    func testUnwritableCopyRefusesAndChangesNothing() throws {
        try writeSeed(extra: ["received": "x"])
        let before = try Data(contentsOf: fileURL)
        try FileManager.default.setAttributes([.posixPermissions: 0o555], ofItemAtPath: dir.path)
        try XCTSkipIf(FileManager.default.isWritableFile(atPath: dir.path),
                      "the folder stays writable here, so the copy cannot be refused")
        let store = makeStore()

        XCTAssertThrowsError(try store.load(), "a damaged ledger whose copy cannot be written refuses")
        XCTAssertThrowsError(try store.save(), "a save after the refusal throws")
        XCTAssertEqual(try Data(contentsOf: fileURL), before, "the file is unchanged when the copy fails")
        XCTAssertEqual(try keptCopies().count, 0, "no kept copy exists when the copy fails")
    }

    /// Text that is valid JSON but not an object is refused before any copy is made.
    /// The file stays as it was, and no kept copy exists.
    func testNonObjectTopLevelRefusesWithNoCopy() throws {
        for raw in ["null", "42", "\"text\""] {
            try Data(raw.utf8).write(to: fileURL)
            let before = try Data(contentsOf: fileURL)
            let store = makeStore()

            XCTAssertThrowsError(try store.load(), "a top level \(raw) makes load throw")
            XCTAssertThrowsError(try store.save(), "a save after a refused \(raw) load throws")
            XCTAssertEqual(try Data(contentsOf: fileURL), before, "a refused \(raw) leaves the file unchanged")
            XCTAssertEqual(try keptCopies().count, 0, "a refused \(raw) makes no kept copy")
        }
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
