import SwiftUI

/// The search pill of the Packages and Tally tabs (src/app.jsx `.mdl-pill`; phone-nav-is-bottom-bar, Find). On one page it sits in a
/// band under the list, so the list ends above it (`findPill`, notes item 17). One
/// query serves both tabs, so the text follows `query` and reports each change. A clear button shows while the field holds text
/// (owner item 46, answer a, 2026-11-08 10:55 CST; departs from the web's `.mdl-pill`, whose input has none). It does what the web's
/// empty-state "Clear search" does, `setQuery("")` (src/app.jsx MailDayLedger), and the empty list keeps its own Clear search.
/// Its 44 x 44 slot is laid out while the field is empty too, as a clear spacer, so the field never changes width as the first
/// character lands (no-layout-shift-under-pointer).
///
/// At normal text sizes the field holds two lines at rest (`lineLimit(2...3)`). The second line is for the hit region: a
/// vertical-axis field's hit region is its text view, not its frame, and the accessibility audit calls a one-line one smaller than
/// 44pt even inside a 52pt frame (measured, 2026-11-08, find-field at 7168062; the same measure as the Tally search field of N17
/// and the Orphaned composer). Two Cochin lines clear it. At accessibility sizes that reason stops: one line is already taller
/// than 44pt, so the field holds one line (`lineLimit(1...1)`) and the pill follows the text. A second, empty line there sat 20pt
/// (AX3) and 27pt (AX5) above the magnifier and made the pill 87pt and 110pt tall, hiding list rows behind it (design review,
/// screen-check run 43765127724). The whole pill still takes a tap and focuses the field. At normal sizes the field grows to three
/// lines, so the pill grows and never clips the query. The Return key submits: a vertical-axis field types a newline, which is
/// read as the submit.
struct FindPill: View {
    let query: String
    let change: (String) -> Void
    @State private var text = ""
    @FocusState private var focused: Bool
    @Environment(\.dynamicTypeSize) private var typeSize

    /// The web's words at normal sizes. At accessibility sizes the full sentence was cut to "Find card, set, seller, o…" (screen-check
    /// run 43755312311, iPhone 18 Pro at AX5): a placeholder does not wrap in a vertical-axis field, so the short word keeps every letter.
    private var promptText: String { typeSize.isAccessibilitySize ? "Find" : "Find card, set, seller, order" }

    /// Two lines at rest for the 44pt hit region; one at accessibility sizes, where a single line is already taller than 44pt.
    private var fieldLines: ClosedRange<Int> { typeSize.isAccessibilitySize ? 1...1 : 2...3 }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").font(.system(size: 20)).foregroundStyle(Parchment.inkSoft)
                .accessibilityHidden(true)
            TextField("Search", text: Binding(get: { text }, set: { v in
                if v.contains("\n") { text = v.replacingOccurrences(of: "\n", with: ""); focused = false } else { text = v }
            }), prompt: Text(promptText).foregroundStyle(Parchment.inkSoft), axis: .vertical)
                .lineLimit(fieldLines).textFieldStyle(.plain).focused($focused).submitLabel(.search)
                .font(.cochin(16, relativeTo: .body)).foregroundStyle(Parchment.ink)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .accessibilityIdentifier("find-field")
            clearSlot
        }
        .padding(.leading, 16).padding(.trailing, 6).padding(.vertical, 4)
        .frame(maxWidth: .infinity, minHeight: 48)
        // Opaque paper, no material: list text under a translucent pill shows through and fails the contrast audit.
        .background(Capsule().fill(Parchment.paper))
        .overlay(Capsule().strokeBorder(focused ? Parchment.accent : Parchment.line, lineWidth: 1))
        .contentShape(Capsule())
        .onTapGesture { focused = true }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("find-pill")
        .onAppear { text = query }
        .onChange(of: query) { _, new in if new != text { text = new } }
        .onChange(of: text) { _, new in change(new) }
    }

    @ViewBuilder private var clearSlot: some View {
        if text.isEmpty {
            Color.clear.frame(width: 44, height: 44).accessibilityHidden(true)
        } else {
            Button { text = "" } label: {
                Image(systemName: "xmark").font(.system(size: 10, weight: .bold)).foregroundStyle(Parchment.paper)
                    .frame(width: 20, height: 20).background(Circle().fill(Parchment.inkSoft))
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Clear search")
            .accessibilityIdentifier("find-clear")
        }
    }
}

/// Room the pill takes on the open Duo, for a list that scrolls under it: the bar, 8 pt, the pill's 48 pt and 8 pt above it.
enum FindPillMetrics {
    static let height: CGFloat = 48
    static var duoRoom: CGFloat { DuoBarMetrics.height + 8 + height + 8 }
}

extension View {
    /// The Find pill in a band under the list, 8pt above the tab bar. The list ends at the band's top rule, so row text and controls
    /// (a stamp editor's Save, the Tally "+") never sit under the pill at rest; with a bottom inset the scroll view ran full height
    /// under it, rows passed under the opaque pill and failed the contrast audit (notes item 17). The band is in the keyboard-avoiding
    /// safe area, so it lifts with the keys and the list shrinks from its bottom. `show` is false on a screen with no items and on the
    /// open Duo, where the pill is `findPillOnDuo`. Apply an error bar to the list before this, so it sits on the list's edge.
    func findPill(show: Bool, query: String, change: @escaping (String) -> Void) -> some View {
        VStack(spacing: 0) {
            self
            if show {
                FindPill(query: query, change: change)
                    .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 8)
                    .frame(maxWidth: .infinity)
                    .background(Parchment.paper, ignoresSafeAreaEdges: .bottom)
                    .findPillRule()
            }
        }
    }

    /// The 1pt `Parchment.line` rule on a view's top edge, full width: the top of the Find pill's band (the same rule closes the
    /// running head, `RunningHead`). The one home for it.
    func findPillRule() -> some View {
        overlay(alignment: .top) { Rectangle().fill(Parchment.line).frame(height: 1) }
    }

    /// The pill on the open Duo: on the right page, 8 pt above the custom bar (`DuoBarMetrics.height` up from the window's bottom),
    /// whichever page holds the list it filters. `right` is the right page's rect in window points, nil on one page, where this draws
    /// nothing. An overlay, not an inset: the bar's own room is a scroll margin for the same reason (DuoSystemBar). The overlay
    /// reads the window's bottom (`ignoresSafeArea(.container)`) and the keyboard still lifts it. Apply it to the view that fills
    /// the window.
    func findPillOnDuo(show: Bool, right: CGRect?, query: String, change: @escaping (String) -> Void) -> some View {
        overlay {
            Color.clear.overlay(alignment: .bottomLeading) {
                if show, let right {
                    FindPill(query: query, change: change)
                        .frame(width: right.width - 32)
                        .padding(.leading, right.minX + 16)
                        .padding(.bottom, DuoBarMetrics.height + 8)
                }
            }
            .ignoresSafeArea(.container, edges: .bottom)
        }
    }
}
