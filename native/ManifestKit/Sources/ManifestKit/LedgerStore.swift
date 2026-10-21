import Foundation

/// Keeps ledger.json as raw JSON. An edit touches only `received`, `receivedAt`,
/// `stamps` and `envelopes`; every other field passes through (native-ledger-is-raw-json).
public final class LedgerStore {
    let fileURL: URL  // internal, for Backup.swift
    let now: () -> Double
    private let rulesURL: URL?
    var doc: [String: Any] = [:]
    var loaded = false
    public private(set) var generation = 0
    /// Entries the last load dropped from a damaged field; 0 when nothing was damaged.
    public private(set) var droppedCount = 0

    /// The app passes the rules.js it ships. Without one, the package resource is used
    /// (tests); Bundle.module traps if that resource is missing.
    public init(fileURL: URL, now: @escaping () -> Double, rulesURL: URL? = nil) {
        self.fileURL = fileURL
        self.rulesURL = rulesURL
        self.now = now
    }

    public func load() throws {
        loaded = false
        droppedCount = 0
        let data = try Data(contentsOf: fileURL)
        guard let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw CocoaError(.fileReadCorruptFile)
        }
        if let m = obj["mailday"], (m as? Int) != 1 { throw CocoaError(.fileReadCorruptFile) }
        // The mend is salvageLedger in rules.js, the one home of the rule. The original
        // text goes in as the argument, so no number is re-formatted on the way.
        guard let bundle = rulesURL ?? Bundle.module.url(forResource: "rules", withExtension: "js"),
              let text = String(data: data, encoding: .utf8) else { throw CocoaError(.fileReadCorruptFile) }
        let out = try RulesCore(bundleURL: bundle).call("salvageLedger", "[" + text + "]")
        guard let res = try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [String: Any],
              let mended = res["data"] as? [String: Any], let dropped = res["dropped"] as? Int else {
            throw CocoaError(.fileReadCorruptFile)
        }
        if dropped > 0 {
            // Copy first. If the copy fails, load throws and nothing is mended.
            let f = ISO8601DateFormatter()
            f.formatOptions.insert(.withFractionalSeconds)
            let stamp = f.string(from: Date(timeIntervalSince1970: now() / 1000))
                .replacingOccurrences(of: ":", with: "")
            let dir = fileURL.deletingLastPathComponent()
            var n = 1
            while true {
                let name = "ledger.kept-\(stamp)" + (n == 1 ? "" : "-\(n)") + ".json"
                do { try data.write(to: dir.appending(path: name), options: .withoutOverwriting); break }
                catch let e as CocoaError where e.code == .fileWriteFileExists { n += 1 }
            }
        }
        doc = mended
        droppedCount = dropped
        doc["mailday"] = 1
        for k in ["received", "receivedAt", "stamps"] where doc[k] == nil { doc[k] = [String: Any]() }
        if doc["envelopes"] as? [[String: Any]] == nil { doc["envelopes"] = [[String: Any]]() }
        loaded = true
        // Save the mend now, so a relaunch reads it and makes no second copy.
        if dropped > 0 { do { try save() } catch { loaded = false; throw error } }
    }

    public func save() throws {
        guard loaded else { throw CocoaError(.fileReadCorruptFile) }
        try snapshot().write(to: fileURL, options: .atomic)
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
