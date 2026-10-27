// Package card colour meanings (lane N15, design-parchment-ledger, palette-tokens-contrast-floor,
// shared-tokens-and-fixtures). XCUITest cannot read a colour, and CI runs only `swift test`, so
// which token each element of the card uses is a ManifestKit value, pinned here. The view maps a
// token name to a colour through Parchment and writes no colour of its own.
//
// Every row below is the web card's choice in src/app.jsx (PackageCard, ItemRow, ProgressBar),
// state by state: the item row, its name, its checkbox, the pill, the bar, the card border.
//
// Red-first. The API is named in PackageCardModelTests.swift. Until the builder adds it, this
// file does not compile, and the missing symbols are the only errors. Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

final class PackageCardTokensTests: XCTestCase {
    typealias Part = PackageCard.Part

    /// One element's token while the line is open, partial and done. nil is "no paint".
    struct Want {
        let whenOpen: String?, whenPartial: String?, whenDone: String?
        init(_ open: String?, _ partial: String?, _ done: String?) { (whenOpen, whenPartial, whenDone) = (open, partial, done) }
        init(all token: String) { self.init(token, token, token) }
        func of(_ state: LineState) -> String? {
            switch state {
            case .open: return whenOpen
            case .partial: return whenPartial
            case .done: return whenDone
            }
        }
    }

    static let states: [LineState] = [.open, .partial, .done]

    /// What each element paints with. Only these vary with the line: the card border (the package
    /// is done), the row wash, the item name, and the three parts of the checkbox.
    static let table: [Part: Want] = [
        .surface: Want(all: "card"),                    // the card is the raised parchment
        .border: Want("line", "line", "green"),         // green once every line is in
        .seller: Want(all: "ink"),
        .orderId: Want(all: "inkSoft"),
        .price: Want(all: "inkSoft"),
        .detail: Want(all: "inkSoft"),
        .rule: Want(all: "line"),                       // the rule above each item row
        .rowFill: Want(nil, nil, "greenSoft"),          // a checked row soaks in the wash; others stay clear
        .name: Want("ink", "ink", "inkSoft"),           // a done row's name goes soft
        .pillText: Want(all: "red"),
        .pillFill: Want(all: "redSoft"),
        .barTrack: Want(all: "silver"),
        .barFill: Want(all: "accent"),                  // accent while in progress; it is never drawn at 100%
        .boxBorder: Want("inkSoft", "manilaInk", "green"),
        .boxFill: Want("card", "manila", "green"),
        .boxMark: Want(nil, "manilaInk", "card"),       // a dash while partial, a tick when done, nothing when open
    ]

    // MARK: the table

    /// A new element must come with a row here, so no token goes unpinned.
    func testTheTableCoversEveryPart() {
        XCTAssertEqual(Set(Self.table.keys), Set(Part.allCases), "add a row for each part the card paints")
    }

    func testEveryElementUsesItsToken() {
        for (part, want) in Self.table {
            for state in Self.states {
                XCTAssertEqual(PackageCard.token(part, state), want.of(state), "\(part) while \(state)")
            }
        }
    }

    // MARK: the tokens exist

    /// Parchment.color(_:) stops the app on a name that is not in the file, so a typo must fail here.
    func testEveryTokenNameIsInTheSharedFile() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        for part in Part.allCases {
            for state in Self.states {
                guard let name = PackageCard.token(part, state) else { continue }
                XCTAssertNotNil(palette.tokens[name], "\(part) while \(state) names \(name), which shared/tokens.json lacks")
            }
        }
    }

    // MARK: contrast

    /// Every text pair the card paints clears 4.5:1 (palette-tokens-contrast-floor), and the bar's
    /// fill clears 3:1 on its track. inkSoft on greenSoft, a done row's name, is the thinnest at 4.51.
    func testEveryTextPairClearsTheFloor() throws {
        let palette = try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
        let t = { (part: Part, state: LineState) in PackageCard.token(part, state) }

        for state in Self.states {
            let row = t(.rowFill, state) ?? t(.surface, state)!
            for part in [Part.name, .price, .detail] {
                let r = try TokenContrast.ratio(t(part, state)!, on: row, palette)
                XCTAssertGreaterThanOrEqual(r, 4.5, "\(part) on the \(state) row (\(t(part, state)!) on \(row))")
            }
        }
        for part in [Part.seller, .orderId] {
            let r = try TokenContrast.ratio(t(part, .open)!, on: t(.surface, .open)!, palette)
            XCTAssertGreaterThanOrEqual(r, 4.5, "\(part) on the card")
        }
        let pill = try TokenContrast.ratio(t(.pillText, .open)!, on: t(.pillFill, .open)!, palette)
        XCTAssertGreaterThanOrEqual(pill, 4.5, "the pill's text on its fill")
        for state in [LineState.partial, .done] {
            let mark = try TokenContrast.ratio(t(.boxMark, state)!, on: t(.boxFill, state)!, palette)
            XCTAssertGreaterThanOrEqual(mark, 4.5, "the checkbox mark on its fill while \(state)")
        }
        let bar = try TokenContrast.ratio(t(.barFill, .open)!, on: t(.barTrack, .open)!, palette)
        XCTAssertGreaterThanOrEqual(bar, 3, "the bar's fill on its track")
    }
}
