// Accessibility audit that skips what the tab bar covers (lane N8, native-build-lanes, N8 notes,
// owner ruling 2026-10-21, extended 2026-10-27 to every tab). The 225pt masthead pushes the 12-item fixture down,
// so the last rows sit under the glass tab bar and fail contrast there. The Packages audits and the Ledger,
// Orphaned and Tally tab audits call auditSkippingTabBar(), which skips an issue when its element touches the bar by
// any amount or lies wholly below the window (owner ruling 2026-10-28 16:40 CDT, audit-skips-measured-flags).
// Every other issue, and any issue with no element, still fails.
//
// It also holds the owner's two other narrow skips (audit-skips-measured-flags): skipMeasuredContrastFlags,
// the contrast skip on four named elements, and skipKeyboardPredictionCells, the system keyboard's cells in the
// two composer audits. The Tally audits call skipMeasuredContrastFlags. No skip covers the Tally meta line: its audit
// raises no finding (TallyUITests.testAccessibilityAuditTallyScreenWithATruncatedMetaLine). That test reads its
// skips back through auditNamingElements, which is auditSkippingTabBar with each failing issue named.
//
// This file also holds the narrowness proof. The app has no low-contrast element above the bar,
// so the on-device case moves the bar away and checks that the same issues now fail.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

