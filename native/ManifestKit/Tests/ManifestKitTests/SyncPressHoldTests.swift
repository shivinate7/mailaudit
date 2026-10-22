// Press hold tests (lane N4b, auto-apply-happens-now, native-reply-waits-generation).
//
// A reply from the other device waits while a press is down and for PRESS_TAIL_MS after it, so the list
// never moves under a finger (no-layout-shift-under-pointer). Hover and scroll never hold. An open
// Undo never holds (owner, 2026-10-21 13:30 CDT), see SyncApplyKeepsTests. The first reply after a key
// is saved applies at once, see SyncKeySaveTests. The contract is the header of N4bRedStubs.swift.
//
// The hold is the data-loss case. A tap that lands during the hold changes the ledger. The held reply
// is then old, and the client must POST the tap and not adopt over it. Two tests pin that, one for a
// GET reply and one for a POST reply.
//
// Not pinned by ST: the armed guards of the web (a composer draft, an armed Reset). Native has no
// composer-hold or armed-Reset rule yet.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncPressHoldTests: SyncTestCase {
    // The reply waits while the finger is down and through the tail, to the millisecond.
    func testAReplyHoldsWhileAPressIsDownAndForTheTailAfterIt() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 6))
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        await until("the reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        XCTAssertFalse(heard.done, "a finger is down: the reply is held")
        XCTAssertNil(store.received()[Self.keyC], "nothing is applied yet")
        XCTAssertEqual(store.generation, 0)

        rig.sleeps.release()
        await until("it looks again while the finger is down", timeout: 1) { rig.sleeps.delays.count >= 2 }
        XCTAssertFalse(heard.done)

        rig.gate.up()
        rig.advance(rig.tail - 1)
        rig.sleeps.release()
        await until("it looks again inside the tail", timeout: 1) { rig.sleeps.delays.count >= 3 }
        XCTAssertFalse(heard.done, "one millisecond short of the tail still holds")
        XCTAssertNil(store.received()[Self.keyC])

        rig.advance(1)
        rig.sleeps.release()
        let outcome = await finishHeard(heard)
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(store.received()[Self.keyC], 1, "applied once the tail is over")
    }

    // The press can start after the GET left. The gate is read when the reply is about to apply.
    func testAPressThatStartsWhileTheGetIsOutHoldsTheReply() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        net.enqueue(.hold)
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the GET left with no press down")

        rig.gate.down()
        net.release(0, ok(try ledger(received: [Self.keyC: 1]), rev: 6))
        await until("the reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        XCTAssertFalse(heard.done, "a press that began mid-flight holds the reply")
        XCTAssertNil(store.received()[Self.keyC])

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        let outcome = await finishHeard(heard)
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // Hover and scroll never hold. A press that ended long ago holds nothing. The reply applies at once,
    // and the gate is never asked to sleep.
    func testHoverAndScrollNeverHoldAReply() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        rig.gate.up()
        rig.advance(rig.tail)
        rig.gate.hover()
        rig.gate.scrolled()
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 6))
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        let outcome = await finishHeard(heard)
        XCTAssertEqual(outcome, .applied, "nothing holds it")
        XCTAssertTrue(rig.sleeps.delays.isEmpty, "the gate never waited")
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // A POST reply is a reply too. The gate is the one door every adopt passes.
    func testAPostReplyHoldsToo() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 2))
        let post = start { await client.push() }
        await until("the POST's reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        XCTAssertNil(post.outcome)
        XCTAssertNil(store.received()[Self.keyC])

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        let outcome = await finish(post)
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // MARK: a tap during the hold

    // The tap that ends a press changes the ledger before the hold ends. The held GET reply is then old.
    // Adopting it would erase the tap. The client drops it and POSTs the tap (native-reply-waits-generation).
    func testATapDuringTheHoldPostsInsteadOfAdopting() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        let stale = try ledger(received: [Self.marker: 5])
        let merged = try ledger(received: [Self.keyB: 1, Self.keyC: 1])
        rig.gate.down()
        net.enqueue(ok(stale, rev: 6), ok(merged, rev: 7))
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        await until("the reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        store.setReceived(Self.keyB, count: 1)  // the tap's own check-in, during the hold

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        let outcome = await finishHeard(heard)
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET", "POST"], "the held reply was dropped and the tap was sent")
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyB] as? Int, 1, "the POST carries the tap")
        XCTAssertNil(store.received()[Self.marker], "the old reply was not adopted")
        XCTAssertEqual(store.received()[Self.keyB], 1, "the tap survived")
        XCTAssertEqual(store.received()[Self.keyC], 1, "the Worker's merge was adopted")
    }

    func testATapDuringAPostRepliesHoldPostsAgain() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        let stale = try ledger(received: [Self.marker: 5])
        let merged = try ledger(received: [Self.keyB: 1, Self.keyC: 1])
        rig.gate.down()
        net.enqueue(ok(stale, rev: 2), ok(merged, rev: 3))
        let post = start { await client.push() }
        await until("the reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }
        store.setReceived(Self.keyB, count: 1)

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        let outcome = await finish(post)
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["POST", "POST"])
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyB] as? Int, 1, "the second POST carries the tap")
        XCTAssertNil(store.received()[Self.marker])
        XCTAssertEqual(store.received()[Self.keyB], 1)
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // MARK: stop

    // A stop ends a hold. The reply is not applied, then or later.
    func testStopEndsAHeldReplyWithoutApplyingIt() async throws {
        let store = try makeStore()
        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        rig.gate.down()
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 6))
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        await until("the reply waits on the press", timeout: 1) { rig.sleeps.delays.count >= 1 }

        client.stop()
        let outcome = await finishHeard(heard)
        XCTAssertEqual(outcome, .stopped)

        rig.gate.up()
        rig.advance(rig.tail)
        rig.sleeps.release()
        await settle()
        XCTAssertNil(store.received()[Self.keyC], "a stopped call applies nothing")
        XCTAssertEqual(store.generation, 0)
    }
}
