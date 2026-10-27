import Foundation
import Observation

public enum OrphanedFailure: Error, Equatable {
    case notOffered, changed, emptyEnvelope, unknownEnvelope
}

/// The Orphaned view's rules over the ledger store (rules-run-in-javascriptcore). It ranks and
/// never picks: an envelope is only assigned by a call that names the package
/// (orphaned-mail-never-decides). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class OrphanedModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    public private(set) var envelopes: [Envelope] = []
    public private(set) var undo: UndoNotice?
    public private(set) var composing: ComposerTarget?
    /// Set when a save fails; the call throws too. Cleared by the next save that works.
    public private(set) var error: String?
    private var rankings: [String: Ranked] = [:]
    /// Package gks the bundle's isUntracked calls untracked, for the candidate rows' tag.
    private var untracked: Set<String> = []
    private var drafts: [ComposerTarget: EnvelopeDraft] = [:]
    @ObservationIgnored private var pool: [OutstandingName] = []
    /// The store generation the rankings were read at. A write since makes them stale.
    @ObservationIgnored private var rankedAt = -1
    /// What the last assign needs to undo itself: the whole record before it, and its plan (deltas, not a snapshot).
    @ObservationIgnored private var undoRecord: (envelope: [String: Any], plan: [PlanStep])?
    @ObservationIgnored private var norms: [String: String] = [:]
    @ObservationIgnored private var sequence = 0

    private struct OutstandingName: Decodable { let nk, name: String; let qty, sellerCount: Int }
    private struct RankResult: Decodable { let list: [Candidate]; let tied: Int }

    public init(engine: RulesEngine, store: LedgerStore) {
        self.engine = engine
        self.store = store
    }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    private func norm(_ s: String) async throws -> String {
        if let n = norms[s] { return n }
        let out = try await engine.call("normName", "[\(try json(s))]")
        let n = try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String ?? ""
        norms[s] = n
        return n
    }

    // MARK: reading

    private static func isLive(_ rec: [String: Any]) -> Bool {
        let d = rec["deletedAt"]
        return d == nil || d is NSNull || (d as? NSNumber)?.doubleValue == 0
    }

    private static func entries(of rec: [String: Any]) -> [EnvelopeEntry] {
        (rec["entries"] as? [[String: Any]] ?? []).compactMap {
            guard let n = $0["name"] as? String, let q = ($0["qty"] as? NSNumber)?.intValue else { return nil }
            return EnvelopeEntry(name: n, qty: q)
        }
    }

    private static func envelope(_ rec: [String: Any]) -> Envelope? {
        guard let id = rec["id"] as? String else { return nil }
        return Envelope(
            id: id, createdAt: (rec["createdAt"] as? NSNumber)?.doubleValue ?? 0,
            updatedAt: (rec["updatedAt"] as? NSNumber)?.doubleValue ?? 0,
            note: rec["note"] as? String ?? "", entries: entries(of: rec))
    }

    private func liveRecords() -> [[String: Any]] { store.envelopeRecords().filter(Self.isLive) }

    /// Reads the store and ranks every envelope again. Candidates are derived, never stored. The
    /// packages are the ledger without canceled orders, and the date filter does not apply
    /// (candidates-skip-date-filter).
    public func load() async throws {
        let gen = store.generation
        let got = store.received()
        let live = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        let grouped = try await engine.call("groupPackages", "[\(live)]")
        let names = try await engine.call("outstandingNames", "[\(live),\(try json(got))]")
        let nextPool = try JSONDecoder().decode([OutstandingName].self, from: Data(names.utf8))
        var next: [String: Ranked] = [:]
        let recs = liveRecords()
        for rec in recs {
            guard let env = Self.envelope(rec) else { continue }
            let asked = try json(env.entries.map { ["name": $0.name, "qty": $0.qty] as [String: Any] })
            let out = try await engine.call("rankCandidates", "[\(asked),\(grouped),\(try json(got))]")
            let r = try JSONDecoder().decode(RankResult.self, from: Data(out.utf8))
            // The bundle's explainable is a JS Set, and JSON.stringify drops it. It is rebuilt from
            // the same perEntry the bundle reads it from.
            let explainable = Set(r.list.flatMap { $0.perEntry.filter { $0.value > 0 }.keys })
            next[env.id] = Ranked(list: r.list, tied: r.tied, explainable: explainable)
        }
        for rec in recs { for e in Self.entries(of: rec) { _ = try await norm(e.name) } }
        var seen: [String: String] = [:]
        for r in next.values { for c in r.list { seen[c.pkg.gk] = c.pkg.tracking } }
        var nextUntracked: Set<String> = []
        for (gk, tracking) in seen {
            let out = try await engine.call("isUntracked", "[{\"tracking\":\(try json(tracking))}]")
            if out == "true" { nextUntracked.insert(gk) }
        }
        untracked = nextUntracked
        pool = nextPool
        rankings = next
        envelopes = recs.compactMap(Self.envelope)
        rankedAt = gen
    }

    /// The Orphaned tab's badge: live envelopes. `envelopes` holds no tombstone, and zero hides the badge.
    public var badgeCount: Int { envelopes.count }

    public func ranked(for envelopeId: String) -> Ranked { rankings[envelopeId] ?? .none }

    /// The bundle's isUntracked for a candidate's package.
    public func isUntracked(_ gk: String) -> Bool { untracked.contains(gk) }

    /// True when no outstanding copy of this entry exists anywhere (the web's "no outstanding copy" tag).
    public func hasNoOutstandingCopy(_ entry: EnvelopeEntry, in envelopeId: String) -> Bool {
        !ranked(for: envelopeId).explainable.contains(norms[entry.name] ?? "")
    }

    /// Cards still owed, matching every typed token, best first, six at most (the web composer).
    public func suggestions(for text: String) async -> [Suggestion] {
        guard let q = try? await norm(text), !q.isEmpty else { return [] }
        let tokens = q.split(separator: " ").map(String.init)
        return pool
            .filter { p in tokens.allSatisfy { p.nk.contains($0) } }
            .map { p in (p, p.nk.hasPrefix(q) ? 0 : p.nk.contains(" " + q) ? 1 : 2) }
            .sorted { a, b in
                if a.1 != b.1 { return a.1 < b.1 }
                if a.0.qty != b.0.qty { return a.0.qty > b.0.qty }
                return a.0.name.localizedCompare(b.0.name) == .orderedAscending
            }
            .prefix(6)
            .map { Suggestion(name: $0.0.name, qty: $0.0.qty, sellerCount: $0.0.sellerCount) }
    }

    // MARK: composer

    public func open(_ target: ComposerTarget) { composing = target }

    /// Closes the composer and keeps its draft. Only a save ends one (ux-keep-what-was-made).
    public func cancel() { composing = nil }

    public func draft(for target: ComposerTarget) -> EnvelopeDraft {
        if let d = drafts[target] { return d }
        guard case .edit(let id) = target, let rec = liveRecords().first(where: { ($0["id"] as? String) == id }) else {
            return EnvelopeDraft(input: "", entries: [], note: "")
        }
        return EnvelopeDraft(input: "", entries: Self.entries(of: rec), note: rec["note"] as? String ?? "")
    }

    public func setInput(_ text: String, for target: ComposerTarget) {
        var d = draft(for: target); d.input = text; drafts[target] = d
    }

    public func setNote(_ text: String, for target: ComposerTarget) {
        var d = draft(for: target); d.note = text; drafts[target] = d
    }

    /// Sets the count of the entry at `index`; zero or less removes it.
    public func setQty(_ qty: Int, at index: Int, for target: ComposerTarget) {
        var d = draft(for: target)
        guard d.entries.indices.contains(index) else { return }
        if qty <= 0 { d.entries.remove(at: index) } else { d.entries[index].qty = qty }
        drafts[target] = d
    }

    /// A tap or the return key. A name already in the draft (after normName) gets one more and
    /// moves to the top; a new name goes to the top as typed. A name with no letters adds nothing.
    public func addName(_ name: String, for target: ComposerTarget) async throws {
        let nk = try await norm(name)
        guard !nk.isEmpty else { return }
        for e in draft(for: target).entries { _ = try await norm(e.name) }
        // No await below, so two quick taps cannot both add the same card.
        var d = draft(for: target)
        if let i = d.entries.firstIndex(where: { norms[$0.name] == nk }) {
            var e = d.entries.remove(at: i)
            e.qty += 1
            d.entries.insert(e, at: 0)
        } else {
            d.entries.insert(EnvelopeEntry(name: name.trimmingCharacters(in: .whitespacesAndNewlines), qty: 1), at: 0)
        }
        d.input = ""
        drafts[target] = d
    }

    private func newId(_ t: Double) -> String {
        sequence += 1
        return "env-\(String(Int(t), radix: 36))-\(String(sequence, radix: 36))-\(UUID().uuidString.prefix(6).lowercased())"
    }

    private static func raw(_ entries: [EnvelopeEntry]) -> [[String: Any]] {
        entries.map { ["name": $0.name, "qty": $0.qty] }
    }

    /// Records a new envelope or edits one. Nothing is checked in (orphan-entry-takes-one-input).
    public func save(_ target: ComposerTarget) async throws {
        let d = draft(for: target)
        guard !d.entries.isEmpty else { throw refuse(.emptyEnvelope) }
        var edited: [String: Any]?
        if case .edit(let id) = target {
            guard let rec = liveRecords().first(where: { ($0["id"] as? String) == id }) else { throw refuse(.unknownEnvelope) }
            edited = rec
        }
        try write {
            let t = store.clock()
            if var rec = edited {
                // An edit changes only what it names, so photos and unknown fields stay.
                rec["entries"] = Self.raw(d.entries)
                rec["note"] = d.note
                rec["updatedAt"] = t
                store.replaceEnvelope(rec)
            } else {
                store.addEnvelope([
                    "id": newId(t), "createdAt": t, "updatedAt": t, "note": d.note,
                    "entries": Self.raw(d.entries), "photos": [Any](),
                ])
            }
        }
        drafts[target] = nil
        composing = nil
        try await load()
    }

    // MARK: assign, undo, discard

    /// A refusal shows on screen too: the view's try? cannot hide it. The next good write clears it.
    private func refuse(_ f: OrphanedFailure) -> OrphanedFailure {
        error = OrphanedNotice.refusal(f)
        return f
    }

    private func write(_ edits: () -> Void) throws {
        do { try store.commit(edits); error = nil } catch {
            self.error = "Could not save. \(error.localizedDescription)"
            throw error
        }
    }

    /// Checks in exactly the cards the envelope recorded, the plan the bundle gave for that package.
    /// The package must be one the envelope was offered. The check-in and the envelope change are one save.
    public func assign(envelope id: String, to gk: String) async throws {
        if store.generation != rankedAt { try await load() }
        guard let rec = liveRecords().first(where: { ($0["id"] as? String) == id }) else { throw refuse(.unknownEnvelope) }
        guard let c = ranked(for: id).list.first(where: { $0.pkg.gk == gk }) else { throw refuse(.notOffered) }
        let index = envelopes.firstIndex { $0.id == id } ?? 0

        var left: [[String: Any]] = []
        for var e in rec["entries"] as? [[String: Any]] ?? [] {
            let rest = ((e["qty"] as? NSNumber)?.intValue ?? 0) - (c.perEntry[try await norm(e["name"] as? String ?? "")] ?? 0)
            if rest > 0 { e["qty"] = rest; left.append(e) }
        }
        guard store.generation == rankedAt else { throw refuse(.changed) }

        let owed = c.pkg.items.reduce(into: [String: Int]()) { $0[$1.key] = $1.qty }
        let got = store.received()
        try write {
            for s in c.plan {
                store.setReceived(s.itemKey, count: min(owed[s.itemKey] ?? .max, got[s.itemKey] ?? 0) + s.take)
            }
            if left.isEmpty {
                store.discardEnvelope(id)
            } else {
                // The envelope shrank, so it needs a fresh updatedAt or a stale larger copy wins a merge.
                var shrunk = rec
                shrunk["entries"] = left
                shrunk["updatedAt"] = store.clock()
                store.replaceEnvelope(shrunk)
            }
        }
        undoRecord = (rec, c.plan)
        undo = UndoNotice(
            matchedQty: c.matchedQty, leftoverQty: left.reduce(0) { $0 + (($1["qty"] as? NSNumber)?.intValue ?? 0) },
            index: index, pkgLabel: c.pkg.seller)
        try await load()
    }

    /// Takes back the last assign: subtracts what it added, so a hand edit since survives, and puts the
    /// envelope back with a fresh updatedAt. Does nothing when there is nothing to undo.
    public func undoAssign() async throws {
        guard let u = undoRecord else { return }
        try write {
            for s in u.plan {
                // count 0 drops the key and stamps the time, so the un-check beats an older check-in.
                store.setReceived(s.itemKey, count: max((store.received()[s.itemKey] ?? 0) - s.take, 0))
            }
            var back = u.envelope
            back["updatedAt"] = store.clock()
            store.replaceEnvelope(back)
        }
        undoRecord = nil
        undo = nil
        try await load()
    }

    /// Hides the Undo notice. The assign stays, and so does its check-in.
    public func dismissUndo() { undoRecord = nil; undo = nil }

    /// Leaves a tombstone. If the Undo notice is about this envelope, there is nothing left to undo.
    public func discard(envelope id: String) async throws {
        guard liveRecords().contains(where: { ($0["id"] as? String) == id }) else { throw refuse(.unknownEnvelope) }
        try write { store.discardEnvelope(id) }
        if (undoRecord?.envelope["id"] as? String) == id { undoRecord = nil; undo = nil }
        try await load()
    }
}
