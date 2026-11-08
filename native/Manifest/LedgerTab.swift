import ManifestKit
import SwiftUI
import UIKit

/// A token of shared/tokens.json as a colour, for a part of the Ledger tab; clear when the part has no paint.
private func paint(_ part: LedgerPaint.Part, armed: Bool = false) -> Color {
    LedgerPaint.token(part, armed: armed).map(Parchment.color) ?? .clear
}

/// The Ledger tab: the View group (Showing, Sorted by, Orders from), the Data group (Sync, History, Backup) and the Reset box
/// (ledger-tab-holds-options). The View group shows only with items, as the web's does.
/// History and Reset read their stores whether or not the ledger opened (recovery-control-not-state-gated);
/// Sync has no row when the ledger will not open, because the app then starts no sync client.
/// An ask arms in place and has its own Cancel; no native dialog appears (no-native-dialogs). Sync and History close each other (history-sync-close-each-other).
struct LedgerTab: View {
    let masthead: MastheadModel?
    let store: LedgerStore?
    let versions: VersionsModel?
    /// Showing, Sorted by and Orders from, shared with the Packages and Tally models.
    let options: ViewOptions
    /// nil when the app runs without a sync client: the Sync row is then not drawn.
    let sync: SyncClient?
    /// Whether the Sync panel is open. The advisory line on a working screen opens it from outside.
    @Binding var syncOpen: Bool
    /// Called after a reset or restore changed the ledger, so every tab reads it again.
    let onLedgerChange: () async -> Void
    @State private var shared: SharedFile?
    @State private var failure: String?
    @State private var historyOpen = false
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var openRow: String?
    @State private var sortOpen = false
    @State private var rangeOpen = false
    @State private var exactOpen = false
    @State private var viewFailure: String?

