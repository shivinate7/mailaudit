import ManifestKit
import SwiftUI

// The book spine of a foldable (duo-card-in-hand). The root reads the hinge and the fold, publishes them, and on two
// pages side by side swaps the system tab bar for one under the right page. Copied from degen's DuoSpine, not imported.
// On a device without a fold in the window, every value here stays `.single` and nothing moves.

extension EnvironmentValues {
    /// The hinge, as the root last read it. `.none` on a device without one.
    @Entry var duoHinge: DuoHinge = .none
    /// The split of the root, in window points. `.single` on one page.
    @Entry var duoSpread: DuoSpread = .single
    /// True while the custom tab bar is up and the system bar is hidden.
    @Entry var duoCustomBar = false
}

/// The view's size and the fold regions that cross it, in its own space.
struct DuoFold: Equatable {
    var size = CGSize.zero
    var folds: [CGRect] = []
}

/// One button of the custom bar. The title is also the button's accessibility label.
struct DuoBarItem<ID: Hashable> {
    let id: ID
    let title: String
    let symbol: String
    var badge = 0
}

extension View {
    /// Reads the hinge and the fold, publishes `duoHinge` and `duoSpread` to the views below, and on two pages side by side
    /// draws `items` as a tab bar under the right page. Apply once, outside the TabView.
    func duoSpine<ID: Hashable>(selection: Binding<ID>, items: [DuoBarItem<ID>]) -> some View {
        modifier(DuoSpine(selection: selection, items: items))
    }

    /// Hides the system tab bar while the custom one shows. Apply inside each tab, as a bar's visibility is read from the tab's content.
    /// Also keeps the system bar horizontal where iOS 27.1 offers a vertical one. It applies in every pose: a hidden bar has no
    /// layout to change, and the stacked poses and the closed outer screen need the bottom bar (duo-card-in-hand).
    func duoSystemBar() -> some View { modifier(DuoSystemBar()) }
}

private struct DuoSystemBar: ViewModifier {
    @Environment(\.duoCustomBar) private var custom

    func body(content: Content) -> some View {
        content.toolbarVisibility(custom ? .hidden : .automatic, for: .tabBar).duoHorizontalBars()
    }
}

private extension View {
    @ViewBuilder func duoHorizontalBars() -> some View {
        if #available(iOS 27.1, *) { toolbarVerticalBehavior(.disabled) } else { self }
    }

    func onDuoFoldChange(_ action: @escaping (DuoFold) -> Void) -> some View {
        onGeometryChange(for: DuoFold.self) { DuoFold(size: $0.size, folds: divisions($0)) } action: { action($0) }
    }
}

/// The fold regions, framed in the proxy's space. None before iOS 27.1.
private func divisions(_ proxy: GeometryProxy) -> [CGRect] {
    if #available(iOS 27.1, *) {
        // includeInactive: without it the app found no fold at flat (180 degrees) and showed one page (degen, measured on the 27.1 sim).
        // DuoSpread.layout gates the split on the hinge, so a fold frame alone never splits a closed or outer screen.
        return proxy.reservedRegions(kind: .division, options: .includeInactive).map(\.frame)
    }
    return []
}

private struct DuoSpine<ID: Hashable>: ViewModifier {
    @Binding var selection: ID
    let items: [DuoBarItem<ID>]
    @State private var hinge = DuoHinge.none
    @State private var fold = DuoFold()

    func body(content: Content) -> some View {
        let spread = DuoSpread.layout(window: fold.size, folds: fold.folds, hinge: hinge)
        let bar = DuoTabBar.frame(in: spread, height: DuoBarMetrics.height)
        hingeReader(content)
            .environment(\.duoHinge, hinge)
            .environment(\.duoSpread, spread)
            .environment(\.duoCustomBar, bar != nil)
            // The bar floats over the right page, so the tabs keep clear of it as they do of the system bar.
            .safeAreaInset(edge: .bottom, spacing: 0) { Color.clear.frame(height: bar == nil ? 0 : DuoBarMetrics.height) }
            // One host measures the window and draws the bar, so both share one space. A GeometryReader that ignores the safe area
            // measures the whole window.
            .overlay {
                GeometryReader { _ in
                    Color.clear
                        .onDuoFoldChange { fold = $0 }
                        .overlay(alignment: .topLeading) {
                            if let bar {
                                DuoBar(selection: $selection, items: items)
                                    .frame(width: bar.width, height: bar.height)
                                    .offset(x: bar.minX, y: bar.minY)
                            }
                        }
                }
                .ignoresSafeArea()
            }
    }

    // UIHingeInteraction.h says its handler "is invoked with the initial hinge state, and again whenever there is an update",
    // so the probe is the one writer of the hinge state.
    @ViewBuilder private func hingeReader(_ content: Content) -> some View {
        if #available(iOS 27.1, *) {
            content.background(HingeProbe(hinge: $hinge))
        } else {
            content
        }
    }
}

/// An empty view that carries a UIHingeInteraction, the one hinge source: it reports the first state and every update.
@available(iOS 27.1, *)
private struct HingeProbe: UIViewRepresentable {
    @Binding var hinge: DuoHinge

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        view.addInteraction(UIHingeInteraction { _, update in
            hinge = DuoHinge(status: update.hinge?.status, closed: .closed, partiallyOpen: .partiallyOpen, fullyOpen: .fullyOpen)
        })
        return view
    }

    func updateUIView(_ view: UIView, context: Context) {}
}

/// The custom bar's pill and the gap under it, from the mockup.
private enum DuoBarMetrics {
    static let pill: CGFloat = 64
    static let lift: CGFloat = 12
    static var height: CGFloat { pill + lift }
}

/// The tab bar of the open Duo (mockup pose 11, option a): a paper pill, 24 pt in from the page edges and 12 pt up from the bottom.
/// The outer view is the whole strip under the right page, so the identifier frames the page width.
private struct DuoBar<ID: Hashable>: View {
    @Binding var selection: ID
    let items: [DuoBarItem<ID>]

    var body: some View {
        HStack(spacing: 4) {
            ForEach(items, id: \.id) { item in
                let on = item.id == selection
                Button { selection = item.id } label: {
                    VStack(spacing: 4) {
                        Image(systemName: item.symbol).font(.system(size: 20))
                        Text(item.title).font(.cochin(12, relativeTo: .caption))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .foregroundStyle(on ? Parchment.accent : Parchment.inkSoft)
                    .background(on ? Parchment.card.opacity(0.9) : .clear, in: Capsule())
                    .overlay(alignment: .top) { badge(item.badge) }
                    .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(item.title)
                .accessibilityValue(item.badge > 0 ? "\(item.badge)" : "")
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .padding(4)
        .frame(height: DuoBarMetrics.pill)
        .background(.ultraThinMaterial, in: Capsule())
        .background(Parchment.paper.opacity(0.62), in: Capsule())
        .overlay(Capsule().strokeBorder(Parchment.line, lineWidth: 1))
        .shadow(color: Parchment.shadow, radius: 8, y: 4)
        .padding(.horizontal, 24)
        .padding(.bottom, DuoBarMetrics.lift)
        .frame(maxHeight: .infinity, alignment: .bottom)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("duo-tab-bar")
    }

    /// The same red as the system bar's badge (Parchment.paintTabBadge).
    @ViewBuilder private func badge(_ count: Int) -> some View {
        if count > 0 {
            Text("\(count)").font(.mono(10, relativeTo: .caption2)).padding(.horizontal, 4)
                .foregroundStyle(Parchment.badgeText)
                .background(Parchment.badgeFill, in: Capsule())
                .offset(x: 14, y: 4)
        }
    }
}
