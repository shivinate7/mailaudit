import ManifestKit
import SwiftUI

/// Three columns weighted 1 : 1 : 1.7, as the web tallies are (masthead-tallies-unequal-thirds).
struct Thirds: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let w = proposal.width ?? 320
        let h = subviews.map { $0.sizeThatFits(.init(width: w / 3, height: nil)).height }.max() ?? 0
        return CGSize(width: w, height: h)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let weights = MastheadPaint.tallyWeights
        let unit = bounds.width / weights.reduce(0, +)
        var x = bounds.minX
        for (view, weight) in zip(subviews, weights) {
            view.place(at: CGPoint(x: x, y: bounds.minY), proposal: .init(width: unit * weight, height: bounds.height))
            x += unit * weight
        }
    }
}

extension MastheadPaint.Style {
    var color: Color { Parchment.color(token) }

    /// The word in this style at a web pixel size. Tracking is in points, from the size the web gives.
    func text(_ s: String, size: CGFloat, relativeTo: Font.TextStyle) -> Text {
        var font = face == .cochin ? Font.cochin(size, relativeTo: relativeTo) : Font.mono(size, relativeTo: relativeTo)
        if bold { font = font.bold() }
        return Text(uppercase ? s.uppercased() : s).font(font).tracking(tracking * size).foregroundStyle(color)
    }

    /// The web cancels the trailing letter-spacing with a text indent on the title only.
    func indent(size: CGFloat) -> CGFloat { tracking * size }
}

/// A path drawn on the web's 100 by 100 sheet, scaled into whatever rect it is given.
struct SealShape: Shape {
    let sheet: Path
    func path(in rect: CGRect) -> Path { sheet.applying(CGAffineTransform(scaleX: rect.width / 100, y: rect.height / 100)) }
}

/// The wax seal, one shape per layer of `MastheadPaint.seal` (`Seal` in src/app.jsx).
struct WaxSeal: View {
    let size: CGFloat

    var body: some View {
        let k = size / 100
        ZStack {
            ForEach(MastheadPaint.seal, id: \.name) { layer in
                let colors = layer.tokens.map(Parchment.color)
                Group {
                    switch layer.name {
                    case "body":
                        SealShape(sheet: Self.blob)
                            .fill(RadialGradient(colors: colors, center: UnitPoint(x: 0.37, y: 0.30), startRadius: 0, endRadius: 0.78 * size))
                    case "ring":
                        SealShape(sheet: Path(ellipseIn: CGRect(x: 11, y: 11, width: 78, height: 78))).stroke(colors[0], lineWidth: 3.5 * k)
                    case "cut":
                        SealShape(sheet: Self.relief(dy: 0)).stroke(colors[0], style: Self.round(8 * k))
                    case "raised":
                        SealShape(sheet: Self.relief(dy: -3.5)).stroke(colors[0], style: Self.round(3.4 * k))
                    default:
                        SealShape(sheet: Self.shine).fill(colors[0])
                    }
                }
                .opacity(layer.opacity)
            }
        }
        .frame(width: size, height: size)
    }

    private static func round(_ w: CGFloat) -> StrokeStyle { StrokeStyle(lineWidth: w, lineCap: .round, lineJoin: .round) }

    /// A chevron over a bar. The raised copy sits 3.5 units above the cut one.
    private static func relief(dy: CGFloat) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 29, y: 58 + dy))
        p.addLine(to: CGPoint(x: 50, y: 38 + dy))
        p.addLine(to: CGPoint(x: 71, y: 58 + dy))
        p.move(to: CGPoint(x: 31, y: 72 + dy))
        p.addLine(to: CGPoint(x: 69, y: 72 + dy))
        return p
    }

    /// The specular catch: an ellipse tilted 35 degrees about its centre.
    private static let shine = Path(ellipseIn: CGRect(x: 19, y: 19, width: 30, height: 18))
        .applying(CGAffineTransform(translationX: 34, y: 28).rotated(by: -35 * .pi / 180).translatedBy(x: -34, y: -28))

    /// The irregular edge: real wax is never a circle.
    private static let blob: Path = {
        var p = Path()
        p.move(to: CGPoint(x: 50, y: 2))
        let curves: [(CGFloat, CGFloat, CGFloat, CGFloat, CGFloat, CGFloat)] = [
            (69, 2, 80, 9, 88, 20), (96, 31, 99, 45, 96, 59), (92, 75, 81, 90, 65, 95), (50, 100, 34, 98, 22, 89),
            (9, 78, 2, 62, 3, 47), (5, 30, 15, 15, 31, 7), (37, 4, 43, 2, 50, 2),
        ]
        for c in curves {
            p.addCurve(to: CGPoint(x: c.4, y: c.5), control1: CGPoint(x: c.0, y: c.1), control2: CGPoint(x: c.2, y: c.3))
        }
        p.closeSubpath()
        return p
    }()
}

