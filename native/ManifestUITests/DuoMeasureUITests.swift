import XCTest

// Measuring class for two open Duo debts: hand-match-row-ax3-unmeasured (the first match row against the system keys) and
// duo-bar-dynamic-type-clips (the open Duo's tab-bar pill against its labels). It prints figures at six content sizes.
// It asserts nothing about a figure: a figure that looks wrong is a finding for the lane, not a red test. It fails only when
// the app does not launch. It will not merge, and nothing here is a claim.
//
// Run on the open Duo at pose flat (window 951 x 669 pt, set with `~/.local/bin/hinge open`). First turn off Simulator >
// I/O > Keyboard > Connect Hardware Keyboard: with a hardware keyboard the system keys never draw, and the hand figures
// read MISSING.
//   xcodebuild test -project native/Manifest.xcodeproj -scheme Manifest -destination 'platform=iOS Simulator,id=<Duo UDID>' \
//     -only-testing:ManifestUITests/DuoMeasureUITests
// Each size is one test method: testMeasureDefault, testMeasureAccessibilityM, ... testMeasureAccessibilityXXXL. Size names
// in the output are the short forms, without the UICTContentSizeCategory prefix. Read the lines that start with MEASURE.
//
// Lines, per size, in this order:
//   MEASURE pose <size> window=<w>x<h> flat=<yes|no>   flat=no: every figure after it is for another pose.
//   MEASURE bar <size> pill=... bar=... labels=[...]
//   MEASURE hand <size> field=... row=... keysTop=... gap=...
//   MEASURE hand-drawn <size> keysTop=... gap=...      the same, with the panel's drawn top 44 pt above its frame.
//   MEASURE hand-screen <size> ...                     printed only when the field, the row or the keys read MISSING.
// Frames read "x,y wxh" in points. gap = keysTop - row.maxY: a positive gap means the row ends above the keys.
//
// The pill has no identifier. It is derived from duo-tab-bar with DuoBarMetrics (DuoSpine.swift): 24 pt in from each side,
// 12 pt up from the bar's bottom, 64 pt high. The tab buttons sit 4 pt inside the pill, so their frames check the derivation.
// The titles are fixedSize, so they overflow the pill and never show an ellipsis. A label is truncated when its frame passes
// the pill on any side. wider=yes means the label is wider than its own button, so it crowds the next one.
//
// Helpers are local copies, not calls into DuoHandUITests: openHand and typeCard there are instance methods of that class,
// and they assert, so they cannot serve a class that must never fail on a figure.

/// Figures printed with one decimal place.
private func figure(_ v: CGFloat) -> String { String(format: "%.1f", v) }

/// A frame as "x,y wxh".
private func frameText(_ r: CGRect) -> String {
    "\(figure(r.minX)),\(figure(r.minY)) \(figure(r.width))x\(figure(r.height))"
}

/// keysTop minus the row's bottom edge, or MISSING when either is absent.
private func gapText(_ keysTop: CGFloat?, _ row: CGRect?) -> String {
    guard let k = keysTop, let r = row else { return "MISSING" }
    return figure(k - r.maxY)
}

/// The sides on which a label's frame passes the pill, and by how much. Empty when the label sits inside the pill.
private func sidesPast(_ f: CGRect, _ pill: CGRect) -> [String] {
    var sides: [String] = []
    if f.minX < pill.minX - 0.5 { sides.append("left \(figure(pill.minX - f.minX))") }
    if f.maxX > pill.maxX + 0.5 { sides.append("right \(figure(f.maxX - pill.maxX))") }
    if f.minY < pill.minY - 0.5 { sides.append("top \(figure(pill.minY - f.minY))") }
    if f.maxY > pill.maxY + 0.5 { sides.append("bottom \(figure(f.maxY - pill.maxY))") }
    return sides
}

