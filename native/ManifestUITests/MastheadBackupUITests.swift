// Masthead and Backup UI tests (lane N8, native-build-lanes, masthead-is-one-letterhead,
// masthead-tallies-unequal-thirds, masthead-save-slot-reserved, no-layout-shift-under-pointer,
// recovery-control-not-state-gated).
//
// Red-first. The builder adds the views in native/Manifest and makes these pass. They compile
// against main today and fail on a missing element, not on a compile error.
//
// Contract the tests name (the builder implements all of it). Accessibility identifiers:
//   Packages tab, above the package list (orchestrator default 2026-10-20: the web masthead
//   sits above every view; N8 puts it on Packages, and the other tabs may adopt it later):
//     masthead                  the whole letterhead, one element that contains the rest
//     masthead-rule-left, masthead-seal, masthead-rule-right    one row, left to right
//     masthead-title            label MANIFEST (any case)
//     masthead-house            label "C.H Postal Company" (any case, the web sets it in capitals)
//     tally-cards, tally-packages, tally-value
//                               label = "cards" / "packages" / "value"; value = the cell's
//                               figure ("0/14", "0/4", "$0/$68"), see MastheadModel
//     masthead-count, masthead-missing   label = countLine and missingLine of MastheadModel
//     save-slot                 label = the SaveIndicator label; idle reads blank
//   Ledger tab (orchestrator default 2026-10-20: web puts Backup in the Ledger tab's Data
//   group, ledger-tab-holds-options; N8 adds only that row):
//     backup                    a button labelled "Backup", at least 44pt by 44pt
// Launch arguments: -ManifestUITestSeed and -ManifestUITestWidth as N5 defines them, and
//   -ManifestUITestSaveState idle|saving|saved|failed (new): pins the save slot to that state
//   for the whole run, so every state can be measured without a failing disk.
// After a successful check-in the slot reads "saved ✓" for at least one second.
//
// Layout the tests pin: the three tally cells share one row at 375pt, the cards and packages
// cells are equal, and the value cell is 1.5x to 2x as wide (the web flex is 1.7). Nothing in
// the masthead changes frame when a check-in lands or when the slot changes state.
//
// Step 5 (the masthead on every tab), at the foot of this class. The contract the builder meets:
//   the masthead, with the identifiers above, is the first thing in every tab's scroll content;
//   the foot is two fixed rows: masthead-count on row 1, masthead-missing on the left of row 2 and
//   save-slot on the right of row 2. No part of the masthead changes frame when the tab changes, at
//   375pt and at 320pt (-ManifestUITestWidth). Each tab's masthead-count carries that tab's count.
// The compose-once claim is not here: no UI test can read an opacity (see MastheadComposeOnceTests).
// The running-head slot: the first content element of every tab (the sync advisory when it shows, else the first row or the
// title) sits 47pt below the masthead's foot, the 46pt head and its 1pt rule. `running-head` is the head, pinned over the list
// once the masthead has scrolled away. It is mounted only while pinned, so a test reads its existence and frame, never its
// opacity, and pinning or unpinning it moves no other frame. Launch argument -ManifestUITestSyncStatus 401 shows the advisory.
//
// Not driven: the share sheet behind Backup, and Backup on a ledger that failed to open (no
// launch argument corrupts the seed). The file bytes are pinned in BackupExportTests.
//
// Every key here is fake. The tests read no Keychain item.

import XCTest

@MainActor
final class MastheadBackupUITests: XCTestCase {
    static let minHit: CGFloat = 44
    static let checkedId = "checkin:A1|0|pLightningBolt"
    static let checkedPackageId = "package-row:A1::Alpha Cards"
    static let cellIds = ["tally-cards", "tally-packages", "tally-value"]

    // MARK: helpers

    func launch(width: Int? = 375, saveState: String? = nil, syncStatus: Int? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed"]
        if let width { args += ["-ManifestUITestWidth", String(width)] }
        if let saveState { args += ["-ManifestUITestSaveState", saveState] }
        if let syncStatus { args += ["-ManifestUITestSyncStatus", String(syncStatus)] }
        app.launchArguments = args
        app.launch()
        return app
    }

