// Shell UI tests (lane N5, native-build-lanes, phone-nav-is-bottom-bar,
// no-layout-shift-under-pointer).
//
// Red-first. The builder adds the app target (native/Manifest) and makes these pass.
//
// Contract the tests name (the builder implements all of it):
//   Tabs: a system UITabBar with four tabs, left to right: Ledger, Orphaned, Tally,
//     Packages. Each tab's accessibility label is its title.
//   Launch argument -ManifestUITestSeed: the app seeds its ledger store from the
//     bundled shared/fixtures/ledger.json (fake data, no key) before the first view.
//   Launch argument -ManifestUITestWidth 375: the root content is framed to 375pt and
//     centred, so the no-shift case runs the same on any iPhone.
//   Package rows: each row has the identifier "package-row:<gk>", gk = "orderId::seller".
//   Check-in controls: each has the identifier "checkin:<item key>", a hit region of
//     at least 44pt, and the label "Check in <name>" or "Undo check in <name>".
//
// Orchestrator defaults, 2026-10-12, for N5:
//   - The app is iPhone-only (TARGETED_DEVICE_FAMILY 1). The 760pt layout case is
//     removed here, not skipped. The 760pt layout check stays with the web screens check.
//   - Each tab's accessibility audit runs in its own test method, with a fresh launch,
//     so one screen's failure does not hide another's.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class PackagesShellUITests: XCTestCase {
    static let tabTitles = ["Ledger", "Orphaned", "Tally", "Packages"]
    static let minHit: CGFloat = 44

    /// Lightning Bolt on order A1 (shared fixture): A1 holds three lines, so two siblings sit below it.
    static let checkedId = "checkin:A1|0|pLightningBolt"
    static let checkedPackageId = "package-row:A1::Alpha Cards"

    // MARK: helpers

    func launch(width: Int? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed"]
        if let width { args += ["-ManifestUITestWidth", String(width)] }
        app.launchArguments = args
        app.launch()
        return app
    }

    func elements(_ app: XCUIApplication, prefix: String) -> [XCUIElement] {
        app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix))
            .allElementsBoundByIndex
    }

    /// Frame of every package row and every check-in control, by identifier.
    func layoutFrames(_ app: XCUIApplication) -> [String: CGRect] {
        var out: [String: CGRect] = [:]
        for el in elements(app, prefix: "package-row:") + elements(app, prefix: "checkin:") {
            out[el.identifier] = el.frame
        }
        return out
    }

    func tab(_ app: XCUIApplication, _ title: String) -> XCUIElement {
        app.tabBars.buttons[title]
    }

    /// The checked control, on the Packages tab, after the view has loaded.
    func checkedControl(_ app: XCUIApplication) throws -> XCUIElement {
        tab(app, "Packages").tap()
        let control = app.descendants(matching: .any).matching(identifier: Self.checkedId).firstMatch
        XCTAssertTrue(control.waitForExistence(timeout: 5), "the check-in control \(Self.checkedId) is missing")
        return control
    }

    /// The check-in runs in a Task. Wait until the label flips before any frame or screenshot is read.
    func waitForUndo(_ control: XCUIElement) {
        let undone = NSPredicate(format: "label BEGINSWITH %@", "Undo check in")
        let expectation = XCTNSPredicateExpectation(predicate: undone, object: control)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 5), .completed, "the check-in did not land")
    }

    func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    // MARK: tabs

    /// Four tabs exist, and they run left to right: Ledger, Orphaned, Tally, Packages.
    func testFourTabsInOrderLeftToRight() throws {
        let app = launch()
        let xs = Self.tabTitles.map { tab(app, $0).frame.minX }
        for (title, x) in zip(Self.tabTitles, xs) {
            XCTAssertTrue(tab(app, title).exists, "tab \(title) is missing")
            XCTAssertGreaterThan(x, 0, "tab \(title) has no frame")
        }
        XCTAssertEqual(xs, xs.sorted(), "tabs are not in the order \(Self.tabTitles)")
        XCTAssertEqual(app.tabBars.buttons.count, 4, "the tab bar should hold exactly four tabs")
    }

    /// Each tab button, each package row, and each check-in control has a hit region of at least 44pt.
    func testHitRegionsAtLeast44pt() throws {
        let app = launch()
        for title in Self.tabTitles {
            let f = tab(app, title).frame
            XCTAssertGreaterThanOrEqual(f.width, Self.minHit, "tab \(title) is narrower than 44pt")
            XCTAssertGreaterThanOrEqual(f.height, Self.minHit, "tab \(title) is shorter than 44pt")
        }
        tab(app, "Packages").tap()
        let rows = elements(app, prefix: "package-row:")
        XCTAssertFalse(rows.isEmpty, "the Packages view shows no rows")
        for row in rows {
            XCTAssertGreaterThanOrEqual(row.frame.height, Self.minHit, "row \(row.identifier) is shorter than 44pt")
        }
        let controls = elements(app, prefix: "checkin:")
        XCTAssertFalse(controls.isEmpty, "the Packages view shows no check-in controls")
        for control in controls {
            let f = control.frame
            XCTAssertGreaterThanOrEqual(f.width, Self.minHit, "\(control.identifier) hit region is narrower than 44pt")
            XCTAssertGreaterThanOrEqual(f.height, Self.minHit, "\(control.identifier) hit region is shorter than 44pt")
        }
    }

    // MARK: accessibility audit, one screen per method

    /// Only the Packages screen skips rows under the tab bar, and only the Tally screen skips the ruled contrast flags.
    /// Both skips live in AuditSkippingTabBarUITests.
    func auditTab(_ title: String) throws {
        let app = launch()
        tab(app, title).tap()
        XCTAssertTrue(tab(app, title).isSelected, "the \(title) tab did not open before the audit")
        switch title {
        case "Packages": try app.auditSkippingTabBar()
        case "Tally": try app.auditNamingElements(skipping: skipMeasuredContrastFlags)
        default: try app.performAccessibilityAudit()
        }
    }

    func testAccessibilityAuditLedgerScreen() throws { try auditTab("Ledger") }
    func testAccessibilityAuditOrphanedScreen() throws { try auditTab("Orphaned") }
    func testAccessibilityAuditTallyScreen() throws { try auditTab("Tally") }
    func testAccessibilityAuditPackagesScreen() throws { try auditTab("Packages") }

    // MARK: no layout shift under the pointer

    /// Checking one line in moves nothing else at 375pt. Every package row and every
    /// check-in control is compared, including the siblings inside the checked package.
    /// Only the tapped control is excluded, because its glyph is the thing that changes. The checked card is
    /// scrolled fully into view before the baseline: below the fold, the tap would scroll the list and every
    /// frame would move.
    func testNothingElseMovesOnCheckInAt375pt() throws {
        let app = launch(width: 375)
        let control = try checkedControl(app)
        app.reveal(app.descendants(matching: .any).matching(identifier: Self.checkedPackageId).firstMatch, whole: true)
        XCTAssertTrue(control.label.hasPrefix("Check in"), "the scroll checked the line in before the baseline")
        let before = layoutFrames(app)

        XCTAssertNotNil(before[Self.checkedPackageId], "the checked package row is missing")
        let siblings = before.keys.filter { $0.hasPrefix("checkin:A1|") && $0 != Self.checkedId }
        XCTAssertGreaterThanOrEqual(siblings.count, 2, "the checked package has no sibling lines to watch")

        control.tap()
        waitForUndo(control)
        let after = layoutFrames(app)

        for (id, frame) in before where id != Self.checkedId {
            XCTAssertEqual(after[id], frame, "\(id) moved on a check-in at 375pt")
        }
    }

    // MARK: screenshots, for the record

    /// The Packages tab at rest, then after one check-in. Both are kept in the xcresult.
    func testPackagesScreenshotsAtRestAndAfterOneCheckIn() throws {
        let app = launch(width: 375)
        let control = try checkedControl(app)
        attach(app, "n5-packages-rest")

        control.tap()
        waitForUndo(control)
        attach(app, "n5-packages-checked")
    }
}
