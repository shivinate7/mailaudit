import ManifestKit
import SwiftUI

/// One card per order and seller (packages-group-by-order-seller), painted like the web card.
/// A check-in changes colour, a glyph and the pill's text inside fixed frames, and the bar sits
/// out of flow, so no row changes size (no-layout-shift-under-pointer, card-the-bar-is-out-of-flow).
struct PackagesView: View {
    let model: PackagesModel
    let masthead: MastheadModel
    let sync: SyncClient?
    let openSync: () -> Void
    /// The damaged-ledger line, in the content below the running-head slot like the advisory.
    let notice: String?
    /// Runs after a stamp write, so the other tabs read the new stamps.
    let onChange: () async throws -> Void
    /// Set only on two pages side by side: the control that opens Card in Hand (duo-card-in-hand).
    var openHand: (() -> Void)?
    /// The last view-level read that failed, so the rows on screen are never silently stale.
    @State private var failure: String?
    @Environment(\.duoSpread) private var spread

    /// The Find pill is drawn on one page only: the open Duo and Card in Hand have their own search.
    private var pillShown: Bool { model.hasItems && spread.pages(for: .cardInHand) == nil }

    private func run(_ op: () async throws -> Void) async {
        do { try await op(); failure = nil } catch { failure = "Could not update the list. \(error.localizedDescription)" }
    }

    var body: some View {
        MastheadScreen(masthead: masthead, tab: .packages, sync: sync, openSync: openSync,
                       ruledRow: AnyView(RuledRow(canceled: canceledCell,
                                                  stamped: .init(count: model.stampedCount, on: model.showStamped) {
                           Task { try? await model.toggleStamped() }  // a failed read is in model.checkInError, shown below
                       }))) {
            VStack(spacing: 0) {
                if let openHand {
                    HStack {
                        Spacer(minLength: 0)
                        Button(action: openHand) { MiniLabel(title: "Card in Hand") }.buttonStyle(.plain).accessibilityIdentifier("hand-open")
                    }
                    .padding(.horizontal, 16)
                }
                if let notice { Text(notice).font(.footnote).padding(8) }
                LazyVStack(spacing: 8) {
                    // A Mark all that completes its package drops the card under Unreceived, and the Undo went with it: the shared
                    // notice takes the card's place, so the held Undo keeps a control (undo-removes-only-its-delta).
                    let vacated = model.vacatedUndo
                    ForEach(Array(model.rows.enumerated()), id: \.element.gk) { i, pkg in
                        if let vacated, vacated.index == i { vacatedNotice(vacated) }
                        PackageRow(pkg: pkg, model: model, masthead: masthead, onChange: onChange)
                    }
                    if let vacated, vacated.index >= model.rows.count { vacatedNotice(vacated) }
                    if model.rows.isEmpty && model.hasItems { empty }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
                CanceledListSection(options: model.options)
            }
        }
        .overlay(alignment: .bottom) {
            if let e = model.checkInError ?? failure {
                Text(e).font(.footnote).padding(12).frame(maxWidth: .infinity)
                    .background(.regularMaterial).accessibilityIdentifier("checkin-error")
            }
        }
        .findPill(show: pillShown, query: model.query) { q in Task { await run { try await model.setQuery(q) } } }
        .task { await run { try await model.viewOpened() } }  // another tab may have changed Find
    }

    /// The canceled cell, only while the ledger holds a canceled order.
    private var canceledCell: RuledRow.Canceled? {
        model.options.canceledCount > 0 ? .init(count: model.options.canceledCount, on: model.options.showCanceled) { model.options.showCanceled.toggle() } : nil
    }

    private func vacatedNotice(_ v: PackagesModel.VacatedUndo) -> some View {
        UndoNoticeBar(line: v.line, undoID: "bulk-vacated-undo:\(v.gk)",
                      undo: { await bulkWrite(masthead: masthead, onChange: onChange) { try await model.undoBulk() } },
                      dismiss: { model.endBulkUndo() })
    }

    /// The web's empty list: one sentence, and one Clear search only while a search is what empties it.
    private var empty: some View {
        VStack(spacing: 8) {
            Text(model.query.isEmpty ? "Everything here has been checked in." : "No cards match that search.")
                .font(.cochin(14, relativeTo: .body)).foregroundStyle(Parchment.inkSoft).multilineTextAlignment(.center)
            if !model.query.isEmpty {
                Button { Task { await run { try await model.clearSearch() } } } label: { MiniLabel(title: "Clear search", vertical: 4, horizontal: 8) }
                    .accessibilityLabel("Clear search")
                    .accessibilityIdentifier("package-clear")
            }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 32).padding(.horizontal, 8)
    }
}

struct PackageRow: View {
    let pkg: Package
    let model: PackagesModel
    let masthead: MastheadModel
    let onChange: () async throws -> Void
    /// True while the armed stamp ask shows. It hangs below the editor row and, at large text, past the card's edge, so
    /// the card then draws above its neighbours.
    @State private var overhang = false
    /// The same for the armed Clear ask under the bulk row.
    @State private var bulkOverhang = false

