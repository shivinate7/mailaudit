import ManifestKit
import SwiftUI

/// A token of shared/tokens.json as a colour, or clear when the part has no paint.
func paint(_ part: PackageCard.Part, _ state: LineState) -> Color {
    PackageCard.token(part, state).map(Parchment.color) ?? .clear
}

/// One item line, the web's ItemRow: a 45pt check-in frame holding a 30pt square box, the title and detail in
/// Cochin, the price in mono, and a got/qty stepper for a line of more than one copy. Packages and Tally both
/// draw it (one home); the caller supplies the line's state, its text and its actions. Nothing here reads a model.
struct ItemLine: View {
    let state: LineState
    /// The product name, for the control's spoken label.
    let name: String
    /// Packages shows the product, Tally the seller.
    let title: String
    let detail: String
    let price: Double
    /// Tally copies name the order under the detail. Packages names it in the card header.
    var orderID: String?
    /// The got/qty read-out, nil for a one-copy line: no stepper then.
    let readout: String?
    /// The check-in control's spoken value ("1 of 2").
    var checkInValue = ""
    let checkInID: String
    /// The identifier of the element that reads the title, detail and order id as one; nil leaves them apart.
    var copyID: String?
    /// The stepper's identifier suffix: ids are "step-minus:<key>", "got-qty:<key>".
    let key: String
    let onTap: () async -> Void
    let onStep: (Int) async -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Button {
                Task { await onTap() }  // a failure shows in the model's checkInError
            } label: {
                box.frame(width: 45, height: 45)  // 45: layout rounding made a 44pt frame read 43.99999
            }
            .accessibilityLabel("\(state == .done ? "Undo check in" : "Check in") \(name)")
            .accessibilityValue(checkInValue)
            .accessibilityIdentifier(checkInID)
            VStack(alignment: .leading, spacing: 4) {
                text
                if let readout { stepper(readout) }
            }
            .padding(.vertical, 12)  // as the web row: 12 above and below
            .padding(.trailing, 12)
        }
        .padding(.leading, 4)
        .frame(minHeight: 45, alignment: .top)
        .background(paint(.rowFill, state))
        .overlay(alignment: .top) { paint(.rule, state).frame(height: 1) }
    }

    @ViewBuilder private var text: some View {
        if let copyID {
            lines.accessibilityElement(children: .combine).accessibilityIdentifier(copyID)
        } else {
            lines
        }
    }

    private var lines: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(title).font(.cochin(14).weight(.semibold)).foregroundStyle(paint(.name, state))
                Spacer(minLength: 0)
                Text(PackageCard.priceText(price)).font(.mono(12)).foregroundStyle(paint(.price, state)).fixedSize()
                    .accessibilityLabel("Price \(PackageCard.priceText(price))")
            }
            Text(detail).font(.cochin(11.5)).foregroundStyle(paint(.detail, state))
            // The order id: the web underlines it and opens the order in Packages. Native has no such route yet, so it is plain.
            if let orderID { Text(orderID).font(.mono(10.5)).foregroundStyle(paint(.orderId, state)) }
        }
    }

    /// The web stepper under the detail line: − got/qty +. Each button moves the count by one through
    /// the caller's onStep, the checkbox's save path. A button is a 34pt square, as on the web, in a 44pt hit frame.
    private func stepper(_ readout: String) -> some View {
        HStack(spacing: 4) {
            stepButton("\u{2013}", by: -1, label: "One fewer received", id: "step-minus")
            count(readout).frame(minWidth: 44)
            stepButton("+", by: 1, label: "One more received", id: "step-plus")
        }
        .padding(.top, 4)  // with the column's 4pt spacing, the web's 8pt margin
    }

    private func stepButton(_ glyph: String, by delta: Int, label: String, id: String) -> some View {
        Button {
            Task { await onStep(delta) }
        } label: {
            Text(glyph).font(.system(size: 16)).foregroundStyle(paint(.name, .open))
                .frame(width: 34, height: 34)
                .background(RoundedRectangle(cornerRadius: 8).fill(paint(.surface, .open)))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.rule, .open), lineWidth: 1))
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .accessibilityLabel(label)
        .accessibilityIdentifier("\(id):\(key)")
    }

    /// How many of a multi-copy line are in, as the web's got/qty (the bundle's gotQty). An invisible widest figure sets
    /// the width, so a shorter figure (10/12 to 9/12) never changes the row. A partly received line is bold, in manilaInk.
    /// No accessibilityLabel: the text is the label, so "0/2" stays readable to the UI test.
    private func count(_ readout: String) -> some View {
        Text(readout.split(separator: "/").last.map { "\($0)/\($0)" } ?? readout).font(.mono(13))
            .hidden()
            .overlay {
                Text(readout).font(.mono(13).weight(state == .partial ? .bold : .regular))
                    .foregroundStyle(paint(.count, state)).fixedSize()
                    .accessibilityIdentifier("got-qty:\(key)")
            }
    }

    private var box: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8).fill(paint(.boxFill, state))
            RoundedRectangle(cornerRadius: 8).strokeBorder(paint(.boxBorder, state), lineWidth: 2)
            switch state {
            case .done: Image(systemName: "checkmark").font(.system(size: 15, weight: .heavy)).foregroundStyle(paint(.boxMark, state))
            case .partial: Text("\u{2013}").font(.system(size: 16)).foregroundStyle(paint(.boxMark, state))
            case .open: EmptyView()
            }
        }
        .frame(width: 30, height: 30)
    }
}
