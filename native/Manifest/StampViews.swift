import ManifestKit
import SwiftUI

private func paint(_ part: StampPaint.Part) -> Color { Parchment.color(StampPaint.token(part)) }

/// The ruled row under the running-head slot: a rule, a 44pt row holding the stamped cell, and a thin rule
/// (src/app.jsx cancCell, RULE, RULE_THIN). The row is always drawn, so the first stamp does not push the list down
/// (no-layout-shift-under-pointer). The cell is a filter: its glyph is the Showing cell's ○ and ●.
struct StampedRow: View {
    let count: Int
    let on: Bool
    let toggle: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Rectangle().fill(paint(.rule)).frame(height: 1)
            HStack(spacing: 0) {
                Spacer(minLength: 0)
                Button(action: toggle) {
                    HStack(spacing: 4) {
                        Text("\(count) stamped").foregroundStyle(paint(on ? .cellOnText : .cellText))
                        Text(on ? "\u{25CF}" : "\u{25CB}").foregroundStyle(paint(on ? .cellGlyphOn : .cellText))
                    }
                    .font(.mono(10, relativeTo: .caption)).lineLimit(1).fixedSize()
                    .padding(.horizontal, 12).frame(minWidth: 44, minHeight: 44)
                    .overlay(alignment: .leading) { Rectangle().fill(paint(.rule)).frame(width: 1) }
                    .contentShape(Rectangle())
                }
                .buttonStyle(PaintedButtonStyle())
                .disabled(count == 0 && !on)  // with nothing stamped there is nothing to show; the web hides the cell then
                .accessibilityLabel("\(count) stamped")
                .accessibilityHint(count == 0 && !on ? "No package carries a stamp yet." : "Shows only the packages that carry a stamp")
                .accessibilityAddTraits(on ? .isSelected : [])
                .accessibilityIdentifier("stamped-cell")
            }
            Rectangle().fill(paint(.rule)).frame(height: 1).opacity(0.55)
        }
        .padding(.horizontal, 16).padding(.bottom, 16)
    }
}

/// The two-tap ask of a destructive control (no-native-dialogs): Cancel, then the confirm button, in a panel. It is drawn as
/// an overlay of the row it belongs to, hung below it by `hangingAsk`, so arming moves nothing. The stamp's Remove and the
/// bulk Clear both draw it.
struct AskPanel: View {
    let confirmTitle: String
    let cancelID: String
    let confirmID: String
    let cancel: () -> Void
    let confirm: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        let panel = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .trailing, spacing: 4)) : AnyLayout(HStackLayout(spacing: 4))
        return panel {
            Button(action: cancel) { MiniLabel(title: "Cancel", size: 11, vertical: 4, horizontal: 8) }
                .buttonStyle(.plain).accessibilityIdentifier(cancelID)
            Button(role: .destructive, action: confirm) {
                MiniLabel(title: confirmTitle, size: 11, bold: true,
                          text: paint(.askText), fill: paint(.askFill), border: paint(.askFill), vertical: 4, horizontal: 8)
            }
            .buttonStyle(.plain).accessibilityIdentifier(confirmID)
        }
        .padding(4)
        .background(RoundedRectangle(cornerRadius: 8).fill(paint(.askPanelFill)).shadow(color: Parchment.shadow, radius: 2, y: 1))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.askPanelBorder), lineWidth: 1))
        .zIndex(1)
    }
}

extension View {
    /// Draws `ask` as an overlay of this row, its top 4pt under the row's bottom edge whatever height the row has at the
    /// current type size, so arming takes no layout space and moves nothing. The stamp's Remove and the bulk Clear both hang
    /// their AskPanel through this. The offset is the measured row height: an alignment guide on the overlay put the panel
    /// above the row.
    func hangingAsk<Ask: View>(_ armed: Bool, @ViewBuilder ask: () -> Ask) -> some View {
        modifier(HangingAsk(armed: armed, ask: armed ? ask() : nil))
    }
}

