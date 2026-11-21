/// The one plain line shown after a load dropped damaged entries.
public enum LedgerNotice {
    public static func damagedLine(dropped: Int) -> String? {
        dropped > 0
            ? "\(dropped) \(dropped == 1 ? "entry" : "entries") could not be read; the original is kept on this device."
            : nil
    }
}

/// The line of the Undo notice that takes a card's place when a Mark all drops it from the list (the step 7 mockup, `vacated`).
public enum BulkNotice {
    public static func line(count: Int, seller: String) -> String {
        "Marked \(count) card\(count == 1 ? "" : "s") received \u{00B7} \(seller)"
    }
}
