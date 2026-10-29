import Foundation
import Observation

/// What a post would check in: the envelope and the copies, as the bundle's handStep planned them.
public struct HandOffer: Equatable, Sendable {
    public let gk: String
    public let plan: [PlanStep]
    /// How many of the plan's copies are the held card's. A post that carries none needs no button: the line's own tap checks the typed card in.
    public let heldCopies: Int
}

/// Card in Hand session state (duo-card-in-hand). The rules are handHits and handStep in the bundle
/// (rules-run-in-javascriptcore). Typing and closing write nothing. Only post() saves, as one save.
/// It ranks and never picks: a card checks in only when it names one open envelope
/// (orphaned-mail-never-decides). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class HandModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    /// normName of a held card. After a post it is whatever the rules reply still holds; New envelope makes it a stray.
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

    /// Typed-name reads in call order: each waits for the one before it.
    @ObservationIgnored private var queue: Task<Void, Never> = Task {}
    /// normName of each copy the offer checks in. A post removes them from the strays.
    @ObservationIgnored private var offerNames: Set<String> = []
    /// Bumped when the envelope ends or the sheet closes, so a read begun before it drops its reply.
    @ObservationIgnored private var ended = 0

    private struct Step: Decodable { let action: String; let gk: String?; let plan: [PlanStep]?; let held: String? }

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    /// Reads the held name and the typed text against the open packages. Writes nothing. Calls queue in call order,
    /// so a later card reads the held name an earlier one left. A write that lands while a call reads outdates
    /// its reply, so the same text is read again in the same slot: a post never has a held name brought back. A
    /// New envelope or a close that lands first drops the reply, so a card typed before it never reaches the next envelope.
    public func type(_ name: String) async throws {
        let endedAtType = ended
        let before = queue
        let run = Task { await before.value; try await self.read(name, endedAtType) }
        queue = Task { _ = await run.result }
        try await run.value
    }

    private func read(_ name: String, _ endedAtType: Int) async throws {
        while true {
            let (gen, heldAtStart) = (store.generation, held)
            // LiveItems already drops refunded packages, so the rules get an empty refunded set.
            let items = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
            let got = try LiveItems.json(store.received())
            let none = "{\"$set\":[]}"
            let typed = try LiveItems.json(name)
            let found = try await engine.call("handHits", "[\(items),\(typed),\(got),\(none)]")
            let out = try await engine.call("handStep", "[\(items),\(got),\(none),\(try LiveItems.json(held ?? NSNull())),\(typed)]")
            let step = try JSONDecoder().decode(Step.self, from: Data(out.utf8))
            let hitList = try JSONDecoder().decode([String].self, from: Data(found.utf8))
            var names = Set<String>()
            if step.action == "post", let plan = step.plan {
                for s in plan {
                    guard let n = store.items().first(where: { ($0["key"] as? String) == s.itemKey })?["name"] as? String else { continue }
                    names.insert(try JSONDecoder().decode(String.self, from: Data(try await engine.call("normName", "[\(try LiveItems.json(n))]").utf8)))
                }
            }
            guard ended == endedAtType else { hits = []; return }
            guard store.generation == gen else { continue }
            hits = hitList
            if step.action == "post", let gk = step.gk, let plan = step.plan {
                // The held card came along when the post names it (step.held moved off it): the plan's copies beyond the typed one.
                let carried = heldAtStart != nil && step.held != heldAtStart ? max(0, plan.reduce(0) { $0 + $1.take } - 1) : 0
                offer = HandOffer(gk: gk, plan: plan, heldCopies: carried)
                offeredAt = gen
                heldAfterPost = step.held
                offerNames = names
            } else {
                offer = nil
                held = step.held
            }
            return
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
        try store.commit(noting: &error) {
            for s in o.plan { store.setReceived(s.itemKey, count: (got[s.itemKey] ?? 0) + s.take) }
        }
        offer = nil
        held = heldAfterPost
        hits = []
        strays.removeAll { offerNames.contains($0) }
    }

    /// The envelope the held card waited on has ended. Nothing is saved.
    public func newEnvelope() {
        if let h = held, !strays.contains(h) { strays.append(h) }
        held = nil
        offer = nil
        ended += 1
    }

    /// The sheet closes. Held cards stay held, so the next card still decides them.
    public func close() {
        offer = nil
        hits = []
        ended += 1
    }
}
