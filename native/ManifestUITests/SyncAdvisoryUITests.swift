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

import UIKit
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

    // MARK: where the line sits

    /// The 375pt frame the launch argument sets, the web's 16pt column gutter, the portrait safe-area top of the one
    /// simulator (iPhone 18 Pro: the line's own top edge sits there on a correct build, because the line is a top
    /// safe-area inset), and the half point a frame's float noise is allowed.
    static let column: CGFloat = 375, gutter: CGFloat = 16, safeTop: CGFloat = 62, slack: CGFloat = 0.5

    /// The web draws the line inset to its 16pt column, never edge to edge, and never above the safe area.
    func testTheLineSitsInsideTheGuttersAndBelowTheSafeAreaTop() throws {
        let app = launch(status: 401)
        let left = (app.windows.firstMatch.frame.width - Self.column) / 2 + Self.gutter
        let right = left + Self.column - 2 * Self.gutter
        for tab in Self.workingTabs {
            openTab(app, tab)
            let frame = try needLine(app, on: tab).frame
            XCTAssertGreaterThanOrEqual(frame.minX, left - Self.slack, "the \(tab) line starts at \(frame.minX), left of the gutter at \(left)")
            XCTAssertLessThanOrEqual(frame.maxX, right + Self.slack, "the \(tab) line ends at \(frame.maxX), right of the gutter at \(right)")
            XCTAssertGreaterThanOrEqual(frame.minY, Self.safeTop - Self.slack, "the \(tab) line starts at \(frame.minY), above the safe area at \(Self.safeTop)")
        }
    }

    /// The frame is not the paint: a fill drawn on the line extends behind the status bar unless it is held back.
    /// So this reads two pixels of a screenshot, at the line's left padding: one inside the line (the anchor, which
    /// must be the manila token, or the colour match proves nothing) and one in the status-bar band, which must not be.
    func testTheLinePaintsNothingUnderTheStatusBar() throws {
        let app = launch(status: 401)
        for tab in Self.workingTabs {
            openTab(app, tab)
            let frame = try needLine(app, on: tab).frame
            let shot = app.screenshot().image
            let x = frame.minX + 4
            let inside = Self.rgb(of: shot, at: CGPoint(x: x, y: frame.midY))
            let band = Self.rgb(of: shot, at: CGPoint(x: x, y: 6))
            add(XCTAttachment(string: "\(tab): inside the line \(inside), status-bar band \(band), manila \(Self.manila)"))
            XCTAssertTrue(Self.isManila(inside), "anchor: the pixel inside the \(tab) line is \(inside), not the manila token \(Self.manila)")
            XCTAssertFalse(Self.isManila(band), "the \(tab) line paints manila under the status bar: the pixel at y=6 is \(band)")
        }
    }

    /// The manila token (shared/tokens.json), as sRGB bytes.
    static let manila = (r: 234, g: 219, b: 186)

    static func isManila(_ p: (r: Int, g: Int, b: Int)) -> Bool {
        abs(p.r - manila.r) <= 4 && abs(p.g - manila.g) <= 4 && abs(p.b - manila.b) <= 4
    }

    /// The sRGB bytes of the pixel at a point (in points) of a screenshot; (-1, -1, -1) when it cannot be read.
    static func rgb(of image: UIImage, at point: CGPoint) -> (r: Int, g: Int, b: Int) {
        let pixel = CGRect(x: (point.x * image.scale).rounded(.down), y: (point.y * image.scale).rounded(.down), width: 1, height: 1)
        guard let one = image.cgImage?.cropping(to: pixel), let space = CGColorSpace(name: CGColorSpace.sRGB) else { return (-1, -1, -1) }
        var bytes = [UInt8](repeating: 0, count: 4)
        let drawn: Bool = bytes.withUnsafeMutableBytes { raw in
            guard let context = CGContext(data: raw.baseAddress, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4, space: space,
                                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
            context.draw(one, in: CGRect(x: 0, y: 0, width: 1, height: 1))
            return true
        }
        return drawn ? (Int(bytes[0]), Int(bytes[1]), Int(bytes[2])) : (-1, -1, -1)
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
