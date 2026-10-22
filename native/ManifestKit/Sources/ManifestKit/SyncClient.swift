import CryptoKit
import Foundation

/// How one sync call ended. The cases mirror the web's syncStatus codes plus the
/// states only a client has (native-reply-waits-generation).
public enum SyncOutcome: Equatable, Sendable {
    case applied, empty, noKey, noAccess, tooBig, badShape, unknown, backingOff, stopped
}

/// The Worker's `/ledger` over HTTP. The status map, the timeout and the backoff come
/// from the rules bundle (rules-run-in-javascriptcore); the merge stays on the Worker.
/// The socket, the press gate and resume are lane N4b.
@MainActor
public final class SyncClient {
    /// nil, or the failure's syncStatus code: "unknown", "too-big", "no-access", "bad-shape".
    public private(set) var advisory: String?
    /// Delay of the pending retry; nil when none.
    public private(set) var retryInMs: Int?

    private let baseURL: URL
    private let session: URLSession
    private let keys: KeyStore
    private let store: LedgerStore
    private let engine: RulesEngine
    private let sleep: @Sendable (Int) async -> Void

    /// The user data the last adopted reply carried. Starts empty, so on a fresh start
    /// everything the file holds counts as not carried yet.
    private var carried: [String: Any] = [:]
    private var failures = 0
    /// A digest of the key the Worker refused with a 401, never the key (the-token-is-a-credential).
    /// A call made with that same key stops; a different saved key lifts it.
    private var refusedKey: SHA256.Digest?
    private var sentKey: SHA256.Digest?
    private var retryTask: Task<Void, Never>?
    private var inflight: [UUID: Task<SyncOutcome, Never>] = [:]

    public init(
        baseURL: URL, session: URLSession, keys: KeyStore, store: LedgerStore,
        engine: RulesEngine, sleep: @escaping @Sendable (Int) async -> Void
    ) {
        self.baseURL = baseURL
        self.session = session
        self.keys = keys
        self.store = store
        self.engine = engine
        self.sleep = sleep
    }

    // MARK: calls

    public func pull() async -> SyncOutcome {
        if stopped() { return .noAccess }
        return await run { await $0.pullFlow() }
    }

    public func push() async -> SyncOutcome {
        if stopped() { return .noAccess }
        if retryInMs != nil { return .backingOff }
        return await run { await $0.postFlow(retry: false) }
    }

    /// Cancels every call in flight and the pending retry. A stop is not a failure.
    public func stop() {
        for t in inflight.values { t.cancel() }
        cancelRetry()
    }

    private func stopped() -> Bool {
        guard let refusedKey else { return false }
        if let now = (try? keys.key()) ?? nil, Self.digest(now) != refusedKey { self.refusedKey = nil; return false }
        return true
    }

    private static func digest(_ key: String) -> SHA256.Digest { SHA256.hash(data: Data(key.utf8)) }

    private func run(_ work: @escaping @MainActor (SyncClient) async -> SyncOutcome) async -> SyncOutcome {
        let id = UUID()
        let task = Task { await work(self) }
        inflight[id] = task
        let outcome = await task.value
        inflight[id] = nil
        return outcome
    }

    // MARK: flows

    private func pullFlow() async -> SyncOutcome {
        let gen = store.generation
        switch await send("GET", body: nil) {
        case .noKey: return .noKey
        case .stopped: return .stopped
        case .failed(let code): return await failed(code, retry: false)
        case .ledger(let reply):
            // A reply that arrives over an edit, or over data no reply has carried, is not
            // adopted: the POST sends that data and the Worker's merge answers (imports-merge-never-replace).
            if store.generation != gen || !same(store.userData(), carried) { return await postFlow(retry: false) }
            return await adopt(reply, fromPost: false, retry: false)
        case .empty:
            if holdsUserData() { return await postFlow(retry: false) }
            succeeded(fromPost: false)
            return .empty
        }
    }

    private func postFlow(retry: Bool) async -> SyncOutcome {
        while true {
            let gen = store.generation
            guard let body = try? JSONSerialization.data(withJSONObject: ["ledger": store.snapshot()]) else {
                return await failed("unknown", retry: retry)
            }
            switch await send("POST", body: body) {
            case .noKey: return .noKey
            case .stopped: return .stopped
            case .failed(let code): return await failed(code, retry: retry)
            case .empty: return await failed("unknown", retry: retry)  // the Worker answers a POST with no 404
            case .ledger(let reply):
                // The ledger changed while the POST was out: the reply is old. POST again.
                if store.generation != gen { continue }
                return await adopt(reply, fromPost: true, retry: retry)
            }
        }
    }

