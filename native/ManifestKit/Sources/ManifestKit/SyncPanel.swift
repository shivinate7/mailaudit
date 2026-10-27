import Foundation

/// The text of the Ledger tab's Sync panel (src/app.jsx lastSyncText).
public enum SyncPanel {
    /// "Not yet" for nil, else short month, day, hour and minute: "Aug 12, 2:03 PM". The pattern is explicit,
    /// because the system date styles write "Aug 12 at 2:03 PM" on this OS and the web writes the comma.
    /// ponytail: the pattern is the English one, so another locale gets English field order. Add a template per locale if one ships.
    public static func lastSyncText(_ at: Double?, locale: Locale, timeZone: TimeZone) -> String {
        guard let at else { return "Not yet" }
        let f = DateFormatter()
        f.locale = locale
        f.timeZone = timeZone
        f.dateFormat = "MMM d, h:mm a"
        return f.string(from: Date(timeIntervalSince1970: at / 1000))
    }
}
