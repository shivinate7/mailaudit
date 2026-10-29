import Foundation

/// Which token of shared/tokens.json each part of the Orphaned screen paints with, as the web chooses
/// them (src/app.jsx EnvelopeCard, EnvelopeComposer, Notice). XCUITest cannot read a colour, so the
/// choice lives here and has a unit test; the view maps a name through Parchment. A part's text is
/// pinned against the surface it really sits on: green text only on card (green on paper is 4.29).
public enum OrphanedPaint {
    public enum Part: CaseIterable, Hashable, Sendable {
        case cardSurface, cardBorder, composerBorder, microLabel, entry, note, candidateBorder,
             seller, candidateMeta, fitExact, fitPlain, discardText, discardBorder, armedText, armedFill,
             recordText, recordFill, saveReadyText, saveReadyFill, saveEmptyText, saveEmptyBorder,
             noticeFill, noticeBorder, noticeText, dismiss, emptyLine, badgeText, badgeFill
    }

    /// A token name. Every Orphaned part paints.
    public static func token(_ part: Part) -> String? {
        switch part {
        case .cardSurface, .armedText, .recordText, .saveReadyText, .badgeText: return "card"
        case .cardBorder, .candidateBorder, .saveEmptyBorder: return "line"
        case .composerBorder, .entry, .seller, .recordFill, .saveReadyFill, .noticeText: return "ink"
        case .microLabel, .note, .candidateMeta, .fitPlain, .saveEmptyText, .dismiss, .emptyLine: return "inkSoft"
        case .fitExact, .noticeBorder: return "green"
        case .discardText, .armedFill, .badgeFill: return "red"
        case .discardBorder: return "redSoft"
        case .noticeFill: return "greenSoft"
        }
    }
}
