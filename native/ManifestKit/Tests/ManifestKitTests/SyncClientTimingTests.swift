// Sync client tests, part 2: the timeout, the backoff, stop, and the key (lane N4a).
// The contract and the rules these pin are in SyncTestCase.swift. No test here waits on
// a real timer longer than the 50 ms probe limit. The retry delay goes through SleepGate,
// so the test sees each delay and decides when the retry runs.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncTimingTests: SyncTestCase {
    // A call that is never answered reads as unknown after SYNC_TIMEOUT_MS, and the request
    // is abandoned. The probe bundle sets 50 ms. A Swift literal of 10 seconds would leave
    // the call out past the 5 second bound in `finish`.
    func testATimeoutReadsAsUnknown() async throws {
        let probe = try probeBundle("Rules.SYNC_TIMEOUT_MS=50")
        let store = try makeStore()
        let client = try makeClient(store, bundle: probe)
        net.enqueue(.hang, .hang)
        let pushed = await finish(start { await client.push() })
        let pulled = await finish(start { await client.pull() })
        XCTAssertEqual(pushed, .unknown)
        XCTAssertEqual(pulled, .unknown)
        XCTAssertEqual(client.advisory, "unknown")
        await until("both requests are abandoned") { [self] in net.wasCancelled(0) && net.wasCancelled(1) }
        XCTAssertEqual(store.generation, 0)
    }

    // Retries follow backoffMs(n) from the bundle. The probe makes it 100, 101, 102, so a
    // client that doubles on its own, or always asks for attempt 0, fails. A push inside the
    // window sends nothing. A good reply starts the count over.
    func testRetriesFollowTheBundleBackoffAndASuccessResetsIt() async throws {
        let probe = try probeBundle("Rules.backoffMs=function(a){return 100+a}")
        let store = try makeStore()
        let client = try makeClient(store, bundle: probe)
        net.enqueue(
            .status(500, Data()), .status(500, Data()), .status(500, Data()),
            ok(try ledger()), .status(500, Data()))

        let first = await client.push()
        XCTAssertEqual(first, .unknown)
        XCTAssertEqual(client.retryInMs, 100)
        let inside = await client.push()
        XCTAssertEqual(inside, .backingOff, "a push inside the window sends nothing")
        XCTAssertEqual(net.requests.count, 1)

        await until("the first retry sleeps 100") { [self] in gate.delays == [100] }
        gate.release()
        await until("the second retry sleeps 101") { [self] in gate.delays == [100, 101] }
        XCTAssertEqual(client.retryInMs, 101)
        gate.release()
        await until("the third retry sleeps 102") { [self] in gate.delays == [100, 101, 102] }
        XCTAssertEqual(client.retryInMs, 102)
        gate.release()
        await until("a good retry clears the backoff") { [self] in
            net.requests.count == 4 && client.retryInMs == nil && client.advisory == nil
        }
        XCTAssertEqual(net.requests.map(\.method), ["POST", "POST", "POST", "POST"], "each retry is a POST")

        let again = await client.push()
        XCTAssertEqual(again, .unknown)
        XCTAssertEqual(client.retryInMs, 100, "the count started over")
        await until("the next retry sleeps 100 again") { [self] in gate.delays == [100, 101, 102, 100] }
    }

    // A failed GET backs off the same way. With the real bundle the first delay is backoffMs(0).
    func testAFailedPullBacksOffToo() async throws {
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let said = try await engine.call("backoffMs", "[0]")
        let first = try XCTUnwrap(Int(said))
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.status(503, Data()))
        let outcome = await client.pull()
        XCTAssertEqual(outcome, .unknown)
        XCTAssertEqual(client.retryInMs, first)
        await until("the retry sleeps") { [self] in gate.delays == [first] }
    }

    // stop() cancels a GET that is out. The call returns stopped, the request is abandoned,
    // a reply that comes later has nowhere to go, and a stop is not a failure.
    func testStopCancelsAnInFlightPull() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hold)
        let call = start { await client.pull() }
        let arrived = await net.waitForRequests(1)
        XCTAssertTrue(arrived, "the GET left")
        client.stop()
        let outcome = await finish(call)

        XCTAssertEqual(outcome, .stopped)
        await until("the request is abandoned") { [self] in net.wasCancelled(0) }
        let late = net.release(0, ok(try ledger(received: [Self.marker: 5])))
        XCTAssertFalse(late, "no request is left to answer")
        XCTAssertNil(store.received()[Self.marker], "a reply after stop is not adopted")
        XCTAssertNil(client.advisory, "a stop is not a failure")
        XCTAssertNil(client.retryInMs, "a stop schedules no retry")
        XCTAssertEqual(net.requests.count, 1)
    }

    // The same for a POST.
    func testStopCancelsAnInFlightPush() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hang)
        let call = start { await client.push() }
        let arrived = await net.waitForRequests(1)
        XCTAssertTrue(arrived, "the POST left")
        client.stop()
        let outcome = await finish(call)

        XCTAssertEqual(outcome, .stopped)
        await until("the request is abandoned") { [self] in net.wasCancelled(0) }
        XCTAssertNil(client.advisory, "a stop is not a failure")
        XCTAssertNil(client.retryInMs, "a stop schedules no retry")
        XCTAssertEqual(net.requests.count, 1)
    }

    // the-token-is-a-credential: after calls that succeeded and one that was refused, the
    // key is in no request body, not in the client, not in the store, not in the file.
    func testNoKeyTextReachesTheClientTheStoreOrABody() async throws {
        try writeLedger(received: [Self.keyA: 1])
        // The masked Keychain hides the key from the scan, so only a copy made by the client is found.
        keys = KeyStore(service: "test.manifest.sync.n4a", account: "device-key", backend: MaskedKeychain())
        try keys.save(Self.fakeKey)
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyA: 1])), failure(401, "unauthorized"))
        let pushed = await client.push()
        let pulled = await client.pull()
        XCTAssertEqual(pushed, .applied)
        XCTAssertEqual(pulled, .noAccess)

        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: client), "the client holds no key text")
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: store), "the store holds no key text")
        for s in net.requests {
            XCTAssertFalse(String(decoding: s.body, as: UTF8.self).contains(Self.fakeKey), "no body carries the key")
        }
        let file = String(decoding: try Data(contentsOf: ledgerURL), as: UTF8.self)
        XCTAssertFalse(file.contains(Self.fakeKey), "the ledger file holds no key")
        // Controls: the scan finds a key that is held as text, and the masked store itself does not
        // show it. Without them the lines above could not fail.
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: ["held": Self.fakeKey]))
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: keys as Any), "the masked store hides the key")
        XCTAssertEqual(try keys.key(), Self.fakeKey, "and still returns it")
    }
}
