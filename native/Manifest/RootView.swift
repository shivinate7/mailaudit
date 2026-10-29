import ManifestKit
import SwiftUI

/// The system tab bar, four tabs left to right (phone-nav-is-bottom-bar).
/// Ledger holds Sync, History, Backup and Reset.
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

    private enum Tab { case ledger, orphaned, tally, packages }
    @State private var tab = Tab.ledger
    /// The Ledger tab's Sync panel. The advisory line on a working screen opens it (ruled-head-one-advisory-entrance).
    @State private var syncOpen = false

    private func showSync() {
        syncOpen = true
        tab = .ledger
    }

    var body: some View {
        TabView(selection: $tab) {
            LedgerTab(store: store, versions: versions, sync: sync, syncOpen: $syncOpen, onLedgerChange: onLedgerChange).parchmentPaper()
                .tabItem { Label("Ledger", systemImage: "gearshape") }.tag(Tab.ledger)
            Group {
                if let orphaned { OrphanedView(model: orphaned, onChange: { try? await model?.load() }) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .syncLine(sync, open: showSync)
            .parchmentPaper()
            .tabItem { Label("Orphaned", systemImage: "envelope") }
            .tag(Tab.orphaned)
            .badge(orphaned?.badgeCount ?? 0)
            Group {
                if let tally { TallyView(model: tally) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .syncLine(sync, open: showSync)
            .parchmentPaper()
            .tabItem { Label("Tally", systemImage: "number") }
            .tag(Tab.tally)
            Group {
                if let model, let masthead { PackagesView(model: model, masthead: masthead).safeAreaInset(edge: .top) { if let notice { Text(notice).font(.footnote).padding(8) } } } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .syncLine(sync, open: showSync)
            .parchmentPaper()
            .tabItem { Label("Packages", systemImage: "shippingbox") }
            .tag(Tab.packages)
        }
        .frame(width: width)
        .tint(Parchment.accent)
    }
}

struct Placeholder: View {
    let title: String
    var body: some View {
        Text(title).font(.title2).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
