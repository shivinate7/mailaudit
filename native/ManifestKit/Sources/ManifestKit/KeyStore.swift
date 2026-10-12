import Foundation
import Security

/// The Keychain calls the key store needs. Tests pass an in-memory fake
/// (native-key-via-url-scheme).
protocol KeychainBackend: Sendable {
    /// SecItemAdd. Throws when an item with the same service and account exists.
    func add(_ attributes: [String: Any]) throws
    /// SecItemCopyMatching with kSecReturnData. nil when no item matches.
    func copy(_ query: [String: Any]) throws -> Data?
    /// SecItemDelete. No throw when the item is absent.
    func delete(_ query: [String: Any]) throws
}

struct SystemKeychain: KeychainBackend {
    struct Failure: Error { let status: OSStatus }

    func add(_ attributes: [String: Any]) throws {
        let s = SecItemAdd(attributes as CFDictionary, nil)
        if s != errSecSuccess { throw Failure(status: s) }
    }

    func copy(_ query: [String: Any]) throws -> Data? {
        var out: CFTypeRef?
        let s = SecItemCopyMatching(query as CFDictionary, &out)
        if s == errSecItemNotFound { return nil }
        if s != errSecSuccess { throw Failure(status: s) }
        return out as? Data
    }

    func delete(_ query: [String: Any]) throws {
        let s = SecItemDelete(query as CFDictionary)
        if s != errSecSuccess && s != errSecItemNotFound { throw Failure(status: s) }
    }
}

struct KeyStore {
    let service: String
    let account: String
    let backend: any KeychainBackend

    init(service: String, account: String, backend: any KeychainBackend = SystemKeychain()) {
        self.service = service
        self.account = account
        self.backend = backend
    }

    private var identity: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: account]
    }

    /// Replaces any stored key. Writes kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly.
    /// If the add fails, the old key is put back and the error is rethrown.
    func save(_ key: String) throws {
        let old = try self.key()
        try backend.delete(identity)
        do {
            try backend.add(attributes(for: key))
        } catch {
            if let old { try? backend.add(attributes(for: old)) }
            throw error
        }
    }

    private func attributes(for key: String) -> [String: Any] {
        var attrs = identity
        attrs[kSecValueData as String] = Data(key.utf8)
        attrs[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return attrs
    }

    func key() throws -> String? {
        var q = identity
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        return try backend.copy(q).flatMap { String(data: $0, encoding: .utf8) }
    }

    func hasKey() -> Bool { ((try? key()) ?? nil) != nil }

    func clear() throws { try backend.delete(identity) }
}

enum KeyIntakeOutcome: Equatable { case stored, refused, ignored }

enum KeyIntake {
    /// Reads the raw fragment of a manifestledger://sync link and asks keyFromHash
    /// in the rules bundle to check it. The fragment is raw, not percent-decoded.
    static func accept(_ url: URL, engine: RulesEngine, store: KeyStore) async -> KeyIntakeOutcome {
        guard url.scheme == "manifestledger", url.host() == "sync" else { return .ignored }
        guard let fragment = url.fragment(percentEncoded: true),
              let arg = try? JSONSerialization.data(withJSONObject: ["#" + fragment]),
              let out = try? await engine.call("keyFromHash", String(decoding: arg, as: UTF8.self)),
              let key = try? JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String,
              (try? store.save(key)) != nil
        else { return .refused }
        return .stored
    }
}
