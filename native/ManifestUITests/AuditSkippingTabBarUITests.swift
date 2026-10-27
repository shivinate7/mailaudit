// Accessibility audit that skips what the tab bar covers (lane N8, native-build-lanes, N8 notes,
// owner ruling 2026-10-21). The 225pt masthead pushes the 12-item fixture down, so the last rows
// sit under the glass tab bar and fail contrast there. The two Packages audits call
// auditSkippingTabBar(), which skips an issue only when the bar covers most of its element.
// Every other issue, and any issue with no element, still fails.
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
    @discardableResult
    func auditSkippingTabBar(bar override: CGRect? = nil, record: Bool = true) throws
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
