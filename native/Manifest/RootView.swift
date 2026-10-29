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
            LedgerTab(masthead: masthead, store: store, versions: versions, sync: sync, syncOpen: $syncOpen, onLedgerChange: onLedgerChange).parchmentPaper()
                .tabItem { Label("Ledger", systemImage: "gearshape") }.tag(Tab.ledger)
            Group {
                if let orphaned, let masthead {
                    OrphanedView(model: orphaned, masthead: masthead, sync: sync, openSync: showSync, onChange: {
                        // The write has landed: Packages reads the new check-ins, and the figures, the Orphaned line and the slot follow.
                        masthead.saving()
                        try? await model?.load()
                        await masthead.finished(failed: orphaned.error != nil)
                    })
                } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .parchmentPaper()
            .tabItem { Label("Orphaned", systemImage: "envelope") }
            .tag(Tab.orphaned)
            .badge(orphaned?.badgeCount ?? 0)
            Group {
                if let tally, let masthead { TallyView(model: tally, masthead: masthead, sync: sync, openSync: showSync) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .parchmentPaper()
            .tabItem { Label("Tally", systemImage: "number") }
            .tag(Tab.tally)
            Group {
                if let model, let masthead { PackagesView(model: model, masthead: masthead, sync: sync, openSync: showSync, notice: notice, onChange: {
                        // A stamp changed which packages count: Tally and Orphaned read the ledger again (a-refund-leaves-every-count).
                        try? await tally?.load()
                        try? await orphaned?.load()
                    })
                } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .parchmentPaper()
            .tabItem { Label("Packages", systemImage: "shippingbox") }
            .tag(Tab.packages)
        }
        .frame(width: width)
        .tint(Parchment.accent)
        .duoSpine(selection: $tab, items: [
            .init(id: .ledger, title: "Ledger", symbol: "gearshape"), .init(id: .orphaned, title: "Orphaned", symbol: "envelope", badge: orphaned?.badgeCount ?? 0),
            .init(id: .tally, title: "Tally", symbol: "number"), .init(id: .packages, title: "Packages", symbol: "shippingbox"),
        ])
    }
}

struct Placeholder: View {
    let title: String
    var body: some View {
        Text(title).font(.title2).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
