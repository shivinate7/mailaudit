// Package card paint, the Swift side (lane N15, native-build-lanes, card-the-bar-is-out-of-flow,
// design-parchment-ledger, rules-run-in-javascriptcore).
//
// CI runs only `swift test`, and XCUITest cannot read a colour. So each text form and each colour
// meaning the card draws is a ManifestKit value with a test here, and the view only draws it.
// The text forms live in the rules bundle (PackageCardRulesTests, test/view-rules.test.mjs V17 to
// V19); the model stores what the bundle returns, the way it stores `labels` and `done`.
//
// Red-first. The builder adds the API below in native/ManifestKit/Sources. Until it exists this
// file does not compile, and the missing symbols are the only errors. Fake fixtures only.
//
// Contract the tests name:
//   public enum LineState: Equatable, Sendable {
//       case open, partial, done
//       /// done when got >= qty (the bundle's isDone), partial when 0 < got < qty, else open.
//       public init(got: Int, qty: Int)
//   }
//   public enum PackageCard {
//       public enum Part: CaseIterable, Hashable, Sendable {
//           case surface, border, seller, orderId, price, detail, rule, rowFill, name,
//                pillText, pillFill, barTrack, barFill, boxBorder, boxFill, boxMark
//       }
//       /// The name of a key in shared/tokens.json, or nil for "no paint". `state` is the line's;
//       /// for .border it is the package's, and .done means every line is in.
//       public static func token(_ part: Part, _ state: LineState) -> String?
//       /// "$" + price.toFixed(2) as the web item row prints it: no thousands separator.
//       public static func priceText(_ price: Double) -> String
//   }
//   PackagesModel gains four stored properties, filled by load() and refreshed for one package
//   by checkIn(key:count:), with no second load():
//       public private(set) var pills: [String: String]    // gk -> bundle packagePill; no entry when null
//       public private(set) var bars: [String: Double]     // gk -> got / total; an entry only while 0 < got < total
//       public private(set) var details: [String: String]  // item key -> bundle itemDetail
//       public private(set) var orderLinks: [String: URL]  // gk -> bundle tcgplayerOrderUrl(orderId)
//   `got` and `total` come from the bundle's totalsOf, so an over-count is clamped per line.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PackageCardModelTests: XCTestCase {
    static let a1 = "A1::Alpha Cards", b1 = "B1::Beta Games", c1 = "C1::Gamma Cards", d1 = "D1::Delta Cards"
    // A1 holds Lightning Bolt 1 x $1, Counterspell 1 x $2, Brainstorm 2 x $0.50: four copies, $4.00.
    static let bolt = "A1|0|pLightningBolt", counter = "A1|1|pCounterspell", brain = "A1|2|pBrainstorm"
    static let urza = "D1|0|pUrzasSaga"  // the only line of D1: one copy, $50
    static let dot = "\u{00B7}"
    static let orders = "https://store.tcgplayer.com/myaccount/orderhistory?SearchString="

    // MARK: helpers

    func freshLedgerURL() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n15-card-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "ledger.json")
        try FileManager.default.copyItem(
            at: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"), to: url)
        return url
    }

    func loadedModel(rules: URL = RulesGoldenTests.bundleURL) async throws -> PackagesModel {
        let store = LedgerStore(fileURL: try freshLedgerURL(), now: { 1_786_543_380_000 })
        try store.load()
        let model = PackagesModel(engine: try RulesEngine(bundleURL: rules), store: store)
        try await model.load()
        return model
    }

    /// The real rules.js with some exports replaced, so a model that formats in Swift cannot pass.
    /// Object.assign copies the exports' getters into a plain object, which the call glue then reads.
    func shimBundle(_ overrides: String) throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n15-shim-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "rules.js")
        try (real + "\n;var Rules = Object.assign({}, Rules, {\(overrides)});\n").write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    func pill(_ count: Int, _ money: String) -> String { "\(count) left \(Self.dot) \(money)" }

    // MARK: pills

    /// Each package's pill is the bundle's packagePill for its lines at the stored counts.
    func testPillsAtRestAreTheBundlesText() async throws {
        let m = try await loadedModel()
        XCTAssertEqual(m.pills[Self.a1], pill(4, "$4.00"))
        XCTAssertEqual(m.pills[Self.b1], pill(4, "$4.00"))
        XCTAssertEqual(m.pills[Self.c1], pill(5, "$9.50"))
        XCTAssertEqual(m.pills[Self.d1], pill(1, "$50.00"))
        XCTAssertEqual(Set(m.pills.keys), Set(m.rows.map(\.gk)), "every package owes something at rest, so every package has a pill")
    }

    /// A check-in refreshes that package's pill, with no reload, and no other package's.
    func testACheckInRefreshesOnlyThatPackagesPill() async throws {
        let m = try await loadedModel()
        try await m.checkIn(key: Self.counter, count: 1)
        XCTAssertEqual(m.pills[Self.a1], pill(3, "$2.00"), "the $2 line is in: 3 copies left")
        try await m.checkIn(key: Self.brain, count: 1)
        XCTAssertEqual(m.pills[Self.a1], pill(2, "$1.50"), "one of two Brainstorm in: one copy fewer, 50 cents less")
        XCTAssertEqual(m.pills[Self.b1], pill(4, "$4.00"), "another package's pill must not move")
        XCTAssertEqual(m.pills[Self.c1], pill(5, "$9.50"))
        try await m.checkIn(key: Self.counter, count: 0)
        XCTAssertEqual(m.pills[Self.a1], pill(3, "$3.50"), "un-checking puts the copy and its price back")
    }

    /// A package with every copy in has no pill. The web shows RECEIVED, and "0 left" is never printed.
    func testACompletePackageHasNoPill() async throws {
        let m = try await loadedModel()
        try await m.checkIn(key: Self.bolt, count: 1)
        try await m.checkIn(key: Self.counter, count: 1)
        try await m.checkIn(key: Self.brain, count: 2)
        XCTAssertNil(m.pills[Self.a1], "A1 is complete: no pill, not \(m.pills[Self.a1] ?? "")")
        XCTAssertNotNil(m.pills[Self.b1], "an untouched package keeps its pill")
    }

    /// An over-count (5 of 2) clamps per line in the bundle: it must not hide the copies other lines owe.
    func testAnOverCountClampsInThePill() async throws {
        let m = try await loadedModel()
        try await m.checkIn(key: Self.brain, count: 5)
        XCTAssertEqual(m.pills[Self.a1], pill(2, "$3.00"))
    }

    // MARK: bars

    /// The bar shows while 0 < got < total and not at either end: it never survives completion,
    /// because the gild marks that (card-the-bar-is-out-of-flow).
    func testTheBarShowsOnlyWhileSomeButNotAllCopiesAreIn() async throws {
        let m = try await loadedModel()
        for gk in [Self.a1, Self.b1, Self.c1, Self.d1] { XCTAssertNil(m.bars[gk], "\(gk) has nothing in: no bar") }

        let steps: [(String, Int, Double?)] = [
            (Self.counter, 1, 0.25),   // 1 of 4
            (Self.brain, 1, 0.5),      // 2 of 4: a partial line counts its copies
            (Self.bolt, 1, 0.75),
            (Self.brain, 2, nil),      // 4 of 4: complete, so no bar at 100%
            (Self.counter, 0, 0.75),   // un-checking a complete package brings the bar back: 3 of 4
        ]
        for (key, count, want) in steps {
            try await m.checkIn(key: key, count: count)
            if let want {
                XCTAssertEqual(try XCTUnwrap(m.bars[Self.a1], "bar missing after \(key)=\(count)"), want, accuracy: 1e-9)
            } else {
                XCTAssertNil(m.bars[Self.a1], "a complete package must have no bar")
            }
        }
        for key in [Self.bolt, Self.brain] { try await m.checkIn(key: key, count: 0) }
        XCTAssertNil(m.bars[Self.a1], "everything un-checked: no bar")
        XCTAssertNil(m.bars[Self.b1], "another package's bar must not appear")
    }

    /// A one-line package goes from no bar to complete, so it never shows a bar.
    func testASingleLinePackageNeverShowsABar() async throws {
        let m = try await loadedModel()
        try await m.checkIn(key: Self.counter, count: 1)
        XCTAssertNotNil(m.bars[Self.a1], "control: a bar that never fills would pass the nil checks below")
        try await m.checkIn(key: Self.urza, count: 1)
        XCTAssertNil(m.bars[Self.d1], "1 of 1 is complete: no bar")
        XCTAssertNil(m.pills[Self.d1])
    }

    /// Fractions are copies, not lines, and an over-count is clamped line by line.
    func testBarFractionsCountCopiesAndClampOverCounts() async throws {
        let m = try await loadedModel()
        try await m.checkIn(key: Self.brain, count: 5)
        XCTAssertEqual(try XCTUnwrap(m.bars[Self.a1]), 0.5, accuracy: 1e-9, "5 of 2 counts as 2 of the 4 copies")
        try await m.checkIn(key: "C1|0|pLightningBolt", count: 1)
        try await m.checkIn(key: "C1|1|pPathtoExile", count: 1)
        XCTAssertEqual(try XCTUnwrap(m.bars[Self.c1]), 0.4, accuracy: 1e-9, "2 of 5 copies")
    }

    // MARK: details and links

    func testDetailLinesAndOrderLinksAreTheBundlesText() async throws {
        let m = try await loadedModel()
        XCTAssertEqual(m.details[Self.bolt], "Test Set \(Self.dot) Near Mint")
        XCTAssertEqual(m.details[Self.brain], "\u{00D7}2 \(Self.dot) Test Set \(Self.dot) Near Mint")
        XCTAssertEqual(m.details.count, 12, "one detail line per ledger item")
        XCTAssertEqual(m.orderLinks[Self.a1]?.absoluteString, Self.orders + "A1")
        XCTAssertEqual(m.orderLinks[Self.d1]?.absoluteString, Self.orders + "D1")
        XCTAssertEqual(Set(m.orderLinks.keys), Set(m.rows.map(\.gk)), "every package has an order link")
    }

    // MARK: through the bundle

    /// The pill, the detail line and the link are read from the bundle, with the package's own lines
    /// and the live counts. A model that formats them in Swift would not print these.
    func testPillDetailAndLinkAreReadFromTheBundle() async throws {
        let shim = try shimBundle("""
            packagePill: function (items, received) {
              return "PILL " + items.length + "/" + items.reduce(function (s, i) { return s + (received[i.key] || 0); }, 0);
            },
            itemDetail: function (item) { return "DETAIL " + item.key; },
            tcgplayerOrderUrl: function (id) { return "https://shim.test/" + id; }
            """)
        // positive control: the shim loads, the override is live, and the rest of the bundle is intact
        let probe = try RulesEngine(bundleURL: shim)
        let controlPill = try await probe.call("packagePill", "[[],{}]")
        XCTAssertEqual(controlPill, "\"PILL 0/0\"", "the shim's override must be live, or this test proves nothing")
        let controlRest = try await probe.call("outstandingOf", "[[],{}]")
        XCTAssertEqual(controlRest, "{\"left\":0,\"value\":0}", "the shim must leave the other exports alone")

        let m = try await loadedModel(rules: shim)
        XCTAssertEqual(m.pills[Self.a1], "PILL 3/0", "the package's three lines, nothing in")
        XCTAssertEqual(m.pills[Self.d1], "PILL 1/0")
        XCTAssertEqual(m.details[Self.brain], "DETAIL \(Self.brain)")
        XCTAssertEqual(m.orderLinks[Self.a1]?.absoluteString, "https://shim.test/A1", "the link takes the order id")

        try await m.checkIn(key: Self.brain, count: 2)
        XCTAssertEqual(m.pills[Self.a1], "PILL 3/2", "a check-in re-asks the bundle with the new counts")
    }

    // MARK: line state

    func testLineStateOpenPartialDone() {
        let cases: [(Int, Int, LineState)] = [
            (0, 1, .open), (1, 1, .done), (0, 2, .open), (1, 2, .partial), (2, 2, .done), (3, 2, .done), (1, 4, .partial),
        ]
        for (got, qty, want) in cases {
            XCTAssertEqual(LineState(got: got, qty: qty), want, "got \(got) of \(qty)")
        }
    }

    /// The checkbox and the ✓ glyph must agree: "done" is the bundle's isDone, not a second reading of it.
    func testLineStateDoneAgreesWithTheBundlesIsDone() async throws {
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        for qty in 1...3 {
            for got in 0...5 {
                let isDone = try await engine.call("isDone", "[\(got),\(qty)]") == "true"
                XCTAssertEqual(LineState(got: got, qty: qty) == .done, isDone, "got \(got) of \(qty)")
            }
        }
    }

    // MARK: price text

    /// The web item row prints price.toFixed(2): a thousand is "$1000.00", where the bundle's money() gives "$1,000.00".
    func testPriceTextIsTheWebsToFixed() {
        let cases: [(Double, String)] = [
            (0, "$0.00"), (0.5, "$0.50"), (0.75, "$0.75"), (50, "$50.00"), (1000, "$1000.00"), (1234.5, "$1234.50"),
        ]
        for (price, want) in cases { XCTAssertEqual(PackageCard.priceText(price), want, "price \(price)") }
    }

    // MARK: the stepper

    /// The clamp at both ends on Brainstorm (qty 2), and the readout after each step. TallyModelTests walks the same
    /// sequence on TallyModel (StepperSupport.swift). A one-unit line has no readout.
    func testStepClampsAtZeroAndAtQty() async throws {
        let m = try await loadedModel()
        XCTAssertNil(m.readouts[Self.bolt], "a one-unit line has no readout")
        await assertStepperClamps(m, key: Self.brain)
    }

    func testStepFromAnOverCountStartsFromTheClampedFigure() async throws {
        try await assertStepFromAnOverCount(try await loadedModel(), key: Self.brain)
    }

    /// gotQty put in a marker form. The readout must follow it, as the web's stepper prints the bundle's text.
    func testReadoutComesFromTheBundleGotQty() async throws {
        await assertReadoutComesFromTheBundle(try await loadedModel(rules: try shimBundle(gotQtyShim)), key: Self.brain)
    }
}
