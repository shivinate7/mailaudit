import ManifestKit
import SwiftUI

/// The system tab bar, four tabs left to right (phone-nav-is-bottom-bar).
/// Ledger holds Backup, History and Reset.
struct RootView: View {
    let model: PackagesModel?
    let orphaned: OrphanedModel?
    let tally: TallyModel?
    let masthead: MastheadModel?
    let store: LedgerStore?
    let sync: SyncClient?
    let versions: VersionsModel?
    let onLedgerChange: () async -> Void
    let failure: String?
    let notice: String?
    let width: CGFloat?

    var body: some View {
        TabView {
            LedgerTab(store: store, versions: versions, onLedgerChange: onLedgerChange).tabItem { Label("Ledger", systemImage: "gearshape") }
            Group {
                if let orphaned { OrphanedView(model: orphaned, onChange: { try? await model?.load() }) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .syncLine(sync)
            .tabItem { Label("Orphaned", systemImage: "envelope.badge") }
            Group {
                if let tally { TallyView(model: tally) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .syncLine(sync)
            .tabItem { Label("Tally", systemImage: "number") }
            Group {
                if let model, let masthead { PackagesView(model: model, masthead: masthead).safeAreaInset(edge: .top) { if let notice { Text(notice).font(.footnote).padding(8) } } } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .syncLine(sync)
            .tabItem { Label("Packages", systemImage: "shippingbox") }
        }
        .frame(width: width)
        .tint(Parchment.accent)
        .background(Parchment.paper.ignoresSafeArea())
    }
}

struct Placeholder: View {
    let title: String
    var body: some View {
        Text(title).font(.title2).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