    func find(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// The element, or a failed assertion that names it. Later lines never read a missing frame.
    func need(_ app: XCUIApplication, _ id: String) throws -> XCUIElement {
        let el = find(app, id)
        return try XCTUnwrap(el.waitForExistence(timeout: 5) ? el : nil, "\(id) is missing")
    }

    func openTab(_ app: XCUIApplication, _ title: String) {
        app.tabBars.buttons[title].tap()
    }

    func wait(_ el: XCUIElement, _ format: String, _ arg: String, _ what: String) {
        let done = XCTNSPredicateExpectation(predicate: NSPredicate(format: format, arg), object: el)
        XCTAssertEqual(XCTWaiter.wait(for: [done], timeout: 5), .completed, what)
    }

    func figure(_ el: XCUIElement) -> String? { el.value as? String }

    func isBlank(_ s: String) -> Bool { s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    // MARK: the letterhead

    /// Seal between two rules, then MANIFEST, then the house line, then the tallies. One block.
    func testLetterheadIsOneBlockInOrder() throws {
        let app = launch()
        openTab(app, "Packages")
        let head = try need(app, "masthead")
        let left = try need(app, "masthead-rule-left")
        let seal = try need(app, "masthead-seal")
        let right = try need(app, "masthead-rule-right")
        let title = try need(app, "masthead-title")
        let house = try need(app, "masthead-house")
        let cards = try need(app, "tally-cards")

        for (id, el) in [("rule-left", left), ("seal", seal), ("rule-right", right), ("title", title), ("house", house), ("cards", cards)] {
            XCTAssertTrue(head.frame.insetBy(dx: -1, dy: -1).contains(el.frame), "\(id) sits outside the masthead block")
        }
        XCTAssertLessThanOrEqual(left.frame.maxX, seal.frame.minX + 1, "the left rule is not left of the seal")
        XCTAssertLessThanOrEqual(seal.frame.maxX, right.frame.minX + 1, "the right rule is not right of the seal")
        XCTAssertLessThan(abs(left.frame.midY - seal.frame.midY), seal.frame.height / 2, "the left rule is off the seal's row")
        XCTAssertLessThan(abs(right.frame.midY - seal.frame.midY), seal.frame.height / 2, "the right rule is off the seal's row")
        let rowBottom = max(left.frame.maxY, seal.frame.maxY, right.frame.maxY)
        XCTAssertGreaterThanOrEqual(title.frame.minY, rowBottom - 1, "the title is not below the seal row")
        XCTAssertGreaterThanOrEqual(house.frame.minY, title.frame.maxY - 1, "the house line is not below the title")
        XCTAssertGreaterThanOrEqual(cards.frame.minY, house.frame.maxY - 1, "the tallies are not below the house line")
        XCTAssertEqual(title.label.lowercased(), "manifest")
        XCTAssertEqual(house.label.lowercased(), "c.h postal company")
    }

    /// Three cells on one row: cards and packages equal, value wider (the web flex is 1.7).
    func testTalliesAreUnequalThirdsAt375pt() throws {
        let app = launch(width: 375)
        openTab(app, "Packages")
        let head = try need(app, "masthead")
        let c = try need(app, "tally-cards")
        let p = try need(app, "tally-packages")
        let v = try need(app, "tally-value")

        XCTAssertEqual([c.label, p.label, v.label], ["cards", "packages", "value"])
        XCTAssertEqual([figure(c), figure(p), figure(v)], ["0/14", "0/4", "$0/$68"], "the seeded ledger has 14 cards, 4 packages, $67.50")
        XCTAssertLessThanOrEqual(abs(c.frame.minY - p.frame.minY), 1, "cards and packages are not on one row")
        XCTAssertLessThanOrEqual(abs(c.frame.minY - v.frame.minY), 1, "cards and value are not on one row")
        XCTAssertLessThanOrEqual(c.frame.maxX, p.frame.minX + 1, "cards is not left of packages")
        XCTAssertLessThanOrEqual(p.frame.maxX, v.frame.minX + 1, "packages is not left of value")
        XCTAssertLessThanOrEqual(v.frame.maxX, head.frame.maxX + 1, "the value cell runs past the masthead")
        XCTAssertLessThanOrEqual(abs(c.frame.width - p.frame.width), 1, "cards and packages are not equal")
        let ratio = v.frame.width / c.frame.width
        XCTAssertGreaterThanOrEqual(ratio, 1.5, "the value cell is not wider than the counts")
        XCTAssertLessThanOrEqual(ratio, 2.0, "the value cell is far wider than the counts")
    }

    // MARK: a check-in moves the figures and nothing else

    /// One check-in: the tallies and the missing line follow, the slot reads saved, no frame moves. The A1 card is
    /// scrolled fully into view first: below the fold, the tap would scroll the list and every frame would move,
    /// the masthead's too. The at-rest checks come after that scroll, so they also prove it checked nothing in.
    func testTalliesAndSlotFollowACheckInWithoutMoving() throws {
        let app = launch(width: 375)
        openTab(app, "Packages")
        let control = try need(app, Self.checkedId)
        let slot = try need(app, "save-slot")
        let head = try need(app, "masthead")
        let cells = try Self.cellIds.map { try need(app, $0) }
        let count = try need(app, "masthead-count")
        let missing = try need(app, "masthead-missing")
        app.reveal(try need(app, Self.checkedPackageId), whole: true)
        XCTAssertTrue(control.label.hasPrefix("Check in"), "the scroll checked the line in before the baseline")
        let fixed = [head, slot] + cells
        let before = fixed.map(\.frame)
        let (countBefore, missingBefore) = (count.frame, missing.frame)
        XCTAssertTrue(isBlank(slot.label), "the slot is not blank at rest: \(slot.label)")

        control.tap()
        wait(slot, "label BEGINSWITH %@", "saved", "the slot never read saved after a check-in")
        wait(cells[0], "value == %@", "1/14", "the cards tally did not follow the check-in")

        XCTAssertEqual(slot.label, "saved \u{2713}")
        XCTAssertEqual(cells.map(figure), ["1/14", "0/4", "$1/$68"])
        XCTAssertEqual(missing.label, "13 still missing \u{00B7} $66.50")
        XCTAssertEqual(count.label, "4 packages \u{00B7} autosaves")
        for (el, was) in zip(fixed, before) {
            XCTAssertEqual(el.frame, was, "\(el.identifier) moved on a check-in")
        }
        for (name, now, was) in [("masthead-count", count.frame, countBefore), ("masthead-missing", missing.frame, missingBefore)] {
            XCTAssertEqual(now.minY, was.minY, accuracy: 0.5, "\(name) moved on a check-in")
            XCTAssertEqual(now.height, was.height, accuracy: 0.5, "\(name) changed height on a check-in")
        }
    }

    /// The slot has one size in all four states, and nothing beside it moves. A later state
    /// that adds a line or a pixel shifts the list under the pointer twice per tap.
    func testSaveSlotKeepsOneSizeInEveryState() throws {
        let expected = ["idle": "", "saving": "saving\u{2026}", "saved": "saved \u{2713}", "failed": "couldn\u{2019}t save"]
        var frames: [String: [CGRect]] = [:]
        for state in ["idle", "saving", "saved", "failed"] {
            let app = launch(saveState: state)
            openTab(app, "Packages")
            let slot = try need(app, "save-slot")
            XCTAssertEqual(isBlank(slot.label) ? "" : slot.label, expected[state], "the slot does not read \(state)")
            let cells = try Self.cellIds.map { try need(app, $0) }
            let missing = try need(app, "masthead-missing")
            frames[state] = [slot.frame, missing.frame] + cells.map(\.frame)
            app.terminate()
        }
        let first = try XCTUnwrap(frames["idle"], "no idle frames")
        for state in ["saving", "saved", "failed"] {
            let now = try XCTUnwrap(frames[state], "no \(state) frames")
            XCTAssertEqual(now[0].size, first[0].size, "the slot changes size in \(state)")
            XCTAssertEqual(now[0].origin, first[0].origin, "the slot moves in \(state)")
            XCTAssertEqual(now[1].minY, first[1].minY, accuracy: 0.5, "the missing line moves in \(state)")
            XCTAssertEqual(Array(now.dropFirst(2)), Array(first.dropFirst(2)), "a tally cell moves in \(state)")
        }
    }

    // MARK: step 5, the masthead on every tab

    /// The tabs in the order the tests visit them. Ledger is first because the app opens on it.
    static let tabs = ["Ledger", "Orphaned", "Tally", "Packages"]
    /// The parts that must hold their place when the tab changes.
    static let partIds = ["masthead", "tally-cards", "tally-packages", "tally-value", "masthead-count", "masthead-missing", "save-slot"]

    /// The one live copy of `id` on the open tab (XCUIApplication.live, below).
    func live(_ app: XCUIApplication, _ id: String, tab: String) throws -> XCUIElement { try app.live(id, tab: tab) }

    /// Opens the tab and waits until it is the selected one, so the next read is never the tab just left.
    func show(_ app: XCUIApplication, _ tab: String) {
        openTab(app, tab)
        waitForSelectedTab(tab, in: app)
    }

    func partFrames(_ app: XCUIApplication, tab: String) throws -> [String: CGRect] {
        var out: [String: CGRect] = [:]
        for id in Self.partIds { out[id] = try live(app, id, tab: tab).frame }
        return out
    }

    /// Each tab shows the masthead, and its count line holds that tab's count: Packages and Ledger the four
    /// packages, Tally the eight pooled products, Orphaned the zero envelopes. The digits are the fixture's
    /// facts. The words are the bundle's, pinned in Node (V21) and in MastheadModelTests, so they are not
    /// repeated here. Ledger also holds Backup, so a Packages copy cannot pass for the Ledger tab.
    func testMastheadIsOnEveryTab() throws {
        let app = launch(width: 375)
        var lines: [String: String] = [:]
        for tab in Self.tabs {
            show(app, tab)
            _ = try live(app, "masthead", tab: tab)
            _ = try live(app, "save-slot", tab: tab)
            lines[tab] = try live(app, "masthead-count", tab: tab).label
        }

        for (tab, digit) in [("Packages", "4"), ("Ledger", "4"), ("Tally", "8"), ("Orphaned", "0")] {
            let line = lines[tab] ?? ""
            XCTAssertTrue(line.hasPrefix("\(digit) "), "\(tab): the count line `\(line)` does not lead with \(digit)")
            XCTAssertFalse(line.contains("in range"), "\(tab): native has no date filter, so no line says in range")
        }
        XCTAssertEqual(lines["Ledger"], lines["Packages"], "Ledger takes the Packages form")
        XCTAssertNotEqual(lines["Tally"], lines["Packages"], "Tally has its own form")
        XCTAssertNotEqual(lines["Orphaned"], lines["Packages"], "Orphaned has its own form")
        XCTAssertNotEqual(lines["Orphaned"], lines["Tally"], "Orphaned and Tally differ")

        show(app, "Ledger")
        let backup = try need(app, "backup")
        app.reveal(backup)
        XCTAssertTrue(backup.isHittable, "the Ledger tab does not hold Backup")
    }

    /// At scroll top, every masthead part has the Packages frame on every tab. The count line is read by
    /// its left edge, top and height only, since its text, and so its width, differs between tabs.
    func assertNoMastheadFrameMovesOnATabSwitch(width: Int) throws {
        let app = launch(width: width)
        var seen: [String: [String: CGRect]] = [:]
        for tab in Self.tabs {
            show(app, tab)
            seen[tab] = try partFrames(app, tab: tab)
        }
        let packages = try XCTUnwrap(seen["Packages"], "no Packages frames")
        for tab in Self.tabs where tab != "Packages" {
            let now = try XCTUnwrap(seen[tab], "no \(tab) frames")
            for id in Self.partIds {
                let (a, b) = (try XCTUnwrap(now[id], "no \(id) on \(tab)"), try XCTUnwrap(packages[id], "no \(id) on Packages"))
                let what = "\(id) on \(tab) at \(width)pt"
                XCTAssertEqual(a.minX, b.minX, accuracy: 0.5, "\(what) sits further across than on Packages")
                XCTAssertEqual(a.minY, b.minY, accuracy: 0.5, "\(what) sits higher or lower than on Packages")
                XCTAssertEqual(a.height, b.height, accuracy: 0.5, "\(what) changes height from Packages")
                if id != "masthead-count" { XCTAssertEqual(a.width, b.width, accuracy: 0.5, "\(what) changes width from Packages") }
            }
        }
    }

    func testNoMastheadFrameMovesOnATabSwitchAt375() throws { try assertNoMastheadFrameMovesOnATabSwitch(width: 375) }

    /// 320pt is the width where a long count line beside the slot used to run past the column.
    func testNoMastheadFrameMovesOnATabSwitchAt320() throws { try assertNoMastheadFrameMovesOnATabSwitch(width: 320) }

    /// The save slot sits on the missing row: its middle on the missing line's, right of it, and the count
    /// line wholly above that row. Nothing runs past the masthead. Checked on every tab.
    func assertTheSlotSitsOnTheMissingRow(width: Int) throws {
        let app = launch(width: width)
        for tab in Self.tabs {
            show(app, tab)
            let head = try live(app, "masthead", tab: tab).frame
            let count = try live(app, "masthead-count", tab: tab).frame
            let missing = try live(app, "masthead-missing", tab: tab).frame
            let slot = try live(app, "save-slot", tab: tab).frame
            let what = "\(tab) at \(width)pt"
            XCTAssertEqual(slot.midY, missing.midY, accuracy: 1, "\(what): the save slot is not on the missing row")
            XCTAssertLessThanOrEqual(count.maxY, missing.minY + 0.5, "\(what): the count line is not above the missing row")
            XCTAssertGreaterThanOrEqual(slot.minX, missing.maxX - 0.5, "\(what): the save slot overlaps the missing line")
            XCTAssertLessThanOrEqual(slot.maxX, head.maxX + 0.5, "\(what): the save slot runs past the masthead")
            XCTAssertLessThanOrEqual(count.maxX, head.maxX + 0.5, "\(what): the count line runs past the masthead")
        }
    }

    func testTheSlotSitsOnTheMissingRowAt375() throws { try assertTheSlotSitsOnTheMissingRow(width: 375) }

    func testTheSlotSitsOnTheMissingRowAt320() throws { try assertTheSlotSitsOnTheMissingRow(width: 320) }

    /// A Tally check-in moves the masthead's figures and its slot, and moves no part of it: the Tally tab
    /// calls saving and finished as Packages does. The Lightning Bolt row is opened and its first copy is
    /// scrolled fully into view first, as in the Packages test above. The Tally count line keeps its count.
    /// The masthead parts are bound with `live`, before the scroll, so they are the Tally tab's copies
    /// (the app opens on Ledger, and a first match could be that tab's masthead).
    func testATallyCheckInMovesTheMastheadFiguresWithoutMovingIt() throws {
        let app = launch(width: 375)
        show(app, "Tally")
        try need(app, "tally-toggle:Lightning Bolt").tap()
        let slot = try live(app, "save-slot", tab: "Tally")
        let head = try live(app, "masthead", tab: "Tally")
        let cells = try Self.cellIds.map { try live(app, $0, tab: "Tally") }
        let count = try live(app, "masthead-count", tab: "Tally")
        let control = try need(app, "tally-checkin:A1|0|pLightningBolt")
        app.reveal(control, whole: true)
        XCTAssertTrue(control.label.hasPrefix("Check in"), "the scroll checked the copy in before the baseline")
        let fixed = [head, slot] + cells
        let before = fixed.map(\.frame)
        let countBefore = (label: count.label, frame: count.frame)

        control.tap()
        wait(slot, "label BEGINSWITH %@", "saved", "the slot never read saved after a Tally check-in")
        wait(cells[0], "value == %@", "1/14", "the cards tally did not follow the Tally check-in")

        XCTAssertEqual(slot.label, "saved \u{2713}")
        XCTAssertEqual(cells.map(figure), ["1/14", "0/4", "$1/$68"])
        XCTAssertEqual(count.label, countBefore.label, "a check-in changes no product count")
        for (el, was) in zip(fixed, before) {
            XCTAssertEqual(el.frame, was, "\(el.identifier) moved on a Tally check-in")
        }
        XCTAssertEqual(count.frame.minY, countBefore.frame.minY, accuracy: 0.5, "masthead-count moved on a Tally check-in")
    }

    // MARK: step 5, the running-head slot

    /// The 46pt running head and its 1pt rule, held clear under the masthead (MastheadScreen).
    static let slot: CGFloat = 47

    /// Every package row that exists. Packages is a lazy list, so only the rows near the screen do.
    func packageRows(_ app: XCUIApplication) -> XCUIElementQuery {
        app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "package-row:"))
    }

