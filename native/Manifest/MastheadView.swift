import ManifestKit
import SwiftUI

/// Three columns weighted 1 : 1 : 1.7, as the web tallies are (masthead-tallies-unequal-thirds).
struct Thirds: Layout {
    static let weights: [CGFloat] = [1, 1, 1.7]

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let w = proposal.width ?? 320
        let h = subviews.map { $0.sizeThatFits(.init(width: w / 3, height: nil)).height }.max() ?? 0
        return CGSize(width: w, height: h)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let unit = bounds.width / Self.weights.reduce(0, +)
        var x = bounds.minX
        for (view, weight) in zip(subviews, Self.weights) {
            view.place(at: CGPoint(x: x, y: bounds.minY), proposal: .init(width: unit * weight, height: bounds.height))
            x += unit * weight
        }
    }
}

/// One letterhead: seal between two rules, the title, the house line, the three tallies,
/// then the count line, the outstanding line and the save slot (masthead-is-one-letterhead).
/// Nothing here changes size when a figure or the slot changes (no-layout-shift-under-pointer).
struct MastheadView: View {
    let model: MastheadModel
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var frame: LetterheadFrame?

    /// A seeded UI test run draws the final frame: the audit must not read a half-faded title.
    /// ponytail: tests cannot read an opacity, so this hides the compose from them.
    private var reduceMotion: Bool { systemReduceMotion || ProcessInfo.processInfo.arguments.contains("-ManifestUITestSeed") }
    private var drawn: LetterheadFrame { frame ?? LetterheadMotion.start(reduceMotion: reduceMotion) }

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                rule.accessibilityIdentifier("masthead-rule-left")
                Image(systemName: "seal").font(.system(size: 52)).foregroundStyle(.primary)
                    .frame(width: 52, height: 52)
                    .scaleEffect(drawn.sealScale).opacity(drawn.sealOpacity)
                    .accessibilityElement(children: .ignore).accessibilityLabel("MANIFEST seal")
                    .accessibilityIdentifier("masthead-seal")
                rule.accessibilityIdentifier("masthead-rule-right")
            }
            Text("MANIFEST").font(.largeTitle.weight(.semibold)).fontDesign(.serif).tracking(2)
                .opacity(drawn.titleOpacity).accessibilityIdentifier("masthead-title")
            Text("C.H Postal Company").font(.subheadline).fontDesign(.serif)
                .opacity(drawn.titleOpacity).accessibilityIdentifier("masthead-house")
            if !model.cells.isEmpty { tallies.opacity(drawn.talliesOpacity) }
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("masthead")
        .onAppear {
            guard frame == nil else { return }
            frame = LetterheadMotion.start(reduceMotion: reduceMotion)
            withAnimation(.easeOut(duration: LetterheadMotion.duration(reduceMotion: reduceMotion))) { frame = LetterheadMotion.final }
        }
    }

    private var rule: some View {
        Rectangle().fill(.secondary).frame(height: 1).frame(maxWidth: .infinity)
            .scaleEffect(x: drawn.ruleFill, anchor: .center)
            .accessibilityElement(children: .ignore).accessibilityLabel("rule")
    }

    private var tallies: some View {
        VStack(spacing: 8) {
            // At accessibility text sizes three cells in a row would clip, so they stack.
            (typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8)) : AnyLayout(Thirds())) {
                ForEach(model.cells, id: \.label) { cell in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(cell.label).font(.caption)
                        Text(cell.figure).font(.title3.monospacedDigit().weight(.semibold)).lineLimit(1).minimumScaleFactor(0.6)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())  // the element spans its cell, not its glyphs
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(cell.label).accessibilityValue(cell.figure)
                    .accessibilityIdentifier("tally-\(cell.label)")
                }
            }
            HStack {
                Text(model.countLine).font(.caption).accessibilityIdentifier("masthead-count")
                Spacer(minLength: 8)
                SaveSlot(indicator: model.indicator)
            }
            Text(model.missingLine).font(.footnote.bold())
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("masthead-missing")
        }
    }
}

/// A slot sized by its longest label, so the swap never changes a frame (masthead-save-slot-reserved).
struct SaveSlot: View {
    let indicator: SaveIndicator

    var body: some View {
        ZStack(alignment: .trailing) {
            Text(String(repeating: "0", count: SaveIndicator.reservedCharacters)).hidden()
            Text(indicator.label)
        }
        .font(.caption.monospaced()).lineLimit(1)
        .contentShape(Rectangle())  // the element spans the reserved slot, not the label's glyphs
        .accessibilityElement(children: .ignore)
        .accessibilityAddTraits(.isStaticText)
        .accessibilityLabel(indicator.label)
        .accessibilityIdentifier("save-slot")
    }
}
