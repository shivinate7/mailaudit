import ManifestKit
import SwiftUI

/// The Undo notice both lists share: a line, Undo and a dismiss, in the green notice paint (OrphanedPaint holds the tokens).
/// It takes the place of the card a change took out of its list: an envelope the Orphaned pile lost, or a package the Packages
/// list dropped on a Mark all (undo-removes-only-its-delta). One view, so the two never drift.
struct UndoNoticeBar: View {
    let line: String
    /// The identifier of the Undo button; the dismiss button's is `<undoID>-dismiss`.
    let undoID: String
    let undo: () async -> Void
    let dismiss: () -> Void
    /// True once another write ended the Undo. The bar keeps its place and size, and its buttons are no tap target and not read.
    var inert = false

    private func paint(_ part: OrphanedPaint.Part) -> Color { OrphanedPaint.token(part).map(Parchment.color) ?? .clear }

    var body: some View {
        HStack(spacing: 8) {
            Text(line)
                .font(.cochin(13, relativeTo: .footnote)).foregroundStyle(paint(.noticeText))
                .frame(maxWidth: .infinity, alignment: .leading)
            Button { Task { await undo() } } label: { MiniLabel(title: "Undo", vertical: 4, horizontal: 8) }
                .buttonStyle(.plain).accessibilityIdentifier(undoID).inertWhen(inert)
            Button(action: dismiss) {
                Image(systemName: "xmark").font(.footnote).foregroundStyle(paint(.dismiss)).frame(width: 44, height: 44).contentShape(Rectangle())
            }
            .buttonStyle(.plain).accessibilityLabel("Dismiss").accessibilityIdentifier("\(undoID)-dismiss").inertWhen(inert)
        }
        .padding(.leading, 12).padding(.vertical, 4)
        .background(paint(.noticeFill), in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.noticeBorder), lineWidth: 1))
    }
}

private extension View {
    /// Invisible, untappable and out of the accessibility tree, yet laid out: the bar keeps its height (no-layout-shift-under-pointer).
    func inertWhen(_ inert: Bool) -> some View {
        opacity(inert ? 0 : 1).allowsHitTesting(!inert).accessibilityHidden(inert)
    }
}
