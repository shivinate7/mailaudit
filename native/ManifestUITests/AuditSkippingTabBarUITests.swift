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
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        app.tabBars.buttons["Packages"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "masthead").firstMatch.waitForExistence(timeout: 5), "masthead is missing")

        let real = try app.auditSkippingTabBar(record: false)
        XCTAssertEqual(real.failing, [], "an issue outside the tab bar fails the Packages audit")
        try XCTSkipIf(real.skipped.isEmpty, "no audit issue sits under the tab bar, so the rule hides nothing")

        let away = try app.auditSkippingTabBar(bar: Self.farAway, record: false)
        XCTAssertEqual(away.skipped, [], "a bar far from the screen still skipped an issue")
        XCTAssertEqual(away.failing.count, real.skipped.count + real.failing.count,
                       "the skipped issues did not all fail once the bar moved away")
    }
}
