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
//       public func newEnvelope()                       // ends the current envelope: held moves to strays, offer and hits clear; writes nothing
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
import JavaScriptCore
import XCTest
@testable import ManifestKit

/// One loaded ledger folder, a store over it and a model.
@MainActor
struct HandFixture {
    let model: HandModel
    let store: LedgerStore
    let engine: RulesEngine
    let file: URL
    let dir: URL
}

/// Counts the store's saved writes, through its onLocalSave hook.
final class HandSaveCounter {
    var n = 0
}

/// Holds a rules call inside its handStep until the test lets go. The gated bundle calls `__gate()` there, and the call
/// blocks in it on the engine's thread, with no clock to race. It is a latch: once opened it stays open, so a read that
/// runs again passes straight through. The wait is capped at 10 s, so a gate nobody opens cannot block an engine thread for good.
final class HandStepGate: @unchecked Sendable {
    private let cond = NSCondition()
    private var isEntered = false
    private var isOpen = false

    /// True once a call is blocked in the gate. A poll reads it on the main actor and never waits on it there: a call
    /// hops back to the main actor between its engine calls.
    var entered: Bool { cond.lock(); defer { cond.unlock() }; return isEntered }

    /// Runs on the engine's thread, inside the JS call.
    func hold() {
        cond.lock()
        defer { cond.unlock() }
        isEntered = true
        let deadline = Date(timeIntervalSinceNow: 10)
        while !isOpen && cond.wait(until: deadline) {}
    }

    func open() {
        cond.lock()
        isOpen = true
        cond.broadcast()
        cond.unlock()
    }

    /// The JS function `__gate`. It is built here, off the main actor: a block made inside a @MainActor test is main-actor
    /// isolated and traps when JavaScriptCore calls it from the engine's thread.
    var jsFunction: @convention(block) () -> Void { { [self] in hold() } }
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

