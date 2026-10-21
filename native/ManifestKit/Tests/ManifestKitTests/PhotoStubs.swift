// RED STUBS for lane N10 (native photos). Builder: this whole file is yours to delete.
//
// Every declaration below is the contract the Photo*Tests files name. Each one returns a wrong value
// on purpose and never throws, so each N10 test fails on an assertion and not on a compile error or a
// throw (native-build-lanes, testing-throwing-assert-bad-kill).
//
// To build the lane:
//   1. Move each declaration into native/ManifestKit/Sources/ManifestKit, make it `public`, and make it
//      real. Put the two LedgerStore methods in LedgerStore.swift itself (they need its private `doc`).
//   2. Delete THIS FILE. While it exists its types shadow the real ones in the test module, so the tests
//      keep testing the stubs and stay red. Left in place it can never turn a test falsely green.
//   3. The photo file names, the plan and the type-from-name rule come from the rules bundle
//      (photoName, photoIdFromName, mimeFromName, photoPlan). Do not copy them into Swift
//      (rules-run-in-javascriptcore).
//
// Nothing here is product code. It sits in the test target because the test-author edits tests only.

import Foundation
import Observation
@testable import ManifestKit

// MARK: downscale (PhotoDownscaleTests)

public struct PhotoBlob: Equatable, Sendable {
    public let data: Data
    public let mime: String
    public init(data: Data, mime: String) { self.data = data; self.mime = mime }
}

public enum PhotoDownscale {
    public static let maxEdge = 0
    public static let quality = 0.0
    public static func shrink(_ data: Data) -> PhotoBlob { PhotoBlob(data: Data(), mime: "") }
}

// MARK: store (PhotoStoreTests)

public final class PhotoStore: Sendable {
    public static func folder(besideLedger fileURL: URL) -> URL {
        fileURL.deletingLastPathComponent().appending(path: "photos-stub-wrong")
    }
    public init(folder: URL, engine: RulesEngine) {}
    public func put(id: String, blob: PhotoBlob) async throws {}
    public func get(id: String) async throws -> PhotoBlob? { PhotoBlob(data: Data([0]), mime: "x/wrong") }
    public func heldIds() async -> Set<String>? { ["pho-stub-wrong"] }
    public func remove(id: String) async throws {}
}

// MARK: ids (PhotoIdsTests)

public enum PhotoApply: Equatable, Sendable { case restore, sync }

public enum PhotoIds {
    public static func kept(_ ids: [String], held: Set<String>?, on kind: PhotoApply) -> [String] {
        ["pho-stub-wrong"]
    }
}

// MARK: capture and the ledger (PhotoCaptureTests)

@MainActor
public final class PhotoCapture {
    public init(store: PhotoStore, ledger: LedgerStore) {}
    public static func newID() -> String { "stub" }
    public func add(_ data: Data, toEnvelope envelopeID: String) async throws -> String { "pho-stub-wrong" }
}

public extension LedgerStore {
    func photoIDs() -> [String] { ["pho-stub-wrong"] }
    func commitPhoto(_ id: String, toEnvelope envelopeID: String) throws {}
}

// MARK: sync (PhotoSyncTests)

public enum PhotoTransportError: Error, Equatable, Sendable { case tooLarge }

public protocol PhotoTransport: Sendable {
    func list() async throws -> [String]?
    func put(name: String, data: Data) async throws
    func get(name: String) async throws -> Data?
}

public struct PhotoSyncReport: Equatable, Sendable {
    public var known = true, unreadable = true, stopped = true, failed = true
    public var pushed = ["pho-stub-wrong"], pulled = ["pho-stub-wrong"]
    public var lost = ["pho-stub-wrong"], tooBig = ["pho-stub-wrong"]
    public var left = -1
}

@MainActor @Observable
public final class PhotoSync {
    public struct Progress: Equatable, Sendable {
        public let done: Int, total: Int
        public init(done: Int, total: Int) { self.done = done; self.total = total }
    }
    public static let batchSize = 0
    public private(set) var running = false
    public private(set) var progress: Progress?
    public init(store: PhotoStore, transport: PhotoTransport, engine: RulesEngine) {}
    public func push(referenced: [String]) async -> PhotoSyncReport { PhotoSyncReport() }
    public func pull(referenced: [String]) async -> PhotoSyncReport { PhotoSyncReport() }
    public func stop() {}
}

// MARK: viewer (PhotoViewerModelTests)

public enum PhotoFocus: Equatable, Sendable { case none, viewer, thumbnail(String) }
public enum PhotoKey: Equatable, Sendable { case escape, tab, other }

@MainActor @Observable
public final class PhotoViewerModel {
    public private(set) var shown: String? = "pho-stub-wrong"
    public private(set) var focus: PhotoFocus = .viewer
    public var isModal: Bool { shown != nil }
    public init() {}
    public func open(_ id: String, hasImage: Bool) {}
    public func dismiss() {}
    public func handle(_ key: PhotoKey) {}
}
