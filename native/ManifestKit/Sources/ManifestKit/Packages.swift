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
    /// Set when the last check-in could not be saved; nil after one that was.
    public private(set) var checkInError: String?

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    /// groupPackages, then sortPackages "newest" (the web default, src/app.jsx).
    public func load() async throws {
        let got = store.received()
        let live = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        let grouped = try await engine.call("groupPackages", "[\(live)]")
        let sorted = try await engine.call("sortPackages", "[\(grouped),\"newest\",\(try json(got))]")
        rows = try JSONDecoder().decode([Package].self, from: Data(sorted.utf8))
        received = got
        labels = [:]
        done = [:]
        pills = [:]
        bars = [:]
        readouts = [:]
        details = [:]
        orderLinks = [:]
        try await refresh(rows.map { ($0, $0.items) }, withStatic: true)
    }

    private func encode<T: Encodable>(_ value: T) throws -> String {
        String(decoding: try JSONEncoder().encode(value), as: UTF8.self)
    }

    /// One engine hop for the given packages: each listed line's isDone, countLabel and gotQty, and each package's
    /// pill and bar. `withStatic` adds what a check-in cannot change, the detail lines and the order link.
    /// Each call stands alone: one failing must not stop the rest. The first error is thrown.
    private func refresh(_ targets: [(p: Package, items: [LedgerItem])], withStatic: Bool) async throws {
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
        var failure: Error?
        for (call, result) in zip(plan, await engine.calls(calls)) {
            do {
                let out = try result.get()
                switch call {
                case .done(let key): done[key] = out == "true"
                case .label(let key): labels[key] = try string(out)
                case .readout(let key): readouts[key] = try string(out)
                case .detail(let key): details[key] = try string(out)
                case .link(let gk): orderLinks[gk] = try string(out).flatMap { URL(string: $0) }
                case .pill(let gk): pills[gk] = try string(out)
                case .totals(let gk):
                    let t = try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [String: Any]
                    if let got = t?["got"] as? Int, let total = t?["total"] as? Int, got > 0, got < total {
                        bars[gk] = Double(got) / Double(total)
                    } else {
                        bars[gk] = nil
                    }
                }
            } catch { failure = failure ?? error }
        }
        if let failure { throw failure }
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

    public func checkIn(key: String, count: Int) async throws {
        do { try store.commitReceived(key, count: count) } catch {
            checkInError = "Could not save the check-in. \(error.localizedDescription)"
            throw error
        }
        checkInError = nil
        received = store.received()
        if let pkg = rows.first(where: { $0.items.contains { $0.key == key } }),
            let item = pkg.items.first(where: { $0.key == key }) {
            do { try await refresh([(pkg, [item])], withStatic: false) } catch {
                checkInError = "Saved, but the label could not refresh. \(error.localizedDescription)"
                throw error
            }
        }
    }
}