/// The tab-bar skip, as the owner ruled it on 2026-10-28 16:40 CDT (audit-skips-measured-flags): true when the
/// element's frame shares any area with the bar, or lies wholly below the window's bottom edge. A finding with no
/// element, an empty frame, or a window or bar that did not resolve is never skipped on that side. An element that only
/// touches the bar's top edge shares no area, so it is kept.
func isUnderTabBar(_ element: CGRect?, bar: CGRect, window: CGRect) -> Bool {
    guard let element, !element.isEmpty else { return false }
    return !bar.intersection(element).isEmpty || (!window.isEmpty && element.minY >= window.maxY)
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

/// The ruled: closure of auditSkippingTabBar (the skipping: closure of auditNamingElements), over a real audit issue.
@MainActor func skipMeasuredContrastFlags(_ issue: XCUIAccessibilityAuditIssue) -> Bool {
    isMeasuredContrastFlag(issue.auditType, identifier: issue.element?.identifier)
}

/// The system keyboard's prediction cell, which the app does not draw (decision audit-skips-measured-flags). The
/// audit reports it with no identifier and no label, and names its class only in the detailed description:
/// "This TUIPredictionViewCell is missing useful accessibility information." So it matches on that text, as one whole
/// word, and ignores the audit type: the ruling skips every type on this element. A class that only contains the name
/// does not match. Only the two composer audits use it (OrphanedUITests.composerAuditSkips).
func isKeyboardPredictionCell(detail: String) -> Bool {
    detail.split(whereSeparator: { !$0.isLetter && !$0.isNumber && $0 != "_" }).contains("TUIPredictionViewCell")
}

/// The ruled: closure of auditSkippingTabBar (the skipping: closure of auditNamingElements), over a real audit issue.
@MainActor func skipKeyboardPredictionCells(_ issue: XCUIAccessibilityAuditIssue) -> Bool {
    isKeyboardPredictionCell(detail: issue.detailedDescription)
}

extension XCUIApplication {
    /// The top of the band a list scrolls in: the status bar's foot, or the window's top when no status bar resolves.
    /// The status bar is not in the app's accessibility tree on the simulator runs so far, so this reads the window's
    /// top there, above the real band, where a list's first frame and a pinned running head sit. Only
    /// reveal(whole:) reads it. It is not the masthead's top, which is a container's union frame and starts below the
    /// masthead's own padding.
    var listTop: CGFloat {
        max(windows.firstMatch.frame.minY, statusBars.firstMatch.exists ? statusBars.firstMatch.frame.maxY : 0)
    }

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
        let top = listTop
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

    /// The accessibility audit, minus every issue whose element touches the tab bar or lies below the window
    /// (isUnderTabBar). The issues it skips and the issues it fails come back as text. `bar` and `window` replace the
    /// tab bar's and the window's frames, for the narrowness test. With `record: false` no issue is recorded, so a test
    /// can read them.
    /// `ruled` is another skip the owner ruled on, such as skipMeasuredContrastFlags. An issue it accepts is left
    /// out and is not counted in `skipped`, which means "under the bar" only. It comes back in `ruled` instead.
    @discardableResult
    func auditSkippingTabBar(bar override: CGRect? = nil, window windowOverride: CGRect? = nil, record: Bool = true,
                             ruled: ((XCUIAccessibilityAuditIssue) -> Bool)? = nil) throws
        -> (skipped: [String], failing: [String], ruled: [String])
    {
        let tabBar = tabBars.firstMatch
        let bar = try XCTUnwrap(tabBar.waitForExistence(timeout: 5) ? override ?? tabBar.frame : nil, "the tab bar is missing")
        let window = windowOverride ?? windows.firstMatch.frame
        var skipped: [String] = [], failing: [String] = [], ruledText: [String] = []
        try performAccessibilityAudit { issue in
            let frame = issue.element?.frame
            let text = "\(issue.compactDescription) | id=\(issue.element?.identifier ?? "nil") label=\(issue.element?.label ?? "nil") | frame=\(frame.map(String.init(describing:)) ?? "nil") | bar=\(bar) | window=\(window)"
            if isUnderTabBar(frame, bar: bar, window: window) {
                print("AUDIT-SKIP \(text)")
                skipped.append(text)
                return true
            }
            if ruled?(issue) == true {
                print("AUDIT-RULED \(text)")
                ruledText.append(text)
                return true
            }
            print("AUDIT-FAIL \(text)")
            failing.append(text)
            return !record
        }
        return (skipped, failing, ruledText)
    }

    /// The whole audit with each failing issue named by its element: a bare performAccessibilityAudit() fails with
    /// "Contrast failed" and the result bundle does not say which element (palette-tokens-contrast-floor). It is
    /// auditSkippingTabBar with `skipping` as its `ruled:` skip, so the tab-bar skip and the AUDIT-* log lines have one
    /// home. An issue the handler accepts is never recorded by the audit itself, and the assertion below is the only
    /// failure. It returns the text of every issue let through, under the bar or ruled, so a test can prove that no
    /// skip covers an element (the Tally meta line). The default `skipping` adds none.
    @discardableResult
    func auditNamingElements(skipping skip: @escaping (XCUIAccessibilityAuditIssue) -> Bool = { _ in false },
                             file: StaticString = #filePath, line: UInt = #line) throws -> [String] {
        let result = try auditSkippingTabBar(record: false, ruled: skip)
        XCTAssertEqual(result.failing, [], "the audit flagged these elements", file: file, line: line)
        return result.skipped + result.ruled
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

    // MARK: the bar skip, on frames
    //
    // The owner ruling of 2026-10-28 16:40 CDT (audit-skips-measured-flags, waiting item 34) replaced the old
    // more-than-half cover rule: 1/4 under the bar and exactly half under it were kept before, and are skipped now.

    /// A phone window, and the bar at its foot.
    static let window = CGRect(x: 0, y: 0, width: 375, height: 852)
    static let bar = CGRect(x: 0, y: 770, width: 375, height: 82)
    /// A window taller than anything can lie below, so only the bar can skip an issue.
    static let tallWindow = CGRect(x: 0, y: 0, width: 400, height: 100_000)

    private func skipped(_ element: CGRect?, bar: CGRect = AuditSkippingTabBarUITests.bar,
                         window: CGRect = AuditSkippingTabBarUITests.window) -> Bool {
        isUnderTabBar(element, bar: bar, window: window)
    }

    func testTheBarSkipCoversAnyOverlapWithTheBar() {
        XCTAssertTrue(skipped(CGRect(x: 20, y: 790, width: 100, height: 20)), "an element inside the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 760, width: 100, height: 40)), "3/4 under the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 750, width: 100, height: 40)), "exactly half under the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 740, width: 100, height: 40)), "1/4 under the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 750, width: 100, height: 21)), "1pt of the element inside the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 760, width: 100, height: 100)), "an element that spans the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 790, width: 100, height: 20), window: .zero), "a window that did not resolve")
    }

    func testTheBarSkipCoversWhatLiesWhollyBelowTheWindow() {
        XCTAssertTrue(skipped(CGRect(x: 20, y: 860, width: 100, height: 20)), "an element below the window and the bar")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 852, width: 100, height: 20)), "an element that starts at the window's bottom edge")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 5_000, width: 100, height: 20), bar: Self.farAway), "far below, with the bar elsewhere")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 860, width: 100, height: 20), bar: .zero), "below the window, with a bar that did not resolve")
        XCTAssertTrue(skipped(CGRect(x: 20, y: 860, width: 100, height: 20), bar: .null), "below the window, with a null bar")
    }

    func testTheBarSkipKeepsWhatIsAboveTheBarAndWhatHasNoFrame() {
        // kept: clear of the bar and inside the window
        XCTAssertFalse(skipped(CGRect(x: 20, y: 700, width: 100, height: 20)), "an element above the bar")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 749, width: 100, height: 20)), "an element 1pt above the bar")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 750, width: 100, height: 20)), "an element that only touches the bar's top edge")
        XCTAssertFalse(skipped(CGRect(x: 20, y: -50, width: 100, height: 20)), "an element above the window")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 790, width: 100, height: 20), bar: Self.farAway), "an element in the window with the bar elsewhere")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 840, width: 100, height: 40), bar: Self.farAway), "an element that crosses the window's bottom edge")
        // kept: no element, or no frame
        XCTAssertFalse(skipped(nil), "a finding with no element")
        XCTAssertFalse(skipped(CGRect.zero), "a zero frame")
        XCTAssertFalse(skipped(CGRect.null), "a null frame")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 790, width: 100, height: 0)), "an element inside the bar with no height")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 790, width: 0, height: 20)), "an element inside the bar with no width")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 900, width: 0, height: 0)), "an empty frame below the window")
        // kept: a bar or a window that did not resolve skips nothing on its side
        XCTAssertFalse(skipped(CGRect(x: 20, y: 790, width: 100, height: 20), bar: .zero), "a bar that did not resolve")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 790, width: 100, height: 20), bar: .null), "a null bar")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 100, width: 100, height: 20), window: .zero), "a window that did not resolve")
        XCTAssertFalse(skipped(CGRect(x: 20, y: 100, width: 100, height: 20), window: .null), "a null window")
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

    /// Moving the bar away and growing the window turn every skipped issue into a failure, so the rule hides nothing
    /// that an on-screen element clear of the bar would show. Skips when nothing sits under the bar or below the
    /// window, because the rule then hides nothing.
    func testTheSameIssuesFailOnceTheBarMovesAway() throws {
        let app = launchedPackages()

        let real = try app.auditSkippingTabBar(record: false)
        XCTAssertEqual(real.failing, [], "an issue outside the tab bar fails the Packages audit")
        try XCTSkipIf(real.skipped.isEmpty, "no audit issue sits under the tab bar, so the rule hides nothing")

        let away = try app.auditSkippingTabBar(bar: Self.farAway, window: Self.tallWindow, record: false)
        XCTAssertEqual(away.skipped, [], "a bar far from the screen and a tall window still skipped an issue")
        XCTAssertEqual(away.failing.count, real.skipped.count + real.failing.count,
                       "the skipped issues did not all fail once the bar moved away and the window grew")
    }

    /// Orphaned's composer, open. The audit raises issues on it by itself, and the Orphaned composer audit has to skip
    /// them: Cancel's contrast flag (audit-skips-measured-flags, a bordered mini button flags in every container) and
    /// the contrast of the disabled Save. The Packages screen no longer raises one, so it cannot be the planted finding.
    /// These are the three steps OrphanedUITests runs (launch, openOrphaned, open the composer). They are repeated here
    /// because a test class cannot call another class's helpers, and moving the test there would change its id.
    private func launchedOrphanedComposer() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        app.tabBars.buttons["Orphaned"].tap()
        let record = app.descendants(matching: .any).matching(identifier: "orphaned-record").firstMatch
        XCTAssertTrue(record.waitForExistence(timeout: 5), "the Orphaned view has no Record control")
        record.tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "orphaned-input").firstMatch.waitForExistence(timeout: 5),
                      "the composer did not open before the audit")
        return app
    }

    /// The filtered audit still records an issue outside the bar. The screen is a known one that raises issues (the open
    /// Orphaned composer), so the test proves the skip lets a real finding through. The bar is far away, so it covers
    /// nothing and every issue is outside it. The expected failure is strict, so the test goes red when the audit
    /// records nothing, as it does if the handler returns true for such an issue. It also goes red if the composer
    /// ever audits clean: the finding to plant is then another known one, not a looser check.
    func testAnIssueOutsideTheBarIsRecorded() throws {
        let app = launchedOrphanedComposer()
        try XCTExpectFailure("an issue outside the tab bar fails the audit", strict: true) {
            try app.auditSkippingTabBar(bar: Self.farAway, window: Self.tallWindow, record: true)
        }
    }
}
