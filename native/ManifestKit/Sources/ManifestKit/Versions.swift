import Foundation
import Observation

public struct VersionRecord: Equatable, Sendable {
    public let id: String
    public let at: Double
    public let label: String
    public let kind: String
    public let lines: Int
    public let checked: Int
    public init(id: String, at: Double, label: String, kind: String, lines: Int, checked: Int) {
        self.id = id; self.at = at; self.label = label; self.kind = kind; self.lines = lines; self.checked = checked
    }
}

public enum VersionError: Error, Equatable, Sendable {
    case unreadable(String)
    case corrupt(String)
}

public final class VersionStore {
    let directory: URL
    let now: () -> Double
    let rulesURL: URL?

    public init(directory: URL, now: @escaping () -> Double, rulesURL: URL? = nil) {
        self.directory = directory; self.now = now; self.rulesURL = rulesURL
    }

    @discardableResult
    public func put(_ data: Data, label: String, kind: String = "milestone", lines: Int = 0, checked: Int = 0) throws -> VersionRecord {
        let at = now()
        let id = "v\(Int(at))-\(UUID().uuidString.prefix(8).lowercased())"
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try data.write(to: directory.appending(path: id + ".bin"), options: .atomic)
        let meta: [String: Any] = ["id": id, "at": at, "label": label, "kind": kind, "lines": lines, "checked": checked]
        try JSONSerialization.data(withJSONObject: meta).write(to: directory.appending(path: id + ".json"), options: .atomic)
        do { try prune() } catch {}
        return VersionRecord(id: id, at: at, label: label, kind: kind, lines: lines, checked: checked)
    }

    public func list() throws -> [VersionRecord] {
        guard FileManager.default.fileExists(atPath: directory.path) else { return [] }
        let names = try FileManager.default.contentsOfDirectory(atPath: directory.path)
        var out: [VersionRecord] = []
        for n in names where n.hasSuffix(".json") {
            guard let o = try JSONSerialization.jsonObject(with: Data(contentsOf: directory.appending(path: n))) as? [String: Any],
                  let id = o["id"] as? String, let at = (o["at"] as? NSNumber)?.doubleValue else { continue }
            out.append(VersionRecord(id: id, at: at, label: o["label"] as? String ?? "", kind: o["kind"] as? String ?? "",
                                     lines: (o["lines"] as? NSNumber)?.intValue ?? 0, checked: (o["checked"] as? NSNumber)?.intValue ?? 0))
        }
        return out.sorted { ($0.at, $0.id) > ($1.at, $1.id) }
    }

    public func data(for id: String) throws -> Data {
        guard let d = try? Data(contentsOf: directory.appending(path: id + ".bin")) else { throw VersionError.unreadable(id) }
        return d
    }

    public func remove(_ id: String) throws {
        // The record goes first: a half-removed version must not list with no bytes behind it.
        for ext in ["json", "bin"] {
            do { try FileManager.default.removeItem(at: directory.appending(path: "\(id).\(ext)")) }
            catch let e as CocoaError where e.code == .fileNoSuchFile {}
        }
    }

    func prune() throws {
        guard let bundle = rulesURL ?? Bundle.module.url(forResource: "rules", withExtension: "js") else { throw CocoaError(.fileNoSuchFile) }
        let recs = try list().map { ["id": $0.id, "at": $0.at, "kind": $0.kind] as [String: Any] }
        let args = try JSONSerialization.data(withJSONObject: [recs, now()] as [Any])
        let out = try RulesCore(bundleURL: bundle).call("prunePlan", String(decoding: args, as: UTF8.self))
        for id in (try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [String]) ?? [] { try remove(id) }
    }
}

extension LedgerStore {
    func heldBytes() throws -> (Data, Int, Int) {
        guard loaded else { return (try Data(contentsOf: fileURL), 0, 0) }
        let checked = received().values.reduce(0, +)
        return (try snapshotData(), items().count, checked)
    }

    func removes(_ incoming: [String: Any]) -> Bool {
        let inRec = (incoming["received"] as? [String: Any] ?? [:]).compactMapValues { ($0 as? NSNumber)?.intValue }
        for (k, n) in received() where (inRec[k] ?? 0) < n { return true }
        let inEnv = incoming["envelopes"] as? [[String: Any]] ?? []
        for e in envelopeRecords() where e["deletedAt"] == nil {
            let id = e["id"] as? String
            if !inEnv.contains(where: { ($0["id"] as? String) == id && $0["deletedAt"] == nil }) { return true }
        }
        let inSt = incoming["stamps"] as? [String: Any] ?? [:]
        for (gk, s) in stamps() where ((s["kind"] as? String) ?? "") != "" {
            if (((inSt[gk] as? [String: Any])?["kind"] as? String) ?? "") == "" { return true }
        }
        return false
    }

