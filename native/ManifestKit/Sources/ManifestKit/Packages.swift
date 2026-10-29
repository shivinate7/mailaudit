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
}

/// Rows for the Packages view: the rules engine over the ledger store
/// (rules-run-in-javascriptcore). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class PackagesModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    public private(set) var rows: [Package] = []
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

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    /// groupPackages, then sortPackages "newest" (the web default, src/app.jsx). With the stamped filter on, the list is the
    /// bundle's stampedPackagesOf on the canceled-free items, refunded packages included (stamped-filter-on-the-pipeline).
    /// Every value is built first, then rows and every map are set in one step after the last await, as
    /// MastheadModel.refresh does, so the view never draws a row without its maps. A failed call leaves its entry
    /// empty and is thrown after.
    public func load() async throws {
        let got = store.received()
        let held = store.stamps()
        let live = try await LiveItems.of(store.items(), stamps: held, engine: engine)
        let active = try await engine.call("dropCanceled", "[\(try json(store.items()))]")
        let stampedGks = try await StampRules.keys(where: "hasStamp", in: held, engine: engine)
        let stampedRaw = try await engine.call("stampedPackagesOf", "[\(active),\(try json(["$set": Array(stampedGks)]))]")
        let stamped = try JSONDecoder().decode([Package].self, from: Data(stampedRaw.utf8))
        let on = showStamped && !stamped.isEmpty
        let grouped = on ? stampedRaw : try await engine.call("groupPackages", "[\(live)]")
        let sorted = try await engine.call("sortPackages", "[\(grouped),\"newest\",\(try json(got))]")
        let newRows = try JSONDecoder().decode([Package].self, from: Data(sorted.utf8))
        let refunds = try await StampRules.keys(where: "isRefundStamp", in: held, engine: engine)
        let kinds = try await StampRules.kinds(engine: engine)
        var (updates, failure) = try await refresh(newRows.map { ($0, $0.items) }, received: got, withStatic: true)
        let (texts, textFailure) = await stampTexts(stamped, held: held, refunds: refunds, received: got)
        updates += texts
        failure = failure ?? textFailure
        rows = newRows
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
        apply(updates)
        if let failure { throw failure }
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
             link(String, URL?), pill(String, String?), bar(String, Double?), band(String, String?), refundPill(String, String?)
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

    /// A tap: the bundle's toggleCount picks the count to write. Every failure, rule or save,
    /// lands in checkInError and is thrown.
    public func toggle(key: String) async throws {
        guard let item = rows.lazy.flatMap(\.items).first(where: { $0.key == key }) else { return }
        do {
            let out = try await engine.call("toggleCount", "[\(received[key] ?? 0),\(item.qty)]")
            guard let count = Int(out) else { throw RulesEngine.Failure.threw("toggleCount gave \(out)") }
            try await checkIn(key: key, count: count)
        } catch {
            if checkInError == nil { checkInError = "Could not check in. \(error.localizedDescription)" }
            throw error
        }
    }

    /// For the view: a tap whose failure is already in checkInError.
    public func tap(key: String) async { try? await toggle(key: key) }

    /// A stepper tap, as the web stepper: one copy more or fewer, kept within 0 and the line's qty.
    /// It takes the checkbox's save path, checkIn, so a failure lands in checkInError.
    public func step(key: String, by delta: Int) async {
        guard let item = rows.lazy.flatMap(\.items).first(where: { $0.key == key }) else { return }
        let got = min(received[key] ?? 0, item.qty)  // an over-count steps from the clamped figure, as on the web
        try? await checkIn(key: key, count: min(max(got + delta, 0), item.qty))
    }

    public func checkIn(key: String, count: Int) async throws {
        do { try store.commitReceived(key, count: count) } catch {
            checkInError = "Could not save the check-in. \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        received = store.received()
        if let pkg = rows.first(where: { $0.items.contains { $0.key == key } }),
            let item = pkg.items.first(where: { $0.key == key }) {
            do {
                var (updates, failure) = try await refresh([(pkg, [item])], received: received, withStatic: false)
                if refundGks.contains(pkg.gk) {
                    let (texts, textFailure) = await stampTexts([pkg], held: stamps, refunds: [pkg.gk], received: received)
                    updates += texts.filter { if case .refundPill = $0 { return true } else { return false } }
                    failure = failure ?? textFailure
                }
                apply(updates)
                if let failure { throw failure }
            } catch {
                checkInError = "Saved, but the label could not refresh. \(error.localizedDescription)"
                throw error
            }
        }
    }

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
    public func toggleStamped() async throws {
        showStamped.toggle()
        try await load()
    }

    private func write(_ failure: String, _ act: () async throws -> Void) async throws {
        do { try await act() } catch {
            checkInError = "\(failure) \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        try await load()
    }
}
