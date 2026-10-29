// Card in Hand: the in-memory state of one hand session (duo-hand-model; governed by
// duo-card-in-hand, new-envelope-ends-an-envelope, orphaned-mail-never-decides and
// imports-merge-never-replace). The rules it calls are handHits and handStep in src/view-rules.mjs.
// Their contract is at the top of the V30 block in test/view-rules.test.mjs. Swift reaches them
// through RulesEngine, so the bundle is the one the web uses.
//
// CONTRACT these tests name:
//
//   @MainActor @Observable public final class HandModel {
//       public init(engine: RulesEngine, store: LedgerStore)
//       public private(set) var held: String?       // normName of a card held as a stray; nil when none
//       public private(set) var strays: [String]    // normNames released by newEnvelope; shown, never checked in, never decide;
//                                                   // a name leaves when a post checks it in
//       public private(set) var hits: [String]      // gk of each package holding the typed name, handHits order
//       public private(set) var offer: HandOffer?   // set only when the typed card names one open envelope
//       public private(set) var error: String?      // set when a post cannot save; the next save that works clears it
//       public func type(_ name: String) async throws  // runs handHits and handStep; writes nothing; calls in flight
//                                                      // together apply in call order (testOverlappingTypesReadEachOthersHeld)
//       public func post() async throws                 // writes offer.plan in one save, then clears offer and held
//       public func newEnvelope()                       // ends the current envelope: held moves to strays, offer clears; writes nothing
//       public func close()                             // the sheet closes: clears offer, keeps held and strays; writes nothing
//   }
//   public struct HandOffer: Equatable, Sendable { gk: String; plan: [PlanStep]; heldCopies: Int }
//                                                   // heldCopies: how many of the plan's copies are the held card's
//   PlanStep is the one in Orphaned.swift: itemKey and take.
//
// Behaviour the contract does not show:
//   - A held name clears on a post that names it, never on an offer. A post for a card unique to
//     another envelope keeps held (rules V32.12).
//   - A failed post keeps held and offer, sets error, and throws.
//   - A stale post (the store generation moved since type) saves nothing, drops the offer, keeps held,
//     sets error, and throws.
//   - One post is one save: one LedgerStore onLocalSave call, the store's own hook for a saved write.
//   - Typed text is the query for hits and the typed name for handStep. Blank text is not pinned here.
//   - Two type() calls in flight together end as if they ran one after the other: the later call reads the held name
//     the earlier one left, and a slow earlier call never overwrites a later call's hits, offer or held. The calls queue
//     in call order. A fix that drops the earlier reply instead (the epoch PastTransitModel keeps) fails
//     testOverlappingTypesReadEachOthersHeld on purpose: the dropped hold loses the held card.
//   - A type() still in flight when a post runs never brings back a held name the post checked in. Two fixes both pass:
//     post() waits for the type() ahead of it, or a type reply that a write has outdated is dropped. NOT pinned, as no
//     record rules on it: which of the two, and what a refused type() reports.
//   - A write that lands while a type() reads (a sync apply, a line tap) outdates the reply, but the typed card keeps its
//     hold: once it settles, the card's reply applies against the new generation, so the next post is not stale
//     (testWriteDuringATypeKeepsTheTypedHold*).
//   - New envelope ends every type() called before it, a call reading when it lands and a call queued behind one alike:
//     each drops its reply, and hits is empty (testNewEnvelopeDuringATypeDropsItsReply, testTypeQueuedBeforeNewEnvelopeNeverReachesTheNewOne).
//   - offer.heldCopies is the plan's copies beyond the typed card's own, and 0 when the hold stays or one copy is out
//     (the four testOfferHeldCopies* cases).
//
// Fake fixtures only. These tests read no Keychain item. Temp files live in PhotoTestKit's run folder.

import Foundation
import XCTest
@testable import ManifestKit

/// One loaded ledger folder, a store over it and a model.
@MainActor
struct HandFixture {
    let model: HandModel
    let store: LedgerStore
    let file: URL
    let dir: URL
}

/// Counts the store's saved writes, through its onLocalSave hook.
final class HandSaveCounter {
    var n = 0
}

