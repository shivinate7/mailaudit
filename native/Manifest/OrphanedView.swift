import ManifestKit
import SwiftUI

/// Orphaned's paint: a part's token name through Parchment (OrphanedPaint holds the choice and has the unit test).
private func paint(_ part: OrphanedPaint.Part) -> Color {
    OrphanedPaint.token(part).map(Parchment.color) ?? .clear
}

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
                        Text("+ Record an envelope").font(.cochin(15, relativeTo: .body).weight(.bold))
                            .foregroundStyle(paint(.recordText)).frame(maxWidth: .infinity, minHeight: 44)
                            .padding(.vertical, 4)
                            .background(paint(.recordFill), in: RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
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
                    Text(OrphanedNotice.emptyLine).font(.cochin(14, relativeTo: .body)).foregroundStyle(paint(.emptyLine))
                        .frame(maxWidth: .infinity).multilineTextAlignment(.center).padding(.vertical, 28).padding(.horizontal, 8)
                        .accessibilityIdentifier("orphaned-empty")
                }
            }
            .padding(16)
        }
        .overlay(alignment: .bottom) {
            if let e = model.error {
                Text(e).font(.cochin(13, relativeTo: .footnote)).foregroundStyle(paint(.entry))
                    .padding(12).frame(maxWidth: .infinity)
                    .background(paint(.cardSurface))
                    .overlay(alignment: .top) { Rectangle().fill(paint(.cardBorder)).frame(height: 1) }
                    .accessibilityIdentifier("orphaned-error")
            }
        }
        .task { try? await model.load() }
    }
}

/// A raised parchment card: card fill, a 1pt border, radius 8 and the web's small shadow.
private struct CardChrome: ViewModifier {
    let border: OrphanedPaint.Part
    func body(content: Content) -> some View {
        content
            // The shadow sits on the fill, not the card: a shadow on the card is drawn under every leaf view in it.
            .background(RoundedRectangle(cornerRadius: 8).fill(paint(.cardSurface)).shadow(color: Parchment.shadow, radius: 2, y: 1))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(border), lineWidth: 1))
    }
}

private struct Rule: View {
    var body: some View { Rectangle().fill(paint(.cardBorder)).frame(height: 1) }
}

/// A mono micro-label: uppercase, tracked, inkSoft.
private func micro(_ s: String, size: CGFloat, tracking: CGFloat) -> some View {
    Text(s.uppercased()).font(.mono(size, relativeTo: .caption)).tracking(tracking * size).foregroundStyle(paint(.microLabel))
}

private struct UndoNoticeView: View {
    let model: OrphanedModel
    let notice: UndoNotice
    let onChange: () async -> Void

