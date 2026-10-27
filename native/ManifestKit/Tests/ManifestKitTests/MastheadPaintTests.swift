// Lane N14, masthead paint (native-masthead-system-style, masthead-is-one-letterhead,
// palette-gold-is-ornament-only, progress-bar-accent-then-green, typography-cochin-and-mono,
// masthead-tallies-unequal-thirds, masthead-save-slot-reserved).
//
// CI runs `swift test` only, and XCUITest cannot read a colour. So each colour meaning the
// masthead shows is a pure value in ManifestKit, tested here, and the view reads it. Values are
// token NAMES (keys of shared/tokens.json), never Colors, so the package stays Foundation-only.
// What no test here proves: that the view calls these values, and the seal's outline. The
// screenshots at 320 and 375 prove those.
//
// Red-first. The builder adds this in native/ManifestKit/Sources/ManifestKit/:
//
//   public enum MastheadPaint {
//       public enum Face: Equatable, Sendable { case cochin, mono }
//       public struct Style: Equatable, Sendable {
//           public let token: String     // key in shared/tokens.json
//           public let face: Face
//           public let uppercase: Bool   // the web sets text-transform: uppercase
//           public let tracking: Double  // letter-spacing in em; 0 for none
//           public let bold: Bool        // font-weight 700
//       }
//       public enum Role {
//           case title, house, tallyLabel, tallyLead, tallyRest, count
//           case missing(remaining: Int)   // the "N still missing" line, or ALL ACCOUNTED FOR at 0
//           case slot(SaveIndicator)       // the save slot
//       }
//       public static func style(_ role: Role) -> Style
//       public static func barToken(percent: Double) -> String   // the bar's fill; percent is 0...100
//       public static let rule: String         // the two rules beside the seal
//       public static let divider: String      // the hairline over the tallies and the two cell dividers
//       public static let barTrack: String     // the empty part of the bar
//       public struct SealLayer: Equatable, Sendable {
//           public let name: String        // "body", "ring", "cut", "raised", "shine"
//           public let tokens: [String]    // body: gradient stops light to deep, evenly spaced; others: one token
//           public let opacity: Double
//       }
//       public static let seal: [SealLayer]    // in paint order
//       public static let tallyWeights: [Double]   // cards, packages, value (replaces Thirds.weights in the app)
//   }
//   extension TallyCell {
//       public var lead: String   // "1" or "$54.47k": drawn in accent. figure up to the first "/"
//       public var rest: String   // "/14" or "/$68.16k": drawn in inkSoft. figure from the first "/"
//   }
//   MastheadModel gains
//       public private(set) var percent: Double    // got / total * 100, 0 when there are no cards
//       public private(set) var remaining: Int     // cards still out; the number the missing line prints
//
// Until these exist this file does not compile, and the missing symbols are the only errors.
// The web values are hard-coded here on purpose, from src/app.jsx: `Seal` (stop colours and
// opacities), `.mdl-rule i`, `.mdl-title`, `.mdl-house`, `.mdl-k`, `.mdl-fig`, `.mdl-foot`,
// `.mdl-thirds`, `ProgressBar` and the missing span. The source is not scanned.
//
// Green on paper measures 4.29:1, under the 4.5 floor, for the all-accounted line. The web
// prints the same pair, so no contrast test is written here (palette-contrast).
//
// Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

final class MastheadPaintTests: XCTestCase {
    /// The token names of shared/tokens.json, read by the code under test's own decoder.
    static let fileTokens: Set<String> = {
        guard let data = try? Data(contentsOf: PaletteTests.tokensURL), let palette = try? Palette.decode(data) else { return [] }
        return Set(palette.tokens.keys)
    }()

    /// Every text role in every state, named for the failure message.
    static var roles: [(String, MastheadPaint.Role)] {
        [("title", .title), ("house", .house), ("tallyLabel", .tallyLabel), ("tallyLead", .tallyLead),
         ("tallyRest", .tallyRest), ("count", .count),
         ("missing 457", .missing(remaining: 457)), ("missing 1", .missing(remaining: 1)), ("missing 0", .missing(remaining: 0))]
            + SaveIndicator.allCases.map { ("slot \($0)", MastheadPaint.Role.slot($0)) }
    }

