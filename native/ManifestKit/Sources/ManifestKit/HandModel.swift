import Foundation
import Observation

/// What a post would check in: the envelope and the copies, as the bundle's handStep planned them.
public struct HandOffer: Equatable, Sendable {
    public let gk: String
    public let plan: [PlanStep]
}

/// Card in Hand session state (duo-card-in-hand). The rules are handHits and handStep in the bundle
/// (rules-run-in-javascriptcore). Typing and closing write nothing. Only post() saves, as one save.
/// It ranks and never picks: a card checks in only when it names one open envelope
/// (orphaned-mail-never-decides). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class HandModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    /// normName of a card held as a stray. A post clears it, an offer does not.
    public private(set) var held: String?
    /// Names newEnvelope released. They are shown, never checked in, and decide nothing.
    public private(set) var strays: [String] = []
    public private(set) var hits: [String] = []
    public private(set) var offer: HandOffer?
    /// Set when a post cannot save; the call throws too. Cleared by the next save that works.
    public private(set) var error: String?
    /// The store generation the offer was planned at. A write since makes the plan stale.
    @ObservationIgnored private var offeredAt = -1
    /// The held name the rules want once the offer posts: the old one, or none when the post named it.
    @ObservationIgnored private var heldAfterPost: String?

    private struct Step: Decodable { let action: String; let gk: String?; let plan: [PlanStep]?; let held: String? }

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    /// Reads the held name and the typed text against the open packages. Writes nothing.
    public func type(_ name: String) async throws {
        let gen = store.generation
        // LiveItems already drops refunded packages, so the rules get an empty refunded set.
        let items = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        let got = try LiveItems.json(store.received())
        let none = "{\"$set\":[]}"
        let typed = try LiveItems.json(name)
        let found = try await engine.call("handHits", "[\(items),\(typed),\(got),\(none)]")
        let out = try await engine.call("handStep", "[\(items),\(got),\(none),\(try LiveItems.json(held ?? NSNull())),\(typed)]")
        let step = try JSONDecoder().decode(Step.self, from: Data(out.utf8))
        hits = try JSONDecoder().decode([String].self, from: Data(found.utf8))
        if step.action == "post", let gk = step.gk, let plan = step.plan {
            offer = HandOffer(gk: gk, plan: plan)
            offeredAt = gen
            heldAfterPost = step.held
        } else {
            offer = nil
            held = step.held
        }
    }

    /// Checks in the offered copies in one save, then lets go of the offer. The held name stays only if the post did not name it.
    public func post() async throws {
        guard let o = offer else { return }
        guard store.generation == offeredAt else {
            offer = nil
            error = OrphanedNotice.refusal(.changed)
            throw OrphanedFailure.changed
        }
        let got = store.received()
        do {
            try store.commit {
                for s in o.plan { store.setReceived(s.itemKey, count: (got[s.itemKey] ?? 0) + s.take) }
            }
        } catch {
            self.error = "Could not save. \(error.localizedDescription)"
            throw error
        }
        error = nil
        offer = nil
        held = heldAfterPost
        hits = []
    }

    /// The envelope the held card waited on has ended. Nothing is saved.
    public func newEnvelope() {
        if let h = held, !strays.contains(h) { strays.append(h) }
        held = nil
        offer = nil
    }

    /// The sheet closes. Held cards stay held, so the next card still decides them.
    public func close() { offer = nil }
}
