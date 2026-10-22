import Foundation

/// -ManifestUITestSyncStatus <http status>: every request gets that status and an empty body, so the
/// real client, advisory and view run with no network. Nothing else uses this.
final class StatusURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var status = 200

    static func session(status: Int) -> URLSession {
        Self.status = status
        let cfg = URLSessionConfiguration.ephemeral
        cfg.protocolClasses = [StatusURLProtocol.self]
        return URLSession(configuration: cfg)
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let head = HTTPURLResponse(url: request.url ?? URL(fileURLWithPath: "/"), statusCode: Self.status, httpVersion: "HTTP/1.1", headerFields: [:])!
        client?.urlProtocol(self, didReceive: head, cacheStoragePolicy: .notAllowed)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}
