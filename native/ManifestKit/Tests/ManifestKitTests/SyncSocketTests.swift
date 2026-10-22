// Socket tests (lane N4b, sync-revamp-cloudflare, native-reply-waits-generation).
//
// The WebSocket is URLSessionWebSocketTask behind the SyncSocket protocol. A stub URL protocol cannot
// stand in for a WebSocket, so the glue gets a live check only (debt native-sync-live-unrun). These tests
// run the client's loop against FakeSyncSocket: when it connects, with which key, when it reconnects and
// after what wait, and when it stops. The contract is the header of N4bRedStubs.swift.
//
// The key reaches the socket only as the argument of run(key:), read at each connection. The client
// never holds it (the-token-is-a-credential). The fake's log is a singleton, so the log can hold a key
// without the client holding the log.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncSocketTests: SyncTestCase {
    var fake: FakeSyncSocket!

    override func setUp() async throws {
        try await super.setUp()
        SocketLog.shared.reset()
        fake = FakeSyncSocket()
    }

    /// The Keychain stand-in that keeps the key reversed, so a scan finds a key only if the client copied it.
    func useMaskedKeychain() throws {
        keys = KeyStore(service: "test.manifest.sync.n4a", account: "device-key", backend: MaskedKeychain())
        try keys.save(Self.fakeKey)
    }

    func makeSocketClient(_ store: LedgerStore, bundle: URL = RulesGoldenTests.bundleURL) throws -> SyncClient {
        let client = try makeClient(store, bundle: bundle)
        client.socket = fake
        return client
    }

    // MARK: the address

    // The Worker expects /ws, and exactly two protocols: "mailaudit", then the key. A browser cannot
    // set a header on a WebSocket, so the key rides as the second protocol and not in the URL.
    func testTheSocketAddressIsWssSlashWsWithTheKeyAsASecondProtocol() {
        let url = SyncSocketSpec.endpoint(URL(string: "https://sync.test.invalid")!)
        XCTAssertEqual(url.absoluteString, "wss://sync.test.invalid/ws")
        XCTAssertEqual(SyncSocketSpec.endpoint(URL(string: "http://localhost:8787")!).absoluteString, "ws://localhost:8787/ws")
        XCTAssertEqual(SyncSocketSpec.protocols(key: Self.fakeKey), ["mailaudit", Self.fakeKey])
        XCTAssertFalse(url.absoluteString.contains(Self.fakeKey), "the key is never in the URL")
    }

    // MARK: connecting

    func testConnectOpensTheSocketWithTheStoredKey() async throws {
        try useMaskedKeychain()
        let store = try makeStore()
        let client = try makeSocketClient(store)
        client.connect()
        await until("the socket connects", timeout: 1) { [fake] in fake?.liveCount == 1 }
        XCTAssertEqual(SocketLog.shared.keys, [Self.fakeKey])
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: client), "the client holds no key text")
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: ["held": Self.fakeKey]), "control: the scan finds a key held as text")
        XCTAssertEqual(net.requests.count, 0, "connecting is not a call")
    }

    // No key, no socket. Once a key is saved, the next connect() opens one.
    func testWithNoKeyNoSocketOpensUntilAKeyIsSaved() async throws {
        try keys.clear()
        let store = try makeStore()
        let client = try makeSocketClient(store)
        client.connect()
        await settle()
        XCTAssertEqual(SocketLog.shared.keys, [], "no key: nothing connects")

        try keys.save(Self.fakeKey)
        client.connect()
        await until("the socket connects once there is a key", timeout: 1) { [fake] in fake?.liveCount == 1 }
        XCTAssertEqual(SocketLog.shared.keys, [Self.fakeKey])
    }

    // A frame from the socket reaches the message handler, so a newer rev starts a GET.
    func testAFrameFromTheSocketStartsAGet() async throws {
        let store = try makeStore()
        let client = try makeSocketClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 6))
        client.connect()
        await until("the socket connects", timeout: 1) { [fake] in fake?.liveCount == 1 }
        fake.open()
        fake.send(revFrame(6))
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "rev 6 is newer than nothing: one GET")
        await until("the reply lands") { client.rev == 6 }
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // MARK: reconnecting

    // A connection that closes comes back after backoffMs(n) from the bundle. The probe makes it
    // 100, 101, 102, so a client that doubles on its own, or always waits as for attempt 0, fails.
    // A failed open counts, and a connection that opened starts the count over.
    func testReconnectFollowsTheBundleBackoffAndAnOpenResetsIt() async throws {
        let probe = try probeBundle("Rules.backoffMs=function(a){return 100+a}")
        let store = try makeStore()
        let client = try makeSocketClient(store, bundle: probe)
        client.connect()

        await until("connection 1", timeout: 1) { [fake] in fake?.liveCount == 1 }
        fake.drop()  // never opened: a failed open
        await until("the first wait is 100") { [self] in gate.delays == [100] }
        gate.release()
        await until("connection 2", timeout: 1) { [fake] in fake?.liveCount == 1 && SocketLog.shared.keys.count == 2 }
        fake.drop()  // a second failed open
        await until("the second wait is 101") { [self] in gate.delays == [100, 101] }
        gate.release()
        await until("connection 3", timeout: 1) { [fake] in fake?.liveCount == 1 && SocketLog.shared.keys.count == 3 }
        fake.open()
        fake.drop()  // opened, then closed
        await until("an open starts the count over: the wait is 100 again") { [self] in gate.delays == [100, 101, 100] }
        gate.release()
        await until("connection 4", timeout: 1) { SocketLog.shared.keys.count == 4 }
        XCTAssertEqual(SocketLog.shared.keys, Array(repeating: Self.fakeKey, count: 4))
    }

    // A refused key ends the loop. The socket is not reopened with a key the Worker refused.
    func testA401EndsTheSocketLoop() async throws {
        let store = try makeStore()
        let client = try makeSocketClient(store)
        net.enqueue(failure(401, "unauthorized"))
        client.connect()
        await until("the socket connects", timeout: 1) { [fake] in fake?.liveCount == 1 }
        fake.open()
        let refused = await client.push()
        XCTAssertEqual(refused, .noAccess)

        fake.drop()
        await settle()
        XCTAssertEqual(SocketLog.shared.keys.count, 1, "no second connection after a 401")
        XCTAssertTrue(gate.delays.isEmpty, "and no wait for one")
    }

    // A stop cancels the running connection and ends the loop for good: the close that follows the
    // cancel is not a reason to reconnect.
    func testStopClosesTheSocketAndEndsTheLoop() async throws {
        let store = try makeStore()
        let client = try makeSocketClient(store)
        client.connect()
        await until("the socket connects", timeout: 1) { [fake] in fake?.liveCount == 1 }
        fake.open()

        client.stop()
        await until("the connection is cancelled", timeout: 1) { SocketLog.shared.cancelCount == 1 }
        XCTAssertEqual(fake.liveCount, 0)
        gate.release()
        await settle()
        XCTAssertEqual(SocketLog.shared.keys.count, 1, "a stop does not reconnect")
        XCTAssertTrue(gate.delays.isEmpty)
    }

    // MARK: resume and key save

    // The app came back. The old connection may be dead without saying so: it is replaced at once, with
    // no backoff, and the resume does one GET.
    func testResumeReconnectsTheSocketAndDoesOneGet() async throws {
        let store = try makeStore()
        let client = try makeSocketClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 4))
        client.connect()
        await until("the socket connects", timeout: 1) { [fake] in fake?.liveCount == 1 }
        fake.open()

        let outcome = await client.resume()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
        await until("a new connection replaces the old", timeout: 1) { SocketLog.shared.keys.count == 2 }
        XCTAssertEqual(SocketLog.shared.cancelCount, 1, "the old connection was closed")
        XCTAssertEqual(fake.liveCount, 1)
        XCTAssertTrue(gate.delays.isEmpty, "a resume does not wait on a backoff")
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // A saved key closes the connection that carries the old key and opens one with the new.
    func testSavingAKeyReconnectsWithTheNewKey() async throws {
        try useMaskedKeychain()
        let store = try makeStore()
        let client = try makeSocketClient(store)
        net.enqueue(ok(try ledger(), rev: 1))
        client.connect()
        await until("the socket connects", timeout: 1) { [fake] in fake?.liveCount == 1 }
        fake.open()

        try keys.save(Self.otherFakeKey)
        let outcome = await client.keySaved()
        XCTAssertEqual(outcome, .applied)
        await until("the new connection", timeout: 1) { SocketLog.shared.keys.count == 2 }
        XCTAssertEqual(SocketLog.shared.keys, [Self.fakeKey, Self.otherFakeKey])
        XCTAssertEqual(SocketLog.shared.cancelCount, 1, "the connection with the old key was closed")
        XCTAssertEqual(seen(0)?.header("Authorization"), "Bearer \(Self.otherFakeKey)")
        XCTAssertFalse(mirrorFinds(Self.otherFakeKey, in: client), "the client holds no key text")
    }
}
