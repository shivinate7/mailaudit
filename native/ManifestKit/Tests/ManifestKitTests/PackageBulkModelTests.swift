// Mark all received, Clear check-ins and Undo on the Packages model (undo-removes-only-its-delta,
// recent-checks-can-be-undone, no-layout-shift-under-pointer, rules-run-in-javascriptcore).
//
// The rules are pinned in test/view-rules.test.mjs (V39) and BulkRulesTests. These cases pin the model's calls: what
// PackagesModel.bulk(gk:on:) and PackagesModel.undoBulk() write, in how many saves, at what time, and when the Undo ends.
// The shim cases prove the counts come from the bundle and Swift keeps no copy. The calls and their signatures are the
// contract in BulkSupport.swift. Red-first: until the builder adds them, each case fails on a throw that names the call.
//
// The ledger is LiveFixture.base with a chosen received map. Package A1 / Seller A holds a1 (qty 1) and a2 (qty 2), three
// copies. E1 / Seller E holds e1, F1 / Seller F holds f1. The Undo cases not in the UI tests (a check-in, a stamp, a Clear
// and a newer bulk each end it) are only here, because a tab change, a restore and a Reset are not model calls.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PackageBulkModelTests: XCTestCase {
    static let gk = "A1::Seller A", eGk = "E1::Seller E"
    static let a1 = "a1", a2 = "a2", e1 = "e1", f1 = "f1"

    /// A loaded model over LiveFixture.base. `now` is the store's clock; by default it reads `clock`, which a case moves.
    func rig(received: [String: Int], clock: PressClock = PressClock(1_000), now: (() -> Double)? = nil,
             engine: RulesEngine? = nil) async throws -> (model: PackagesModel, store: LedgerStore) {
        let store = try await LiveFixture.store(items: LiveFixture.base, stamps: [], engine: try LiveFixture.engine(), received: received,
                                                now: now ?? { clock.t })
        let model = PackagesModel(engine: try engine ?? LiveFixture.engine(), store: store)
        try await model.load()
        return (model, store)
    }

    func receivedAt(_ store: LedgerStore) -> [String: Double] {
        (store.snapshot()["receivedAt"] as? [String: Any] ?? [:]).compactMapValues { $0 as? Double }
    }

    // MARK: Mark all and Clear

    /// Mark all writes every line of the package to its qty: the empty line, the part-in line, and the line already in. A
    /// key outside the package stays. The model reads the store again, so the card's lines and pill follow.
    func testMarkAllSetsEveryLineToItsQty() async throws {
        let (model, store) = try await rig(received: [Self.a2: 1, Self.f1: 1])
        XCTAssertEqual(store.received(), [Self.a2: 1, Self.f1: 1], "anchor: a2 is part in, a1 is out")

        try await bulking(model).bulk(gk: Self.gk, on: true)

        XCTAssertEqual(store.received(), [Self.a1: 1, Self.a2: 2, Self.f1: 1], "every line of A1 goes to its qty and f1 is left alone")
        XCTAssertEqual(model.received, store.received(), "the model reads the ledger again after the write")
        XCTAssertEqual(model.done[Self.a1], true, "a1 reads done")
        XCTAssertEqual(model.done[Self.a2], true, "a2 reads done")
        XCTAssertNil(model.pills[Self.gk], "nothing is owed on the card, so there is no pill")
        XCTAssertNil(model.checkInError, "a good bulk leaves no error")
    }

    /// Clear sets every line to 0: the key is gone, not stored as 0, and the other package's check-in stays.
    func testClearSetsEveryLineToZero() async throws {
        let (model, store) = try await rig(received: [Self.a1: 1, Self.a2: 1, Self.f1: 1])

        try await bulking(model).bulk(gk: Self.gk, on: false)

        XCTAssertEqual(store.received(), [Self.f1: 1], "a1 and a2 are deleted, not stored as 0, and f1 is left alone")
        XCTAssertEqual(model.received, store.received(), "the model reads the ledger again after the write")
        XCTAssertEqual(model.done[Self.a1], false, "a1 no longer reads done")
        XCTAssertNotNil(model.pills[Self.gk], "three copies are owed again, so the pill is back")
    }

    /// One bulk is one save and one clock reading, as the web's one touchReceived call. A clock that moves on each reading
    /// gives a loop of per-key writes away: two saves, two times. Clear restamps both keys too, so an un-check beats an
    /// older check on another device.
    func testOneBulkIsOneSaveAtOneTime() async throws {
        let clock = PressClock(5_000)
        let (model, store) = try await rig(received: [Self.f1: 1], now: { clock.t += 1; return clock.t })
        var saves = 0
        store.onLocalSave = { saves += 1 }
        var last = 0.0

        for on in [true, false] {
            saves = 0
            try await bulking(model).bulk(gk: Self.gk, on: on)
            XCTAssertEqual(saves, 1, "Mark all or Clear (on: \(on)) is one save")
            let at = receivedAt(store)
            let a1 = try XCTUnwrap(at[Self.a1], "a1 has no receivedAt after the bulk (on: \(on))")
            let a2 = try XCTUnwrap(at[Self.a2], "a2 has no receivedAt after the bulk (on: \(on))")
            XCTAssertEqual(a1, a2, "every key of the package carries the same time (on: \(on))")
            XCTAssertGreaterThan(a1, last, "the bulk restamps its keys with the time it was made (on: \(on))")
            last = a1
        }
    }

    // MARK: Undo

    /// Undo takes back the press's own delta and keeps what the owner or a Worker apply wrote after it (web test 14.5). The
    /// ledger held a1 and f1. Mark all took a2's two copies. Then a1 and f1 were un-checked and e1 was checked. A snapshot
    /// restore would bring a1 and f1 back and lose e1.
    func testUndoRemovesOnlyItsOwnDeltaSoALaterEditSurvives() async throws {
        let clock = PressClock(1_000)
        let (model, store) = try await rig(received: [Self.a1: 1, Self.f1: 1], clock: clock)

        try await assertBulkUndoKeepsLaterEdits(
            store: store, clock: clock,
            press: { try await bulking(model).bulk(gk: Self.gk, on: true) },
            undo: { try await bulking(model).undoBulk() },
            later: [Self.a1: 0, Self.f1: 0, Self.e1: 1], expect: [Self.e1: 1], restamped: Self.a2)

        XCTAssertEqual(model.received, store.received(), "the model reads the ledger again after the undo")
        XCTAssertEqual(model.done[Self.a2], false, "a2 no longer reads done")
    }

    /// The Undo is for the last Mark all. A check-in the owner makes through the model is the next write on this device and
    /// ends it, so a later undo call writes nothing.
    func testACheckInEndsTheUndo() async throws {
        try await assertUndoGone(after: { model, _ in try await model.checkIn(key: Self.a1, count: 0) }, "a check-in")
    }

    /// A stamp is a write on this device too.
    func testAStampEndsTheUndo() async throws {
        try await assertUndoGone(after: { model, _ in try await model.stamp(Self.gk, kind: "claim", note: "") }, "a stamp")
    }

    /// Clear has no Undo of its own (the ask is its guard) and ends the one a Mark all left: a later undo must not
    /// bring back what the Clear took away, or undo what the Clear already did.
    func testAClearEndsTheUndo() async throws {
        try await assertUndoGone(after: { model, _ in try await bulking(model).bulk(gk: Self.gk, on: false) }, "a Clear")
    }

    /// A newer Mark all replaces the held Undo: the first press can no longer be undone.
    func testANewerMarkAllReplacesTheUndo() async throws {
        let (model, store) = try await rig(received: [Self.f1: 1])
        try await bulking(model).bulk(gk: Self.gk, on: true)
        try await bulking(model).bulk(gk: Self.eGk, on: true)
        XCTAssertEqual(store.received(), [Self.a1: 1, Self.a2: 2, Self.e1: 1, Self.f1: 1], "anchor: both presses landed")

        try await bulking(model).undoBulk()

        XCTAssertEqual(store.received(), [Self.a1: 1, Self.a2: 2, Self.f1: 1], "undo takes back the newer press, E1's check-in, and no more")
    }

    /// Undo with nothing to undo does nothing: no write, no generation bump.
    func testUndoWithNothingToUndoWritesNothing() async throws {
        let (model, store) = try await rig(received: [Self.f1: 1])
        let generation = store.generation

        try await bulking(model).undoBulk()

        XCTAssertEqual(store.received(), [Self.f1: 1], "nothing to undo changes nothing")
        XCTAssertEqual(store.generation, generation, "nothing to undo writes nothing")
    }

    /// A Mark all, then `act` (a write on this device), then an undo call. The undo must write nothing and leave the ledger
    /// as `act` left it.
    func assertUndoGone(after act: @MainActor (PackagesModel, LedgerStore) async throws -> Void, _ what: String,
                        file: StaticString = #filePath, line: UInt = #line) async throws {
        let (model, store) = try await rig(received: [Self.f1: 1])
        try await bulking(model).bulk(gk: Self.gk, on: true)
        try await act(model, store)
        let ledger = store.received(), generation = store.generation

        try await bulking(model).undoBulk()

        XCTAssertEqual(store.received(), ledger, "\(what) ended the Undo, so the undo call must leave the ledger as it was", file: file, line: line)
        XCTAssertEqual(store.generation, generation, "\(what) ended the Undo, so the undo call must write nothing", file: file, line: line)
    }

    // MARK: the counts come from the bundle

    /// The real bundle with one rule replaced. A positive control proves the replacement is live before a model reads it.
    func shimmed(_ js: String, call name: String, _ args: String, expect: String) async throws -> RulesEngine {
        let engine = try RulesEngine(bundleURL: try probeBundleFile(js, for: self))
        let out = try await engine.call(name, args)
        XCTAssertEqual(out, expect, "the shim's override must be live, or this test proves nothing")
        let rest = try await engine.call("outstandingOf", "[[],{}]")
        XCTAssertEqual(rest, "{\"left\":0,\"value\":0}", "the shim must leave the other exports alone")
        return engine
    }

    /// Mark all writes the counts the bundle's bulkApply gives, and so does Clear. Swift's own qty and delete would give 1 and 2,
    /// then a1 gone: the shim says 7 for each line, and on Clear keeps a1 at 5.
    func testBulkWritesTheCountsTheBundleGives() async throws {
        let js = """
            Rules = Object.assign({}, Rules, { bulkApply: function (items, on, received) {
              var out = Object.assign({}, received);
              items.forEach(function (it) { if (on) out[it.key] = 7; else if (it.key === "a1") out[it.key] = 5; else delete out[it.key]; });
              return out;
            } });
            """
        let engine = try await shimmed(js, call: "bulkApply", #"[[{"key":"q","qty":1}],true,{}]"#, expect: #"{"q":7}"#)
        let (model, store) = try await rig(received: [Self.f1: 1], engine: engine)

        try await bulking(model).bulk(gk: Self.gk, on: true)
        XCTAssertEqual(store.received(), [Self.a1: 7, Self.a2: 7, Self.f1: 1], "Mark all must write the bundle's counts")

        try await bulking(model).bulk(gk: Self.gk, on: false)
        XCTAssertEqual(store.received(), [Self.a1: 5, Self.f1: 1], "Clear must write what the bundle's bulkApply gives")
    }

    /// The Undo keeps the takes the bundle's bulkTakes gave at the press. The shim says every line took 1, where the real
    /// rule says 1 and 2, so the undo leaves a2 at 1. Swift's own qty minus count would take both copies back.
    func testUndoKeepsTheTakesTheBundleGave() async throws {
        let js = """
            Rules = Object.assign({}, Rules, { bulkTakes: function (items) {
              return items.map(function (it) { return { itemKey: it.key, take: 1, qty: it.qty }; });
            } });
            """
        let engine = try await shimmed(js, call: "bulkTakes", #"[[{"key":"q","qty":3}],{}]"#, expect: #"[{"itemKey":"q","take":1,"qty":3}]"#)
        let (model, store) = try await rig(received: [Self.f1: 1], engine: engine)
        try await bulking(model).bulk(gk: Self.gk, on: true)

        try await bulking(model).undoBulk()

        XCTAssertEqual(store.received(), [Self.a2: 1, Self.f1: 1], "undo subtracts the bundle's takes: a1 by 1, a2 by 1")
    }

    /// The Undo writes what the bundle's undoBulk gives. The shim puts the first line at 4 and keeps the rest as they are.
    /// Swift's own subtraction would delete a1 and a2.
    func testUndoWritesWhatTheBundlesUndoBulkGives() async throws {
        let js = """
            Rules = Object.assign({}, Rules, { undoBulk: function (takes, received) {
              var out = Object.assign({}, received); out[takes[0].itemKey] = 4; return out;
            } });
            """
        let engine = try await shimmed(js, call: "undoBulk", #"[[{"itemKey":"q","take":1,"qty":3}],{"r":2}]"#, expect: #"{"r":2,"q":4}"#)
        let (model, store) = try await rig(received: [Self.f1: 1], engine: engine)
        try await bulking(model).bulk(gk: Self.gk, on: true)

        try await bulking(model).undoBulk()

        XCTAssertEqual(store.received(), [Self.a1: 4, Self.a2: 2, Self.f1: 1], "undo must write the bundle's map for the pressed lines")
    }
}
