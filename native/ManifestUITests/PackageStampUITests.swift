// Order stamps on the Packages card, on screen (step 6, one-stamp-per-package, stamp-band-opens-the-editor,
// stamp-removal-writes-a-tombstone, a-refund-leaves-every-count, stamped-filter-on-the-pipeline,
// no-layout-shift-under-pointer, no-native-dialogs, rules-run-in-javascriptcore).
//
// The rules (kinds, refund test, band text, the refunded pill) are pinned in test/view-rules.test.mjs (V35 to V38)
// and in ManifestKit (StampRulesTests, PastTransitModelTests, LedgerStoreTests, PackageCardTokensTests). These cases pin
// what only the screen shows. Phone layout only: there is no open-Duo two-page case. The tests read no colour: XCUITest
// cannot.
//
// Red-first. The builder makes these pass. Every one fails today on a missing element.
//
// Contract the tests name, besides the identifiers of PackageCardUITests and PackagesShellUITests
// (package-row:<gk>, checkin:<key>, order-link:<gk>, card-pill:<gk>, card-slot:<gk>) and the masthead's
// tally-cards, tally-packages and masthead-count. <gk> is "orderId::seller"; <kind> is a STAMP_KINDS slug.
//   stamp-button:<gk>       the Stamp button of the action row. Only while the card has no stamp and its editor is closed.
//   stamp-band:<gk>         the band: one button, the card's full width, at least 44pt high. Only while the card is stamped
//                           and its editor is closed. Its label starts "Edit stamp on <seller>", and its label and value
//                           together hold the band text ("KIND \u{00B7} MM-DD", today's local day) and the note.
//   stamp-editor:<gk>       the editor. It replaces the band, between the header and the item lines.
//   stamp-kind:<gk>|<kind>  the six kind chips, in STAMP_KINDS order read left to right, top to bottom. The picked one
//                           reports isSelected.
//   stamp-note:<gk>         the note field. Its value is the typed text.
//   stamp-save:<gk>         Save. Disabled until a kind is picked.
//   stamp-cancel:<gk>       Cancel. It closes the editor and drops the pick.
//   stamp-remove:<gk>       Remove stamp. Only when the card is stamped. The first tap arms it.
//   stamp-ask-cancel:<gk>   Cancel in the armed ask.
//   stamp-ask-confirm:<gk>  the armed ask's second tap, labelled "Tap again to remove stamp from N cards". The ask hangs
//                           below the editor row (an overlay, as Orphaned's Discard ask does) and disarms after 4 seconds.
//   stamped-cell            the ruled row's "N stamped" cell. A button. Its label starts "N stamped". isSelected while the
//                           stamped filter is on. 44pt each way at least.
//   card-pill:<gk>, card-slot:<gk>  hold "N left \u{00B7} refunded" (label of the pill, value of the slot) on a refunded card.
// Launch arguments are the shell tests': -ManifestUITestSeed, -ManifestUITestWidth.
//
// Readings the tests carry, each from the web unless it says otherwise:
//   - A refunded or partial-refund card leaves the normal list on the Save tap (a-refund-leaves-every-count) and every
//     count follows it; the stamped filter brings it back (stamped-filter-on-the-pipeline). The filter turns off by
//     itself when the stamped count reaches 0 (spec, Wiring).
//   - "No card move on Save: the space is reserved" is read as: the card at rest, its editor closed, has the same size
//     with and without a stamp, and nothing below it moves, whichever way the stamp goes (Save, then Remove). The editor
//     is taller than either state, and opening it moves the lines on a deliberate tap, as on the web. A scroll between two
//     readings moves every frame alike, so frames are compared relative to the card's own top.
//   - The ask names N cards. The web counts the package's cards (totalQty); the mockup's armed state counts the copies
//     still owed. At rest in the shared fixture the two are equal, so the cases read A1 (4) and D1 (1) at rest.
//
// Not here, and why:
//   - "A stamp hides the lost flag": the native card draws no lost-mail flag and step 6 adds none (debt
//     native-card-lost-flags-unbuilt). An assertion would pass on any build. V2.4 in test/view-rules.test.mjs pins
//     the bundle half (lostMail takes done || stamped).
//   - The band's note ellipsis and the Save reason VoiceOver reads ("Pick a stamp first."): XCUITest reads neither a
//     child of a one-element button nor an accessibility hint.
//   - First focus on Cancel in the armed ask: XCUITest cannot read VoiceOver focus (debt native-ask-has-no-cancel-focus).
//
// The audits skip only what the owner ruled (audit-skips-measured-flags). No audit here takes the keyboard skip: the
// editor is audited with its note field not focused, so no keyboard is up.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class PackageStampUITests: XCTestCase {
    static let a1 = "A1::Alpha Cards", b1 = "B1::Beta Games", c1 = "C1::Gamma Cards", d1 = "D1::Delta Cards"
    static let kinds = ["claim", "refunded", "contacted", "reshipped", "partial", "other"]
    static let dot = "\u{00B7}"
    /// The ids whose frames the no-shift cases read: the cards' own, and every stamp control.
    static let framed = ["package-row:", "checkin:", "order-link:", "stamp-button:", "stamp-band:", "stamp-editor:", "stamp-kind:",
                         "stamp-note:", "stamp-save:", "stamp-cancel:", "stamp-remove:", "stamp-ask-"]

    // MARK: helpers (the steps are ScreenKit's, shared with PackageBulkUITests; each is one line here)

    func launch(width: Int = 375) -> XCUIApplication { ScreenKit.launch(width: width) }

    func el(_ app: XCUIApplication, _ id: String) -> XCUIElement { ScreenKit.el(app, id) }

    func wait(_ predicate: String, for e: XCUIElement, _ message: String, timeout: TimeInterval = 5,
              file: StaticString = #filePath, line: UInt = #line) {
        ScreenKit.wait(predicate, for: e, message, timeout: timeout, file: file, line: line)
    }

    func tap(_ app: XCUIApplication, _ id: String, file: StaticString = #filePath, line: UInt = #line) {
        ScreenKit.tap(app, id, file: file, line: line)
    }

    /// The first stamp: Stamp, a kind, an optional note, Save. It ends with the editor gone.
    func stamp(_ app: XCUIApplication, _ gk: String, kind: String, note: String? = nil, file: StaticString = #filePath, line: UInt = #line) {
        ScreenKit.stamp(app, gk, kind: kind, note: note, file: file, line: line)
    }

    /// Opens the editor of a stamped card from its band.
    func openEditor(_ app: XCUIApplication, _ gk: String) {
        tap(app, "stamp-band:\(gk)")
        XCTAssertTrue(el(app, "stamp-editor:\(gk)").waitForExistence(timeout: 5), "the band did not open the editor on \(gk)")
    }

    /// Remove stamp, armed: the first tap.
    func arm(_ app: XCUIApplication, _ gk: String) {
        tap(app, "stamp-remove:\(gk)")
        XCTAssertTrue(el(app, "stamp-ask-confirm:\(gk)").waitForExistence(timeout: 5), "the first tap on Remove stamp did not arm it")
    }

    /// The frame of every card part and stamp control on screen, by identifier, from one snapshot of the app's tree.
    func snapshot(_ app: XCUIApplication) -> [String: CGRect] {
        ScreenKit.snapshot(app, prefixes: Self.framed).mapValues(\.frame)
    }

    func relative(_ s: [String: CGRect], to anchor: String) -> [String: CGRect] { ScreenKit.relative(s, to: anchor) }

    /// Every frame in `before` (already relative to the card's top) that is still on screen sits where it did. `taken` is
    /// a snapshot the caller read at the moment that matters (the armed ask is live for 4 seconds only); without it the
    /// frames are read now. `growsTo` names a frame whose maxY may grow, to the value given (relative to the card's top)
    /// and no further, and never shrink; its other three edges hold like every other frame's.
    func assertStill(_ before: [String: CGRect], _ app: XCUIApplication, anchor: String, _ what: String,
                     taken: [String: CGRect]? = nil, growsTo: [String: CGFloat] = [:],
                     file: StaticString = #filePath, line: UInt = #line) {
        let after = relative(taken ?? snapshot(app), to: anchor)
        let common = before.keys.filter { after[$0] != nil }
        XCTAssertGreaterThanOrEqual(common.count, 8, "too few frames to compare after \(what)", file: file, line: line)
        // Layout rounding gives one frame a float error (319.0000305 against 319.0), so each edge is compared to half a
        // point, as the other frame checks here are. A 1pt move shifts an edge by 1.0 and still fails.
        for id in common {
            guard let was = before[id], let now = after[id] else { continue }
            for (edge, a, b) in [("minX", now.minX, was.minX), ("minY", now.minY, was.minY), ("maxX", now.maxX, was.maxX), ("maxY", now.maxY, was.maxY)] {
                if edge == "maxY", let limit = growsTo[id] {
                    XCTAssertGreaterThanOrEqual(a, b - 0.5, "\(id) shrank when \(what): \(edge) \(b) to \(a)", file: file, line: line)
                    XCTAssertLessThanOrEqual(a, limit + 0.5, "\(id) grew past the ask when \(what): \(edge) \(b) to \(a), the ask ends at \(limit)", file: file, line: line)
                } else {
                    XCTAssertEqual(a, b, accuracy: 0.5, "\(id) moved when \(what): \(edge) \(b) to \(a)", file: file, line: line)
                }
            }
        }
    }

    /// Today's local day as the band prints it: MM-dd.
    static func today() -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "MM-dd"
        return f.string(from: Date())
    }

    func spoken(_ e: XCUIElement) -> String { e.label + " " + ((e.value as? String) ?? "") }

    // MARK: the first stamp

    /// Stamp opens the editor in the band's place, Save waits for a kind, and the saved stamp is a band that reads the
    /// kind, today and the note. The Stamp button is gone then, and the stamped cell counts it.
    func testTheStampButtonOpensTheEditorAndSaveLeavesABand() throws {
        let app = launch()
        let gk = Self.a1
        XCTAssertTrue(el(app, "stamp-button:\(gk)").waitForExistence(timeout: 5), "an unstamped card has no Stamp button")
        XCTAssertFalse(el(app, "stamp-band:\(gk)").exists, "an unstamped card shows a band")

        tap(app, "stamp-button:\(gk)")
        XCTAssertTrue(el(app, "stamp-editor:\(gk)").waitForExistence(timeout: 5), "Stamp did not open the editor")
        XCTAssertFalse(el(app, "stamp-button:\(gk)").exists, "the Stamp button stays under the open editor")
        XCTAssertFalse(el(app, "stamp-remove:\(gk)").exists, "an unstamped card offers Remove stamp: nothing to remove")
        let chips = Self.kinds.map { el(app, "stamp-kind:\(gk)|\($0)") }
        for (kind, chip) in zip(Self.kinds, chips) {
            XCTAssertTrue(chip.exists, "no chip for \(kind)")
            XCTAssertFalse(chip.isSelected, "\(kind) is picked before any tap")
        }
        let reading = chips.filter(\.exists).sorted { abs($0.frame.midY - $1.frame.midY) > 1 ? $0.frame.midY < $1.frame.midY : $0.frame.midX < $1.frame.midX }
        XCTAssertEqual(reading.map(\.identifier), Self.kinds.map { "stamp-kind:\(gk)|\($0)" }, "the chips do not read in STAMP_KINDS order, Other last")
        let save = el(app, "stamp-save:\(gk)")
        XCTAssertFalse(save.isEnabled, "Save reports enabled with no kind picked")

        tap(app, "stamp-kind:\(gk)|claim")
        XCTAssertTrue(el(app, "stamp-kind:\(gk)|claim").isSelected, "the tapped chip is not picked")
        XCTAssertTrue(save.isEnabled, "Save still reports disabled once a kind is picked")
        tap(app, "stamp-note:\(gk)")
        el(app, "stamp-note:\(gk)").typeText("called twice")
        tap(app, "stamp-save:\(gk)")

        let band = el(app, "stamp-band:\(gk)")
        XCTAssertTrue(band.waitForExistence(timeout: 5), "Save did not leave a band")
        XCTAssertFalse(el(app, "stamp-editor:\(gk)").exists, "the editor stays open after Save")
        XCTAssertFalse(el(app, "stamp-button:\(gk)").exists, "a stamped card still offers the Stamp button")
        XCTAssertTrue(band.label.hasPrefix("Edit stamp on Alpha Cards"), "the band's label is \(band.label.debugDescription)")
        XCTAssertTrue(spoken(band).contains("CLAIM FILED \(Self.dot) \(Self.today())"), "the band does not read the kind and today: \(spoken(band))")
        XCTAssertTrue(spoken(band).contains("called twice"), "the band does not carry the note: \(spoken(band))")
        XCTAssertTrue(el(app, "stamped-cell").label.hasPrefix("1 stamped"), "the stamped cell reads \(el(app, "stamped-cell").label.debugDescription)")
    }

    /// The band opens the editor on the stored stamp, and Cancel keeps that stamp: the pick made in between is dropped.
    func testTheBandOpensTheEditorOnTheStoredStampAndCancelKeepsIt() throws {
        let app = launch()
        let gk = Self.a1
        stamp(app, gk, kind: "claim", note: "called twice")
        openEditor(app, gk)

        for kind in Self.kinds {
            XCTAssertEqual(el(app, "stamp-kind:\(gk)|\(kind)").isSelected, kind == "claim", "\(kind) while the editor holds a claim")
        }
        XCTAssertEqual(el(app, "stamp-note:\(gk)").value as? String, "called twice", "the editor opens on the stored note")
        XCTAssertTrue(el(app, "stamp-remove:\(gk)").exists, "a stamped card's editor has no Remove stamp")

        tap(app, "stamp-kind:\(gk)|contacted")
        XCTAssertTrue(el(app, "stamp-kind:\(gk)|contacted").isSelected, "the new pick is not shown")
        tap(app, "stamp-cancel:\(gk)")
        let band = el(app, "stamp-band:\(gk)")
        XCTAssertTrue(band.waitForExistence(timeout: 5), "Cancel did not return to the band")
        XCTAssertTrue(spoken(band).contains("CLAIM FILED"), "Cancel kept the pick instead of the stored stamp: \(spoken(band))")
        XCTAssertFalse(spoken(band).contains("SELLER CONTACTED"), "Cancel saved the pick: \(spoken(band))")
    }

    // MARK: Remove, armed

    /// Remove stamp takes two taps (no-native-dialogs). The first arms it and the ask hangs below the row: nothing moves,
    /// not a card, not a control, not Remove itself under the finger. The ask's Cancel disarms it. The ask disarms
    /// itself after 4 seconds. The second tap removes the stamp and closes the editor.
    func testRemoveIsTwoTapsAndTheAskHangsBelowTheRowMovingNothing() throws {
        let app = launch()
        let gk = Self.a1
        stamp(app, gk, kind: "claim")
        app.reveal(el(app, "stamp-band:\(gk)"), whole: true)
        openEditor(app, gk)
        let remove = el(app, "stamp-remove:\(gk)"), anchor = "package-row:\(gk)"
        let before = relative(snapshot(app), to: anchor)

        // The ask is live for 4 seconds from the tap, and arm() uses about 1.5 of them. So the armed state is read once,
        // in one snapshot, before the Cancel tap. The label waits for the next arm.
        arm(app, gk)
        let ask = el(app, "stamp-ask-confirm:\(gk)"), askCancel = el(app, "stamp-ask-cancel:\(gk)")
        let armed = snapshot(app)
        guard let askBox = armed["stamp-ask-confirm:\(gk)"], let cancelBox = armed["stamp-ask-cancel:\(gk)"],
              let saveBox = armed["stamp-save:\(gk)"] else {
            return XCTFail("the ask, its Cancel or Save is missing from the snapshot taken after the first tap: the ask had gone")
        }
        XCTAssertNotNil(armed["stamp-editor:\(gk)"], "the first tap closed the editor")
        assertStill(before, app, anchor: anchor, "Remove stamp was armed", taken: armed)
        XCTAssertGreaterThan(askBox.minY, saveBox.midY, "the ask does not hang below the row")
        XCTAssertGreaterThan(cancelBox.minY, saveBox.midY, "the ask's Cancel does not hang below the row")

        askCancel.tap()
        wait("exists == false", for: ask, "the ask's Cancel did not disarm")
        XCTAssertTrue(remove.exists && el(app, "stamp-editor:\(gk)").exists, "the ask's Cancel closed the editor or lost Remove")
        assertStill(before, app, anchor: anchor, "the ask was cancelled")

        arm(app, gk)
        XCTAssertEqual(ask.label, "Tap again to remove stamp from 4 cards", "the ask's label")
        wait("exists == false", for: ask, "the ask did not disarm after 4 seconds", timeout: 7)
        XCTAssertTrue(el(app, "stamp-editor:\(gk)").exists, "disarming closed the editor")

        arm(app, gk)
        el(app, "stamp-ask-confirm:\(gk)").tap()
        wait("exists == false", for: el(app, "stamp-editor:\(gk)"), "the second tap did not close the editor")
        XCTAssertFalse(el(app, "stamp-band:\(gk)").exists, "the stamp is still there after the second tap")
        XCTAssertTrue(el(app, "stamp-button:\(gk)").waitForExistence(timeout: 5), "the card has no Stamp button after its stamp was removed")
    }

    /// One card reads "1 card", as Orphaned's Discard ask does.
    func testTheAskNamesOneCardInTheSingular() throws {
        let app = launch()
        let gk = Self.d1
        stamp(app, gk, kind: "claim")
        openEditor(app, gk)
        arm(app, gk)
        XCTAssertEqual(el(app, "stamp-ask-confirm:\(gk)").label, "Tap again to remove stamp from 1 card", "the ask's label for a one-card package")
    }

    // MARK: a refund leaves the counts, the stamped filter brings it back

    /// Save with Refunded: the card leaves the list on that tap, the masthead's figures and the count line follow, the
    /// Tally drops its copies, and the stamped cell is the signpost. Partial refund leaves the same way.
    func testARefundLeavesTheListAndEveryCount() throws {
        let app = launch()
        let tallyLeft = el(app, "tally-left:Lightning Bolt")
        wait("value == '0/14'", for: el(app, "tally-cards"), "control: 14 cards at rest")
        wait("value == '0/4'", for: el(app, "tally-packages"), "control: 4 packages at rest")
        app.tabBars.buttons["Tally"].tap()
        XCTAssertTrue(tallyLeft.waitForExistence(timeout: 5) && tallyLeft.label.hasPrefix("3 left"), "control: 3 Lightning Bolt owed at rest, got \(tallyLeft.label)")
        app.tabBars.buttons["Packages"].tap()

        stamp(app, Self.a1, kind: "refunded")
        wait("exists == false", for: el(app, "package-row:\(Self.a1)"), "a refunded card stays on the list")
        wait("value == '0/10'", for: el(app, "tally-cards"), "the masthead still counts the refunded package's 4 cards")
        wait("value == '0/3'", for: el(app, "tally-packages"), "the masthead still counts the refunded package")
        XCTAssertTrue(el(app, "masthead-count").label.hasPrefix("3 packages"), "the count line reads \(el(app, "masthead-count").label.debugDescription)")
        XCTAssertTrue(el(app, "stamped-cell").label.hasPrefix("1 stamped"), "the stamped cell does not find the refund: \(el(app, "stamped-cell").label)")

        app.tabBars.buttons["Tally"].tap()
        wait("label BEGINSWITH '2 left'", for: tallyLeft, "the Tally still counts the refunded package's Lightning Bolt")

        app.tabBars.buttons["Packages"].tap()
        stamp(app, Self.d1, kind: "partial")
        wait("exists == false", for: el(app, "package-row:\(Self.d1)"), "a partial-refund card stays on the list")
        wait("value == '0/2'", for: el(app, "tally-packages"), "the masthead still counts the partial-refund package")
    }

    /// The filter lists the stamped packages, refunded ones included, and only those. A refunded card shows a
    /// "N left · refunded" pill where the others show the dollar figure, in a slot of the same width. The filter changes the
    /// list, not the counts.
    func testTheStampedFilterShowsRefundedPackagesWithTheirPill() throws {
        let app = launch()
        stamp(app, Self.a1, kind: "refunded")
        stamp(app, Self.d1, kind: "partial")
        stamp(app, Self.b1, kind: "contacted")
        let cell = el(app, "stamped-cell")
        wait("label BEGINSWITH '3 stamped'", for: cell, "the stamped cell does not count the three stamps")
        XCTAssertFalse(cell.isSelected, "the stamped filter starts on")
        let packages = el(app, "tally-packages").value as? String

        tap(app, "stamped-cell")
        XCTAssertTrue(cell.isSelected, "the stamped filter did not turn on")
        for gk in [Self.a1, Self.b1, Self.d1] {
            XCTAssertTrue(el(app, "package-row:\(gk)").waitForExistence(timeout: 5), "the filter does not list \(gk)")
        }
        XCTAssertFalse(el(app, "package-row:\(Self.c1)").exists, "the filter lists an unstamped package")
        XCTAssertEqual(el(app, "tally-packages").value as? String, packages, "the filter changed a count")

        XCTAssertEqual(el(app, "card-pill:\(Self.a1)").label, "4 left \(Self.dot) refunded", "the refunded package's pill")
        XCTAssertEqual(el(app, "card-slot:\(Self.a1)").value as? String, "4 left \(Self.dot) refunded", "the refunded package's status value")
        XCTAssertEqual(el(app, "card-pill:\(Self.d1)").label, "1 left \(Self.dot) refunded", "the partial-refund package's pill")
        XCTAssertEqual(el(app, "card-pill:\(Self.b1)").label, "4 left \(Self.dot) $4.00", "a package stamped contacted keeps the dollar pill")
        let widths = [Self.a1, Self.b1, Self.d1].map { el(app, "card-slot:\($0)").frame.width }
        XCTAssertEqual(widths[0], widths[1], accuracy: 0.5, "the refunded slot is not the dollar slot's width")
        XCTAssertEqual(widths[0], widths[2], accuracy: 0.5, "the two refunded slots differ in width")

        tap(app, "stamped-cell")
        XCTAssertFalse(cell.isSelected, "the stamped filter did not turn off")
        wait("exists == false", for: el(app, "package-row:\(Self.a1)"), "the refunded package stays after the filter turned off")
    }

    /// The filter is the only place a refund can be found and un-stamped. Removing the last stamp leaves nothing to
    /// filter, so the filter turns itself off and the normal list is back, the package among it.
    func testRemovingTheLastStampTurnsTheFilterOffAndTheRefundComesBack() throws {
        let app = launch()
        stamp(app, Self.a1, kind: "refunded")
        tap(app, "stamped-cell")
        XCTAssertTrue(el(app, "stamped-cell").isSelected, "the stamped filter did not turn on")
        XCTAssertTrue(el(app, "package-row:\(Self.a1)").waitForExistence(timeout: 5), "the filter does not list the refunded package")

        openEditor(app, Self.a1)
        arm(app, Self.a1)
        tap(app, "stamp-ask-confirm:\(Self.a1)")

        wait("isSelected == false", for: el(app, "stamped-cell"), "the filter stays on with no stamp left")
        XCTAssertTrue(el(app, "package-row:\(Self.b1)").waitForExistence(timeout: 5), "the normal list did not come back")
        XCTAssertEqual(el(app, "card-pill:\(Self.a1)").label, "4 left \(Self.dot) $4.00", "the un-stamped package has not got its dollar pill back")
        wait("value == '0/4'", for: el(app, "tally-packages"), "the masthead does not count the un-refunded package")
    }

    // MARK: sizes

    /// Every control the owner taps has a hit region of at least 44pt each way: Stamp, the six chips, the note field,
    /// Cancel, Save, Remove stamp, the band (over the card's full width), the stamped cell and the armed ask's two
    /// buttons. The chips' frames do not overlap: each is a 44pt frame on a 34pt chip, inside the gap.
    func testEveryStampControlHasA44ptHitRegion() throws {
        let app = launch()
        let gk = Self.a1
        assertHitRegion(el(app, "stamped-cell"), "the stamped cell")
        assertHitRegion(el(app, "stamp-button:\(gk)"), "Stamp")

        tap(app, "stamp-button:\(gk)")
        XCTAssertTrue(el(app, "stamp-editor:\(gk)").waitForExistence(timeout: 5), "Stamp did not open the editor")
        let chips = Self.kinds.map { el(app, "stamp-kind:\(gk)|\($0)") }
        for (kind, chip) in zip(Self.kinds, chips) { assertHitRegion(chip, "the \(kind) chip") }
        for (i, a) in chips.enumerated() {
            for b in chips[(i + 1)...] {
                let hit = a.frame.intersection(b.frame)
                XCTAssertTrue(hit.isNull || hit.width * hit.height < 0.5, "the frames of \(a.identifier) and \(b.identifier) overlap: \(a.frame), \(b.frame)")
            }
        }
        assertHitRegion(el(app, "stamp-note:\(gk)"), "the note field")
        assertHitRegion(el(app, "stamp-cancel:\(gk)"), "Cancel")
        assertHitRegion(el(app, "stamp-save:\(gk)"), "Save")

        tap(app, "stamp-kind:\(gk)|claim")
        tap(app, "stamp-save:\(gk)")
        let band = el(app, "stamp-band:\(gk)"), row = el(app, "package-row:\(gk)")
        assertHitRegion(band, "the band")
        XCTAssertGreaterThanOrEqual(band.frame.width, row.frame.width - 1, "the band is narrower than its card: \(band.frame.width)pt of \(row.frame.width)pt")

        openEditor(app, gk)
        assertHitRegion(el(app, "stamp-remove:\(gk)"), "Remove stamp")
        // The ask disarms 4 seconds after the tap. arm() uses about 1.5 of them and each assertHitRegion about 1.3 (it waits
        // a second before it reads), so each ask button is measured in an ask armed for it. The ask is waited out in
        // between, so the second arm taps an unarmed Remove.
        arm(app, gk)
        assertHitRegion(el(app, "stamp-ask-confirm:\(gk)"), "the armed ask's second tap")
        wait("exists == false", for: el(app, "stamp-ask-confirm:\(gk)"), "the ask did not disarm after 4 seconds", timeout: 7)
        arm(app, gk)
        assertHitRegion(el(app, "stamp-ask-cancel:\(gk)"), "the armed ask's Cancel")
    }

    /// Nothing moves because a stamp is saved or removed: the card at rest has one size and one place for its lines
    /// with or without a stamp, and the cards below stay where they were. Compared relative to the card's top, so a
    /// scroll to reach a control is not a move.
    func testNothingMovesWhenAStampIsSavedOrRemoved() throws {
        let app = launch()
        let gk = Self.a1, anchor = "package-row:\(Self.a1)"
        app.reveal(el(app, anchor), whole: true)
        let rest = relative(snapshot(app).filter { !$0.key.hasPrefix("stamp-") }, to: anchor)

        stamp(app, gk, kind: "claim")
        wait("exists == true", for: el(app, "stamp-band:\(gk)"), "no band after Save")
        assertStill(rest, app, anchor: anchor, "the stamp was saved")

        openEditor(app, gk)
        arm(app, gk)
        tap(app, "stamp-ask-confirm:\(gk)")
        wait("exists == true", for: el(app, "stamp-button:\(gk)"), "no Stamp button after Remove")
        assertStill(rest, app, anchor: anchor, "the stamp was removed")
    }

    /// A band is one line however long the note: a long note leaves it the height of a short one. The chip and the
    /// note share the line, so a wrapped note would make the band taller than its 44pt floor.
    func testALongNoteLeavesTheBandOneLineHigh() throws {
        let app = launch()
        stamp(app, Self.a1, kind: "claim", note: "ok")
        stamp(app, Self.b1, kind: "claim", note: String(repeating: "they said it would ship on Monday. ", count: 4))
        let short = el(app, "stamp-band:\(Self.a1)"), long = el(app, "stamp-band:\(Self.b1)")
        XCTAssertTrue(short.exists && long.exists, "both cards need a band to compare")
        XCTAssertEqual(long.frame.height, short.frame.height, accuracy: 0.5, "a long note made the band taller: \(long.frame.height)pt against \(short.frame.height)pt")
        XCTAssertLessThanOrEqual(long.frame.maxX, el(app, "package-row:\(Self.b1)").frame.maxX + 1, "the band runs past its card")
    }

    /// At 320pt, the stress width, and at 375pt the editor's chips, field and buttons all sit inside the card.
    func testTheEditorStaysInsideTheCardAt320And375() throws {
        for width in [320, 375] {
            let app = launch(width: width)
            let gk = Self.a1
            tap(app, "stamp-button:\(gk)")
            XCTAssertTrue(el(app, "stamp-editor:\(gk)").waitForExistence(timeout: 5), "Stamp did not open the editor at \(width)pt")
            let card = el(app, "package-row:\(gk)").frame.insetBy(dx: -1, dy: 0)
            let ids = Self.kinds.map { "stamp-kind:\(gk)|\($0)" } + ["stamp-note:\(gk)", "stamp-cancel:\(gk)", "stamp-save:\(gk)"]
            for id in ids {
                let f = el(app, id).frame
                XCTAssertTrue(f.minX >= card.minX && f.maxX <= card.maxX, "\(id) at \(width)pt is \(f.minX) to \(f.maxX), outside the card \(card.minX) to \(card.maxX)")
            }
            app.terminate()
        }
    }

    // MARK: accessibility audits, one screen per method

    /// The Packages screen with a stamped card: the band, the stamped cell. Skips only what the tab bar covers.
    func testAccessibilityAuditPackagesWithAStampedCard() throws {
        let app = launch()
        stamp(app, Self.a1, kind: "claim", note: "called twice")
        XCTAssertTrue(el(app, "stamp-band:\(Self.a1)").waitForExistence(timeout: 5), "no band before the audit")
        try app.auditSkippingTabBar()
    }

    /// The open editor, with no kind picked and its note field not focused, so no keyboard is up.
    func testAccessibilityAuditStampEditor() throws {
        let app = launch()
        tap(app, "stamp-button:\(Self.a1)")
        XCTAssertTrue(el(app, "stamp-editor:\(Self.a1)").waitForExistence(timeout: 5), "the editor did not open before the audit")
        try app.auditSkippingTabBar()
    }

    /// Remove stamp armed, with its ask on screen.
    func testAccessibilityAuditStampRemoveArmed() throws {
        let app = launch()
        stamp(app, Self.a1, kind: "claim")
        openEditor(app, Self.a1)
        arm(app, Self.a1)
        try app.auditSkippingTabBar()
    }
}
