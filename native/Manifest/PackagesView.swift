import ManifestKit
import SwiftUI

/// One card per order and seller (packages-group-by-order-seller), painted like the web card.
/// A check-in changes colour, a glyph and the pill's text inside fixed frames, and the bar sits
/// out of flow, so no row changes size (no-layout-shift-under-pointer, card-the-bar-is-out-of-flow).
struct PackagesView: View {
    let model: PackagesModel
    let masthead: MastheadModel
    let sync: SyncClient?
    let openSync: () -> Void
    /// The damaged-ledger line, in the content below the running-head slot like the advisory.
    let notice: String?
    /// Runs after a stamp write, so the other tabs read the new stamps.
    let onChange: () async -> Void

    var body: some View {
        MastheadScreen(masthead: masthead, tab: .packages, sync: sync, openSync: openSync,
                       ruledRow: AnyView(StampedRow(count: model.stampedCount, on: model.showStamped) {
                           Task { try? await model.toggleStamped() }
                       })) {
            VStack(spacing: 0) {
                if let notice { Text(notice).font(.footnote).padding(8) }
                LazyVStack(spacing: 8) {
                    ForEach(model.rows, id: \.gk) { pkg in
                        PackageRow(pkg: pkg, model: model, masthead: masthead, onChange: onChange)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
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
    let onChange: () async -> Void

    private func state(_ item: LedgerItem) -> LineState { LineState(got: model.received[item.key] ?? 0, qty: item.qty) }
    private var packageState: LineState { pkg.items.allSatisfy { state($0) == .done } ? .done : .open }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            StampSection(pkg: pkg, model: model, masthead: masthead, surface: paint(.surface, packageState), onChange: onChange)
            ForEach(pkg.items, id: \.key) { item in
                ItemLine(
                    state: state(item), name: item.name, title: item.name, detail: model.details[item.key] ?? "",
                    price: item.price, readout: model.readouts[item.key], checkInValue: model.labels[item.key] ?? "",
                    checkInID: "checkin:\(item.key)", key: item.key,
                    onTap: {
                        masthead.saving()
                        await model.tap(key: item.key)  // a failure shows in model.checkInError
                        await masthead.finished(failed: model.checkInError != nil)
                    },
                    onStep: { delta in
                        masthead.saving()
                        await model.step(key: item.key, by: delta)  // a failure shows in model.checkInError
                        await masthead.finished(failed: model.checkInError != nil)
                    })
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
            // As on the web: seller and date share a column, the status slot sits at the trailing edge.
            // The slot has a fixed size, so a long seller truncates in the column and a check-in moves nothing.
            HStack(alignment: .center, spacing: 8) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(pkg.seller).font(.cochin(15).weight(.bold)).foregroundStyle(paint(.seller, packageState))
                        .lineLimit(1).truncationMode(.tail).minimumScaleFactor(0.5)  // measured: with no scale the audit calls a short seller "Text clipped", at 0.9 still "Alpha Cards"
                        .textSelection(.enabled)  // owner ruling 2026-10-21: the header text is selectable, seller included
                        .contentShape(Rectangle())  // measured: without it, the selectable date below takes the seller's long press
                    dateLine
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                statusSlot
            }
            if let url = model.orderLinks[pkg.gk] {
                HStack(spacing: 0) {
                    Link(destination: url) {
                        Text(pkg.orderId).font(.mono(11)).underline()
                            .foregroundStyle(paint(.orderId, packageState))
                            .frame(minWidth: 45, minHeight: 45, alignment: .leading)  // 45: layout rounding read a 44pt frame as 43.99999
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
        Text(pkg.date).font(.mono(11)).foregroundStyle(paint(.orderId, packageState)).lineLimit(1).textSelection(.enabled)
            .contentShape(Rectangle())  // keeps its long press off the seller line above
            .accessibilityLabel("Ordered \(pkg.date)")  // a bare date failed the Dynamic Type audit
    }

    /// The pill, or the RECEIVED stamp once nothing is owed. An invisible widest pill sets the
    /// slot's size and the live one is drawn over it, so a check-in never changes the layout.
    private var statusSlot: some View {
        Text("99 left \u{00B7} refunded").font(.cochin(12.5).weight(.bold))
            .padding(.horizontal, 8).padding(.vertical, 4)
            .frame(minHeight: 28)
            .hidden()
            // The slot is an element of its own, sized by the invisible pill. An accessibility container
            // would take the union of its visible children, so the pill and the stamp would give it two frames.
            .background {
                Color.clear.accessibilityElement().accessibilityLabel("Order status")
                    .accessibilityValue(status.accessibilityValue)
                    .accessibilityIdentifier("card-slot:\(pkg.gk)")
            }
            .overlay(alignment: .trailing) {
                switch status {
                case .pill(let pill):
                    Text(pill).font(.cochin(12.5).weight(.bold)).foregroundStyle(paint(.pillText, .open))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(paint(.pillFill, .open)))
                        .fixedSize()
                        .accessibilityIdentifier("card-pill:\(pkg.gk)")
                case .refunded(let pill):
                    Text(pill).font(.cochin(12.5).weight(.bold)).foregroundStyle(paint(.refundPillText, .open))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(paint(.refundPillFill, .open)))
                        .fixedSize()
                        .accessibilityIdentifier("card-pill:\(pkg.gk)")
                case .received:
                    Text("RECEIVED").font(.mono(10.5).weight(.bold)).tracking(1).foregroundStyle(paint(.border, .done))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(paint(.border, .done), lineWidth: 2))
                        .rotationEffect(.degrees(-4))
                        .fixedSize()
                case .blank:
                    EmptyView()
                }
            }
    }

    private var status: PackageCard.Status { PackageCard.Status(done: packageState == .done, pill: model.pills[pkg.gk], refundPill: model.refundPills[pkg.gk]) }

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
