import Foundation

@MainActor
enum LiveItems {
    /// A value as JSON text, for a rules call.
    static func json(_ v: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: v, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    /// The ledger the web counts: canceled orders dropped, then the packages the bundle's isRefundStamp names
    /// (canceled-orders-leave-the-list, a-refund-leaves-every-count). The group keys come from the bundle's
    /// groupPackages, not a copy of gkOf. Returns the items as JSON.
    static func of(_ items: [[String: Any]], stamps: [String: [String: Any]], engine: RulesEngine) async throws -> String {
        let live = try await engine.call("dropCanceled", "[\(try json(items))]")
        let refunded = try await StampRules.keys(where: "isRefundStamp", in: stamps, engine: engine)
        guard !refunded.isEmpty else { return live }
        let packages = try JSONSerialization.jsonObject(with: Data(try await engine.call("groupPackages", "[\(live)]").utf8)) as? [[String: Any]] ?? []
        let gone = Set(packages.filter { refunded.contains($0["gk"] as? String ?? "") }
            .flatMap { $0["items"] as? [[String: Any]] ?? [] }.compactMap { $0["key"] as? String })
        let kept = try JSONSerialization.jsonObject(with: Data(live.utf8)) as? [[String: Any]] ?? []
        return try json(kept.filter { !gone.contains($0["key"] as? String ?? "") })
    }
}
