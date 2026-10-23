import ManifestKit
import os
import SwiftUI

@main
struct ManifestApp: App {
    @State private var model: PackagesModel?
    @State private var tally: TallyModel?
    @State private var orphaned: OrphanedModel?
    @State private var masthead: MastheadModel?
    @State private var store: LedgerStore?
    @State private var versions: VersionsModel?
    @State private var failure: String?
    @State private var notice: String?
    private let keys = KeyStore(service: "dev.shivinate.manifest", account: "device-key")
    @State private var engine: RulesEngine?
    @State private var sync: SyncClient?
    @State private var gate: PressGate?
    @Environment(\.scenePhase) private var scenePhase
    private let links = PendingKeyLinks()
    private static let log = Logger(subsystem: "dev.shivinate.manifest", category: "key-link")

    init() { Parchment.load() }

    var body: some Scene {
        WindowGroup {
            RootView(model: model, orphaned: orphaned, tally: tally, masthead: masthead, store: store, sync: sync, versions: versions, onLedgerChange: { await reloadAll() }, failure: failure, notice: notice, width: Self.forcedWidth)
                .background { PressWatcher(gate: gate) }
                .task { await boot() }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { Task { _ = await sync?.resume() } }
                }
                .onOpenURL { url in
                    // The key goes to the Keychain and the URL is dropped (native-key-via-url-scheme).
                    // A link that beats the engine waits in the queue until boot is done.
                    Task { await links.receive(url); await applyLinks() }
                }
        }
    }

    /// -ManifestUITestWidth <pt>: frames the root so a narrow device can show a wide case.
    static var forcedWidth: CGFloat? {
        let a = ProcessInfo.processInfo.arguments
        guard let i = a.firstIndex(of: "-ManifestUITestWidth"), i + 1 < a.count, let w = Double(a[i + 1]) else { return nil }
        return CGFloat(w)
    }

    /// -ManifestUITestSyncStatus <http status>: the sync client runs on a stub that answers that status.
    static var syncStatus: Int? {
        let a = ProcessInfo.processInfo.arguments
        guard let i = a.firstIndex(of: "-ManifestUITestSyncStatus"), i + 1 < a.count else { return nil }
        return Int(a[i + 1])
    }

    private static let workerURL = URL(string: "https://manifestnumberone.shivamsemwal01.workers.dev")!

    /// -ManifestUITestSaveState idle|saving|saved|failed: holds the save slot on one state for the run.
    static var pinnedSave: SaveIndicator? {
        let a = ProcessInfo.processInfo.arguments
        guard let i = a.firstIndex(of: "-ManifestUITestSaveState"), i + 1 < a.count else { return nil }
        return SaveIndicator.allCases.first { "\($0)" == a[i + 1] }
    }

    /// Logs each outcome, never the key.
    private func applyLinks() async {
        guard let engine else { return }
        for o in await links.ready(engine: engine, store: keys) {
            Self.log.notice("key link: \(String(describing: o))")
            if o == .stored { _ = await sync?.keySaved() }
        }
    }

    private func boot() async {
        do {
            guard let rules = Bundle.main.url(forResource: "rules", withExtension: "js") else { throw CocoaError(.fileNoSuchFile) }
            let e = try RulesEngine(bundleURL: rules)
            let clock = { Date().timeIntervalSince1970 * 1000 }
            let vs = VersionStore(directory: try Self.versionsURL(), now: clock, rulesURL: rules)
            let ledgerURL = try Self.ledgerURL()
            let store = LedgerStore(fileURL: ledgerURL, now: clock, rulesURL: rules, versions: vs)
            self.store = store  // before load: Backup and History must work on a ledger that will not open
            versions = VersionsModel(store: store, versions: vs)
            if ProcessInfo.processInfo.arguments.contains("-ManifestUITestCorruptVersion") {
                _ = try? vs.put(Data(#"{"mailday":2,"items":[]}"#.utf8), label: "before import")
            }
            versions?.refresh()
            try store.load()
            notice = LedgerNotice.damagedLine(dropped: store.droppedCount)
            let m = PackagesModel(engine: e, store: store)
            try await m.load()
            let t = TallyModel(engine: e, store: store)
            try await t.load()
            let o = OrphanedModel(engine: e, store: store)
            try await o.load()
            let mast = MastheadModel(engine: e, store: store, pinned: Self.pinnedSave)
            try await mast.refresh()
            masthead = mast
            engine = e
            startSync(engine: e, store: store, ledgerURL: ledgerURL, reload: {
                try? await m.load()
                try? await t.load()
                try? await o.load()
                try? await mast.refresh()
            })
            model = m
            tally = t
            orphaned = o
            await applyLinks()
        } catch {
            failure = "The ledger could not be opened. \(error)"
        }
    }

    /// A UI test run without -ManifestUITestSyncStatus has no sync client, so it stays off the network.
    private func startSync(engine: RulesEngine, store: LedgerStore, ledgerURL: URL, reload: @escaping @MainActor () async -> Void) {
        let sleep: @Sendable (Int) async -> Void = { try? await Task.sleep(for: .milliseconds($0)) }
        let client: SyncClient
        if let status = Self.syncStatus {
            client = SyncClient(
                baseURL: URL(string: "https://sync.test.invalid")!, session: StatusURLProtocol.session(status: status),
                keys: .memory(holding: "ui-test-made-up-key"), store: store, engine: engine, sleep: sleep)
        } else if ProcessInfo.processInfo.arguments.contains("-ManifestUITestSeed") {
            return
        } else {
            // Ephemeral: the Worker sends no Cache-Control, so a shared session would cache ledger replies on disk.
            client = SyncClient(baseURL: Self.workerURL, session: URLSession(configuration: .ephemeral), keys: keys, store: store, engine: engine, sleep: sleep)
            client.socket = URLSessionSyncSocket(baseURL: Self.workerURL)
            client.photoStore = PhotoStore(folder: PhotoStore.folder(besideLedger: ledgerURL), engine: engine)
        }
        let pressGate = PressGate(engine: engine, now: { Date().timeIntervalSince1970 * 1000 }, sleep: sleep)
        client.pressGate = pressGate
        client.onApplied = reload
        gate = pressGate
        sync = client
        client.connect()
        Task { _ = await client.pull() }
    }

    /// A reset or restore changed the ledger: every view reads it again.
    private func reloadAll() async {
        try? await model?.load()
        try? await tally?.load()
        try? await orphaned?.load()
        try? await masthead?.refresh()
    }

    /// With -ManifestUITestSeed the version store starts empty, so a run never counts an earlier one.
    private static func versionsURL() throws -> URL {
        let fm = FileManager.default
        let url = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appending(path: "versions", directoryHint: .isDirectory)
        if ProcessInfo.processInfo.arguments.contains("-ManifestUITestSeed") { try? fm.removeItem(at: url) }
        return url
    }

    /// With -ManifestUITestSeed the ledger is a fresh copy of the bundled fake fixture.
    private static func ledgerURL() throws -> URL {
        let fm = FileManager.default
        let dir = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let url = dir.appending(path: "ledger.json")
        if ProcessInfo.processInfo.arguments.contains("-ManifestUITestSeed") {
            guard let seed = Bundle.main.url(forResource: "ledger", withExtension: "json") else { throw CocoaError(.fileNoSuchFile) }
            try? fm.removeItem(at: url)
            try fm.copyItem(at: seed, to: url)
        } else if !fm.fileExists(atPath: url.path) {
            try Data(#"{"mailday":1,"items":[]}"#.utf8).write(to: url)
        }
        return url
    }
}
