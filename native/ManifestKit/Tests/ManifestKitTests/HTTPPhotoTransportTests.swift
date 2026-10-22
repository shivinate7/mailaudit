// HTTP photo transport tests (lane N4b, sync-revamp-cloudflare, listphotos-is-three-valued,
// native-photo-transport-unbuilt).
//
// PhotoSync moves blobs through the PhotoTransport protocol. This is the type that speaks to the
// Worker /photos route, as the web does (src/entry.jsx photoList, photoGet, photoPut; worker/core.mjs):
//   GET  /photos            -> {ids: [file names]}
//   GET  /photos/<name>     -> the bytes, or 404
//   POST /photos/<name>     -> the bytes in the body; 413 over the cap (MAX_PHOTO_BYTES)
// Each call sends `Authorization: Bearer <key>`, read from the KeyStore when the call is made. The key
// is never in a URL. The type of a photo is read from its name by mimeFromName in the rules bundle, and
// Swift keeps no copy of that rule.
//
// What PhotoSync does with each answer fixes what this type must say:
//   list: nil is "the Worker could not say" and nothing moves; [] is a store known to be empty.
//   put: a 413 throws PhotoTransportError.tooLarge and the next photo still goes; any other failure
//        throws something else and the run stops.
//   get: nil is "not there" and PhotoSync skips it without a failure; a throw counts as a failed download.
//
// Fake fixtures only: the network is StubNet under .invalid and the keys are made up.

import Foundation
import XCTest
@testable import ManifestKit

final class HTTPPhotoTransportTests: SyncTestCase {
    static let name = "pho-ab12cd.jpg"
    /// Bytes that are no text and no JSON: a NUL, a high byte, a brace, a quote and a newline.
    static let blob = Data([0x00, 0xFF, 0x10, 0x0A, 0x7B, 0x22, 0x80, 0x41])

    func transport(bundle: URL = RulesGoldenTests.bundleURL) throws -> HTTPPhotoTransport {
        HTTPPhotoTransport(
            baseURL: StubNet.baseURL, session: StubNet.session(), keys: keys,
            engine: try RulesEngine(bundleURL: bundle))
    }

    // MARK: list

    // The Worker's `ids` are file names. They come back as they are: PhotoSync maps them to ids.
    func testListReadsTheNamesTheWorkerSends() async throws {
        net.enqueue(.status(200, body(["ids": ["pho-a1.jpg", "pho-b2.png"]])))
        let names = try await transport().list()
        XCTAssertEqual(names, ["pho-a1.jpg", "pho-b2.png"])

        let sent = try XCTUnwrap(seen(0))
        XCTAssertEqual(sent.method, "GET")
        XCTAssertEqual(sent.path, "/photos")
        XCTAssertEqual(sent.header("Authorization"), "Bearer \(Self.fakeKey)")
        XCTAssertFalse(sent.url.absoluteString.contains(Self.fakeKey), "the key is never in the URL")
        XCTAssertEqual(sent.body, Data())
        XCTAssertEqual(net.strays, 0)
    }

    // A store with no photos is known: [] and not nil. Read as nil, a new device would never upload.
    func testAnEmptyListIsKnownAndNotUnknown() async throws {
        net.enqueue(.status(200, body(["ids": [String]()])))
        let names = try await transport().list()
        XCTAssertEqual(names, [])
    }

    // "The Worker could not say" is nil, never an empty list. An empty list would make PhotoSync upload
    // everything again, or report every photo lost.
    func testAListTheWorkerCouldNotGiveIsNilAndNeverEmpty() async throws {
        let t = try transport()
        let answers: [(String, StubNet.Reply)] = [
            ("a 401", failure(401, "unauthorized")),
            ("a 500", .status(500, Data())),
            ("a body that is not JSON", .status(200, Data("<html>".utf8))),
            ("a body with no ids", .status(200, body([:]))),
            ("ids that are not a list", .status(200, body(["ids": "pho-a1.jpg"]))),
            ("a transport error", .fail(.notConnectedToInternet)),
        ]
        for (what, reply) in answers {
            net.enqueue(reply)
            let names = try await t.list()
            XCTAssertNil(names, "\(what) is unknown, not empty")
        }
    }

    // MARK: put

    func testPutPostsTheBytesUnderTheNameWithTheTypeOfTheName() async throws {
        net.enqueue(.status(200, body(["id": "pho-ab12cd"])))
        try await transport().put(name: Self.name, data: Self.blob)

        let sent = try XCTUnwrap(seen(0))
        XCTAssertEqual(sent.method, "POST")
        XCTAssertEqual(sent.path, "/photos/\(Self.name)")
        XCTAssertEqual(sent.body, Self.blob, "the bytes travel untouched")
        XCTAssertEqual(sent.header("Authorization"), "Bearer \(Self.fakeKey)")
        XCTAssertEqual(sent.header("Content-Type"), "image/jpeg")
        XCTAssertFalse(sent.url.absoluteString.contains(Self.fakeKey))
        XCTAssertEqual(net.strays, 0)
    }

    // The type of a name is mimeFromName in the bundle. A probe answers a type no Swift table holds.
    func testThePhotoTypeComesFromTheBundle() async throws {
        let probe = try probeBundle("Rules.mimeFromName=function(){return 'image/x-probe'}")
        net.enqueue(.status(200, body(["id": "pho-ab12cd"])))
        try await transport(bundle: probe).put(name: Self.name, data: Self.blob)
        XCTAssertEqual(seen(0)?.header("Content-Type"), "image/x-probe")
    }

