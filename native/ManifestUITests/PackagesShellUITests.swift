// Shell UI tests (lane N5, native-build-lanes, phone-nav-is-bottom-bar,
// no-layout-shift-under-pointer).
//
// Red-first. The builder adds the app target (native/Manifest) and makes these pass.
// Until the app has a tab bar, each test fails on an XCTAssert or an XCTUnwrap.
//
// Contract the tests name (the builder implements all of it):
//   Tabs: a system UITabBar with four tabs, left to right: Ledger, Orphaned, Tally,
//     Packages. Each tab's accessibility label is its title.
//   Launch argument -ManifestUITestSeed: the app seeds its ledger store from the
//     bundled shared/fixtures/ledger.json (fake data, no key) before the first view.
//   Launch argument -ManifestUITestWidth <pt>: the root content is framed to that
//     width and centred, so the 375pt and 760pt cases run on any device. A device
//     narrower than 760pt cannot show the 760pt case; that case then skips.
//   Package rows: each row has the identifier "package-row:<gk>".
//   Check-in controls: each has the identifier "checkin:<item key>".
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

final class PackagesShellUITests: XCTestCase {
    static let tabTitles = ["Ledger", "Orphaned", "Tally", "Packages"]
    static let minHit: CGFloat = 44

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

    /// Frame of every package row, by identifier.
    func rowFrames(_ app: XCUIApplication) -> [String: CGRect] {
        var out: [String: CGRect] = [:]
        for row in elements(app, prefix: "package-row:") {
            out[row.identifier] = row.frame
        }
        return out
    }

    func tab(_ app: XCUIApplication, _ title: String) -> XCUIElement {
        app.tabBars.buttons[title]
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

    /// Each tab button, and each package row, has a hit region of at least 44pt.
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
    }

    /// Each of the four screens passes the accessibility audit.
    func testEachScreenPassesAccessibilityAudit() throws {
        let app = launch()
        for title in Self.tabTitles {
            tab(app, title).tap()
            try app.performAccessibilityAudit()
        }
    }

    // MARK: no layout shift under the pointer

    /// Checking one row in does not move any other row, at the given width.
    func assertOtherRowsStillOnCheckIn(width: Int) throws {
        let app = launch(width: width)
        tab(app, "Packages").tap()
        let before = rowFrames(app)
        XCTAssertGreaterThanOrEqual(before.count, 2, "need two or more rows to see a shift")

        let control = try XCTUnwrap(
            elements(app, prefix: "checkin:").first, "no check-in control on the Packages view")
        let controlMid = CGPoint(x: control.frame.midX, y: control.frame.midY)
        let checked = try XCTUnwrap(
            before.first { $0.value.contains(controlMid) }?.key,
            "the check-in control sits in no row")

        control.tap()
        let after = rowFrames(app)

        for (id, frame) in before where id != checked {
            XCTAssertEqual(after[id], frame, "row \(id) moved on a check-in at \(width)pt")
        }
    }

    func testOtherRowsDoNotMoveOnCheckInAt375pt() throws {
        try assertOtherRowsStillOnCheckIn(width: 375)
    }

    func testOtherRowsDoNotMoveOnCheckInAt760pt() throws {
        let probe = XCUIApplication()
        probe.launch()
        try XCTSkipIf(
            probe.windows.firstMatch.frame.width < 760,
            "this device is narrower than 760pt, so the 760pt case is unknown here")
        probe.terminate()
        try assertOtherRowsStillOnCheckIn(width: 760)
    }
}
