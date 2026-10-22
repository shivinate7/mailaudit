// RED STUBS for lane N4b (socket, press gate, resume). Builder: this whole file is yours to delete.
//
// Every declaration below is the contract the N4b test files name. Each one returns a wrong value on
// purpose and never throws, so each test fails on an assertion and not on a compile error or a throw
// (native-build-lanes, testing-throwing-assert-bad-kill).
//
// To build the lane:
//   1. Move each type into native/ManifestKit/Sources/ManifestKit, make it `public` and real. Put the
//      SyncClient members in SyncClient.swift itself: they need its private state (the store, the
//      generation, the key digest). Keep `rev`, `stats` and the kept-id filter in SyncClient, not in
//      LedgerStore (lane N9 also edits LedgerStore).
//   2. Delete THIS FILE. While it exists the extension below collides with the real members, and the
//      stub types shadow the real ones, so the tests keep testing the stubs and stay red.
//   3. Rules come from the bundle, never from a Swift copy (rules-run-in-javascriptcore): pressHeld,
//      backoffMs, syncStatus, SYNC_TIMEOUT_MS, mimeFromName.
//
// Nothing here is product code. It sits in the test target because the test-author edits tests only.
//
// ---- The contract ----
//
// SyncClient (additions; the N4a members are unchanged, see SyncTestCase.swift)
//   rev: Int?          The newest rev any reply carried. nil before one did. It never moves back.
//   stats: [String: Int]?   The `stats` of the last adopted reply. nil when that reply carried none.
//   pressGate: PressGate?   Settable. nil means no press holds anything (every N4a test).
//   socket: SyncSocket?     Settable. nil means connect() does nothing.
//   photoStore: PhotoStore? Settable. Read by the server apply, see PhotoIds below.
//   receive(socketMessage:) The message handler. The frame is one text frame from /ws. Only
//       `{"rev": <integer>}` counts; any other frame returns nil and starts nothing. A rev above the
//       held rev (nil counts as 0) starts ONE GET and returns that pull's outcome. It returns nil,
//       and starts nothing, in each of these cases: the rev is not newer; a GET or POST is already
//       out (the rev is remembered, and when that call's reply lands with a lower rev one GET follows);
//       the 401 stop is in force. It returns at once in those cases.
//   keySaved()  The app calls it when a key was saved (KeyIntake .stored). It lifts the 401 stop
//       even when the key is the same, clears the failure count, the retry and the too-big state,
//       reconnects the socket with the key now in the KeyStore, and pulls. The reply to that pull is
//       the cold reply: no press holds it, neither a press that is down nor the tail of the Save
//       tap's own press. The exception ends with that pull, whatever its outcome.
//   resume()    scenePhase became active. It reconnects the socket and does one GET, whatever rev is
//       held. It returns that pull's outcome.
//   connect()   Starts the socket loop: a key is read from the KeyStore at each connection, the socket
//       runs, and when it ends the loop waits backoffMs(n) from the bundle (through the client's
//       `sleep`) and runs it again. n counts the connections that ended since the last one that
//       opened. No key or a 401 stop ends the loop. stop() cancels the running socket and ends the loop,
//       and a later connect() starts it again, as a later push() works after a stop().
//
// Every reply the client adopts, from a GET or a POST, waits for the press gate first. The wait comes
// BEFORE the generation check: a tap that lands during the hold changes the generation, so the held
// reply is dropped and the client POSTs the tap (native-reply-waits-generation). stop() ends a hold
// without adopting, and the call returns .stopped.
//
// PressGate   What counts as a press on iOS: a touch down until it lifts or iOS cancels it (a scroll
//   takes the touch, so a scroll is a cancel). Hover and scrolling never hold. The verdict is
//   pressHeld(downAt, lastAt, now) in the rules bundle: downAt is nil when no touch is down, lastAt
//   is the time of the last down, up or cancel, and `now` comes from the injected clock.
//   The gate has its own clock and sleep, so it shares nothing with the client's retry sleep.
//   waitClear() returns when isHeld() is false. While held it sleeps a re-check of at most 300 ms
//   (the tail plus one quick re-check is under a second), and returns early when its task is cancelled.
//
// SyncSocket  One connection. The URLSessionWebSocketTask glue implements it and gets a live check
//   only: a stub URL protocol cannot stand in for a WebSocket.
//
// SyncLine    The text of the 401 and 413 lines. The wording is not ruled (native-reply-waits-generation,
//   Still open). The tests pin that the two lines exist, differ, and speak of the Worker only.
//
// HTTPPhotoTransport   PhotoTransport over the Worker /photos route.
//
// PhotoIds   The server apply passes each envelope's `photos` through PhotoIds.kept(_, held:, on: .sync)
//   with held = photoStore.heldIds(). On .sync that is the identity, so no test can see the call; the
//   test pins its outcome (a reply's photo ids survive whatever this device holds).
//
// ---- The screen ----
// Launch argument -ManifestUITestSyncStatus <http status>: the app builds its SyncClient on an
// in-process stub that answers every request with that HTTP status, and a made-up key held in memory
// (no Keychain item is read). The real path runs: client, advisory, view. The line is the element
// with the identifier "sync-advisory" on Packages, Tally and Orphaned, and not on Ledger. Its
// accessibility value is the syncStatus code of the failure ("no-access", "too-big").

import Foundation
@testable import ManifestKit

@MainActor
public final class PressGate {
    public init(engine: RulesEngine, now: @escaping @Sendable () -> Double, sleep: @escaping @Sendable (Int) async -> Void) {}
    public func down() {}
    public func up() {}
    public func cancel() {}
    public func hover() {}
    public func scrolled() {}
    public func isHeld() async -> Bool { false }
    public func waitClear() async {}
}

public protocol SyncSocket: Sendable {
    /// One connection to /ws with the protocols ["mailaudit", key]. Calls `opened` when the handshake
    /// succeeds and `message` for each text frame. Returns when the connection ends for any reason:
    /// a failed open, a close, or a cancel.
    func run(key: String, opened: @escaping @Sendable () -> Void, message: @escaping @Sendable (String) -> Void) async
}

public enum SyncSocketSpec {
    /// https becomes wss, http becomes ws, and the path is /ws. The key is never in it.
    public static func endpoint(_ base: URL) -> URL { base }
    /// The two WebSocket protocols the Worker expects: "mailaudit", then the key.
    public static func protocols(key: String) -> [String] { [] }
}

public enum SyncLine {
    /// nil for no failure. A line for "no-access" (401) and one for "too-big" (413).
    public static func text(for advisory: String?) -> String? { nil }
}

public struct HTTPPhotoTransport: PhotoTransport {
    public init(baseURL: URL, session: URLSession, keys: KeyStore, engine: RulesEngine) {}
    public func list() async throws -> [String]? { ["pho-stub-wrong"] }
    public func put(name: String, data: Data) async throws {}
    public func get(name: String) async throws -> Data? { Data() }
}

extension SyncClient {
    public var rev: Int? { nil }
    public var stats: [String: Int]? { nil }
    public var pressGate: PressGate? { get { nil } set {} }
    public var socket: (any SyncSocket)? { get { nil } set {} }
    public var photoStore: PhotoStore? { get { nil } set {} }
    public func receive(socketMessage: String) async -> SyncOutcome? { .unknown }
    public func keySaved() async -> SyncOutcome { .unknown }
    public func resume() async -> SyncOutcome { .unknown }
    public func connect() {}
}
