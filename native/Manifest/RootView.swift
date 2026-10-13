import ManifestKit
import SwiftUI

/// The system tab bar, four tabs left to right (phone-nav-is-bottom-bar).
/// Ledger, Orphaned and Tally are placeholders in lane N5.
struct RootView: View {
    let model: PackagesModel?
    let failure: String?
    let notice: String?
    let width: CGFloat?

    var body: some View {
        TabView {
            Placeholder(title: "Ledger").tabItem { Label("Ledger", systemImage: "gearshape") }
            Placeholder(title: "Orphaned").tabItem { Label("Orphaned", systemImage: "envelope.badge") }
            Placeholder(title: "Tally").tabItem { Label("Tally", systemImage: "number") }
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
