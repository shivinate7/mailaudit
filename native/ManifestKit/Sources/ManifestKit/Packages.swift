import Foundation
import Observation

public struct LedgerItem: Codable, Equatable, Sendable {
    public let key, orderId, seller, name, set, condition, finish: String
    public let qty: Int
    public let price: Double
    public let date, tracking, line: String
}

public struct Package: Decodable, Equatable, Sendable {
    public let gk, orderId, seller, date, tracking: String
    public let items: [LedgerItem]
    /// The lines Find and Showing took out of this card, from the bundle's filterPackages. 0 on a package that was not filtered.
    public let hiddenByFilters: Int

    private enum CodingKeys: String, CodingKey { case gk, orderId, seller, date, tracking, items, hiddenByFilters }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        gk = try c.decode(String.self, forKey: .gk)
        orderId = try c.decode(String.self, forKey: .orderId)
        seller = try c.decode(String.self, forKey: .seller)
        date = try c.decode(String.self, forKey: .date)
        tracking = try c.decode(String.self, forKey: .tracking)
        items = try c.decode([LedgerItem].self, forKey: .items)
        hiddenByFilters = try c.decodeIfPresent(Int.self, forKey: .hiddenByFilters) ?? 0
    }
}

/// Rows for the Packages view: the rules engine over the ledger store
/// (rules-run-in-javascriptcore). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class PackagesModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    /// Find, Showing, Orders from and the sorts, shared with the Tally and the Ledger tab's View group.
    public let options: ViewOptions
    /// The packages the list is built from, as JSON: the range-kept live packages, or the stamped ones under the stamped filter.
    @ObservationIgnored private var source = "[]"
    /// The same packages, whole, for finding the package a line belongs to after the filters have dropped it.
    @ObservationIgnored private var sourceRows: [Package] = []
    /// Group key to place, set by the last sort and kept while the user checks in (no-layout-shift-under-pointer).
    @ObservationIgnored private var order: [String: Int] = [:]
    /// Lines checked in under this filter context; filterPackages keeps them shown.
    @ObservationIgnored private var sticky: Set<String> = []
    /// The packages the list shows: the source, narrowed by Find and Showing, in the frozen order.
    public private(set) var rows: [Package] = []
    /// Whether the ledger holds any item at all, for the Find pill (drawn only with items).
    public private(set) var hasItems = false
    /// Every live package, whatever the stamped filter: the groupPackages of LiveItems.of, so canceled and refunded
    /// packages are out. Card in Hand reads it, not `rows` (stamped-filter-on-the-pipeline).
    public private(set) var liveRows: [Package] = []
    public private(set) var received: [String: Int] = [:]
    /// "N of M" per item key, from the bundle's countLabel.
    public private(set) var labels: [String: String] = [:]
    /// Whether each item key is fully in, from the bundle's isDone.
    public private(set) var done: [String: Bool] = [:]
    /// Per package gk, from the bundle's packagePill: no entry when no copy is owed.
    public private(set) var pills: [String: String] = [:]
    /// Per package gk, copies in over copies owed (the bundle's totalsOf): an entry only while some but not all are in.
    public private(set) var bars: [String: Double] = [:]
    /// Per item key of a line with more than one copy, from the bundle's gotQty: "got/qty". No entry for a one-copy line.
    public private(set) var readouts: [String: String] = [:]
    /// Per item key, from the bundle's itemDetail.
    public private(set) var details: [String: String] = [:]
    /// Per package gk, from the bundle's tcgplayerOrderUrl.
    public private(set) var orderLinks: [String: URL] = [:]
    /// Set when the last check-in or stamp write could not be saved; nil after one that was.
    public private(set) var checkInError: String?
    /// The stored stamps, group key to record, tombstones included.
    public private(set) var stamps: [String: [String: Any]] = [:]
    /// The live stamps (the bundle's hasStamp) among the packages before the refund exclusion, canceled orders left out:
    /// the stamped cell's count (stamped-filter-on-the-pipeline).
    public private(set) var stampedCount = 0
    /// The stamped filter. Not saved: it starts off, and turns itself off once no stamp is left to list.
    public private(set) var showStamped = false
    /// Per stamped package gk, from the bundle's stampBandText.
    public private(set) var bands: [String: String] = [:]
    /// Per refunded package gk, from the bundle's refundedPill: no entry when no copy is owed.
    public private(set) var refundPills: [String: String] = [:]
    /// The bundle's STAMP_KINDS, in its order.
    public private(set) var stampKinds: [StampKind] = []
    /// The packages the bundle's isRefundStamp names, so a check-in can refresh a refunded package's pill.
    @ObservationIgnored private var refundGks: Set<String> = []
    /// Per package gk, the copies in now (the bundle's totalsOf got, each line clamped to its qty): the Clear ask's N.
    public private(set) var gots: [String: Int] = [:]
    /// The package the held Mark all Undo is for. nil when there is none: the next write on this device, a newer Mark all
    /// that adds a copy, a Clear or endBulkUndo() ends it (undo-removes-only-its-delta). A Worker apply does not.
    public private(set) var bulkUndoGk: String?
    private var bulkUndoTakes: [BulkTake] = []
    /// The check-ins the held Undo takes back: the one source of the Undo hint's count. 0 when none is held.
    public var bulkUndoCount: Int { bulkUndoGk == nil ? 0 : bulkUndoTakes.reduce(0) { $0 + $1.take } }
    /// The store's postsSaved when checkInError was last set: only a Post after that is a good write that outdates the failure line.
    @ObservationIgnored private var errorPosts = 0

    public init(engine: RulesEngine, store: LedgerStore, options: ViewOptions = ViewOptions()) {
        self.engine = engine
        self.store = store
        self.options = options
    }

    public var query: String { options.query }
    /// Showing: true is Unreceived (src/app.jsx `hideDone`). The Tally calls the same choice hideReceived.
    public var hideReceived: Bool { options.hideDone }
    public var sort: PackageSort { options.sortBy }
    /// The packages that draw their whole order, whatever Find and Showing say.
    public var revealed: Set<String> { options.revealed }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    /// The list the web draws (src/app.jsx): the live items kept by the range (the store's saved Orders from, against the store's
    /// clock), grouped, ordered by the saved Sorted by, then narrowed by Find and Showing. With the stamped filter on, the source is
    /// the bundle's stampedPackagesOf on the range-kept, canceled-free items, refunded packages included
    /// (stamped-filter-on-the-pipeline). `liveRows` stays the whole live set, range and all, for Card in Hand.
    /// Every value is built first, then rows and every map are set in one step after the last await, as
    /// MastheadModel.refresh does, so the view never draws a row without its maps. A failed call leaves its entry
    /// empty and is thrown after.
    public func load() async throws {
        options.read(store)
        let got = store.received()
        let held = store.stamps()
        let live = try await LiveItems.of(store.items(), stamps: held, engine: engine)
        let active = try await engine.call("dropCanceled", "[\(try json(store.items()))]")
        let range = try await ViewRange.range(options.dateFilter, store: store, engine: engine)
        let rangedActive = try await ViewRange.apply(active, range: range, engine: engine)
        let rangedLive = try await ViewRange.apply(live, range: range, engine: engine)
        let stampedGks = try await StampRules.keys(where: "hasStamp", in: held, engine: engine)
        let stampedRaw = try await engine.call("stampedPackagesOf", "[\(rangedActive),\(try json(["$set": Array(stampedGks)]))]")
        let stamped = try JSONDecoder().decode([Package].self, from: Data(stampedRaw.utf8))
        let on = showStamped && !stamped.isEmpty
        let liveGrouped = try await engine.call("groupPackages", "[\(live)]")
        let newLive = try JSONDecoder().decode([Package].self, from: Data(liveGrouped.utf8))
        let rangedGrouped = try await engine.call("groupPackages", "[\(rangedLive)]")
        let newSource = on ? stampedRaw : rangedGrouped
        let newOrder = try await Self.placed(newSource, by: options.sortBy, received: got, engine: engine)
        let newRows = try await filtered(newSource, order: newOrder, received: got, stamps: held)
        let refunds = try await StampRules.keys(where: "isRefundStamp", in: held, engine: engine)
        let kinds = try await StampRules.kinds(engine: engine)
        // The maps cover the live lines the range and the filters hide too, and the refunded packages the stamped list adds.
        let liveGks = Set(newLive.map(\.gk))
        let sourcePackages = try JSONDecoder().decode([Package].self, from: Data(newSource.utf8))
        let covered = newLive + sourcePackages.filter { !liveGks.contains($0.gk) }
        var (updates, failure) = try await refresh(covered.map { ($0, $0.items) }, received: got, withStatic: true)
        let (texts, textFailure) = await stampTexts(stamped, held: held, refunds: refunds, received: got)
        updates += texts
        failure = failure ?? textFailure
        let (kept, total) = (ViewRange.count(rangedLive), ViewRange.count(live))
        source = newSource
        sourceRows = sourcePackages
        order = newOrder
        rows = newRows
        liveRows = newLive
        hasItems = !store.items().isEmpty
        options.lineCount = kept
        options.outsideCount = total - kept
        received = got
        stamps = held
        stampedCount = stamped.count
        showStamped = on
        stampKinds = kinds
        refundGks = refunds
        labels = [:]
        done = [:]
        pills = [:]
        bars = [:]
        readouts = [:]
        details = [:]
        orderLinks = [:]
        bands = [:]
        refundPills = [:]
        gots = [:]
        apply(updates)
        // Only a Post after the failure clears the line here. A reload from sync or a reply, or a Post that came before
        // the failure, must not hide a failure the owner has not retried.
        if checkInError != nil, store.postsSaved > errorPosts { checkInError = nil }
        if let failure { throw failure }
    }

    /// Group key to place, from the bundle's sortPackages with the counts as they are now. Callers keep it while the user checks
    /// in, so a value-based sort does not reshuffle under the thumb (no-layout-shift-under-pointer).
    private static func placed(_ source: String, by key: PackageSort, received: [String: Int], engine: RulesEngine) async throws -> [String: Int] {
        struct Keyed: Decodable { let gk: String }
        let counts = String(decoding: try JSONSerialization.data(withJSONObject: received), as: UTF8.self)
        let sorted = try await engine.call("sortPackages", "[\(source),\"\(key.rawValue)\",\(counts)]")
        let gks = try JSONDecoder().decode([Keyed].self, from: Data(sorted.utf8)).map(\.gk)
        return Dictionary(gks.enumerated().map { ($1, $0) }, uniquingKeysWith: { first, _ in first })
    }

    /// The bundle's filterPackages over `source`, in `order`. The stamps cross as data, so Find reads a stamp's label and note.
    private func filtered(_ source: String, order: [String: Int], received: [String: Int], stamps: [String: [String: Any]]) async throws -> [Package] {
        let opts: [String: Any] = [
            "query": options.query, "hideDone": options.hideDone, "received": received, "stamps": stamps,
            "sticky": ["$set": Array(sticky)], "revealed": ["$set": Array(options.revealed)],
        ]
        let out = try await engine.call("filterPackages", "[\(source),\(try json(opts))]")
        let shown = try JSONDecoder().decode([Package].self, from: Data(out.utf8))
        return shown.sorted { (order[$0.gk] ?? .max) < (order[$1.gk] ?? .max) }
    }

    /// Reads the list again from the counts now, with the order kept: a completed package drops at once under Unreceived.
    private func refilter() async throws {
        rows = try await filtered(source, order: order, received: store.received(), stamps: stamps)
    }

    // MARK: Find, Showing, Sorted by (the Ledger tab's View group and the Find pill)

    /// A new query is a new question: the sticky lines and the reveals end, and the list is read again.
    public func setQuery(_ text: String) async throws {
        if options.setQuery(text) { sticky = [] }
        try await refilter()
    }

    public func clearSearch() async throws { try await setQuery("") }

    /// Showing. Changing it ends the sticky lines.
    public func setHideReceived(_ on: Bool) async throws {
        if on != options.hideDone { sticky = [] }
        options.hideDone = on
        try await refilter()
    }

    /// Sorted by: saved under `sortBy`, and the order is worked out again.
    public func setSort(_ key: PackageSort) async throws {
        var saveFailure: Error?
        do { try options.setSortBy(key, in: store) } catch { saveFailure = error }  // the order still changes for this run
        try await load()
        if let saveFailure { throw saveFailure }
    }

    /// Show the whole order of a package the filters cut down, or go back to the matches.
    public func toggleReveal(_ gk: String) async throws {
        options.toggleReveal(gk)
        try await refilter()
    }

    /// For the view: a reveal toggle whose failure is already in checkInError.
    public func reveal(_ gk: String) async {
        do { try await toggleReveal(gk) } catch { fail("Could not read the list. \(error.localizedDescription)") }
    }

    /// The Packages tab came on screen: another tab may have changed Find or the counts. Like the web, a view change ends the sticky lines
    /// and keeps the order.
    public func viewOpened() async throws {
        sticky = []
        try await refilter()
    }

    /// The band text of each stamped package and the refunded pill of each refunded one, both from the bundle.
    private func stampTexts(_ packages: [Package], held: [String: [String: Any]], refunds: Set<String>,
                            received: [String: Int]) async -> ([Update], Error?) {
        var calls: [(name: String, args: String)] = []
        var plan: [Update] = []
        do {
            for p in packages {
                calls.append(("stampBandText", "[\(try json(held[p.gk] ?? [:]))]"))
                plan.append(.band(p.gk, nil))
                if refunds.contains(p.gk) {
                    calls.append(("refundedPill", try refundArgs(p, received)))
                    plan.append(.refundPill(p.gk, nil))
                }
            }
        } catch { return ([], error) }
        var updates: [Update] = []
        var failure: Error?
        for (u, result) in zip(plan, await engine.calls(calls)) {
            do {
                let out = try JSONSerialization.jsonObject(with: Data(try result.get().utf8), options: [.fragmentsAllowed]) as? String
                switch u {
                case .band(let gk, _): updates.append(.band(gk, out))
                case .refundPill(let gk, _): updates.append(.refundPill(gk, out))
                default: break
                }
            } catch { failure = failure ?? error }
        }
        return (updates, failure)
    }

    /// refundedPill's arguments: the package's lines and only its own counts, as packagePill gets them.
    private func refundArgs(_ p: Package, _ received: [String: Int]) throws -> String {
        let own = Dictionary(p.items.compactMap { i in received[i.key].map { (i.key, $0) } }, uniquingKeysWith: { a, _ in a })
        return "[\(try encode(p.items)),\(try json(own))]"
    }

    private func encode<T: Encodable>(_ value: T) throws -> String {
        String(decoding: try JSONEncoder().encode(value), as: UTF8.self)
    }

    /// One map entry from the engine. A nil value removes the entry.
    private enum Update {
        case done(String, Bool), label(String, String?), readout(String, String?), detail(String, String?),
             link(String, URL?), pill(String, String?), bar(String, Double?), got(String, Int), band(String, String?), refundPill(String, String?)
    }

    /// Synchronous, so the view sees all of the updates or none of them.
    private func apply(_ updates: [Update]) {
        for u in updates {
            switch u {
            case .done(let k, let v): done[k] = v
            case .label(let k, let v): labels[k] = v
            case .readout(let k, let v): readouts[k] = v
            case .detail(let k, let v): details[k] = v
            case .link(let k, let v): orderLinks[k] = v
            case .pill(let k, let v): pills[k] = v
            case .bar(let k, let v): bars[k] = v
            case .got(let k, let v): gots[k] = v
            case .band(let k, let v): bands[k] = v
            case .refundPill(let k, let v): refundPills[k] = v
            }
        }
    }

    /// One engine hop for the given packages: each listed line's isDone, countLabel and gotQty, and each package's
    /// pill and bar. `withStatic` adds what a check-in cannot change, the detail lines and the order link.
    /// It changes no state: it returns the updates and the first failed call's error. One failure must not stop the rest.
    private func refresh(_ targets: [(p: Package, items: [LedgerItem])], received: [String: Int],
                         withStatic: Bool) async throws -> ([Update], Error?) {
        enum Call { case done(String), label(String), readout(String), detail(String), link(String), pill(String), totals(String) }
        var calls: [(name: String, args: String)] = []
        var plan: [Call] = []
        for (p, items) in targets {
            for it in items {
                let args = "[\(received[it.key] ?? 0),\(it.qty)]"
                calls += [("isDone", args), ("countLabel", args), ("gotQty", args)]
                plan += [.done(it.key), .label(it.key), .readout(it.key)]
                if withStatic {
                    calls.append(("itemDetail", "[\(try encode(it))]"))
                    plan.append(.detail(it.key))
                }
            }
            if withStatic {
                calls.append(("tcgplayerOrderUrl", "[\(try json(p.orderId))]"))
                plan.append(.link(p.gk))
            }
            // Only this package's counts cross into JavaScript.
            let own = Dictionary(p.items.compactMap { i in received[i.key].map { (i.key, $0) } }, uniquingKeysWith: { a, _ in a })
            let packageArgs = "[\(try encode(p.items)),\(try json(own))]"
            calls += [("packagePill", packageArgs), ("totalsOf", packageArgs)]
            plan += [.pill(p.gk), .totals(p.gk)]
        }

        func string(_ out: String) throws -> String? {
            try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String
        }
        var updates: [Update] = []
        var failure: Error?
        for (call, result) in zip(plan, await engine.calls(calls)) {
            do {
                let out = try result.get()
                switch call {
                case .done(let key): updates.append(.done(key, out == "true"))
                case .label(let key): updates.append(.label(key, try string(out)))
                case .readout(let key): updates.append(.readout(key, try string(out)))
                case .detail(let key): updates.append(.detail(key, try string(out)))
                case .link(let gk): updates.append(.link(gk, try string(out).flatMap { URL(string: $0) }))
                case .pill(let gk): updates.append(.pill(gk, try string(out)))
                case .totals(let gk):
                    let t = try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [String: Any]
                    updates.append(.got(gk, t?["got"] as? Int ?? 0))
                    if let got = t?["got"] as? Int, let total = t?["total"] as? Int, got > 0, got < total {
                        updates.append(.bar(gk, Double(got) / Double(total)))
                    } else {
                        updates.append(.bar(gk, nil))
                    }
                }
            } catch { failure = failure ?? error }
        }
        return (updates, failure)
    }

    /// The package that holds the line: a live one, or a refunded one the stamped list shows.
    private func package(holding key: String) -> Package? {
        (liveRows + sourceRows).first { $0.items.contains { $0.key == key } }
    }

    /// A tap: the bundle's toggleCount picks the count to write. Every failure, rule or save,
    /// lands in checkInError and is thrown.
    public func toggle(key: String) async throws {
        guard let item = package(holding: key)?.items.first(where: { $0.key == key }) else { return }
        do {
            let out = try await engine.call("toggleCount", "[\(received[key] ?? 0),\(item.qty)]")
            guard let count = Int(out) else { throw RulesEngine.Failure.threw("toggleCount gave \(out)") }
            try await checkIn(key: key, count: count)
        } catch {
            if checkInError == nil { fail("Could not check in. \(error.localizedDescription)") }
            throw error
        }
    }

    /// For the view: a tap whose failure is already in checkInError.
    public func tap(key: String) async { try? await toggle(key: key) }

    /// A stepper tap, as the web stepper: one copy more or fewer, kept within 0 and the line's qty.
    /// It takes the checkbox's save path, checkIn, so a failure lands in checkInError.
    public func step(key: String, by delta: Int) async {
        guard let item = package(holding: key)?.items.first(where: { $0.key == key }) else { return }
        let got = min(received[key] ?? 0, item.qty)  // an over-count steps from the clamped figure, as on the web
        try? await checkIn(key: key, count: min(max(got + delta, 0), item.qty))
    }

    public func checkIn(key: String, count: Int) async throws {
        do { try store.commitReceived(key, count: count) } catch {
            fail("Could not save the check-in. \(error.localizedDescription)")
            throw error
        }
        checkInError = nil
        bulkUndoGk = nil
        received = store.received()
        if count > 0 { sticky.insert(key) }  // checked in under this filter, so the line stays until the filters change
        try await relist()
        if let pkg = package(holding: key), let item = pkg.items.first(where: { $0.key == key }) {
            try await reread(pkg, items: [item])
        }
    }

    /// The list from the counts now. A failure lands in checkInError and is thrown, as a failed label refresh does.
    private func relist() async throws {
        do { try await refilter() } catch {
            fail("Saved, but the list could not refresh. \(error.localizedDescription)")
            throw error
        }
    }

    /// The package with this group key, whole (a live one, or a refunded one the stamped list shows).
    private func package(gk: String) -> Package? { (liveRows + sourceRows).first { $0.gk == gk } }

    /// The package's labels, pill and bar (and a refunded package's pill) from the counts now in `received`.
    private func reread(_ pkg: Package, items: [LedgerItem]) async throws {
        do {
            var (updates, failure) = try await refresh([(pkg, items)], received: received, withStatic: false)
            if refundGks.contains(pkg.gk) {
                let (texts, textFailure) = await stampTexts([pkg], held: stamps, refunds: [pkg.gk], received: received)
                updates += texts.filter { if case .refundPill = $0 { return true } else { return false } }
                failure = failure ?? textFailure
            }
            apply(updates)
            if let failure { throw failure }
        } catch {
            fail("Saved, but the label could not refresh. \(error.localizedDescription)")
            throw error
        }
    }

    /// Mark all received (on) or Clear check-ins (off) on one package: every line goes to its qty or to 0, in one save at one
    /// time. A Mark all keeps what it added for the Undo; a Clear ends the Undo and leaves none. A failure, rule or save, lands
    /// in checkInError and is thrown.
    public func bulk(gk: String, on: Bool) async throws {
        guard let pkg = rows.first(where: { $0.gk == gk }) else { return }
        let takes: [BulkTake]
        do {
            let before = store.received()
            let counts = try await BulkRules.counts(pkg.items, on: on, received: before, engine: engine)
            takes = on ? try await BulkRules.takes(pkg.items, received: before, engine: engine) : []
            try store.commitReceived(counts)
        } catch {
            fail("Could not save the check-in. \(error.localizedDescription)")
            throw error
        }
        checkInError = nil
        // A Mark all that adds nothing has nothing to undo, so the held Undo stays. A Clear ends it.
        if !on || !takes.isEmpty {
            bulkUndoTakes = takes
            bulkUndoGk = on ? gk : nil
        }
        received = store.received()
        try await relist()
        try await reread(pkg, items: pkg.items)
    }

    /// Takes back the last Mark all's own delta and keeps every later edit. With nothing held it writes nothing.
    public func undoBulk() async throws {
        guard let gk = bulkUndoGk else { return }
        let takes = bulkUndoTakes
        bulkUndoGk = nil
        bulkUndoTakes = []
        do {
            let counts = try await BulkRules.undone(takes, received: store.received(), engine: engine)
            try store.commitReceived(counts)
        } catch {
            fail("Could not take back the check-ins. \(error.localizedDescription)")
            throw error
        }
        checkInError = nil
        received = store.received()
        try await relist()
        if let pkg = package(gk: gk) { try await reread(pkg, items: pkg.items) }
    }

    /// A tab change, a restore or a Reset: the held Undo is gone.
    public func endBulkUndo() { bulkUndoGk = nil }

    /// Stamps the package (the one stamp writer, StampWriter), then reads the ledger again: a refund leaves the list,
    /// and the stamped count and the bands follow. A failure lands in checkInError and is thrown.
    public func stamp(_ gk: String, kind: String, note: String) async throws {
        try await write("Could not save the stamp.") { try await StampWriter.write(gk, kind: kind, note: note, store: store, engine: engine) }
    }

    /// Removes the package's stamp: a tombstone (stamp-removal-writes-a-tombstone), then the same reload.
    public func removeStamp(_ gk: String) async throws {
        try await write("Could not remove the stamp.") { try await StampWriter.remove(gk, store: store, engine: engine) }
    }

    /// Turns the stamped filter on or off and reads the list again. It changes the list, not the counts.
    /// A failed read lands in checkInError and is thrown.
    public func toggleStamped() async throws {
        showStamped.toggle()
        sticky = []
        do { try await load() } catch {
            showStamped.toggle()  // the rows on screen are still the old filter's, so the cell says that filter
            fail("Could not read the list. \(error.localizedDescription)")
            throw error
        }
        checkInError = nil
    }

    private func fail(_ message: String) {
        errorPosts = store.postsSaved
        checkInError = message
    }

    private func write(_ failure: String, _ act: () async throws -> Void) async throws {
        do { try await act() } catch {
            fail("\(failure) \(error.localizedDescription)")
            throw error
        }
        bulkUndoGk = nil
        do { try await load() } catch {
            fail("Saved, but the list could not refresh. \(error.localizedDescription)")
            throw error
        }
        checkInError = nil
    }
}
