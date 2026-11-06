// Restore tests for the photo id rule (photo-ids-restore-keep-if-known, photo-ids-unreadable-local, and
// the native-photo-ids-kept-uncalled debt). The rule itself is PhotoIdsTests.swift. These tests pin the
// call: a restore passes the version's ids through PhotoIds.kept with .restore, so a device that does not
// hold a photo drops its id.
//
// Two paths are driven: the user path (VersionsModel, whose second press calls store.restore) and
// LedgerStore.restore directly. The store finds the photo folder beside its own ledger file, so the call
// shape stays restore(id). Photo ids are "pho-" names, because photoIdFromName reads only those.
//
// Contract the tests name (existing API, no new parameter):
//   LedgerStore.restore(_ id: String) throws
//   VersionsModel.pressRestore(_ id: String)                 // a first press arms, a second press performs
//   PhotoStore.folder(besideLedger:), PhotoStore.put(id:blob:), PhotoStore.heldIds() async -> Set<String>?
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PhotoIdsRestoreTests: XCTestCase {
    typealias Box = VersionSandbox
    typealias Kit = PhotoTestKit

    static let envelopeID = "e1"
    static let photoA = "pho-a"
    static let photoB = "pho-b"
    static let blob = PhotoBlob(data: Data([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3]), mime: "image/jpeg")

    /// The version holds envelope e1 with pho-a and pho-b. The device's ledger holds no envelope. The photo
    /// folder beside the ledger holds a blob for each id in `held`, and none when `held` is empty.
    struct Scene {
        let box: VersionSandbox
        let store: LedgerStore
        let versions: VersionStore
        let version: VersionRecord
        let photos: PhotoStore
    }

    func makeScene(held: [String]) async throws -> Scene {
        let box = try makeVersionSandbox()
        let (store, vs) = try box.open(try Box.ledger())
        var envelope = Box.env(Self.envelopeID, [("Counterspell", 1)])
        envelope["photos"] = [Self.photoA, Self.photoB]
        let version = try vs.put(try Box.bytes(try Box.ledger(envelopes: [envelope])),
                                 label: "before import", lines: Box.lines, checked: 0)
        let photos = PhotoStore(folder: PhotoStore.folder(besideLedger: box.ledgerURL), engine: try Kit.engine())
        for id in held { try await photos.put(id: id, blob: Self.blob) }
        return Scene(box: box, store: store, versions: vs, version: version, photos: photos)
    }

    /// The photo ids on envelope e1 of a ledger document. Nil when the document has no such envelope.
    func envelopePhotos(_ doc: [String: Any]) -> [String]? {
        PhotoTestKit.envelope(Self.envelopeID, in: doc)?["photos"] as? [String]
    }

    // MARK: a device that holds some of the photos

    /// The user path. A Restore press arms the row and the second press performs it, through store.restore.
    /// The device holds pho-a only, so the restore drops pho-b.
    func testARestoreFromTheVersionsListDropsAPhotoIdThisDeviceDoesNotHold() async throws {
        let s = try await makeScene(held: [Self.photoA])
        let held = await s.photos.heldIds()
        XCTAssertEqual(held, Set([Self.photoA]), "anchor: the photo store holds pho-a only")
        let model = VersionsModel(store: s.store, versions: s.versions)
        model.refresh()
        XCTAssertTrue(model.rows.contains { $0.id == s.version.id }, "anchor: the version is listed")

        model.pressRestore(s.version.id)
        model.pressRestore(s.version.id)

        XCTAssertNil(model.error, "anchor: the restore was performed without an error")
        XCTAssertEqual(envelopePhotos(s.store.snapshot()), [Self.photoA],
                       "a restore keeps only the photo ids this device holds, in memory")
        XCTAssertEqual(envelopePhotos(try s.box.saved()), [Self.photoA],
                       "a restore keeps only the photo ids this device holds, in the saved file")
    }

    /// The store path, with no model in between.
    func testARestoreThroughTheStoreDropsAPhotoIdThisDeviceDoesNotHold() async throws {
        let s = try await makeScene(held: [Self.photoA])
        let held = await s.photos.heldIds()
        XCTAssertEqual(held, Set([Self.photoA]), "anchor: the photo store holds pho-a only")

        try s.store.restore(s.version.id)

        XCTAssertEqual(envelopePhotos(s.store.snapshot()), [Self.photoA],
                       "a restore keeps only the photo ids this device holds, in memory")
        XCTAssertEqual(envelopePhotos(try s.box.saved()), [Self.photoA],
                       "a restore keeps only the photo ids this device holds, in the saved file")
    }

    // MARK: the two ends of the store

    /// A folder not made yet holds nothing, so a restore drops every photo id.
    func testARestoreOnADeviceWithNoPhotosDropsEveryPhotoId() async throws {
        let s = try await makeScene(held: [])
        let held = await s.photos.heldIds()
        XCTAssertEqual(held, Set<String>(), "anchor: the photo store holds nothing")

        try s.store.restore(s.version.id)

        XCTAssertEqual(envelopePhotos(s.store.snapshot()), [],
                       "a restore on a device with no photos drops every photo id, in memory")
        XCTAssertEqual(envelopePhotos(try s.box.saved()), [],
                       "a restore on a device with no photos drops every photo id, in the saved file")
    }

    /// A device that holds every photo keeps every id, in the version's order.
    func testARestoreOnADeviceThatHoldsEveryPhotoKeepsEveryId() async throws {
        let s = try await makeScene(held: [Self.photoA, Self.photoB])
        let held = await s.photos.heldIds()
        XCTAssertEqual(held, Set([Self.photoA, Self.photoB]), "anchor: the photo store holds both photos")

        try s.store.restore(s.version.id)

        XCTAssertEqual(envelopePhotos(s.store.snapshot()), [Self.photoA, Self.photoB],
                       "a restore keeps every photo id this device holds, in memory")
        XCTAssertEqual(envelopePhotos(try s.box.saved()), [Self.photoA, Self.photoB],
                       "a restore keeps every photo id this device holds, in the saved file")
    }

    /// Unreadable is not empty (photo-ids-unreadable-local): a photo store that cannot be read keeps every id.
    func testARestoreWithAnUnreadablePhotoStoreKeepsEveryPhotoId() async throws {
        let s = try await makeScene(held: [Self.photoA])
        try s.box.replaceWithFile(PhotoStore.folder(besideLedger: s.box.ledgerURL))
        let held = await s.photos.heldIds()
        XCTAssertNil(held, "anchor: the photo store cannot be read")

        try s.store.restore(s.version.id)

        XCTAssertEqual(envelopePhotos(s.store.snapshot()), [Self.photoA, Self.photoB],
                       "an unreadable photo store keeps every photo id on a restore, in memory")
        XCTAssertEqual(envelopePhotos(try s.box.saved()), [Self.photoA, Self.photoB],
                       "an unreadable photo store keeps every photo id on a restore, in the saved file")
    }
}