/// One letterhead: seal between two rules, the title, the house line, the three tallies,
/// the bar, then the foot: the count line on row 1, the outstanding line and the save slot on row 2
/// (masthead-is-one-letterhead). Nothing here changes size when a figure or the slot changes, or
/// when the tab changes (no-layout-shift-under-pointer): the count line is one line, so its text can
/// differ between tabs and its height cannot.
struct MastheadView: View {
    let model: MastheadModel
    let tab: MastheadTab
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var frame: LetterheadFrame?

    /// A copy built after the compose starts on the final frame, so a first visit to a later tab never draws the blank one.
    init(model: MastheadModel, tab: MastheadTab) {
        self.model = model
        self.tab = tab
        _frame = State(initialValue: model.hasComposed ? LetterheadMotion.final : nil)
    }

    /// A seeded UI test run draws the final frame: the audit must not read a half-faded title.
    /// ponytail: tests cannot read an opacity, so this hides the compose from them.
    private var reduceMotion: Bool { systemReduceMotion || ProcessInfo.processInfo.arguments.contains("-ManifestUITestSeed") }
    private var drawn: LetterheadFrame { frame ?? LetterheadMotion.start(reduceMotion: reduceMotion) }

    /// The web's clamp(36px, 20px + 4.2vw, 52px) is 36 to 38 on every iPhone width.
    private static let sealSize: CGFloat = 36

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                rule.accessibilityIdentifier("masthead-rule-left")
                WaxSeal(size: Self.sealSize)
                    .scaleEffect(drawn.sealScale).opacity(drawn.sealOpacity)
                    .accessibilityElement(children: .ignore).accessibilityLabel("MANIFEST seal")
                    .accessibilityIdentifier("masthead-seal")
                rule.accessibilityIdentifier("masthead-rule-right")
            }
            .frame(maxWidth: 270)
            .padding(.bottom, 12)
            let title = MastheadPaint.style(.title)
            title.text("Manifest", size: 31, relativeTo: .largeTitle)
                .lineLimit(1).minimumScaleFactor(0.5).padding(.leading, title.indent(size: 31))
                .opacity(drawn.titleOpacity).accessibilityLabel("Manifest").accessibilityIdentifier("masthead-title")
            let house = MastheadPaint.style(.house)
            house.text("C.H Postal Company", size: 10, relativeTo: .caption)
                .lineLimit(1).minimumScaleFactor(0.5).padding(.top, 8)
                .opacity(drawn.titleOpacity).accessibilityLabel("C.H Postal Company").accessibilityIdentifier("masthead-house")
            if !model.cells.isEmpty { tallies.opacity(drawn.talliesOpacity) }
        }
        .padding(.horizontal, 24).padding(.top, 12)  // 24 from each edge, as the web's letterhead sits
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("masthead")
        .onAppear {
            guard frame == nil else { return }
            frame = model.claimStartFrame(reduceMotion: reduceMotion)  // the first copy composes; later copies start drawn
            withAnimation(.easeOut(duration: LetterheadMotion.duration(reduceMotion: reduceMotion))) { frame = LetterheadMotion.final }
        }
    }

    private var rule: some View {
        Rectangle().fill(Parchment.color(MastheadPaint.rule)).opacity(0.75).frame(height: 1).frame(maxWidth: .infinity)
            .scaleEffect(x: drawn.ruleFill, anchor: .center)
            .accessibilityElement(children: .ignore).accessibilityLabel("rule")
    }

    private var divider: some View { Rectangle().fill(Parchment.color(MastheadPaint.divider)).frame(height: 1) }

    private var tallies: some View {
        VStack(spacing: 0) {
            divider.padding(.top, 12)
            // At accessibility text sizes three cells in a row would clip, so they stack.
            let stacked = typeSize.isAccessibilitySize
            (stacked ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8)) : AnyLayout(Thirds())) {
                ForEach(Array(model.cells.enumerated()), id: \.element.label) { i, cell in
                    cellView(cell)
                        .overlay(alignment: .leading) {
                            if i > 0 && !stacked { Rectangle().fill(Parchment.color(MastheadPaint.divider)).frame(width: 1) }
                        }
                        .contentShape(Rectangle())  // the element spans its cell, not its glyphs
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(cell.label).accessibilityValue(cell.figure)
                        .accessibilityIdentifier("tally-\(cell.label)")
                }
            }
            .padding(.top, 12)
            bar.padding(.top, 8)
            countLine
                .padding(.top, 8)
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                MastheadPaint.style(.missing(remaining: model.remaining)).text(model.missingLine, size: 10.5, relativeTo: .caption)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityIdentifier("masthead-missing")
                SaveSlot(indicator: model.indicator)
            }
            .padding(.top, 4)
        }
    }

    /// One line held at its full width inside a clipped frame: the audit calls a one-line limit on custom-font text clipped
    /// (measured on the Tally meta, 2026-10-27). At accessibility sizes it wraps, so the fixed height gives way there only.
    @ViewBuilder private var countLine: some View {
        let text = MastheadPaint.style(.count).text(model.countLine(for: tab), size: 10.5, relativeTo: .caption)
        Group {
            if typeSize.isAccessibilitySize { text.frame(maxWidth: .infinity, alignment: .leading) } else {
                text.fixedSize(horizontal: true, vertical: false).frame(maxWidth: .infinity, alignment: .leading).clipped()
            }
        }
        .accessibilityIdentifier("masthead-count")
    }

    /// Label over figure, both centred. The got figure is accent and bold, the total is soft.
    private func cellView(_ cell: TallyCell) -> some View {
        let label = MastheadPaint.style(.tallyLabel)
        let lead = MastheadPaint.style(.tallyLead), rest = MastheadPaint.style(.tallyRest)
        return VStack(spacing: 4) {
            label.text(cell.label, size: 10, relativeTo: .caption).lineLimit(1).minimumScaleFactor(0.6)
            (lead.text(cell.lead, size: 13, relativeTo: .footnote) + rest.text(cell.rest, size: 13, relativeTo: .footnote))
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity)
    }

    /// Accent while cards are out, green once every card is in. Eight points tall, so a check-in never moves it.
    private var bar: some View {
        Capsule().fill(Parchment.color(MastheadPaint.barTrack))
            .overlay(alignment: .leading) {
                GeometryReader { g in
                    Capsule().fill(Parchment.color(MastheadPaint.barToken(percent: model.percent)))
                        .frame(width: g.size.width * min(max(model.percent, 0), 100) / 100)
                        .animation(reduceMotion ? nil : .easeOut(duration: 0.24), value: model.percent)
                }
            }
            .frame(height: 8)
            .accessibilityElement(children: .ignore)
            .accessibilityAddTraits(.isStaticText)  // as the save slot: a read-out, so the audit asks for no 44pt hit area
            .accessibilityLabel("Cards received")
            .accessibilityValue("\(Int(model.percent)) percent")
            .accessibilityIdentifier("masthead-progress")
    }
}

/// A slot sized by its longest label, so the swap never changes a frame (masthead-save-slot-reserved).
struct SaveSlot: View {
    let indicator: SaveIndicator

    var body: some View {
        ZStack(alignment: .trailing) {
            Text(String(repeating: "0", count: SaveIndicator.reservedCharacters)).hidden()
            Text(indicator.label).foregroundStyle(MastheadPaint.style(.slot(indicator)).color)
        }
        .font(.mono(10.5, relativeTo: .caption)).lineLimit(1)
        .contentShape(Rectangle())  // the element spans the reserved slot, not the label's glyphs
        .accessibilityElement(children: .ignore)
        .accessibilityAddTraits(.isStaticText)
        .accessibilityLabel(indicator.label)
        .accessibilityIdentifier("save-slot")
    }
}
