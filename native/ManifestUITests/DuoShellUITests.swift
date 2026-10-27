// Duo shell UI tests (duo-spine-shell, decision duo-card-in-hand, round 2 items 23 and 24, mockup poses 9 and 11).
//
// Red-first. The builder adds DuoSpine.swift and one hook in RootView, then makes these pass. Each test names its
// hinge pose, and fails when the window is another size (DuoWindowSupport.swift).
//
// Contract the tests name (the builder implements all of it):
//   Custom tab bar, open Duo: one view with the identifier "duo-tab-bar". Its buttons carry the tab titles
//     Ledger, Orphaned, Tally and Packages. It sits under the right page.
//   Ledger, open Duo: the Ledger page keeps the full width. Ledger has no running head (the masthead shows on Packages
//     only), so the test reads the Backup row ("backup"), which every Ledger page draws.
//   System tab bar: on the open Duo it is absent or not hittable. On the closed Duo it shows the four tab titles.
//   Custom tab bar, closed Duo: absent.
//
// Every key here is fake. Launch with -ManifestUITestSeed only. Do not pass -ManifestUITestWidth: it frames the root to 375 pt.

import XCTest

@MainActor
final class DuoShellUITests: XCTestCase {
    static let tabTitles = ["Ledger", "Orphaned", "Tally", "Packages"]
    static let tolerance: CGFloat = 2
    /// How far a full-width Ledger row must reach past the fold on each side (455.5 and 495.5 at a 951 pt window).
    static let foldMargin: CGFloat = 20
    /// The room a bottom bar may keep above the window's bottom edge. The outer screen's bottom inset is 34 pt; the inner one is unmeasured.
    static let bottomAllowance: CGFloat = 40

    func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        return app
    }

    func customBar(_ app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: "duo-tab-bar").firstMatch
    }

    // MARK: open Duo, pose flat

    /// Pose: flat (open Duo, window 951 x 669 pt). The custom bar sits under the right page, not across the fold.
    func testFlatBarUnderRightPage() {
        let app = launch()
        guard app.requirePose(.flat) else { return }

        let bar = customBar(app)
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "the custom tab bar duo-tab-bar is missing on the open Duo")
        for title in Self.tabTitles {
            XCTAssertTrue(bar.buttons[title].exists, "the custom tab bar has no \(title) button")
        }

        let win = app.window.frame
        let f = bar.frame
        XCTAssertGreaterThan(f.minX, win.midX, "the bar starts at or left of the fold: it must sit under the right page")
        XCTAssertLessThanOrEqual(f.maxX, win.maxX + Self.tolerance, "the bar runs past the window's right edge")
        XCTAssertGreaterThan(f.width, win.width * 0.4, "the bar is narrower than a page")
        XCTAssertLessThan(f.width, win.width * 0.6, "the bar spans both pages, not the right one")
        XCTAssertGreaterThanOrEqual(f.maxY, win.maxY - Self.bottomAllowance, "the bar is not at the bottom of the right page")
        XCTAssertLessThanOrEqual(f.maxY, win.maxY + Self.tolerance, "the bar runs past the bottom of the window")

        let system = app.tabBars.firstMatch
        XCTAssertFalse(system.exists && system.isHittable, "the system tab bar still shows across the open Duo")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). Ledger keeps the full width, so the fold does not split it.
    /// The custom bar must exist first. That shows the shell is in use, so a pass is not the old one-page layout.
    func testFlatLedgerFullWidth() {
        let app = launch()
        guard app.requirePose(.flat) else { return }
        XCTAssertTrue(customBar(app).waitForExistence(timeout: 5), "the custom tab bar duo-tab-bar is missing on the open Duo")

        // Ledger has no running head: the masthead shows on Packages only. The Backup row is drawn on every Ledger page,
        // with or without a sync client or saved versions, and it is the anchor the other Ledger tests use.
        let row = app.descendants(matching: .any).matching(identifier: "backup").firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5), "the Ledger Backup row is missing")

        let win = app.window.frame
        let f = row.frame
        XCTAssertLessThan(f.minX, win.midX - Self.foldMargin, "the Ledger page starts right of the fold")
        XCTAssertGreaterThan(f.maxX, win.midX + Self.foldMargin, "the Ledger page stops at the fold")
        XCTAssertGreaterThan(f.width, win.width * 0.9, "the Ledger page is not full width")
    }

    // MARK: closed Duo, pose closed

    /// Pose: closed (outer screen, window 466 x 678 pt). One page, so the system tab bar shows and the custom bar does not.
    /// A guard, not a red test: the app already shows the system bar when closed.
    func testClosedKeepsSystemBar() {
        let app = launch()
        guard app.requirePose(.closed) else { return }

        let system = app.tabBars.firstMatch
        XCTAssertTrue(system.waitForExistence(timeout: 5), "the system tab bar is missing on the closed Duo")
        for title in Self.tabTitles {
            XCTAssertTrue(system.buttons[title].exists, "the system tab bar has no \(title) tab")
        }
        XCTAssertFalse(customBar(app).exists, "the custom tab bar shows on a closed Duo")
    }
}
