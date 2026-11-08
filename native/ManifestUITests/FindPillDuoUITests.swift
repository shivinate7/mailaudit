// The floating search pill on the open iPhone Duo (decision duo-card-in-hand, Q5 ruled by the Duo lane 2026-11-08 11:14 CST;
// step 8 choice 5). On the open Duo the pill sits with the bar under the right page, 8 pt above the bar, filters the left
// page's list, and hides while Card in Hand is open (Card in Hand has its own typed field).
//
// Pose: flat, the open Duo (951 x 669 pt window). Set the hinge outside the test (DuoWindowSupport.swift). Each test checks
// the pose and fails on another window size. It never skips.
//
// Contract the cases name (the builder implements it):
//   find-pill           the pill, on the right page of the flat Duo, 8 pt above the custom bar.
//   find-field          the pill's text field.
//   duo-tab-bar         the custom bar: the pill, DuoMetrics.barPill tall, with DuoMetrics.barLift under it.
//   tally-row:<name>    Tally, flat: the list row, on the left page (DuoSpreadUITests).
//   hand-open, hand-query   Card in Hand, opened from the Packages page (DuoHandUITests).
//
// Limit: Packages is hidden from accessibility while Card in Hand is open (DuoHandUITests). The absence check under Card in
// Hand therefore reads the accessibility tree only: a pill drawn there but hidden from accessibility would pass. Unknown until
// a Card in Hand screenshot of the built app shows it.
//
// Every key here is fake. Launch with -ManifestUITestSeed only (XCUIApplication.launchedOnSeed).

import XCTest

@MainActor
final class FindPillDuoUITests: XCTestCase {
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    /// On the flat Duo's Tally, the pill is on the right page, 8 pt above the bar, and its query filters the left page's list.
    /// Tally keeps its list on the left page, so the filter is read there. The bar element is the pill, DuoMetrics.barPill tall
    /// (DuoBarMetrics: pill 64 plus lift 12), and its bottom sits DuoMetrics.barLift above the window's bottom edge.
    func testFlatDuoPillSitsOnTheRightPageAboveTheBar() throws {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        let bar = app.duoBar
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "scope: the custom tab bar duo-tab-bar is missing")
        XCTAssertEqual(bar.frame.height, DuoMetrics.barPill, accuracy: DuoMetrics.tolerance,
                       "scope: the custom tab bar is not the height of its pill")
        XCTAssertEqual(app.window.frame.maxY - bar.frame.maxY, DuoMetrics.barLift, accuracy: DuoMetrics.tolerance,
                       "scope: the custom tab bar does not sit the lift above the window's bottom edge")
        bar.buttons["Tally"].tap()
        XCTAssertTrue(app.element("tally-row:Lightning Bolt").waitForExistence(timeout: 5),
                      "scope: the Tally list has no Lightning Bolt row before any search")

        let pill = app.element("find-pill")
        XCTAssertTrue(pill.waitForExistence(timeout: 5), "the find pill find-pill is missing on the open Duo's Tally")
        XCTAssertEqual(app.window.frame.maxY - pill.frame.maxY, DuoMetrics.barHeight + 8, accuracy: DuoMetrics.tolerance,
                       "the find pill's bottom is not the bar's pill and lift (\(Int(DuoMetrics.barHeight)) pt) plus 8 pt above the window's bottom")
        XCTAssertEqual(bar.frame.minY - pill.frame.maxY, 8, accuracy: DuoMetrics.tolerance,
                       "the find pill is not 8 pt above the custom tab bar")
        expect(pill, on: .right, in: app, "the find pill")

        let field = app.element("find-field")
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the find field find-field is missing on the open Duo")
        field.tap()
        field.typeText("Urza")
        let rows = app.elements(prefix: "tally-row:")
        XCTAssertEqual(rows.count, 1, "a search for Urza leaves \(rows.count) Tally rows on the open Duo, not one")
        expect(app.firstElement(prefix: "tally-row:"), on: .left, in: app, "the Urza row of Tally")
        XCTAssertFalse(app.element("tally-row:Lightning Bolt").exists, "the search for Urza kept the Lightning Bolt row")
    }

    /// With Card in Hand open on the flat Duo, the pill is hidden: Card in Hand has its own typed field (Q5). The pill is present
    /// on Packages before Card in Hand opens, so the absence below is a change the open causes. Packages is hidden from
    /// accessibility under Card in Hand, so this reads the accessibility tree (see the limit in the header).
    func testFlatDuoPillHidesWhileCardInHandIsOpen() throws {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        let bar = app.duoBar
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "scope: the custom tab bar duo-tab-bar is missing")
        bar.buttons["Packages"].tap()
        XCTAssertTrue(app.element("find-pill").waitForExistence(timeout: 5),
                      "scope: the find pill is missing on the open Duo's Packages before Card in Hand opens")

        // Card in Hand opens from the Packages page: its query field shows, or the hand-open button opens it.
        if !app.element("hand-query").waitForExistence(timeout: 3) {
            let open = app.element("hand-open")
            XCTAssertTrue(open.waitForExistence(timeout: 2),
                          "scope: Card in Hand did not open: neither hand-query nor hand-open is on screen")
            open.tap()
        }
        XCTAssertTrue(app.element("hand-query").waitForExistence(timeout: 5), "scope: the query field of Card in Hand is missing")
        XCTAssertFalse(app.element("find-pill").exists,
                       "the find pill shows while Card in Hand is open (Q5: Card in Hand has its own typed field)")
    }
}
