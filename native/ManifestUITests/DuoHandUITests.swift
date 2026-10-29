// Card in Hand UI tests on the open iPhone Duo (decisions duo-card-in-hand and new-envelope-ends-an-envelope; mockup
// poses 1, 2, 4 and 6 of docs/design/duo-card-in-hand on origin/design/duo-round2). The model is HandModel and
// PastTransitModel in ManifestKit; their unit tests are HandModelTests and PastTransitModelTests.
//
// Red-first and NOT RUN by the test-author (the Duo is another agent's to boot). They compile against this branch
// and fail on a missing element. The builder runs them red, then green. How to run: DuoShellUITests.swift, same
// destination and the same hinge command. These tests need the pose flat (open Duo, window 951 x 669 pt), set with
// `~/.local/bin/hinge open`. A run in another pose fails on the window size (DuoWindowSupport.swift). It never skips.
//
// The seed is shared/fixtures/ledger.json. What the tests rely on in it:
//   Lightning Bolt is in three envelopes: A1 Alpha Cards, B1 Beta Games and C1 Gamma Cards. So is a shared name.
//   Path to Exile is only in C1 (Gamma Cards), with Lightning Bolt, Swords to Plowshares, Ponder and Preordain.
//   A1, B1 and D1 (Delta Cards) have no tracking, are dated 2026-07-01, 2026-07-29 and 2026-05-01. C1 has tracking.
//   Nothing is received. The past-transit test needs the simulator clock later than 2026-08-12.
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
    /// so a view under the top 44 pt of the panel is covered although it clears the frame. The reading is for duo-fold-and-keyboard,
    /// whose record on main does not hold this figure yet.
    static let keyboardDrawnAbove: CGFloat = 44

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
        if let old = query.value as? String, !old.isEmpty, old != query.placeholderValue {
            query.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: old.count))
        }
        query.typeText(text)
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
        XCTAssertTrue(keys.waitForExistence(timeout: 5), "the system keys are not up, so nothing here shows the offer clears them; with a hardware keyboard attached the keys never draw (Simulator, I/O, Keyboard, Connect Hardware Keyboard off)")
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

    /// Card in Hand, then the past-transit page on the right page.
    func openPastTransit(_ app: XCUIApplication) {
        openHand(app)
        let open = need(app, "hand-past-transit-open", "the Open control of the Past 14 days box")
        onRightPage(open, app, "the Open control")
        open.tap()
        let page = need(app, "past-transit-page", "the past-transit page")
        onRightPage(page, app, "the past-transit page")
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

    /// Pose: flat. A tap on a match fills the query and the list shrinks, but the New envelope button, which the owner's
    /// thumb reaches for next, does not move (no-layout-shift-under-pointer). "to" hits Brainstorm (two envelopes), Path to Exile
    /// and Swords to Plowshares in the seed, so the list has 3 rows. The 2nd, Path to Exile, is only in C1: it holds no name, so no
    /// Suspense line opens above the button. Typing the whole name leaves 1 match, so the list loses 2 rows. With the list above
    /// the row, the button moves up by those rows and this fails.
    func testTappingAMatchDoesNotMoveNewEnvelope() {
        let app = XCUIApplication.launchedOnSeed()
        guard app.requirePose(.flat) else { return }
        openHand(app)
        typeCard(app, "to")

        let rows = waitForHits(app, count: 3, "typing \"to\" must list Brainstorm, Path to Exile and Swords to Plowshares")
        XCTAssertEqual(rows.map(\.identifier), ["hand-hit:Brainstorm", "hand-hit:Path to Exile", "hand-hit:Swords to Plowshares"], "the seed's matches for \"to\", top to bottom")
        let envelope = need(app, "hand-new-envelope", "the New envelope button")
        let before = envelope.frame

        app.element(rows[1].identifier).tap()  // by id, so the tap is the 2nd row whatever order the query lists them in
        _ = waitForHits(app, count: 1, "tapping Path to Exile must leave that one match")
        XCTAssertEqual(app.element("hand-query").value as? String, "Path to Exile", "the tap did not fill the query")
        XCTAssertFalse(app.element("hand-held").exists, "a Suspense line opened above the button: the 2nd match is a shared name, so the seed no longer makes this test fair")
        let after = envelope.frame
        XCTAssertEqual(after.minY, before.minY, accuracy: 0.5, "New envelope moved from \(before) to \(after) when the match list shrank from 3 rows to 1")
        keepShot(app, "hand-match-tap-holds-new-envelope")
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
    /// when the save throws, so the offer's own box holds the slot and this case does not reach the receipt.
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
        assertLinesStayPut(app, before, after: "when Post's save failed")
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
