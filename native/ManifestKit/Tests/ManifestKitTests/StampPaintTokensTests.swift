// Stamp colour meanings (native-parity-table, design-parchment-ledger, palette-gold-is-ornament-only,
// palette-tokens-contrast-floor, shared-tokens-and-fixtures). XCUITest cannot read a colour, and CI runs only
// `swift test`, so which token each part of the stamp band, editor, armed ask and stamped cell uses is a
// ManifestKit value, pinned here. Same shape as OrphanedPaintTokensTests: no state argument, because a part that
// changes token with a state (a kind chip on or off, Save ready or not, the armed Remove) is two parts.
//
// Every row is the web's choice in src/app.jsx: stampChip (the band's chip), the band's note and chevron, the
// editor (subHead and cellLab, stampKindCell over optCell, the note field, the Remove, Cancel and Save buttons) and
// cancCell (the stamped cell). The refunded pill is a PackageCard part, pinned in PackageCardTokensTests.

import Foundation
import XCTest
@testable import ManifestKit

final class StampPaintTokensTests: XCTestCase {
    typealias Part = StampPaint.Part

    /// What each part paints with. Gold is ornament only, so no row names it.
    static let table: [Part: String] = [
        .bandChip: "manilaInk",           // stampChip: the advisory colour, text and 2px edge alike
        .bandNote: "ink",                 // the band's italic free line
        .bandChevron: "inkSoft",
        .head: "inkSoft",                 // cellLab: the STAMP micro label
        .rule: "line",                    // the label's rule, the stamped row's rules and its cell edge
        .kindOffText: "ink",              // optCell(false)
        .kindOffFill: "card",
        .kindBorder: "line",              // stampKindCell: an off chip carries its own rule
        .kindOnText: "card",              // optCell(true)
        .kindOnFill: "accent",            // the chosen chip's fill and its edge
        .noteText: "ink",
        .noteFill: "card",
        .noteBorder: "line",
        .notePlaceholder: "inkSoft",      // the web sets none and takes the browser's grey; native names a token
        .removeText: "red",               // Remove stamp, before it is armed
        .removeFill: "card",
        .removeBorder: "redSoft",
        .saveReadyText: "card",           // Save once a kind is picked: ink fill and edge
        .saveReadyFill: "ink",
        .saveOffText: "inkSoft",          // Save while no kind is picked: card fill, line edge
        .saveOffBorder: "line",
        .askText: "card",                 // the armed Remove: card on red, with a red edge
        .askFill: "red",
        .askPanelFill: "card",            // native only: the web arms in place, native hangs a panel to move nothing
        .askPanelBorder: "redSoft",
        .cellText: "inkSoft",             // cancCell(false), and its ○
        .cellOnText: "ink",               // cancCell(true)
        .cellGlyphOn: "accent",           // the ● while the filter is on
    ]

    /// Parts that are a fill or a border. Every other part is text and needs a contrast pin below.
    static let notText: Set<Part> = [
        .rule, .kindOffFill, .kindBorder, .kindOnFill, .noteFill, .noteBorder, .removeFill, .removeBorder,
        .saveReadyFill, .saveOffBorder, .askFill, .askPanelFill, .askPanelBorder,
    ]

    /// What a text part sits on: another part, or a token for a surface that is not a part.
    enum Surface {
        case part(Part)
        case token(String)
    }

    /// The package card's own surface, read from PackageCard so a change there moves these pairs with it. Its value
    /// is pinned in PackageCardTokensTests.
    static let card = Surface.token(PackageCard.token(.surface, .open)!)
    /// The ruled row sits on the page, with no fill of its own.
    static let page = Surface.token("paper")

    /// Each text part and the surface it really sits on.
    static let textPairs: [(text: Part, on: Surface)] = [
        (.bandChip, card), (.bandNote, card), (.bandChevron, card), (.head, card),
        (.kindOffText, .part(.kindOffFill)), (.kindOnText, .part(.kindOnFill)),
        (.noteText, .part(.noteFill)), (.notePlaceholder, .part(.noteFill)),
        (.removeText, .part(.removeFill)),
        (.saveReadyText, .part(.saveReadyFill)), (.saveOffText, card),
        (.askText, .part(.askFill)),
        (.cellText, page), (.cellOnText, page), (.cellGlyphOn, page),
    ]

    private func name(_ surface: Surface) -> String {
        switch surface {
        case .part(let p): return StampPaint.token(p)
        case .token(let t): return t
        }
    }

    // MARK: the table

    /// A new part must come with a row here, so no token goes unpinned.
    func testTheTableCoversEveryPart() {
        XCTAssertEqual(Set(Self.table.keys), Set(Part.allCases), "add a row for each part the stamp paints")
    }

    func testEveryElementUsesItsToken() {
        for (part, want) in Self.table {
            XCTAssertEqual(StampPaint.token(part), want, "\(part)")
        }
    }

    // MARK: the tokens exist

    /// Parchment.color(_:) stops the app on a name that is not in the file, so a typo must fail here.
    func testEveryTokenNameIsInTheSharedFile() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in Part.allCases {
            let name = StampPaint.token(part)
            XCTAssertNotNil(palette.tokens[name], "\(part) names \(name), which shared/tokens.json lacks")
        }
    }

    // MARK: contrast

    /// A text part with no pair would escape the floor, so the pairs and the text parts must agree.
    func testEveryTextPartHasOneContrastPin() {
        XCTAssertEqual(
            Self.textPairs.map(\.text).sorted { "\($0)" < "\($1)" },
            Set(Part.allCases).subtracting(Self.notText).sorted { "\($0)" < "\($1)" },
            "each text part needs exactly one pair in textPairs, and a fill or border belongs in notText")
    }

    /// Every text pair clears 4.5:1 on the surface it really sits on (palette-tokens-contrast-floor).
    func testEveryTextPairClearsTheFloor() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for pair in Self.textPairs {
            let text = StampPaint.token(pair.text)
            let surface = name(pair.on)
            let r = try TokenContrast.ratio(text, on: surface, palette)
            XCTAssertGreaterThanOrEqual(r, 4.5, "\(pair.text) (\(text) on \(surface))")
        }
    }
}
