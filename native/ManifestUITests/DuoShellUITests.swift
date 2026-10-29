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
//   Full-width lists, open Duo: Packages and Ledger scroll under the custom bar's strip, so each keeps room for it. Scrolled to
//     its end, the last row (and its controls) ends at or above the bar's top edge, wherever it overlaps the bar sideways.
//     The Packages rows are package-row:<gk> with checkin:<key> controls. The last Ledger row is "reset".
//   System tab bar: on the open Duo it is absent or not hittable. On the closed Duo it shows the four tab titles.
//   Custom tab bar, closed Duo: absent.
//   Taps above the keys, open Duo: with the system keys up, a control whose centre lies in the 76 pt above them (the bar's room in
//     the tab) takes a tap. The test uses Tally's check-in control (tally-checkin:<key>) on the open Lightning Bolt row.
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
    /// A list that is still moving after this many drags is not at an end (the seeded Packages list needs about five).
    static let maxDrags = 10

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

    /// Pose: flat (open Duo, window 951 x 669 pt). Packages and Ledger run the full width, so the custom bar floats over
    /// them. Each list, scrolled to its end, must leave its last row (and the controls in it) at or above the bar's top
    /// edge. Seed on 8af0ec3: Packages' last row ends at 627 pt against a bar top of 593 pt, so this test is red there.
    func testFlatFullWidthListsClearTheBar() {
        let app = launch()
        guard app.requirePose(.flat) else { return }

        let bar = customBar(app)
        guard bar.waitForExistence(timeout: 5) else {
            XCTFail("the custom tab bar duo-tab-bar is missing on the open Duo")
            return
        }
        let barFrame = bar.frame

        // Packages: every package row the list has drawn.
        XCTAssertTrue(bar.buttons["Packages"].isHittable, "the Packages button is not hittable on the open Duo")
        bar.buttons["Packages"].tap()
        let packageQuery = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "package-row:"))
        guard packageQuery.firstMatch.waitForExistence(timeout: 5) else {
            XCTFail("the Packages list shows no package row")
            return
        }
        let packageRows = { packageQuery.allElementsBoundByIndex }
        let lastPackage = scrollToEnd(app, tab: "Packages", bar: barFrame, rows: packageRows)
        keepShot(app, "flat-packages-end-shell")
        assertClearsBar(lastPackage, tab: "Packages", bar: barFrame)

        // Ledger: its four rows, top to bottom. Reset is the last, and it is drawn when saved versions exist (the seed has them).
        XCTAssertTrue(bar.buttons["Ledger"].isHittable, "the Ledger button is not hittable on Packages")
        bar.buttons["Ledger"].tap()
        guard element(app, "backup").waitForExistence(timeout: 5) else {
            XCTFail("a tap on the Ledger button did not return to Ledger (the Backup row is missing)")
            return
        }
        XCTAssertTrue(element(app, "reset").exists, "the Ledger Reset row is missing: it is the last row")
        let ledgerRows = { ["sync", "history", "backup", "reset"].map { self.element(app, $0) }.filter { $0.exists } }
        assertClearsBar(scrollToEnd(app, tab: "Ledger", bar: barFrame, rows: ledgerRows), tab: "Ledger", bar: barFrame)
    }

    /// True when `f` shares any width with the bar. The bar is the right page's strip, so a row on the left page does not.
    func overlapsBar(_ f: CGRect, _ bar: CGRect) -> Bool { f.maxX > bar.minX && f.minX < bar.maxX }

    /// True when `f` lies over the bar's strip: it overlaps the bar sideways and ends below the bar's top edge.
    func underBar(_ f: CGRect, _ bar: CGRect) -> Bool { overlapsBar(f, bar) && f.maxY > bar.minY + Self.tolerance }

    /// The frame of each row the list has drawn, by identifier.
    func frames(_ rows: () -> [XCUIElement]) -> [String: CGRect] {
        Dictionary(rows().map { ($0.identifier, $0.frame) }, uniquingKeysWith: { $1 })
    }

    /// The frames once two reads `gap` seconds apart agree, so a drag's last glide is over. Nil when they still differ after 25 tries.
    func stillFrames(_ rows: () -> [XCUIElement], gap: TimeInterval = 0.2) -> [String: CGRect]? {
        var last = frames(rows)
        for _ in 0..<25 {
            Thread.sleep(forTimeInterval: gap)
            let now = frames(rows)
            if now == last { return now }
            last = now
        }
        return nil
    }

    /// The frames, read again until two reads in a row agree. When they never do, the latest read.
    func settled(_ rows: () -> [XCUIElement]) -> [String: CGRect] { stillFrames(rows) ?? frames(rows) }

    /// One drag up the right page, from 80 % to 15 % of the window's height. It starts above the bar (which starts at 89 %),
    /// and it holds before it lifts, so it has no fling (as reveal(_:whole:) does).
    func dragListUp(_ app: XCUIApplication) { dragList(app, from: 0.8, to: 0.15) }

    /// One slow drag of the right page from `from` to `to`, each a fraction of the window's height. It holds before it lifts (no fling).
    func dragList(_ app: XCUIApplication, from: CGFloat, to: CGFloat) {
        let window = app.window
        let start = window.coordinate(withNormalizedOffset: CGVector(dx: 0.75, dy: from))
        let end = window.coordinate(withNormalizedOffset: CGVector(dx: 0.75, dy: to))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
    }

    /// Drags a list up until a drag moves nothing, and returns its lowest row. A list whose rows reach the bar must move on
    /// the first drag. If it does not, it cannot scroll clear of the bar, and the test fails on that drag. Without that check,
    /// a list that never scrolled would pass on a row above the bar that is not its last.
    func scrollToEnd(_ app: XCUIApplication, tab: String, bar: CGRect, rows: () -> [XCUIElement]) -> XCUIElement? {
        var seen = settled(rows)
        let reachesBar = seen.values.contains { underBar($0, bar) }
        for drag in 1...Self.maxDrags {
            dragListUp(app)
            let now = settled(rows)
            if now == seen {
                if drag == 1 && reachesBar {
                    XCTFail("the \(tab) list reaches the custom bar, but it did not move on the first drag: its last row cannot scroll clear of the bar")
                }
                return rows().max { $0.frame.maxY < $1.frame.maxY }
            }
            seen = now
        }
        XCTFail("the \(tab) list was still moving after \(Self.maxDrags) drags, so it never reached an end")
        return rows().max { $0.frame.maxY < $1.frame.maxY }
    }

    /// The row, and every button or check-in control in it, ends at or above the bar's top edge wherever it overlaps the bar.
    func assertClearsBar(_ row: XCUIElement?, tab: String, bar: CGRect) {
        guard let row else {
            XCTFail("the \(tab) list shows no row to check against the custom bar")
            return
        }
        let checkIns = row.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "checkin:"))
        for el in [row] + row.buttons.allElementsBoundByIndex + checkIns.allElementsBoundByIndex {
            let f = el.frame
            guard overlapsBar(f, bar) else { continue }
            let name = el.identifier.isEmpty ? el.label : el.identifier
            XCTAssertLessThanOrEqual(f.maxY, bar.minY + Self.tolerance,
                                     "the \(tab) last row's \(name) ends at \(Int(f.maxY)) pt, below the custom bar's top edge at \(Int(bar.minY)) pt")
        }
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

    // MARK: open Duo, taps above the keys

    /// Most drags the test spends bringing a control into the band above the keys.
    static let maxPlacementDrags = 6
    /// A drag shorter than this does not pass the scroll slop and moves nothing, so a smaller move is a longer drag and its way back.
    static let minDrag: CGFloat = 40
    /// How far in from the band's top edge a control's centre must lie, so a centre on the edge does not count.
    static let bandMargin: CGFloat = 8
    /// The gap between the two reads that prove the controls are still. iOS drops a tap that lands on a list that is still moving.
    static let stillGap: TimeInterval = 0.3

    /// Pose: flat (open Duo, window 951 x 669 pt), system keys up. The tab keeps room for the custom bar, and that room must not
    /// take taps. With the keys up it lies in the 76 pt just above them, over the rows. The test opens Tally and its Lightning Bolt
    /// row, focuses the search field, and scrolls one unchecked copy's check-in control (a 45 pt square at the left page's edge,
    /// clear of the fold) until its centre lies in that band and it ends above the keys. The control must be hittable, and a tap on
    /// it must check the copy in. Red where the room takes a tap in that band (on main the tap is dropped). The tap goes to a window
    /// coordinate, as element.tap() may scroll a covered element clear first. The tap lands only on a still control: after each
    /// drag the test waits until the controls' frames agree across two reads stillGap apart, and just before the tap it reads the
    /// control's frame twice, stillGap apart, and fails when they differ or the control has left the band.
    func testFlatTapAboveKeysLands() {
        let app = launch()
        guard app.requirePose(.flat) else { return }
        let bar = customBar(app)
        guard bar.waitForExistence(timeout: 5) else {
            XCTFail("the custom tab bar duo-tab-bar is missing on the open Duo")
            return
        }

        bar.buttons["Tally"].tap()
        let toggle = element(app, "tally-toggle:Lightning Bolt")
        guard toggle.waitForExistence(timeout: 5) else {
            XCTFail("a tap on the Tally button did not open Tally (tally-toggle:Lightning Bolt is missing)")
            return
        }
        tapNearLeft(toggle)
        let query = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "tally-checkin:"))
        guard query.firstMatch.waitForExistence(timeout: 5) else {
            XCTFail("a tap on tally-toggle:Lightning Bolt listed no copy, so there is no check-in control")
            return
        }
        let controls = { query.allElementsBoundByIndex }

        let search = element(app, "tally-search")
        guard search.waitForExistence(timeout: 5) else {
            XCTFail("the search field tally-search is missing")
            return
        }
        tapNearLeft(search)
        let keys = app.keyboards.firstMatch
        guard keys.waitForExistence(timeout: 5) else {
            XCTFail("the system keys are not up; with a hardware keyboard attached they never draw (Simulator, I/O, Keyboard, Connect Hardware Keyboard off)")
            return
        }
        let win = app.window.frame
        for _ in 0..<25 where keys.frame.maxY > win.maxY + Self.tolerance { Thread.sleep(forTimeInterval: 0.2) }  // the keys slide up from the bottom edge

        // Bring a control to rest in the band. Each pass reads the keys and the controls once they stop moving, and a drag may have put the keys down.
        var target: String?
        var k = CGRect.zero
        for drag in 0...Self.maxPlacementDrags {
            guard keys.exists else {
                XCTFail("the keys went down before a control reached the band: a drag dismissed them")
                return
            }
            guard stillFrames({ controls() + [keys] }, gap: Self.stillGap) != nil else {
                XCTFail("the check-in controls or the keys were still moving after pass \(drag), so a tap cannot be tried on a still control (see the INSET-DIAG lines)")
                return
            }
            k = keys.frame
            guard k.height > 100, k.minY >= win.minY, k.maxY <= win.maxY + Self.tolerance else {
                XCTFail("the keyboard frame \(k) is not the keys up on the window \(win)")
                return
            }
            let free = controls().filter { $0.label.hasPrefix("Check in") }
            let listing = free.map { "\($0.identifier) \($0.frame)" }
            print("INSET-DIAG pass \(drag) keys=\(k) band=y\(k.minY - Self.barHeight)...\(k.minY) controls=\(listing)")
            if let hit = free.first(where: { inKeysBand($0.frame, keys: k) }) {
                target = hit.identifier
                break
            }
            if drag == Self.maxPlacementDrags { break }
            // The centre of the span a 45 pt control's centre may take. A control a little above it still counts as below, so the drag is up.
            let aim = k.minY - 44
            let below = free.filter { $0.frame.midY >= aim - 20 }
            guard let next = below.min(by: { $0.frame.midY < $1.frame.midY }) ?? free.max(by: { $0.frame.midY < $1.frame.midY }) else {
                XCTFail("every copy of the open row is checked in already, so there is no control to tap")
                return
            }
            scrollRows(app, by: aim - next.frame.midY, keys: k)
        }
        guard let id = target else {
            XCTFail("no check-in control came to rest in the \(Int(Self.barHeight)) pt above the keys after \(Self.maxPlacementDrags) drags, so the tap cannot be tried (see the INSET-DIAG lines)")
            return
        }

        // Read the control's frame twice, stillGap apart. The second read is the one the tap aims at.
        let control = element(app, id)
        let before = control.frame
        Thread.sleep(forTimeInterval: Self.stillGap)
        let f = control.frame
        let hittable = control.isHittable
        print("INSET-DIAG window=\(win) keys=\(k) band=y\(k.minY - Self.barHeight)...\(k.minY) control=\(id) frame=\(f) hit=(\(f.midX), \(f.midY)) hittable=\(hittable)")
        print("INSET-DIAG pre-tap control=\(id) read1=\(before) read2=\(f) gap=\(Self.stillGap)s still=\(before == f) inBand=\(inKeysBand(f, keys: k))")
        keepShot(app, "flat-tap-above-keys")
        guard before == f, inKeysBand(f, keys: k) else {
            XCTFail("the check-in control \(id) moved or left the band just before the tap (read 1 \(before), read 2 \(f), band y\(Int(k.minY - Self.barHeight))...\(Int(k.minY))), so the tap cannot be tried on a still control")
            return
        }
        XCTAssertTrue(hittable, "the check-in control \(id), frame \(f), is not hittable. Its centre lies \(Int(k.minY - f.midY)) pt above the keys' top (y \(Int(k.minY))), inside the \(Int(Self.barHeight)) pt band the bar's room takes, so a view lies over it")

        app.window.coordinate(withNormalizedOffset: CGVector(dx: (f.midX - win.minX) / win.width, dy: (f.midY - win.minY) / win.height)).tap()
        for _ in 0..<25 where !control.label.hasPrefix("Undo check in") { Thread.sleep(forTimeInterval: 0.2) }
        print("INSET-DIAG post-tap control=\(id) frame=\(control.frame) label=\(control.label) hittable=\(control.isHittable) keys=\(keys.exists ? "\(keys.frame)" : "down")")
        XCTAssertTrue(control.label.hasPrefix("Undo check in"),
                      "a tap at (\(Int(f.midX)), \(Int(f.midY))) on \(id), \(Int(k.minY - f.midY)) pt above the keys, was dropped: the control still reads \"\(control.label)\"")
    }

    /// True when the control's centre lies in the band above the keys that the bar's room takes (a little in from its top edge), and
    /// the control ends at or above the keys' top. A control partly under the keys is no test of the room: it stays unhittable once the room is gone.
    func inKeysBand(_ f: CGRect, keys: CGRect) -> Bool {
        f.midY >= keys.minY - Self.barHeight + Self.bandMargin && f.maxY <= keys.minY + Self.tolerance
    }

    /// Moves the rows by `dy` points (negative scrolls them up) with slow drags that start above the band. A drag that starts in the
    /// band starts on the bar's room, the thing under test, and one that starts on the keys does not scroll (dragListUp starts at 80 %
    /// of the window's height, which is on the keys).
    func scrollRows(_ app: XCUIApplication, by dy: CGFloat, keys: CGRect) {
        let sign: CGFloat = dy < 0 ? -1 : 1
        if abs(dy) < Self.minDrag {
            scrollRows(app, by: dy + sign * Self.minDrag, keys: keys)
            scrollRows(app, by: -sign * Self.minDrag, keys: keys)
            return
        }
        let win = app.window.frame
        let top = win.minY + 100  // below the pinned running head
        let ceiling = keys.minY - Self.barHeight - 12
        let from = sign < 0 ? ceiling : top
        let to = from + sign * min(abs(dy), ceiling - top)
        dragList(app, from: (from - win.minY) / win.height, to: (to - win.minY) / win.height)
    }

    /// Taps `el` a tenth of its width in from its left edge. A full-width element's centre lies on the fold strip, and no test here has measured a tap there.
    func tapNearLeft(_ el: XCUIElement) { el.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.5)).tap() }
}