    var body: some View {
        MastheadScreen(masthead: masthead, tab: .ledger) {
            VStack(alignment: .leading, spacing: 0) {
                Text("Ledger").textCase(.uppercase).font(.mono(12, relativeTo: .caption)).tracking(3.6)
                    .foregroundStyle(paint(.title)).frame(maxWidth: .infinity)
                    .padding(.top, masthead == nil ? 16 : 0)
                    .accessibilityAddTraits(.isHeader)
                if let store, !(masthead?.countLine(for: .ledger) ?? "").isEmpty { viewGroup(store) }
                Text("Data").textCase(.uppercase).font(.mono(11, relativeTo: .caption)).tracking(2.2)
                    .foregroundStyle(paint(.groupLabel)).padding(.leading, 4).padding(.top, 16).padding(.bottom, 8)
                    .accessibilityAddTraits(.isHeader)
                VStack(alignment: .leading, spacing: 0) {
                    if let sync { syncRow(sync) }
                    if let versions { history(versions, first: sync == nil) }
                    backup(first: sync == nil && versions == nil)
                }
                .modifier(Card())
                if let versions { resetBox(versions).padding(.top, 20) }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .sheet(item: $shared) { ShareSheet(url: $0.url) }
        .onChange(of: syncOpen) { _, open in if open { closeHistory() } }
    }

    // MARK: View

    /// The choices that shape the Packages and Tally lists (src/app.jsx, the Ledger tab's View group). Each change is saved by
    /// ViewOptions where the web saves it, and then every tab reads the ledger again, so the figures follow the range.
    private func viewGroup(_ store: LedgerStore) -> some View {
        let tally = options.lastList == .tally
        let sortLabel = tally ? options.itemSort.label : options.sortBy.label
        let lines = options.lineCount
        let sub = "\(lines) line\(lines == 1 ? "" : "s")" + (options.outsideCount > 0 ? " \u{00B7} \(options.outsideCount) outside" : "")
        return VStack(alignment: .leading, spacing: 0) {
            Text("View").textCase(.uppercase).font(.mono(11, relativeTo: .caption)).tracking(2.2)
                .foregroundStyle(paint(.groupLabel)).padding(.leading, 4).padding(.top, 16).padding(.bottom, 8)
                .accessibilityAddTraits(.isHeader)
            VStack(alignment: .leading, spacing: 0) {
                LedgerRow(title: "Showing", value: "\(options.hideDone ? "\u{25CF}" : "\u{25CB}") \(options.hideDone ? "Unreceived" : "Everything")",
                          id: "ledger-showing", valueID: "ledger-showing-value", first: true, pressed: options.hideDone) {
                    options.hideDone.toggle()
                    Task { await onLedgerChange() }
                }
                LedgerRow(title: "Sorted by", value: sortLabel, open: sortOpen, id: "ledger-sort", valueID: "ledger-sort-value",
                          expandedValue: "\(sortLabel), \(sortOpen ? "expanded" : "collapsed")") {
                    rangeOpen = false
                    sortOpen.toggle()
                }
                if sortOpen {
                    OptionPanel(id: "ledger-sort-grid", columns: 2, cells: tally
                        ? TallySort.allCases.map { key in OptionCell(label: key.label, on: key == options.itemSort) { choose { try options.setItemSort(key, in: store) } } }
                        : PackageSort.allCases.map { key in OptionCell(label: key.label, on: key == options.sortBy) { choose { try options.setSortBy(key, in: store) } } })
                }
                LedgerRow(title: "Orders from", sub: sub, value: options.rangeLabel, open: rangeOpen, id: "ledger-range",
                          valueID: "ledger-range-value", expandedValue: "\(options.rangeLabel), \(rangeOpen ? "expanded" : "collapsed")") {
                    sortOpen = false
                    rangeOpen.toggle()
                }
                if rangeOpen {
                    OptionPanel(id: "ledger-range-grid", columns: 4, cells: RangePreset.allCases.map { preset in
                        OptionCell(label: preset.label, on: preset == options.dateFilter.preset) {
                            var next = options.dateFilter
                            next.preset = preset
                            setRange(next, store)
                        }
                    }) {
                        if options.dateFilter.preset == .days { daysRow(store) }
                        if options.dateFilter.preset == .custom { monthRow(store) }
                    }
                }
            }
            .modifier(Card())
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("ledger-view")
            if let viewFailure { ErrorBox(text: viewFailure).padding(.top, 8).accessibilityIdentifier("view-error") }
        }
    }

    /// Picks a sort: the grid closes, as the web's does, and the lists are read again.
    private func choose(_ save: () throws -> Void) {
        do { try save(); viewFailure = nil } catch { viewFailure = "Could not save the view. \(error.localizedDescription)" }
        sortOpen = false
        Task { await onLedgerChange() }
    }

    private func setRange(_ filter: DateFilter, _ store: LedgerStore) {
        do { try options.setDateFilter(filter, in: store); viewFailure = nil } catch { viewFailure = "Could not save the view. \(error.localizedDescription)" }
        Task { await onLedgerChange() }
    }

    /// The Last stepper (src/app.jsx bumpDays): one day more or fewer, never under 1, starting from 21 when the field is empty.
    private func daysRow(_ store: LedgerStore) -> some View {
        func bump(_ by: Int) {
            var next = options.dateFilter
            next.days = String(max(1, (Int(next.days ?? "") ?? 21) + by))
            setRange(next, store)
        }
        return HStack(spacing: 8) {
            Text("Last").textCase(.uppercase).font(.cochin(10, relativeTo: .caption2)).tracking(1.6).foregroundStyle(paint(.partLabel))
            HStack(spacing: 0) {
                Button { bump(-1) } label: { Text("\u{2212}").font(.mono(15)).foregroundStyle(Parchment.ink).frame(width: 44, height: 44) }
                    .accessibilityLabel("Fewer days").accessibilityIdentifier("ledger-days-fewer")
                TextField("21", text: Binding(get: { options.dateFilter.days ?? "" }, set: { v in
                    var next = options.dateFilter
                    next.days = v.filter(\.isNumber)
                    setRange(next, store)
                }))
                .keyboardType(.numberPad).multilineTextAlignment(.center).font(.mono(13)).foregroundStyle(Parchment.ink)
                .frame(width: 46, height: 44)
                .accessibilityLabel("Number of days").accessibilityIdentifier("ledger-days")
                Button { bump(1) } label: { Text("+").font(.mono(15)).foregroundStyle(Parchment.ink).frame(width: 44, height: 44) }
                    .accessibilityLabel("More days").accessibilityIdentifier("ledger-days-more")
            }
            .background(Parchment.card, in: Capsule())
            .overlay(Capsule().strokeBorder(Parchment.line, lineWidth: 1))
            Text("days").textCase(.uppercase).font(.cochin(10, relativeTo: .caption2)).tracking(1.6).foregroundStyle(paint(.partLabel))
        }
        .padding(.top, 8)
    }

    /// By month (src/app.jsx, the custom preset): the months the orders fall in, then Exact dates. Picked, not typed: iOS's numeric
    /// keypad has no hyphen key. A whole-month range reads back as its month (ViewOptions.rangeLabel).
    private func monthRow(_ store: LedgerStore) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            subHead("Month")
            Wrap(column: 4, row: 4) {
                ForEach(options.months, id: \.key) { m in
                    OptionChip(label: m.label, on: m.from == options.dateFilter.from && m.to == options.dateFilter.to, id: "ledger-month:\(m.key)") {
                        do { try options.setMonth(m, in: store); viewFailure = nil } catch { viewFailure = "Could not save the view. \(error.localizedDescription)" }
                        Task { await onLedgerChange() }
                    }
                }
            }
            Button { exactOpen.toggle() } label: {
                HStack(spacing: 8) {
                    Text(exactOpen ? "\u{2013}" : "+").foregroundStyle(Parchment.accent).frame(width: 10)
                    Text("Exact dates")
                }
                .font(.mono(11, relativeTo: .caption)).foregroundStyle(Parchment.inkSoft)
                .frame(minHeight: 44, alignment: .leading).contentShape(Rectangle())
            }
            .buttonStyle(.plain).padding(.top, 12)
            .accessibilityValue(exactOpen ? "expanded" : "collapsed").accessibilityIdentifier("ledger-exact")
            if exactOpen {
                Wrap(column: 8, row: 8) {
                    dateEnd("From date", value: options.dateFilter.from, id: "ledger-from") { v in
                        var next = options.dateFilter; next.from = v; next.preset = .custom; setRange(next, store)
                    }
                    Text("\u{2013}").foregroundStyle(Parchment.inkSoft).frame(minHeight: 44)
                    dateEnd("To date", value: options.dateFilter.to, id: "ledger-to") { v in
                        var next = options.dateFilter; next.to = v; next.preset = .custom; setRange(next, store)
                    }
                }
            }
        }
        .padding(.top, 4)
    }

