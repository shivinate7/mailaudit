// Sync panel model tests (step 4, sync-panel-is-two-column-grid, ledger-tab-holds-options, native-parity-table,
// ruled-head-stale-clock-agreement, native-key-via-url-scheme).
//
// The native Sync panel has two rows, Server and Last sync, and no key row: the key arrives by URL scheme.
// Both values come from the real SyncClient, driven over StubNet, so a panel that reads a copy or a constant
// fails. The wording is the web's `serverStatus` and `lastSyncText` in src/app.jsx.
//
// Red-first. The members below are stubs in Step4RedStubs.swift with wrong values. The builder replaces them.
//
// Contract the tests name (ManifestKit):
//   extension SyncClient   // @MainActor, read on demand, never a copy taken at init
//       public var serverStatus: String
//           // The web's ladder, first match wins:
//           //   no key in the KeyStore                        "No sync key on this device"
//           //   the key lookup throws                         "Not checked"  (could not look is not no key)
//           //   advisory "no-access"                          "Sync key refused"
//           //   advisory "bad-shape"                          "Ledger shape refused"
//           //   advisory "too-big"                            "Ledger too big for the server"
//           //   any other advisory ("unknown")                "Could not be reached"
//           //   otherwise                                     "Connected"
//       public var lastSyncAt: Double?
//           // Milliseconds since 1970 when a call last agreed with the Worker: an adopted reply (200) or a 404
//           // "empty" (a healthy server with nothing stored). nil until then. A failure leaves it alone. After a
//           // 413 only a good POST moves it, as only a good POST clears the size state (web settleReply).
//   public enum SyncPanel {
//       /// "Not yet" for nil, else short month, day, then hour and minute: "Aug 12, 2:03 PM". The locale and the
//       /// time zone are arguments, so a test does not depend on the machine.
//       public static func lastSyncText(_ at: Double?, locale: Locale, timeZone: TimeZone) -> String
//   }
//
// Not pinned, and the builder's call (reported as open questions): whether lastSyncAt survives a relaunch (the web
// keeps workerSyncedAt in its saved state) and whether it is never allowed to move back (the web uses Math.max).
//
// Fake fixtures only: the keys are made up, the Keychain is FakeKeychain, the network is StubNet.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncPanelTests: SyncTestCase {
    static let noKey = "No sync key on this device"
    static let connected = "Connected"
    static let unreachable = "Could not be reached"

    /// The real clock: a lastSyncAt stamped from the store's clock or from Date() both land in the bracket.
    static var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

    func liveStore() throws -> LedgerStore {
        let store = LedgerStore(fileURL: ledgerURL, now: { Self.nowMs })
        try store.load()
        return store
    }

    func assertStamped(_ at: Double?, since lo: Double, _ what: String, line: UInt = #line) throws {
        let t = try XCTUnwrap(at, "\(what): lastSyncAt is nil", line: line)
        XCTAssertGreaterThanOrEqual(t, lo, "\(what): the stamp is older than the call", line: line)
        XCTAssertLessThanOrEqual(t, Self.nowMs, "\(what): the stamp is in the future", line: line)
    }

    // MARK: Server

    /// Each state the client can be in reads as its own line. A fresh client per state, because a 401 stops one.
    func testServerStatusFollowsTheClientsState() async throws {
        let cases: [(String, StubNet.Reply?, String)] = [
            ("a key and no call yet", nil, Self.connected),
            ("a 401", failure(401, "unauthorized"), "Sync key refused"),
            ("a 400", failure(400, "bad ledger"), "Ledger shape refused"),
            ("a 413", failure(413, "too-large"), "Ledger too big for the server"),
            ("a 500", .status(500, Data("boom".utf8)), Self.unreachable),
            ("a transport error", .fail(.notConnectedToInternet), Self.unreachable),
            ("a good reply", ok(try ledger()), Self.connected),
        ]
        let store = try makeStore()
        for (name, reply, expected) in cases {
            net.reset()
            let client = try makeClient(store)
            if let reply {
                net.enqueue(reply)
                _ = await client.push()
            }
            XCTAssertEqual(client.serverStatus, expected, name)
        }
    }

    /// The line follows the one client: down, then up again once a call goes through.
    func testServerStatusRecoversWhenACallGoesThrough() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.status(500, Data("boom".utf8)), ok(try ledger()))
        _ = await client.push()
        XCTAssertEqual(client.serverStatus, Self.unreachable)
        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied)
        XCTAssertEqual(client.serverStatus, Self.connected, "a good reply clears the failure")
    }

    /// No key beats an earlier failure, as the web's ladder puts it first.
    func testNoKeyBeatsAFailure() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.status(500, Data("boom".utf8)))
        _ = await client.push()
        XCTAssertEqual(client.serverStatus, Self.unreachable, "control: the failure shows first")
        try keys.clear()
        XCTAssertEqual(client.serverStatus, Self.noKey, "the key was removed after the failure")
    }

    /// A Keychain item that cannot be read is not a missing key: the web says "Not checked" until it can look.
    func testAnUnreadableKeyIsNotNoKey() async throws {
        let fake = FakeKeychain()
        keys = KeyStore(service: "test.manifest.sync.step4", account: "device-key", backend: fake)
        try keys.save(Self.fakeKey)
        let client = try makeClient(try makeStore())
        XCTAssertEqual(client.serverStatus, Self.connected, "control: the key reads")
        fake.setUnreadable(service: "test.manifest.sync.step4", account: "device-key", true)
        XCTAssertEqual(client.serverStatus, "Not checked")
    }

    // MARK: Last sync

    /// nil until the Worker agrees. A failure leaves the stamp alone. A later good call moves it forward.
    func testLastSyncMovesOnlyWhenTheWorkerAgrees() async throws {
        let store = try liveStore()
        let client = try makeClient(store)
        XCTAssertNil(client.lastSyncAt, "no call yet")

        net.enqueue(ok(try ledger()), .status(500, Data("boom".utf8)), ok(try ledger()))
        let t0 = Self.nowMs
        let first = await client.pull()
        XCTAssertEqual(first, .applied)
        try assertStamped(client.lastSyncAt, since: t0, "after a good pull")
        let stamp = client.lastSyncAt

        let failed = await client.push()
        XCTAssertEqual(failed, .unknown)
        XCTAssertEqual(client.lastSyncAt, stamp, "a failed call is not agreement")

        try await Task.sleep(for: .milliseconds(5))
        let t1 = Self.nowMs
        let again = await client.pull()
        XCTAssertEqual(again, .applied)
        try assertStamped(client.lastSyncAt, since: t1, "after the next good pull")
        XCTAssertGreaterThan(try XCTUnwrap(client.lastSyncAt), try XCTUnwrap(stamp), "the stamp moved forward")
    }

    /// A 404 is a healthy server with nothing stored, so it counts as agreement (web settleReply).
    func testAnEmptyReplyCountsAsAgreement() async throws {
        let store = try liveStore()
        let client = try makeClient(store)
        net.enqueue(failure(404, "empty"))
        let t0 = Self.nowMs
        let outcome = await client.pull()
        XCTAssertEqual(outcome, .empty)
        try assertStamped(client.lastSyncAt, since: t0, "after a 404")
        XCTAssertEqual(client.serverStatus, Self.connected)
    }

    /// After a 413 a good GET leaves the size state, and the stamp, alone. Only the retry's good POST moves both.
    func testOnlyAGoodPostAfterA413MovesTheStamp() async throws {
        let store = try liveStore()
        let client = try makeClient(store)
        net.enqueue(failure(413, "too-large"), ok(try ledger(), rev: 3), ok(try ledger(), rev: 4))
        _ = await client.push()
        XCTAssertEqual(client.serverStatus, "Ledger too big for the server")
        XCTAssertNil(client.lastSyncAt, "a refusal is not agreement")

        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied)
        XCTAssertEqual(client.serverStatus, "Ledger too big for the server", "a good GET leaves the size state")
        XCTAssertNil(client.lastSyncAt, "a good GET during the size state is not agreement")

        let t0 = Self.nowMs
        await until("the retry sleeps") { [self] in gate.delays.count == 1 }
        gate.release()
        await until("the retry POST goes out") { [self] in net.requests.count == 3 }
        await until("a good POST clears the size state") { client.advisory == nil }
        XCTAssertEqual(client.serverStatus, Self.connected)
        try assertStamped(client.lastSyncAt, since: t0, "after the good POST")
    }

    // MARK: the text

    func testNoAgreementReadsNotYet() throws {
        let utc = try XCTUnwrap(TimeZone(identifier: "UTC"))
        XCTAssertEqual(SyncPanel.lastSyncText(nil, locale: Locale(identifier: "en_US"), timeZone: utc), "Not yet")
    }

    /// The web's `toLocaleString([], {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"})`:
    /// "Aug 12, 2:03 PM". 1786543380000 is 2026-08-12 14:03:00 UTC. The time zone argument is the one used.
    /// ICU may write a narrow no-break space before PM, so the spaces are normalised before the comparison.
    /// The system date styles write "Aug 12 at 2:03 PM" on this OS. The web and the design spec write the comma,
    /// so the builder sets the pattern ("MMM d, h:mm a" in en_US), not a system style.
    func testTheTextIsTheWebsShortDateAndTime() throws {
        let en = Locale(identifier: "en_US")
        func text(_ zone: String) throws -> String {
            let tz = try XCTUnwrap(TimeZone(identifier: zone))
            return SyncPanel.lastSyncText(Self.t0, locale: en, timeZone: tz)
                .replacingOccurrences(of: "\u{202F}", with: " ").replacingOccurrences(of: "\u{00A0}", with: " ")
        }
        XCTAssertEqual(try text("UTC"), "Aug 12, 2:03 PM")
        XCTAssertEqual(try text("America/Chicago"), "Aug 12, 9:03 AM", "CDT is five hours behind UTC")
    }
}
