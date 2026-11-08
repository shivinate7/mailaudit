// Design shots for the design reviewer (restyle step 7): the Packages card in five states, and the open Tally row, each at
// 375 and at 320, the stress width where the labels wrap. Each shot is an XCTAttachment kept past the run, named
// step7-<width>-<state>, and read from the result bundle.
//
// A state is reached by the taps PackageBulkUITests makes, and each asserts that the elements it shows exist before its
// shot. Nothing else is asserted: no frame, no colour, no label beyond existence. Clear shows only while a copy is in, so the
// rest shot takes one hand check-in first. An armed ask lapses 4 seconds after its tap, so its shot follows the tap at once.
//
// The identifiers and seed keys are PackageBulkUITests' contract, and the steps are ScreenKit's. Every key here is fake.
// The tests read no Keychain item.

import XCTest

@MainActor
final class Step7DesignShotsUITests: XCTestCase {
    static let widths = [375, 320]
    static let gk = PackageBulkUITests.a1  // the A1 card: Lightning Bolt, Counterspell and Brainstorm

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    /// The Packages tab, with the A1 card whole on screen. It stops the test when the card is not there, so no shot of
    /// another tab is kept.
    func packagesWithA1(_ width: Int) -> XCUIApplication {
        let app = ScreenKit.launch(width: width)  // taps the Packages tab
        let card = "package-row:\(Self.gk)"
        XCTAssertTrue(ScreenKit.mount(app, card), "\(card) is missing: the Packages tab is not up at \(width)pt")
        app.reveal(ScreenKit.el(app, card), whole: true)
        return app
    }

    /// Each id exists now. A shot is kept only when the state it shows is on screen.
    func assertShown(_ app: XCUIApplication, _ ids: [String], file: StaticString = #filePath, line: UInt = #line) {
        for id in ids {
            XCTAssertTrue(ScreenKit.el(app, id).waitForExistence(timeout: 5), "\(id) is missing from the state this shot shows",
                          file: file, line: line)
        }
    }

    /// 1. Packages at rest: the A1 card with one copy in, so Clear shows beside Mark all, with the Stamp slot and the bulk row.
    func testPackagesAtRestShots() throws {
        for width in Self.widths {
            let app = packagesWithA1(width)
            ScreenKit.checkIn(app, PackageBulkUITests.bolt)
            assertShown(app, ["stamp-slot:\(Self.gk)", "stamp-button:\(Self.gk)", "bulk-row:\(Self.gk)",
                              "bulk-mark:\(Self.gk)", "bulk-clear:\(Self.gk)"])
            ScreenKit.attach(app, "step7-\(width)-packages-rest", to: self)
            app.terminate()
        }
    }

    /// 2. Clear armed: one tap on Clear, and the ask is up. The shot follows the tap, inside the ask's 4 seconds.
    func testPackagesClearArmedShots() throws {
        for width in Self.widths {
            let app = packagesWithA1(width)
            ScreenKit.checkIn(app, PackageBulkUITests.bolt)
            ScreenKit.tap(app, "bulk-clear:\(Self.gk)")
            assertShown(app, ["bulk-clear-confirm:\(Self.gk)", "bulk-clear-cancel:\(Self.gk)"])
            ScreenKit.attach(app, "step7-\(width)-packages-clear-armed", to: self)
            app.terminate()
        }
    }

    /// 3. Undo shown: Mark all checked in the card's lines, and its slot now reads Undo mark all.
    func testPackagesUndoShownAfterMarkAllShots() throws {
        for width in Self.widths {
            let app = packagesWithA1(width)
            ScreenKit.tap(app, "bulk-mark:\(Self.gk)")
            assertShown(app, ["bulk-undo:\(Self.gk)"])
            ScreenKit.wait("label BEGINSWITH 'Undo check in'", for: ScreenKit.el(app, "checkin:\(PackageBulkUITests.brain)"),
                           "Mark all did not check in Brainstorm at \(width)pt")
            ScreenKit.attach(app, "step7-\(width)-packages-undo", to: self)
            app.terminate()
        }
    }

    /// 4. A done card: every line checked in by hand, so the Mark all slot is hidden and Clear stays in place.
    func testPackagesDoneCardShots() throws {
        for width in Self.widths {
            let app = packagesWithA1(width)
            for key in [PackageBulkUITests.bolt, PackageBulkUITests.counter, PackageBulkUITests.brain] {
                ScreenKit.checkIn(app, key)
            }
            ScreenKit.wait("exists == false", for: ScreenKit.el(app, "bulk-mark:\(Self.gk)"), "Mark all stays on a whole card at \(width)pt")
            assertShown(app, ["bulk-row:\(Self.gk)", "bulk-clear:\(Self.gk)"])
            ScreenKit.attach(app, "step7-\(width)-packages-done", to: self)
            app.terminate()
        }
    }

    /// 5. The Tally tab with the Brainstorm row open: its copies list, and its bulk row shows Mark all. Nothing is in yet.
    func testTallyOpenRowShots() throws {
        for width in Self.widths {
            let app = ScreenKit.launch(width: width, tab: "Tally")
            assertShown(app, ["tally-toggle:Brainstorm"])
            ScreenKit.openTallyRow(app, "Brainstorm", copy: PackageBulkUITests.brainA)
            assertShown(app, ["tally-bulk-row:Brainstorm", "tally-bulk-mark:Brainstorm"])
            ScreenKit.attach(app, "step7-\(width)-tally-open-row", to: self)
            app.terminate()
        }
    }
}
