import Foundation
import Observation

/// The two list tabs the Sorted by row can order. The Ledger tab shows the list of the last one left (src/app.jsx `lastList`).
public enum ListTab: Sendable { case packages, tally }

/// The Packages sort keys, in the web's order. The raw value is the key sortPackages takes.
/// The labels are PKG_SORTS in src/app.jsx. Swift keeps its own copy, as TallySort does for ITEM_SORTS: the labels
/// live in app.jsx, not in the rules bundle (a copy with a stated reason, building-one-home-per-capability).
public enum PackageSort: String, CaseIterable, Sendable {
    case newest, oldest, value, rate, seller

    public var label: String {
        switch self {
        case .newest: "Newest"
        case .oldest: "Oldest"
        case .value: "$ remaining"
        case .rate: "Unit rate"
        case .seller: "Seller A\u{2013}Z"
        }
    }
}

/// The seven Orders from presets, in the web's order (RANGES in src/app.jsx; a copy for the reason PackageSort gives).
public enum RangePreset: CaseIterable, Sendable {
    case all, d30, d45, d60, d90, days, custom

    public var label: String {
        switch self {
        case .all: "All time"
        case .d30: "30 days"
        case .d45: "45 days"
        case .d60: "60 days"
        case .d90: "90 days"
        case .days: "Last\u{2026}"
        case .custom: "By month"
        }
    }

    /// The value the saved `dateFilter.preset` holds: a string, or the number of days.
    var saved: Any {
        switch self {
        case .all: "all"
        case .d30: 30
        case .d45: 45
        case .d60: 60
        case .d90: 90
        case .days: "days"
        case .custom: "custom"
        }
    }

    init?(saved value: Any?) {
        if let n = value as? Int {
            switch n {
            case 30: self = .d30
            case 45: self = .d45
            case 60: self = .d60
            case 90: self = .d90
            default: return nil
            }
        } else if let s = value as? String {
            switch s {
            case "all": self = .all
            case "days": self = .days
            case "custom": self = .custom
            default: return nil
            }
        } else { return nil }
    }
}

/// The saved `dateFilter`: `{ preset, from, to, days }` (saved-state-shape). `from` and `to` are ISO days, `days` the text
/// of the Last field. The bundle's dateRange turns it into a range.
public struct DateFilter: Equatable, Sendable {
    public var preset = RangePreset.all
    public var from = ""
    public var to = ""
    public var days: String?

    public init() {}

    /// A saved value, or the default for a value that is no filter (the web keeps its default then too).
    init(saved value: Any?) {
        guard let d = value as? [String: Any], let p = RangePreset(saved: d["preset"]) else { return }
        preset = p
        from = d["from"] as? String ?? ""
        to = d["to"] as? String ?? ""
        days = d["days"] as? String
    }

    /// The object the store keeps and the bundle's dateRange reads.
    var saved: [String: Any] {
        var out: [String: Any] = ["preset": preset.saved, "from": from, "to": to]
        if let days { out["days"] = days }
        return out
    }

    /// The Orders from row's value (rangeLabel in src/app.jsx, less the month name of a whole-month range).
    public var label: String {
        switch preset {
        case .days: days.map { $0.isEmpty ? "Last\u{2026}" : "Last \($0)d" } ?? "Last\u{2026}"
        case .custom: from.isEmpty && to.isEmpty ? preset.label : "Custom"
        default: preset.label
        }
    }
}

/// One cell of the By month picker, from the bundle's monthChoices: the order months that exist, newest first. `from` and `to`
/// are the ISO days the cell picks.
public struct MonthChoice: Decodable, Equatable, Sendable {
    public let key, label, from, to: String
}

/// The choices Packages and Tally share: one Find query, one Showing, one reveal set, one Orders from and the two sorts
/// (src/app.jsx `query`, `hideDone`, `revealed`, `dateFilter`, `sortBy`, `itemSort`). The models and the Ledger tab's View group
/// hold the same instance. Find, Showing and the reveals are not saved (saved-state-shape); the last three are, under the
/// keys the web writes.
@MainActor @Observable
public final class ViewOptions {
    public private(set) var query = ""
    /// Showing: true is Unreceived. Every load starts there (ruled-head-showing-unreceived).
    public var hideDone = true
    /// Packages that ignore Find and Showing and draw their whole order.
    public private(set) var revealed: Set<String> = []
    public private(set) var sortBy = PackageSort.newest
    public private(set) var itemSort = TallySort.missing
    public private(set) var dateFilter = DateFilter()
    /// The list tab left last; Sorted by sorts that list. Native opens on Ledger, so it starts as Packages.
    public var lastList = ListTab.packages
    /// The lines the range keeps and the lines it leaves out, for the Orders from row's sub line. Set by PackagesModel.load.
    public internal(set) var lineCount = 0
    public internal(set) var outsideCount = 0
    /// The months the By month picker offers, from the bundle's monthChoices over every order. Set by PackagesModel.load.
    public internal(set) var months: [MonthChoice] = []
    /// What the bundle's rangeMonthLabel read for a whole-month range, and the range it read: the label stands only while
    /// the saved range is still that one, so a changed range never shows a stale month.
    private var monthReading: (from: String, to: String, label: String)?

