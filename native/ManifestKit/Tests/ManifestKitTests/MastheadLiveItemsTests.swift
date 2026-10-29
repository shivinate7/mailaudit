// Masthead counts only live items (lane N12, canceled-orders-leave-the-list, a-refund-leaves-every-count,
// rules-run-in-javascriptcore).
//
// Owner's device, real ledger: the masthead read 616 packages, 1521 cards, $75.13k. The web reads 593,
// 1475, $68.16k on the same ledger. The 23 packages between them are 14 canceled orders (15 lines)
// and 9 packages stamped refunded or partial. The web chain (src/app.jsx, activeItems then liveItems)
// is dropCanceled, then dropGks over the refunded and partial stamps, and the masthead's totals, package
// count and done count all read the result. MastheadModel.refresh passes store.items() straight into
// totalsOf, groupPackages and packagesDone, so both exclusions are missing.
//
// Each exclusion has its own case, so a fix for one cannot turn another green. The guard case pins the
// other side: a package with a stamp of another kind, or with a removed stamp (kind ""), stays counted.
// It passes on main on purpose; it fails a fix that drops every stamped package.
//
// The group key of a package is read from the bundle's groupPackages, not rebuilt here.
// Packages and Tally take the same live items; TallyPackagesLiveItemsTests pins them.
//
// Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class MastheadLiveItemsTests: XCTestCase {
    static let dot = "\u{00B7}"

    // MARK: fixture

    /// One line: a card name, a count and a price on an order.
    func line(_ key: String, order: String, seller: String, qty: Int, price: Double, tracking: String = "with tracking") -> [String: Any] {
        ["key": key, "orderId": order, "seller": seller, "name": "Card \(key)", "set": "Test Set",
         "condition": "Near Mint", "finish": "", "qty": qty, "price": price, "date": "2026-07-01",
         "tracking": tracking, "line": "Magic"]
    }

    /// Always live. A1 has two lines (3 cards, $20). E1 carries an "other" stamp and F1 a removed one, so
    /// both stay counted. f1 is received in full, which makes F1 the one finished package.
    var base: [[String: Any]] {
        [line("a1", order: "A1", seller: "Seller A", qty: 1, price: 10),
         line("a2", order: "A1", seller: "Seller A", qty: 2, price: 5),
         line("e1", order: "E1", seller: "Seller E", qty: 1, price: 8),
         line("f1", order: "F1", seller: "Seller F", qty: 1, price: 2)]
    }
    /// 3 cards, $300, 2 of them received, so one is still owed. The web calls an order canceled when its tracking starts with "cancel".
    var canceled: [[String: Any]] { [line("x1", order: "X1", seller: "Seller X", qty: 3, price: 100, tracking: "canceled")] }
    /// 2 cards, $100, all received, stamped refunded.
    var refunded: [[String: Any]] { [line("r1", order: "R1", seller: "Seller R", qty: 2, price: 50)] }
    /// 1 card, $40, received, stamped partial.
    var partial: [[String: Any]] { [line("p1", order: "P1", seller: "Seller P", qty: 1, price: 40)] }

    static let received: [String: Int] = ["a1": 1, "f1": 1, "x1": 2, "r1": 2, "p1": 1]
    /// Order id to stamp kind. "" is the tombstone a removed stamp leaves.
    static let baseStamps = ["E1": "other", "F1": ""]

    /// What the web masthead reads on `base` alone: 2 of 5 cards, 1 of 3 packages, $12 of $30.
    static let baseCells = [
        TallyCell(label: "cards", figure: "2/5"),
        TallyCell(label: "packages", figure: "1/3"),
        TallyCell(label: "value", figure: "$12/$30"),
    ]
    static let baseCount = "3 packages \(dot) autosaves"
    static let baseMissing = "3 still missing \(dot) $18.00"

    func engine() throws -> RulesEngine { try RulesEngine(bundleURL: RulesGoldenTests.bundleURL) }

    /// A ledger file with the items, the shared received map, and a stamp per order id. The stamp key is the
    /// package's `gk` from the bundle's groupPackages.
    func masthead(items: [[String: Any]], stamps: [String: String]) async throws -> MastheadModel {
        let e = try engine()
        let itemsJSON = String(decoding: try JSONSerialization.data(withJSONObject: items), as: UTF8.self)
        let grouped = try await e.call("groupPackages", "[\(itemsJSON)]")
        let packages = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(grouped.utf8)) as? [[String: Any]])
        var stamped: [String: Any] = [:]
        for (order, kind) in stamps {
            let gk = try XCTUnwrap(packages.first { ($0["orderId"] as? String) == order }?["gk"] as? String, "no package for \(order)")
            stamped[gk] = ["kind": kind, "note": "", "at": "2026-07-02", "updatedAt": 1_786_543_380_000] as [String: Any]
        }
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n12-masthead-live-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "ledger.json")
        let doc: [String: Any] = ["mailday": 1, "items": items, "received": Self.received, "stamps": stamped]
        try JSONSerialization.data(withJSONObject: doc).write(to: url)
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        try store.load()
        let model = MastheadModel(engine: e, store: store)
        try await model.refresh()
        return model
    }

    func assertBase(_ m: MastheadModel, line: UInt = #line) {
        XCTAssertEqual(m.cells, Self.baseCells, line: line)
        XCTAssertEqual(m.countLine, Self.baseCount, line: line)
        XCTAssertEqual(m.missingLine, Self.baseMissing, line: line)
    }

    // MARK: tests

    /// Control. The stamps on E1 and F1 do not take a package out: kind "other" and a removed stamp both stay.
    /// Passes on main, and must pass after the fix.
    func testAStampOfAnotherKindAndARemovedStampStayCounted() async throws {
        assertBase(try await masthead(items: base, stamps: Self.baseStamps))
    }

    /// A canceled order is left out of the cards, the packages, the value and the outstanding line, and the
    /// check-ins on it are left out of what is in (canceled-orders-leave-the-list).
    func testACanceledOrderLeavesEveryFigure() async throws {
        assertBase(try await masthead(items: base + canceled, stamps: Self.baseStamps))
    }

    /// A package stamped refunded is left out of every figure. It is fully received, so a fix that only
    /// hides it from the package count still shows its cards and its $100 (a-refund-leaves-every-count).
    func testARefundedPackageLeavesEveryFigure() async throws {
        assertBase(try await masthead(items: base + refunded, stamps: Self.baseStamps.merging(["R1": "refunded"]) { $1 }))
    }

    /// A package stamped partial refund leaves the same way.
    func testAPartialRefundPackageLeavesEveryFigure() async throws {
        assertBase(try await masthead(items: base + partial, stamps: Self.baseStamps.merging(["P1": "partial"]) { $1 }))
    }

    /// All three at once, with the guard stamps in place: the figures are the base figures.
    func testCanceledRefundedAndPartialTogether() async throws {
        let stamps = Self.baseStamps.merging(["R1": "refunded", "P1": "partial"]) { $1 }
        assertBase(try await masthead(items: base + canceled + refunded + partial, stamps: stamps))
    }

    /// Step 5. The Packages and Tally lines read the same live items the cells read: with the canceled, refunded
    /// and partial lines in the ledger, each tab still counts the base's 3 packages and 4 unique items. A line
    /// that counted the raw items would read 6 packages and 7 unique items. Compared with the bundle's own line.
    func testTheTabLinesCountLiveItemsOnly() async throws {
        let stamps = Self.baseStamps.merging(["R1": "refunded", "P1": "partial"]) { $1 }
        let m = try await masthead(items: base + canceled + refunded + partial, stamps: stamps)

        for tab in MastheadTab.allCases {
            let expected = await MastheadRuleLine.line(tab, packages: 3, items: 4, envelopes: 0)
            XCTAssertNotNil(expected, "the bundle has no countLine, so the \(tab) tab has nothing to match")
            XCTAssertEqual(m.countLine(for: tab), expected, "the \(tab) line counts a canceled or refunded line")
        }
    }
}
