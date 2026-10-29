// Tally row paint, the Swift side (step 4, tally-row-lists-its-copies, card-tally-row-counts-first,
// design-parchment-ledger, palette-tokens-contrast-floor).
//
// XCUITest cannot read a colour, so which token each part of a Tally row paints is a ManifestKit value
// pinned here, in the shape of PackageCardTokensTests. The view maps a name through Parchment.
// The row's choices are the web's ItemTotalRow in src/app.jsx. The copy rows under an open row paint with
// PackageCard.token (step 3), so they have no part here. The edge bar uses PackageCard's barTrack and barFill.
//
// Red-first. TallyRowPaint is a stub in Step4RedStubs.swift with wrong values. The builder replaces it.
//
// Contract the tests name (ManifestKit, Foundation only):
//   public enum TallyRowPaint {
//       public enum Part: CaseIterable, Hashable, Sendable {
//           case surface, border, disclosure, name, meta, ratio, rate, left, across
//       }
//       /// A token name of shared/tokens.json, or nil for "no paint". `done` is every copy in.
//       public static func token(_ part: Part, done: Bool) -> String?
//   }
//
// Rulings the table carries:
//   - `left` paints red whether or not the row is done. The row keeps the line mounted and hides it with
//     opacity, so no check-in changes the row's height (no-layout-shift-under-pointer).
//   - The done ratio is green. Green text clears 4.5:1 on card only (4.80), so every text part sits on `surface`.
//   - Faces and sizes (Cochin, mono) are the view's, outside shared/tokens.json.

import Foundation
import XCTest
@testable import ManifestKit

final class TallyRowPaintTests: XCTestCase {
    typealias Part = TallyRowPaint.Part

    /// One part's token while the row is open (not every copy in) and while it is done.
    struct Want {
        let whenOpen: String?, whenDone: String?
        init(_ open: String?, _ done: String?) { (whenOpen, whenDone) = (open, done) }
        init(all token: String) { self.init(token, token) }
    }

    static let table: [Part: Want] = [
        .surface: Want(all: "card"),             // the raised parchment
        .border: Want("line", "green"),          // green once every copy is in
        .disclosure: Want(all: "inkSoft"),
        .name: Want(all: "ink"),
        .meta: Want(all: "inkSoft"),
        .ratio: Want("ink", "green"),            // "3/3 ✓" turns green
        .rate: Want(all: "inkSoft"),
        .left: Want(all: "red"),                 // hidden by opacity when done, never unmounted
        .across: Want(all: "inkSoft"),
    ]

    static let states = [false, true]

    func want(_ part: Part, done: Bool) -> String? {
        done ? Self.table[part]?.whenDone : Self.table[part]?.whenOpen
    }

    // MARK: the table

    /// A new part must come with a row here, so no token goes unpinned.
    func testTheTableCoversEveryPart() {
        XCTAssertEqual(Set(Self.table.keys), Set(Part.allCases), "add a row for each part the Tally row paints")
    }

    func testEveryPartUsesItsToken() {
        for part in Part.allCases {
            for done in Self.states {
                XCTAssertEqual(TallyRowPaint.token(part, done: done), want(part, done: done), "\(part) while done is \(done)")
            }
        }
    }

    // MARK: the tokens exist

    /// Parchment.color(_:) stops the app on a name that is not in the file, so a typo must fail here.
    func testEveryTokenNameIsInTheSharedFile() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in Part.allCases {
            for done in Self.states {
                guard let name = TallyRowPaint.token(part, done: done) else { continue }
                XCTAssertNotNil(palette.tokens[name], "\(part) while done is \(done) names \(name), which shared/tokens.json lacks")
            }
        }
    }

    // MARK: contrast

    /// Every text part clears 4.5:1 on the card, open and done. The done ratio is green on card (4.80);
    /// green on paper (4.29) would fail, so the surface is the card in both states.
    func testEveryTextPairClearsTheFloor() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for done in Self.states {
            let surface = try XCTUnwrap(TallyRowPaint.token(.surface, done: done), "the row has no surface while done is \(done)")
            for part in [Part.disclosure, .name, .meta, .ratio, .rate, .left, .across] {
                let text = try XCTUnwrap(TallyRowPaint.token(part, done: done), "\(part) has no paint while done is \(done)")
                let r = try TokenContrast.ratio(text, on: surface, palette)
                XCTAssertGreaterThanOrEqual(r, 4.5, "\(part) on the row while done is \(done) (\(text) on \(surface))")
            }
        }
    }
}
