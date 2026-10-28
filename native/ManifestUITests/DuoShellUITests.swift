// Duo shell UI tests (duo-spine-shell, decision duo-card-in-hand, round 2 items 23 and 24, mockup poses 9 and 11).
//
// How to run. Flat and closed need different hinge poses, so each pose gets its own run. Set the pose first with
// `~/.local/bin/hinge open` (flat) or `~/.local/bin/hinge close` (closed), then run only that pose's tests:
//   xcodebuild test -project native/Manifest.xcodeproj -scheme Manifest -destination 'platform=iOS Simulator,id=<Duo UDID>' \
//     -only-testing:ManifestUITests/DuoShellUITests/testFlatBarUnderRightPage   (and the other testFlat... cases)
//   xcodebuild test ... -only-testing:ManifestUITests/DuoShellUITests/testClosedKeepsSystemBar
// `sim-test` cannot target the Duo (record one-simulator-per-mac), so call `xcodebuild test` with the Duo's destination.
// Each test names its pose and fails when the window is another size (DuoWindowSupport.swift). It never skips.
//
// What the tests expect of the app:
//   Custom tab bar, open Duo: one view with the identifier "duo-tab-bar". Its buttons carry the tab titles
//     Ledger, Orphaned, Tally and Packages, and the active tab's button has the selected trait. It sits under the
//     right page, clear of the fold, 76 pt high at most. It is the only navigation, as the system bar is hidden.
//   Ledger, open Duo: the Ledger page keeps the full width. Ledger has no running head (the masthead shows on Packages
//     only), so the test reads the Backup row ("backup"), which every Ledger page draws.
//   Tally, open Duo: the tab shows its rows (tally-row:Lightning Bolt, the anchor TallyUITests uses).
//   System tab bar: on the open Duo it is absent or not hittable. On the closed Duo it shows the four tab titles.
//   Custom tab bar, closed Duo: absent.
//
// Every key here is fake. Launch with -ManifestUITestSeed only. Do not pass -ManifestUITestWidth: it frames the root to 375 pt.

import XCTest

@MainActor
final class DuoShellUITests: XCTestCase {
    static let tabTitles = ["Ledger", "Orphaned", "Tally", "Packages"]
    static let tolerance: CGFloat = 2
    /// Half the fold strip (40 pt, centred): how far a full-width Ledger row must reach past the middle on each side
    /// (455.5 and 495.5 at a 951 pt window), and how far right of the middle the right page starts.
    static let foldMargin: CGFloat = 20
    /// The tallest the custom bar's view may be: the pill (64 pt) and the 12 pt under it.
    static let barHeight: CGFloat = 76
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

    func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
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
        XCTAssertGreaterThanOrEqual(f.minX, win.midX + Self.foldMargin - Self.tolerance, "the bar starts inside or left of the fold strip: it must sit under the right page")
        XCTAssertLessThanOrEqual(f.maxX, win.maxX + Self.tolerance, "the bar runs past the window's right edge")
        XCTAssertGreaterThan(f.width, win.width * 0.4, "the bar is narrower than a page")
        XCTAssertLessThan(f.width, win.width * 0.6, "the bar spans both pages, not the right one")
        XCTAssertLessThanOrEqual(f.height, Self.barHeight + Self.tolerance, "the bar's view is taller than the pill and its bottom gap")
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
        let row = element(app, "backup")
        XCTAssertTrue(row.waitForExistence(timeout: 5), "the Ledger Backup row is missing")

        let win = app.window.frame
        let f = row.frame
        XCTAssertLessThan(f.minX, win.midX - Self.foldMargin, "the Ledger page starts right of the fold")
        XCTAssertGreaterThan(f.maxX, win.midX + Self.foldMargin, "the Ledger page stops at the fold")
        XCTAssertGreaterThan(f.width, win.width * 0.9, "the Ledger page is not full width")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). The custom bar is the only navigation: a tap on Tally opens Tally,
    /// and a tap on Ledger brings Ledger back. The selected trait follows the tap.
    func testFlatBarSwitchesTabs() {
        let app = launch()
        guard app.requirePose(.flat) else { return }
        continueAfterFailure = false  // a missing button or anchor ends the test, so no later tap lands on nothing

        let bar = customBar(app)
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "the custom tab bar duo-tab-bar is missing on the open Duo")
        let ledger = bar.buttons["Ledger"]
        let tally = bar.buttons["Tally"]
        XCTAssertTrue(ledger.exists && tally.exists, "the custom tab bar has no Ledger or no Tally button")
        XCTAssertTrue(element(app, "backup").waitForExistence(timeout: 5), "the app does not open on Ledger (the Backup row is missing)")
        XCTAssertTrue(ledger.isSelected, "the Ledger button lacks the selected trait on Ledger")
        XCTAssertFalse(tally.isSelected, "the Tally button has the selected trait on Ledger")
        keepShot(app, "flat-ledger")

        XCTAssertTrue(tally.isHittable, "the Tally button is not hittable: nothing else on the open Duo can switch tabs")
        tally.tap()
        XCTAssertTrue(element(app, "tally-row:Lightning Bolt").waitForExistence(timeout: 5),
                      "a tap on the Tally button did not open Tally (tally-row:Lightning Bolt is missing)")
        XCTAssertTrue(tally.isSelected, "the Tally button lacks the selected trait on Tally")
        XCTAssertFalse(ledger.isSelected, "the Ledger button keeps the selected trait on Tally")
        keepShot(app, "flat-tally")

        XCTAssertTrue(ledger.isHittable, "the Ledger button is not hittable on Tally")
        ledger.tap()
        XCTAssertTrue(element(app, "backup").waitForExistence(timeout: 5), "a tap on the Ledger button did not return to Ledger (the Backup row is missing)")
        XCTAssertTrue(ledger.isSelected, "the Ledger button lacks the selected trait after the return")
        XCTAssertFalse(tally.isSelected, "the Tally button keeps the selected trait after the return")
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
        keepShot(app, "closed-ledger")
        XCTAssertFalse(customBar(app).exists, "the custom tab bar shows on a closed Duo")
    }
}
