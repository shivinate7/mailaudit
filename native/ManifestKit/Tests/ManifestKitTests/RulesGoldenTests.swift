// Golden tests for the rules engine (rules-run-in-javascriptcore, lane N1).
//
// Each test feeds the engine the same inputs as scripts/gen-golden.mjs, with the
// same fixed clock, and compares the engine output with the golden file by value.
// The engine runs the bundled rules.js in JavaScriptCore, so these tests go through
// the Swift seam (RulesEngine), not a raw JSContext.
//
// parse-items.json is not tested here. It needs CSV parsing, and csv-import-stays-web
// keeps CSV import out of the native client. See the lane brief for the owner's ruling.

import Foundation
import XCTest
@testable import ManifestKit

final class RulesGoldenTests: XCTestCase {
    /// native/ManifestKit/Tests/ManifestKitTests/<this file> -> repo root.
    /// Symlinks resolve first, so a scratch package that links this file still finds the repo.
    static let root: URL = URL(fileURLWithPath: #filePath)
        .resolvingSymlinksInPath()
        .deletingLastPathComponent()  // ManifestKitTests
        .deletingLastPathComponent()  // Tests
        .deletingLastPathComponent()  // ManifestKit
        .deletingLastPathComponent()  // native
        .deletingLastPathComponent()  // repo root

    static let bundleURL = root.appending(path: "native/ManifestKit/Resources/rules.js")

    /// Date.parse("2026-08-12T14:03:00Z"). The same fixed clock as scripts/gen-golden.mjs.
    static let now: Double = 1_786_543_380_000

    // MARK: helpers

    static func bundleExists(line: UInt = #line) -> Bool {
        let found = FileManager.default.fileExists(atPath: bundleURL.path)
        if !found { XCTFail("rules bundle missing: \(bundleURL.path)", line: line) }
        return found
    }

    func readJSON(_ relative: String) throws -> Any {
        let data = try Data(contentsOf: Self.root.appending(path: relative))
        return try JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])
    }

    /// Sorted keys, so object order never matters. A bool stays `true`, not `1`.
    func canonical(_ value: Any) throws -> String {
        let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed])
        return String(decoding: data, as: UTF8.self)
    }

    /// One engine call: name and JSON arguments in, the decoded JSON result out.
    func call(_ engine: RulesEngine, _ name: String, _ args: [Any]) async throws -> Any {
        let argsData = try JSONSerialization.data(withJSONObject: args, options: [.fragmentsAllowed])
        let out = try await engine.call(name, String(decoding: argsData, as: UTF8.self))
        return try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed])
    }

    func ledgerItems() throws -> [Any] {
        let ledger = try XCTUnwrap(try readJSON("shared/fixtures/ledger.json") as? [String: Any])
        return try XCTUnwrap(ledger["items"] as? [Any])
    }

    /// gen-golden's `received = { [ledger[0].key]: 1 }`
    func receivedMap(_ items: [Any]) throws -> [String: Any] {
        let first = try XCTUnwrap(items.first as? [String: Any])
        return [try XCTUnwrap(first["key"] as? String): 1]
    }

    func assertMatchesGolden(_ actual: Any, _ file: String, line: UInt = #line) throws {
        let expected = try readJSON("shared/fixtures/golden/\(file)")
        let a = try canonical(actual)
        let e = try canonical(expected)
        XCTAssertEqual(a, e, "\(file) differs from its golden file", line: line)
    }

    // MARK: golden cases, one per golden file

    func testPackagesMatchGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let items = try ledgerItems()
        let pkgs = try await call(engine, "groupPackages", [items])
        try assertMatchesGolden(pkgs, "packages.json")
    }

    func testTallyMatchesGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let tally = try await call(engine, "tallyGroups", [try ledgerItems()])
        try assertMatchesGolden(tally, "tally.json")
    }

    func testTotalsMatchGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let items = try ledgerItems()
        let none = try await call(engine, "totalsOf", [items, [String: Any]()])
        let partial = try await call(engine, "totalsOf", [items, try receivedMap(items)])
        try assertMatchesGolden(["none": none, "partial": partial], "totals.json")
    }

    func testLostMailMatchesGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let pkgs = try await call(engine, "groupPackages", [try ledgerItems()]) as? [[String: Any]] ?? []
        var rows: [[String: Any]] = []
        for p in pkgs {
            let lost = try await call(engine, "lostMail", [
                p["date"] ?? NSNull(), p["tracking"] ?? NSNull(), false, Self.now,
            ])
            rows.append(["gk": p["gk"] ?? NSNull(), "lost": lost])
        }
        try assertMatchesGolden(rows, "lost-mail.json")
    }

    func testDateRangeMatchesGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let thirty = try await call(engine, "dateRange", [["preset": 30], Self.now])
        let all = try await call(engine, "dateRange", [["preset": "all"], Self.now])
        try assertMatchesGolden([thirty, all], "date-range.json")
    }

    func testSortPackagesMatchGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let items = try ledgerItems()
        let pkgs = try await call(engine, "groupPackages", [items])
        let received = try receivedMap(items)
        var out: [String: Any] = [:]
        for key in ["newest", "oldest", "value", "rate", "seller"] {
            let sorted = try await call(engine, "sortPackages", [pkgs, key, received]) as? [[String: Any]] ?? []
            out[key] = sorted.map { $0["gk"] ?? NSNull() }
        }
        try assertMatchesGolden(out, "sort-packages.json")
    }

    func testSortTallyMatchGolden() async throws {
        guard Self.bundleExists() else { return }
        let engine = try RulesEngine(bundleURL: Self.bundleURL)
        let items = try ledgerItems()
        let tally = try await call(engine, "tallyGroups", [items])
        let received = try receivedMap(items)
        var out: [String: Any] = [:]
        for key in ["missing", "basis", "ordered", "value", "rate", "name"] {
            let sorted = try await call(engine, "sortTally", [tally, key, received]) as? [[String: Any]] ?? []
            out[key] = sorted.map { $0["name"] ?? NSNull() }
        }
        try assertMatchesGolden(out, "sort-tally.json")
    }
}
