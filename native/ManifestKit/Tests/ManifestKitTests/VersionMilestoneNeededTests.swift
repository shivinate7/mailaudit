// Pins that a restore on an open ledger, an adopt that removes something, and a native Reset each
// save their milestone first (milestones-taken-before-risk). Each refusal case breaks only the
// versions folder, so a refusal can come only from the milestone. Each refusal has a control beside
// it. The contract is in VersionTestSupport.swift.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

final class VersionMilestoneNeededTests: XCTestCase {
    typealias Box = VersionSandbox

    /// Makes the versions folder unwritable and leaves the ledger folder writable. The scope is
    /// asserted before the operation runs, so the operation's refusal can only be the milestone's.
    /// Returns false when the lock did not hold: the test has failed there and stops. Root writes
    /// into a read-only folder, so the lock cannot hold there and the test skips.
    private func lockVersionsOnly(_ box: Box) throws -> Bool {
        guard FileManager.default.fileExists(atPath: box.versionsURL.path) else {
            XCTFail("scope: the versions folder exists before the lock, so the lock reaches it")
            return false
        }
        box.lockWrites(box.versionsURL)
        if FileManager.default.isWritableFile(atPath: box.versionsURL.path) {
            if getuid() == 0 {
                throw XCTSkip("root writes into a read-only folder, so the versions milestone cannot be refused here")
            }
            XCTFail("the lock did not hold: the versions folder is still writable, so its milestone cannot be refused")
            return false
        }
        XCTAssertTrue(FileManager.default.isWritableFile(atPath: box.dir.path), "scope: the ledger folder stays writable")
        return true
    }

    // MARK: restore on an open ledger

