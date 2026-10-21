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
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [Sandbox.env("e1", [("Counterspell", 1)])]])
        let (model, store) = try await box.open()
        box.clock.t = Sandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "anchor: the assign was written")
        let beforeUndo = store.generation
        box.clock.t = Sandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [String: Int](), "the key is gone, not stored as 0")
        XCTAssertEqual(try box.savedReceivedAt()[Sandbox.a1Counter], Sandbox.t0 + 2_000, "the card's time moves to the undo")
        XCTAssertGreaterThan(store.generation, beforeUndo, "an undo bumps the generation the sync client reads")
        XCTAssertNil(model.undo, "the notice is gone")
    }

    /// The assign put Brainstorm at 1 of 2. The owner then checked in the second copy by hand.
    /// Undo subtracts the one copy it took, so the hand edit survives. A snapshot restore would
    /// erase it (web test 14.5).
    func testUndoRemovesOnlyItsOwnDeltaSoAHandEditSurvives() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [Sandbox.env("e1", [("Brainstorm", 1)])]])
        let (model, store) = try await box.open()
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Brain: 1], "anchor: the assign took one copy")
        box.clock.t = Sandbox.t0 + 1_500
        try store.commitReceived(Sandbox.a1Brain, count: 2)
        box.clock.t = Sandbox.t0 + 2_000

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Brain: 1], "2 minus the 1 the assign took")
        XCTAssertEqual(try box.savedReceivedAt()[Sandbox.a1Brain], Sandbox.t0 + 2_000)
    }

    /// Undo is for the last assignment only. A second call has nothing to subtract, so a check-in
    /// made since stays.
    func testASecondUndoDoesNothing() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [Sandbox.env("e1", [("Counterspell", 1)])]])
        let (model, store) = try await box.open()
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "anchor: the assign was written")
        try await model.undoAssign()
        XCTAssertEqual(try box.savedReceived(), [String: Int](), "anchor: the first undo took it back")
        try store.commitReceived(Sandbox.a1Counter, count: 1)
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "anchor: a hand check-in after the undo")

        try await model.undoAssign()

        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "a second undo subtracts nothing")
    }

    // MARK: the envelope

    /// A shrunk envelope grows back to what it held, at the same place in the pile, with a fresh
    /// updatedAt. Its id, createdAt, note and photos are the ones it had.
    func testUndoBringsTheShrunkEnvelopeBackInPlace() async throws {
        let box = try makeSandbox()
        let created = Sandbox.t0 - Sandbox.day
        try box.write(extra: ["envelopes": [
            Sandbox.env("e0", [("Ponder", 1)]),
            Sandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1)], created: created, updated: Sandbox.t0 - 1_000,
                        note: "from box", photos: ["pho-1"]),
            Sandbox.env("e2", [("Preordain", 1)]),
        ]])
        let (model, _) = try await box.open()
        box.clock.t = Sandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try Sandbox.entries(of: box.savedEnvelope("e1")), cards(("Black Lotus", 1)), "anchor: the envelope shrank")
        box.clock.t = Sandbox.t0 + 2_000

        try await model.undoAssign()

        let e = try box.savedEnvelope("e1")
        XCTAssertEqual(Sandbox.entries(of: e), cards(("Counterspell", 1), ("Black Lotus", 1)), "the envelope holds what it held")
        XCTAssertEqual(e["updatedAt"] as? Double, Sandbox.t0 + 2_000, "with a fresh updatedAt")
        XCTAssertEqual(e["createdAt"] as? Double, created)
        XCTAssertEqual(e["note"] as? String, "from box")
        XCTAssertEqual(e["photos"] as? [String], ["pho-1"])
        XCTAssertEqual(try box.savedEnvelopes().compactMap { $0["id"] as? String }, ["e0", "e1", "e2"], "same place in the file")
        XCTAssertEqual(model.envelopes.map(\.id), ["e0", "e1", "e2"], "and in the pile")
    }

    /// A fully assigned envelope was a tombstone. Undo makes it live again: no deletedAt, its entries
    /// and photos back, and an updatedAt newer than the tombstone's, so the undo wins a merge.
    func testUndoBringsBackAnEnvelopeTheAssignRemoved() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [
            Sandbox.env("e1", [("Counterspell", 1)], note: "n", photos: ["pho-1"], extra: ["colour": "manila"]),
        ]])
        let (model, _) = try await box.open()
        box.clock.t = Sandbox.t0 + 1_000
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertEqual(try box.savedEnvelope("e1")["deletedAt"] as? Double, Sandbox.t0 + 1_000, "anchor: a tombstone")
        box.clock.t = Sandbox.t0 + 2_000

        try await model.undoAssign()

        let e = try box.savedEnvelope("e1")
        XCTAssertNil(e["deletedAt"], "the envelope is live again")
        XCTAssertEqual(Sandbox.entries(of: e), cards(("Counterspell", 1)))
        XCTAssertEqual(e["updatedAt"] as? Double, Sandbox.t0 + 2_000, "newer than the tombstone")
        XCTAssertEqual(e["photos"] as? [String], ["pho-1"], "its photos are back")
        XCTAssertEqual(e["note"] as? String, "n")
        XCTAssertEqual(e["colour"] as? String, "manila")
        XCTAssertEqual(model.envelopes.map(\.id), ["e1"], "and it is back in the pile")
    }

    // MARK: discard

    /// Discarding the envelope the notice is about clears the notice, because there is nothing left
    /// to undo. Discarding another envelope leaves the notice alone. A discard is a tombstone.
    func testDiscardingTheEnvelopeClearsItsUndo() async throws {
        let box = try makeSandbox()
        try box.write(extra: ["envelopes": [
            Sandbox.env("e1", [("Counterspell", 1), ("Black Lotus", 1)]),
            Sandbox.env("e2", [("Ponder", 1)]),
        ]])
        let (model, _) = try await box.open()
        try await model.assign(envelope: "e1", to: Sandbox.a1)
        XCTAssertNotNil(model.undo, "anchor: a notice for e1")

        box.clock.t = Sandbox.t0 + 1_000
        try await model.discard(envelope: "e2")
        XCTAssertNotNil(model.undo, "discarding another envelope keeps the notice")
        XCTAssertEqual(try box.savedEnvelope("e2")["deletedAt"] as? Double, Sandbox.t0 + 1_000, "a discard is a tombstone")

        box.clock.t = Sandbox.t0 + 2_000
        try await model.discard(envelope: "e1")
        XCTAssertNil(model.undo, "discarding e1 clears its notice")
        XCTAssertEqual(try box.savedEnvelope("e1")["deletedAt"] as? Double, Sandbox.t0 + 2_000)
        XCTAssertEqual(model.envelopes.count, 0)

        try await model.undoAssign()
        XCTAssertEqual(try box.savedReceived(), [Sandbox.a1Counter: 1], "an undo with no notice changes nothing")
    }
}
