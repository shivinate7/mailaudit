import Foundation
import Observation

/// The six Tally sort keys, in the web's order. The raw value is the key sortTally takes.
public enum TallySort: String, CaseIterable, Sendable {
    case missing, basis, ordered, value, rate, name

    /// ITEM_SORTS in src/app.jsx.
    public var label: String {
        switch self {
        case .missing: "Most missing"
        case .basis: "Cost basis"
        case .ordered: "Most ordered"
        case .value: "$ remaining"
        case .rate: "Unit rate"
        case .name: "Name A\u{2013}Z"
        }
    }
}

/// One product pooled across sellers, with the text ItemTotalRow in src/app.jsx writes.
/// The counts cover every copy; `copies` holds only the copies the filters leave.
public struct TallyRow: Equatable, Sendable {
    public let name: String
    public let qty, got: Int
    public let basis, avg: Double
    public let sellerCount, orderCount: Int
    public let sets: [String]
    public let leftValue: Double
    public let copies: [LedgerItem]
    public let hiddenCopies: Int
    public let ratio, rateLine, leftLine, meta, acrossLine: String
    public let hiddenNote: String?

    /// The edge bar's fill: got / qty while 0 < got < qty, over every copy, as PackagesModel.bars does for a package.
    /// nil at none in and at all in, where the bar is gone.
    public var barFraction: Double? { got > 0 && got < qty ? Double(got) / Double(qty) : nil }
}

