// The floating search pill on Packages and Tally (lane restyle-step8: search-filters-inside-package,
// phone-nav-is-bottom-bar, no-layout-shift-under-pointer). The web's .mdl-pill: 48 tall, 8 above the
// bar, a magnifier and a field, drawn only while the ledger holds items. It filters the tab you are on.
//
// Contract the cases name (the builder implements it):
//   find-pill    the pill, drawn above the system tab bar on Packages and Tally.
//   find-field   the pill's text field, placeholder "Find card, set, seller, order". A tap anywhere on the
//                pill focuses it (the field may stay one line).
//   find-clear   the pill's clear button: a 44 x 44 pt button labelled "Clear search", drawn only while the field
//                holds text (owner item 46, answer a, 2026-11-08 10:55 CST). The empty state keeps its own "Clear search".
//   package-row:<gk>, checkin:<key>: as PackagesShellUITests.
//
// The seed is the shared fixture: Delta Cards D1 (Urza's Saga, one line), Gamma Cards C1, Alpha Cards A1,
// Beta Games B1. Every key here is fake.
// Compile-checked only: this agent has no simulator. The red for each case is owed to a simulator run.

import XCTest

@MainActor
final class FindPillUITests: XCTestCase {
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    /// The Packages tab, open, with its rows loaded. Scope first: the rows exist before any case reads them. The list is lazy,
    /// and D1 is the fourth card, below the fold, so it is not in the tree until the list scrolls near it. ScreenKit.mount
    /// does that scroll, as PackageCardUITests does for the same row. Every launch starts on Unreceived, and the seed has no
    /// check-in, so all four packages are listed there.
    func openPackages(_ app: XCUIApplication) throws {
        app.tabBars.buttons["Packages"].tap()
        XCTAssertTrue(ScreenKit.mount(app, "package-row:D1::Delta Cards"), "scope: the Packages rows are missing")
    }

    /// Each seeded package, mounted in turn. A row count would read only the rows near the screen, so the lazy list is
    /// scrolled to each one before a case counts or reads the rows.
    func mountSeededPackages(_ app: XCUIApplication) {
        for key in ["A1::Alpha Cards", "B1::Beta Games", "C1::Gamma Cards", "D1::Delta Cards"] {
            XCTAssertTrue(ScreenKit.mount(app, "package-row:" + key), "scope: \(key) is not on the Packages list")
        }
    }

    /// The pill sits above the system tab bar on Packages and on Tally: its bottom edge is above the bar's top.
    func testPillSitsAboveTheTabBarOnPackagesAndTally() throws {
        let app = ShellUITest.launch(width: 375)
        for tab in ["Packages", "Tally"] {
            app.tabBars.buttons[tab].tap()
            let bar = app.tabBars.firstMatch
            XCTAssertTrue(bar.waitForExistence(timeout: 5), "scope: the system tab bar is missing on \(tab)")
            let pill = ShellUITest.element(app, "find-pill")
            XCTAssertTrue(pill.waitForExistence(timeout: 5), "the find pill find-pill is missing on \(tab)")
            XCTAssertLessThanOrEqual(pill.frame.maxY, bar.frame.minY, "the find pill is not above the tab bar on \(tab)")
        }
    }

    /// A query typed in the pill keeps the packages that hold a match. Urza's Saga is on one package (D1).
    func testPillFiltersThePackagesList() throws {
        let app = ShellUITest.launch(width: 375)
        try openPackages(app)
        // The masthead counts the ledger's packages, not the rows on screen, so it is the exact scope of four.
        let count = ShellUITest.element(app, "masthead-count")
        XCTAssertTrue(count.waitForExistence(timeout: 5), "scope: the masthead count is missing")
        XCTAssertTrue(count.label.hasPrefix("4 packages"), "scope: the seed does not hold four packages, the masthead reads \(count.label)")
        mountSeededPackages(app)

        let field = ShellUITest.element(app, "find-field")
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the find field find-field is missing")
        field.tap()
        field.typeText("Urza")

        XCTAssertEqual(ShellUITest.elements(app, prefix: "package-row:").count, 1, "a search for Urza leaves more or fewer than one package")
        XCTAssertTrue(ShellUITest.element(app, "package-row:D1::Delta Cards").exists, "the search for Urza dropped Delta Cards")
    }