    /// The topmost package row. The first is one of the rows near the screen.
    func topmostPackageRow(_ app: XCUIApplication) throws -> XCUIElement {
        let rows = packageRows(app)
        _ = try XCTUnwrap(rows.firstMatch.waitForExistence(timeout: 5) ? rows.firstMatch : nil, "Packages has no package row")
        return try XCTUnwrap(rows.allElementsBoundByIndex.min { $0.frame.minY < $1.frame.minY }, "Packages has no package row")
    }

    /// The top of the first element under the masthead on `tab`: its first row, its search box, its record button or its
    /// title. The sync advisory, when it shows, is read by its identifier instead. Ledger's title has no identifier, so it
    /// is found by its label, between the masthead and the tab bar. A `ledger-title` identifier would be a product change.
    func firstContentTop(_ app: XCUIApplication, tab: String, below head: CGRect) throws -> CGFloat {
        switch tab {
        case "Orphaned": return try live(app, "orphaned-record", tab: tab).frame.minY
        case "Tally":
            // `tally-search` reads the field's own frame. The field sits centred in a box of at least 44pt (TallyView's
            // `frame(minHeight: 44)`) and is shorter than it, so it starts a few points below the box. The box is what
            // the running head must clear, so read its top: the lesser of the field's top and 22pt above its middle.
            let field = try live(app, "tally-search", tab: tab).frame
            return min(field.minY, field.midY - Self.minHit / 2)
        case "Packages": return try topmostPackageRow(app).frame.minY
        default:
            let bar = app.tabBars.firstMatch.frame.minY
            let titles = app.staticTexts.matching(NSPredicate(format: "label ==[c] %@", tab)).allElementsBoundByIndex
                .filter { $0.frame.minY >= head.maxY && $0.frame.maxY <= bar }
            return try XCTUnwrap(titles.min { $0.frame.minY < $1.frame.minY }, "\(tab): no title under the masthead").frame.minY
        }
    }

