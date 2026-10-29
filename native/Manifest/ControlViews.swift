import ManifestKit
import SwiftUI

/// The shared controls Orphaned and Tally both draw. Each colour is a token name from `ControlPaint`,
/// turned into a Color by `Parchment`; a caller that needs another meaning (Discard, Save) passes a
/// token name of its own paint enum.
func paint(_ part: ControlPaint.Part) -> Color {
    ControlPaint.token(part).map(Parchment.color) ?? .clear
}

/// The web's mini button label (src/app.jsx miniBtn): mono, 1pt border, radius 5, padded 8 / 12 unless the caller
/// passes the web's tighter padding for a compact spot, inside a 44pt hit frame. The frame sits in the label, so
/// the whole frame is the tappable region.
struct MiniLabel: View {
    let title: String
    var size: CGFloat = 11.5
    var bold = false
    var text = paint(.miniText)
    var fill = paint(.miniFill)
    var border = paint(.miniBorder)
    var vertical: CGFloat = 8
    var horizontal: CGFloat = 12
    /// The pill fills the width it is offered, as a web `flex: 1` button does.
    var wide = false

    /// The 44pt hit frame is drawn around the pill without taking layout space (a header row stays as tall as the web's).
    var outsetHit = false

    private var pill: some View {
        Text(title).font(bold ? .mono(size, relativeTo: .caption).weight(.bold) : .mono(size, relativeTo: .caption))
            .foregroundStyle(text).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            .padding(.vertical, vertical).padding(.horizontal, horizontal)
            .frame(maxWidth: wide ? .infinity : nil)
            .overlay(RoundedRectangle(cornerRadius: 5).strokeBorder(border, lineWidth: 1))
            .background(fill, in: RoundedRectangle(cornerRadius: 5))
    }

    private var framed: some View { pill.frame(minWidth: 44, minHeight: 44).contentShape(Rectangle()) }

    var body: some View {
        if outsetHit {
            // .combine folds the hit frame into the Button's one element, which carries the Button's id and the title.
            OutsetHit {
                pill.hidden().accessibilityHidden(true)
                framed
            }
            .accessibilityElement(children: .combine)
        } else {
            framed
        }
    }
}

/// Two subviews: the first sets the size, and the second (the same label in its 44pt hit frame) is centred on it and
/// may overflow it. Layout reads the first only, so the hit frame costs no space.
private struct OutsetHit: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        subviews[0].sizeThatFits(proposal)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews[0].place(at: bounds.origin, proposal: ProposedViewSize(bounds.size))
        subviews[1].place(at: CGPoint(x: bounds.midX, y: bounds.midY), anchor: .center, proposal: ProposedViewSize(bounds.size))
    }
}

/// The manila advisory line (a tie, a tag): manilaInk on manila.
struct AdvisoryText: View {
    let line: String
    var font: Font
    var radius: CGFloat = 6

    var body: some View {
        Text(line).font(font).foregroundStyle(paint(.advisoryText))
            .padding(.vertical, 4).padding(.horizontal, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(paint(.advisoryFill), in: RoundedRectangle(cornerRadius: radius))
    }
}
