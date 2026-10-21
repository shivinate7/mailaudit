// Shared helpers and the contract for the N7 Orphaned tests (lane N7, native-build-lanes).
//
// Web behaviour matched: orphaned-mail-never-decides, orphan-entry-takes-one-input,
// assign-checks-recorded-cards, shrunk-envelope-gets-fresh-stamp, undo-removes-only-its-delta,
// testing-partial-qty-needs-case, envelope-names-match-normname, candidates-skip-date-filter.
//
// Red-first. The builder adds the types below in native/ManifestKit/Sources/ManifestKit/.
// Until they exist the Orphaned* test files do not compile. The red run is recorded in the
// lane's commit message: a scratch package with a wrong-valued stub of this contract, where
// every test fails on an assertion (testing-throwing-assert-bad-kill).
//
// Contract the tests name. All times come from the LedgerStore's `now`. Every write goes
// through the LedgerStore, so an edit touches only `received`, `receivedAt`, `envelopes`
// (native-ledger-is-raw-json). The model holds no KeyStore (the-token-is-a-credential).
//
//   public struct EnvelopeEntry: Equatable, Sendable {
//       public var name: String; public var qty: Int
//       public init(name: String, qty: Int)
//   }
//   public struct Envelope: Equatable, Sendable {          // a live envelope: no deletedAt
//       public let id: String
//       public let createdAt, updatedAt: Double
//       public let note: String
//       public let entries: [EnvelopeEntry]
//   }
//   public struct PlanStep: Equatable, Sendable { public let itemKey: String; public let take: Int }
//   public struct Candidate: Equatable, Sendable {         // one row of rankCandidates().list
//       public let pkg: Package
//       public let matchedQty, entriesTotal, poolTotal, pkgLeft, envLeft: Int
//       public let plan: [PlanStep]
//       public let exact: Bool
//   }
//   public struct Ranked: Equatable, Sendable {
//       public let list: [Candidate]                       // best first, as the bundle ranks
//       public let tied: Int                               // the bundle's tie count
//       public let explainable: Set<String>                // normName of each entry some candidate explains
//       public func emphasized(_ c: Candidate) -> Bool     // false for every candidate of a tie
//   }
//   public struct Suggestion: Equatable, Sendable { public let name: String; public let qty, sellerCount: Int }
//   public enum ComposerTarget: Hashable, Sendable { case new; case edit(String) }
//   public struct EnvelopeDraft: Equatable, Sendable {
//       public var input: String; public var entries: [EnvelopeEntry]; public var note: String
//       public init(input: String, entries: [EnvelopeEntry], note: String)
//   }
//   public struct UndoNotice: Equatable, Sendable {
//       public let matchedQty, leftoverQty, index: Int     // index: the pile slot the envelope left
//       public let pkgLabel: String                        // the seller
//   }
//   public enum OrphanedNotice {                           // pure copy, like LedgerNotice
//       public static let emptyLine: String
//       public static func tieLine(tied: Int) -> String?   // nil below 2
//       public static func undoLine(matchedQty: Int, pkgLabel: String, leftoverQty: Int) -> String
//   }
//   @MainActor @Observable public final class OrphanedModel {
//       public init(engine: RulesEngine, store: LedgerStore)
//       public private(set) var envelopes: [Envelope]      // live only, in file order (newest first)
//       public private(set) var undo: UndoNotice?
//       public private(set) var composing: ComposerTarget?
//       public private(set) var error: String?            // set when a save fails; the call also throws
//       public func load() async throws                    // reads the store, ranks candidates again
//       public func ranked(for envelopeId: String) -> Ranked   // empty Ranked for an unknown id
//       public func suggestions(for text: String) async -> [Suggestion]   // still-outstanding cards only; async: normName is in the bundle
//       public func open(_ target: ComposerTarget)
//       public func cancel()                               // closes the composer and KEEPS its draft
//       public func draft(for target: ComposerTarget) -> EnvelopeDraft
//       public func setInput(_ text: String, for target: ComposerTarget)
//       public func setNote(_ text: String, for target: ComposerTarget)
//       public func addName(_ name: String, for target: ComposerTarget) async throws
//       public func save(_ target: ComposerTarget) async throws       // records or edits; ends the draft
//       public func assign(envelope id: String, to gk: String) async throws
//       public func undoAssign() async throws              // a no-op when there is nothing to undo
//       public func discard(envelope id: String) async throws
//   }
//
// Behaviour the contract does not show:
//   - The candidate list comes from the bundle's rankCandidates over groupPackages of the
//     ledger items without canceled orders. Swift holds no copy of the matching. assign
//     writes the plan of the candidate the bundle gave (OrphanedAssignTests, the probe).
//   - Candidates are derived on every load and after every write. Nothing about them is stored.
//   - assign(envelope:to:) throws for a gk that is not in that envelope's candidate list.
//   - The assign handler and undoAssign still live in src/app.jsx, not in the bundle. They
//     are not callable from Swift today. The builder either extracts them into
//     src/view-rules.mjs (with a golden file and `npm run build`) or keeps a Swift home and
//     the orchestrator rules on it. The tests hold under both.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

/// A clock the test moves. The store reads it through `now`.
final class OrphanedClock: @unchecked Sendable {
    var t: Double
    init(_ t: Double) { self.t = t }
}