    /// Orders from's value (rangeLabel in src/app.jsx): a custom range that is one whole month reads as that month.
    public var rangeLabel: String {
        if dateFilter.preset == .custom, let r = monthReading, r.from == dateFilter.from, r.to == dateFilter.to { return r.label }
        return dateFilter.label
    }

    func setMonthReading(_ label: String?) {
        monthReading = label.map { (dateFilter.from, dateFilter.to, $0) }
    }

    /// Picks a whole month: the bundle's cell range, saved as a custom range, and read back as the month's name, not "Custom".
    public func setMonth(_ choice: MonthChoice, in store: LedgerStore) throws {
        var next = dateFilter
        next.preset = .custom
        next.from = choice.from
        next.to = choice.to
        monthReading = (choice.from, choice.to, choice.label)
        try setDateFilter(next, in: store)
    }

    public init() {}

    /// Takes the saved choices from the store, or their defaults when it holds none (a Reset clears them).
    func read(_ store: LedgerStore) {
        let saved = store.viewPreferences()
        let sort = saved.sortBy.flatMap(PackageSort.init(rawValue:)) ?? .newest
        let item = saved.itemSort.flatMap(TallySort.init(rawValue:)) ?? .missing
        let range = DateFilter(saved: saved.dateFilter)
        if sortBy != sort { sortBy = sort }
        if itemSort != item { itemSort = item }
        if dateFilter != range { dateFilter = range }
    }

    /// True when the query changed. A new query is a new question, so the reveals end (src/app.jsx, the effect on query and dateFilter).
    func setQuery(_ text: String) -> Bool {
        guard text != query else { return false }
        query = text
        revealed = []
        return true
    }

    func toggleReveal(_ gk: String) {
        if revealed.contains(gk) { revealed.remove(gk) } else { revealed.insert(gk) }
    }

    /// Each setter below keeps the choice in memory and then writes it. A failed write throws, and the choice stays for this run.
    public func setSortBy(_ key: PackageSort, in store: LedgerStore) throws {
        sortBy = key
        try store.savePreference("sortBy", key.rawValue)
    }

    public func setItemSort(_ key: TallySort, in store: LedgerStore) throws {
        itemSort = key
        try store.savePreference("itemSort", key.rawValue)
    }

    public func setDateFilter(_ filter: DateFilter, in store: LedgerStore) throws {
        if filter != dateFilter { revealed = [] }
        dateFilter = filter
        try store.savePreference("dateFilter", filter.saved)
    }
}

extension LedgerStore {
    /// The saved view preferences. `cardSort` is the key itemSort shipped under before the rename; it is read when itemSort is
    /// absent, never written (saved-state-shape).
    func viewPreferences() -> (sortBy: String?, itemSort: String?, dateFilter: Any?) {
        (doc["sortBy"] as? String, (doc["itemSort"] as? String) ?? (doc["cardSort"] as? String), doc["dateFilter"])
    }

    /// Saves one view preference. A choice of view is not ledger data: it arms no sync POST and moves no generation, as the
    /// web's save of dateFilter, sortBy or itemSort arms no push (saved-state-shape). A failed save leaves the ledger as it was.
    func savePreference(_ key: String, _ value: Any) throws {
        let old = doc
        doc[key] = value
        do { try save() } catch { doc = old; throw error }
    }
}

/// The date range the Packages, Tally and Masthead models share: the bundle's dateRange against the store's clock, then inRange.
@MainActor
enum ViewRange {
    /// `null`, or the `{from, to}` object dateRange gives, as JSON.
    static func range(_ filter: DateFilter, store: LedgerStore, engine: RulesEngine) async throws -> String {
        try await engine.call("dateRange", "[\(try LiveItems.json(filter.saved)),\(try LiveItems.json(store.clock()))]")
    }

    /// The items inRange keeps. With no range every item stays, and no call is made.
    static func apply(_ itemsJSON: String, range: String, engine: RulesEngine) async throws -> String {
        range == "null" ? itemsJSON : try await engine.call("inRange", "[\(itemsJSON),\(range)]")
    }

    /// The number of items in a JSON array.
    static func count(_ itemsJSON: String) -> Int {
        ((try? JSONSerialization.jsonObject(with: Data(itemsJSON.utf8))) as? [Any])?.count ?? 0
    }
}
