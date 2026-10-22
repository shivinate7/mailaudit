import Foundation

/// Which kind of apply a photo id list passes through (photo-ids-restore-keep-if-known).
public enum PhotoApply: Equatable, Sendable { case restore, sync }

public enum PhotoIds {
    /// A restore drops an id this device does not hold. A merge and a server apply keep every id.
    /// `held` is PhotoStore.heldIds(): nil is an unreadable store, and it keeps every id too
    /// (photo-ids-unreadable-local). The callers are lanes N9 (a restore) and N4a (a server apply).
    public static func kept(_ ids: [String], held: Set<String>?, on kind: PhotoApply) -> [String] {
        guard kind == .restore, let held else { return ids }
        return ids.filter(held.contains)
    }
}

/// Photo blobs, one file each, in the `photos` folder beside ledger.json (native-files-are-frozen).
/// Blobs never enter the ledger (photos-stay-out-of-the-ledger). File names come from photoName in
/// the rules bundle, which are the Worker route's names, and Swift holds no copy of the naming rule
/// (rules-run-in-javascriptcore).
public final class PhotoStore: Sendable {
    private let folder: URL
    private let engine: RulesEngine

    public static func folder(besideLedger fileURL: URL) -> URL {
        fileURL.deletingLastPathComponent().appending(path: "photos", directoryHint: .isDirectory)
    }

    public init(folder: URL, engine: RulesEngine) {
        self.folder = folder
        self.engine = engine
    }

    /// Creates the folder on first use.
    public func put(id: String, blob: PhotoBlob) async throws {
        let name: String = try await rule("photoName", [id, blob.mime]) ?? ""
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        try blob.data.write(to: folder.appending(path: name), options: .atomic)
    }

    /// Nil: this device does not hold it.
    public func get(id: String) async throws -> PhotoBlob? {
        guard let name = try await fileName(of: id) else { return nil }
        let data = try Data(contentsOf: folder.appending(path: name))
        let mime: String = try await rule("mimeFromName", [name]) ?? "application/octet-stream"
        return PhotoBlob(data: data, mime: mime)
    }

    /// Three-valued, as the web's photos.keys() is. A folder not made yet holds nothing. A folder that
    /// cannot be read is nil, and nil is not empty (photo-ids-unreadable-local).
    public func heldIds() async -> Set<String>? {
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: folder.path, isDirectory: &isDir) else { return [] }
        guard isDir.boolValue, let names = try? FileManager.default.contentsOfDirectory(atPath: folder.path) else {
            return nil
        }
        var ids = Set<String>()
        for name in names {
            if let id: String = try? await rule("photoIdFromName", [name]) { ids.insert(id) }
        }
        return ids
    }

    /// An id not held is no error: a sweep may race a sync.
    public func remove(id: String) async throws {
        while let name = try await fileName(of: id) {
            try FileManager.default.removeItem(at: folder.appending(path: name))
        }
    }

    /// The stored file for an id. The prefix test is a cheap filter, and photoIdFromName decides.
    private func fileName(of id: String) async throws -> String? {
        guard let names = try? FileManager.default.contentsOfDirectory(atPath: folder.path) else { return nil }
        for name in names.sorted() where name.hasPrefix(id + ".") {
            if try await rule("photoIdFromName", [name]) as String? == id { return name }
        }
        return nil
    }

    private func rule<T>(_ fn: String, _ args: [String]) async throws -> T? {
        let json = String(decoding: try JSONSerialization.data(withJSONObject: args), as: UTF8.self)
        let out = try await engine.call(fn, json)
        return try JSONSerialization.jsonObject(with: Data(out.utf8), options: .fragmentsAllowed) as? T
    }
}