    var body: some View {
        HStack(spacing: 8) {
            Text(OrphanedNotice.undoLine(matchedQty: notice.matchedQty, pkgLabel: notice.pkgLabel, leftoverQty: notice.leftoverQty))
                .font(.cochin(13, relativeTo: .footnote)).foregroundStyle(paint(.noticeText))
                .frame(maxWidth: .infinity, alignment: .leading)
            Button { Task { try? await model.undoAssign(); await onChange() } } label: { MiniLabel(title: "Undo", vertical: 4, horizontal: 8) }
                .buttonStyle(.plain).accessibilityIdentifier("orphaned-undo")
            Button { model.dismissUndo() } label: {
                Image(systemName: "xmark").font(.footnote).foregroundStyle(paint(.dismiss)).frame(width: 44, height: 44).contentShape(Rectangle())
            }
            .buttonStyle(.plain).accessibilityLabel("Dismiss").accessibilityIdentifier("orphaned-undo-dismiss")
        }
        .padding(.leading, 12).padding(.vertical, 4)
        .background(paint(.noticeFill), in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.noticeBorder), lineWidth: 1))
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
        let typed = d.input.trimmingCharacters(in: .whitespacesAndNewlines)
        let asTyped = !typed.isEmpty && !found.contains(where: { $0.name.caseInsensitiveCompare(typed) == .orderedSame })
        let cards = d.entries.reduce(0) { $0 + $1.qty }
        VStack(alignment: .leading, spacing: 8) {
            micro(target == .new ? "New envelope" : "Edit envelope", size: 11, tracking: 0.14)
                .accessibilityAddTraits(.isHeader)
            // A vertical-axis field is a text view, which the audit does not call clipped at large type (a one-line UITextField is).
            // Its Return key types a newline, so a newline is read as the submit.
            // Its hit region is its line height: at two lines it clears 44pt in Cochin (one Cochin line is 18pt).
            TextField("Card name", text: Binding(get: { model.draft(for: target).input }, set: { v in
                if let nl = v.firstIndex(of: "\n") {
                    let typed = String(v[..<nl])
                    model.setInput(typed, for: target)
                    Task { try? await model.addName(typed, for: target) }
                } else { model.setInput(v, for: target) }
            }), prompt: Text("Type a card name\u{2026}").foregroundStyle(paint(.note)), axis: .vertical)
                .lineLimit(2...3).inputBox().focused($focused).submitLabel(.done)
                .onSubmit { Task { try? await model.addName(model.draft(for: target).input, for: target) } }
                .accessibilityLabel("Card name")
                .accessibilityIdentifier("orphaned-input")
            if !found.isEmpty || asTyped {
                VStack(spacing: 0) {
                    ForEach(Array(found.enumerated()), id: \.element.name) { i, s in
                        if i > 0 { Rule() }
                        Button { Task { try? await model.addName(s.name, for: target) } } label: {
                            HStack {
                                Text(s.name).font(.cochin(14, relativeTo: .body)).foregroundStyle(paint(.entry))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Text("\(s.qty) out \u{00B7} \(s.sellerCount) seller\(s.sellerCount == 1 ? "" : "s")")
                                    .font(.mono(10.5, relativeTo: .caption)).foregroundStyle(paint(.note))
                            }
                            .padding(.vertical, 8).padding(.horizontal, 12).frame(minHeight: 44).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain).accessibilityIdentifier("suggestion:\(s.name)")
                    }
                    if asTyped {
                        if !found.isEmpty { Rule() }
                        Button { Task { try? await model.addName(typed, for: target) } } label: {
                            Text("Add \u{201C}\(typed)\u{201D} as typed").font(.cochin(13, relativeTo: .footnote))
                                .foregroundStyle(paint(.advisoryText))
                                .padding(.vertical, 8).padding(.horizontal, 12).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                                .background(paint(.advisoryFill))
                        }
                        .buttonStyle(.plain).accessibilityIdentifier("orphaned-add-typed")
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.candidateBorder), lineWidth: 1))
            }
            if !d.entries.isEmpty {
                VStack(spacing: 0) {
                    Rule()
                    ForEach(Array(d.entries.enumerated()), id: \.offset) { i, e in
                        HStack(spacing: 0) {
                            Text(e.name).font(.cochin(14, relativeTo: .body)).foregroundStyle(paint(.entry))
                                .frame(maxWidth: .infinity, alignment: .leading)
                            stepper("\u{2013}", e.qty > 1 ? "One fewer \(e.name)" : "Remove \(e.name)") { model.setQty(e.qty - 1, at: i, for: target) }
                            Text("\(e.qty)").font(.mono(13, relativeTo: .caption)).foregroundStyle(paint(.entry)).frame(minWidth: 20)
                            stepper("+", "One more \(e.name)") { model.setQty(e.qty + 1, at: i, for: target) }
                        }
                        .padding(.leading, 12)
                        Rule()
                    }
                }
                .padding(.top, 8)
            }
            TextField("Note", text: Binding(get: { model.draft(for: target).note }, set: { model.setNote($0, for: target) }),
                      prompt: Text("Note (optional) \u{2014} tracking #, sender, mailer\u{2026}").foregroundStyle(paint(.note)), axis: .vertical)
                .lineLimit(2...3).inputBox().accessibilityIdentifier("orphaned-note")
            HStack(spacing: 8) {
                Text("\(cards) card\(cards == 1 ? "" : "s")").font(.mono(11, relativeTo: .caption)).foregroundStyle(paint(.note))
                Spacer()
                Button { model.cancel() } label: { MiniLabel(title: "Cancel") }
                    .buttonStyle(.plain).accessibilityIdentifier("orphaned-cancel")
                // Empty Save is disabled, so VoiceOver reports it Disabled.
                let ready = !d.entries.isEmpty
                Button { Task { try? await model.save(target); await onChange() } } label: {
                    ready
                        ? MiniLabel(title: "Save envelope", bold: true, text: paint(.saveReadyText), fill: paint(.saveReadyFill), border: paint(.saveReadyFill))
                        : MiniLabel(title: "Save envelope", text: paint(.saveEmptyText), border: paint(.saveEmptyBorder))
                }
                .buttonStyle(.plain).disabled(!ready).accessibilityIdentifier("orphaned-save")
            }
            .padding(.top, 4)
        }
        .padding(12)
        .modifier(CardChrome(border: .composerBorder))
        .task(id: d.input) { found = await model.suggestions(for: d.input) }
        .onAppear { focused = true }
    }

    /// A bare glyph in a 44pt hit frame, as the web stepper draws it.
    private func stepper(_ glyph: String, _ label: String, _ act: @escaping () -> Void) -> some View {
        Button(action: act) {
            Text(glyph).font(.mono(15, relativeTo: .body)).foregroundStyle(paint(.entry)).frame(width: 44, height: 44).contentShape(Rectangle())
        }
        .buttonStyle(.plain).accessibilityLabel(label)
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
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                micro("Envelope \u{00B7} \(Date(timeIntervalSince1970: env.createdAt / 1000).formatted(.iso8601.year().month().day())) \u{00B7} \(total) card\(total == 1 ? "" : "s")", size: 11, tracking: 0.12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Button { model.open(.edit(env.id)) } label: { MiniLabel(title: "Edit", size: 11, vertical: 4, horizontal: 8, outsetHit: true) }.buttonStyle(.plain).accessibilityIdentifier("orphaned-edit:\(env.id)")
                Button(role: .destructive) { armed.toggle() } label: {
                    // Armed, the button itself fills red with card text, as the web's does (src/app.jsx EnvelopeCard).
                    MiniLabel(title: "Discard", size: 11, text: paint(armed ? .armedText : .discardText),
                              fill: paint(armed ? .armedFill : .cardSurface), border: paint(armed ? .armedFill : .discardBorder),
                              vertical: 4, horizontal: 8, outsetHit: true)
                }
                .buttonStyle(.plain).accessibilityIdentifier("discard:\(env.id)")
            }
            .padding(.top, 12).padding(.horizontal, 12).padding(.bottom, 8)
            // A solid backdrop under the header's buttons: the audit reads their contrast against it.
            .background(paint(.cardSurface), in: UnevenRoundedRectangle(topLeadingRadius: 8, topTrailingRadius: 8))
            .overlay(alignment: .bottomTrailing) {
                // The ask hangs below the row, so arming moves nothing (no-layout-shift-under-pointer).
                if armed {
                    HStack(spacing: 4) {
                        Button { armed = false } label: { MiniLabel(title: "Cancel", size: 11, vertical: 4, horizontal: 8) }.buttonStyle(.plain)
                        Button(role: .destructive) {
                            armed = false
                            Task { try? await model.discard(envelope: env.id); await onChange() }
                        } label: {
                            MiniLabel(title: "Tap again to discard \(total) card\(total == 1 ? "" : "s")", size: 11, bold: true,
                                      text: paint(.armedText), fill: paint(.armedFill), border: paint(.armedFill),
                                      vertical: 4, horizontal: 8)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(4).modifier(CardChrome(border: .discardBorder))
                    .padding(.trailing, 12).offset(y: 48).zIndex(1)
                }
            }
            .zIndex(1)
            VStack(alignment: .leading, spacing: 4) {
                ForEach(Array(env.entries.enumerated()), id: \.offset) { _, e in
                    HStack {
                        Text(e.qty > 1 ? "\u{00D7}\(e.qty) \(e.name)" : e.name).font(.cochin(13.5, relativeTo: .body))
                            .foregroundStyle(paint(.entry)).frame(maxWidth: .infinity, alignment: .leading)
                        if model.hasNoOutstandingCopy(e, in: env.id) {
                            Text("no outstanding copy").font(.mono(10, relativeTo: .caption)).foregroundStyle(paint(.advisoryText))
                                .padding(.horizontal, 8).background(paint(.advisoryFill), in: Capsule())
                        }
                    }
                }
                if !env.note.isEmpty {
                    Text(env.note).font(.mono(11, relativeTo: .caption)).foregroundStyle(paint(.note)).padding(.top, 4)
                }
            }
            .padding(.horizontal, 12).padding(.bottom, 8)
            Rule()
            VStack(alignment: .leading, spacing: 8) {
                if ranked.list.isEmpty {
                    Text("No outstanding package accounts for any of these. It\u{2019}ll start matching if a later import brings in the order.")
                        .font(.cochin(13, relativeTo: .footnote)).foregroundStyle(paint(.note))
                } else {
                    micro("Could have come from", size: 10.5, tracking: 0.12)
                    if let tie = OrphanedNotice.tieLine(tied: ranked.tied) {
                        AdvisoryText(line: tie, font: .cochin(12.5, relativeTo: .footnote)).accessibilityIdentifier("orphaned-tie")
                    }
                    ForEach(shown, id: \.pkg.gk) { c in CandidateRow(model: model, env: env, ranked: ranked, c: c, onChange: onChange) }
                    if ranked.list.count > 3 {
                        Button { showAll.toggle() } label: {
                            Text(showAll ? "show fewer" : "show \(ranked.list.count - 3) more candidate\(ranked.list.count == 4 ? "" : "s")")
                                .font(.mono(11, relativeTo: .caption)).underline().foregroundStyle(paint(.note))
                                .frame(minHeight: 44, alignment: .leading).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.top, 8).padding(.horizontal, 12).padding(.bottom, 12)
        }
        .task(id: armed) { if armed { try? await Task.sleep(for: .seconds(4)); armed = false } }
        .modifier(CardChrome(border: .cardBorder))
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
                Text(c.pkg.seller).font(.cochin(14, relativeTo: .body).weight(.bold)).foregroundStyle(paint(.seller))
                    .lineLimit(1).truncationMode(.tail).minimumScaleFactor(0.5)
                Text([c.pkg.date, model.isUntracked(c.pkg.gk) ? "\u{25CB} untracked" : "", c.pkg.orderId].filter { !$0.isEmpty }.joined(separator: " \u{00B7} "))
                    .font(.mono(10.5, relativeTo: .caption)).foregroundStyle(paint(.candidateMeta))
                Text(fit).font(sure ? .mono(11, relativeTo: .caption).weight(.bold) : .mono(11, relativeTo: .caption))
                    .foregroundStyle(paint(sure ? .fitExact : .fitPlain))
                    .accessibilityIdentifier(sure ? "exact:\(c.pkg.gk)" : "fit:\(c.pkg.gk)")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            // One tap assigns. The row is the same size whether the candidate is tied or not.
            Button { Task { try? await model.assign(envelope: env.id, to: c.pkg.gk); await onChange() } } label: {
                MiniLabel(title: "This one", horizontal: 8)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("This one, \(c.pkg.seller)").accessibilityIdentifier("assign:\(c.pkg.gk)")
        }
        .padding(8)
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.candidateBorder), lineWidth: 1))
    }

    private var fit: String {
        c.exact ? "explains all \(c.matchedQty) \u{00B7} nothing left over"
            : "\(c.matchedQty) of \(c.entriesTotal) cards" + (c.pkgLeft > 0 ? " \u{00B7} \(c.pkgLeft) more still owed" : " \u{00B7} whole package")
    }
}

private extension View {
    /// The plain style, so the field's height follows its text at large Dynamic Type; the rounded-border style is a fixed-height UITextField and the audit calls its text clipped.
    /// Cochin 16: 16pt or more stops iOS zoom on focus. The caller sets lineLimit(2...3), so the hit region clears 44pt.
    func inputBox() -> some View {
        textFieldStyle(.plain).font(.cochin(16, relativeTo: .body)).foregroundStyle(paint(.entry))
            .padding(.horizontal, 12).frame(minHeight: 48)
            .background(paint(.cardSurface), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.candidateBorder), lineWidth: 1))
    }
}
