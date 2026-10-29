import Foundation

/// Which token of shared/tokens.json each part of a Tally row paints with, as the web's ItemTotalRow chooses
/// them (src/app.jsx). XCUITest cannot read a colour, so the choice lives here and has a unit test; the view
/// maps a name through Parchment. Every text part sits on the card, the one fill green text clears 4.5:1 on.
/// The copy rows under an open row paint with PackageCard, and the edge bar with its barTrack and barFill.
public enum TallyRowPaint {
    public enum Part: CaseIterable, Hashable, Sendable {
        case surface, border, disclosure, name, meta, ratio, rate, left, across
    }

    /// A token name. `done` is every copy in. `left` keeps its red when done: the row hides it by opacity,
    /// so no check-in changes the row's height (no-layout-shift-under-pointer).
    public static func token(_ part: Part, done: Bool) -> String? {
        switch part {
        case .surface: return "card"
        case .border: return done ? "green" : "line"
        case .disclosure, .meta, .rate, .across: return "inkSoft"
        case .name: return "ink"
        case .ratio: return done ? "green" : "ink"
        case .left: return "red"
        }
    }
}
