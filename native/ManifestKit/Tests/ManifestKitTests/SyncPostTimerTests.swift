// Post timer tests (lane N4b, sync-runs-itself, auto-apply-happens-now).
//
// The owner's goal is a check-in on the phone that shows on the Mac within seconds. The web POSTs
// SYNC_POST_MS after a change. The timer arms once per burst: a change while it waits does not move
// it, and a fire leaves it free to arm again (web tests 75.9 and 75.10). Native has no such timer:
// nothing in the app calls push(), so a check-in uploads only on the next foreground, a {rev} frame
// or a key save.
//
// Red-first. No new type is named; the contract is on the types that exist:
// - A SyncClient built with a store watches that store's local saves from then on. No call arms it,
//   so the app cannot forget to. A local save is a write the person made: commitReceived, commit(_:)
//   and commitPhoto. A reply the client adopts is also a save inside LedgerStore. It is not local and
//   arms nothing, or the reply to each POST would arm the next POST.
// - A local save while the timer is idle arms it: the injected `sleep` is called once, with
//   SYNC_POST_MS read from the rules bundle (never a Swift copy). When that sleep returns, the client
//   POSTs the ledger as it stands then, and the timer is idle again.
// - A save while the timer waits does not move it: `sleep` is not called again.
// - With no key nothing leaves (the N4a rule). The check-in goes up with the next POST that has a key.
// - stop() cancels a pending timer. SleepGate does not end a sleep on a cancel, so the client must
//   look at its task after the sleep, as the retry does.
// The sleep is the gate, so these tests see the delay and decide when it ends; the real wait is the
// sleep's job. A real 0.5 s gap between saves adds nothing the gate does not already show: a second
// `sleep` call is the re-arm.
//
// Each case first waits for the timer to arm, the one thing that must happen. At head that wait times
// out and the case stops there, so the red run names one cause: nothing arms the timer.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncPostTimerTests: SyncTestCase {
    /// SYNC_POST_MS from the bundle, as the client must read it.
    private func postMs(_ bundle: URL = RulesGoldenTests.bundleURL) async throws -> Int {
        let said = try await RulesEngine(bundleURL: bundle).constant("SYNC_POST_MS")
        return try XCTUnwrap(Int(said), "SYNC_POST_MS is a whole number of ms")
    }

    /// Waits until `count` sleeps were asked for. False (and a failure) when the timer never armed.
    private func armed(_ what: String, count: Int = 1, line: UInt = #line) async -> Bool {
        await until(what, line: line) { [self] in gate.delays.count >= count }
        return gate.delays.count >= count
    }

    // One check-in arms one timer with the bundle's delay. Nothing leaves before it returns. Then one
    // POST leaves with the check-in in it, and nothing else follows. The probe makes the delay 1234,
    // so a Swift copy of 3000 fails.
    func testALocalCheckInPostsOnceAfterTheBundleDelay() async throws {
        let probe = try probeBundle("Rules.SYNC_POST_MS=1234")
        let said = try await RulesEngine(bundleURL: probe).constant("SYNC_POST_MS")
        XCTAssertEqual(said, "1234", "control: the probe replaced the constant")
        let store = try makeStore()
        let client = try makeClient(store, bundle: probe)
        net.enqueue(ok(try ledger(received: [Self.keyA: 1])))

        try store.commitReceived(Self.keyA, count: 1)
        guard await armed("a local check-in arms the POST timer") else { return }
        XCTAssertEqual(gate.delays, [1234], "one timer, and its delay comes from the bundle")
        XCTAssertEqual(net.requests.count, 0, "nothing leaves before the timer returns")

        gate.release()
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the POST left when the timer returned")
        XCTAssertEqual(seen(0)?.method, "POST")
        XCTAssertEqual(seen(0)?.path, "/ledger")
        XCTAssertEqual(sentReceived(seen(0))?[Self.keyA] as? Int, 1, "the POST carries the check-in")
        await until("the reply is adopted") { [self] in client.rev == 1 }
        await settle()
        XCTAssertEqual(net.requests.count, 1, "one POST")
        XCTAssertEqual(net.strays, 0)
    }

    // A burst of saves arms the timer at the first save and not again. The one POST carries the last
    // save, and the fire arms nothing more: the saves made while it waited are in that POST.
    func testABurstArmsTheTimerOnceAndOnePostCarriesTheLastSave() async throws {
        let post = try await postMs()
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyA: 2, Self.keyB: 1])))

        try store.commitReceived(Self.keyA, count: 1)
        guard await armed("the first save of the burst arms the POST timer") else { return }
        try store.commitReceived(Self.keyA, count: 2)
        try store.commitReceived(Self.keyB, count: 1)
        await settle()
        XCTAssertEqual(gate.delays, [post], "later saves do not move the timer: a re-armed timer would sleep again")
        XCTAssertEqual(net.requests.count, 0)

        gate.release()
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the POST left")
        XCTAssertEqual(sentReceived(seen(0))?[Self.keyA] as? Int, 2, "the POST carries the latest count")
        XCTAssertEqual(sentReceived(seen(0))?[Self.keyB] as? Int, 1, "and the save made after it")
        await until("the reply is adopted") { [self] in client.rev == 1 }
        await settle()
        XCTAssertEqual(net.requests.count, 1, "one POST for the whole burst")
        XCTAssertEqual(gate.delays, [post], "the fire armed nothing more")
    }

    // The timer is idle once it fires, so the next check-in arms a new one. A timer that stayed armed
    // would carry the first check-in of the day and none after it.
    func testASaveAfterTheTimerFiredArmsANewOne() async throws {
        let post = try await postMs()
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(
            ok(try ledger(received: [Self.keyA: 1]), rev: 1),
            ok(try ledger(received: [Self.keyA: 1, Self.keyB: 1]), rev: 2))

        try store.commitReceived(Self.keyA, count: 1)
        guard await armed("the first check-in arms the POST timer") else { return }
        gate.release()
        await until("the first reply is adopted") { [self] in client.rev == 1 }

        try store.commitReceived(Self.keyB, count: 1)
        guard await armed("a check-in after the fire arms a new timer", count: 2) else { return }
        XCTAssertEqual(gate.delays, [post, post])
        XCTAssertEqual(net.requests.count, 1, "the second POST waits for its timer")
        gate.release()
        let out = await net.waitForRequests(2)
        XCTAssertTrue(out, "the second POST left")
        XCTAssertEqual(net.requests.map(\.method), ["POST", "POST"])
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyA] as? Int, 1)
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyB] as? Int, 1, "the second POST carries the new check-in")
        await until("the second reply is adopted") { [self] in client.rev == 2 }
    }

    // Adopting a reply saves the store, and that save is not the person's. The POST's own reply and a
    // GET's reply arm nothing. A client that arms on every save posts forever.
    func testAnAdoptedReplyArmsNoTimer() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(
            ok(try ledger(received: [Self.keyA: 1]), rev: 1),
            ok(try ledger(received: [Self.keyA: 1, Self.keyC: 1]), rev: 2))

        try store.commitReceived(Self.keyA, count: 1)
        guard await armed("the check-in arms the POST timer") else { return }
        gate.release()
        await until("the POST's reply is adopted") { [self] in client.rev == 1 }
        await settle()
        XCTAssertEqual(gate.delays.count, 1, "the reply to the POST armed nothing")

        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied)
        XCTAssertEqual(store.received()[Self.keyC], 1, "anchor: the GET's reply was adopted, so the store saved it")
        await settle()
        XCTAssertEqual(gate.delays.count, 1, "the reply to the GET armed nothing")
        XCTAssertEqual(net.requests.map(\.method), ["POST", "GET"])
    }

    // With no key a save sends nothing, even when the timer returns at once. The check-in is not lost:
    // once a key is saved, the next save arms the timer and that POST carries both check-ins.
    func testASaveWithNoKeyPostsNothingAndTheNextKeyedPostCarriesIt() async throws {
        try keys.clear()
        let store = try makeStore()
        _ = try makeClient(store)
        gate.release()  // kept until a sleep asks: a timer armed with no key returns at once
        try store.commitReceived(Self.keyA, count: 1)
        await settle()
        XCTAssertEqual(net.requests.count, 0, "no key, no request")
        XCTAssertEqual(net.strays, 0)

        // The control: the same kind of save with a key goes up, so the silence above is the key's doing.
        try keys.save(Self.fakeKey)
        let before = gate.delays.count
        net.enqueue(ok(try ledger(received: [Self.keyA: 1, Self.keyB: 1])))
        try store.commitReceived(Self.keyB, count: 1)
        guard await armed("a save with a key arms the POST timer", count: before + 1) else { return }
        gate.release()
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the POST left once a key was saved")
        XCTAssertEqual(sentReceived(seen(0))?[Self.keyA] as? Int, 1, "the check-in made with no key goes up too")
        XCTAssertEqual(sentReceived(seen(0))?[Self.keyB] as? Int, 1)
        XCTAssertEqual(net.requests.count, 1)
    }

    // stop() cancels a timer that is waiting. The sleep is released after the stop, as a timer that
    // ran out would be; a timer the stop did not cancel POSTs then, with no reply queued.
    func testStopCancelsAPendingPost() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        try store.commitReceived(Self.keyA, count: 1)
        guard await armed("the check-in arms the POST timer") else { return }

        client.stop()
        gate.release()
        await settle()
        XCTAssertEqual(net.requests.count, 0, "the stop cancelled the pending POST")
        XCTAssertEqual(net.strays, 0)
        XCTAssertNil(client.advisory, "a stop is not a failure")
        XCTAssertNil(client.retryInMs, "a stop schedules no retry")
    }

    // Every write the person makes arms the timer, not only a check-in: an envelope from Orphaned and
    // a photo on an envelope are saves too. Each write gets a new store, client and gate, and
    // is left unreleased.
    func testEveryLocalWriterArmsTheTimer() async throws {
        let writers: [(String, (LedgerStore) throws -> Void)] = [
            ("a check-in", { try $0.commitReceived(Self.keyA, count: 1) }),
            ("an envelope edit", { s in try s.commit { s.addEnvelope(["id": "e2"]) } }),
            ("a photo", { try $0.commitPhoto("p1", toEnvelope: "e1") }),
        ]
        for (name, write) in writers {
            gate = SleepGate()
            let store = try makeStore()
            store.addEnvelope(["id": "e1"])  // in memory only, before the client exists
            let client = try makeClient(store)
            try write(store)
            guard await armed("\(name) arms the POST timer") else { return }
            XCTAssertEqual(gate.delays.count, 1, "\(name) arms one timer")
            client.stop()
        }
    }
}