    /// The pill's clear button shows only while the field holds a query, and one tap clears the query and the list returns.
    /// Owner item 46, answer a (2026-11-08 10:55 CST) grants the button, which replaces the no-clear case. The web's match is the
    /// empty state's "Clear search" in src/app.jsx (MailDayLedger): drawn under `query &&`, and its onClick is `setQuery("")`.
    /// The button is 44 x 44 pt, the hit region the button rule requires.
    func testPillClearButtonShowsOnlyWithAQueryAndClearsIt() throws {
        let app = ShellUITest.launch(width: 375)
        try openPackages(app)
        let pill = ShellUITest.element(app, "find-pill")
        XCTAssertTrue(pill.waitForExistence(timeout: 5), "the find pill find-pill is missing")
        let field = ShellUITest.element(app, "find-field")
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the find field find-field is missing")
        mountSeededPackages(app)
        // Scope: the four packages are listed before any query, and the empty field draws no clear control.
        XCTAssertFalse(ShellUITest.element(app, "find-clear").exists, "the find pill draws a clear control over an empty field")

        field.tap()
        field.typeText("Urza")
        let clear = ShellUITest.element(app, "find-clear")
        XCTAssertTrue(clear.waitForExistence(timeout: 5), "the find pill has no clear control while the field holds Urza")
        assertHitRegion(clear, "the find pill's clear control")
        XCTAssertEqual(ShellUITest.elements(app, prefix: "package-row:").count, 1, "scope: the search for Urza leaves one package")

        clear.tap()
        XCTAssertFalse(ShellUITest.element(app, "find-clear").exists, "the clear control stayed after the query was cleared")
        mountSeededPackages(app)
    }

    /// Opening search moves no package row or check-in control. The pill itself may lift above the keyboard.
    func testOpeningSearchMovesNoPackageRow() throws {
        let app = ShellUITest.launch(width: 375)
        try openPackages(app)
        let before = ShellUITest.layoutFrames(app)
        XCTAssertFalse(before.isEmpty, "scope: no package row or check-in control to measure")

        let field = ShellUITest.element(app, "find-field")
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the find field find-field is missing")
        field.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "the keyboard did not open on the find field")

        let after = ShellUITest.layoutFrames(app)
        for (id, frame) in before {
            XCTAssertEqual(after[id], frame, "opening search moved \(id) under the pointer (no-layout-shift-under-pointer)")
        }
    }

    /// The find field's hit region is at least 44pt tall on Packages and on Tally. The audit reads a field's hit region, which a
    /// one-line vertical field makes smaller than its frame: a sim run at 7168062 flagged the find field at 52pt. Only the find
    /// field's issues fail here. Every other issue on the screen belongs to another case, so the closure ignores it.
    /// The pill sits above the bar, so the tab-bar skip keeps it (the next case pins that).
    func testFindFieldHitAreaIsAtLeast44ptTall() throws {
        let app = ShellUITest.launch(width: 375)
        for tab in ["Packages", "Tally"] {
            app.tabBars.buttons[tab].tap()
            let field = ShellUITest.element(app, "find-field")
            XCTAssertTrue(field.waitForExistence(timeout: 5), "scope: the find field find-field is missing on \(tab)")
            try app.performAccessibilityAudit(for: .hitRegion) { issue in
                issue.element?.identifier != "find-field"
            }
        }
    }

    /// The pill is not under the tab bar. Its frame, as a sim run logged it (2026-11-08), ends above the bar's top, so the skip
    /// that drops an audit issue under the bar must keep it. Pins that isUnderTabBar stays narrow.
    func testPillAboveTheBarIsNotSkippedAsUnderTheBar() {
        let bar = CGRect(x: 13.67, y: 791, width: 375, height: 83)
        let window = CGRect(x: 0, y: 0, width: 402, height: 874)
        let pill = CGRect(x: 77.67, y: 727, width: 279, height: 52)
        XCTAssertFalse(isUnderTabBar(pill, bar: bar, window: window),
                       "the find pill is skipped as under the tab bar: isUnderTabBar must not widen to the pill")
    }
}
