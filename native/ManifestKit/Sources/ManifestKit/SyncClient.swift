import CryptoKit
import Foundation
import Observation

/// How one sync call ended. The cases mirror the web's syncStatus codes plus the
/// states only a client has (native-reply-waits-generation).
public enum SyncOutcome: Equatable, Sendable {
    case applied, empty, noKey, noAccess, tooBig, badShape, unknown, backingOff, stopped
}

/// The Worker's `/ledger` over HTTP, its `/ws` socket and the press gate that holds a reply. The
/// status map, the timeout, the backoff and the press verdict come from the rules bundle
/// (rules-run-in-javascriptcore); the merge stays on the Worker.
@MainActor @Observable
public final class SyncClient {
    /// nil, or the failure's syncStatus code: "unknown", "too-big", "no-access", "bad-shape".
    public private(set) var advisory: String?
    /// Delay of the pending retry; nil when none.
    public private(set) var retryInMs: Int?
    /// The newest rev of a reply the client adopted. A reply dropped for an edit does not move it, or
    /// its change would never be fetched. It never moves back.
    public private(set) var rev: Int?
    /// The `stats` of the last adopted reply; nil when that reply carried none.
    public private(set) var stats: [String: Int]?

    /// Milliseconds since 1970 when a call last agreed with the Worker: an adopted reply, or a 404 from a healthy server
    /// with nothing stored. nil until then. A failure leaves it alone, and it never moves back (web workerSyncedAt, Math.max).
    public private(set) var lastSyncAt: Double?
    /// Called with each new lastSyncAt, so the app can keep it across a relaunch. Nothing is stored here.
    public var onLastSync: (@MainActor (Double) -> Void)?

    /// Where the Worker stands, read on demand (src/app.jsx serverStatus). The web's ladder, first match wins.
    public var serverState: SyncServerState {
        let key: String?
        do { key = try keys.key() } catch { return .notChecked }  // could not look is not no key
        if key == nil { return .noKey }
        switch advisory {
        case "no-access": return .refused
        case "bad-shape": return .badShape
        case "too-big": return .tooBig
        case nil: return .connected
        default: return .unreachable
        }
    }

    /// The Server line of the Sync panel.
    public var serverStatus: String { serverState.text }

    /// The defaults key of lastSyncAt. It is frozen (native-files-are-frozen): renaming it drops every saved time.
    public static let lastSyncKey = "dev.shivinate.manifest.lastSyncAt"

    /// Keeps lastSyncAt across a relaunch, as the web keeps workerSyncedAt: reads it back now, and writes each new one.
    public func persistLastSync(in defaults: UserDefaults) {
        lastSyncAt = defaults.object(forKey: Self.lastSyncKey) as? Double
        onLastSync = { defaults.set($0, forKey: Self.lastSyncKey) }
    }

    /// nil: no press holds a reply.
    public var pressGate: PressGate?
    /// nil: connect() does nothing.
    public var socket: (any SyncSocket)?
    /// Read by the server apply (PhotoIds.kept).
    public var photoStore: PhotoStore?
    /// Runs after a reply was adopted, so the screens read the new ledger.
    public var onApplied: (@MainActor () async -> Void)?

    private let link: WorkerLink
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
    /// The retry's POST is out. A retry that is only waiting for its delay is not.
    private var retryOut = false
    /// The newest rev heard while a call was out. One GET follows that call if its reply is older.
    private var heardRev = 0
    private var socketTask: Task<Void, Never>?
    /// The POST timer. Set at the first local save of a burst and not moved by later ones; nil once it
    /// fires (sync-runs-itself, auto-apply-happens-now).
    private var postTask: Task<Void, Never>?

    public init(
        baseURL: URL, session: URLSession, keys: KeyStore, store: LedgerStore,
        engine: RulesEngine, sleep: @escaping @Sendable (Int) async -> Void
    ) {
        self.link = WorkerLink(baseURL: baseURL, session: session, engine: engine)
        self.keys = keys
        self.store = store
        self.engine = engine
        self.sleep = sleep
        store.onLocalSave = { [weak self] in Task { @MainActor in self?.armPost() } }
    }

    /// SYNC_POST_MS after a local save, one POST. A save while the timer waits does not move it. If
    /// the constant cannot be read, no timer runs and the next foreground or {rev} frame uploads.
    private func armPost() {
        guard postTask == nil else { return }
        postTask = Task { [self] in
            guard let ms = (try? await engine.constant("SYNC_POST_MS")).flatMap({ Int($0) }) else { postTask = nil; return }
            await sleep(ms)
            // A stop() cancelled this timer, and a newer one may hold postTask now.
            if Task.isCancelled { return }
            postTask = nil
            _ = await push()
        }
    }

