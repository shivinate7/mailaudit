import ManifestKit
import SwiftUI
import UIKit

/// The Ledger tab: the Data group (Backup, History) and the Reset box (ledger-tab-holds-options).
/// Backup, History and Reset read the stores whether or not the ledger opened
/// (recovery-control-not-state-gated). An ask arms in place and has its own Cancel; no native
/// dialog appears (no-native-dialogs).
struct LedgerTab: View {
    let store: LedgerStore?
    let versions: VersionsModel?
    /// Called after a reset or restore changed the ledger, so every tab reads it again.
    let onLedgerChange: () async -> Void
    @State private var shared: SharedFile?
    @State private var failure: String?
    @State private var historyOpen = false
    @State private var openRow: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("Data").font(.headline).padding(.horizontal, 16).padding(.top, 16)
                backup
                if let versions { history(versions); resetBox(versions) }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .sheet(item: $shared) { ShareSheet(url: $0.url) }
    }

    private var backup: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
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
            } label: {
                // 45, not 44: layout rounding reads a 44pt frame as 43.99999.
                Text("Backup").frame(maxWidth: .infinity, minHeight: 45, alignment: .leading).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("backup")
            if let failure { Text(failure).font(.footnote).foregroundStyle(.red) }
        }
        .padding(.horizontal, 16)
    }

    // MARK: History

    private func history(_ model: VersionsModel) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                historyOpen.toggle()
                if historyOpen { model.refresh() } else { openRow = nil; model.cancelAsk() }
            } label: {
                HStack {
                    Text("History")
                    Spacer()
                    Image(systemName: historyOpen ? "chevron.up" : "chevron.down").font(.footnote)
                }
                .frame(minHeight: 45).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityValue(historyOpen ? "expanded" : "collapsed")
            .accessibilityIdentifier("history")
            if historyOpen {
                if let listError = model.listError {
                    Text(listError).font(.footnote).foregroundStyle(.red).padding(.vertical, 8)
                } else if model.rows.isEmpty {
                    Text("No saved versions yet.").font(.footnote).foregroundStyle(.secondary).padding(.vertical, 8)
                }
                ForEach(model.rows) { row in versionRow(row, model) }
            }
        }
        .padding(.horizontal, 16)
        .onAppear { if historyOpen { model.refresh() } }
    }

    private func versionRow(_ row: VersionRow, _ model: VersionsModel) -> some View {
        let open = openRow == row.id
        let when = Date(timeIntervalSince1970: row.at / 1000).formatted(date: .abbreviated, time: .shortened)
        return VStack(alignment: .leading, spacing: 8) {
            Button {
                if open { openRow = nil } else { openRow = row.id }
                model.cancelAsk()
            } label: {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.label)
                        Text(when).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(row.counts).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                }
                .frame(minHeight: 45).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            if open {
                let armed: String? = {
                    if case .restore(let id, let cards) = model.ask, id == row.id { return VersionNotice.restoreAsk(cards: cards) }
                    return nil
                }()
                AskRow(title: "Restore this version", ask: armed, tint: .primary, id: "restore", cancelID: "restore-cancel",
                       press: { Task { await changing { model.pressRestore(row.id) } } }, cancel: { model.cancelAsk() })
                if let e = model.error, e.site == .version(row.id) {
                    Text(e.message).font(.footnote).foregroundStyle(.red).accessibilityIdentifier("version-error")
                }
            }
        }
        .padding(.vertical, 4)
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
        return VStack(alignment: .leading, spacing: 8) {
            AskRow(title: "Reset", ask: armed, tint: .red, id: "reset", cancelID: "reset-cancel",
                   press: { Task { await changing { model.pressReset() } } }, cancel: { model.cancelAsk() })
            if let e = model.error, e.site == .reset {
                Text(e.message).font(.footnote).foregroundStyle(.red).accessibilityIdentifier("reset-error")
            }
        }
        .padding(8)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(.secondary))
        .padding(.horizontal, 16).padding(.vertical, 16)
    }

    /// Runs a press; if it changed the ledger, every other view reads it again.
    private func changing(_ press: () -> Void) async {
        let before = store?.generation
        press()
        if store?.generation != before { await onLedgerChange() }
    }
}

/// A control that asks first. It arms in place; Cancel appears beside it in a slot kept free
/// all along, so a press moves nothing (no-layout-shift-under-pointer).
struct AskRow: View {
    let title: String
    let ask: String?
    let tint: Color
    let id: String
    let cancelID: String
    let press: () -> Void
    let cancel: () -> Void
    private let cancelWidth: CGFloat = 80

    var body: some View {
        HStack(spacing: 8) {
            Button(action: press) {
                Text(ask ?? title).lineLimit(1).minimumScaleFactor(0.7).foregroundStyle(tint)
                    .frame(maxWidth: .infinity, minHeight: 45, alignment: .leading).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(ask ?? title)
            .accessibilityIdentifier(id)
            if ask != nil {
                Button(action: cancel) {
                    Text("Cancel").frame(width: cancelWidth, height: 45).contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier(cancelID)
            } else {
                Color.clear.frame(width: cancelWidth, height: 45)
            }
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
