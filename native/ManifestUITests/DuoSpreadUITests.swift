// Duo spread UI tests (lane duo-tabs-spread, decision duo-card-in-hand round 2 item 24, mockup poses 9 and 11).
//
// On the open Duo, Tally and Orphaned spread over both pages: the list on the left page, the thing you open from it on the
// right page, nothing in the fold strip. Packages and Ledger keep the full width. Pose 9 of the mockup lays the parts out:
//   Tally     left: the product names with their ratios. Right: the selected name, and its copies.
//   Orphaned  left: one cell per envelope. Right: the selected envelope, and the packages it could have come from, each with Assign.
// A row tap changes the right page only (pose 9 text), so the list does not move when a name or envelope is picked.
//
// How to run. Flat and closed need different hinge poses, so each pose gets its own run. Set the pose first with
// `~/.local/bin/hinge open` (flat) or `~/.local/bin/hinge close` (closed), then run only that pose's tests, with the Duo's
// destination (record one-simulator-per-mac; see DuoShellUITests.swift). These tests are written but not run in the lane that
// wrote them (lane duo-tabs-spread-t): they build with `xcodebuild build-for-testing`.
// Each test names its pose and fails when the window is another size (DuoWindowSupport.swift). It never skips.
//
// Red now (the builder makes them pass): testFlatTallySpreadsOverBothPages, testFlatTallyRightPageFollowsTheTappedRow,
// testFlatOrphanedSpreadsOverBothPages, testFlatBarTitlesShareOneBaseline, testFlatOrphanedArmedDiscardDoesNotCarryOver,
// testFlatOrphanedPickedCellIsSelected, testFlatTallyPickedRowIsSelected.
// Guards, green on the old code: testFlatPackagesFullWidth, testClosedTallyIsOnePage. Ledger full width has one home,
// DuoShellUITests.testFlatLedgerFullWidth, which shares expectSpansFold with the Packages test here.
// testFlatTallyLastRowClearsTheBar is unrun: it may pass today, and it keeps the new left page clear of the bar.
//
// What the tests expect of the app. Identifiers already in the app are kept. The builder adds the ones marked NEW.
//   duo-tab-bar              the custom bar (DuoShellUITests). Its buttons carry the tab titles.
//   duo-tab-title:<title>    NEW. The title text of each bar button, as its own element that frames the text alone,
//                            for the four titles Ledger, Orphaned, Tally and Packages. SwiftUI folds a Button's Text into the
//                            Button, so the builder must keep the Text reachable as its own element and keep the Button's
//                            button trait and label (DuoShellUITests reads bar.buttons[title]). Any element type counts.
//   tally-row:<name>         Tally, flat: the list row, on the left page. Its header button tally-toggle:<name> selects the
//                            name. A tap there changes the right page and does not expand the row in place.
//   tally-detail-title       NEW. The right page's heading. Its label is the selected product name.
//   tally-copy:<key>         Tally, flat: one element per copy of the selected name, on the right page. The copies of any
//                            other name are not on screen.
//   orphaned-cell:<id>       NEW. Orphaned, flat: the envelope's cell in the left page's list. A tap on it selects the envelope.
//                            Its envelope card envelope:<id> may sit on the right page, or not exist.
//   orphaned-detail-title    NEW. The right page's heading for the selected envelope. Its label ends in the envelope's card count.
//   .isSelected trait        NEW. The picked cell has it and the other cell does not: orphaned-cell:<id> itself, and on Tally the
//                            tally-toggle:<name> button or its tally-row:<name> container, either one.
//   assign:<gk>              Orphaned, flat: a candidate's Assign button, on the right page.
//   discard:<id>             Orphaned: Discard sits on the right page's card only, and arms an ask "Tap again to discard N card(s)"
//                            that lapses by itself after 4 s. A pick starts the new envelope's card unarmed.
//   orphaned-record, orphaned-input, suggestion:<name>, orphaned-save   the composer (OrphanedRecordSupport.swift).
//   package-row:<gk>         Packages: a row spans the fold.
// The mockup draws no masthead, search, sort or Hide received control on Tally or Orphaned. Where they sit is unruled, so the
// tests do not place them. They must not reach into the fold strip, and the fold scan covers the tally- and orphaned- ids.
// The mockup draws a selected row at open. Whether the right page shows a name before any tap is unruled, so each test taps first.
// Tally's right page holds no state of its own (no @State read by a detail or by ItemLine; check-ins live in the model), so a
// pick has no carry-over to observe there, and no Tally case stands beside the Orphaned armed-ask one.
//
// Every key here is fake. Launch with -ManifestUITestSeed only. Do not pass -ManifestUITestWidth: it frames the root to 375 pt.

