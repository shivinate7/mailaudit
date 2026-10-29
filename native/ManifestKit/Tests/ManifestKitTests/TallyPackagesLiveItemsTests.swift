// Native Tally and Packages count only live items (lane N12b, debt native-tally-counts-every-item,
// canceled-orders-leave-the-list, a-refund-leaves-every-count, rules-run-in-javascriptcore).
//
// What the web does, per view (src/app.jsx, src/view-rules.mjs):
//   activeItems = dropCanceled(items)                     app.jsx:5090, view-rules.mjs:244 (CANCELED :213)
//   refundedGks = stamps of kind "refunded" or "partial"  app.jsx:5095, isRefundStamp :196
//   rangedItems = dropGks(inRange(activeItems), refunded) app.jsx:5107-5110
//   Tally       = tallyGroups(rangedItems)                app.jsx:5293
//   Packages    = groupPackages(rangedItems), stamped filter off   app.jsx:5198
// A refunded or partial package comes back into the Packages list only under the "N stamped" filter
// (app.jsx:5206-5217, stamped-filter-on-the-pipeline). A canceled order never comes back. Native has no date
// range and no stamped filter, so the web view it must equal is liveItems: canceled dropped, then the
// packages stamped refunded or partial dropped, by package (order and seller), not by order id.
// A package's own "N left" figures read its own lines, so the list-level counts are the masthead's, which
// already reads LiveItems.of (MastheadLiveItemsTests).
//
// On main, TallyModel.load and PackagesModel.load pass store.items() straight in, so every case below that
// adds an excluded package is red, except the control. Each exclusion has its own case, so a fix for one
// cannot turn another green. The control case stamps one package with another kind and one with a removed
// stamp (kind ""); both stay. It passes on main on purpose; it fails a fix that drops every stamped package.
//
// The fixture differs from the masthead's on purpose, for three reasons:
//   - Every excluded line shares the product name "Shared" with live lines on another order and seller. The
//     red then lands on the pooled qty, basis, outstanding value, seller and order counts and the copies,
//     not only on a row that exists or not. A fix that filters rows after pooling stays red.
//   - Every excluded package is left partly or fully outstanding. The debt's symptom is money that came back
//     still shown as owed, and a fully received package would hide from a later hide-received filter anyway.
//   - R1 is two packages, one per seller. Only R1 / Seller R is stamped refunded, so a fix that drops by order
//     id and not by package also drops the live R1 / Seller S line, and the Tally and Packages figures show it.
//
// Rows are compared against a ledger holding the base items alone (same received map, same guard stamps), and
// the base rows are pinned to literal figures first, so the comparison cannot pass on empty output.
// The group key of a package is read from the bundle's groupPackages, not rebuilt here.
//
// Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

/// A stamp on one package: the order id, the seller and the kind. Kind "" is the tombstone a removed stamp leaves.
typealias LiveStamp = (order: String, seller: String, kind: String)

@MainActor
enum LiveFixture {
    static func line(_ key: String, order: String, seller: String, name: String, qty: Int, price: Double,
                     tracking: String = "with tracking") -> [String: Any] {
        ["key": key, "orderId": order, "seller": seller, "name": name, "set": "Test Set",
         "condition": "Near Mint", "finish": "", "qty": qty, "price": price, "date": "2026-07-01",
         "tracking": tracking, "line": "Magic"]
    }

    /// Always live. E1 carries an "other" stamp and F1 a removed one, so both stay. R1 / Seller S shares an
    /// order id with the refunded package below and must stay when only R1 / Seller R is stamped.
    static var base: [[String: Any]] {
        [line("a1", order: "A1", seller: "Seller A", name: "Alpha", qty: 1, price: 10),
         line("a2", order: "A1", seller: "Seller A", name: "Shared", qty: 2, price: 5),
         line("e1", order: "E1", seller: "Seller E", name: "Shared", qty: 1, price: 8),
         line("f1", order: "F1", seller: "Seller F", name: "Beta", qty: 1, price: 2),
         line("s1", order: "R1", seller: "Seller S", name: "Shared", qty: 1, price: 3)]
    }
    /// 4 cards, $307, 1 in, so 3 are owed. The web calls an order canceled when its tracking starts with "cancel".
    static var canceled: [[String: Any]] {
        [line("x1", order: "X1", seller: "Seller X", name: "Shared", qty: 3, price: 100, tracking: "canceled"),
         line("x2", order: "X1", seller: "Seller X", name: "OnlyCanceled", qty: 1, price: 7, tracking: "canceled")]
    }
    /// 3 cards, $109, 1 in. Stamped refunded.
    static var refunded: [[String: Any]] {
        [line("r1", order: "R1", seller: "Seller R", name: "Shared", qty: 2, price: 50),
         line("r2", order: "R1", seller: "Seller R", name: "OnlyRefunded", qty: 1, price: 9)]
    }
    /// 2 cards, $46, none in. Stamped partial.
    static var partial: [[String: Any]] {
        [line("p1", order: "P1", seller: "Seller P", name: "Shared", qty: 1, price: 40),
         line("p2", order: "P1", seller: "Seller P", name: "OnlyPartial", qty: 1, price: 6)]
    }

