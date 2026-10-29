// Tally copy rows UI tests (step 4, tally-row-lists-its-copies, native-tally-copy-no-flags, no-layout-shift-under-pointer).
//
// A Tally copy is drawn by step 3's item line, lifted to take the line state, the title, the detail and the actions,
// so Packages and Tally call one view. The web draws the same ItemRow for a copy, and its stepper shows for qty > 1.
// Colour is pinned in ManifestKitTests (PackageCard.token); these tests pin what needs the screen.
//
// Red-first and NOT RUN by the test-author (another agent holds the one simulator, one-simulator-per-mac). The builder
// runs them red before building, then green. They compile against this branch and fail on a missing element.
//
// Contract the tests name (the builder implements it). On an open Tally row, a copy with qty > 1 carries the
// Packages stepper, with the Packages identifiers keyed by the copy's item key:
//   got-qty:<key>      the got/qty read-out. Its label is "0/2" at rest.
//   step-minus:<key>, step-plus:<key>   buttons.
// A copy with qty 1 has no stepper. The existing ids of TallyUITests (tally-row:, tally-toggle:, tally-copy:,
// tally-checkin:) stay as they are, so that suite keeps passing.
//
// The seed is the shared fixture. Brainstorm is two lines of qty 2 (A1|2 and B1|2). Lightning Bolt is three copies of 1.
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class TallyCopyStepperUITests: XCTestCase {
    static let brainstormA = "A1|2|pBrainstorm"
    static let boltA = "A1|0|pLightningBolt"

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    // MARK: helpers

    func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed", "-ManifestUITestWidth", "375"]
        app.launch()
        return app
    }

    func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// The Tally tab with one row open and its first copy on screen.
    func open(_ app: XCUIApplication, _ name: String, firstCopy: String) throws {
        let tab = app.tabBars.buttons["Tally"]
        XCTAssertTrue(tab.waitForExistence(timeout: 5), "the Tally tab is missing")
        tab.tap()
        let toggle = element(app, "tally-toggle:\(name)")
        XCTAssertTrue(toggle.waitForExistence(timeout: 5), "the header button tally-toggle:\(name) is missing")
        toggle.tap()
        let copy = element(app, "tally-copy:\(firstCopy)")
        XCTAssertTrue(copy.waitForExistence(timeout: 5), "row \(name) did not list its copies")
        app.reveal(copy)
    }

    func wait(_ format: String, for el: XCUIElement, _ message: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: format), object: el)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, message)
    }

    // MARK: the cases

    /// A copy of qty 2 has the Packages stepper under its detail line, and + and - move its count by one.
    func testACopyOfTwoHasTheStepper() throws {
        let app = launch()
        try open(app, "Brainstorm", firstCopy: Self.brainstormA)
        let key = Self.brainstormA
        let readout = element(app, "got-qty:\(key)")
        XCTAssertTrue(readout.waitForExistence(timeout: 3), "the Brainstorm copy has no got/qty read-out")
        XCTAssertEqual(readout.label, "0/2", "the copy reads 0/2 at rest")
        let plus = element(app, "step-plus:\(key)")
        let minus = element(app, "step-minus:\(key)")
        XCTAssertTrue(plus.waitForExistence(timeout: 3), "the Brainstorm copy has no + button")
        XCTAssertTrue(minus.waitForExistence(timeout: 3), "the Brainstorm copy has no - button")
        XCTAssertEqual(plus.elementType, .button)
        XCTAssertEqual(minus.elementType, .button)

        plus.tap()
        wait("label == '1/2'", for: readout, "+ did not raise the copy to 1/2")
        minus.tap()
        wait("label == '0/2'", for: readout, "- did not lower the copy to 0/2")
    }

    /// The stepper changes the count and nothing's size: a tap on + moves no row (no-layout-shift-under-pointer).
    func testTheStepperMovesNothing() throws {
        let app = launch()
        try open(app, "Brainstorm", firstCopy: Self.brainstormA)
        let key = Self.brainstormA
        let copy = element(app, "tally-copy:\(key)")
        let plus = element(app, "step-plus:\(key)")
        XCTAssertTrue(plus.waitForExistence(timeout: 3), "the Brainstorm copy has no + button")
        let before = [copy.frame, plus.frame]
        plus.tap()
        wait("label == '1/2'", for: element(app, "got-qty:\(key)"), "+ did not raise the copy to 1/2")
        XCTAssertEqual([copy.frame, plus.frame], before, "a tap on + moved the copy or the button")
    }

    /// A copy of qty 1 keeps its single check-in control and gets no stepper, as on the web.
    func testACopyOfOneHasNoStepper() throws {
        let app = launch()
        try open(app, "Lightning Bolt", firstCopy: Self.boltA)
        XCTAssertTrue(element(app, "tally-checkin:\(Self.boltA)").waitForExistence(timeout: 3), "the check-in control is missing")
        XCTAssertFalse(element(app, "step-plus:\(Self.boltA)").exists, "a qty 1 copy must have no + button")
        XCTAssertFalse(element(app, "got-qty:\(Self.boltA)").exists, "a qty 1 copy must have no read-out")
    }
}