@MainActor
final class DuoMeasureUITests: XCTestCase {
    // "default" passes the iOS default category explicitly, so the baseline does not depend on the simulator's own setting.
    func testMeasureDefault() { measure("default", "UICTContentSizeCategoryL") }
    func testMeasureAccessibilityM() { measure("AccessibilityM", "UICTContentSizeCategoryAccessibilityM") }
    func testMeasureAccessibilityL() { measure("AccessibilityL", "UICTContentSizeCategoryAccessibilityL") }
    func testMeasureAccessibilityXL() { measure("AccessibilityXL", "UICTContentSizeCategoryAccessibilityXL") }
    func testMeasureAccessibilityXXL() { measure("AccessibilityXXL", "UICTContentSizeCategoryAccessibilityXXL") }
    func testMeasureAccessibilityXXXL() { measure("AccessibilityXXXL", "UICTContentSizeCategoryAccessibilityXXXL") }

    /// One launch per size: the pose, then the bar, then Card in Hand. The bar is read first, so a fault on the hand path cannot cost its figures.
    func measure(_ size: String, _ category: String) {
        let app = XCUIApplication.launchedOnSeed(extra: ["-UIPreferredContentSizeCategoryName", category])
        guard app.window.waitForExistence(timeout: 15) else {
            XCTFail("the app did not launch at \(size): it shows no window")
            return
        }
        printPose(app, size)
        measureBar(app, size)
        keepShot(app, "measure-bar-\(size)")
        measureHand(app, size)
        keepShot(app, "measure-hand-\(size)")
    }

    func printPose(_ app: XCUIApplication, _ size: String) {
        let w = app.window.frame, want = DuoPose.flat.windowSize
        let flat = abs(w.width - want.width) < DuoMetrics.tolerance && abs(w.height - want.height) < DuoMetrics.tolerance
        print("MEASURE pose \(size) window=\(Int(w.width))x\(Int(w.height)) flat=\(flat ? "yes" : "no")")
    }

    // MARK: the tab bar

    /// The pill's inset in DuoBarMetrics (DuoSpine.swift): the horizontal padding, the lift under the pill, and the pill's height.
    static let pillInset: CGFloat = 24, pillLift: CGFloat = 12, pillHeight: CGFloat = 64

    func measureBar(_ app: XCUIApplication, _ size: String) {
        let bar = app.duoBar
        guard bar.waitForExistence(timeout: 5) else {
            print("MEASURE bar \(size) pill=MISSING bar=MISSING labels=MISSING duo-tab-bar is not on screen: \(onScreen(app))")
            return
        }
        let b = bar.frame
        let pill = CGRect(x: b.minX + Self.pillInset, y: b.maxY - Self.pillLift - Self.pillHeight,
                          width: b.width - 2 * Self.pillInset, height: Self.pillHeight)
        let parts = DuoShellUITests.tabTitles.map { title -> String in
            let label = app.element("duo-tab-title:\(title)")
            let button = bar.buttons[title]
            guard label.exists else { return "\(title)[MISSING]" }
            let f = label.frame
            let past = sidesPast(f, pill)
            let buttonText = button.exists ? frameText(button.frame) : "MISSING"
            let wider = button.exists && f.width > button.frame.width + 0.5
            let truncated = past.isEmpty ? "no" : "yes"
            let pastText = past.isEmpty ? "none" : past.joined(separator: ",")
            let widerText = wider ? "yes" : "no"
            return "\(title)[frame \(frameText(f)) truncated=\(truncated) past=\(pastText) button=\(buttonText) wider=\(widerText)]"
        }
        print("MEASURE bar \(size) pill=\(frameText(pill)) bar=\(frameText(b)) labels=\(parts.joined(separator: " "))")
    }

    // MARK: Card in Hand, the first match row against the keys

    func measureHand(_ app: XCUIApplication, _ size: String) {
        openHandForMeasure(app)
        let field = app.element("hand-query")
        if field.exists, field.isHittable {
            field.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
            field.typeText("Path to Exile")
            _ = app.keyboards.firstMatch.waitForExistence(timeout: 5)
        }
        waitForOneHit(app)
        let frames = settled { [keyFrame(app), firstHitFrame(app)] }
        let key = frames[0], row = frames[1]
        let fieldFrame: CGRect? = field.exists ? field.frame : nil

        print("MEASURE hand \(size) field=\(fieldFrame.map(frameText) ?? "MISSING") row=\(row.map(frameText) ?? "MISSING") keysTop=\(key.map { figure($0.minY) } ?? "MISSING") gap=\(gapText(key?.minY, row))")
        let drawnTop = key.map { $0.minY - DuoHandUITests.keyboardDrawnAbove }
        print("MEASURE hand-drawn \(size) keysTop=\(drawnTop.map(figure) ?? "MISSING") gap=\(gapText(drawnTop, row))")
        if fieldFrame == nil || row == nil || key == nil {
            print("MEASURE hand-screen \(size) \(handState(app))")
        }
    }

