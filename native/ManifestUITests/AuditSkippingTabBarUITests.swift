// Accessibility audit that skips what the tab bar covers (lane N8, native-build-lanes, N8 notes,
// owner ruling 2026-10-21, extended 2026-10-27 to every tab). The 225pt masthead pushes the 12-item fixture down,
// so the last rows sit under the glass tab bar and fail contrast there. The Packages audits and the Ledger,
// Orphaned and Tally tab audits call auditSkippingTabBar(), which skips an issue only when the bar covers most of
// its element. Every other issue, and any issue with no element, still fails.
//
// It also holds the owner's three other narrow skips (audit-skips-measured-flags): skipMeasuredContrastFlags,
// the contrast skip on four named elements, skipTallyMetaClip, the clipped-text skip on the Tally meta line, and
// skipKeyboardPredictionCells, the system keyboard's cells in the two composer audits. The three Tally audits call
// skipTallyAuditFlags, which joins the first two.
//
// This file also holds the narrowness proof. The app has no low-contrast element above the bar,
// so the on-device case moves the bar away and checks that the same issues now fail.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

/// True when the bar covers more than half of the element's area. An empty element or an empty
/// bar is never covered, so a bar that fails to resolve skips nothing.
func isUnderTabBar(_ element: CGRect, bar: CGRect) -> Bool {
    let hit = bar.intersection(element)
    return !hit.isNull && !element.isEmpty && hit.width * hit.height * 2 > element.width * element.height
}

/// The contrast skip the owner ruled on (decision audit-skips-measured-flags): the Orphaned mini buttons Cancel, Edit
/// and Discard and the Tally "left" line, whose colours measure above the floor but flag in the audit. It skips an
/// issue only when the audit type is contrast AND the element's accessibility identifier is a ruled one:
/// `orphaned-cancel` exactly, or the prefix `discard:`, `orphaned-edit:` or `tally-left:` (the id of the envelope or
/// the product name follows). It never reads a label.
func isMeasuredContrastFlag(_ type: XCUIAccessibilityAuditType, identifier: String?) -> Bool {
    guard type == .contrast, let identifier else { return false }
    return identifier == "orphaned-cancel" || ["discard:", "orphaned-edit:", "tally-left:"].contains(where: identifier.hasPrefix)
}

/// The skip closure of auditNamingElements(skipping:), over a real audit issue.
@MainActor func skipMeasuredContrastFlags(_ issue: XCUIAccessibilityAuditIssue) -> Bool {
    isMeasuredContrastFlag(issue.auditType, identifier: issue.element?.identifier)
}

/// The clipped-text skip the owner ruled on (decision audit-skips-measured-flags): a long set name in a Tally row's
/// meta line ends in "…" as on the web, and the audit calls truncated text clipped. It skips an issue only when the
/// audit type is clipped text AND the element's accessibility identifier has the prefix `tally-meta:` (the product
/// name follows). It never reads a label. Every other check still runs on that line.
func isTallyMetaClip(_ type: XCUIAccessibilityAuditType, identifier: String?) -> Bool {
    type == .textClipped && identifier?.hasPrefix("tally-meta:") == true
}

/// The skip closure of auditNamingElements(skipping:), over a real audit issue.
@MainActor func skipTallyMetaClip(_ issue: XCUIAccessibilityAuditIssue) -> Bool {
    isTallyMetaClip(issue.auditType, identifier: issue.element?.identifier)
}

/// What the three Tally audits skip: the ruled contrast flags and the clipped meta line. Nothing else.
@MainActor func skipTallyAuditFlags(_ issue: XCUIAccessibilityAuditIssue) -> Bool {
    skipMeasuredContrastFlags(issue) || skipTallyMetaClip(issue)
}

/// The system keyboard's prediction cell, which the app does not draw (decision audit-skips-measured-flags). The
/// audit reports it with no identifier and no label, and names its class only in the detailed description:
/// "This TUIPredictionViewCell is missing useful accessibility information." So it matches on that text, as one whole
/// word, and ignores the audit type: the ruling skips every type on this element. A class that only contains the name
/// does not match. Only the two composer audits use it (OrphanedUITests.composerAuditSkips).
func isKeyboardPredictionCell(detail: String) -> Bool {
    detail.split(whereSeparator: { !$0.isLetter && !$0.isNumber && $0 != "_" }).contains("TUIPredictionViewCell")
}

/// The skip closure of auditNamingElements(skipping:), over a real audit issue.
@MainActor func skipKeyboardPredictionCells(_ issue: XCUIAccessibilityAuditIssue) -> Bool {
    isKeyboardPredictionCell(detail: issue.detailedDescription)
}

