// Masthead model tests (lane N8, native-build-lanes, masthead-is-one-letterhead,
// masthead-tallies-unequal-thirds, rules-run-in-javascriptcore, the-token-is-a-credential).
//
// The masthead shows three tallies, a count line and the exact outstanding line. Every
// figure comes from the rules bundle (totalsOf, groupPackages, packagesDone and compact),
// so the Swift client holds no copy of a view rule.
//
// Red-first. The builder adds this in native/ManifestKit/Sources/ManifestKit/:
//   public struct TallyCell: Equatable, Sendable {
//       public let label: String     // "cards", "packages", "value"
//       public let figure: String    // "got/total": "1/14", "0/4", "$1/$68"
//       public init(label: String, figure: String)
//   }
//   @MainActor @Observable public final class MastheadModel {
//       public init(engine: RulesEngine, store: LedgerStore)   // holds NO KeyStore
//       public private(set) var cells: [TallyCell]   // [] when the ledger has no items, else cards, packages, value
//       public private(set) var countLine: String    // "4 packages \u{00B7} autosaves"; "" when there are no items
//       public private(set) var missingLine: String  // "14 still missing \u{00B7} $67.50" or "ALL ACCOUNTED FOR \u{2713}"; "" when there are no items
//       public func refresh() async throws           // re-reads the store: the rules totalsOf, groupPackages, packagesDone, compact
//   }
// and Rules.compact in the rules bundle (src/view-rules.mjs, then `npm run build`), moved out of
// src/app.jsx so the web and the native client share one home. test/view-rules.test.mjs V15 pins
// the same rule in Node.
// Until these exist this file does not compile. The stub the builder starts from returns wrong
// values, so each case fails on an XCTAssert and not on a compile error
// (testing-throwing-assert-bad-kill).
//
// Web behaviour matched: the value tally is compacted (masthead-tallies-unequal-thirds), the
// outstanding line is exact money with cents and thousands separators, and an empty ledger
// shows no tallies (src/app.jsx renders the block only when items.length > 0). The web count
// line also varies by view (envelopes waiting, unique items); only the Packages one is pinned.
//
// Fake fixtures only. FakeKeychain stands in for the Keychain.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class MastheadModelTests: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"
    static let dot = "\u{00B7}"
    static let allIn = "ALL ACCOUNTED FOR \u{2713}"

    // MARK: helpers

    func freshDir() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n8-masthead-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    /// A ledger file from a JSON object, in a fresh folder.
    func ledger(_ obj: [String: Any]) throws -> URL {
        let url = try freshDir().appending(path: "ledger.json")
        try JSONSerialization.data(withJSONObject: obj).write(to: url)
        return url
    }

    func fixtureURL() throws -> URL {
        let url = try freshDir().appending(path: "ledger.json")
        try FileManager.default.copyItem(at: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"), to: url)
        return url
    }

    func item(_ key: String, order: String, price: Double, qty: Int = 1) -> [String: Any] {
        ["key": key, "orderId": order, "seller": "Seller \(order)", "name": "Card \(key)", "set": "Test Set",
         "condition": "Near Mint", "finish": "", "qty": qty, "price": price, "date": "2026-07-01",
         "tracking": "with tracking", "line": "Magic"]
    }

    func engine() throws -> RulesEngine { try RulesEngine(bundleURL: RulesGoldenTests.bundleURL) }

    func opened(_ url: URL) async throws -> (MastheadModel, LedgerStore) {
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        try store.load()
        let model = MastheadModel(engine: try engine(), store: store)
        try await model.refresh()
        return (model, store)
    }

    func figures(_ m: MastheadModel) -> [String] { m.cells.map(\.figure) }

    // MARK: the three tallies on the shared fixture (14 cards, 4 packages, $67.50)

    /// Nothing in: 0 of 14 cards, 0 of 4 packages, $0 of the compacted $68.
    func testNothingInOnTheFixture() async throws {
        let (m, _) = try await opened(try fixtureURL())

        XCTAssertEqual(m.cells, [
            TallyCell(label: "cards", figure: "0/14"),
            TallyCell(label: "packages", figure: "0/4"),
            TallyCell(label: "value", figure: "$0/$68"),
        ])
        XCTAssertEqual(m.countLine, "4 packages \(Self.dot) autosaves")
        XCTAssertEqual(m.missingLine, "14 still missing \(Self.dot) $67.50")
    }

    /// One line in: the cards and the value move, the package count does not.
    func testOneLineInMovesCardsAndValueNotPackages() async throws {
        let (m, store) = try await opened(try fixtureURL())
        try store.commitReceived("A1|0|pLightningBolt", count: 1)
        try await m.refresh()

        XCTAssertEqual(figures(m), ["1/14", "0/4", "$1/$68"])
        XCTAssertEqual(m.missingLine, "13 still missing \(Self.dot) $66.50")
    }

    /// A whole package in (1 + 1 + 2 cards, $4): the package count moves.
    func testAWholePackageMovesThePackageCount() async throws {
        let (m, store) = try await opened(try fixtureURL())
        try store.commitReceived("A1|0|pLightningBolt", count: 1)
        try store.commitReceived("A1|1|pCounterspell", count: 1)
        try store.commitReceived("A1|2|pBrainstorm", count: 2)
        try await m.refresh()

        XCTAssertEqual(figures(m), ["4/14", "1/4", "$4/$68"])
        XCTAssertEqual(m.missingLine, "10 still missing \(Self.dot) $63.50")
    }

    /// Everything in: every tally is full and the outstanding line says so.
    func testEverythingInSaysAllAccountedFor() async throws {
        let (m, store) = try await opened(try fixtureURL())
        for it in store.items() {
            try store.commitReceived(try XCTUnwrap(it["key"] as? String), count: try XCTUnwrap(it["qty"] as? Int))
        }
        try await m.refresh()

        XCTAssertEqual(figures(m), ["14/14", "4/4", "$68/$68"])
        XCTAssertEqual(m.missingLine, Self.allIn)
        XCTAssertEqual(m.countLine, "4 packages \(Self.dot) autosaves")
    }

    /// The package tally counts the packages the Packages view shows.
    func testPackageTallyEqualsThePackagesViewRows() async throws {
        let url = try fixtureURL()
        let (m, store) = try await opened(url)
        let packages = PackagesModel(engine: try engine(), store: store)
        try await packages.load()

        XCTAssertEqual(m.cells.map(\.label), ["cards", "packages", "value"])
        XCTAssertEqual(m.cells[1].figure, "0/\(packages.rows.count)")
    }

    // MARK: an empty ledger shows no tallies

    func testEmptyLedgerShowsNoTalliesAndNoLines() async throws {
        let (m, _) = try await opened(try ledger(["mailday": 1, "items": [Any]()]))

        XCTAssertEqual(m.cells, [], "an empty ledger shows no tally cells")
        XCTAssertEqual(m.countLine, "")
        XCTAssertEqual(m.missingLine, "")
    }

    // MARK: compact for the value tally, exact money for the outstanding line

    /// The value tally compacts. The outstanding line keeps cents and a thousands separator.
    func testValueIsCompactedAndTheMissingLineIsExact() async throws {
        let items = [item("X1|0|pBig", order: "X1", price: 100_240), item("Y1|0|pRest", order: "Y1", price: 18_360)]
        let url = try ledger(["mailday": 1, "items": items])
        let (m, store) = try await opened(url)
        try store.commitReceived("X1|0|pBig", count: 1)
        try await m.refresh()

        XCTAssertEqual(figures(m), ["1/2", "1/2", "$100.24k/$118.6k"])
        XCTAssertEqual(m.missingLine, "1 still missing \(Self.dot) $18,360.00")
    }

    /// The compact rule lives in the bundle, one home for both clients. Whole dollars under 1k,
    /// then k or M with at most two decimals and trailing zeros trimmed.
    func testCompactIsARuleInTheBundle() async throws {
        let rules = try engine()
        let table: [(String, String)] = [
            ("0", "0"), ("27", "27"), ("101.4", "101"), ("67.5", "68"), ("4000", "4k"),
            ("63450", "63.45k"), ("118600", "118.6k"), ("100240", "100.24k"), ("1200000", "1.2M"),
        ]
        for (input, expected) in table {
            let out = try? await rules.call("compact", "[\(input)]")
            let text = out.flatMap { try? JSONSerialization.jsonObject(with: Data($0.utf8), options: [.fragmentsAllowed]) as? String }
            XCTAssertEqual(text, expected, "compact(\(input)) is not \(expected)")
        }
    }

    // MARK: no key in view state (the-token-is-a-credential, debt token-export-and-view-unpinned)

    /// A key stored through KeyIntake must not reach the masthead model or its cells.
    func testNoKeyInTheMastheadModel() async throws {
        let rules = try engine()
        let keys = KeyStore(service: "test.manifest.n8.masthead", account: "device-key", backend: FakeKeychain())
        let link = try XCTUnwrap(URL(string: "manifestledger://sync#k=\(Self.fakeKey)"))
        let outcome = await KeyIntake.accept(link, engine: rules, store: keys)
        XCTAssertEqual(outcome, .stored, "the fake key must be stored, or the scan proves nothing")
        let (m, store) = try await opened(try fixtureURL())
        try store.commitReceived("A1|0|pLightningBolt", count: 1)
        try await m.refresh()

        XCTAssertEqual(figures(m), ["1/14", "0/4", "$1/$68"], "the model did not load, so the scan proves nothing")
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: m), "the masthead model holds the key")
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: m.cells), "the cells hold the key")
    }

    /// The scan must see a key inside a cell value, or the test above proves nothing.
    func testMirrorScanFindsKeyInsideACell() {
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: [TallyCell(label: "cards", figure: Self.fakeKey)]))
    }
}
