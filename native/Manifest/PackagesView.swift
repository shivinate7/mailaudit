import ManifestKit
import SwiftUI

/// One card per order and seller (packages-group-by-order-seller), painted like the web card.
/// A check-in changes colour, a glyph and the pill's text inside fixed frames, and the bar sits
/// out of flow, so no row changes size (no-layout-shift-under-pointer, card-the-bar-is-out-of-flow).
struct PackagesView: View {
    let model: PackagesModel
    let masthead: MastheadModel

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                MastheadView(model: masthead)
                LazyVStack(spacing: 8) {
                    ForEach(model.rows, id: \.gk) { pkg in
                        PackageRow(pkg: pkg, model: model, masthead: masthead)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
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

/// A token of shared/tokens.json as a colour, or clear when the part has no paint.
private func paint(_ part: PackageCard.Part, _ state: LineState) -> Color {
    PackageCard.token(part, state).map(Parchment.color) ?? .clear
}

struct PackageRow: View {
    let pkg: Package
    let model: PackagesModel
    let masthead: MastheadModel

    private func state(_ item: LedgerItem) -> LineState { LineState(got: model.received[item.key] ?? 0, qty: item.qty) }
    private var packageState: LineState { pkg.items.allSatisfy { state($0) == .done } ? .done : .open }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            ForEach(pkg.items, id: \.key) { item in
                ItemLine(item: item, state: state(item), model: model, masthead: masthead)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(paint(.surface, packageState))
        .overlay(alignment: .top) { bar }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.border, packageState), lineWidth: 1))
        .shadow(color: Parchment.shadow, radius: 1, y: 1)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("package-row:\(pkg.gk)")
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(pkg.seller).font(.cochin(15).weight(.bold)).foregroundStyle(paint(.seller, packageState)).lineLimit(1).textSelection(.enabled)
                    Text(pkg.date).font(.mono(11)).foregroundStyle(paint(.orderId, packageState)).lineLimit(1).textSelection(.enabled)
                }
                Spacer(minLength: 0)
                // One slot holds the pill or the stamp, so the last check-in moves nothing.
                Group {
                    if let pill = model.pills[pkg.gk] {
                        Text(pill).font(.cochin(12.5).weight(.bold)).foregroundStyle(paint(.pillText, .open))
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .background(Capsule().fill(paint(.pillFill, .open)))
                            .accessibilityIdentifier("card-pill:\(pkg.gk)")
                    } else {
                        Text("RECEIVED").font(.mono(10.5).weight(.bold)).tracking(1).foregroundStyle(paint(.border, .done))
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(paint(.border, .done), lineWidth: 2))
                            .rotationEffect(.degrees(-4))
                    }
                }
                .frame(minHeight: 28)
                .fixedSize()
            }
            if let url = model.orderLinks[pkg.gk] {
                HStack(spacing: 0) {
                    Link(destination: url) {
                        Text(pkg.orderId).font(.mono(11)).underline().lineLimit(1)
                            .foregroundStyle(paint(.orderId, packageState))
                            .frame(minWidth: 44, minHeight: 44, alignment: .leading)
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("Order \(pkg.orderId) on TCGplayer")
                    .accessibilityIdentifier("order-link:\(pkg.gk)")
                    Spacer(minLength: 0)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 12)
    }

    /// The thin bar on the card's top edge, out of flow: it mounts without moving a row.
    @ViewBuilder private var bar: some View {
        if let fraction = model.bars[pkg.gk] {
            let total = pkg.items.reduce(0) { $0 + $1.qty }
            paint(.barTrack, .open).frame(height: 3)
                .overlay(alignment: .leading) {
                    GeometryReader { g in paint(.barFill, .open).frame(width: g.size.width * fraction) }
                }
                .allowsHitTesting(false)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(Int((fraction * Double(total)).rounded())) of \(total) copies in")
                .accessibilityIdentifier("card-bar:\(pkg.gk)")
        }
    }
}

/// One item: a 45pt check-in frame holding a 30pt square box, the name and detail in Cochin, the price in mono.
private struct ItemLine: View {
    let item: LedgerItem
    let state: LineState
    let model: PackagesModel
    let masthead: MastheadModel

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Button {
                Task {
                    masthead.saving()
                    await model.tap(key: item.key)  // a failure shows in model.checkInError
                    await masthead.finished(failed: model.checkInError != nil)
                }
            } label: {
                box.frame(width: 45, height: 45)  // 45: layout rounding made a 44pt frame read 43.99999
            }
            .accessibilityLabel("\(state == .done ? "Undo check in" : "Check in") \(item.name)")
            .accessibilityValue(model.labels[item.key] ?? "")
            .accessibilityIdentifier("checkin:\(item.key)")
            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(item.name).font(.cochin(14).weight(.semibold)).foregroundStyle(paint(.name, state)).lineLimit(2)
                    Spacer(minLength: 0)
                    Text(PackageCard.priceText(item.price)).font(.mono(12)).foregroundStyle(paint(.price, state))
                }
                Text(model.details[item.key] ?? "").font(.cochin(11.5)).foregroundStyle(paint(.detail, state)).lineLimit(1)
            }
            .padding(.top, 12)
            .padding(.trailing, 12)
        }
        .padding(.leading, 4)
        .frame(minHeight: 45, alignment: .top)
        .background(paint(.rowFill, state))
        .overlay(alignment: .top) { paint(.rule, state).frame(height: 1) }
    }

    private var box: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8).fill(paint(.boxFill, state))
            RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.boxBorder, state), lineWidth: 2)
            switch state {
            case .done: Image(systemName: "checkmark").font(.system(size: 15, weight: .heavy)).foregroundStyle(paint(.boxMark, state))
            case .partial: Text("\u{2013}").font(.system(size: 16)).foregroundStyle(paint(.boxMark, state))
            case .open: EmptyView()
            }
        }
        .frame(width: 30, height: 30)
    }
}
