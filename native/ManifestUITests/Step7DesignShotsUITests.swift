// Design shots for the design reviewer (restyle step 7): the Packages card and the open Tally row, each state at 375 and
// at 320, the stress width where the labels wrap. Each shot is an XCTAttachment kept past the run, named
// step7-<width>-<state>, and read from the result bundle.
//
// The states: Packages at rest, Clear armed, Undo shown, a done card and a stamped card; the Tally row open, with a copy
// in, with Clear armed and with Undo shown. A device-width pass shoots the same nine states with no forced width, named
// step7-device-<state>, for the folded Duo at its own width. Each device-width state is its own test method, so
// -only-testing selects one.
//
// A state is reached by the taps PackageBulkUITests makes, and each asserts that the elements it shows exist before its
// shot. Nothing else is asserted: no frame, no colour, and a label only where a check-in must land. Clear shows only while
// a copy is in, so the rest shots take one hand check-in first. An armed ask lapses 4 seconds after its tap, so its shot
// follows the tap at once.
//
// The identifiers and seed keys are PackageBulkUITests' contract, and the steps are ScreenKit's. Every key here is fake.
// The tests read no Keychain item.

import XCTest

@MainActor
final class Step7DesignShotsUITests: XCTestCase {
    static let widths = [375, 320]
    static let gk = PackageBulkUITests.a1  // the A1 card: Lightning Bolt, Counterspell and Brainstorm
    static let row = "Brainstorm"  // the Tally row the Tally states open

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    // MARK: launch and reveal

    /// The Packages tab, with the A1 card whole on screen. A nil width runs at the device's own width. It stops the test when
    /// the card is not there, so no shot of another tab is kept. `everything` sets Showing to Everything first, for a state
    /// whose Mark all or check-ins complete the card; the rest shots keep the Unreceived default a launch starts on.
    func packagesWithA1(_ width: Int?, everything: Bool = false) -> XCUIApplication {
        let app = ScreenKit.launch(width: width)  // taps the Packages tab
        if everything { ScreenKit.showEverything(app) }
        let card = "package-row:\(Self.gk)"
        XCTAssertTrue(ScreenKit.mount(app, card), "\(card) is missing: the Packages tab is not up at \(Self.widthName(width))")
        revealCard(app)
        return app
    }

    func revealCard(_ app: XCUIApplication) {
        app.reveal(ScreenKit.el(app, "package-row:\(Self.gk)"), whole: true)
    }

    /// The Tally tab with the Brainstorm row open and its copies listed. `everything` as packagesWithA1.
    func tallyWithRowOpen(_ width: Int?, everything: Bool = false) -> XCUIApplication {
        let app = ScreenKit.launch(width: width, tab: "Tally")
        if everything { ScreenKit.showEverything(app, then: "Tally") }
        assertShown(app, ["tally-toggle:\(Self.row)"])
        ScreenKit.openTallyRow(app, Self.row, copy: PackageBulkUITests.brainA)
        return app
    }

    /// The open Tally row with one copy checked in by hand, and the whole row on screen.
    func tallyWithCopyIn(_ width: Int?, everything: Bool = false) -> XCUIApplication {
        let app = tallyWithRowOpen(width, everything: everything)
        ScreenKit.checkIn(app, PackageBulkUITests.brainA, prefix: "tally-checkin:")
        app.reveal(ScreenKit.el(app, "tally-row:\(Self.row)"), whole: true)
        return app
    }

    // MARK: names

    static func widthName(_ width: Int?) -> String { width.map { "\($0)pt" } ?? "the device width" }

    /// step7-<width>-<state>, or step7-device-<state> at the device's own width.
    static func shotName(_ width: Int?, _ state: String) -> String {
        "step7-\(width.map { String($0) } ?? "device")-\(state)"
    }

