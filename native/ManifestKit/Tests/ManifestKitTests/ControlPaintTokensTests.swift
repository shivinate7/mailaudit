// The shared control parts: the mini button and the manila advisory line (design-parchment-ledger,
// orphaned-colours-by-meaning, palette-tokens-contrast-floor, shared-tokens-and-fixtures). Orphaned
// and Tally both draw them, so ControlPaint is their one home and this is its one test. The enum
// pattern is PackageCardTokensTests's, with no state argument.
//
// The mini button is ink on card with a line border. The advisory line is manilaInk on manila:
// manila is the advisory meaning, and manilaInk is the only ink checked against it
// (palette-inksoft-and-manilaink).
//
// Red-first. The API is ControlPaint (an enum of Part: CaseIterable, token(_:) -> String?).
// The red run is in the commit message.

import Foundation
import XCTest
@testable import ManifestKit

final class ControlPaintTokensTests: XCTestCase {
    typealias Part = ControlPaint.Part

    static let table: [Part: String] = [
        .miniText: "ink",
        .miniFill: "card",
        .miniBorder: "line",
        .advisoryText: "manilaInk",
        .advisoryFill: "manila",
    ]

    /// The text parts and the fill each sits on. miniBorder is a border and carries no pin.
    static let textPairs: [(text: Part, on: Part)] = [(.miniText, .miniFill), (.advisoryText, .advisoryFill)]

    // MARK: the table

    /// A new part must come with a row here, so no token goes unpinned.
    func testTheTableCoversEveryPart() {
        XCTAssertEqual(Set(Self.table.keys), Set(Part.allCases), "add a row for each shared control part")
    }

    func testEveryElementUsesItsToken() {
        for (part, want) in Self.table {
            XCTAssertEqual(ControlPaint.token(part), want, "\(part)")
        }
    }

    // MARK: the tokens exist

    /// Parchment.color(_:) stops the app on a name that is not in the file, so a typo must fail here.
    func testEveryTokenNameIsInTheSharedFile() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in Part.allCases {
            guard let name = ControlPaint.token(part) else { continue }
            XCTAssertNotNil(palette.tokens[name], "\(part) names \(name), which shared/tokens.json lacks")
        }
    }

    // MARK: contrast

    /// The label of a mini button, and the text of an advisory line, clear 4.5:1 on their own fill.
    func testEveryTextPairClearsTheFloor() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for pair in Self.textPairs {
            let text = try XCTUnwrap(ControlPaint.token(pair.text), "\(pair.text) paints nothing")
            let fill = try XCTUnwrap(ControlPaint.token(pair.on), "\(pair.on) paints nothing")
            let r = try TokenContrast.ratio(text, on: fill, palette)
            XCTAssertGreaterThanOrEqual(r, 4.5, "\(pair.text) on \(pair.on) (\(text) on \(fill))")
        }
    }
}
