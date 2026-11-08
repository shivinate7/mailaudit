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
    /// Find, Showing, Orders from and the sorts, shared with the Packages and the Ledger tab's View group.
    public let options: ViewOptions
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
    public var sort: TallySort { options.itemSort }
    public var query: String { options.query }
    /// Showing: true is Unreceived, where the web starts (ruled-head-showing-unreceived).
    public var hideReceived: Bool { options.hideDone }
    /// Whether the ledger holds any item at all, for the Find pill (drawn only with items).
    public private(set) var hasItems = false
    /// Set when the last check-in could not be saved; nil after one that was.
    public private(set) var checkInError: String?
    /// The product the held Mark all Undo is for, as PackagesModel.bulkUndoGk is for a package. nil when there is none.
    public private(set) var bulkUndoName: String?
    private var bulkUndoTakes: [BulkTake] = []
    /// The check-ins the held Undo takes back, as PackagesModel.bulkUndoCount. 0 when none is held.
    public var bulkUndoCount: Int { bulkUndoName == nil ? 0 : bulkUndoTakes.reduce(0) { $0 + $1.take } }

    public init(engine: RulesEngine, store: LedgerStore, options: ViewOptions = ViewOptions()) {
        self.engine = engine
        self.store = store
        self.options = options
        options.engine = engine
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

    /// Pools every live item the saved Orders from keeps and sorts by the saved Sorted by: canceled orders and refunded
    /// packages stay out (LiveItems). A range changes the counts, because the pool holds only the lines it keeps.
    public func load() async throws {
        options.read(store)
        let live = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        let range = try await ViewRange.range(options.dateFilter, store: store, engine: engine)
        groups = try await engine.call("tallyGroups", "[\(try await ViewRange.apply(live, range: range, engine: engine))]")
        hasItems = !store.items().isEmpty
        try await options.readCanceled(itemsJSON: try json(store.items()), engine: engine)
        try await resort()
    }

    /// The Tally view came on screen: another view may have changed the counts. Like the web, a
    /// view change ends the sticky copies and keeps the order.
    public func viewOpened() async throws {
        sticky = []
        try await refresh()
    }

    /// Sorted by: saved under `itemSort`, then the order is worked out again.
    public func setSort(_ key: TallySort) async throws {
        var saveFailure: Error?
        do { try options.setItemSort(key, in: store) } catch { saveFailure = error }  // the order still changes for this run
        try await resort()
        if let saveFailure { throw saveFailure }
    }

    public func setQuery(_ text: String) async throws {
        if options.setQuery(text) { sticky = [] }
        try await refresh()
    }

    public func setHideReceived(_ on: Bool) async throws {
        if on != options.hideDone { sticky = [] }
        options.hideDone = on
        try await refresh()
    }

    public func clearSearch() async throws { try await setQuery("") }

    public func checkIn(key: String, count: Int) async throws {
        do { try store.commitReceived(key, count: count) } catch {
            checkInError = "Could not save the check-in. \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        bulkUndoName = nil
        if count > 0 { sticky.insert(key) }
        try await refresh()
    }

    /// Mark all received (on) or Clear check-ins (off) on one product. It reaches every copy, the ones a filter hides
    /// too (the web's onBulk(item.items, ...)), in one save at one time. As on PackagesModel, a Mark all keeps its delta for
    /// the Undo and a Clear ends it. A failure lands in checkInError and is thrown.
    public func bulk(name: String, on: Bool) async throws {
        let takes: [BulkTake]
        let keys: [String]
        do {
            struct Pooled: Decodable { let name: String; let items: [LedgerItem] }  // tallyGroups, before the filters add `shown`
            let all = try JSONDecoder().decode([Pooled].self, from: Data(groups.utf8))
            guard let items = all.first(where: { $0.name == name })?.items else { return }
            let before = store.received()
            let counts = try await BulkRules.counts(items, on: on, received: before, engine: engine)
            takes = on ? try await BulkRules.takes(items, received: before, engine: engine) : []
            keys = Array(counts.keys)
            try store.commitReceived(counts)
        } catch {
            checkInError = "Could not save the check-in. \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        // As on PackagesModel.bulk: a Mark all that adds nothing keeps the held Undo, and a Clear ends it.
        if !on || !takes.isEmpty {
            bulkUndoTakes = takes
            bulkUndoName = on ? name : nil
        }
        if on { sticky.formUnion(keys) }  // checked in under this filter, so the copies stay shown, as a check-in keeps one
        try await refresh()
    }

    /// Takes back the last Mark all's own delta and keeps every later edit. With nothing held it writes nothing.
    public func undoBulk() async throws {
        guard bulkUndoName != nil else { return }
        let takes = bulkUndoTakes
        bulkUndoName = nil
        bulkUndoTakes = []
        do {
            try store.commitReceived(try await BulkRules.undone(takes, received: store.received(), engine: engine))
        } catch {
            checkInError = "Could not take back the check-ins. \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        try await refresh()
    }

    /// A tab change, a restore or a Reset: the held Undo is gone.
    public func endBulkUndo() { bulkUndoName = nil }

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
