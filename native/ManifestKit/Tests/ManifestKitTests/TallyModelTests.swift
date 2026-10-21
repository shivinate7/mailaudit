// Tally model tests (lane N6, native-build-lanes, rules-run-in-javascriptcore).
//
// Web behaviour pinned: tally-pools-on-the-exact-name, tally-sort-keys-are-six,
// search-hide-keep-tally-counts, tally-row-lists-its-copies, card-tally-row-counts-first.
// The pooling, sorting and filtering rules stay in the bundle (rules.js); the model only
// calls them. TallyBundleProbeTests proves the call. Row text is pinned by value from
// ItemTotalRow in src/app.jsx.
//
// Red-first. TallyRedStub.swift (this folder) stands in for the product types, with wrong
// values, so each test fails on an assertion. The builder deletes the stub and adds the real
// types under native/ManifestKit/Sources/ManifestKit. The signatures must stay equal.
//
// Contract the tests name:
//   public enum TallySort: String, CaseIterable, Sendable {
//       case missing, basis, ordered, value, rate, name   // raw value = the sortTally key, in this order
//       public var label: String   // "Most missing" "Cost basis" "Most ordered" "$ remaining" "Unit rate" "Name A–Z"
//   }
//   public struct TallyRow: Equatable, Sendable {
//       public let name: String
//       public let qty, got: Int             // ordered, and checked in (each copy clamped to its qty), over EVERY copy
//       public let basis, avg: Double        // price x qty over every copy; basis / qty
//       public let sellerCount, orderCount: Int
//       public let sets: [String]
//       public let leftValue: Double         // dollars still outstanding over every copy
//       public let copies: [LedgerItem]      // the SHOWN copies, in tallyGroups order (newest, then seller)
//       public let hiddenCopies: Int         // every copy minus the shown ones
//       public let ratio: String             // "1/3"; "3/3 ✓" once in
//       public let rateLine: String          // "$1.00 / copy"
//       public let leftLine: String          // "2 left · $2.00"; stays "0 left · $0.00" when in (the view hides it)
//       public let meta: String              // "3 sellers · 3 orders · Test Set": counts first, then the sets
//       public let acrossLine: String        // "$3.00 across 3 copies · $1.00 avg"
//       public let hiddenNote: String?       // nil at 0; "1 copy hidden by filters"; "2 copies hidden by filters"
//   }
//   @MainActor @Observable public final class TallyModel {
//       public init(engine: RulesEngine, store: LedgerStore)   // holds no KeyStore
//       public private(set) var rows: [TallyRow]    // tallyGroups, sortTally, filterTally, all from the bundle
//       public private(set) var sort: TallySort     // starts .missing (the web default)
//       public private(set) var query: String       // starts ""
//       public private(set) var hideReceived: Bool  // starts false
//       public func load() async throws
//       public func setSort(_ key: TallySort) async throws    // sorts with the received map as it is now
//       public func setQuery(_ text: String) async throws
//       public func setHideReceived(_ on: Bool) async throws
//       public func clearSearch() async throws                // same as setQuery("")
//       public func checkIn(key: String, count: Int) async throws  // commitReceived, then the rows refresh
//   }
//
// Rulings the tests carry:
//   - The row order freezes while the user checks in (tally-sort-keys-are-six, no-layout-shift-under-pointer):
//     a check-in changes counts and never the order. Choosing a sort sorts again.
//   - A copy checked in while hide-received is on stays shown (the web's `sticky` input to filterTally)
//     until the query or hide-received changes.
//   - Not pinned, because the row does not name them: the date range, canceled and refunded packages
//     (N5's Packages view reads every item too), the per-copy stepper, the per-copy lost-mail flag, the bulk buttons.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class TallyModelTests: XCTestCase {
    static let sortKeys = ["missing", "basis", "ordered", "value", "rate", "name"]
    /// gen-golden's `received`: the first ledger item in, once.
    static let received0 = ["A1|0|pLightningBolt": 1]
    static let now = 1_786_543_380_000.0

    // MARK: helpers

    func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    /// A ledger file in a fresh temp dir: the shared fixture's items (or `items`), with `received` written in
    /// before the load, so the order the model freezes on load is the order the golden file holds.
    func ledgerURL(items: [[String: Any]]? = nil, received: [String: Int]) throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n6-tally-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let fixture = try JSONSerialization.jsonObject(
            with: Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"))) as? [String: Any]
        var doc: [String: Any] = ["mailday": 1, "items": items ?? (fixture?["items"] as? [[String: Any]] ?? [])]
        doc["received"] = received
        let url = dir.appending(path: "ledger.json")
        try JSONSerialization.data(withJSONObject: doc).write(to: url)
        return url
    }

    func makeModel(
        items: [[String: Any]]? = nil, received: [String: Int] = TallyModelTests.received0,
        bundle: URL = RulesGoldenTests.bundleURL
    ) async throws -> (model: TallyModel, store: LedgerStore, engine: RulesEngine) {
        let store = LedgerStore(fileURL: try ledgerURL(items: items, received: received), now: { Self.now })
        let engine = try RulesEngine(bundleURL: bundle)
        try store.load()
        let model = TallyModel(engine: engine, store: store)
        try await model.load()
        return (model, store, engine)
    }

    func item(
        _ key: String, order: String, seller: String, name: String, set: String = "Test Set",
        qty: Int = 1, price: Double = 1, date: String = "2026-07-01"
    ) -> [String: Any] {
        ["key": key, "orderId": order, "seller": seller, "name": name, "set": set, "condition": "Near Mint",
         "finish": "", "qty": qty, "price": price, "date": date, "tracking": "with tracking", "line": "Magic"]
    }

    func goldenOrder(_ key: String) throws -> [String] {
        let data = try Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/golden/sort-tally.json"))
        let all = try XCTUnwrap(try JSONSerialization.jsonObject(with: data) as? [String: [String]])
        return try XCTUnwrap(all[key], "sort-tally.json has no \(key) order")
    }

    /// The order a fresh sort gives now, straight from the bundle. The control for the frozen-order case.
    func freshOrder(_ engine: RulesEngine, _ store: LedgerStore, _ key: String) async throws -> [String] {
        let groups = try await engine.call("tallyGroups", "[\(try json(store.items()))]")
        let sorted = try await engine.call("sortTally", "[\(groups),\(try json(key)),\(try json(store.received()))]")
        let list = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(sorted.utf8)) as? [[String: Any]])
        return list.compactMap { $0["name"] as? String }
    }

    /// A row that must exist. Fails the test, and carries on, when it does not.
    func row(_ model: TallyModel, _ name: String, line: UInt = #line) -> TallyRow? {
        let found = model.rows.first { $0.name == name }
        if found == nil { XCTFail("no Tally row named \(name); rows: \(model.rows.map(\.name))", line: line) }
        return found
    }

    /// Every figure a filter must leave alone.
    func figures(_ r: TallyRow) -> String {
        [r.name, "\(r.qty)", "\(r.got)", "\(r.basis)", "\(r.avg)", "\(r.sellerCount)", "\(r.orderCount)",
         r.sets.joined(separator: ","), "\(r.leftValue)", r.ratio, r.rateLine, r.leftLine, r.meta, r.acrossLine]
            .joined(separator: "|")
    }

    // MARK: the six sort keys

    /// Six keys, in the web's order, with the web's labels (ITEM_SORTS). Each label is 12 characters or fewer.
    func testSortKeysAndLabelsAreTheWebSix() {
        XCTAssertEqual(TallySort.allCases.map(\.rawValue), Self.sortKeys, "the sort keys are not the six sortTally keys")
        let labels = ["Most missing", "Cost basis", "Most ordered", "$ remaining", "Unit rate", "Name A\u{2013}Z"]
        XCTAssertEqual(TallySort.allCases.map(\.label), labels, "the labels differ from ITEM_SORTS")
        for label in TallySort.allCases.map(\.label) {
            XCTAssertLessThanOrEqual(label.count, 12, "\(label) is longer than 12 characters")
        }
    }

    /// The web default is Most missing, and the first rows are the golden "missing" order.
    func testStartsOnMostMissing() async throws {
        let (model, _, _) = try await makeModel()
        XCTAssertEqual(model.sort, .missing)
        XCTAssertEqual(model.query, "")
        XCTAssertFalse(model.hideReceived)
        XCTAssertEqual(model.rows.map(\.name), try goldenOrder("missing"))
    }

    /// Each key orders the rows as sort-tally.json does. The six golden orders differ, so a model that
    /// ignores the key cannot pass for all six.
    func testEachSortKeyOrdersRowsAsTheGoldenFile() async throws {
        let (model, _, _) = try await makeModel()
        let golden = try Self.sortKeys.map { try goldenOrder($0) }
        XCTAssertEqual(Set(golden).count, 6, "the six golden orders must differ, or the loop below cannot tell the keys apart")
        for (raw, want) in zip(Self.sortKeys, golden) {
            guard let key = TallySort(rawValue: raw) else { XCTFail("TallySort has no case with raw value \(raw)"); continue }
            try await model.setSort(key)
            XCTAssertEqual(model.sort, key)
            XCTAssertEqual(model.rows.map(\.name), want, "sort \(raw) differs from sort-tally.json")
        }
    }

    /// A check-in changes the counts and never the order. Choosing a sort afterwards uses the counts as they are.
    func testOrderIsFrozenWhileCheckingInAndAFreshSortUsesTheNewCounts() async throws {
        let (model, store, engine) = try await makeModel()
        let before = try goldenOrder("missing")
        XCTAssertEqual(model.rows.map(\.name), before, "precondition: the rows start in the golden missing order")

        try await model.checkIn(key: "A1|2|pBrainstorm", count: 2)
        try await model.checkIn(key: "B1|2|pBrainstorm", count: 2)

        let fresh = try await freshOrder(engine, store, "missing")
        XCTAssertNotEqual(fresh, before, "control: a fresh sort must move Brainstorm, or this case cannot fail")
        XCTAssertEqual(model.rows.map(\.name), before, "the rows re-sorted under the pointer")
        if let b = row(model, "Brainstorm") {
            XCTAssertEqual(b.got, 4)
            XCTAssertEqual(b.ratio, "4/4 \u{2713}", "the check-in did not reach the row")
        }

        try await model.setSort(.value)
        let freshValue = try await freshOrder(engine, store, "value")
        let goldenValue = try goldenOrder("value")
        XCTAssertNotEqual(freshValue, goldenValue, "control: the new counts must change the value order")
        XCTAssertEqual(model.rows.map(\.name), freshValue, "a newly chosen sort did not use the current counts")
    }

    // MARK: search and hide-received never change a shown row's counts

    /// Search hides copies. A row that stays shown keeps every figure, and says how many copies are hidden.
    func testSearchHidesCopiesButKeepsEveryShownFigure() async throws {
        let (all, _, _) = try await makeModel()
        let (model, _, _) = try await makeModel()
        try await model.setQuery("  beta ")  // trimmed, and case-insensitive
        XCTAssertEqual(model.query, "  beta ")

        XCTAssertEqual(model.rows.map(\.name), ["Brainstorm", "Counterspell", "Lightning Bolt"],
                       "only the items with a Beta Games copy remain, in the frozen order")
        for r in model.rows {
            guard let base = row(all, r.name) else { continue }
            XCTAssertEqual(figures(r), figures(base), "search changed the figures of \(r.name)")
            XCTAssertEqual(r.copies.map(\.orderId), ["B1"], "\(r.name) shows a copy the search should hide")
            XCTAssertEqual(r.hiddenCopies, base.copies.count - 1)
        }
        if let lb = row(model, "Lightning Bolt") {
            XCTAssertEqual(lb.qty, 3)
            XCTAssertEqual(lb.basis, 3)
            XCTAssertEqual(lb.got, 1)
            XCTAssertEqual(lb.hiddenNote, "2 copies hidden by filters")
        }
        if let bs = row(model, "Brainstorm") { XCTAssertEqual(bs.hiddenNote, "1 copy hidden by filters") }
        XCTAssertTrue(all.rows.allSatisfy { $0.hiddenNote == nil && $0.hiddenCopies == 0 }, "no filter, no hidden note")
    }

    /// Hide-received drops a row whose copies are all in, and hides the received copies of the rest.
    /// Shown rows keep every figure, then a search narrows the same rows further.
    func testHideReceivedHidesCopiesButKeepsEveryShownFigure() async throws {
        let rec = ["A1|0|pLightningBolt": 1, "D1|0|pUrzasSaga": 1]
        let (all, _, _) = try await makeModel(received: rec)
        let (model, _, _) = try await makeModel(received: rec)
        if let urza = row(all, "Urza's Saga") { XCTAssertEqual(urza.ratio, "1/1 \u{2713}", "control: the row exists unfiltered") }

        try await model.setHideReceived(true)
        XCTAssertTrue(model.hideReceived)
        XCTAssertEqual(model.rows.map(\.name), all.rows.map(\.name).filter { $0 != "Urza's Saga" },
                       "a row whose copies are all in must drop, and no other row")
        for r in model.rows {
            guard let base = row(all, r.name) else { continue }
            XCTAssertEqual(figures(r), figures(base), "hide-received changed the figures of \(r.name)")
        }
        if let lb = row(model, "Lightning Bolt") {
            XCTAssertEqual(lb.copies.map(\.orderId), ["B1", "C1"], "the received A1 copy must be hidden")
            XCTAssertEqual(lb.hiddenCopies, 1)
            XCTAssertEqual(lb.hiddenNote, "1 copy hidden by filters")
        }

        try await model.setQuery("beta")
        if let lb = row(model, "Lightning Bolt") {
            XCTAssertEqual(lb.copies.map(\.orderId), ["B1"], "search and hide-received must both apply")
            XCTAssertEqual(lb.hiddenCopies, 2)
            XCTAssertEqual(lb.qty, 3)
        }
    }

    /// A search with no hit leaves no rows. Clearing it brings every row back.
    func testNoMatchLeavesNoRowsAndClearSearchRestoresThem() async throws {
        let (model, _, _) = try await makeModel()
        XCTAssertEqual(model.rows.count, 8, "precondition: eight Tally rows in the fixture")

        try await model.setQuery("zzzz")
        XCTAssertEqual(model.query, "zzzz")
        XCTAssertEqual(model.rows.count, 0)

        try await model.clearSearch()
        XCTAssertEqual(model.query, "")
        XCTAssertEqual(model.rows.map(\.name), try goldenOrder("missing"))
    }

    /// A copy checked in under hide-received stays shown (no row jumps under the pointer),
    /// until the filter context changes.
    func testJustCheckedCopyStaysShownUntilTheContextChanges() async throws {
        let (model, _, _) = try await makeModel()
        try await model.setHideReceived(true)
        XCTAssertNotNil(model.rows.first { $0.name == "Urza's Saga" }, "precondition: the row shows while it is missing")

        try await model.checkIn(key: "D1|0|pUrzasSaga", count: 1)
        if let urza = row(model, "Urza's Saga") {
            XCTAssertEqual(urza.copies.map(\.key), ["D1|0|pUrzasSaga"], "the just-checked copy vanished")
            XCTAssertEqual(urza.ratio, "1/1 \u{2713}")
        }

        try await model.setHideReceived(false)
        try await model.setHideReceived(true)
        XCTAssertNil(model.rows.first { $0.name == "Urza's Saga" }, "the sticky copy outlived a change of context")
    }

    // MARK: pooling on the exact name

    /// Rows pool across sellers and orders on the byte-exact name. A case, space or trailing-space
    /// difference makes a separate row. The app does not normalize before pooling.
    func testPoolsOnTheExactNameAndNeverNormalizes() async throws {
        let items = [
            item("1", order: "O1", seller: "S1", name: "Lightning Bolt"),
            item("2", order: "O2", seller: "S2", name: "Lightning Bolt"),
            item("3", order: "O3", seller: "S3", name: "Lightning Bolt "),
            item("4", order: "O4", seller: "S4", name: "lightning bolt"),
            item("5", order: "O5", seller: "S5", name: "Lightning  Bolt"),
        ]
        let (model, _, _) = try await makeModel(items: items, received: [:])
        XCTAssertEqual(Set(model.rows.map(\.name)),
                       ["Lightning Bolt", "Lightning Bolt ", "lightning bolt", "Lightning  Bolt"])
        XCTAssertEqual(model.rows.count, 4, "near-identical names must not pool")
        if let pooled = row(model, "Lightning Bolt") {
            XCTAssertEqual(pooled.qty, 2)
            XCTAssertEqual(pooled.sellerCount, 2)
            XCTAssertEqual(pooled.orderCount, 2)
            XCTAssertEqual(pooled.copies.count, 2)
        }
    }

    // MARK: the row and its copies

    /// The collapsed row's figures, as ItemTotalRow in src/app.jsx writes them.
    func testRowTextMatchesTheWebRow() async throws {
        let (model, _, _) = try await makeModel()
        if let lb = row(model, "Lightning Bolt") {
            XCTAssertEqual(lb.ratio, "1/3")
            XCTAssertEqual(lb.rateLine, "$1.00 / copy")
            XCTAssertEqual(lb.leftLine, "2 left \u{00B7} $2.00")
            XCTAssertEqual(lb.meta, "3 sellers \u{00B7} 3 orders \u{00B7} Test Set")
            XCTAssertEqual(lb.acrossLine, "$3.00 across 3 copies \u{00B7} $1.00 avg")
            XCTAssertNil(lb.hiddenNote)
        }
        if let bs = row(model, "Brainstorm") {
            XCTAssertEqual(bs.ratio, "0/4")
            XCTAssertEqual(bs.rateLine, "$0.50 / copy")
            XCTAssertEqual(bs.leftLine, "4 left \u{00B7} $2.00")
            XCTAssertEqual(bs.acrossLine, "$2.00 across 4 copies \u{00B7} $0.50 avg")
        }
        if let urza = row(model, "Urza's Saga") {
            XCTAssertEqual(urza.rateLine, "$50.00 / copy")
            XCTAssertEqual(urza.leftLine, "1 left \u{00B7} $50.00")
            XCTAssertEqual(urza.meta, "1 seller \u{00B7} 1 order \u{00B7} Test Set")
            XCTAssertEqual(urza.acrossLine, "$50.00 across 1 copy \u{00B7} $50.00 avg")
        }
    }

    /// Once a row is in, its outstanding line keeps its text (the view hides it and keeps it mounted).
    func testOutstandingLineKeepsItsTextOnceTheRowIsIn() async throws {
        let (model, _, _) = try await makeModel()
        try await model.checkIn(key: "D1|0|pUrzasSaga", count: 1)
        if let urza = row(model, "Urza's Saga") {
            XCTAssertEqual(urza.ratio, "1/1 \u{2713}")
            XCTAssertEqual(urza.leftLine, "0 left \u{00B7} $0.00", "the outstanding line must stay, so the row keeps its height")
            XCTAssertEqual(urza.leftValue, 0)
        }
    }

    /// The meta line puts the counts first and the sets last. Two sets read "first +N more". No set leaves no trailing separator.
    func testMetaLineIsCountsFirstThenSets() async throws {
        let items = [
            item("1", order: "O1", seller: "S1", name: "Ponder", set: "Alpha Set", price: 1),
            item("2", order: "O1", seller: "S1", name: "Ponder", set: "Beta Set", price: 1.5),
            item("3", order: "O2", seller: "S2", name: "Island", set: "", price: 0.25),
        ]
        let (model, _, _) = try await makeModel(items: items, received: [:])
        if let ponder = row(model, "Ponder") {
            XCTAssertEqual(ponder.meta, "1 seller \u{00B7} 1 order \u{00B7} Alpha Set +1 more")
            XCTAssertEqual(ponder.sets, ["Alpha Set", "Beta Set"])
            XCTAssertEqual(ponder.acrossLine, "$2.50 across 2 copies \u{00B7} $1.25 avg")
        }
        if let island = row(model, "Island") {
            XCTAssertEqual(island.meta, "1 seller \u{00B7} 1 order", "no set, so no trailing separator")
            XCTAssertEqual(island.sets, [])
        }
    }

    /// The expanded row lists every copy it counts: seller, date, set and order id, newest first.
    func testRowListsEveryCopyItCounts() async throws {
        let (model, _, _) = try await makeModel()
        guard let lb = row(model, "Lightning Bolt") else { return }
        XCTAssertEqual(lb.copies.map(\.key), ["B1|0|pLightningBolt", "A1|0|pLightningBolt", "C1|0|pLightningBolt"])
        XCTAssertEqual(lb.copies.map(\.seller), ["Beta Games", "Alpha Cards", "Gamma Cards"])
        XCTAssertEqual(lb.copies.map(\.date), ["2026-07-29", "2026-07-01", "2026-06-01"])
        XCTAssertEqual(lb.copies.map(\.set), ["Test Set", "Test Set", "Test Set"])
        XCTAssertEqual(lb.copies.map(\.orderId), ["B1", "A1", "C1"])
        XCTAssertEqual(lb.copies.count + lb.hiddenCopies, 3)
        XCTAssertEqual(lb.copies.reduce(0) { $0 + $1.qty }, lb.qty, "the listed copies must add up to the count the row shows")
    }

    // MARK: a check-in writes the store

    /// A check-in goes through the ledger store and its save, and the row shows it.
    func testCheckInWritesTheStoreAndTheRow() async throws {
        let (model, store, _) = try await makeModel()
        XCTAssertEqual(store.generation, 0)
        try await model.checkIn(key: "B1|0|pLightningBolt", count: 1)
        XCTAssertEqual(store.generation, 1)
        XCTAssertEqual(store.received()["B1|0|pLightningBolt"], 1)
        if let lb = row(model, "Lightning Bolt") {
            XCTAssertEqual(lb.got, 2)
            XCTAssertEqual(lb.ratio, "2/3")
            XCTAssertEqual(lb.leftLine, "1 left \u{00B7} $1.00")
        }
    }

    // MARK: the sort and the filter come from the bundle

    /// The real rules.js plus one override, so a model that copied a rule would not see it.
    func probeBundle(_ override: String) throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = FileManager.default.temporaryDirectory.appending(path: "n6-tally-probe-\(UUID().uuidString).js")
        try (real + "\n;" + override + ";\n").write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }

    /// sortTally put in reverse alphabetical order for every key. The rows must follow it
    /// (rules-run-in-javascriptcore: the Swift client holds no copy of a view rule).
    func testRowOrderComesFromTheBundleSort() async throws {
        let bundle = try probeBundle("Rules.sortTally=function(g){return g.slice().sort(function(a,b){return a.name<b.name?1:-1})}")
        let (model, _, _) = try await makeModel(bundle: bundle)
        XCTAssertEqual(model.rows.map(\.name), [
            "Urza's Saga", "Swords to Plowshares", "Preordain", "Ponder", "Path to Exile",
            "Lightning Bolt", "Counterspell", "Brainstorm",
        ], "the model sorted the rows itself instead of calling sortTally")
    }

    /// filterTally keeps one group and shows its first copy. The rows, and the hidden count, must follow it.
    func testShownCopiesComeFromTheBundleFilter() async throws {
        let bundle = try probeBundle("""
        Rules.filterTally=function(g){return g.filter(function(x){return x.name==="Lightning Bolt"})
        .map(function(x){return Object.assign({},x,{shown:x.items.slice(0,1)})})}
        """)
        let (model, _, _) = try await makeModel(bundle: bundle)
        try await model.setQuery("zz")  // a filter is active under any design
        XCTAssertEqual(model.rows.map(\.name), ["Lightning Bolt"], "the model filtered the rows itself instead of calling filterTally")
        XCTAssertEqual(model.rows.first?.copies.map(\.key), ["B1|0|pLightningBolt"])
        XCTAssertEqual(model.rows.first?.hiddenCopies, 2)
    }
}
