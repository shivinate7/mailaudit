// View options on the Packages and Tally lists (lane restyle-step8). The web keeps Showing,
// Sorted by and Orders from in the Ledger tab's View group (ledger-tab-holds-options). Their list rules
// run in the bundle (rules-run-in-javascriptcore). The saved preferences are the keys the web's
// snapshot writes: dateFilter, sortBy and itemSort (saved-state-shape). Showing and Find are not saved.
//
// Each red case fails on an assert through API that exists now. PackagesModel has no query, Showing
// or range setter yet, so these cases read what the model shows after a load, a check-in or a saved
// preference. Each case also holds a green control, so a red reading cannot come from a broken fixture.
//
// The shared ledger: D1 (one line, 2026-05-01), C1 (five lines, 2026-06-01), A1 (three, 2026-07-01)
// and B1 (three, 2026-07-29). Group keys are orderId::seller. The clock is ViewOptionFixtures.now.
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class ViewOptionsModelTests: XCTestCase {
    static let urzaKey = "D1|0|pUrzasSaga"
    static let deltaGk = "D1::Delta Cards"
    /// The web's default Sorted by, Newest first.
    static let newestOrder = ["B1::Beta Games", "A1::Alpha Cards", "C1::Gamma Cards", "D1::Delta Cards"]

    func packagesModel(
        received: [String: Int] = [:], saved: [String: Any] = [:], extra: [[String: Any]] = [],
        bundle: URL = RulesGoldenTests.bundleURL, label: String
    ) async throws -> (model: PackagesModel, url: URL, store: LedgerStore) {
        let url = try ViewOptionFixtures.ledgerURL(in: self, received: received, saved: saved, extra: extra, label: label)
        let store = LedgerStore(fileURL: url, now: { ViewOptionFixtures.now })
        try store.load()
        let model = PackagesModel(engine: try RulesEngine(bundleURL: bundle), store: store)
        try await model.load()
        return (model, url, store)
    }

    func tallyModel(
        received: [String: Int] = [:], saved: [String: Any] = [:], extra: [[String: Any]] = [], label: String
    ) async throws -> (model: TallyModel, store: LedgerStore) {
        let url = try ViewOptionFixtures.ledgerURL(in: self, received: received, saved: saved, extra: extra, label: label)
        let store = LedgerStore(fileURL: url, now: { ViewOptionFixtures.now })
        try store.load()
        let model = TallyModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: store)
        try await model.load()
        return (model, store)
    }

    func gks(_ model: PackagesModel) -> [String] { model.rows.map(\.gk) }

    func savedDoc(_ url: URL) throws -> [String: Any] {
        try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
    }

    // MARK: Showing

    /// Showing starts on Unreceived, as the web's hideDone does. A package fully in is not listed.
    /// Card in Hand reads liveRows, and that stays the whole live set (stamped-filter-on-the-pipeline).
    /// Showing and Find are never written to the saved file.
    func testPackagesStartOnUnreceivedAndHidesAPackageFullyIn() async throws {
        let (model, url, store) = try await packagesModel(received: [Self.urzaKey: 1], label: "step8-showing")
        XCTAssertEqual(store.received()[Self.urzaKey], 1, "precondition: the one line of D1 is checked in")

        XCTAssertFalse(gks(model).contains(Self.deltaGk),
                       "Packages did not start on Unreceived: \(Self.deltaGk) is fully in and still listed (ruled-head-showing-unreceived, recorded 2026-10-10)")
        XCTAssertEqual(model.liveRows.count, 4, "control: liveRows is no longer the whole live set (stamped-filter-on-the-pipeline)")
        XCTAssertTrue(gks(model).contains("A1::Alpha Cards"), "control: a package with copies owed is not listed")

        try store.save()
        let doc = try savedDoc(url)
        XCTAssertNil(doc["hideDone"], "Showing was written to the saved file (saved-state-shape)")
        XCTAssertNil(doc["query"], "Find was written to the saved file (saved-state-shape)")
    }

    /// Tally starts on Unreceived: a product fully in is not listed, and a product with copies owed is.
    func testTallyStartsOnUnreceivedAndHidesAProductFullyIn() async throws {
        let (model, _) = try await tallyModel(received: [Self.urzaKey: 1], label: "step8-tally-showing")
        XCTAssertFalse(model.rows.contains { $0.name == "Urza's Saga" },
                       "Tally did not start on Unreceived: Urza's Saga is fully in and still listed (ruled-head-showing-unreceived, recorded 2026-10-10)")
        XCTAssertNotNil(model.rows.first { $0.name == "Lightning Bolt" }, "control: Lightning Bolt has copies owed and is not listed")
    }

    /// A package drops at once when its last copy is checked in. A package with copies owed stays listed.
    func testPackageDropsWhenItsLastCopyIsCheckedIn() async throws {
        let (model, _, _) = try await packagesModel(label: "step8-drop")
        XCTAssertTrue(gks(model).contains(Self.deltaGk), "precondition: D1 is listed before its check-in")

        try await model.checkIn(key: Self.urzaKey, count: 1)
        XCTAssertFalse(gks(model).contains(Self.deltaGk),
                       "a completed package stays listed after its last copy is checked in (ruled-head-showing-unreceived)")

        try await model.checkIn(key: "C1|0|pLightningBolt", count: 1)
        XCTAssertTrue(gks(model).contains("C1::Gamma Cards"), "control: C1 has copies owed and dropped")
    }

    // MARK: the bundle runs the list

    /// load() shows the list through the bundle's filterPackages. A probe that keeps no package leaves
    /// the list empty, so the Showing and Find rules reach the screen only through that call.
    func testLoadRunsTheListThroughTheBundlesFilterPackages() async throws {
        let probe = try ViewOptionFixtures.bundle(
            overriding: "Rules.filterPackages=function(){return [];};", in: self, label: "step8-filter-probe")
        let (model, _, _) = try await packagesModel(bundle: probe, label: "step8-filter")
        XCTAssertEqual(model.liveRows.count, 4, "control: the probe changed the live set")
        XCTAssertEqual(gks(model), [], "load() shows the packages without the bundle's filterPackages (rules-run-in-javascriptcore)")
    }

    /// A query goes through the bundle's filterPackages. Its stamp text is a function, which the JSON
    /// bridge cannot carry, so a query throws before any line is filtered. An empty query needs no
    /// stamp text, so it is the control.
    func testFilterPackagesRunsAQueryAcrossTheBridge() async throws {
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let items = String(decoding: try JSONSerialization.data(withJSONObject: try ViewOptionFixtures.fixtureItems()), as: UTF8.self)
        let pkgs = try await engine.call("groupPackages", "[\(items)]")
        func args(_ query: String) -> String {
            "[\(pkgs),{\"query\":\"\(query)\",\"hideDone\":false,\"received\":{},\"sticky\":{\"$set\":[]},\"revealed\":{\"$set\":[]}}]"
        }

        let everything = try await engine.call("filterPackages", args(""))
        let all = try JSONDecoder().decode([Package].self, from: Data(everything.utf8))
        XCTAssertEqual(all.count, 4, "control: an empty query keeps every package")

        do {
            let found = try await engine.call("filterPackages", args("urza"))
            let hits = try JSONDecoder().decode([Package].self, from: Data(found.utf8))
            XCTAssertEqual(hits.map(\.gk), [Self.deltaGk], "the query did not keep the package with the matching line")
            XCTAssertEqual(hits.first?.items.map(\.name), ["Urza's Saga"], "the query did not keep only the matching line")
        } catch {
            XCTFail("filterPackages with a query threw \(error): it calls opts.stampText, a function the JSON bridge cannot carry")
        }
    }

    // MARK: saved view preferences

    /// The saved Sorted by (sortBy) orders the Packages list on load. Native starts on Newest.
    func testSavedSortByOrdersThePackagesList() async throws {
        let (fresh, _, _) = try await packagesModel(label: "step8-sort-default")
        XCTAssertEqual(gks(fresh), Self.newestOrder, "control: the web's default Sorted by is Newest")

        let (model, _, _) = try await packagesModel(saved: ["sortBy": "oldest"], label: "step8-sort")
        XCTAssertEqual(gks(model), ["D1::Delta Cards", "C1::Gamma Cards", "A1::Alpha Cards", "B1::Beta Games"],
                       "the saved Sorted by (oldest) does not order the Packages list on load (saved-state-shape)")
    }

    /// The saved Orders from range narrows the Packages list, against the store's clock. Thirty days
    /// keeps B1 only. All time keeps all four.
    func testSavedOrdersFromRangeNarrowsThePackagesList() async throws {
        let (all, _, _) = try await packagesModel(
            saved: ["dateFilter": ["preset": "all", "from": "", "to": ""]], label: "step8-range-all")
        XCTAssertEqual(gks(all).count, 4, "control: All time lists four packages")

        let (model, _, _) = try await packagesModel(
            saved: ["dateFilter": ["preset": 30, "from": "", "to": ""]], label: "step8-range")
        XCTAssertEqual(gks(model), ["B1::Beta Games"],
                       "the saved Orders from (30 days) does not narrow the Packages list (date-filter-spans-ledger-views)")
    }

    /// The saved range changes Tally counts, because Tally sums only the dated copies it keeps. Thirty
    /// days leaves one Lightning Bolt copy (B1). All time leaves three (A1, B1, C1).
    func testSavedOrdersFromRangeChangesTallyCounts() async throws {
        let (all, _) = try await tallyModel(
            saved: ["dateFilter": ["preset": "all", "from": "", "to": ""]], label: "step8-tally-all")
        XCTAssertEqual(all.rows.first { $0.name == "Lightning Bolt" }?.qty, 3, "control: All time counts three Lightning Bolt copies")

        let (model, _) = try await tallyModel(
            saved: ["dateFilter": ["preset": 30, "from": "", "to": ""]], label: "step8-tally-range")
        XCTAssertEqual(model.rows.first { $0.name == "Lightning Bolt" }?.qty, 1,
                       "the saved Orders from (30 days) does not change Tally counts (date-filter-spans-ledger-views)")
    }

    /// The saved Sorted by (itemSort) sets the Tally sort on load. Native starts on Most missing.
    func testSavedItemSortSetsTheTallySort() async throws {
        let (fresh, _) = try await tallyModel(label: "step8-itemsort-default")
        XCTAssertEqual(fresh.sort, .missing, "control: the web's default Tally sort is Most missing")

        let (model, _) = try await tallyModel(saved: ["itemSort": "name"], label: "step8-itemsort")
        XCTAssertEqual(model.sort, .name, "the saved Sorted by (itemSort) does not set the Tally sort on load (saved-state-shape)")
    }

    /// The web reads the legacy cardSort key when itemSort is absent (src/app.jsx, the load effect).
    func testLegacyCardSortIsReadWhenItemSortIsAbsent() async throws {
        let (model, _) = try await tallyModel(saved: ["cardSort": "rate"], label: "step8-cardsort")
        XCTAssertEqual(model.sort, .rate, "the legacy cardSort key is not read on load (saved-state-shape)")
    }

    // MARK: By month

    /// An August order. One year on the ledger, so the picker's cell reads "Aug" and not "Aug ’26".
    static let augustLine = ViewOptionFixtures.line("g1", order: "G1", seller: "Gamma Games", name: "Gamma", qty: 1, date: "2026-08-03")

    /// Picking a whole month saves it as a custom range, and the range reads back as the cell's name, not "Custom". The
    /// reload reads the bundle's rangeMonthLabel again, so the name holds there too.
    func testPickingAWholeMonthReadsBackAsItsName() async throws {
        let (model, _, store) = try await packagesModel(extra: [Self.augustLine], label: "step8-month")
        let aug = try XCTUnwrap(model.options.months.first { $0.key == "2026-08" }, "anchor: the By month picker offers August")
        XCTAssertEqual(aug.label, "Aug", "anchor: the cell reads Aug, one year on the ledger")
        XCTAssertNotEqual(model.options.rangeLabel, "Aug", "anchor: no month is picked yet")

        try model.options.setMonth(aug, in: store)

        XCTAssertEqual(model.options.rangeLabel, "Aug", "a picked month reads back as Aug, not Custom (Orders from)")
        try await model.load()
        XCTAssertEqual(model.options.rangeLabel, "Aug", "the picked month still reads Aug after the list is read again")
    }

    // MARK: Canceled

    /// X1 is canceled on 2026-04-01, outside the saved 30 days, and X2 on 2026-08-02, inside them. Canceled lines are counted
    /// off the whole ledger, so both count, and the orders list newest first.
    static let canceledOld = ViewOptionFixtures.line("x1", order: "X1", seller: "Seller X", name: "Old Canceled", qty: 2,
                                                     date: "2026-04-01", tracking: "canceled")
    static let canceledNew = ViewOptionFixtures.line("x2", order: "X2", seller: "Seller X", name: "New Canceled", qty: 1,
                                                     date: "2026-08-02", tracking: "canceled")

    func testCanceledCountAndOrdersIgnoreTheRange() async throws {
        let thirtyDays: [String: Any] = ["dateFilter": ["preset": 30, "from": "", "to": ""]]
        let extra = [Self.canceledOld, Self.canceledNew]

        let (model, _, _) = try await packagesModel(saved: thirtyDays, extra: extra, label: "step8-canceled")
        XCTAssertEqual(gks(model), ["B1::Beta Games"], "anchor: the saved 30 days leaves B1 alone on the Packages list")
        XCTAssertEqual(model.options.canceledCount, 2, "Packages counts the canceled lines off the whole ledger, the one outside the range too")
        XCTAssertEqual(model.options.canceled.map(\.gk), ["X2::Seller X", "X1::Seller X"], "Packages lists the canceled orders newest first")

        let (tally, _) = try await tallyModel(saved: thirtyDays, extra: extra, label: "step8-canceled-tally")
        XCTAssertEqual(tally.options.canceledCount, 2, "Tally counts the canceled lines off the whole ledger, the one outside the range too")
        XCTAssertEqual(tally.options.canceled.map(\.gk), ["X2::Seller X", "X1::Seller X"], "Tally lists the canceled orders newest first")
    }

    // MARK: Tally's order-id tap

    /// Tally's order-id tap on A1's Lightning Bolt. The stamped filter is on and Find reads "Lightning", which would cut A1 to
    /// its Lightning Bolt line. The jump reveals A1 whole, turns the stamped filter off and names A1 to scroll to. D1 holds the
    /// one stamp, so the stamped list is D1 alone.
    func testOpenOrderRevealsThePackageWholeAndClearsTheStampedFilter() async throws {
        let stamp: [String: Any] = ["D1::Delta Cards": ["kind": "other", "note": "", "at": "2026-08-01", "updatedAt": ViewOptionFixtures.now]]
        let (model, _, _) = try await packagesModel(saved: ["stamps": stamp], label: "step8-jump")
        try await model.setQuery("Lightning")
        try await model.toggleStamped()
        XCTAssertTrue(model.showStamped, "anchor: the stamped filter is on")
        XCTAssertFalse(gks(model).contains("A1::Alpha Cards"), "anchor: A1 is not on the stamped list")

        let bolt = try JSONDecoder().decode(LedgerItem.self, from: JSONSerialization.data(withJSONObject: try XCTUnwrap(
            try ViewOptionFixtures.fixtureItems().first { ($0["key"] as? String) == "A1|0|pLightningBolt" }, "anchor: the fixture holds the bolt")))
        try await model.openOrder(of: bolt)

        XCTAssertFalse(model.showStamped, "the jump clears the stamped filter")
        XCTAssertEqual(model.rows.first { $0.gk == "A1::Alpha Cards" }?.items.count, 3,
                       "A1 is drawn whole: Find would cut it to its Lightning Bolt line")
        XCTAssertEqual(model.options.jumpGk, "A1::Alpha Cards", "the jump names A1 for the list to scroll to")
    }

    // MARK: the card order under $ remaining

    /// Under Sorted by $ remaining the cards keep the order they were placed in. A reload reads the counts again and keeps
    /// it, so a Worker apply that moves a copy never moves a card under the pointer (no-layout-shift-under-pointer). The web
    /// places its order on the items and the sort, and reads the counts through receivedRef (src/app.jsx packageOrder).
    func testAReloadKeepsTheCardOrderUnderDollarsRemaining() async throws {
        let (model, _, store) = try await packagesModel(saved: ["sortBy": "value"], label: "step8-hold-order")
        let placed = ["D1::Delta Cards", "C1::Gamma Cards", "B1::Beta Games", "A1::Alpha Cards"]
        XCTAssertEqual(gks(model), placed,
                       "anchor: $ remaining places Urza's Saga ($50), then Gamma ($9.50), then the two $4 packages, newer first")

        try await model.checkIn(key: "C1|1|pPathtoExile", count: 1)
        try await model.checkIn(key: "C1|2|pSwordstoPlowshares", count: 1)
        XCTAssertEqual(gks(model), placed, "control: a check-in keeps the order the cards were placed in")

        let fresh = PackagesModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: store)
        try await fresh.load()
        XCTAssertEqual(gks(fresh), ["D1::Delta Cards", "B1::Beta Games", "A1::Alpha Cards", "C1::Gamma Cards"],
                       "anchor: with Gamma at $2.50 remaining a fresh order places it last, so the counts would reorder the list")

        try await model.load()
        XCTAssertEqual(gks(model), placed,
                       "a reload re-sorted the cards by the new counts: Gamma fell below the two $4 packages (no-layout-shift-under-pointer)")

        try await model.setSort(.oldest)
        XCTAssertEqual(gks(model), ["D1::Delta Cards", "C1::Gamma Cards", "A1::Alpha Cards", "B1::Beta Games"],
                       "control: a change of Sorted by re-sorts the cards")
    }
}
