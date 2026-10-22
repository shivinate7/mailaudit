/// The 401 and 413 advisory lines. They speak of the Worker only (ruled-head-one-advisory-entrance).
/// The wording is not ruled yet (native-reply-waits-generation, Still open).
public enum SyncLine {
    /// nil for no failure. `advisory` is SyncClient's syncStatus code.
    public static func text(for advisory: String?) -> String? {
        switch advisory {
        case "no-access": "The sync server refused this device. Open a new sync link to fix it."
        case "too-big": "The ledger is too big for the sync server."
        default: nil
        }
    }
}
