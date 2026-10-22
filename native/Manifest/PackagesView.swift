import ManifestKit
import SwiftUI

/// One row per order and seller (packages-group-by-order-seller). A check-in swaps
/// a glyph inside a fixed 44pt frame, so no row changes size (no-layout-shift-under-pointer).
struct PackagesView: View {
    let model: PackagesModel
    let masthead: MastheadModel

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                MastheadView(model: masthead)
                ForEach(model.rows, id: \.gk) { pkg in
                    PackageRow(pkg: pkg, model: model, masthead: masthead)
                    Divider()
                }
            }
        }
        .overlay(alignment: .bottom) {
            if let e = model.checkInError {
                Text(e).font(.footnote).padding(12).frame(maxWidth: .infinity)
                    .background(.regularMaterial).accessibilityIdentifier("checkin-error")
            }
        }
    }
}

struct PackageRow: View {
    let pkg: Package
    let model: PackagesModel
    let masthead: MastheadModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("\(pkg.seller), \(pkg.orderId)").font(.headline)
                .frame(minHeight: 44, alignment: .leading)
            ForEach(pkg.items, id: \.key) { item in
                let isDone = model.done[item.key] ?? false
                HStack {
                    VStack(alignment: .leading) {
                        Text(item.name)
                        Text(model.labels[item.key] ?? "").font(.caption).monospacedDigit()
                            .foregroundStyle(.primary)
                    }
                    Spacer()
                    Button {
                        Task {
                            masthead.saving()
                            await model.tap(key: item.key)  // a failure shows in model.checkInError
                            await masthead.finished(failed: model.checkInError != nil)
                        }
                    } label: {
                        Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                            .frame(width: 45, height: 45).foregroundStyle(.primary)  // 45: layout rounding made a 44pt frame read 43.99999
                    }
                    .accessibilityLabel("\(isDone ? "Undo check in" : "Check in") \(item.name)")
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
