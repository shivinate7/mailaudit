// Packages rules bridge (lane N5, rules-run-in-javascriptcore, phone-nav-is-bottom-bar).
//
// The check-in toggle and the "N of M" clamp have one home: src/view-rules.mjs,
// pinned by test/view-rules.test.mjs (V14). Swift calls them through RulesEngine,
// so these cases read the bundled rules.js and copy no rule.
//
// Red-first. The bundle has no toggleCount or countLabel until the builder runs
// `npm run build`, which regenerates native/ManifestKit/Resources/rules.js. Until
// then each call throws unknownFunction and the case fails on an XCTFail.
//
// Contract the tests name (exports in src/view-rules.mjs):
//   toggleCount(got, qty) -> Int   0 when got >= qty, else qty
//   countLabel(got, qty)  -> String  "N of M", N clamped to M
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

final class PackagesRulesTests: XCTestCase {
    /// One rules call, with a thrown error reported as a failure, not a crash.
    func rule(_ name: String, _ args: String) async -> String? {
        do {
            let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
            return try await engine.call(name, args)
        } catch {
            XCTFail("\(name)\(args) threw \(error)")
            return nil
        }
    }

    // MARK: countLabel

    /// An over-count clamps to the quantity: the label reads "2 of 2", never "3 of 2".
    func testCountLabelClampsOverCountToTheQuantity() async {
        let out = await rule("countLabel", "[3,2]")
        XCTAssertEqual(out, "\"2 of 2\"", "an over-count must read 2 of 2, never 3 of 2")
    }

    func testCountLabelReadsAnInRangeCount() async {
        let out = await rule("countLabel", "[1,3]")
        XCTAssertEqual(out, "\"1 of 3\"")
    }

    // MARK: toggleCount

    /// The tap writes the count the bundle gives: check in the full line, or un-check it.
    func testToggleCountComesFromTheBundle() async {
        let cases: [(String, String)] = [
            ("[0,1]", "1"),   // nothing in: check in the one copy
            ("[1,1]", "0"),   // full: un-check
            ("[1,3]", "3"),   // partial: a tap checks in the full quantity
            ("[3,2]", "0"),   // over-count is still done: un-check
        ]
        for (args, want) in cases {
            let out = await rule("toggleCount", args)
            XCTAssertEqual(out, want, "toggleCount\(args)")
        }
    }
}