    static let received: [String: Int] = ["a1": 1, "f1": 1, "x1": 1, "r1": 1]
    static let baseStamps: [LiveStamp] = [("E1", "Seller E", "other"), ("F1", "Seller F", "")]
    static let refundStamp: LiveStamp = ("R1", "Seller R", "refunded")
    static let partialStamp: LiveStamp = ("P1", "Seller P", "partial")

    static func engine() throws -> RulesEngine { try RulesEngine(bundleURL: RulesGoldenTests.bundleURL) }

    /// A loaded store over a ledger file with the items, the shared received map and the stamps.
    static func store(items: [[String: Any]], stamps: [LiveStamp], engine e: RulesEngine) async throws -> LedgerStore {
        let itemsJSON = String(decoding: try JSONSerialization.data(withJSONObject: items), as: UTF8.self)
        let grouped = try await e.call("groupPackages", "[\(itemsJSON)]")
        let packages = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(grouped.utf8)) as? [[String: Any]])
        var stamped: [String: Any] = [:]
        for s in stamps {
            let package = packages.first { ($0["orderId"] as? String) == s.order && ($0["seller"] as? String) == s.seller }
            let gk = try XCTUnwrap(package?["gk"] as? String, "no package for \(s.order) / \(s.seller)")
            stamped[gk] = ["kind": s.kind, "note": "", "at": "2026-07-02", "updatedAt": 1_786_543_380_000] as [String: Any]
        }
        let url = try PhotoTestKit.tempDir("n12b-live").appending(path: "ledger.json")
        let doc: [String: Any] = ["mailday": 1, "items": items, "received": received, "stamps": stamped]
        try JSONSerialization.data(withJSONObject: doc).write(to: url)
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        try store.load()
        return store
    }
}

@MainActor
final class TallyLiveItemsTests: XCTestCase {
    /// The base ledger's Tally, worked by hand. Shared pools a2, e1 and s1: 4 copies, $10 + $8 + $3, none in.
    static let baseFigures = [
        "Alpha | qty 1 got 1 | basis 10.0 | 1 seller \(dot) 1 order \(dot) Test Set | a1 | 0 left \(dot) $0.00",
        "Beta | qty 1 got 1 | basis 2.0 | 1 seller \(dot) 1 order \(dot) Test Set | f1 | 0 left \(dot) $0.00",
        "Shared | qty 4 got 0 | basis 21.0 | 3 sellers \(dot) 3 orders \(dot) Test Set | a2,e1,s1 | 4 left \(dot) $21.00",
    ]
    static let dot = "\u{00B7}"

    func rows(_ items: [[String: Any]], _ stamps: [LiveStamp]) async throws -> [TallyRow] {
        let e = try LiveFixture.engine()
        let model = TallyModel(engine: e, store: try await LiveFixture.store(items: items, stamps: stamps, engine: e))
        try await model.load()
        return model.rows
    }

    func figures(_ rows: [TallyRow]) -> [String] {
        rows.map { r in
            "\(r.name) | qty \(r.qty) got \(r.got) | basis \(r.basis) | \(r.meta) | "
                + "\(r.copies.map(\.key).joined(separator: ",")) | \(r.leftLine)"
        }.sorted()
    }

    /// The Tally over `items` equals the Tally over the base items alone.
    func assertLikeBase(_ items: [[String: Any]], _ stamps: [LiveStamp], line: UInt = #line) async throws {
        let base = try await rows(LiveFixture.base, LiveFixture.baseStamps)
        XCTAssertEqual(figures(base), Self.baseFigures, "the base fixture", line: line)
        let got = try await rows(items, stamps)
        XCTAssertEqual(figures(got), figures(base), line: line)
        XCTAssertTrue(got == base, "the rows differ beyond the figures above", line: line)
    }