    /// Each id exists now. A shot is kept only when the state it shows is on screen.
    func assertShown(_ app: XCUIApplication, _ ids: [String], file: StaticString = #filePath, line: UInt = #line) {
        for id in ids {
            XCTAssertTrue(ScreenKit.el(app, id).waitForExistence(timeout: 5), "\(id) is missing from the state this shot shows",
                          file: file, line: line)
        }
    }

    // MARK: the Packages card

    /// Packages at rest: the A1 card with one copy in, so Clear shows beside Mark all, with the Stamp slot and the bulk row.
    func packagesAtRest(_ width: Int?) {
        let app = packagesWithA1(width)
        ScreenKit.checkIn(app, PackageBulkUITests.bolt)
        assertShown(app, ["stamp-slot:\(Self.gk)", "stamp-button:\(Self.gk)", "bulk-row:\(Self.gk)",
                          "bulk-mark:\(Self.gk)", "bulk-clear:\(Self.gk)"])
        ScreenKit.attach(app, Self.shotName(width, "packages-rest"), to: self)
        app.terminate()
    }

    /// Clear armed: one tap on Clear, and the ask is up. The shot follows the tap, inside the ask's 4 seconds.
    func packagesClearArmed(_ width: Int?) {
        let app = packagesWithA1(width)
        ScreenKit.checkIn(app, PackageBulkUITests.bolt)
        ScreenKit.tap(app, "bulk-clear:\(Self.gk)")
        assertShown(app, ["bulk-clear-confirm:\(Self.gk)", "bulk-clear-cancel:\(Self.gk)"])
        ScreenKit.attach(app, Self.shotName(width, "packages-clear-armed"), to: self)
        app.terminate()
    }

    /// Undo shown: Mark all checked in the card's lines, and its slot now reads Undo mark all.
    func packagesUndo(_ width: Int?) {
        let app = packagesWithA1(width, everything: true)
        ScreenKit.tap(app, "bulk-mark:\(Self.gk)")
        assertShown(app, ["bulk-undo:\(Self.gk)"])
        ScreenKit.wait("label BEGINSWITH 'Undo check in'", for: ScreenKit.el(app, "checkin:\(PackageBulkUITests.brain)"),
                       "Mark all did not check in Brainstorm at \(Self.widthName(width))")
        ScreenKit.attach(app, Self.shotName(width, "packages-undo"), to: self)
        app.terminate()
    }

    /// A done card: every line checked in by hand, so the Mark all slot is hidden and Clear stays in place.
    func packagesDone(_ width: Int?) {
        let app = packagesWithA1(width, everything: true)
        for key in [PackageBulkUITests.bolt, PackageBulkUITests.counter, PackageBulkUITests.brain] {
            ScreenKit.checkIn(app, key)
        }
        ScreenKit.wait("exists == false", for: ScreenKit.el(app, "bulk-mark:\(Self.gk)"),
                       "Mark all stays on a whole card at \(Self.widthName(width))")
        assertShown(app, ["bulk-row:\(Self.gk)", "bulk-clear:\(Self.gk)"])
        ScreenKit.attach(app, Self.shotName(width, "packages-done"), to: self)
        app.terminate()
    }

    /// A stamped card: the stamp band in the Stamp slot, and the bulk row under it with Mark all, as ScreenKit.stamp leaves it.
    func packagesStamped(_ width: Int?) {
        let app = packagesWithA1(width)
        ScreenKit.stamp(app, Self.gk, kind: "claim")
        revealCard(app)
        assertShown(app, ["stamp-slot:\(Self.gk)", "stamp-band:\(Self.gk)", "bulk-row:\(Self.gk)", "bulk-mark:\(Self.gk)"])
        ScreenKit.attach(app, Self.shotName(width, "packages-stamped"), to: self)
        app.terminate()
    }

    // MARK: the open Tally row