    /// Every token name the masthead can paint with.
    static var named: [(String, String)] {
        roles.map { ($0.0, MastheadPaint.style($0.1).token) }
            + [("rule", MastheadPaint.rule), ("divider", MastheadPaint.divider), ("barTrack", MastheadPaint.barTrack)]
            + [0.0, 50, 99, 100].map { ("bar \($0)", MastheadPaint.barToken(percent: $0)) }
            + MastheadPaint.seal.flatMap { layer in layer.tokens.map { ("seal \(layer.name)", $0) } }
    }

    // MARK: the table names real tokens

    /// The premise: the token file reads. An empty set would let every check below pass or fail for nothing.
    func testThePremiseTheTokenFileReads() {
        XCTAssertTrue(Self.fileTokens.contains("gold") && Self.fileTokens.contains("wax"), "shared/tokens.json did not decode")
    }

    /// `Parchment.color` stops the app on a token that is not in the file, so a typo here is a crash at launch.
    func testEveryNamedTokenIsInTheTokenFile() {
        for (what, token) in Self.named {
            XCTAssertTrue(Self.fileTokens.contains(token), "\(what) names \(token), which shared/tokens.json does not hold")
        }
    }

    // MARK: gold is ornament only (palette-gold-is-ornament-only)

    func testGoldIsTheRulesAndNothingElse() {
        XCTAssertEqual(MastheadPaint.rule, "gold", "the two rules beside the seal are gold")
        for (what, token) in Self.named where what != "rule" {
            XCTAssertNotEqual(token, "gold", "\(what) is painted gold, which fails the contrast floor for anything but an ornament")
        }
    }

    // MARK: the letterhead type (typography-cochin-and-mono)

    func testTitleIsSpacedCochinCapitalsInInk() {
        let s = MastheadPaint.style(.title)
        XCTAssertEqual(s.face, .cochin, "MANIFEST is set in Cochin")
        XCTAssertTrue(s.uppercase, "MANIFEST is capitals")
        XCTAssertEqual(s.tracking, 0.22, accuracy: 1e-9, ".mdl-title letter-spacing is .22em")
        XCTAssertEqual(s.token, "ink", "the title inherits the root text colour")
        XCTAssertFalse(s.bold, ".mdl-title is weight 400")
    }

    func testHouseLineIsLetterspacedMonoCapitalsInInkSoft() {
        let s = MastheadPaint.style(.house)
        XCTAssertEqual(s.face, .mono)
        XCTAssertTrue(s.uppercase, "C.H POSTAL COMPANY is capitals")
        XCTAssertEqual(s.tracking, 0.26, accuracy: 1e-9, ".mdl-house letter-spacing is .26em")
        XCTAssertEqual(s.token, "inkSoft")
    }

    // MARK: the ruled tallies (masthead-tallies-unequal-thirds)

    func testTallyLabelsAreSpacedMonoCapitalsInInkSoft() {
        let s = MastheadPaint.style(.tallyLabel)
        XCTAssertEqual(s.face, .mono)
        XCTAssertTrue(s.uppercase, "CARDS, PACKAGES and VALUE are capitals")
        XCTAssertEqual(s.tracking, 0.16, accuracy: 1e-9, ".mdl-k letter-spacing is .16em")
        XCTAssertEqual(s.token, "inkSoft")
    }

    /// The got figure is accent and bold, the "/total" is inkSoft and plain, both in mono with no spacing.
    func testTallyFigureIsAccentBoldOverSoftRest() {
        let lead = MastheadPaint.style(.tallyLead)
        let rest = MastheadPaint.style(.tallyRest)
        XCTAssertEqual(lead.token, "accent")
        XCTAssertTrue(lead.bold, ".mdl-fig b is weight 700")
        XCTAssertEqual(rest.token, "inkSoft")
        XCTAssertFalse(rest.bold)
        for (name, s) in [("lead", lead), ("rest", rest)] {
            XCTAssertEqual(s.face, .mono, "\(name): numbers are set in mono")
            XCTAssertFalse(s.uppercase, name)
            XCTAssertEqual(s.tracking, 0, accuracy: 1e-9, "\(name): digits are not letterspaced")
        }
    }

    func testDividerAndBarTrackTokens() {
        XCTAssertEqual(MastheadPaint.divider, "line", "the tally hairline and the cell dividers are line")
        XCTAssertEqual(MastheadPaint.barTrack, "silver", "the empty half of the bar is silver")
    }

    /// 1 : 1 : 1.7, and not three equal cells. The value cell is the only one that needs room.
    func testTallyWeightsAreOneOneAndOneSeven() {
        XCTAssertEqual(MastheadPaint.tallyWeights, [1, 1, 1.7])
    }