extension XCUIApplication {
    /// The one scroll helper of these tests. Plain: swipe up until the element can be tapped, at most 5 swipes.
    /// `whole`: for a test that records frames before a tap. A tap on an element that is off screen scrolls the
    /// list and moves every frame, so the element must lie fully between the status bar and the tab bar first.
    /// It drags the list by the measured gap (a drag that holds before it lifts has no fling, so it cannot
    /// overshoot), then waits until the element's frame stops changing. A drag can start on a control, so a
    /// caller reads its at-rest state after this call, never before.
    func reveal(_ element: XCUIElement, whole: Bool = false) {
        guard whole else {
            var swipes = 0
            while !element.isHittable && swipes < 5 {
                swipeUp()
                swipes += 1
            }
            return
        }
        guard element.waitForExistence(timeout: 5), tabBars.firstMatch.exists else {
            XCTFail("reveal: the element or the tab bar is missing")
            return
        }
        let screen = windows.firstMatch.frame
        let top = max(screen.minY, statusBars.firstMatch.exists ? statusBars.firstMatch.frame.maxY : 0)
        let bottom = tabBars.firstMatch.frame.minY
        func inView() -> Bool { element.frame.minY >= top && element.frame.maxY <= bottom }
        func settle() {
            var last = element.frame
            for _ in 0..<25 {
                Thread.sleep(forTimeInterval: 0.2)
                let now = element.frame
                if now == last { return }
                last = now
            }
        }
        for _ in 0..<5 where !inView() {
            let gap = element.frame.midY - (top + bottom) / 2  // above zero: the list must move up
            let span = bottom - top - 80
            let from = gap > 0 ? bottom - 40 : top + 40
            let to = from - max(-span, min(span, gap))
            let x = screen.midX
            coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: x, dy: from))
                .press(forDuration: 0.05, thenDragTo: coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: x, dy: to)),
                       withVelocity: .slow, thenHoldForDuration: 0.3)
            settle()
        }
        settle()
        XCTAssertTrue(inView(), "reveal: the element ends at \(element.frame), outside the free band \(top) to \(bottom)")
    }

    /// The whole audit, with each issue named by its element. A bare performAccessibilityAudit() fails with
    /// "Contrast failed" and the result bundle does not say which element (palette-tokens-contrast-floor).
    /// `skipping` is the audit's own ignore handler: an issue it accepts is left out, every other issue is named
    /// and fails. The default skips nothing.
    func auditNamingElements(skipping skip: @escaping (XCUIAccessibilityAuditIssue) -> Bool = { _ in false },
                             file: StaticString = #filePath, line: UInt = #line) throws {
        var found: [String] = []
        try performAccessibilityAudit { issue in
            if !skip(issue) {
                let el = issue.element
                found.append("\(issue.compactDescription) | id=\(el?.identifier ?? "-") label=\(el?.label ?? "-") frame=\(el?.frame ?? .zero)")
            }
            return true  // handled here; the assertion below is the only failure
        }
        XCTAssertEqual(found, [], "the audit flagged these elements", file: file, line: line)
    }

    /// The accessibility audit, minus every issue whose element the tab bar covers. The issues it
    /// skips and the issues it fails come back as text. `bar` replaces the tab bar's frame, for
    /// the narrowness test. With `record: false` no issue is recorded, so a test can read them.
    /// `ruled` is another skip the owner ruled on, such as skipMeasuredContrastFlags. An issue it accepts is left
    /// out and is not counted in `skipped`, which means "under the bar" only.
    @discardableResult
    func auditSkippingTabBar(bar override: CGRect? = nil, record: Bool = true,
                             ruled: ((XCUIAccessibilityAuditIssue) -> Bool)? = nil) throws
        -> (skipped: [String], failing: [String])
    {
        let tabBar = tabBars.firstMatch
        let bar = try XCTUnwrap(tabBar.waitForExistence(timeout: 5) ? override ?? tabBar.frame : nil, "the tab bar is missing")
        var skipped: [String] = [], failing: [String] = []
        try performAccessibilityAudit { issue in
            let frame = issue.element?.frame
            let text = "\(issue.compactDescription) | label=\(issue.element?.label ?? "nil") | frame=\(frame.map(String.init(describing:)) ?? "nil") | bar=\(bar)"
            if let frame, isUnderTabBar(frame, bar: bar) {
                print("AUDIT-SKIP \(text)")
                skipped.append(text)
                return true
            }
            if ruled?(issue) == true {
                print("AUDIT-RULED \(text)")
                return true
            }
            print("AUDIT-FAIL \(text)")
            failing.append(text)
            return !record
        }
        return (skipped, failing)
    }
}

@MainActor
final class AuditSkippingTabBarUITests: XCTestCase {
    /// A bar frame no element can reach.
    static let farAway = CGRect(x: 0, y: -10_000, width: 400, height: 100)

