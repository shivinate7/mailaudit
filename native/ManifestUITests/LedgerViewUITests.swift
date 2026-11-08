// The Ledger tab's View group (lane restyle-step8: ledger-tab-holds-options, ruled-head-showing-unreceived,
// ruled-head-range-picked). The web's View group holds three rows, shown only with items, above Data:
// Showing (one tap, "● Unreceived" or "○ Everything"), Sorted by (a two-column option grid) and Orders
// from (a four-column grid of seven ranges, By month spanning two).
//
// Contract the cases name (the builder implements it):
//   ledger-view      the View group, above the Data group on the Ledger tab.
//   ledger-showing   the Showing row. Its value reads "● Unreceived" or "○ Everything"; one tap toggles it.
//   ledger-sort      the Sorted by row. A tap opens ledger-sort-grid. Each cell is a button labelled with its
//                    option: Newest, Oldest, $ remaining, Unit rate, Seller A–Z on Packages.
//   ledger-range     the Orders from row. A tap opens ledger-range-grid. Cells: All time, 30 days, 45 days,
//                    60 days, 90 days, Last…, By month.
//   backup           the Backup row of the Data group (the anchor, as DuoShellUITests reads it).
//
// The Sorted by grid shows the list of the last list tab left (src/app.jsx lastList). Native opens on Ledger,
// so the first grid is Packages' (inferred from the web, not ruled).
// Every key here is fake.
// Compile-checked only: this agent has no simulator. The red for each case is owed to a simulator run.

import XCTest

@MainActor
final class LedgerViewUITests: XCTestCase {
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    /// The View group sits above the Data group, and holds the three rows.
    func testLedgerTabHoldsTheViewGroupAboveData() throws {
        let app = ShellUITest.launch(width: 375)
        app.tabBars.buttons["Ledger"].tap()

        let backup = ShellUITest.element(app, "backup")
        XCTAssertTrue(backup.waitForExistence(timeout: 5), "scope: the Data group's Backup row is missing")
        let view = ShellUITest.element(app, "ledger-view")
        XCTAssertTrue(view.waitForExistence(timeout: 5), "the View group ledger-view is missing on the Ledger tab")
        XCTAssertLessThanOrEqual(view.frame.maxY, backup.frame.minY, "the View group does not sit above Data")
        for id in ["ledger-showing", "ledger-sort", "ledger-range"] {
            XCTAssertTrue(ShellUITest.element(app, id).exists, "the View group has no \(id) row")
        }
    }

    /// Picking Oldest in Sorted by reorders the Packages list. Newest puts B1 first, Oldest puts D1 first.
    func testPickingAnOrderChangesThePackagesList() throws {
        let app = ShellUITest.launch(width: 375)
        app.tabBars.buttons["Packages"].tap()
        XCTAssertTrue(ShellUITest.element(app, "package-row:B1::Beta Games").waitForExistence(timeout: 5),
                      "scope: the Packages rows are missing")
        XCTAssertEqual(ShellUITest.topPackageRow(app), "package-row:B1::Beta Games",
                       "scope: Packages does not open with Beta Games first (Newest)")

        app.tabBars.buttons["Ledger"].tap()
        let sort = ShellUITest.element(app, "ledger-sort")
        XCTAssertTrue(sort.waitForExistence(timeout: 5), "the Sorted by row ledger-sort is missing")
        sort.tap()
        XCTAssertTrue(ShellUITest.element(app, "ledger-sort-grid").waitForExistence(timeout: 5),
                      "Sorted by opened no option grid")
        let oldest = app.buttons["Oldest"]
        XCTAssertTrue(oldest.waitForExistence(timeout: 5), "the Sorted by grid has no Oldest cell")
        oldest.tap()

        app.tabBars.buttons["Packages"].tap()
        XCTAssertTrue(ShellUITest.element(app, "package-row:D1::Delta Cards").waitForExistence(timeout: 5),
                      "scope: the Packages rows are missing after the pick")
        XCTAssertEqual(ShellUITest.topPackageRow(app), "package-row:D1::Delta Cards",
                       "picking Oldest did not reorder Packages: Delta Cards is not first")
    }
}
