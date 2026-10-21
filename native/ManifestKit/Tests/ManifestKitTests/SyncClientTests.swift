// Sync client tests, part 1: the wire, the reply rule and the status codes (lane N4a).
// The contract and the rules these pin are in SyncTestCase.swift. Part 2 (timeout,
// backoff, stop, key text) is in SyncClientTimingTests.swift.

import Foundation
import XCTest
@testable import ManifestKit

// MARK: the wire

final class SyncWireTests: SyncTestCase {
    // Each verb sends the Bearer header. The key is in the header and nowhere in the URL.
    func testPushAndPullEachSendTheBearerKey() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let echo = try ledger()
        net.enqueue(ok(echo), ok(echo))
        let pushed = await client.push()
        let pulled = await client.pull()
        XCTAssertEqual(pushed, .applied)
        XCTAssertEqual(pulled, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["POST", "GET"])
        for s in net.requests {
            XCTAssertEqual(s.path, "/ledger")
            XCTAssertEqual(s.url.host(), StubNet.host)
            XCTAssertEqual(s.header("Authorization"), "Bearer \(Self.fakeKey)")
            XCTAssertFalse(s.url.absoluteString.contains(Self.fakeKey), "the key never rides in the URL")
        }
        XCTAssertEqual(seen(0)?.header("Content-Type"), "application/json")
        XCTAssertEqual(seen(1)?.body, Data(), "a GET carries no body")
        XCTAssertEqual(net.strays, 0)
    }

    // The key is read when the request is made, so a key saved between two calls
    // reaches the second (native-key-via-url-scheme: the sync client reads the key at request time).
    func testTheKeyIsReadAtRequestTime() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let echo = try ledger()
        net.enqueue(ok(echo), ok(echo))
        _ = await client.push()
        try keys.save(Self.otherFakeKey)
        _ = await client.push()
        XCTAssertEqual(
            net.requests.map { $0.header("Authorization") },
            ["Bearer \(Self.fakeKey)", "Bearer \(Self.otherFakeKey)"])
    }

    // With no key, nothing leaves the device.
    func testNoKeySendsNothing() async throws {
        try keys.clear()
        let store = try makeStore()
        let client = try makeClient(store)
        let pushed = await client.push()
        let pulled = await client.pull()
        XCTAssertEqual(pushed, .noKey)
        XCTAssertEqual(pulled, .noKey)
        XCTAssertEqual(net.requests.count, 0)
        XCTAssertEqual(net.strays, 0)
        XCTAssertNil(client.retryInMs, "no key is not a server failure, so nothing is retried")
    }

    // The body is {ledger} and nothing else. The ledger is the store's, with `mailday` 1
    // and a field the client does not know (native-ledger-is-raw-json).
    func testThePostBodyIsOneLedgerObject() async throws {
        let future: [String: Any] = ["nested": [1, "two", true] as [Any], "flag": false]
        try writeLedger(extra: ["futureField": future])
        let store = try makeStore()
        store.setReceived(Self.keyA, count: 2)
        try store.save()
        let onDisk = try readSaved()
        let client = try makeClient(store)
        net.enqueue(ok(onDisk))
        _ = await client.push()

        let sent = try XCTUnwrap(seen(0))
        XCTAssertEqual(sent.method, "POST")
        let object = try XCTUnwrap(sent.json, "the body is a JSON object")
        XCTAssertEqual(Set(object.keys), ["ledger"], "the body holds the ledger and nothing else")
        let ledger = try XCTUnwrap(object["ledger"] as? [String: Any])
        XCTAssertEqual(ledger["mailday"] as? Int, 1)
        XCTAssertEqual((ledger["received"] as? [String: Any])?[Self.keyA] as? Int, 2)
        assertSameJSON(ledger["items"], try fixtureItems(), "the lines travel")
        assertSameJSON(ledger["futureField"], future, "an unknown field travels")
        assertSameJSON(ledger, onDisk, "the body ledger is the store's ledger")
    }
}

// MARK: the reply rule

