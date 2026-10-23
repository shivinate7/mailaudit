// Package card text forms, through the rules bundle (lane N15, native-build-lanes,
// rules-run-in-javascriptcore, order-id-button-stops-propagate).
//
// The pill, the item detail line and the TCGplayer order URL have one home: src/view-rules.mjs,
// pinned by test/view-rules.test.mjs (V17 to V19). The web card calls the same functions. Swift
// reaches them through RulesEngine, so these cases read the bundled rules.js in JavaScriptCore
// and copy no rule. JavaScriptCore is a second runtime: its toLocaleString, its UTF-8 round
// trip and the JSON marshalling of null are what the cases below add to the JS ones.
//
// Red-first. Until the builder adds the exports and runs `npm run build`, which regenerates
// native/ManifestKit/Sources/ManifestKit/rules.js, each call throws unknownFunction and the
// case fails on an XCTFail. This file compiles on the base.
//
// Contract the tests name (exports in src/view-rules.mjs):
//   packagePill(items, received) -> "N left · $X" | null   null when no copy is owed
//   itemDetail(item) -> String                             "×2 · set · finish · condition", or "—"
//   tcgplayerOrderUrl(orderId) -> String
//
// Every expected string was produced by running the web card's own expression on the same
// input (src/app.jsx PackageCard, ItemRow, tcgplayerOrderUrl), not worked out by hand.
// U+00B7 is the middle dot, U+00D7 the times sign, U+2014 the em dash. Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

final class PackageCardRulesTests: XCTestCase {
    static let orders = "https://store.tcgplayer.com/myaccount/orderhistory?SearchString="

    /// One rules call, decoded from JSON. A thrown error is reported as a failure, not a crash.
    func rule(_ name: String, _ args: [Any], line: UInt = #line) async -> Any? {
        do {
            let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
            let data = try JSONSerialization.data(withJSONObject: args, options: [.fragmentsAllowed])
            let out = try await engine.call(name, String(decoding: data, as: UTF8.self))
            return try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed])
        } catch {
            XCTFail("\(name) threw \(error)", line: line)
            return nil
        }
    }

    func entry(_ key: String, _ qty: Int, _ price: Double) -> [String: Any] { ["key": key, "qty": qty, "price": price] }

    var card: [[String: Any]] { [entry("a", 1, 1), entry("b", 1, 2), entry("c", 2, 0.5)] }

    /// The pill for these lines, as a String, or "null" when the bundle gives null.
    func pill(_ items: [[String: Any]], _ received: [String: Int] = [:], line: UInt = #line) async -> String? {
        let out = await rule("packagePill", [items, received], line: line)
        if out is NSNull { return "null" }
        return out as? String
    }

    // MARK: packagePill

    func testPillCountsCopiesAndCentsUnderAHundred() async {
        let d = "\u{00B7}"
        let cases: [([String: Int], String)] = [
            ([:], "4 left \(d) $4.00"),           // nothing in
            (["b": 1], "3 left \(d) $2.00"),      // the $2 line is in
            (["c": 1], "3 left \(d) $3.50"),      // one of two copies in: N counts copies
            (["c": 5], "2 left \(d) $3.00"),      // an over-count clamps per line
            (["zzz": 4], "4 left \(d) $4.00"),    // a key the package does not hold
        ]
        for (received, want) in cases {
            let got = await pill(card, received)
            XCTAssertEqual(got, want, "packagePill with received \(received)")
        }
    }

    /// Nothing owed gives null, never "0 left". The web shows RECEIVED then.
    func testPillIsNullWhenNothingIsOwed() async {
        let all = await pill(card, ["a": 1, "b": 1, "c": 2])
        XCTAssertEqual(all, "null", "every copy in must give null, not a 0 left pill")
        let over = await pill(card, ["a": 9, "b": 9, "c": 9])
        XCTAssertEqual(over, "null", "an over-count on every line must give null")
        let empty = await pill([])
        XCTAssertEqual(empty, "null", "a package with no lines must give null")
    }

    /// From $100 the cents go and the figure is grouped. JavaScriptCore does the grouping here,
    /// so a device-locale toLocaleString would show in this runtime and not in Node.
    func testPillWholeDollarsAndGroupingFromAHundred() async {
        let d = "\u{00B7}"
        let cases: [(Double, String)] = [
            (99.99, "1 left \(d) $99.99"),
            (99.5, "1 left \(d) $99.50"),
            (100, "1 left \(d) $100"),
            (100.4, "1 left \(d) $100"),
            (100.5, "1 left \(d) $101"),          // rounds up, where a half-even port prints $100
            (1234.56, "1 left \(d) $1,235"),
            (12345, "1 left \(d) $12,345"),
        ]
        for (price, want) in cases {
            let got = await pill([entry("x", 1, price)])
            XCTAssertEqual(got, want, "packagePill for one line at \(price)")
        }
        let two = await pill([entry("x", 2, 60)])
        XCTAssertEqual(two, "2 left \(d) $120", "two copies at $60 add to $120")
    }

    // MARK: itemDetail

    func item(_ qty: Int, _ set: String, _ finish: String, _ condition: String) -> [String: Any] {
        ["key": "k", "qty": qty, "set": set, "finish": finish, "condition": condition]
    }

    func testDetailLineIsSetFinishConditionWithTheCountFirst() async {
        let d = " \u{00B7} ", x = "\u{00D7}"
        let cases: [([String: Any], String)] = [
            (item(1, "Alpha", "Foil", "Near Mint"), "Alpha\(d)Foil\(d)Near Mint"),
            (item(2, "Alpha", "Foil", "Near Mint"), "\(x)2\(d)Alpha\(d)Foil\(d)Near Mint"),
            (item(3, "Alpha", "", "Near Mint"), "\(x)3\(d)Alpha\(d)Near Mint"),   // an empty part leaves no separator
            (item(1, "", "", "Near Mint"), "Near Mint"),
            (item(1, "", "Foil", ""), "Foil"),
            (item(1, "", "", ""), "\u{2014}"),                                      // nothing to say: an em dash
            (item(2, "", "", ""), "\(x)2"),                                         // the count alone, no dash
        ]
        for (input, want) in cases {
            let got = await rule("itemDetail", [input]) as? String
            XCTAssertEqual(got, want, "itemDetail for \(input)")
        }
    }

    // MARK: tcgplayerOrderUrl

    func testOrderUrlEscapesLikeEncodeURIComponent() async {
        let cases: [(String, String)] = [
            ("025F898A-605522-F2EDE", "025F898A-605522-F2EDE"),   // the owner's example id
            ("A&B=C", "A%26B%3DC"),
            ("a+b", "a%2Bb"),                                      // a raw + reads as a space on the server
            ("a b", "a%20b"),
            ("a/b?c#d", "a%2Fb%3Fc%23d"),
            ("50%", "50%25"),
            ("\u{00E9}", "%C3%A9"),
            ("\u{65E5}\u{672C}", "%E6%97%A5%E6%9C%AC"),
            ("it's (x)!~*_.-", "it's%20(x)!~*_.-"),               // the marks encodeURIComponent leaves alone
            ("", ""),
        ]
        for (id, want) in cases {
            let got = await rule("tcgplayerOrderUrl", [id]) as? String
            XCTAssertEqual(got, Self.orders + want, "tcgplayerOrderUrl(\(id.debugDescription))")
        }
    }
}