    /// A restore takes its milestone before it touches the ledger. When that milestone cannot be
    /// saved, the restore throws and the ledger file, its generation and its memory stay as they were.
    func testRestoreOnAnOpenLedgerThrowsAndChangesNothingWhenItsMilestoneCannotBeSaved() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger(received: [Box.keyA: 2]))
        let v = try vs.put(try Box.bytes(try Box.ledger(received: [Box.keyC: 2])), label: "before import")
        let listed = try vs.list()
        let fileBefore = try Data(contentsOf: box.ledgerURL)
        let before = store.snapshot()
        let gen = store.generation
        guard try lockVersionsOnly(box) else { return }

        XCTAssertThrowsError(try store.restore(v.id), "a restore whose milestone cannot be saved throws")

        XCTAssertEqual(try Data(contentsOf: box.ledgerURL), fileBefore, "the ledger file bytes are unchanged")
        XCTAssertEqual(store.generation, gen, "the generation is unchanged")
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "the in-memory ledger is unchanged")
        XCTAssertEqual(try vs.list(), listed, "no milestone was saved")
    }

    // MARK: adopt with a reply that removes something

    /// A reply that lowers a count removes something, so the apply takes its milestone first. When
    /// that milestone cannot be saved, the apply throws and the ledger stays as it was.
    func testAdoptThatLowersACountThrowsAndChangesNothingWhenItsMilestoneCannotBeSaved() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger(received: [Box.keyA: 2]))
        try vs.put(try Box.bytes(try Box.ledger()), label: "before import")
        let listed = try vs.list()
        let fileBefore = try Data(contentsOf: box.ledgerURL)
        let before = store.snapshot()
        let gen = store.generation
        let lowered = try Box.bytes(try Box.ledger(received: [Box.keyA: 1]))
        guard try lockVersionsOnly(box) else { return }

        XCTAssertThrowsError(try store.adopt(lowered), "a removing reply throws when its milestone cannot be saved")

        XCTAssertEqual(try Data(contentsOf: box.ledgerURL), fileBefore, "the ledger file bytes are unchanged")
        XCTAssertEqual(store.generation, gen, "the generation is unchanged")
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "the in-memory ledger is unchanged")
        XCTAssertEqual(try vs.list(), listed, "no milestone was saved")
    }

    /// The control: a reply that removes nothing adopts while the versions folder is unwritable. It
    /// needs no milestone, so the milestone's failure does not reach it.
    func testAdoptThatRemovesNothingStillAdoptsWhenTheVersionsFolderIsUnwritable() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger(received: [Box.keyA: 2]))
        try vs.put(try Box.bytes(try Box.ledger()), label: "before import")
        let listed = try vs.list()
        let gen = store.generation
        let raised = try Box.bytes(try Box.ledger(received: [Box.keyA: 3, Box.keyB: 1]))
        guard try lockVersionsOnly(box) else { return }

        XCTAssertNoThrow(try store.adopt(raised), "a reply that removes nothing adopts")

        XCTAssertEqual(store.generation, gen + 1, "the adopt bumps the generation once")
        XCTAssertEqual(store.received(), [Box.keyA: 3, Box.keyB: 1], "the reply is applied in memory")
        XCTAssertEqual(try vs.list(), listed, "no milestone was saved for it")
        let again = box.store(versions: nil)
        try again.load()
        XCTAssertEqual(again.received(), [Box.keyA: 3, Box.keyB: 1], "the file holds the adopted ledger")
    }

    // MARK: reset on an open ledger

    /// A Reset takes its milestone before it clears anything. When that milestone cannot be saved,
    /// the reset throws and the ledger file, its generation and its memory stay as they were. The
    /// ledger holds check-ins, a stamp and a live envelope, so each thing Reset clears is in play.
    func testResetOnAnOpenLedgerThrowsAndChangesNothingWhenItsMilestoneCannotBeSaved() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger(
            received: [Box.keyA: 2, Box.keyC: 1],
            envelopes: [Box.env("env-1", [("Lightning Bolt", 2)])],
            stamps: [Box.keyA: Box.stamp("mint")]))
        try vs.put(try Box.bytes(try Box.ledger()), label: "before import")
        let listed = try vs.list()
        let fileBefore = try Data(contentsOf: box.ledgerURL)
        let before = store.snapshot()
        let userBefore = store.userData()
        let gen = store.generation
        guard try lockVersionsOnly(box) else { return }

        XCTAssertThrowsError(try store.reset(), "a reset whose milestone cannot be saved throws")

        XCTAssertEqual(try Data(contentsOf: box.ledgerURL), fileBefore, "the ledger file bytes are unchanged")
        XCTAssertEqual(store.generation, gen, "the generation is unchanged")
        XCTAssertEqual(store.received(), [Box.keyA: 2, Box.keyC: 1], "the check-ins are unchanged")
        XCTAssertEqual(Box.canon(store.userData()), Box.canon(userBefore), "receivedAt, stamps and envelopes are unchanged")
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "the in-memory ledger is unchanged")
        XCTAssertEqual(try vs.list(), listed, "no milestone was saved")
    }

    /// The control: the same ledger with the versions folder writable. The reset takes its milestone
    /// and clears the ledger, so the refusal above comes from the lock and from nothing else.
    func testResetOnTheSameLedgerClearsItAndKeepsItsMilestoneWhenTheVersionsFolderIsWritable() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger(
            received: [Box.keyA: 2, Box.keyC: 1],
            envelopes: [Box.env("env-1", [("Lightning Bolt", 2)])],
            stamps: [Box.keyA: Box.stamp("mint")]))
        try vs.put(try Box.bytes(try Box.ledger()), label: "before import")
        let gen = store.generation

        XCTAssertNoThrow(try store.reset(), "a reset whose milestone can be saved goes ahead")

        XCTAssertEqual(store.generation, gen + 1, "the reset bumps the generation once")
        XCTAssertEqual(store.received(), [:], "the check-ins are cleared")
        XCTAssertTrue(try vs.list().contains { $0.label == "before reset" }, "the reset saved its milestone")
    }

    // MARK: the Reset press

    /// The Reset press surfaces the same refusal. A confirmed press whose milestone cannot be saved
    /// shows the error on the Reset row, ends the ask, and changes nothing.
    @MainActor
    func testAConfirmedResetPressShowsTheRefusalAndChangesNothingWhenItsMilestoneCannotBeSaved() throws {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger(received: [Box.keyA: 2, Box.keyC: 1]))
        try vs.put(try Box.bytes(try Box.ledger()), label: "before import")
        let listed = try vs.list()
        let fileBefore = try Data(contentsOf: box.ledgerURL)
        let before = store.snapshot()
        let gen = store.generation
        let model = VersionsModel(store: store, versions: vs)
        guard try lockVersionsOnly(box) else { return }

        model.pressReset()
        guard case .reset = model.ask else { return XCTFail("scope: the first press arms the Reset ask") }
        model.pressReset()

        XCTAssertEqual(model.error, RowError(site: .reset, message: "The ledger could not be reset."),
                       "the refusal shows on the Reset row")
        XCTAssertNil(model.ask, "a confirmed press ends the ask, win or lose")
        XCTAssertEqual(try Data(contentsOf: box.ledgerURL), fileBefore, "the ledger file bytes are unchanged")
        XCTAssertEqual(store.generation, gen, "the generation is unchanged")
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "the in-memory ledger is unchanged")
        XCTAssertEqual(try vs.list(), listed, "no milestone was saved")
    }
}
