// Packages model tests (lane N5, native-build-lanes, rules-run-in-javascriptcore).
//
// The Packages view reads its rows from the rules engine over the ledger store.
// Rows must equal the golden files. Default sort is "newest" (src/app.jsx sortBy),
// so the row order is the golden sort-packages.json "newest" order. A check-in
// writes through the ledger store and saves the file. No key reaches the model,
// the ledger, or the rows (the-token-is-a-credential, native-key-via-url-scheme).
//
// Red-first. The builder adds these product types in native/ManifestKit/Sources.
// Until they exist the file does not compile. The stub the builder starts from
// returns wrong values, so each test fails on an XCTAssert and not on a compile error
// (testing-throwing-assert-bad-kill).
//
// Contract the tests name:
//   public struct LedgerItem: Decodable, Equatable, Sendable {
//       public let key, orderId, seller, name, set, condition, finish: String
//       public let qty: Int
//       public let price: Double
//       public let date, tracking, line: String
//   }
//   public struct Package: Decodable, Equatable, Sendable {
//       public let gk, orderId, seller, date, tracking: String
//       public let items: [LedgerItem]
//   }
//   @MainActor public final class PackagesModel {
//       public init(engine: RulesEngine, store: LedgerStore)  // holds NO KeyStore
//       public private(set) var rows: [Package]
//       public func load() async throws                      // groupPackages over store items
//       public func checkIn(key: String, count: Int) async throws
//           // calls store.setReceived(key, count:), then store.save()
//   }
//
// The builder also adds LedgerStore.items() -> [[String: Any]] (the raw `items`
// array), which the model passes to groupPackages. The tests do not call it.
//
// Fake fixtures only. No Keychain item is read: FakeKeychain stands in for it.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PackagesModelTests: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"
    static let checkedKey = "A1|0|pLightningBolt"

    /// A holder class, so the positive control walks a class property.
    final class Holder {
        let secret: String
        init(_ secret: String) { self.secret = secret }
    }

    // MARK: helpers

    /// A ledger file in a fresh temp dir, copied from the shared fixture.
    func freshLedgerURL() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n5-packages-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "ledger.json")
        try FileManager.default.copyItem(
            at: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"), to: url)
        return url
    }

    func readJSON(_ relative: String) throws -> Any {
        let data = try Data(contentsOf: RulesGoldenTests.root.appending(path: relative))
        return try JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])
    }

    /// The `received` map as the saved file holds it.
    func savedReceived(_ url: URL) throws -> [String: Any] {
        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        return try XCTUnwrap(obj["received"] as? [String: Any])
    }

    func loadedModel(_ store: LedgerStore, _ engine: RulesEngine) async throws -> PackagesModel {
        try store.load()
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()
        return model
    }

    // MARK: golden rows

    /// Rows equal packages.json, in the order sort-packages.json gives for "newest".
    func testRowsEqualGoldenInNewestOrder() async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 0 })
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let model = try await loadedModel(store, engine)

        let golden = try JSONDecoder().decode(
            [Package].self, from: Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/golden/packages.json")))
        let newest = try XCTUnwrap(
            (try readJSON("shared/fixtures/golden/sort-packages.json") as? [String: Any])?["newest"] as? [String])
        let expected = newest.compactMap { gk in golden.first { $0.gk == gk } }

        XCTAssertEqual(expected.count, 4, "golden fixture should hold four packages")
        XCTAssertEqual(model.rows.map(\.gk), newest, "row order is not the golden newest order")
        XCTAssertEqual(model.rows, expected, "rows differ from packages.json")
    }

    // MARK: check-in calls the ledger store

    /// A check-in writes through the store: generation rises, and the saved file holds the count.
    func testCheckInCallsLedgerStoreAndSaves() async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let model = try await loadedModel(store, engine)
        XCTAssertEqual(model.rows.count, 4, "the model should load four packages before a check-in")
        XCTAssertEqual(store.generation, 0)

        try await model.checkIn(key: Self.checkedKey, count: 1)

        XCTAssertEqual(store.generation, 1, "a check-in must call the ledger store once")
        let received = try savedReceived(url)
        XCTAssertEqual(received[Self.checkedKey] as? Int, 1, "the saved file must hold the check-in")
    }

    // MARK: no key in the model, the ledger or the rows

    /// A key stored through KeyIntake must not reach the model, the rows, or the ledger file.
    func testNoKeyInModelRowsOrLedgerAfterCheckIn() async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let keys = KeyStore(service: "test.manifest.n5", account: "device-key", backend: FakeKeychain())
        let link = try XCTUnwrap(URL(string: "manifestledger://sync#k=\(Self.fakeKey)"))
        let outcome = await KeyIntake.accept(link, engine: engine, store: keys)
        XCTAssertEqual(outcome, .stored, "the fake key must be stored, or the scan proves nothing")
        XCTAssertTrue(keys.hasKey())

        let model = try await loadedModel(store, engine)
        XCTAssertEqual(model.rows.count, 4, "the model should load four packages before a check-in")
        try await model.checkIn(key: Self.checkedKey, count: 1)
        XCTAssertEqual(store.generation, 1, "the check-in must reach the store before the scan")

        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: model), "the model holds the key")
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: model.rows), "the rows hold the key")
        let bytes = try String(contentsOf: url, encoding: .utf8)
        XCTAssertFalse(bytes.contains(Self.fakeKey), "the ledger file holds the key")
    }

    // MARK: a failed save changes nothing the user sees

    /// A save that fails leaves the model's received map, and the store's copy, as they were.
    func testFailedSaveLeavesReceivedAndStoreUnchanged() async throws {
        let url = try freshLedgerURL()
        let dir = url.deletingLastPathComponent()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let model = try await loadedModel(store, engine)
        let rowsBefore = model.rows
        let receivedBefore = model.received
        let storeBefore = store.received()

        // The atomic write needs a new file beside the ledger, so a read-only folder makes the save throw.
        try FileManager.default.setAttributes([.posixPermissions: 0o555], ofItemAtPath: dir.path)
        defer { try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path) }

        do {
            try await model.checkIn(key: Self.checkedKey, count: 1)
            XCTFail("a check-in must throw when the save fails")
        } catch {}

        XCTAssertEqual(model.rows, rowsBefore, "the rows changed on a failed save")
        XCTAssertEqual(model.received, receivedBefore, "the model's received map changed on a failed save")
        XCTAssertEqual(store.received(), storeBefore, "the store kept the failed check-in in memory")
    }

    // MARK: a reload keeps each row's data until the new rows have it

    /// The real bundle, with `itemDetail` spinning for half a second on its 13th call. The first load
    /// details the fixture's twelve lines, so the 13th call is the reload's. The spin holds the engine
    /// inside the reload's refresh: `rows` is already replaced and the maps are not yet filled.
    func stallingBundle() throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = FileManager.default.temporaryDirectory
            .appending(path: "n5-packages-stall-\(UUID().uuidString).js")
        let override = """
        ;(function () {
          var orig = Rules.itemDetail, n = 0;
          Rules = Object.assign({}, Rules, { itemDetail: function (it) {
            if (++n === 13) { var t = Date.now(); while (Date.now() - t < 500) {} }
            return orig(it);
          } });
        })();
        """
        try (real + "\n" + override + "\n").write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }

    /// The rows the view cannot draw whole: no order link, a line with no detail or no done flag, or an
    /// owed package with no pill. The view reads a missing pill as RECEIVED, so this is the false stamp.
    static func rowsMissingMaps(_ model: PackagesModel) -> [String] {
        model.rows.compactMap { p in
            let linesReady = p.items.allSatisfy { model.details[$0.key] != nil && model.done[$0.key] != nil }
            let owed = !p.items.allSatisfy { model.done[$0.key] == true }
            let whole = model.orderLinks[p.gk] != nil && linesReady && (!owed || model.pills[p.gk] != nil)
            return whole ? nil : p.gk
        }
    }

    /// A reload sets `rows`, then waits on the engine. Every map the view reads for a row must be set
    /// in that same step. Otherwise a reload mid-scroll draws cards with no link, no detail and a
    /// false RECEIVED. The test looks at the model at each point the reload waits.
    func testReloadNeverShowsRowsWithoutTheirMaps() async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 0 })
        let engine = try RulesEngine(bundleURL: try stallingBundle())
        let model = try await loadedModel(store, engine)
        XCTAssertEqual(model.details.count, 12, "the first load should detail all twelve lines, so the stall lands on the reload")

        let watch = ReloadWatch()
        let reload = Task {
            try await model.load()
            watch.finished = true
        }
        var looks = 0, bareLooks = 0
        var firstBare: [String] = []
        func look() {
            let bare = Self.rowsMissingMaps(model)
            if !bare.isEmpty {
                bareLooks += 1
                if firstBare.isEmpty { firstBare = bare }
            }
        }
        while !watch.finished && looks < 1_000_000 {
            await Task.yield()
            looks += 1
            look()
        }
        try await reload.value
        look()

        XCTAssertEqual(bareLooks, 0, "\(bareLooks) looks saw rows without their link, detail, done flag or pill; first: \(firstBare)")
        XCTAssertEqual(model.rows.count, 4, "the reload should leave four packages")
    }

    /// Set when the reload's task ends. Read by the test's loop on the same actor.
    @MainActor final class ReloadWatch {
        var finished = false
    }

    // MARK: positive controls for the mirror scan

    /// The scan must see a key held by a class property, or the test above proves nothing.
    func testMirrorScanFindsKeyInsideAClass() {
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: Holder(Self.fakeKey)))
    }

    /// The scan must see a key held by a KeyStore, the value the model must never hold.
    func testMirrorScanFindsKeyInsideKeyStore() throws {
        let keys = KeyStore(service: "test.manifest.n5.control", account: "device-key", backend: FakeKeychain())
        try keys.save(Self.fakeKey)
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: keys))
    }
}
