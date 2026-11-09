// The bulk rules in the bundle (Mark all received, Clear check-ins, the Undo of a Mark all; undo-removes-only-its-delta,
// recent-checks-can-be-undone, rules-run-in-javascriptcore).
//
// The Node cases V39 in test/view-rules.test.mjs pin the rules. These cases read the same exports from rules.js, the file
// the app ships, through the engine the app uses, and expect the values V39 pins. A rule that is in view-rules.mjs but not
// in the built bundle, or that JavaScriptCore reads differently, fails here. The contract (names, shapes) is the header of
// BulkSupport.swift. The model cases (PackageBulkModelTests, TallyBulkModelTests) prove the models call these and keep no
// copy.
//
// Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class BulkRulesTests: XCTestCase {
    /// V39's CARD: a (qty 1), b (qty 1), c (qty 2).
    static let card = #"[{"key":"a","qty":1,"price":1},{"key":"b","qty":1,"price":2},{"key":"c","qty":2,"price":0.5}]"#

    func counts(_ out: Any?) -> [String: Int]? { out as? [String: Int] }

    /// V39.1 to V39.7: Mark all writes each line's qty and keeps a stray key; Clear deletes each line's key, never stores 0.
    func testTheBundleExportsBulkApply() async {
        let on = await bundleRule("bulkApply", "[\(Self.card),true,{\"a\":1,\"c\":1}]")
        XCTAssertEqual(counts(on), ["a": 1, "b": 1, "c": 2], "bulkApply on: every line to its qty (V39.1b)")
        let stray = await bundleRule("bulkApply", "[\(Self.card),true,{\"zzz\":3,\"c\":5}]")
        XCTAssertEqual(counts(stray), ["a": 1, "b": 1, "c": 2, "zzz": 3], "bulkApply on keeps a key that is no line and lowers an over-count (V39.2, V39.3)")
        let off = await bundleRule("bulkApply", "[\(Self.card),false,{\"a\":1,\"b\":1,\"c\":1,\"zzz\":3}]")
        XCTAssertEqual(counts(off), ["zzz": 3], "bulkApply off deletes every line's key and keeps the stray one, no stored 0 (V39.4)")
    }

    /// V39.9: a Mark all adds qty minus the count in now, clamped, one entry per line it adds to. A line with nothing to add may
    /// be left out or listed with take 0, so the cases keep the entries with a take.
    func testTheBundleExportsBulkTakes() async throws {
        func takes(_ received: String) async throws -> [String] {
            let out = await bundleRule("bulkTakes", "[\(Self.card),\(received)]")
            let list = try XCTUnwrap(out as? [[String: Any]], "bulkTakes gave no list")
            return list.filter { ($0["take"] as? Int ?? 0) > 0 }
                .map { "\($0["itemKey"] as? String ?? "?")=\($0["take"] as? Int ?? -1)/\($0["qty"] as? Int ?? -1)" }
        }
        let fresh = try await takes("{}")
        XCTAssertEqual(fresh, ["a=1/1", "b=1/1", "c=2/2"], "nothing in: every line's qty is taken (V39.9a)")
        let part = try await takes(#"{"a":1,"c":1}"#)
        XCTAssertEqual(part, ["b=1/1", "c=1/2"], "a line in takes nothing, a part-in line takes the rest (V39.9b)")
        let over = try await takes(#"{"a":1,"b":1,"c":5}"#)
        XCTAssertEqual(over, [], "every line in or over: nothing taken, no negative take (V39.9c)")
    }

    /// V39.10, V39.11, V39.17: undo subtracts the press's take, deletes a key at 0, and leaves a key it has no take for.
    func testTheBundleExportsUndoBulk() async {
        let all = await bundleRule("undoBulk", #"[[{"itemKey":"a","take":1,"qty":1},{"itemKey":"c","take":2,"qty":2}],{"a":1,"c":2,"zzz":3}]"#)
        XCTAssertEqual(counts(all), ["zzz": 3], "undo takes back the press and deletes the keys that reach 0 (V39.10, V39.14)")
        let half = await bundleRule("undoBulk", #"[[{"itemKey":"c","take":1,"qty":2}],{"c":2}]"#)
        XCTAssertEqual(counts(half), ["c": 1], "2 minus the 1 the press took is 1 (V39.11)")
        let clamped = await bundleRule("undoBulk", #"[[{"itemKey":"c","take":1,"qty":2}],{"c":5}]"#)
        XCTAssertEqual(counts(clamped), ["c": 2], "a count over qty is clamped to qty (V39.13)")
        // V39.17b: the press took b and half of c. The owner then un-checked a and checked zzz.
        let edited = await bundleRule("undoBulk", #"[[{"itemKey":"b","take":1,"qty":1},{"itemKey":"c","take":1,"qty":2}],{"b":1,"c":2,"zzz":1}]"#)
        XCTAssertEqual(counts(edited), ["c": 1, "zzz": 1], "a hand edit made after the press survives the undo (V39.17b)")
    }

    /// V39.8: the Clear ask's N is totalsOf's got. It counts copies, not lines and not totalQty: a (1) and c (2) in is 3.
    func testTheClearAsksNIsTheCopiesInNow() async throws {
        let mixed = await bundleRule("totalsOf", "[\(Self.card),{\"a\":1,\"c\":2,\"zzz\":4}]")
        let totals = try XCTUnwrap(mixed as? [String: Any], "totalsOf gave no object")
        XCTAssertEqual(totals["got"] as? Int, 3, "N is the copies in now: 3, not the 2 lines in and not totalQty 4 (V39.8a)")
        let overCount = await bundleRule("totalsOf", "[\(Self.card),{\"c\":5}]")
        let over = try XCTUnwrap(overCount as? [String: Any], "totalsOf gave no object")
        XCTAssertEqual(over["got"] as? Int, 2, "an over-count clamps to the line's qty (V39.8b)")
    }
}
