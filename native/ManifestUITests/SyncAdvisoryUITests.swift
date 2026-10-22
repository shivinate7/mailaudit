// Sync advisory line UI tests (lane N4b, ruled-head-one-advisory-entrance, native-parity-table,
// native-sync-client-unwired).
//
// Red-first. The builder wires SyncClient into the app and draws the line. These tests compile against
// main today and fail on a missing element, not on a compile error.
//
// Contract the tests name (the builder implements all of it):
//   Launch argument -ManifestUITestSyncStatus <http status>: the app builds its SyncClient on an
//     in-process stub that answers every request with that status and an empty body, and a made-up key
//     held in memory (no Keychain item is read). The REAL path runs from there: client, advisory, view.
//     A flag that set the advisory directly would pass while the client stayed unwired, which is the
//     gap these tests exist to close.
//     401 -> advisory "no-access". 413 -> "too-big". 404 -> the store is empty, no failure.
//   The line is one element with the identifier "sync-advisory" on Packages, Tally and Orphaned, and not
//   on the Ledger tab (ruled-head-one-advisory-entrance: on the Ledger tab the Sync row shows the state).
//   Its accessibility value is the syncStatus code of the failure ("no-access", "too-big"), so a test
//   does not depend on the wording. Its label is the line (SyncLine.text, see SyncLineTests).
//   With no failure the element does not exist.
//
// The wording of the native lines is not ruled, so no test reads the prose. A 401 and a 413 line that
// differ are pinned in SyncLineTests.
//
// Every key here is fake. The tests read no Keychain item. No request leaves the process.

import XCTest

@MainActor
final class SyncAdvisoryUITests: XCTestCase {
    static let lineId = "sync-advisory"
    static let workingTabs = ["Packages", "Tally", "Orphaned"]

    // MARK: helpers

    func launch(status: Int) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed", "-ManifestUITestWidth", "375", "-ManifestUITestSyncStatus", String(status)]
        app.launch()
        return app
    }

    func line(_ app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: Self.lineId).firstMatch
    }

    func openTab(_ app: XCUIApplication, _ title: String) {
        app.tabBars.buttons[title].tap()
    }

    /// The line on the open tab, or a failed assertion that names it.
    func needLine(_ app: XCUIApplication, on tab: String) throws -> XCUIElement {
        let el = line(app)
        return try XCTUnwrap(el.waitForExistence(timeout: 10) ? el : nil, "\(Self.lineId) is missing on \(tab)")
    }

    // MARK: the cases

    // A 401 reaches the screen through the client. The same line shows on all three working screens.
    func testARefusedKeyShowsItsLineOnEveryWorkingScreen() throws {
        let app = launch(status: 401)
        var labels = Set<String>()
        for tab in Self.workingTabs {
            openTab(app, tab)
            let el = try needLine(app, on: tab)
            XCTAssertEqual(el.value as? String, "no-access", "the \(tab) line is the refused-key line")
            XCTAssertFalse(el.label.isEmpty, "the \(tab) line says something")
            labels.insert(el.label)
        }
        XCTAssertEqual(labels.count, 1, "one line, the same on every working screen. Got \(labels)")
    }

    // A 413 is its own line, not the refused-key line and not "could not be reached".
    func testATooBigLedgerShowsItsOwnLine() throws {
        let app = launch(status: 413)
        openTab(app, "Packages")
        let el = try needLine(app, on: "Packages")
        XCTAssertEqual(el.value as? String, "too-big")
        XCTAssertFalse(el.label.isEmpty)
    }

    // The Ledger tab shows the Sync state in its own row, not this line.
    func testTheLineIsNotOnTheLedgerTab() throws {
        let app = launch(status: 401)
        openTab(app, "Packages")
        _ = try needLine(app, on: "Packages")
        openTab(app, "Ledger")
        XCTAssertTrue(app.buttons["backup"].waitForExistence(timeout: 5), "anchor: the Ledger tab is open")
        XCTAssertFalse(line(app).exists, "the line does not show on the Ledger tab")
    }

    // A server with nothing stored is healthy. No line. The sync call is asynchronous, so the screens wait
    // for as long as the failing cases needed before they claim there is none (a bounded fence).
    func testAnEmptyStoreShowsNoLine() throws {
        let app = launch(status: 404)
        for tab in Self.workingTabs {
            openTab(app, tab)
            XCTAssertFalse(line(app).waitForExistence(timeout: 4), "no failure, no line on \(tab)")
        }
    }
}
