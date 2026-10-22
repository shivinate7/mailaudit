// Shared helpers and the contract for the N9 Milestones tests (lane N9, native-build-lanes).
//
// Web behaviour matched: milestones-taken-before-risk, retention-tiers-are-unioned,
// every-restore-passes-applybackup, history-restores-a-saved-version, a-restore-is-not-local,
// unwritable-store-says-so, recovery-control-not-state-gated, no-native-dialogs.
//
// Red-first. The builder adds the types below in native/ManifestKit/Sources/ManifestKit/.
// Until they exist the Version* test files do not compile. The red run is recorded in the
// lane's commit message: a scratch package with a wrong-valued stub of this contract, where
// every test fails on an assertion (testing-throwing-assert-bad-kill).
//
// Contract the tests name. Names that cross into the rules bundle are the web's own: a record has
// `id`, `at`, `label`, `kind`, `lines`, `checked`, and `kind` is the string "milestone" or "recent".
//
//   public struct VersionRecord: Equatable, Sendable {
//       public let id: String                  // unique per put, even for two puts at one instant
//       public let at: Double                  // the version store's clock, in ms
//       public let label: String               // "before reset" | "before restore" | "before sync"
//       public let kind: String
//       public let lines: Int                  // ledger items
//       public let checked: Int                // sum of the `received` counts
//       public init(id: String, at: Double, label: String, kind: String, lines: Int, checked: Int)
//   }
//   public enum VersionError: Error, Equatable, Sendable {
//       case unreadable(String)                // id: no record, or no bytes, on this device
//       case corrupt(String)                   // id: the bytes are not a ledger the apply path accepts
//   }
//   public final class VersionStore {          // synchronous, not Sendable, like LedgerStore
//       public init(directory: URL, now: @escaping () -> Double, rulesURL: URL? = nil)
//       /// Keeps `data` byte for byte (it is never parsed), then prunes with the bundle's
//       /// prunePlan(records, now()). A prune that throws does not fail the put.
//       @discardableResult
//       public func put(_ data: Data, label: String, kind: String = "milestone",
//                       lines: Int = 0, checked: Int = 0) throws -> VersionRecord
//       /// Newest first by `at`. A directory that does not exist yet lists nothing. A directory
//       /// that cannot be read throws, and is never an empty list (unwritable-store-says-so).
//       public func list() throws -> [VersionRecord]
//       public func data(for id: String) throws -> Data     // throws VersionError.unreadable(id)
//       public func remove(_ id: String) throws
//   }
//   extension LedgerStore {
//       // new init parameter, last, defaulted. nil keeps today's behaviour (no milestones).
//       public init(fileURL: URL, now: @escaping () -> Double, rulesURL: URL? = nil, versions: VersionStore? = nil)
//
//       /// Milestone "before reset" first, then an empty ledger (mailday 1, items [], received {},
//       /// receivedAt {}, stamps {}, envelopes []), saved. Bumps `generation`. The versions stay.
//       /// If the save fails, the store goes back to what it was (the milestone may stay).
//       /// A store that is not loaded (its file would not open) puts the file bytes, exactly as
//       /// they are, in the milestone, and is loaded and empty afterwards.
//       public func reset() throws
//
//       /// Reads the version, refuses it if it is not a ledger, takes milestone "before restore",
//       /// then applies it through the same path as a server reply (adopt: mend, kept copy,
//       /// save, generation + 1). Throws VersionError.unreadable(id) or .corrupt(id) and changes
//       /// nothing, and a refused version spends no milestone slot. A store that is not loaded
//       /// still restores, its milestone holds the file bytes as they were, and if that milestone
//       /// cannot be saved the restore changes nothing (the damaged file is the only copy).
//       public func restore(_ id: String) throws
//   }
//   adopt(_:) keeps its signature. With a VersionStore attached it first puts milestone
//   "before sync" when the incoming ledger removes something the current one holds: a card count
//   lowered or cleared, a live envelope tombstoned or gone, a stamp with a kind that is gone or
//   has kind "". It puts nothing when the reply only adds or changes nothing. The milestone
//   holds the whole raw document as it stood before the apply. Where the removal test lives is the
//   builder's call: one pure rule in src/version-rules.mjs (so the bundle is its one home) is
//   preferred to a second copy in Swift. These tests hold under both.
//
//   public enum VersionNotice {                                  // pure copy, like LedgerNotice
//       public static func resetAsk(cards: Int) -> String        // "Tap again to clear 14 cards"
//       public static func restoreAsk(cards: Int) -> String      // "Tap again to replace 14 cards"
//       public static let unreadable: String                     // "That version could not be read from this device."
//       public static let corrupt: String                        // "That version could not be restored \u{2014} it looks corrupt."
//   }
//   public struct VersionRow: Equatable, Sendable, Identifiable {  // one list row
//       public let id: String
//       public let label: String
//       public let at: Double
//       public let isMilestone: Bool
//       public let counts: String                                // "12/3": lines/checked, as the web row
//   }
//   public enum VersionSite: Hashable, Sendable { case reset; case version(String) }
//   public struct RowError: Equatable, Sendable {
//       public let site: VersionSite; public let message: String
//       public init(site: VersionSite, message: String)
//   }
//   public enum VersionAsk: Equatable, Sendable {
//       case reset(cards: Int)                                   // ledger cards + live envelope cards
//       case restore(id: String, cards: Int)                     // the ledger's cards now, not the version's
//   }
//   @MainActor @Observable public final class VersionsModel {
//       public init(store: LedgerStore, versions: VersionStore)
//       public private(set) var rows: [VersionRow]               // newest first, one per record
//       public private(set) var listError: String?              // set when the list cannot be read
//       public private(set) var ask: VersionAsk?                 // at most one control is armed
//       public private(set) var error: RowError?                 // set on a failure, at the pressed row
//       public func refresh()                                    // reads the list
//       public func pressReset()                                 // 1st press arms; a 2nd press performs
//       public func pressRestore(_ id: String)                   // 1st press arms; a 2nd press on the same id performs
//       public func cancelAsk()
//   }
//   A press that performs clears `ask` and the old `error` first, refreshes `rows` after, and never
//   throws. A failure leaves the ledger as it was and sets `error` at the pressed row.
//
// Not pinned, listed for the owner (Input Needed in the lane report):
//   - Whether Reset goes ahead when its "before reset" milestone cannot be saved.
//   - The times a restore stamps on check-ins, stamps and envelopes (lane W3b is blocked).
//   - What a Reset does to the Worker's copy (unmeasured, a-restore-is-not-local).
//   - Whether the restore count includes envelope cards (open in history-restores-a-saved-version).
//
// Fake fixtures only. These tests read no Keychain item and no device key.

