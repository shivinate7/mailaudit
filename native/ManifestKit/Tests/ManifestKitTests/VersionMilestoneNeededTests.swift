// Pins that a restore on an open ledger and an adopt that removes something each save their
// milestone first (milestones-taken-before-risk). Each case breaks only the versions folder, so a
// refusal can come only from the milestone. Reset is not pinned here: it waits on the owner's ruling.
// The contract is in VersionTestSupport.swift.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

final class VersionMilestoneNeededTests: XCTestCase {
    typealias Box = VersionSandbox

    /// Makes the versions folder unwritable and leaves the ledger folder writable. The scope is
    /// asserted before the operation runs, so the operation's refusal can only be the milestone's.
    private func lockVersionsOnly(_ box: Box) throws {
        box.lockWrites(box.versionsURL)
        try XCTSkipIf(FileManager.default.isWritableFile(atPath: box.versionsURL.path),
                      "the versions folder stays writable here (root), so its milestone cannot be refused")
        XCTAssertTrue(FileManager.default.isWritableFile(atPath: box.dir.path), "scope: the ledger folder stays writable")
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
        try lockVersionsOnly(box)

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
        try lockVersionsOnly(box)

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
        try lockVersionsOnly(box)

        XCTAssertNoThrow(try store.adopt(raised), "a reply that removes nothing adopts")

        XCTAssertEqual(store.generation, gen + 1, "the adopt bumps the generation once")
        XCTAssertEqual(store.received(), [Box.keyA: 3, Box.keyB: 1], "the reply is applied in memory")
        XCTAssertEqual(try vs.list(), listed, "no milestone was saved for it")
        let again = box.store(versions: nil)
        try again.load()
        XCTAssertEqual(again.received(), [Box.keyA: 3, Box.keyB: 1], "the file holds the adopted ledger")
    }
}
