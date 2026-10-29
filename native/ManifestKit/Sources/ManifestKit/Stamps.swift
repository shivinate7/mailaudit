import Foundation

/// A stamp kind and its label, one element of the bundle's STAMP_KINDS.
public struct StampKind: Equatable, Sendable {
    public let kind: String
    public let label: String
}

/// What the stamp rules in the bundle (src/view-rules.mjs) say about each stored stamp. Swift keeps no list of kinds
/// and no test of its own (one-stamp-per-package, rules-run-in-javascriptcore).
@MainActor
enum StampRules {
    /// The group keys whose stamp the bundle's `rule` (hasStamp or isRefundStamp) names, one engine hop for all.
    static func keys(where rule: String, in stamps: [String: [String: Any]], engine: RulesEngine) async throws -> Set<String> {
        let entries = Array(stamps)
        let answers = await engine.calls(try entries.map { (rule, "[\(try LiveItems.json($0.value))]") })
        var out = Set<String>()
        for (entry, answer) in zip(entries, answers) {
            if try answer.get() == "true" { out.insert(entry.key) }
        }
        return out
    }

    /// STAMP_KINDS, in the bundle's order.
    static func kinds(engine: RulesEngine) async throws -> [StampKind] {
        let text = try await engine.constant("STAMP_KINDS")
        let pairs = try JSONSerialization.jsonObject(with: Data(text.utf8)) as? [[String]] ?? []
        return pairs.compactMap { $0.count == 2 ? StampKind(kind: $0[0], label: $0[1]) : nil }
    }
}

/// The one writer of a stamp, for Packages and the past-transit page alike (one-stamp-per-package). The record is the
/// bundle's nextStamp: the stored stamp, the patch, the device's local day and the store's clock go in, and what comes
/// back is saved as it is. A failed save leaves the ledger as it was.
@MainActor
enum StampWriter {
    /// The device's local day as YYYY-MM-DD, like the web's todayLocal.
    static func today(_ ms: Double) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: Date(timeIntervalSince1970: ms / 1000))
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// The bundle's nextStamp for `patch` (nil removes), or nil when it writes nothing.
    private static func next(_ gk: String, patch: [String: Any]?, store: LedgerStore, engine: RulesEngine) async throws -> [String: Any]? {
        let now = store.clock()
        let cur: Any = store.stamps()[gk] ?? NSNull()
        let change: Any = patch ?? NSNull()
        let args = "[\(try LiveItems.json(cur)),\(try LiveItems.json(change)),\(try LiveItems.json(today(now))),\(try LiveItems.json(now))]"
        return try JSONSerialization.jsonObject(with: Data(try await engine.call("nextStamp", args).utf8), options: [.fragmentsAllowed]) as? [String: Any]
    }

    /// Stamps the package with `kind`. A nil note keeps the stored one, as the past-transit page has no note field.
    static func write(_ gk: String, kind: String, note: String? = nil, store: LedgerStore, engine: RulesEngine) async throws {
        let held = store.stamps()[gk]?["note"] as? String ?? ""
        guard let record = try await next(gk, patch: ["kind": kind, "note": note ?? held], store: store, engine: engine) else { return }
        try store.commit { store.putStamp(gk, record) }
    }

    /// Writes the tombstone, or nothing when the package holds no stamp (stamp-removal-writes-a-tombstone). The store
    /// writes the record, because its own removal is pinned by a test; the bundle decides whether there is one to write.
    static func remove(_ gk: String, store: LedgerStore, engine: RulesEngine) async throws {
        guard try await next(gk, patch: nil, store: store, engine: engine) != nil else { return }
        try store.commit { store.removeStamp(gk) }
    }
}