import Foundation
import XCTest
@testable import ManifestKit

/// A clock the test moves. The stores read it through `now`.
final class VersionClock: @unchecked Sendable {
    var t: Double
    init(_ t: Double) { self.t = t }
}

/// A ledger folder and a version folder side by side in the temp directory, with one clock.
/// The ledger folder holds ledger.json and the kept copies. Nothing else lives in it.
final class VersionSandbox: @unchecked Sendable {
    static let minute: Double = 60_000
    static let hour: Double = 3_600_000
    static let day: Double = 86_400_000
    /// 2026-08-12T14:07:00Z. The minute is 7 on purpose: the hour and day keys of the rules are
    /// LOCAL (CI runs outside UTC), and every zone is a whole multiple of 15 minutes from UTC, so a
    /// burst of a few minutes after :07 stays inside one local hour and one local day in any zone.
    static let t0: Double = 1_786_543_620_000
    /// 2026-08-12T14:01:00Z. Minute 1, for the 11-minute burst of the cap test, same reason.
    static let t1: Double = 1_786_543_260_000

    // Keys from shared/fixtures/ledger.json: 12 lines, 14 cards in all, no check-ins, no envelopes.
    static let keyA = "A1|0|pLightningBolt", keyB = "A1|1|pCounterspell", keyC = "B1|0|pLightningBolt"
    static let pkgA = "A1::Alpha Cards"
    static let brokenKey = "A9|0|pBroken"
    static let lines = 12
    static let cards = 14