final class SyncReplyTests: SyncTestCase {
    // Control: with no edit in flight, the reply is adopted, saved, and one POST goes out.
    func testAReplyIsAdoptedWhenTheLedgerDidNotChange() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyA: 1, Self.keyC: 1]), rev: 7))
        let outcome = await client.push()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.count, 1)
        XCTAssertEqual(store.received()[Self.keyA], 1)
        XCTAssertEqual(store.received()[Self.keyC], 1, "the other device's check-in arrived")
        let saved = try readSaved()
        XCTAssertEqual((saved["received"] as? [String: Any])?[Self.keyC] as? Int, 1, "the adopted ledger is saved")
    }

    // The generation rule. The ledger changes while a POST is out. The reply is dropped,
    // so the edit is not erased, and the client POSTs again with the edit in it.
    func testAnEditWhileAPostIsOutDropsTheReplyAndPostsAgain() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let stale = try ledger(received: [Self.marker: 5])
        let merged = try ledger(received: [Self.keyB: 1, Self.keyC: 1])
        net.enqueue(.hold, ok(merged, rev: 9))
        let call = start { await client.push() }
        let arrived = await net.waitForRequests(1)
        XCTAssertTrue(arrived, "the first POST left")
        store.setReceived(Self.keyB, count: 1)  // the edit, while the POST is out
        net.release(0, ok(stale, rev: 8))
        let outcome = await finish(call)

        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["POST", "POST"])
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyB] as? Int, 1, "the second POST carries the edit")
        XCTAssertNil(store.received()[Self.marker], "the stale reply was not adopted")
        XCTAssertEqual(store.received()[Self.keyB], 1, "the edit survived")
        XCTAssertEqual(store.received()[Self.keyC], 1, "the second reply was adopted")
    }

    // The same rule for a GET. The reply is dropped and the client POSTs, so the edit goes up.
    func testAnEditWhileAPullIsOutDropsTheReplyAndPostsInstead() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let stale = try ledger(received: [Self.marker: 5])
        let merged = try ledger(received: [Self.keyB: 1, Self.keyC: 1])
        net.enqueue(.hold, ok(merged, rev: 9))
        let call = start { await client.pull() }
        let arrived = await net.waitForRequests(1)
        XCTAssertTrue(arrived, "the GET left")
        store.setReceived(Self.keyB, count: 1)
        net.release(0, ok(stale, rev: 8))
        let outcome = await finish(call)

        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET", "POST"])
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyB] as? Int, 1, "the POST carries the edit")
        XCTAssertNil(store.received()[Self.marker], "the stale reply was not adopted")
        XCTAssertEqual(store.received()[Self.keyB], 1)
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // Control for the next two: a fresh phone, with nothing of its own, takes the
    // server copy in one GET and sends nothing ("a fresh phone recovers in one step").
    func testAFreshLedgerAdoptsTheServerCopy() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyC: 3]), rev: 4))
        let outcome = await client.pull()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
        XCTAssertEqual(store.received()[Self.keyC], 3)
        XCTAssertEqual((try readSaved()["received"] as? [String: Any])?[Self.keyC] as? Int, 3)
    }

    // imports-merge-never-replace. The file holds a check-in no reply has carried yet
    // (an earlier session, or a POST that failed). A GET reply that lacks it must not
    // erase it, and the check-in must go up.
    func testAPullNeverErasesACheckInFromAnEarlierSession() async throws {
        try writeLedger(received: [Self.keyA: 2])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 5), ok(try ledger(received: [Self.keyA: 2, Self.keyC: 1]), rev: 6))
        _ = await client.pull()
        XCTAssertEqual(store.received()[Self.keyA], 2, "the check-in is still in the store")
        XCTAssertEqual((try readSaved()["received"] as? [String: Any])?[Self.keyA] as? Int, 2, "and in the file")
        XCTAssertEqual(seen(net.requests.count - 1)?.method, "POST", "the check-in is sent to the server")
        XCTAssertEqual(sentReceived(seen(net.requests.count - 1))?[Self.keyA] as? Int, 2)
    }

    // The same, for an edit made after the client's last adopted reply.
    func testAPullNeverErasesAnEditMadeSinceTheLastSync() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(
            ok(try ledger()),  // the first push, carried
            ok(try ledger(received: [Self.keyC: 1]), rev: 5),  // the GET lacks the edit
            ok(try ledger(received: [Self.keyB: 1, Self.keyC: 1]), rev: 6))
        let first = await client.push()
        XCTAssertEqual(first, .applied)
        store.setReceived(Self.keyB, count: 1)
        try store.save()
        _ = await client.pull()
        XCTAssertEqual(store.received()[Self.keyB], 1, "the edit is still in the store")
        XCTAssertEqual(seen(net.requests.count - 1)?.method, "POST", "the edit is sent to the server")
        XCTAssertEqual(sentReceived(seen(net.requests.count - 1))?[Self.keyB] as? Int, 1)
    }

    // native-ledger-is-raw-json: "every path data comes in". A reply with a damaged entry is
    // copied first, as it came, then mended, and the rest is kept. The file holds the mend.
    func testADamagedReplyIsKeptThenMended() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        var damaged = try ledger()
        damaged["received"] = [Self.keyA: 1, "A9|0|pBroken": "x"] as [String: Any]
        net.enqueue(ok(damaged))
        let outcome = await client.push()
        XCTAssertEqual(outcome, .applied)
        assertSameJSON(try readSaved()["received"], [Self.keyA: 1], "the broken entry is dropped, the rest kept")
        let copies = try keptCopies()
        XCTAssertEqual(copies.count, 1, "the reply was copied before the mend")
        if let copy = copies.first {
            let kept = try JSONSerialization.jsonObject(with: Data(contentsOf: copy))
            assertSameJSON(kept, damaged, "the copy holds the reply as it came")
        }
    }
}

