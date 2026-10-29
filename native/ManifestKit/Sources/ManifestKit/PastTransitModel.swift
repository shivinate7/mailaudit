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

/// One stamp kind on the page: the ledger's key and the label the web shows.
public struct StampKind: Equatable, Sendable {
    public let kind: String
    public let label: String
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
    /// outstandingOf and money over the same rows. 0 and "$0.00" while the list is empty.
    public private(set) var owedCards = 0
    public private(set) var owedValue = "$0.00"

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
            let pairs = try JSONDecoder().decode([[String]].self, from: Data(try await engine.constant("STAMP_KINDS").utf8))
            stampKinds = pairs.map { StampKind(kind: $0[0], label: $0[1]) }
        }
        try await refresh()
    }

    /// Stamps one package and saves. A failed save leaves the ledger and the list as they were.
    public func stamp(_ gk: String, kind: String) async throws {
        let cur = store.stamps()[gk]
        // The same kind keeps a non-empty date; anything else is dated today, as the web does.
        let kept = (cur?["kind"] as? String) == kind ? cur?["at"] as? String : nil
        let at = kept.flatMap { $0.isEmpty ? nil : $0 } ?? Self.today(store.now())
        try store.commit { store.setStamp(gk, kind: kind, note: cur?["note"] as? String ?? "", at: at) }
        sticky.insert(gk)
        try await refresh()
    }

    /// Writes a tombstone for the package's own stamp (stamp-removal-writes-a-tombstone). The row
    /// is listed again from the next load.
    public func undo(_ gk: String) async throws {
        guard live(store.stamps()[gk]) != nil else { return }
        try store.commit { store.removeStamp(gk) }
        try await refresh()
    }

    private func live(_ stamp: [String: Any]?) -> String? {
        guard let kind = stamp?["kind"] as? String, !kind.isEmpty else { return nil }
        return kind
    }

    /// The device's local day as YYYY-MM-DD, like the web's todayLocal.
    private static func today(_ ms: Double) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: Date(timeIntervalSince1970: ms / 1000))
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// The items go in whole. A refunded row keeps its place until load() (so LiveItems would be wrong here), and a
    /// canceled order never passes the rule's "without tracking" test.
    private func refresh() async throws {
        epoch += 1
        let mine = epoch
        let stamps = store.stamps()
        let hidden = Set(stamps.filter { live($0.value) != nil }.keys).subtracting(sticky)
        let args = "[\(try LiveItems.json(store.items())),\(try LiveItems.json(store.received())),\(try LiveItems.json(["$set": Array(hidden)])),\(store.now())]"
        let hits = try JSONDecoder().decode([Hit].self, from: Data(try await engine.call("pastTransit", args).utf8))
        let listed = Set(hits.map(\.gk))
        let owedItems = store.items().filter { listed.contains("\($0["orderId"] as? String ?? "")::\($0["seller"] as? String ?? "")") }
        struct Owed: Decodable { let left: Int; let value: Double }
        let owed = try JSONDecoder().decode(Owed.self, from: Data(try await engine.call("outstandingOf", "[\(try LiveItems.json(owedItems)),\(try LiveItems.json(store.received()))]").utf8))
        let money = try JSONDecoder().decode(String.self, from: Data(try await engine.call("money", "[\(owed.value)]").utf8))
        guard mine == epoch else { return }
        owedCards = owed.left
        owedValue = money
        rows = hits.map { PastTransitRow(gk: $0.gk, tier: $0.tier, days: $0.days, claimBy: $0.claimBy, stamp: live(stamps[$0.gk])) }
    }
}
