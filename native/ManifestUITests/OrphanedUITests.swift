// Orphaned UI tests (lane N7, native-build-lanes, orphan-entry-takes-one-input,
// orphaned-mail-never-decides, assign-checks-recorded-cards, undo-removes-only-its-delta).
//
// Red-first. The builder replaces the Orphaned placeholder in native/Manifest/RootView.swift
// with the Orphaned views and makes these pass. These tests run against the placeholder today,
// so each fails on an assertion about an element that is not there.
//
// Contract the tests name (the builder implements all of it). Identifiers:
//   orphaned-record        the "Record an envelope" button; it opens the composer
//   orphaned-input         the one card-name field of the composer; its value is the typed text
//   suggestion:<name>      one suggestion row per outstanding card, e.g. "suggestion:Urza's Saga"
//   orphaned-save          Save in the composer
//   orphaned-cancel        Cancel in the composer; it closes the composer and keeps the draft
//   envelope:<id>          one card per live envelope in the pile
//   assign:<gk>            the "This one" button of a candidate row, gk = "orderId::seller"
//   exact:<gk>             the "explains all" marker of a candidate; present only on an emphasized one
//   orphaned-tie           the tie line; its label is the line
//   orphaned-undo          the Undo button of the notice an assign leaves
//   orphaned-undo-dismiss  the close button of that notice
//   discard:<id>           the Discard button of an envelope card
//   orphaned-empty         the empty-state text of an empty pile; its label is the line
// Behaviour: assign is one tap (no "Tap again" ask anywhere). The composer is autofocused. A view
// change keeps the draft, and returns to the composer that was open. The Undo notice survives a
// trip to Packages (web group 14). Every control has a hit region of at least 44pt.
//
// Launch argument -ManifestUITestSeed gives the app the shared fixture ledger: no envelopes.
// A and B (A1, B1) hold the same cards, so they tie. D1 holds Urza's Saga alone.
// The empty-state line is the web copy (src/app.jsx), curly apostrophe included.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class OrphanedUITests: XCTestCase {
    static let minHit: CGFloat = 44
    static let emptyLine = "Nothing waiting: record a package here when you can\u{2019}t tell who sent it."
    static let tieLine2 = "2 packages fit these cards equally well \u{2014} pick the right one yourself."
    static let a1 = "A1::Alpha Cards", b1 = "B1::Beta Games", d1 = "D1::Delta Cards"
    static let sagaControl = "checkin:D1|0|pUrzasSaga"

    // MARK: helpers

    func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        return app
    }

    func el(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    func count(_ app: XCUIApplication, prefix: String) -> Int {
        app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix)).count
    }

    func tab(_ app: XCUIApplication, _ title: String) -> XCUIElement { app.tabBars.buttons[title] }

    /// The Orphaned tab, and an element only the real view has, so no check below passes on the placeholder.
    func openOrphaned(_ app: XCUIApplication) {
        tab(app, "Orphaned").tap()
        XCTAssertTrue(el(app, "orphaned-record").waitForExistence(timeout: 5), "the Orphaned view has no Record control")
    }

    /// Types `typed` into the one input and taps the suggestion named `name`.
    func addCard(_ app: XCUIApplication, typed: String, name: String) {
        let input = el(app, "orphaned-input")
        XCTAssertTrue(input.waitForExistence(timeout: 5), "the composer has no input")
        if !app.keyboards.element.exists { input.tap() }
        input.typeText(typed)
        let row = el(app, "suggestion:\(name)")
        XCTAssertTrue(row.waitForExistence(timeout: 5), "typing \(typed) did not suggest \(name)")
        row.tap()
    }

    /// Records one envelope through the UI: open the composer, add each card, Save.
    func record(_ app: XCUIApplication, _ cards: [(typed: String, name: String)]) {
        el(app, "orphaned-record").tap()
        for c in cards { addCard(app, typed: c.typed, name: c.name) }
        let save = el(app, "orphaned-save")
        XCTAssertTrue(save.waitForExistence(timeout: 5), "the composer has no Save")
        save.tap()
        let pile = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "envelope:")).firstMatch
        XCTAssertTrue(pile.waitForExistence(timeout: 5), "Save did not put an envelope in the pile")
    }

    func recordSaga(_ app: XCUIApplication) { record(app, [("urza", "Urza's Saga")]) }

    func recordTie(_ app: XCUIApplication) {
        // Lightning Bolt, Counterspell and Brainstorm x2: A1 and B1 both fit exactly.
        el(app, "orphaned-record").tap()
        addCard(app, typed: "bolt", name: "Lightning Bolt")
        addCard(app, typed: "counter", name: "Counterspell")
        addCard(app, typed: "brain", name: "Brainstorm")
        addCard(app, typed: "brain", name: "Brainstorm")
        el(app, "orphaned-save").tap()
        XCTAssertTrue(el(app, "orphaned-tie").waitForExistence(timeout: 5), "a tie of two packages shows the tie line")
    }

    func sagaLabel(_ app: XCUIApplication) -> String {
        tab(app, "Packages").tap()
        let control = el(app, Self.sagaControl)
        XCTAssertTrue(control.waitForExistence(timeout: 5), "the Packages view has no \(Self.sagaControl)")
        return control.label
    }

    // MARK: empty state

    /// An empty pile shows one sentence, and the Record control.
    func testEmptyStateIsOneSentence() throws {
        let app = launch()
        openOrphaned(app)
        let line = el(app, "orphaned-empty")
        XCTAssertTrue(line.waitForExistence(timeout: 5), "the empty pile shows no empty-state line")
        XCTAssertEqual(line.label, Self.emptyLine, "the empty-state line differs from the web copy")
        XCTAssertEqual(line.label.filter { ".!?".contains($0) }.count, 1, "the empty state is one sentence")
        XCTAssertEqual(count(app, prefix: "envelope:"), 0, "the empty pile lists an envelope")
    }

    // MARK: assign

    /// One tap on "This one" checks the card in and leaves an Undo. Nothing asks "Tap again".
    func testAssignIsOneTapWithUndoAndNoArm() throws {
        let app = launch()
        openOrphaned(app)
        recordSaga(app)
        XCTAssertEqual(sagaLabel(app), "Check in Urza's Saga", "anchor: the card starts unchecked")
        tab(app, "Orphaned").tap()
        let assign = el(app, "assign:\(Self.d1)")
        XCTAssertTrue(assign.waitForExistence(timeout: 5), "the saga envelope offers its one package")
        XCTAssertTrue(el(app, "exact:\(Self.d1)").exists, "a single perfect fit carries the exact marker")

        assign.tap()

        XCTAssertTrue(el(app, "orphaned-undo").waitForExistence(timeout: 5), "one tap leaves an Undo")
        XCTAssertEqual(
            app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS[c] %@", "Tap again")).count, 0,
            "assign asks for a second tap")
        XCTAssertEqual(count(app, prefix: "envelope:"), 0, "the assigned envelope left the pile")
        XCTAssertEqual(sagaLabel(app), "Undo check in Urza's Saga", "the one tap checked the card in")
    }

    /// The Undo survives a trip to Packages, and it takes the card back out and brings the envelope back.
    func testUndoSurvivesATripToPackagesAndRestoresTheEnvelope() throws {
        let app = launch()
        openOrphaned(app)
        recordSaga(app)
        let assign = el(app, "assign:\(Self.d1)")
        XCTAssertTrue(assign.waitForExistence(timeout: 5), "the saga envelope offers its one package")
        assign.tap()
        XCTAssertTrue(el(app, "orphaned-undo").waitForExistence(timeout: 5), "anchor: an Undo after the assign")

        XCTAssertEqual(sagaLabel(app), "Undo check in Urza's Saga", "anchor: the card is checked in")
        tab(app, "Orphaned").tap()
        let undo = el(app, "orphaned-undo")
        XCTAssertTrue(undo.waitForExistence(timeout: 5), "the Undo is gone after a trip to Packages")
        undo.tap()

        XCTAssertTrue(
            app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "envelope:")).firstMatch
                .waitForExistence(timeout: 5), "Undo did not bring the envelope back")
        XCTAssertFalse(el(app, "orphaned-undo").exists, "the notice stays after Undo")
        XCTAssertEqual(sagaLabel(app), "Check in Urza's Saga", "Undo took the card back out")
    }

    // MARK: ties

    /// A and B fit equally. The tie line shows, both rows are offered, neither carries the exact marker or is
    /// selected, the rows are the same size, and nothing is checked in.
    func testATieShowsEveryTiedCandidateTheSameAndChecksNothingIn() throws {
        let app = launch()
        openOrphaned(app)
        recordTie(app)

        XCTAssertEqual(el(app, "orphaned-tie").label, Self.tieLine2, "the tie line differs from the web copy")
        let a = el(app, "assign:\(Self.a1)"), b = el(app, "assign:\(Self.b1)")
        XCTAssertTrue(a.waitForExistence(timeout: 5), "A is not offered")
        XCTAssertTrue(b.exists, "B is not offered")
        XCTAssertEqual(count(app, prefix: "exact:"), 0, "a tied candidate carries the exact marker")
        XCTAssertFalse(a.isSelected, "A is preselected")
        XCTAssertFalse(b.isSelected, "B is preselected")
        XCTAssertEqual(a.frame.size, b.frame.size, "the tied rows differ in size")
        XCTAssertFalse(el(app, "orphaned-undo").exists, "recording an envelope checked something in")
        XCTAssertEqual(sagaLabel(app), "Check in Urza's Saga", "the card stays unchecked")
        XCTAssertEqual(
            app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Undo check in")).count, 0,
            "recording checked a card in")
    }

    // MARK: drafts

    /// The draft survives a change of view, and the composer that was open comes back on it.
    func testComposerDraftSurvivesAViewChange() throws {
        let app = launch()
        openOrphaned(app)
        el(app, "orphaned-record").tap()
        let input = el(app, "orphaned-input")
        XCTAssertTrue(input.waitForExistence(timeout: 5), "the composer has no input")
        if !app.keyboards.element.exists { input.tap() }
        input.typeText("Light")

        tab(app, "Packages").tap()
        XCTAssertTrue(el(app, Self.sagaControl).waitForExistence(timeout: 5), "anchor: the Packages view opened")
        tab(app, "Orphaned").tap()

        let back = el(app, "orphaned-input")
        XCTAssertTrue(back.waitForExistence(timeout: 5), "the composer did not come back")
        XCTAssertEqual(back.value as? String, "Light", "the draft was lost on a view change")
    }

    /// Cancel closes the composer and keeps the draft: reopening finds the typed text.
    func testCancelKeepsTheDraft() throws {
        let app = launch()
        openOrphaned(app)
        el(app, "orphaned-record").tap()
        let input = el(app, "orphaned-input")
        XCTAssertTrue(input.waitForExistence(timeout: 5), "the composer has no input")
        if !app.keyboards.element.exists { input.tap() }
        input.typeText("Light")

        let cancel = el(app, "orphaned-cancel")
        XCTAssertTrue(cancel.waitForExistence(timeout: 5), "the composer has no Cancel")
        cancel.tap()
        XCTAssertFalse(el(app, "orphaned-input").exists, "Cancel left the composer open")

        el(app, "orphaned-record").tap()
        let again = el(app, "orphaned-input")
        XCTAssertTrue(again.waitForExistence(timeout: 5), "the composer did not reopen")
        XCTAssertEqual(again.value as? String, "Light", "Cancel threw the draft away")
    }

    // MARK: accessibility and hit regions

    /// The audit runs on a view only the real Orphaned view has: first the composer, then an envelope with a tie.
    /// The empty composer's Save is disabled, and WCAG 1.4.3 exempts inactive components, so only a contrast
    /// issue on a disabled element is skipped. Every other issue, and any enabled element's contrast, still fails.
    func testAccessibilityAuditOrphanedComposer() throws {
        let app = launch()
        openOrphaned(app)
        el(app, "orphaned-record").tap()
        XCTAssertTrue(el(app, "orphaned-input").waitForExistence(timeout: 5), "the composer did not open before the audit")
        try app.auditNamingElements(skipping: { issue in
            issue.auditType == .contrast && issue.element?.isEnabled == false
        })
    }

    /// The ready composer: a card is added, so Save is enabled and its contrast is audited like any control.
    /// No issue is skipped here, so nothing in this state is exempt.
    func testAccessibilityAuditOrphanedComposerReady() throws {
        let app = launch()
        openOrphaned(app)
        el(app, "orphaned-record").tap()
        addCard(app, typed: "urza", name: "Urza's Saga")
        XCTAssertTrue(el(app, "orphaned-save").isEnabled, "a card is added but Save is still disabled before the audit")
        try app.auditNamingElements()
    }

    /// Save reports its real state to VoiceOver: disabled while the composer holds no card, enabled once it does.
    func testSaveReportsDisabledUntilACardIsAdded() throws {
        let app = launch()
        openOrphaned(app)
        el(app, "orphaned-record").tap()
        let save = el(app, "orphaned-save")
        XCTAssertTrue(save.waitForExistence(timeout: 5), "the composer has no Save")
        XCTAssertFalse(save.isEnabled, "the empty composer's Save reports enabled")
        addCard(app, typed: "urza", name: "Urza's Saga")
        XCTAssertTrue(save.isEnabled, "Save still reports disabled after a card was added")
    }

    func testAccessibilityAuditOrphanedEnvelopeWithATie() throws {
        let app = launch()
        openOrphaned(app)
        recordTie(app)
        XCTAssertTrue(el(app, "assign:\(Self.a1)").waitForExistence(timeout: 5), "the candidates did not show before the audit")
        try app.auditNamingElements()
    }

    /// Every control the owner taps has a hit region of at least 44pt, and the assign Undo too.
    func testOrphanedControlsHaveA44ptHitRegion() throws {
        let app = launch()
        openOrphaned(app)
        func check(_ id: String) { assertHit(el(app, id), id) }
        check("orphaned-record")
        el(app, "orphaned-record").tap()
        XCTAssertTrue(el(app, "orphaned-save").waitForExistence(timeout: 5), "the composer has no Save")
        check("orphaned-save")
        check("orphaned-cancel")
        el(app, "orphaned-cancel").tap()
        recordSaga(app)
        check("assign:\(Self.d1)")
        el(app, "assign:\(Self.d1)").tap()
        XCTAssertTrue(el(app, "orphaned-undo").waitForExistence(timeout: 5), "no Undo to measure")
        check("orphaned-undo")
        check("orphaned-undo-dismiss")
    }

    /// The hit region is the whole control, not the label inside it: a .frame after the button style leaves the
    /// tappable area at the label's size. Every control on an envelope card is measured here, and every candidate row.
    func testEnvelopeCardControlsHaveA44ptHitRegion() throws {
        let app = launch()
        openOrphaned(app)
        // Lightning Bolt and Urza's Saga: A, B, C and D each explain one card, so four rows and a "show 1 more".
        record(app, [("bolt", "Lightning Bolt"), ("urza", "Urza's Saga")])

        assertHit(app.buttons["Edit"].firstMatch, "Edit")
        assertHit(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "discard:")).firstMatch, "Discard")
        assertHit(app.buttons["show 1 more candidate"], "show more")
        let rows = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "assign:"))
        XCTAssertEqual(rows.count, 3, "the card shows three candidate rows before show more")
        for i in 0..<rows.count { assertHit(rows.element(boundBy: i), "assign row \(i)") }

        app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "discard:")).firstMatch.tap()
        assertHit(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Tap again to discard")).firstMatch, "the discard ask")
        assertHit(app.buttons["Cancel"].firstMatch, "the discard ask's Cancel")
    }

    // MARK: tab badge

    /// The Orphaned tab carries the count of live envelopes as a system badge, and none at zero
    /// (phone-nav-is-bottom-bar). The tab is read while another tab is selected, so a selected-state
    /// value cannot stand in for a badge, and the count is 2, so a bare dot cannot pass.
    /// Unmeasured until a build draws one: that XCUI reports a system badge as the tab button's value,
    /// and in what format. The check is "contains" for that reason. The first green run settles it.
    func testTheOrphanedTabBadgeShowsTheLiveEnvelopeCount() throws {
        let app = launch()
        let orphaned = tab(app, "Orphaned")
        XCTAssertTrue(orphaned.waitForExistence(timeout: 5), "the tab bar has no Orphaned tab")
        XCTAssertNil(badge(orphaned).rangeOfCharacter(from: .decimalDigits), "an empty pile shows a badge: \(badge(orphaned))")

        openOrphaned(app)
        recordSaga(app)
        recordSaga(app)
        tab(app, "Tally").tap()

        for _ in 0..<25 where !badge(orphaned).contains("2") { Thread.sleep(forTimeInterval: 0.2) }
        XCTAssertTrue(badge(orphaned).contains("2"), "two envelopes in the pile, and the Orphaned tab's value is '\(badge(orphaned))'")
    }

    /// The tab button's value: a system badge's text, empty when there is none.
    func badge(_ tab: XCUIElement) -> String { tab.value as? String ?? "" }

    /// A frame comes back with float noise (a minHeight 44 row reads 43.99999999999997), so the floor has a
    /// thousandth of a point of slack. A real miss is a third of a point or more short.
    func assertHit(_ e: XCUIElement, _ what: String) {
        XCTAssertTrue(e.waitForExistence(timeout: 5), "\(what) is not on screen")
        let f = e.frame
        XCTAssertGreaterThanOrEqual(f.width, Self.minHit - 0.001, "\(what) is \(f.width)pt wide, under 44pt")
        XCTAssertGreaterThanOrEqual(f.height, Self.minHit - 0.001, "\(what) is \(f.height)pt high, under 44pt")
    }
}
