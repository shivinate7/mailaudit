// Milestone tests for Reset and Restore (lane N9, native-build-lanes, milestones-taken-before-risk,
// every-restore-passes-applybackup, a-restore-is-not-local, recovery-control-not-state-gated).
// The contract is in VersionTestSupport.swift. The milestone before a server apply is in
// VersionSyncTests.swift, because it must be driven through the real SyncClient.
//
// A milestone holds the ledger as it stood BEFORE the operation, the whole raw document, unknown
// fields and envelopes included. A restore is a full replace that passes the same apply path as a
// server reply, so the mend, the kept copy and the refusals are the apply path's own.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

final class VersionMilestoneTests: XCTestCase {
    typealias Box = VersionSandbox

    /// The ledger the tests start from: three cards checked in, an envelope, a stamp, and a field
    /// no build has heard of (native-ledger-is-raw-json: it must reach the milestone).
    func richLedger() throws -> [String: Any] {
        try Box.ledger(
            received: [Box.keyA: 2, Box.keyB: 1],
            envelopes: [Box.env("e1", [("Counterspell", 1)])],
            stamps: [Box.pkgA: Box.stamp("partial")],
            extra: ["zzFutureField": ["kept": true]])
    }

    func heldJSON(_ vs: VersionStore, _ id: String) throws -> Any {
        try JSONSerialization.jsonObject(with: vs.data(for: id))
    }

    func assertEmptyLedger(_ doc: [String: Any], _ where_: String, line: UInt = #line) {
        XCTAssertEqual(doc["mailday"] as? Int, 1, "\(where_): mailday", line: line)
        XCTAssertEqual((doc["items"] as? [Any])?.count, 0, "\(where_): items", line: line)
        XCTAssertEqual((doc["received"] as? [String: Any])?.count, 0, "\(where_): received", line: line)
        XCTAssertEqual((doc["receivedAt"] as? [String: Any])?.count, 0, "\(where_): receivedAt", line: line)
        XCTAssertEqual((doc["stamps"] as? [String: Any])?.count, 0, "\(where_): stamps", line: line)
        XCTAssertEqual((doc["envelopes"] as? [Any])?.count, 0, "\(where_): envelopes", line: line)
    }

    // MARK: reset

    /// What the milestone holds is the ledger before the reset: every field of the document, and the
    /// counts the list shows. A milestone built from the four edited fields only would lose the
    /// unknown one; one taken after the reset would hold an empty ledger.
    func testResetSavesABeforeResetMilestoneOfTheWholeDocumentFirst() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        let before = store.snapshot()

        try store.reset()