    // MARK: calls

    public func pull() async -> SyncOutcome {
        if stopped() { return .noAccess }
        return await run { await $0.pullFlow(cold: false) }
    }

    public func push() async -> SyncOutcome {
        if stopped() { return .noAccess }
        if retryInMs != nil { return .backingOff }
        return await run { await $0.postFlow(retry: false, cold: false) }
    }

    /// Cancels every call in flight, the pending retry, the POST timer and the socket. A stop is not a failure.
    /// A later connect() or call starts again.
    public func stop() {
        for t in inflight.values { t.cancel() }
        cancelRetry()
        socketTask?.cancel()
        socketTask = nil
        postTask?.cancel()
        postTask = nil
    }

    /// A key was saved (KeyIntake .stored). It lifts the 401 stop even for the same key, as the web's
    /// saveSyncKey does, clears the failure state, reconnects the socket and pulls. The reply to that
    /// pull applies at once: the person just tapped Save, and a press must not hold it.
    public func keySaved() async -> SyncOutcome {
        refusedKey = nil
        failures = 0
        advisory = nil
        cancelRetry()
        connect()
        return await run { await $0.pullFlow(cold: true) }
    }

    /// scenePhase became active: the old connection may be dead without saying so, and the ledger may
    /// have moved while the app was away. One GET, whatever rev is held.
    public func resume() async -> SyncOutcome {
        connect()
        return await pull()
    }

    /// One frame from /ws. Only `{"rev": <integer>}` counts. A rev above the held rev starts one GET
    /// and returns its outcome. It returns nil and starts nothing when the rev is not newer, when the
    /// 401 stop is in force, or when a call is out: then the rev is remembered, and one GET follows
    /// that call if its reply is older.
    public func receive(socketMessage text: String) async -> SyncOutcome? {
        guard let heard = Self.rev(in: text), !stopped(),
              (try? await engine.call("isNewRev", "[\(rev ?? 0),\(heard)]")) == "true" else { return nil }
        if !inflight.isEmpty || retryOut {
            heardRev = max(heardRev, heard)
            return nil
        }
        return await pull()
    }

    private static func rev(in text: String) -> Int? {
        guard let obj = (try? JSONSerialization.jsonObject(with: Data(text.utf8))) as? [String: Any],
              let n = obj["rev"] as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID() else { return nil }
        return Int(exactly: n.doubleValue)
    }

    /// Starts the socket loop and replaces one that runs: a key is read at each connection. When a
    /// connection ends, the loop waits backoffMs(n) and runs it again. No key, a 401 stop or a
    /// stop() ends the loop.
    public func connect() {
        socketTask?.cancel()
        guard let socket else { socketTask = nil; return }
        socketTask = Task { await socketLoop(socket) }
    }

    /// n counts the connections that ended since the last one that opened.
    private func socketLoop(_ socket: any SyncSocket) async {
        var attempt = 0
        while !Task.isCancelled {
            guard !stopped(), let key = (try? keys.key()) ?? nil else { return }
            let opened = OpenedFlag()
            await socket.run(
                key: key, opened: { opened.set() },
                message: { [weak self] text in Task { @MainActor in _ = await self?.receive(socketMessage: text) } })
            if Task.isCancelled || stopped() { return }
            if opened.value { attempt = 0 }
            guard let ms = await backoff(attempt) else { return }
            attempt += 1
            await sleep(ms)
        }
    }

    private final class OpenedFlag: @unchecked Sendable {
        private let lock = NSLock()
        private var on = false
        var value: Bool { lock.withLock { on } }
        func set() { lock.withLock { on = true } }
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
        // A rev heard while this call was out may be newer than its reply. Look once more.
        if outcome == .applied, inflight.isEmpty, !retryOut, heardRev > (rev ?? 0) {
            heardRev = 0
            Task { _ = await pull() }
        }
        return outcome
    }

    /// Waits for the press gate. False when a stop cancelled the wait. The wait comes before the
    /// generation check, so a tap that lands during the hold is found by it and posted
    /// (native-reply-waits-generation). A cold reply waits for nothing.
    private func pressClear(cold: Bool) async -> Bool {
        if !cold { await pressGate?.waitClear() }
        return !Task.isCancelled
    }

