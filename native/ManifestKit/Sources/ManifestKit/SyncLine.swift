/// The 401 and 413 advisory lines. They speak of the Worker only (ruled-head-one-advisory-entrance).
/// The wording is the web's (src/app.jsx syncSays), with its " — tap to fix": the line opens the Ledger tab's Sync panel.
public enum SyncLine {
    /// nil for no failure. `advisory` is SyncClient's syncStatus code.
    public static func text(for advisory: String?) -> String? {
        switch advisory {
        case "no-access": "This device’s sync key was refused \u{2014} tap to fix"
        case "too-big": "The ledger is too big for the sync server \u{2014} tap to fix"
        default: nil
        }
    }
}
