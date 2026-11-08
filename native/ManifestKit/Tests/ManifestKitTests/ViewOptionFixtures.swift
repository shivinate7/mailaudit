// Shared helpers for the view-option cases (ViewOptionsModelTests, lane restyle-step8) and the
// rules-bundle probes that replace one rule (PackagesToggleTests). One home: a probe or a ledger
// file is made here, never copied into a test file (building-one-home-per-capability).
//
// Every file goes in this run's folder (PhotoTestKit.tempDir, test-temp-standard). Each helper
// takes the test that asks for it, so the folder is removed when that test ends.
import Foundation
import XCTest
@testable import ManifestKit

enum ViewOptionFixtures {
    /// 2026-08-12 14:03 UTC, the clock every range case reads through LedgerStore(now:).
    static let now: Double = 1_786_543_380_000

    /// The shared fixture's items, as the JSON the store reads.
    static func fixtureItems() throws -> [[String: Any]] {
        let fixture = try JSONSerialization.jsonObject(
            with: Data(contentsOf: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"))) as? [String: Any]
        return fixture?["items"] as? [[String: Any]] ?? []
    }

    /// A ledger file: the shared fixture's items, `received`, and the saved view preferences the web
    /// keeps (`dateFilter`, `sortBy`, `itemSort`, and the legacy `cardSort`), written before the load.
    static func ledgerURL(in test: XCTestCase, received: [String: Int] = [:], saved: [String: Any] = [:],
                          label: String) throws -> URL {
        let dir = try PhotoTestKit.tempDir(label)
        test.addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        var doc: [String: Any] = ["mailday": 1, "items": try fixtureItems(), "received": received]
        for (key, value) in saved { doc[key] = value }
        let url = dir.appending(path: "ledger.json")
        try JSONSerialization.data(withJSONObject: doc).write(to: url)
        return url
    }

    /// The real rules bundle with `source` appended. The appended line replaces one rule, so a case
    /// can tell that the model calls the bundle and does not copy the rule.
    static func bundle(overriding source: String, in test: XCTestCase, label: String) throws -> URL {
        let dir = try PhotoTestKit.tempDir(label)
        test.addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = dir.appending(path: "rules-probe.js")
        try (real + "\n;" + source + "\n").write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }
}
