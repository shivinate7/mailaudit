// Restore restamp. A restore is a change the person made now (decision `a-restore-is-not-local`;
// debt `native-restore-later-reply-unpinned`). The web's restore gives the restore time to every check-in
// key, stamp and envelope (restampRestore in src/merge-rules.mjs). The native restore applies the
// bundle's copy of that rule, so the ledger it saves must be what the bundle returns for the same
// inputs. The times are also checked on their own, so a failure names the cause.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

/// restampRestore(cur, data, now) from the rules bundle, through RulesEngine. Returns nil after one
/// XCTFail that names the cause when the bundle cannot run it. A throw would end the case before its
/// other assertions run. The ledger dictionaries are not Sendable, so every caller stays on the main
/// actor and they never cross into the rules engine.
@MainActor
enum RestampOracle {
    static func restamp(_ cur: [String: Any], _ data: [String: Any], _ now: Double,
                        file: StaticString = #filePath, line: UInt = #line) async -> [String: Any]? {
        let out: String
        do {
            let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
            let args = try JSONSerialization.data(withJSONObject: [cur, data, now] as [Any])
            out = try await engine.call("restampRestore", String(decoding: args, as: UTF8.self))
        } catch {
            XCTFail("the rules bundle does not run restampRestore: \(error)", file: file, line: line)
            return nil
        }
        guard let obj = (try? JSONSerialization.jsonObject(with: Data(out.utf8))) as? [String: Any] else {
            XCTFail("restampRestore did not return an object: \(out)", file: file, line: line)
            return nil
        }
        return obj
    }

    /// The three fields a restore stamps, each compared on its own so a failure names the field.
    static func assertSame(_ got: [String: Any], _ want: [String: Any], _ what: String,
                           file: StaticString = #filePath, line: UInt = #line) {
        for field in ["receivedAt", "stamps", "envelopes"] {
            XCTAssertEqual(VersionSandbox.canon(got[field] ?? NSNull()), VersionSandbox.canon(want[field] ?? NSNull()),
                           "\(what): \(field) is not what restampRestore returns for these inputs",
                           file: file, line: line)
        }
    }
}

/// The sandbox's run folder registers a test observer, which must happen on the main thread. The
/// async cases here would otherwise create it off main and abort the test process.
@MainActor
final class RestoreRestampTests: XCTestCase {
    typealias Box = VersionSandbox

    /// The restore time: three hours after t0. The clock is injected, so no real time reaches an assert.
    static let restoreAt: Double = Box.t0 + 3 * Box.hour
    /// The change time of the current ledger's edits: an hour after t0, so before the restore.
    static let newer: Double = Box.t0 + Box.hour
    static let pkgB = "B1::Beta Games"

    /// Bulk check-ins, so the populated cases reach a ledger of real size, not a handful of keys.
    static let bulkKeys: [String] = (0..<120).map { "C\($0)|0|pBulk\($0)" }

    /// The version's check-ins: two named keys and every bulk key.
    static let versionReceived: [String: Int] = {
        var r: [String: Int] = [Box.keyA: 2, Box.keyB: 1]
        for k in bulkKeys { r[k] = 1 }
        return r
    }()

    /// The current ledger's check-ins: the named keys, a newer one, and the first 60 bulk keys.
    static let currentReceived: [String: Int] = {
        var r: [String: Int] = [Box.keyA: 2, Box.keyB: 1, Box.keyC: 1]
        for k in bulkKeys.prefix(60) { r[k] = 1 }
        return r
    }()

    /// Every check-in key either ledger holds.
    static let checkInKeys = Set(versionReceived.keys).union(currentReceived.keys)

    /// The ledger a version was saved from: its check-ins, one envelope and one stamp, all a day old.
    static func versionDoc() throws -> [String: Any] {
        try Box.ledger(
            received: versionReceived,
            envelopes: [Box.env("e1", [("Counterspell", 1)])],
            stamps: [Box.pkgA: Box.stamp("partial")])
    }

