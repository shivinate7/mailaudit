// A scripted network for the sync client tests (lane N4a, native-reply-waits-generation).
//
// Foundation only, and it names no product type, so it compiles on main. Every
// request a test session makes lands in StubNet and is answered from a script, in
// order. No packet leaves the process: the session carries this protocol and
// nothing else, and the base URL is under .invalid. A request the script did not
// expect is refused and counted in `strays`, so a stray call fails the test that
// made it. A reply can be held, so a test can change the ledger while a request is
// out, and it can be released later. Every cancelled request is recorded.
//
// A stub URL protocol cannot stand in for a WebSocket. This file carries HTTP only.

import Foundation

final class StubNet: @unchecked Sendable {
    static let shared = StubNet()
    /// The only host the stub answers. A request to any other host is a stray.
    static let host = "sync.test.invalid"
    static var baseURL: URL { URL(string: "https://\(host)")! }

    struct Seen: Sendable {
        let method: String
        let url: URL
        let headers: [String: String]
        let body: Data

        var path: String { url.path }
        func header(_ name: String) -> String? {
            headers.first { $0.key.lowercased() == name.lowercased() }?.value
        }
        /// The body as a JSON object, nil when it is not one.
        var json: [String: Any]? { try? JSONSerialization.jsonObject(with: body) as? [String: Any] }
    }

    enum Reply: Sendable {
        /// Answers at once with a status and a body.
        case status(Int, Data)
        /// Fails at once with a transport error.
        case fail(URLError.Code)
        /// Never answers. Only a cancel ends it.
        case hang
        /// Waits for `release(_:_:)`.
        case hold
    }

    private let lock = NSLock()
    private var script: [Reply] = []
    private var seenList: [Seen] = []
    private var live: [Int: StubURLProtocol] = [:]
    private var cancelledSet: Set<Int> = []
    private var strayCount = 0

    func reset() {
        lock.withLock {
            script = []
            seenList = []
            live = [:]
            cancelledSet = []
            strayCount = 0
        }
    }

    func enqueue(_ replies: Reply...) { lock.withLock { script.append(contentsOf: replies) } }

    var requests: [Seen] { lock.withLock { seenList } }
    /// Requests the script had no reply for, or that named another host.
    var strays: Int { lock.withLock { strayCount } }
    /// True when the client abandoned request `index` before any reply reached it.
    func wasCancelled(_ index: Int) -> Bool { lock.withLock { cancelledSet.contains(index) } }

    /// A session whose only protocol is the stub.
    static func session() -> URLSession {
        let cfg = URLSessionConfiguration.ephemeral
        cfg.protocolClasses = [StubURLProtocol.self]
        return URLSession(configuration: cfg)
    }

    /// Sends a held or hung request its reply. False when the request is gone (cancelled).
    @discardableResult
    func release(_ index: Int, _ reply: Reply) -> Bool {
        let proto = lock.withLock { live.removeValue(forKey: index) }
        guard let proto else { return false }
        proto.deliver(reply)
        return true
    }

    /// Waits until `count` requests have arrived. False after 3 seconds.
    func waitForRequests(_ count: Int) async -> Bool {
        let end = Date().addingTimeInterval(3)
        while requests.count < count {
            if Date() > end { return false }
            try? await Task.sleep(for: .milliseconds(5))
        }
        return true
    }

    // Called by the protocol.
    fileprivate func arrive(_ seen: Seen, _ proto: StubURLProtocol) -> (Int, Reply) {
        lock.withLock {
            let index = seenList.count
            seenList.append(seen)
            var reply: Reply
            if seen.url.host() != Self.host || script.isEmpty {
                strayCount += 1
                reply = .fail(.cannotConnectToHost)
            } else {
                reply = script.removeFirst()
            }
            switch reply {
            case .hang, .hold: live[index] = proto
            default: break
            }
            return (index, reply)
        }
    }

    fileprivate func stopped(_ index: Int) {
        lock.withLock {
            if live.removeValue(forKey: index) != nil { cancelledSet.insert(index) }
        }
    }
}

final class StubURLProtocol: URLProtocol, @unchecked Sendable {
    private var index = -1

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let seen = StubNet.Seen(
            method: request.httpMethod ?? "GET",
            url: request.url ?? URL(string: "about:blank")!,
            headers: request.allHTTPHeaderFields ?? [:],
            body: Self.body(of: request))
        let (i, reply) = StubNet.shared.arrive(seen, self)
        index = i
        deliver(reply)
    }

    override func stopLoading() { StubNet.shared.stopped(index) }

    fileprivate func deliver(_ reply: StubNet.Reply) {
        switch reply {
        case .status(let code, let data):
            let head = HTTPURLResponse(
                url: request.url ?? URL(string: "about:blank")!, statusCode: code,
                httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: head, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        case .fail(let code):
            client?.urlProtocol(self, didFailWithError: URLError(code))
        case .hang, .hold:
            break
        }
    }

    /// URLSession hands a POST body to a protocol as a stream, and `httpBody` is nil.
    private static func body(of request: URLRequest) -> Data {
        if let body = request.httpBody { return body }
        guard let stream = request.httpBodyStream else { return Data() }
        stream.open()
        defer { stream.close() }
        var out = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let n = stream.read(&buffer, maxLength: buffer.count)
            if n <= 0 { break }
            out.append(buffer, count: n)
        }
        return out
    }
}

/// A sleep the test controls. The client calls `sleep(ms)`; it records the delay and
/// waits until the test calls `release()`. A release made before the sleep is kept.
final class SleepGate: @unchecked Sendable {
    private let lock = NSLock()
    private var called: [Int] = []
    private var waiters: [CheckedContinuation<Void, Never>] = []
    private var credits = 0

    /// The delay of every sleep the client asked for, in order.
    var delays: [Int] { lock.withLock { called } }

    func sleep(_ ms: Int) async {
        await withCheckedContinuation { (c: CheckedContinuation<Void, Never>) in
            lock.lock()
            called.append(ms)
            if credits > 0 {
                credits -= 1
                lock.unlock()
                c.resume()
            } else {
                waiters.append(c)
                lock.unlock()
            }
        }
    }

    func release() {
        lock.lock()
        if waiters.isEmpty {
            credits += 1
            lock.unlock()
        } else {
            let c = waiters.removeFirst()
            lock.unlock()
            c.resume()
        }
    }
}