    private func subHead(_ title: String) -> some View {
        HStack(spacing: 8) {
            Text(title).textCase(.uppercase).font(.cochin(10, relativeTo: .caption2)).tracking(1.6).foregroundStyle(paint(.partLabel))
            Rectangle().fill(Parchment.line).frame(height: 1)
        }
        .padding(.top, 12).padding(.bottom, 8)
    }

    /// One end of Exact dates. The web's date input can be empty (an open end); a picker cannot, so an empty end is a button
    /// that sets today, and a set end has a clear beside it.
    private func dateEnd(_ label: String, value: String, id: String, set: @escaping (String) -> Void) -> some View {
        HStack(spacing: 0) {
            if let date = ISODay.date(value) {
                DatePicker(label, selection: Binding(get: { date }, set: { set(ISODay.string($0)) }), displayedComponents: .date)
                    .labelsHidden().frame(minHeight: 44).accessibilityLabel(label).accessibilityIdentifier(id)
                Button { set("") } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Parchment.inkSoft).frame(width: 44, height: 44).contentShape(Rectangle())
                }
                .buttonStyle(.plain).accessibilityLabel("Clear \(label.lowercased())").accessibilityIdentifier("\(id)-clear")
            } else {
                Button { set(ISODay.string(Date())) } label: { MiniLabel(title: label) }
                    .buttonStyle(.plain).accessibilityIdentifier(id)
            }
        }
    }

    private func closeHistory() {
        historyOpen = false
        openRow = nil
        versions?.cancelAsk()
    }

    // MARK: Sync

    private func syncRow(_ sync: SyncClient) -> some View {
        let state = sync.serverState
        let says = SyncPanel.row(state, open: syncOpen, lastSyncAt: sync.lastSyncAt)
        return VStack(alignment: .leading, spacing: 0) {
            LedgerRow(title: "Sync", sub: says.sub, value: says.value, valueNeedsFix: says.needsFix, open: syncOpen,
                      id: "sync", valueID: "sync-value", first: true, expandedValue: syncOpen ? "expanded" : "collapsed") {
                if !syncOpen { closeHistory() }
                syncOpen.toggle()
            }
            if syncOpen { syncPanel(sync, state: state) }
        }
    }

    /// Two ruled rows, Server and Last sync. The key arrives by URL scheme, so there is no key row (native-key-via-url-scheme).
    private func syncPanel(_ sync: SyncClient, state: SyncServerState) -> some View {
        Grid(alignment: .leadingFirstTextBaseline, horizontalSpacing: 12, verticalSpacing: 4) {
            partRow("Server", state.text, id: "sync-server")
            partRow("Last sync", SyncPanel.lastSyncText(sync.lastSyncAt, locale: .current, timeZone: .current), id: "sync-last")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 4).padding(.horizontal, 8).padding(.bottom, 12)
        .overlay(alignment: .top) { Rule() }
    }

    private func partRow(_ label: String, _ value: String, id: String) -> some View {
        GridRow(alignment: .firstTextBaseline) {
            // The labels are Cochin: the web's cellLab sets no font and inherits the page's.
            Text(label).textCase(.uppercase).font(.cochin(10, relativeTo: .caption2)).tracking(1.6)
                .foregroundStyle(paint(.partLabel)).lineLimit(1).fixedSize()
            Text(value).font(.mono(11, relativeTo: .caption)).lineSpacing(5)
                .foregroundStyle(paint(.partValue)).fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier(id)
        }
    }

    // MARK: Backup

    private func backup(first: Bool) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            LedgerRow(title: "Backup", id: "backup", first: first) {
                do {
                    guard let store else { throw CocoaError(.fileNoSuchFile) }
                    let file = try store.backup()
                    let url = FileManager.default.temporaryDirectory.appending(path: file.name)
                    try file.data.write(to: url, options: .atomic)
                    failure = nil
                    shared = SharedFile(url: url)
                } catch {
                    failure = "Could not make the backup. \(error.localizedDescription)"
                }
            }
            if let failure { ErrorBox(text: failure).padding(8) }
        }
    }

    // MARK: History

    private func history(_ model: VersionsModel, first: Bool) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            LedgerRow(title: "History", value: "Saved versions", open: historyOpen, id: "history", first: first,
                      expandedValue: historyOpen ? "expanded" : "collapsed") {
                if historyOpen { closeHistory() } else {
                    syncOpen = false
                    historyOpen = true
                    model.refresh()
                }
            }
            if historyOpen {
                VStack(alignment: .leading, spacing: 0) {
                    if let listError = model.listError {
                        ErrorBox(text: listError).padding(.vertical, 8)
                    } else if model.rows.isEmpty {
                        Text("No versions saved on this device yet.").font(.mono(11, relativeTo: .caption))
                            .foregroundStyle(paint(.partValue)).padding(.vertical, 8)
                    }
                    ForEach(model.rows) { row in versionRow(row, model) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 4).padding(.horizontal, 8).padding(.bottom, 12)
                .overlay(alignment: .top) { Rule() }
            }
        }
        .onAppear { if historyOpen { model.refresh() } }
    }

    private func versionRow(_ row: VersionRow, _ model: VersionsModel) -> some View {
        let open = openRow == row.id
        let when = Date(timeIntervalSince1970: row.at / 1000).formatted(date: .abbreviated, time: .shortened)
        return VStack(alignment: .leading, spacing: 8) {
            // One line: time, label, then the figure at the right (src/app.jsx verRow). The texts are the elements,
            // and the row's hit region is a button behind them.
            // At an accessibility size the three stack, so the label wraps instead of being cut to a letter.
            let stacked = typeSize.isAccessibilitySize
            let layout = stacked ? AnyLayout(VStackLayout(alignment: .leading, spacing: 4)) : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: 8))
            layout {
                Text(when).font(.mono(11, relativeTo: .caption)).foregroundStyle(paint(.versionWhen)).lineLimit(stacked ? nil : 1).layoutPriority(1)
                    .accessibilityIdentifier("version-when:\(row.id)")
                Text(row.label).font(.cochin(14, relativeTo: .body))
                    .foregroundStyle(paint(row.isMilestone ? .versionLabel : .versionLabelSoft)).lineLimit(stacked ? nil : 1)
                    .accessibilityIdentifier("version-label:\(row.id)")
                if !stacked { Spacer(minLength: 0) }
                Text(row.counts).font(.mono(10.5, relativeTo: .caption2)).foregroundStyle(paint(.versionFigure)).lineLimit(stacked ? nil : 1).layoutPriority(1)
                    .accessibilityIdentifier("version-figure:\(row.id)")
            }
            .frame(maxWidth: .infinity, minHeight: 45, alignment: .leading)
            .allowsHitTesting(false)
            .background {
                Button {
                    if open { openRow = nil } else { openRow = row.id }
                    model.cancelAsk()
                } label: { Color.clear.contentShape(Rectangle()) }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(row.label), \(when), \(row.counts)")
                    .accessibilityValue(open ? "expanded" : "collapsed")
            }
            if open {
                let armed: String? = {
                    if case .restore(let id, let cards) = model.ask, id == row.id { return VersionNotice.restoreAsk(cards: cards) }
                    return nil
                }()
                AskRow(kind: .restore, title: "Restore this version", ask: armed, id: "restore", cancelID: "restore-cancel",
                       press: { Task { await changing { model.pressRestore(row.id) } } }, cancel: { model.cancelAsk() })
                if let e = model.error, e.site == .version(row.id) {
                    ErrorBox(text: e.message).accessibilityIdentifier("version-error")
                }
            }
        }
        .padding(.top, 8)
        .overlay(alignment: .top) { Rule() }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(row.label), \(when), \(row.counts)")
        .accessibilityValue(open ? "expanded" : "collapsed")
        .accessibilityIdentifier("version:\(row.id)")
    }

    // MARK: Reset

    private func resetBox(_ model: VersionsModel) -> some View {
        let armed: String? = {
            if case .reset(let cards) = model.ask { return VersionNotice.resetAsk(cards: cards) }
            return nil
        }()
        return VStack(alignment: .leading, spacing: 0) {
            AskRow(kind: .reset, title: "Reset", ask: armed, id: "reset", cancelID: "reset-cancel",
                   press: { Task { await changing { model.pressReset() } } }, cancel: { model.cancelAsk() })
            if let e = model.error, e.site == .reset {
                ErrorBox(text: e.message).padding(8).accessibilityIdentifier("reset-error")
            }
        }
        .modifier(Card())
    }

    /// Runs a press; if it changed the ledger, every other view reads it again.
    private func changing(_ press: () -> Void) async {
        let before = store?.generation
        press()
        if store?.generation != before { await onLedgerChange() }
    }
}

