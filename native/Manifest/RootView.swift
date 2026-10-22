import ManifestKit
import SwiftUI

/// The system tab bar, four tabs left to right (phone-nav-is-bottom-bar).
/// Ledger is a placeholder.
struct RootView: View {
    let model: PackagesModel?
    let orphaned: OrphanedModel?
    let tally: TallyModel?
    let failure: String?
    let notice: String?
    let width: CGFloat?

    var body: some View {
        TabView {
            Placeholder(title: "Ledger").tabItem { Label("Ledger", systemImage: "gearshape") }
            Group {
                if let orphaned { OrphanedView(model: orphaned, onChange: { try? await model?.load() }) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .tabItem { Label("Orphaned", systemImage: "envelope.badge") }
            Group {
                if let tally { TallyView(model: tally) } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .tabItem { Label("Tally", systemImage: "number") }
            Group {
                if let model { PackagesView(model: model).safeAreaInset(edge: .top) { if let notice { Text(notice).font(.footnote).padding(8) } } } else { Placeholder(title: failure ?? "Opening the ledger") }
            }
            .tabItem { Label("Packages", systemImage: "shippingbox") }
        }
        .frame(width: width)
    }
}

struct Placeholder: View {
    let title: String
    var body: some View {
        Text(title).font(.title2).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
