import Foundation
import Observation

/// A 413 from the Worker: the photo is over its cap.
public enum PhotoTransportError: Error, Equatable, Sendable { case tooLarge }

/// The Worker /photos route. The HTTP client is lane N4a's and is not built (debt `n10-photos-unwired`).
public protocol PhotoTransport: Sendable {
    /// File names as GET /photos gives them. Nil: the Worker could not say.
    func list() async throws -> [String]?
    /// POST /photos/<name>. Throws PhotoTransportError.tooLarge on a 413.
    func put(name: String, data: Data) async throws
    /// GET /photos/<name>. Nil on a 404.
    func get(name: String) async throws -> Data?
}

public struct PhotoSyncReport: Equatable, Sendable {
    /// False when the Worker's list was not read. Then nothing moved and nothing is reported lost.
    public var known = false
    /// True when the local store could not be read (photo-ids-unreadable-local).
    public var unreadable = false
    public var stopped = false, failed = false
    public var pushed: [String] = [], pulled: [String] = []
    public var lost: [String] = [], tooBig: [String] = []
    /// Wanted transfers not made: failed, stopped, over the batch, not tried.
    public var left = 0
}

/// Pushes and pulls photo blobs against a PhotoTransport. The plan is photoPlan in the rules bundle
/// (rules-run-in-javascriptcore), run over the referenced ids, the ids held here, and the Worker's ids.
@MainActor @Observable
public final class PhotoSync {
    public struct Progress: Equatable, Sendable {
        public let done: Int, total: Int
        public init(done: Int, total: Int) { self.done = done; self.total = total }
    }

    /// One run moves at most this many (PHOTO_BATCH in src/app.jsx).
    public static let batchSize = 25

    public private(set) var running = false
    public private(set) var progress: Progress?

    private let store: PhotoStore
    private let transport: PhotoTransport
    private let engine: RulesEngine
    private var current: Task<PhotoSyncReport, Never>?
    private var stopRequested = false

    public init(store: PhotoStore, transport: PhotoTransport, engine: RulesEngine) {
        self.store = store
        self.transport = transport
        self.engine = engine
    }

    public func push(referenced: [String]) async -> PhotoSyncReport {
        await run { await self.doPush(referenced) }
    }

    public func pull(referenced: [String]) async -> PhotoSyncReport {
        await run { await self.doPull(referenced) }
    }

    /// Cancels the call in flight and starts no more. With nothing running it does nothing, so a later
    /// run is not cancelled by it. The next run resumes from the set difference.
    public func stop() {
        guard running else { return }
        stopRequested = true
        current?.cancel()
    }

    // MARK: runs

    private func run(_ body: @escaping @MainActor () async -> PhotoSyncReport) async -> PhotoSyncReport {
        guard !running else { return PhotoSyncReport() }
        running = true
        stopRequested = false
        let work = Task { await body() }
        current = work
        let report = await work.value
        current = nil
        running = false
        progress = nil
        return report
    }

    private struct Plan {
        var toPush: [String], toPull: [String], lost: [String]
        /// Worker file name by photo id.
        var names: [String: String]
    }

    /// Nil when the run cannot go on; `report` then says why.
    private func survey(_ referenced: [String], _ report: inout PhotoSyncReport) async -> Plan? {
        guard let held = await store.heldIds() else { report.unreadable = true; return nil }
        guard let listed = try? await transport.list() else { return nil }
        var names: [String: String] = [:]
        for name in listed {
            if let id: String = await rule("photoIdFromName", [name]) { names[id] = name }
        }
        let input: [String: Any] = [
            "referenced": referenced, "local": held.sorted(),
            "remote": ["known": true, "ids": names.keys.sorted()] as [String: Any],
        ]
        guard let plan: [String: Any] = await rule("photoPlan", [input]), plan["known"] as? Bool == true else { return nil }
        report.known = true
        return Plan(toPush: plan["toPush"] as? [String] ?? [], toPull: plan["toPull"] as? [String] ?? [],
                    lost: plan["lost"] as? [String] ?? [], names: names)
    }

    private func doPush(_ referenced: [String]) async -> PhotoSyncReport {
        var r = PhotoSyncReport()
        guard let plan = await survey(referenced, &r) else { return r }
        r.lost = plan.lost
        let batch = Array(plan.toPush.prefix(Self.batchSize))
        progress = Progress(done: 0, total: batch.count)
        for id in batch {
            if stopRequested { r.stopped = true; break }
            do {
                guard let blob = try await store.get(id: id) else { continue }  // swept out from under us
                let name: String = await rule("photoName", [id, blob.mime]) ?? ""
                try await transport.put(name: name, data: blob.data)
                r.pushed.append(id)
                progress = Progress(done: r.pushed.count, total: batch.count)
            } catch PhotoTransportError.tooLarge {
                r.tooBig.append(id)  // one photo over the cap must not block the ones behind it
            } catch {
                if stopRequested { r.stopped = true } else { r.failed = true }  // stop, don't grind
                break
            }
        }
        r.left = plan.toPush.count - r.pushed.count - r.tooBig.count
        return r
    }

    /// Never throws: a photo problem must not abort the ledger apply that called it.
    private func doPull(_ referenced: [String]) async -> PhotoSyncReport {
        var r = PhotoSyncReport()
        guard let plan = await survey(referenced, &r) else { return r }
        r.lost = plan.lost
        let batch = Array(plan.toPull.prefix(Self.batchSize))
        progress = Progress(done: 0, total: batch.count)
        for id in batch {
            if stopRequested { r.stopped = true; break }
            guard let name = plan.names[id] else { continue }
            do {
                guard let data = try await transport.get(name: name) else { continue }
                let mime: String = await rule("mimeFromName", [name]) ?? "application/octet-stream"
                try await store.put(id: id, blob: PhotoBlob(data: data, mime: mime))
                r.pulled.append(id)
                progress = Progress(done: r.pulled.count, total: batch.count)
            } catch {
                if stopRequested { r.stopped = true } else { r.failed = true }
                break
            }
        }
        r.left = plan.toPull.count - r.pulled.count
        return r
    }

    /// One rules-bundle call, args and result as JSON.
    private func rule<T>(_ fn: String, _ args: [Any]) async -> T? {
        guard let json = try? JSONSerialization.data(withJSONObject: args),
              let out = try? await engine.call(fn, String(decoding: json, as: UTF8.self)),
              let value = try? JSONSerialization.jsonObject(with: Data(out.utf8), options: .fragmentsAllowed)
        else { return nil }
        return value as? T
    }
}