    /// Control. The stamps on E1 and F1 do not take a package out: kind "other" and a removed stamp both stay.
    /// Passes on main, and must pass after the fix.
    func testAStampOfAnotherKindAndARemovedStampStayPooled() async throws {
        try await assertLikeBase(LiveFixture.base, LiveFixture.baseStamps)
    }

    /// A canceled order is left out of every pooled figure, and its OnlyCanceled row is gone
    /// (canceled-orders-leave-the-list).
    func testACanceledOrderLeavesTheTally() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.canceled, LiveFixture.baseStamps)
    }

    /// A package stamped refunded is left out of every pooled figure, though its Shared copy is only half in.
    /// The live R1 / Seller S line stays (a-refund-leaves-every-count).
    func testARefundedPackageLeavesTheTally() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.refunded, LiveFixture.baseStamps + [LiveFixture.refundStamp])
    }

    /// A package stamped partial refund leaves the same way.
    func testAPartialRefundPackageLeavesTheTally() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.partial, LiveFixture.baseStamps + [LiveFixture.partialStamp])
    }

    /// All three at once, with the guard stamps in place: the Tally is the base Tally.
    func testCanceledRefundedAndPartialTogetherLeaveTheTally() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.canceled + LiveFixture.refunded + LiveFixture.partial,
                                 LiveFixture.baseStamps + [LiveFixture.refundStamp, LiveFixture.partialStamp])
    }
}

@MainActor
final class PackagesLiveItemsTests: XCTestCase {
    /// The base ledger's list, worked by hand. R1 / Seller S is its own package, apart from the refunded R1 / Seller R.
    static let basePackages = [
        "A1 | Seller A | a1,a2",
        "E1 | Seller E | e1",
        "F1 | Seller F | f1",
        "R1 | Seller S | s1",
    ]

    func model(_ items: [[String: Any]], _ stamps: [LiveStamp]) async throws -> PackagesModel {
        let e = try LiveFixture.engine()
        let m = PackagesModel(engine: e, store: try await LiveFixture.store(items: items, stamps: stamps, engine: e))
        try await m.load()
        return m
    }

    func figures(_ m: PackagesModel) -> [String] {
        m.rows.map { "\($0.orderId) | \($0.seller) | \($0.items.map(\.key).sorted().joined(separator: ","))" }.sorted()
    }

    /// The Packages list over `items` equals the list over the base items alone: the same packages, the same
    /// "N of M" labels and the same done flags, with no entry for a line that left.
    func assertLikeBase(_ items: [[String: Any]], _ stamps: [LiveStamp], line: UInt = #line) async throws {
        let base = try await model(LiveFixture.base, LiveFixture.baseStamps)
        XCTAssertEqual(figures(base), Self.basePackages, "the base fixture", line: line)
        XCTAssertEqual(base.labels.keys.sorted(), ["a1", "a2", "e1", "f1", "s1"], "the base fixture", line: line)
        let got = try await model(items, stamps)
        XCTAssertEqual(figures(got), figures(base), line: line)
        XCTAssertTrue(got.rows == base.rows, "the rows differ beyond the figures above", line: line)
        XCTAssertEqual(got.labels, base.labels, line: line)
        XCTAssertEqual(got.done, base.done, line: line)
    }

    /// Control. The stamps on E1 and F1 do not take a package out: kind "other" and a removed stamp both stay.
    /// Passes on main, and must pass after the fix.
    func testAStampOfAnotherKindAndARemovedStampStayListed() async throws {
        try await assertLikeBase(LiveFixture.base, LiveFixture.baseStamps)
    }

    /// A canceled order leaves the list and its lines leave the labels (canceled-orders-leave-the-list).
    func testACanceledOrderLeavesTheList() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.canceled, LiveFixture.baseStamps)
    }

    /// A package stamped refunded leaves the list while the stamped filter is off, and the live R1 / Seller S
    /// package stays (a-refund-leaves-every-count). Native has no stamped filter to bring it back.
    func testARefundedPackageLeavesTheList() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.refunded, LiveFixture.baseStamps + [LiveFixture.refundStamp])
    }

    /// A package stamped partial refund leaves the same way.
    func testAPartialRefundPackageLeavesTheList() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.partial, LiveFixture.baseStamps + [LiveFixture.partialStamp])
    }

    /// All three at once, with the guard stamps in place: the list is the base list.
    func testCanceledRefundedAndPartialTogetherLeaveTheList() async throws {
        try await assertLikeBase(LiveFixture.base + LiveFixture.canceled + LiveFixture.refunded + LiveFixture.partial,
                                 LiveFixture.baseStamps + [LiveFixture.refundStamp, LiveFixture.partialStamp])
    }
}