import XCTest

@MainActor
final class DuoSpreadUITests: XCTestCase {
    /// The seed (shared/fixtures/ledger.json): 8 product names. Lightning Bolt has three copies, Counterspell two.
    static let tallyRows = 8
    static let lightningCopies = ["A1|0|pLightningBolt", "B1|0|pLightningBolt", "C1|0|pLightningBolt"]
    static let counterspellCopies = ["A1|1|pCounterspell", "B1|1|pCounterspell"]
    static let orphanedPrefixes = ["orphaned-", "envelope:", "assign:", "exact:", "fit:", "discard:"]

    override func setUp() {
        super.setUp()
        continueAfterFailure = false  // a missing part ends the test, so no later tap lands on nothing
    }

    // MARK: helpers

    /// The open Duo on the seed, the custom bar up, and `tab` opened through the bar (the system bar is hidden on the open Duo).
    /// `anchor` is an identifier, or the start of one, that only the opened tab draws. nil when the pose is wrong: requirePose has already failed the test.
    func openFlat(_ tab: String, anchor: String) -> XCUIApplication? {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return nil }
        let bar = app.duoBar
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "the custom tab bar duo-tab-bar is missing on the open Duo")
        let button = bar.buttons[tab]
        XCTAssertTrue(button.exists && button.isHittable, "the \(tab) button of the custom bar cannot be tapped")
        button.tap()
        XCTAssertTrue(app.firstElement(prefix: anchor).waitForExistence(timeout: 5), "a tap on the \(tab) button did not open \(tab) (\(anchor) is missing)")
        return app
    }

    /// Polls `holds` for up to 5 s.
    func waitUntil(_ holds: () -> Bool) -> Bool {
        let deadline = Date().addingTimeInterval(5)
        while !holds() && Date() < deadline { Thread.sleep(forTimeInterval: 0.1) }
        return holds()
    }

    func waitForLabel(_ element: XCUIElement, _ label: String) -> Bool { waitUntil { element.label == label } }

    /// The open Duo on Orphaned with two envelopes recorded, so a pick has something to change. A holds Urza's Saga (1 card,
    /// candidate D1). B holds Urza's Saga and Counterspell (2 cards, candidates A1, B1 and D1): the two headings differ by
    /// card count, and D1 is offered on both right pages. `ids` are the two cells' identifiers, the upper cell first.
    func openFlatOrphanedWithTwo() -> (app: XCUIApplication, ids: [String])? {
        guard let app = openFlat("Orphaned", anchor: "orphaned-record") else { return nil }
        app.recordEnvelope([("urza", "Urza's Saga")])
        app.recordEnvelope([("urza", "Urza's Saga"), ("counter", "Counterspell")])
        // recordEnvelope's own wait is already met by the first cell, so the second cell is waited for here.
        func cells() -> [String: CGFloat] {
            Dictionary(app.elements(prefix: "orphaned-cell:").map { ($0.identifier, $0.frame.minY) }, uniquingKeysWith: min)
        }
        XCTAssertTrue(waitUntil { cells().count == 2 }, "two recorded envelopes should give two cells, the app has \(cells().count)")
        return (app, cells().sorted { $0.value < $1.value }.map(\.key))
    }

    func waitUntilGone(_ element: XCUIElement) -> Bool {
        XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: element)], timeout: 5) == .completed
    }

    func sameFrame(_ a: CGRect, _ b: CGRect) -> Bool {
        abs(a.minX - b.minX) <= 1 && abs(a.minY - b.minY) <= 1 && abs(a.width - b.width) <= 1 && abs(a.height - b.height) <= 1
    }

    // MARK: open Duo, pose flat

    /// Pose: flat (open Duo, window 951 x 669 pt), mockup pose 9. Tally's rows sit on the left page, the selected name and its
    /// copies on the right page, and a row tap moves no row. Nothing of Tally reaches into the fold strip.
    func testFlatTallySpreadsOverBothPages() {
        guard let app = openFlat("Tally", anchor: "tally-row:Lightning Bolt") else { return }

        let rows = app.elements(prefix: "tally-row:")
        XCTAssertEqual(rows.count, Self.tallyRows, "the seed's Tally has \(Self.tallyRows) rows")
        for row in rows { expect(row, on: .left, in: app, "the list row \(row.identifier)") }
        let before = Dictionary(rows.map { ($0.identifier, $0.frame) }, uniquingKeysWith: { first, _ in first })

        let toggle = app.byID("tally-toggle:Lightning Bolt")
        XCTAssertTrue(toggle.isHittable, "the Lightning Bolt row is not on screen: a tap would scroll the list and move every frame")
        toggle.tap()
        keepShot(app, "flat-tally-spread")

        let title = app.byID("tally-detail-title")
        expect(title, on: .right, in: app, "the right page's heading tally-detail-title")
        XCTAssertTrue(waitForLabel(title, "Lightning Bolt"), "the right page names \(title.label), not the tapped row, Lightning Bolt")
        for key in Self.lightningCopies {
            expect(app.byID("tally-copy:\(key)"), on: .right, in: app, "the copy tally-copy:\(key)")
        }

        Thread.sleep(forTimeInterval: 0.5)  // a row that does move has stopped by now
        let after = app.elements(prefix: "tally-row:")
        XCTAssertEqual(after.count, rows.count, "a tap on a row changed how many rows the list holds")
        for row in after {
            guard let was = before[row.identifier] else { XCTFail("a tap on a row added the list row \(row.identifier)"); continue }
            XCTAssertTrue(sameFrame(row.frame, was), "a tap on Lightning Bolt moved \(row.identifier) from \(was) to \(row.frame): a row tap must change the right page only")
        }

        let scan = app.partsInFoldStrip(prefixes: ["tally-"])
        XCTAssertGreaterThan(scan.seen, 0, "the fold scan found no tally- part, so it proves nothing")
        XCTAssertEqual(scan.inStrip, [], "Tally parts reach into the fold strip")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). The right page follows the tapped row, and shows that name's copies only.
    func testFlatTallyRightPageFollowsTheTappedRow() {
        guard let app = openFlat("Tally", anchor: "tally-row:Lightning Bolt") else { return }
        let title = app.byID("tally-detail-title")

        app.byID("tally-toggle:Counterspell").tap()
        XCTAssertTrue(title.waitForExistence(timeout: 5), "the right page's heading tally-detail-title is missing after a tap on Counterspell")
        XCTAssertTrue(waitForLabel(title, "Counterspell"), "after a tap on Counterspell the right page names \(title.label)")
        for key in Self.counterspellCopies { expect(app.byID("tally-copy:\(key)"), on: .right, in: app, "the copy tally-copy:\(key)") }
        for key in Self.lightningCopies {
            XCTAssertTrue(waitUntilGone(app.byID("tally-copy:\(key)")), "Counterspell is selected, yet the right page still lists tally-copy:\(key)")
        }

        app.byID("tally-toggle:Lightning Bolt").tap()
        XCTAssertTrue(waitForLabel(title, "Lightning Bolt"), "after a tap on Lightning Bolt the right page names \(title.label)")
        for key in Self.lightningCopies { expect(app.byID("tally-copy:\(key)"), on: .right, in: app, "the copy tally-copy:\(key)") }
        for key in Self.counterspellCopies {
            XCTAssertTrue(waitUntilGone(app.byID("tally-copy:\(key)")), "Lightning Bolt is selected, yet the right page still lists tally-copy:\(key)")
        }
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). The picked Tally row carries the selected trait and the other row does not.
    /// The trait sits on the tap target tally-toggle:<name> or on its row container tally-row:<name>.
    func testFlatTallyPickedRowIsSelected() {
        guard let app = openFlat("Tally", anchor: "tally-row:Lightning Bolt") else { return }
        func picked(_ name: String) -> Bool { app.byID("tally-toggle:\(name)").isSelected || app.byID("tally-row:\(name)").isSelected }

        for (pick, other) in [("Counterspell", "Lightning Bolt"), ("Lightning Bolt", "Counterspell")] {
            app.byID("tally-toggle:\(pick)").tap()
            XCTAssertTrue(waitUntil { picked(pick) }, "after a tap on \(pick), neither its toggle nor its row has the selected trait")
            XCTAssertFalse(picked(other), "\(other) has the selected trait while \(pick) is picked")
        }
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). Scrolled to the end, the last Tally row ends above the bar's top edge.
    /// The drag runs inside the left page, from the window's origin: on an open Duo, `app` coordinates land on the outer display.
    func testFlatTallyLastRowClearsTheBar() {
        guard let app = openFlat("Tally", anchor: "tally-row:Lightning Bolt") else { return }
        let bar = app.duoBar
        func lowest() -> (id: String, maxY: CGFloat) {
            let last = app.elements(prefix: "tally-row:").max { $0.frame.maxY < $1.frame.maxY }
            return (last?.identifier ?? "none", last?.frame.maxY ?? 0)
        }

        XCTAssertEqual(app.elements(prefix: "tally-row:").count, Self.tallyRows, "the seed's Tally has \(Self.tallyRows) rows")
        // Without this, a list that fits above the bar passes whatever the bottom inset is.
        XCTAssertGreaterThan(lowest().maxY, bar.frame.minY,
                             "the \(Self.tallyRows) rows end above the bar before any scroll, so this test proves nothing: add rows to the seed")

        let win = app.window.frame
        let x = (win.minX + win.midX - DuoMetrics.foldMargin) / 2 - win.minX  // the middle of the left page
        let origin = app.window.coordinate(withNormalizedOffset: .zero)
        var last = lowest().maxY
        for drag in 0..<12 {
            origin.withOffset(CGVector(dx: x, dy: win.height - 100))
                .press(forDuration: 0.05, thenDragTo: origin.withOffset(CGVector(dx: x, dy: 100)), withVelocity: .slow, thenHoldForDuration: 0.3)
            Thread.sleep(forTimeInterval: 0.5)
            let now = lowest().maxY
            // A first drag that moves nothing is not "the end": the drag missed the scroll view, or the list cannot clear the bar.
            if drag == 0 { XCTAssertLessThan(now, last - 0.5, "a drag on the left page did not move the list: \(lowest().id) stays at \(now) pt, the bar's top is \(bar.frame.minY) pt. Either the drag missed the scroll view, or the list cannot scroll far enough to clear the bar") }
            if abs(now - last) < 0.5 { break }  // the list stopped moving: this is the end
            last = now
        }
        keepShot(app, "flat-tally-end")

        let end = lowest()
        XCTAssertLessThanOrEqual(end.maxY, bar.frame.minY + 0.5,
                                 "scrolled to the end, \(end.id) ends at \(end.maxY) pt, below the bar's top edge at \(bar.frame.minY) pt")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt), mockup pose 9. Orphaned's envelope cells sit on the left page, and the
    /// picked envelope's heading and candidates on the right page. A tap on a cell changes the right page and moves no cell.
    /// The seed holds no envelope, so the test records two. Taps run upper, lower, upper: whichever envelope the right page
    /// shows at open, at least two of the three change it, so a pick that changes nothing, or always the same one, fails.
    func testFlatOrphanedSpreadsOverBothPages() {
        guard let two = openFlatOrphanedWithTwo() else { return }
        let app = two.app
        let upperCell = app.byID(two.ids[0]), lowerCell = app.byID(two.ids[1])
        let title = app.byID("orphaned-detail-title")

        expect(upperCell, on: .left, in: app, "the upper envelope's list cell \(two.ids[0])")
        expect(lowerCell, on: .left, in: app, "the lower envelope's list cell \(two.ids[1])")
        let upperBefore = upperCell.frame, lowerBefore = lowerCell.frame

        upperCell.tap()
        expect(title, on: .right, in: app, "the right page's heading orphaned-detail-title")
        Thread.sleep(forTimeInterval: 0.3)  // a tap that does change the pick has rendered by now
        let upper = title.label
        expect(app.byID("assign:D1::Delta Cards"), on: .right, in: app, "the candidate's button assign:D1::Delta Cards")

        lowerCell.tap()
        keepShot(app, "flat-orphaned-spread")
        XCTAssertTrue(waitUntil { title.label != upper }, "a tap on the lower cell left the right page on \(upper): a pick must change the envelope it shows")
        let lower = title.label
        expect(app.byID("assign:D1::Delta Cards"), on: .right, in: app, "the candidate's button assign:D1::Delta Cards")

        upperCell.tap()
        XCTAssertTrue(waitForLabel(title, upper), "a tap back on the upper cell left the right page on \(lower), not \(upper)")

        Thread.sleep(forTimeInterval: 0.5)
        XCTAssertTrue(sameFrame(upperCell.frame, upperBefore), "a tap moved the upper cell from \(upperBefore) to \(upperCell.frame): a row tap must change the right page only")
        XCTAssertTrue(sameFrame(lowerCell.frame, lowerBefore), "a tap moved the lower cell from \(lowerBefore) to \(lowerCell.frame): a row tap must change the right page only")

        let scan = app.partsInFoldStrip(prefixes: Self.orphanedPrefixes)
        XCTAssertGreaterThan(scan.seen, 0, "the fold scan found no Orphaned part, so it proves nothing")
        XCTAssertEqual(scan.inStrip, [], "Orphaned parts reach into the fold strip")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). Discard armed on one envelope does not arm the next one a pick shows: the
    /// right page's card is that envelope's, with its own state. The ask lapses by itself after 4 s, so the pick and the check
    /// run inside 3.5 s of arming. A slower run fails, since it cannot tell a carried ask from a lapsed one. It never passes.
    func testFlatOrphanedArmedDiscardDoesNotCarryOver() {
        guard let two = openFlatOrphanedWithTwo() else { return }
        let app = two.app
        let upperCell = app.byID(two.ids[0]), lowerCell = app.byID(two.ids[1])
        let title = app.byID("orphaned-detail-title")
        let ask = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Tap again to discard")).firstMatch

        upperCell.tap()
        XCTAssertTrue(title.waitForExistence(timeout: 5), "the right page's heading orphaned-detail-title is missing after a tap on the upper cell")
        Thread.sleep(forTimeInterval: 0.3)
        let shown = title.label
        let discard = app.firstElement(prefix: "discard:")
        XCTAssertTrue(discard.waitForExistence(timeout: 5), "the right page's card has no Discard (discard:<id>)")

        let armedAt = Date()
        discard.tap()
        XCTAssertTrue(ask.waitForExistence(timeout: 2), "a tap on Discard did not arm it: there is no 'Tap again to discard' button, so the test would prove nothing")
        lowerCell.tap()
        XCTAssertTrue(waitUntil { title.label != shown }, "a tap on the lower cell left the right page on \(shown): no pick, so no carry-over to check")
        let carried = ask.exists
        let spent = Date().timeIntervalSince(armedAt)

        XCTAssertFalse(carried, "Discard was armed on the envelope \(shown). A pick to \(title.label) kept the 'Tap again to discard' ask: the card's state carried over to the next envelope")
        XCTAssertLessThan(spent, 3.5, "\(spent) s passed between arming and the check, and the ask lapses at 4 s: the absence proves nothing. Run again")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). The picked Orphaned cell carries the selected trait and the other cell does not.
    func testFlatOrphanedPickedCellIsSelected() {
        guard let two = openFlatOrphanedWithTwo() else { return }
        let upperCell = two.app.byID(two.ids[0]), lowerCell = two.app.byID(two.ids[1])

        for (pick, other, name) in [(upperCell, lowerCell, "upper"), (lowerCell, upperCell, "lower")] {
            pick.tap()
            XCTAssertTrue(waitUntil { pick.isSelected }, "after a tap on the \(name) cell it lacks the selected trait")
            XCTAssertFalse(other.isSelected, "the other cell has the selected trait while the \(name) cell is picked")
        }
    }

    /// Pose: flat (open Duo, window 951 x 669 pt), mockup pose 11. The four bar titles share one baseline: their bottoms agree
    /// within 0.5 pt. Orphaned's envelope icon is shorter than the others, which put its title about 2 pt high; the fix is a
    /// fixed 22 x 22 icon frame. A button's frame is the same for all four by construction, so the test reads the title text.
    func testFlatBarTitlesShareOneBaseline() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        let bar = app.duoBar
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "the custom tab bar duo-tab-bar is missing on the open Duo")

        var bottoms: [String: CGFloat] = [:]
        for title in DuoShellUITests.tabTitles {
            let text = app.byID("duo-tab-title:\(title)")
            XCTAssertTrue(text.waitForExistence(timeout: 5), "the \(title) button has no title element duo-tab-title:\(title)")
            let button = bar.buttons[title]
            XCTAssertTrue(button.exists, "the custom tab bar has no \(title) button")
            XCTAssertLessThan(text.frame.height, button.frame.height / 2,
                              "duo-tab-title:\(title) is \(text.frame.height) pt high in a \(button.frame.height) pt button: it must frame the title text alone, or the test compares the buttons")
            bottoms[title] = text.frame.maxY
        }
        guard let low = bottoms.values.min(), let high = bottoms.values.max() else { return }
        XCTAssertLessThanOrEqual(high - low, 0.5, "the bar titles do not share one baseline, their bottoms are \(bottoms)")
    }

    /// Pose: flat (open Duo, window 951 x 669 pt). Packages keeps the full width, so the fold does not split it. A guard, not a
    /// red test: the app already draws Packages across the fold. It fails if the spread work reaches Packages too.
    func testFlatPackagesFullWidth() {
        guard let app = openFlat("Packages", anchor: "package-row:") else { return }
        expectSpansFold(app.firstElement(prefix: "package-row:"), in: app, "Packages page")
    }

    // MARK: closed Duo, pose closed

    /// Pose: closed (outer screen, window 466 x 678 pt). Tally is one page: its rows run across the window, a tap opens the
    /// row in place, and there is no right page. A guard, not a red test: the app already draws one page when closed.
    func testClosedTallyIsOnePage() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.closed) else { return }
        let tab = app.tabBars.buttons["Tally"]
        XCTAssertTrue(tab.waitForExistence(timeout: 5), "the system tab bar has no Tally tab on the closed Duo")
        tab.tap()
        let row = app.byID("tally-row:Lightning Bolt")
        XCTAssertTrue(row.waitForExistence(timeout: 5), "a tap on the Tally tab did not open Tally (tally-row:Lightning Bolt is missing)")

        let win = app.window.frame
        XCTAssertGreaterThan(row.frame.width, win.width * 0.85, "the Tally row is \(row.frame.width) pt wide in a \(win.width) pt window: Tally should be one page")
        app.byID("tally-toggle:Lightning Bolt").tap()
        let copy = app.byID("tally-copy:\(Self.lightningCopies[0])")
        XCTAssertTrue(copy.waitForExistence(timeout: 5), "a tap on the Lightning Bolt row did not list its copies")
        keepShot(app, "closed-tally")
        let tol = DuoMetrics.tolerance
        XCTAssertTrue(row.frame.insetBy(dx: -tol, dy: -tol).contains(copy.frame),
                      "the copy \(copy.frame) lies outside its row \(row.frame): closed, the copies open in place")
        XCTAssertFalse(app.byID("tally-detail-title").exists, "a closed Duo shows a right page (tally-detail-title)")
    }
}