    /// On every tab the first content sits one slot below the masthead's foot, so the running head can pin there
    /// without moving anything. The offset is read from the masthead's own frame, not from a figure copied here.
    func assertTheFirstContentSitsOneSlotBelowTheMasthead(width: Int) throws {
        let app = launch(width: width)
        for tab in Self.tabs {
            show(app, tab)
            let head = try live(app, "masthead", tab: tab).frame
            let first = try firstContentTop(app, tab: tab, below: head)
            XCTAssertEqual(first - head.maxY, Self.slot, accuracy: 0.5,
                           "\(tab) at \(width)pt: the first content is not one slot below the masthead")
        }
    }

    func testTheFirstContentSitsOneSlotBelowTheMastheadAt375() throws { try assertTheFirstContentSitsOneSlotBelowTheMasthead(width: 375) }

    func testTheFirstContentSitsOneSlotBelowTheMastheadAt320() throws { try assertTheFirstContentSitsOneSlotBelowTheMasthead(width: 320) }

    /// With the advisory on, it is the first content on the three tabs that show it (Ledger has none), at the same slot.
    func testTheAdvisorySitsOneSlotBelowTheMasthead() throws {
        let app = launch(width: 375, syncStatus: 401)
        for tab in ["Orphaned", "Tally", "Packages"] {
            show(app, tab)
            let head = try live(app, "masthead", tab: tab).frame
            let advisory = try live(app, "sync-advisory", tab: tab)
            XCTAssertEqual(advisory.frame.minY - head.maxY, Self.slot, accuracy: 0.5, "\(tab): the advisory is not one slot below the masthead")
        }
    }

