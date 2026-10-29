import Foundation

/// What a Mark all added to one line: the copies it took, and the line's qty, as the bundle's bulkTakes gives them.
/// The model keeps the list for the Undo (undo-removes-only-its-delta).
public struct BulkTake: Codable, Equatable, Sendable {
    public let itemKey: String
    public let take, qty: Int
}

/// The counts of Mark all received, Clear check-ins and the Undo of a Mark all, from the bundle's bulkApply, bulkTakes and
/// undoBulk (rules-run-in-javascriptcore). Swift keeps no copy of the rules. The Packages card and the Tally row both call
/// this, so the two models share one home.
@MainActor
enum BulkRules {
    private static func decode<T: Decodable>(_ type: T.Type, _ out: String) throws -> T {
        try JSONDecoder().decode(T.self, from: Data(out.utf8))
    }

    private static func encode<T: Encodable>(_ value: T) throws -> String {
        String(decoding: try JSONEncoder().encode(value), as: UTF8.self)
    }

    /// The count each of `items` goes to: its qty on Mark all, 0 on Clear. A key that is no line of `items` is not listed.
    static func counts(_ items: [LedgerItem], on: Bool, received: [String: Int], engine: RulesEngine) async throws -> [String: Int] {
        let out = try await engine.call("bulkApply", "[\(try encode(items)),\(on),\(try LiveItems.json(received))]")
        let map = try decode([String: Int].self, out)
        return Dictionary(items.map { ($0.key, map[$0.key] ?? 0) }, uniquingKeysWith: { first, _ in first })
    }

    /// What a Mark all adds to each line, the lines it adds nothing to left out.
    static func takes(_ items: [LedgerItem], received: [String: Int], engine: RulesEngine) async throws -> [BulkTake] {
        let out = try await engine.call("bulkTakes", "[\(try encode(items)),\(try LiveItems.json(received))]")
        return try decode([BulkTake].self, out).filter { $0.take > 0 }
    }

    /// The count each line of `takes` goes back to. A key with no take is not listed, so a later edit to it stays.
    static func undone(_ takes: [BulkTake], received: [String: Int], engine: RulesEngine) async throws -> [String: Int] {
        let out = try await engine.call("undoBulk", "[\(try encode(takes)),\(try LiveItems.json(received))]")
        let map = try decode([String: Int].self, out)
        return Dictionary(takes.map { ($0.itemKey, map[$0.itemKey] ?? 0) }, uniquingKeysWith: { first, _ in first })
    }
}
