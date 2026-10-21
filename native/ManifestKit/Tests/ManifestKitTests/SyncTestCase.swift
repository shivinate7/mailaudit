// Shared set-up for the sync client tests (lane N4a, native-reply-waits-generation,
// sync-revamp-cloudflare). Fake fixtures only: the keys below are made up, the
// Keychain is FakeKeychain, the network is StubNet under .invalid, and the sleep is
// SleepGate. No test reaches the real Keychain or the live Worker.
//
// Red-first. The builder adds the types below in
// native/ManifestKit/Sources/ManifestKit/SyncClient.swift. Until they exist, the sync
// test files do not compile. Every error must name one of these symbols and nothing else.
// The tests are complete: each assertion fails on a wrong value, not on a missing
// type (testing-throwing-assert-bad-kill). The red run is in the commit that adds them.
//
// Contract the tests name:
//   public enum SyncOutcome: Equatable, Sendable {
//       case applied     // a 200 with a readable ledger, and the store adopted it
//       case empty       // GET 404, and the store holds no check-in, envelope or stamp to seed
//       case noKey       // the KeyStore holds no key: no request left
//       case noAccess    // a 401, or the 401 stop is in force: no request left
//       case tooBig      // a 413
//       case badShape    // a 400
//       case unknown     // any other status, a transport error, a timeout, a 200 with no ledger
//       case backingOff  // push() while a retry is pending: no request left
//       case stopped     // stop() cancelled the call
//   }
//   @MainActor public final class SyncClient {
//       public init(baseURL: URL, session: URLSession, keys: KeyStore, store: LedgerStore,
//                   engine: RulesEngine, sleep: @escaping @Sendable (Int) async -> Void)  // sleep takes ms
//       public private(set) var advisory: String?  // nil, or the failure's syncStatus code:
//                                                  // "unknown" | "too-big" | "no-access" | "bad-shape"
//       public private(set) var retryInMs: Int?    // delay of the pending retry; nil when none
//       public func pull() async -> SyncOutcome    // GET /ledger
//       public func push() async -> SyncOutcome    // POST /ledger with {ledger}
//       public func stop()                         // cancels every call in flight
//   }
//
// What the tests pin (the lane N4a row in native-build-lanes, plus the web rules it mirrors):
// - Each request carries `Authorization: Bearer <key>`, read from the KeyStore when the
//   request is made. The key is never in the URL or a body. No key, no request.
// - The POST body is `{ledger}` and nothing else. The ledger is the store's, unknown fields included.
// - The status maps through `syncStatus` in the rules bundle, not a Swift copy.
//   The timeout is `SYNC_TIMEOUT_MS` and each retry delay is `backoffMs(n)`, both from the bundle.
// - A reply is adopted only if the store's generation did not change since the request left.
//   If it did, the reply is dropped and the client POSTs again (native-reply-waits-generation).
// - A GET reply never replaces a check-in, envelope or stamp that no adopted reply has carried yet
//   (imports-merge-never-replace). The client POSTs those. On a fresh start, anything the file
//   holds counts as not carried yet.
// - A reply goes through the mend and the kept copy that a load does (native-ledger-is-raw-json),
//   then the store is saved.
// - pull() starts with a GET. A 404 with a check-in, envelope or stamp in the store seeds by POST
//   and adopts that reply. A 404 with only lines sends nothing more and returns .empty.
// - A 401 stops all calls for this client. A new client (a relaunch) calls again.
// - A failure other than 400 and 401 (so 413, 5xx, a transport error, a timeout) schedules a retry.
//   `retryInMs` is `backoffMs(failures so far)`. It is set, with `advisory`, before the failing call
//   returns. The retry task calls `sleep` with it, then POSTs. While a retry is scheduled or out,
//   push() returns .backingOff and pull() still runs. A success clears the count, the retry and
//   `advisory`. After a 413 only a good POST does that: a good GET leaves the size state alone.
// - A 400 sets `advisory` and schedules nothing. The next call goes out.
// - stop() makes the calls in flight return .stopped, and abandons their requests. It sets no
//   `advisory` and schedules no retry.
//
// The builder also adds, and the tests do not call:
// - a way for the client to read a constant from the bundle. RulesCore.call refuses anything
//   that is not a function, and SYNC_TIMEOUT_MS is a number.
// - a LedgerStore method that adopts a server ledger: the load mend, the kept copy, then a save.
//
// Open and not pinned: the wording of the native size line (the web line is `syncSays` in
// src/app.jsx), whether a new key lifts the 401 stop (the web does, native-reply-waits-generation
// says relaunch), the merge notice, and the idle gate (lane N4b).