// MARK: the status codes

final class SyncStatusTests: SyncTestCase {
    // A 401 stops this client. No call leaves, and nothing is retried. A new client (a relaunch) calls again.
    func testA401StopsAllCalls() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(401, "unauthorized"), ok(try ledger()))
        let first = await client.push()
        XCTAssertEqual(first, .noAccess)
        XCTAssertEqual(client.advisory, "no-access")
        XCTAssertNil(client.retryInMs, "a refused key is not retried")
        let again = await client.push()
        let pulled = await client.pull()
        XCTAssertEqual(again, .noAccess)
        XCTAssertEqual(pulled, .noAccess)
        XCTAssertEqual(net.requests.count, 1, "no call leaves after a 401")

        let relaunched = try makeClient(store)
        let fresh = await relaunched.push()
        XCTAssertEqual(fresh, .applied, "a new client calls again")
        XCTAssertEqual(net.requests.count, 2)
    }

    // A 413 is its own state. It is not "could not be reached", and the ledger is untouched.
    func testA413IsTheSizeStateAndNotTheUnreachableState() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(413, "too-large"))
        let outcome = await client.push()
        XCTAssertEqual(outcome, .tooBig)
        XCTAssertEqual(client.advisory, "too-big")
        XCTAssertEqual(store.generation, 0, "a refusal changes nothing")
        XCTAssertEqual(store.received(), [Self.keyA: 1])
    }

    // The size state clears by a good POST only. A good GET in between leaves it, and
    // the retry then POSTs and clears it.
    func testOnlyAGoodPostClearsTheSizeState() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(
            failure(413, "too-large"),
            ok(try ledger(received: [Self.keyC: 1]), rev: 3),
            ok(try ledger(received: [Self.keyC: 1]), rev: 4))
        _ = await client.push()
        XCTAssertEqual(client.advisory, "too-big")
        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied)
        XCTAssertEqual(client.advisory, "too-big", "a good GET does not clear the size state")
        await until("the retry sleeps") { [self] in gate.delays.count == 1 }
        gate.release()
        await until("the retry POST goes out") { [self] in net.requests.count == 3 }
        await until("a good POST clears the size state") { [self] in client.advisory == nil }
        XCTAssertEqual(seen(2)?.method, "POST")
        XCTAssertNil(client.retryInMs)
    }

    // A 400 stays refused: no retry. The next call POSTs again, and a good one clears it.
    func testABadShapeStartsNoBackoff() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(400, "bad ledger"), ok(try ledger()))
        let first = await client.push()
        XCTAssertEqual(first, .badShape)
        XCTAssertEqual(client.advisory, "bad-shape")
        XCTAssertNil(client.retryInMs, "a refused shape is not retried")
        let second = await client.push()
        XCTAssertEqual(second, .applied, "the next change goes out at once")
        XCTAssertEqual(net.requests.count, 2)
        XCTAssertNil(client.advisory)
    }

    // A 404 means the store is not seeded. A ledger that holds a check-in, an envelope or a
    // stamp seeds it by POST. (sync-revamp-cloudflare: an empty store gets seeded.)
    func testA404SeedsByPostWhenTheLedgerHoldsUserData() async throws {
        let holds: [(String, [String: Any])] = [
            ("a check-in", ["received": [Self.keyA: 1]]),
            ("an envelope", ["envelopes": [["id": "e1"]]]),
            ("a stamp", ["stamps": ["A1::Alpha Cards": ["kind": "refund", "note": "", "at": "2026-08-01", "updatedAt": Self.t0]]]),
        ]
        for (name, extra) in holds {
            net.reset()
            try writeLedger(extra: extra)
            let store = try makeStore()
            let client = try makeClient(store)
            net.enqueue(failure(404, "empty"), ok(try ledger(extra: extra)))
            let outcome = await client.pull()
            XCTAssertEqual(net.requests.map(\.method), ["GET", "POST"], "\(name) seeds the store")
            XCTAssertNotNil(seen(1)?.json?["ledger"], "\(name): the POST carries the ledger")
            XCTAssertEqual(outcome, .applied, name)
            XCTAssertNil(client.advisory, "\(name): an empty store is healthy")
        }
    }

    // Control: lines alone are not user data. They come back from a CSV, so a 404 seeds nothing.
    func testA404SeedsNothingWhenTheLedgerHoldsOnlyLines() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(404, "empty"))
        let outcome = await client.pull()
        XCTAssertEqual(outcome, .empty)
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
        XCTAssertNil(client.advisory)
        XCTAssertNil(client.retryInMs)
    }

    // rules-run-in-javascriptcore: the status maps through `syncStatus` in the bundle. The
    // probe bundle calls a 418 "too-big" and a 413 "unknown", so a Swift copy of the map fails both.
    func testTheStatusMapComesFromTheBundle() async throws {
        let probe = try probeBundle(#"Rules.syncStatus=function(s){return s===418?"too-big":"unknown"}"#)
        let store = try makeStore()
        net.enqueue(failure(418, "teapot"), failure(413, "too-large"))
        let teapot = try makeClient(store, bundle: probe)
        let first = await teapot.push()
        XCTAssertEqual(first, .tooBig, "the bundle's code decides")
        XCTAssertEqual(teapot.advisory, "too-big")
        let plain = try makeClient(store, bundle: probe)
        let second = await plain.push()
        XCTAssertEqual(second, .unknown, "the bundle's code decides, not the number")
        XCTAssertEqual(plain.advisory, "unknown")
    }

    // An answer that is not an answer reads as unknown, never as ok. The ledger is untouched.
    func testAnUnreadableAnswerReadsAsUnknown() async throws {
        let cases: [(String, StubNet.Reply)] = [
            ("a 500", .status(500, Data("boom".utf8))),
            ("a 502", .status(502, Data())),
            ("a transport error", .fail(.notConnectedToInternet)),
            ("a 200 that is not JSON", .status(200, Data("<html>".utf8))),
            ("a 200 with no ledger", .status(200, body(["rev": 3]))),
        ]
        let store = try makeStore()
        for (name, reply) in cases {
            net.reset()
            net.enqueue(reply)
            let client = try makeClient(store)
            let outcome = await client.push()
            XCTAssertEqual(outcome, .unknown, name)
            XCTAssertEqual(client.advisory, "unknown", name)
            XCTAssertEqual(store.generation, 0, "\(name) changes nothing")
            XCTAssertEqual(store.received(), [:], name)
        }
    }
}
