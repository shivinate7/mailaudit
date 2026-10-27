// Ledger tab UI tests for step 4: the Sync row and panel, the Data order, and the History row layout
// (ledger-tab-holds-options, sync-panel-is-two-column-grid, sync-particulars-ruled-values,
// history-sync-close-each-other, native-parity-table, native-key-via-url-scheme, no-layout-shift-under-pointer).
//
// Red-first and NOT RUN by the test-author (another agent holds the one simulator, one-simulator-per-mac). The builder
// runs them red before building, then green. They compile against this branch and fail on a missing element.
// Colour is pinned in ManifestKitTests (LedgerPaint); these tests pin what needs the screen.
//
// Contract the tests name (the builder implements it). Everything is on the Ledger tab:
//   sync            the Sync row, in the Data group before History and Backup. A button labelled "Sync". Its value is
//                   "collapsed" or "expanded", as `history`'s is. Its hit region is at least 44pt by 44pt.
//   sync-value      the row's value text. Its label is "On" when healthy, "Set up" with no key, and "Check" for
//                   any other failure (the web's LedgerRow value).
//   sync-server     the panel's Server value text. Its label is the web's serverStatus, for example "Sync key refused".
//   sync-last       the panel's Last sync value text. Its label is "Not yet", or the short date and time.
//   The panel also has a "Server" and a "Last sync" label (case does not matter). It has no key row: no text field,
//   no secure field and no "Save sync key" button, because the key arrives by URL scheme.
//   Sync and History close each other: opening one closes the other.
//   version-when:<id>, version-label:<id>, version-figure:<id>   in an open History row, the time, the label and the
//                   lines/checked figure on ONE line, left to right in that order.
//
// Launch arguments: -ManifestUITestSeed, -ManifestUITestWidth <pt>, and for the Sync row
// -ManifestUITestSyncStatus <http status> (the real client on an in-process stub; 401 gives "no-access", 404 is a healthy
// empty server). With no -ManifestUITestSyncStatus there is no client, and these tests do not ask about the row.
// -ManifestUITestCorruptVersion puts one saved version in History (label "before import").
//
// Every key here is fake. The tests read no Keychain item. No request leaves the process.

import XCTest

@MainActor
final class LedgerSyncUITests: XCTestCase {
    static let minHit: CGFloat = 44

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    // MARK: helpers

    func launch(status: Int? = nil, width: Int = 375, version: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed", "-ManifestUITestWidth", String(width)]
        if let status { args += ["-ManifestUITestSyncStatus", String(status)] }
        if version { args += ["-ManifestUITestCorruptVersion"] }
        app.launchArguments = args
        app.launch()
        app.tabBars.buttons["Ledger"].tap()
        return app
    }

