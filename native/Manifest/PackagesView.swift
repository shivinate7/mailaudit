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
            // One line, tail-truncated as on the web: a re-wrap on a check-in would move every row below.
            Text(pkg.seller).font(.cochin(15).weight(.bold)).foregroundStyle(paint(.seller, packageState))
                .lineLimit(1).truncationMode(.tail).textSelection(.enabled)
            // The slot's width is reserved, so the choice between the two layouts never depends on a check-in.
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 8) { dateLine; Spacer(minLength: 0); statusSlot }
                VStack(alignment: .trailing, spacing: 0) {
                    dateLine.frame(maxWidth: .infinity, alignment: .leading)
                    statusSlot
                }
            }
            if let url = model.orderLinks[pkg.gk] {
                HStack(spacing: 0) {
                    Link(destination: url) {
                        Text(pkg.orderId).font(.mono(11)).underline()
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

    private var dateLine: some View {
        Text(pkg.date).font(.mono(11)).foregroundStyle(paint(.orderId, packageState)).textSelection(.enabled)
            .accessibilityLabel("Ordered \(pkg.date)")  // a bare date failed the Dynamic Type audit
    }

    /// The pill, or the RECEIVED stamp once nothing is owed. An invisible widest pill sets the
    /// slot's size and the live one is drawn over it, so a check-in never changes the layout.
    private var statusSlot: some View {
        Text("99 left \u{00B7} $99.99").font(.cochin(12.5).weight(.bold))
            .padding(.horizontal, 8).padding(.vertical, 4)
            .frame(minHeight: 28)
            .hidden()
            .overlay(alignment: .trailing) {
                if let pill = model.pills[pkg.gk] {
                    Text(pill).font(.cochin(12.5).weight(.bold)).foregroundStyle(paint(.pillText, .open))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(paint(.pillFill, .open)))
                        .fixedSize()
                        .accessibilityIdentifier("card-pill:\(pkg.gk)")
                } else {
                    Text("RECEIVED").font(.mono(10.5).weight(.bold)).tracking(1).foregroundStyle(paint(.border, .done))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(paint(.border, .done), lineWidth: 2))
                        .rotationEffect(.degrees(-4))
                        .fixedSize()
                }
            }
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
                    Text(item.name).font(.cochin(14).weight(.semibold)).foregroundStyle(paint(.name, state))
                    Spacer(minLength: 0)
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(PackageCard.priceText(item.price)).font(.mono(12)).foregroundStyle(paint(.price, state)).fixedSize()
                            .accessibilityLabel("Price \(PackageCard.priceText(item.price))")
                        if item.qty > 1 { count }
                    }
                }
                Text(model.details[item.key] ?? "").font(.cochin(11.5)).foregroundStyle(paint(.detail, state))
            }
            .padding(.top, 12)
            .padding(.trailing, 12)
        }
        .padding(.leading, 4)
        .frame(minHeight: 45, alignment: .top)
        .background(paint(.rowFill, state))
        .overlay(alignment: .top) { paint(.rule, state).frame(height: 1) }
    }

    /// How many of a multi-copy line are in, as the web's got/qty. An invisible qty/qty sets the width, so a
    /// shorter figure (10/12 to 9/12) never changes the row. A partly received line is bold.
    private var count: some View {
        let got = min(model.received[item.key] ?? 0, item.qty)
        return Text("\(item.qty)/\(item.qty)").font(.mono(13))
            .hidden()
            .overlay(alignment: .trailing) {
                Text("\(got)/\(item.qty)").font(.mono(13).weight(state == .partial ? .bold : .regular))
                    .foregroundStyle(paint(.name, state)).fixedSize()
                    .accessibilityLabel("\(model.labels[item.key] ?? "\(got) of \(item.qty)") received")
            }
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
