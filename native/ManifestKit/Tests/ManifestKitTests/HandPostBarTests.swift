// The words the Post bar speaks (decision duo-card-in-hand). They live in HandPostBar so these tests can read them:
// XCUITest reads no hint, so the Post button's hint is pinned here. The wording is as built. Item 80 (held-card words, `hand-held-words`) is ruled in part: "one word only", 2026-11-19 19:28 CST.
// Which word stays waits on item 113 (`held-word-which-stays`); how far the change reaches waits on item 97 (`held-words-one-word-scope`). The held-card words hold until both are answered.

import XCTest
@testable import ManifestKit

final class HandPostBarTests: XCTestCase {
    /// The Post button's hint: the held sentence first, then the promise, one space between.
    func testHintSpeaksTheHeldSentenceThenThePromise() {
        XCTAssertEqual(HandPostBar.hint, "Your held card came with this envelope. Nothing is checked in until you post.", "the Post button's hint is not the held sentence followed by the promise")
    }

    /// The head's VoiceOver label from AX3 up, where the screen draws the seller alone: the sender line, the seller and the order date.
    func testHeadLabelNamesTheSellerAndTheOrderDate() {
        XCTAssertEqual(HandPostBar.headLabel(seller: "Gamma Cards", date: "Nov 3"), "It came from Gamma Cards, ordered Nov 3.", "the head's VoiceOver label does not carry the sender line, the seller and the order date")
    }

    /// The slim head's spoken value on hand-who, read after the seller in its label: the sender and the order date.
    func testHeadValueNamesTheSenderAndTheOrderDate() {
        XCTAssertEqual(HandPostBar.headValue(date: "Nov 3"), "the sender, ordered Nov 3", "the slim head's value does not name the sender and the order date")
    }

    /// The receipt's VoiceOver label keeps "Posted." or "Not posted." first, then the line the receipt shows.
    func testReceiptLabelReadsPostedThenTheCount() {
        XCTAssertEqual(HandPostBar.receiptLabel(refused: false, line: "12 cards checked in · 2 were held"), "Posted. 12 cards checked in · 2 were held", "the saved receipt's label does not read \"Posted.\" then the count")
        XCTAssertEqual(HandPostBar.receiptLabel(refused: true, line: "Type the card again to post."), "Not posted. Type the card again to post.", "the refused receipt's label does not read \"Not posted.\" then the refusal")
    }
}