    // A 413 is "this photo is over the cap". It is the one failure PhotoSync steps over.
    func testA413OnPutIsTooLarge() async throws {
        net.enqueue(failure(413, "photo-too-large"))
        var thrown: Error?
        do { try await transport().put(name: Self.name, data: Self.blob) } catch { thrown = error }
        XCTAssertEqual(thrown as? PhotoTransportError, .tooLarge)
    }

    // Any other failure throws something else, so PhotoSync stops the run and does not skip the photo.
    func testAnyOtherPutFailureThrowsAndIsNotTooLarge() async throws {
        let t = try transport()
        let answers: [(String, StubNet.Reply)] = [
            ("a 401", failure(401, "unauthorized")),
            ("a 500", .status(500, Data())),
            ("a 400", failure(400, "bad photo name")),
            ("a transport error", .fail(.networkConnectionLost)),
        ]
        for (what, reply) in answers {
            net.enqueue(reply)
            var thrown: Error?
            do { try await t.put(name: Self.name, data: Self.blob) } catch { thrown = error }
            XCTAssertNotNil(thrown, "\(what) is a failed upload")
            XCTAssertNotEqual(thrown as? PhotoTransportError, .tooLarge, "\(what) is not a size refusal")
        }
    }

    // MARK: get

    func testGetReadsTheBytesUnderTheName() async throws {
        net.enqueue(.status(200, Self.blob))
        let data = try await transport().get(name: Self.name)
        XCTAssertEqual(data, Self.blob, "the body is the photo, not parsed as anything")

        let sent = try XCTUnwrap(seen(0))
        XCTAssertEqual(sent.method, "GET")
        XCTAssertEqual(sent.path, "/photos/\(Self.name)")
        XCTAssertEqual(sent.header("Authorization"), "Bearer \(Self.fakeKey)")
        XCTAssertFalse(sent.url.absoluteString.contains(Self.fakeKey))
        XCTAssertEqual(sent.body, Data())
    }

    // 404 is "not there": nil. A photo the Worker lost is skipped without a failure.
    func testA404OnGetIsNil() async throws {
        net.enqueue(failure(404, "not found"))
        let data = try await transport().get(name: Self.name)
        XCTAssertNil(data)
    }

    // Anything else is a failed download, and a throw. Read as nil it would hide a Worker that is down.
    func testAnyOtherGetFailureThrows() async throws {
        let t = try transport()
        let answers: [(String, StubNet.Reply)] = [
            ("a 401", failure(401, "unauthorized")),
            ("a 500", .status(500, Data())),
            ("a transport error", .fail(.timedOut)),
        ]
        for (what, reply) in answers {
            net.enqueue(reply)
            var thrown: Error?
            var data: Data?
            do { data = try await t.get(name: Self.name) } catch { thrown = error }
            XCTAssertNotNil(thrown, "\(what) is a failed download, and not a missing photo. Got \(String(describing: data))")
        }
    }

    // MARK: no key, no answer, a cancel

    func testWithNoKeyNothingLeavesTheDevice() async throws {
        try keys.clear()
        let t = try transport()
        let names = try await t.list()
        XCTAssertNil(names, "no key: the Worker could not be asked")
        var putThrown: Error?
        do { try await t.put(name: Self.name, data: Self.blob) } catch { putThrown = error }
        var getThrown: Error?
        do { _ = try await t.get(name: Self.name) } catch { getThrown = error }
        XCTAssertNotNil(putThrown)
        XCTAssertNotNil(getThrown)
        XCTAssertEqual(net.requests.count, 0)
    }

    // A call the Worker never answers reads as failed after SYNC_TIMEOUT_MS, as a ledger call does.
    func testACallThatIsNeverAnsweredFailsAfterTheTimeout() async throws {
        let probe = try probeBundle("Rules.SYNC_TIMEOUT_MS=50")
        let t = try transport(bundle: probe)
        net.enqueue(.hang, .hang)
        let list = begin { try await t.list() }
        let get = begin { try await t.get(name: Self.name) }

        let listed = await end(list)
        switch listed {
        case .success(let names)?: XCTAssertNil(names, "an unanswered list is unknown")
        default: XCTFail("the list should return nil, not throw")
        }
        let got = await end(get)
        if case .success(let data)? = got { XCTFail("an unanswered get is a failed download, not \(String(describing: data))") }
        await until("both requests are abandoned") { [self] in net.wasCancelled(0) && net.wasCancelled(1) }
    }

    // Stop cancels the call in flight (PhotoSync.stop). The cancel must reach the request and end the call.
    func testACancelledCallEndsAndAbandonsItsRequest() async throws {
        let t = try transport()
        net.enqueue(.hang)
        let get = begin { try await t.get(name: Self.name) }
        let out = await net.waitForRequests(1)
        XCTAssertTrue(out, "the GET left")

        get.task?.cancel()
        let result = await end(get)
        if case .success(let data)? = result { XCTFail("a cancelled get must not return \(String(describing: data))") }
        XCTAssertTrue(net.wasCancelled(0), "the request was abandoned")
    }
}
