import ManifestKit
import SwiftUI

@main
struct ManifestApp: App {
    @State private var model: PackagesModel?
    @State private var failure: String?
    private let keys = KeyStore(service: "com.shivinate.manifest", account: "device-key")
    @State private var engine: RulesEngine?

    var body: some Scene {
        WindowGroup {
            RootView(model: model, failure: failure, width: Self.forcedWidth)
                .task { await boot() }
                .onOpenURL { url in
                    // The key goes to the Keychain and the URL is dropped (native-key-via-url-scheme).
                    guard let engine else { return }
                    Task { _ = await KeyIntake.accept(url, engine: engine, store: keys) }
                }
        }
    }

    /// -ManifestUITestWidth <pt>: frames the root so a narrow device can show a wide case.
    static var forcedWidth: CGFloat? {
        let a = ProcessInfo.processInfo.arguments
        guard let i = a.firstIndex(of: "-ManifestUITestWidth"), i + 1 < a.count, let w = Double(a[i + 1]) else { return nil }
        return CGFloat(w)
    }

    private func boot() async {
        do {
            guard let rules = Bundle.main.url(forResource: "rules", withExtension: "js") else { throw CocoaError(.fileNoSuchFile) }
            let e = try RulesEngine(bundleURL: rules)
            let store = LedgerStore(fileURL: try Self.ledgerURL(), now: { Date().timeIntervalSince1970 * 1000 })
            try store.load()
            let m = PackagesModel(engine: e, store: store)
            try await m.load()
            engine = e
            model = m
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