/// The web's `.mdl-lcard`: the raised parchment, a 1pt line border, radius 8, clipped.
private struct Card: ViewModifier {
    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(paint(.cardSurface))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.cardBorder), lineWidth: 1))
    }
}

private struct Rule: View {
    var body: some View { Rectangle().fill(paint(.rowRule)).frame(height: 1) }
}

/// The web's error box: red on redSoft, Cochin 13.5.
private struct ErrorBox: View {
    let text: String
    var body: some View {
        Text(text).font(.cochin(13.5, relativeTo: .footnote)).lineSpacing(2).foregroundStyle(paint(.errorText))
            .padding(8).frame(maxWidth: .infinity, alignment: .leading)
            .background(paint(.errorFill), in: RoundedRectangle(cornerRadius: 4))
    }
}

/// One row of a group card (src/app.jsx LedgerRow): a Cochin title with an optional sub line, a mono value at the right and
/// a "›" on a row that opens something. The texts are drawn over a button that holds the hit region, so the value is an element
/// of its own (the Sync value reads On, Set up or Check). The rule sits on top of every row but the first.
private struct LedgerRow: View {
    let title: String
    var sub: String?
    var value: String?
    var valueNeedsFix = false
    /// nil for an action row, which has no "›"; else whether the row is open.
    var open: Bool?
    let id: String
    var valueID: String?
    var first = false
    var expandedValue: String?
    /// For a one-tap choice such as Showing: whether it is on, spoken as selected (the web's aria-pressed).
    var pressed: Bool?
    let action: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.cochin(20, relativeTo: .title3)).lineSpacing(3).foregroundStyle(paint(.rowTitle))
                    .accessibilityHidden(true)
                if let sub { Text(sub).font(.cochin(13.5, relativeTo: .footnote)).foregroundStyle(paint(.rowSub)) }
            }
            Spacer(minLength: 0)
            if let value {
                Text(value).font(.mono(14, relativeTo: .callout)).multilineTextAlignment(.trailing)
                    .foregroundStyle(paint(valueNeedsFix ? .rowValueAdvisory : .rowValue))
                    .accessibilityIdentifier(valueID ?? "\(id)-value")
            }
            if let open {
                Text("\u{203A}").font(.cochin(22, relativeTo: .title3)).foregroundStyle(paint(.disclosure))
                    .rotationEffect(.degrees(open ? 90 : 0)).accessibilityHidden(true)
            }
        }
        .padding(.vertical, 8).padding(.horizontal, 16)
        .frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
        .allowsHitTesting(false)
        .background {
            Button(action: action) { Color.clear.contentShape(Rectangle()) }
                .buttonStyle(.plain)
                .accessibilityLabel(title)
                .accessibilityValue(expandedValue ?? value ?? "")
                .accessibilityAddTraits(pressed == true ? .isSelected : [])
                .accessibilityIdentifier(id)
        }
        .overlay(alignment: .top) { if !first { Rule() } }
    }
}