        let all = try vs.list()
        XCTAssertEqual(all.count, 1, "exactly one milestone")
        guard let m = all.first else { return XCTFail("no milestone was taken") }
        XCTAssertEqual(m.label, "before reset")
        XCTAssertEqual(m.kind, "milestone")
        XCTAssertEqual([m.lines, m.checked], [Box.lines, 3], "12 lines, 3 cards checked in")
        XCTAssertEqual(Box.canon(try heldJSON(vs, m.id)), Box.canon(before), "the whole document, as it stood")
        XCTAssertNotNil((before["zzFutureField"] as? [String: Any]), "anchor: the unknown field was in the ledger")
    }

    /// Reset is the one control that destroys everything, and the versions survive it on purpose.
    func testResetEmptiesTheLedgerInMemoryAndOnDiskAndTheVersionsSurvive() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        let gen = store.generation

        try store.reset()

        assertEmptyLedger(store.snapshot(), "memory")
        assertEmptyLedger(try box.saved(), "file")
        XCTAssertGreaterThan(store.generation, gen, "a reset bumps the generation the sync client reads")
        XCTAssertEqual(try vs.list().map(\.label), ["before reset"], "the version outlives the reset")
        let again = box.store(versions: nil)
        XCTAssertNoThrow(try again.load(), "the file written is a ledger a relaunch opens")
    }

    /// A save that fails undoes the reset, in memory too, like every other edit of the store.
    func testAFailedResetChangesNothing() throws {
        let box = try makeVersionSandbox()
        let (store, _) = try box.open(try richLedger())
        let before = store.snapshot()
        let gen = store.generation
        let fileBefore = try Data(contentsOf: box.ledgerURL)
        box.lockWrites(box.dir)

        XCTAssertThrowsError(try store.reset())

        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "memory is back to what it was")
        XCTAssertEqual(store.generation, gen)
        XCTAssertEqual(try Data(contentsOf: box.ledgerURL), fileBefore)
    }

    /// Reset is how a person recovers from a ledger that will not open, so it cannot need an open
    /// ledger (recovery-control-not-state-gated). The damaged file goes into the milestone first.
    func testResetOnALedgerThatWillNotOpenKeepsItsBytes() throws {
        let box = try makeVersionSandbox()
        let raw = Data("{ not json".utf8)
        let (store, vs) = try box.openDamaged(raw)

        try store.reset()

        guard let m = try vs.list().first else { return XCTFail("no milestone was taken") }
        XCTAssertEqual(m.label, "before reset")
        XCTAssertEqual(try vs.data(for: m.id), raw, "the damaged file, byte for byte")
        assertEmptyLedger(try box.saved(), "file")
        XCTAssertNoThrow(try store.save(), "the store is open and empty now")
    }

    // MARK: restore

    /// A restore is undoable because it takes its own milestone: the ledger it is about to replace.
    /// The version itself stays in the list.
    func testARestoreTakesABeforeRestoreMilestoneOfTheLedgerItReplaces() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        let older = try Box.ledger(received: [Box.keyC: 2])
        let v = try vs.put(try Box.bytes(older), label: "before import", lines: Box.lines, checked: 2)
        let before = store.snapshot()
        box.clock.t = Box.t0 + 5_000

        try store.restore(v.id)

        let all = try vs.list()
        XCTAssertEqual(all.count, 2, "the version and its milestone")
        guard let m = all.first(where: { $0.id != v.id }) else { return XCTFail("no milestone was taken") }
        XCTAssertEqual(m.label, "before restore")
        XCTAssertEqual(m.kind, "milestone")
        XCTAssertEqual([m.lines, m.checked], [Box.lines, 3])
        XCTAssertEqual(Box.canon(try heldJSON(vs, m.id)), Box.canon(before), "the ledger as it stood before the restore")
        XCTAssertEqual(store.received(), [Box.keyC: 2], "anchor: the version was applied")
        XCTAssertEqual(Box.canon(try heldJSON(vs, v.id)), Box.canon(older), "the restored version is untouched")
    }

    /// A restore changes the ledger, so the sync client must drop any reply still in flight against
    /// the old one, and the file must hold the restored ledger.
    func testARestoreBumpsTheGenerationAndSavesTheVersion() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        let v = try vs.put(try Box.bytes(try Box.ledger(received: [Box.keyC: 2])), label: "before import")
        let gen = store.generation

        try store.restore(v.id)

        XCTAssertGreaterThan(store.generation, gen)
        let again = box.store(versions: nil)
        try again.load()
        XCTAssertEqual(again.received(), [Box.keyC: 2], "the file holds the restored ledger")
        XCTAssertEqual((again.snapshot()["envelopes"] as? [Any])?.count, 0, "a restore replaces the envelopes too")
    }

    /// The apply path refuses what it refuses for a server reply: text that is not a ledger and a
    /// `mailday` it does not know. A refused version changes nothing, and spends no milestone slot.
    func testARefusedVersionChangesNothingAndSpendsNoSlot() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        let before = store.snapshot()
        let gen = store.generation
        let fileBefore = try Data(contentsOf: box.ledgerURL)
        let refused: [(String, Data)] = [
            ("mailday 2", Data(#"{"mailday":2,"items":[]}"#.utf8)),
            ("not json", Data("nope".utf8)),
            ("an array", Data("[1]".utf8)),
        ]
        for (name, bytes) in refused {
            let v = try vs.put(bytes, label: "before import")
            let listed = try vs.list()

            XCTAssertThrowsError(try store.restore(v.id), name) { XCTAssertEqual($0 as? VersionError, .corrupt(v.id), name) }

            XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "\(name): memory")
            XCTAssertEqual(store.generation, gen, "\(name): generation")
            XCTAssertEqual(try Data(contentsOf: box.ledgerURL), fileBefore, "\(name): file")
            XCTAssertEqual(try vs.list(), listed, "\(name): no milestone was spent on a refused restore")
        }
    }

    func testAnUnknownVersionIsUnreadableAndChangesNothing() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        let before = store.snapshot()
        let gen = store.generation

        XCTAssertThrowsError(try store.restore("v0-none")) { XCTAssertEqual($0 as? VersionError, .unreadable("v0-none")) }

        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
        XCTAssertEqual(store.generation, gen)
        XCTAssertEqual(try vs.list(), [], "no milestone for a restore that cannot read its version")
    }

    /// The same mend and kept copy a load and a server reply get (native-ledger-is-raw-json). A
    /// restore that wrote the version's bytes straight to disk would skip both.
    func testARestoreMendsADamagedEntryAndKeepsACopy() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try richLedger())
        var damaged = try Box.ledger(received: [Box.keyA: 1])
        damaged["received"] = [Box.keyA: 1, Box.brokenKey: "x"]
        let raw = try Box.bytes(damaged)
        let v = try vs.put(raw, label: "before import")

        try store.restore(v.id)

        XCTAssertEqual(store.droppedCount, 1, "the entry that was not a number is dropped and counted")
        XCTAssertEqual(store.received(), [Box.keyA: 1], "the readable entry stays")
        let kept = try box.keptCopies()
        XCTAssertEqual(kept.count, 1, "the original is kept beside the ledger")
        XCTAssertEqual(try kept.first.map { try Data(contentsOf: $0) }, raw, "and it holds the version's bytes")
    }

    // MARK: restore on a ledger that will not open

    /// The restore is the way out of a damaged ledger (recovery-control-not-state-gated). Its milestone
    /// is the damaged file, as it was: that file is the only copy of whatever it still holds.
    func testARestoreWorksOnALedgerThatWillNotOpen() throws {
        let box = try makeVersionSandbox()
        let raw = Data("{ not json".utf8)
        let (store, vs) = try box.openDamaged(raw)
        let v = try vs.put(try Box.bytes(try Box.ledger(received: [Box.keyA: 1])), label: "before import")

        try store.restore(v.id)

        guard let m = try vs.list().first(where: { $0.id != v.id }) else { return XCTFail("no milestone was taken") }
        XCTAssertEqual(m.label, "before restore")
        XCTAssertEqual(try vs.data(for: m.id), raw, "the damaged file, byte for byte")
        XCTAssertEqual(store.received(), [Box.keyA: 1], "the version was applied")
        XCTAssertNoThrow(try store.save(), "the store is open now")
    }

    /// If that copy cannot be saved, the restore changes nothing: overwriting the damaged file
    /// would destroy the only copy of it.
    func testARestoreOnADamagedLedgerChangesNothingWhenItsCopyCannotBeSaved() throws {
        let box = try makeVersionSandbox()
        let raw = Data("{ not json".utf8)
        let (store, vs) = try box.openDamaged(raw)
        let v = try vs.put(try Box.bytes(try Box.ledger(received: [Box.keyA: 1])), label: "before import")
        box.lockWrites(box.versionsURL, recursive: true)

        XCTAssertThrowsError(try store.restore(v.id))

        XCTAssertEqual(try Data(contentsOf: box.ledgerURL), raw, "the damaged file is untouched")
        XCTAssertThrowsError(try store.save(), "and the store is still not open")
    }
}
