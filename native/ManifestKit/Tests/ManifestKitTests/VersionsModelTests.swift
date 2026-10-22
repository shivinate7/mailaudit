// Versions model tests (lane N9, native-build-lanes, history-restores-a-saved-version,
// no-native-dialogs, unwritable-store-says-so). The contract is in VersionTestSupport.swift.
//
// The model is the list, the two-press asks and the errors. A first press arms, a second press
// performs, and no native alert or sheet is involved (the view draws the ask in the row). Only one
// control is armed at a time. A failure shows in the row that was pressed, never in a banner and
// never in another row.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class VersionsModelTests: XCTestCase {
    typealias Box = VersionSandbox

    func open(_ box: VersionSandbox, _ doc: [String: Any]? = nil) throws
        -> (model: VersionsModel, store: LedgerStore, versions: VersionStore)
    {
        let (store, vs) = try box.open(doc)
        return (VersionsModel(store: store, versions: vs), store, vs)
    }

    /// A version whose ledger holds one line of one card, so its count differs from the current 14.
    func smallVersion(_ vs: VersionStore, label: String = "before import") throws -> VersionRecord {
        var doc = try Box.ledger(received: [Box.keyC: 1])
        doc["items"] = [try XCTUnwrap(try Box.fixtureItems().first)]
        return try vs.put(try Box.bytes(doc), label: label, lines: 1, checked: 1)
    }

    // MARK: the copy

    /// The web's own words (src/app.jsx cardsOf and the two asks), so the two clients read alike.
    func testTheAskCopyIsTheWebsAndCountsCardsInTheRightNumber() {
        XCTAssertEqual(VersionNotice.resetAsk(cards: 14), "Tap again to clear 14 cards")
        XCTAssertEqual(VersionNotice.resetAsk(cards: 1), "Tap again to clear 1 card")
        XCTAssertEqual(VersionNotice.resetAsk(cards: 0), "Tap again to clear 0 cards")
        XCTAssertEqual(VersionNotice.restoreAsk(cards: 14), "Tap again to replace 14 cards")
        XCTAssertEqual(VersionNotice.restoreAsk(cards: 1), "Tap again to replace 1 card")
        XCTAssertEqual(VersionNotice.unreadable, "That version could not be read from this device.")
        XCTAssertEqual(VersionNotice.corrupt, "That version could not be restored \u{2014} it looks corrupt.")
    }

    // MARK: the list

    /// One row per record, newest first. A recent is listed too: the list hides nothing.
    func testTheListShowsEachVersionNewestFirstWithItsCounts() throws {
        let box = try makeVersionSandbox()
        let (model, _, vs) = try open(box)
        box.clock.t = Box.t0
        let a = try vs.put(Data("{}".utf8), label: "before sync", kind: "milestone", lines: 12, checked: 3)
        box.clock.t = Box.t0 + 1_000
        let b = try vs.put(Data("{}".utf8), label: "before restore", kind: "milestone", lines: 12, checked: 0)
        box.clock.t = Box.t0 + 2_000
        let c = try vs.put(Data("{}".utf8), label: "after a check-in", kind: "recent", lines: 5, checked: 2)

        model.refresh()

        XCTAssertEqual(model.rows.map(\.id), [c.id, b.id, a.id])
        XCTAssertEqual(model.rows.map(\.label), ["after a check-in", "before restore", "before sync"])
        XCTAssertEqual(model.rows.map(\.counts), ["5/2", "12/0", "12/3"])
        XCTAssertEqual(model.rows.map(\.isMilestone), [false, true, true])
        XCTAssertEqual(model.rows.map(\.at), [Box.t0 + 2_000, Box.t0 + 1_000, Box.t0])
        XCTAssertNil(model.listError)
    }

    /// An unreadable list is a different thing from an empty one (unwritable-store-says-so).
    func testAnUnreadableListIsNotAnEmptyList() throws {
        let box = try makeVersionSandbox()
        let (model, _, _) = try open(box)
        try box.replaceWithFile(box.versionsURL)

        model.refresh()
        XCTAssertNotNil(model.listError, "the list could not be read, and the model says so")

        try FileManager.default.removeItem(at: box.versionsURL)
        model.refresh()
        XCTAssertNil(model.listError)
        XCTAssertEqual(model.rows, [], "no versions yet is an empty list, and not an error")
    }

    // MARK: Reset asks, then performs

    func testOnePressArmsResetAndChangesNothing() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let before = store.snapshot()
        let gen = store.generation

        model.pressReset()

        XCTAssertEqual(model.ask, .reset(cards: Box.cards))
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
        XCTAssertEqual(store.generation, gen)
        XCTAssertEqual(try vs.list(), [], "an ask spends no milestone")
        XCTAssertNil(model.error)
    }

    func testASecondPressResetsAndListsTheMilestone() throws {
        let box = try makeVersionSandbox()
        let (model, store, _) = try open(box, try Box.ledger(received: [Box.keyA: 2, Box.keyB: 1]))

        model.pressReset()
        model.pressReset()

        XCTAssertNil(model.ask, "the ask is spent")
        XCTAssertNil(model.error)
        XCTAssertEqual(store.items().count, 0, "the ledger was cleared")
        XCTAssertEqual(model.rows.map(\.label), ["before reset"], "the model lists the milestone it just took")
        XCTAssertEqual(model.rows.map(\.counts), ["12/3"])
    }

    /// Cancel is real: it disarms and leaves the ledger and the versions alone.
    func testCancelDisarmsAndChangesNothing() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let before = store.snapshot()
        model.pressReset()

        model.cancelAsk()

        XCTAssertNil(model.ask)
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
        XCTAssertEqual(try vs.list(), [])
        model.pressReset()
        XCTAssertEqual(model.ask, .reset(cards: Box.cards), "after a Cancel the next press arms again and does not perform")
        XCTAssertEqual(store.items().count, Box.lines)
    }

    /// Reset counts what it clears: the ledger's cards and the cards in live envelopes. An envelope a
    /// discard left behind does not count, whatever its entries still say.
    func testTheResetAskCountsLedgerCardsAndLiveEnvelopeCards() throws {
        let box = try makeVersionSandbox()
        var leftover = Box.tombstone("e2", at: Box.t0 - 1_000)
        leftover["entries"] = [["name": "Brainstorm", "qty": 5]]
        let doc = try Box.ledger(envelopes: [Box.env("e1", [("Counterspell", 1), ("Brainstorm", 2)]), leftover])
        let (model, _, _) = try open(box, doc)

        model.pressReset()

        XCTAssertEqual(model.ask, .reset(cards: Box.cards + 3), "14 on the lines and 3 in the live envelope")
    }

    // MARK: Restore asks, then performs

    /// The ask names what the restore replaces: the ledger as it is now, and not the version's size.
    func testTheRestoreAskCountsTheLedgerCardsNotTheVersions() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let v = try smallVersion(vs)
        let before = store.snapshot()
        model.refresh()

        model.pressRestore(v.id)

        XCTAssertEqual(model.ask, .restore(id: v.id, cards: Box.cards))
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before), "one press restores nothing")
        XCTAssertEqual(try vs.list().map(\.id), [v.id], "and takes no milestone")
    }

    func testASecondPressRestoresAndListsTheMilestoneAboveTheVersion() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let v = try smallVersion(vs, label: "before import")
        box.clock.t = Box.t0 + 5_000
        model.refresh()

        model.pressRestore(v.id)
        model.pressRestore(v.id)

        XCTAssertNil(model.ask)
        XCTAssertNil(model.error)
        XCTAssertEqual(store.items().count, 1, "anchor: the version was applied")
        XCTAssertEqual(model.rows.map(\.label), ["before restore", "before import"], "the milestone sits above the version")
        XCTAssertEqual(model.rows.first?.counts, "12/0", "and holds the ledger that was replaced")
    }

    /// Arming one control disarms the others (no-native-dialogs). A press on a different row arms
    /// that row and restores neither.
    func testOnlyOneControlIsArmedAtATime() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let a = try smallVersion(vs, label: "before import")
        box.clock.t = Box.t0 + 1_000
        let b = try smallVersion(vs, label: "before sync")
        let before = store.snapshot()
        model.refresh()

        model.pressRestore(a.id)
        XCTAssertEqual(model.ask, .restore(id: a.id, cards: Box.cards))
        model.pressReset()
        XCTAssertEqual(model.ask, .reset(cards: Box.cards), "Reset armed, so Restore is not")
        model.pressRestore(b.id)
        XCTAssertEqual(model.ask, .restore(id: b.id, cards: Box.cards), "Restore armed, so Reset is not")
        model.pressRestore(a.id)
        XCTAssertEqual(model.ask, .restore(id: a.id, cards: Box.cards), "another row arms that row, and performs nothing")

        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
        XCTAssertEqual(try vs.list().count, 2, "no milestone was taken")
    }

    // MARK: errors show in the pressed row

    /// The record is gone by the time the second press lands. The message is the web's, and it is
    /// on that row. The ledger is untouched and no milestone is spent.
    func testAnUnreadableVersionShowsItsErrorOnItsOwnRow() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let v = try smallVersion(vs)
        model.refresh()
        let before = store.snapshot()
        try vs.remove(v.id)

        model.pressRestore(v.id)
        model.pressRestore(v.id)

        XCTAssertEqual(model.error, RowError(site: .version(v.id), message: VersionNotice.unreadable))
        XCTAssertNil(model.ask)
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
        XCTAssertEqual(try vs.list(), [])
    }

    func testACorruptVersionShowsItsErrorOnItsOwnRowAndOnNoOther() throws {
        let box = try makeVersionSandbox()
        let (model, store, vs) = try open(box)
        let good = try smallVersion(vs, label: "before sync")
        box.clock.t = Box.t0 + 1_000
        let bad = try vs.put(Data(#"{"mailday":2,"items":[]}"#.utf8), label: "before import")
        model.refresh()
        let before = store.snapshot()

        model.pressRestore(bad.id)
        model.pressRestore(bad.id)

        guard let error = model.error else { return XCTFail("no error was shown") }
        XCTAssertEqual(error.site, .version(bad.id), "the pressed row, not \(good.id) and not the Reset row")
        XCTAssertEqual(error.message, VersionNotice.corrupt)
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
        XCTAssertEqual(try vs.list().count, 2, "a refused restore spends no milestone")
    }

    /// The save fails after the ask is confirmed. The error is on the Reset row, the ledger is as it was.
    func testAFailedResetShowsItsErrorOnTheResetRow() throws {
        let box = try makeVersionSandbox()
        let (model, store, _) = try open(box)
        let before = store.snapshot()
        box.lockWrites(box.dir)

        model.pressReset()
        model.pressReset()

        guard let error = model.error else { return XCTFail("no error was shown") }
        XCTAssertEqual(error.site, .reset)
        XCTAssertFalse(error.message.isEmpty)
        XCTAssertNil(model.ask, "a confirmed press ends the ask, win or lose")
        XCTAssertEqual(Box.canon(store.snapshot()), Box.canon(before))
    }

    /// A restore that works ends the old error.
    func testAGoodRestoreClearsAnEarlierError() throws {
        let box = try makeVersionSandbox()
        let (model, _, vs) = try open(box)
        let bad = try vs.put(Data("nope".utf8), label: "before import")
        box.clock.t = Box.t0 + 1_000
        let good = try smallVersion(vs, label: "before sync")
        model.refresh()
        model.pressRestore(bad.id)
        model.pressRestore(bad.id)
        XCTAssertNotNil(model.error, "anchor: the corrupt version failed")

        model.pressRestore(good.id)
        model.pressRestore(good.id)

        XCTAssertNil(model.error)
    }
}
