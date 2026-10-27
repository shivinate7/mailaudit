import Foundation

/// Which token of shared/tokens.json each part of the Ledger tab and its Sync panel paints with, as the web's
/// `.mdl-l*` rules, `LedgerRow`, `verRow`, `restoreCell` and `partGrid` choose them (src/app.jsx). XCUITest
/// cannot read a colour, so the choice lives here and has a unit test; the view maps a name through Parchment.
/// The mini buttons and the manila advisory fill and text are ControlPaint's.
public enum LedgerPaint {
    public enum Part: CaseIterable, Hashable, Sendable {
        case title, groupLabel, cardSurface, cardBorder, rowRule, rowTitle, rowSub, rowValue, rowValueAdvisory,
             disclosure, resetText, resetFill, cancelText, versionWhen, versionLabel, versionLabelSoft,
             versionFigure, restoreText, restoreFill, restoreBorder, errorText, errorFill,
             panelRule, partLabel, partValue, photoProgress, advisoryRule
    }

    /// A token name, or nil for "no paint". `armed` is the Reset or Restore ask armed: both arm in place
    /// and turn card text on a red fill (armed-reset-takes-the-row).
    public static func token(_ part: Part, armed: Bool) -> String? {
        switch part {
        case .title, .groupLabel, .rowSub, .disclosure, .versionLabelSoft, .versionFigure,
             .partLabel, .partValue, .photoProgress: return "inkSoft"
        case .cardSurface: return "card"
        case .cardBorder, .rowRule, .panelRule, .advisoryRule: return "line"
        case .rowTitle, .cancelText, .versionWhen, .versionLabel: return "ink"
        case .rowValue: return "accent"
        case .rowValueAdvisory: return "manilaInk"
        case .resetText, .restoreText: return armed ? "card" : "red"
        case .resetFill: return armed ? "red" : nil
        case .restoreFill: return armed ? "red" : "redSoft"
        case .restoreBorder: return armed ? "red" : "line"
        case .errorText: return "red"
        case .errorFill: return "redSoft"
        }
    }
}