    func el(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// The element, scrolled into reach, or a failed assertion that names it.
    func need(_ app: XCUIApplication, _ id: String) throws -> XCUIElement {
        let found = try XCTUnwrap(el(app, id).waitForExistence(timeout: 10) ? el(app, id) : nil, "\(id) is missing")
        app.reveal(found)
        return found
    }

    func wait(_ format: String, for found: XCUIElement, _ message: String, timeout: Double = 10) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: format), object: found)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: timeout), .completed, message)
    }

    // MARK: the Data group

    /// The web's Data order, without Re-import: Sync, History, Backup (CSV import stays on the web).
    func testTheDataGroupListsSyncHistoryAndBackupInThatOrder() throws {
        let app = launch(status: 404)
        let sync = try need(app, "sync")
        let history = try need(app, "history")
        let backup = try need(app, "backup")
        XCTAssertLessThan(sync.frame.minY, history.frame.minY, "Sync sits above History")
        XCTAssertLessThan(history.frame.minY, backup.frame.minY, "History sits above Backup")
        XCTAssertGreaterThanOrEqual(sync.frame.height, Self.minHit, "the Sync row is under 44pt tall")
    }

    // MARK: the row value

    func testAHealthyServerReadsOn() throws {
        let app = launch(status: 404)
        let value = try need(app, "sync-value")
        wait("label == 'On'", for: value, "a healthy server reads On, got \(value.label)")
    }

    func testARefusedKeyReadsCheck() throws {
        let app = launch(status: 401)
        let value = try need(app, "sync-value")
        wait("label == 'Check'", for: value, "a refused key reads Check, got \(value.label)")
    }

    // MARK: the panel

    /// Server and Last sync, and nothing to type: the key arrives by URL.
    func testThePanelShowsServerAndLastSyncAndNoKeyRow() throws {
        let app = launch(status: 401)
        let sync = try need(app, "sync")
        XCTAssertEqual(sync.value as? String, "collapsed")
        sync.tap()
        XCTAssertEqual(sync.value as? String, "expanded")

        let server = try need(app, "sync-server")
        wait("label == 'Sync key refused'", for: server, "the Server value follows the client, got \(server.label)")
        let last = try need(app, "sync-last")
        wait("label == 'Not yet'", for: last, "a refused key has never agreed, got \(last.label)")

        for name in ["Server", "Last sync"] {
            let label = app.staticTexts.matching(NSPredicate(format: "label ==[c] %@", name)).firstMatch
            XCTAssertTrue(label.exists, "the panel has no \(name) label")
        }
        XCTAssertEqual(app.textFields.count, 0, "the panel has a text field, but the key arrives by URL")
        XCTAssertEqual(app.secureTextFields.count, 0, "the panel has a secure field, but the key arrives by URL")
        XCTAssertFalse(app.buttons["Save sync key"].exists, "the panel has a Save sync key button")
    }

    /// A healthy server has agreed, so Last sync is a time and Server reads Connected.
    func testAHealthyServerShowsATimeAndConnected() throws {
        let app = launch(status: 404)
        try need(app, "sync").tap()
        let server = try need(app, "sync-server")
        wait("label == 'Connected'", for: server, "a healthy server reads Connected, got \(server.label)")
        let last = try need(app, "sync-last")
        wait("label != 'Not yet' AND label != ''", for: last, "Last sync still reads Not yet after a healthy reply")
    }

    /// Opening Sync closes History, and opening History closes Sync.
    func testSyncAndHistoryCloseEachOther() throws {
        let app = launch(status: 404)
        let sync = try need(app, "sync")
        let history = try need(app, "history")
        sync.tap()
        XCTAssertTrue(el(app, "sync-server").waitForExistence(timeout: 5), "the Sync panel did not open")
        history.tap()
        XCTAssertEqual(history.value as? String, "expanded")
        XCTAssertEqual(sync.value as? String, "collapsed", "opening History left Sync open")
        XCTAssertFalse(el(app, "sync-server").exists, "the Sync panel stayed on screen under History")
        sync.tap()
        XCTAssertEqual(sync.value as? String, "expanded")
        XCTAssertEqual(history.value as? String, "collapsed", "opening Sync left History open")
    }

    // MARK: the History row

    /// The web's version row is one line: time, label, then the figure at the right. Native drew two lines.
    func testAVersionRowIsOneLineAtEveryWidth() throws {
        for width in [375, 320] {
            let app = launch(width: width, version: true)
            try need(app, "history").tap()
            let when = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "version-when:")).firstMatch
            XCTAssertTrue(when.waitForExistence(timeout: 5), "no version-when element at \(width)pt")
            guard when.exists else { return }
            let id = String(when.identifier.dropFirst("version-when:".count))
            let label = el(app, "version-label:\(id)")
            let figure = el(app, "version-figure:\(id)")
            XCTAssertTrue(label.exists && figure.exists, "the row has no label or figure element at \(width)pt")
            guard label.exists, figure.exists else { return }
            XCTAssertLessThan(abs(when.frame.midY - figure.frame.midY), 6, "time and figure are on two lines at \(width)pt")
            XCTAssertLessThan(abs(when.frame.midY - label.frame.midY), 6, "time and label are on two lines at \(width)pt")
            XCTAssertLessThanOrEqual(when.frame.maxX, label.frame.minX + 1, "the time is not left of the label at \(width)pt")
            XCTAssertLessThanOrEqual(label.frame.maxX, figure.frame.minX + 1, "the label is not left of the figure at \(width)pt")
            app.terminate()
        }
    }
}
