// Shared set-up for the N4b tests (socket, press gate, resume). The contract is the header of
// N4bRedStubs.swift. Fake fixtures only: the keys are the made-up ones in SyncTestCase, the Keychain
// is FakeKeychain, the network is StubNet, the clocks and sleeps are under test control, and the
// socket is FakeSyncSocket. No test reaches the real Keychain, the live Worker or a real socket.

import Foundation
import XCTest
@testable import ManifestKit

/// One text frame as the Worker sends it on /ws.
func revFrame(_ rev: Int) -> String { #"{"rev":\#(rev)}"# }

/// A clock the test moves. The press gate reads it through `now`.
final class PressClock: @unchecked Sendable {
    var t: Double
    init(_ t: Double) { self.t = t }
}

/// A press gate on a clock and a sleep the test controls. The tail and the hold limit are read
/// from the real bundle, so no test repeats the figures.
@MainActor
final class PressRig {
    /// A real epoch time, so a fresh gate's last-press time of 0 is far in the past, as on a device.
    static let t0: Double = 1_786_543_380_000

    let clock = PressClock(PressRig.t0)
    let sleeps = SleepGate()
    let engine: RulesEngine
    let gate: PressGate
    let tail: Double
    let maxHold: Double

    private init(bundle: URL, tail: Double, maxHold: Double) throws {
        engine = try RulesEngine(bundleURL: bundle)
        let c = clock, s = sleeps
        gate = PressGate(engine: engine, now: { c.t }, sleep: { await s.sleep($0) })
        self.tail = tail
        self.maxHold = maxHold
    }

    /// `bundle` is the rules the gate runs. A probe bundle may replace `Rules.pressHeld`.
    static func make(bundle: URL = RulesGoldenTests.bundleURL) async throws -> PressRig {
        let real = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let tailJSON = try await real.constant("PRESS_TAIL_MS")
        let maxJSON = try await real.constant("PRESS_MAX_MS")
        let tail = try XCTUnwrap(Double(tailJSON))
        let maxHold = try XCTUnwrap(Double(maxJSON))
        return try PressRig(bundle: bundle, tail: tail, maxHold: maxHold)
    }

    func advance(_ ms: Double) { clock.t += ms }
}

/// The real bundle with extra JavaScript after it, in a folder the test removes.
func probeBundleFile(_ js: String, for test: XCTestCase) throws -> URL {
    let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
    let dir = FileManager.default.temporaryDirectory.appending(path: "n4b-probe-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    test.addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
    let url = dir.appending(path: "rules.js")
    try (real + "\n;" + js + ";\n").write(to: url, atomically: true, encoding: .utf8)
    return url
}

// MARK: calls that may return nil

/// A call that returns an optional outcome. `done` tells a nil return from a call still out.
@MainActor
final class HeardCall {
    var done = false
    var outcome: SyncOutcome?
}

/// A throwing call the test started.
@MainActor
final class Pending<T: Sendable> {
    var result: Result<T, Error>?
    var task: Task<T, Error>?
}

extension SyncTestCase {
    func startHeard(_ work: @escaping @MainActor () async -> SyncOutcome?) -> HeardCall {
        let p = HeardCall()
        Task {
            p.outcome = await work()
            p.done = true
        }
        return p
    }

    /// The outcome of a started call: nil when it returned nil, and nil with a failure after 5 seconds.
    func finishHeard(_ p: HeardCall, line: UInt = #line) async -> SyncOutcome? {
        await until("the call returns", timeout: 5, line: line) { p.done }
        return p.outcome
    }

    func begin<T: Sendable>(_ work: @escaping @Sendable () async throws -> T) -> Pending<T> {
        let p = Pending<T>()
        let t = Task { try await work() }
        p.task = t
        Task { p.result = await t.result }
        return p
    }

    func end<T: Sendable>(_ p: Pending<T>, line: UInt = #line) async -> Result<T, Error>? {
        await until("the call returns", timeout: 5, line: line) { p.result != nil }
        return p.result
    }

    /// A short bounded wait. It gives a call that must NOT happen a chance to show itself. It proves
    /// nothing alone: every test that uses it first waits for something that must happen.
    func settle() async { try? await Task.sleep(for: .milliseconds(60)) }

    /// A client whose replies wait for `rig`'s gate.
    func makeHeldClient(_ store: LedgerStore, rig: PressRig, bundle: URL = RulesGoldenTests.bundleURL) throws -> SyncClient {
        let client = try makeClient(store, bundle: bundle)
        client.pressGate = rig.gate
        return client
    }

    /// A 200 reply with the Worker's `stats`, as a POST answer carries them.
    func okStats(_ ledger: [String: Any], rev: Int, stats: [String: Int]) -> StubNet.Reply {
        .status(200, body(["ledger": ledger, "rev": rev, "stats": stats]))
    }
}

// MARK: a socket under test control

/// What the fake socket was asked to do. A singleton, so the log holds a key without the client
/// holding the log: a mirror scan of the client must find no key text (the-token-is-a-credential).
final class SocketLog: @unchecked Sendable {
    static let shared = SocketLog()
    private let lock = NSLock()
    private var runKeys: [String] = []
    private var cancels = 0

    func reset() { lock.withLock { runKeys = []; cancels = 0 } }
    func ran(_ key: String) { lock.withLock { runKeys.append(key) } }
    func cancelled() { lock.withLock { cancels += 1 } }
    /// The key each connection was started with, in order.
    var keys: [String] { lock.withLock { runKeys } }
    /// Connections the client cancelled while they ran.
    var cancelCount: Int { lock.withLock { cancels } }
}

/// A socket that connects when the test says. `run` waits until the test drops the connection or the
/// client cancels it. `open()` and `send(_:)` act on the newest live connection.
final class FakeSyncSocket: SyncSocket, @unchecked Sendable {
    private struct Live {
        let opened: @Sendable () -> Void
        let message: @Sendable (String) -> Void
        let cont: CheckedContinuation<Void, Never>
    }

    private let lock = NSLock()
    private var live: [UUID: Live] = [:]
    private var order: [UUID] = []
    private var cancelledIds: Set<UUID> = []

    func run(key: String, opened: @escaping @Sendable () -> Void, message: @escaping @Sendable (String) -> Void) async {
        let id = UUID()
        SocketLog.shared.ran(key)
        await withTaskCancellationHandler {
            await withCheckedContinuation { (c: CheckedContinuation<Void, Never>) in
                lock.lock()
                if cancelledIds.contains(id) {
                    lock.unlock()
                    c.resume()
                    return
                }
                live[id] = Live(opened: opened, message: message, cont: c)
                order.append(id)
                lock.unlock()
            }
        } onCancel: {
            SocketLog.shared.cancelled()
            lock.lock()
            cancelledIds.insert(id)
            let l = live.removeValue(forKey: id)
            order.removeAll { $0 == id }
            lock.unlock()
            l?.cont.resume()
        }
    }

    /// Connections started and not yet ended.
    var liveCount: Int { lock.withLock { order.count } }

    private func newest() -> Live? { lock.withLock { order.last.flatMap { live[$0] } } }

    /// The handshake succeeded.
    func open() { newest()?.opened() }

    /// The Worker sent a text frame.
    func send(_ text: String) { newest()?.message(text) }

    /// The connection ended without the client asking: the server closed it, or the network dropped.
    func drop() {
        lock.lock()
        let id = order.last
        let l = id.flatMap { live.removeValue(forKey: $0) }
        if id != nil { order.removeLast() }
        lock.unlock()
        l?.cont.resume()
    }
}
