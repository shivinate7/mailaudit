// Ledger tab and Sync panel paint, the Swift side (step 4, ledger-tab-holds-options, armed-reset-takes-the-row,
// sync-panel-is-two-column-grid, sync-particulars-ruled-values, typography-cochin-and-mono,
// palette-tokens-contrast-floor).
//
// XCUITest cannot read a colour, so which token each part of the Ledger tab paints is a ManifestKit value
// pinned here, in the shape of PackageCardTokensTests. The web's choices are the `.mdl-l*` rules, `LedgerRow`,
// `verRow`, `restoreCell` and the Sync panel's `partGrid`, `partLab`, `partVal` in src/app.jsx.
//
// Not pinned here: the shared mini buttons and the manila advisory fill and text. ControlPaint is lane A's
// (README of the step 4 design). This enum has the advisory line's rule only (`advisoryRule`).
//
// Red-first. LedgerPaint is a stub in Step4RedStubs.swift with wrong values. The builder replaces it.
//
// Contract the tests name (ManifestKit, Foundation only):
//   public enum LedgerPaint {
//       public enum Part: CaseIterable, Hashable, Sendable {
//           case title, groupLabel, cardSurface, cardBorder, rowRule, rowTitle, rowSub, rowValue, rowValueAdvisory,
//                disclosure, resetText, resetFill, cancelText, versionWhen, versionLabel, versionLabelSoft,
//                versionFigure, restoreText, restoreFill, restoreBorder, errorText, errorFill,
//                panelRule, partLabel, partValue, photoProgress, advisoryRule
//       }
//       /// A token name of shared/tokens.json, or nil for "no paint". `armed` is the Reset or Restore ask armed.
//       public static func token(_ part: Part, armed: Bool) -> String?
//   }
//
// Rulings the table carries:
//   - Reset and Restore arm in place (armed-reset-takes-the-row): the text turns card on a red fill.
//     The idle Reset has no fill. The idle Restore sits on redSoft.
//   - A version's label is ink for a milestone and inkSoft for another kind: two parts, so the view picks.
//   - Sync needing a fix paints the Sync row value manilaInk, never red (an unbacked-up ledger is a state to fix).
//   - Lines (cardBorder, rowRule, panelRule, advisoryRule) are decorative at 1.15 to 1.45:1. The text names
//     each control, so no contrast floor is pinned on a line.

import Foundation
import XCTest
@testable import ManifestKit

final class LedgerPaintTests: XCTestCase {
    typealias Part = LedgerPaint.Part

    /// One part's token while idle and while armed.
    struct Want {
        let idle: String?, armed: String?
        init(_ idle: String?, _ armed: String?) { (self.idle, self.armed) = (idle, armed) }
        init(all token: String) { self.init(token, token) }
    }

    static let table: [Part: Want] = [
        .title: Want(all: "inkSoft"),
        .groupLabel: Want(all: "inkSoft"),
        .cardSurface: Want(all: "card"),
        .cardBorder: Want(all: "line"),
        .rowRule: Want(all: "line"),
        .rowTitle: Want(all: "ink"),
        .rowSub: Want(all: "inkSoft"),
        .rowValue: Want(all: "accent"),
        .rowValueAdvisory: Want(all: "manilaInk"),
        .disclosure: Want(all: "inkSoft"),
        .resetText: Want("red", "card"),
        .resetFill: Want(nil, "red"),
        .cancelText: Want(all: "ink"),
        .versionWhen: Want(all: "ink"),
        .versionLabel: Want(all: "ink"),
        .versionLabelSoft: Want(all: "inkSoft"),
        .versionFigure: Want(all: "inkSoft"),
        .restoreText: Want("red", "card"),
        .restoreFill: Want("redSoft", "red"),
        .restoreBorder: Want("line", "red"),
        .errorText: Want(all: "red"),
        .errorFill: Want(all: "redSoft"),
        .panelRule: Want(all: "line"),
        .partLabel: Want(all: "inkSoft"),
        .partValue: Want(all: "inkSoft"),
        .photoProgress: Want(all: "inkSoft"),
        .advisoryRule: Want(all: "line"),
    ]

    static let states = [false, true]

    func want(_ part: Part, armed: Bool) -> String? {
        armed ? Self.table[part]?.armed : Self.table[part]?.idle
    }

    // MARK: the table

    /// A new part must come with a row here, so no token goes unpinned.
    func testTheTableCoversEveryPart() {
        XCTAssertEqual(Set(Self.table.keys), Set(Part.allCases), "add a row for each part the Ledger tab paints")
    }

    func testEveryPartUsesItsToken() {
        for part in Part.allCases {
            for armed in Self.states {
                XCTAssertEqual(LedgerPaint.token(part, armed: armed), want(part, armed: armed), "\(part) while armed is \(armed)")
            }
        }
    }

    // MARK: the tokens exist

    /// Parchment.color(_:) stops the app on a name that is not in the file, so a typo must fail here.
    func testEveryTokenNameIsInTheSharedFile() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in Part.allCases {
            for armed in Self.states {
                guard let name = LedgerPaint.token(part, armed: armed) else { continue }
                XCTAssertNotNil(palette.tokens[name], "\(part) while armed is \(armed) names \(name), which shared/tokens.json lacks")
            }
        }
    }

    // MARK: contrast

    func token(_ part: Part, armed: Bool = false) throws -> String {
        try XCTUnwrap(LedgerPaint.token(part, armed: armed), "\(part) has no paint while armed is \(armed)")
    }

    func assertFloor(_ text: String, on surface: String, _ what: String, _ palette: Palette, line: UInt = #line) throws {
        let r = try TokenContrast.ratio(text, on: surface, palette)
        XCTAssertGreaterThanOrEqual(r, 4.5, "\(what) (\(text) on \(surface))", line: line)
    }

    /// The title and the group labels sit on the page, which is paper (4.68 for inkSoft).
    func testTheTitleAndGroupLabelsClearTheFloorOnPaper() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in [Part.title, .groupLabel] {
            try assertFloor(try token(part), on: "paper", "\(part) on paper", palette)
        }
    }

    /// Everything inside the group card, the Reset box and the open panels sits on the card fill.
    func testEveryTextOnTheCardClearsTheFloor() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        let card = try token(.cardSurface)
        for part in [Part.rowTitle, .rowSub, .rowValue, .rowValueAdvisory, .disclosure, .cancelText,
                     .versionWhen, .versionLabel, .versionLabelSoft, .versionFigure,
                     .partLabel, .partValue, .photoProgress] {
            try assertFloor(try token(part), on: card, "\(part) on the card", palette)
        }
        try assertFloor(try token(.resetText), on: card, "the idle Reset on the card", palette)
    }

    /// The armed Reset fills its row with red and writes card on it (5.48).
    func testTheArmedResetClearsTheFloorOnItsFill() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        try assertFloor(try token(.resetText, armed: true), on: try token(.resetFill, armed: true), "the armed Reset on its fill", palette)
    }

    /// Restore is red on redSoft (4.76) at rest and card on red once armed. The error box is red on redSoft.
    func testTheRestoreAndErrorPairsClearTheFloor() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for armed in Self.states {
            try assertFloor(try token(.restoreText, armed: armed), on: try token(.restoreFill, armed: armed),
                      "Restore while armed is \(armed)", palette)
        }
        try assertFloor(try token(.errorText), on: try token(.errorFill), "the error text on its fill", palette)
    }
}
