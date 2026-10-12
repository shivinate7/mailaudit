// In-memory stand-in for the Keychain (lane N2). The tests never reach SecItem.
// Keys are fakes. The fake refuses a second add for the same service and account,
// as the real Keychain does, so a save that skips the delete fails a test.

import Foundation
import Security

final class FakeKeychain: KeychainBackend, @unchecked Sendable {
    enum Failure: Error { case duplicate }

    private let lock = NSLock()
    private var items: [String: Data] = [:]
    private var added: [[String: Any]] = []

    private func identity(_ attributes: [String: Any]) -> String {
        let service = attributes[kSecAttrService as String] as? String ?? ""
        let account = attributes[kSecAttrAccount as String] as? String ?? ""
        return "\(service)|\(account)"
    }

    func add(_ attributes: [String: Any]) throws {
        try lock.withLock {
            let key = identity(attributes)
            if items[key] != nil { throw Failure.duplicate }
            items[key] = attributes[kSecValueData as String] as? Data
            added.append(attributes)
        }
    }

    func copy(_ query: [String: Any]) throws -> Data? {
        lock.withLock { items[identity(query)] }
    }

    func delete(_ query: [String: Any]) throws {
        lock.withLock { items[identity(query)] = nil }
    }

    /// Every attribute dictionary passed to add, oldest first.
    var addedAttributes: [[String: Any]] { lock.withLock { added } }

    var itemCount: Int { lock.withLock { items.count } }
}
