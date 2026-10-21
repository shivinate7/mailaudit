import Foundation

/// One JSON file for the system share sheet (backup-files-restore-two-ways).
public struct BackupFile: Equatable, Sendable {
    public let name: String
    public let data: Data
    public init(name: String, data: Data) {
        self.name = name
        self.data = data
    }
}

extension LedgerStore {
    /// The raw document as save() writes it (sorted keys). It holds no key, since the
    /// store never sees one (the-token-is-a-credential).
    func snapshot() throws -> Data {
        guard loaded else { throw CocoaError(.fileReadCorruptFile) }
        return try JSONSerialization.data(withJSONObject: doc, options: [.sortedKeys])
    }

    /// A loaded store backs up its memory. A store that is not loaded (never loaded, or
    /// the last load threw) backs up the file as it is, so Backup has no data gate
    /// (recovery-control-not-state-gated). It writes nothing and moves no generation.
    public func backup() throws -> BackupFile {
        let data = loaded ? try snapshot() : try Data(contentsOf: fileURL)
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]  // UTC by default, as the web's toISOString
        return BackupFile(name: "mailday-backup-\(f.string(from: Date(timeIntervalSince1970: now() / 1000))).json", data: data)
    }
}
