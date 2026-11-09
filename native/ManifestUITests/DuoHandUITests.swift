// Card in Hand UI tests on the open iPhone Duo (decisions duo-card-in-hand and new-envelope-ends-an-envelope; mockup
// poses 1, 2, 4 and 6 of docs/design/duo-card-in-hand on origin/design/duo-round2). The model is HandModel and
// PastTransitModel in ManifestKit; their unit tests are HandModelTests and PastTransitModelTests.
//
// Red-first and NOT RUN by the test-author (the Duo is another agent's to boot). They compile against this branch
// and fail on a missing element. The builder runs them red, then green. How to run: DuoShellUITests.swift, same
// destination and the same hinge command. These tests need the pose flat (open Duo, window 951 x 669 pt), set with
// `~/.local/bin/hinge open`. A run in another pose fails on the window size (DuoWindowSupport.swift). It never skips.
// The AccessibilityXL match-row case fails when the row moves under the keys' drawn top.
//
// The seed is shared/fixtures/ledger.json. What the tests rely on in it:
//   Lightning Bolt is in three envelopes: A1 Alpha Cards, B1 Beta Games and C1 Gamma Cards. So is a shared name.
//   Path to Exile is only in C1 (Gamma Cards), with Lightning Bolt, Swords to Plowshares, Ponder and Preordain.
//   Brainstorm is only in A1 and B1 (both without tracking): a second shared name, held in the New envelope hold test.
//   Counterspell is in A1 and B1 too (both without tracking): the shared name of the New envelope tie test.
//   A1, B1 and D1 (Delta Cards) have no tracking, are dated 2026-07-01, 2026-07-29 and 2026-05-01. C1 has tracking.
//   Nothing is received. The past-transit test needs the simulator clock later than 2026-08-12.
//   The live copies at rest are 14: A1 holds 4, B1 4, C1 5 and D1 1. Lightning Bolt owes 3 (one per A1, B1, C1).
//
// The last three cases pin the debts hand-reads-stamped-filter-rows and hand-stamp-leaves-tally-stale. They name no new
// identifier: they use hand-*, past-transit-*, stamped-cell, package-row:<gk> and tally-left:<name>, all of which exist.
// The stamped filter is on the Packages page (stamped-cell), which is hidden from XCUITest while Card in Hand is open, so
// those cases stamp, close Card in Hand, switch the filter on, and open Card in Hand again.
//
// Contract the tests name (the builder implements it). Every id is an accessibility identifier. <key> is the item key
// the other screens use ("C1|1|pPathtoExile"); <gk> is the package key ("C1::Gamma Cards").
//   Entry     After a tap on Packages in duo-tab-bar, the screen shows hand-query. If it does not, the test taps
//             hand-open (a button on the Packages page). The decision record does not say which: the mockup README says
//             "On the open Duo, Card in Hand is the Packages tab", its Defaults say Packages keeps one page, and HandModel
//             speaks of a sheet. Either entry passes. Neither passes if hand-query never shows.
//   Left page hand-query (the text field, placeholder "Type the card in hand"), hand-count (the "N in . M out" line;
//             its label is the text), hand-held (the Suspense line; present only while a name is held; its label holds
//             the held name, any case), hand-strays (the strays list; present only while a stray exists; its label holds
//             each stray name, any case), hand-new-envelope (the New envelope button).
//   Held chip hand-held-chip (inside the search field, on the left page; present while a card is held or released; its label
//             is the spoken line "Held: <name>. Released: <names>. Not checked in.", which the chip cases read whole; the visible
//             "1 held" text is not in the tree). hand-field (the search field's box, the 48 pt frame around the typed
//             text and the chip). hand-query is the text field alone, so the chip, which sits beside it, is not inside it.
//   Right page hand-answer (the whole right page), hand-who (the envelope's seller; present only when one envelope is
//             named; its label is the seller alone), hand-line:<key> (each line of that envelope, the typed card and
//             its envelope-mates), hand-checkin:<key> (the line's check-in control, labelled "Check in <name>" or
//             "Undo check in <name>", as checkin: is), hand-tie (the tie of envelopes that hold a held shared name;
//             present instead of hand-who), hand-post (the Post button; its label starts with "Post"; present exactly
//             while HandModel.offer is set), hand-past-transit-open (the Open control of the "Past 14 days" box).
//   Match list hand-matches-heading (the heading over the hand-hit:<name> rows; present while the list shows; BELOW the
//             "This envelope" row, whose New envelope button is hand-new-envelope: the list opens and shrinks as you type, and
//             the row above it must not move under the pointer, no-layout-shift-under-pointer).
//   Past transit   past-transit-page (the right page while it shows), past-transit-row:<gk> (one row per late package, a
//             container whose children are reachable), and inside a row the buttons labelled "Claim filed" and "Refunded".
//             There is no button labelled "Lost" (item 25, deferred). past-transit-summary (the page's count line; its label
//             starts "<N> envelope"). A red row (30 days from the order date) shows no "claim by" in any of its texts.
//   Keys      With the system keys up, hand-post lies wholly above the keyboard's top edge, with no scroll by the user.
//   Sender    With the offer shown and the keys up, the "It came from" line and hand-who lie below the status bar and above the
//             keyboard's top edge, hittable, together with hand-post. The "It came from" line has no identifier: the test finds it
//             by its label, any case (the screen sets it in capitals).
//   Failure   hand-checkin-error (a text overlaid at the top of the right (envelope) page of Card in Hand, where the line
//             check-ins are; present only after a line check-in whose save failed;
//             its label is the failure line PackagesModel.checkInError holds, which starts "Could not save the check-in.").
//             Packages' own checkin-error sits under the opaque Card in Hand page and Packages is hidden from accessibility
//             while it shows, so that id cannot pass.
// A lone card that names one envelope may check in by Post or by tapping its line (the mockup shows a stepper and no
// Post). The stray case checks in by whichever the screen offers. The held case needs Post.
//
// Every key here is fake. Launch with -ManifestUITestSeed only (XCUIApplication.launchedOnSeed). The exceptions are
// testFailedLineCheckInShowsInHand and testPostHoldsTheLinesStillWhenItsSaveFails, which add -ManifestUITestLedgerUnwritable
// (Debug builds only; it makes the next save fail; see the first test).

import XCTest

@MainActor
final class DuoHandUITests: XCTestCase {
    static let tolerance = DuoShellUITests.tolerance
    static let foldMargin = DuoShellUITests.foldMargin
    /// The least a status bar takes at the window's top. The Duo's inner-screen top inset is unmeasured (duo-fold-and-keyboard lists
    /// none), so this floor stands in when the status bar is not in the accessibility tree (XCUIApplication.listTop).
    static let statusBarFloor: CGFloat = 20
    /// How far above its reported frame the keyboard panel draws on the open Duo: the panel starts near y 405 pt and the frame at 449 pt,
    /// so a view under the top 44 pt of the panel is covered although it clears the frame. The figure's record is duo-fold-and-keyboard.
    static let keyboardDrawnAbove: CGFloat = 44
    /// The text size of the AccessibilityXL (AX3) match-row case. The launch flag sets it; nothing here reads it back.
    static let accessibilityXL = "UICTContentSizeCategoryAccessibilityXL"
    /// The text size of the AccessibilityXXXL (AX5) chip case. The chip is capped at xxxLarge, so it must still fit its field.
    static let accessibilityXXXL = "UICTContentSizeCategoryAccessibilityXXXL"

    static let bolt = "C1|0|pLightningBolt"
    static let path = "C1|1|pPathtoExile"
    static let swords = "C1|2|pSwordstoPlowshares"
    static let boltOfAlpha = "A1|0|pLightningBolt"
    /// The late packages in the seed, oldest last: dated 2026-07-29, 2026-07-01 and 2026-05-01. The last two are 30 days or more on any clock the page needs.
    static let lateMail = ["B1::Beta Games", "A1::Alpha Cards", "D1::Delta Cards"]

    override func setUp() {
        super.setUp()
        continueAfterFailure = false  // a missing control ends the test, so no later tap lands on nothing
    }

    override func tearDown() {
        let name = self.name
        MainActor.assumeIsolated { DuoShot.keep(name: name) }
        super.tearDown()
    }

    // MARK: helpers

    /// An element that must show within 5 s.
    func need(_ app: XCUIApplication, _ id: String, _ what: String) -> XCUIElement {
        let el = app.element(id)
        XCTAssertTrue(el.waitForExistence(timeout: 5), "\(id) is missing: \(what)")
        return el
    }