/// A ledger folder in the temp directory, with its own clock. The folder is removed
/// (and made writable first) when the test ends.
final class OrphanedSandbox: @unchecked Sendable {
    static let t0: Double = 1_786_543_380_000
    static let day: Double = 86_400_000

    // Item keys and package keys from shared/fixtures/ledger.json. A1 and B1 hold the same
    // three cards, so they tie. C1 holds five cards, D1 holds one.
    static let a1 = "A1::Alpha Cards", b1 = "B1::Beta Games", c1 = "C1::Gamma Cards", d1 = "D1::Delta Cards"
    static let a1Bolt = "A1|0|pLightningBolt", a1Counter = "A1|1|pCounterspell", a1Brain = "A1|2|pBrainstorm"
    static let c1Bolt = "C1|0|pLightningBolt", c1Path = "C1|1|pPathtoExile"
    static let c1Swords = "C1|2|pSwordstoPlowshares", c1Ponder = "C1|3|pPonder", c1Preordain = "C1|4|pPreordain"
    static let d1Saga = "D1|0|pUrzasSaga"

    let dir: URL
    let clock = OrphanedClock(OrphanedSandbox.t0)
    var fileURL: URL { dir.appending(path: "ledger.json") }

    init() throws {
        dir = FileManager.default.temporaryDirectory.appending(path: "n7-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }

    /// The `items` of the shared fixture, as raw JSON objects.
    static func fixtureItems() throws -> [[String: Any]] {
        let data = try Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"))
        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: data) as? [String: Any])
        return try XCTUnwrap(obj["items"] as? [[String: Any]])
    }

    /// One raw envelope record. `updated` defaults to `created`.
    static func env(
        _ id: String, _ entries: [(String, Int)], created: Double = t0 - day, updated: Double? = nil,
        note: String = "", photos: [String] = [], extra: [String: Any] = [:]
    ) -> [String: Any] {
        var e: [String: Any] = [
            "id": id, "createdAt": created, "updatedAt": updated ?? created, "note": note, "photos": photos,
            "entries": entries.map { ["name": $0.0, "qty": $0.1] as [String: Any] },
        ]
        for (k, v) in extra { e[k] = v }
        return e
    }

    /// Writes ledger.json: `mailday` 1, the given items (the shared fixture by default), and any extras.
    func write(items: [[String: Any]]? = nil, extra: [String: Any] = [:]) throws {
        var seed: [String: Any] = ["mailday": 1, "items": try items ?? Self.fixtureItems()]
        for (k, v) in extra { seed[k] = v }
        try JSONSerialization.data(withJSONObject: seed, options: [.sortedKeys]).write(to: fileURL)
    }

    func bytes() throws -> Data { try Data(contentsOf: fileURL) }

    func saved() throws -> [String: Any] {
        try XCTUnwrap(try JSONSerialization.jsonObject(with: bytes()) as? [String: Any])
    }

    // An absent field reads as empty: the store only writes a default when it saves.
    func savedReceived() throws -> [String: Int] {
        (try saved()["received"] as? [String: Any] ?? [:]).compactMapValues { ($0 as? NSNumber)?.intValue }
    }

    func savedReceivedAt() throws -> [String: Double] {
        (try saved()["receivedAt"] as? [String: Any] ?? [:]).compactMapValues { ($0 as? NSNumber)?.doubleValue }
    }

    func savedEnvelopes() throws -> [[String: Any]] {
        try saved()["envelopes"] as? [[String: Any]] ?? []
    }

    /// One envelope by id. A missing one is a failed assertion, and the empty record keeps the test reading on.
    func savedEnvelope(_ id: String, line: UInt = #line) throws -> [String: Any] {
        guard let e = try savedEnvelopes().first(where: { ($0["id"] as? String) == id }) else {
            XCTFail("envelope \(id) is not in the file", line: line)
            return [:]
        }
        return e
    }

    static func entries(of env: [String: Any]) -> [EnvelopeEntry] {
        (env["entries"] as? [[String: Any]] ?? []).map {
            EnvelopeEntry(name: $0["name"] as? String ?? "?", qty: ($0["qty"] as? NSNumber)?.intValue ?? -1)
        }
    }

    /// The store and the model over this folder, loaded. `bundle` is the rules.js the engine runs.
    @MainActor
    func open(bundle: URL = RulesGoldenTests.bundleURL) async throws -> (model: OrphanedModel, store: LedgerStore) {
        let store = LedgerStore(fileURL: fileURL, now: { [clock] in clock.t })
        try store.load()
        let model = OrphanedModel(engine: try RulesEngine(bundleURL: bundle), store: store)
        try await model.load()
        return (model, store)
    }

    func cleanup() {
        try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path)
        try? FileManager.default.removeItem(at: dir)
    }
}

extension XCTestCase {
    /// A fresh sandbox that is removed when the test ends.
    func makeOrphanedSandbox() throws -> OrphanedSandbox {
        let box = try OrphanedSandbox()
        let dir = box.dir
        addTeardownBlock {
            try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path)
            try? FileManager.default.removeItem(at: dir)
        }
        return box
    }
}

/// Entries as the model reports them: orphanedCards(("Lightning Bolt", 2), ("Counterspell", 1)).
func orphanedCards(_ pairs: (String, Int)...) -> [EnvelopeEntry] {
    pairs.map { EnvelopeEntry(name: $0.0, qty: $0.1) }
}
