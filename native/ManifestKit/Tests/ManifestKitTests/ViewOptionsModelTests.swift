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
        received: [String: Int] = [:], saved: [String: Any] = [:], bundle: URL = RulesGoldenTests.bundleURL,
        label: String
    ) async throws -> (model: PackagesModel, url: URL, store: LedgerStore) {
        let url = try ViewOptionFixtures.ledgerURL(in: self, received: received, saved: saved, label: label)
        let store = LedgerStore(fileURL: url, now: { ViewOptionFixtures.now })
        try store.load()
        let model = PackagesModel(engine: try RulesEngine(bundleURL: bundle), store: store)
        try await model.load()
        return (model, url, store)
    }

    func tallyModel(
        received: [String: Int] = [:], saved: [String: Any] = [:], label: String
    ) async throws -> (model: TallyModel, store: LedgerStore) {
        let url = try ViewOptionFixtures.ledgerURL(in: self, received: received, saved: saved, label: label)
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
                       "Packages starts on Everything: \(Self.deltaGk) is fully in and still listed (ruled-head-showing-unreceived)")
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
                       "Tally starts on Everything: Urza's Saga is fully in and still listed (ruled-head-showing-unreceived)")
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
}
