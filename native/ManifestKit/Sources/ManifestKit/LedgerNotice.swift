/// The one plain line shown after a load dropped damaged entries.
public enum LedgerNotice {
    public static func damagedLine(dropped: Int) -> String? {
        dropped > 0
            ? "\(dropped) \(dropped == 1 ? "entry" : "entries") could not be read; the original is kept on this device."
            : nil
    }
}
