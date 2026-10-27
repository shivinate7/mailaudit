// Masthead and Backup UI tests (lane N8, native-build-lanes, masthead-is-one-letterhead,
// masthead-tallies-unequal-thirds, masthead-save-slot-reserved, no-layout-shift-under-pointer,
// recovery-control-not-state-gated).
//
// Red-first. The builder adds the views in native/Manifest and makes these pass. They compile
// against main today and fail on a missing element, not on a compile error.
//
// Contract the tests name (the builder implements all of it). Accessibility identifiers:
//   Packages tab, above the package list (orchestrator default 2026-10-20: the web masthead
//   sits above every view; N8 puts it on Packages, and the other tabs may adopt it later):
//     masthead                  the whole letterhead, one element that contains the rest
//     masthead-rule-left, masthead-seal, masthead-rule-right    one row, left to right
//     masthead-title            label MANIFEST (any case)
//     masthead-house            label "C.H Postal Company" (any case, the web sets it in capitals)
//     tally-cards, tally-packages, tally-value
//                               label = "cards" / "packages" / "value"; value = the cell's
//                               figure ("0/14", "0/4", "$0/$68"), see MastheadModel
//     masthead-count, masthead-missing   label = countLine and missingLine of MastheadModel
//     save-slot                 label = the SaveIndicator label; idle reads blank
//   Ledger tab (orchestrator default 2026-10-20: web puts Backup in the Ledger tab's Data
//   group, ledger-tab-holds-options; N8 adds only that row):
//     backup                    a button labelled "Backup", at least 44pt by 44pt
// Launch arguments: -ManifestUITestSeed and -ManifestUITestWidth as N5 defines them, and
//   -ManifestUITestSaveState idle|saving|saved|failed (new): pins the save slot to that state
//   for the whole run, so every state can be measured without a failing disk.
// After a successful check-in the slot reads "saved ✓" for at least one second.
//
// Layout the tests pin: the three tally cells share one row at 375pt, the cards and packages
// cells are equal, and the value cell is 1.5x to 2x as wide (the web flex is 1.7). Nothing in
// the masthead changes frame when a check-in lands or when the slot changes state.
//
// Not driven: the share sheet behind Backup, and Backup on a ledger that failed to open (no
// launch argument corrupts the seed). The file bytes are pinned in BackupExportTests.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class MastheadBackupUITests: XCTestCase {
    static let minHit: CGFloat = 44
    static let checkedId = "checkin:A1|0|pLightningBolt"
    static let checkedPackageId = "package-row:A1::Alpha Cards"
    static let cellIds = ["tally-cards", "tally-packages", "tally-value"]

    // MARK: helpers

    func launch(width: Int? = 375, saveState: String? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed"]
        if let width { args += ["-ManifestUITestWidth", String(width)] }
        if let saveState { args += ["-ManifestUITestSaveState", saveState] }
        app.launchArguments = args
        app.launch()
        return app
    }

    func find(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// The element, or a failed assertion that names it. Later lines never read a missing frame.
    func need(_ app: XCUIApplication, _ id: String) throws -> XCUIElement {
        let el = find(app, id)
        return try XCTUnwrap(el.waitForExistence(timeout: 5) ? el : nil, "\(id) is missing")
    }

    func openTab(_ app: XCUIApplication, _ title: String) {
        app.tabBars.buttons[title].tap()
    }

    func wait(_ el: XCUIElement, _ format: String, _ arg: String, _ what: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: format, arg), object: el)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, what)
    }

    func figure(_ el: XCUIElement) -> String? { el.value as? String }

    func isBlank(_ s: String) -> Bool { s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    // MARK: the letterhead

    /// Seal between two rules, then MANIFEST, then the house line, then the tallies. One block.
    func testLetterheadIsOneBlockInOrder() throws {
        let app = launch()
        openTab(app, "Packages")
        let head = try need(app, "masthead")
        let left = try need(app, "masthead-rule-left")
        let seal = try need(app, "masthead-seal")
        let right = try need(app, "masthead-rule-right")
        let title = try need(app, "masthead-title")
        let house = try need(app, "masthead-house")
        let cards = try need(app, "tally-cards")

        for (id, el) in [("rule-left", left), ("seal", seal), ("rule-right", right), ("title", title), ("house", house), ("cards", cards)] {
            XCTAssertTrue(head.frame.insetBy(dx: -1, dy: -1).contains(el.frame), "\(id) sits outside the masthead block")
        }
        XCTAssertLessThanOrEqual(left.frame.maxX, seal.frame.minX + 1, "the left rule is not left of the seal")
        XCTAssertLessThanOrEqual(seal.frame.maxX, right.frame.minX + 1, "the right rule is not right of the seal")
        XCTAssertLessThan(abs(left.frame.midY - seal.frame.midY), seal.frame.height / 2, "the left rule is off the seal's row")
        XCTAssertLessThan(abs(right.frame.midY - seal.frame.midY), seal.frame.height / 2, "the right rule is off the seal's row")
        let rowBottom = max(left.frame.maxY, seal.frame.maxY, right.frame.maxY)
        XCTAssertGreaterThanOrEqual(title.frame.minY, rowBottom - 1, "the title is not below the seal row")
        XCTAssertGreaterThanOrEqual(house.frame.minY, title.frame.maxY - 1, "the house line is not below the title")
        XCTAssertGreaterThanOrEqual(cards.frame.minY, house.frame.maxY - 1, "the tallies are not below the house line")
        XCTAssertEqual(title.label.lowercased(), "manifest")
        XCTAssertEqual(house.label.lowercased(), "c.h postal company")
    }

    /// Three cells on one row: cards and packages equal, value wider (the web flex is 1.7).
    func testTalliesAreUnequalThirdsAt375pt() throws {
        let app = launch(width: 375)
        openTab(app, "Packages")
        let head = try need(app, "masthead")
        let c = try need(app, "tally-cards")
        let p = try need(app, "tally-packages")
        let v = try need(app, "tally-value")

        XCTAssertEqual([c.label, p.label, v.label], ["cards", "packages", "value"])
        XCTAssertEqual([figure(c), figure(p), figure(v)], ["0/14", "0/4", "$0/$68"], "the seeded ledger has 14 cards, 4 packages, $67.50")
        XCTAssertLessThanOrEqual(abs(c.frame.minY - p.frame.minY), 1, "cards and packages are not on one row")
        XCTAssertLessThanOrEqual(abs(c.frame.minY - v.frame.minY), 1, "cards and value are not on one row")
        XCTAssertLessThanOrEqual(c.frame.maxX, p.frame.minX + 1, "cards is not left of packages")
        XCTAssertLessThanOrEqual(p.frame.maxX, v.frame.minX + 1, "packages is not left of value")
        XCTAssertLessThanOrEqual(v.frame.maxX, head.frame.maxX + 1, "the value cell runs past the masthead")
        XCTAssertLessThanOrEqual(abs(c.frame.width - p.frame.width), 1, "cards and packages are not equal")
        let ratio = v.frame.width / c.frame.width
        XCTAssertGreaterThanOrEqual(ratio, 1.5, "the value cell is not wider than the counts")
        XCTAssertLessThanOrEqual(ratio, 2.0, "the value cell is far wider than the counts")
    }

    // MARK: a check-in moves the figures and nothing else

    /// One check-in: the tallies and the missing line follow, the slot reads saved, no frame moves. The A1 card is
    /// scrolled fully into view first: below the fold, the tap would scroll the list and every frame would move,
    /// the masthead's too. The at-rest checks come after that scroll, so they also prove it checked nothing in.
    func testTalliesAndSlotFollowACheckInWithoutMoving() throws {
        let app = launch(width: 375)
        openTab(app, "Packages")
        let control = try need(app, Self.checkedId)
        let slot = try need(app, "save-slot")
        let head = try need(app, "masthead")
        let cells = try Self.cellIds.map { try need(app, $0) }
        let count = try need(app, "masthead-count")
        let missing = try need(app, "masthead-missing")
        app.reveal(try need(app, Self.checkedPackageId), whole: true)
        XCTAssertTrue(control.label.hasPrefix("Check in"), "the scroll checked the line in before the baseline")
        let fixed = [head, slot] + cells
        let before = fixed.map(\.frame)
        let (countBefore, missingBefore) = (count.frame, missing.frame)
        XCTAssertTrue(isBlank(slot.label), "the slot is not blank at rest: \(slot.label)")

        control.tap()
        wait(slot, "label BEGINSWITH %@", "saved", "the slot never read saved after a check-in")
        wait(cells[0], "value == %@", "1/14", "the cards tally did not follow the check-in")

        XCTAssertEqual(slot.label, "saved \u{2713}")
        XCTAssertEqual(cells.map(figure), ["1/14", "0/4", "$1/$68"])
        XCTAssertEqual(missing.label, "13 still missing \u{00B7} $66.50")
        XCTAssertEqual(count.label, "4 packages \u{00B7} autosaves")
        for (el, was) in zip(fixed, before) {
            XCTAssertEqual(el.frame, was, "\(el.identifier) moved on a check-in")
        }
        for (name, now, was) in [("masthead-count", count.frame, countBefore), ("masthead-missing", missing.frame, missingBefore)] {
            XCTAssertEqual(now.minY, was.minY, accuracy: 0.5, "\(name) moved on a check-in")
            XCTAssertEqual(now.height, was.height, accuracy: 0.5, "\(name) changed height on a check-in")
        }
    }

    /// The slot has one size in all four states, and nothing beside it moves. A later state
    /// that adds a line or a pixel shifts the list under the pointer twice per tap.
    func testSaveSlotKeepsOneSizeInEveryState() throws {
        let expected = ["idle": "", "saving": "saving\u{2026}", "saved": "saved \u{2713}", "failed": "couldn\u{2019}t save"]
        var frames: [String: [CGRect]] = [:]
        for state in ["idle", "saving", "saved", "failed"] {
            let app = launch(saveState: state)
            openTab(app, "Packages")
            let slot = try need(app, "save-slot")
            XCTAssertEqual(isBlank(slot.label) ? "" : slot.label, expected[state], "the slot does not read \(state)")
            let cells = try Self.cellIds.map { try need(app, $0) }
            let missing = try need(app, "masthead-missing")
            frames[state] = [slot.frame, missing.frame] + cells.map(\.frame)
            app.terminate()
        }
        let first = try XCTUnwrap(frames["idle"], "no idle frames")
        for state in ["saving", "saved", "failed"] {
            let now = try XCTUnwrap(frames[state], "no \(state) frames")
            XCTAssertEqual(now[0].size, first[0].size, "the slot changes size in \(state)")
            XCTAssertEqual(now[0].origin, first[0].origin, "the slot moves in \(state)")
            XCTAssertEqual(now[1].minY, first[1].minY, accuracy: 0.5, "the missing line moves in \(state)")
            XCTAssertEqual(Array(now.dropFirst(2)), Array(first.dropFirst(2)), "a tally cell moves in \(state)")
        }
    }

    // MARK: Backup

    /// Backup is a button on the Ledger tab with a hit region of at least 44pt.
    func testBackupIsA44ptControlOnTheLedgerTab() throws {
        let app = launch(width: nil)
        openTab(app, "Ledger")
        let backup = try need(app, "backup")

        XCTAssertEqual(backup.elementType, .button, "Backup is not a button")
        XCTAssertEqual(backup.label, "Backup")
        XCTAssertGreaterThanOrEqual(backup.frame.width, Self.minHit, "Backup is narrower than 44pt")
        XCTAssertGreaterThanOrEqual(backup.frame.height, Self.minHit, "Backup is shorter than 44pt")
        XCTAssertTrue(backup.isHittable, "Backup cannot be tapped")
    }

    // MARK: accessibility audit, one screen per method

    /// The Packages screen with the masthead on it. The masthead must exist first, so a screen
    /// that passes the audit without one is red. Rows under the tab bar are skipped, see
    /// AuditSkippingTabBarUITests.
    func testAccessibilityAuditMastheadOnPackages() throws {
        let app = launch(width: nil)
        openTab(app, "Packages")
        _ = try need(app, "masthead")
        _ = try need(app, "save-slot")
        try app.auditSkippingTabBar()
    }

    /// The Ledger screen with Backup on it. Backup must exist first, for the same reason.
    func testAccessibilityAuditBackupOnLedger() throws {
        let app = launch(width: nil)
        openTab(app, "Ledger")
        _ = try need(app, "backup")
        try app.performAccessibilityAudit()
    }
}
