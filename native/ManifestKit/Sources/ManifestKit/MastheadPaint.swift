import Foundation

/// What the masthead paints with, as token NAMES of shared/tokens.json, so each colour meaning
/// is a value a unit test can read (palette-gold-is-ornament-only, progress-bar-accent-then-green,
/// typography-cochin-and-mono). The view turns a name into a Color; sizes live in the view.
public enum MastheadPaint {
    public enum Face: Equatable, Sendable { case cochin, mono }

    public struct Style: Equatable, Sendable {
        public let token: String
        public let face: Face
        public let uppercase: Bool
        /// letter-spacing in em, as the web sets it; 0 for none
        public let tracking: Double
        public let bold: Bool

        init(_ token: String, _ face: Face, uppercase: Bool = false, tracking: Double = 0, bold: Bool = false) {
            (self.token, self.face, self.uppercase, self.tracking, self.bold) = (token, face, uppercase, tracking, bold)
        }
    }

    public enum Role {
        case title, house, tallyLabel, tallyLead, tallyRest, count
        case missing(remaining: Int)
        case slot(SaveIndicator)
    }

    public static func style(_ role: Role) -> Style {
        switch role {
        case .title: Style("ink", .cochin, uppercase: true, tracking: 0.22)
        case .house: Style("inkSoft", .mono, uppercase: true, tracking: 0.26)
        case .tallyLabel: Style("inkSoft", .mono, uppercase: true, tracking: 0.16)
        case .tallyLead: Style("accent", .mono, bold: true)
        case .tallyRest: Style("inkSoft", .mono)
        case .count: Style("inkSoft", .mono)
        case .missing(let remaining): Style(remaining == 0 ? "green" : "red", .mono, bold: true)
        case .slot(let state): Style(state == .failed ? "red" : "inkSoft", .mono)
        }
    }

    /// The fill of the bar. Percent is 0...100.
    public static func barToken(percent: Double) -> String { percent >= 100 ? "green" : "accent" }

    public static let rule = "gold"
    public static let divider = "line"
    public static let barTrack = "silver"

    public struct SealLayer: Equatable, Sendable {
        public let name: String
        /// body: gradient stops, light to deep, evenly spaced; every other layer: one token
        public let tokens: [String]
        public let opacity: Double
    }

    /// In paint order, as `Seal` in src/app.jsx draws them.
    public static let seal: [SealLayer] = [
        SealLayer(name: "body", tokens: ["waxLit", "wax", "waxDeep"], opacity: 1),
        SealLayer(name: "ring", tokens: ["waxDeep"], opacity: 0.6),
        SealLayer(name: "cut", tokens: ["waxCut"], opacity: 0.78),
        SealLayer(name: "raised", tokens: ["waxRaised"], opacity: 0.5),
        SealLayer(name: "shine", tokens: ["card"], opacity: 0.22),
    ]

    /// cards : packages : value, as `.mdl-thirds` is (masthead-tallies-unequal-thirds).
    public static let tallyWeights: [Double] = [1, 1, 1.7]
}

extension TallyCell {
    private var slash: String.Index { figure.firstIndex(of: "/") ?? figure.endIndex }
    /// The got figure, drawn in accent.
    public var lead: String { String(figure[..<slash]) }
    /// "/total", drawn in inkSoft.
    public var rest: String { String(figure[slash...]) }
}
