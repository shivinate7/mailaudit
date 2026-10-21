// Orphaned notice tests (lane N7, native-build-lanes, orphaned-mail-never-decides).
//
// The words on the Orphaned screen are pure functions in ManifestKit, like LedgerNotice, so a
// test can pin them. They match the web copy in src/app.jsx. The contract is in
// OrphanedTestSupport.swift.
//
// Fake fixtures only. These tests read no Keychain item.

import XCTest
@testable import ManifestKit

final class OrphanedNoticeTests: XCTestCase {
    /// The empty state is one sentence. The apostrophe is the curly one, as on the web.
    func testTheEmptyLineIsOneSentence() {
        XCTAssertEqual(
            OrphanedNotice.emptyLine, "Nothing waiting: record a package here when you can\u{2019}t tell who sent it.",
            "the empty state keeps the web wording")
        XCTAssertEqual(OrphanedNotice.emptyLine.filter { ".!?".contains($0) }.count, 1, "exactly one sentence end")
        XCTAssertTrue(OrphanedNotice.emptyLine.hasSuffix("."), "and it ends the line")
    }

    /// The tie line names the count and tells the owner to pick. It needs two or more.
    func testTheTieLineNamesTheCountAndLeavesThePickToTheOwner() {
        XCTAssertNil(OrphanedNotice.tieLine(tied: 0), "no candidates, no line")
        XCTAssertNil(OrphanedNotice.tieLine(tied: 1), "one fit is not a tie")
        XCTAssertEqual(
            OrphanedNotice.tieLine(tied: 2), "2 packages fit these cards equally well \u{2014} pick the right one yourself.")
        XCTAssertEqual(
            OrphanedNotice.tieLine(tied: 3), "3 packages fit these cards equally well \u{2014} pick the right one yourself.")
    }

    /// The undo line says what was checked in against whom, and what stays in the envelope.
    func testTheUndoLineCountsCardsAndWhatStays() {
        XCTAssertEqual(
            OrphanedNotice.undoLine(matchedQty: 1, pkgLabel: "Alpha Cards", leftoverQty: 0), "Checked in 1 card against Alpha Cards.")
        XCTAssertEqual(
            OrphanedNotice.undoLine(matchedQty: 2, pkgLabel: "Gamma Cards", leftoverQty: 1),
            "Checked in 2 cards against Gamma Cards. 1 card still in the envelope.")
        XCTAssertEqual(
            OrphanedNotice.undoLine(matchedQty: 3, pkgLabel: "Beta Games", leftoverQty: 2),
            "Checked in 3 cards against Beta Games. 2 cards still in the envelope.")
    }
}
