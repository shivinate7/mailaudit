import XCTest

// Duo window support (duo-spine-shell, decision duo-card-in-hand). An open iPhone Duo draws the app on the inner screen,
// so tests read the window, never `app`. The hinge pose is set outside the test, with the hinge command (ios-apps skill,
// "Folding the iPhone Duo simulator"). Each test names the pose it expects and checks the window size that pose gives.
// A run in the wrong pose fails on that size. It never skips.
//
//   flat    open Duo, 180 degrees, inner screen: window 951 x 669 pt
//   closed  closed Duo, outer screen: window 466 x 678 pt
//
// The sizes come from the duo-card-in-hand mockup README and degen's Duo window helper. They are not re-measured here.

/// Numbers every Duo UI test shares.
enum DuoMetrics {
    static let tolerance: CGFloat = 2
    /// Half the fold strip (40 pt, centred): how far a full-width row must reach past the middle on each side
    /// (455.5 and 495.5 at a 951 pt window), and how far right of the middle the right page starts.
    static let foldMargin: CGFloat = 20
    /// The tallest the custom bar's view may be: the pill (64 pt) and the 12 pt under it.
    static let barHeight: CGFloat = 76
    /// The room a bottom bar may keep above the window's bottom edge. The outer screen's bottom inset is 34 pt; the inner one is unmeasured.
    static let bottomAllowance: CGFloat = 40
}

/// A page of the open Duo's spread: left of the fold strip, or right of it.
enum DuoPage { case left, right }

enum DuoPose {
    case flat, closed

    var windowSize: CGSize {
        switch self {
        case .flat: CGSize(width: 951, height: 669)
        case .closed: CGSize(width: 466, height: 678)
        }
    }
}

extension XCUIApplication {
    /// The window the app draws on. Frames and taps anchor here: on an open Duo, `app` coordinates land on the outer display.
    var window: XCUIElement { windows.firstMatch }

    /// Waits up to 5 s for the window to reach the size of `pose`. On a mismatch it records a failure and returns false,
    /// so the caller returns. It never skips: a wrong pose is a red test.
    @MainActor @discardableResult
    func requirePose(_ pose: DuoPose, file: StaticString = #filePath, line: UInt = #line) -> Bool {
        let want = pose.windowSize
        func fits(_ f: CGRect) -> Bool { abs(f.width - want.width) < 2 && abs(f.height - want.height) < 2 }
        let deadline = Date().addingTimeInterval(5)
        while !fits(window.frame) && Date() < deadline { Thread.sleep(forTimeInterval: 0.2) }
        let got = window.frame
        guard fits(got) else {
            XCTFail("Wrong hinge pose. This test expects \(pose), a window of \(Int(want.width)) x \(Int(want.height)) pt. The window is \(Int(got.width)) x \(Int(got.height)) pt. Set the pose with the hinge command, then run again.", file: file, line: line)
            return false
        }
        return true
    }
}

extension XCTestCase {
    /// Holds the screen for the run script's shot. XCTest's own screenshots and recordings come back black on the Duo
    /// simulator, so the script watches for the marker and captures the display with `simctl io` while the test waits.
    /// Off unless the run sets TEST_RUNNER_DUO_SHOTS.
    func keepShot(_ app: XCUIApplication, _ name: String) {
        guard ProcessInfo.processInfo.environment["DUO_SHOTS"] != nil else { return }
        print("DUO-SHOT \(name)")
        Thread.sleep(forTimeInterval: 4)
    }
}

extension XCUIApplication {
    /// The app on the shared fake seed. Do not pass -ManifestUITestWidth: it frames the root to 375 pt.
    @MainActor static func launchedOnSeed() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        return app
    }

    /// The custom tab bar of the open Duo.
    var duoBar: XCUIElement { byID("duo-tab-bar") }

    func byID(_ id: String) -> XCUIElement {
        descendants(matching: .any).matching(identifier: id).firstMatch
    }

    func elements(prefix: String) -> [XCUIElement] {
        descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix)).allElementsBoundByIndex
    }

    /// The first element whose identifier starts with `prefix`. It resolves when used, so a caller can wait for it.
    func firstElement(prefix: String) -> XCUIElement {
        descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix)).firstMatch
    }

    /// Of every element whose identifier starts with one of `prefixes`: how many exist, and the identifiers whose frame
    /// reaches more than 1 pt into the fold strip (the window's middle, `foldMargin` each side). A caller asserts
    /// `seen > 0` too, so a scan that found nothing cannot pass.
    func partsInFoldStrip(prefixes: [String]) -> (seen: Int, inStrip: [String]) {
        let win = window.frame
        let lo = win.midX - DuoMetrics.foldMargin, hi = win.midX + DuoMetrics.foldMargin
        var seen = 0
        var inStrip: [String] = []
        for prefix in prefixes {
            for part in elements(prefix: prefix) {
                seen += 1
                let f = part.frame
                if min(f.maxX, hi) - max(f.minX, lo) > 1 { inStrip.append("\(part.identifier) \(f)") }
            }
        }
        return (seen, inStrip)
    }
}

extension XCTestCase {
    /// Waits for `element`, then checks its frame lies on `page` of the flat Duo: between the window's left edge and the fold strip,
    /// or between the strip and the window's right edge.
    @MainActor func expect(_ element: XCUIElement, on page: DuoPage, in app: XCUIApplication, _ what: String,
                           file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(element.waitForExistence(timeout: 5), "\(what) is missing", file: file, line: line)
        let win = app.window.frame, f = element.frame, tol = DuoMetrics.tolerance, margin = DuoMetrics.foldMargin
        switch page {
        case .left:
            XCTAssertGreaterThanOrEqual(f.minX, win.minX - tol, "\(what) starts left of the window: \(f)", file: file, line: line)
            XCTAssertLessThanOrEqual(f.maxX, win.midX - margin + tol, "\(what) is not on the left page, it reaches \(f.maxX) pt: \(f)", file: file, line: line)
        case .right:
            XCTAssertGreaterThanOrEqual(f.minX, win.midX + margin - tol, "\(what) is not on the right page, it starts at \(f.minX) pt: \(f)", file: file, line: line)
            XCTAssertLessThanOrEqual(f.maxX, win.maxX + tol, "\(what) runs past the window's right edge: \(f)", file: file, line: line)
        }
    }

    /// A page that keeps the full width: `element` starts left of the fold strip, ends right of it, and covers most of the window.
    @MainActor func expectSpansFold(_ element: XCUIElement, in app: XCUIApplication, _ what: String,
                                    file: StaticString = #filePath, line: UInt = #line) {
        let win = app.window.frame, f = element.frame
        XCTAssertLessThan(f.minX, win.midX - DuoMetrics.foldMargin, "the \(what) starts right of the fold", file: file, line: line)
        XCTAssertGreaterThan(f.maxX, win.midX + DuoMetrics.foldMargin, "the \(what) stops at the fold", file: file, line: line)
        XCTAssertGreaterThan(f.width, win.width * 0.9, "the \(what) is not full width", file: file, line: line)
    }
}