    // MARK: step 5, the running head

    /// Waits until the element's frame stops changing, so a read never lands in the middle of a scroll.
    func settle(_ el: XCUIElement) {
        var last = el.frame
        for _ in 0..<25 {
            Thread.sleep(forTimeInterval: 0.2)
            let now = el.frame
            if now == last { return }
            last = now
        }
    }

    /// Drags the list up by `dy` points (down when negative) with no fling, so the offset follows the finger and the pin
    /// point can be crossed by a known amount. It repeats the press-and-drag of XCUIApplication.reveal, which drags by an
    /// element's gap and cannot drag a set distance. A drag down starts 40pt below the pinned head's foot, read from the
    /// head: the head takes a touch that began on it, and the list would not move. So a drag down needs the head pinned.
    func drag(_ app: XCUIApplication, up dy: CGFloat) {
        let bottom = app.tabBars.firstMatch.frame.minY
        let x = app.windows.firstMatch.frame.midX
        let from = dy > 0 ? bottom - 40 : find(app, "running-head").frame.maxY + 40
        let origin = app.coordinate(withNormalizedOffset: .zero)
        origin.withOffset(CGVector(dx: x, dy: from)).press(
            forDuration: 0.05, thenDragTo: origin.withOffset(CGVector(dx: x, dy: from - dy)), withVelocity: .slow, thenHoldForDuration: 0.3)
    }