    private func adopt(_ reply: [String: Any], fromPost: Bool, retry: Bool) async -> SyncOutcome {
        do {
            try store.adopt(JSONSerialization.data(withJSONObject: reply))
        } catch {
            return await failed("unknown", retry: retry)
        }
        carried = store.userData()
        succeeded(fromPost: fromPost)
        return .applied
    }

    private func holdsUserData() -> Bool {
        let d = store.userData()
        return ["received", "stamps"].contains { !((d[$0] as? [String: Any]) ?? [:]).isEmpty }
            || !((d["envelopes"] as? [Any]) ?? []).isEmpty
    }

    private func same(_ a: [String: Any], _ b: [String: Any]) -> Bool {
        // The four fields are always present after a load, so an empty carried map matches a store with no user data.
        func norm(_ d: [String: Any]) -> NSDictionary {
            var out = d
            for k in ["received", "receivedAt", "stamps"] where out[k] == nil { out[k] = [String: Any]() }
            if out["envelopes"] == nil { out["envelopes"] = [Any]() }
            return out as NSDictionary
        }
        return norm(a).isEqual(norm(b))
    }

    // MARK: state

    private func succeeded(fromPost: Bool) {
        // After a 413 only a good POST clears the size state.
        if fromPost || advisory != "too-big" { clearBackoff() }
    }

    private func clearBackoff() {
        cancelRetry()
        failures = 0
        advisory = nil
    }

    private func cancelRetry() {
        retryTask?.cancel()
        retryTask = nil
        retryInMs = nil
    }

    /// Records a failure and schedules the retry. A 401 stops this client and a 400
    /// schedules nothing. A call made while a retry is pending leaves that retry alone.
    private func failed(_ code: String, retry: Bool) async -> SyncOutcome {
        advisory = code
        switch code {
        case "no-access":
            refusedKey = sentKey
            cancelRetry()
            return .noAccess
        case "bad-shape":
            cancelRetry()
            return .badShape
        default:
            if retry || retryTask == nil {
                let n = failures
                failures += 1
                if let ms = await backoff(n), !Task.isCancelled {
                    retryInMs = ms
                    startRetry()
                }
            }
            return code == "too-big" ? .tooBig : .unknown
        }
    }

    private func startRetry() {
        guard retryTask == nil else { return }
        retryTask = Task { [self] in
            while !Task.isCancelled, let ms = retryInMs {
                await sleep(ms)
                if Task.isCancelled { return }
                let r = await postFlow(retry: true)
                if r != .unknown && r != .tooBig && r != .applied { cancelRetry(); return }
            }
        }
    }

    // MARK: wire

    private enum Reply {
        case ledger([String: Any]), empty, failed(String), noKey, stopped
    }

    private func backoff(_ attempt: Int) async -> Int? {
        guard let out = try? await engine.call("backoffMs", "[\(attempt)]") else { return nil }
        return Int(out)
    }

    private func send(_ method: String, body: Data?) async -> Reply {
        guard let key = (try? keys.key()) ?? nil else { return .noKey }
        sentKey = Self.digest(key)
        var req = URLRequest(url: baseURL.appending(path: "ledger"))
        req.httpMethod = method
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        if let body {
            req.httpBody = body
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        guard let timeout = (try? await engine.constant("SYNC_TIMEOUT_MS")).flatMap({ Int($0) }) else {
            return .failed("unknown")
        }
        let got = await fetch(req, timeoutMs: timeout)
        if Task.isCancelled { return .stopped }
        guard let code = try? await engine.call("syncStatus", "[\(got?.status ?? 0)]"),
              let status = try? JSONDecoder().decode(String.self, from: Data(code.utf8))
        else { return .failed("unknown") }
        switch status {
        case "ok":
            guard let data = got?.data,
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let ledger = obj["ledger"] as? [String: Any]
            else { return .failed("unknown") }
            return .ledger(ledger)
        case "empty": return .empty
        default: return .failed(status)
        }
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