    private func state(_ item: LedgerItem) -> LineState { LineState(got: model.received[item.key] ?? 0, qty: item.qty) }
    private var packageState: LineState { pkg.items.allSatisfy { state($0) == .done } ? .done : .open }
    private var totalQty: Int { pkg.items.reduce(0) { $0 + $1.qty } }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            StampSection(pkg: pkg, model: model, masthead: masthead, surface: paint(.surface, packageState),
                         overhang: $overhang, onChange: onChange)
            bulkRow
            lines
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        // The shadow sits on the fill, not the card: a shadow on the card would be drawn under every leaf view in it.
        .background(RoundedRectangle(cornerRadius: 8).fill(paint(.surface, packageState))
            .shadow(color: Parchment.shadow, radius: 1, y: 1))
        .overlay(alignment: .top) { bar.clipShape(UnevenRoundedRectangle(topLeadingRadius: 8, topTrailingRadius: 8)) }
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.border, packageState), lineWidth: 1))
        .zIndex(overhang || bulkOverhang ? 1 : 0)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("package-row:\(pkg.gk)")
    }

    /// Mark all received and Clear check-ins, in a row of their own under the Stamp slot (native-bulk-check-in). Each press is a
    /// write as a stamp is: the slot says saving, the figures follow, then the other tabs read the new counts.
    private var bulkRow: some View {
        BulkRow(prefix: "bulk", key: pkg.gk, scope: "from \(pkg.seller)", totalCopies: totalQty, canMark: packageState != .done,
                copiesIn: model.gots[pkg.gk] ?? 0, undoOffered: model.bulkUndoGk == pkg.gk, undoCount: model.bulkUndoCount, overhang: $bulkOverhang,
                mark: { await write { try await model.bulk(gk: pkg.gk, on: true) } },
                undo: { await write { try await model.undoBulk() } },
                clear: { await write { try await model.bulk(gk: pkg.gk, on: false) } })
    }

    private func write(_ act: () async throws -> Void) async {
        await bulkWrite(masthead: masthead, onChange: onChange, act)
    }

    /// The item lines, clipped to the card's bottom corners because their fills are square. The card clips nothing
    /// else, so the armed stamp ask can hang past its edge.
    private var lines: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(pkg.items, id: \.key) { item in
                ItemLine(
                    state: state(item), name: item.name, title: item.name, detail: model.details[item.key] ?? "",
                    price: item.price, readout: model.readouts[item.key], checkInValue: model.labels[item.key] ?? "",
                    checkInID: "checkin:\(item.key)", key: item.key,
                    onTap: {
                        masthead.saving()
                        await model.tap(key: item.key)  // a failure shows in model.checkInError
                        await masthead.finished(failed: model.checkInError != nil)
                    },
                    onStep: { delta in
                        masthead.saving()
                        await model.step(key: item.key, by: delta)  // a failure shows in model.checkInError
                        await masthead.finished(failed: model.checkInError != nil)
                    })
            }
            revealFooter
        }
        .clipShape(UnevenRoundedRectangle(bottomLeadingRadius: 8, bottomTrailingRadius: 8))
    }

    /// The way out of a search (src/app.jsx PackageCard): how many lines the filters took, and the whole order. Below the rows and
    /// outside the tap area of any of them. It is 44pt tall; the web's is 34.
    @ViewBuilder private var revealFooter: some View {
        let revealed = model.revealed.contains(pkg.gk)
        if pkg.hiddenByFilters > 0 || revealed {
            let n = pkg.hiddenByFilters
            let verb = Text(revealed ? "back to matches" : "show all").underline()
            Button { Task { await model.reveal(pkg.gk) } } label: {
                Text(revealed ? "Showing the whole order \(verb)" : "+\(n) more line\(n == 1 ? "" : "s") in this order \(verb)")
                    .font(.mono(11, relativeTo: .caption)).foregroundStyle(Parchment.inkSoft)
                    .multilineTextAlignment(.leading)
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    .overlay(alignment: .top) { Rectangle().fill(Parchment.line).frame(height: 1) }
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityValue(revealed ? "expanded" : "collapsed")
            .accessibilityIdentifier("reveal:\(pkg.gk)")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            // As on the web: seller and date share a column, the status slot sits at the trailing edge.
            // The slot has a fixed size, so a long seller truncates in the column and a check-in moves nothing.
            HStack(alignment: .center, spacing: 8) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(pkg.seller).font(.cochin(15).weight(.bold)).foregroundStyle(paint(.seller, packageState))
                        .lineLimit(1).truncationMode(.tail).minimumScaleFactor(0.5)  // measured: with no scale the audit calls a short seller "Text clipped", at 0.9 still "Alpha Cards"
                        .textSelection(.enabled)  // owner ruling 2026-10-21: the header text is selectable, seller included
                        .contentShape(Rectangle())  // measured: without it, the selectable date below takes the seller's long press
                    dateLine
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                statusSlot
            }
            if let url = model.orderLinks[pkg.gk] {
                HStack(spacing: 0) {
                    Link(destination: url) {
                        Text(pkg.orderId).font(.mono(11)).underline()
                            .foregroundStyle(paint(.orderId, packageState))
                            .frame(minWidth: 45, minHeight: 45, alignment: .leading)  // 45: layout rounding read a 44pt frame as 43.99999
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("Order \(pkg.orderId) on TCGplayer")
                    .accessibilityIdentifier("order-link:\(pkg.gk)")
                    Spacer(minLength: 0)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 12)
    }

    private var dateLine: some View {
        Text(pkg.date).font(.mono(11)).foregroundStyle(paint(.orderId, packageState)).lineLimit(1).textSelection(.enabled)
            .contentShape(Rectangle())  // keeps its long press off the seller line above
            .accessibilityLabel("Ordered \(pkg.date)")  // a bare date failed the Dynamic Type audit
    }

    /// The pill, or the RECEIVED stamp once nothing is owed. An invisible widest pill sets the
    /// slot's size and the live one is drawn over it, so a check-in never changes the layout.
    private var statusSlot: some View {
        Text("99 left \u{00B7} refunded").font(.cochin(12.5).weight(.bold))
            .padding(.horizontal, 8).padding(.vertical, 4)
            .frame(minHeight: 28)
            .hidden()
            // The slot is an element of its own, sized by the invisible pill. An accessibility container
            // would take the union of its visible children, so the pill and the stamp would give it two frames.
            .background {
                Color.clear.accessibilityElement().accessibilityLabel("Order status")
                    .accessibilityValue(status.accessibilityValue)
                    .accessibilityIdentifier("card-slot:\(pkg.gk)")
            }
            .overlay(alignment: .trailing) {
                switch status {
                case .pill(let pill):
                    Text(pill).font(.cochin(12.5).weight(.bold)).foregroundStyle(paint(.pillText, .open))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(paint(.pillFill, .open)))
                        .fixedSize()
                        .accessibilityIdentifier("card-pill:\(pkg.gk)")
                case .refunded(let pill):
                    Text(pill).font(.cochin(12.5).weight(.bold)).foregroundStyle(paint(.refundPillText, .open))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(paint(.refundPillFill, .open)))
                        .fixedSize()
                        .accessibilityIdentifier("card-pill:\(pkg.gk)")
                case .received:
                    Text("RECEIVED").font(.mono(10.5).weight(.bold)).tracking(1).foregroundStyle(paint(.border, .done))
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(paint(.border, .done), lineWidth: 2))
                        .rotationEffect(.degrees(-4))
                        .fixedSize()
                case .blank:
                    EmptyView()
                }
            }
    }

    private var status: PackageCard.Status { PackageCard.Status(done: packageState == .done, pill: model.pills[pkg.gk], refundPill: model.refundPills[pkg.gk]) }

    /// The thin bar on the card's top edge, out of flow: it mounts without moving a row.
    @ViewBuilder private var bar: some View {
        if let fraction = model.bars[pkg.gk] {
            paint(.barTrack, .open).frame(height: 3)
                .overlay(alignment: .leading) {
                    GeometryReader { g in paint(.barFill, .open).frame(width: g.size.width * fraction) }
                }
                .allowsHitTesting(false)
                // The audit reads a 3pt element with a label as a control with a hit area too small. The fact it draws, copies
                // in of copies held, is spoken by the Clear control's value (BulkRow), which shows while any copy is in.
                .accessibilityHidden(true)
        }
    }
}

/// A bulk write as the masthead shows it: saving, the write, the other tabs' read of the new counts, then finished
/// (as a stamp write does). The card's Mark all, Clear and Undo and the vacated notice's Undo all run through it.
@MainActor func bulkWrite(masthead: MastheadModel, onChange: () async throws -> Void, _ act: () async throws -> Void) async {
    masthead.saving()
    var landed = true
    do { try await act() } catch { landed = false }  // the model has put the reason in checkInError, which the screen shows
    var refreshed = true
    do { try await onChange() } catch { refreshed = false }  // a failed Tally or Orphaned read would leave them counting the old check-ins
    await masthead.finished(failed: !landed || !refreshed)
}
