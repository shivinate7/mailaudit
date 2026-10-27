// Package card paint, on screen (lane N15, native-build-lanes, card-the-bar-is-out-of-flow,
// no-layout-shift-under-pointer, order-id-button-stops-propagate). The strings and the tokens are
// pinned in ManifestKit (PackageCard*Tests); these cases pin what only the screen can show: the
// link is there and big enough, the bar mounts and leaves without moving anything, and the pill
// on screen reads the model's text.
//
// Red-first. The builder makes these pass. The tests read no colour: XCUITest cannot.
//
// Contract the tests name, besides the identifiers of PackagesShellUITests:
//   order-link:<gk>   one per package, an XCUIElement of type link whose label holds the order id and
//                     "TCGplayer". At least 44pt each way, and inside its package row. A tap on it
//                     must not check anything in (never tapped here: it would leave the app).
//   card-bar:<gk>     the card's progress bar, in the hierarchy only while the package has some but
//                     not all copies in. It lies inside the package row, under 8pt tall. It carries a
//                     label such as "1 of 4 copies in", so the accessibility audit finds it described.
//                     If that audit still flags the 3pt bar, hide it and drop the presence checks here;
//                     PackagesModel.bars still pins when it shows.
//   card-pill:<gk>    the "N left · $X" pill; its label is the pill text. Absent when nothing is owed.
//   got-qty:<line key> the mono got/qty read-out of a line with more than one copy. Its label or its
//                     value reads "got/qty", as the web stepper prints it. Absent on a one-copy line.
// Launch arguments are the shell tests': -ManifestUITestSeed, -ManifestUITestWidth.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class PackageCardUITests: XCTestCase {
    static let package = "A1::Alpha Cards"
    // Lightning Bolt 1 copy, Counterspell 1 copy, Brainstorm 2 copies: a tap checks a line's full quantity,
    // so the three taps leave 1, 2 and then all 4 of the 4 copies in.
    static let lines = ["A1|0|pLightningBolt", "A1|1|pCounterspell", "A1|2|pBrainstorm"]
    static let minHit: CGFloat = 44

    // MARK: helpers

    func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed", "-ManifestUITestWidth", "375"]
        app.launch()
        app.tabBars.buttons["Packages"].tap()
        return app
    }

    func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// Every package row, check-in control and order link, by identifier.
    func frames(_ app: XCUIApplication) -> [String: CGRect] {
        var out: [String: CGRect] = [:]
        for prefix in ["package-row:", "checkin:", "order-link:"] {
            let found = app.descendants(matching: .any)
                .matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix)).allElementsBoundByIndex
            for el in found { out[el.identifier] = el.frame }
        }
        return out
    }

    func wait(_ predicate: String, for el: XCUIElement, _ message: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: el)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, message)
    }

    // MARK: the order link

    /// Every package has a link to TCGplayer: a real link element, named for its order, 44pt each way, in its card.
    func testEveryPackageHasAnOrderLinkInsideItsCard() throws {
        let app = launch()
        XCTAssertTrue(element(app, "package-row:\(Self.package)").waitForExistence(timeout: 5), "the Packages rows did not load")
        let rows = app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH %@", "package-row:")).allElementsBoundByIndex
        XCTAssertGreaterThanOrEqual(rows.count, 4, "the fixture holds four packages")
        for row in rows {
            let gk = String(row.identifier.dropFirst("package-row:".count))
            let orderId = String(gk.split(separator: ":", maxSplits: 1).first ?? "")
            let link = element(app, "order-link:\(gk)")
            XCTAssertTrue(link.exists, "no order link for \(gk)")
            XCTAssertEqual(link.elementType, .link, "the order id for \(gk) must be a link element")
            XCTAssertTrue(link.label.contains(orderId) && link.label.contains("TCGplayer"),
                          "the link label \(link.label.debugDescription) should name order \(orderId) and TCGplayer")
            XCTAssertGreaterThanOrEqual(link.frame.width, Self.minHit, "the link for \(gk) is narrower than 44pt")
            XCTAssertGreaterThanOrEqual(link.frame.height, Self.minHit, "the link for \(gk) is shorter than 44pt")
            XCTAssertTrue(row.frame.insetBy(dx: -1, dy: -1).contains(link.frame), "the link for \(gk) lies outside its card")
        }
    }

    // MARK: the bar, the pill and the layout through a package's three taps

    /// Checking the lines of A1 in one by one: nothing moves, not the link, not any row, not the tapped
    /// control; the bar is there after the first and second tap and gone once the package is complete;
    /// the pill reads the model's text and goes with the last copy.
    func testCheckInsMoveNothingWhileTheBarComesAndGoes() throws {
        let app = launch()
        let gk = Self.package
        let bar = element(app, "card-bar:\(gk)"), pill = element(app, "card-pill:\(gk)")
        let row = element(app, "package-row:\(gk)")
        XCTAssertTrue(row.waitForExistence(timeout: 5), "the A1 row is missing")

        XCTAssertFalse(bar.exists, "nothing is in yet: no bar")
        XCTAssertEqual(pill.label, "4 left \u{00B7} $4.00", "the pill at rest")
        var previous = frames(app)
        XCTAssertNotNil(previous["order-link:\(gk)"], "the order link is missing, so the shift check below would skip it")

        let pills = ["3 left \u{00B7} $3.00", "2 left \u{00B7} $1.00"]  // Lightning in, then Counterspell in
        for (i, key) in Self.lines.enumerated() {
            let control = element(app, "checkin:\(key)")
            XCTAssertTrue(control.waitForExistence(timeout: 5), "the check-in control \(key) is missing")
            control.tap()
            wait("label BEGINSWITH 'Undo check in'", for: control, "the check-in of \(key) did not land")

            let now = frames(app)
            for (id, frame) in previous {
                XCTAssertEqual(now[id], frame, "\(id) moved when \(key) was checked in")
            }
            previous = now

            if i < 2 {
                XCTAssertTrue(bar.waitForExistence(timeout: 3), "some but not all copies are in after \(key): the bar must be drawn")
                XCTAssertTrue(row.frame.insetBy(dx: -1, dy: -1).contains(bar.frame), "the bar lies outside its card")
                XCTAssertLessThan(bar.frame.height, 8, "the bar is a rule on the card's edge, not a row")
                XCTAssertEqual(pill.label, pills[i], "the pill after \(key)")
            } else {
                wait("exists == false", for: bar, "every copy is in: no bar at 100%")
                wait("exists == false", for: pill, "every copy is in: no pill")
            }
        }
    }

    // MARK: the got/qty read-out

    /// The mono got/qty read-out shows on a line with more than one copy, as the web stepper prints it.
    /// Brainstorm (qty 2) reads 0/2 at rest and 2/2 once checked in. Lightning Bolt and Counterspell
    /// (qty 1) have no read-out. The shared fixture holds no qty-3 line, so the 1/3 form is not here.
    func testMultiCopyLinesShowGotOverQtyAndSingleCopyLinesShowNone() throws {
        let app = launch()
        let brainstorm = "A1|2|pBrainstorm"
        XCTAssertTrue(element(app, "package-row:\(Self.package)").waitForExistence(timeout: 5), "the A1 row is missing")

        /// The read-out's label and value, or no entries when the line has no read-out.
        func readout(_ key: String) -> [String] {
            let el = element(app, "got-qty:\(key)")
            guard el.exists else { return [] }
            return [el.label, (el.value as? String) ?? ""]
        }

        XCTAssertTrue(readout(brainstorm).contains("0/2"), "Brainstorm has 2 copies: its read-out reads 0/2 at rest, got \(readout(brainstorm))")
        let control = element(app, "checkin:\(brainstorm)")
        XCTAssertTrue(control.waitForExistence(timeout: 5), "the check-in control for Brainstorm is missing")
        control.tap()
        wait("label BEGINSWITH 'Undo check in'", for: control, "the Brainstorm check-in did not land")
        XCTAssertTrue(readout(brainstorm).contains("2/2"), "both copies in: the read-out reads 2/2, got \(readout(brainstorm))")

        for key in ["A1|0|pLightningBolt", "A1|1|pCounterspell"] {
            XCTAssertEqual(readout(key), [], "\(key) has one copy and shows no read-out")
        }
    }
}
