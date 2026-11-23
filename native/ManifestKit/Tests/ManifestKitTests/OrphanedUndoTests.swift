// Orphaned undo tests (lane N7, native-build-lanes, undo-removes-only-its-delta,
// shrunk-envelope-gets-fresh-stamp, envelope-deletion-unrepresented).
//
// Undo keeps the deltas of an assignment, not a snapshot of the ledger. For each card it
// subtracts what the assignment took, so a hand edit made after the assignment survives. A key
// that falls to zero is deleted, never stored as 0. The envelope returns to its place in the
// pile, with a fresh updatedAt so it beats the tombstone or the shrunk copy it replaces on
// the other device. The contract is in OrphanedTestSupport.swift.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class OrphanedUndoTests: XCTestCase {
    // MARK: the cards

    /// The assign took the only copy, so the undo drops the key. A stored 0 would be a different
    /// ledger. The undo is a write of its own, so the card's check-in time moves to now: an
    /// un-check must beat the older check-in on another device (max-cannot-express-an-uncheck).
    func testUndoDeletesAKeyThatFallsToZeroAndRestampsIt() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Counterspell", 1)])]])
        let (model, store) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Counter: 1], "anchor: the assign was written")
        let beforeUndo = store.generation
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [String: Int](), "the key is gone, not stored as 0")
        XCTAssertEqual(try box.savedReceivedAt()[OrphanedSandbox.a1Counter], OrphanedSandbox.t0 + 2_000, "the card's time moves to the undo")
        XCTAssertGreaterThan(store.generation, beforeUndo, "an undo bumps the generation the sync client reads")
        XCTAssertNil(model.undo, "the notice is gone")
    }

    /// The assign put Brainstorm at 1 of 2. The owner then checked in the second copy by hand.
    /// Undo subtracts the one copy it took, so the hand edit survives. A snapshot restore would
    /// erase it (web test 14.5).
    func testUndoRemovesOnlyItsOwnDeltaSoAHandEditSurvives() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Brainstorm", 1)])]])
        let (model, store) = try await box.open()
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Brain: 1], "anchor: the assign took one copy")
        box.clock.t = OrphanedSandbox.t0 + 1_500
        try store.commitReceived(OrphanedSandbox.a1Brain, count: 2)
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Brain: 1], "2 minus the 1 the assign took")
        XCTAssertEqual(try box.savedReceivedAt()[OrphanedSandbox.a1Brain], OrphanedSandbox.t0 + 2_000)
    }

    /// Undo is for the last assignment only. A second call has nothing to subtract, so a check-in
    /// made since stays.
    func testASecondUndoDoesNothing() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Counterspell", 1)])]])
        let (model, store) = try await box.open()
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Counter: 1], "anchor: the assign was written")
        try await model.undoAssign()
        XCTAssertEqual(try box.savedReceived(), [String: Int](), "anchor: the first undo took it back")
        try store.commitReceived(OrphanedSandbox.a1Counter, count: 1)
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Counter: 1], "anchor: a hand check-in after the undo")

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Counter: 1], "a second undo subtracts nothing")
    }

    // MARK: the envelope

    /// A shrunk envelope grows back to what it held, at the same place in the pile, with a fresh
    /// updatedAt. Its id, createdAt, note and photos are the ones it had.
    func testUndoBringsTheShrunkEnvelopeBackInPlace() async throws {
        let box = try makeOrphanedSandbox()
        let created = OrphanedSandbox.t0 - OrphanedSandbox.day
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e0", [("Ponder", 1)]),
            OrphanedSandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1)], created: created, updated: OrphanedSandbox.t0 - 1_000,
                        note: "from box", photos: ["pho-1"]),
            OrphanedSandbox.env("e2", [("Preordain", 1)]),
        ]])
        let (model, _) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try OrphanedSandbox.entries(of: box.savedEnvelope("e1")), orphanedCards(("Black Lotus", 1)), "anchor: the envelope shrank")
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        let e = try box.savedEnvelope("e1")
        XCTAssertEqual(OrphanedSandbox.entries(of: e), orphanedCards(("Counterspell", 1), ("Black Lotus", 1)), "the envelope holds what it held")
        XCTAssertEqual(e["updatedAt"] as? Double, OrphanedSandbox.t0 + 2_000, "with a fresh updatedAt")
        XCTAssertEqual(e["createdAt"] as? Double, created)
        XCTAssertEqual(e["note"] as? String, "from box")
        XCTAssertEqual(e["photos"] as? [String], ["pho-1"])
        XCTAssertEqual(try box.savedEnvelopes().compactMap { $0["id"] as? String }, ["e0", "e1", "e2"], "same place in the file")
        XCTAssertEqual(model.envelopes.map(\.id), ["e0", "e1", "e2"], "and in the pile")
    }

    /// A fully assigned envelope was a tombstone. Undo makes it live again: no deletedAt, its entries
    /// and photos back, and an updatedAt newer than the tombstone's, so the undo wins a merge.
    func testUndoBringsBackAnEnvelopeTheAssignRemoved() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e1", [("Counterspell", 1)], note: "n", photos: ["pho-1"], extra: ["colour": "manila"]),
        ]])
        let (model, _) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedEnvelope("e1")["deletedAt"] as? Double, OrphanedSandbox.t0 + 1_000, "anchor: a tombstone")
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        let e = try box.savedEnvelope("e1")
        XCTAssertNil(e["deletedAt"], "the envelope is live again")
        XCTAssertEqual(OrphanedSandbox.entries(of: e), orphanedCards(("Counterspell", 1)))
        XCTAssertEqual(e["updatedAt"] as? Double, OrphanedSandbox.t0 + 2_000, "newer than the tombstone")
        XCTAssertEqual(e["photos"] as? [String], ["pho-1"], "its photos are back")
        XCTAssertEqual(e["note"] as? String, "n")
        XCTAssertEqual(e["colour"] as? String, "manila")
        XCTAssertEqual(model.envelopes.map(\.id), ["e1"], "and it is back in the pile")
    }

    // MARK: discard

    /// Discarding the envelope the notice is about clears the notice, because there is nothing left
    /// to undo. Discarding another envelope leaves the notice alone. A discard is a tombstone.
    func testDiscardingTheEnvelopeClearsItsUndo() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1)]),
            OrphanedSandbox.env("e2", [("Ponder", 1)]),
        ]])
        let (model, _) = try await box.open()
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertNotNil(model.undo, "anchor: a notice for e1")

        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.discard(envelope: "e2")
        XCTAssertNotNil(model.undo, "discarding another envelope keeps the notice")
        XCTAssertEqual(try box.savedEnvelope("e2")["deletedAt"] as? Double, OrphanedSandbox.t0 + 1_000, "a discard is a tombstone")

        box.clock.t = OrphanedSandbox.t0 + 2_000
        try await model.discard(envelope: "e1")
        XCTAssertNil(model.undo, "discarding e1 clears its notice")
        XCTAssertEqual(try box.savedEnvelope("e1")["deletedAt"] as? Double, OrphanedSandbox.t0 + 2_000)
        XCTAssertEqual(model.envelopes.count, 0)

        try await model.undoAssign()
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Counter: 1], "an undo with no notice changes nothing")
    }

    /// debt mark-all-undo-keeps-checkin, the assign path. The assign checks Counterspell in and stamps its time. The card had no
    /// check-in time before the assign, so the Undo, which takes the copy back, leaves it with none.
    func testUndoOfAnAssignLeavesACardWithNoCheckInTimeWhenItHadNone() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Counterspell", 1)])]])
        let (model, _) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Counter], OrphanedSandbox.t0 + 1_000,
                       "scope: the assign stamped the card's check-in time")
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [String: Int](), "scope: the undo took the copy back out")
        XCTAssertNil(try box.savedCheckedInAt()[OrphanedSandbox.a1Counter],
                     "the undo of an assign left a check-in time on a card that had none before the assign")
    }

    /// debt mark-all-undo-keeps-checkin, the assign path with an earlier time. The card was checked in earlier and taken back, so
    /// its time is still in the file (an un-check writes none). The assign stamps now; the Undo gives the earlier time back.
    func testUndoOfAnAssignPutsAnEarlierCheckInTimeBack() async throws {
        let box = try makeOrphanedSandbox()
        let earlier = OrphanedSandbox.t0 - 60_000
        try box.write(extra: [
            "envelopes": [OrphanedSandbox.env("e1", [("Counterspell", 1)])],
            "checkedInAt": [OrphanedSandbox.a1Counter: earlier],
        ])
        let (model, _) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Counter], OrphanedSandbox.t0 + 1_000,
                       "scope: the assign stamped the card's check-in time")
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [String: Int](), "scope: the undo took the copy back out")
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Counter], earlier,
                       "the undo of an assign did not give the card its earlier check-in time back")
    }

    /// debt mark-all-undo-keeps-checkin, F3: a stepper check-in after the assign. The assign took one Brainstorm. A stepper then
    /// took the second copy at 1 500 (a store write, as the hand-edit case above). The Undo takes only the assign's copy, and
    /// must keep the 1 500 time of the stepper's check-in, not give back the time from before the assign.
    func testUndoOfAnAssignKeepsAStepperCheckInAfterIt() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Brainstorm", 1)])]])
        let (model, store) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Brain], OrphanedSandbox.t0 + 1_000,
                       "anchor: the assign stamped Brainstorm's check-in time")
        box.clock.t = OrphanedSandbox.t0 + 1_500
        try store.commitReceived(OrphanedSandbox.a1Brain, count: 2)
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Brain], OrphanedSandbox.t0 + 1_500,
                       "anchor: the stepper's check-in stamped 1 500")
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Brain: 1], "scope: the Undo took the assign's copy, and kept the stepper's")
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Brain], OrphanedSandbox.t0 + 1_500,
                       "the Undo of an assign gave Brainstorm the time from before the assign and lost the stepper's check-in time")
    }

    /// debt mark-all-undo-keeps-checkin, F4: the count is already 0. Counterspell was checked in earlier and then taken back, so
    /// its time is still in the file. The assign checks it in again, and an un-check takes the count to 0 before the Undo. The
    /// Undo must still give the card its earlier time back, as the web does (web test 88.4): at count 0 it must not read as
    /// checked in today.
    func testUndoOfAnAssignAfterAnUnCheckStillRestoresTheEarlierTime() async throws {
        let box = try makeOrphanedSandbox()
        let earlier = OrphanedSandbox.t0 - 60_000
        try box.write(extra: [
            "envelopes": [OrphanedSandbox.env("e1", [("Counterspell", 1)])],
            "checkedInAt": [OrphanedSandbox.a1Counter: earlier],
        ])
        let (model, store) = try await box.open()
        box.clock.t = OrphanedSandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Counter], OrphanedSandbox.t0 + 1_000,
                       "anchor: the assign stamped Counterspell's check-in time")
        box.clock.t = OrphanedSandbox.t0 + 1_500
        try store.commitReceived(OrphanedSandbox.a1Counter, count: 0)
        XCTAssertEqual(try box.savedReceived(), [String: Int](), "anchor: the un-check took the count to 0")
        box.clock.t = OrphanedSandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [String: Int](), "scope: the count stays at 0")
        XCTAssertEqual(try box.savedCheckedInAt()[OrphanedSandbox.a1Counter], earlier,
                       "the Undo of an assign at count 0 left the assign's time, so Counterspell reads as checked in today")
    }
}