    public func reset() throws {
        let (bytes, lines, checked) = try heldBytes()
        if let v = versions { try v.put(bytes, label: "before reset", kind: "milestone", lines: lines, checked: checked) }
        let (oldDoc, oldGen, oldLoaded) = (doc, generation, loaded)
        doc = ["mailday": 1, "items": [Any](), "received": [String: Any](), "receivedAt": [String: Any](), "stamps": [String: Any](), "envelopes": [Any]()]
        loaded = true
        generation += 1
        do { try save() } catch { (doc, generation, loaded) = (oldDoc, oldGen, oldLoaded); throw error }
    }

    public func restore(_ id: String) throws {
        guard let v = versions else { throw VersionError.unreadable(id) }
        let bytes: Data
        do { bytes = try v.data(for: id) } catch { throw VersionError.unreadable(id) }
        guard let o = (try? JSONSerialization.jsonObject(with: bytes)) as? [String: Any],
              o["mailday"] == nil || (o["mailday"] as? Int) == 1 else { throw VersionError.corrupt(id) }
        let (held, lines, checked) = try heldBytes()
        try v.put(held, label: "before restore", kind: "milestone", lines: lines, checked: checked)
        try adoptRaw(bytes)
    }
}

public enum VersionNotice {
    static func cards(_ n: Int) -> String { "\(n) card\(n == 1 ? "" : "s")" }
    public static func resetAsk(cards n: Int) -> String { "Tap again to clear \(cards(n))" }
    public static func restoreAsk(cards n: Int) -> String { "Tap again to replace \(cards(n))" }
    public static let unreadable = "That version could not be read from this device."
    public static let corrupt = "That version could not be restored \u{2014} it looks corrupt."
}

public struct VersionRow: Equatable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let at: Double
    public let isMilestone: Bool
    public let counts: String
}
public enum VersionSite: Hashable, Sendable { case reset; case version(String) }
public struct RowError: Equatable, Sendable {
    public let site: VersionSite
    public let message: String
    public init(site: VersionSite, message: String) { self.site = site; self.message = message }
}
public enum VersionAsk: Equatable, Sendable {
    case reset(cards: Int)
    case restore(id: String, cards: Int)
}

@MainActor @Observable
public final class VersionsModel {
    private let store: LedgerStore
    private let versions: VersionStore
    public private(set) var rows: [VersionRow] = []
    public private(set) var listError: String?
    public private(set) var ask: VersionAsk?
    public private(set) var error: RowError?

    public init(store: LedgerStore, versions: VersionStore) { self.store = store; self.versions = versions }

    public func refresh() {
        do {
            rows = try versions.list().map {
                VersionRow(id: $0.id, label: $0.label, at: $0.at, isMilestone: $0.kind == "milestone", counts: "\($0.lines)/\($0.checked)")
            }
            listError = nil
        } catch { listError = "The versions on this device could not be read." }
    }

    private func ledgerCards() -> Int { store.items().reduce(0) { $0 + (($1["qty"] as? NSNumber)?.intValue ?? 0) } }
    private func envelopeCards() -> Int {
        store.envelopeRecords().filter { $0["deletedAt"] == nil }
            .flatMap { $0["entries"] as? [[String: Any]] ?? [] }.reduce(0) { $0 + (($1["qty"] as? NSNumber)?.intValue ?? 0) }
    }

    public func pressReset() {
        guard case .reset = ask else { ask = .reset(cards: ledgerCards() + envelopeCards()); return }
        ask = nil; error = nil
        do { try store.reset() } catch { self.error = RowError(site: .reset, message: "The ledger could not be reset.") }
        refresh()
    }

    public func pressRestore(_ id: String) {
        guard case .restore(let armed, _) = ask, armed == id else { ask = .restore(id: id, cards: ledgerCards()); return }
        ask = nil; error = nil
        do { try store.restore(id) }
        catch VersionError.unreadable { error = RowError(site: .version(id), message: VersionNotice.unreadable) }
        catch VersionError.corrupt { error = RowError(site: .version(id), message: VersionNotice.corrupt) }
        catch { self.error = RowError(site: .version(id), message: "That version could not be restored.") }
        refresh()
    }

    public func cancelAsk() { ask = nil }
}