    /// No tab mounts the running head until its masthead has scrolled away.
    func testTheRunningHeadIsNotMountedAtRestOnAnyTab() throws {
        let app = launch(width: 375)
        for tab in Self.tabs {
            show(app, tab)
            _ = try live(app, "masthead", tab: tab)
            XCTAssertFalse(find(app, "running-head").exists, "\(tab): the running head is in the accessibility tree at rest")
        }
    }

    /// Past the masthead the head pins at the top of the list, with the cards figure. Pinning and unpinning move no
    /// other frame: the first row keeps its one-slot gap under the masthead at rest, just short of the pin point,
    /// pinned, and back at the top. A scroll cannot change that gap, so only a layout change can. The first row stays
    /// loaded because the drags go only 60pt past the masthead.
    func testTheRunningHeadPinsAtTheTopAndMovesNothing() throws {
        let app = launch(width: 375)
        show(app, "Packages")
        let head = try live(app, "masthead", tab: "Packages")
        let cardsFigure = try XCTUnwrap(figure(try live(app, "tally-cards", tab: "Packages")), "the cards cell has no figure")
        let row = try topmostPackageRow(app)
        let (restTop, pinAt, pastPin) = (head.frame.minY, head.frame.height, CGFloat(60))
        let running = find(app, "running-head")
        func gap(_ when: String) {
            settle(head)
            XCTAssertEqual(row.frame.minY - head.frame.maxY, Self.slot, accuracy: 0.5, "the first row is not one slot below the masthead \(when)")
        }
        func unmounted(_ when: String) {
            let none = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: running)
            XCTAssertEqual(XCTWaiter.wait(for: [none], timeout: 5), .completed, "the running head is mounted \(when)")
        }
        gap("at rest")
        unmounted("at rest")

