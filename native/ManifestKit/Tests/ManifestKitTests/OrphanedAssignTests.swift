// Orphaned assign tests (lane N7, native-build-lanes, assign-checks-recorded-cards,
// shrunk-envelope-gets-fresh-stamp, testing-partial-qty-needs-case, orphaned-mail-never-decides).
//
// One call assigns: there is no arm, so a single assign(envelope:to:) checks the cards in
// and leaves an Undo notice. It checks in exactly the cards the envelope recorded, never
// the rest of the package. A partial assignment shrinks the envelope and stamps a fresh
// updatedAt. A full assignment leaves a tombstone. The contract is in OrphanedTestSupport.swift.
//
// Fixture facts: see OrphanedCandidatesTests. A and B tie, so a test that picks A picks it by hand.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class OrphanedAssignTests: XCTestCase {
    // MARK: only the recorded cards

    /// Lightning Bolt and Path to Exile go to C. C also owes Swords, Ponder and Preordain,
    /// and A and B owe a Lightning Bolt. None of those is touched. Other check-in times stay put.
    func testAssignChecksInOnlyTheRecordedCards() async throws {
        let box = try makeSandbox()
        try box.write(extra: [
            "receivedAt": ["Z9|0|pOld": Sandbox.t0 - 5_000],
            "envelopes": [Sandbox.env("e1", [("Lightning Bolt", 1), ("Path to Exile", 1)])],
        ])
        let (model, store) = try await box.open()
        XCTAssertEqual(model.ranked(for: "e1").list.first?.pkg.gk, Sandbox.c1, "anchor: C is the best fit")
        let before = store.generation
        box.clock.t = Sandbox.t0 + 1_000

        try await model.assign(envelope: "e1", to: Sandbox.c1)

        XCTAssertEqual(
            try box.savedReceived(), [Sandbox.c1Bolt: 1, Sandbox.c1Path: 1],
            "exactly the two recorded cards are in: no other line of C, no line of A or B")
        XCTAssertEqual(
            try box.savedReceivedAt(),
            ["Z9|0|pOld": Sandbox.t0 - 5_000, Sandbox.c1Bolt: Sandbox.t0 + 1_000, Sandbox.c1Path: Sandbox.t0 + 1_000],
            "each check-in is stamped with the store's clock, and other stamps stay")
        XCTAssertGreaterThan(store.generation, before, "an assign bumps the generation the sync client reads")
        XCTAssertEqual(store.received(), try box.savedReceived(), "the store and the file agree")
    }

    /// Group 20 on the web: a quantity-2 line takes the one copy that was recorded, not the whole line.
    /// A second recorded copy brings it to 2.
    func testPartialQuantityAssignLandsOnlyTheRecordedCopies() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [
            Sandbox.env("e1", [("Brainstorm", 1)], updated: Sandbox.t0 - 2_000),
            Sandbox.env("e2", [("Brainstorm", 1)], updated: Sandbox.t0 - 1_000),
        ]])
        let (model, _) = try await box.open()

        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Brain: 1], "one copy of a quantity-2 line reads 1, not 2")
        XCTAssertEqual(model.undo?.matchedQty, 1)

        try await model.assign(envelope: "e2", to: Sandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Brain: 2], "the second recorded copy completes the line")
    }

    /// A card the envelope holds more of than the package owes: the package takes what it owes,
    /// and the rest stays in the envelope.
    func testAnEnvelopeHoldingMoreThanIsOwedKeepsTheRest() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [Sandbox.env("e1", [("Brainstorm", 3)])]])
        let (model, _) = try await box.open()

        try await model.assign(envelope: "e1", to: Sandbox.a1)

        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Brain: 2], "A owes two copies, so it takes two")
        XCTAssertEqual(model.envelopes.map(\.entries), [cards(("Brainstorm", 1))], "one copy stays in the envelope")
        XCTAssertEqual(model.undo?.leftoverQty, 1)
    }

    // MARK: a shrunk envelope, a tombstone

    /// Entries a package explains leave the envelope. The rest stay with the original id,
    /// createdAt and note, in their order. updatedAt moves to now, or the other device's larger,
    /// stale copy would win the merge and bring back the cards just checked in.
    func testAPartialAssignShrinksTheEnvelopeWithAFreshStamp() async throws {
        let box = try makeSandbox()
        let created = Sandbox.t0 - Sandbox.day
        try box.write(extra: ["envelopes": [
            Sandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1), ("Brainstorm", 3)], created: created,
                        updated: Sandbox.t0 - 1_000, note: "from box", photos: ["pho-1"], extra: ["colour": "manila"]),
        ]])
        let (model, _) = try await box.open()
        box.clock.t = Sandbox.t0 + 2_000

        try await model.assign(envelope: "e1", to: Sandbox.a1)

        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1, Sandbox.a1Brain: 2], "the cards A explains are in")
        let e = try box.savedEnvelope("e1")
        XCTAssertNil(e["deletedAt"], "a shrunk envelope is still live")
        XCTAssertEqual(Sandbox.entries(of: e), cards(("Black Lotus", 1), ("Brainstorm", 1)), "the unexplained entries stay, in order")
        XCTAssertEqual(e["updatedAt"] as? Double, Sandbox.t0 + 2_000, "a shrunk envelope gets a fresh updatedAt")
        XCTAssertEqual(e["createdAt"] as? Double, created, "and keeps createdAt")
        XCTAssertEqual(e["note"] as? String, "from box", "and its note")
        XCTAssertEqual(e["photos"] as? [String], ["pho-1"], "and its photos")
        XCTAssertEqual(e["colour"] as? String, "manila", "and any field the client does not name")
        XCTAssertEqual(model.envelopes.map(\.entries), [cards(("Black Lotus", 1), ("Brainstorm", 1))])
        XCTAssertEqual(model.undo, UndoNotice(matchedQty: 3, leftoverQty: 2, index: 0, pkgLabel: "Alpha Cards"))
        XCTAssertFalse(model.ranked(for: "e1").explainable.contains("black lotus"), "the Lotus has no outstanding copy anywhere")
    }

    /// An envelope that is fully explained leaves a tombstone, not a hole: deletedAt and updatedAt
    /// are now, entries and photos are empty, and the id and createdAt stay.
    func testAFullAssignWritesATombstone() async throws {
        let box = try makeSandbox()
        let created = Sandbox.t0 - Sandbox.day
        try box.write(extra: ["envelopes": [
            Sandbox.env("e1", [("Counterspell", 1)], created: created, updated: Sandbox.t0 - 1_000, photos: ["pho-1"]),
        ]])
        let (model, _) = try await box.open()
        box.clock.t = Sandbox.t0 + 3_000

        try await model.assign(envelope: "e1", to: Sandbox.a1)

        let e = try box.savedEnvelope("e1")
        XCTAssertEqual(e["deletedAt"] as? Double, Sandbox.t0 + 3_000, "a full assign sets deletedAt")
        XCTAssertEqual(e["updatedAt"] as? Double, Sandbox.t0 + 3_000, "and updatedAt, so a stale copy cannot revive it")
        XCTAssertEqual((e["entries"] as? [Any])?.count, 0, "entries are emptied")
        XCTAssertEqual((e["photos"] as? [Any])?.count, 0, "photos are emptied")
        XCTAssertEqual(e["createdAt"] as? Double, created, "createdAt stays")
        XCTAssertEqual(model.envelopes.count, 0, "the pile no longer lists it")
        XCTAssertEqual(model.ranked(for: "e1").list.count, 0, "and it is not ranked")
        XCTAssertEqual(model.undo?.matchedQty, 1)
        XCTAssertEqual(model.undo?.leftoverQty, 0)
    }

    // MARK: the bundle decides the plan

    /// The probe bundle changes every plan step to take 1. For Brainstorm x2 the real plan takes 2,
    /// so a line of 1 proves assign wrote the bundle's plan and not a count Swift worked out.
    func testAssignWritesThePlanTheBundleGave() async throws {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = FileManager.default.temporaryDirectory.appending(path: "n7-plan-probe-\(UUID().uuidString).js")
        let override = """

        ;(function () {
          var real = Rules.rankCandidates;
          Rules.rankCandidates = function (e, p, r) {
            var out = real(e, p, r);
            out.list.forEach(function (c) { c.plan = c.plan.map(function (s) { return { itemKey: s.itemKey, take: 1 }; }); });
            return out;
          };
        })();

        """
        try (real + override).write(to: probe, atomically: true, encoding: .utf8)
        addTeardownBlock { try? FileManager.default.removeItem(at: probe) }

        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [Sandbox.env("e1", [("Brainstorm", 2)])]])
        let (model, _) = try await box.open(bundle: probe)
        let offered = model.ranked(for: "e1").list.first { $0.pkg.gk == Sandbox.a1 }
        XCTAssertEqual(offered?.plan, [PlanStep(itemKey: Sandbox.a1Brain, take: 1)], "anchor: the model reads the probe's plan")

        try await model.assign(envelope: "e1", to: Sandbox.a1)

        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Brain: 1], "assign wrote the bundle's plan")
    }

    // MARK: the notice, one call

    /// One call checks in. Nothing is armed, nothing asks again. The Undo notice names the
    /// seller and the counts, and it sits at the pile slot the envelope left.
    func testAssignLeavesAnUndoAtTheSlotTheEnvelopeLeft() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [
            Sandbox.env("e0", [("Ponder", 1)]),
            Sandbox.env("e1", [("Counterspell", 1)]),
            Sandbox.env("e2", [("Preordain", 1)]),
        ]])
        let (model, _) = try await box.open()
        XCTAssertNil(model.undo, "anchor: no notice before an assign")

        try await model.assign(envelope: "e1", to: Sandbox.a1)

        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "the one call checked the card in")
        XCTAssertEqual(model.undo, UndoNotice(matchedQty: 1, leftoverQty: 0, index: 1, pkgLabel: "Alpha Cards"))
        XCTAssertEqual(model.envelopes.map(\.id), ["e0", "e2"], "the others keep their order")
    }

    // MARK: refusals

    /// An assign names a package, and the package must be one the envelope was offered. D does not
    /// hold a Lightning Bolt. An unknown envelope is refused too. Nothing is written either time.
    func testAssignRefusesAPackageThatWasNotOffered() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [Sandbox.env("e1", [("Lightning Bolt", 1)])]])
        let (model, store) = try await box.open()
        XCTAssertEqual(model.ranked(for: "e1").list.count, 3, "anchor: A, B and C are offered")
        let bytes = try box.bytes()

        do {
            try await model.assign(envelope: "e1", to: Sandbox.d1)
            XCTFail("assign to a package that was not offered must throw")
        } catch {}
        do {
            try await model.assign(envelope: "no-such-envelope", to: Sandbox.a1)
            XCTFail("assign of an unknown envelope must throw")
        } catch {}

        XCTAssertEqual(try box.bytes(), bytes, "a refused assign writes nothing")
        XCTAssertEqual(store.generation, 0)
        XCTAssertNil(model.undo)
    }

    /// The check-in, the check-in time and the envelope change are one save. If it fails, none of them
    /// happened: not in the file, not in the store, not on screen.
    func testAFailedSaveLeavesTheAssignWhole() async throws {
        try XCTSkipIf(getuid() == 0, "root can write into a read-only folder")
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [
            Sandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1)]),
            Sandbox.env("e2", [("Ponder", 1)]),
        ]])
        let (model, store) = try await box.open()
        let bytes = try box.bytes()
        let receivedBefore = store.received()
        let generationBefore = store.generation
        let shown = model.envelopes

        // The atomic write needs a new file beside the ledger, so a read-only folder makes the save throw.
        try FileManager.default.setAttributes([.posixPermissions: 0o555], ofItemAtPath: box.dir.path)
        do {
            try await model.assign(envelope: "e1", to: Sandbox.a1)
            XCTFail("an assign must throw when the save fails")
        } catch {}

        XCTAssertEqual(try box.bytes(), bytes, "the file did not change")
        XCTAssertEqual(store.received(), receivedBefore, "the store kept no half of the assign")
        XCTAssertEqual(store.generation, generationBefore, "and did not bump the generation")
        XCTAssertEqual(model.envelopes, shown, "the pile on screen did not change")
        XCTAssertNil(model.undo, "there is nothing to undo")
        XCTAssertNotNil(model.error, "the failure is shown, not dropped")
    }

    // MARK: raw JSON

    /// An edit changes only received, receivedAt and envelopes. A top-level field the client
    /// does not know, and every item, pass through an assign and its undo.
    func testAssignAndUndoPassUnknownFieldsAndItemsThrough() async throws {
        let box = try makeSandbox()
        try box.write(extra: [
            "zzFuture": ["a": [1, 2]],
            "envelopes": [Sandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1)])],
        ])
        let (model, _) = try await box.open()
        let items = try JSONSerialization.data(withJSONObject: try Sandbox.fixtureItems(), options: [.sortedKeys])
        let future = try JSONSerialization.data(withJSONObject: ["a": [1, 2]], options: [.sortedKeys])

        func assertUntouched(_ when: String) throws {
            let saved = try box.saved()
            XCTAssertEqual(saved["mailday"] as? Int, 1, "mailday after \(when)")
            XCTAssertEqual(
                try JSONSerialization.data(withJSONObject: try XCTUnwrap(saved["items"]), options: [.sortedKeys]), items,
                "items after \(when)")
            XCTAssertEqual(
                try JSONSerialization.data(withJSONObject: try XCTUnwrap(saved["zzFuture"], "zzFuture after \(when)"), options: [.sortedKeys]),
                future, "the unknown field after \(when)")
        }
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "anchor: the assign was written")
        try assertUntouched("an assign")
        try await model.undoAssign()
        try assertUntouched("an undo")
    }
}
