// The merge notice on the Kit side (owner ruling, waiting page item 60, choice a; decision
// `native-reply-waits-generation`). SyncClient keeps the `stats` of the last adopted reply. `mergeNotice`
// is the bundle's mergeSummary for those stats, and it is nil until a reply with stats is adopted.
//
// Contract the tests name (the builder adds it; the tests do not):
//   @MainActor public final class SyncClient {
//       /// The merge sentence for the stats of the last adopted reply; nil when that reply carried none.
//       public private(set) var mergeNotice: String?
//   }
// mergeNotice is set in adopt(), next to `stats`, before the call that adopted the reply returns. The
// engine is an actor, so the builder awaits mergeSummary there. It does not compute it in a detached Task.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

final class MergeNoticeKitTests: SyncTestCase {
    /// The stats of a reply that takes one check-in from this device's ledger and gives back one of its own.
    /// The ledger the reply carries matches them: keyA is gone and keyC is new.
    static let replyStats = ["itemsAdded": 0, "checkInsAdded": 1, "envelopesAdded": 0, "stampsAdded": 0,
                             "checkInsRemoved": 1, "envelopesRemoved": 0, "stampsRemoved": 0]

    /// The stats of a reply that changed nothing: all seven kinds are zero, and the ledger it carries is the one sent.
    static let noChangeStats = ["itemsAdded": 0, "checkInsAdded": 0, "envelopesAdded": 0, "checkInsRemoved": 0,
                                "envelopesRemoved": 0, "stampsRemoved": 0, "stampsAdded": 0]

    // Nothing has been adopted yet, so there is no merge to tell about.
    func testNoNoticeBeforeAnyReplyIsAdopted() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        XCTAssertNil(client.stats, "anchor: no stats before a reply")
        XCTAssertNil(client.mergeNotice, "no reply adopted, so no merge notice")
    }

    // A POST answer with stats is adopted. The notice is the bundle's sentence for those stats, and a GET
    // reply, which carries no stats, leaves no notice behind.
    func testTheNoticeIsTheBundleSentenceForTheLastAdoptedReplysStats() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(
            okStats(try ledger(received: [Self.keyC: 1]), rev: 8, stats: Self.replyStats),
            ok(try ledger(received: [Self.keyC: 1]), rev: 9))

        let pushed = await client.push()
        XCTAssertEqual(pushed, .applied, "anchor: the reply with stats was adopted")
        XCTAssertEqual(client.stats, Self.replyStats, "anchor: the stats of that reply are kept")
        XCTAssertEqual(client.mergeNotice,
                       "Merged \u{2014} 1 check-in from the other device. Removed by the other device's later changes: un-checked 1 card.",
                       "the notice is mergeSummary of the adopted reply's stats")

        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied, "anchor: the GET reply was adopted")
        XCTAssertNil(client.stats, "anchor: a GET reply has no stats")
        XCTAssertNil(client.mergeNotice, "a GET reply has no notice, and the notice of the reply before does not stay")
    }

    // A POST answer whose stats are all zero adopted a merge that added and removed nothing. The web shows no
    // sentence for that (`changed` in src/app.jsx), so the notice is nil, though the bundle would give one.
    func testNoNoticeWhenTheAdoptedReplyAddedAndRemovedNothing() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(okStats(try ledger(received: [Self.keyA: 1]), rev: 8, stats: Self.noChangeStats))

        let pushed = await client.push()
        XCTAssertEqual(pushed, .applied, "anchor: the reply with stats was adopted")
        XCTAssertEqual(client.stats, Self.noChangeStats, "anchor: the all-zero stats of that reply are kept")
        XCTAssertNil(client.mergeNotice, "a merge that added and removed nothing has no notice")
    }

    // The sentence is the bundle's, not a Swift copy. A probe bundle whose mergeSummary states the stats it
    // was given shows the notice takes its text from the bundle, and the stats reach the bundle.
    func testTheNoticeComesFromTheBundlesMergeSummary() async throws {
        let probe = try RulesProbeBundle.make(
            #"Rules.mergeSummary=function(s){return "probe: "+s.checkInsAdded+" in, "+s.checkInsRemoved+" out"}"#)
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store, bundle: probe)
        net.enqueue(okStats(try ledger(received: [Self.keyC: 1]), rev: 8, stats: Self.replyStats))

        let pushed = await client.push()
        XCTAssertEqual(pushed, .applied, "anchor: the reply with stats was adopted")
        XCTAssertEqual(client.stats, Self.replyStats, "anchor: the stats reached the client")
        XCTAssertEqual(client.mergeNotice, "probe: 1 in, 1 out",
                       "the notice is the bundle's mergeSummary, given the adopted reply's stats")
    }
}
