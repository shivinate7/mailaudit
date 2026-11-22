import ManifestKit
import SwiftUI

/// The canceled orders under the cards, opened by the ruled row's canceled cell (src/app.jsx, the `showCanceled` block): dashed cards,
/// each a seller, its date and order id, a CANCELED mark and its lines. Reference only, for cross-checking refunds; no control
/// is drawn here, and no count reads it (canceled-orders-leave-the-list). Packages and Tally draw it once, here.
struct CanceledList: View {
    let orders: [CanceledPackage]
    /// The id the screen scrolls to when the list opens.
    static let anchor = "canceled-list"

    private func price(_ it: LedgerItem) -> String { "$" + String(format: "%.2f", it.price * Double(it.qty)) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Canceled orders \u{2014} for cross-checking refunds").textCase(.uppercase)
                .font(.mono(11, relativeTo: .caption)).tracking(0.14 * 11).foregroundStyle(Parchment.inkSoft)
                .accessibilityAddTraits(.isHeader)
            ForEach(orders, id: \.gk) { order in card(order) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 28)
        .id(Self.anchor)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canceled-list")
    }

    private func card(_ order: CanceledPackage) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(order.seller).font(.cochin(14, relativeTo: .body).weight(.bold)).foregroundStyle(Parchment.inkSoft).lineLimit(1)
                    Text((order.date.isEmpty ? "" : "\(order.date) \u{00B7} ") + order.orderId)
                        .font(.mono(10.5, relativeTo: .caption)).foregroundStyle(Parchment.inkSoft).lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Text("CANCELED").font(.mono(10, relativeTo: .caption).weight(.bold)).tracking(1).foregroundStyle(Parchment.red)
                    .padding(.horizontal, 8)
                    .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(Parchment.red, lineWidth: 1.5))
                    .fixedSize()
            }
            ForEach(order.items, id: \.key) { it in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text((it.qty > 1 ? "\u{00D7}\(it.qty) " : "") + it.name).font(.cochin(12.5, relativeTo: .footnote))
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(price(it)).font(.mono(11.5, relativeTo: .caption)).fixedSize()
                }
                .foregroundStyle(Parchment.inkSoft).padding(.vertical, 4)
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.inkSoft, style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
        .opacity(0.85)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("canceled-order:\(order.gk)")
    }
}

/// Under the cards: the canceled list while it is open and there is an order to list. Opening it scrolls it to the top of the screen,
/// as the web does (`canceledRef`, scrollIntoView block "start").
struct CanceledListSection: View {
    let options: ViewOptions
    @Environment(\.scrollToStart) private var scrollToStart

    var body: some View {
        Group {
            if options.showCanceled && !options.canceled.isEmpty {
                CanceledList(orders: options.canceled).padding(.horizontal, 16).padding(.bottom, 16)
            }
        }
        .onChange(of: options.showCanceled) { _, open in
            if open { Task { @MainActor in scrollToStart(CanceledList.anchor) } }  // after the list is mounted, as the web waits a frame
        }
    }
}
