import ManifestKit
import os
import SwiftUI

@main
struct ManifestApp: App {
    @State private var model: PackagesModel?
    @State private var tally: TallyModel?
    @State private var orphaned: OrphanedModel?
    @State private var failure: String?
    @State private var notice: String?
    private let keys = KeyStore(service: "dev.shivinate.manifest", account: "device-key")
    @State private var engine: RulesEngine?
    private let links = PendingKeyLinks()
    private static let log = Logger(subsystem: "dev.shivinate.manifest", category: "key-link")

    var body: some Scene {
        WindowGroup {
            RootView(model: model, orphaned: orphaned, tally: tally, failure: failure, notice: notice, width: Self.forcedWidth)
                .task { await boot() }
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

    /// Logs each outcome, never the key.
    private func applyLinks() async {
        guard let engine else { return }
        for o in await links.ready(engine: engine, store: keys) { Self.log.notice("key link: \(String(describing: o))") }
    }

    private func boot() async {
        do {
            guard let rules = Bundle.main.url(forResource: "rules", withExtension: "js") else { throw CocoaError(.fileNoSuchFile) }
            let e = try RulesEngine(bundleURL: rules)
            let store = LedgerStore(fileURL: try Self.ledgerURL(), now: { Date().timeIntervalSince1970 * 1000 }, rulesURL: rules)
            try store.load()
            notice = LedgerNotice.damagedLine(dropped: store.droppedCount)
            let m = PackagesModel(engine: e, store: store)
            try await m.load()
            let t = TallyModel(engine: e, store: store)
            try await t.load()
            let o = OrphanedModel(engine: e, store: store)
            try await o.load()
            engine = e
            model = m
            tally = t
            orphaned = o
            await applyLinks()
        } catch {
            failure = "The ledger could not be opened. \(error)"
        }
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
