import Foundation

@MainActor
enum LiveItems {
    /// The ledger the web counts: canceled orders dropped, then the packages stamped Refunded or
    /// Partial refund (canceled-orders-leave-the-list, a-refund-leaves-every-count). The group keys
    /// come from the bundle's groupPackages, not a copy of gkOf. Returns the items as JSON.
    static func of(_ items: [[String: Any]], stamps: [String: [String: Any]], engine: RulesEngine) async throws -> String {
        func encode(_ v: Any) throws -> String {
            String(decoding: try JSONSerialization.data(withJSONObject: v, options: [.fragmentsAllowed]), as: UTF8.self)
        }
        let live = try await engine.call("dropCanceled", "[\(try encode(items))]")
        let refunded = Set(stamps.filter { ["refunded", "partial"].contains($0.value["kind"] as? String) }.keys)
        guard !refunded.isEmpty else { return live }
        let packages = try JSONSerialization.jsonObject(with: Data(try await engine.call("groupPackages", "[\(live)]").utf8)) as? [[String: Any]] ?? []
        let gone = Set(packages.filter { refunded.contains($0["gk"] as? String ?? "") }
            .flatMap { $0["items"] as? [[String: Any]] ?? [] }.compactMap { $0["key"] as? String })
        let kept = try JSONSerialization.jsonObject(with: Data(live.utf8)) as? [[String: Any]] ?? []
        return try encode(kept.filter { !gone.contains($0["key"] as? String ?? "") })
    }
}