private struct HangingAsk<Ask: View>: ViewModifier {
    let armed: Bool
    let ask: Ask?
    @State private var rowHeight: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { rowHeight = $0 }
            .overlay(alignment: .topTrailing) { if armed, let ask { ask.offset(y: rowHeight + 4) } }
    }
}

/// Wraps its children in rows, as the web's flex-wrap does: `column` between neighbours, `row` between lines.
private struct Wrap: Layout {
    var column: CGFloat
    var row: CGFloat

    private func place(_ subviews: Subviews, width: CGFloat) -> (frames: [CGRect], size: CGSize) {
        var frames: [CGRect] = []
        var x: CGFloat = 0, y: CGFloat = 0, lineHeight: CGFloat = 0, widest: CGFloat = 0
        for s in subviews {
            let size = s.sizeThatFits(.unspecified)
            if x > 0, x + size.width > width { x = 0; y += lineHeight + row; lineHeight = 0 }
            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            x += size.width
            widest = max(widest, x)
            x += column
            lineHeight = max(lineHeight, size.height)
        }
        return (frames, CGSize(width: widest, height: y + lineHeight))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        place(subviews, width: proposal.width ?? .infinity).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let laid = place(subviews, width: bounds.width)
        for (s, f) in zip(subviews, laid.frames) {
            s.place(at: CGPoint(x: bounds.minX + f.minX, y: bounds.minY + f.minY), proposal: ProposedViewSize(f.size))
        }
    }
}

/// The card's stamp slot: the Stamp button while there is no stamp, the band once there is one, the editor while it
/// is open. Both resting forms are one 48pt row, so saving or removing a stamp moves no line below it
/// (no-layout-shift-under-pointer). Only a deliberate tap on Stamp or the band opens the taller editor.
struct StampSection: View {
    let pkg: Package
    let model: PackagesModel
    let masthead: MastheadModel
    /// The card's surface, which the band note's "…" sits on.
    let surface: Color
    /// True while the armed ask hangs below the card's edge, so the card lets it show (see PackageRow).
    @Binding var overhang: Bool
    /// Runs after a write, so the Tally and Orphaned figures read the new stamps. It throws when a read failed.
    let onChange: () async throws -> Void

    private static let rowHeight: CGFloat = 48

