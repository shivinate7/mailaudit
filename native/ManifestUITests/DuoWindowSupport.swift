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
    /// The app launched on the fake seed (shared/fixtures/ledger.json). Never -ManifestUITestWidth: it frames the root to 375 pt.
    @MainActor static func launchedOnSeed() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed"]
        app.launch()
        return app
    }

    /// The first element with this accessibility identifier, whatever its type.
    func element(_ id: String) -> XCUIElement {
        descendants(matching: .any).matching(identifier: id).firstMatch
    }

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
