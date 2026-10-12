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
