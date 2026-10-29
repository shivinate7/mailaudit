import ManifestKit
import SwiftUI

// Card in Hand on the open iPhone Duo (duo-card-in-hand, new-envelope-ends-an-envelope; mockup poses 1, 2 and 4 of
// docs/design/duo-card-in-hand on origin/design/duo-round2). The query and the held cards sit on the left page, the
// envelope the card came from on the right. Typing and holding save nothing: a card checks in by the line's own tap, or
// by Post for held cards (orphaned-mail-never-decides).
//
// Default, not owner: the mockup makes Card in Hand the Packages tab itself. Here Packages keeps its one-page layout and a
// `hand-open` control opens this screen over both pages; `hand-close` goes back. The owner is being asked.

/// The two models Card in Hand reads. Built once at boot beside the other tab models.
struct HandKit {
    let hand: HandModel
    let transit: PastTransitModel
}

/// The Packages tab. On two pages side by side it offers Card in Hand and, while that is open, draws it over the tab.
struct PackagesTab: View {
    let model: PackagesModel
    let masthead: MastheadModel
    let sync: SyncClient?
    let openSync: () -> Void
    let notice: String?
    let kit: HandKit?

    @Environment(\.duoSpread) private var spread
    @State private var handOpen = false

    private var twoPages: Bool {
        if case .sideBySide = spread { return true }
        return false
    }

    var body: some View {
        let open = handOpen && twoPages
        let opener: (() -> Void)? = kit != nil && twoPages ? { handOpen = true } : nil
        PackagesView(model: model, masthead: masthead, sync: sync, openSync: openSync, notice: notice, openHand: opener)
            .accessibilityHidden(open)
            .overlay {
                if open, let kit { HandScreen(kit: kit, packages: model, masthead: masthead, close: { handOpen = false }) }
            }
    }
}

struct HandScreen: View {
    let kit: HandKit
    let packages: PackagesModel
    let masthead: MastheadModel
    let close: () -> Void

    @Environment(\.duoSpread) private var spread
    @State private var query = ""
    /// The envelope the answer page shows. A post leaves it, so the lines you checked in stay under your finger until the next card.
    @State private var shown: String?
    @State private var pastTransit = false

    private var hand: HandModel { kit.hand }

    var body: some View {
        if case let .sideBySide(left, right) = spread {
            HStack(spacing: 0) {
                leftPage.frame(width: left.width)
                Color.clear.frame(width: right.minX - left.maxX)
                rightPage.frame(width: right.width)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Parchment.paper.ignoresSafeArea())
            .contentShape(Rectangle())
            .task { try? await kit.transit.load() }
        }
    }

    // MARK: left page

