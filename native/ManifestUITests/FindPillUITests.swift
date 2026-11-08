// The floating search pill on Packages and Tally (lane restyle-step8: search-filters-inside-package,
// phone-nav-is-bottom-bar, no-layout-shift-under-pointer). The web's .mdl-pill: 48 tall, 8 above the
// bar, a magnifier and a field, drawn only while the ledger holds items. It filters the tab you are on.
//
// Contract the cases name (the builder implements it):
//   find-pill    the pill, drawn above the system tab bar on Packages and Tally.
//   find-field   the pill's text field, placeholder "Find card, set, seller, order". A tap anywhere on the
//                pill focuses it (the field may stay one line).
//   No button inside find-pill. There is no clear control on the pill (the coordinator ruling, port default,
//                until owner item 46). The empty state keeps its own "Clear search".
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
        // A row count would read only the rows near the screen, so each seeded package is mounted in turn.
        for key in ["A1::Alpha Cards", "B1::Beta Games", "C1::Gamma Cards", "D1::Delta Cards"] {
            XCTAssertTrue(ScreenKit.mount(app, "package-row:" + key), "scope: \(key) is not on the Packages list before the search")
        }

        let field = ShellUITest.element(app, "find-field")
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the find field find-field is missing")
        field.tap()
        field.typeText("Urza")

        XCTAssertEqual(ShellUITest.elements(app, prefix: "package-row:").count, 1, "a search for Urza leaves more or fewer than one package")
        XCTAssertTrue(ShellUITest.element(app, "package-row:D1::Delta Cards").exists, "the search for Urza dropped Delta Cards")
    }

    /// The pill has no clear control. The query stays in the field until it is deleted by hand.
    func testPillHasNoClearButton() throws {
        let app = ShellUITest.launch(width: 375)
        try openPackages(app)
        let pill = ShellUITest.element(app, "find-pill")
        XCTAssertTrue(pill.waitForExistence(timeout: 5), "the find pill find-pill is missing")

        let field = ShellUITest.element(app, "find-field")
        field.tap()
        field.typeText("Urza")
        // Scope: the query reached the field, and the list holds its one hit, so the empty state's Clear search is not drawn.
        XCTAssertEqual(field.value as? String, "Urza", "the query did not reach find-field")
        XCTAssertEqual(ShellUITest.elements(app, prefix: "package-row:").count, 1, "the search did not leave its one hit")

        XCTAssertEqual(pill.buttons.count, 0, "the find pill holds \(pill.buttons.count) button(s): it must have no clear control")
        XCTAssertFalse(app.buttons["Clear search"].exists, "a Clear search control is on screen while the list has a hit")
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
}
