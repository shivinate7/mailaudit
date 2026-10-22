// Photo store tests (lane N10, native-files-are-frozen, photo-ids-unreadable-local).
//
// The photos live in the folder `photos`, beside ledger.json in Application Support. Each blob is one
// file, named by photoName in the rules bundle (photo-rules.mjs). The Swift store holds no copy of the
// naming rule (rules-run-in-javascriptcore). The names are the Worker route's names too, so a stored
// file round-trips through photoIdFromName.
//
// `heldIds` is three-valued, as the web's photos.keys() is: a folder that does not exist yet holds
// nothing (an empty set), and a folder that cannot be read is unknown (nil). Unreadable is not empty
// (photo-ids-unreadable-local): a caller that read nil as empty would treat every photo as missing.
//
// Contract the tests name:
//   public final class PhotoStore: Sendable {
//       public static func folder(besideLedger fileURL: URL) -> URL   // <ledger folder>/photos
//       public init(folder: URL, engine: RulesEngine)
//       public func put(id: String, blob: PhotoBlob) async throws    // creates the folder on first use
//       public func get(id: String) async throws -> PhotoBlob?       // nil: this device does not hold it
//       public func heldIds() async -> Set<String>?                  // nil: the folder cannot be read
//       public func remove(id: String) async throws                  // removing an id not held is no error
//   }
//
// Red-first: see PhotoStubs.swift.

import Foundation
import XCTest
@testable import ManifestKit

final class PhotoStoreTests: XCTestCase {
    typealias Kit = PhotoTestKit

    var dir: URL!
    var folder: URL { dir.appending(path: "photos", directoryHint: .isDirectory) }

    override func setUpWithError() throws { dir = try Kit.tempDir("n10-store") }
    override func tearDownWithError() throws { try? FileManager.default.removeItem(at: dir) }

    func makeStore() throws -> PhotoStore { PhotoStore(folder: folder, engine: try Kit.engine()) }

    /// What the folder holds on disk, sorted. Empty when there is no folder.
    func filesOnDisk() -> [String] {
        ((try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []).sorted()
    }

    let jpeg = PhotoBlob(data: Data([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3]), mime: "image/jpeg")
    let png = PhotoBlob(data: Data([0x89, 0x50, 0x4E, 0x47, 9, 8, 7]), mime: "image/png")

    /// native-files-are-frozen: the folder is `photos`, beside ledger.json. A rename orphans every photo.
    func testTheFolderIsPhotosBesideTheLedger() {
        let support = URL(filePath: "/tmp/Application Support/dev.shivinate.manifest", directoryHint: .isDirectory)
        let ledger = support.appending(path: "ledger.json")

        XCTAssertEqual(PhotoStore.folder(besideLedger: ledger).path, support.appending(path: "photos").path)
    }

    func testAPutBlobReadsBackWithItsTypeAndBytes() async throws {
        let store = try makeStore()

        try await store.put(id: "pho-aaa-1", blob: jpeg)
        try await store.put(id: "pho-bbb-2", blob: png)

        let a = try await store.get(id: "pho-aaa-1")
        let b = try await store.get(id: "pho-bbb-2")
        XCTAssertEqual(a, jpeg)
        XCTAssertEqual(b, png, "the type survives in the file name, because the bytes do not say it")
    }

    /// The file is named as the rules bundle names it, so the Worker route reads the same name back
    /// to the same id.
    func testTheFileNameIsPhotoNameFromTheRulesAndRoundTripsToTheId() async throws {
        let engine = try Kit.engine()
        let store = PhotoStore(folder: folder, engine: engine)
        try await store.put(id: "pho-aaa-1", blob: jpeg)
        try await store.put(id: "pho-bbb-2", blob: png)

        let onDisk = filesOnDisk()

        let expected = [
            try await Kit.fileName("pho-aaa-1", mime: "image/jpeg", engine: engine),
            try await Kit.fileName("pho-bbb-2", mime: "image/png", engine: engine),
        ].sorted()
        XCTAssertEqual(onDisk, expected, "the folder should hold exactly the two named files")
        for (name, id) in zip(expected, ["pho-aaa-1", "pho-bbb-2"].sorted()) {
            let back = try await Kit.idFromName(name, engine: engine)
            XCTAssertEqual(back, id, "\(name) should read back to its id")
        }
    }

    func testHeldIdsListsEveryBlobAndIgnoresStrayFiles() async throws {
        let store = try makeStore()
        try await store.put(id: "pho-aaa-1", blob: jpeg)
        try await store.put(id: "pho-bbb-2", blob: png)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        try Data("hello".utf8).write(to: folder.appending(path: "README.txt"))
        try Data("x".utf8).write(to: folder.appending(path: "notes.jpg"))

        let held = await store.heldIds()

        XCTAssertEqual(held, ["pho-aaa-1", "pho-bbb-2"], "a stray file is not a photo")
    }

    /// Before the first photo the folder does not exist. That is a store that holds nothing.
    func testAFolderNotCreatedYetHoldsNothing() async throws {
        let store = try makeStore()

        let held = await store.heldIds()

        XCTAssertEqual(held, [], "no folder is an empty store, not an unknown one")
    }

    /// A folder path that is a regular file cannot be listed. That is unknown, and not empty.
    func testAnUnreadableFolderIsUnknownAndNotEmpty() async throws {
        try Data("not a folder".utf8).write(to: folder)
        let store = try makeStore()

        let held = await store.heldIds()

        XCTAssertNil(held, "an unreadable store must say nil, so no caller reads it as empty")
    }

    func testAnIdThisDeviceDoesNotHoldReadsAsNil() async throws {
        let store = try makeStore()
        try await store.put(id: "pho-aaa-1", blob: jpeg)

        let missing = try await store.get(id: "pho-zzz-9")

        XCTAssertNil(missing)
    }

    /// Remove deletes the file. An id that is not held is not an error: a sweep may race a sync.
    func testRemoveDeletesTheFileAndForgivesAnIdNotHeld() async throws {
        let store = try makeStore()
        try await store.put(id: "pho-aaa-1", blob: jpeg)
        try await store.put(id: "pho-bbb-2", blob: png)

        try await store.remove(id: "pho-aaa-1")
        try await store.remove(id: "pho-never-3")

        let held = await store.heldIds()
        XCTAssertEqual(held, ["pho-bbb-2"])
        let gone = try await store.get(id: "pho-aaa-1")
        XCTAssertNil(gone)
        XCTAssertEqual(filesOnDisk().count, 1, "removing one of two photos should leave one file")
    }
}