    /// Card in Hand, opened as DuoHandUITests.openHand opens it, with no assertion: a control that is missing or not hittable is skipped.
    func openHandForMeasure(_ app: XCUIApplication) {
        let packages = app.duoBar.buttons["Packages"]
        if packages.waitForExistence(timeout: 5), packages.isHittable { packages.tap() }
        if !app.element("hand-query").waitForExistence(timeout: 3) {
            let open = app.element("hand-open")
            if open.waitForExistence(timeout: 2), open.isHittable { open.tap() }
        }
        _ = app.element("hand-query").waitForExistence(timeout: 5)
    }

    /// Polls for the single match row the typed name leaves, up to 5 s. It reads, never asserts: the figure is taken whatever the count.
    func waitForOneHit(_ app: XCUIApplication) {
        let deadline = Date().addingTimeInterval(5)
        while hitRows(app).count != 1 && Date() < deadline { Thread.sleep(forTimeInterval: 0.1) }
    }

    /// The figure once it has held for three reads, 0.2 s apart. The system keys slide up and the list settles after the last key,
    /// so an early read can land mid-motion.
    func settled(_ read: () -> [CGRect?]) -> [CGRect?] {
        var last = read(), held = 0
        for _ in 0..<40 where held < 3 {
            Thread.sleep(forTimeInterval: 0.2)
            let now = read()
            held = now == last ? held + 1 : 0
            last = now
        }
        return last
    }

    /// The system keys' frame, or nil when no keys are up.
    func keyFrame(_ app: XCUIApplication) -> CGRect? {
        let keys = app.keyboards.firstMatch
        return keys.exists ? keys.frame : nil
    }

    /// The first match row's frame, or nil when no match row shows.
    func firstHitFrame(_ app: XCUIApplication) -> CGRect? {
        guard let row = hitRows(app).first, row.exists else { return nil }
        return row.frame
    }

    /// The match rows, top to bottom, one per identifier.
    func hitRows(_ app: XCUIApplication) -> [XCUIElement] {
        var seen = Set<String>()
        return app.elements(prefix: "hand-hit:").filter { seen.insert($0.identifier).inserted }.sorted { $0.frame.minY < $1.frame.minY }
    }

    /// What is on screen when a control is missing: the window, the Packages tab, the hand controls, the match rows, and the keys.
    func handState(_ app: XCUIApplication) -> String {
        let packages = app.duoBar.buttons["Packages"]
        let packagesText = packages.exists ? "selected=\(packages.isSelected) hittable=\(packages.isHittable)" : "MISSING"
        let open = app.element("hand-open")
        let openText = open.exists ? "exists hittable=\(open.isHittable) frame=\(frameText(open.frame))" : "MISSING"
        let query = app.element("hand-query")
        let queryText = query.exists ? "exists hittable=\(query.isHittable) frame=\(frameText(query.frame))" : "MISSING"
        return "window=\(frameText(app.window.frame)) packages=[\(packagesText)] hand-open=[\(openText)] hand-query=[\(queryText)] hits=\(hitRows(app).count) keyboards=\(app.keyboards.count) on-screen=[\(onScreen(app))]"
    }

    /// The identifiers on screen with their frames, read from one accessibility snapshot and capped at 60 so the line stays short.
    func onScreen(_ app: XCUIApplication) -> String {
        guard let root = try? app.snapshot() else { return "snapshot unavailable" }
        var out: [String] = []
        func walk(_ node: any XCUIElementSnapshot) {
            guard out.count < 60 else { return }
            if !node.identifier.isEmpty { out.append("\(node.identifier)@\(frameText(node.frame))") }
            for child in node.children { walk(child) }
        }
        walk(root)
        return out.joined(separator: " ")
    }
}
