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
    /// simulator left at another size cannot move the result. `seed` names a fixture file to seed from; it must come
    /// right after the flag. nil seeds the bundled ledger, as every other case does.
    func launch(width: Int? = nil, size: String? = nil, seed: String? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed"] + (seed.map { [$0] } ?? [])
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

    /// The Tally tab, open, with its rows loaded. `row` is the product whose row proves the load.
    func openTally(_ app: XCUIApplication, row: String = "Lightning Bolt") {
        let tab = app.tabBars.buttons["Tally"]
        XCTAssertTrue(tab.waitForExistence(timeout: 5), "the Tally tab is missing")
        tab.tap()
        XCTAssertTrue(element(app, "tally-row:\(row)").waitForExistence(timeout: 5),
                      "the Tally tab shows no rows (tally-row:\(row) is missing)")
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

    // The naming audit, app.auditNamingElements(), lives in AuditSkippingTabBarUITests.swift.

    func testAccessibilityAuditTallyScreenWithRows() throws {
        let app = launch()
        openTally(app)
        try app.auditNamingElements(skipping: skipTallyAuditFlags)
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
        try app.auditNamingElements(skipping: skipTallyAuditFlags)
    }

    /// The audit with an overflowing meta line. The Set Card meta is far wider than its column, so the row draws a "…"
    /// over the column's edge (owner ruling, decision audit-skips-measured-flags). No skip covers the line: the Text
    /// is hard-clipped, never truncated, so the audit raises no finding. A truncating Text raises a clipped-text issue
    /// that can come back with no identifier, so the test asserts no finding at all on the screen and does not look
    /// for one by id. The audit runs first, so a truncating build goes red there. Then the line's label is whole, and
    /// the Text is wider than the app window, so the "…" case runs on a line that really overflows. The window is the
    /// bound because the row's own frame is the union of its children and grows with the meta Text (measured on
    /// 2026-10-28: meta 722pt, row 855pt, window 402pt), so it cannot tell an overflowing line from a fitting one.
    /// A cut line must not widen its card: last, every card lies inside the 16pt gutters.
    func testAccessibilityAuditTallyScreenWithATruncatedMetaLine() throws {
        let app = launch(width: 375, size: "UICTContentSizeCategoryL", seed: Self.longSetSeed)
        openTally(app, row: Self.longSetRow)
        let ruled = try app.auditNamingElements(skipping: skipTallyAuditFlags)
        XCTAssertFalse(ruled.contains { $0.contains("id=tally-meta:") }, "an audit skip covers the meta line. Skipped: \(ruled)")
        let meta = wholeLongSetMeta(app)
        let window = app.windows.firstMatch
        XCTAssertGreaterThan(meta.frame.width, window.frame.width,
                             "the meta line does not overflow: meta \(meta.frame), window \(window.frame)")

        // Then no part of the row leaves the column. Every card keeps the 16pt gutters of the 375pt frame (the same
        // column and gutter SyncAdvisoryUITests reads), and the header button and the outstanding line lie inside the window.
        let gutter = SyncAdvisoryUITests.gutter, slack = SyncAdvisoryUITests.slack
        let left = (window.frame.width - SyncAdvisoryUITests.column) / 2 + gutter
        let right = left + SyncAdvisoryUITests.column - 2 * gutter
        let cards = elements(app, prefix: "tally-row:")
        XCTAssertFalse(cards.isEmpty, "the Tally tab shows no rows")
        var outside = cards.filter { $0.frame.minX < left - slack || $0.frame.maxX > right + slack }
            .map { "\($0.identifier) \($0.frame) (gutters \(left) to \(right))" }
        for id in ["tally-toggle:\(Self.longSetRow)", "tally-left:\(Self.longSetRow)"] {
            let part = element(app, id)
            XCTAssertTrue(part.exists, "\(id) is missing")
            if part.frame.minX < window.frame.minX - slack || part.frame.maxX > window.frame.maxX + slack {
                outside.append("\(id) \(part.frame) (window \(window.frame))")
            }
        }
        XCTAssertEqual(outside, [], "these frames lie outside their bounds")
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

        for (id, frame) in before where id != controlId {
            XCTAssertEqual(after[id], frame, "\(id) moved when the copy completed")
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

    /// The seed that holds a long set name: ledger-long-seller.json, whose Set Card item has one (the fixture file is
    /// shared with PackageCardUITests, which reads only its L1 package).
    static let longSetSeed = "ledger-long-seller.json"
    static let longSetRow = "Set Card"
    static let longSet = "Fictional Anthology of the Northern Realm Commemorative Collector Edition Reprint Series"

    /// The long-set row's meta element, tally-meta:<name>, with its label checked: seller count, order count and the
    /// full set name. The line is cut on screen and drawn with a "…", but the element still holds the whole text.
    @discardableResult
    func wholeLongSetMeta(_ app: XCUIApplication) -> XCUIElement {
        let meta = element(app, "tally-meta:\(Self.longSetRow)")
        XCTAssertTrue(meta.waitForExistence(timeout: 5), "the meta element tally-meta:\(Self.longSetRow) is missing")
        XCTAssertEqual(meta.label, "1 seller \u{00B7} 1 order \u{00B7} \(Self.longSet)", "the meta element's label is not the whole meta text")
        return meta
    }

    /// A set name far wider than the row ends in "…" on screen (owner ruling, decision audit-skips-measured-flags), and
    /// the meta element still holds the whole text in its label.
    func testALongSetNameIsWholeInTheMetaElementsLabel() throws {
        let app = launch(width: 375, seed: Self.longSetSeed)
        openTally(app, row: Self.longSetRow)  // red here, not on the identifier, if the seed has no Set Card item
        wholeLongSetMeta(app)
    }

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