@MainActor
final class HandModelTests: XCTestCase {
    static let t0: Double = 1_786_543_380_000

    // Alpha Cards (S1) holds the held name, Path to Exile and Counterspell. Beta Games (S2) holds the
    // held name too. Gamma Cards (S3) holds Sol Ring alone.
    static let bolt = "S1|0|pLightning Bolt"
    static let path = "S1|1|pPath to Exile"
    static let counter = "S1|2|pCounterspell"
    static let boltS2 = "S2|0|pLightning Bolt"
    static let sol = "S3|0|pSol Ring"

    static func item(_ order: String, _ seller: String, _ n: Int, _ name: String, date: String) -> [String: Any] {
        [
            "key": "\(order)|\(n)|p\(name)", "orderId": order, "seller": seller, "name": name,
            "set": "", "condition": "", "finish": "", "qty": 1, "price": 1,
            "date": date, "tracking": "with tracking", "line": "Magic",
        ]
    }

    static func items() -> [[String: Any]] {
        [
            item("S1", "Alpha Cards", 0, "Lightning Bolt", date: "2026-07-01"),
            item("S1", "Alpha Cards", 1, "Path to Exile", date: "2026-07-01"),
            item("S1", "Alpha Cards", 2, "Counterspell", date: "2026-07-01"),
            item("S2", "Beta Games", 0, "Lightning Bolt", date: "2026-07-02"),
            item("S3", "Gamma Cards", 0, "Sol Ring", date: "2026-07-03"),
        ]
    }

    /// `extra` adds lines to the shared fixture, for a case that needs more than it holds.
    static func seed(extra: [[String: Any]] = []) throws -> Data {
        try JSONSerialization.data(withJSONObject: ["mailday": 1, "items": items() + extra], options: [.sortedKeys])
    }

    static let stone = "S1|3|pMind Stone"
    static let stoneS2 = "S2|1|pMind Stone"

    /// Mind Stone in S1 and S2: a second name that two open envelopes share. `s1Qty` is how many copies S1 owes.
    static func mindStones(s1Qty: Int = 1) -> [[String: Any]] {
        var s1 = item("S1", "Alpha Cards", 3, "Mind Stone", date: "2026-07-01")
        s1["qty"] = s1Qty
        return [s1, item("S2", "Beta Games", 1, "Mind Stone", date: "2026-07-02")]
    }

    /// A ledger folder in this run's folder, loaded, with a model over it. The folder is removed at teardown.
    func makeHand(extra: [[String: Any]] = [], bundle: URL = RulesGoldenTests.bundleURL) async throws -> HandFixture {
        let dir = try PhotoTestKit.tempDir("hand")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let file = dir.appending(path: "ledger.json")
        try Self.seed(extra: extra).write(to: file)
        let store = LedgerStore(fileURL: file, now: { Self.t0 })
        try store.load()
        let model = HandModel(engine: try RulesEngine(bundleURL: bundle), store: store)
        return HandFixture(model: model, store: store, file: file, dir: dir)
    }

    /// The real rules bundle with one change: handStep takes 150 ms when `name` is typed (by default only when a name is
    /// already held too). That holds a type() inside its last engine call, so a test can land a write while the call is in flight.
    func slowHandStepBundle(typing name: String = "Lightning Bolt", needsHeld: Bool = true) throws -> URL {
        let dir = try PhotoTestKit.tempDir("hand-bundle")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let slow = """

        Rules.handStep=(function(o){return function(){if(\(needsHeld ? "arguments[3]!==null&&" : "")arguments[4]==="\(name)"){var t=Date.now();while(Date.now()-t<150){}}return o.apply(null,arguments)}})(Rules.handStep);
        """
        let url = dir.appending(path: "rules-slow.js")
        try (try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8) + slow).write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    /// The `received` counts the file holds now. An absent field reads as empty.
    func savedReceived(_ file: URL) throws -> [String: Int] {
        let json = try JSONSerialization.jsonObject(with: Data(contentsOf: file))
        let obj = try XCTUnwrap(json as? [String: Any])
        return (obj["received"] as? [String: Any] ?? [:]).compactMapValues { ($0 as? NSNumber)?.intValue }
    }

