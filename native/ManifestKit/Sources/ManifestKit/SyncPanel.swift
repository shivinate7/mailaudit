import Foundation

/// Where the Worker stands, as the Sync panel's Server line and the Sync row read it.
public enum SyncServerState: Equatable, Sendable {
    case noKey, notChecked, refused, badShape, tooBig, unreachable, connected

    /// The web's serverStatus wording.
    public var text: String {
        switch self {
        case .noKey: "No sync key on this device"
        case .notChecked: "Not checked"
        case .refused: "Sync key refused"
        case .badShape: "Ledger shape refused"
        case .tooBig: "Ledger too big for the server"
        case .unreachable: "Could not be reached"
        case .connected: "Connected"
        }
    }
}

/// The text of the Ledger tab's Sync row and panel (src/app.jsx syncSays, the Sync LedgerRow, lastSyncText).
public enum SyncPanel {
    /// What the Sync row says: its sub line and its value, and whether the sync needs a fix (the value is then manilaInk).
    /// The web's syncBroken has two more causes the native client does not have yet (a stale clock, unreadable photos).
    /// A missing key does not count as a fix while the panel is open, so "Set up" turns accent then.
    public static func row(_ state: SyncServerState, open: Bool, lastSyncAt: Double?) -> (sub: String, value: String, needsFix: Bool) {
        switch state {
        case .noKey:
            return open ? healthy(open: true, lastSyncAt, value: "Set up") : ("This device has no sync key", "Set up", true)
        case .refused: return ("This device\u{2019}s sync key was refused", "Check", true)
        case .tooBig: return ("The ledger is too big for the sync server", "Check", true)
        case .badShape: return ("The sync server refused this ledger\u{2019}s shape, so it is not backed up.", "Check", true)
        case .unreachable: return ("The sync server could not be reached", "Check", true)
        case .connected, .notChecked: return healthy(open: open, lastSyncAt, value: "On")
        }
    }

    private static func healthy(open: Bool, _ at: Double?, value: String) -> (sub: String, value: String, needsFix: Bool) {
        let says = at.map { "Backed up \(isoDay($0))" } ?? "Not synced yet"
        return (says + (open ? " \u{2014} tap to close" : ""), value, false)
    }

    private static func isoDay(_ at: Double) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        return f.string(from: Date(timeIntervalSince1970: at / 1000))
    }

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
