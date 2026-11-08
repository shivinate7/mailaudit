import SwiftUI

/// The floating search pill of the Packages and Tally tabs (src/app.jsx `.mdl-pill`; phone-nav-is-bottom-bar, Find). One
/// query serves both tabs, so the text follows `query` and reports each change. A clear button shows while the field holds text
/// (owner item 46, answer a, 2026-11-08 10:55 CST; departs from the web's `.mdl-pill`, whose input has none). It does what the web's
/// empty-state "Clear search" does, `setQuery("")` (src/app.jsx MailDayLedger), and the empty list keeps its own Clear search.
/// Its 44 x 44 slot is laid out while the field is empty too, as a clear spacer, so the field never changes width as the first
/// character lands (no-layout-shift-under-pointer).
///
/// The field holds two lines at rest (`lineLimit(2...3)`): a vertical-axis field's hit region is its text view, not its frame,
/// and the accessibility audit calls a one-line one smaller than 44pt even inside a 52pt frame (measured, 2026-11-08, find-field
/// at 7168062; the same measure as the Tally search field of N17 and the Orphaned composer). Two Cochin lines clear it. The whole pill
/// still takes a tap and focuses the field. The field grows to three lines at large text, so the pill grows and never clips the
/// query. The Return key submits: a vertical-axis field types a newline, which is read as the submit.
struct FindPill: View {
    let query: String
    let change: (String) -> Void
    @State private var text = ""
    @FocusState private var focused: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").font(.system(size: 20)).foregroundStyle(Parchment.inkSoft)
                .accessibilityHidden(true)
            TextField("Search", text: Binding(get: { text }, set: { v in
                if v.contains("\n") { text = v.replacingOccurrences(of: "\n", with: ""); focused = false } else { text = v }
            }), prompt: Text("Find card, set, seller, order").foregroundStyle(Parchment.inkSoft), axis: .vertical)
                .lineLimit(2...3).textFieldStyle(.plain).focused($focused).submitLabel(.search)
                .font(.cochin(16, relativeTo: .body)).foregroundStyle(Parchment.ink)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .accessibilityIdentifier("find-field")
            clearSlot
        }
        .padding(.leading, 16).padding(.trailing, 6).padding(.vertical, 4)
        .frame(maxWidth: .infinity, minHeight: 48)
        // Glass over the paper at 62 percent (the web's backdrop blur over the paper).
        .background { Capsule().fill(.ultraThinMaterial); Capsule().fill(Parchment.paper.opacity(0.62)) }
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
    /// The Find pill 8pt above the tab bar, and a clear stretch of list above it. The bottom inset moves the last card clear of the
    /// pill, and the pill lifts above the keyboard with it. `show` is false on a screen with no items and on the open Duo.
    func findPill(show: Bool, query: String, change: @escaping (String) -> Void) -> some View {
        safeAreaInset(edge: .bottom, spacing: 0) {
            if show { FindPill(query: query, change: change).padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 8) }
        }
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