    /// The Brainstorm row open with nothing in: Mark all shows, Clear does not.
    func tallyOpenRow(_ width: Int?) {
        let app = tallyWithRowOpen(width)
        assertShown(app, ["tally-bulk-row:\(Self.row)", "tally-bulk-mark:\(Self.row)"])
        ScreenKit.attach(app, Self.shotName(width, "tally-open-row"), to: self)
        app.terminate()
    }

    /// The same row with one copy checked in: Mark all and Clear both show.
    func tallyCopiesIn(_ width: Int?) {
        let app = tallyWithCopyIn(width)
        assertShown(app, ["tally-bulk-mark:\(Self.row)", "tally-bulk-clear:\(Self.row)"])
        ScreenKit.attach(app, Self.shotName(width, "tally-copies-in"), to: self)
        app.terminate()
    }

    /// The same row, Clear tapped once: the ask is up. The shot follows the tap, inside the ask's 4 seconds.
    func tallyClearArmed(_ width: Int?) {
        let app = tallyWithCopyIn(width)
        ScreenKit.tap(app, "tally-bulk-clear:\(Self.row)")
        assertShown(app, ["tally-bulk-clear-confirm:\(Self.row)", "tally-bulk-clear-cancel:\(Self.row)"])
        ScreenKit.attach(app, Self.shotName(width, "tally-clear-armed"), to: self)
        app.terminate()
    }

    /// The same row after Mark all: Mark all checks in the second copy, and its slot now reads Undo.
    func tallyUndo(_ width: Int?) {
        let app = tallyWithCopyIn(width, everything: true)
        ScreenKit.tap(app, "tally-bulk-mark:\(Self.row)")
        assertShown(app, ["tally-bulk-undo:\(Self.row)"])
        ScreenKit.wait("label BEGINSWITH 'Undo check in'", for: ScreenKit.el(app, "tally-checkin:\(PackageBulkUITests.brainB)"),
                       "Mark all did not check in the second Brainstorm copy at \(Self.widthName(width))")
        ScreenKit.attach(app, Self.shotName(width, "tally-undo"), to: self)
        app.terminate()
    }

    // MARK: the widths: each state at 375 and at 320

    func testPackagesAtRestShots() throws { for w in Self.widths { packagesAtRest(w) } }
    func testPackagesClearArmedShots() throws { for w in Self.widths { packagesClearArmed(w) } }
    func testPackagesUndoShownAfterMarkAllShots() throws { for w in Self.widths { packagesUndo(w) } }
    func testPackagesDoneCardShots() throws { for w in Self.widths { packagesDone(w) } }
    func testPackagesStampedShots() throws { for w in Self.widths { packagesStamped(w) } }
    func testTallyOpenRowShots() throws { for w in Self.widths { tallyOpenRow(w) } }
    func testTallyCopiesInShots() throws { for w in Self.widths { tallyCopiesIn(w) } }
    func testTallyClearArmedShots() throws { for w in Self.widths { tallyClearArmed(w) } }
    func testTallyUndoShots() throws { for w in Self.widths { tallyUndo(w) } }

    // MARK: the device-width pass: each state at the device's own width, with no forced width. One method a state.

    func testDeviceWidthPackagesAtRestShot() throws { packagesAtRest(nil) }
    func testDeviceWidthPackagesClearArmedShot() throws { packagesClearArmed(nil) }
    func testDeviceWidthPackagesUndoShot() throws { packagesUndo(nil) }
    func testDeviceWidthPackagesDoneCardShot() throws { packagesDone(nil) }
    func testDeviceWidthPackagesStampedShot() throws { packagesStamped(nil) }
    func testDeviceWidthTallyOpenRowShot() throws { tallyOpenRow(nil) }
    func testDeviceWidthTallyCopiesInShot() throws { tallyCopiesIn(nil) }
    func testDeviceWidthTallyClearArmedShot() throws { tallyClearArmed(nil) }
    func testDeviceWidthTallyUndoShot() throws { tallyUndo(nil) }
}
