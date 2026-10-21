import ManifestKit
import SwiftUI

/// One row per product name (tally-pools-on-the-exact-name). A check-in swaps a glyph inside a
/// fixed 45pt frame and the row keeps its outstanding line mounted, so nothing moves
/// (no-layout-shift-under-pointer). The order is the model's frozen order.
struct TallyView: View {
    let model: TallyModel
    @State private var text = ""
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        VStack(spacing: 0) {
            controls
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(model.rows, id: \.name) { TallyRowView(row: $0, model: model) }
                    if model.rows.isEmpty { empty }
                }
                .padding(.horizontal, 16)
            }
        }
        .overlay(alignment: .bottom) {
            if let e = model.checkInError {
                Text(e).font(.footnote).padding(12).frame(maxWidth: .infinity)
                    .background(.regularMaterial).accessibilityIdentifier("checkin-error")
            }
        }
        .task { try? await model.load() }  // another view may have checked something in
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 0) {
            // A plain field, not .searchable: its own clear button would be a second Clear control.
            TextField("Search", text: $text)
                .textFieldStyle(.roundedBorder)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .frame(minHeight: 44)
                .accessibilityIdentifier("tally-search")
                .onChange(of: text) { _, new in Task { try? await model.setQuery(new) } }
            // One row, stacked at large text sizes so neither control is clipped.
            if typeSize >= .xxxLarge {
                VStack(alignment: .leading, spacing: 0) { sortMenu; hideToggle }
            } else {
                HStack { sortMenu; Spacer(); hideToggle }
            }
        }
        .padding(.horizontal, 16)
    }

    private var sortMenu: some View {
        Menu {
            ForEach(TallySort.allCases, id: \.self) { key in
                Button { Task { try? await model.setSort(key) } } label: {
                    if key == model.sort { Label(key.label, systemImage: "checkmark") } else { Text(key.label) }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text(model.sort.label)
                Image(systemName: "chevron.up.chevron.down").imageScale(.small)
            }
            .frame(minHeight: 44)
        }
        .tint(.primary)  // the accent blue is below the contrast floor on paper
        .accessibilityLabel("Sort")
        .accessibilityValue(model.sort.label)
        .accessibilityIdentifier("tally-sort")
    }

    private var hideToggle: some View {
        Toggle("Hide received", isOn: Binding(
            get: { model.hideReceived },
            set: { on in Task { try? await model.setHideReceived(on) } }))
            .frame(minHeight: 44)
            .accessibilityIdentifier("tally-hide")
    }

    /// One sentence and one Clear control, only while a search is what empties the list.
    private var empty: some View {
        VStack(spacing: 8) {
            Text(!model.query.isEmpty ? "No product matches this search."
                : model.hideReceived ? "Everything here has been checked in." : "Nothing to show.")
            if !model.query.isEmpty {
                Button("Clear search") { text = "" }
                    .frame(minHeight: 44)
                    .accessibilityIdentifier("tally-clear")
            }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 32)
    }
}

struct TallyRowView: View {
    let row: TallyRow
    let model: TallyModel
    @State private var open = false

    private var done: Bool { row.got >= row.qty }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button { open.toggle() } label: { header }
                .buttonStyle(.plain)
                .accessibilityIdentifier("tally-toggle:\(row.name)")
            if open {
                Text(row.acrossLine + (row.hiddenNote.map { " \u{00B7} \($0)" } ?? ""))
                    .font(.caption.monospacedDigit()).padding(.horizontal, 12).padding(.bottom, 8)
                ForEach(row.copies, id: \.key) { CopyView(item: $0, model: model) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(done ? Color.green : Color.secondary.opacity(0.4)))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("tally-row:\(row.name)")
    }

    private var header: some View {
        HStack(spacing: 8) {
            Image(systemName: "chevron.right").imageScale(.small).rotationEffect(.degrees(open ? 90 : 0))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 0) {
                Text(row.name).font(.headline)
                // Counts first, then the sets, so a long set list is what wraps last (card-tally-row-counts-first).
                Text(row.meta).font(.caption.monospaced())
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 0) {
                Text(row.ratio).font(.headline.monospacedDigit())
                Text(row.rateLine).font(.caption.monospacedDigit())
                // Hidden once in, never removed: unmounting it would shorten the row under the thumb.
                Text(row.leftLine).font(.caption.monospacedDigit())
                    .opacity(done ? 0 : 1).accessibilityHidden(done)
            }
        }
        .padding(12)
        .frame(minHeight: 44)
        .contentShape(Rectangle())
    }
}

/// One copy the row counts: where it came from, and its own check-in control.
struct CopyView: View {
    let item: LedgerItem
    let model: TallyModel

    var body: some View {
        let got = min(item.qty, model.received[item.key] ?? 0)
        let isDone = got >= item.qty
        let meta = ((item.qty > 1 ? ["\u{00D7}\(item.qty)"] : []) + [item.date, item.set, item.finish, item.condition])
            .filter { !$0.isEmpty }.joined(separator: " \u{00B7} ")
        VStack(spacing: 0) {
        Divider()
        HStack {
            VStack(alignment: .leading, spacing: 0) {
                Text(item.seller).font(.subheadline.weight(.semibold))
                Text(meta).font(.caption)
                Text(item.orderId).font(.caption.monospaced())
            }
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("tally-copy:\(item.key)")
            Spacer()
            Button {
                Task { await model.tap(key: item.key) }  // a failure shows in model.checkInError
            } label: {
                Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                    .frame(width: 45, height: 45).foregroundStyle(.primary)  // 45: layout rounding made a 44pt frame read 43.99999
            }
            .accessibilityLabel("\(isDone ? "Undo check in" : "Check in") \(item.name)")
            .accessibilityIdentifier("tally-checkin:\(item.key)")
        }
        .padding(.horizontal, 12)
        .frame(minHeight: 44)
        .background(isDone ? Color.green.opacity(0.12) : .clear)
        }
    }
}
