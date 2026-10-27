import Foundation

/// How far a line is checked in: done is the bundle's isDone (got >= qty).
public enum LineState: Equatable, Sendable {
    case open, partial, done

    public init(got: Int, qty: Int) {
        self = got >= qty ? .done : got > 0 ? .partial : .open
    }
}

/// Which token of shared/tokens.json each part of the package card paints with, state by state,
/// as the web card chooses them (src/app.jsx PackageCard, ItemRow). XCUITest cannot read a colour,
/// so the choice lives here and has a unit test; the view maps a name through Parchment.
public enum PackageCard {
    public enum Part: CaseIterable, Hashable, Sendable {
        case surface, border, seller, orderId, price, detail, rule, rowFill, name, count,
             pillText, pillFill, barTrack, barFill, boxBorder, boxFill, boxMark
    }

    /// A token name, or nil for "no paint". `state` is the line's; for .border it is the package's,
    /// and .done means every line is in.
    public static func token(_ part: Part, _ state: LineState) -> String? {
        switch part {
        case .surface: return "card"
        case .border: return state == .done ? "green" : "line"
        case .seller: return "ink"
        case .orderId, .price, .detail: return "inkSoft"
        case .rule: return "line"
        case .rowFill: return state == .done ? "greenSoft" : nil
        case .name: return state == .done ? "inkSoft" : "ink"
        // The stepper's got/qty: manilaInk while a line is partly in, ink otherwise (src/app.jsx ItemRow), so a done row's
        // count does not go soft with its name.
        case .count: return state == .partial ? "manilaInk" : "ink"
        case .pillText: return "red"
        case .pillFill: return "redSoft"
        case .barTrack: return "silver"
        case .barFill: return "accent"
        case .boxBorder: return state == .open ? "inkSoft" : state == .partial ? "manilaInk" : "green"
        case .boxFill: return state == .open ? "card" : state == .partial ? "manila" : "green"
        case .boxMark: return state == .open ? nil : state == .partial ? "manilaInk" : "card"
        }
    }

    /// What the status slot shows. RECEIVED comes from the package being done, never from a missing pill:
    /// a package still owed with no pill yet shows nothing.
    public enum Status: Equatable, Sendable {
        case pill(String), received, blank

        public init(done: Bool, pill: String?) {
            self = done ? .received : pill.map(Status.pill) ?? .blank
        }

        /// The slot's accessibility value: what the slot shows, so a VoiceOver reader hears the card's status.
        public var accessibilityValue: String {
            switch self {
            case .pill(let text): return text
            case .received: return "Received"
            case .blank: return ""
            }
        }
    }

    /// "$" + price.toFixed(2), as the web item row prints it: no thousands separator.
    /// ponytail: printf rounds an exact binary tie to even where toFixed rounds up; ledger prices are cents, which never tie.
    public static func priceText(_ price: Double) -> String { String(format: "$%.2f", price) }
}
