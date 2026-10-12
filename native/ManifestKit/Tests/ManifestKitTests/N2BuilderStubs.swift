// TEMPORARY red stubs for lane N2 (native-build-lanes, native-key-via-url-scheme).
// Every stub compiles and returns a wrong value, so each test that uses one fails on
// an assertion, never on a compile error (testing-throwing-assert-bad-kill).
//
// BUILDER: move these four declarations into Sources/ManifestKit with the same
// names and signatures, then DELETE THIS FILE. A type declared in the test module
// shadows the same name from `@testable import ManifestKit`, with no error, so while
// this file stays the tests run against the stub and never reach the product code.

import Foundation
@testable import ManifestKit

protocol KeychainBackend: Sendable {
    /// SecItemAdd. Throws when an item with the same service and account exists.
    func add(_ attributes: [String: Any]) throws
    /// SecItemCopyMatching with kSecReturnData. nil when no item matches.
    func copy(_ query: [String: Any]) throws -> Data?
    /// SecItemDelete. No throw when the item is absent.
    func delete(_ query: [String: Any]) throws
}

struct KeyStore {
    init(service: String, account: String, backend: any KeychainBackend) {}
    /// Replaces any stored key. Writes kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly.
    func save(_ key: String) throws {}
    func hasKey() -> Bool { true }
    func key() throws -> String? { "WRONG" }
    func clear() throws {}
}

enum KeyIntakeOutcome: Equatable { case stored, refused, ignored }

enum KeyIntake {
    /// Reads the raw fragment of a manifestledger://sync link and asks keyFromHash
    /// in the rules bundle to check it. The fragment is raw, not percent-decoded.
    static func accept(_ url: URL, engine: RulesEngine, store: KeyStore) async -> KeyIntakeOutcome {
        .stored
    }
}
