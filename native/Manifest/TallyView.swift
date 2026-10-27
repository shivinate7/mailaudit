import ManifestKit
import SwiftUI

/// A token of shared/tokens.json as a colour, for a part of a Tally row.
private func paint(_ part: TallyRowPaint.Part, done: Bool = false) -> Color {
    TallyRowPaint.token(part, done: done).map(Parchment.color) ?? .clear
}

/// One row per product name (tally-pools-on-the-exact-name). A check-in swaps a glyph inside a
/// fixed 45pt frame and the row keeps its outstanding line mounted, so nothing moves
/// (no-layout-shift-under-pointer). The order is the model's frozen order.
struct TallyView: View {
    let model: TallyModel
    let masthead: MastheadModel
    let sync: SyncClient?
    let openSync: () -> Void
    @State private var text = ""
    @FocusState private var searching: Bool
    /// The last view-level refresh that failed, so the rows on screen are never silently stale.
    @State private var failure: String?
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        // Search, sort and Hide received scroll under the masthead until the Ledger tab's View group lands.
        MastheadScreen(masthead: masthead, tab: .tally, sync: sync, openSync: openSync) {
            controls
            VStack(spacing: 12) {
                ForEach(model.rows, id: \.name) { TallyRowView(row: $0, model: model, masthead: masthead) }
                if model.rows.isEmpty { empty }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
        }
        .overlay(alignment: .bottom) {
            if let e = model.checkInError ?? failure {
                Text(e).font(.cochin(13, relativeTo: .footnote)).foregroundStyle(paint(.name)).padding(12).frame(maxWidth: .infinity)
                    .background(paint(.surface))
                    .overlay(alignment: .top) { Rectangle().fill(paint(.border)).frame(height: 1) }
                    .accessibilityIdentifier("checkin-error")
            }
        }
        .task { await run { try await model.viewOpened() } }  // another view may have checked something in
    }