    private var leftPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Mail day").font(.cochin(17, relativeTo: .headline).weight(.bold)).foregroundStyle(Parchment.ink)
                        .accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 8)
                    Text("\(counts.inCount) in \u{00B7} \(counts.out) out").font(.mono(12, relativeTo: .caption))
                        .foregroundStyle(Parchment.inkSoft).accessibilityIdentifier("hand-count")
                    Button { hand.close(); close() } label: { MiniLabel(title: "Close") }.buttonStyle(.plain).accessibilityIdentifier("hand-close")
                }
                TextField("Type the card in hand", text: $query)
                    .textFieldStyle(.plain).font(.cochin(16, relativeTo: .body)).foregroundStyle(Parchment.ink)
                    .textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.done)
                    .padding(.horizontal, 12).frame(minHeight: 48)
                    .background(Parchment.card, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.line, lineWidth: 1))
                    .accessibilityIdentifier("hand-query")
                    // The typed text settles for 150 ms before it is read, so a name typed letter by letter is read once, not once
                    // per letter. Each read still applies in order (HandModel.type).
                    .task(id: query) {
                        try? await Task.sleep(for: .milliseconds(150))
                        guard !Task.isCancelled else { return }
                        try? await hand.type(query)
                        guard !Task.isCancelled else { return }
                        shown = hand.hits.count == 1 ? hand.hits.first : nil
                    }
                if let h = hand.held { notice(id: "hand-held", title: "Suspense", line: h.localizedCapitalized, foot: "Not checked in.") }
                if !hand.strays.isEmpty {
                    notice(id: "hand-strays", title: "Released, not checked in",
                           line: hand.strays.map(\.localizedCapitalized).joined(separator: ", "), foot: "They no longer decide an envelope.")
                }
                HStack {
                    Text("This envelope").font(.cochin(14, relativeTo: .body)).foregroundStyle(Parchment.inkSoft)
                    Spacer(minLength: 8)
                    Button { hand.newEnvelope() } label: { MiniLabel(title: "New envelope") }
                        .buttonStyle(.plain).accessibilityIdentifier("hand-new-envelope")
                }
                if let e = hand.error {
                    Text(e).font(.cochin(13, relativeTo: .footnote)).foregroundStyle(Parchment.red).accessibilityIdentifier("hand-error")
                }
                // Below the controls, so a list that grows while you type moves nothing you press (no-layout-shift-under-pointer).
                ForEach(hitNames, id: \.self) { name in
                    Button { query = name } label: {
                        Text(name).font(.cochin(14, relativeTo: .body)).foregroundStyle(Parchment.ink)
                            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain).accessibilityIdentifier("hand-hit:\(name)")
                }
            }
            .padding(16)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    /// The manila advisory box (a card waiting, cards released): manilaInk on manila.
    private func notice(id: String, title: String, line: String, foot: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased()).font(.mono(10.5, relativeTo: .caption)).tracking(1.2)
            Text(line).font(.cochin(15, relativeTo: .body).weight(.bold))
            Text(foot).font(.cochin(12.5, relativeTo: .footnote))
        }
        .foregroundStyle(Parchment.manilaInk)
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .background(Parchment.manila, in: RoundedRectangle(cornerRadius: 8))
        .accessibilityElement(children: .combine).accessibilityIdentifier(id)
    }

    /// Copies in and copies still owed, over the packages the Packages tab lists.
    private var counts: (inCount: Int, out: Int) {
        packages.rows.flatMap(\.items).reduce(into: (0, 0)) { sum, it in
            let got = min(packages.received[it.key] ?? 0, it.qty)
            sum = (sum.0 + got, sum.1 + it.qty - got)
        }
    }

    /// The card names still owed in the packages the typed text hits, to tap instead of typing the rest.
    private var hitNames: [String] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return [] }
        var seen = Set<String>()
        return hand.hits.compactMap { gk in packages.rows.first { $0.gk == gk } }.flatMap(\.items)
            .filter { (packages.received[$0.key] ?? 0) < $0.qty && $0.name.lowercased().contains(q) }
            .map(\.name).filter { seen.insert($0).inserted }
    }

    // MARK: right page

    private var rightPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if pastTransit {
                    PastTransitPage(model: kit.transit, back: { pastTransit = false }, onChange: afterWrite)
                } else {
                    answer
                    if !kit.transit.rows.isEmpty { transitBox }
                }
            }
            .padding(16)
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("hand-answer")
    }

    @ViewBuilder private var answer: some View {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        if hand.hits.count >= 2 {
            tie
        } else if let pkg = shown.flatMap({ gk in packages.rows.first { $0.gk == gk } }) {
            envelope(pkg)
        } else if trimmed.isEmpty {
            Text("Type the card in hand. The envelope it came from shows here.")
                .font(.cochin(14, relativeTo: .body)).foregroundStyle(Parchment.inkSoft)
        } else {
            Text("No open envelope holds \u{201C}\(trimmed)\u{201D}.").font(.cochin(14, relativeTo: .body)).foregroundStyle(Parchment.inkSoft)
        }
    }

    /// Envelopes that tie. A tie has no first choice; the next card from the same envelope decides it.
    private var tie: some View {
        VStack(alignment: .leading, spacing: 8) {
            micro("\(hand.hits.count) envelopes hold this card")
            Text("Name the next card from this envelope to tell them apart. Nothing checks in until you post.")
                .font(.cochin(13, relativeTo: .footnote)).foregroundStyle(Parchment.inkSoft)
            ForEach(hand.hits.compactMap { gk in packages.rows.first { $0.gk == gk } }, id: \.gk) { pkg in
                VStack(alignment: .leading, spacing: 2) {
                    Text(pkg.seller).font(.cochin(15, relativeTo: .body).weight(.bold)).foregroundStyle(Parchment.ink)
                    Text("ordered \(pkg.date) \u{00B7} \(owed(pkg)) \(owed(pkg) == 1 ? "card" : "cards") out").font(.mono(11, relativeTo: .caption)).foregroundStyle(Parchment.inkSoft)
                }
                .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                .background(Parchment.card, in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.line, lineWidth: 1))
                .accessibilityElement(children: .combine)
            }
        }
        .accessibilityElement(children: .contain).accessibilityIdentifier("hand-tie")
    }

    private func owed(_ pkg: Package) -> Int {
        pkg.items.reduce(0) { $0 + max(0, $1.qty - (packages.received[$1.key] ?? 0)) }
    }

    private func envelope(_ pkg: Package) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            micro("It came from")
            Text(pkg.seller).font(.cochin(22, relativeTo: .title2).weight(.bold)).foregroundStyle(Parchment.ink)
                .accessibilityIdentifier("hand-who")
            Text("ordered \(pkg.date)").font(.mono(11, relativeTo: .caption)).foregroundStyle(Parchment.inkSoft)
            VStack(spacing: 0) {
                ForEach(pkg.items, id: \.key) { item in line(item) }
            }
            .background(Parchment.card)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.line, lineWidth: 1))
            if let o = hand.offer, o.gk == pkg.gk, o.heldCopies > 0 { postBox(o) }
        }
    }

    private func line(_ item: LedgerItem) -> some View {
        ItemLine(
            state: LineState(got: packages.received[item.key] ?? 0, qty: item.qty), name: item.name, title: item.name,
            detail: packages.details[item.key] ?? "", price: item.price, readout: packages.readouts[item.key],
            checkInValue: packages.labels[item.key] ?? "", checkInID: "hand-checkin:\(item.key)",
            copyID: "hand-line:\(item.key)", key: item.key,
            onTap: {
                masthead.saving()
                await packages.tap(key: item.key)  // a failure shows in the model's checkInError
                await masthead.finished(failed: packages.checkInError != nil)
            },
            onStep: { delta in
                masthead.saving()
                await packages.step(key: item.key, by: delta)
                await masthead.finished(failed: packages.checkInError != nil)
            })
    }

    /// Only for a held card. It checks in the offered copies, the typed card with them, and never runs by itself.
    private func postBox(_ o: HandOffer) -> some View {
        let total = o.plan.reduce(0) { $0 + $1.take }
        return VStack(alignment: .leading, spacing: 8) {
            Text("Your held card came with this envelope. Nothing is checked in until you post.")
                .font(.cochin(13, relativeTo: .footnote)).foregroundStyle(Parchment.ink)
            Button { Task { await post() } } label: {
                MiniLabel(title: "Post \(total) cards here, \(o.heldCopies) held", bold: true, text: Parchment.card, fill: Parchment.accent, border: Parchment.accent)
            }
            .buttonStyle(.plain).accessibilityIdentifier("hand-post")
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .background(Parchment.manila.opacity(0.5), in: RoundedRectangle(cornerRadius: 8))
    }

    private func post() async {
        masthead.saving()
        do { try await hand.post() } catch {}  // the model shows the failure in hand.error
        await afterWrite(failed: hand.error != nil)
    }

    /// A write has landed: Packages reads the new check-ins, the late list follows, and the figures and the slot after them.
    private func afterWrite(failed: Bool) async {
        try? await packages.load()
        try? await kit.transit.load()
        await masthead.finished(failed: failed)
    }

    private var transitBox: some View {
        let rows = kit.transit.rows
        let closing = rows.filter { $0.tier == "deadline" }.count
        return HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Past 14 days: \(rows.count) envelope\(rows.count == 1 ? "" : "s")").font(.cochin(14, relativeTo: .body)).foregroundStyle(Parchment.ink)
                if closing > 0 {
                    Text("\(closing) refund window closing").font(.cochin(12.5, relativeTo: .footnote)).foregroundStyle(Parchment.red)
                }
            }
            Spacer(minLength: 8)
            Button { pastTransit = true } label: { MiniLabel(title: "Open") }
                .buttonStyle(.plain).accessibilityLabel("Open past 14 days").accessibilityIdentifier("hand-past-transit-open")
        }
        .padding(12)
        .background(Parchment.card, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.line, lineWidth: 1))
    }

    private func micro(_ s: String) -> some View {
        Text(s.uppercased()).font(.mono(10.5, relativeTo: .caption)).tracking(1.2).foregroundStyle(Parchment.inkSoft)
    }
}

