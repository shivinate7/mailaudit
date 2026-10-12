// Key link queue (lane N5, native-key-via-url-scheme, the-token-is-a-credential).
//
// A manifestledger://sync link can arrive before the rules engine is ready. The App
// drops it today (`guard let engine else { return }`). PendingKeyLinks holds it instead
// and applies each link once, when the engine and store are ready. These tests cover
// the queuing unit, not the App.
//
// Contract the tests name:
//   public actor PendingKeyLinks {
//       public init()
//       public func receive(_ url: URL)                       // queues; stores nothing
//       public func ready(engine: RulesEngine, store: KeyStore) async -> [KeyIntakeOutcome]
//           // applies queued links in arrival order through KeyIntake.accept, empties the queue
//   }
//
// Red-first. PendingKeyLinks does not exist yet, so the target does not compile until the
// builder adds it. The builder's stub turns each case into an XCTAssert red.
//
// Every key here is fake. FakeKeychain stands in for the Keychain.

import Foundation
import XCTest
@testable import ManifestKit

final class KeyLinkQueueTests: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"

    func link() throws -> URL {
        try XCTUnwrap(URL(string: "manifestledger://sync#k=\(Self.fakeKey)"))
    }

    func freshStore(_ backend: FakeKeychain = FakeKeychain()) -> KeyStore {
        KeyStore(service: "test.manifest.n5.queue", account: "device-key", backend: backend)
    }

    /// A link that arrives before ready stores nothing.
    func testLinkBeforeReadyStoresNothing() async throws {
        let queue = PendingKeyLinks()
        let store = freshStore()
        await queue.receive(try link())
        XCTAssertFalse(store.hasKey(), "a queued link must not store a key before the engine is ready")
    }

    /// Once ready, the queued key is stored, and it is applied only once.
    func testReadyAppliesTheQueuedLinkOnce() async throws {
        let queue = PendingKeyLinks()
        let store = freshStore()
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        await queue.receive(try link())

        let first = await queue.ready(engine: engine, store: store)
        XCTAssertEqual(first, [.stored], "the queued link must be applied when the engine is ready")
        XCTAssertEqual(try store.key(), Self.fakeKey)

        let second = await queue.ready(engine: engine, store: store)
        XCTAssertEqual(second, [], "a link must be applied once, not on every ready")
    }

    /// After the queue drains, the raw key is gone from it. A control proves the scan sees
    /// the queue while the link is still held.
    func testDrainedQueueHoldsNoKey() async throws {
        let queue = PendingKeyLinks()
        let store = freshStore()
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        await queue.receive(try link())
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: queue), "control: the scan must see the held link")

        _ = await queue.ready(engine: engine, store: store)
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: queue), "the queue still holds the key after it drained")
    }
}
