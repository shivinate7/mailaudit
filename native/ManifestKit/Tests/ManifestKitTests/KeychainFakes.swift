// In-memory stand-in for the Keychain (lane N2). The tests never reach SecItem.
// Keys are fakes. The fake refuses a second add for the same service and account,
// as the real Keychain does, so a save that skips the delete fails a test.
// failNextAdd makes the next add throw, as a real SecItemAdd can, so a test can
// check what a failed write leaves behind. failAdds is sticky: every add throws
// until it is set false, as a Keychain that refuses writes does.
// failUpdates is sticky too: every update throws until it is set false.
// setUnreadable makes copy throw for one item, as an item the Keychain cannot
// decrypt does. update replaces an existing item's data, as SecItemUpdate does.

import Foundation
import Security
@testable import ManifestKit

final class FakeKeychain: KeychainBackend, @unchecked Sendable {
    enum Failure: Error { case duplicate, injected, unreadable, missing }

    private let lock = NSLock()
    private var items: [String: Data] = [:]
    private var added: [[String: Any]] = []
    private var failAdd = false
    private var failEvery = false
    private var failUpd = false
    private var unreadableIds: Set<String> = []

    /// When true, the next add throws Failure.injected, stores nothing, and clears itself.
    var failNextAdd: Bool {
        get { lock.withLock { failAdd } }
        set { lock.withLock { failAdd = newValue } }
    }

    /// When true, every add throws Failure.injected and stores nothing, until set false.
    var failAdds: Bool {
        get { lock.withLock { failEvery } }
        set { lock.withLock { failEvery = newValue } }
    }

    /// When true, every update throws Failure.injected and changes nothing, until set false.
    var failUpdates: Bool {
        get { lock.withLock { failUpd } }
        set { lock.withLock { failUpd = newValue } }
    }

    /// Makes copy throw Failure.unreadable for one service and account until set false.
    func setUnreadable(service: String, account: String, _ on: Bool) {
        let id = "\(service)|\(account)"
        lock.withLock {
            if on { unreadableIds.insert(id) } else { unreadableIds.remove(id) }
        }
    }

    private func identity(_ attributes: [String: Any]) -> String {
        let service = attributes[kSecAttrService as String] as? String ?? ""
        let account = attributes[kSecAttrAccount as String] as? String ?? ""
        return "\(service)|\(account)"
    }

    func add(_ attributes: [String: Any]) throws {
        try lock.withLock {
            if failAdd {
                failAdd = false
                throw Failure.injected
            }
            if failEvery { throw Failure.injected }
            let key = identity(attributes)
            if items[key] != nil { throw Failure.duplicate }
            items[key] = attributes[kSecValueData as String] as? Data
            added.append(attributes)
        }
    }

    func copy(_ query: [String: Any]) throws -> Data? {
        try lock.withLock {
            let id = identity(query)
            if unreadableIds.contains(id) { throw Failure.unreadable }
            return items[id]
        }
    }

    func delete(_ query: [String: Any]) throws {
        lock.withLock { items[identity(query)] = nil }
    }

    /// Replaces the data of the item that matches query. Throws Failure.missing when none does.
    func update(_ query: [String: Any], _ attributes: [String: Any]) throws {
        try lock.withLock {
            if failUpd { throw Failure.injected }
            let id = identity(query)
            guard items[id] != nil else { throw Failure.missing }
            items[id] = attributes[kSecValueData as String] as? Data
        }
    }

    /// Every attribute dictionary passed to add, oldest first.
    var addedAttributes: [[String: Any]] { lock.withLock { added } }

    var itemCount: Int { lock.withLock { items.count } }
}