/// A control that asks first. It arms in place; Cancel appears in a slot kept free all along, so a press
/// moves nothing (no-layout-shift-under-pointer). Reset fills its row with red once armed (armed-reset-takes-the-row).
/// Restore is a full-width bar on redSoft, as the web's flex: 1 button is. Each Cancel sits after its control.
struct AskRow: View {
    enum Kind { case reset, restore }
    let kind: Kind
    let title: String
    let ask: String?
    let id: String
    let cancelID: String
    let press: () -> Void
    let cancel: () -> Void
    private let cancelWidth: CGFloat = 80
    @Environment(\.dynamicTypeSize) private var typeSize

    private var armed: Bool { ask != nil }

    var body: some View {
        switch kind {
        case .reset: resetRow
        case .restore: restoreRow
        }
    }

    private func p(_ part: LedgerPaint.Part) -> Color { paint(part, armed: armed) }

    /// Reset: Cochin 20 red at rest, Cochin 15 bold card on a red fill once armed. The fill takes the label's cell;
    /// Cancel keeps its own cell with a rule on its left, so the label does not move.
    private var resetRow: some View {
        HStack(spacing: 0) {
            Button(action: press) {
                Text(ask ?? title).font(armed ? .cochin(15, relativeTo: .body).weight(.bold) : .cochin(20, relativeTo: .title3))
                    .lineLimit(1).minimumScaleFactor(0.7).foregroundStyle(p(.resetText))
                    .padding(.horizontal, 16)
                    .frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
                    .background(p(.resetFill))
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(ask ?? title)
            .accessibilityIdentifier(id)
            ZStack {
                if armed {
                    Button(action: cancel) {
                        Text("Cancel").font(.cochin(20, relativeTo: .title3)).foregroundStyle(paint(.cancelText))
                            .frame(width: cancelWidth, height: 52).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier(cancelID)
                    .overlay(alignment: .leading) { Rectangle().fill(paint(.rowRule)).frame(width: 1) }
                }
            }
            .frame(width: cancelWidth, height: 52)
        }
    }

    /// Restore: red on redSoft at rest; bold card on red once armed. Both are the shared mini button (ControlViews), in
    /// its 44pt hit frame. Cancel takes a slot after Restore that is kept free all along, so arming moves nothing
    /// (no-layout-shift-under-pointer). Restore is a bar across the rest of the row, as the web's flex:1 button is.
    private var restoreRow: some View {
        let stacked = typeSize.isAccessibilitySize
        let layout = stacked ? AnyLayout(VStackLayout(alignment: .trailing, spacing: 8)) : AnyLayout(HStackLayout(spacing: 8))
        return layout {
            Button(action: press) {
                MiniLabel(title: ask ?? title, bold: armed, text: p(.restoreText), fill: p(.restoreFill), border: p(.restoreBorder), wide: true)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(ask ?? title)
            .accessibilityIdentifier(id)
            // Cancel is always laid out, so its slot is as wide as its text at any type size, and unarmed it is
            // invisible and out of the accessibility tree.
            Button(action: cancel) { MiniLabel(title: "Cancel") }
                .buttonStyle(.plain)
                .accessibilityIdentifier(cancelID)
                .opacity(armed ? 1 : 0).allowsHitTesting(armed).accessibilityHidden(!armed)
                .frame(minWidth: stacked ? 0 : cancelWidth, alignment: .trailing)
        }
    }
}

struct SharedFile: Identifiable {
    let url: URL
    var id: URL { url }
}

struct ShareSheet: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: [url], applicationActivities: nil) }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}

/// The ISO day ("2026-05-01") the saved dateFilter keeps for `from` and `to`, as the picker's Date and back. The calendar is
/// the Gregorian one in the device's time zone, so the day the picker shows is the day saved (a date input's value in the web).
enum ISODay {
    private static let format: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.calendar = Calendar(identifier: .gregorian)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static func date(_ s: String) -> Date? { s.isEmpty ? nil : format.date(from: s) }
    static func string(_ d: Date) -> String { format.string(from: d) }
}
