// Versions UI tests (lane N9, native-build-lanes, no-native-dialogs, ledger-tab-holds-options,
// history-restores-a-saved-version, armed-reset-takes-the-row, no-layout-shift-under-pointer,
// recovery-control-not-state-gated).
//
// Red-first. The builder adds the History row and the Reset row to the Ledger tab in
// native/Manifest and makes these pass. They compile against main today and fail on a missing
// element, not on a compile error. The model rules (the milestones, the counts, which row
// holds an error) are pinned in ManifestKitTests; these tests pin only what needs the screen.
//
// Contract the tests name (the builder implements all of it). Everything is on the Ledger tab,
// in its Data group (History) and last in its own box (Reset), as the web does. Identifiers:
//   history          the History row, a button labelled "History". Its value is "collapsed" or
//                    "expanded". A tap toggles the list below it.
//   version:<id>     one element per saved version, newest first, the WHOLE row (the header and
//                    what opens under it) as one container. Its label contains the version's
//                    label, e.g. "before reset". Its value is "collapsed" or "expanded". A tap on
//                    the header toggles it.
//   restore          in an expanded row: a button labelled "Restore this version". After one tap
//                    its label is "Tap again to replace N cards", N the ledger's cards now. A
//                    second tap restores. It does not move when it arms.
//   restore-cancel   appears beside it while it is armed, labelled "Cancel"
//   version-error    the text of a failed restore, inside that row. Its label is the message.
//   reset            a button labelled "Reset". After one tap its label is "Tap again to clear N
//                    cards", N the ledger's cards plus the cards in live envelopes. A second tap
//                    clears. It arms in place and does not move (armed-reset-takes-the-row).
//   reset-cancel     appears beside it while it is armed, labelled "Cancel"
//   reset-error      the text of a failed reset, inside the Reset box (not asserted here: no launch
//                    argument can make a reset fail)
// No alert, no action sheet and no confirmation dialog appears at any point (no-native-dialogs).
// Every control has a hit region of at least 44pt by 44pt.
//
// Launch arguments:
//   -ManifestUITestSeed  as N5 defines it, and now it also empties the version store, so a run never
//                        counts versions an earlier run left. The seed has 12 lines and 14 cards,
//                        no envelopes, and the Packages masthead reads "0/14" for its cards cell.
//   -ManifestUITestCorruptVersion (new)  after the seed, the version store holds one milestone
//                        labelled "before import" whose bytes are {"mailday":2,"items":[]}.
// After a reset or a restore every tab reads the new ledger (the masthead cards cell is re-read).
// An empty ledger draws no tally cells, so after a reset the cards cell is absent and reads "0/0".
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class VersionsUITests: XCTestCase {
    static let minHit: CGFloat = 44
    static let corruptLine = "That version could not be restored \u{2014} it looks corrupt."

    // MARK: helpers

    func launch(corruptVersion: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"] + (corruptVersion ? ["-ManifestUITestCorruptVersion"] : [])
        app.launch()
        return app
    }

    func el(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// The element, or a failed assertion that names it. Later lines never read a missing frame.
    func need(_ app: XCUIApplication, _ id: String) throws -> XCUIElement {
        let found = el(app, id)
        return try XCTUnwrap(found.waitForExistence(timeout: 5) ? found : nil, "\(id) is missing")
    }

    func openLedger(_ app: XCUIApplication) { app.tabBars.buttons["Ledger"].tap() }

    /// The element, scrolled into reach on the Ledger tab.
    func reveal(_ app: XCUIApplication, _ id: String) throws -> XCUIElement {
        let found = try need(app, id)
        app.reveal(found)
        return found
    }

    /// The masthead's cards cell on Packages, as "received/total". An empty ledger draws no tally
    /// cells (MastheadView), so with the masthead on screen and the cell absent the ledger holds
    /// no cards and the cell reads "0/0". A missing masthead still fails.
    func mastheadCards(_ app: XCUIApplication) throws -> String? {
        app.tabBars.buttons["Packages"].tap()
        _ = try need(app, "masthead")
        let cards = el(app, "tally-cards")
        return cards.waitForExistence(timeout: 5) ? cards.value as? String : "0/0"
    }

    func waitFor(_ found: XCUIElement, _ format: String, _ arg: String, _ what: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: format, arg), object: found)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, what)
    }

    func gone(_ found: XCUIElement, _ what: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: found)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, what)
    }

    /// One element per saved version, top to bottom, one per identifier.
    func versionRows(_ app: XCUIApplication) -> [XCUIElement] {
        let all = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "version:"))
        var seen = Set<String>()
        return all.allElementsBoundByIndex
            .filter { seen.insert($0.identifier).inserted }
            .sorted { $0.frame.minY < $1.frame.minY }
    }

    /// History open, whatever it was before.
    func openHistory(_ app: XCUIApplication) throws {
        let history = try reveal(app, "history")
        if history.value as? String != "expanded" { history.tap() }
        waitFor(history, "value == %@", "expanded", "History opens")
    }

    func noDialogs(_ app: XCUIApplication, _ when: String) {
        XCTAssertEqual(app.alerts.count, 0, "\(when): no native alert")
        XCTAssertEqual(app.sheets.count, 0, "\(when): no native sheet")
    }

    func assertHit(_ found: XCUIElement, _ name: String) {
        XCTAssertTrue(found.isHittable, "\(name) can be tapped")
        XCTAssertGreaterThanOrEqual(found.frame.height, Self.minHit, "\(name) is 44pt tall")
        XCTAssertGreaterThanOrEqual(found.frame.width, Self.minHit, "\(name) is 44pt wide")
    }

    // MARK: Reset asks first, and Cancel is real

    /// The ask names the cards it will clear, in the web's words, and Cancel puts everything back.
    /// A Cancel that took a milestone, or cleared anything, would show on the masthead or in History.
    func testResetAsksWithItsCountAndCancelLeavesTheLedgerAlone() throws {
        let app = launch()
        openLedger(app)
        let reset = try reveal(app, "reset")
        XCTAssertEqual(reset.label, "Reset")
        XCTAssertFalse(el(app, "reset-cancel").exists, "nothing is armed yet")

        reset.tap()

        waitFor(el(app, "reset"), "label == %@", "Tap again to clear 14 cards", "the ask names its count")
        let cancel = try need(app, "reset-cancel")
        XCTAssertEqual(cancel.label, "Cancel")
        noDialogs(app, "after the first tap")

        cancel.tap()

        waitFor(el(app, "reset"), "label == %@", "Reset", "Cancel disarms the control")
        gone(el(app, "reset-cancel"), "Cancel goes with the ask")
        XCTAssertEqual(try mastheadCards(app), "0/14", "Cancel cleared nothing")
        openLedger(app)
        try openHistory(app)
        XCTAssertEqual(versionRows(app).count, 0, "Cancel took no milestone")
    }

    // MARK: the round trip

    /// Reset, then restore the milestone it took: the ledger comes back, and the list shows both
    /// milestones, the restore's above the reset's. Each ask needs a second tap, and no native
    /// dialog appears.
    func testResetThenRestoreBringsTheLedgerBackAndListsBothMilestones() throws {
        let app = launch()
        openLedger(app)
        let reset = try reveal(app, "reset")
        reset.tap()
        waitFor(el(app, "reset"), "label == %@", "Tap again to clear 14 cards", "the reset ask")
        noDialogs(app, "reset armed")
        el(app, "reset").tap()
        waitFor(el(app, "reset"), "label == %@", "Reset", "a performed reset ends the ask")
        gone(el(app, "reset-cancel"), "and its Cancel")
        XCTAssertEqual(try mastheadCards(app), "0/0", "every tab reads the cleared ledger")

        openLedger(app)
        try openHistory(app)
        var rows = versionRows(app)
        XCTAssertEqual(rows.count, 1, "the reset left one milestone")
        guard let first = rows.first else { return }
        XCTAssertTrue(first.label.contains("before reset"), "its label: \(first.label)")
        XCTAssertEqual(first.value as? String, "collapsed")
        first.tap()
        let restore = try reveal(app, "restore")
        XCTAssertEqual(restore.label, "Restore this version")
        restore.tap()
        waitFor(el(app, "restore"), "label == %@", "Tap again to replace 0 cards", "the restore ask names the cleared ledger")
        XCTAssertEqual(try need(app, "restore-cancel").label, "Cancel")
        noDialogs(app, "restore armed")
        XCTAssertEqual(versionRows(app).count, 1, "one tap took no milestone and restored nothing")
        el(app, "restore").tap()

        XCTAssertEqual(try mastheadCards(app), "0/14", "the restore brought the cards back")
        openLedger(app)
        try openHistory(app)
        rows = versionRows(app)
        XCTAssertEqual(rows.count, 2, "the milestone the restore took, and the one the reset took")
        guard rows.count == 2 else { return }
        XCTAssertTrue(rows[0].label.contains("before restore"), "newest first: \(rows[0].label)")
        XCTAssertTrue(rows[1].label.contains("before reset"), "then: \(rows[1].label)")
    }

    // MARK: errors show in the pressed row

    /// The version's bytes are not a ledger. The message is in the row that was pressed, the ledger
    /// is as it was, and no banner or other row carries it.
    func testAFailedRestoreShowsItsErrorInThePressedRowOnly() throws {
        let app = launch(corruptVersion: true)
        openLedger(app)
        try openHistory(app)
        let rows = versionRows(app)
        XCTAssertEqual(rows.count, 1)
        guard let row = rows.first else { return }
        XCTAssertTrue(row.label.contains("before import"), "its label: \(row.label)")
        row.tap()
        let restore = try reveal(app, "restore")
        restore.tap()
        waitFor(el(app, "restore"), "label == %@", "Tap again to replace 14 cards", "the restore ask")
        el(app, "restore").tap()

        let error = try need(app, "version-error")
        XCTAssertEqual(error.label, Self.corruptLine)
        let pressed = try need(app, row.identifier)
        XCTAssertTrue(pressed.frame.contains(error.frame), "the error sits inside the row that was pressed")
        XCTAssertFalse(el(app, "reset-error").exists, "and not in the Reset box")
        noDialogs(app, "after the failure")
        XCTAssertEqual(try mastheadCards(app), "0/14", "the ledger is as it was")
    }

    // MARK: the controls

    /// Every control is at least 44pt, and an armed control stays where it was tapped, so the second
    /// tap lands on the same place (no-layout-shift-under-pointer).
    func testEveryControlHasAHitRegionAndAnArmedControlDoesNotMove() throws {
        let app = launch()
        openLedger(app)
        let reset = try reveal(app, "reset")
        assertHit(reset, "Reset")
        let resetBox = reset.frame

        reset.tap()

        waitFor(el(app, "reset"), "label == %@", "Tap again to clear 14 cards", "armed")
        let armed = el(app, "reset").frame
        XCTAssertEqual(armed.minY, resetBox.minY, accuracy: 0.5, "the armed Reset arms in place")
        XCTAssertEqual(armed.height, resetBox.height, accuracy: 0.5)
        assertHit(el(app, "reset"), "armed Reset")
        assertHit(try need(app, "reset-cancel"), "Reset's Cancel")
        el(app, "reset").tap()
        waitFor(el(app, "reset"), "label == %@", "Reset", "a performed reset ends the ask")

        let history = try reveal(app, "history")
        assertHit(history, "History")
        try openHistory(app)
        guard let row = versionRows(app).first else { return XCTFail("the reset left no row") }
        assertHit(row, "a version row's header")
        row.tap()
        let restore = try reveal(app, "restore")
        assertHit(restore, "Restore")
        let restoreBox = restore.frame
        // The x of that: the second tap lands where the first did (no-layout-shift-under-pointer). The web Restore is
        // flex:1, so its hit region spans the row. Restore fills the row, and Cancel sits in an 80pt slot after it that
        // is kept free all along, so arming moves nothing and the tap point stays on Restore. The check taps, twice, at
        // the middle of the version row, which is right of where the pill is drawn, and reads what the second tap did.
        // A Restore at its natural width has no hit region there: the first tap arms nothing. A tap on the pill's own
        // leading part is not covered here. Taps and not frames, so the hit test is the app's own.
        let firstTap = CGPoint(x: row.frame.midX, y: restoreBox.midY)
        tap(app, at: firstTap)
        waitFor(el(app, "restore"), "label == %@", "Tap again to replace 0 cards",
                "a tap at \(firstTap), the middle of the row, arms Restore: its hit region spans the row")
        XCTAssertEqual(el(app, "restore").frame.minY, restoreBox.minY, accuracy: 0.5, "the armed Restore arms in place")
        assertHit(el(app, "restore"), "armed Restore")
        assertHit(try need(app, "restore-cancel"), "Restore's Cancel")
        tap(app, at: firstTap)
        XCTAssertEqual(try mastheadCards(app), "0/14", "a second tap at \(firstTap) confirmed the restore: Cancel did not take it")
    }

    /// A tap at a point in the app's own coordinate space, whatever sits there.
    func tap(_ app: XCUIApplication, at point: CGPoint) {
        app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: point.x, dy: point.y)).tap()
    }
}