    static func item(_ order: String, _ seller: String, _ n: Int, _ name: String, date: String, qty: Int = 1) -> [String: Any] {
        [
            "key": "\(order)|\(n)|p\(name)", "orderId": order, "seller": seller, "name": name,
            "set": "", "condition": "", "finish": "", "qty": qty, "price": 1,
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
        let engine = try RulesEngine(bundleURL: bundle)
        let model = HandModel(engine: engine, store: store)
        return HandFixture(model: model, store: store, engine: engine, file: file, dir: dir)
    }

    /// The real rules bundle with one change: handStep calls the global `__gate()` when `name` is typed (by default only when a
    /// name is already held too). The call blocks there, inside its last engine call, until a test opens the gate.
    func gatedHandStepBundle(typing name: String, needsHeld: Bool) throws -> URL {
        let dir = try PhotoTestKit.tempDir("hand-bundle")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let gated = """

        Rules.handStep=(function(o){return function(){if(\(needsHeld ? "arguments[3]!==null&&" : "")arguments[4]==="\(name)"){__gate()}return o.apply(null,arguments)}})(Rules.handStep);
        """
        let url = dir.appending(path: "rules-gated.js")
        try (try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8) + gated).write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    /// A hand whose handStep blocks on the returned gate when `name` is typed. A case starts the call, waits for it to enter the gate
    /// (`waitForGate`), acts while the call is held there, then opens the gate. The gate also opens at teardown, so a failed case
    /// leaves no engine thread blocked.
    /// RulesEngine keeps its JSContext private and has no hook for a test. Mirror reaches it with no product code, and a renamed
    /// field fails here with the message below, never as a pass.
    func makeGatedHand(typing name: String = "Lightning Bolt", needsHeld: Bool = true) async throws -> (hand: HandFixture, gate: HandStepGate) {
        let h = try await makeHand(bundle: try gatedHandStepBundle(typing: name, needsHeld: needsHeld))
        let gate = HandStepGate()
        addTeardownBlock { gate.open() }
        let core = try XCTUnwrap(Mirror(reflecting: h.engine).children.first { $0.label == "core" }?.value as? RulesCore,
                                 "RulesEngine no longer keeps its RulesCore in a field named core")
        let context = try XCTUnwrap(Mirror(reflecting: core).children.first { $0.label == "context" }?.value as? JSContext,
                                    "RulesCore no longer keeps its JSContext in a field named context")
        context.setObject(unsafeBitCast(gate.jsFunction, to: AnyObject.self), forKeyedSubscript: "__gate" as NSString)
        return (h, gate)
    }

    /// Waits until a call is blocked in the gate. That proves the setup the cases name: the call has read the ledger generation, the
    /// held name and the received map, and sits in its last engine call. It polls (`eventually`, 3 s) and never blocks the main actor.
    func waitForGate(_ gate: HandStepGate) async throws {
        try await eventually { gate.entered }
        XCTAssertTrue(gate.entered, "the setup is real: the call entered its handStep and is held there")
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

    /// A shared name held on the answer page shows its tie. New envelope releases the name, so the tie leaves the answer
    /// page with it: the answer page must not keep asking for the next card from the ended envelope. The strays are
    /// asserted first, so the case cannot pass by the envelope never having ended.
    func testNewEnvelopeClearsTheTieOnTheAnswerPage() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        XCTAssertEqual(h.model.hits, ["S2::Beta Games", "S1::Alpha Cards"], "the setup is real: the shared name shows its tie before New envelope")
        h.model.newEnvelope()
        XCTAssertEqual(h.model.strays, ["lightning bolt"], "the setup is real: New envelope released the held name")
        XCTAssertEqual(h.model.hits, [], "New envelope left the tie in hits, so the answer page still asks for the next card from the ended envelope")
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
    /// name the ledger already counts. The gated
    /// bundle holds that call inside its last engine call while the post runs. Either order is allowed:
    /// the post first, or the type first and the post then finding no offer. Nothing is left half posted.
    func testTypeInFlightNeverRevivesWhatAPostCheckedIn() async throws {
        let (h, gate) = try await makeGatedHand()
        try await h.model.type("Lightning Bolt")
        try await h.model.type("Path to Exile")
        XCTAssertEqual(try XCTUnwrap(h.model.offer, "the setup is real: a post is pending").plan,
                       [PlanStep(itemKey: Self.bolt, take: 1), PlanStep(itemKey: Self.path, take: 1)])
        let inFlight = Task { try await h.model.type("Lightning Bolt") }
        try await waitForGate(gate)
        try await h.model.post()
        gate.open()
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

    /// The first card is typed while `write` lands in the store, with the call held inside its handStep. The write moves the
    /// generation, so the call's reply is outdated. The card must still end held, and its reply must be the one that
    /// stands: the next card offers both copies and its post is not stale. A fix that drops the reply and keeps nothing
    /// loses the hold, so the next card offers its own copy alone.
    func holdSurvivesAWrite(_ write: (HandFixture) throws -> Void) async throws {
        let (h, gate) = try await makeGatedHand(needsHeld: false)
        let inFlight = Task { try await h.model.type("Lightning Bolt") }
        try await waitForGate(gate)
        XCTAssertNil(h.model.held, "the setup is real: the call is still reading when the write lands")
        let gen = h.store.generation
        try write(h)
        XCTAssertGreaterThan(h.store.generation, gen, "the setup is real: the write moved the generation under the call")
        gate.open()
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
        let (h, gate) = try await makeGatedHand(typing: "Sol Ring", needsHeld: false)
        try await h.model.type("Counterspell")
        XCTAssertEqual(h.model.hits, ["S1::Alpha Cards"], "the setup is real: the earlier card left hits standing")
        let inFlight = Task { try await h.model.type("Sol Ring") }
        try await waitForGate(gate)
        h.model.newEnvelope()
        gate.open()
        _ = try? await inFlight.value
        XCTAssertEqual(h.model.hits, [], "the ended envelope's hits are gone, and the dropped reply's are not shown")
        XCTAssertNil(h.model.offer, "the dropped reply offers nothing")
        XCTAssertNil(h.model.held, "the dropped reply holds nothing")
        XCTAssertEqual(h.model.strays, [], "nothing was held, so nothing is released")
    }

    /// A type() called before New envelope belongs to the envelope that ended, even when it is still queued behind a
    /// slow call as the envelope ends. Its reply must not reach the new envelope: a late read of the envelope counter
    /// takes the bumped value as its own and applies. The held first call keeps the second queued while New envelope lands.
    func testTypeQueuedBeforeNewEnvelopeNeverReachesTheNewOne() async throws {
        let (h, gate) = try await makeGatedHand(needsHeld: false)
        let slow = Task { try await h.model.type("Lightning Bolt") }
        let queued = Task { try await h.model.type("Path to Exile") }
        try await waitForGate(gate)  // the first call is held in its handStep, the second waits behind it
        h.model.newEnvelope()
        gate.open()
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

    // MARK: Today's pile and Not normal today (duo-card-in-hand)
    //
    // The pile lists each envelope with a copy checked in since local midnight. A row totals the whole envelope, so a copy
    // checked in yesterday counts toward today's row. An envelope with no check-in today is not in the pile, so it is never
    // listed as short. Not normal today lists the short rows with the copies still owed, and says All is well only when no
    // row is short and no envelope is past 14 days. An unknown past count is never All is well (ux-unknown-is-not-empty).

    /// A fixed UTC-6 calendar, so no case reads the machine's zone.
    static let fixtureCalendar: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(secondsFromGMT: -6 * 3600) ?? .gmt
        return c
    }()
    /// `t0` as a Date: 08:03 on the fixture day at UTC-6.
    static let fixtureDate = Date(timeIntervalSince1970: HandModelTests.t0 / 1000)
    /// 00:00 at UTC-6 on the fixture day, in the store's milliseconds: 28 980 000 ms before t0.
    static let localMidnight: Double = HandModelTests.t0 - 28_980_000
    static let ponder = "S4|0|pPonder"
    static let tomb = "S4|1|pAncient Tomb"

    /// Delta Cards holds four copies of Ponder: the one multi-copy line the envelope totals need.
    static func deltaPonder() -> [[String: Any]] {
        [item("S4", "Delta Cards", 0, "Ponder", date: "2026-07-01", qty: 4)]
    }

    /// Delta Cards also holds two copies of Ancient Tomb, so one envelope can owe two cards at once.
    static func deltaTomb() -> [[String: Any]] {
        [item("S4", "Delta Cards", 1, "Ancient Tomb", date: "2026-07-01", qty: 2)]
    }

    /// Stamps a line's check-in at `ms`, as a write in the store would. Nothing is saved: the pile reads the store's memory.
    static func checkIn(_ h: HandFixture, _ key: String, _ count: Int, at ms: Double) {
        h.store.setReceived(key, count: count, at: ms)
    }

    /// Every line of the fixture ledger checked in today, so every envelope is whole: the full-size state of the pile.
    static func checkEverythingInToday(_ h: HandFixture) {
        for (key, count) in [(bolt, 1), (path, 1), (counter, 1), (boltS2, 1), (sol, 1), (ponder, 4)] {
            checkIn(h, key, count, at: localMidnight + 60_000)
        }
    }

    /// The row of one envelope in the pile. A missing row fails with the envelope's key.
    static func row(_ rows: [HandDayRow], _ gk: String) throws -> HandDayRow {
        try XCTUnwrap(rows.first { $0.gk == gk }, "today's pile has no row for \(gk)")
    }

    func pile(_ h: HandFixture) async throws -> [HandDayRow] {
        try await h.model.todaysPile(now: Self.fixtureDate, calendar: Self.fixtureCalendar)
    }

    func notNormal(_ h: HandFixture, pastCount: Int? = 0) async throws -> HandNotNormal {
        try await h.model.notNormalToday(now: Self.fixtureDate, calendar: Self.fixtureCalendar, pastCount: pastCount)
    }

    /// Nothing is checked in: the pile is empty, so the empty query keeps the start hint.
    func testNoPileBeforeAnyCheckInToday() async throws {
        let h = try await makeHand()
        let rows = try await pile(h)
        XCTAssertEqual(rows, [], "an envelope is in today's pile though no line is checked in")
    }

    /// The cases below test the pile's cut, not the fixture's arithmetic, so the fixture's midnight is checked first.
    func testFixtureMidnightIsTheCalendarsStartOfTheDay() {
        XCTAssertEqual(Self.fixtureCalendar.startOfDay(for: Self.fixtureDate).timeIntervalSince1970 * 1000, Self.localMidnight,
                       "the fixture's midnight is not the start of the fixture day at UTC-6")
    }

    /// Envelopes checked into since local midnight are in the pile. A check-in from yesterday, and an envelope nobody checked into, are not.
    func testPileListsOnlyEnvelopesCheckedInSinceMidnight() async throws {
        let h = try await makeHand()
        Self.checkIn(h, Self.path, 1, at: Self.localMidnight + 60_000)
        Self.checkIn(h, Self.sol, 1, at: Self.localMidnight - 60_000)
        let rows = try await pile(h)
        XCTAssertEqual(rows.map(\.gk), ["S1::Alpha Cards"],
                       "the pile is not the one envelope checked into since midnight: Gamma's check-in is from yesterday and Beta has none")
    }

    /// Midnight counts to the millisecond: a check-in stamped at local midnight is today's, one millisecond earlier is yesterday's.
    func testPileCutIsLocalMidnightToTheMillisecond() async throws {
        let h = try await makeHand()
        Self.checkIn(h, Self.path, 1, at: Self.localMidnight)
        Self.checkIn(h, Self.sol, 1, at: Self.localMidnight - 1)
        let rows = try await pile(h)
        XCTAssertEqual(rows.map(\.gk), ["S1::Alpha Cards"], "the pile's cut is not local midnight to the millisecond")
    }

    /// plan check-in-time-field: a restore is not a check-in. A version written before checkedInAt existed restores to an
    /// empty pile, even though the restore stamps every key it carries with the time it lands.
    func testARestoreOfAVersionWithNoCheckInTimeLeavesNoPileToday() async throws {
        let box = try VersionSandbox()
        addTeardownBlock { box.cleanup() }
        let (store, vs) = try box.open(try VersionSandbox.ledger())
        let version = try VersionSandbox.bytes(try VersionSandbox.ledger(received: [VersionSandbox.keyA: 1]))
        let v = try vs.put(version, label: "before import", lines: 12, checked: 1)
        box.clock.t = VersionSandbox.t0 + 5_000

        try store.restore(v.id)

        XCTAssertEqual(store.received(), [VersionSandbox.keyA: 1], "scope: the version was applied")
        let model = HandModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: store)
        let rows = try await model.todaysPile(now: Date(timeIntervalSince1970: box.clock.t / 1000), calendar: Self.fixtureCalendar)
        XCTAssertEqual(rows.map(\.gk), [], "a restore put an envelope in today's pile though the version holds no check-in time")
    }

    /// plan check-in-time-field: a "One fewer" today stamps the line today, but a count that falls is no check-in. On a copy
    /// checked in yesterday, the envelope stays out of today's pile (debt hand-pile-counts-one-fewer).
    func testATodayDecrementOnAnOlderCheckInLeavesTheEnvelopeOut() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkIn(h, Self.ponder, 4, at: Self.localMidnight - 60_000)
        Self.checkIn(h, Self.ponder, 3, at: Self.localMidnight + 60_000)
        XCTAssertEqual(h.store.received()[Self.ponder], 3, "scope: One fewer took Ponder from 4 to 3")
        let rows = try await pile(h)
        XCTAssertEqual(rows.map(\.gk), [], "a One fewer today put an envelope in today's pile though its check-in was yesterday")
    }

    /// An un-check stamps the line too, with no count. A line checked in and taken back today is no check-in.
    func testCheckedInAndTakenBackTodayIsNoPileRow() async throws {
        let h = try await makeHand()
        try h.store.commitReceived(Self.path, count: 1)
        try h.store.commitReceived(Self.path, count: 0)
        let rows = try await pile(h)
        XCTAssertEqual(rows, [], "a line taken back today is in the pile: its stamp is today, but its count is 0")
    }

    /// debt mark-all-undo-keeps-checkin: a Mark all on a package whose line was checked in yesterday, then its Undo. The Undo
    /// takes the count back to 1, so the line's real check-in is yesterday's and the envelope is not in today's pile.
    func testPackageMarkAllThenUndoLeavesAYesterdayEnvelopeOutOfThePile() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkIn(h, Self.ponder, 1, at: Self.localMidnight - 60_000)
        let packages = PackagesModel(engine: h.engine, store: h.store)
        try await packages.load()
        try await bulking(packages).bulk(gk: "S4::Delta Cards", on: true)
        let marked = try await pile(h).map(\.gk)
        XCTAssertEqual(marked, ["S4::Delta Cards"], "scope: the Mark all put Delta Cards in today's pile")
        try await bulking(packages).undoBulk()
        XCTAssertEqual(h.store.received()[Self.ponder], 1, "scope: the Undo took Ponder back to 1")
        XCTAssertEqual(h.store.checkedInAt()[Self.ponder], Self.localMidnight - 60_000,
                       "the Undo did not give Ponder its check-in time from before the Mark all")
        let afterUndo = try await pile(h).map(\.gk)
        XCTAssertEqual(afterUndo, [], "the Undo of a Mark all put Delta Cards in today's pile, though its check-in is yesterday's")
    }