        drag(app, up: pinAt - 20)
        gap("just short of the pin point")
        unmounted("just short of the pin point")

        drag(app, up: pastPin)
        XCTAssertTrue(running.waitForExistence(timeout: 5), "the running head did not pin once the masthead scrolled away")
        gap("while the running head is pinned")
        // The head pins on the list's top edge. The status bar is not in the accessibility tree on this runtime, so
        // app.listTop reads the window's top, 0, and cannot name that edge. The masthead's foot crossed the edge during
        // the last drag, by less than that drag, so the head's top lies that far below the foot and no farther. A head
        // under the status bar sits above the foot, and a head hung below the edge sits farther than the drag.
        let below = running.frame.minY - head.frame.maxY
        XCTAssertGreaterThanOrEqual(below, -0.5, "the running head's top \(running.frame.minY) is above the masthead's foot \(head.frame.maxY), so it is not on the list's top edge")
        XCTAssertLessThanOrEqual(below, pastPin, "the running head's top \(running.frame.minY) is \(below)pt below the masthead's foot \(head.frame.maxY), more than the \(pastPin)pt drag past the pin point")
        XCTAssertLessThanOrEqual(running.frame.height, Self.slot + 0.5, "the running head is taller than its slot")
        XCTAssertTrue(running.label.contains(cardsFigure), "the running head `\(running.label)` does not hold the cards figure \(cardsFigure)")

