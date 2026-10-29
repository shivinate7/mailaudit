// Past-transit model tests (duo-transit-model, native-build-lanes, rules-run-in-javascriptcore).
//
// The rule does the arithmetic: pastTransit in src/view-rules.mjs, pinned by the V30 to V34 block in
// test/view-rules.test.mjs. These tests pin the glue: what the model passes the rule (the ledger,
// the received map, the stamped set, the clock), and what it does with stamps.
// Stamps go through the ledger store (one-stamp-per-package, stamp-removal-writes-a-tombstone).
//
// The types live in native/ManifestKit/Sources/ManifestKit/PastTransitModel.swift. The API the tests name:
//
//   public struct PastTransitRow: Equatable, Sendable {
//       public let gk: String        // "orderId::seller", the package key
//       public let tier: String      // "maybe" at 14 to 29 days, "deadline" at 30 or more
//       public let days: Int
//       public let claimBy: String   // order date plus 30 days, "YYYY-MM-DD", UTC
//       public let stamp: String?    // the live stamp kind on the row, nil when none
//   }
//   @MainActor @Observable public final class PastTransitModel {
//       public init(engine: RulesEngine, store: LedgerStore)   // the clock is store.now
//       public private(set) var rows: [PastTransitRow]         // pastTransit, oldest last
//       public func load() async throws                        // the reload: re-reads, ends the sticky rows
//       public func stamp(_ gk: String, kind: String) async throws   // setStamp, saved
//       public func undo(_ gk: String) async throws                  // removeStamp: a tombstone, saved
//   }
//
// Rulings the tests carry:
//   - A stamp hides a row (stamped-package-hides-lost-flag). Only a live stamp counts: kind "" is a
//     tombstone, and the row is listed (stamp-removal-writes-a-tombstone).
//   - Sticky: a row stamped since the last load keeps its place until load(). The model passes the rule
//     the stamped set minus the sticky rows (the Tally sticky pattern, Tally.swift).
//   - The list is not a count: a refunded row keeps its place. The count rules elsewhere still drop it
//     (a-refund-leaves-every-count).
//   - Undo acts on one row's own stamp. No record pins the scope of Undo, so this is the default.
//   - A canceled line never decides a package: the rule drops canceled lines before it groups.
//   - Undo with no live stamp writes nothing. A tombstone is not a live stamp.
//   - A same-kind re-stamp keeps its date. An empty or missing date becomes today, as the web's setStamp does.
//   - A failed save throws, and the rows and the ledger stay as they were.
//
// Fake fixtures only. Each ledger file is a fresh temp folder from PhotoTestKit.tempDir.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PastTransitModelTests: XCTestCase {
    /// 2026-07-31T12:00:00Z in milliseconds, the clock every fixture reads.
    static let start = 1_785_499_200_000.0

    /// The store's clock. A test moves it on by hand.
    final class Clock {
        var ms: Double
        init(_ ms: Double) { self.ms = ms }
    }

    /// The rows the fixture lists, oldest last. P5 to P8 are absent: 13 days, tracked, received, claim-stamped.
    static let listed = [
        "P1::Alpha Cards", "P2::Beta Games", "P3::Gamma Cards", "P9::Iota Cards", "P4::Delta Cards",
    ]

    // MARK: helpers

    /// One ledger item. The key is the item key the received map uses: order, line, product.
    static func item(
        _ order: String, _ seller: String, date: String, tracking: String = "without tracking", line: Int = 1
    ) -> [String: Any] {
        ["key": "\(order)|\(line)|p\(line)", "orderId": order, "seller": seller, "name": "Card \(order)", "set": "Test Set",
         "condition": "Near Mint", "finish": "", "qty": 1, "price": 1.0, "date": date, "tracking": tracking, "line": "Magic"]
    }

    /// P1 to P4 and P9 are listed. P5 is 13 days old. P6 is tracked. P7 is fully received. P8 holds a live
    /// claim stamp. P9 holds a tombstone, which is not a stamp.
    static func fixtureItems() -> [[String: Any]] {
        [item("P1", "Alpha Cards", date: "2026-07-17"),
         item("P2", "Beta Games", date: "2026-07-02"),
         item("P3", "Gamma Cards", date: "2026-07-01"),
         item("P4", "Delta Cards", date: "2026-06-20"),
         item("P5", "Epsilon Cards", date: "2026-07-18"),
         item("P6", "Zeta Cards", date: "2026-06-10", tracking: "with tracking"),
         item("P7", "Eta Cards", date: "2026-06-15"),
         item("P8", "Theta Cards", date: "2026-06-12"),
         item("P9", "Iota Cards", date: "2026-06-28")]
    }

    /// A model on a ledger file in a fresh temp folder. The received map and stamps are written before the
    /// load. `extra` options add packages, received counts and stamps to the fixture.
    func makeModel(
        clock: Clock, extraItems: [[String: Any]] = [], extraReceived: [String: Any] = [:], extraStamps: [String: Any] = [:],
        bundle: URL = RulesGoldenTests.bundleURL
    ) async throws -> (model: PastTransitModel, store: LedgerStore, file: URL) {
        let dir = try PhotoTestKit.tempDir("past-transit")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let file = dir.appending(path: "ledger.json")
        var received: [String: Any] = ["P7|1|p1": 1]
        received.merge(extraReceived) { _, new in new }
        var stamps: [String: Any] = [
            "P8::Theta Cards": ["kind": "claim", "note": "", "at": "2026-07-20", "updatedAt": Self.start - 1000],
            "P9::Iota Cards": ["kind": "", "note": "", "at": "", "updatedAt": Self.start - 1000],
        ]
        stamps.merge(extraStamps) { _, new in new }
        let doc: [String: Any] = ["mailday": 1, "items": Self.fixtureItems() + extraItems, "received": received, "stamps": stamps]
        try JSONSerialization.data(withJSONObject: doc).write(to: file)
        let store = LedgerStore(fileURL: file, now: { clock.ms })
        try store.load()
        let engine = try RulesEngine(bundleURL: bundle)
        let model = PastTransitModel(engine: engine, store: store)
        try await model.load()
        return (model, store, file)
    }

    /// The stamp entry for `gk`, read from the file on disk.
    func savedStamp(_ file: URL, _ gk: String) throws -> [String: Any]? {
        let doc = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: file)) as? [String: Any])
        return (doc["stamps"] as? [String: Any])?[gk] as? [String: Any]
    }

    /// The device's local calendar day for `ms`, as YYYY-MM-DD: the day the web's todayLocal gives.
    static func localDay(_ ms: Double) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date(timeIntervalSince1970: ms / 1000))
    }

    /// The operation must throw, because its save fails.
    func expectSaveFailure(_ label: String, _ op: () async throws -> Void) async {
        do {
            try await op()
            XCTFail("\(label) must throw when the save fails")
        } catch {}
    }

    // MARK: tests

    /// The list and its fields: oldest last, the tier and days, the claim date. Stamped, received, tracked
    /// and 13-day packages are absent.
    func testOldestLast() async throws {
        let (model, _, _) = try await makeModel(clock: Clock(Self.start))
        XCTAssertEqual(model.rows.map(\.gk), Self.listed, "oldest last; P5 to P8 absent")
        XCTAssertEqual(model.rows.map { "\($0.tier) \($0.days)" },
                       ["maybe 14", "maybe 29", "deadline 30", "deadline 33", "deadline 41"])
        XCTAssertEqual(model.rows.map(\.claimBy), ["2026-08-16", "2026-08-01", "2026-07-31", "2026-07-28", "2026-07-20"])
        XCTAssertEqual(model.rows.map(\.stamp), [nil, nil, nil, nil, nil], "a tombstone is not a stamp")
    }

    /// A refunded row stays in its place after the stamp. The row shows the stamp.
    func testRefundedRowKeepsPlace() async throws {
        let (model, _, _) = try await makeModel(clock: Clock(Self.start))
        try await model.stamp("P2::Beta Games", kind: "refunded")
        XCTAssertEqual(model.rows.map(\.gk), Self.listed, "the refunded row holds its place")
        XCTAssertEqual(model.rows.first { $0.gk == "P2::Beta Games" }?.stamp, "refunded")
    }

    /// Undo writes a tombstone: the key stays, kind is "", and updatedAt is the later clock value. After a
    /// reload the row is back in the list with no stamp.
    func testUndoWritesTombstone() async throws {
        let clock = Clock(Self.start)
        let (model, _, file) = try await makeModel(clock: clock)
        try await model.stamp("P2::Beta Games", kind: "refunded")
        XCTAssertEqual(try savedStamp(file, "P2::Beta Games")?["kind"] as? String, "refunded", "the stamp is saved")

        clock.ms += 1000
        try await model.undo("P2::Beta Games")
        let tomb = try XCTUnwrap(try savedStamp(file, "P2::Beta Games"), "undo keeps the key as a tombstone")
        XCTAssertEqual(tomb["kind"] as? String, "", "kind is empty")
        XCTAssertEqual(tomb["updatedAt"] as? Double, Self.start + 1000, "updatedAt is the undo's clock")

        try await model.load()
        XCTAssertEqual(model.rows.map(\.gk), Self.listed, "after reload the row is back")
        XCTAssertNil(model.rows.first { $0.gk == "P2::Beta Games" }?.stamp)
    }

    /// A claim stamp keeps its row until load(). The reload ends the sticky row, and the stamp then hides it.
    func testStickyEndsOnReload() async throws {
        let (model, _, _) = try await makeModel(clock: Clock(Self.start))
        try await model.stamp("P3::Gamma Cards", kind: "claim")
        XCTAssertEqual(model.rows.map(\.gk), Self.listed, "the stamped row keeps its place until reload")

        try await model.load()
        XCTAssertEqual(model.rows.map(\.gk), Self.listed.filter { $0 != "P3::Gamma Cards" },
                       "the reload ends the sticky row, and its claim stamp hides it")
    }

    /// A canceled line first, then an owed untracked line on the same order. The order is listed, because the
    /// rule drops the canceled line before it groups, so the canceled line does not set the order's tracking.
    func testCanceledLineFirstStillListed() async throws {
        let extra = [
            Self.item("X1", "Mixed Cards", date: "2026-06-05", tracking: "Canceled", line: 1),
            Self.item("X1", "Mixed Cards", date: "2026-06-05", line: 2),
        ]
        let (model, _, _) = try await makeModel(clock: Clock(Self.start), extraItems: extra)
        XCTAssertEqual(model.rows.map(\.gk), Self.listed + ["X1::Mixed Cards"], "the owed line lists the order")
        XCTAssertEqual(model.rows.last?.tier, "deadline")
        XCTAssertEqual(model.rows.last?.days, 56)
        XCTAssertEqual(model.rows.last?.claimBy, "2026-07-05")
    }

    /// A received untracked line, then an unreceived canceled line. Nothing is owed, so the order is not listed:
    /// a canceled line never counts as owed.
    func testReceivedLineThenCanceledNotListed() async throws {
        let extra = [
            Self.item("X2", "Quiet Cards", date: "2026-06-06", line: 1),
            Self.item("X2", "Quiet Cards", date: "2026-06-06", tracking: "Canceled", line: 2),
        ]
        let (model, _, _) = try await makeModel(
            clock: Clock(Self.start), extraItems: extra, extraReceived: ["X2|1|p1": 1])
        XCTAssertEqual(model.rows.map(\.gk), Self.listed, "a received line and a canceled line leave nothing owed")
    }

    /// Undo on a package with no live stamp writes nothing: one never stamped, and one already a tombstone.
    func testUndoWithoutLiveStampWritesNothing() async throws {
        let (model, store, file) = try await makeModel(clock: Clock(Self.start))
        let fileBefore = try Data(contentsOf: file)
        let rowsBefore = model.rows
        let keysBefore = store.stamps().keys.sorted()

        try await model.undo("P1::Alpha Cards")
        try await model.undo("P9::Iota Cards")

        XCTAssertEqual(try Data(contentsOf: file), fileBefore, "no save: the ledger file is untouched")
        XCTAssertEqual(model.rows, rowsBefore)
        XCTAssertEqual(store.stamps().keys.sorted(), keysBefore, "no tombstone is added")
    }

    /// A same-kind re-stamp two days later keeps the first date. The clock moves, so a re-date would show.
    func testRestampSameKindKeepsDate() async throws {
        let clock = Clock(Self.start)
        let (model, _, file) = try await makeModel(clock: clock)
        let day = Self.localDay(Self.start)
        try await model.stamp("P3::Gamma Cards", kind: "claim")
        XCTAssertEqual(try savedStamp(file, "P3::Gamma Cards")?["at"] as? String, day, "the first stamp is dated today")

        clock.ms += 2 * 86_400_000
        try await model.stamp("P3::Gamma Cards", kind: "claim")
        XCTAssertEqual(try savedStamp(file, "P3::Gamma Cards")?["at"] as? String, day, "the same kind keeps its date")
    }

    /// A same-kind re-stamp whose stored date is empty, or missing, takes today, as the web's setStamp does.
    func testRestampSameKindEmptyOrMissingDateUsesToday() async throws {
        let stamps: [String: Any] = [
            "P1::Alpha Cards": ["kind": "claim", "note": "", "at": "", "updatedAt": Self.start - 1000],
            "P2::Beta Games": ["kind": "claim", "note": "", "updatedAt": Self.start - 1000],
        ]
        let (model, _, file) = try await makeModel(clock: Clock(Self.start), extraStamps: stamps)
        let day = Self.localDay(Self.start)
        try await model.stamp("P1::Alpha Cards", kind: "claim")
        try await model.stamp("P2::Beta Games", kind: "claim")
        XCTAssertEqual(try savedStamp(file, "P1::Alpha Cards")?["at"] as? String, day, "an empty date becomes today")
        XCTAssertEqual(try savedStamp(file, "P2::Beta Games")?["at"] as? String, day, "a missing date becomes today")
    }

    /// A failed save throws, for a stamp and for an undo. The rows and the ledger file stay as they were.
    func testFailedSaveLeavesRowsAndLedgerUnchanged() async throws {
        let (model, _, file) = try await makeModel(clock: Clock(Self.start))
        try await model.stamp("P2::Beta Games", kind: "refunded")
        let rowsBefore = model.rows
        let fileBefore = try Data(contentsOf: file)

        let dir = file.deletingLastPathComponent()
        try FileManager.default.setAttributes([.posixPermissions: 0o555], ofItemAtPath: dir.path)
        defer { try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path) }

        await expectSaveFailure("stamp") { try await model.stamp("P3::Gamma Cards", kind: "claim") }
        XCTAssertEqual(model.rows, rowsBefore, "a failed stamp leaves the rows")
        XCTAssertEqual(try Data(contentsOf: file), fileBefore, "a failed stamp leaves the ledger")

        await expectSaveFailure("undo") { try await model.undo("P2::Beta Games") }
        XCTAssertEqual(model.rows, rowsBefore, "a failed undo leaves the rows")
        XCTAssertEqual(try Data(contentsOf: file), fileBefore, "a failed undo leaves the ledger")
    }

    /// The stamp record is the bundle's nextStamp (one-stamp-per-package, rules-run-in-javascriptcore): the model hands it
    /// the stored stamp, a patch with the kind, the device's local day and the store's clock, and saves what it returns.
    /// The shim returns a record built from its arguments, so a model that re-dates the stamp in Swift saves another
    /// one. Packages stamps through the same writer (src/view-rules.mjs holds the rule once), so this is its proof too.
    func testStampSavesWhatTheBundlesNextStampReturns() async throws {
        let shim = try probeBundleFile("""
            Rules = Object.assign({}, Rules, { nextStamp: function (cur, patch, today, now) {
              return { kind: patch.kind, at: "1999-12-31", updatedAt: now,
                       note: JSON.stringify({ cur: cur, patch: patch, today: today, now: now }) };
            } });
            """, for: self)
        // positive control: the override is live, and answers what the contract says it is asked
        let probe = try RulesEngine(bundleURL: shim)
        let controlText = try await probe.call("nextStamp", #"[null,{"kind":"claim"},"2026-07-04",7]"#)
        let control = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(controlText.utf8)) as? [String: Any])
        XCTAssertEqual(control["at"] as? String, "1999-12-31", "the shim's override must be live, or this test proves nothing")

        let held = ["kind": "claim", "note": "called twice", "at": "2026-07-20", "updatedAt": Self.start - 1000] as [String: Any]
        let clock = Clock(Self.start)
        let (model, _, file) = try await makeModel(clock: clock, extraStamps: ["P8::Theta Cards": held], bundle: shim)
        try await model.stamp("P2::Beta Games", kind: "claim")
        try await model.stamp("P8::Theta Cards", kind: "refunded")

        /// What the shim saw for `gk`: the saved record's note holds its arguments as JSON.
        func seen(_ gk: String) throws -> (saved: [String: Any], args: [String: Any]) {
            let saved = try XCTUnwrap(try savedStamp(file, gk), "no stamp saved for \(gk)")
            // A note that is not the shim's JSON leaves args empty, so the checks below name what is missing.
            let args = (try? JSONSerialization.jsonObject(with: Data((saved["note"] as? String ?? "").utf8))) as? [String: Any]
            return (saved, args ?? [:])
        }
        let day = Self.localDay(Self.start)
        for gk in ["P2::Beta Games", "P8::Theta Cards"] {
            let (saved, args) = try seen(gk)
            XCTAssertEqual(saved["at"] as? String, "1999-12-31", "\(gk): the date is the bundle's, not worked out in Swift")
            XCTAssertEqual(args["today"] as? String, day, "\(gk): the rule is given the device's local day")
            XCTAssertEqual(args["now"] as? Double, Self.start, "\(gk): the rule is given the store's clock")
        }
        let first = try seen("P2::Beta Games").args, second = try seen("P8::Theta Cards").args
        XCTAssertTrue(first["cur"] is NSNull, "no stored stamp reaches the rule as null, got \(String(describing: first["cur"]))")
        XCTAssertEqual((first["patch"] as? [String: Any])?["kind"] as? String, "claim", "the patch carries the kind")
        XCTAssertEqual((second["cur"] as? [String: Any])?["at"] as? String, "2026-07-20", "the stored stamp reaches the rule whole")
        XCTAssertEqual((second["patch"] as? [String: Any])?["kind"] as? String, "refunded", "the patch carries the kind")
        XCTAssertEqual((second["patch"] as? [String: Any])?["note"] as? String, "called twice",
                       "a re-stamp from this page keeps the stored note: the page has no note field")
    }
}