    /// debt mark-all-undo-keeps-checkin, the Tally side: the same Mark all and Undo, through the product row.
    func testTallyMarkAllThenUndoLeavesAYesterdayEnvelopeOutOfThePile() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkIn(h, Self.ponder, 1, at: Self.localMidnight - 60_000)
        let tally = TallyModel(engine: h.engine, store: h.store)
        try await tally.load()
        try await bulking(tally).bulk(name: "Ponder", on: true)
        let marked = try await pile(h).map(\.gk)
        XCTAssertEqual(marked, ["S4::Delta Cards"], "scope: the Mark all put Delta Cards in today's pile")
        try await bulking(tally).undoBulk()
        XCTAssertEqual(h.store.received()[Self.ponder], 1, "scope: the Undo took Ponder back to 1")
        XCTAssertEqual(h.store.checkedInAt()[Self.ponder], Self.localMidnight - 60_000,
                       "the Tally Undo did not give Ponder its check-in time from before the Mark all")
        let afterUndo = try await pile(h).map(\.gk)
        XCTAssertEqual(afterUndo, [], "the Tally Undo of a Mark all put Delta Cards in today's pile, though its check-in is yesterday's")
    }

    /// debt mark-all-undo-keeps-checkin, the control: a line checked in earlier today keeps that time through the Undo, so the
    /// envelope stays in today's pile.
    func testPackageMarkAllThenUndoKeepsAnEarlierCheckInTodayInThePile() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        let earlier = Self.localMidnight + 60_000
        Self.checkIn(h, Self.ponder, 1, at: earlier)
        let packages = PackagesModel(engine: h.engine, store: h.store)
        try await packages.load()
        try await bulking(packages).bulk(gk: "S4::Delta Cards", on: true)
        try await bulking(packages).undoBulk()
        XCTAssertEqual(h.store.received()[Self.ponder], 1, "scope: the Undo took Ponder back to 1")
        XCTAssertEqual(h.store.checkedInAt()[Self.ponder], earlier,
                       "the Undo did not keep Ponder's check-in time from earlier today")
        let afterUndo = try await pile(h).map(\.gk)
        XCTAssertEqual(afterUndo, ["S4::Delta Cards"],
                       "the Undo took Delta Cards out of today's pile though Ponder was checked in earlier today")
    }

    /// A held card is not an envelope. The shared name is held with no check-in today, and it puts no row in the pile.
    func testHeldCardPutsNoRowInThePile() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        XCTAssertEqual(h.model.held, "lightning bolt", "the setup is real: the shared name is held")
        let before = try await pile(h)
        XCTAssertEqual(before, [], "the held card with no check-in today put a row in the pile")
        try h.store.commitReceived(Self.path, count: 1)
        let after = try await pile(h)
        XCTAssertEqual(after.map(\.gk), ["S1::Alpha Cards"], "the pile lists an envelope with no check-in today: Beta Games, which holds the held name")
    }

    /// A row totals the whole envelope: a copy checked in yesterday counts toward today's row.
    func testPileRowCountsEveryCopyInTheEnvelope() async throws {
        let h = try await makeHand()
        Self.checkIn(h, Self.path, 1, at: Self.localMidnight - 60_000)
        Self.checkIn(h, Self.bolt, 1, at: Self.localMidnight + 60_000)
        let rows = try await pile(h)
        let alpha = try Self.row(rows, "S1::Alpha Cards")
        XCTAssertEqual(alpha.got, 2, "the row leaves out the copy checked in yesterday, or counts today's copies alone")
        XCTAssertEqual(alpha.qty, 3, "the row's qty is not the envelope's three copies")
        XCTAssertTrue(alpha.short, "two of three copies in is not flagged short")
    }

    /// Partial quantity: one of four copies in is short, and the row counts copies, not lines.
    func testPileRowOfAMultiCopyLineIsShort() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkIn(h, Self.ponder, 1, at: Self.localMidnight + 60_000)
        let rows = try await pile(h)
        let delta = try Self.row(rows, "S4::Delta Cards")
        XCTAssertEqual(delta.got, 1, "the row does not count the one copy in")
        XCTAssertEqual(delta.qty, 4, "the row does not count the four copies ordered")
        XCTAssertTrue(delta.short, "one of four copies in is not flagged short")
    }

    /// Every copy in: the envelope is in the pile and is not flagged.
    func testPileRowIsNotShortWhenEveryCopyIsIn() async throws {
        let h = try await makeHand()
        for key in [Self.bolt, Self.path, Self.counter] { Self.checkIn(h, key, 1, at: Self.localMidnight + 60_000) }
        let rows = try await pile(h)
        let alpha = try Self.row(rows, "S1::Alpha Cards")
        XCTAssertEqual(alpha.got, 3, "the row does not count all three copies in")
        XCTAssertFalse(alpha.short, "three of three copies in is flagged short")
    }

    /// Not normal today lists the short envelopes of the pile, each with the cards it still owes. A full envelope is not listed.
    func testNotNormalListsTheShortEnvelopeWithItsMissingCards() async throws {
        let h = try await makeHand()
        Self.checkIn(h, Self.path, 1, at: Self.localMidnight + 60_000)
        Self.checkIn(h, Self.sol, 1, at: Self.localMidnight + 60_000)
        let nn = try await notNormal(h)
        XCTAssertEqual(nn.rows.map(\.gk), ["S1::Alpha Cards"], "Not normal today lists something other than the one short envelope of today's pile")
        let alpha = try XCTUnwrap(nn.rows.first)
        XCTAssertEqual(Set(alpha.missing), ["Lightning Bolt", "Counterspell"], "the short row does not name the cards still owed")
        XCTAssertEqual(alpha.left, 2, "the short row does not count the two copies still owed")
        XCTAssertFalse(nn.allWell, "Not normal today says All is well. while an envelope is short")
    }

    /// The short row owes copies, not lines: one of four Ponder copies in leaves three owed.
    func testNotNormalCountsTheCopiesStillOwed() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkIn(h, Self.ponder, 1, at: Self.localMidnight + 60_000)
        let nn = try await notNormal(h)
        XCTAssertEqual(nn.rows.map(\.gk), ["S4::Delta Cards"], "Not normal today does not list the short Delta Cards envelope")
        let delta = try XCTUnwrap(nn.rows.first)
        XCTAssertEqual(delta.left, 3, "the short row counts lines, not the copies still owed")
        XCTAssertEqual(delta.missing, ["Ponder"], "the short row does not name Ponder as the card still owed")
    }

    /// Each owed card is one line, "<copies owed> <card name>". Path to Exile is checked in, so it owes nothing and gets no line.
    /// The lines compare as a set: the rules list an envelope's cards by name, and the order is not what this case checks.
    func testOwedLinesNameEachCardStillOwed() async throws {
        let h = try await makeHand()
        Self.checkIn(h, Self.path, 1, at: Self.localMidnight + 60_000)
        let nn = try await notNormal(h)
        let alpha = try XCTUnwrap(nn.rows.first)
        XCTAssertEqual(alpha.owedLines.count, 2, "the envelope does not owe one line per card still owed")
        XCTAssertEqual(Set(alpha.owedLines), ["1 Lightning Bolt", "1 Counterspell"],
                       "the owed lines are not one line per card still owed, each with its copies")
    }

    /// A partly received card owes the copies still out, not its whole quantity: one of Delta's four Ponder is in, so three are owed.
    func testOwedLinesCountTheCopiesOwedOfAPartlyReceivedCard() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkIn(h, Self.ponder, 1, at: Self.localMidnight + 60_000)
        let nn = try await notNormal(h)
        let delta = try XCTUnwrap(nn.rows.first)
        XCTAssertEqual(delta.owedLines, ["3 Ponder"], "the owed line counts the four copies ordered, not the three still out")
    }

    /// Several short cards in one envelope, each partly received: one of four Ponder and one of two Ancient Tomb are in.
    /// Each card keeps its own line with its own copies owed, and the envelope's left is the sum of both.
    func testOwedLinesGiveEachOfSeveralCardsItsOwnCopies() async throws {
        let h = try await makeHand(extra: Self.deltaPonder() + Self.deltaTomb())
        Self.checkIn(h, Self.ponder, 1, at: Self.localMidnight + 60_000)
        Self.checkIn(h, Self.tomb, 1, at: Self.localMidnight + 60_000)
        let nn = try await notNormal(h)
        let delta = try XCTUnwrap(nn.rows.first)
        XCTAssertEqual(Set(delta.owedLines), ["3 Ponder", "1 Ancient Tomb"], "the owed lines do not give each card its own copies still owed")
        XCTAssertEqual(delta.left, 4, "the row's left is not the six ordered less the two checked in")
    }

    /// A card with every copy in owes nothing, so it gets no line: Ponder is whole and Ancient Tomb owes both its copies.
    func testOwedLinesLeaveOutACardWithEveryCopyIn() async throws {
        let h = try await makeHand(extra: Self.deltaPonder() + Self.deltaTomb())
        Self.checkIn(h, Self.ponder, 4, at: Self.localMidnight + 60_000)
        let nn = try await notNormal(h)
        let delta = try XCTUnwrap(nn.rows.first)
        XCTAssertEqual(delta.owedLines, ["2 Ancient Tomb"], "a card with every copy in still gets an owed line")
    }

    /// Full-size state with every envelope whole, but the past-14-days count is unknown (nil): the page must not say All is well.
    func testUnknownPastCountIsNeverAllWell() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkEverythingInToday(h)
        let nn = try await notNormal(h, pastCount: nil)
        XCTAssertEqual(nn.rows, [], "a whole envelope is listed under Not normal today")
        XCTAssertFalse(nn.allWell, "the past-14-days count is unknown, but the page says All is well.")
    }

    /// Full-size state: every line checked in today, every envelope whole, nothing past 14 days. The page says All is well.
    func testAllIsWellWhenEveryEnvelopeInTodaysPileIsWhole() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkEverythingInToday(h)
        let rows = try await pile(h)
        XCTAssertEqual(rows.count, 4, "the four envelopes of the ledger are not all in today's pile")
        let nn = try await notNormal(h)
        XCTAssertEqual(nn.rows, [], "a whole envelope is listed under Not normal today")
        XCTAssertTrue(nn.allWell, "nothing is short and nothing is past 14 days, but the page does not say All is well.")
    }

    /// The same whole pile with one envelope past 14 days: the page does not say All is well.
    func testAllIsNotWellWhileAnEnvelopeIsPast14Days() async throws {
        let h = try await makeHand(extra: Self.deltaPonder())
        Self.checkEverythingInToday(h)
        let nn = try await notNormal(h, pastCount: 1)
        XCTAssertEqual(nn.rows, [], "a whole envelope is listed under Not normal today")
        XCTAssertFalse(nn.allWell, "an envelope is past 14 days, but the page says All is well.")
    }
}
