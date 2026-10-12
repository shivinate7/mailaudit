import Foundation
import Observation

public struct LedgerItem: Decodable, Equatable, Sendable {
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
        let grouped = try await engine.call("groupPackages", try json([store.items()]))
        let sorted = try await engine.call("sortPackages", "[\(grouped),\"newest\",\(try json(got))]")
        rows = try JSONDecoder().decode([Package].self, from: Data(sorted.utf8))
        received = got
    }

    public func checkIn(key: String, count: Int) async throws {
        store.setReceived(key, count: count)
        try store.save()
        received = store.received()
    }
}
