// The sync tests stand on StubNet and SleepGate (lane N4a). These tests check the
// stand-ins, so a sync test that goes red or green is about the client and not about
// the harness (testing-mock-is-test-below-seam). They name no product type, so they
// are green on main. They use plain URLSession and nothing from the client.

import Foundation
import XCTest
@testable import ManifestKit

final class StubNetTests: XCTestCase {
    override func setUp() { StubNet.shared.reset() }

    func get(_ path: String = "/ledger") -> URLRequest {
        URLRequest(url: StubNet.baseURL.appending(path: path))
    }

    // A scripted reply comes back with its status and body, and the request is
    // recorded with its method, header and the body read from the stream.
    func testScriptedReplyAndRecordedRequest() async throws {
        StubNet.shared.enqueue(.status(201, Data(#"{"ok":true}"#.utf8)))
        var req = get()
        req.httpMethod = "POST"
        req.setValue("Bearer fake", forHTTPHeaderField: "Authorization")
        req.httpBody = Data(#"{"ledger":{}}"#.utf8)
        let (data, resp) = try await StubNet.session().data(for: req)
        XCTAssertEqual((resp as? HTTPURLResponse)?.statusCode, 201)
        XCTAssertEqual(String(decoding: data, as: UTF8.self), #"{"ok":true}"#)
        let seen = try XCTUnwrap(StubNet.shared.requests.first)
        XCTAssertEqual(seen.method, "POST")
        XCTAssertEqual(seen.path, "/ledger")
        XCTAssertEqual(seen.header("authorization"), "Bearer fake")
        XCTAssertEqual(seen.json?["ledger"] as? [String: String], [:])
        XCTAssertEqual(StubNet.shared.strays, 0)
    }

    // A request nobody scripted is refused and counted, never answered.
    func testUnscriptedRequestIsAStray() async {
        do {
            _ = try await StubNet.session().data(for: get())
            XCTFail("an unscripted request must fail")
        } catch {}
        XCTAssertEqual(StubNet.shared.strays, 1)
    }

    // A held request stays open until it is released, then returns the released reply.
    func testHeldRequestWaitsForRelease() async throws {
        StubNet.shared.enqueue(.hold)
        let req = get()
        let task = Task { try await StubNet.session().data(for: req) }
        let arrived = await StubNet.shared.waitForRequests(1)
        XCTAssertTrue(arrived)
        XCTAssertTrue(StubNet.shared.release(0, .status(200, Data("x".utf8))))
        let (data, resp) = try await task.value
        XCTAssertEqual((resp as? HTTPURLResponse)?.statusCode, 200)
        XCTAssertEqual(String(decoding: data, as: UTF8.self), "x")
        XCTAssertFalse(StubNet.shared.wasCancelled(0))
    }

    // A cancelled hang is recorded as cancelled, and a release after that finds nothing.
    func testCancelledHangIsRecorded() async {
        StubNet.shared.enqueue(.hang)
        let req = get()
        let task = Task { try await StubNet.session().data(for: req) }
        let arrived = await StubNet.shared.waitForRequests(1)
        XCTAssertTrue(arrived)
        XCTAssertFalse(StubNet.shared.wasCancelled(0))
        task.cancel()
        _ = try? await task.value
        let end = Date().addingTimeInterval(3)
        while !StubNet.shared.wasCancelled(0), Date() < end { try? await Task.sleep(for: .milliseconds(5)) }
        XCTAssertTrue(StubNet.shared.wasCancelled(0))
        XCTAssertFalse(StubNet.shared.release(0, .status(200, Data())))
    }

    // The gate records each delay and holds the sleeper until a release. A release
    // made first is kept for the next sleep.
    func testSleepGateRecordsAndReleases() async {
        let gate = SleepGate()
        let sleeper = Task { await gate.sleep(111) }
        let end = Date().addingTimeInterval(3)
        while gate.delays.isEmpty, Date() < end { try? await Task.sleep(for: .milliseconds(5)) }
        XCTAssertEqual(gate.delays, [111])
        gate.release()
        await sleeper.value
        gate.release()
        await gate.sleep(222)
        XCTAssertEqual(gate.delays, [111, 222])
    }
}
