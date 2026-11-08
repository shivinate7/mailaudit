import SwiftUI

/// The floating search pill of the Packages and Tally tabs (src/app.jsx `.mdl-pill`; phone-nav-is-bottom-bar, Find). One
/// query serves both tabs, so the text follows `query` and reports each change. It has no clear button: the web's input has
/// none (the coordinator ruling, port default), and the empty list keeps its own Clear search.
///
/// The whole pill is the tap target that focuses the field, so the field may stay one line (a one-line vertical-axis field's hit
/// region is its line height, measured). The field grows to three lines at large text, so the pill grows and never clips the
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
                .lineLimit(1...3).textFieldStyle(.plain).focused($focused).submitLabel(.search)
                .font(.cochin(16, relativeTo: .body)).foregroundStyle(Parchment.ink)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .accessibilityIdentifier("find-field")
        }
        .padding(.horizontal, 16).padding(.vertical, 4)
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
}

extension View {
    /// The Find pill 8pt above the tab bar, and a clear stretch of list above it. The bottom inset moves the last card clear of the
    /// pill, and the pill lifts above the keyboard with it. `show` is false on a screen with no items and on the open Duo.
    func findPill(show: Bool, query: String, change: @escaping (String) -> Void) -> some View {
        safeAreaInset(edge: .bottom, spacing: 0) {
            if show { FindPill(query: query, change: change).padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 8) }
        }
    }
}
