// The Orphaned tab badge count (phone-nav-is-bottom-bar: the Orphaned tab keeps its count badge;
// orphaned-colours-by-meaning). The badge shows the count of LIVE envelopes, and zero hides it:
// SwiftUI's `.badge(Int)` draws nothing at 0, so the model hands the view the bare count.
//
// A discarded envelope stays in the ledger as a tombstone (envelope-deletion-unrepresented), so a
// count of envelope records is wrong by exactly the tombstones. Every case below holds one, or
// writes one. Counts are literals, never read back from the model.
//
// Red-first. The API is OrphanedModel.badgeCount: Int. The red run is in the commit message.
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class OrphanedBadgeTests: XCTestCase {
    static func tombstone(_ id: String) -> [String: Any] {
        OrphanedSandbox.env(id, [("Ponder", 1)], extra: ["deletedAt": OrphanedSandbox.t0 - 1_000])
    }

    /// Two live and one discarded: the badge reads 2, where a count of records reads 3.
    func testTheBadgeCountsLiveEnvelopesAndSkipsTombstones() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e1", [("Counterspell", 1)]),
            Self.tombstone("gone"),
            OrphanedSandbox.env("e2", [("Urza's Saga", 1)]),
        ]])
        let (model, _) = try await box.open()

        XCTAssertEqual(model.badgeCount, 2)
    }

    /// Only a tombstone is left: the pile is empty, so the badge is 0 and hides.
    func testAPileOfOnlyTombstonesHasNoBadge() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [Self.tombstone("gone")]])
        let (model, _) = try await box.open()

        XCTAssertEqual(model.badgeCount, 0)
    }

    /// Recording raises the count by one each time, and a discard lowers it, down to 0 and no badge.
    func testASaveRaisesTheBadgeAndADiscardLowersIt() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [Self.tombstone("gone")]])
        let (model, _) = try await box.open()
        XCTAssertEqual(model.badgeCount, 0, "anchor: nothing live yet")

        try await model.addName("Lightning Bolt", for: .new)
        try await model.save(.new)
        XCTAssertEqual(model.badgeCount, 1, "one envelope recorded")

        try await model.addName("Urza's Saga", for: .new)
        try await model.save(.new)
        XCTAssertEqual(model.badgeCount, 2, "a second one recorded")

        let newest = try XCTUnwrap(model.envelopes.first?.id, "the pile lists the new envelopes")
        try await model.discard(envelope: newest)
        XCTAssertEqual(model.badgeCount, 1, "a discard leaves a tombstone and takes one off")

        let last = try XCTUnwrap(model.envelopes.first?.id, "one envelope is left")
        try await model.discard(envelope: last)
        XCTAssertEqual(model.badgeCount, 0, "the last discard hides the badge")
    }

    /// An assign that explains the whole envelope tombstones it, so the count drops. An assign that
    /// leaves cards over only shrinks it, so the count stays. An undo brings the envelope back.
    func testAFullAssignLowersTheBadgeAPartialOneDoesNotAndUndoRestoresIt() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("whole", [("Urza's Saga", 1)]),
            OrphanedSandbox.env("part", [("Counterspell", 1), ("Black Lotus", 1)]),
        ]])
        let (model, _) = try await box.open()
        XCTAssertEqual(model.badgeCount, 2, "anchor: two live")

        try await model.assign(envelope: "part", to: OrphanedSandbox.a1)
        XCTAssertEqual(model.badgeCount, 2, "the Lotus is left, so the envelope stays live")

        try await model.assign(envelope: "whole", to: OrphanedSandbox.d1)
        XCTAssertEqual(model.badgeCount, 1, "the Saga envelope was explained whole")

        try await model.undoAssign()
        XCTAssertEqual(model.badgeCount, 2, "the undo puts it back")
    }
}
