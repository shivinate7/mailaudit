// Lane N14, the masthead's money form (rules-run-in-javascriptcore, masthead-tallies-unequal-thirds).
//
// The web prints the outstanding line with `money()` from src/view-rules.mjs, which rounds half up
// on the decimal value ("one home for both clients", Lane N6). The native line formats with
// Swift's `.formatted(.currency)`, which rounds the binary value half to even. 0.125 prints
// "$0.12" there and "$0.13" on the web. The fix is for `MastheadModel.refresh` to call the
// bundle's `money`, as it already calls `compact`. The tests below use the existing API only, so
// each one fails on an XCTAssert and not on a compile error. The expected texts were taken from
// `money` and `compact` in src/view-rules.mjs.
//
// Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class MastheadMoneyTests: XCTestCase {
    static let dot = "\u{00B7}"

    private func opened(_ items: [[String: Any]]) throws -> (MastheadModel, LedgerStore) {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n14-money-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "ledger.json")
        try JSONSerialization.data(withJSONObject: ["mailday": 1, "items": items] as [String: Any]).write(to: url)
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        try store.load()
        return (MastheadModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: store), store)
    }

    private func item(_ key: String, order: String, price: Double, qty: Int = 1) -> [String: Any] {
        ["key": key, "orderId": order, "seller": "Seller \(order)", "name": "Card \(key)", "set": "Test Set",
         "condition": "Near Mint", "finish": "", "qty": qty, "price": price, "date": "2026-07-01",
         "tracking": "with tracking", "line": "Magic"]
    }

    /// `Rules.money(n)` from the bundle, the web's own function.
    private func webMoney(_ n: Double) async throws -> String {
        let out = try await RulesEngine(bundleURL: RulesGoldenTests.bundleURL).call("money", "[\(n)]")
        return try XCTUnwrap(
            try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String,
            "money gave \(out)")
    }

    /// One missing card at a price on a rounding edge. The line must read what the web's `money` reads.
    /// Swift's formatter rounds 0.125 to $0.12 and 1.005 to $1.00. Red on the base.
    func testMissingLineMoneyIsTheBundlesMoney() async throws {
        let edge: [(Double, String)] = [
            (0.125, "$0.13"), (1.005, "$1.01"), (0.625, "$0.63"), (2.675, "$2.68"), (0.005, "$0.01"),
            (1234.5, "$1,234.50"), (1_000_000, "$1,000,000.00"),
        ]
        for (price, expected) in edge {
            let web = try await webMoney(price)
            XCTAssertEqual(web, expected, "the bundle's money(\(price)) is the reference, and it is not \(expected)")
            let (m, _) = try opened([item("A1|0|pEdge", order: "A1", price: price)])
            try await m.refresh()
            XCTAssertEqual(m.missingLine, "1 still missing \(Self.dot) \(web)", "price \(price): the line is not the web's money")
        }
    }

    /// The forms the web prints together on a real-sized ledger: compact value cell, exact missing line.
    /// 458 cards, one received. Green on the base: it pins the form the lane must keep.
    func testTheValueCellAndTheMissingLineReadAsTheWebReadsThem() async throws {
        let (m, store) = try opened([
            item("A1|0|pBig", order: "A1", price: 54_474.8),
            item("B1|0|pMany", order: "B1", price: 29.95, qty: 457),
        ])
        try store.commitReceived("A1|0|pBig", count: 1)
        try await m.refresh()

        XCTAssertEqual(m.cells.map(\.figure), ["1/458", "1/2", "$54.47k/$68.16k"])
        XCTAssertEqual(m.countLine, "2 packages \(Self.dot) autosaves")
        XCTAssertEqual(m.missingLine, "457 still missing \(Self.dot) $13,687.15")
    }
}
