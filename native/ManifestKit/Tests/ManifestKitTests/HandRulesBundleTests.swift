// Card in Hand bridge (duo-hand-rules, rules-run-in-javascriptcore).
//
// handHits, handStep and pastTransit have one home: src/view-rules.mjs, pinned by
// test/view-rules.test.mjs (V30 to V34). Swift reaches them through RulesEngine, so this case
// reads the bundled rules.js and copies no rule. The contract is stated at the top of the V30
// block in that file.
//
// Red-first. The bundle has none of the three exports until the builder adds them and runs
// `npm run build`. Until then each call throws unknownFunction, and the case fails on an XCTFail
// that names the missing export.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

final class HandRulesBundleTests: XCTestCase {
    /// One rules call. A thrown error is reported as a failure, not a crash.
    func rule(_ name: String, _ args: String) async -> String? {
        do {
            let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
            return try await engine.call(name, args)
        } catch {
            XCTFail("\(name) threw \(error)")
            return nil
        }
    }

    /// The result re-written with sorted keys, so the expected text does not depend on key order.
    func canonical(_ text: String?) -> String? {
        guard let text, let data = text.data(using: .utf8),
              let value = try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]),
              let out = try? JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed, .sortedKeys])
        else { return nil }
        return String(data: out, encoding: .utf8)
    }

    /// Two Lightning Bolt envelopes: Alpha (07-01), which also holds Path to Exile, and Beta (07-02).
    static let items = """
    [
     {"key":"A1|0|pLightning Bolt","orderId":"A1","seller":"Alpha Cards","name":"Lightning Bolt","set":"","condition":"","finish":"","qty":1,"price":1,"date":"2026-07-01","tracking":"with tracking","line":"Magic"},
     {"key":"A1|1|pPath to Exile","orderId":"A1","seller":"Alpha Cards","name":"Path to Exile","set":"","condition":"","finish":"","qty":1,"price":1,"date":"2026-07-01","tracking":"with tracking","line":"Magic"},
     {"key":"B1|0|pLightning Bolt","orderId":"B1","seller":"Beta Games","name":"Lightning Bolt","set":"","condition":"","finish":"","qty":1,"price":1,"date":"2026-07-02","tracking":"with tracking","line":"Magic"}
    ]
    """

    /// One untracked Lightning Bolt from Gamma, ordered 2026-07-01, read at 2026-07-31T12:00:00Z.
    static let transitItems = """
    [{"key":"C1|0|pLightning Bolt","orderId":"C1","seller":"Gamma Cards","name":"Lightning Bolt","set":"","condition":"","finish":"","qty":1,"price":1,"date":"2026-07-01","tracking":"without tracking","line":"Magic"}]
    """

    /// handHits(items, query, received, refundedGks); Sets cross as {"$set": [...]}.
    static let hitsArgs = "[\(HandRulesBundleTests.items),\"bolt\",{},{\"$set\":[]}]"
    /// handStep(items, received, refundedGks, held, typed): a name two envelopes share, nothing held.
    static let stepArgs = "[\(HandRulesBundleTests.items),{},{\"$set\":[]},null,\"Lightning Bolt\"]"
    /// pastTransit(items, received, stampedGks, now).
    static let transitArgs = "[\(HandRulesBundleTests.transitItems),{},{\"$set\":[]},1785499200000]"

    /// Each of the three hand rules is in the bundle, and each gives the value the Node cases pin.
    func testBundleExportsHandRules() async {
        let hits = await rule("handHits", Self.hitsArgs)
        if let hits {
            XCTAssertEqual(canonical(hits), "[\"B1::Beta Games\",\"A1::Alpha Cards\"]",
                           "handHits must list both Lightning Bolt packages, newest order first")
        }

        let step = await rule("handStep", Self.stepArgs)
        if let step {
            XCTAssertEqual(canonical(step), #"{"action":"hold","gk":null,"held":"lightning bolt","plan":null}"#,
                           "handStep must hold a name two open envelopes share, with no plan")
        }

        let transit = await rule("pastTransit", Self.transitArgs)
        if let transit {
            XCTAssertEqual(canonical(transit), #"[{"claimBy":"2026-07-31","days":30,"gk":"C1::Gamma Cards","tier":"deadline"}]"#,
                           "pastTransit must list a 30-day order as deadline, claim by 30 days on")
        }
    }
}