    let root: URL
    let clock = VersionClock(VersionSandbox.t0)
    var dir: URL { root.appending(path: "ledger", directoryHint: .isDirectory) }
    var ledgerURL: URL { dir.appending(path: "ledger.json") }
    var versionsURL: URL { root.appending(path: "versions", directoryHint: .isDirectory) }

    init() throws {
        root = FileManager.default.temporaryDirectory.appending(path: "n9-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }

    // MARK: the documents

    /// The `items` of the shared fixture, as raw JSON objects.
    static func fixtureItems() throws -> [[String: Any]] {
        let data = try Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"))
        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: data) as? [String: Any])
        return try XCTUnwrap(obj["items"] as? [[String: Any]])
    }

    /// A whole ledger: the fixture lines, `mailday` 1, and whatever else the test names.
    /// Each check-in carries a time a day before t0.
    static func ledger(
        received: [String: Int] = [:], envelopes: [[String: Any]] = [],
        stamps: [String: [String: Any]] = [:], extra: [String: Any] = [:]
    ) throws -> [String: Any] {
        var doc: [String: Any] = ["mailday": 1, "items": try fixtureItems()]
        if !received.isEmpty {
            doc["received"] = received
            doc["receivedAt"] = received.mapValues { _ in t0 - day }
        }
        if !envelopes.isEmpty { doc["envelopes"] = envelopes }
        if !stamps.isEmpty { doc["stamps"] = stamps }
        for (k, v) in extra { doc[k] = v }
        return doc
    }

    /// A live envelope record.
    static func env(_ id: String, _ entries: [(String, Int)], updated: Double = t0 - day) -> [String: Any] {
        [
            "id": id, "createdAt": t0 - day, "updatedAt": updated, "note": "", "photos": [String](),
            "entries": entries.map { ["name": $0.0, "qty": $0.1] as [String: Any] },
        ]
    }

    /// The tombstone a discard leaves.
    static func tombstone(_ id: String, at: Double) -> [String: Any] {
        ["id": id, "createdAt": t0 - day, "updatedAt": at, "deletedAt": at, "note": "",
         "photos": [String](), "entries": [Any]()]
    }

    /// One stamp. A removed stamp has kind "".
    static func stamp(_ kind: String, updatedAt: Double = t0 - day) -> [String: Any] {
        ["kind": kind, "note": "", "at": "2026-08-01", "updatedAt": updatedAt]
    }

    static func bytes(_ doc: [String: Any]) throws -> Data {
        try JSONSerialization.data(withJSONObject: doc, options: [.sortedKeys])
    }

