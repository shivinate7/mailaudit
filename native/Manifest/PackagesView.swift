import ManifestKit
import SwiftUI

/// One row per order and seller (packages-group-by-order-seller). A check-in swaps
/// a glyph inside a fixed 44pt frame, so no row changes size (no-layout-shift-under-pointer).
struct PackagesView: View {
    let model: PackagesModel

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                ForEach(model.rows, id: \.gk) { pkg in
                    PackageRow(pkg: pkg, model: model)
                    Divider()
                }
            }
        }
    }
}

struct PackageRow: View {
    let pkg: Package
    let model: PackagesModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("\(pkg.seller), \(pkg.orderId)").font(.headline)
                .frame(minHeight: 44, alignment: .leading)
            ForEach(pkg.items, id: \.key) { item in
                let got = model.received[item.key] ?? 0
                HStack {
                    VStack(alignment: .leading) {
                        Text(item.name)
                        Text("\(got) of \(item.qty)").font(.caption).monospacedDigit()
                            .foregroundStyle(.primary)
                    }
                    Spacer()
                    Button {
                        Task { try? await model.checkIn(key: item.key, count: got >= item.qty ? 0 : item.qty) }
                    } label: {
                        Image(systemName: got >= item.qty ? "checkmark.circle.fill" : "circle")
                            .frame(width: 44, height: 44).foregroundStyle(.primary)
                    }
                    .accessibilityLabel("\(got >= item.qty ? "Undo check in" : "Check in") \(item.name)")
                    .accessibilityIdentifier("checkin:\(item.key)")
                }
                .frame(minHeight: 44)
            }
        }
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("package-row:\(pkg.gk)")
    }
}