/// The late mail, oldest last (duo-card-in-hand, mockup pose 4). Amber from 14 days, red from 30, both from the order date.
/// A stamp from the web's six kinds takes the row's flag away; the row keeps its place until the page reloads.
private struct PastTransitPage: View {
    let model: PastTransitModel
    let back: () -> Void
    let onChange: (Bool) async -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Past 14 days").font(.cochin(22, relativeTo: .title2).weight(.bold)).foregroundStyle(Parchment.ink)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 8)
                Button(action: back) { MiniLabel(title: "Back") }.buttonStyle(.plain).accessibilityIdentifier("past-transit-back")
            }
            ForEach(model.rows, id: \.gk) { row in PastTransitRowView(row: row, kinds: model.stampKinds, stamp: stamp, undo: undo) }
            Text("Days count from the order date. TCGplayer counts 30 days from the delivery estimate, so its window can close later.")
                .font(.cochin(12.5, relativeTo: .footnote)).foregroundStyle(Parchment.inkSoft)
        }
        .accessibilityElement(children: .contain).accessibilityIdentifier("past-transit-page")
    }

    private func stamp(_ gk: String, _ kind: String) async {
        var failed = false
        do { try await model.stamp(gk, kind: kind) } catch { failed = true }
        await onChange(failed)
    }

    private func undo(_ gk: String) async {
        var failed = false
        do { try await model.undo(gk) } catch { failed = true }
        await onChange(failed)
    }
}

