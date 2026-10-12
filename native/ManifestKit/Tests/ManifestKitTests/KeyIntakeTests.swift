// Key intake from manifestledger://sync#k=<key> (lane N2, native-key-via-url-scheme).
// Every key here is a fake. Each fragment reaches the handler raw, percent-encoding
// included, as the Camera or the Mac `open` command sends it.

import Foundation
import XCTest
@testable import ManifestKit

final class KeyIntakeTests: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"

    func engine() throws -> RulesEngine {
        try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
    }

    func link(_ rawFragment: String?) throws -> URL {
        let base = rawFragment.map { "manifestledger://sync#\($0)" } ?? "manifestledger://sync"
        return try XCTUnwrap(URL(string: base))
    }

    func freshStore() -> KeyStore {
        KeyStore(service: "test.manifest.sync", account: "device-key", backend: FakeKeychain())
    }

    // A good link stores its key, and the store reads it back.
    func testGoodLinkStoresTheKey() async throws {
        let store = freshStore()
        let url = try link("k=\(Self.fakeKey)")
        let e = try engine()
        let outcome = await KeyIntake.accept(url, engine: e, store: store)
        XCTAssertEqual(outcome, .stored)
        let has: Bool = store.hasKey()
        XCTAssertTrue(has)
        let read = try store.key()
        XCTAssertEqual(read, Self.fakeKey)
    }

    // Every bad fragment is refused, and the store gains no key.
    func testBadFragmentsAreRefusedAndStoreNothing() async throws {
        let bad: [String] = [
            "k=",                  // empty key
            "x=\(Self.fakeKey)",   // no k= parameter
            "k=bad%20key",         // space
            "k=abc%2Ddef",         // percent-encoded hyphen: the web path refuses "%" too
            "k=a+b",               // plus
            "k=a%2Fb",             // slash
            "k=a=b",               // equals
            "k=a.b",               // dot
            "k=a%0Ab",             // newline
            "k=%C3%A9",            // non-ASCII
        ]
        let e = try engine()
        for raw in bad {
            let store = freshStore()
            let url = try link(raw)
            let outcome = await KeyIntake.accept(url, engine: e, store: store)
            XCTAssertEqual(outcome, .refused, "fragment \(raw) should be refused")
            let has: Bool = store.hasKey()
            XCTAssertFalse(has, "fragment \(raw) left a key behind")
        }
    }

    // A link with no fragment at all carries no key, so it is refused.
    func testLinkWithoutAFragmentIsRefused() async throws {
        let store = freshStore()
        let url = try link(nil)
        let e = try engine()
        let outcome = await KeyIntake.accept(url, engine: e, store: store)
        XCTAssertEqual(outcome, .refused)
        let has: Bool = store.hasKey()
        XCTAssertFalse(has)
    }

    // A refused link must not clear a good key that is already stored.
    func testRefusedLinkKeepsTheStoredKey() async throws {
        let store = freshStore()
        try store.save("OLDfakeKey_1")
        let url = try link("k=bad%20key")
        let e = try engine()
        let outcome = await KeyIntake.accept(url, engine: e, store: store)
        XCTAssertEqual(outcome, .refused)
        let read = try store.key()
        XCTAssertEqual(read, "OLDfakeKey_1")
    }

    // A failed write must report a refusal and keep the stored key. save() updates the
    // item in place, then tries an add if the update fails. With both failing, the
    // save throws, intake refuses, and the old key is still there.
    func testFailedWriteReportsRefusalAndKeepsTheStoredKey() async throws {
        let backend = FakeKeychain()
        let store = KeyStore(service: "test.manifest.sync", account: "device-key", backend: backend)
        try store.save("OLDfakeKey_1")
        backend.failUpdates = true
        backend.failAdds = true
        let url = try link("k=\(Self.fakeKey)")
        let e = try engine()
        let outcome = await KeyIntake.accept(url, engine: e, store: store)
        XCTAssertEqual(outcome, .refused, "a failed write must be reported as a refusal")
        let read = try store.key()
        XCTAssertEqual(read, "OLDfakeKey_1", "a failed write must keep the stored key")
    }

    // The edges of the alphabet pass: upper, lower, digit, underscore, hyphen.
    func testAlphabetEdgesAreStored() async throws {
        let store = freshStore()
        let edge = "Aa0_-Zz9"
        let url = try link("k=\(edge)")
        let e = try engine()
        let outcome = await KeyIntake.accept(url, engine: e, store: store)
        XCTAssertEqual(outcome, .stored)
        let read = try store.key()
        XCTAssertEqual(read, edge)
    }

    // Links for another app or another host are not ours: ignored, store untouched.
    func testOtherSchemeOrHostIsIgnored() async throws {
        let e = try engine()
        for base in ["otherapp://sync#k=\(Self.fakeKey)", "manifestledger://other#k=\(Self.fakeKey)"] {
            let store = freshStore()
            let url = try XCTUnwrap(URL(string: base))
            let outcome = await KeyIntake.accept(url, engine: e, store: store)
            XCTAssertEqual(outcome, .ignored, "\(base) should be ignored")
            let has: Bool = store.hasKey()
            XCTAssertFalse(has, "\(base) stored a key")
        }
    }

    // The handler must ask the rules bundle for the key, not check the alphabet itself.
    // This probe bundle accepts only the key "x". A handler with its own copy of the
    // alphabet would store the fake key. A handler that delegates refuses it.
    func testHandlerDelegatesTheAlphabetToKeyFromHash() async throws {
        let bundle = FileManager.default.temporaryDirectory
            .appending(path: "n2-probe-\(UUID().uuidString).js")
        try "var Rules = { keyFromHash: function (h) { return String(h).indexOf('k=x') >= 0 ? 'x' : null; } };"
            .write(to: bundle, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(at: bundle) }
        let probe = try RulesEngine(bundleURL: bundle)
        let store = freshStore()
        let refusedURL = try link("k=\(Self.fakeKey)")
        let refused = await KeyIntake.accept(refusedURL, engine: probe, store: store)
        XCTAssertEqual(refused, .refused)
        let has: Bool = store.hasKey()
        XCTAssertFalse(has)
        let storedURL = try link("k=x")
        let stored = await KeyIntake.accept(storedURL, engine: probe, store: store)
        XCTAssertEqual(stored, .stored)
    }

    // The bundled keyFromHash accepts a one-character key exactly when the character is
    // in [A-Za-z0-9_-]. Every printable ASCII character is swept. "&" is skipped,
    // because it splits the fragment before the key is read.
    func testBundledAlphabetMatchesTheSpecAlphabet() async throws {
        let e = try engine()
        let allowed = Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-")
        for code in 0x20...0x7E {
            let ch = Character(UnicodeScalar(UInt8(code)))
            if ch == "&" { continue }
            let args = try JSONSerialization.data(withJSONObject: ["#k=a\(ch)b"], options: [.fragmentsAllowed])
            let out = try await e.call("keyFromHash", String(decoding: args, as: UTF8.self))
            XCTAssertEqual(out != "null", allowed.contains(ch), "character code \(code)")
        }
    }
}
