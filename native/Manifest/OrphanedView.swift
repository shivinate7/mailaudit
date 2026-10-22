import ManifestKit
import SwiftUI

/// The Orphaned tab: envelopes parked until the owner says which package they came from.
/// Candidates are offered and never chosen, and a tie looks the same for every tied row
/// (orphaned-mail-never-decides). `onChange` runs after a write, so Packages reads the new check-ins.
struct OrphanedView: View {
    let model: OrphanedModel
    let onChange: () async -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if model.composing == .new {
                    ComposerView(model: model, target: .new, onChange: onChange)
                } else {
                    Button { model.open(.new) } label: {
                        Text("Record an envelope").font(.headline).frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.borderedProminent).tint(.action)
                    .accessibilityIdentifier("orphaned-record")
                }
                ForEach(Array(model.envelopes.enumerated()), id: \.element.id) { i, env in
                    if let u = model.undo, u.index == i { UndoNoticeView(model: model, notice: u, onChange: onChange) }
                    if model.composing == .edit(env.id) {
                        ComposerView(model: model, target: .edit(env.id), onChange: onChange)
                    } else {
                        EnvelopeCard(model: model, env: env, onChange: onChange)
                    }
                }
                // The pile emptied out from under the notice: it still needs somewhere to go.
                if let u = model.undo, u.index >= model.envelopes.count { UndoNoticeView(model: model, notice: u, onChange: onChange) }
                if model.envelopes.isEmpty && model.composing != .new {
                    Text(OrphanedNotice.emptyLine).font(.callout).foregroundStyle(.primary)
                        .frame(maxWidth: .infinity).multilineTextAlignment(.center)
                        .accessibilityIdentifier("orphaned-empty")
                }
            }
            .padding(16)
        }
        .overlay(alignment: .bottom) {
            if let e = model.error {
                Text(e).font(.footnote).padding(12).frame(maxWidth: .infinity)
                    .background(.regularMaterial).accessibilityIdentifier("orphaned-error")
            }
        }
        .task { try? await model.load() }
    }
}

private struct UndoNoticeView: View {
    let model: OrphanedModel
    let notice: UndoNotice
    let onChange: () async -> Void

    var body: some View {
        HStack(spacing: 8) {
            Text(OrphanedNotice.undoLine(matchedQty: notice.matchedQty, pkgLabel: notice.pkgLabel, leftoverQty: notice.leftoverQty))
                .font(.footnote).frame(maxWidth: .infinity, alignment: .leading)
            Button { Task { try? await model.undoAssign(); await onChange() } } label: { hit("Undo") }
                .accessibilityIdentifier("orphaned-undo")
            Button { model.dismissUndo() } label: { Image(systemName: "xmark").frame(width: 44, height: 44).foregroundStyle(.primary) }
                .accessibilityLabel("Dismiss").accessibilityIdentifier("orphaned-undo-dismiss")
        }
        .padding(.leading, 12)
        .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 8))
    }
}

private struct ComposerView: View {
    let model: OrphanedModel
    let target: ComposerTarget
    let onChange: () async -> Void
    @State private var found: [Suggestion] = []
    @FocusState private var focused: Bool

    private var draft: EnvelopeDraft { model.draft(for: target) }