    /// The server apply: every photo id the reply names stays, whatever this device holds
    /// (photo-ids-restore-keep-if-known). Done as the reply arrives, so nothing waits between the
    /// generation check and the adopt.
    private func keepingPhotoIds(_ ledger: [String: Any]) async -> [String: Any] {
        guard var envelopes = ledger["envelopes"] as? [[String: Any]] else { return ledger }
        let held = await photoStore?.heldIds()
        for i in envelopes.indices {
            if let ids = envelopes[i]["photos"] as? [String] { envelopes[i]["photos"] = PhotoIds.kept(ids, held: held, on: .sync) }
        }
        var out = ledger
        out["envelopes"] = envelopes
        return out
    }

    // MARK: flows

    private func pullFlow(cold: Bool) async -> SyncOutcome {
        let gen = store.generation
        switch await send("GET", body: nil) {
        case .noKey: return .noKey
        case .stopped: return .stopped
        case .failed(let code): return await failed(code, retry: false)
        case .ledger(let answer):
            let reply = Answer(ledger: await keepingPhotoIds(answer.ledger), rev: answer.rev, stats: answer.stats)
            guard await pressClear(cold: cold) else { return .stopped }
            // A reply that arrives over an edit, or over data no reply has carried, is not
            // adopted: the POST sends that data and the Worker's merge answers (imports-merge-never-replace).
            if store.generation != gen || !same(store.userData(), carried) { return await postFlow(retry: false, cold: cold) }
            return await adopt(reply, fromPost: false, retry: false)
        case .empty:
            if holdsUserData() { return await postFlow(retry: false, cold: cold) }
            succeeded(fromPost: false)
            return .empty
        }
    }

    private func postFlow(retry: Bool, cold: Bool) async -> SyncOutcome {
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
            case .ledger(let answer):
                let reply = Answer(ledger: await keepingPhotoIds(answer.ledger), rev: answer.rev, stats: answer.stats)
                guard await pressClear(cold: cold) else { return .stopped }
                // The ledger changed while the POST was out, or during the hold: the reply is old. POST again.
                if store.generation != gen { continue }
                return await adopt(reply, fromPost: true, retry: retry)
            }
        }
    }

    private func adopt(_ reply: Answer, fromPost: Bool, retry: Bool) async -> SyncOutcome {
        do {
            try store.adopt(JSONSerialization.data(withJSONObject: reply.ledger))
        } catch {
            return await failed("unknown", retry: retry)
        }
        carried = store.userData()
        if let r = reply.rev { rev = max(rev ?? 0, r) }
        stats = reply.stats
        succeeded(fromPost: fromPost)
        if let onApplied { Task { await onApplied() } }
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
        if fromPost || advisory != "too-big" {
            clearBackoff()
            let now = Date().timeIntervalSince1970 * 1000
            let at = max(lastSyncAt ?? 0, now)
            lastSyncAt = at
            onLastSync?(at)
        }
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
                retryOut = true
                let r = await postFlow(retry: true, cold: false)
                retryOut = false
                if r != .unknown && r != .tooBig && r != .applied { cancelRetry(); return }
            }
        }
    }

    // MARK: wire

    private struct Answer {
        let ledger: [String: Any]
        let rev: Int?
        let stats: [String: Int]?
    }

    private enum Reply {
        case ledger(Answer), empty, failed(String), noKey, stopped
    }

    private func backoff(_ attempt: Int) async -> Int? {
        guard let out = try? await engine.call("backoffMs", "[\(attempt)]") else { return nil }
        return Int(out)
    }

    private func send(_ method: String, body: Data?) async -> Reply {
        guard let key = (try? keys.key()) ?? nil else { return .noKey }
        sentKey = Self.digest(key)
        switch await link.send(key: key, method: method, path: "ledger", body: body, contentType: body == nil ? nil : "application/json") {
        case .stopped: return .stopped
        case .unreachable: return .failed("unknown")
        case .answered(let status, let data):
            switch status {
            case "ok":
                guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let ledger = obj["ledger"] as? [String: Any]
                else { return .failed("unknown") }
                let stats = (obj["stats"] as? [String: Any])?.compactMapValues { $0 as? Int }
                return .ledger(Answer(ledger: ledger, rev: obj["rev"] as? Int, stats: stats))
            case "empty": return .empty
            default: return .failed(status)
            }
        }
    }
}
