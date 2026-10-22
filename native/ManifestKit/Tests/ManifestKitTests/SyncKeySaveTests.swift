// Key save tests (lane N4b, native-reply-waits-generation, auto-apply-happens-now, native-key-via-url-scheme).
//
// On native the key arrives through the manifestledger:// link (KeyIntake .stored), and there is no paste
// field. The app calls keySaved() when a key was stored. The contract is the header of N4bRedStubs.swift.
//
// - The first reply after a saved key applies at once. No press holds it: not a press that is down, and
//   not the tail of the Save tap's own press, because the person just tapped Save. The next reply waits
//   again. A cold call that fails spends the exception too, or a stuck flag would switch the press gate
//   off for good.
// - Owner ruling, 2026-10-21: "A newly saved key lifts the native 401 stop, as the web does (no
//   relaunch)." The record says "as the web does", and the web lifts the stop on any key save. These tests
//   pin that on the brief's word: saving the SAME key again lifts the stop too. The record's Still open
//   section lists the question; if the owner rules the other way, this test is the one to change.
// - A saved key also clears the failure count, the retry and the too-big state, as the web's
//   saveSyncKey does.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncKeySaveTests: SyncTestCase {
    // A finger is down and stays down. The cold reply applies at once, with no wait. The next reply waits.
    func testAColdReplyAfterAKeySaveAppliesAtOnceAndTheNextOneWaits() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 3), ok(try ledger(received: [Self.keyC: 1, Self.keyB: 1]), rev: 4))

        let cold = start { await client.keySaved() }
        let outcome = await finish(cold)
        XCTAssertEqual(outcome, .applied, "the cold reply does not wait for the finger")
        XCTAssertEqual(store.received()[Self.keyC], 1)
        XCTAssertTrue(rig.sleeps.delays.isEmpty, "the gate never waited")
        XCTAssertEqual(net.requests.map(\.method), ["GET"])

        let next = startHeard { await client.receive(socketMessage: revFrame(4)) }
        await until("the next reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        XCTAssertFalse(next.done, "the exception was for one reply")
        XCTAssertNil(store.received()[Self.keyB])

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        let later = await finishHeard(next)
        XCTAssertEqual(later, .applied)
        XCTAssertEqual(store.received()[Self.keyB], 1)
    }

    // The Save tap is itself a press: it has just lifted, and its tail is running.
    func testTheTailOfTheSaveTapDoesNotHoldTheColdReply() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        rig.gate.up()
        let inTail = await rig.gate.isHeld()
        XCTAssertTrue(inTail, "anchor: the tail of the tap is running")
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 3))

        let outcome = await finish(start { await client.keySaved() })
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(store.received()[Self.keyC], 1)
        XCTAssertTrue(rig.sleeps.delays.isEmpty)
    }

    // A cold call that finds nothing to apply (here a 500) still ends the exception.
    func testAColdCallThatFailsSpendsTheException() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        net.enqueue(.status(500, Data()), ok(try ledger(received: [Self.keyC: 1]), rev: 4))

        let cold = await client.keySaved()
        XCTAssertEqual(cold, .unknown)

        let next = startHeard { await client.receive(socketMessage: revFrame(4)) }
        await until("the next reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        XCTAssertFalse(next.done, "a failed cold call leaves no apply-at-once flag behind")
        XCTAssertNil(store.received()[Self.keyC])

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        let later = await finishHeard(next)
        XCTAssertEqual(later, .applied)
    }

    // MARK: the 401 stop

    // The key is saved again, the same one. The stop lifts, and a call goes out. If the Worker refuses
    // the key again, the stop is back.
    func testSavingTheSameKeyAgainLiftsTheStop() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(401, "unauthorized"), ok(try ledger(), rev: 1), failure(401, "unauthorized"))
        let refused = await client.push()
        XCTAssertEqual(refused, .noAccess)
        let stillStopped = await client.pull()
        XCTAssertEqual(stillStopped, .noAccess)
        XCTAssertEqual(net.requests.count, 1, "anchor: the stop holds until a key is saved")

        let lifted = await client.keySaved()
        XCTAssertEqual(lifted, .applied, "the same key, saved again, lifts the stop")
        XCTAssertEqual(net.requests.map(\.method), ["POST", "GET"])
        XCTAssertEqual(seen(1)?.header("Authorization"), "Bearer \(Self.fakeKey)")
        XCTAssertNil(client.advisory, "the refusal is cleared once a call goes through")

        let refusedAgain = await client.keySaved()
        XCTAssertEqual(refusedAgain, .noAccess, "the Worker refuses it again")
        let pushed = await client.push()
        let pulled = await client.pull()
        XCTAssertEqual(pushed, .noAccess)
        XCTAssertEqual(pulled, .noAccess)
        XCTAssertEqual(net.requests.count, 3, "and the stop is back")
    }

    // MARK: failure state

    // The ledger holds nothing to send, so a good GET adopts. After a 413 only a good POST clears the
    // size state, except that a saved key clears it too. Its retry is cancelled with it.
    func testAKeySaveClearsTheSizeStateAndItsRetry() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(413, "too-large"), ok(try ledger(), rev: 2))
        let big = await client.push()
        XCTAssertEqual(big, .tooBig)
        XCTAssertEqual(client.advisory, "too-big")
        XCTAssertNotNil(client.retryInMs, "anchor: a retry is pending")

        let saved = await client.keySaved()
        XCTAssertEqual(saved, .applied)
        XCTAssertNil(client.advisory, "a saved key clears the size state, which a good GET alone would not")
        XCTAssertNil(client.retryInMs)

        gate.release()
        await settle()
        XCTAssertEqual(net.requests.map(\.method), ["POST", "GET"], "the cancelled retry sent nothing")
        XCTAssertEqual(net.strays, 0)
    }

    func testAKeySaveWithNoKeyInTheStoreSendsNothing() async throws {
        try keys.clear()
        let store = try makeStore()
        let client = try makeClient(store)
        let outcome = await client.keySaved()
        XCTAssertEqual(outcome, .noKey)
        XCTAssertEqual(net.requests.count, 0)
    }
}
