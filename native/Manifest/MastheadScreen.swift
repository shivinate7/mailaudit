import ManifestKit
import SwiftUI

/// One tab's scroll, the same on all four: the masthead, the running-head slot, the sync advisory (not on
/// Ledger), then the tab's own content. The running head is an overlay, never part of the layout, so
/// pinning it moves nothing (masthead-running-head-sticky, no-layout-shift-under-pointer).
/// `masthead` is nil only on the Ledger tab of a ledger that will not open, which must still work
/// (recovery-control-not-state-gated).
struct MastheadScreen<Content: View>: View {
    let masthead: MastheadModel?
    let tab: MastheadTab
    /// The advisory line's source and its way out to the Sync panel. nil draws no line.
    var sync: SyncClient?
    var openSync: () -> Void = {}
    /// A ruled row of the tab's own between the running-head slot and the advisory line (Packages' stamped cell).
    var ruledRow: AnyView?
    /// A drag on the scroll hides the keys at once (`.immediately`: `.interactively` waits for the finger to reach the keys). Off by default: only the Orphaned tab, whose composer's keys cover the tab bar, asks for it.
    var dismissesKeyboard = false
    @ViewBuilder let content: Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.duoSpread) private var spread
    @State private var headHeight: CGFloat = 0
    @State private var pinned = false
    @State private var position = ScrollPosition()
    // The live content offset. A box, so a write each scroll frame does not redraw the content.
    @State private var offset = ScrollOffset()

    /// The web's in-flow `.mdl-sticky`: the 46pt running head and its 1pt rule. A height, not a spacing.
    private static var slot: CGFloat { RunningHead.height + 1 }

    var body: some View {
        // The scroll closure runs off the main actor, so it reads a copy of the height, never the state.
        let pinAt = headHeight
        // On the open Duo spread the scroll keeps no position binding and no offset tracking, so it scrolls as it did before scrollBy
        // existed. Whether the binding caused the spread's flat Orphaned failure is unproven.
        let offSpread = spread.pages(for: tab.duoTab) == nil
        ScrollViewReader { proxy in
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let masthead {
                    MastheadView(model: masthead, tab: tab)
                        .onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { headHeight = $0 }
                    Color.clear.frame(height: Self.slot).accessibilityHidden(true)
                }
                if let ruledRow { ruledRow }
                if let sync { SyncAdvisoryLine(sync: sync, open: openSync) }
                content
            }
        }
        .modifier(ScrollByTracking(on: offSpread, position: $position, offset: offset))
        .scrollDismissesKeyboard(dismissesKeyboard ? .immediately : .automatic)
        // A tab's content asks for a view by id (a focused field, its Save) to be kept above the keyboard.
        .environment(\.scrollTo, { id in withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) { proxy.scrollTo(id, anchor: .bottom) } })
        // A tab's content asks to be moved by a distance: it knows where its view lies and where the keys start, which an id cannot say.
        .environment(\.scrollBy, offSpread
            ? { dy in withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) { position.scrollTo(y: offset.y + dy) } }
            : { _ in })
        // Pinned once the slot's top has passed the scroll view's top edge. A short tab never scrolls that far.
        .onScrollGeometryChange(for: Bool.self, of: { pinAt > 0 && $0.contentOffset.y + $0.contentInsets.top >= pinAt }) { pinned = $1 }
        .overlay(alignment: .top) {
            // Mounted only while pinned: an opacity-0, accessibility-hidden copy was still read by the audit.
            ZStack {
                if let masthead, pinned {
                    RunningHead(figure: masthead.runningFigure).transition(.opacity.combined(with: .offset(y: -3)))
                }
            }
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.16), value: pinned)
        }
        }
    }
}

/// A reference to the scroll view's current offset: ScrollPosition has no relative scroll, so scrollBy adds to this.
private final class ScrollOffset { var y: CGFloat = 0 }

/// The position binding and the offset tracking that scrollBy needs, applied only when `on`. A modifier, so the scroll view's own
/// modifier chain stays one chain.
private struct ScrollByTracking: ViewModifier {
    let on: Bool
    @Binding var position: ScrollPosition
    let offset: ScrollOffset

    @ViewBuilder func body(content: Content) -> some View {
        if on {
            content
                .scrollPosition($position)
                .onScrollGeometryChange(for: CGFloat.self, of: { $0.contentOffset.y }) { offset.y = $1 }
        } else {
            content
        }
    }
}

private extension MastheadTab {
    /// The Duo tab this masthead tab draws, to ask the spread whether it is open on two pages.
    var duoTab: DuoTab {
        switch self {
        case .ledger: .ledger
        case .orphaned: .orphaned
        case .tally: .tally
        case .packages: .packages
        }
    }
}

extension EnvironmentValues {
    /// Scrolls the enclosing MastheadScreen so the view with this id sits at the bottom of the space above the keyboard.
    @Entry var scrollTo: (String) -> Void = { _ in }
    /// Scrolls the enclosing MastheadScreen's content up by this many points (down when negative). Call it on the main actor.
    @Entry var scrollBy: @MainActor (CGFloat) -> Void = { _ in }
}

/// The letterhead's short form: seal, name and the two figures that matter, pinned over the scrolled list.
/// Only opacity and a 3pt offset change, so its height never does; until it pins it is not mounted, so it takes
/// no tap and is not in the accessibility tree, and the audit never reads a second, invisible "Manifest".
private struct RunningHead: View {
    static let height: CGFloat = 46
    let figure: String

    var body: some View {
        HStack(spacing: 8) {
            WaxSeal(size: 22).accessibilityHidden(true)
            MastheadPaint.style(.runningTitle).text("Manifest", size: 16, relativeTo: .headline)
            Spacer(minLength: 0)
            if !figure.isEmpty {
                MastheadPaint.style(.runningFigure).text(figure, size: 11, relativeTo: .caption).lineLimit(1)
            }
        }
        .padding(.horizontal, 16)
        .frame(height: Self.height)
        .frame(maxWidth: .infinity)
        .background(Parchment.paper, ignoresSafeAreaEdges: .top)
        .overlay(alignment: .bottom) { Rectangle().fill(Parchment.line).frame(height: 1) }
        .contentShape(Rectangle())  // pinned, it takes the taps the web's pointer-events: auto takes
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("running-head")
    }
}
