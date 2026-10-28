// Tally UI tests (lane N6, native-build-lanes, card-tally-row-counts-first, tally-row-lists-its-copies,
// no-layout-shift-under-pointer).
//
// Red-first. The Tally tab is a placeholder on main. The builder draws the view and makes these pass.
// Each test checks that a row exists before it acts, so the red reads "rows missing" and never a tap on nothing.
//
// Contract the tests name (the builder implements all of it). The launch arguments are N5's:
// -ManifestUITestSeed (the shared fixture: 12 lines, 8 Tally rows) and -ManifestUITestWidth <pt>.
//   Tab: the tab bar button "Tally".
//   Row: identifier "tally-row:<product name>", for example "tally-row:Lightning Bolt". Its header button
//     has the identifier "tally-toggle:<product name>" and opens or closes the row.
//   Copy: an open row holds one element per shown copy, "tally-copy:<item key>". Its label holds the seller,
//     the order id, the set and the day of the month.
//   Copy control: "tally-checkin:<item key>", a 44pt hit region, labelled "Check in <name>" or
//     "Undo check in <name>" (the Packages control, same wording).
//   Sort: a menu button "tally-sort". Its label or value holds the current sort label. Its menu lists
//     the six labels as buttons.
//   Search: a text field "tally-search".
//   Empty search: no row, and exactly one button whose label has "clear" in it, labelled "Clear search".
//     The system clear button of a search field counts, so a builder using one must not add a second.
//
// testTextClippedAuditCanFail is a control, not a red-first case. It passes on main: the clipped-text audit does
// find clipped text in the existing screens at a very narrow width. That is all it shows. No Tally view exists,
// so no run has yet shown the audit flag a clipped sort label. The bounds check on the control is the other half.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class TallyUITests: XCTestCase {
    static let sortLabels = ["Most missing", "Cost basis", "Most ordered", "$ remaining", "Unit rate", "Name A\u{2013}Z"]
    static let minHit: CGFloat = 44

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    // MARK: helpers

    /// `size` is a UIContentSizeCategory name; pass it where a test depends on the default type size, so a
    /// simulator left at another size cannot move the result.
    func launch(width: Int? = nil, size: String? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed"]
        if let width { args += ["-ManifestUITestWidth", String(width)] }
        if let size { args += ["-UIPreferredContentSizeCategoryName", size] }
        app.launchArguments = args
        app.launch()
        return app
    }

    func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    func elements(_ app: XCUIApplication, prefix: String) -> [XCUIElement] {
        app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix)).allElementsBoundByIndex
    }

    /// The Tally tab, open, with its rows loaded.
    func openTally(_ app: XCUIApplication) {
        let tab = app.tabBars.buttons["Tally"]
        XCTAssertTrue(tab.waitForExistence(timeout: 5), "the Tally tab is missing")
        tab.tap()
        XCTAssertTrue(element(app, "tally-row:Lightning Bolt").waitForExistence(timeout: 5),
                      "the Tally tab shows no rows (tally-row:Lightning Bolt is missing)")
    }

    /// Opens a row and waits for its copies.
    func open(_ app: XCUIApplication, _ name: String, firstCopy: String) {
        let toggle = element(app, "tally-toggle:\(name)")
        XCTAssertTrue(toggle.waitForExistence(timeout: 5), "the header button tally-toggle:\(name) is missing")
        toggle.tap()
        XCTAssertTrue(element(app, "tally-copy:\(firstCopy)").waitForExistence(timeout: 5), "row \(name) did not list its copies")
    }

    func frames(_ app: XCUIApplication) -> [String: CGRect] {
        var out: [String: CGRect] = [:]
        for prefix in ["tally-row:", "tally-copy:", "tally-checkin:"] {
            for el in elements(app, prefix: prefix) { out[el.identifier] = el.frame }
        }
        return out
    }

    func clearControls(_ app: XCUIApplication) -> XCUIElementQuery {
        app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "clear"))
    }

    // MARK: accessibility audit, one screen state per method

    // The audit, app.auditSkippingTabBar(ruled:), lives in AuditSkippingTabBarUITests.swift.

    func testAccessibilityAuditTallyScreenWithRows() throws {
        let app = launch()
        openTally(app)
        try app.auditSkippingTabBar(ruled: skipMeasuredContrastFlags)
    }

    /// The open row is audited alone. On the full list, opening Lightning Bolt adds three copies and pushes the last
    /// row (Ponder) under the glass tab bar. The audit reads that cut row as a contrast failure, which says nothing about
    /// the palette. A search that leaves one product leaves no row cut or hidden by the bar.
    func testAccessibilityAuditTallyScreenWithARowOpen() throws {
        let app = launch()
        openTally(app)
        let search = element(app, "tally-search")
        XCTAssertTrue(search.waitForExistence(timeout: 5), "the search field tally-search is missing")
        search.tap()
        search.typeText("Lightning\n")  // the return key closes the keyboard, so the tab bar shows
        let ponderGone = NSPredicate(format: "exists == false")
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: ponderGone, object: element(app, "tally-row:Ponder"))], timeout: 5),
                       .completed, "the search left the Ponder row on screen")
        XCTAssertEqual(elements(app, prefix: "tally-row:").map(\.identifier), ["tally-row:Lightning Bolt"],
                       "the search should leave one product")
        open(app, "Lightning Bolt", firstCopy: "B1|0|pLightningBolt")

        let barTop = app.tabBars.firstMatch.frame.minY
        XCTAssertGreaterThan(barTop, 0, "the tab bar is not on screen")
        for (id, frame) in frames(app) {
            XCTAssertLessThanOrEqual(frame.maxY, barTop, "\(id) reaches under the tab bar, so the audit would read a cut row")
        }
        try app.auditSkippingTabBar(ruled: skipMeasuredContrastFlags)
    }

    // MARK: the copies list

    /// An open row lists every copy it counts, with the seller, the order id, the set and the date, and a 44pt control.
    func testOpenRowListsEveryCopyWithItsDetails() throws {
        let app = launch()
        openTally(app)
        open(app, "Lightning Bolt", firstCopy: "B1|0|pLightningBolt")
        let copies = [
            ("B1|0|pLightningBolt", "Beta Games", "B1", "29"),
            ("A1|0|pLightningBolt", "Alpha Cards", "A1", ""),
            ("C1|0|pLightningBolt", "Gamma Cards", "C1", ""),
        ]
        XCTAssertEqual(elements(app, prefix: "tally-copy:").count, 3, "the row should list its three copies")
        for (key, seller, order, day) in copies {
            let copy = element(app, "tally-copy:\(key)")
            XCTAssertTrue(copy.exists, "copy \(key) is missing")
            for part in [seller, order, "Test Set", day] where !part.isEmpty {
                XCTAssertTrue(copy.label.contains(part), "copy \(key) reads \u{201C}\(copy.label)\u{201D}, which lacks \(part)")
            }
            let control = element(app, "tally-checkin:\(key)")
            XCTAssertTrue(control.exists, "copy \(key) has no check-in control")
            XCTAssertGreaterThanOrEqual(control.frame.width, Self.minHit, "\(key) control is narrower than 44pt")
            XCTAssertGreaterThanOrEqual(control.frame.height, Self.minHit, "\(key) control is shorter than 44pt")
        }
    }

    // MARK: nothing moves when a copy completes

    /// Completing a copy moves nothing at 375pt: not the row, not the other rows, not the copies. The row keeps
    /// its outstanding line mounted, and the sort stays frozen (Urza's Saga would sort last if it re-sorted).
    func testNothingMovesWhenACopyCompletesAt375pt() throws {
        let app = launch(width: 375)
        openTally(app)
        open(app, "Urza's Saga", firstCopy: "D1|0|pUrzasSaga")
        let controlId = "tally-checkin:D1|0|pUrzasSaga"
        let control = element(app, controlId)
        XCTAssertTrue(control.exists, "the copy has no check-in control")
        let before = frames(app)
        XCTAssertGreaterThanOrEqual(before.count, 10, "expected eight rows, one copy and its control")

        control.tap()
        let undone = NSPredicate(format: "label BEGINSWITH %@", "Undo check in")
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: undone, object: control)], timeout: 5),
                       .completed, "the check-in did not land")
        let after = frames(app)

        // Frames are fractional, so each edge and size is compared to half a point, not the whole rect exactly.
        for (id, frame) in before where id != controlId {
            guard let now = after[id] else {  // a throw would skip every id after this one
                XCTFail("\(id) left the screen when the copy completed")
                continue
            }
            for (part, was, then) in [("x", frame.minX, now.minX), ("y", frame.minY, now.minY),
                                      ("width", frame.width, now.width), ("height", frame.height, now.height)] {
                XCTAssertEqual(then, was, accuracy: 0.5, "\(id) moved when the copy completed (\(part))")
            }
        }
    }

    // MARK: the sort label

    /// Each of the six labels shows whole at 375pt: the control keeps to the frame, and the clipped-text audit
    /// finds nothing on it.
    func testEverySortLabelFitsAt375pt() throws {
        let app = launch(width: 375)
        openTally(app)
        let sort = element(app, "tally-sort")
        XCTAssertTrue(sort.waitForExistence(timeout: 5), "the sort control tally-sort is missing")
        let inset = (app.windows.firstMatch.frame.width - 375) / 2

        for label in Self.sortLabels {
            sort.tap()
            let option = app.buttons[label]
            XCTAssertTrue(option.waitForExistence(timeout: 5), "the sort menu has no \(label) button")
            option.tap()

            let shown = [sort.label, sort.value as? String ?? ""].joined(separator: " ")
            XCTAssertTrue(shown.contains(label), "after choosing \(label), the sort control reads \u{201C}\(shown)\u{201D}")
            XCTAssertGreaterThanOrEqual(sort.frame.minX, inset - 1, "\(label): the sort control starts outside the 375pt frame")
            XCTAssertLessThanOrEqual(sort.frame.maxX, inset + 375 + 1, "\(label): the sort control ends outside the 375pt frame")

            var clipped: [String] = []
            try app.performAccessibilityAudit(for: .textClipped) { issue in
                guard let frame = issue.element?.frame, frame.intersects(sort.frame) else { return true }
                clipped.append(issue.compactDescription)
                return false
            }
            XCTAssertEqual(clipped, [], "\(label) is clipped at 375pt")
        }
    }

    /// The control for the audit above: at a very narrow width the existing screens clip text, and the audit must say so.
    /// If this goes red, .textClipped cannot see truncation here and the sort-label case proves less than it claims.
    func testTextClippedAuditCanFail() throws {
        var found: [String] = []
        for width in [60, 90, 120] {
            let app = launch(width: width)
            let packages = app.tabBars.buttons["Packages"]
            if packages.waitForExistence(timeout: 5) { packages.tap() }
            try app.performAccessibilityAudit(for: .textClipped) { issue in
                found.append("\(width)pt: \(issue.compactDescription)")
                return true
            }
            app.terminate()
        }
        XCTAssertFalse(found.isEmpty, "the clipped-text audit found nothing at 60, 90 or 120pt")
        add(XCTAttachment(string: found.joined(separator: "\n")))
    }

    // MARK: the meta line

    /// The meta line of a row ("2 sellers · 2 orders · Test Set") is one line at the default type size. The line
    /// height is the row's own rate line, a mono one-liner in the same header that cannot wrap (it is fixed to its
    /// width). A wrapped meta line is about twice that, so the cut is one and a half. At an accessibility type size the
    /// meta may wrap, so no case asserts there.
    func assertMetaIsOneLine(width: Int) {
        let app = launch(width: width, size: "UICTContentSizeCategoryL")
        openTally(app)
        let row = element(app, "tally-row:Counterspell")
        let meta = row.staticTexts["2 sellers \u{00B7} 2 orders \u{00B7} Test Set"]
        let rate = row.staticTexts.matching(NSPredicate(format: "label ENDSWITH %@", "/ copy")).firstMatch
        XCTAssertTrue(meta.waitForExistence(timeout: 5), "the Counterspell row has no meta line")
        XCTAssertTrue(rate.exists, "the Counterspell row has no rate line to measure a line by")
        XCTAssertLessThan(meta.frame.height, 1.5 * rate.frame.height,
                          "at \(width)pt the meta line is \(meta.frame.height)pt high, a wrapped line, against a one-line \(rate.frame.height)pt")
    }

    func testTheMetaLineIsOneLineAt320pt() { assertMetaIsOneLine(width: 320) }

    func testTheMetaLineIsOneLineAt375pt() { assertMetaIsOneLine(width: 375) }

    // MARK: an empty search

    /// A search with no hit shows no rows and exactly one Clear control. The control brings the rows back.
    func testEmptySearchShowsOneClearControl() throws {
        let app = launch()
        openTally(app)
        let search = element(app, "tally-search")
        XCTAssertTrue(search.waitForExistence(timeout: 5), "the search field tally-search is missing")
        search.tap()
        search.typeText("zzzz")

        let clear = clearControls(app)
        XCTAssertTrue(clear.firstMatch.waitForExistence(timeout: 5), "an empty search shows no Clear control")
        XCTAssertEqual(elements(app, prefix: "tally-row:").count, 0, "rows still show for a search with no hit")
        XCTAssertEqual(clear.count, 1, "an empty search shows \(clear.count) Clear controls: \(clear.allElementsBoundByIndex.map(\.label))")
        XCTAssertEqual(clear.firstMatch.label, "Clear search")

        clear.firstMatch.tap()
        XCTAssertTrue(element(app, "tally-row:Lightning Bolt").waitForExistence(timeout: 5), "Clear search did not bring the rows back")
        XCTAssertEqual(clearControls(app).count, 0, "a Clear control remains with the search empty")
    }
}