private struct PastTransitRowView: View {
    let row: PastTransitRow
    let kinds: [StampKind]
    let stamp: (String, String) async -> Void
    let undo: (String) async -> Void

    /// gkOf is "orderId::seller".
    private var seller: String { row.gk.components(separatedBy: "::").dropFirst().joined(separator: "::") }
    private var flag: Color { row.tier == "deadline" ? Parchment.red : Parchment.amber }
    private var stampLabel: String? { row.stamp.map { kind in kinds.first { $0.kind == kind }?.label ?? kind } }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(seller).font(.cochin(15, relativeTo: .body).weight(.bold)).foregroundStyle(Parchment.ink)
                Spacer(minLength: 8)
                Text("\(row.days) d").font(.mono(12, relativeTo: .caption).weight(.bold)).foregroundStyle(flag)
            }
            Text(row.tier == "deadline" ? "refund window closing \u{00B7} claim by \(row.claimBy)" : "claim by \(row.claimBy)")
                .font(.mono(11, relativeTo: .caption)).foregroundStyle(row.tier == "deadline" ? Parchment.red : Parchment.inkSoft)
            // The buttons and the stamp line share one 44pt slot, so a press changes no row height.
            HStack(spacing: 8) {
                if let label = stampLabel {
                    Text("Stamped \(label)").font(.cochin(13, relativeTo: .footnote)).foregroundStyle(Parchment.inkSoft)
                    Spacer(minLength: 8)
                    Button { Task { await undo(row.gk) } } label: { MiniLabel(title: "Undo") }.buttonStyle(.plain)
                } else {
                    ForEach(kinds.prefix(2), id: \.kind) { k in
                        Button { Task { await stamp(row.gk, k.kind) } } label: { MiniLabel(title: k.label) }.buttonStyle(.plain)
                    }
                    Menu {
                        ForEach(kinds.dropFirst(2), id: \.kind) { k in Button(k.label) { Task { await stamp(row.gk, k.kind) } } }
                    } label: { MiniLabel(title: "More") }
                    Spacer(minLength: 0)
                }
            }
            .frame(minHeight: 44)
        }
        .padding(12)
        .background(Parchment.card, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Parchment.line, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("past-transit-row:\(row.gk)")
    }
}
