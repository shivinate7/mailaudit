/// The words the Post bar speaks (duo-card-in-hand, Post offer). They live here so a swift test can read them: XCUITest reads no hint.
public enum HandPostBar {
    /// Not drawn on the screen. The label's "N held" and the left page's chip say on screen why Post is there.
    public static let heldSentence = "Your held card came with this envelope."
    public static let nothingChecked = "Nothing is checked in until you post."
    /// The Post button's VoiceOver hint: the held sentence first, then the promise.
    public static let hint = heldSentence + " " + nothingChecked

    /// The head's VoiceOver label from AX3 up, where the screen draws the seller alone.
    public static func headLabel(seller: String, date: String) -> String {
        "It came from \(seller), ordered \(date)."
    }

    /// The slim head's spoken value on hand-who, after the seller its label: "seller, the sender, ordered D".
    public static func headValue(date: String) -> String {
        "the sender, ordered \(date)"
    }

    /// The receipt's VoiceOver label: the visible long count may drop "Posted." at large sizes, but the label keeps both.
    public static func receiptLabel(refused: Bool, line: String) -> String {
        "\(refused ? "Not posted." : "Posted.") \(line)"
    }
}
