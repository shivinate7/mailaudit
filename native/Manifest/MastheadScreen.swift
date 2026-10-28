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
    @ViewBuilder let content: Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var headHeight: CGFloat = 0
    @State private var pinned = false

    /// The web's in-flow `.mdl-sticky`: the 46pt running head and its 1pt rule. A height, not a spacing.
    private static var slot: CGFloat { RunningHead.height + 1 }

    var body: some View {
        // The scroll closure runs off the main actor, so it reads a copy of the height, never the state.
        let pinAt = headHeight
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let masthead {
                    MastheadView(model: masthead, tab: tab)
                        .onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { headHeight = $0 }
                    Color.clear.frame(height: Self.slot).accessibilityHidden(true)
                }
                if let sync { SyncAdvisoryLine(sync: sync, open: openSync) }
                content
            }
        }
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
