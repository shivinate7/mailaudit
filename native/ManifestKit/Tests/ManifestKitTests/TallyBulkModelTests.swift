// Mark all received, Clear check-ins and Undo on the Tally model (undo-removes-only-its-delta, tally-row-lists-its-copies,
// search-hide-keep-tally-counts, rules-run-in-javascriptcore).
//
// A Tally row's bulk controls act on every copy of the product, the ones a filter hides included: the web calls
// onBulk(item.items, ...), not item.shown (src/app.jsx ItemTotalRow). The rules are V39 in test/view-rules.test.mjs, and the
// Undo rule is the Packages model's (PackageBulkModelTests; the sequence is BulkSupport's). The calls and their signatures are
// the contract in BulkSupport.swift: TallyModel.bulk(name:on:) and TallyModel.undoBulk().
//
// The ledger is LiveFixture.base. "Shared" pools a2 (A1 / Seller A, qty 2), e1 (E1 / Seller E) and s1 (R1 / Seller S): four
// copies. The query "seller e" shows e1 alone and hides the other two.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class TallyBulkModelTests: XCTestCase {
    static let a1 = "a1", a2 = "a2", e1 = "e1", s1 = "s1", f1 = "f1"

    func rig(received: [String: Int], clock: PressClock = PressClock(1_000), engine: RulesEngine? = nil) async throws
        -> (model: TallyModel, store: LedgerStore) {
        let store = try await LiveFixture.store(items: LiveFixture.base, stamps: [], engine: try LiveFixture.engine(), received: received,
                                                now: { clock.t })
        let model = TallyModel(engine: try engine ?? LiveFixture.engine(), store: store)
        try await model.load()
        return (model, store)
    }

    func shared(_ model: TallyModel) throws -> TallyRow {
        try XCTUnwrap(model.rows.first { $0.name == "Shared" }, "no Tally row named Shared; rows: \(model.rows.map(\.name))")
    }

    /// With "seller e" typed, the row shows e1 and hides a2 and s1. Mark all still checks in all four copies.
    func testMarkAllChecksInEveryCopyIncludingTheHiddenOnes() async throws {
        let (model, store) = try await rig(received: [Self.f1: 1])
        try await model.setQuery("seller e")
        let before = try shared(model)
        XCTAssertEqual(before.copies.map(\.key), [Self.e1], "anchor: the filter shows one copy of the three")
        XCTAssertEqual(before.hiddenCopies, 2, "anchor: two copies are hidden by the filter")

        try await bulking(model).bulk(name: "Shared", on: true)

        XCTAssertEqual(store.received(), [Self.a2: 2, Self.e1: 1, Self.s1: 1, Self.f1: 1], "every copy goes to its qty, the hidden ones too, and f1 is left alone")
        XCTAssertEqual(try shared(model).ratio, "4/4 \u{2713}", "the row counts all four copies in")
        XCTAssertNil(model.checkInError, "a good bulk leaves no error")
    }

    /// Clear checks out every copy, the hidden ones too: the key is gone, not stored as 0.
    func testClearChecksOutEveryCopyIncludingTheHiddenOnes() async throws {
        let (model, store) = try await rig(received: [Self.a2: 2, Self.e1: 1, Self.s1: 1, Self.f1: 1])
        try await model.setQuery("seller e")
        XCTAssertEqual(try shared(model).hiddenCopies, 2, "anchor: two copies are hidden by the filter")

        try await bulking(model).bulk(name: "Shared", on: false)

        XCTAssertEqual(store.received(), [Self.f1: 1], "all three Shared copies are deleted, the hidden ones too, and f1 is left alone")
        XCTAssertEqual(try shared(model).ratio, "0/4", "the row counts none in")
    }

    /// The Tally Undo takes back the press's own delta: the same rule as the Packages card, over the row's every copy. The
    /// ledger held e1 and f1. Mark all took a2's two copies and s1. Then e1 and f1 were un-checked and a1 checked.
    func testUndoRemovesOnlyItsOwnDeltaSoALaterEditSurvives() async throws {
        let clock = PressClock(1_000)
        let (model, store) = try await rig(received: [Self.e1: 1, Self.f1: 1], clock: clock)

        try await assertBulkUndoKeepsLaterEdits(
            store: store, clock: clock,
            press: { try await bulking(model).bulk(name: "Shared", on: true) },
            undo: { try await bulking(model).undoBulk() },
            later: [Self.e1: 0, Self.f1: 0, Self.a1: 1], expect: [Self.a1: 1], restamped: Self.a2)

        XCTAssertEqual(try shared(model).ratio, "0/4", "the row reads the ledger again after the undo")
    }

    /// The counts come from the bundle's bulkApply: the shim says 7 for each copy on Mark all, and on Clear keeps e1 at 5. Swift's
    /// own qty and delete would give the real counts.
    func testBulkWritesTheCountsTheBundleGives() async throws {
        let js = """
            Rules = Object.assign({}, Rules, { bulkApply: function (items, on, received) {
              var out = Object.assign({}, received);
              items.forEach(function (it) { if (on) out[it.key] = 7; else if (it.key === "e1") out[it.key] = 5; else delete out[it.key]; });
              return out;
            } });
            """
        let engine = try RulesEngine(bundleURL: try probeBundleFile(js, for: self))
        let live = try await engine.call("bulkApply", #"[[{"key":"q","qty":1}],true,{}]"#)
        XCTAssertEqual(live, #"{"q":7}"#, "the shim's override must be live, or this test proves nothing")
        let (model, store) = try await rig(received: [Self.f1: 1], engine: engine)

        try await bulking(model).bulk(name: "Shared", on: true)
        XCTAssertEqual(store.received(), [Self.a2: 7, Self.e1: 7, Self.s1: 7, Self.f1: 1], "Mark all must write the bundle's counts")

        try await bulking(model).bulk(name: "Shared", on: false)
        XCTAssertEqual(store.received(), [Self.e1: 5, Self.f1: 1], "Clear must write what the bundle's bulkApply gives")
    }
}
