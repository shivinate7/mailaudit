import Foundation

/// Which token of shared/tokens.json each part of the stamp band, editor and stamped cell paints with, as the web
/// chooses them (src/app.jsx stampChip, stampKindCell, the band and editor of PackageCard, the cancCell row).
/// XCUITest cannot read a colour, so the choice lives here and the view maps a name through Parchment.
/// Gold is ornament only and appears nowhere here (palette-gold-is-ornament-only).
public enum StampPaint {
    public enum Part: CaseIterable, Hashable, Sendable {
        case bandChip, bandNote, bandChevron, head, rule,
             kindOffText, kindOffFill, kindBorder, kindOnText, kindOnFill,
             noteText, noteFill, noteBorder, notePlaceholder,
             removeText, removeFill, removeBorder, saveReadyText, saveReadyFill, saveOffText, saveOffBorder,
             askText, askFill, askPanelFill, askPanelBorder,
             cellText, cellOnText, cellGlyphOn
    }

    /// A token name. Every stamp part paints.
    public static func token(_ part: Part) -> String {
        switch part {
        case .bandChip: return "manilaInk"
        case .bandNote, .kindOffText, .noteText, .cellOnText, .saveReadyFill: return "ink"
        case .bandChevron, .head, .notePlaceholder, .saveOffText, .cellText: return "inkSoft"
        case .rule, .kindBorder, .noteBorder, .saveOffBorder: return "line"
        case .kindOffFill, .kindOnText, .noteFill, .removeFill, .saveReadyText, .askText, .askPanelFill: return "card"
        case .kindOnFill, .cellGlyphOn: return "accent"
        case .removeText, .askFill: return "red"
        case .removeBorder, .askPanelBorder: return "redSoft"
        }
    }
}
