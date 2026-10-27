import ManifestKit
import SwiftUI

/// Colours and type for every screen. The palette is shared/tokens.json, decoded once
/// (shared-tokens-and-fixtures); no colour value is written in Swift (design-parchment-ledger).
enum Parchment {
    private static let palette: Palette = {
        guard let url = Bundle.main.url(forResource: "tokens", withExtension: "json"),
            let data = try? Data(contentsOf: url), let palette = try? Palette.decode(data)
        else { fatalError("shared/tokens.json is not in the app bundle or does not decode") }
        return palette
    }()

    /// Decode at launch, so a bad bundle stops the app on the first frame and not on the first screen to paint.
    static func load() { _ = palette }

    /// The tab bar's badge is the red token with card text (OrphanedPaint.badgeFill, badgeText). Only the
    /// badge is set; the bar keeps its default glass, tint and item colours.
    static func paintTabBadge() {
        let item = UITabBarItemAppearance()
        item.normal.badgeBackgroundColor = UIColor(color(OrphanedPaint.token(.badgeFill) ?? "red"))
        item.normal.badgeTextAttributes = [.foregroundColor: UIColor(color(OrphanedPaint.token(.badgeText) ?? "card"))]
        item.selected.badgeBackgroundColor = item.normal.badgeBackgroundColor
        item.selected.badgeTextAttributes = item.normal.badgeTextAttributes
        let bar = UITabBarAppearance()
        bar.configureWithDefaultBackground()
        bar.stackedLayoutAppearance = item
        bar.inlineLayoutAppearance = item
        bar.compactInlineLayoutAppearance = item
        UITabBar.appearance().standardAppearance = bar
        UITabBar.appearance().scrollEdgeAppearance = bar
    }

    static func color(_ token: String) -> Color {
        guard let c = palette.tokens[token] else { fatalError("no token \(token) in shared/tokens.json") }
        return Color(.sRGB, red: Double(c.red) / 255, green: Double(c.green) / 255, blue: Double(c.blue) / 255, opacity: c.alpha)
    }

    static var paper: Color { color("paper") }
    static var card: Color { color("card") }
    static var ink: Color { color("ink") }
    static var inkSoft: Color { color("inkSoft") }
    static var line: Color { color("line") }
    static var gold: Color { color("gold") }
    static var silver: Color { color("silver") }
    static var accent: Color { color("accent") }
    static var green: Color { color("green") }
    static var greenSoft: Color { color("greenSoft") }
    static var red: Color { color("red") }
    static var redSoft: Color { color("redSoft") }
    static var manila: Color { color("manila") }
    static var manilaInk: Color { color("manilaInk") }
    static var amber: Color { color("amber") }
    static var wax: Color { color("wax") }
    static var waxLit: Color { color("waxLit") }
    static var waxDeep: Color { color("waxDeep") }
    static var waxCut: Color { color("waxCut") }
    static var waxRaised: Color { color("waxRaised") }
    static var shadow: Color { color("shadow") }
    static var scrim: Color { color("scrim") }
}

extension View {
    /// Paper behind a tab's content. Each tab paints its own, because a tab's scroll content covers a background set on the TabView.
    func parchmentPaper() -> some View {
        scrollContentBackground(.hidden).background(Parchment.paper.ignoresSafeArea()).duoSystemBar()
    }
}

/// Cochin sets words and Menlo sets numbers (typography-cochin-and-mono). Both scale with
/// Dynamic Type relative to a text style.
extension Font {
    static func cochin(_ size: CGFloat, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom("Cochin", size: size, relativeTo: style)
    }

    static func mono(_ size: CGFloat, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom("Menlo-Regular", size: size, relativeTo: style)
    }
}
