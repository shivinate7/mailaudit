import ManifestKit
import SwiftUI
import UIKit

/// A token of shared/tokens.json as a colour, for a part of the Ledger tab; clear when the part has no paint.
private func paint(_ part: LedgerPaint.Part, armed: Bool = false) -> Color {
    LedgerPaint.token(part, armed: armed).map(Parchment.color) ?? .clear
}

/// The Ledger tab: the Data group (Sync, History, Backup) and the Reset box (ledger-tab-holds-options).
/// Sync, History and Reset read their stores whether or not the ledger opened
/// (recovery-control-not-state-gated). An ask arms in place and has its own Cancel; no native
/// dialog appears (no-native-dialogs). Sync and History close each other (history-sync-close-each-other).
struct LedgerTab: View {
    let store: LedgerStore?
    let versions: VersionsModel?
    /// nil when the app runs without a sync client: the Sync row is then not drawn.
    let sync: SyncClient?
    /// Whether the Sync panel is open. The advisory line on a working screen opens it from outside.
    @Binding var syncOpen: Bool
    /// Called after a reset or restore changed the ledger, so every tab reads it again.
    let onLedgerChange: () async -> Void
    @State private var shared: SharedFile?
    @State private var failure: String?
    @State private var historyOpen = false
    @State private var openRow: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Ledger").textCase(.uppercase).font(.mono(12, relativeTo: .caption)).tracking(3.6)
                    .foregroundStyle(paint(.title)).frame(maxWidth: .infinity).padding(.top, 16)
                    .accessibilityAddTraits(.isHeader)
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
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(when).font(.mono(11, relativeTo: .caption)).foregroundStyle(paint(.versionWhen)).lineLimit(1)
                    .accessibilityIdentifier("version-when:\(row.id)")
                Text(row.label).font(.cochin(14, relativeTo: .body))
                    .foregroundStyle(paint(row.isMilestone ? .versionLabel : .versionLabelSoft)).lineLimit(1)
                    .accessibilityIdentifier("version-label:\(row.id)")
                Spacer(minLength: 0)
                Text(row.counts).font(.mono(10.5, relativeTo: .caption2)).foregroundStyle(paint(.versionFigure)).lineLimit(1)
                    .accessibilityIdentifier("version-figure:\(row.id)")
            }
            .frame(minHeight: 45)
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
                Text("\u{203A}").font(.system(size: 22)).foregroundStyle(paint(.disclosure))
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
                .accessibilityValue(expandedValue ?? "")
                .accessibilityIdentifier(id)
        }
        .overlay(alignment: .top) { if !first { Rule() } }
    }
}

/// A control that asks first. It arms in place; Cancel appears in a slot kept free all along, so a press
/// moves nothing (no-layout-shift-under-pointer). Reset fills its row with red once armed. Restore is a small
/// button on redSoft, and its Cancel appears before it (armed-reset-takes-the-row).
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

    /// Restore: red on redSoft at rest; bold card on red once armed, with a Cancel before it. Both are the shared mini
    /// button (ControlViews), in its 44pt hit frame, so the armed control keeps its top edge.
    private var restoreRow: some View {
        HStack(spacing: 8) {
            if armed {
                Button(action: cancel) { MiniLabel(title: "Cancel") }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier(cancelID)
            }
            Button(action: press) {
                MiniLabel(title: ask ?? title, bold: armed, text: p(.restoreText), fill: p(.restoreFill), border: p(.restoreBorder))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(ask ?? title)
            .accessibilityIdentifier(id)
            Spacer(minLength: 0)
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
