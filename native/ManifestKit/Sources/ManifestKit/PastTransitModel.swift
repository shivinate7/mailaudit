import Foundation
import Observation

/// One package past its transit window. `claimBy` is the order date plus 30 days, UTC.
public struct PastTransitRow: Equatable, Sendable {
    public let gk: String
    public let tier: String
    public let days: Int
    public let claimBy: String
    /// The live stamp kind on the row; nil when none. Only a row stamped since the last load shows one.
    public let stamp: String?
}

/// Past-transit page state (duo-transit-model). The list is the bundle's pastTransit rule
/// (rules-run-in-javascriptcore); this model passes it the ledger and the clock, and stamps through
/// the store (one-stamp-per-package). It takes any kind; the page limits the choice to the web's six.
@MainActor @Observable
public final class PastTransitModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    /// Packages stamped since the last load. They keep their row, like Tally's sticky copies
    /// (no-layout-shift-under-pointer); only load() ends it.
    @ObservationIgnored private var sticky: Set<String> = []
    /// Bumped by each refresh, so a refresh that a newer one overtook drops its result.
    @ObservationIgnored private var epoch = 0
    public private(set) var rows: [PastTransitRow] = []
    /// Copies still owed in the listed packages, and their price as the web writes it ("$9.55"), from the bundle's
    /// outstandingOf and money over the same rows. 0 and "$0.00" while the list is empty; nil when the bundle
    /// could not compute them (the rows still load).
    public private(set) var owedCards: Int? = 0
    public private(set) var owedValue: String? = "$0.00"

    /// The six kinds the page offers, read from the web's STAMP_KINDS in the rules bundle (one home). No Lost kind
    /// (duo-card-in-hand, item 25, deferred). `stamp(_:kind:)` takes any kind; the limit is this list.
    /// Empty until the first load() reads them through the engine, so the bundle loads once.
    public private(set) var stampKinds: [StampKind] = []

    private struct Hit: Decodable { let gk: String; let tier: String; let days: Int; let claimBy: String }

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    /// The reload: re-reads the ledger and ends the sticky rows, so a stamped row now drops out.
    public func load() async throws {
        sticky = []
        if stampKinds.isEmpty {
            stampKinds = try await StampRules.kinds(engine: engine)
        }
        try await refresh()
    }

    /// Stamps one package and saves, through the one stamp writer (StampWriter). A failed save leaves the ledger and
    /// the list as they were.
    public func stamp(_ gk: String, kind: String) async throws {
        try await StampWriter.write(gk, kind: kind, store: store, engine: engine)
        sticky.insert(gk)
        try await refresh()
    }

    /// Writes a tombstone for the package's own stamp (stamp-removal-writes-a-tombstone). The row
    /// is listed again from the next load.
    public func undo(_ gk: String) async throws {
        try await StampWriter.remove(gk, store: store, engine: engine)
        try await refresh()
    }

    /// The items go in whole: a refunded row keeps its place until load() (so LiveItems would be wrong here), and
    /// pastTransit drops canceled orders itself, so a canceled order never passes the rule's "without tracking" test.
    /// The owed figures take the listed packages through LiveItems (canceled and refunded packages leave the counts
    /// at once, a-refund-leaves-every-count) and the bundle's groupPackages (no Swift copy of gkOf). A figure that
    /// cannot be computed is nil; the rows still load.
    private func refresh() async throws {
        epoch += 1
        let mine = epoch
        let stamps = store.stamps()
        let stamped = try await StampRules.keys(where: "hasStamp", in: stamps, engine: engine)
        let hidden = stamped.subtracting(sticky)
        let args = "[\(try LiveItems.json(store.items())),\(try LiveItems.json(store.received())),\(try LiveItems.json(["$set": Array(hidden)])),\(store.now())]"
        let hits = try JSONDecoder().decode([Hit].self, from: Data(try await engine.call("pastTransit", args).utf8))
        let listed = Set(hits.map(\.gk))
        var cards: Int?
        var value: String?
        do {
            let live = try await LiveItems.of(store.items(), stamps: stamps, engine: engine)
            let packages = try JSONSerialization.jsonObject(with: Data(try await engine.call("groupPackages", "[\(live)]").utf8)) as? [[String: Any]] ?? []
            let owedItems = packages.filter { listed.contains($0["gk"] as? String ?? "") }.flatMap { $0["items"] as? [[String: Any]] ?? [] }
            struct Owed: Decodable { let left: Int; let value: Double }
            let owed = try JSONDecoder().decode(Owed.self, from: Data(try await engine.call("outstandingOf", "[\(try LiveItems.json(owedItems)),\(try LiveItems.json(store.received()))]").utf8))
            value = try JSONDecoder().decode(String.self, from: Data(try await engine.call("money", "[\(owed.value)]").utf8))
            cards = owed.left
        } catch {}
        guard mine == epoch else { return }
        owedCards = cards
        owedValue = value
        rows = hits.map { PastTransitRow(gk: $0.gk, tier: $0.tier, days: $0.days, claimBy: $0.claimBy, stamp: stamped.contains($0.gk) ? stamps[$0.gk]?["kind"] as? String : nil) }
    }
}
