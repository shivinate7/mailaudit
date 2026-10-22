import Foundation

/// One call to the Worker: the bearer key, the timeout and the status map have one home, and the
/// ledger client and the photo transport both go through it (rules-run-in-javascriptcore).
struct WorkerLink: Sendable {
    let baseURL: URL
    let session: URLSession
    let engine: RulesEngine

    enum Result {
        /// The task was cancelled, so the call was abandoned.
        case stopped
        /// No answer in SYNC_TIMEOUT_MS, a transport error, or a status the bundle could not map.
        case unreachable
        /// `status` is the bundle's syncStatus code: "ok", "empty", "no-access", "too-big", "bad-shape", "unknown".
        case answered(status: String, data: Data)
    }

    func send(key: String, method: String, path: String, body: Data? = nil, contentType: String? = nil) async -> Result {
        var req = URLRequest(url: baseURL.appending(path: path))
        req.httpMethod = method
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        if let body { req.httpBody = body }
        if let contentType { req.setValue(contentType, forHTTPHeaderField: "Content-Type") }
        guard let timeout = (try? await engine.constant("SYNC_TIMEOUT_MS")).flatMap({ Int($0) }) else { return .unreachable }
        let got = await fetch(req, timeoutMs: timeout)
        if Task.isCancelled { return .stopped }
        guard let got, let code = try? await engine.call("syncStatus", "[\(got.status)]"),
              let status = try? JSONDecoder().decode(String.self, from: Data(code.utf8))
        else { return .unreachable }
        return .answered(status: status, data: got.data)
    }

    /// nil when the request failed or timed out. The timer cancels the request, so a
    /// call that is never answered is abandoned and not left open.
    private func fetch(_ req: URLRequest, timeoutMs: Int) async -> (status: Int, data: Data)? {
        let session = session
        return await withTaskGroup(of: (status: Int, data: Data)?.self) { group in
            group.addTask {
                guard let (data, resp) = try? await session.data(for: req),
                      let http = resp as? HTTPURLResponse else { return nil }
                return (http.statusCode, data)
            }
            group.addTask {
                try? await Task.sleep(for: .milliseconds(timeoutMs))
                return nil
            }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
    }
}