/// Rows for the Tally view: the rules engine over the ledger store (rules-run-in-javascriptcore).
/// Pooling, sorting and filtering run in the bundle. The frozen order and the sticky copies
/// stay here, as they stay in the web component. It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class TallyModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    @ObservationIgnored private var groups = "[]"
    /// Product name to place, set by the last sort and kept while the user checks in
    /// (tally-sort-keys-are-six, no-layout-shift-under-pointer).
    @ObservationIgnored private var order: [String: Int] = [:]
    /// Copies checked in under this filter context; filterTally keeps them shown.
    @ObservationIgnored private var sticky: Set<String> = []
    /// Bumped by each refresh, so a refresh that a newer one overtook drops its result.
    @ObservationIgnored private var epoch = 0
    public private(set) var rows: [TallyRow] = []
    /// The counts the rows were built from, for the view's per-copy control.
    public private(set) var received: [String: Int] = [:]
    /// Per copy key of a copy with more than one unit, from the bundle's gotQty: "got/qty". No entry for a one-unit copy.
    public private(set) var readouts: [String: String] = [:]
    public private(set) var sort: TallySort = .missing
    public private(set) var query = ""
    public private(set) var hideReceived = false
    /// Set when the last check-in could not be saved; nil after one that was.
    public private(set) var checkInError: String?

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    private struct Group: Decodable {
        let name: String
        let items, shown: [LedgerItem]
        let sets: [String]
        let qty: Int
        let basis, avg: Double
        let sellerCount, orderCount: Int
    }

    private struct Left: Decodable { let left: Int; let value: Double }

    /// Pools every live item again and sorts: canceled orders and refunded packages stay out (LiveItems).
    public func load() async throws {
        let live = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        groups = try await engine.call("tallyGroups", "[\(live)]")
        try await resort()
    }

    /// The Tally view came on screen: another view may have changed the counts. Like the web, a
    /// view change ends the sticky copies and keeps the order.
    public func viewOpened() async throws {
        sticky = []
        try await refresh()
    }

    public func setSort(_ key: TallySort) async throws {
        sort = key
        try await resort()
    }

    public func setQuery(_ text: String) async throws {
        if text != query { sticky = [] }
        query = text
        try await refresh()
    }

    public func setHideReceived(_ on: Bool) async throws {
        if on != hideReceived { sticky = [] }
        hideReceived = on
        try await refresh()
    }

    public func clearSearch() async throws { try await setQuery("") }

    public func checkIn(key: String, count: Int) async throws {
        do { try store.commitReceived(key, count: count) } catch {
            checkInError = "Could not save the check-in. \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        if count > 0 { sticky.insert(key) }
        try await refresh()
    }

    /// A tap: the bundle's toggleCount picks the count. Every failure lands in checkInError and is thrown.
    public func toggle(key: String) async throws {
        guard let item = rows.lazy.flatMap(\.copies).first(where: { $0.key == key }) else { return }
        do {
            let out = try await engine.call("toggleCount", "[\(store.received()[key] ?? 0),\(item.qty)]")
            guard let count = Int(out) else { throw RulesEngine.Failure.threw("toggleCount gave \(out)") }
            try await checkIn(key: key, count: count)
        } catch {
            if checkInError == nil { checkInError = "Could not check in. \(error.localizedDescription)" }
            throw error
        }
    }

    /// For the view: a tap whose failure is already in checkInError.
    public func tap(key: String) async { try? await toggle(key: key) }

    /// A stepper tap, as the web stepper and PackagesModel.step: one unit more or fewer, kept within 0 and the copy's qty.
    /// It takes the toggle's save path, checkIn, so a failure lands in checkInError.
    public func step(key: String, by delta: Int) async {
        guard let item = rows.lazy.flatMap(\.copies).first(where: { $0.key == key }) else { return }
        let got = min(store.received()[key] ?? 0, item.qty)
        try? await checkIn(key: key, count: min(max(got + delta, 0), item.qty))
    }

    private func resort() async throws {
        struct Named: Decodable { let name: String }
        let sorted = try await engine.call("sortTally", "[\(groups),\(try json(sort.rawValue)),\(try json(store.received()))]")
        let names = try JSONDecoder().decode([Named].self, from: Data(sorted.utf8)).map(\.name)
        order = Dictionary(names.enumerated().map { ($1, $0) }, uniquingKeysWith: { first, _ in first })
        try await refresh()
    }

    private func refresh() async throws {
        epoch += 1
        let mine = epoch
        let got = store.received()
        // A Set cannot cross as JSON, so the bridge turns {"$set": [...]} into one (RulesCore).
        let opts: [String: Any] = ["query": query, "hideDone": hideReceived, "received": got, "sticky": ["$set": Array(sticky)]]
        let out = try await engine.call("filterTally", "[\(groups),\(try json(opts))]")
        let shown = try JSONDecoder().decode([Group].self, from: Data(out.utf8))
        var built: [TallyRow] = []
        for g in shown {
            let left = try JSONDecoder().decode(Left.self, from: Data(
                try await engine.call("outstandingOf", "[\(String(decoding: try JSONEncoder().encode(g.items), as: UTF8.self)),\(try json(got))]").utf8))
            let cash = Cash(rate: try await money(g.avg), left: try await money(left.value), basis: try await money(g.basis))
            built.append(Self.row(g, left: left, cash: cash, hidden: g.items.count - g.shown.count))
        }
        let copies = built.flatMap(\.copies)
        let outs = await engine.calls(copies.map { ("gotQty", "[\(got[$0.key] ?? 0),\($0.qty)]") })
        var shownReadouts: [String: String] = [:]
        for (copy, out) in zip(copies, outs) {
            if let text = try JSONSerialization.jsonObject(with: Data(try out.get().utf8), options: [.fragmentsAllowed]) as? String { shownReadouts[copy.key] = text }
        }
        guard mine == epoch else { return }
        rows = built.sorted { (order[$0.name] ?? .max) < (order[$1.name] ?? .max) }
        received = got
        readouts = shownReadouts
    }

    /// The bundle's money rule, the one the web calls (rules-run-in-javascriptcore).
    private func money(_ n: Double) async throws -> String {
        try JSONDecoder().decode(String.self, from: Data(try await engine.call("money", "[\(try json(n))]").utf8))
    }

    /// The three dollar figures a row writes, already formatted by the bundle.
    private struct Cash { let rate, left, basis: String }

    private static func row(_ g: Group, left: Left, cash: Cash, hidden: Int) -> TallyRow {
        let got = g.qty - left.left
        func plural(_ n: Int, _ w: String) -> String { "\(n) \(w)\(n == 1 ? "" : "s")" }
        func copies(_ n: Int) -> String { "\(n) cop\(n == 1 ? "y" : "ies")" }
        let setLabel = g.sets.isEmpty ? "" : g.sets.count == 1 ? g.sets[0] : "\(g.sets[0]) +\(g.sets.count - 1) more"
        let meta = [plural(g.sellerCount, "seller"), plural(g.orderCount, "order"), setLabel]
            .filter { !$0.isEmpty }.joined(separator: " \u{00B7} ")
        return TallyRow(
            name: g.name, qty: g.qty, got: got, basis: g.basis, avg: g.avg,
            sellerCount: g.sellerCount, orderCount: g.orderCount, sets: g.sets, leftValue: left.value,
            copies: g.shown, hiddenCopies: hidden,
            ratio: "\(got)/\(g.qty)" + (got >= g.qty ? " \u{2713}" : ""),
            rateLine: "\(cash.rate) / copy",
            leftLine: "\(left.left) left \u{00B7} \(cash.left)",
            meta: meta,
            acrossLine: "\(cash.basis) across \(copies(g.qty)) \u{00B7} \(cash.rate) avg",
            hiddenNote: hidden > 0 ? "\(copies(hidden)) hidden by filters" : nil)
    }
}