    // MARK: the foot (masthead-save-slot-reserved)

    func testCountLineIsSoftMono() {
        let s = MastheadPaint.style(.count)
        XCTAssertEqual(s.token, "inkSoft")
        XCTAssertEqual(s.face, .mono)
        XCTAssertFalse(s.bold)
        XCTAssertFalse(s.uppercase, "\"N packages \u{00B7} autosaves\" stays lower case")
    }

    /// Red while cards are out, green once every card is in. Bold mono either way.
    func testMissingLineIsRedWhileCardsAreOutAndGreenAtZero() {
        for n in [457, 1] {
            XCTAssertEqual(MastheadPaint.style(.missing(remaining: n)).token, "red", "\(n) still missing")
        }
        XCTAssertEqual(MastheadPaint.style(.missing(remaining: 0)).token, "green", "ALL ACCOUNTED FOR")
        for n in [457, 0] {
            let s = MastheadPaint.style(.missing(remaining: n))
            XCTAssertTrue(s.bold, "the missing line is weight 700 at \(n)")
            XCTAssertEqual(s.face, .mono)
            XCTAssertFalse(s.uppercase)
        }
    }

    /// The slot is red for a failed save and the foot's inkSoft for every other state. Saved is not green.
    func testSaveSlotIsRedOnlyWhenFailed() {
        for state in SaveIndicator.allCases {
            let s = MastheadPaint.style(.slot(state))
            XCTAssertEqual(s.token, state == .failed ? "red" : "inkSoft", "slot \(state)")
            XCTAssertEqual(s.face, .mono, "slot \(state)")
            XCTAssertFalse(s.bold, "slot \(state)")
        }
    }

    // MARK: the bar (progress-bar-accent-then-green)

    func testBarIsAccentBelowAHundredAndGreenFromAHundred() {
        let table: [(Double, String)] = [
            (0, "accent"), (1, "accent"), (50, "accent"), (99, "accent"), (99.99, "accent"), (99.999_999, "accent"),
            (100, "green"), (100.5, "green"),
        ]
        for (percent, token) in table {
            XCTAssertEqual(MastheadPaint.barToken(percent: percent), token, "\(percent)%")
        }
    }

    // MARK: the seal (src/app.jsx Seal)

    /// Five layers in paint order. The body is the light-to-deep wax ramp, the relief sits on it, and
    /// the specular catch is the card colour.
    func testSealIsPaintedFromTheWaxTokens() {
        let want: [(String, [String], Double)] = [
            ("body", ["waxLit", "wax", "waxDeep"], 1), ("ring", ["waxDeep"], 0.6), ("cut", ["waxCut"], 0.78),
            ("raised", ["waxRaised"], 0.5), ("shine", ["card"], 0.22),
        ]
        XCTAssertEqual(MastheadPaint.seal.map(\.name), want.map(\.0), "layer names, in paint order")
        XCTAssertEqual(MastheadPaint.seal.map(\.tokens), want.map(\.1), "layer tokens")
        XCTAssertEqual(MastheadPaint.seal.count, want.count)
        for (layer, w) in zip(MastheadPaint.seal, want) {
            XCTAssertEqual(layer.opacity, w.2, accuracy: 1e-9, "\(layer.name) opacity")
        }
    }

    /// All five wax tokens are used and no other family is: not red, not gold, not accent.
    func testSealUsesEveryWaxTokenAndNoColourFromAnotherFamily() {
        let used = Set(MastheadPaint.seal.flatMap(\.tokens))
        let wax = Self.fileTokens.filter { $0.hasPrefix("wax") }
        XCTAssertEqual(wax.count, 5, "the premise: the file holds five wax tokens")
        XCTAssertEqual(used.filter { $0.hasPrefix("wax") }, wax, "the seal leaves a wax token unused")
        XCTAssertEqual(used.subtracting(wax), ["card"], "the seal paints with a token outside the wax ramp")
    }

    // MARK: a cell splits at the slash

    func testACellSplitsItsFigureIntoLeadAndRest() {
        let table: [(String, String, String)] = [
            ("1/14", "1", "/14"), ("0/4", "0", "/4"), ("$54.47k/$68.16k", "$54.47k", "/$68.16k"), ("$0/$68", "$0", "/$68"),
        ]
        for (figure, lead, rest) in table {
            let cell = TallyCell(label: "x", figure: figure)
            XCTAssertEqual(cell.lead, lead, figure)
            XCTAssertEqual(cell.rest, rest, figure)
            XCTAssertEqual(cell.lead + cell.rest, figure, "the two parts must rebuild the figure")
        }
    }
}

