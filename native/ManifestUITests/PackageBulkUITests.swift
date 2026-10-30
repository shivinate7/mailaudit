// Mark all received and Clear check-ins on the Packages card and the open Tally row, on screen (step 7,
// undo-removes-only-its-delta, recent-checks-can-be-undone, no-layout-shift-under-pointer, no-native-dialogs,
// stamp-band-opens-the-editor, rules-run-in-javascriptcore).
//
// The rules are pinned in test/view-rules.test.mjs (V39) and the model calls in ManifestKit (BulkRulesTests,
// PackageBulkModelTests, TallyBulkModelTests). These cases pin what only the screen shows. Phone layout only, and the
// default text size: the stacked row at an accessibility size is the builder's to measure. The tests read no colour:
// XCUITest cannot.
//
// Red-first. The builder makes these pass. Every one fails today on a missing element. They compile with
// build-for-testing and run on the simulator later.
//
// The picks the cases carry (2026-10-29): Clear asks and Mark all offers Undo; a control that does not apply keeps its slot,
// hidden; step 6's one 48pt slot for Stamp or the band stays as it is and the bulk row sits under it (mockup option R-B), so
// a stamp's Save or Remove moves neither the slot nor the bulk row (no-layout-shift-under-pointer).
//
// Contract the tests name, besides the identifiers of PackageCardUITests, PackagesShellUITests and PackageStampUITests
// (package-row:<gk>, checkin:<key>, card-slot:<gk>, stamp-button:<gk>, stamp-band:<gk>, stamp-editor:<gk>, tally-cards).
// <gk> is "orderId::seller". On the Tally row <name> is the product name, and each id takes a "tally-" prefix, as the
// Tally's check-in does (tally-checkin:), so a query for one tab never meets the other.
//   stamp-slot:<gk>             step 6's 48pt slot, one container that holds the Stamp button or the band. There while the
//                               editor is closed. A new id: the slot had none.
//   bulk-row:<gk>               the bulk action row, one container under the stamp slot: only the two bulk slots, no Stamp.
//                               Its frame is the row's, the ask's top hangs below its bottom.
//   bulk-mark:<gk>              Mark all received. Only while a line is owed. 44pt each way.
//   bulk-undo:<gk>              Undo mark all, in Mark all's own slot (same frame), from the press until the next write
//                               on this device. Not there after a hand check-in, a Clear or a stamp.
//   bulk-clear:<gk>             Clear check-ins. Only while a copy is in. 44pt each way. The first tap arms it.
//   bulk-clear-confirm:<gk>     the armed ask's second tap. Its label is "Tap again to clear N check-ins", N the copies in
//                               now (not the lines in, not the card's total). 44pt each way.
//   bulk-clear-cancel:<gk>      Cancel in the ask. Its label is "Cancel". 44pt each way.
//   tally-bulk-row:<name>, tally-bulk-mark:<name>, tally-bulk-undo:<name>, tally-bulk-clear:<name>,
//   tally-bulk-clear-confirm:<name>, tally-bulk-clear-cancel:<name>   the same six on the open Tally row. Stamp is not there.
// A control that does not apply is hidden and keeps its slot: it is not in the accessibility tree (exists is false) and the
// control beside it does not move. The ask hangs below the row, and lapses after 4 seconds (stamp-band-opens-the-editor).
// Launch arguments are the shell tests': -ManifestUITestSeed, -ManifestUITestWidth.
//
// Readings the tests carry:
//   - The seed is the shared fixture: A1 / Alpha Cards holds Lightning Bolt (1), Counterspell (1) and Brainstorm (2), four
//     cards. Brainstorm is two lines of qty 2 on the Tally (A1 and B1), the Tally copies of A1 and B1 each qty 2.
//   - The ask reads Brainstorm alone in on A1: N is 2 copies, where the lines in are 1 and the card's total is 4. The three
//     readings differ, so the label tells which one the build counts. N = 1 reads "Tap again to clear 1 check-in", singular,
//     as the stamp ask reads "1 card" (coordinator, 2026-10-29); D1 / Delta Cards has the one line of qty 1 for it.
//   - The armed ask is live 4 seconds from the tap, so it is read once, in one snapshot (ScreenKit.snapshot), right after it
//     appears, and never lengthened. The lapse is waited for after that.
//   - "Nothing moves" compares each frame to half a point, relative to the card's own top, as the stamp cases do. What mounts
//     or unmounts on purpose (the card's bar and pill, the ask) is not compared.
//
// Not here, and why:
//   - An accessibility audit with the ask armed: the audit runs about 5 s and the ask lapses after 4 (debt
//     native-armed-audit-misses-ask). The ask's label, enabled state and 44pt frames are read from one snapshot instead.
//   - First focus on Cancel, the hints ("Asks first. Clears N check-ins from <seller>") and the VoiceOver names: XCUITest
//     reads neither focus nor a hint (debt native-ask-has-no-cancel-focus).
//   - The vacated Undo notice (a filter drops the card on the tap): the native Packages list has no Unreceived filter yet.
//   - The stacked row at an accessibility text size, and the open Duo's Packages page.
//   - Clear's N across a filter's hidden copies on the Tally: TallyBulkModelTests pins that bulk reaches them, and V39.8 the N.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class PackageBulkUITests: XCTestCase {
    static let a1 = "A1::Alpha Cards", d1 = "D1::Delta Cards"
    static let urza = "D1|0|pUrzasSaga"
    static let bolt = "A1|0|pLightningBolt", counter = "A1|1|pCounterspell", brain = "A1|2|pBrainstorm"
    static let brainA = "A1|2|pBrainstorm", brainB = "B1|2|pBrainstorm"
    /// What the Packages cases read from a snapshot: the cards' own parts, the stamp controls and every bulk control.
    static let framed = ["package-row:", "checkin:", "order-link:", "card-slot:", "stamp-slot:", "stamp-button:", "stamp-band:", "stamp-editor:", "bulk-"]
    /// What the Tally cases read: the rows, their check-ins and the six tally-bulk ids.
    static let tallyFramed = ["tally-row:", "tally-checkin:", "tally-bulk-"]

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    // MARK: helpers (the launch, find, wait, tap and snapshot steps are ScreenKit's)

    func launch(width: Int = 375) -> XCUIApplication { ScreenKit.launch(width: width) }
    func el(_ app: XCUIApplication, _ id: String) -> XCUIElement { ScreenKit.el(app, id) }
    func wait(_ predicate: String, for e: XCUIElement, _ message: String, timeout: TimeInterval = 5, file: StaticString = #filePath, line: UInt = #line) {
        ScreenKit.wait(predicate, for: e, message, timeout: timeout, file: file, line: line)
    }
    func tap(_ app: XCUIApplication, _ id: String, file: StaticString = #filePath, line: UInt = #line) { ScreenKit.tap(app, id, file: file, line: line) }

    func snap(_ app: XCUIApplication, tally: Bool = false) -> [String: ScreenKit.Seen] {
        ScreenKit.snapshot(app, prefixes: tally ? Self.tallyFramed : Self.framed)
    }
    func frames(_ s: [String: ScreenKit.Seen]) -> [String: CGRect] { s.mapValues(\.frame) }

    /// A hand check-in on a line (Packages: checkin:, Tally: tally-checkin:), waited out.
    func checkIn(_ app: XCUIApplication, _ key: String, prefix: String = "checkin:") {
        tap(app, prefix + key)
        wait("label BEGINSWITH 'Undo check in'", for: el(app, prefix + key), "the check-in of \(key) did not land")
    }

    func isIn(_ app: XCUIApplication, _ key: String, prefix: String = "checkin:") -> Bool {
        el(app, prefix + key).label.hasPrefix("Undo check in")
    }

    /// The frame is at least 44pt each way. The same floor as assertHitRegion, on a frame already read, because the armed
    /// ask is gone 4 seconds after its tap and assertHitRegion waits a second before it reads.
    func assertBox(_ f: CGRect, _ what: String, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertGreaterThanOrEqual(f.width, 44 - 0.001, "\(what) is \(f.width)pt wide, under 44pt", file: file, line: line)
        XCTAssertGreaterThanOrEqual(f.height, 44 - 0.001, "\(what) is \(f.height)pt high, under 44pt", file: file, line: line)
    }

    /// Two frames, each edge compared to half a point.
    func assertSame(_ a: CGRect?, _ b: CGRect?, _ what: String, file: StaticString = #filePath, line: UInt = #line) {
        guard let a, let b else { return XCTFail("\(what): a frame is missing (\(String(describing: a)), \(String(describing: b)))", file: file, line: line) }
        for (edge, x, y) in [("minX", a.minX, b.minX), ("minY", a.minY, b.minY), ("maxX", a.maxX, b.maxX), ("maxY", a.maxY, b.maxY)] {
            XCTAssertEqual(x, y, accuracy: 0.5, "\(what): \(edge) \(y) to \(x)", file: file, line: line)
        }
    }

    /// The Tally tab with the Brainstorm row open and both copies on screen. `alone`: a search first leaves Brainstorm the only
    /// row, as TallyUITests does for its open-row audit, so no row sits cut by the glass tab bar and fails the audit for it.
    func openBrainstorm(alone: Bool = false) -> XCUIApplication {
        let app = ScreenKit.launch(tab: "Tally")
        if alone {
            let search = el(app, "tally-search")
            XCTAssertTrue(search.waitForExistence(timeout: 5), "the search field tally-search is missing")
            search.tap()
            search.typeText("Brainstorm\n")  // the return key closes the keyboard, so the tab bar shows
            wait("exists == false", for: el(app, "tally-row:Lightning Bolt"), "the search left the Lightning Bolt row on screen")
        }
        tap(app, "tally-toggle:Brainstorm")
        XCTAssertTrue(el(app, "tally-copy:\(Self.brainA)").waitForExistence(timeout: 5), "the Brainstorm row did not list its copies")
        app.reveal(el(app, "tally-row:Brainstorm"), whole: true)
        return app
    }

    // MARK: sizes

    /// Every control the owner taps has a hit region of at least 44pt each way, at 375 and at the 320 stress width, where
    /// the labels wrap: Mark all, Clear, Undo mark all, and the armed ask's two buttons. They sit inside the card and in
    /// the bulk row, and no two frames overlap. The ask is read from one snapshot, inside its 4 seconds.
    func testEveryBulkControlHasA44ptHitRegionInsideItsCard() throws {
        for width in [320, 375] {
            let app = launch(width: width)
            let gk = Self.a1
            checkIn(app, Self.bolt)  // one copy in: Mark all and Clear both apply
            let mark = el(app, "bulk-mark:\(gk)"), clear = el(app, "bulk-clear:\(gk)")
            assertHitRegion(mark, "Mark all at \(width)pt")
            assertHitRegion(clear, "Clear check-ins at \(width)pt")

            let card = el(app, "package-row:\(gk)").frame.insetBy(dx: -1, dy: 0), row = el(app, "bulk-row:\(gk)").frame.insetBy(dx: -1, dy: -1)
            let parts = [("Mark all", mark), ("Clear", clear)]
            for (what, e) in parts {
                XCTAssertTrue(e.frame.minX >= card.minX && e.frame.maxX <= card.maxX, "\(what) at \(width)pt is \(e.frame.minX) to \(e.frame.maxX), outside the card \(card.minX) to \(card.maxX)")
                XCTAssertTrue(row.contains(e.frame), "\(what) at \(width)pt, \(e.frame), is not in the bulk row, \(row)")
            }
            for (i, a) in parts.enumerated() {
                for b in parts[(i + 1)...] {
                    let hit = a.1.frame.intersection(b.1.frame)
                    XCTAssertTrue(hit.isNull || hit.width * hit.height < 0.5, "the frames of \(a.0) and \(b.0) at \(width)pt overlap: \(a.1.frame), \(b.1.frame)")
                }
            }

            tap(app, "bulk-clear:\(gk)")
            XCTAssertTrue(el(app, "bulk-clear-confirm:\(gk)").waitForExistence(timeout: 5), "the first tap on Clear did not arm it at \(width)pt")
            let armed = snap(app)
            guard let confirm = armed["bulk-clear-confirm:\(gk)"], let cancel = armed["bulk-clear-cancel:\(gk)"] else {
                return XCTFail("the ask's two buttons are missing from the snapshot taken after the first tap at \(width)pt: the ask had gone")
            }
            assertBox(confirm.frame, "the armed ask's second tap at \(width)pt")
            assertBox(cancel.frame, "the armed ask's Cancel at \(width)pt")
            el(app, "bulk-clear-cancel:\(gk)").tap()
            wait("exists == false", for: el(app, "bulk-clear-confirm:\(gk)"), "Cancel did not disarm at \(width)pt")

            tap(app, "bulk-mark:\(gk)")
            assertHitRegion(el(app, "bulk-undo:\(gk)"), "Undo mark all at \(width)pt")
            app.terminate()
        }
    }

    // MARK: Mark all and its Undo

    /// Mark all is one tap, with no ask: every line of the card goes in, the masthead and the card follow, and the Mark all
    /// slot reads Undo mark all. Undo is one tap too: the card is back where it was, and the check-in made before the press
    /// stays in. Brainstorm reads 0 of 2 again.
    func testMarkAllChecksInTheWholeCardAndUndoTakesBackOnlyThat() throws {
        let app = launch()
        let gk = Self.a1
        checkIn(app, Self.bolt)
        wait("value == '1/14'", for: el(app, "tally-cards"), "control: one card in at rest")
        XCTAssertFalse(el(app, "bulk-undo:\(gk)").exists, "a card with no Mark all behind it offers an Undo")

        tap(app, "bulk-mark:\(gk)")

        wait("label BEGINSWITH 'Undo check in'", for: el(app, "checkin:\(Self.brain)"), "Mark all did not check in Brainstorm")
        XCTAssertTrue(isIn(app, Self.counter), "Mark all did not check in Counterspell")
        XCTAssertTrue(isIn(app, Self.bolt), "Mark all took back Lightning Bolt")
        wait("value == '4/14'", for: el(app, "tally-cards"), "the masthead does not count the four cards in")
        wait("value == 'Received'", for: el(app, "card-slot:\(gk)"), "the card's status slot does not read Received")
        let undo = el(app, "bulk-undo:\(gk)")
        XCTAssertTrue(undo.waitForExistence(timeout: 5), "Mark all offers no Undo")
        XCTAssertEqual(undo.label, "Undo mark all", "the Undo's label")
        XCTAssertFalse(el(app, "bulk-mark:\(gk)").exists, "Mark all stays beside its own Undo")
        XCTAssertFalse(el(app, "bulk-clear-confirm:\(gk)").exists, "Mark all asked first: it takes one tap")

        undo.tap()

        wait("label BEGINSWITH 'Check in'", for: el(app, "checkin:\(Self.brain)"), "Undo did not take back Brainstorm")
        XCTAssertFalse(isIn(app, Self.counter), "Undo did not take back Counterspell")
        XCTAssertTrue(isIn(app, Self.bolt), "Undo took back the check-in made before the press")
        XCTAssertEqual(el(app, "checkin:\(Self.brain)").value as? String, "0 of 2", "Brainstorm after the undo")
        wait("value == '1/14'", for: el(app, "tally-cards"), "the masthead does not go back to one card in")
        wait("exists == false", for: el(app, "bulk-undo:\(gk)"), "the Undo stays after it was used")
        XCTAssertTrue(el(app, "bulk-mark:\(gk)").waitForExistence(timeout: 5), "Mark all does not come back after the undo")
    }

    /// The Undo ends on the next write on this device. A hand check-in after the press is one: it ends the Undo, and Mark all
    /// is back in its slot, because a line is owed again.
    func testAHandCheckInAfterMarkAllEndsTheUndo() throws {
        let app = launch()
        let gk = Self.a1
        tap(app, "bulk-mark:\(gk)")
        XCTAssertTrue(el(app, "bulk-undo:\(gk)").waitForExistence(timeout: 5), "control: Mark all offers its Undo")

        tap(app, "checkin:\(Self.bolt)")  // an un-check by hand

        wait("label BEGINSWITH 'Check in'", for: el(app, "checkin:\(Self.bolt)"), "the hand check-in did not land")
        wait("exists == false", for: el(app, "bulk-undo:\(gk)"), "the Undo stays after a hand check-in")
        XCTAssertTrue(el(app, "bulk-mark:\(gk)").waitForExistence(timeout: 5), "Mark all is not back in its slot, with a line owed")
        XCTAssertTrue(isIn(app, Self.counter) && isIn(app, Self.brain), "the hand check-in changed more than its own line")
    }

    // MARK: Clear

    /// Clear takes two taps (no-native-dialogs). The first arms it and writes nothing: Brainstorm, the only line in, stays
    /// in. The ask names the copies in now, hangs below the row and moves nothing, not a card, not a control, not Clear
    /// under the finger. Cancel disarms it. The ask lapses by itself after 4 seconds. The second tap clears, and a Clear
    /// leaves no Undo.
    func testClearIsTwoTapsAndTheAskHangsBelowItsRowMovingNothing() throws {
        let app = launch()
        let gk = Self.a1, anchor = "package-row:\(gk)"
        checkIn(app, Self.brain)  // 2 copies in: N is 2, the lines in are 1 and the card's total is 4
        app.reveal(el(app, anchor), whole: true)
        let before = ScreenKit.relative(frames(snap(app)), to: anchor)
        let confirm = el(app, "bulk-clear-confirm:\(gk)")

        // The ask is live for 4 seconds from the tap, so the armed state is read once, in one snapshot.
        tap(app, "bulk-clear:\(gk)")
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "the first tap on Clear did not arm it")
        let armed = snap(app)
        guard let ask = armed["bulk-clear-confirm:\(gk)"], let cancel = armed["bulk-clear-cancel:\(gk)"], let row = armed["bulk-row:\(gk)"],
              let held = armed["checkin:\(Self.brain)"] else {
            return XCTFail("the ask, its Cancel, the row or Brainstorm is missing from the snapshot taken after the first tap: the ask had gone")
        }
        XCTAssertEqual(ask.label, "Tap again to clear 2 check-ins", "the ask's label: N is the copies in now")
        XCTAssertEqual(cancel.label, "Cancel", "the ask's Cancel label")
        XCTAssertTrue(ask.isEnabled && cancel.isEnabled, "an ask button reports disabled")
        assertBox(ask.frame, "the ask's second tap")
        assertBox(cancel.frame, "the ask's Cancel")
        XCTAssertGreaterThanOrEqual(ask.frame.minY, row.frame.maxY - 0.5, "the ask does not hang below its row: \(ask.frame) against \(row.frame)")
        XCTAssertGreaterThanOrEqual(cancel.frame.minY, row.frame.maxY - 0.5, "the ask's Cancel does not hang below its row: \(cancel.frame) against \(row.frame)")
        XCTAssertTrue(held.label.hasPrefix("Undo check in"), "the first tap on Clear cleared Brainstorm: \(held.label)")
        ScreenKit.assertStill(before, app, anchor: anchor, "Clear was armed", prefixes: Self.framed, taken: frames(armed))

        el(app, "bulk-clear-cancel:\(gk)").tap()
        wait("exists == false", for: confirm, "the ask's Cancel did not disarm")
        XCTAssertTrue(isIn(app, Self.brain), "Cancel cleared Brainstorm")
        ScreenKit.assertStill(before, app, anchor: anchor, "the ask was cancelled", prefixes: Self.framed)

        tap(app, "bulk-clear:\(gk)")
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "the second arm did not show the ask")
        wait("exists == false", for: confirm, "the ask did not lapse after 4 seconds", timeout: 7)
        XCTAssertTrue(isIn(app, Self.brain), "the lapse cleared Brainstorm")
        XCTAssertTrue(el(app, "bulk-clear:\(gk)").exists, "Clear is gone after the ask lapsed")

        tap(app, "bulk-clear:\(gk)")
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "the third arm did not show the ask")
        confirm.tap()

        wait("label BEGINSWITH 'Check in'", for: el(app, "checkin:\(Self.brain)"), "the second tap did not clear Brainstorm")
        wait("value == '0/14'", for: el(app, "tally-cards"), "the masthead does not count the cleared cards out")
        wait("exists == false", for: el(app, "bulk-clear:\(gk)"), "Clear stays with nothing left to clear")
        XCTAssertFalse(el(app, "bulk-undo:\(gk)").exists, "a Clear offers an Undo: the ask is its guard")
        XCTAssertTrue(el(app, "bulk-mark:\(gk)").exists, "Mark all is not in its slot after the Clear")
        ScreenKit.assertStill(before, app, anchor: anchor, "Clear was confirmed", prefixes: Self.framed)
    }

    /// One copy in reads "1 check-in", singular, as the stamp ask reads "1 card" (testTheAskNamesOneCardInTheSingular in
    /// PackageStampUITests). D1 / Delta Cards holds the one line of qty 1. The label is read from one snapshot, inside the
    /// ask's 4 seconds.
    func testTheClearAskNamesOneCheckInInTheSingular() throws {
        let app = launch()
        let gk = Self.d1
        XCTAssertTrue(ScreenKit.mount(app, "package-row:\(gk)"), "\(gk) is not on the list")  // the fourth card: the lazy list mounts it on a scroll
        checkIn(app, Self.urza)
        tap(app, "bulk-clear:\(gk)")
        XCTAssertTrue(el(app, "bulk-clear-confirm:\(gk)").waitForExistence(timeout: 5), "the first tap on Clear did not arm it")
        let armed = snap(app)
        XCTAssertEqual(armed["bulk-clear-confirm:\(gk)"]?.label, "Tap again to clear 1 check-in", "the ask's label for one copy in")
    }

    // MARK: nothing moves

    /// Mark all, Undo and a confirmed Clear move nothing: the card keeps its size, the lines keep their places, the cards
    /// below stay where they were, and the control that stays (Clear, Stamp) does not slide. The Undo takes Mark all's own
    /// slot, to the same frame. Compared relative to the card's top, so a scroll to reach a control is not a move.
    func testNothingMovesOnMarkAllUndoOrClear() throws {
        let app = launch()
        let gk = Self.a1, anchor = "package-row:\(gk)"
        checkIn(app, Self.bolt)  // Clear shows before and after Mark all, so its slot is compared
        app.reveal(el(app, anchor), whole: true)
        let rest = ScreenKit.relative(frames(snap(app)), to: anchor)
        XCTAssertNotNil(rest["bulk-clear:\(gk)"], "control: Clear is on the card at rest")

        tap(app, "bulk-mark:\(gk)")
        wait("exists == true", for: el(app, "bulk-undo:\(gk)"), "no Undo after Mark all")
        ScreenKit.assertStill(rest, app, anchor: anchor, "Mark all was tapped", prefixes: Self.framed)
        let afterMark = ScreenKit.relative(frames(snap(app)), to: anchor)
        assertSame(afterMark["bulk-undo:\(gk)"], rest["bulk-mark:\(gk)"], "Undo mark all is not in Mark all's slot")

        tap(app, "bulk-undo:\(gk)")
        wait("exists == true", for: el(app, "bulk-mark:\(gk)"), "no Mark all after Undo")
        ScreenKit.assertStill(rest, app, anchor: anchor, "Undo was tapped", prefixes: Self.framed)

        tap(app, "bulk-clear:\(gk)")
        XCTAssertTrue(el(app, "bulk-clear-confirm:\(gk)").waitForExistence(timeout: 5), "the first tap on Clear did not arm it")
        tap(app, "bulk-clear-confirm:\(gk)")
        wait("label BEGINSWITH 'Check in'", for: el(app, "checkin:\(Self.bolt)"), "Clear did not clear Lightning Bolt")
        ScreenKit.assertStill(rest, app, anchor: anchor, "Clear was confirmed", prefixes: Self.framed)
    }

    /// A control that does not apply keeps its slot, hidden: it is out of the accessibility tree, and the control beside it
    /// stays put. At rest Clear is hidden, and Mark all must not slide to the trailing edge for it. Once the card is whole
    /// by hand Mark all is hidden, and Clear must not move for that. The bulk row and the Stamp slot above it stay through both.
    func testAnInapplicableControlKeepsItsSlotHidden() throws {
        let app = launch()
        let gk = Self.a1, anchor = "package-row:\(gk)"
        app.reveal(el(app, anchor), whole: true)
        func place(_ id: String) -> CGRect? { ScreenKit.relative(frames(snap(app)), to: anchor)[id] }

        XCTAssertFalse(el(app, "bulk-clear:\(gk)").exists, "nothing is in, and Clear is still there")
        let markAtRest = place("bulk-mark:\(gk)"), slotAtRest = place("stamp-slot:\(gk)"), rowAtRest = place("bulk-row:\(gk)")
        XCTAssertNotNil(markAtRest, "control: Mark all is on the card at rest")
        XCTAssertNotNil(slotAtRest, "control: the Stamp slot is on the card at rest")

        checkIn(app, Self.bolt)
        wait("exists == true", for: el(app, "bulk-clear:\(gk)"), "Clear does not show once a copy is in")
        assertSame(place("bulk-mark:\(gk)"), markAtRest, "Mark all moved when Clear showed")
        assertSame(place("bulk-row:\(gk)"), rowAtRest, "the bulk row moved when Clear showed")
        let clearBoth = place("bulk-clear:\(gk)")

        checkIn(app, Self.counter)
        checkIn(app, Self.brain)
        wait("exists == false", for: el(app, "bulk-mark:\(gk)"), "Mark all stays on a whole card")
        XCTAssertFalse(el(app, "bulk-undo:\(gk)").exists, "a card made whole by hand offers an Undo")
        assertSame(place("bulk-clear:\(gk)"), clearBoth, "Clear moved when Mark all went")
        assertSame(place("bulk-row:\(gk)"), rowAtRest, "the bulk row moved when Mark all went")
        assertSame(place("stamp-slot:\(gk)"), slotAtRest, "the Stamp slot moved with the bulk controls")
    }

    // MARK: the stamp slot keeps its place

    /// Step 6's 48pt slot for Stamp or the band stays as it is, and the bulk row sits under it with Mark all and Clear
    /// only. A stamp's Save or Remove moves neither the slot nor the bulk row, nor any line: Save does not move under the
    /// thumb (no-layout-shift-under-pointer). The editor, when open, sits above the bulk row.
    func testAStampSaveOrRemoveMovesNeitherTheSlotNorTheBulkRow() throws {
        let app = launch()
        let gk = Self.a1, anchor = "package-row:\(gk)"
        let row = el(app, "bulk-row:\(gk)"), slot = el(app, "stamp-slot:\(gk)"), stamp = el(app, "stamp-button:\(gk)"), mark = el(app, "bulk-mark:\(gk)")
        XCTAssertTrue(row.waitForExistence(timeout: 5) && slot.waitForExistence(timeout: 5), "the card has no bulk row or no Stamp slot")
        app.reveal(el(app, anchor), whole: true)
        let boxOf = { (f: CGRect) in f.insetBy(dx: -1, dy: -1) }
        XCTAssertTrue(boxOf(slot.frame).contains(stamp.frame), "Stamp is not in its slot: \(stamp.frame) against \(slot.frame)")
        XCTAssertTrue(boxOf(row.frame).contains(mark.frame), "Mark all is not in the bulk row: \(mark.frame) against \(row.frame)")
        XCTAssertFalse(boxOf(row.frame).contains(stamp.frame), "Stamp is in the bulk row, not in its own slot above it")
        XCTAssertLessThanOrEqual(slot.frame.maxY, row.frame.minY + 0.5, "the bulk row is not under the Stamp slot: \(row.frame) against \(slot.frame)")
        // The Stamp button leaves its slot on Save, so it is the one id not compared. The slot itself is.
        let rest = ScreenKit.relative(frames(snap(app)).filter { !$0.key.hasPrefix("stamp-button:") }, to: anchor)
        XCTAssertNotNil(rest["stamp-slot:\(gk)"], "control: the slot is in the snapshot at rest")
        XCTAssertNotNil(rest["bulk-row:\(gk)"], "control: the bulk row is in the snapshot at rest")

        // Save: the slot holds a band now, and nothing else has moved.
        ScreenKit.stamp(app, gk, kind: "claim")
        let band = el(app, "stamp-band:\(gk)")
        XCTAssertTrue(band.waitForExistence(timeout: 5), "Save did not leave a band")
        XCTAssertFalse(stamp.exists, "a stamped card still offers the Stamp button")
        XCTAssertTrue(boxOf(slot.frame).contains(band.frame), "the band is not in the Stamp slot: \(band.frame) against \(slot.frame)")
        ScreenKit.assertStill(rest, app, anchor: anchor, "the stamp was saved", prefixes: Self.framed)
        XCTAssertTrue(mark.exists, "Mark all left the bulk row after the stamp")

        // The open editor sits above the bulk row.
        tap(app, "stamp-band:\(gk)")
        let editor = el(app, "stamp-editor:\(gk)")
        XCTAssertTrue(editor.waitForExistence(timeout: 5), "the band did not open the editor")
        XCTAssertLessThanOrEqual(editor.frame.maxY, row.frame.minY + 0.5, "the editor does not sit above the bulk row: \(editor.frame) against \(row.frame)")

        // Remove: back to the Stamp button in the same slot, and nothing else has moved.
        tap(app, "stamp-remove:\(gk)")
        XCTAssertTrue(el(app, "stamp-ask-confirm:\(gk)").waitForExistence(timeout: 5), "the first tap on Remove stamp did not arm it")
        tap(app, "stamp-ask-confirm:\(gk)")
        wait("exists == true", for: stamp, "no Stamp button after Remove")
        ScreenKit.assertStill(rest, app, anchor: anchor, "the stamp was removed", prefixes: Self.framed)
    }

    // MARK: the open Tally row

    /// The open Tally row has Mark all and its Undo in one slot, and Clear once a copy is in. Mark all checks in every copy,
    /// Undo takes back only that, and none of it moves the row.
    func testTheOpenTallyRowHasMarkAllAndItsUndoInOneSlot() throws {
        let app = openBrainstorm()
        let name = "Brainstorm", anchor = "tally-row:\(name)"
        let mark = el(app, "tally-bulk-mark:\(name)")
        XCTAssertTrue(mark.waitForExistence(timeout: 5), "the open Tally row has no Mark all")
        assertHitRegion(mark, "the Tally row's Mark all")
        XCTAssertFalse(el(app, "tally-bulk-clear:\(name)").exists, "nothing is in, and the Tally row's Clear is still there")
        XCTAssertTrue(el(app, "tally-bulk-row:\(name)").exists, "the Tally row has no bulk row")
        XCTAssertFalse(el(app, "stamp-button:\(name)").exists, "the Tally row has a Stamp button")

        checkIn(app, Self.brainA, prefix: "tally-checkin:")
        wait("exists == true", for: el(app, "tally-bulk-clear:\(name)"), "Clear does not show on the Tally row once a copy is in")
        assertHitRegion(el(app, "tally-bulk-clear:\(name)"), "the Tally row's Clear")
        app.reveal(el(app, anchor), whole: true)
        let rest = ScreenKit.relative(frames(snap(app, tally: true)), to: anchor)

        tap(app, "tally-bulk-mark:\(name)")
        wait("exists == true", for: el(app, "tally-bulk-undo:\(name)"), "no Undo after Mark all on the Tally row")
        XCTAssertTrue(isIn(app, Self.brainA, prefix: "tally-checkin:") && isIn(app, Self.brainB, prefix: "tally-checkin:"), "Mark all did not check in both copies")
        XCTAssertEqual(el(app, "tally-bulk-undo:\(name)").label, "Undo mark all", "the Tally Undo's label")
        ScreenKit.assertStill(rest, app, anchor: anchor, "Mark all was tapped on the Tally row", prefixes: Self.tallyFramed, minimum: 5)
        assertSame(ScreenKit.relative(frames(snap(app, tally: true)), to: anchor)["tally-bulk-undo:\(name)"], rest["tally-bulk-mark:\(name)"],
                   "the Tally Undo is not in Mark all's slot")
        assertHitRegion(el(app, "tally-bulk-undo:\(name)"), "the Tally row's Undo mark all")

        tap(app, "tally-bulk-undo:\(name)")
        wait("label BEGINSWITH 'Check in'", for: el(app, "tally-checkin:\(Self.brainB)"), "Undo did not take back the second copy")
        XCTAssertTrue(isIn(app, Self.brainA, prefix: "tally-checkin:"), "Undo took back the copy checked in before the press")
        wait("exists == true", for: el(app, "tally-bulk-mark:\(name)"), "Mark all does not come back on the Tally row")
        ScreenKit.assertStill(rest, app, anchor: anchor, "Undo was tapped on the Tally row", prefixes: Self.tallyFramed, minimum: 5)
    }

    /// Clear on the Tally row asks first, as on the card: the ask hangs below the row, names the copies in now and moves
    /// nothing. Cancel disarms it, the second tap clears every copy.
    func testTheOpenTallyRowsClearAsksFirstAndTheAskHangsBelowItsRow() throws {
        let app = openBrainstorm()
        let name = "Brainstorm", anchor = "tally-row:\(name)"
        checkIn(app, Self.brainA, prefix: "tally-checkin:")
        app.reveal(el(app, anchor), whole: true)
        let before = ScreenKit.relative(frames(snap(app, tally: true)), to: anchor)
        let confirm = el(app, "tally-bulk-clear-confirm:\(name)")

        tap(app, "tally-bulk-clear:\(name)")
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "the first tap on the Tally row's Clear did not arm it")
        let armed = snap(app, tally: true)
        guard let ask = armed["tally-bulk-clear-confirm:\(name)"], let cancel = armed["tally-bulk-clear-cancel:\(name)"], let row = armed["tally-bulk-row:\(name)"],
              let held = armed["tally-checkin:\(Self.brainA)"] else {
            return XCTFail("the ask, its Cancel, the row or the copy is missing from the snapshot taken after the first tap: the ask had gone")
        }
        XCTAssertEqual(ask.label, "Tap again to clear 2 check-ins", "the Tally ask's label: one copy of qty 2 is in")
        XCTAssertEqual(cancel.label, "Cancel", "the Tally ask's Cancel label")
        assertBox(ask.frame, "the Tally ask's second tap")
        assertBox(cancel.frame, "the Tally ask's Cancel")
        XCTAssertGreaterThanOrEqual(ask.frame.minY, row.frame.maxY - 0.5, "the Tally ask does not hang below its row: \(ask.frame) against \(row.frame)")
        XCTAssertTrue(held.label.hasPrefix("Undo check in"), "the first tap on Clear cleared the copy: \(held.label)")
        ScreenKit.assertStill(before, app, anchor: anchor, "the Tally Clear was armed", prefixes: Self.tallyFramed, taken: frames(armed), minimum: 5)

        el(app, "tally-bulk-clear-cancel:\(name)").tap()
        wait("exists == false", for: confirm, "the ask's Cancel did not disarm")
        XCTAssertTrue(isIn(app, Self.brainA, prefix: "tally-checkin:"), "Cancel cleared the copy")

        tap(app, "tally-bulk-clear:\(name)")
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "the second arm did not show the ask")
        confirm.tap()
        wait("label BEGINSWITH 'Check in'", for: el(app, "tally-checkin:\(Self.brainA)"), "the second tap did not clear the copy")
        wait("exists == false", for: el(app, "tally-bulk-clear:\(name)"), "Clear stays with nothing left to clear")
        XCTAssertFalse(el(app, "tally-bulk-undo:\(name)").exists, "a Clear offers an Undo: the ask is its guard")
    }

    // MARK: accessibility audits, one screen per method, at rest. None is taken with the ask armed: see the header.

    /// The Packages screen with Mark all and Clear both on the card. Skips only what the tab bar covers.
    func testAccessibilityAuditPackagesWithBothBulkControls() throws {
        let app = launch()
        checkIn(app, Self.bolt)
        XCTAssertTrue(el(app, "bulk-clear:\(Self.a1)").waitForExistence(timeout: 5), "no Clear before the audit")
        try app.auditSkippingTabBar()
    }

    /// The Packages screen with Undo mark all in Mark all's slot.
    func testAccessibilityAuditPackagesWithTheUndo() throws {
        let app = launch()
        tap(app, "bulk-mark:\(Self.a1)")
        XCTAssertTrue(el(app, "bulk-undo:\(Self.a1)").waitForExistence(timeout: 5), "no Undo before the audit")
        try app.auditSkippingTabBar()
    }

    /// The open Tally row with its two controls, alone on the list (see openBrainstorm). The Tally audits skip the ruled
    /// contrast flags and nothing else.
    func testAccessibilityAuditTallyRowWithBothBulkControls() throws {
        let app = openBrainstorm(alone: true)
        checkIn(app, Self.brainA, prefix: "tally-checkin:")
        XCTAssertTrue(el(app, "tally-bulk-clear:Brainstorm").waitForExistence(timeout: 5), "no Clear before the audit")
        let barTop = app.tabBars.firstMatch.frame.minY
        for (id, seen) in snap(app, tally: true) {
            XCTAssertLessThanOrEqual(seen.frame.maxY, barTop, "\(id) reaches under the tab bar, so the audit would read a cut row")
        }
        try app.auditNamingElements(skipping: skipMeasuredContrastFlags)
    }
}
