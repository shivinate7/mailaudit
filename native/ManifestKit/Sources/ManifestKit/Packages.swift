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
        for p in rows { for it in p.items { try await refreshLabel(it) } }
    }

    /// isDone and countLabel run apart: one failing must not stop the other. The first error is thrown.
    private func refreshLabel(_ it: LedgerItem) async throws {
        let args = "[\(received[it.key] ?? 0),\(it.qty)]"
        var failure: Error?
        do { done[it.key] = try await engine.call("isDone", args) == "true" } catch { failure = error }
        do {
            let out = try await engine.call("countLabel", args)
            labels[it.key] = try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String
        } catch { failure = failure ?? error }
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
        if let item = rows.lazy.flatMap(\.items).first(where: { $0.key == key }) {
            do { try await refreshLabel(item) } catch {
                checkInError = "Saved, but the label could not refresh. \(error.localizedDescription)"
                throw error
            }
        }
    }
}