    /// Canonical bytes of any JSON value, so key order and Int or Double do not matter.
    static func canon(_ value: Any) -> Data? {
        try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed])
    }

    func write(_ doc: [String: Any]) throws { try Self.bytes(doc).write(to: ledgerURL) }

    func saved() throws -> [String: Any] {
        try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: ledgerURL)) as? [String: Any])
    }

    /// The kept copies beside the ledger: ledger.kept-<ISO time>.json.
    func keptCopies() throws -> [URL] {
        try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            .filter { $0.lastPathComponent.hasPrefix("ledger.kept-") && $0.pathExtension == "json" }
    }

    // MARK: the stores

    func versions(rules: URL? = nil) -> VersionStore {
        VersionStore(directory: versionsURL, now: { [clock] in clock.t }, rulesURL: rules)
    }

    func store(versions: VersionStore?) -> LedgerStore {
        LedgerStore(fileURL: ledgerURL, now: { [clock] in clock.t }, versions: versions)
    }

    /// A ledger written, a store over it, loaded, with a version store attached.
    func open(_ doc: [String: Any]? = nil) throws -> (store: LedgerStore, versions: VersionStore) {
        try write(try doc ?? Self.ledger())
        let vs = versions()
        let store = store(versions: vs)
        try store.load()
        return (store, vs)
    }

    /// A ledger file that will not open: the store is not loaded.
    func openDamaged(_ raw: Data) throws -> (store: LedgerStore, versions: VersionStore) {
        try raw.write(to: ledgerURL)
        let vs = versions()
        let store = store(versions: vs)
        XCTAssertThrowsError(try store.load(), "anchor: the damaged file does not open")
        return (store, vs)
    }

    // MARK: breaking a folder

    /// Writes stop working in `url`: a new file cannot be made in it, whatever the store's layout.
    /// Reads still work. Undone when the test ends.
    func lockWrites(_ url: URL, recursive: Bool = false) {
        let fm = FileManager.default
        var all = [url]
        if recursive, let e = fm.enumerator(at: url, includingPropertiesForKeys: nil) { all += e.compactMap { $0 as? URL } }
        for u in all.reversed() {
            var isDir: ObjCBool = false
            _ = fm.fileExists(atPath: u.path, isDirectory: &isDir)
            try? fm.setAttributes([.posixPermissions: isDir.boolValue ? 0o555 : 0o444], ofItemAtPath: u.path)
        }
    }

    /// A plain file where the folder should be. A store over it cannot read or write.
    func replaceWithFile(_ url: URL) throws {
        try? FileManager.default.removeItem(at: url)
        try Data("x".utf8).write(to: url)
    }

    func cleanup() {
        let fm = FileManager.default
        if let e = fm.enumerator(at: root, includingPropertiesForKeys: nil) {
            for case let u as URL in e {
                var isDir: ObjCBool = false
                _ = fm.fileExists(atPath: u.path, isDirectory: &isDir)
                try? fm.setAttributes([.posixPermissions: isDir.boolValue ? 0o755 : 0o644], ofItemAtPath: u.path)
            }
        }
        try? fm.setAttributes([.posixPermissions: 0o755], ofItemAtPath: root.path)
        try? fm.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path)
        try? fm.removeItem(at: root)
    }
}

extension XCTestCase {
    /// A fresh sandbox that is unlocked and removed when the test ends.
    func makeVersionSandbox() throws -> VersionSandbox {
        let box = try VersionSandbox()
        addTeardownBlock { box.cleanup() }
        return box
    }
}

/// The rules bundle as the oracle. Swift holds no copy of the retention rule, so a test asks the
/// bundle what it keeps. `keptIds` returns a Set, which the JSON bridge turns into `{}`, so the
/// oracle is `prunePlan` (the records to delete) and kept is everything else.
enum VersionOracle {
    typealias Retention = (recentKeep: Int, milestoneDays: Int, milestoneMax: Int, hourHours: Int, dayDays: Int)

    static func retention() async throws -> Retention {
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let json = try await engine.constant("RETENTION")
        let o = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
        func n(_ k: String) throws -> Int { try XCTUnwrap((o[k] as? NSNumber)?.intValue, k) }
        return (try n("recentKeep"), try n("milestoneDays"), try n("milestoneMax"), try n("hourHours"), try n("dayDays"))
    }

    /// The ids prunePlan(records, now) deletes.
    static func plan(_ records: [VersionRecord], now: Double) async throws -> Set<String> {
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let recs = records.map { ["id": $0.id, "at": $0.at, "kind": $0.kind, "label": $0.label] as [String: Any] }
        let args = try JSONSerialization.data(withJSONObject: [recs, now] as [Any])
        let out = try await engine.call("prunePlan", String(decoding: args, as: UTF8.self))
        let ids = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [String])
        return Set(ids)
    }
}
