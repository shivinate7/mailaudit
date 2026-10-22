import Foundation

/// Keeps ledger.json as raw JSON. An edit touches only `received`, `receivedAt`,
/// `stamps` and `envelopes`; every other field passes through (native-ledger-is-raw-json).
public final class LedgerStore {
    let fileURL: URL  // internal, for Backup.swift
    let now: () -> Double
    private let rulesURL: URL?
    let versions: VersionStore?
    var doc: [String: Any] = [:]
    var loaded = false
    public internal(set) var generation = 0
    /// Entries the last load dropped from a damaged field; 0 when nothing was damaged.
    public private(set) var droppedCount = 0
    /// Runs after a write the person made was saved: commitReceived, commit(_:) and commitPhoto.
    /// A load and an adopted reply do not run it; a restore and a reset do. A sync client arms its POST timer here.
    var onLocalSave: (() -> Void)?

    /// The app passes the rules.js it ships. Without one, the package resource is used
    /// (tests); Bundle.module traps if that resource is missing.
    public init(fileURL: URL, now: @escaping () -> Double, rulesURL: URL? = nil, versions: VersionStore? = nil) {
        self.fileURL = fileURL
        self.versions = versions
        self.rulesURL = rulesURL
        self.now = now
    }

    public func load() throws {
        loaded = false
        droppedCount = 0
        try ingest(Data(contentsOf: fileURL))
        // Save the mend now, so a relaunch reads it and makes no second copy.
        if droppedCount > 0 { do { try save() } catch { loaded = false; throw error } }
    }

    /// Takes a server ledger the way a load takes the file: the mend, the kept copy, then a
    /// save. If any step fails, the store goes back to what it was (native-ledger-is-raw-json).
    public func adopt(_ ledger: Data) throws {
        if let v = versions, loaded {
            guard let obj = try JSONSerialization.jsonObject(with: ledger) as? [String: Any] else { throw CocoaError(.fileReadCorruptFile) }
            if let m = obj["mailday"], (m as? Int) != 1 { throw CocoaError(.fileReadCorruptFile) }
            if removes(obj) {
                let (bytes, lines, checked) = try heldBytes()
                try v.put(bytes, label: "before sync", kind: "milestone", lines: lines, checked: checked)
            }
        }
        try adoptRaw(ledger)
    }

    func adoptRaw(_ ledger: Data) throws {
        let (oldDoc, oldGen, oldDropped, oldLoaded) = (doc, generation, droppedCount, loaded)
        do {
            try ingest(ledger)
            try save()
            generation += 1
        } catch {
            (doc, generation, droppedCount, loaded) = (oldDoc, oldGen, oldDropped, oldLoaded)
            throw error
        }
    }

    /// The whole ledger, unknown fields included.
    public func snapshot() -> [String: Any] { doc }

    /// The four fields an edit touches. A sync client compares this with what a reply carried.
    public func userData() -> [String: Any] {
        doc.filter { ["received", "receivedAt", "stamps", "envelopes"].contains($0.key) }
    }

    private func ingest(_ data: Data) throws {
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
    }

    public func save() throws {
        guard loaded else { throw CocoaError(.fileReadCorruptFile) }
        try snapshotData().write(to: fileURL, options: .atomic)
    }

    /// The raw `items` array, as the rules take it.
    public func items() -> [[String: Any]] { doc["items"] as? [[String: Any]] ?? [] }

    /// The `received` map, key to count.
    public func received() -> [String: Int] { (doc["received"] as? [String: Any] ?? [:]).compactMapValues { $0 as? Int } }

    /// The raw `stamps` map, group key to stamp.
    public func stamps() -> [String: [String: Any]] { (doc["stamps"] as? [String: Any] ?? [:]).compactMapValues { $0 as? [String: Any] } }

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
        onLocalSave?()
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

    /// The store's clock, so a record written beside a check-in carries the same time.
    func clock() -> Double { now() }

    /// The raw `envelopes`, tombstones included, in file order.
    func envelopeRecords() -> [[String: Any]] { doc["envelopes"] as? [[String: Any]] ?? [] }

    /// Puts a new envelope record at the top of the pile.
    func addEnvelope(_ record: [String: Any]) {
        doc["envelopes"] = [record] + envelopeRecords()
        generation += 1
    }

    /// Replaces the record with the same id where it stands, or puts it at the top.
    func replaceEnvelope(_ record: [String: Any]) {
        var list = envelopeRecords()
        if let i = list.firstIndex(where: { ($0["id"] as? String) == (record["id"] as? String) }) { list[i] = record } else { list.insert(record, at: 0) }
        doc["envelopes"] = list
        generation += 1
    }

    /// Runs the edits, then saves once. If the save fails, every edit is undone,
    /// the generation too. One assign touches three fields and may not land in part.
    func commit(_ edits: () -> Void) throws {
        let (oldDoc, oldGen) = (doc, generation)
        edits()
        do { try save() } catch { doc = oldDoc; generation = oldGen; throw error }
        onLocalSave?()
    }
}

public enum LedgerEditError: Error, Equatable { case noLiveEnvelope(String) }

/// Photo ids in the ledger. The blob never enters it (photos-stay-out-of-the-ledger).
public extension LedgerStore {
    /// Ids of live envelopes, each once, in envelope order. This is `referenced` for the photo plan.
    func photoIDs() -> [String] {
        var seen = Set<String>()
        return liveEnvelopes().flatMap { $0["photos"] as? [String] ?? [] }.filter { seen.insert($0).inserted }
    }

    func hasLiveEnvelope(_ id: String) -> Bool { liveIndex(id) != nil }

    /// Appends `id` to the live envelope's `photos` and sets its `updatedAt`, so a merge sees an edit.
    /// If the save fails, the store goes back to what it was.
    func commitPhoto(_ id: String, toEnvelope envelopeID: String) throws {
        guard let i = liveIndex(envelopeID) else { throw LedgerEditError.noLiveEnvelope(envelopeID) }
        let (oldDoc, oldGen) = (doc, generation)
        var list = doc["envelopes"] as? [[String: Any]] ?? []
        list[i]["photos"] = (list[i]["photos"] as? [String] ?? []) + [id]
        list[i]["updatedAt"] = now()
        doc["envelopes"] = list
        generation += 1
        do { try save() } catch { doc = oldDoc; generation = oldGen; throw error }
        onLocalSave?()
    }

    private func liveEnvelopes() -> [[String: Any]] {
        (doc["envelopes"] as? [[String: Any]] ?? []).filter { $0["deletedAt"] == nil }
    }

    private func liveIndex(_ id: String) -> Int? {
        (doc["envelopes"] as? [[String: Any]] ?? []).firstIndex { ($0["id"] as? String) == id && $0["deletedAt"] == nil }
    }
}