    var body: some View {
        let d = draft
        VStack(alignment: .leading, spacing: 8) {
            Text(target == .new ? "New envelope" : "Edit envelope").font(.headline)
            // A vertical-axis field is a text view, which the audit does not call clipped at large type (a one-line UITextField is).
            // Its Return key types a newline, so a newline is read as the submit.
            TextField("Type a card name\u{2026}", text: Binding(get: { model.draft(for: target).input }, set: { v in
                if let nl = v.firstIndex(of: "\n") {
                    let typed = String(v[..<nl])
                    model.setInput(typed, for: target)
                    Task { try? await model.addName(typed, for: target) }
                } else { model.setInput(v, for: target) }
            }), axis: .vertical)
                .lineLimit(1...3).inputBox().focused($focused).submitLabel(.done)
                .onSubmit { Task { try? await model.addName(model.draft(for: target).input, for: target) } }
                .accessibilityLabel("Card name").accessibilityIdentifier("orphaned-input")
            ForEach(found, id: \.name) { s in
                Button { Task { try? await model.addName(s.name, for: target) } } label: {
                    HStack {
                        Text(s.name).frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(s.qty) out \u{00B7} \(s.sellerCount) seller\(s.sellerCount == 1 ? "" : "s")")
                            .font(.caption).foregroundStyle(.primary)
                    }
                    .frame(minHeight: 44).foregroundStyle(.primary)
                }
                .accessibilityIdentifier("suggestion:\(s.name)")
            }
            let typed = d.input.trimmingCharacters(in: .whitespacesAndNewlines)
            if !typed.isEmpty && !found.contains(where: { $0.name.caseInsensitiveCompare(typed) == .orderedSame }) {
                Button { Task { try? await model.addName(typed, for: target) } } label: {
                    Text("Add \u{201C}\(typed)\u{201D} as typed").frame(maxWidth: .infinity, minHeight: 44, alignment: .leading).foregroundStyle(.primary)
                }
                .accessibilityIdentifier("orphaned-add-typed")
            }
            ForEach(Array(d.entries.enumerated()), id: \.offset) { i, e in
                HStack {
                    Text(e.qty > 1 ? "\u{00D7}\(e.qty) \(e.name)" : e.name).frame(maxWidth: .infinity, alignment: .leading)
                    Button { model.setQty(e.qty - 1, at: i, for: target) } label: {
                        Image(systemName: e.qty > 1 ? "minus.circle" : "trash").frame(width: 44, height: 44).foregroundStyle(.primary)
                    }
                    .accessibilityLabel(e.qty > 1 ? "One fewer \(e.name)" : "Remove \(e.name)")
                    Button { model.setQty(e.qty + 1, at: i, for: target) } label: {
                        Image(systemName: "plus.circle").frame(width: 44, height: 44).foregroundStyle(.primary)
                    }
                    .accessibilityLabel("One more \(e.name)")
                }
            }
            TextField("Note", text: Binding(get: { model.draft(for: target).note }, set: { model.setNote($0, for: target) }), axis: .vertical)
                .inputBox().accessibilityIdentifier("orphaned-note")
            HStack {
                Button { model.cancel() } label: { hit("Cancel") }.accessibilityIdentifier("orphaned-cancel")
                Spacer()
                // Own fill when ready (white on action, 7:1). Empty Save takes the system disabled look so VoiceOver reports it Disabled.
                let ready = !d.entries.isEmpty
                Button { Task { try? await model.save(target); await onChange() } } label: {
                    hit("Save", ready ? .white : .primary)
                        .padding(.horizontal, 8)
                        .background(ready ? Color.action : Color.primary.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain).disabled(!ready).accessibilityIdentifier("orphaned-save")
            }
        }
        .padding(12)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(.primary))
        .task(id: d.input) { found = await model.suggestions(for: d.input) }
        .onAppear { focused = true }
    }
}

private struct EnvelopeCard: View {
    let model: OrphanedModel
    let env: Envelope
    let onChange: () async -> Void
    @State private var showAll = false
    @State private var armed = false

    var body: some View {
        let ranked = model.ranked(for: env.id)
        let total = env.entries.reduce(0) { $0 + $1.qty }
        let shown = showAll ? ranked.list : Array(ranked.list.prefix(3))
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Envelope \u{00B7} \(Date(timeIntervalSince1970: env.createdAt / 1000).formatted(.iso8601.year().month().day())) \u{00B7} \(total) card\(total == 1 ? "" : "s")")
                    .font(.caption).foregroundStyle(.primary).frame(maxWidth: .infinity, alignment: .leading)
                Button { model.open(.edit(env.id)) } label: { hit("Edit") }
                Button(role: .destructive) { armed.toggle() } label: { hit("Discard", Color.danger) }
                    .accessibilityIdentifier("discard:\(env.id)")
            }
            .overlay(alignment: .bottomTrailing) {
                // The ask hangs below the row, so arming moves nothing (ux-press-moves-nothing).
                if armed {
                    HStack {
                        Button { armed = false } label: { hit("Cancel") }
                        Button(role: .destructive) {
                            armed = false
                            Task { try? await model.discard(envelope: env.id); await onChange() }
                        } label: { Text("Tap again to discard \(total) card\(total == 1 ? "" : "s")").frame(minHeight: 44) }
                        .buttonStyle(.borderedProminent).tint(.dangerFill)
                    }
                    .padding(4).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
                    .offset(y: 48).zIndex(1)
                }
            }
            .zIndex(1)
            ForEach(Array(env.entries.enumerated()), id: \.offset) { _, e in
                HStack {
                    Text(e.qty > 1 ? "\u{00D7}\(e.qty) \(e.name)" : e.name).frame(maxWidth: .infinity, alignment: .leading)
                    if model.hasNoOutstandingCopy(e, in: env.id) {
                        Text("no outstanding copy").font(.caption).foregroundStyle(.primary)
                    }
                }
            }
            if !env.note.isEmpty { Text(env.note).font(.footnote).foregroundStyle(.primary) }
            Divider()
            if ranked.list.isEmpty {
                Text("No outstanding package accounts for any of these. It\u{2019}ll start matching if a later import brings in the order.")
                    .font(.callout).foregroundStyle(.primary)
            } else {
                Text("Could have come from").font(.caption).foregroundStyle(.primary)
                if let tie = OrphanedNotice.tieLine(tied: ranked.tied) {
                    Text(tie).font(.footnote).accessibilityIdentifier("orphaned-tie")
                }
                ForEach(shown, id: \.pkg.gk) { c in CandidateRow(model: model, env: env, ranked: ranked, c: c, onChange: onChange) }
                if ranked.list.count > 3 {
                    Button { showAll.toggle() } label: {
                        Text(showAll ? "show fewer" : "show \(ranked.list.count - 3) more candidate\(ranked.list.count == 4 ? "" : "s")")
                            .font(.footnote).frame(minHeight: 44).foregroundStyle(.primary)
                    }
                }
            }
        }
        .task(id: armed) { if armed { try? await Task.sleep(for: .seconds(4)); armed = false } }
        .padding(12)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(.separator))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("envelope:\(env.id)")
    }
}

