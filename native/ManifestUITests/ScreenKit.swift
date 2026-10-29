// The steps the Packages screen tests share: launch the seeded app, find an element by identifier, wait on a predicate,
// tap with a scroll, and read the whole accessibility tree once. They had lived in PackageStampUITests as instance methods
// that no other test class could call. They are free-standing now, so PackageStampUITests and PackageBulkUITests call
// one copy. A test class keeps a one-line method of its own name where its cases already call that name.
//
// The tree is read in ONE snapshot, never a query per element: an armed ask lapses 4 seconds after its tap (the stamp
// ask and the Clear ask both do, stamp-band-opens-the-editor), and a query per element took about 2 seconds, so the
// last frames of a compare were read after the ask had gone. A scroll between two snapshots moves every frame alike,
// so a compare reads each frame relative to the card's own top.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

enum ScreenKit {
    /// What one snapshot read of an element: its frame, its label and whether it reports enabled.
    struct Seen {
        let frame: CGRect
        let label: String
        let isEnabled: Bool
    }

    /// The seeded app on a tab (Packages unless told), at the width the shell tests pass (-ManifestUITestWidth).
    @MainActor static func launch(width: Int = 375, tab: String = "Packages") -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ManifestUITestSeed", "-ManifestUITestWidth", String(width)]
        app.launch()
        app.tabBars.buttons[tab].tap()
        return app
    }

    @MainActor static func el(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    @MainActor static func wait(_ predicate: String, for e: XCUIElement, _ message: String, timeout: TimeInterval = 5,
                                file: StaticString = #filePath, line: UInt = #line) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: e)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: timeout), .completed, message, file: file, line: line)
    }

    /// Waits for the element, scrolls it into reach when it is not hittable, taps it.
    @MainActor static func tap(_ app: XCUIApplication, _ id: String, file: StaticString = #filePath, line: UInt = #line) {
        let e = el(app, id)
        XCTAssertTrue(e.waitForExistence(timeout: 5), "\(id) is missing", file: file, line: line)
        if !e.isHittable { app.reveal(e) }
        e.tap()
    }

    /// The first stamp: Stamp, a kind, an optional note, Save. It ends with the editor gone.
    @MainActor static func stamp(_ app: XCUIApplication, _ gk: String, kind: String, note: String? = nil,
                                 file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(el(app, "package-row:\(gk)").waitForExistence(timeout: 5), "\(gk) is not on the list", file: file, line: line)
        tap(app, "stamp-button:\(gk)", file: file, line: line)
        tap(app, "stamp-kind:\(gk)|\(kind)", file: file, line: line)
        if let note {
            tap(app, "stamp-note:\(gk)", file: file, line: line)
            el(app, "stamp-note:\(gk)").typeText(note)
        }
        tap(app, "stamp-save:\(gk)", file: file, line: line)
        wait("exists == false", for: el(app, "stamp-editor:\(gk)"), "Save did not close the editor on \(gk)", file: file, line: line)
    }

    /// Each element whose identifier starts with one of `prefixes`, by identifier, from one snapshot of the app's tree.
    @MainActor static func snapshot(_ app: XCUIApplication, prefixes: [String], file: StaticString = #filePath, line: UInt = #line) -> [String: Seen] {
        var out: [String: Seen] = [:]
        func walk(_ s: XCUIElementSnapshot) {
            if prefixes.contains(where: { s.identifier.hasPrefix($0) }) { out[s.identifier] = Seen(frame: s.frame, label: s.label, isEnabled: s.isEnabled) }
            s.children.forEach(walk)
        }
        do { walk(try app.snapshot()) } catch { XCTFail("no accessibility snapshot of the app: \(error)", file: file, line: line) }
        return out
    }

    /// Each frame with `anchor`'s top left taken off, so a scroll between two snapshots changes nothing.
    static func relative(_ s: [String: CGRect], to anchor: String) -> [String: CGRect] {
        guard let a = s[anchor] else { return [:] }
        return s.mapValues { $0.offsetBy(dx: -a.minX, dy: -a.minY) }
    }

    /// Every frame in `before` (already relative to the card's top) that is still on screen sits where it did. `taken` is a
    /// snapshot the caller read at the moment that matters (an armed ask is live for 4 seconds only); without it the frames
    /// are read now, from `prefixes`.
    @MainActor static func assertStill(_ before: [String: CGRect], _ app: XCUIApplication, anchor: String, _ what: String, prefixes: [String],
                                       taken: [String: CGRect]? = nil, minimum: Int = 8, file: StaticString = #filePath, line: UInt = #line) {
        let after = relative(taken ?? snapshot(app, prefixes: prefixes, file: file, line: line).mapValues(\.frame), to: anchor)
        let common = before.keys.filter { after[$0] != nil }
        XCTAssertGreaterThanOrEqual(common.count, minimum, "too few frames to compare after \(what)", file: file, line: line)
        // Layout rounding gives one frame a float error (319.0000305 against 319.0), so each edge is compared to half a
        // point, as the other frame checks here are. A 1pt move shifts an edge by 1.0 and still fails.
        for id in common {
            guard let was = before[id], let now = after[id] else { continue }
            for (edge, a, b) in [("minX", now.minX, was.minX), ("minY", now.minY, was.minY), ("maxX", now.maxX, was.maxX), ("maxY", now.maxY, was.maxY)] {
                XCTAssertEqual(a, b, accuracy: 0.5, "\(id) moved when \(what): \(edge) \(b) to \(a)", file: file, line: line)
            }
        }
    }
}
