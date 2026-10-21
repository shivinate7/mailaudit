import Foundation

/// Shrinks a picture, stores the blob, then puts only its id on a live envelope.
@MainActor
public final class PhotoCapture {
    private let store: PhotoStore
    private let ledger: LedgerStore
    private static var seq = 0

    public init(store: PhotoStore, ledger: LedgerStore) {
        self.store = store
        self.ledger = ledger
    }

    /// pho-<time>-<seq><random>: a name the Worker route accepts, as newPhotoId in src/app.jsx makes it.
    public static func newID() -> String {
        seq += 1
        let rand = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased().prefix(8))
        return "pho-\(String(Int(Date().timeIntervalSince1970 * 1000), radix: 36))-\(String(seq, radix: 36))\(rand)"
    }

    /// The envelope is checked before the blob is written, so a refusal leaves no blob behind. A blob
    /// whose id cannot be saved stays for the orphan sweep (orphan-sweep-drops-unused-photos).
    public func add(_ data: Data, toEnvelope envelopeID: String) async throws -> String {
        guard ledger.hasLiveEnvelope(envelopeID) else { throw LedgerEditError.noLiveEnvelope(envelopeID) }
        let blob = await Task.detached { PhotoDownscale.shrink(data) }.value
        let id = Self.newID()
        try await store.put(id: id, blob: blob)
        try ledger.commitPhoto(id, toEnvelope: envelopeID)
        return id
    }
}
