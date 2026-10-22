// Rev and resume tests (lane N4b, native-reply-waits-generation, sync-revamp-cloudflare).
//
// The Worker pushes `{rev}` on /ws, and sends one at once when a socket connects. The client fetches
// only a rev newer than the one it holds. A stub URL protocol cannot stand in for a WebSocket, so
// these tests drive the message handler, `receive(socketMessage:)`. The socket glue gets a live check.
// The contract is the header of N4bRedStubs.swift.
//
// "No GET" is shown by the nil the handler returns, and by the request count after a short fence.
// Each fence follows a wait for something that must happen.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncRevTests: SyncTestCase {
    // MARK: a rev that is not newer

    func testARevThatIsNotNewerGivesNoGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(), rev: 5))
        let first = await client.pull()
        XCTAssertEqual(first, .applied)
        XCTAssertEqual(client.rev, 5, "the reply's rev is kept")

        let same = await client.receive(socketMessage: revFrame(5))
        let older = await client.receive(socketMessage: revFrame(4))
        XCTAssertNil(same, "the rev it holds is not newer: no GET")
        XCTAssertNil(older, "an older rev is not newer either")
        await settle()
        XCTAssertEqual(net.requests.count, 1)
        XCTAssertEqual(net.strays, 0)
    }

    func testANewerRevGivesOneGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(), rev: 5), ok(try ledger(received: [Self.keyC: 1]), rev: 6))
        _ = await client.pull()

        let heard = await client.receive(socketMessage: revFrame(6))
        XCTAssertEqual(heard, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET", "GET"])
        XCTAssertEqual(seen(1)?.path, "/ledger")
        XCTAssertEqual(seen(1)?.header("Authorization"), "Bearer \(Self.fakeKey)")
        XCTAssertEqual(store.received()[Self.keyC], 1, "the other device's check-in arrived")
        XCTAssertEqual(client.rev, 6)
    }

    // A fresh client holds no rev, so the first rev it hears is newer.
    func testTheFirstRevOfAFreshClientGivesAGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        XCTAssertNil(client.rev, "anchor: nothing held yet")
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 1))
        let heard = await client.receive(socketMessage: revFrame(1))
        XCTAssertEqual(heard, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
        XCTAssertEqual(client.rev, 1)
    }

    // The same rev heard twice while its GET is out is one GET.
    func testTheSameRevHeardWhileItsGetIsOutGivesOneGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hold)
        let first = startHeard { await client.receive(socketMessage: revFrame(6)) }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the GET left")

        let second = await client.receive(socketMessage: revFrame(6))
        XCTAssertNil(second, "a GET for this rev is already out, and the handler returns at once")
        net.release(0, ok(try ledger(), rev: 6))
        let outcome = await finishHeard(first)
        XCTAssertEqual(outcome, .applied)
        await settle()
        XCTAssertEqual(net.requests.count, 1, "one GET for one rev")
    }

    // A rev heard while a GET is out may be newer than the reply that GET brings. The client looks again.
    func testANewerRevHeardWhileAGetIsOutGivesAnotherGetAfterIt() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hold, ok(try ledger(received: [Self.keyB: 1]), rev: 7))
        let first = startHeard { await client.receive(socketMessage: revFrame(6)) }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out)
        let second = await client.receive(socketMessage: revFrame(7))
        XCTAssertNil(second, "returns at once; the next GET waits for the first reply")

        net.release(0, ok(try ledger(), rev: 6))
        _ = await finishHeard(first)
        let again = await net.waitForRequests(2)
        XCTAssertTrue(again, "rev 7 is newer than the reply's rev 6: one more GET")
        await until("rev 7 lands") { client.rev == 7 }
        XCTAssertEqual(net.requests.map(\.method), ["GET", "GET"])
        XCTAssertEqual(store.received()[Self.keyB], 1)
    }

    // MARK: this device's own write

    // Every POST makes the Worker broadcast its rev. That rev reaches this device while its own POST
    // is out, and the POST's reply carries it. A device's own write causes no GET.
    func testTheBroadcastOfThisDevicesOwnWriteGivesNoGet() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hold)
        let post = start { await client.push() }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the POST left")

        let heard = await client.receive(socketMessage: revFrame(5))
        XCTAssertNil(heard, "a rev heard while the POST is out waits for its reply")
        net.release(0, ok(try ledger(received: [Self.keyA: 1]), rev: 5))
        let pushed = await finish(post)
        XCTAssertEqual(pushed, .applied)
        await settle()
        XCTAssertEqual(net.requests.map(\.method), ["POST"], "the reply carries rev 5: nothing newer to fetch")
        XCTAssertEqual(net.strays, 0)
    }

    // A rev above the POST's own is another device's. One GET follows the reply.
    func testAHigherRevHeardWhileAPostIsOutGivesOneGetAfterTheReply() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hold, ok(try ledger(received: [Self.keyA: 1, Self.keyC: 1]), rev: 6))
        let post = start { await client.push() }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out)
        let heard = await client.receive(socketMessage: revFrame(6))
        XCTAssertNil(heard)

        net.release(0, ok(try ledger(received: [Self.keyA: 1]), rev: 5))
        let pushed = await finish(post)
        XCTAssertEqual(pushed, .applied)
        let again = await net.waitForRequests(2)
        XCTAssertTrue(again, "rev 6 is above the POST's rev 5: one GET")
        await until("rev 6 lands") { client.rev == 6 }
        XCTAssertEqual(net.requests.map(\.method), ["POST", "GET"])
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // MARK: a newer rev with a changed ledger

    // A newer rev starts a GET. If the ledger changes while that GET is out, the reply is dropped and the
    // client POSTs, so the change is not erased (native-reply-waits-generation).
    func testANewerRevWithAChangedLedgerPosts() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let stale = try ledger(received: [Self.marker: 5])
        let merged = try ledger(received: [Self.keyB: 1, Self.keyC: 1])
        net.enqueue(.hold, ok(merged, rev: 7))
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the GET left")
        store.setReceived(Self.keyB, count: 1)  // the edit, while the GET is out
        net.release(0, ok(stale, rev: 6))
        let outcome = await finishHeard(heard)

        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET", "POST"])
        XCTAssertEqual(sentReceived(seen(1))?[Self.keyB] as? Int, 1, "the POST carries the edit")
        XCTAssertNil(store.received()[Self.marker], "the stale reply was not adopted")
        XCTAssertEqual(store.received()[Self.keyB], 1, "the edit survived")
        XCTAssertEqual(store.received()[Self.keyC], 1, "the POST's reply was adopted")
        XCTAssertEqual(client.rev, 7)
    }

    // The held rev is the rev of what was adopted. A GET reply dropped for an edit carried rev 6 but
    // brought nothing in. If the POST that follows fails, rev 6 must still be news, or the change
    // would never be fetched.
    func testADroppedReplyDoesNotAdvanceTheRev() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let merged = try ledger(received: [Self.keyB: 1, Self.keyC: 1])
        net.enqueue(.hold, .status(500, Data()), ok(merged, rev: 6), ok(merged, rev: 7))
        let heard = startHeard { await client.receive(socketMessage: revFrame(6)) }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the GET left")
        store.setReceived(Self.keyB, count: 1)  // an edit, so the reply is dropped and the client POSTs
        net.release(0, ok(try ledger(received: [Self.marker: 5]), rev: 6))
        let outcome = await finishHeard(heard)
        XCTAssertEqual(outcome, .unknown, "the POST failed")
        XCTAssertNil(client.rev, "nothing was adopted, so no rev was reached")

        let again = await client.receive(socketMessage: revFrame(6))
        XCTAssertNotNil(again, "rev 6 is still news: a GET goes out")
        XCTAssertEqual(net.requests.map(\.method).prefix(3), ["GET", "POST", "GET"])
    }

    // MARK: the reply's rev and stats

    func testTheClientKeepsTheRevAndTheStatsOfTheReply() async throws {
        try writeLedger(received: [Self.keyA: 1])
        let store = try makeStore()
        let client = try makeClient(store)
        let stats = ["itemsAdded": 0, "checkInsAdded": 2, "envelopesAdded": 1, "stampsAdded": 0,
                     "checkInsRemoved": 1, "envelopesRemoved": 0, "stampsRemoved": 0]
        net.enqueue(
            okStats(try ledger(received: [Self.keyA: 1]), rev: 8, stats: stats),
            ok(try ledger(received: [Self.keyA: 1]), rev: 9),
            .status(500, Data()))
        XCTAssertNil(client.stats, "anchor: no stats before a reply")

        let pushed = await client.push()
        XCTAssertEqual(pushed, .applied)
        XCTAssertEqual(client.rev, 8)
        XCTAssertEqual(client.stats, stats, "the merge notice is built from the reply's stats")

        let pulled = await client.pull()
        XCTAssertEqual(pulled, .applied)
        XCTAssertEqual(client.rev, 9)
        XCTAssertNil(client.stats, "a GET reply has no stats, and a reply never shows another reply's")

        let failed = await client.pull()
        XCTAssertEqual(failed, .unknown)
        XCTAssertEqual(client.rev, 9, "a failed call keeps the rev")
    }

    // A late, older reply must not pull the held rev back, or the next frame would look new again.
    func testTheHeldRevNeverMovesBack() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(), rev: 9), ok(try ledger(), rev: 4))
        _ = await client.pull()
        XCTAssertEqual(client.rev, 9)
        _ = await client.pull()
        XCTAssertEqual(client.rev, 9, "rev 4 is older than the 9 already held")
        let heard = await client.receive(socketMessage: revFrame(9))
        XCTAssertNil(heard)
    }

    // MARK: frames that are not a rev

    func testAFrameThatIsNotARevGivesNoGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let frames = ["", "hello", "{}", #"{"rev":"7"}"#, #"{"rev":null}"#, "[7]", "7", #"{"rev":"#]
        for text in frames {
            let heard = await client.receive(socketMessage: text)
            XCTAssertNil(heard, "\(text) is no rev")
        }
        await settle()
        XCTAssertEqual(net.requests.count, 0)

        // The next real frame still works, and a field the client does not know is ignored.
        net.enqueue(ok(try ledger(), rev: 7))
        let real = await client.receive(socketMessage: #"{"rev":7,"note":"x"}"#)
        XCTAssertEqual(real, .applied, "a bad frame does not spoil the next")
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
    }

    // MARK: a refused key

    func testAfterA401ARevAndAResumeSendNothing() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(failure(401, "unauthorized"))
        let refused = await client.push()
        XCTAssertEqual(refused, .noAccess)

        let heard = await client.receive(socketMessage: revFrame(99))
        let resumed = await client.resume()
        XCTAssertNil(heard, "a refused key stops the GETs the socket would start")
        XCTAssertEqual(resumed, .noAccess, "and the resume")
        await settle()
        XCTAssertEqual(net.requests.count, 1)
    }

    // MARK: resume

    func testResumeDoesOneGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(received: [Self.keyC: 1]), rev: 3))
        let outcome = await client.resume()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET"])
        XCTAssertEqual(seen(0)?.path, "/ledger")
        XCTAssertEqual(seen(0)?.header("Authorization"), "Bearer \(Self.fakeKey)")
        XCTAssertEqual(store.received()[Self.keyC], 1)
        XCTAssertEqual(client.rev, 3)
        await settle()
        XCTAssertEqual(net.requests.count, 1, "one GET, and no second")
    }

    // A resume is not gated on a rev: the app was away, so it looks, whatever rev it holds.
    func testResumeGetsEvenWhenTheHeldRevIsCurrent() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(ok(try ledger(), rev: 5), ok(try ledger(received: [Self.keyC: 1]), rev: 5))
        _ = await client.pull()
        let outcome = await client.resume()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(net.requests.map(\.method), ["GET", "GET"])
        XCTAssertEqual(store.received()[Self.keyC], 1)
    }

    // The Worker sends the rev again when the socket reconnects. That hello arrives while the resume GET
    // is out, and its reply carries the same rev. Still one GET.
    func testTheHelloOfAResumeGivesNoSecondGet() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        net.enqueue(.hold)
        let resumed = start { await client.resume() }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the resume GET left")

        let hello = await client.receive(socketMessage: revFrame(5))
        XCTAssertNil(hello, "the GET that is out covers it")
        net.release(0, ok(try ledger(received: [Self.keyC: 1]), rev: 5))
        let outcome = await finish(resumed)
        XCTAssertEqual(outcome, .applied)
        await settle()
        XCTAssertEqual(net.requests.count, 1, "the hello and the resume share one GET")
    }
}
