import ManifestKit
import SwiftUI

/// Mark all received and Clear check-ins: the bulk row of a Packages card and of an open Tally row, drawn once
/// (native-bulk-check-in). It is a 48pt row of its own, under the card's Stamp slot, so a stamp's Save moves nothing under
/// the thumb (no-layout-shift-under-pointer). Each of the two slots is sized by its widest face, drawn hidden, and the live
/// face draws over it at that size. A control that cannot apply leaves its slot empty, so the other never moves. Mark all
/// offers Undo in its own slot; Clear asks, with two taps, and lapses after 4 seconds (stamp-band-opens-the-editor).
/// Each identifier is `<prefix>-<part>:<key>`: "bulk" on the card (key the group key), "tally-bulk" on the Tally row (key the name).
struct BulkRow: View {
    let prefix: String
    let key: String
    /// Where the hints say the controls reach: "from Alpha Cards", "of Brainstorm".
    let scope: String
    /// The cards the card or row holds, for Mark all's hint.
    let totalCopies: Int
    /// Mark all shows while a line is owed.
    let canMark: Bool
    /// The copies in now: Clear shows while there is one, and the ask names the count.
    let copiesIn: Int
    /// The held Undo is for this card or row.
    let undoOffered: Bool
    /// True while the ask hangs below the row, so the card lets it show.
    @Binding var overhang: Bool
    let mark: () async -> Void
    let undo: () async -> Void
    let clear: () async -> Void

    @State private var armed = false
    @Environment(\.dynamicTypeSize) private var typeSize

    /// A non-breaking hyphen, so the label breaks as "Clear / check-ins", never "check- / ins".
    private static let clearTitle = "Clear check\u{2011}ins"

    private func id(_ part: String) -> String { "\(prefix)-\(part):\(key)" }
    private func cards(_ n: Int) -> String { "\(n) card\(n == 1 ? "" : "s")" }
    private func checkIns(_ n: Int) -> String { "\(n) check-in\(n == 1 ? "" : "s")" }

    var body: some View {
        let stacked = typeSize.isAccessibilitySize
        let layout = stacked ? AnyLayout(VStackLayout(alignment: .trailing, spacing: 8)) : AnyLayout(HStackLayout(spacing: 8))
        layout {
            if !stacked { Spacer(minLength: 0) }
            markSlot
            clearSlot
        }
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, minHeight: 48, alignment: .trailing)
        // The row as one element of its own: a container would take the union of its visible children and follow them.
        .background { Color.clear.accessibilityElement().accessibilityLabel("Check-in controls").accessibilityIdentifier(id("row")) }
        .overlay(alignment: .bottomTrailing) {
            if armed {
                AskPanel(confirmTitle: "Tap again to clear \(checkIns(copiesIn))", cancelID: id("clear-cancel"), confirmID: id("clear-confirm"),
                         cancel: { armed = false }, confirm: { armed = false; Task { await clear() } })
                    .padding(.trailing, 12)
            }
        }
        .zIndex(1)  // the armed ask hangs over the lines below
        .task(id: armed) { if armed { try? await Task.sleep(for: .seconds(4)); armed = false } }
        .onChange(of: armed) { _, a in overhang = a }
        .onChange(of: copiesIn) { _, n in if n == 0 { armed = false } }  // nothing left to clear, so nothing to ask about
    }

    /// Mark all, or its Undo in the same frame. The slot is as wide as "Mark all received".
    private var markSlot: some View {
        MiniLabel(title: "Mark all received").hidden().accessibilityHidden(true)
            .overlay {
                if undoOffered {
                    Button { Task { await undo() } } label: { MiniLabel(title: "Undo mark all", wide: true) }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Undo mark all")
                        .accessibilityHint("Takes back the check-ins it added")
                        .accessibilityIdentifier(id("undo"))
                } else if canMark {
                    Button { Task { await mark() } } label: { MiniLabel(title: "Mark all received", wide: true) }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Mark all received")
                        .accessibilityHint("Checks in all \(cards(totalCopies)) \(scope)")
                        .accessibilityIdentifier(id("mark"))
                }
            }
    }

    private var clearSlot: some View {
        MiniLabel(title: Self.clearTitle).hidden().accessibilityHidden(true)
            .overlay {
                if copiesIn > 0 {
                    Button { armed.toggle() } label: { MiniLabel(title: Self.clearTitle, wide: true) }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Clear check-ins")
                        .accessibilityHint("Asks first. Clears \(checkIns(copiesIn)) \(scope)")
                        .accessibilityIdentifier(id("clear"))
                }
            }
    }
}