private struct CandidateRow: View {
    let model: OrphanedModel
    let env: Envelope
    let ranked: Ranked
    let c: Candidate
    let onChange: () async -> Void

    var body: some View {
        let sure = ranked.emphasized(c)
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text(c.pkg.seller).font(.headline)
                Text([c.pkg.date, c.pkg.orderId].filter { !$0.isEmpty }.joined(separator: " \u{00B7} "))
                    .font(.caption).foregroundStyle(.primary)
                Text(fit).font(.caption).fontWeight(sure ? .bold : .regular).foregroundStyle(sure ? Color.sure : Color.primary)
                    .accessibilityIdentifier(sure ? "exact:\(c.pkg.gk)" : "fit:\(c.pkg.gk)")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            // One tap assigns. The row is the same size whether the candidate is tied or not.
            Button { Task { try? await model.assign(envelope: env.id, to: c.pkg.gk); await onChange() } } label: {
                // Own fill, not .bordered: that style pads the label by a fractional amount, so tied rows came out a hair apart.
                Text("This one").foregroundStyle(.primary).frame(minWidth: 88, minHeight: 44)
                    .background(Color.primary.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
                .accessibilityLabel("This one, \(c.pkg.seller)").accessibilityIdentifier("assign:\(c.pkg.gk)")
        }
        .padding(8)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(.separator))
    }

    private var fit: String {
        c.exact ? "explains all \(c.matchedQty) \u{00B7} nothing left over"
            : "\(c.matchedQty) of \(c.entriesTotal) cards" + (c.pkgLeft > 0 ? " \u{00B7} \(c.pkgLeft) more still owed" : " \u{00B7} whole package")
    }
}

private extension View {
    /// The plain style, so the field's height follows its text at large Dynamic Type; the rounded-border style is a fixed-height UITextField and the audit calls its text clipped.
    func inputBox() -> some View {
        textFieldStyle(.plain).padding(.horizontal, 8).frame(minHeight: 44)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(.separator))
    }
}

/// One tap target: the 44pt frame sits in the label, so the whole frame is the hit region.
private func hit(_ title: String, _ color: Color = .primary) -> some View {
    Text(title).foregroundStyle(color).frame(minWidth: 44, minHeight: 44)
}

/// Hand-set colours for the contrast floor (palette-tokens-contrast-floor): system blue, red and green fall short of 4.5:1 on white.
/// Measured, text on white / grouped grey / black / dark card: action 7.1 (white on it), dangerFill 7.0 (white on it), danger 7.0 / 6.3 / 9.3 / 7.6, sure 7.6 / 6.9 / 14.1 / 11.5.
private extension Color {
    static func adaptive(light: UIColor, dark: UIColor) -> Color {
        Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? dark : light })
    }
    static let action = Color(uiColor: UIColor(red: 0, green: 0.32, blue: 0.76, alpha: 1))
    static let dangerFill = Color(uiColor: UIColor(red: 0.70, green: 0.07, blue: 0.07, alpha: 1))
    static let danger = adaptive(light: UIColor(red: 0.70, green: 0.07, blue: 0.07, alpha: 1), dark: UIColor(red: 1, green: 0.55, blue: 0.5, alpha: 1))
    static let sure = adaptive(light: UIColor(red: 0.05, green: 0.38, blue: 0.14, alpha: 1), dark: UIColor(red: 0.5, green: 0.92, blue: 0.55, alpha: 1))
}