    /// The ledger at the restore: a newer check-in, an edited envelope, a new envelope, a changed stamp
    /// and a stamp the version lacks. Each carries a change time after the version was saved.
    static func currentDoc() throws -> [String: Any] {
        try Box.ledger(
            received: currentReceived,
            envelopes: [Box.env("e1", [("Counterspell", 2)], updated: newer),
                        Box.env("e2", [("Lightning Bolt", 1)], updated: newer)],
            stamps: [Box.pkgA: Box.stamp("sent", updatedAt: newer),
                     pkgB: Box.stamp("lost", updatedAt: newer)],
            extra: ["receivedAt": currentReceived.mapValues { _ in newer }])
    }

    /// Saves `version`, then restores it over `current` at the restore time. Returns the box, the store,
    /// and the ledger the restore replaced.
    func restore(current: [String: Any], version: [String: Any]) throws
        -> (box: Box, store: LedgerStore, held: [String: Any]) {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(current)
        let v = try vs.put(try Box.bytes(version), label: "before import")
        let held = store.snapshot()
        box.clock.t = Self.restoreAt
        try store.restore(v.id)
        return (box, store, held)
    }

    static func number(_ value: Any) -> Double? { (value as? NSNumber)?.doubleValue }

    /// receivedAt holds exactly `keys`, each at the restore time.
    func assertCheckInTimes(_ doc: [String: Any], _ keys: Set<String>, _ at: String, line: UInt = #line) {
        let times = doc["receivedAt"] as? [String: Any] ?? [:]
        let held = Set(times.keys)
        XCTAssertTrue(held == keys,
                      "\(at): receivedAt does not hold exactly the check-ins of either ledger (holds \(held.count), expected \(keys.count))",
                      line: line)
        let want: Set<Double> = keys.isEmpty ? [] : [Self.restoreAt]
        XCTAssertEqual(Set(times.values.compactMap(Self.number)), want,
                       "\(at): a check-in keeps an old change time, not the restore time", line: line)
    }

    /// The stamp for `key` holds `kind` and the restore time. A blank kind is the tombstone a restore
    /// leaves for a stamp the version lacks.
    func assertStamp(_ doc: [String: Any], _ key: String, kind: String, _ at: String, line: UInt = #line) {
        let stamps = doc["stamps"] as? [String: Any] ?? [:]
        let s = stamps[key] as? [String: Any]
        XCTAssertEqual(s?["kind"] as? String, kind, "\(at): stamp \(key) has the wrong kind", line: line)
        XCTAssertEqual((s?["updatedAt"] as? NSNumber)?.doubleValue, Self.restoreAt,
                       "\(at): stamp \(key) keeps an old change time", line: line)
    }

    /// The envelope `id` is held at the restore time: live when `deleted` is false, a tombstone at the
    /// restore time when `deleted` is true.
    func assertEnvelope(_ doc: [String: Any], _ id: String, deleted: Bool, _ at: String, line: UInt = #line) {
        let list = doc["envelopes"] as? [[String: Any]] ?? []
        guard let e = list.first(where: { ($0["id"] as? String) == id }) else {
            XCTFail("\(at): envelope \(id) is missing; a restore keeps it or tombstones it", line: line)
            return
        }
        XCTAssertEqual((e["updatedAt"] as? NSNumber)?.doubleValue, Self.restoreAt,
                       "\(at): envelope \(id) keeps an old change time", line: line)
        if deleted {
            XCTAssertEqual((e["deletedAt"] as? NSNumber)?.doubleValue, Self.restoreAt,
                           "\(at): envelope \(id) is not a tombstone at the restore time", line: line)
        } else {
            XCTAssertNil(e["deletedAt"], "\(at): envelope \(id) is a tombstone, but the version holds it live",
                         line: line)
        }
    }

