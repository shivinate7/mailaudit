import Foundation
import Security

/// A Keychain stand-in that lives in memory. A UI test run uses it so no Keychain item is read
/// (-ManifestUITestSyncStatus). The test target has its own fake, which the app cannot link.
final class MemoryKeychain: KeychainBackend, @unchecked Sendable {
    private let lock = NSLock()
    private var stored: Data?

    func add(_ attributes: [String: Any]) throws { lock.withLock { stored = attributes[kSecValueData as String] as? Data } }
    func update(_ query: [String: Any], _ attributes: [String: Any]) throws { try add(attributes) }
    func copy(_ query: [String: Any]) throws -> Data? { lock.withLock { stored } }
    func delete(_ query: [String: Any]) throws { lock.withLock { stored = nil } }
}

public extension KeyStore {
    /// A store that holds `key` in memory only.
    static func memory(holding key: String) -> KeyStore {
        let store = KeyStore(service: "memory", account: "memory", backend: MemoryKeychain())
        try? store.save(key)
        return store
    }
}