// MARK: the model feeds the bar and the missing line

@MainActor
final class MastheadPaintModelTests: XCTestCase {
    private func opened(_ obj: [String: Any]) throws -> (MastheadModel, LedgerStore) {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n14-paint-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "ledger.json")
        try JSONSerialization.data(withJSONObject: obj).write(to: url)
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        try store.load()
        return (MastheadModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: store), store)
    }

    private func fixture() throws -> (MastheadModel, LedgerStore) {
        let json = try Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"))
        return try opened(try XCTUnwrap(JSONSerialization.jsonObject(with: json) as? [String: Any]))
    }

    private func hundredCards() throws -> (MastheadModel, LedgerStore) {
        let items: [[String: Any]] = (0..<100).map { i in
            ["key": "O\(i)|0|p\(i)", "orderId": "O\(i)", "seller": "Seller \(i)", "name": "Card \(i)", "set": "Test Set",
             "condition": "Near Mint", "finish": "", "qty": 1, "price": 1.0, "date": "2026-07-01",
             "tracking": "with tracking", "line": "Magic"]
        }
        return try opened(["mailday": 1, "items": items])
    }

    /// The fixture has 14 cards. Nothing in is 0, one in is 100/14, all in is 100.
    func testPercentAndRemainingFollowTheCheckIns() async throws {
        let (m, store) = try fixture()
        try await m.refresh()
        XCTAssertEqual(m.percent, 0, accuracy: 1e-9)
        XCTAssertEqual(m.remaining, 14)

        try store.commitReceived("A1|0|pLightningBolt", count: 1)
        try await m.refresh()
        XCTAssertEqual(m.percent, 100.0 / 14.0, accuracy: 1e-9)
        XCTAssertEqual(m.remaining, 13)

        for it in store.items() {
            try store.commitReceived(try XCTUnwrap(it["key"] as? String), count: try XCTUnwrap(it["qty"] as? Int))
        }
        try await m.refresh()
        XCTAssertGreaterThanOrEqual(m.percent, 100, "every card in must reach the green branch of the bar")
        XCTAssertEqual(m.remaining, 0)
    }

    /// 99 of 100 cards in is still accent and red. The hundredth turns the bar and the line green.
    func testNinetyNineOfAHundredIsAccentAndRedAndAHundredIsGreen() async throws {
        let (m, store) = try hundredCards()
        for i in 0..<99 { try store.commitReceived("O\(i)|0|p\(i)", count: 1) }
        try await m.refresh()
        XCTAssertEqual(m.percent, 99, accuracy: 1e-9)
        XCTAssertEqual(m.remaining, 1)
        XCTAssertEqual(MastheadPaint.barToken(percent: m.percent), "accent", "99 of 100 cards")
        XCTAssertEqual(MastheadPaint.style(.missing(remaining: m.remaining)).token, "red", "99 of 100 cards")

        try store.commitReceived("O99|0|p99", count: 1)
        try await m.refresh()
        XCTAssertEqual(MastheadPaint.barToken(percent: m.percent), "green", "100 of 100 cards")
        XCTAssertEqual(MastheadPaint.style(.missing(remaining: m.remaining)).token, "green", "100 of 100 cards")
    }

    /// No cards at all: the bar is empty and nothing is missing. (The view shows no tallies then.)
    func testAnEmptyLedgerHasZeroPercentAndNothingRemaining() async throws {
        let (m, _) = try opened(["mailday": 1, "items": [Any]()])
        try await m.refresh()
        XCTAssertEqual(m.percent, 0, accuracy: 1e-9)
        XCTAssertEqual(m.remaining, 0)
    }

    /// Each cell's lead and rest rebuild its figure, on the real model's cells.
    func testTheModelsCellsSplitAndRebuild() async throws {
        let (m, store) = try fixture()
        try store.commitReceived("A1|0|pLightningBolt", count: 1)
        try await m.refresh()

        XCTAssertEqual(m.cells.map(\.lead), ["1", "0", "$1"])
        XCTAssertEqual(m.cells.map(\.rest), ["/14", "/4", "/$68"])
        for cell in m.cells {
            XCTAssertEqual(cell.lead + cell.rest, cell.figure, cell.label)
        }
    }
}