import Foundation
import Security
import XCTest
@testable import ManifestKit

/// A Keychain stand-in that keeps the key reversed. A Mirror scan of a client then finds the
/// key only if the client copied it out, and not because the fake Keychain holds it as text.
final class MaskedKeychain: KeychainBackend, @unchecked Sendable {
    enum Failure: Error { case missing }
    private let lock = NSLock()
    private var stored: Data?

    private static func flip(_ d: Data) -> Data { Data(d.reversed()) }

    func add(_ attributes: [String: Any]) throws {
        lock.withLock { stored = (attributes[kSecValueData as String] as? Data).map(Self.flip) }
    }
    func update(_ query: [String: Any], _ attributes: [String: Any]) throws {
        try lock.withLock {
            guard stored != nil else { throw Failure.missing }
            stored = (attributes[kSecValueData as String] as? Data).map(Self.flip)
        }
    }
    func copy(_ query: [String: Any]) throws -> Data? { lock.withLock { stored.map(Self.flip) } }
    func delete(_ query: [String: Any]) throws { lock.withLock { stored = nil } }
}

/// The outcome of a call the test started, or nil while it has not returned.
@MainActor
final class SyncCall {
    var outcome: SyncOutcome?
}

@MainActor
class SyncTestCase: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"
    static let otherFakeKey = "0th3rF4k3K3y9f8e7d6c5b4a39281706f5"
    static let t0: Double = 1_786_543_380_000
    /// Item keys from shared/fixtures/ledger.json.
    static let keyA = "A1|0|pLightningBolt"
    static let keyB = "A1|1|pCounterspell"
    static let keyC = "B1|0|pLightningBolt"
    /// Written only into a reply that must never be adopted.
    static let marker = "D1|0|pUrzasSaga"

    var dir: URL!
    var keys: KeyStore!
    var gate: SleepGate!
    var clients: [SyncClient] = []
    var ledgerURL: URL { dir.appending(path: "ledger.json") }
    var net: StubNet { StubNet.shared }

    override func setUp() async throws {
        net.reset()
        dir = FileManager.default.temporaryDirectory.appending(path: "n4a-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        keys = KeyStore(service: "test.manifest.sync.n4a", account: "device-key", backend: FakeKeychain())
        try keys.save(Self.fakeKey)
        gate = SleepGate()
        try writeLedger()
    }

    override func tearDown() async throws {
        // A call still out must not run into the next test's stub.
        for c in clients { c.stop() }
        clients = []
        try? FileManager.default.removeItem(at: dir)
    }

    // MARK: ledgers

    func fixtureItems() throws -> Any {
        let url = RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json")
        let obj = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        return try XCTUnwrap(obj["items"])
    }

    /// A whole ledger as the Worker would hold it: the fixture lines and `mailday` 1,
    /// check-ins from `received` (each with a time), and any extra top-level fields.
    func ledger(received: [String: Int] = [:], extra: [String: Any] = [:]) throws -> [String: Any] {
        var out: [String: Any] = ["mailday": 1, "items": try fixtureItems()]
        if !received.isEmpty {
            out["received"] = received
            out["receivedAt"] = received.mapValues { _ in Self.t0 }
        }
        for (k, v) in extra { out[k] = v }
        return out
    }

    /// Writes ledger.json for the next load. The default is the fixture with no check-ins.
    func writeLedger(received: [String: Int] = [:], extra: [String: Any] = [:]) throws {
        let data = try JSONSerialization.data(
            withJSONObject: try ledger(received: received, extra: extra), options: [.sortedKeys])
        try data.write(to: ledgerURL)
    }

    func makeStore() throws -> LedgerStore {
        let store = LedgerStore(fileURL: ledgerURL, now: { Self.t0 })
        try store.load()
        return store
    }

    func readSaved() throws -> [String: Any] {
        try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: ledgerURL)) as? [String: Any])
    }

    func keptCopies() throws -> [URL] {
        try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            .filter { $0.lastPathComponent.hasPrefix("ledger.kept-") && $0.pathExtension == "json" }
    }

    /// Canonical bytes, so key order and Int or Double do not matter.
    func assertSameJSON(_ actual: Any?, _ expected: Any, _ message: String, line: UInt = #line) {
        guard let actual else {
            XCTFail("\(message): missing", line: line)
            return
        }
        let a = try? JSONSerialization.data(withJSONObject: actual, options: [.sortedKeys, .fragmentsAllowed])
        let e = try? JSONSerialization.data(withJSONObject: expected, options: [.sortedKeys, .fragmentsAllowed])
        XCTAssertEqual(a, e, message, line: line)
    }

    // MARK: replies

    func body(_ object: [String: Any]) -> Data {
        (try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])) ?? Data()
    }

    /// A 200 reply: `{ledger, rev}`, as the Worker sends it.
    func ok(_ ledger: [String: Any], rev: Int = 1) -> StubNet.Reply {
        .status(200, body(["ledger": ledger, "rev": rev]))
    }

    func failure(_ code: Int, _ error: String) -> StubNet.Reply {
        .status(code, body(["error": error]))
    }

    /// Request number `i` (from 0), or nil. A missing request fails the assertion and cannot crash the run.
    func seen(_ i: Int) -> StubNet.Seen? {
        let all = net.requests
        return all.indices.contains(i) ? all[i] : nil
    }

    /// The `received` map of the ledger a request carried.
    func sentReceived(_ seen: StubNet.Seen?) -> [String: Any]? {
        (seen?.json?["ledger"] as? [String: Any])?["received"] as? [String: Any]
    }

    // MARK: the client

    /// A client on the stub network, with the sleep under test control.
    func makeClient(_ store: LedgerStore, bundle: URL = RulesGoldenTests.bundleURL) throws -> SyncClient {
        let g = gate!
        let client = SyncClient(
            baseURL: StubNet.baseURL, session: StubNet.session(), keys: keys, store: store,
            engine: try RulesEngine(bundleURL: bundle), sleep: { await g.sleep($0) })
        clients.append(client)
        return client
    }

    /// The real bundle with extra JavaScript after it. `Rules` is a plain object, so a
    /// test can swap one rule or constant, as PackagesToggleTests does.
    func probeBundle(_ js: String) throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let url = dir.appending(path: "probe-\(UUID().uuidString).js")
        try (real + "\n;" + js + ";\n").write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    /// Starts a call. A call that hangs ends the test with a failure and not with a hung run.
    func start(_ work: @escaping @MainActor () async -> SyncOutcome) -> SyncCall {
        let p = SyncCall()
        Task { p.outcome = await work() }
        return p
    }

    /// The outcome of a started call, or nil (and a failure) after 5 seconds.
    func finish(_ p: SyncCall, line: UInt = #line) async -> SyncOutcome? {
        await until("the call returns", timeout: 5, line: line) { p.outcome != nil }
        return p.outcome
    }

    /// Waits until `condition` holds. Fails after `timeout` seconds. Use it for a state
    /// that must arrive, never to prove that nothing happens.
    func until(_ what: String, timeout: Double = 3, line: UInt = #line, _ condition: @escaping @MainActor () -> Bool) async {
        let end = Date().addingTimeInterval(timeout)
        while true {
            if condition() { return }
            if Date() > end {
                XCTFail("timed out waiting for: \(what)", line: line)
                return
            }
            try? await Task.sleep(for: .milliseconds(5))
        }
    }
}
