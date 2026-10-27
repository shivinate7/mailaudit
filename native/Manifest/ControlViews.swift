import ManifestKit
import SwiftUI

/// The shared controls Orphaned and Tally both draw. Each colour is a token name from `ControlPaint`,
/// turned into a Color by `Parchment`; a caller that needs another meaning (Discard, Save) passes a
/// token name of its own paint enum.
func paint(_ part: ControlPaint.Part) -> Color {
    ControlPaint.token(part).map(Parchment.color) ?? .clear
}

/// The web's mini button label (src/app.jsx miniBtn): mono, 1pt border, radius 5, padded 4 / 8, inside a
/// 44pt hit frame. The frame sits in the label, so the whole frame is the tappable region.
struct MiniLabel: View {
    let title: String
    var size: CGFloat = 11.5
    var bold = false
    var text = paint(.miniText)
    var fill = paint(.miniFill)
    var border = paint(.miniBorder)

    var body: some View {
        Text(title).font(bold ? .mono(size, relativeTo: .caption).weight(.bold) : .mono(size, relativeTo: .caption))
            .foregroundStyle(text).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            .padding(.vertical, 4).padding(.horizontal, 8)
            .background(fill, in: RoundedRectangle(cornerRadius: 5))
            .overlay(RoundedRectangle(cornerRadius: 5).strokeBorder(border, lineWidth: 1))
            .frame(minWidth: 44, minHeight: 44).contentShape(Rectangle())
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
            .background(paint(.advisoryFill), in: RoundedRectangle(cornerRadius: radius))
    }
}
