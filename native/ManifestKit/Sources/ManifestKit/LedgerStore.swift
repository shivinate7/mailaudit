import Foundation

/// Keeps ledger.json as raw JSON. An edit touches only `received`, `receivedAt`,
/// `stamps` and `envelopes`; every other field passes through (native-ledger-is-raw-json).
public final class LedgerStore {
    private let fileURL: URL
    private let now: () -> Double
    private var doc: [String: Any] = [:]
    private var loaded = false
    public private(set) var generation = 0

    public init(fileURL: URL, now: @escaping () -> Double) {
        self.fileURL = fileURL
        self.now = now
    }

    public func load() throws {
        loaded = false
        let data = try Data(contentsOf: fileURL)
        guard let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw CocoaError(.fileReadCorruptFile)
        }
        if let m = obj["mailday"], (m as? Int) != 1 { throw CocoaError(.fileReadCorruptFile) }
        if let e = obj["envelopes"], e as? [[String: Any]] == nil { throw CocoaError(.fileReadCorruptFile) }
        for k in ["received", "receivedAt", "stamps"] {
            if let v = obj[k], v as? [String: Any] == nil { throw CocoaError(.fileReadCorruptFile) }
        }
        doc = obj
        doc["mailday"] = 1
        for k in ["received", "receivedAt", "stamps"] where doc[k] == nil { doc[k] = [String: Any]() }
        if doc["envelopes"] as? [[String: Any]] == nil { doc["envelopes"] = [[String: Any]]() }
        loaded = true
    }

    public func save() throws {
        guard loaded else { throw CocoaError(.fileReadCorruptFile) }
        let data = try JSONSerialization.data(withJSONObject: doc, options: [.sortedKeys])
        try data.write(to: fileURL, options: .atomic)
    }

    /// The raw `items` array, as the rules take it.
    public func items() -> [[String: Any]] { doc["items"] as? [[String: Any]] ?? [] }

    /// The `received` map, key to count.
    public func received() -> [String: Int] { (doc["received"] as? [String: Any] ?? [:]).compactMapValues { $0 as? Int } }

    /// count 0 is an un-check: drop `received`, stamp `receivedAt`.
    public func setReceived(_ key: String, count: Int) {
        var r = doc["received"] as? [String: Any] ?? [:]
        var at = doc["receivedAt"] as? [String: Any] ?? [:]
        if count > 0 { r[key] = count } else { r.removeValue(forKey: key) }
        at[key] = now()
        doc["received"] = r
        doc["receivedAt"] = at
        generation += 1
    }

    /// setReceived then save. If the save fails, the store goes back to what it was.
    public func commitReceived(_ key: String, count: Int) throws {
        let (oldDoc, oldGen) = (doc, generation)
        setReceived(key, count: count)
        do { try save() } catch { doc = oldDoc; generation = oldGen; throw error }
    }

    public func setStamp(_ key: String, kind: String, note: String, at: String) {
        var s = doc["stamps"] as? [String: Any] ?? [:]
        s[key] = ["kind": kind, "note": note, "at": at, "updatedAt": now()] as [String: Any]
        doc["stamps"] = s
        generation += 1
    }

    /// A removal keeps the key with kind "" so it wins a merge.
    public func removeStamp(_ key: String) {
        var s = doc["stamps"] as? [String: Any] ?? [:]
        var st = s[key] as? [String: Any] ?? [:]
        st["kind"] = ""
        st["updatedAt"] = now()
        s[key] = st
        doc["stamps"] = s
        generation += 1
    }

    /// A discard leaves a tombstone: deletedAt set, entries and photos emptied.
    public func discardEnvelope(_ id: String) {
        var list = doc["envelopes"] as? [[String: Any]] ?? []
        let t = now()
        if let i = list.firstIndex(where: { ($0["id"] as? String) == id }) {
            list[i]["deletedAt"] = t
            list[i]["updatedAt"] = t
            list[i]["entries"] = [Any]()
            list[i]["photos"] = [Any]()
        }
        doc["envelopes"] = list
        generation += 1
    }
}