    /// The open Duo with Card in Hand showing. Packages in the bar first; if the query is not there, the hand-open button.
    func openHand(_ app: XCUIApplication) {
        let bar = need(app, "duo-tab-bar", "the custom tab bar of the open Duo")
        bar.buttons["Packages"].tap()
        if !app.element("hand-query").waitForExistence(timeout: 3) {
            let open = app.element("hand-open")
            XCTAssertTrue(open.waitForExistence(timeout: 2), "Card in Hand did not open: after a tap on Packages there is neither hand-query nor hand-open")
            open.tap()
        }
        _ = need(app, "hand-query", "the query field of Card in Hand")
    }

    /// Replaces the query with `text`: a tap at the field's right end (the caret lands after the old text), the old text
    /// deleted, the new text typed. An empty field's value reads as its placeholder, so that is not text to delete.
    func typeCard(_ app: XCUIApplication, _ text: String) {
        let query = app.element("hand-query")
        query.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        let old = typedText(query)
        if !old.isEmpty {
            query.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: old.count))
        }
        query.typeText(text)
    }

    /// The text in the query field, "" when the field is empty. An empty field's value reads as its placeholder.
    func typedText(_ query: XCUIElement) -> String {
        guard let value = query.value as? String, value != query.placeholderValue else { return "" }
        return value
    }

    func onLeftPage(_ el: XCUIElement, _ app: XCUIApplication, _ what: String) {
        let f = el.frame, mid = app.window.frame.midX
        XCTAssertLessThanOrEqual(f.maxX, mid - Self.foldMargin + Self.tolerance, "\(what) is not on the left page: its frame is \(f), the fold starts at \(mid - Self.foldMargin)")
    }

    func onRightPage(_ el: XCUIElement, _ app: XCUIApplication, _ what: String) {
        let f = el.frame, mid = app.window.frame.midX
        XCTAssertGreaterThanOrEqual(f.minX, mid + Self.foldMargin - Self.tolerance, "\(what) is not on the right page: its frame is \(f), the fold ends at \(mid + Self.foldMargin)")
    }

    /// Waits until the element's label starts with `prefix`.
    func waitForLabel(_ el: XCUIElement, startingWith prefix: String, _ message: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label BEGINSWITH %@", prefix), object: el)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, "\(message); the label is \"\(el.label)\"")
    }

    /// Waits until the element is gone.
    func waitGone(_ el: XCUIElement, _ message: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: el)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, message)
    }

    /// Checks in the card the query names, when it alone names the envelope: by Post when the screen offers it, else by the line's own control.
    func checkInTypedCard(_ app: XCUIApplication, key: String) {
        let post = app.element("hand-post")
        if post.waitForExistence(timeout: 3) {
            post.tap()
        } else {
            let control = need(app, "hand-checkin:\(key)", "the line of the typed card")
            control.tap()
        }
    }

    /// Holds Lightning Bolt, then names Path to Exile: the next card offers a post. Returns the Post button, unscrolled and untapped.
    func offerPost(_ app: XCUIApplication) -> XCUIElement {
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        typeCard(app, "Path to Exile")
        return need(app, "hand-post", "the post the next card offers")
    }

    /// The system keys are up, whole inside the window: waits for them and returns their frame. A keyboard that is missing or off
    /// the window proves nothing about the space above it, so each of those fails.
    func requireKeysUp(_ app: XCUIApplication) -> CGRect {
        let keys = app.keyboards.firstMatch
        XCTAssertTrue(keys.waitForExistence(timeout: 5), "the system keys are not up, so nothing here shows the offer clears them; with a hardware keyboard attached the keys never draw (Simulator, I/O, Keyboard, Connect Hardware Keyboard off); with the simulator preference AutomaticMinimizationEnabled true they come up minimized (set it false: xcrun simctl spawn <udid> defaults write com.apple.keyboard.preferences AutomaticMinimizationEnabled -bool false; debt duo-keys-minimize-pref)")
        let k = keys.frame, win = app.window.frame
        XCTAssertGreaterThan(k.height, 200, "the keyboard frame \(k) is too short to be the keys (measured 263 pt on the open Duo)")
        XCTAssertGreaterThanOrEqual(k.minY, win.minY, "the keyboard frame \(k) starts above the window \(win)")
        XCTAssertLessThanOrEqual(k.maxY, win.maxY + Self.tolerance, "the keyboard frame \(k) ends below the window \(win): the keys are not up")
        return k
    }

    /// Waits until every element's frame has held for 3 reads, 0.2 s apart, so a read never lands in the keys' slide or the offer's
    /// scroll. Copied from MastheadBackupUITests.settle, which is an instance method of another XCTestCase and cannot be called here.
    func waitUntilStill(_ els: [XCUIElement]) {
        var last = els.map(\.frame), held = 0
        for _ in 0..<40 {
            Thread.sleep(forTimeInterval: 0.2)
            let now = els.map(\.frame)
            held = now == last ? held + 1 : 0
            if held >= 3 { return }
            last = now
        }
    }

    /// The search field's box keeps its frame, to 1 pt on each side. `act` names what was done, for the message.
    func assertFieldStays(_ field: XCUIElement, _ was: CGRect, _ act: String) {
        let now = field.frame
        XCTAssertTrue(abs(now.minX - was.minX) <= 1 && abs(now.minY - was.minY) <= 1 && abs(now.width - was.width) <= 1 && abs(now.height - was.height) <= 1,
                      "hand-field moved or resized \(act): its frame was \(was) and is \(now)")
    }

    /// Card in Hand, then the past-transit page on the right page.
    func openPastTransit(_ app: XCUIApplication) {
        openHand(app)
        let open = need(app, "hand-past-transit-open", "the Open control of the Past 14 days box")
        onRightPage(open, app, "the Open control")
        open.tap()
        let page = need(app, "past-transit-page", "the past-transit page")
        onRightPage(page, app, "the past-transit page")
    }

    /// Taps `kind` ("Claim filed" or "Refunded") on a late package's row of the past-transit page, then waits until the row no
    /// longer offers it: the stamp is saved. It waits on the buttons going, not on the "Stamped <kind>" text, because the reload
    /// that follows the write can drop the row (PastTransitModel.load ends the sticky rows).
    func stampLate(_ app: XCUIApplication, _ gk: String, _ kind: String) {
        let row = need(app, "past-transit-row:\(gk)", "a late package")
        let button = row.buttons[kind]
        XCTAssertTrue(button.exists, "the row \(gk) has no \(kind) button")
        button.tap()
        waitGone(button, "the \(kind) stamp on \(gk) was not saved: the row still offers it")
    }

    /// A1 stamped Claim filed from the past-transit page, the stamped filter turned on, and Card in Hand open again. A claim
    /// leaves A1 live, so the live ledger is the seed's and only the filter differs: the Packages list is A1 alone. It waits for
    /// B1, the newest package and the list's first card, to leave the list, so Card in Hand never opens on the list before the filter.
    func openHandWithStampedFilterOn(_ app: XCUIApplication) {
        openPastTransit(app)
        stampLate(app, "A1::Alpha Cards", "Claim filed")
        need(app, "hand-close", "the Close control of Card in Hand").tap()
        let cell = need(app, "stamped-cell", "the stamped cell of the Packages page, shown once Card in Hand is closed")
        waitForLabel(cell, startingWith: "1 stamped", "the stamp did not reach the Packages page")
        let newest = app.element("package-row:B1::Beta Games")
        XCTAssertTrue(newest.waitForExistence(timeout: 5), "control: with the filter off the Packages list holds B1, its newest package")
        cell.tap()
        waitGone(newest, "the stamped filter did not narrow the Packages list to A1")
        openHand(app)
    }

    // MARK: the cases

    /// Pose: flat. Card in Hand opens: the query on the left page, the answer on the right, the bar under the right page
    /// with Packages selected.
    func testOpensOnTheFlatDuo() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)

        onLeftPage(app.element("hand-query"), app, "the query field")
        _ = need(app, "hand-count", "the left page's count line")
        let answer = need(app, "hand-answer", "the right page")
        onRightPage(answer, app, "the answer page")
        XCTAssertGreaterThan(answer.frame.width, app.window.frame.width * 0.3, "the answer page is narrower than a page")

        let bar = app.element("duo-tab-bar")
        XCTAssertTrue(bar.buttons["Packages"].isSelected, "the Packages button lacks the selected trait while Card in Hand shows")
        onRightPage(bar, app, "the tab bar")
        keepShot(app, "hand-open")
    }

    /// Pose: flat. A name that only one envelope holds shows that envelope on the right page, with its envelope-mates,
    /// and checks nothing in.
    func testTypingShowsTheEnvelope() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let count = need(app, "hand-count", "the left page's count line").label

        typeCard(app, "Path to Exile")
        let who = need(app, "hand-who", "the envelope the typed card came from")
        XCTAssertEqual(who.label, "Gamma Cards", "Path to Exile is only in order C1 from Gamma Cards")
        onRightPage(who, app, "the seller")
        let typed = need(app, "hand-line:\(Self.path)", "the typed card's line")
        onRightPage(typed, app, "the typed card's line")
        let mate = need(app, "hand-line:\(Self.swords)", "an envelope-mate of the typed card")
        onRightPage(mate, app, "the envelope-mate's line")
        XCTAssertFalse(app.element("hand-line:\(Self.boltOfAlpha)").exists, "a line of another envelope (A1) shows on the answer page")

        XCTAssertEqual(app.element("hand-checkin:\(Self.path)").label, "Check in Path to Exile", "typing checked the card in")
        XCTAssertEqual(app.element("hand-count").label, count, "typing changed the count: it saved something")
        keepShot(app, "hand-envelope")
    }

    /// Pose: flat. A name three envelopes share is held. No envelope is named, the tie shows, no post is offered, and nothing is saved.
    func testSharedNameIsHeldWithNoPost() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let count = need(app, "hand-count", "the left page's count line").label

        typeCard(app, "Lightning Bolt")
        let held = need(app, "hand-held", "the Suspense line of a held name")
        XCTAssertTrue(held.label.lowercased().contains("lightning bolt"), "the Suspense line does not name Lightning Bolt: \"\(held.label)\"")
        onLeftPage(held, app, "the Suspense line")
        let tie = need(app, "hand-tie", "the envelopes that hold the shared name")
        onRightPage(tie, app, "the tie")
        XCTAssertFalse(app.element("hand-who").exists, "a tie named one envelope")
        XCTAssertFalse(app.element("hand-post").exists, "a held shared name offered a post")
        XCTAssertEqual(app.element("hand-count").label, count, "holding a name changed the count: it saved something")
        keepShot(app, "hand-tie")
    }

    /// Pose: flat. The next card, unique to one envelope that also holds the held name, offers a post. Nothing is
    /// checked in until Post is tapped. Post checks in the held copy and the typed copy and clears the hold.
    func testNextCardOffersPostAndPostChecksIn() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let count = need(app, "hand-count", "the left page's count line").label

        let post = offerPost(app)
        XCTAssertTrue(post.label.hasPrefix("Post"), "the post button reads \"\(post.label)\"")
        onRightPage(post, app, "the Post button")
        XCTAssertEqual(app.element("hand-who").label, "Gamma Cards", "the next card names order C1")
        XCTAssertEqual(app.element("hand-checkin:\(Self.bolt)").label, "Check in Lightning Bolt", "the offer checked the held copy in")
        XCTAssertEqual(app.element("hand-checkin:\(Self.path)").label, "Check in Path to Exile", "the offer checked the typed copy in")
        XCTAssertEqual(app.element("hand-count").label, count, "the offer changed the count: nothing is checked in until Post")
        keepShot(app, "hand-post")

        post.tap()
        waitForLabel(app.element("hand-checkin:\(Self.bolt)"), startingWith: "Undo check in", "Post did not check in the held Lightning Bolt")
        waitForLabel(app.element("hand-checkin:\(Self.path)"), startingWith: "Undo check in", "Post did not check in Path to Exile")
        XCTAssertNotEqual(app.element("hand-count").label, count, "Post saved nothing: the count line is as before")
        waitGone(app.element("hand-held"), "the post that named the held name left it held")
        waitGone(app.element("hand-post"), "the post is still offered after it posted")
    }

    /// Pose: flat. New envelope releases a held name as a stray: it is listed, it no longer decides, and it saves
    /// nothing. The next card then checks in alone, and the stray's copy stays unchecked.
    func testNewEnvelopeMakesAStray() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let count = need(app, "hand-count", "the left page's count line").label

        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        let newEnvelope = need(app, "hand-new-envelope", "the New envelope button")
        onLeftPage(newEnvelope, app, "the New envelope button")
        newEnvelope.tap()
        let strays = need(app, "hand-strays", "the list of released names")
        XCTAssertTrue(strays.label.lowercased().contains("lightning bolt"), "the strays do not list Lightning Bolt: \"\(strays.label)\"")
        onLeftPage(strays, app, "the strays list")
        waitGone(app.element("hand-held"), "the name is still held after New envelope")
        waitGone(app.element("hand-post"), "New envelope left a post offered")
        XCTAssertEqual(app.element("hand-count").label, count, "New envelope changed the count: it saved something")
        keepShot(app, "hand-stray")

        typeCard(app, "Path to Exile")
        XCTAssertEqual(need(app, "hand-who", "the envelope of the next card").label, "Gamma Cards", "the next card names order C1")
        XCTAssertEqual(app.element("hand-checkin:\(Self.bolt)").label, "Check in Lightning Bolt", "the stray's copy is checked in before the post")
        checkInTypedCard(app, key: Self.path)
        waitForLabel(app.element("hand-checkin:\(Self.path)"), startingWith: "Undo check in", "the next card was not checked in")
        XCTAssertTrue(app.element("hand-checkin:\(Self.bolt)").label.hasPrefix("Check in "), "the stray joined the next envelope's check-in")
        XCTAssertTrue(app.element("hand-strays").exists, "the stray left the list while no post named it")
    }

    /// Pose: flat. A shared name is held, so the tie shows on the answer page. New envelope releases it as a stray, and the
    /// tie must leave the answer page with it: the answer page must not keep asking for the next card from the ended envelope.
    /// The tie is seen first, so the case cannot pass by never having had one. The typed card goes too: the field is empty
    /// and the answer page shows its empty state, not "No open envelope holds" for a card the ended envelope never held.
    func testNewEnvelopeLeavesNoTieOnTheAnswerPage() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)

        typeCard(app, "Counterspell")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        _ = need(app, "hand-tie", "the tie of the envelopes that hold Counterspell, shown before New envelope")
        let newEnvelope = need(app, "hand-new-envelope", "the New envelope button")
        newEnvelope.tap()
        let strays = need(app, "hand-strays", "the Released box of the name New envelope released")
        XCTAssertTrue(strays.label.lowercased().contains("counterspell"), "the Released box does not list Counterspell: \"\(strays.label)\"")
        waitUntilStill([strays, newEnvelope, app.element("hand-answer")])
        let prompt = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Name the next card from this envelope")).firstMatch
        XCTAssertFalse(app.element("hand-tie").exists || prompt.exists,
                       "New envelope left the tie of the released name on the answer page, which still asks for the next card from the ended envelope")

        let answer = need(app, "hand-answer", "the answer page of Card in Hand")
        XCTAssertEqual(typedText(app.element("hand-query")), "", "New envelope left the typed card in the field")
        XCTAssertTrue(answer.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Type the card in hand. The envelope")).firstMatch.exists,
                      "the answer page is not on its empty state after New envelope, so its no-match line cannot be judged")
        XCTAssertFalse(answer.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "No open envelope holds")).firstMatch.exists,
                       "New envelope left the no-match line \"No open envelope holds\" on the answer page for the typed card")
    }

    /// Pose: flat. New envelope ends the envelope while a Suspense box shows, with a Released box already shown:
    /// an earlier New envelope released Lightning Bolt, then Brainstorm is held. The Suspense box leaves when New envelope is
    /// pressed, so the envelope row and its New envelope button must not move under the pointer (no-layout-shift-under-pointer,
    /// decision duo-card-in-hand). The button is read once the page has stopped moving, tapped, and read again once it is still.
    func testNewEnvelopeHoldsStillUnderASuspenseBox() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)

        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        need(app, "hand-new-envelope", "the New envelope button").tap()
        _ = need(app, "hand-strays", "the Released box of the first name New envelope released")
        waitGone(app.element("hand-held"), "the name is still held after the first New envelope")

        typeCard(app, "Brainstorm")
        let held = need(app, "hand-held", "the Suspense line of Brainstorm, a shared name")
        XCTAssertTrue(held.label.lowercased().contains("brainstorm"), "the Suspense line does not name Brainstorm: \"\(held.label)\"")
        let strays = need(app, "hand-strays", "the Released box that holds Lightning Bolt")
        XCTAssertTrue(strays.label.lowercased().contains("lightning bolt"), "the Released box does not list Lightning Bolt: \"\(strays.label)\"")
        let newEnvelope = need(app, "hand-new-envelope", "the New envelope button")
        waitUntilStill([held, strays, newEnvelope])
        let before = newEnvelope.frame

        newEnvelope.tap()
        waitGone(app.element("hand-held"), "the name is still held after New envelope")
        let released = need(app, "hand-strays", "the Released box after New envelope")
        XCTAssertTrue(released.label.lowercased().contains("brainstorm"), "the Released box does not list Brainstorm after New envelope: \"\(released.label)\"")
        waitUntilStill([newEnvelope])
        let after = newEnvelope.frame
        XCTAssertEqual(after.minY, before.minY, accuracy: 1, "New envelope moved \(after.minY - before.minY) pt, from \(before) to \(after): the Suspense box above it left when New envelope was pressed")
        keepShot(app, "hand-new-envelope-holds-still")
    }

    /// Pose: flat. The past-transit page lists the late mail, oldest last, on the right page. A tracked package is not
    /// on it. Each row offers Claim filed and Refunded, and nothing offers Lost.
    func testPastTransitListsLateMailOldestLast() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openPastTransit(app)

        var tops: [CGFloat] = []
        for gk in Self.lateMail {
            let row = need(app, "past-transit-row:\(gk)", "a late package")
            onRightPage(row, app, "the row \(gk)")
            XCTAssertTrue(row.buttons["Claim filed"].exists, "the row \(gk) has no Claim filed button")
            XCTAssertTrue(row.buttons["Refunded"].exists, "the row \(gk) has no Refunded button")
            tops.append(row.frame.minY)
        }
        XCTAssertEqual(tops, tops.sorted(), "the rows are not oldest last: B1 (29 Jul), A1 (1 Jul), D1 (1 May) must read top to bottom")
        XCTAssertEqual(Set(tops).count, 3, "two rows share a place")
        XCTAssertFalse(app.element("past-transit-row:C1::Gamma Cards").exists, "a tracked package is listed as late mail")
        XCTAssertFalse(app.buttons["Lost"].exists, "a Lost button shows: the page offers the existing stamps only")
        keepShot(app, "hand-past-transit")
    }

    /// Pose: flat, system keys up. The Post offer lies wholly above the keys, hittable, with no scroll by the test. A tap or a
    /// scrollToVisible on it would scroll it into view, which the owner's thumb does not, so after the offer shows this test
    /// reads frames only. The keys must really be up: a keyboard that is missing or off the window proves nothing and fails.
    func testPostOfferClearsTheKeys() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)

        let k = requireKeysUp(app)
        let f = post.frame
        XCTAssertLessThanOrEqual(f.maxY, k.minY, "the Post button, frame \(f), is under the keys, which start at y \(k.minY): the owner must scroll to reach it")
        XCTAssertTrue(post.isHittable, "the Post button, frame \(f), is not hittable with the keys up and no scroll")
        keepShot(app, "hand-post-clears-keys")
    }

    /// Pose: flat, system keys up. A held card's Post offer shows with "It came from" and the seller still on the page: below the
    /// status bar, above the keys, hittable, and the Post button hittable at the same time. Without the sender, "Post ... here" names
    /// no envelope. The test never taps or scrolls: it reads frames once the offer and the keys have stopped moving. After the keys
    /// are checked, a failed assertion does not end the test, so one red run reports the sender, the seller and the offer together.
    func testPostOfferKeepsTheSenderOnThePage() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)
        let came = app.staticTexts.matching(NSPredicate(format: "label ==[c] %@", "It came from")).firstMatch
        let who = app.element("hand-who")
        let keys = app.keyboards.firstMatch
        _ = requireKeysUp(app)
        waitUntilStill([keys, post, came, who].filter(\.exists))

        let keysTop = keys.frame.minY - Self.keyboardDrawnAbove
        let barFoot = max(app.listTop, app.window.frame.minY + Self.statusBarFloor)
        continueAfterFailure = true
        func clear(_ el: XCUIElement, _ what: String) {
            guard el.exists else { return XCTFail("\(what) is not on the answer page at all, so the owner cannot read it") }
            let f = el.frame
            XCTAssertGreaterThanOrEqual(f.minY, barFoot, "\(what), frame \(f), starts above y \(barFoot), the foot of the status bar: it is scrolled off the top or under the clock and status icons")
            XCTAssertLessThanOrEqual(f.maxY, keysTop, "\(what), frame \(f), is under the keys, which start at y \(keysTop)")
            XCTAssertTrue(el.isHittable, "\(what), frame \(f), is not hittable with the keys up and no scroll: it is off the page or covered")
        }
        clear(came, "the \"It came from\" line")
        clear(who, "the seller name (hand-who)")
        clear(post, "the Post button (hand-post)")
        keepShot(app, "hand-post-keeps-sender")
    }

    /// Pose: flat, system keys up. A held name's Suspense box shows, and the one match row must clear the keys. A box above
    /// the list would push the row under them, so the boxes sit below the matches (decision duo-card-in-hand).
    func testMatchRowClearsTheKeysUnderASuspenseBox() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        XCTAssertFalse(app.element("hand-strays").exists, "a Released box shows as well as the Suspense box, so this is not the Suspense case")
        assertOnlyMatchClearsTheKeys(app, box: "Suspense")
    }

    /// Pose: flat, system keys up. A released name's Released box shows, and the one match row must clear the keys, as in the
    /// Suspense case.
    func testMatchRowClearsTheKeysUnderAReleasedBox() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        need(app, "hand-new-envelope", "the New envelope button").tap()
        _ = need(app, "hand-strays", "the Released box of the released name")
        waitGone(app.element("hand-held"), "the name is still held after New envelope")
        typeCard(app, "Path to Exile")
        XCTAssertFalse(app.element("hand-held").exists, "a Suspense box shows as well as the Released box, so this is not the Released case")
        assertOnlyMatchClearsTheKeys(app, box: "Released")
    }

    /// Pose: flat, system keys up, text at AccessibilityXL, no box. The typed name leaves one match row, and that row must lie wholly
    /// above the keys' drawn top (duo-fold-and-keyboard). The Suspense and Released cases show a box and set no text size, so no
    /// other case pins this row with no box at large text.
    func testMatchRowClearsTheKeysAtAccessibilityXL() {
        let app = XCUIApplication.launchedOnSeed(extra: ["-UIPreferredContentSizeCategoryName", Self.accessibilityXL])
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Path to Exile")
        XCTAssertFalse(app.element("hand-held").exists, "a Suspense box shows for Path to Exile, which no held name matches: this is not the no-box case")
        XCTAssertFalse(app.element("hand-strays").exists, "a Released box shows for Path to Exile: this is not the no-box case")
        assertOnlyMatchClearsTheKeys(app, box: nil, at: "AccessibilityXL")
    }

    /// Pose: flat, system keys up. The typed name must leave exactly one match row, and that row must lie wholly above the keys'
    /// drawn top and be hittable. `box` names the box that shows ("Suspense" or "Released"), or nil for no box. `size` names the
    /// text size the test launched at, for the message. The row is read once the keys and the list have stopped moving.
    /// No tap and no scroll. The typed name leaves one row, so that row is the list's only row and the one the keys can cover.
    func assertOnlyMatchClearsTheKeys(_ app: XCUIApplication, box: String?, at size: String? = nil) {
        let state = (size.map { "at \($0) " } ?? "") + (box.map { "while the \($0) box shows" } ?? "with no box shown")
        let rows = waitForHits(app, count: 1, "the typed name must leave exactly one match \(state)")
        guard let row = rows.first else { return }  // waitForHits has already failed the test
        let keys = app.keyboards.firstMatch
        _ = requireKeysUp(app)
        waitUntilStill([keys, row])
        let keysTop = keys.frame.minY - Self.keyboardDrawnAbove
        let f = row.frame
        XCTAssertLessThanOrEqual(f.maxY, keysTop, "the match row \(row.identifier), frame \(f), ends at y \(f.maxY), under the keys' drawn top at y \(keysTop) (the keyboard frame starts at y \(keys.frame.minY), drawn \(Self.keyboardDrawnAbove) pt higher) \(state): the owner must scroll to reach it")
        XCTAssertTrue(row.isHittable, "the match row \(row.identifier), frame \(f), is not hittable with the keys up and no scroll \(state)")
        keepShot(app, "hand-match-clears-keys-\(box?.lowercased() ?? "no-box")")
    }

    /// Waits until the held chip's label is exactly `spoken`. HandScreen sets that label to the spoken line; the visible "1 held"
    /// text is not in the accessibility tree, so the label is all a test reads.
    func assertChipSpeaks(_ chip: XCUIElement, _ spoken: String, _ state: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", spoken), object: chip)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, "the held chip reads \"\(chip.label)\", not \"\(spoken)\" \(state)")
    }

    /// Pose: flat, system keys up. The held chip shows while a card is held or released, so it is the one thing above the keys that says
    /// a card waits (debt hand-held-box-under-keys). It must lie wholly above the keys' drawn top and be hittable. `state` names the case
    /// for the message and `shot` the run's screenshot. No tap and no scroll: the frames are read once the keys and the chip have stopped moving.
    func assertChipClearsTheKeys(_ app: XCUIApplication, _ state: String, shot: String) {
        let keys = app.keyboards.firstMatch
        _ = requireKeysUp(app)
        let chip = need(app, "hand-held-chip", "the held chip in the search field, which shows while a card is held (\(state))")
        waitUntilStill([keys, chip])
        // Every caller holds Lightning Bolt and releases nothing, so the chip must read the held line alone.
        assertChipSpeaks(chip, "Held: Lightning Bolt. Not checked in.", state)
        let keysTop = keys.frame.minY - Self.keyboardDrawnAbove
        let f = chip.frame
        XCTAssertLessThanOrEqual(f.maxY, keysTop, "the held chip, frame \(f), ends at y \(f.maxY), under the keys' drawn top at y \(keysTop) (the keyboard frame starts at y \(keys.frame.minY), drawn \(Self.keyboardDrawnAbove) pt higher) \(state): the owner cannot see that a card waits")
        XCTAssertTrue(chip.isHittable, "the held chip, frame \(f), is not hittable with the keys up \(state)")
        onLeftPage(chip, app, "the held chip \(state)")
        keepShot(app, shot)
    }

    /// Pose: flat, system keys up. A held card and no match: the list is empty, and the held chip must still clear the keys.
    func testChipClearsTheKeysWithNoMatch() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        typeCard(app, "Zzz")
        waitForMatches(app, [], "typing Zzz must list no match")
        assertChipClearsTheKeys(app, "with default text and no match", shot: "hand-chip-no-match")
    }

    /// Pose: flat, system keys up. A held card and one match: "Path to" lists Path to Exile alone, which is in Gamma Cards only.
    func testChipClearsTheKeysWithOneMatch() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        typeCard(app, "Path to")
        waitForMatches(app, ["Path to Exile"], "typing Path to must list Path to Exile alone")
        assertChipClearsTheKeys(app, "with default text and one match", shot: "hand-chip-one-match")
    }

    /// Pose: flat, system keys up. A held card and two matches: "er" lists Counterspell and Ponder, the seed's two names with "er".
    func testChipClearsTheKeysWithTwoMatches() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        typeCard(app, "er")
        waitForMatches(app, ["Counterspell", "Ponder"], "typing er must list Counterspell and Ponder")
        assertChipClearsTheKeys(app, "with default text and two matches", shot: "hand-chip-two-matches")
    }

    /// Pose: flat, system keys up, text at AccessibilityXL (AX3). A held card and two matches. The match rows may sit under the keys at
    /// this size (testMatchRowClearsTheKeysAtAccessibilityXL), so this case reads the chip only.
    func testChipClearsTheKeysAtAccessibilityXLWithTwoMatches() {
        let app = XCUIApplication.launchedOnSeed(extra: ["-UIPreferredContentSizeCategoryName", Self.accessibilityXL])
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        typeCard(app, "er")
        waitForMatches(app, ["Counterspell", "Ponder"], "typing er must list Counterspell and Ponder, at AccessibilityXL")
        assertChipClearsTheKeys(app, "at AccessibilityXL with two matches", shot: "hand-chip-ax3")
    }

    /// Pose: flat, text at AccessibilityXXXL (AX5). A held card and a released one: the widest chip, "1 held · 1 released". The chip is
    /// capped at xxxLarge, so it must stay inside the search field's box (hand-field), which holds the typed text beside it. No tap on
    /// the chip and no scroll; the frames are read once they have stopped moving.
    func testChipStaysInTheFieldAtAccessibilityXXXL() {
        let app = XCUIApplication.launchedOnSeed(extra: ["-UIPreferredContentSizeCategoryName", Self.accessibilityXXXL])
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        need(app, "hand-new-envelope", "the New envelope button").tap()
        _ = need(app, "hand-strays", "the Released box of the name New envelope released")
        typeCard(app, "Brainstorm")
        _ = need(app, "hand-held", "the Suspense line of Brainstorm, a shared name, held beside the released Lightning Bolt")
        let field = need(app, "hand-field", "the search field's box, which holds the typed text and the held chip")
        let chip = need(app, "hand-held-chip", "the held chip in the search field, which shows while a card is held and one is released")
        waitUntilStill([field, chip])
        assertChipSpeaks(chip, "Held: Brainstorm. Released: Lightning Bolt. Not checked in.", "with Brainstorm held and Lightning Bolt released")
        let box = field.frame, f = chip.frame
        XCTAssertTrue(box.insetBy(dx: -Self.tolerance, dy: -Self.tolerance).contains(f), "the held chip, frame \(f), is outside the search field, frame \(box), at AccessibilityXXXL: the chip overflows its box")
        keepShot(app, "hand-chip-ax5")
    }

    /// Pose: flat, system keys up. A held card and two matches ("er"). A tap on a match row, then a New envelope press: neither moves the
    /// held chip, and the tapped row keeps its place (no-layout-shift-under-pointer). Both are read by their top edge. The search
    /// field's box (hand-field) keeps its whole frame through both acts.
    func testTapAndNewEnvelopeMoveNoChipOrRow() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        _ = need(app, "hand-held", "the Suspense line of a held name")
        typeCard(app, "er")
        waitForMatches(app, ["Counterspell", "Ponder"], "typing er must list Counterspell and Ponder")
        let chip = need(app, "hand-held-chip", "the held chip in the search field, which shows while a card is held")
        let field = need(app, "hand-field", "the search field's box, which holds the typed text and the held chip")
        let row = app.element("hand-hit:Ponder")
        waitUntilStill([chip, row, field])
        let chipBefore = chip.frame.minY, rowBefore = row.frame.minY, fieldBefore = field.frame

        row.tap()  // Ponder is in Gamma Cards alone, so the tap opens no Suspense line
        waitForMatches(app, ["Counterspell", "Ponder"], "tapping Ponder must hold both rows, not collapse to the tapped one")
        waitUntilStill([chip, row, field])
        continueAfterFailure = true
        XCTAssertEqual(chip.frame.minY, chipBefore, accuracy: 1, "the held chip moved \(chip.frame.minY - chipBefore) pt after a tap on a match row: from y \(chipBefore) to y \(chip.frame.minY)")
        XCTAssertEqual(row.frame.minY, rowBefore, accuracy: 1, "the tapped row hand-hit:Ponder moved \(row.frame.minY - rowBefore) pt under the finger: from y \(rowBefore) to y \(row.frame.minY)")
        assertFieldStays(field, fieldBefore, "after a tap on a match row")

        let chipBeforeEnvelope = chip.frame.minY, fieldBeforeEnvelope = field.frame
        need(app, "hand-new-envelope", "the New envelope button").tap()
        _ = need(app, "hand-strays", "the Released box of the card New envelope released")
        _ = need(app, "hand-held-chip", "the held chip after New envelope, which now reads released")
        waitUntilStill([chip, field])
        assertChipSpeaks(chip, "Released: Lightning Bolt. Not checked in.", "after New envelope releases Lightning Bolt")
        XCTAssertEqual(chip.frame.minY, chipBeforeEnvelope, accuracy: 1, "the held chip moved \(chip.frame.minY - chipBeforeEnvelope) pt after New envelope: from y \(chipBeforeEnvelope) to y \(chip.frame.minY)")
        assertFieldStays(field, fieldBeforeEnvelope, "after New envelope")
        keepShot(app, "hand-chip-tap-and-new-envelope")
    }

    /// Pose: flat. Holds Lightning Bolt and reads the chip, then Post checks the held copy in and clears the hold. With nothing held and
    /// nothing released the chip must be gone: it shows only while a card is held or released.
    func testChipGoesWhenPostChecksTheHeldCardIn() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Lightning Bolt")
        let chip = need(app, "hand-held-chip", "the held chip in the search field, which shows while Lightning Bolt is held")
        assertChipSpeaks(chip, "Held: Lightning Bolt. Not checked in.", "while Lightning Bolt is held")

        typeCard(app, "Path to Exile")
        need(app, "hand-post", "the Post button the next card offers").tap()
        waitGone(chip, "the held chip stayed after Post checked Lightning Bolt in, though nothing is held or released now")
    }

    /// The first lines of Gamma Cards, which sit under the offer. A Post presses above them, so none may move (no-layout-shift-under-pointer).
    static let stillLines = [bolt, path, swords]

    /// The frames of `stillLines` once the page has stopped moving. A row is its hand-line element: its top is the row's top plus a
    /// fixed pad, so a row that moves reads as a moved frame.
    func lineFrames(_ app: XCUIApplication) -> [String: CGRect] {
        let rows = Self.stillLines.map { need(app, "hand-line:\($0)", "a line under the Post offer") }
        waitUntilStill(rows)
        return Dictionary(uniqueKeysWithValues: zip(Self.stillLines, rows.map(\.frame)))
    }

    /// Each row in `before` has its top within 1 pt of where it was. Call it only after the test saw the Post land by a sign that
    /// does not need hand-receipt: waitUntilStill settles in 0.6 s, so a read that comes first sees rows that have not yet moved.
    /// A failed assertion does not end the test, so one red run names every row that moved.
    func assertLinesStayPut(_ app: XCUIApplication, _ before: [String: CGRect], after what: String) {
        let after = lineFrames(app)
        continueAfterFailure = true
        for key in Self.stillLines {
            guard let was = before[key], let now = after[key] else { return XCTFail("the line \(key) has no frame") }
            XCTAssertEqual(now.minY, was.minY, accuracy: 1, "the line \(key) moved \(now.minY - was.minY) pt \(what): its frame was \(was) and is \(now)")
        }
    }

    /// Pose: flat, system keys up. A Post that saves leaves the first lines under the offer where they were. The offer's slot keeps
    /// its height as a receipt (mockup duo-hand-post-sender, #s=a-posted); without it the lines rise into the slot the finger pressed.
    func testPostHoldsTheLinesStillWhenItSaves() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)
        _ = requireKeysUp(app)
        let before = lineFrames(app)

        post.tap()
        waitForLabel(app.element("hand-checkin:\(Self.path)"), startingWith: "Undo check in", "Post did not check in Path to Exile")
        waitGone(app.element("hand-post"), "the post is still offered after it posted")
        assertLinesStayPut(app, before, after: "when Post saved")
    }

    /// Pose: flat, system keys up. A Post that is refused leaves the first lines where they were. A line check-in made after the
    /// offer outdates its plan, so HandModel.post refuses, drops the offer and leaves a refused receipt in its slot.
    func testPostHoldsTheLinesStillWhenItIsRefused() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)
        _ = requireKeysUp(app)
        let held = need(app, "hand-checkin:\(Self.bolt)", "the held card's check-in control")
        held.tap()
        waitForLabel(held, startingWith: "Undo check in", "the line check-in did not save, so the offer is not outdated")
        XCTAssertTrue(post.exists, "the line check-in took the offer away, so the Post below is not a refusal")
        let before = lineFrames(app)

        post.tap()
        waitGone(app.element("hand-post"), "the refused post is still offered")
        XCTAssertTrue(app.element("hand-checkin:\(Self.path)").label.hasPrefix("Check in "), "Path to Exile is checked in, so the post was not refused")
        assertLinesStayPut(app, before, after: "when Post was refused")
    }

    /// Pose: flat. A Post that saves leaves its receipt in the offer's slot, under the sender: its text, and the line that says the
    /// next card clears it (HandScreen `receiptBox`). The next card is in the same envelope, so a receipt that stayed would show.
    /// The envelope is read first, so the receipt is judged on the page that should carry it.
    func testPostReceiptShowsItsTextThenClearsOnTheNextCard() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)
        post.tap()
        waitGone(app.element("hand-post"), "the post is still offered after it posted")

        let receipt = need(app, "hand-receipt", "the receipt a saved Post leaves in the offer's slot")
        onRightPage(receipt, app, "the receipt")
        XCTAssertTrue(receipt.label.contains("Posted with this envelope. The next card you type clears this line."),
                      "the receipt does not read the saved line: \"\(receipt.label)\"")
        XCTAssertTrue(receipt.label.contains("2 cards checked in \u{00B7} 1 was held"), "the receipt does not count the post: \"\(receipt.label)\"")
        keepShot(app, "hand-post-receipt")

        typeCard(app, "Swords to Plowshares")
        XCTAssertEqual(need(app, "hand-who", "the envelope of the next card").label, "Gamma Cards", "the next card does not show its envelope")
        waitGone(app.element("hand-receipt"), "the receipt is still shown after the next card was typed")
    }

    /// Pose: flat. New envelope ends the envelope with its receipt. The answer page is then on its empty state, and when the same
    /// envelope is named again no receipt of the ended one comes back. The receipt is cleared on New envelope and on the next card.
    func testPostReceiptDoesNotComeBackAfterNewEnvelope() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        offerPost(app).tap()
        _ = need(app, "hand-receipt", "the receipt a saved Post leaves in the offer's slot")

        need(app, "hand-new-envelope", "the New envelope button").tap()
        let answer = need(app, "hand-answer", "the answer page of Card in Hand")
        XCTAssertTrue(answer.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Type the card in hand. The envelope")).firstMatch.waitForExistence(timeout: 5),
                      "New envelope did not leave the answer page on its empty state, so the receipt cannot be judged")
        waitGone(app.element("hand-receipt"), "the receipt is still shown after New envelope")

        typeCard(app, "Swords to Plowshares")
        XCTAssertEqual(need(app, "hand-who", "the envelope of the card typed again").label, "Gamma Cards", "the card typed again does not show its envelope")
        waitGone(app.element("hand-receipt"), "the receipt of the ended envelope came back on its envelope after New envelope")
    }

    /// Pose: flat. A receipt belongs to the envelope its Post checked in (HandScreen `r.offer.gk == pkg.gk`). After a Post on Gamma
    /// Cards, a card that only Delta Cards holds shows Delta Cards, and the Gamma receipt does not come with it. The card is typed as
    /// "Urza", with no apostrophe to type. The Delta envelope is asserted first, so the absent receipt is judged where it should not show.
    func testPostReceiptStaysWithItsOwnEnvelope() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        offerPost(app).tap()
        _ = need(app, "hand-receipt", "the receipt a saved Post leaves in the offer's slot")

        typeCard(app, "Urza")
        XCTAssertEqual(need(app, "hand-who", "the envelope of Urza's Saga, which only Delta Cards holds").label, "Delta Cards",
                       "the card typed does not show Delta Cards")
        waitGone(app.element("hand-receipt"), "the receipt of the Gamma Cards Post shows on the Delta Cards envelope")
    }

    /// Pose: flat. A tap on a match holds its row (HandScreen `heldNames`) until the next keystroke or Close. A Post that saves must let
    /// the held rows go: the match list then has no hits, so no row shows. post() does not reset heldNames today, so the tapped row
    /// stays on the left page after Post (known gap: docs/debts/notes.md, the 2026-11-07 tap-shift line).
    func testPostClearsTheHeldMatchRows() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)
        need(app, "hand-hit:Path to Exile", "the match row of the typed card, which a tap holds").tap()
        XCTAssertTrue(app.element("hand-hit:Path to Exile").isSelected, "control: the tap did not hold the match row, which is not marked selected")

        post.tap()
        waitForLabel(app.element("hand-checkin:\(Self.path)"), startingWith: "Undo check in", "Post did not check in Path to Exile")
        waitGone(app.element("hand-post"), "the post is still offered after it posted")
        waitGone(app.firstElement(prefix: "hand-hit:"), "a held match row is still listed after Post: post() leaves heldNames set")
    }

    /// Pose: flat. A red row (30 days from the order date) has no claim date: the claim window is closed. Checked on every late
    /// row but the first (A1 and D1). A row is a container whose own label is empty, so the texts come from its children, and
    /// the row's seller proves the children were read. The page also carries a summary line, "<N> envelope...", with N the rows listed.
    func testRedPastTransitRowsShowNoClaimDate() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openPastTransit(app)

        for gk in Self.lateMail.dropFirst() {
            let row = need(app, "past-transit-row:\(gk)", "a red package")
            let texts = ([row.label] + row.descendants(matching: .any).allElementsBoundByIndex.map(\.label)).joined(separator: " | ")
            let seller = gk.components(separatedBy: "::").last ?? gk
            XCTAssertTrue(texts.contains(seller), "the texts of row \(gk) were not read: \"\(texts)\" lacks the seller")
            XCTAssertFalse(texts.localizedCaseInsensitiveContains("claim by"), "the red row \(gk) still shows a claim date: \"\(texts)\"")
        }

        let summary = need(app, "past-transit-summary", "the page's count of late envelopes")
        let text = summary.label
        guard let digits = text.range(of: #"^[0-9]+(?= envelope)"#, options: .regularExpression) else {
            return XCTFail("the summary label does not start with a count and \"envelope\": \"\(text)\"")
        }
        XCTAssertEqual(Int(text[digits]), Self.lateMail.count, "the summary \"\(text)\" counts a different number of envelopes than the page lists")
    }

    /// Pose: flat. The match list (the hand-hit rows) has its own heading, over the list and below the "This envelope" row, so
    /// the hits do not read as that envelope's and the row does not sit under a list that grows and shrinks as you type. The row
    /// is anchored by its New envelope button, which sits in it.
    func testMatchListHasItsOwnHeadingBelowThisEnvelope() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "Path to Exile")

        let hit = app.firstElement(prefix: "hand-hit:")
        XCTAssertTrue(hit.waitForExistence(timeout: 5), "typing Path to Exile listed no match (hand-hit:...)")
        let heading = need(app, "hand-matches-heading", "the heading over the match list")
        let envelope = need(app, "hand-new-envelope", "the This envelope row's New envelope button")
        XCTAssertLessThanOrEqual(envelope.frame.maxY, heading.frame.minY + Self.tolerance, "the This envelope row, frame \(envelope.frame), is not above the match heading, frame \(heading.frame)")
        XCTAssertLessThanOrEqual(heading.frame.maxY, hit.frame.minY + Self.tolerance, "the match heading, frame \(heading.frame), is not over its list, whose first row is at \(hit.frame)")
        keepShot(app, "hand-matches-heading")
    }

    /// Pose: flat. A tap on a match fills the query and the list holds its rows, so the New envelope button, which the owner's
    /// thumb reaches for next, does not move (no-layout-shift-under-pointer). "to" hits Brainstorm (two envelopes), Path to Exile
    /// and Swords to Plowshares in the seed, so the list has 3 rows. The 2nd, Path to Exile, is only in C1: it holds no name, so no
    /// Suspense line opens. The tapped row is marked selected. One more letter ends the hold, and the list reads the field again.
    /// With the list above the row, a list that shrinks would move the button up and this fails.
    func testTappingAMatchDoesNotMoveNewEnvelope() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "to")

        let rows = waitForHits(app, count: 3, "typing \"to\" must list Brainstorm, Path to Exile and Swords to Plowshares")
        XCTAssertEqual(rows.map(\.identifier), ["hand-hit:Brainstorm", "hand-hit:Path to Exile", "hand-hit:Swords to Plowshares"], "the seed's matches for \"to\", top to bottom")
        let envelope = need(app, "hand-new-envelope", "the New envelope button")
        let before = envelope.frame

        let listed = rows.count
        app.element(rows[1].identifier).tap()  // by id, so the tap is the 2nd row whatever order the query lists them in
        _ = need(app, "hand-who", "the envelope of Path to Exile, which shows once the tap has settled")  // the list reads the field 150 ms after a tap
        _ = waitForHits(app, count: listed, "tapping Path to Exile must hold all \(listed) rows, not collapse to the tapped one")
        XCTAssertTrue(app.element("hand-hit:Path to Exile").isSelected, "the tapped row hand-hit:Path to Exile is not marked selected")
        XCTAssertEqual(app.element("hand-query").value as? String, "Path to Exile", "the tap did not fill the query")
        XCTAssertFalse(app.element("hand-held").exists, "a Suspense line opened: the 2nd match is a shared name, so the seed no longer makes this test fair")
        let after = envelope.frame
        XCTAssertEqual(after.minY, before.minY, accuracy: 0.5, "New envelope moved from \(before) to \(after) after the tap on a match, which held the list at \(listed) rows")

        // A further letter ends the hold: the field no longer names a held row, so the list reads it again and finds none.
        let query = app.element("hand-query")
        query.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        query.typeText("s")
        _ = waitForHits(app, count: 0, "typing a letter after the tap must end the hold: \"Path to Exiles\" matches no row")
        keepShot(app, "hand-match-tap-holds-new-envelope")
    }

    /// Pose: flat. A tap on a match fills the query, and the list holds its rows. The tapped row must stay under the finger.
    /// The Suspense box that a shared name opens below the list must not rise above the old list foot (no-layout-shift-under-pointer).
    /// "o" lists seven names, Brainstorm then Counterspell.
    /// A1 and B1 both hold Counterspell, so tapping it opens a Suspense box. Rows are read once the list has stopped moving.
    func testTappingAMatchMovesNoRowUnderTheFinger() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "o")

        let rows = waitForHits(app, count: 7, "typing \"o\" must list seven names")
        XCTAssertEqual(rows[1].identifier, "hand-hit:Counterspell", "the 2nd match of \"o\" is not Counterspell, the name A1 and B1 share: \(rows.map(\.identifier))")
        XCTAssertFalse(app.element("hand-held").exists, "a Suspense line shows before the tap, so the box after the tap is not the one the tap opened")
        waitUntilStill(rows)
        let tapped = rows[1].identifier
        let before = rows[1].frame
        let foot = rows.map { $0.frame.maxY }.max() ?? 0  // the old list foot: the box must not rise above it
        let listed = rows.count

        app.element(tapped).tap()  // by id, so the tap is the 2nd row whatever order the query lists them in
        let held = need(app, "hand-held", "the Suspense line of Counterspell, a name A1 and B1 share")  // opens once the tap has settled
        _ = waitForHits(app, count: listed, "tapping Counterspell must hold all \(listed) rows, not collapse to the tapped one")
        XCTAssertTrue(app.element(tapped).isSelected, "the tapped row \(tapped) is not marked selected")
        XCTAssertEqual(app.element("hand-query").value as? String, "Counterspell", "the tap did not fill the query")
        let row = app.element(tapped)
        waitUntilStill([row, held])

        continueAfterFailure = true
        let after = row.frame
        // The label's horizontal position is not visible to XCUITest through the Button, so the design review checks it from shots.
        XCTAssertEqual(after.minY, before.minY, accuracy: 1, "the tapped row \(tapped) moved \(after.minY - before.minY) pt under the finger, from \(before) to \(after): the list shrank above it")
        XCTAssertGreaterThanOrEqual(held.frame.minY, foot - 1, "the Suspense box, frame \(held.frame), sits above the old list foot at y \(foot): it rose into the space the list left, under the finger")
        keepShot(app, "hand-match-tap-moves-no-row")
    }

    /// Pose: flat. With the stamped filter on, the count line still counts every live copy, not the stamped packages alone.
    /// A1 is stamped, so the Packages list is A1 (4 copies) and the count line reads "0 in . 4 out" today. It must read the
    /// seed's 14 copies, as it does with the filter off (debt hand-reads-stamped-filter-rows).
    func testStampedFilterLeavesTheHandCountAtEveryLiveCopy() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHandWithStampedFilterOn(app)

        let count = need(app, "hand-count", "the left page's count line")
        XCTAssertEqual(count.label, "0 in \u{00B7} 14 out", "with the stamped filter on, the count line reads the stamped list's copies, not the 14 live copies")
        keepShot(app, "hand-count-stamped-filter")
    }

    /// Pose: flat. With the stamped filter on, a card that is only in an unstamped envelope is found, and it checks in. Path to
    /// Exile is only in C1 (Gamma Cards), which holds no stamp. Today the screen reads "No open envelope holds ..." and shows no
    /// hand-who, because it looks the envelope up in the stamped list. The line's tap is then the model's toggle, which also
    /// reads that list (HandStampedFilterTests), so the check-in and the count line are asserted too.
    func testStampedFilterDoesNotHideAnUnstampedCardInHand() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHandWithStampedFilterOn(app)

        typeCard(app, "Path to Exile")
        let who = need(app, "hand-who", "the envelope of a card that only an unstamped package holds (the screen says no open envelope holds it)")
        XCTAssertEqual(who.label, "Gamma Cards", "Path to Exile is only in order C1 from Gamma Cards")
        onRightPage(who, app, "the seller")
        _ = need(app, "hand-line:\(Self.path)", "the typed card's line")

        checkInTypedCard(app, key: Self.path)
        waitForLabel(app.element("hand-checkin:\(Self.path)"), startingWith: "Undo check in", "the tap on the line of an unstamped package checked nothing in")
        let count = app.element("hand-count")
        waitForLabel(count, startingWith: "1 in", "the count line did not follow the check-in")
        XCTAssertEqual(count.label, "1 in \u{00B7} 13 out", "one of the 14 live copies is in")
    }

    /// Pose: flat. A Refunded stamp from the past-transit page takes the package out of the Tally (a-refund-leaves-every-count):
    /// Lightning Bolt owes 3 at rest (A1, B1, C1) and 2 once A1 is refunded. Today the page writes the stamp and reloads Packages
    /// and the late list, but not Tally, so Tally keeps the 3 until it loads again (debt hand-stamp-leaves-tally-stale).
    func testARefundStampedFromHandLeavesTally() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        let bar = need(app, "duo-tab-bar", "the custom tab bar of the open Duo")
        bar.buttons["Tally"].tap()
        waitForLabel(need(app, "tally-left:Lightning Bolt", "the Lightning Bolt row of Tally"), startingWith: "3 left",
                     "control: Tally owes 3 Lightning Bolt at rest")

        openPastTransit(app)
        stampLate(app, "A1::Alpha Cards", "Refunded")
        bar.buttons["Tally"].tap()
        waitForLabel(need(app, "tally-left:Lightning Bolt", "the Lightning Bolt row of Tally"), startingWith: "2 left",
                     "Tally still counts the refunded package's Lightning Bolt")
        keepShot(app, "hand-refund-leaves-tally")
    }

    /// The launch flag that makes a save fail. In a Debug build launched with -ManifestUITestSeed, ManifestApp.boot removes the
    /// ledger file after `store.load()` and puts an empty folder at its path, so the next save throws. A read-only file would
    /// not do: the ledger is written atomically, so it still saves. The next seeded boot removes the folder with the seed copy,
    /// so no restore step is needed. The model's own test of this way to fail a save is
    /// PackagesToggleTests.testFailedTapLeavesTheSaveFailureLineAndSavesNothing.
    static let ledgerUnwritable = "-ManifestUITestLedgerUnwritable"

    /// Pose: flat, system keys up. A line check-in made from the envelope page whose save fails shows the failure inside Card in
    /// Hand. Packages draws the same failure as checkin-error, but under Card in Hand's opaque page and hidden from accessibility,
    /// so only an element Card in Hand draws, hand-checkin-error, can pass. This test goes red for two reasons, told apart by the
    /// line's own label after the tap: "Undo check in" means the save did not fail (the seam above did not act); "Check in"
    /// means the save failed and Card in Hand shows nothing. The test taps the line's control and not Post, and
    /// reads frames only after the failure shows: a scroll by the test would hide a failure the owner's thumb cannot reach.
    func testFailedLineCheckInShowsInHand() {
        let app = XCUIApplication.launchedOnSeed(extra: [Self.ledgerUnwritable])
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let count = need(app, "hand-count", "the left page's count line").label

        typeCard(app, "Path to Exile")
        XCTAssertEqual(need(app, "hand-who", "the envelope of the typed card").label, "Gamma Cards", "Path to Exile is only in order C1 from Gamma Cards")
        let control = need(app, "hand-checkin:\(Self.path)", "the typed card's check-in control")
        XCTAssertEqual(control.label, "Check in Path to Exile", "the line starts checked in, so the tap below is a check-in")
        XCTAssertFalse(app.element("hand-checkin-error").exists, "a failure shows before any check-in")
        control.tap()

        let failure = app.element("hand-checkin-error")
        let shown = failure.waitForExistence(timeout: 5)
        keepShot(app, "hand-checkin-failed")  // before the checks, so a red run still leaves its shot
        let line = control.label
        XCTAssertFalse(line.hasPrefix("Undo check in"), "the check-in saved, so the save did not fail: the app ignored \(Self.ledgerUnwritable) (the seam is not built)")
        XCTAssertTrue(shown, "the save failed (the line still reads \"\(line)\") and Card in Hand shows no failure: hand-checkin-error is missing")
        XCTAssertEqual(app.element("hand-count").label, count, "the failed check-in changed the count")

        let text = failure.label
        XCTAssertTrue(text.hasPrefix("Could not save the check-in."), "the failure reads \"\(text)\", not the line PackagesModel.checkInError holds for a failed save")
        let f = failure.frame, win = app.window.frame
        XCTAssertFalse(f.isEmpty, "the failure has no size: frame \(f)")
        XCTAssertTrue(win.insetBy(dx: -Self.tolerance, dy: -Self.tolerance).contains(f), "the failure, frame \(f), is not on screen: the window is \(win)")
        let strip = app.partsInFoldStrip(prefixes: ["hand-checkin-error"])
        XCTAssertGreaterThan(strip.seen, 0, "the fold-strip scan found no hand-checkin-error")
        XCTAssertEqual(strip.inStrip, [], "the failure reaches into the fold strip")
        let keys = app.keyboards.firstMatch
        if keys.exists {
            XCTAssertLessThanOrEqual(f.maxY, keys.frame.minY, "the failure, frame \(f), is under the keys, which start at y \(keys.frame.minY)")
        }
        XCTAssertTrue(failure.isHittable, "the failure, frame \(f), is not hittable: something covers it")
        keepShot(app, "hand-checkin-error")
    }

    /// Pose: flat, system keys up. A Post whose save fails leaves the first lines where they were. HandModel.post keeps the offer
    /// when the save throws, so the offer's own box holds the slot and this case does not reach the receipt. The offer stays up
    /// after the failure (decision duo-card-in-hand), so the Post button is still there to press again.
    func testPostHoldsTheLinesStillWhenItsSaveFails() {
        let app = XCUIApplication.launchedOnSeed(extra: [Self.ledgerUnwritable])
        guard app.requirePose(.flat) else { return }
        openHand(app)
        let post = offerPost(app)
        _ = requireKeysUp(app)
        let before = lineFrames(app)

        post.tap()
        _ = need(app, "hand-error", "the failure line of a Post whose save failed")
        XCTAssertTrue(app.element("hand-checkin:\(Self.path)").label.hasPrefix("Check in "), "Path to Exile is checked in, so the save did not fail (the app ignored \(Self.ledgerUnwritable))")
        let kept = need(app, "hand-post", "the Post offer, which a failed save keeps")
        XCTAssertTrue(kept.label.hasPrefix("Post"), "the failed save dropped the Post offer: hand-post reads \"\(kept.label)\", not Post")
        assertLinesStayPut(app, before, after: "when Post's save failed")
    }

    /// Waits until the match list holds exactly the rows `names` (hand-hit:<name>). A row left from the last query cannot pass for
    /// this one, which a count alone would allow. Fails with `message` when it never does.
    func waitForMatches(_ app: XCUIApplication, _ names: [String], _ message: String) {
        let want = Set(names.map { "hand-hit:\($0)" })
        func ids() -> Set<String> { Set(app.elements(prefix: "hand-hit:").map(\.identifier)) }
        let deadline = Date().addingTimeInterval(5)
        while ids() != want && Date() < deadline { Thread.sleep(forTimeInterval: 0.1) }
        XCTAssertEqual(ids(), want, "\(message); the rows are \(ids().sorted())")
    }

    /// The hand-hit rows, top to bottom, once exactly `count` show (a short poll: the list settles 150 ms after the last key
    /// or tap). Fails with `message` when it never does.
    func waitForHits(_ app: XCUIApplication, count: Int, _ message: String) -> [XCUIElement] {
        func rows() -> [XCUIElement] {
            var seen = Set<String>()
            return app.elements(prefix: "hand-hit:").filter { seen.insert($0.identifier).inserted }.sorted { $0.frame.minY < $1.frame.minY }
        }
        let deadline = Date().addingTimeInterval(5)
        while rows().count != count && Date() < deadline { Thread.sleep(forTimeInterval: 0.1) }
        let got = rows()
        XCTAssertEqual(got.count, count, "\(message); the rows are \(got.map(\.identifier))")
        return got
    }
}
