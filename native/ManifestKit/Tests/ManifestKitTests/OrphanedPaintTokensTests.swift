// Orphaned colour meanings (orphaned-colours-by-meaning, design-parchment-ledger,
// palette-tokens-contrast-floor, shared-tokens-and-fixtures). XCUITest cannot read a colour, and CI
// runs only `swift test`, so which token each part of the screen uses is a ManifestKit value,
// pinned here. The view maps a token name to a colour through Parchment and writes no colour of its
// own. Same shape as PackageCardTokensTests, with no state argument: Orphaned parts do not change
// token with a state, only the armed Discard and the Save button swap parts.
//
// Every row is the web's choice in src/app.jsx (EnvelopeCard, EnvelopeComposer, Notice), read off the
// designer's step 4 spec. Manila advisory parts and mini buttons live in ControlPaint, and its
// test is ControlPaintTokensTests.
//
// Red-first. The API is OrphanedPaint (an enum of Part: CaseIterable, token(_:) -> String?) and
// OrphanedModel.badgeCount. The red run is in the commit message.

import Foundation
import XCTest
@testable import ManifestKit

final class OrphanedPaintTokensTests: XCTestCase {
    typealias Part = OrphanedPaint.Part

    /// What each part paints with. nil is "no paint"; no Orphaned part is nil.
    static let table: [Part: String] = [
        .cardSurface: "card",             // the envelope card and composer are raised parchment, so green text sits on card
        .cardBorder: "line",
        .composerBorder: "ink",           // the composer is outlined in ink, not line
        .microLabel: "inkSoft",           // ENVELOPE header, COULD HAVE COME FROM, NEW ENVELOPE
        .entry: "ink",
        .note: "inkSoft",
        .candidateBorder: "line",
        .seller: "ink",
        .candidateMeta: "inkSoft",
        .fitExact: "green",               // an exact match is a check-in's meaning
        .fitPlain: "inkSoft",
        .discardText: "red",              // Discard is the destructive meaning
        .discardBorder: "redSoft",
        .armedText: "card",
        .armedFill: "red",
        .recordText: "card",
        .recordFill: "ink",
        .saveReadyText: "card",
        .saveReadyFill: "ink",
        .saveEmptyText: "inkSoft",
        .saveEmptyBorder: "line",
        .noticeFill: "greenSoft",         // the Undo notice reports a check-in
        .noticeBorder: "green",
        .noticeText: "ink",
        .dismiss: "inkSoft",
        .emptyLine: "inkSoft",
        .badgeText: "card",
        .badgeFill: "red",
    ]

    /// Parts that are a fill or a border. Every other part is text and needs a contrast pin below.
    static let notText: Set<Part> = [
        .cardSurface, .cardBorder, .composerBorder, .candidateBorder, .discardBorder, .armedFill,
        .recordFill, .saveReadyFill, .saveEmptyBorder, .noticeFill, .noticeBorder, .badgeFill,
    ]

    /// Each text part and the surface it really sits on; nil is the page itself, paper. Green
    /// text sits only on card: green on paper is 4.29 and on greenSoft 4.13, and both fail 4.5.
    static let textPairs: [(text: Part, on: Part?)] = [
        (.microLabel, .cardSurface), (.entry, .cardSurface), (.note, .cardSurface),
        (.seller, .cardSurface), (.candidateMeta, .cardSurface),
        (.fitExact, .cardSurface), (.fitPlain, .cardSurface),
        (.discardText, .cardSurface), (.saveEmptyText, .cardSurface),
        (.armedText, .armedFill), (.recordText, .recordFill), (.saveReadyText, .saveReadyFill),
        (.noticeText, .noticeFill), (.dismiss, .noticeFill),
        (.emptyLine, nil),                // the empty pile sits on the page: inkSoft on paper, 4.68
        (.badgeText, .badgeFill),
    ]

    // MARK: the table

    /// A new part must come with a row here, so no token goes unpinned.
    func testTheTableCoversEveryPart() {
        XCTAssertEqual(Set(Self.table.keys), Set(Part.allCases), "add a row for each part the screen paints")
    }

    func testEveryElementUsesItsToken() {
        for (part, want) in Self.table {
            XCTAssertEqual(OrphanedPaint.token(part), want, "\(part)")
        }
    }

    // MARK: the tokens exist

    /// Parchment.color(_:) stops the app on a name that is not in the file, so a typo must fail here.
    func testEveryTokenNameIsInTheSharedFile() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in Part.allCases {
            guard let name = OrphanedPaint.token(part) else { continue }
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
            let text = try XCTUnwrap(OrphanedPaint.token(pair.text), "\(pair.text) paints nothing")
            let surface = try pair.on.map { try XCTUnwrap(OrphanedPaint.token($0), "\($0) paints nothing") } ?? "paper"
            let r = try TokenContrast.ratio(text, on: surface, palette)
            XCTAssertGreaterThanOrEqual(r, 4.5, "\(pair.text) on \(pair.on.map { "\($0)" } ?? "the page") (\(text) on \(surface))")
        }
    }

    /// The Undo notice's green edge is a non-text border, so it needs 3:1 on the page, not 4.5.
    func testTheNoticeEdgeClearsThreeToOneOnThePage() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        let edge = try XCTUnwrap(OrphanedPaint.token(.noticeBorder), "the notice has no edge")
        XCTAssertGreaterThanOrEqual(try TokenContrast.ratio(edge, on: "paper", palette), 3, "the notice edge on paper")
    }
}
