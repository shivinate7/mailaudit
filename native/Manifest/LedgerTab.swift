import ManifestKit
import SwiftUI
import UIKit

/// The Ledger tab. N8 adds the Data group's Backup row (ledger-tab-holds-options).
/// Backup reads the store whether or not the ledger opened (recovery-control-not-state-gated).
struct LedgerTab: View {
    let store: LedgerStore?
    @State private var shared: SharedFile?
    @State private var failure: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Data").font(.headline).padding(.horizontal, 16).padding(.top, 16)
            Button {
                do {
                    guard let store else { throw CocoaError(.fileNoSuchFile) }
                    let file = try store.backup()
                    let url = FileManager.default.temporaryDirectory.appending(path: file.name)
                    try file.data.write(to: url, options: .atomic)
                    failure = nil
                    shared = SharedFile(url: url)
                } catch {
                    failure = "Could not make the backup. \(error.localizedDescription)"
                }
            } label: {
                // 45, not 44: layout rounding reads a 44pt frame as 43.99999.
                Text("Backup").frame(maxWidth: .infinity, minHeight: 45, alignment: .leading).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)
            .accessibilityIdentifier("backup")
            if let failure { Text(failure).font(.footnote).foregroundStyle(.red).padding(.horizontal, 16) }
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .sheet(item: $shared) { ShareSheet(url: $0.url) }
    }
}

struct SharedFile: Identifiable {
    let url: URL
    var id: URL { url }
}

struct ShareSheet: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: [url], applicationActivities: nil) }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
