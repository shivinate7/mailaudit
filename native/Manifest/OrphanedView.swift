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
                    .buttonStyle(.borderedProminent)
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
                    Text(OrphanedNotice.emptyLine).font(.callout).foregroundStyle(.secondary)
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
            Button("Undo") { Task { try? await model.undoAssign(); await onChange() } }
                .frame(minWidth: 44, minHeight: 44).accessibilityIdentifier("orphaned-undo")
            Button { model.dismissUndo() } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }
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
            TextField("Type a card name\u{2026}", text: Binding(get: { model.draft(for: target).input }, set: { model.setInput($0, for: target) }))
                .textFieldStyle(.roundedBorder).focused($focused).submitLabel(.done)
                .frame(minHeight: 44)
                .onSubmit { Task { try? await model.addName(model.draft(for: target).input, for: target) } }
                .accessibilityLabel("Card name").accessibilityIdentifier("orphaned-input")
            ForEach(found, id: \.name) { s in
                Button { Task { try? await model.addName(s.name, for: target) } } label: {
                    HStack {
                        Text(s.name).frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(s.qty) out \u{00B7} \(s.sellerCount) seller\(s.sellerCount == 1 ? "" : "s")")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    .frame(minHeight: 44)
                }
                .accessibilityIdentifier("suggestion:\(s.name)")
            }
            let typed = d.input.trimmingCharacters(in: .whitespacesAndNewlines)
            if !typed.isEmpty && !found.contains(where: { $0.name.caseInsensitiveCompare(typed) == .orderedSame }) {
                Button { Task { try? await model.addName(typed, for: target) } } label: {
                    Text("Add \u{201C}\(typed)\u{201D} as typed").frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                }
                .accessibilityIdentifier("orphaned-add-typed")
            }
            ForEach(Array(d.entries.enumerated()), id: \.offset) { i, e in
                HStack {
                    Text(e.qty > 1 ? "\u{00D7}\(e.qty) \(e.name)" : e.name).frame(maxWidth: .infinity, alignment: .leading)
                    Button { model.setQty(e.qty - 1, at: i, for: target) } label: {
                        Image(systemName: e.qty > 1 ? "minus.circle" : "trash").frame(width: 44, height: 44)
                    }
                    .accessibilityLabel(e.qty > 1 ? "One fewer \(e.name)" : "Remove \(e.name)")
                    Button { model.setQty(e.qty + 1, at: i, for: target) } label: {
                        Image(systemName: "plus.circle").frame(width: 44, height: 44)
                    }
                    .accessibilityLabel("One more \(e.name)")
                }
            }
            TextField("Note", text: Binding(get: { model.draft(for: target).note }, set: { model.setNote($0, for: target) }), axis: .vertical)
                .textFieldStyle(.roundedBorder).frame(minHeight: 44).accessibilityIdentifier("orphaned-note")
            HStack {
                Button("Cancel") { model.cancel() }.frame(minWidth: 44, minHeight: 44).accessibilityIdentifier("orphaned-cancel")
                Spacer()
                Button("Save") { Task { try? await model.save(target); await onChange() } }
                    .buttonStyle(.borderedProminent).frame(minWidth: 44, minHeight: 44)
                    .disabled(d.entries.isEmpty).accessibilityIdentifier("orphaned-save")
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
                    .font(.caption).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                Button("Edit") { model.open(.edit(env.id)) }.frame(minWidth: 44, minHeight: 44)
                Button("Discard", role: .destructive) { armed.toggle() }.frame(minWidth: 44, minHeight: 44)
                    .accessibilityIdentifier("discard:\(env.id)")
            }
            .overlay(alignment: .bottomTrailing) {
                // The ask hangs below the row, so arming moves nothing (ux-press-moves-nothing).
                if armed {
                    HStack {
                        Button("Cancel") { armed = false }.frame(minWidth: 44, minHeight: 44)
                        Button("Tap again to discard \(total) card\(total == 1 ? "" : "s")", role: .destructive) {
                            armed = false
                            Task { try? await model.discard(envelope: env.id); await onChange() }
                        }
                        .buttonStyle(.borderedProminent).tint(.red).frame(minHeight: 44)
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
                        Text("no outstanding copy").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            if !env.note.isEmpty { Text(env.note).font(.footnote).foregroundStyle(.secondary) }
            Divider()
            if ranked.list.isEmpty {
                Text("No outstanding package accounts for any of these. It\u{2019}ll start matching if a later import brings in the order.")
                    .font(.callout).foregroundStyle(.secondary)
            } else {
                Text("Could have come from").font(.caption).foregroundStyle(.secondary)
                if let tie = OrphanedNotice.tieLine(tied: ranked.tied) {
                    Text(tie).font(.footnote).accessibilityIdentifier("orphaned-tie")
                }
                ForEach(shown, id: \.pkg.gk) { c in CandidateRow(model: model, env: env, ranked: ranked, c: c, onChange: onChange) }
                if ranked.list.count > 3 {
                    Button(showAll ? "show fewer" : "show \(ranked.list.count - 3) more candidate\(ranked.list.count == 4 ? "" : "s")") {
                        showAll.toggle()
                    }
                    .font(.footnote).frame(minHeight: 44)
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
                    .font(.caption).foregroundStyle(.secondary)
                Text(fit).font(.caption).fontWeight(sure ? .bold : .regular).foregroundStyle(sure ? Color.green : Color.secondary)
                    .accessibilityIdentifier(sure ? "exact:\(c.pkg.gk)" : "fit:\(c.pkg.gk)")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            // One tap assigns. The row is the same size whether the candidate is tied or not.
            Button("This one") { Task { try? await model.assign(envelope: env.id, to: c.pkg.gk); await onChange() } }
                .buttonStyle(.bordered).frame(minWidth: 88, minHeight: 44)
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