        drag(app, up: -(pinAt + 80))
        unmounted("back at the top")
        gap("back at the top")
        XCTAssertEqual(head.frame.minY, restTop, accuracy: 0.5, "the masthead is not back where it started")
    }

    /// The screen with the head pinned, which the per-tab audits above never reach. The audit skips only text that
    /// the tab bar covers by more than half (auditSkippingTabBar), as the Packages audits do, so any other
    /// finding fails, wherever the cards sit.
    func testAccessibilityAuditWithTheRunningHeadPinned() throws {
        let app = launch(width: nil)
        show(app, "Packages")
        let head = try live(app, "masthead", tab: "Packages")
        drag(app, up: head.frame.height + 40)
        XCTAssertTrue(find(app, "running-head").waitForExistence(timeout: 5), "the running head did not pin, so the audit reads the unpinned screen")
        try app.auditSkippingTabBar()
    }

    // MARK: step 5, the masthead follows a write that is not a check-in

    /// A Reset empties the ledger, so the figures and the foot (count line, outstanding line, slot) leave every tab's
    /// masthead, and the masthead itself stays. The cards cell is read on the Ledger tab first, where the Reset is
    /// pressed, so its own copy is the one that must refresh. VersionsUITests reads the Packages copy.
    func testALedgerResetClearsTheMastheadOnEveryTab() throws {
        let app = launch(width: 375)
        show(app, "Ledger")
        _ = try live(app, "tally-cards", tab: "Ledger")
        let reset = try need(app, "reset")
        app.reveal(reset)
        reset.tap()
        wait(reset, "label BEGINSWITH %@", "Tap again", "the Reset never armed")
        reset.tap()
        wait(reset, "label == %@", "Reset", "the second tap did not perform the Reset")

        for tab in Self.tabs {
            show(app, tab)
            _ = try live(app, "masthead", tab: tab)
            let cards = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: find(app, "tally-cards"))
            XCTAssertEqual(XCTWaiter.wait(for: [cards], timeout: 5), .completed, "\(tab): the cards cell survived a Reset")
            XCTAssertFalse(find(app, "masthead-count").exists, "\(tab): the count line survived a Reset")
        }
    }

    // MARK: Backup

    /// Backup is a button on the Ledger tab with a hit region of at least 44pt.
    func testBackupIsA44ptControlOnTheLedgerTab() throws {
        let app = launch(width: nil)
        openTab(app, "Ledger")
        let backup = try need(app, "backup")
        app.reveal(backup)  // the masthead now sits above the Data group, so Backup may start below the fold

        XCTAssertEqual(backup.elementType, .button, "Backup is not a button")
        XCTAssertEqual(backup.label, "Backup")
        XCTAssertGreaterThanOrEqual(backup.frame.width, Self.minHit, "Backup is narrower than 44pt")
        XCTAssertGreaterThanOrEqual(backup.frame.height, Self.minHit, "Backup is shorter than 44pt")
        XCTAssertTrue(backup.isHittable, "Backup cannot be tapped")
    }

    // MARK: accessibility audit, one screen per method

    /// The Packages screen with the masthead on it. The masthead must exist first, so a screen
    /// that passes the audit without one is red. Rows under the tab bar are skipped, see
    /// AuditSkippingTabBarUITests.
    func testAccessibilityAuditMastheadOnPackages() throws {
        let app = launch(width: nil)
        openTab(app, "Packages")
        _ = try need(app, "masthead")
        _ = try need(app, "save-slot")
        try app.auditSkippingTabBar()
    }

    /// The other three tabs with the masthead on them, as the Packages audit above. The masthead must exist
    /// first, so a tab that passes the audit without one is red. Each masthead pushes its tab's content down,
    /// so the last rows sit under the glass bar, and auditSkippingTabBar skips only what the bar covers. The
    /// owner ruling of 2026-10-21 names the Packages tab; these three extend it, which needs the owner's word.
    func assertAuditMastheadSkippingTabBar(on tab: String) throws {
        let app = launch(width: nil)
        show(app, tab)
        _ = try live(app, "masthead", tab: tab)
        _ = try live(app, "save-slot", tab: tab)
        try app.auditSkippingTabBar()
    }

    func testAccessibilityAuditMastheadOnLedger() throws { try assertAuditMastheadSkippingTabBar(on: "Ledger") }

    func testAccessibilityAuditMastheadOnOrphaned() throws { try assertAuditMastheadSkippingTabBar(on: "Orphaned") }

    func testAccessibilityAuditMastheadOnTally() throws { try assertAuditMastheadSkippingTabBar(on: "Tally") }

    /// The Ledger screen with Backup on it. Backup must exist first, for the same reason.
    func testAccessibilityAuditBackupOnLedger() throws {
        let app = launch(width: nil)
        openTab(app, "Ledger")
        _ = try need(app, "backup")
        try app.performAccessibilityAudit()
    }
}

extension XCUIApplication {
    /// The one live copy of `id` on the open tab. A kept-alive tab can hold a second copy, so the match is
    /// the hittable one among those on screen, and exactly one must be left. A part that reports no
    /// hittable element (a container, or a read-out) falls back to the ones on screen.
    func live(_ id: String, tab: String) throws -> XCUIElement {
        let first = descendants(matching: .any).matching(identifier: id).firstMatch
        _ = try XCTUnwrap(first.waitForExistence(timeout: 5) ? first : nil, "\(id) is missing")
        var pick: [XCUIElement] = []
        let deadline = Date().addingTimeInterval(5)
        repeat {
            let window = windows.firstMatch.frame
            let shown = descendants(matching: .any).matching(identifier: id).allElementsBoundByIndex
                .filter { !$0.frame.isEmpty && $0.frame.intersects(window) }
            let hit = shown.filter(\.isHittable)
            pick = hit.isEmpty ? shown : hit
            if pick.count == 1 { break }
            Thread.sleep(forTimeInterval: 0.1)  // the tab that was left may still be leaving
        } while Date() < deadline
        XCTAssertEqual(pick.count, 1, "\(tab): \(pick.count) live \(id) elements, not 1")
        return try XCTUnwrap(pick.first, "\(tab): no live \(id)")
    }
}
