// The masthead follows an Orphaned write (step 5, masthead-is-one-letterhead). It extends OrphanedUITests, so the
// shared steps (launch, openOrphaned, recordSaga, tab, badge) keep their one home, and it reads the masthead through
// XCUIApplication.live (MastheadBackupUITests.swift). It sits in its own file because OrphanedUITests.swift is edited on
// the polish branch, and an edit here would conflict with it.
//
// Contract: a recorded envelope raises the Orphaned count line by one, and the Orphaned tab's badge reads the same count.
// The words of the line are pinned in Node (V21) and in MastheadModelTests, so only its leading digit is read here.
// The seed has no envelopes. Every key here is fake. The tests read no Keychain item.

import XCTest

extension OrphanedUITests {
    func testTheMastheadAndTheBadgeFollowARecordedEnvelope() throws {
        let app = launch()
        openOrphaned(app)
        let count = try app.live("masthead-count", tab: "Orphaned")
        XCTAssertTrue(count.label.hasPrefix("0 "), "anchor: the seeded pile is empty, and the count line reads `\(count.label)`")

        recordSaga(app)

        let one = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label BEGINSWITH %@", "1 "), object: count)
        XCTAssertEqual(XCTWaiter.wait(for: [one], timeout: 5), .completed, "after one envelope the count line reads `\(count.label)`")
        tab(app, "Tally").tap()  // the badge is read from another tab, so a selected-state value cannot stand in for it
        let orphaned = tab(app, "Orphaned")
        for _ in 0..<25 where !badge(orphaned).contains("1") { Thread.sleep(forTimeInterval: 0.2) }
        XCTAssertTrue(badge(orphaned).contains("1"), "the count line reads one envelope, and the Orphaned tab's value is '\(badge(orphaned))'")
    }
}
