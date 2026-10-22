/// The 401 and 413 advisory lines. They speak of the Worker only (ruled-head-one-advisory-entrance).
/// The wording is the web's (src/app.jsx), minus " — tap to fix": the native line has no tap target
/// until the Ledger tab's Sync row is built (debt native-ledger-tab-unbuilt).
public enum SyncLine {
    /// nil for no failure. `advisory` is SyncClient's syncStatus code.
    public static func text(for advisory: String?) -> String? {
        switch advisory {
        case "no-access": "This device’s sync key was refused"
        case "too-big": "The ledger is too big for the sync server"
        default: nil
        }
    }
}
