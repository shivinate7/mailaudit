// The removal rule has one home: removesSomething in src/version-rules.mjs, bundled into rules.js
// (rules-run-in-javascriptcore). LedgerStore.removes is the Swift seam that adopt calls. It must give
// the bundle's answer on every case in test/removes-cases.json, the file the JS test reads too. It must
// also ask the bundle it is given, not a Swift copy of the rule (testRemovesAsksTheBundleItIsGiven).
//
// The bundle has removesSomething (rules.js, built by `npm run build`). A missing rule would fail each
// bundle call with unknownFunction, and each case would fail on an XCTFail that says "rule missing".
// LedgerStore's own answer is the control that the cases match what LedgerStore does today. The probe
// case goes red when removes ignores the bundle on its VersionStore: the Swift answer on an empty
// ledger is false, so it fails on the answer and not on a missing rule.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class RemovesRuleBundleTests: XCTestCase {
    struct Case {
        let name: String
        let kind: String
        let held: [String: Any]
        let incoming: [String: Any]
        let removes: Bool
    }

    /// Every case in test/removes-cases.json, the file the JS test reads too.
    static func cases() throws -> [Case] {
        let url = RulesGoldenTests.root.appending(path: "test/removes-cases.json")
        let json = try JSONSerialization.jsonObject(with: Data(contentsOf: url))
        let obj = try XCTUnwrap(json as? [String: Any])
        let list = try XCTUnwrap(obj["cases"] as? [[String: Any]])
        return try list.map { c in
            Case(
                name: try XCTUnwrap(c["name"] as? String),
                kind: try XCTUnwrap(c["kind"] as? String),
                held: try XCTUnwrap(c["held"] as? [String: Any]),
                incoming: try XCTUnwrap(c["incoming"] as? [String: Any]),
                removes: try XCTUnwrap(c["removes"] as? Bool)
            )
        }
    }

    /// One kind per removal and per non-removal the fixture must reach.
    static let kinds = [
        "count-lowered", "count-cleared", "envelope-gone", "envelope-tombstoned",
        "stamp-emptied", "stamp-gone", "full-to-empty",
        "identical", "added-only", "live-edit", "held-tombstone-gone", "held-empty-stamp-gone",
        "empty", "empty-to-full",
    ]

    /// LedgerStore's own answer. The held ledger goes into the store's document as it stands, and
    /// removes reads that document. No file is loaded and no rulesURL is given, so the answer is Swift's
    /// unless removes calls a bundle.
    func storeAnswer(_ c: Case) -> Bool {
        let store = LedgerStore(fileURL: PhotoTestKit.runFolder.appending(path: "ledger.json"), now: { 0 })
        store.doc = c.held
        return store.removes(c.incoming)
    }

    /// The bundle's answer to removesSomething(held, incoming). A missing rule fails with a message
    /// that says so, and the case is then not compared.
    func bundleAnswer(_ name: String, _ args: String) async -> Bool? {
        do {
            let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
            let out = try await engine.call("removesSomething", args)
            switch out {
            case "true": return true
            case "false": return false
            default:
                XCTFail("\(name): removesSomething answered \(out), not a boolean")
                return nil
            }
        } catch RulesFailure.unknownFunction(let fn) {
            XCTFail("rule missing: \(fn) is not in rules.js, so \(name) has no bundle answer")
            return nil
        } catch {
            XCTFail("\(name): removesSomething threw \(error)")
            return nil
        }
    }

    /// Each case: LedgerStore's answer is what the fixture says (green on the old code), the bundle's
    /// answer is what the fixture says (red until the rule lands), and the two agree.
    func testRemovesAgreesWithTheBundleRuleOnEveryCase() async throws {
        let list = try Self.cases()
        for kind in Self.kinds {
            XCTAssertTrue(list.contains(where: { $0.kind == kind }), "the fixture holds a \"\(kind)\" case")
        }
        for c in list {
            let swift = storeAnswer(c)
            XCTAssertEqual(swift, c.removes, "\(c.name): LedgerStore.removes differs from the fixture")
            let args = try JSONSerialization.data(withJSONObject: [c.held, c.incoming], options: [.fragmentsAllowed])
            guard let bundle = await bundleAnswer(c.name, String(decoding: args, as: UTF8.self)) else { continue }
            XCTAssertEqual(bundle, c.removes, "\(c.name): the bundle rule differs from the fixture")
            XCTAssertEqual(swift, bundle, "\(c.name): LedgerStore.removes and the bundle rule disagree")
        }
    }

    /// LedgerStore.removes asks the bundle on the VersionStore it is given. The probe is the real rules.js
    /// plus one override that answers true. On an empty ledger the Swift answer is false, so a true here
    /// can only come from the bundle. The same override pattern is in TallyModelTests.probeBundle.
    func testRemovesAsksTheBundleItIsGiven() throws {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = PhotoTestKit.runFolder.appending(path: "removes-probe-\(UUID().uuidString).js")
        try (real + "\n;Rules.removesSomething=function(){return true};\n")
            .write(to: probe, atomically: true, encoding: .utf8)
        let direct = try RulesCore(bundleURL: probe).call("removesSomething", "[{},{}]")
        XCTAssertEqual(direct, "true", "the probe bundle is not live: removesSomething on an empty pair did not answer true")
        let versions = VersionStore(
            directory: PhotoTestKit.runFolder.appending(path: "removes-probe-versions"), now: { 0 }, rulesURL: probe)
        let store = LedgerStore(
            fileURL: PhotoTestKit.runFolder.appending(path: "ledger.json"), now: { 0 }, versions: versions)
        store.doc = [:]
        XCTAssertTrue(store.removes([:]),
                      "LedgerStore.removes answered in Swift, not from the rulesURL of the VersionStore it was given")
    }
}