    private func run(_ op: () async throws -> Void) async {
        do { try await op(); failure = nil } catch { failure = "Could not update the Tally. \(error.localizedDescription)" }
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 0) {
            // A plain field, not .searchable: its own clear button would be a second Clear control.
            // A vertical-axis field: the audit calls the text of a one-line UITextField clipped, and a vertical field's hit
            // region is only its line height unless it holds two lines (measured). Its Return key types a newline, so a
            // newline is read as the submit.
            TextField("Search", text: Binding(get: { text }, set: { v in
                if v.contains("\n") { text = v.replacingOccurrences(of: "\n", with: ""); searching = false } else { text = v }
            }), prompt: Text("Find card, set, seller, order").foregroundStyle(Parchment.inkSoft), axis: .vertical)
                .lineLimit(2...3).textFieldStyle(.plain).focused($searching).submitLabel(.search)
                .font(.cochin(16, relativeTo: .body)).foregroundStyle(paint(.name))
                .padding(.horizontal, 12)
                .frame(minHeight: 44)  // inside the box, so the field's own frame is the 44pt hit region
                .background(paint(.surface), in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.line, lineWidth: 1))
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .accessibilityIdentifier("tally-search")
                .onChange(of: text) { _, new in Task { await run { try await model.setQuery(new) } } }
            // One row, stacked at large text sizes so neither control is clipped.
            if typeSize >= .xxxLarge {
                VStack(alignment: .leading, spacing: 0) { sortMenu; hideToggle }
            } else {
                HStack { sortMenu; Spacer(); hideToggle }
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    private var sortMenu: some View {
        Menu {
            ForEach(TallySort.allCases, id: \.self) { key in
                Button { Task { await run { try await model.setSort(key) } } } label: {
                    if key == model.sort { Label(key.label, systemImage: "checkmark") } else { Text(key.label) }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text(model.sort.label).font(.mono(11.5, relativeTo: .caption)).foregroundStyle(Parchment.accent)
                Image(systemName: "chevron.up.chevron.down").imageScale(.small).foregroundStyle(paint(.meta))
            }
            .frame(minHeight: 44)
        }
        .accessibilityLabel("Sort")
        .accessibilityValue(model.sort.label)
        .accessibilityIdentifier("tally-sort")
    }

    private var hideToggle: some View {
        Toggle(isOn: Binding(
            get: { model.hideReceived },
            set: { on in Task { await run { try await model.setHideReceived(on) } } })) {
            Text("Hide received").font(.cochin(15, relativeTo: .body)).foregroundStyle(paint(.name))
        }
        .tint(Parchment.accent)
        .frame(minHeight: 44)
        .accessibilityIdentifier("tally-hide")
    }

    /// One sentence and one Clear control, only while a search is what empties the list.
    private var empty: some View {
        VStack(spacing: 8) {
            Text(!model.query.isEmpty ? "No product matches this search."
                : model.hideReceived ? "Everything here has been checked in." : "Nothing to show.")
                .font(.cochin(14, relativeTo: .body)).foregroundStyle(paint(.meta)).multilineTextAlignment(.center)
            if !model.query.isEmpty {
                Button { text = "" } label: { MiniLabel(title: "Clear search") }
                    .accessibilityLabel("Clear search")
                    .accessibilityIdentifier("tally-clear")
            }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 32).padding(.horizontal, 8)
    }
}

struct TallyRowView: View {
    let row: TallyRow
    let model: TallyModel
    let masthead: MastheadModel
    @State private var open = false
    @Environment(\.dynamicTypeSize) private var typeSize

    private var done: Bool { row.got >= row.qty }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button { open.toggle() } label: { header }
                .buttonStyle(.plain)
                .accessibilityIdentifier("tally-toggle:\(row.name)")
            if open {
                Text(row.acrossLine + (row.hiddenNote.map { " \u{00B7} \($0)" } ?? ""))
                    .font(.mono(10.5, relativeTo: .caption)).foregroundStyle(paint(.across))
                    .padding(.horizontal, 12).padding(.bottom, 4)
                ForEach(row.copies, id: \.key) { copy in copyLine(copy) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { bar }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        // The shadow sits on the fill, not the card: a shadow on the card is drawn under every leaf view in it.
        .background(RoundedRectangle(cornerRadius: 8).fill(paint(.surface)).shadow(color: Parchment.shadow, radius: 2, y: 1))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.border, done: done), lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("tally-row:\(row.name)")
    }

    private var header: some View {
        HStack(spacing: 8) {
            Text("\u{25B6}").font(.mono(10, relativeTo: .caption)).foregroundStyle(paint(.disclosure))
                .rotationEffect(.degrees(open ? 90 : 0))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 0) {
                Text(row.name).font(.cochin(15, relativeTo: .headline).weight(.bold)).foregroundStyle(paint(.name))
                    .multilineTextAlignment(.leading)
                // Counts first, then the sets, so a long set list is what is cut first (card-tally-row-counts-first).
                metaLine
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            VStack(alignment: .trailing, spacing: 0) {
                Text(row.ratio).font(.mono(15, relativeTo: .headline).weight(.bold)).foregroundStyle(paint(.ratio, done: done))
                Text(row.rateLine).font(.mono(11.5, relativeTo: .caption)).foregroundStyle(paint(.rate))
                // Hidden once in, never removed: unmounting it would shorten the row under the thumb.
                Text(row.leftLine).font(.cochin(12, relativeTo: .caption).weight(.bold)).foregroundStyle(paint(.left))
                    .opacity(done ? 0 : 1).accessibilityHidden(done)
            }
            .fixedSize(horizontal: true, vertical: false)
        }
        .padding(12)
        .frame(minHeight: 44)
        .contentShape(Rectangle())
    }

    /// One line, cut at the column's edge as on the web, and wrapping at accessibility sizes.
    @ViewBuilder private var metaLine: some View {
        let text = Text(row.meta).font(.mono(11, relativeTo: .caption)).foregroundStyle(paint(.meta))
        if typeSize.isAccessibilitySize { text } else {
            text.fixedSize(horizontal: true, vertical: false).frame(maxWidth: .infinity, alignment: .leading).clipped()
        }
    }

    /// The 3pt bar on the card's top edge, out of flow: it mounts without moving a row. Gone at none in and at all in.
    /// It uses PackageCard's bar tokens, as step 3's card does.
    @ViewBuilder private var bar: some View {
        if let fraction = row.barFraction {
            paint(.barTrack, .open).frame(height: 3)
                .overlay(alignment: .leading) {
                    GeometryReader { g in paint(.barFill, .open).frame(width: g.size.width * fraction) }
                }
                .allowsHitTesting(false)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(row.got) of \(row.qty) copies in")
                .accessibilityIdentifier("tally-bar:\(row.name)")
        }
    }

    /// One copy the row counts, drawn by the item line Packages draws (one home): the seller is the title.
    private func copyLine(_ item: LedgerItem) -> some View {
        let got = min(item.qty, model.received[item.key] ?? 0)
        let meta = ((item.qty > 1 ? ["\u{00D7}\(item.qty)"] : []) + [item.date, item.set, item.finish, item.condition])
            .filter { !$0.isEmpty }.joined(separator: " \u{00B7} ")
        return ItemLine(
            state: LineState(got: got, qty: item.qty), name: item.name, title: item.seller, detail: meta, price: item.price,
            orderID: item.orderId, readout: model.readouts[item.key], checkInID: "tally-checkin:\(item.key)",
            copyID: "tally-copy:\(item.key)", key: item.key,
            onTap: {
                masthead.saving()
                await model.tap(key: item.key)  // a failure shows in model.checkInError
                await masthead.finished(failed: model.checkInError != nil)
            },
            onStep: { delta in
                masthead.saving()
                await model.step(key: item.key, by: delta)
                await masthead.finished(failed: model.checkInError != nil)
            })
    }
}
