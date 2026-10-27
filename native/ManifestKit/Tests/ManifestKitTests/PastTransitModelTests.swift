// Past-transit model tests (duo-transit-model, native-build-lanes, rules-run-in-javascriptcore).
//
// The rule does the arithmetic: pastTransit in src/view-rules.mjs, pinned by the V30 to V34 block in
// test/view-rules.test.mjs. These tests pin the glue: what the model passes the rule (the ledger,
// the received map, the stamped set, the clock), and what it does with stamps.
// Stamps go through the ledger store (one-stamp-per-package, stamp-removal-writes-a-tombstone).
//
// Red-first. PastTransitModel and PastTransitRow are not in the product yet, so this file does not
// compile until the builder adds them under native/ManifestKit/Sources/ManifestKit. The API the
// tests name:
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
//
// Fake fixtures only. Each ledger file lives in a run folder (RunFolderSupport.swift).

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

    /// One ledger item. The key is the item key the received map uses.
    static func item(_ order: String, _ seller: String, date: String, tracking: String = "without tracking") -> [String: Any] {
        ["key": "\(order)|1|p1", "orderId": order, "seller": seller, "name": "Card \(order)", "set": "Test Set",
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

    /// A model on a ledger file in a run folder. Its received map and stamps are written before the load.
    func makeModel(clock: Clock) async throws -> (model: PastTransitModel, store: LedgerStore, file: URL) {
        let dir = try RunFolder.fresh("past-transit")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let file = dir.appending(path: "ledger.json")
        let stamps: [String: Any] = [
            "P8::Theta Cards": ["kind": "claim", "note": "", "at": "2026-07-20", "updatedAt": Self.start - 1000],
            "P9::Iota Cards": ["kind": "", "note": "", "at": "", "updatedAt": Self.start - 1000],
        ]
        let doc: [String: Any] = ["mailday": 1, "items": Self.fixtureItems(), "received": ["P7|1|p1": 1], "stamps": stamps]
        try JSONSerialization.data(withJSONObject: doc).write(to: file)
        let store = LedgerStore(fileURL: file, now: { clock.ms })
        try store.load()
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let model = PastTransitModel(engine: engine, store: store)
        try await model.load()
        return (model, store, file)
    }

    /// The stamp entry for `gk`, read from the file on disk.
    func savedStamp(_ file: URL, _ gk: String) throws -> [String: Any]? {
        let doc = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: file)) as? [String: Any])
        return (doc["stamps"] as? [String: Any])?[gk] as? [String: Any]
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
}
