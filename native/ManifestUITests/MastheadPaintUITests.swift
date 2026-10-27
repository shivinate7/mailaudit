// Lane N14, the masthead's progress bar (progress-bar-accent-then-green, masthead-is-one-letterhead,
// no-layout-shift-under-pointer).
//
// XCUITest cannot read a colour, so the colour meanings are pinned in ManifestKit
// (MastheadPaintTests). What the UI can read is that the bar exists, where it sits, and its value.
//
// Red-first. The builder adds one accessibility element to the masthead:
//   masthead-progress   the bar. Between the tally cells and the count line, inside `masthead`.
//                       Its value is the whole-number percent of cards in, then " percent":
//                       "0 percent" on the seeded ledger (0 of 14), "7 percent" after one card.
// It compiles against main today and fails on the missing element, not on a compile error.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class MastheadPaintUITests: XCTestCase {
    static let checkIn = "checkin:A1|0|pLightningBolt"
    static let checkedPackageId = "package-row:A1::Alpha Cards"
    static let cellIds = ["tally-cards", "tally-packages", "tally-value"]

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed", "-ManifestUITestWidth", "375"]
        app.launch()
        app.tabBars.buttons["Packages"].tap()
        return app
    }

    private func need(_ app: XCUIApplication, _ id: String) throws -> XCUIElement {
        let el = app.descendants(matching: .any).matching(identifier: id).firstMatch
        return try XCTUnwrap(el.waitForExistence(timeout: 5) ? el : nil, "\(id) is missing")
    }

    /// The leading whole number of a value such as "7 percent".
    private func percent(_ el: XCUIElement) -> Int? {
        (el.value as? String).flatMap { Int($0.prefix { $0.isNumber }) }
    }

    /// The bar sits in the masthead, under the three cells and over the count line, as wide as the tallies.
    func testProgressBarSitsBetweenTheTalliesAndTheCountLine() throws {
        let app = launch()
        let head = try need(app, "masthead")
        let bar = try need(app, "masthead-progress")
        let cells = try Self.cellIds.map { try need(app, $0) }
        let count = try need(app, "masthead-count")

        XCTAssertTrue(head.frame.insetBy(dx: -1, dy: -1).contains(bar.frame), "the bar sits outside the masthead")
        let cellsBottom = try XCTUnwrap(cells.map(\.frame.maxY).max())
        XCTAssertGreaterThanOrEqual(bar.frame.minY, cellsBottom - 1, "the bar is not below the tally cells")
        XCTAssertLessThanOrEqual(bar.frame.maxY, count.frame.minY + 1, "the bar is not above the count line")
        XCTAssertGreaterThanOrEqual(bar.frame.width, head.frame.width * 0.7, "the bar is much narrower than the tallies")
        XCTAssertEqual(percent(bar), 0, "nothing is in on the seeded ledger")
    }

    /// One card in: the value follows, and the bar's frame does not move. The A1 card is scrolled fully into view
    /// first: below the fold, the tap would scroll the list and the bar would move. The at-rest check comes after
    /// that scroll, so it also proves the scroll checked nothing in.
    func testProgressValueFollowsACheckInAndTheBarStaysPut() throws {
        let app = launch()
        let control = try need(app, Self.checkIn)
        let bar = try need(app, "masthead-progress")
        app.reveal(try need(app, Self.checkedPackageId), whole: true)
        XCTAssertTrue(control.label.hasPrefix("Check in"), "the scroll checked the line in before the baseline")
        let before = bar.frame

        control.tap()
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value BEGINSWITH %@", "7"), object: bar)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, "the bar never read 7 percent after 1 of 14 cards")

        XCTAssertEqual(percent(bar), 7)
        XCTAssertEqual(bar.frame, before, "the bar moved on a check-in")
    }
}
