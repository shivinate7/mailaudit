// Milestone before a server apply (lane N9, native-build-lanes, milestones-taken-before-risk,
// merge-readopts-sync-generation, imports-merge-never-replace). The contract is in
// VersionTestSupport.swift.
//
// A milestone is taken only in front of an apply that removes something: a card count lowered or
// cleared, a live envelope tombstoned, a stamp removed. An apply that only adds takes none. These
// run through the real SyncClient, so a helper the client never calls cannot make them pass. Each
// case first sends a push the Worker echoes (so the ledger is "carried" and the next reply is
// adopted whole), then adopts one later reply.
//
// Fake fixtures only: the keys come from SyncTestCase, the Keychain is FakeKeychain and the
// network is StubNet under .invalid.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class VersionSyncTests: SyncTestCase {
    typealias Box = VersionSandbox

    var versionsDir: URL { dir.appending(path: "versions") }

    func versioned() throws -> (store: LedgerStore, versions: VersionStore) {
        let vs = VersionStore(directory: versionsDir, now: { Self.t0 })
        let store = LedgerStore(fileURL: ledgerURL, now: { Self.t0 }, versions: vs)
        try store.load()
        return (store, vs)
    }

    /// The device holds `local` and has pushed it (the Worker echoes it). Then `reply` arrives on a
    /// pull and is adopted. Returns what the store held just before that apply.
    func applyReply(local: [String: Any], reply: [String: Any]) async throws
        -> (store: LedgerStore, versions: VersionStore, before: [String: Any])
    {
        try JSONSerialization.data(withJSONObject: local, options: [.sortedKeys]).write(to: ledgerURL)
        let (store, vs) = try versioned()
        let client = try makeClient(store)
        net.enqueue(ok(local))
        let pushed = await client.push()
        XCTAssertEqual(pushed, .applied, "anchor: the echo was adopted")
        XCTAssertEqual(try vs.list(), [], "anchor: an echo removes nothing, so it takes no milestone")
        let before = store.snapshot()
        net.enqueue(ok(reply, rev: 2))
        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied, "anchor: the later reply was adopted")
        return (store, vs, before)
    }

    /// The one "before sync" milestone, holding the whole document as it stood before the apply.
    func assertOneMilestone(_ vs: VersionStore, held before: [String: Any], _ what: String, line: UInt = #line) throws {
        let all = try vs.list()
        XCTAssertEqual(all.count, 1, "\(what): one milestone", line: line)
        guard let m = all.first else { return }
        XCTAssertEqual(m.label, "before sync", what, line: line)
        XCTAssertEqual(m.kind, "milestone", what, line: line)
        let held = try JSONSerialization.jsonObject(with: vs.data(for: m.id))
        XCTAssertEqual(Box.canon(held), Box.canon(before), "\(what): the ledger as it stood before the apply", line: line)
    }

    // MARK: removals take a milestone first

    /// Another device un-checked a card: absent from `received`, with a later time.
    func testAReplyThatUnChecksACardTakesAMilestoneFirst() async throws {
        let local = try ledger(received: [Self.keyA: 1])
        let reply = try ledger(extra: ["receivedAt": [Self.keyA: Self.t0 + 5_000]])
        let (store, vs, before) = try await applyReply(local: local, reply: reply)
        XCTAssertEqual(store.received(), [:], "anchor: the un-check was applied")
        XCTAssertNotNil((before["received"] as? [String: Any])?[Self.keyA], "anchor: the milestone must hold the card")
        try assertOneMilestone(vs, held: before, "an un-check")
    }

    /// Two copies became one: lowered, not cleared.
    func testAReplyThatLowersACountTakesAMilestone() async throws {
        let local = try ledger(received: [Self.keyA: 3])
        let reply = try ledger(received: [Self.keyA: 2])
        let (store, vs, before) = try await applyReply(local: local, reply: reply)
        XCTAssertEqual(store.received(), [Self.keyA: 2], "anchor: the lower count was applied")
        try assertOneMilestone(vs, held: before, "a lowered count")
    }

    /// One card un-checked and another checked in: the total does not move, and something was removed.
    func testAReplyThatRemovesOneCardAndAddsAnotherTakesAMilestone() async throws {
        let local = try ledger(received: [Self.keyA: 1])
        let reply = try ledger(received: [Self.keyB: 1], extra: ["receivedAt": [Self.keyA: Self.t0 + 5_000, Self.keyB: Self.t0 + 5_000]])
        let (store, vs, before) = try await applyReply(local: local, reply: reply)
        XCTAssertEqual(store.received(), [Self.keyB: 1], "anchor: the swap was applied")
        try assertOneMilestone(vs, held: before, "a swap")
    }

    func testAReplyThatDiscardsAnEnvelopeTakesAMilestone() async throws {
        let local = try ledger(extra: ["envelopes": [Box.env("e1", [("Counterspell", 1)])]])
        let reply = try ledger(extra: ["envelopes": [Box.tombstone("e1", at: Self.t0 + 5_000)]])
        let (store, vs, before) = try await applyReply(local: local, reply: reply)
        XCTAssertNotNil((store.snapshot()["envelopes"] as? [[String: Any]])?.first?["deletedAt"], "anchor: the discard was applied")
        try assertOneMilestone(vs, held: before, "a discarded envelope")
    }

    /// A removed stamp is not deleted: it stays with kind "" so the removal can travel.
    func testAReplyThatRemovesAStampTakesAMilestone() async throws {
        let local = try ledger(extra: ["stamps": [Box.pkgA: Box.stamp("refunded")]])
        let reply = try ledger(extra: ["stamps": [Box.pkgA: Box.stamp("", updatedAt: Self.t0 + 5_000)]])
        let (store, vs, before) = try await applyReply(local: local, reply: reply)
        XCTAssertEqual(store.stamps()[Box.pkgA]?["kind"] as? String, "", "anchor: the removal was applied")
        try assertOneMilestone(vs, held: before, "a removed stamp")
    }

    // MARK: additions take none

    /// More check-ins, a new envelope and a new stamp, and nothing taken away. A milestone here would
    /// spend a slot on every ordinary sync.
    func testAReplyThatOnlyAddsTakesNoMilestone() async throws {
        let local = try ledger(received: [Self.keyA: 1])
        let reply = try ledger(
            received: [Self.keyA: 2, Self.keyB: 1],
            extra: ["envelopes": [Box.env("e2", [("Brainstorm", 1)])], "stamps": [Box.pkgA: Box.stamp("partial")]])
        let (store, vs, _) = try await applyReply(local: local, reply: reply)
        XCTAssertEqual(store.received(), [Self.keyA: 2, Self.keyB: 1], "anchor: the additions were applied")
        XCTAssertEqual(try vs.list(), [], "an apply that only adds takes no milestone")
    }
}
