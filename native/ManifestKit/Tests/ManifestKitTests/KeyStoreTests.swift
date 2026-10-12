// The device key store (lane N2, native-key-via-url-scheme). Runs on the in-memory
// Keychain fake only. No test reads the macOS Keychain or the mailaudit-sync item.

import Foundation
import Security
import XCTest
@testable import ManifestKit

final class KeyStoreTests: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"
    static let service = "test.manifest.sync"
    static let account = "device-key"

    func makeStore(_ backend: FakeKeychain) -> KeyStore {
        KeyStore(service: Self.service, account: Self.account, backend: backend)
    }

    // The accessibility class is fixed by native-key-via-url-scheme.
    func testSaveWritesAfterFirstUnlockThisDeviceOnly() throws {
        let backend = FakeKeychain()
        try makeStore(backend).save(Self.fakeKey)
        let attrs = try XCTUnwrap(backend.addedAttributes.last, "save wrote nothing to the keychain")
        XCTAssertEqual(
            attrs[kSecAttrAccessible as String] as? String,
            kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly as String
        )
        XCTAssertEqual(attrs[kSecClass as String] as? String, kSecClassGenericPassword as String)
    }

    // The native item is its own, never the web or Mac item named mailaudit-sync.
    func testServiceIsTheInjectedNameNotTheMacItem() throws {
        let backend = FakeKeychain()
        try makeStore(backend).save(Self.fakeKey)
        let attrs = try XCTUnwrap(backend.addedAttributes.last, "save wrote nothing to the keychain")
        XCTAssertEqual(attrs[kSecAttrService as String] as? String, Self.service)
        XCTAssertNotEqual(attrs[kSecAttrService as String] as? String, "mailaudit-sync")
    }

    // hasKey is a Bool. It follows the store, and it never returns the key.
    func testHasKeyFollowsSaveAndClear() throws {
        let store = makeStore(FakeKeychain())
        let empty: Bool = store.hasKey()
        XCTAssertFalse(empty)
        try store.save(Self.fakeKey)
        let saved: Bool = store.hasKey()
        XCTAssertTrue(saved)
        try store.clear()
        let cleared: Bool = store.hasKey()
        XCTAssertFalse(cleared)
    }

    // The sync client reads the key at request time, not from view state.
    func testKeyReadsBackAtRequestTime() throws {
        let store = makeStore(FakeKeychain())
        let before = try store.key()
        XCTAssertNil(before)
        try store.save(Self.fakeKey)
        let after = try store.key()
        XCTAssertEqual(after, Self.fakeKey)
    }

    // A new save replaces the old key, and leaves one item behind.
    func testSaveReplacesTheOldKey() throws {
        let backend = FakeKeychain()
        let store = makeStore(backend)
        try store.save("OLDfakeKey_1")
        try store.save("NEWfakeKey_2")
        let current = try store.key()
        XCTAssertEqual(current, "NEWfakeKey_2")
        XCTAssertEqual(backend.itemCount, 1)
    }

    // save() updates the item in place, and adds one only when the update fails. While
    // both fail, a save throws and the old key stays readable. Clearing the failures
    // lets the next save through.
    func testSaveKeepsTheOldKeyWhileUpdatesAndAddsFail() throws {
        let backend = FakeKeychain()
        let store = makeStore(backend)
        try store.save("OLDfakeKey_1")
        backend.failUpdates = true
        backend.failAdds = true
        XCTAssertThrowsError(try store.save("NEWfakeKey_2"))
        let during = try store.key()
        XCTAssertEqual(during, "OLDfakeKey_1")
        backend.failUpdates = false
        backend.failAdds = false
        let after = try store.key()
        XCTAssertEqual(after, "OLDfakeKey_1")
        try store.save("NEWfakeKey_2")
        let saved = try store.key()
        XCTAssertEqual(saved, "NEWfakeKey_2")
    }

    // An old item the Keychain cannot read must not block a save of a valid key.
    // The save replaces it, and the new key reads back.
    func testSaveReplacesAnUnreadableOldItem() throws {
        let backend = FakeKeychain()
        let store = makeStore(backend)
        try store.save("OLDfakeKey_1")
        backend.setUnreadable(service: Self.service, account: Self.account, true)
        try store.save("NEWfakeKey_2")
        backend.setUnreadable(service: Self.service, account: Self.account, false)
        let current = try store.key()
        XCTAssertEqual(current, "NEWfakeKey_2")
        XCTAssertEqual(backend.itemCount, 1)
    }

    // The fake's update replaces an existing item's data and throws when none exists,
    // as SecItemUpdate does. A save test built on update relies on this.
    func testFakeUpdateReplacesDataOrThrowsWhenMissing() throws {
        let backend = FakeKeychain()
        let query: [String: Any] = [kSecAttrService as String: Self.service, kSecAttrAccount as String: Self.account]
        XCTAssertThrowsError(try backend.update(query, [kSecValueData as String: Data("x".utf8)]))
        try makeStore(backend).save("OLDfakeKey_1")
        try backend.update(query, [kSecValueData as String: Data("NEWfakeKey_2".utf8)])
        let current = try makeStore(backend).key()
        XCTAssertEqual(current, "NEWfakeKey_2")
    }

    // Positive control for the Mirror scan: it must find a planted key at depth,
    // inside a Data blob, and inside a URL, or a scan that always says "absent" passes.
    func testMirrorScanFindsAPlantedKey() {
        struct Blob { let data: Data }
        struct Probe { let label: String?; let nested: [String: Blob]; let link: URL }
        let planted = Probe(
            label: nil,
            nested: ["a": Blob(data: Data("payload \(Self.fakeKey) end".utf8))],
            link: URL(string: "https://example.test/")!
        )
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: planted))
        let linked = Probe(
            label: "plain",
            nested: [:],
            link: URL(string: "manifestledger://sync#k=\(Self.fakeKey)")!
        )
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: linked))
        let clean = Probe(label: "plain", nested: ["a": Blob(data: Data("x".utf8))], link: URL(string: "https://example.test/")!)
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: clean))
    }
}
