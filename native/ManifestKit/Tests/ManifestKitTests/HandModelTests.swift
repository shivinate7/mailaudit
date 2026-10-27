// Card in Hand: the in-memory state of one hand session (duo-hand-model; governed by
// duo-card-in-hand, new-envelope-ends-an-envelope, orphaned-mail-never-decides and
// imports-merge-never-replace). Red-first: HandModel does not exist until the duo-hand-model
// builder adds it in native/ManifestKit/Sources/ManifestKit/.
//
// The rules it calls are handHits and handStep in src/view-rules.mjs. Their contract is at the
// top of the V30 block in test/view-rules.test.mjs (lane duo-hand-rules). Swift reaches them
// through RulesEngine, so the bundle is the one the web uses.
//
// CONTRACT these tests name:
//
//   @MainActor @Observable public final class HandModel {
//       public init(engine: RulesEngine, store: LedgerStore)
//       public private(set) var held: String?       // normName of a card held as a stray; nil when none
//       public private(set) var hits: [String]      // gk of each package holding the typed name, handHits order
//       public private(set) var offer: HandOffer?   // set only when the typed card names one open envelope
//       public private(set) var error: String?      // set when a post cannot save; the next save that works clears it
//       public func type(_ name: String) async throws  // runs handHits and handStep; writes nothing
//       public func post() async throws                 // writes offer.plan in one save, then clears offer and held
//       public func newEnvelope()                       // ends the current envelope: clears held and offer; writes nothing
//       public func close()                             // the sheet closes: clears offer, keeps held; writes nothing
//   }
//   public struct HandOffer: Equatable, Sendable { public let gk: String; public let plan: [PlanStep] }
//   PlanStep is the one in Orphaned.swift: itemKey and take.
//
// Behaviour the contract does not show:
//   - A held name clears on post, never on offer. A failed post keeps held and offer, and throws.
//   - Typed text is the query for hits and the typed name for handStep. Blank text is not pinned here.
//   - Every write goes through LedgerStore (commit), so one post is one save.
//
// Fake fixtures only. These tests read no Keychain item. Temp files live in RunFolder (test-temp-standard).

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

@MainActor
final class HandModelTests: XCTestCase {
    static let t0: Double = 1_786_543_380_000

    // Alpha Cards (S1) holds the held name, Path to Exile and Counterspell. Beta Games (S2) holds the held name too.
    static let bolt = "S1|0|pLightning Bolt"
    static let path = "S1|1|pPath to Exile"
    static let counter = "S1|2|pCounterspell"
    static let boltS2 = "S2|0|pLightning Bolt"

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
        ]
    }

    static func seed() throws -> Data {
        try JSONSerialization.data(withJSONObject: ["mailday": 1, "items": items()], options: [.sortedKeys])
    }

    /// A ledger folder in this run's folder, loaded, with a model over it. The folder is removed at teardown.
    func makeHand() async throws -> HandFixture {
        let dir = try RunFolder.fresh("hand")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let file = dir.appending(path: "ledger.json")
        try Self.seed().write(to: file)
        let store = LedgerStore(fileURL: file, now: { Self.t0 })
        try store.load()
        let model = HandModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: store)
        return HandFixture(model: model, store: store, file: file, dir: dir)
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

    /// The New envelope control ends the envelope the held card waited on. The held name is released, so the
    /// next card posts only its own copy. Ending an envelope writes nothing.
    func testNewEnvelopeEndsEnvelope() async throws {
        let h = try await makeHand()
        try await h.model.type("Lightning Bolt")
        let before = try Data(contentsOf: h.file)
        h.model.newEnvelope()
        XCTAssertNil(h.model.held, "the held name is released when the envelope ends")
        XCTAssertNil(h.model.offer, "no offer survives the end of the envelope")
        let after = try Data(contentsOf: h.file)
        XCTAssertEqual(after, before, "ending an envelope writes nothing")
        try await h.model.type("Path to Exile")
        let offer = try XCTUnwrap(h.model.offer, "the typed card still names one envelope")
        XCTAssertEqual(offer.plan, [PlanStep(itemKey: Self.path, take: 1)],
                       "the released card does not join the next envelope's post")
        XCTAssertEqual(h.store.received(), [:], "nothing is checked in")
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
}