    /// Two packages hold the name, so it is held, and the held name is the only state that changes.
    func testSharedNameHeldNothingSaved() async throws {
        let h = try await makeHand()
        let before = try Data(contentsOf: h.file)
        try await h.model.type("Lightning Bolt")
        XCTAssertEqual(h.model.held, "lightning bolt", "a name two open envelopes share is held, as its normalized name")
        XCTAssertNil(h.model.offer, "a held shared name offers no post")
        XCTAssertEqual(h.model.hits, ["S2::Beta Games", "S1::Alpha Cards"], "both packages holding the name are listed, newest order first")
        XCTAssertEqual(h.store.received(), [:], "nothing is checked in")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "the ledger file is not written")
    }

    /// The next card names one envelope, so it offers a post. The offer holds the held copy and the typed copy.
    /// Nothing is written until the user posts.
    func testNextCardOffersPostNeverPostsAlone() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        let before = try Data(contentsOf: h.file)
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer, "the card names one open envelope, so it offers a post")
        XCTAssertEqual(offer.gk, "S1::Alpha Cards", "the offer names the envelope that holds both cards")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the offer takes the held copy and the typed copy, both from S1, and nothing else")
        XCTAssertEqual(h.model.held, "lightning bolt", "the held name stays held until the post")
        XCTAssertEqual(h.store.received(), [:], "the offer checks in nothing")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "the offer writes nothing")
    }

    /// A post checks in the held copy and the typed copy from the one envelope. Its other card and the other
    /// envelope's copy of the held name stay unchecked.
    func testPostChecksInHeldOnly() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        try await h.model.post()
        XCTAssertEqual(h.store.received(), [Self.bolt: 1, Self.path: 1], "only the held copy and the typed copy are checked in")
        XCTAssertNil(h.store.received()[Self.counter], "the envelope's other card stays unchecked")
        XCTAssertNil(h.store.received()[Self.boltS2], "the other envelope's copy of the held name stays unchecked")
        let saved = try savedReceived(h.file)
        XCTAssertEqual(saved, [Self.bolt: 1, Self.path: 1], "the file holds the same two counts")
        XCTAssertNil(h.model.held, "the post clears the held name")
        XCTAssertNil(h.model.offer, "the post clears the offer")
    }

    /// A held name stays held when the card typed next is unique to another envelope. The post checks in
    /// that card alone, and the held name still waits for the next card that decides it (rules V32.12).
    func testPostKeepsAStray() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Sol Ring")
        let offer = try XCTUnwrap(h.model.offer, "a card unique to one open envelope offers a post")
        XCTAssertEqual(offer.gk, "S3::Gamma Cards", "the offer names the envelope that holds the typed card")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.sol, take: 1)], "the offer takes the typed card alone")
        try await h.model.post()
        XCTAssertEqual(h.store.received(), [Self.sol: 1], "only the typed card is checked in")
        XCTAssertEqual(h.model.held, "lightning bolt", "the post for another envelope keeps the held name")
        XCTAssertNil(h.model.offer, "the post clears the offer")
    }

    /// A ledger write between type and post makes the offer stale. The post saves nothing, drops the offer,
    /// keeps the held name, sets error, and throws. `adopt` is what a sync reply does: it saves and moves the generation.
    func testStaleOfferSavesNothing() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        try h.store.adopt(try Self.seed())
        let before = try Data(contentsOf: h.file)
        let saves = HandSaveCounter()
        h.store.onLocalSave = { saves.n += 1 }
        do {
            try await h.model.post()
            XCTFail("a post on a stale offer must throw")
        } catch {}
        XCTAssertEqual(saves.n, 0, "a stale post saves nothing")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "the ledger file is not written by a stale post")
        XCTAssertEqual(h.store.received(), [:], "nothing is checked in")
        XCTAssertNil(h.model.offer, "a stale post drops the offer")
        XCTAssertEqual(h.model.held, "lightning bolt", "a stale post keeps the held name")
        XCTAssertNotNil(h.model.error, "a stale post sets the error")
    }

    /// A two-copy post is one save: one commit, so one onLocalSave call.
    func testOnePostIsOneSave() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        let saves = HandSaveCounter()
        h.store.onLocalSave = { saves.n += 1 }
        try await h.model.post()
        XCTAssertEqual(saves.n, 1, "a post that checks in two copies saves once")
        XCTAssertEqual(h.store.received(), [Self.bolt: 1, Self.path: 1], "both copies are checked in")
    }

    /// The New envelope control ends the envelope the held card waited on. The held name moves to the strays,
    /// shown and never checked in, and no longer decides. The next card posts only its own copy. Nothing is written.
    func testNewEnvelopeEndsEnvelope() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        let before = try Data(contentsOf: h.file)
        h.model.newEnvelope()
        XCTAssertNil(h.model.held, "the held name leaves the hold when the envelope ends")
        XCTAssertEqual(h.model.strays, ["lightning bolt"], "the released name is shown as a stray")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "ending an envelope writes nothing")
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer, "the typed card still names one envelope")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.path, take: 1)],
                       "the stray does not join the next envelope's post")
        try await h.model.post()
        XCTAssertEqual(h.store.received(), [Self.path: 1], "a later card does not post the stray")
    }

    /// An offer pending when the envelope ends dies with it (new-envelope-ends-an-envelope). The held name was
    /// part of that offer's plan, so a later post would check in the ended envelope's held card. The offer is
    /// asserted real first, so the case cannot pass by never having had one.
    func testNewEnvelopeDropsPendingOffer() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer, "the setup is real: the second card names one envelope, so an offer is pending")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the pending offer holds the held copy, the one a surviving offer would check in")
        let before = try Data(contentsOf: h.file)
        let saves = HandSaveCounter()
        h.store.onLocalSave = { saves.n += 1 }
        h.model.newEnvelope()
        XCTAssertNil(h.model.offer, "the end of the envelope drops the pending offer")
        try await h.model.post()
        XCTAssertEqual(saves.n, 0, "a post after the envelope ended saves nothing")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "the ledger file is not written")
        XCTAssertEqual(h.store.received(), [:], "the ended envelope's held card is not checked in")
    }

    /// A post that cannot save throws and rolls back. The held name and the offer stay, so the post can be tried
    /// again, and the error shows. Once the save works, the same post lands.
    func testFailedSaveRollsBack() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer)
        try FileManager.default.removeItem(at: h.dir)  // the atomic write now has no folder to land in
        do {
            try await h.model.post()
            XCTFail("a post that cannot save must throw")
        } catch {}
        XCTAssertEqual(h.store.received(), [:], "the store rolls back: nothing is checked in")
        XCTAssertEqual(h.model.held, "lightning bolt", "the held name is kept")
        XCTAssertEqual(h.model.offer, offer, "the offer is kept")
        XCTAssertNotNil(h.model.error, "the failed save shows an error")

        try FileManager.default.createDirectory(at: h.dir, withIntermediateDirectories: true)
        try Self.seed().write(to: h.file)
        try await h.model.post()
        XCTAssertEqual(try savedReceived(h.file), [Self.bolt: 1, Self.path: 1], "the same post lands once the save works")
        XCTAssertNil(h.model.error, "the next save that works clears the error")
        XCTAssertNil(h.model.held, "the post clears the held name")
    }

    /// Closing the sheet drops a pending offer and keeps the held name. The next card still decides it.
    func testHeldCardsStayHeldOnClose() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        let before = try Data(contentsOf: h.file)
        h.model.close()
        XCTAssertEqual(h.model.held, "lightning bolt", "the held name survives the close")
        XCTAssertNil(h.model.offer, "the close drops the pending offer")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "closing writes nothing")
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer, "the next card still decides the held name")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the held copy comes back with the decision")
    }

    // MARK: strays, and typed names in call order (new-envelope-ends-an-envelope; the order is pinned by the two overlapping-type cases below)

    /// A name New envelope released is a stray. When it is held again and a post checks it in, the ledger shows it
    /// received, so it leaves the strays. A stray no post named stays: Mind Stone is the second stray, so a post that
    /// cleared every stray fails here. Checked after the post only, as no record says when a retyped stray leaves.
    func testPostedNameLeavesStrays() async throws {
        let h = try await makeHand(extra: Self.mindStones())
        for name in ["Lightning Bolt", "Mind Stone"] {
            try await h.model.type(name)
            h.model.newEnvelope()
        }
        XCTAssertEqual(h.model.strays, ["lightning bolt", "mind stone"], "the setup is real: both names were released as strays")
        try await h.model.type("Lightning Bolt")
        XCTAssertEqual(h.model.held, "lightning bolt", "the retyped stray is held again")
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer, "the setup is real: the next card names S1, so a post is offered")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the setup is real: the offer takes the retyped copy as well")
        try await h.model.post()
        XCTAssertEqual(h.store.received(), [Self.bolt: 1, Self.path: 1], "the post checked the retyped name in")
        XCTAssertEqual(h.model.strays, ["mind stone"], "the checked-in name leaves the strays, and the stray no post named stays")
    }

    /// Two type() calls started together end as if the second ran after the first: it reads the name the first
    /// held, so its offer takes both copies. Run on its own, the second call would offer its own copy only.
    func testOverlappingTypesReadEachOthersHeld() async throws {
        let h = try await makeHand()
        let first = Task { try await h.model.type("Lightning Bolt") }
        let second = Task { try await h.model.type("Path to Exile") }
        try await first.value
        try await second.value
        let offer = try XCTUnwrap(h.model.offer, "the second card names one envelope, so it offers a post")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the offer takes the copy the first call held, not the second card alone")
        XCTAssertEqual(h.model.held, "lightning bolt", "the held name stays held until the post")
        XCTAssertEqual(h.model.hits, ["S1::Alpha Cards"], "the hits are the second card's")
    }

    /// A slow earlier call never overwrites a later call's hits, offer or held. A refunded stamp makes the rules input
    /// need one more engine call (LiveItems.of runs groupPackages), so the call that starts while the stamp stands has
    /// more to wait for than the call that starts after it is gone. The stamp names no real package. The two cards are
    /// unrelated, so held plays no part: only the order of the replies decides the end state.
    /// The later call runs inline, so it starts before the slow call can take its next step.
    func testSlowEarlierTypeNeverOverwritesLaterOne() async throws {
        let h = try await makeHand()
        h.store.setStamp("Z9::Nobody", kind: "refunded", note: "", at: "2026-07-01")
        let slow = Task { try await h.model.type("Sol Ring") }
        await Task.yield()  // the slow call starts and reads the stamp
        h.store.removeStamp("Z9::Nobody")
        try await h.model.type("Counterspell")
        try await slow.value
        let offer = try XCTUnwrap(h.model.offer, "the later card names one envelope, so it offers a post")
        XCTAssertEqual(offer.gk, "S1::Alpha Cards", "the offer is the later call's, not the slow call's Sol Ring")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.counter, take: 1)], "the offer takes the later card alone")
        XCTAssertEqual(h.model.hits, ["S1::Alpha Cards"], "the hits are the later call's")
        XCTAssertNil(h.model.held, "the later call holds nothing")
    }

    /// A type() still in flight when a post runs never brings back the held name that post checked in. The in-flight
    /// call read the held name and the received map before the post, so its reply, applied after the post, holds a
    /// name the ledger already counts. The slow
    /// bundle keeps that call inside its last engine call while the post runs, 60 ms in. Either order is allowed:
    /// the post first, or the type first and the post then finding no offer. Nothing is left half posted.
    func testTypeInFlightNeverRevivesWhatAPostCheckedIn() async throws {
        let h = try await makeHand(bundle: try slowHandStepBundle())
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        XCTAssertEqual(try XCTUnwrap(h.model.offer, "the setup is real: a post is pending").plan,
                       [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)])
        let inFlight = Task { try await h.model.type("Lightning Bolt") }
        try await Task.sleep(for: .milliseconds(60))
        try await h.model.post()
        do { try await inFlight.value } catch {}  // a fix may refuse the outdated reply
        let got = h.store.received()
        XCTAssertTrue(got.isEmpty || got == [Self.bolt: 1, Self.path: 1], "the post left the ledger half posted: \(got)")
        XCTAssertFalse(got[Self.bolt] == 1 && h.model.held == "lightning bolt",
                       "the held name came back after a post checked its copy in")
    }

    // MARK: a write or New envelope landing while a type() reads

    /// Polls up to 3 s for `cond`, so a reply that settles after type() returned is still caught. It asserts nothing.
    func eventually(_ cond: @escaping @MainActor () -> Bool) async throws {
        for _ in 0..<60 {
            if cond() { return }
            try await Task.sleep(for: .milliseconds(50))
        }
    }

    /// The first card is typed while `write` lands in the store, with the call inside its slow handStep. The write moves the
    /// generation, so the call's reply is outdated. The card must still end held, and its reply must be the one that
    /// stands: the next card offers both copies and its post is not stale. A fix that drops the reply and keeps nothing
    /// loses the hold, so the next card offers its own copy alone.
    func holdSurvivesAWrite(_ write: (HandFixture) throws -> Void) async throws {
        let h = try await makeHand(bundle: try slowHandStepBundle(typing: "Lightning Bolt", needsHeld: false))
        let inFlight = Task { try await h.model.type("Lightning Bolt") }
        try await Task.sleep(for: .milliseconds(60))  // the call is inside its slow handStep
        XCTAssertNil(h.model.held, "the setup is real: the call is still reading when the write lands")
        let gen = h.store.generation
        try write(h)
        XCTAssertGreaterThan(h.store.generation, gen, "the setup is real: the write moved the generation under the call")
        _ = try? await inFlight.value  // a fix may settle the call later or refuse the first reply; the end state decides
        try await eventually { h.model.held == "lightning bolt" }
        XCTAssertEqual(h.model.held, "lightning bolt", "the typed card keeps its hold across a write that landed while it was read")
        XCTAssertEqual(h.model.hits, ["S2::Beta Games", "S1::Alpha Cards"], "the typed card's hits are shown")
        try await h.model.type("Path to Exile")
        XCTAssertEqual(h.model.offer?.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the next card offers the held copy as well: the hold was not lost")
        do { try await h.model.post() } catch { XCTFail("the settled reply applies against the new generation, so the post is not stale: \(error)") }
        XCTAssertEqual(h.store.received()[Self.bolt], 1, "the post checked the held copy in")
        XCTAssertEqual(h.store.received()[Self.path], 1, "the post checked the typed copy in")
    }

    /// A sync apply lands while the card is read.
    func testWriteDuringATypeKeepsTheTypedHoldAfterASyncApply() async throws {
        try await holdSurvivesAWrite { try $0.store.adopt(try Self.seed()) }
    }

    /// A line tap lands while the card is read. Sol Ring is in another envelope, so only the generation moves.
    func testWriteDuringATypeKeepsTheTypedHoldAfterALineTap() async throws {
        try await holdSurvivesAWrite { try $0.store.commitReceived(Self.sol, count: 1) }
    }

    /// New envelope lands while a card is read. The reply belongs to the ended envelope, so it is dropped: no offer, no
    /// held name, no stray. The hits the ended envelope's last card showed are gone too, not left standing. The earlier
    /// card is asserted real first, so the case cannot pass by never having had hits.
    func testNewEnvelopeDuringATypeDropsItsReplyAndEmptiesHits() async throws {
        let h = try await makeHand(bundle: try slowHandStepBundle(typing: "Sol Ring", needsHeld: false))
        try await h.model.type("Counterspell")
        XCTAssertEqual(h.model.hits, ["S1::Alpha Cards"], "the setup is real: the earlier card left hits standing")
        let inFlight = Task { try await h.model.type("Sol Ring") }
        try await Task.sleep(for: .milliseconds(60))  // the call is inside its slow handStep
        h.model.newEnvelope()
        _ = try? await inFlight.value
        XCTAssertEqual(h.model.hits, [], "the ended envelope's hits are gone, and the dropped reply's are not shown")
        XCTAssertNil(h.model.offer, "the dropped reply offers nothing")
        XCTAssertNil(h.model.held, "the dropped reply holds nothing")
        XCTAssertEqual(h.model.strays, [], "nothing was held, so nothing is released")
    }

    /// A type() called before New envelope belongs to the envelope that ended, even when it is still queued behind a
    /// slow call as the envelope ends. Its reply must not reach the new envelope: a late read of the envelope counter
    /// takes the bumped value as its own and applies. The slow first call keeps the second queued while New envelope lands.
    func testTypeQueuedBeforeNewEnvelopeNeverReachesTheNewOne() async throws {
        let h = try await makeHand(bundle: try slowHandStepBundle(typing: "Lightning Bolt", needsHeld: false))
        let slow = Task { try await h.model.type("Lightning Bolt") }
        let queued = Task { try await h.model.type("Path to Exile") }
        try await Task.sleep(for: .milliseconds(60))  // the first call is inside its slow handStep, the second waits behind it
        h.model.newEnvelope()
        _ = try? await slow.value
        _ = try? await queued.value
        XCTAssertNil(h.model.offer, "the queued card was typed for the ended envelope, so it offers nothing to the new one")
        XCTAssertEqual(h.model.hits, [], "the queued card's hits are not shown on the new envelope")
        XCTAssertNil(h.model.held, "nothing is held on the new envelope")
        XCTAssertEqual(h.model.strays, [], "the dropped replies release nothing")
        XCTAssertEqual(h.store.received(), [:], "nothing is checked in")
    }

    // MARK: the held count on an offer (what the post button shows; HandScreen reads offer.heldCopies)

    /// Every case here is a guard on the old code: they pin the count before its source moves out of HandModel into the rules.
    /// The held card and the typed card post together: one of the two copies is the held card's.
    func testOfferHeldCopiesCountsTheHeldCardPostedWithTheTyped() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        XCTAssertEqual(h.model.offer?.plan, [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)],
                       "the setup is real: the offer takes both copies")
        XCTAssertEqual(h.model.offer?.heldCopies, 1, "one of the two copies is the held card's")
    }

    /// The hold stays when the typed card names another envelope: the offer carries the typed copy alone.
    func testOfferHeldCopiesIsZeroWhenTheHoldStays() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Sol Ring")
        XCTAssertEqual(h.model.offer?.plan, [PlanStep(itemKey: Self.sol, take: 1)], "the setup is real: the offer takes the typed copy alone")
        XCTAssertEqual(h.model.held, "lightning bolt", "the hold stays")
        XCTAssertEqual(h.model.offer?.heldCopies, 0, "no copy of the offer is the held card's")
    }

    /// The same name twice: S1 owes two Mind Stones and S2 one, so the first card is held. S2's copy is then checked in by
    /// a line tap, which leaves S1 the only envelope. The held name typed again is two cards, so the offer takes both copies.
    func testOfferHeldCopiesCountsTheSameNameTypedTwice() async throws {
        let h = try await makeHand(extra: Self.mindStones(s1Qty: 2))
        try await h.model.type("Mind Stone")
        XCTAssertEqual(h.model.held, "mind stone", "the setup is real: two open envelopes share the name, so it is held")
        try h.store.commitReceived(Self.stoneS2, count: 1)
        try await h.model.type("Mind Stone")
        XCTAssertEqual(h.model.offer?.gk, "S1::Alpha Cards", "the name now names one envelope")
        XCTAssertEqual(h.model.offer?.plan, [PlanStep(itemKey: Self.stone, take: 2)], "both typed cards are copies of the one line")
        XCTAssertEqual(h.model.offer?.heldCopies, 1, "one of the two copies is the held card's")
    }

    /// The same set-up with one of S1's two copies already checked in: one copy is left out, so the offer takes one and
    /// none of it is the held card's. The line's own tap checks that copy in, so the post needs no button.
    func testOfferHeldCopiesIsZeroWhenOneCopyIsLeftOut() async throws {
        let h = try await makeHand(extra: Self.mindStones(s1Qty: 2))
        try await h.model.type("Mind Stone")
        XCTAssertEqual(h.model.held, "mind stone", "the setup is real: the name is held")
        try h.store.commitReceived(Self.stoneS2, count: 1)
        try h.store.commitReceived(Self.stone, count: 1)
        try await h.model.type("Mind Stone")
        XCTAssertEqual(h.model.offer?.plan, [PlanStep(itemKey: Self.stone, take: 1)], "the offer is capped at the one copy left out")
        XCTAssertEqual(h.model.offer?.heldCopies, 0, "the offer carries no held copy")
    }
}