    /// The restore saves what the bundle's restampRestore returns: the restore time on every check-in
    /// and stamp of either ledger, the version's envelopes at the restore time, and a tombstone at the
    /// restore time for each envelope only the current ledger held.
    func testRestoreStampsEveryChangeTimeAsTheBundleDoes() async throws {
        let version = try Self.versionDoc()
        let (box, store, held) = try restore(current: try Self.currentDoc(), version: version)
        let saved = try box.saved()

        // Scope first: the version's content is in place, so the times below are the subject.
        XCTAssertEqual(store.received(), Self.versionReceived, "the version's check-ins were not applied")

        for (doc, at) in [(store.snapshot(), "memory"), (saved, "file")] {
            assertCheckInTimes(doc, Self.checkInKeys, at)
            assertStamp(doc, Box.pkgA, kind: "partial", at)
            assertStamp(doc, Self.pkgB, kind: "", at)
            assertEnvelope(doc, "e1", deleted: false, at)
            assertEnvelope(doc, "e2", deleted: true, at)
        }

        guard let expected = await RestampOracle.restamp(held, version, Self.restoreAt) else { return }
        RestampOracle.assertSame(store.snapshot(), expected, "memory")
        RestampOracle.assertSame(saved, expected, "file")
    }

    /// Green on the old code. The restore still applies the version's check-ins, envelopes and stamps,
    /// in memory and on disk, so the case above fails on the change times alone. An envelope the version
    /// lacks stays in the list as a tombstone (decision `a-restore-is-not-local`), so only the live
    /// envelopes are compared with the version's.
    func testRestoreStillAppliesTheVersionsContent() throws {
        let (box, store, _) = try restore(current: try Self.currentDoc(), version: try Self.versionDoc())
        let saved = try box.saved()

        let counterspell: [[String: Any]] = [["name": "Counterspell", "qty": 1] as [String: Any]]
        for (doc, at) in [(store.snapshot(), "memory"), (saved, "file")] {
            XCTAssertEqual(VersionSandbox.canon(doc["received"] ?? NSNull()),
                           VersionSandbox.canon(Self.versionReceived), "\(at): check-ins are not the version's")
            let live = (doc["envelopes"] as? [[String: Any]] ?? []).filter { $0["deletedAt"] == nil }
            XCTAssertEqual(live.map { $0["id"] as? String }, ["e1"], "\(at): live envelopes are not the version's")
            XCTAssertEqual(VersionSandbox.canon(live.first?["entries"] ?? NSNull()),
                           VersionSandbox.canon(counterspell), "\(at): envelope e1 entries are not the version's")
            let stamps = doc["stamps"] as? [String: Any] ?? [:]
            XCTAssertEqual((stamps[Box.pkgA] as? [String: Any])?["kind"] as? String, "partial",
                           "\(at): stamp \(Box.pkgA) is not the version's")
        }
    }

    /// A version with no check-ins, envelopes or stamps, restored over the current ledger. Nothing of
    /// the version survives, so each key, stamp and envelope the current ledger held is removed at the
    /// restore time, and the removal travels as a tombstone.
    func testRestoreOfAnEmptyVersionTombstonesEveryCurrentChangeAtTheRestoreTime() async throws {
        let empty = try Box.ledger()
        let (box, store, held) = try restore(current: try Self.currentDoc(), version: empty)
        let saved = try box.saved()

        // Scope first: the version holds no check-ins, so none is applied.
        XCTAssertEqual(store.received(), [:], "the empty version's check-ins were applied")

        for (doc, at) in [(store.snapshot(), "memory"), (saved, "file")] {
            assertCheckInTimes(doc, Set(Self.currentReceived.keys), at)
            assertStamp(doc, Box.pkgA, kind: "", at)
            assertStamp(doc, Self.pkgB, kind: "", at)
            assertEnvelope(doc, "e1", deleted: true, at)
            assertEnvelope(doc, "e2", deleted: true, at)
        }

        guard let expected = await RestampOracle.restamp(held, empty, Self.restoreAt) else { return }
        RestampOracle.assertSame(store.snapshot(), expected, "memory")
        RestampOracle.assertSame(saved, expected, "file")
    }
}
