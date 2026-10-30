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
    @Environment(\.duoSpread) private var spread
    /// The name the open Duo's right page shows. nil until a row is tapped, which shows the first row (the mockup selects one at open).
    @State private var picked: String?

    private var pages: (left: CGRect, right: CGRect)? { spread.pages(for: .tally) }
    private var current: TallyRow? { pickedOrFirst(model.rows, picked: picked, id: \.name) }

    var body: some View {
        Group {
            if let pages {
                // The mockup (pose 9) draws names with ratios on the left page, and the selected name, its totals and copies on the right.
                // Search, sort, Hide received and the masthead are not drawn there. Default, not owner: they keep the one-page order, at the top of the left page.
                DuoPages(pages: pages) { list.overlay(alignment: .bottom) { errorBar } } right: { detail }
            } else {
                list.overlay(alignment: .bottom) { errorBar }
            }
        }
        .task { await run { try await model.viewOpened() } }  // another view may have checked something in
    }

    private var list: some View {
        // Search, sort and Hide received scroll under the masthead until the Ledger tab's View group lands.
        MastheadScreen(masthead: masthead, tab: .tally, sync: sync, openSync: openSync) {
            controls
            VStack(spacing: 12) {
                ForEach(model.rows, id: \.name) { row in
                    TallyRowView(row: row, model: model, masthead: masthead,
                                 page: pages == nil ? .inline : .cell(selected: row.name == current?.name) { picked = row.name })
                }
                if model.rows.isEmpty { empty }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
        }
    }

    private var detail: some View {
        ScrollView {
            if let row = current { TallyRowView(row: row, model: model, masthead: masthead, page: .detail).padding(16) }
        }
        .id(current?.name)  // a new pick starts a fresh page: scroll and row state do not carry over
    }

    @ViewBuilder private var errorBar: some View {
        if let e = model.checkInError ?? failure {
            Text(e).font(.cochin(13, relativeTo: .footnote)).foregroundStyle(paint(.name)).padding(12).frame(maxWidth: .infinity)
                .background(paint(.surface))
                .overlay(alignment: .top) { Rectangle().fill(paint(.border)).frame(height: 1) }
                .accessibilityIdentifier("checkin-error")
        }
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
                Button { text = "" } label: { MiniLabel(title: "Clear search", vertical: 4, horizontal: 8) }
                    .accessibilityLabel("Clear search")
                    .accessibilityIdentifier("tally-clear")
            }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 32).padding(.horizontal, 8)
    }
}

struct TallyRowView: View {
    /// Where the row is drawn. `.inline` is the one-page row that opens in place. On the open Duo the left page draws `.cell`,
    /// whose tap picks the name, and the right page draws `.detail`: the name, its totals and its copies, with no card around them.
    enum Page {
        case inline
        case cell(selected: Bool, pick: () -> Void)
        case detail
    }

    let row: TallyRow
    let model: TallyModel
    let masthead: MastheadModel
    var page = Page.inline
    @State private var open = false
    /// True while the armed Clear ask hangs below the bulk row, so the card draws above its neighbours.
    @State private var overhang = false

    private var done: Bool { row.got >= row.qty }
    private var isOpen: Bool { if case .inline = page { open } else { false } }
    private var selected: Bool { if case .cell(true, _) = page { true } else { false } }

    var body: some View {
        if case .detail = page { detail } else { card }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button { if case let .cell(_, pick) = page { pick() } else { open.toggle() } } label: { header }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? .isSelected : [])
                .accessibilityIdentifier("tally-toggle:\(row.name)")
            if isOpen {
                across
                bulkRow
                VStack(alignment: .leading, spacing: 0) { copyLines }.clipShape(UnevenRoundedRectangle(bottomLeadingRadius: 8, bottomTrailingRadius: 8))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        // The card clips its lines and its bar, not itself: the armed ask hangs below the bulk row and may reach past a
        // short card's edge (as on the Packages card).
        .overlay(alignment: .top) { bar.clipShape(UnevenRoundedRectangle(topLeadingRadius: 8, topTrailingRadius: 8)) }
        // The shadow sits on the fill, not the card: a shadow on the card is drawn under every leaf view in it.
        .background(RoundedRectangle(cornerRadius: 8).fill(paint(.surface)).shadow(color: Parchment.shadow, radius: 2, y: 1))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.border, done: done), lineWidth: 1))
        .pickedMark(selected)
        .zIndex(overhang ? 1 : 0)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("tally-row:\(row.name)")
    }

    private var detail: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(row.name).font(.cochin(20, relativeTo: .title2).weight(.bold)).foregroundStyle(paint(.name))
                .multilineTextAlignment(.leading)
                .padding(.horizontal, 12).padding(.bottom, 4)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("tally-detail-title")
            across
            bulkRow
            copyLines
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Mark all received and Clear check-ins on every copy of the product, the ones a filter hides included. The Tally has no
    /// Stamp, so the row holds the two controls alone (native-bulk-check-in).
    private var bulkRow: some View {
        func run(_ act: @escaping () async throws -> Void) async {
            masthead.saving()
            do { try await act() } catch {}  // the model has put the reason in checkInError, which the screen shows
            await masthead.finished(failed: model.checkInError != nil)
        }
        return BulkRow(prefix: "tally-bulk", key: row.name, scope: "of \(row.name)", totalCopies: row.qty, canMark: row.got < row.qty,
                       copiesIn: row.got, undoOffered: model.bulkUndoName == row.name, overhang: $overhang,
                       mark: { await run { try await model.bulk(name: row.name, on: true) } },
                       undo: { await run { try await model.undoBulk() } },
                       clear: { await run { try await model.bulk(name: row.name, on: false) } })
    }

    private var across: some View {
        Text(row.acrossLine + (row.hiddenNote.map { " \u{00B7} \($0)" } ?? ""))
            .font(.mono(10.5, relativeTo: .caption)).foregroundStyle(paint(.across))
            .padding(.horizontal, 12).padding(.bottom, 4)
    }

    private var copyLines: some View {
        ForEach(row.copies, id: \.key) { copy in copyLine(copy) }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Text("\u{25B6}").font(.mono(10, relativeTo: .caption)).foregroundStyle(paint(.disclosure))
                .rotationEffect(.degrees(isOpen ? 90 : 0))
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
                    .opacity(done ? 0 : 1).accessibilityHidden(done).accessibilityIdentifier("tally-left:\(row.name)")
            }
            .fixedSize(horizontal: true, vertical: false)
        }
        .padding(12)
        .frame(minHeight: 44)
        .contentShape(Rectangle())
    }

    private var metaLine: some View {
        CutLine(text: row.meta, font: .mono(11, relativeTo: .caption), color: paint(.meta), fill: paint(.surface),
                identifier: "tally-meta:\(row.name)")
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
                // Hidden for the audit's hit-area check (see PackageRow.bar). The row's header, a button, speaks the ratio
                // as its text (got/qty), and the open row's Clear control speaks "N of M copies in" as its value.
                .accessibilityHidden(true)
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