    private func launchedPackages() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        app.tabBars.buttons["Packages"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "masthead").firstMatch.waitForExistence(timeout: 5), "masthead is missing")
        return app
    }

    // MARK: the cover rule, on frames

    func testCoverRuleSkipsOnlyWhatTheBarMostlyCovers() {
        let bar = CGRect(x: 0, y: 770, width: 375, height: 82)
        // covered
        XCTAssertTrue(isUnderTabBar(CGRect(x: 20, y: 790, width: 100, height: 20), bar: bar), "an element inside the bar")
        XCTAssertTrue(isUnderTabBar(CGRect(x: 20, y: 760, width: 100, height: 40), bar: bar), "3/4 under the bar")
        // kept: the issue still fails
        XCTAssertFalse(isUnderTabBar(CGRect(x: 20, y: 700, width: 100, height: 20), bar: bar), "an element above the bar")
        XCTAssertFalse(isUnderTabBar(CGRect(x: 20, y: 740, width: 100, height: 40), bar: bar), "1/4 under the bar")
        XCTAssertFalse(isUnderTabBar(CGRect(x: 20, y: 750, width: 100, height: 40), bar: bar), "exactly half under the bar")
        XCTAssertFalse(isUnderTabBar(CGRect(x: 20, y: 770, width: 100, height: 0), bar: bar), "an element with no height")
        XCTAssertFalse(isUnderTabBar(CGRect(x: 20, y: 790, width: 100, height: 20), bar: .zero), "a bar that did not resolve")
        XCTAssertFalse(isUnderTabBar(CGRect(x: 20, y: 790, width: 100, height: 20), bar: .null), "a null bar")
    }

    // MARK: the measured contrast skip, on identifiers

    /// A real issue has no public init, so the rule is checked on its two inputs. Contrast on the ruled elements is
    /// skipped. Contrast anywhere else, and every other audit type on a ruled element, still fails.
    func testTheContrastSkipNamesOnlyTheRuledElements() {
        // skipped
        XCTAssertTrue(isMeasuredContrastFlag(.contrast, identifier: "orphaned-cancel"), "contrast on the composer's Cancel")
        XCTAssertTrue(isMeasuredContrastFlag(.contrast, identifier: "discard:env-1-abc"), "contrast on an envelope's Discard")
        XCTAssertTrue(isMeasuredContrastFlag(.contrast, identifier: "orphaned-edit:env-1-abc"), "contrast on an envelope's Edit")
        XCTAssertTrue(isMeasuredContrastFlag(.contrast, identifier: "tally-left:Lightning Bolt"), "contrast on a Tally row's left line")
        // kept: contrast on another element
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "orphaned-save"), "contrast on Save, outside the ruling")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "tally-row:Lightning Bolt"), "contrast on a Tally row")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "tally-toggle:Lightning Bolt"), "contrast on a Tally row's toggle")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "orphaned-cancel-2"), "an identifier that only starts like Cancel")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "orphaned-edit"), "an Edit identifier with no envelope id")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "tally-leftover:x"), "an identifier that only starts like the left line")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "x-discard:1"), "an identifier that only contains the Discard prefix")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "x-orphaned-edit:1"), "an identifier that only contains the Edit prefix")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "x-tally-left:1"), "an identifier that only contains the left-line prefix")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "Discard"), "a label is not an identifier")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: "Edit"), "the Edit label is not an identifier")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: ""), "an element with no identifier")
        XCTAssertFalse(isMeasuredContrastFlag(.contrast, identifier: nil), "an issue with no element")
        // kept: another audit type on a ruled element
        for type in [XCUIAccessibilityAuditType.textClipped, .hitRegion, .dynamicType, .sufficientElementDescription] {
            for id in ["orphaned-cancel", "discard:env-1-abc", "orphaned-edit:env-1-abc", "tally-left:Lightning Bolt"] {
                XCTAssertFalse(isMeasuredContrastFlag(type, identifier: id), "audit type \(type.rawValue) on \(id)")
            }
        }
    }

    // MARK: the Tally meta clip skip, on identifiers

    /// Three tests, one per way the rule could be too wide, so each too-wide predicate fails exactly one of them:
    /// the pair is skipped, clipped text anywhere else fails, and every other check on the meta line fails.
    func testTheMetaClipSkipSkipsClippedTextOnTheMetaLine() {
        XCTAssertTrue(isTallyMetaClip(.textClipped, identifier: "tally-meta:Lightning Bolt"), "clipped text on a Tally row's meta line")
        XCTAssertTrue(isTallyMetaClip(.textClipped, identifier: "tally-meta:Urza's Saga"), "a product name with a lone quote")
    }

    func testTheMetaClipSkipKeepsClippedTextOnEveryOtherElement() {
        let others: [String?] = [
            "tally-left:Lightning Bolt", "tally-row:Lightning Bolt", "tally-toggle:Lightning Bolt", "tally-copy:B1|0|pLightningBolt",
            "tally-checkin:B1|0|pLightningBolt", "tally-sort", "tally-search", "orphaned-cancel", "discard:env-1-abc",
            "tally-meta",  // no colon, no product name
            "tally-metadata:Lightning Bolt",  // only starts like the prefix
            "x-tally-meta:Lightning Bolt",  // only contains the prefix
            "Tally-Meta:Lightning Bolt",  // another case
            "1 seller \u{00B7} 1 order \u{00B7} Test Set",  // a label is not an identifier
            "", nil,
        ]
        for id in others {
            XCTAssertFalse(isTallyMetaClip(.textClipped, identifier: id), "clipped text on \(id ?? "an issue with no element")")
        }
    }

    func testTheMetaClipSkipKeepsEveryOtherCheckOnTheMetaLine() {
        let others: [XCUIAccessibilityAuditType] = [.contrast, .elementDetection, .hitRegion, .sufficientElementDescription, .dynamicType, .trait]
        for type in others {
            XCTAssertFalse(isTallyMetaClip(type, identifier: "tally-meta:Lightning Bolt"), "audit type \(type.rawValue) on the meta line")
        }
    }

    // MARK: the keyboard skip, on the issue's text

    /// The keyboard's prediction cell is skipped by the class its detailed description names, as one whole word.
    /// Another class, a class that only contains the name, and an issue with no text still fail. The audit type
    /// is not an input: a ruled cell is skipped under every type (audit-skips-measured-flags).
    func testTheKeyboardSkipNamesOnlyThePredictionCell() {
        // skipped: the text the audit raised on 2026-10-27, and the same cell under another audit type
        XCTAssertTrue(isKeyboardPredictionCell(detail: "This TUIPredictionViewCell is missing useful accessibility information."),
                      "the prediction cell, as the audit reported it")
        XCTAssertTrue(isKeyboardPredictionCell(detail: "Contrast failed for TUIPredictionViewCell"), "another audit type on the same cell")
        // kept: the app's own element, the container, another part of the keyboard, a look-alike class
        XCTAssertFalse(isKeyboardPredictionCell(detail: "This SwiftUI.AccessibilityNode is missing useful accessibility information."),
                       "the app's own element with the same sentence")
        XCTAssertFalse(isKeyboardPredictionCell(detail: "Element has no description"), "the short text, which names no class")
        XCTAssertFalse(isKeyboardPredictionCell(detail: "This TUIPredictionView is missing useful accessibility information."),
                       "the prediction bar, not its cell")
        XCTAssertFalse(isKeyboardPredictionCell(detail: "This UIKeyboardLayoutStar is missing useful accessibility information."),
                       "the keys of the keyboard")
        XCTAssertFalse(isKeyboardPredictionCell(detail: "This TUIPredictionViewCellX is missing useful accessibility information."),
                       "a class that only starts with the name")
        XCTAssertFalse(isKeyboardPredictionCell(detail: "This MyTUIPredictionViewCell is missing useful accessibility information."),
                       "a class that only ends with the name")
        XCTAssertFalse(isKeyboardPredictionCell(detail: "This tuipredictionviewcell is missing useful accessibility information."),
                       "the name in another case")
        XCTAssertFalse(isKeyboardPredictionCell(detail: ""), "an issue with no text")
    }

    // MARK: the same rule, on the device

    /// Moving the bar away turns every skipped issue into a failure, so the rule hides nothing
    /// that an on-screen element would show. Skips when nothing sits under the bar, because the
    /// rule then hides nothing.
    func testTheSameIssuesFailOnceTheBarMovesAway() throws {
        let app = launchedPackages()

        let real = try app.auditSkippingTabBar(record: false)
        XCTAssertEqual(real.failing, [], "an issue outside the tab bar fails the Packages audit")
        try XCTSkipIf(real.skipped.isEmpty, "no audit issue sits under the tab bar, so the rule hides nothing")

        let away = try app.auditSkippingTabBar(bar: Self.farAway, record: false)
        XCTAssertEqual(away.skipped, [], "a bar far from the screen still skipped an issue")
        XCTAssertEqual(away.failing.count, real.skipped.count + real.failing.count,
                       "the skipped issues did not all fail once the bar moved away")
    }

    /// The filtered audit still records an issue outside the bar. The bar is far away, so it covers
    /// nothing and every issue is outside it. The expected failure is strict, so the test goes red
    /// when the audit records nothing, as it does if the handler returns true for such an issue.
    func testAnIssueOutsideTheBarIsRecorded() throws {
        let app = launchedPackages()
        try XCTExpectFailure("an issue outside the tab bar fails the audit", strict: true) {
            try app.auditSkippingTabBar(bar: Self.farAway, record: true)
        }
    }
}