    @State private var editing = false
    @State private var kind = ""
    @State private var note = ""
    @State private var armed = false
    @FocusState private var focused: Bool
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.scrollTo) private var scrollTo

    private var stamp: [String: Any]? { model.bands[pkg.gk] == nil ? nil : model.stamps[pkg.gk] }
    private var totalQty: Int { pkg.items.reduce(0) { $0 + $1.qty } }
    private var saveRow: String { "stamp-save-row:\(pkg.gk)" }

    var body: some View {
        Group {
            if editing {
                editor
            } else if let stamp, let band = model.bands[pkg.gk] {
                bandButton(band: band, note: stamp["note"] as? String ?? "").background { slotMarker }
            } else {
                HStack(spacing: 0) {
                    Button(action: open) { MiniLabel(title: "Stamp") }
                        .buttonStyle(.plain).accessibilityIdentifier("stamp-button:\(pkg.gk)")
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 12).frame(minHeight: Self.rowHeight)
                .background { slotMarker }
            }
        }
        .zIndex(2)  // the armed ask hangs over the bulk row and the lines below
        .task(id: armed) { if armed { try? await Task.sleep(for: .seconds(4)); armed = false } }
        .onChange(of: armed) { _, a in overhang = a }
    }

    /// The 48pt slot as one element of its own, whichever form it holds (Stamp or the band). A container would take the
    /// union of its visible children, so its frame would follow the form; this one is the slot.
    private var slotMarker: some View {
        Color.clear.accessibilityElement().accessibilityLabel("Stamp slot").accessibilityIdentifier("stamp-slot:\(pkg.gk)")
    }

    /// The editor opens on the stamp as it is at the moment of the tap, not as it was at mount (src/app.jsx openEditor).
    private func open() {
        let held = model.stamps[pkg.gk]
        let live = model.bands[pkg.gk] != nil
        kind = live ? held?["kind"] as? String ?? "" : ""
        note = live ? held?["note"] as? String ?? "" : ""
        armed = false
        editing = true
    }

    private func close() {
        editing = false
        armed = false
        focused = false
        kind = ""
        note = ""
    }

    // MARK: the band

    private func bandButton(band: String, note: String) -> some View {
        Button(action: open) {
            HStack(spacing: 8) {
                Text(band).font(.mono(10.5, relativeTo: .caption).weight(.bold)).tracking(1.05)
                    .foregroundStyle(paint(.bandChip)).lineLimit(1).minimumScaleFactor(0.6)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(paint(.bandChip), lineWidth: 2))
                    .rotationEffect(.degrees(-3))
                    .layoutPriority(1)
                CutLine(text: note, font: .cochin(13.5, relativeTo: .body).italic(), color: paint(.bandNote), fill: surface,
                        identifier: "stamp-note-text:\(pkg.gk)")
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("\u{203A}").font(.mono(12, relativeTo: .caption)).foregroundStyle(paint(.bandChevron))
            }
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, minHeight: Self.rowHeight, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Edit stamp on \(pkg.seller)")
        .accessibilityValue([band, note].filter { !$0.isEmpty }.joined(separator: " "))
        .accessibilityIdentifier("stamp-band:\(pkg.gk)")
    }

    // MARK: the editor

    private var editor: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Text("STAMP").font(.mono(10, relativeTo: .caption)).tracking(1.6).foregroundStyle(paint(.head))
                    .accessibilityAddTraits(.isHeader)
                Rectangle().fill(paint(.rule)).frame(height: 1)
            }
            .padding(.bottom, 8)
            Wrap(column: 4, row: 12) {
                ForEach(model.stampKinds, id: \.kind) { k in chip(k) }
            }
            noteField.padding(.top, 12)
            buttons.padding(.top, 8).id(saveRow)
        }
        .padding(.horizontal, 12).padding(.bottom, 12)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("stamp-editor:\(pkg.gk)")
        // The keyboard would cover Save, so bring the row up when the field takes focus (as the Orphaned composer does).
        .onChange(of: focused) { _, f in if f { scrollTo(saveRow) } }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardDidShowNotification)) { _ in
            if focused { scrollTo(saveRow) }
        }
    }

    /// A kind chip: 34pt tall and drawn square, its 44pt hit frame centred on it. The frame reaches 5pt past the chip
    /// each way, inside the 6pt half gap between lines, and a chip is wider than 44pt, so no two frames overlap.
    private func chip(_ k: StampKind) -> some View {
        let on = kind == k.kind
        let face = Text(k.label).font(.mono(11.5, relativeTo: .caption)).lineLimit(1).fixedSize()
            .foregroundStyle(paint(on ? .kindOnText : .kindOffText))
            .padding(.horizontal, 8).frame(minHeight: 34)
            .background(paint(on ? .kindOnFill : .kindOffFill))
            .overlay(Rectangle().strokeBorder(paint(on ? .kindOnFill : .kindBorder), lineWidth: 1))
        return Button { kind = k.kind } label: { face.frame(minWidth: 44, minHeight: 44).contentShape(Rectangle()) }
            .buttonStyle(.plain)
            .accessibilityLabel(k.label)
            .accessibilityAddTraits(on ? .isSelected : [])
            .accessibilityIdentifier("stamp-kind:\(pkg.gk)|\(k.kind)")
            .outsetHit(sizedBy: face)
    }

    private var noteField: some View {
        // A vertical-axis field wraps its text and its placeholder and grows with Dynamic Type, where a one-line field cut
        // them. Its hit region is only its line height unless it holds two lines (measured), so it reserves two, as Tally's
        // search does. A note is still one line: Return ends the edit and a pasted line break becomes a space.
        TextField("", text: $note,
                  prompt: Text("Anything else \u{2014} what they said, when\u{2026}").foregroundStyle(paint(.notePlaceholder)),
                  axis: .vertical)
            .lineLimit(2...6)
            .font(.cochin(16, relativeTo: .body)).foregroundStyle(paint(.noteText))  // 16pt or more stops iOS zoom on focus
            .textFieldStyle(.plain).focused($focused).submitLabel(.done).onSubmit { focused = false }
            .onChange(of: note) { _, n in
                if n.contains("\n") {
                    note = n.replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespaces)
                    focused = false
                }
            }
            .accessibilityLabel("Stamp note")
            .accessibilityIdentifier("stamp-note:\(pkg.gk)")
            // The field's own frame is only its two lines (36.7pt), so the whole box is the hit region: a tap anywhere in
            // it focuses the field. The box only contains the field, so VoiceOver still reads one "Stamp note" element.
            .padding(.horizontal, 12)
            .frame(minHeight: 44)
            .background(paint(.noteFill), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.noteBorder), lineWidth: 1))
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("stamp-note-box:\(pkg.gk)")
    }

    /// Remove stamp (only when stamped) leads, then Cancel and Save. The armed ask hangs below this row, so arming moves
    /// nothing, as Orphaned's Discard ask does (no-layout-shift-under-pointer).
    private var buttons: some View {
        let stacked = typeSize.isAccessibilitySize
        let layout = stacked ? AnyLayout(VStackLayout(alignment: .trailing, spacing: 8)) : AnyLayout(HStackLayout(spacing: 8))
        let ready = !kind.isEmpty
        return layout {
            if stamp != nil {
                Button(role: .destructive) { armed.toggle() } label: {
                    MiniLabel(title: "Remove stamp", text: paint(.removeText), fill: paint(.removeFill), border: paint(.removeBorder))
                }
                .buttonStyle(.plain).accessibilityIdentifier("stamp-remove:\(pkg.gk)")
            }
            if !stacked { Spacer(minLength: 0) }
            Button(action: close) { MiniLabel(title: "Cancel") }
                .buttonStyle(.plain).accessibilityIdentifier("stamp-cancel:\(pkg.gk)")
            // With no kind picked Save is disabled, so VoiceOver reports it Disabled and reads why.
            Button { Task { await save() } } label: {
                ready
                    ? MiniLabel(title: "Save", bold: true, text: paint(.saveReadyText), fill: paint(.saveReadyFill), border: paint(.saveReadyFill))
                    : MiniLabel(title: "Save", text: paint(.saveOffText), border: paint(.saveOffBorder))
            }
            .buttonStyle(PaintedButtonStyle()).disabled(!ready)
            .accessibilityHint(ready ? "" : "Pick a stamp first.")
            .accessibilityIdentifier("stamp-save:\(pkg.gk)")
        }
        .hangingAsk(armed) {
            AskPanel(confirmTitle: "Tap again to remove stamp from \(totalQty) card\(totalQty == 1 ? "" : "s")",
                     cancelID: "stamp-ask-cancel:\(pkg.gk)", confirmID: "stamp-ask-confirm:\(pkg.gk)",
                     cancel: { armed = false }, confirm: { armed = false; Task { await remove() } })
        }
    }

    // MARK: writes

    /// A write as a check-in is one: the slot says saving, the store and the list change, then the other tabs and the
    /// figures read the new stamps (a-refund-leaves-every-count). The editor closes only on a save that landed.
    private func write(_ act: () async throws -> Void) async {
        masthead.saving()
        var landed = true
        do { try await act() } catch { landed = false }  // the model has put the reason in checkInError, which the screen shows
        // A failed Tally or Orphaned read would leave them counting the old stamps, so the slot says the write failed.
        var refreshed = true
        do { try await onChange() } catch { refreshed = false }
        await masthead.finished(failed: !landed || !refreshed)
        if landed { close() }
    }

    private func save() async { await write { try await model.stamp(pkg.gk, kind: kind, note: note) } }

    private func remove() async { await write { try await model.removeStamp(pkg.gk) } }
}
