// Lane N13, tokens (shared-tokens-and-fixtures). Swift decodes shared/tokens.json, and
// every token must equal the file, like the web's test 60.4. Red first: this file does
// not compile until ManifestKit gains Palette, and the missing symbol is the only error.
//
// The API the builder provides, in ManifestKit (pure Foundation, no SwiftUI):
//
//   public struct Palette: Equatable, Sendable {
//       public struct RGBA: Equatable, Sendable {
//           public let red: UInt8, green: UInt8, blue: UInt8   // 0...255
//           public let alpha: Double                           // 0...1, and a hex value is 1
//           /// "#RRGGBB" in either case, or "rgba(r,g,b,a)". Throws on anything else.
//           public init(parsing text: String) throws
//       }
//       /// Every token in the file, by its key. Nothing is hard-coded: decode reads the keys it is given.
//       public let tokens: [String: RGBA]
//       /// Throws on JSON that is not an object of strings, and on a value that is not a colour.
//       public static func decode(_ data: Data) throws -> Palette
//   }
//
// The SwiftUI Color accessors sit on top of this, in the app. The app bundles
// shared/tokens.json and passes its Data to decode. Fake data only.

import Foundation
import XCTest
@testable import ManifestKit

/// What a token text must decode to, parsed here and not by the code under test.
private struct Want {
    let r: Int, g: Int, b: Int
    let a: Double

    init?(_ text: String) {
        if text.hasPrefix("#") {
            guard text.count == 7, let v = Int(text.dropFirst(), radix: 16) else { return nil }
            (r, g, b, a) = (v >> 16 & 255, v >> 8 & 255, v & 255, 1)
        } else if text.hasPrefix("rgba("), text.hasSuffix(")") {
            let p = text.dropFirst(5).dropLast().split(separator: ",", omittingEmptySubsequences: false)
            guard p.count == 4, let r = Int(p[0]), let g = Int(p[1]), let b = Int(p[2]), let a = Double(p[3])
            else { return nil }
            (self.r, self.g, self.b, self.a) = (r, g, b, a)
        } else {
            return nil
        }
    }

    init(_ c: Palette.RGBA) {
        (r, g, b, a) = (Int(c.red), Int(c.green), Int(c.blue), c.alpha)
    }

    func matches(_ o: Want) -> Bool {
        r == o.r && g == o.g && b == o.b && abs(a - o.a) < 1e-9
    }
}

final class PaletteTests: XCTestCase {
    static let tokensURL = LedgerStoreTests.root.appending(path: "shared/tokens.json")

    private func fileData() throws -> Data { try Data(contentsOf: Self.tokensURL) }

    private func json(_ data: Data) throws -> [String: String] {
        try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: String])
    }

    /// Token names that differ, sorted. A name held on one side only differs, so a dropped
    /// or an invented token is named too.
    private func diff(_ palette: Palette, _ file: [String: String]) -> [String] {
        Set(palette.tokens.keys).union(file.keys).filter { name in
            guard let have = palette.tokens[name], let text = file[name], let want = Want(text) else { return true }
            return !Want(have).matches(want)
        }.sorted()
    }

    // MARK: 60.4, the decoded palette equals the file

    func testDecodedPaletteDeepEqualsTheTokensFile() throws {
        let data = try fileData()
        let file = try json(data)
        XCTAssertFalse(file.isEmpty, "an empty file would make the comparison vacuous")
        let palette = try Palette.decode(data)
        XCTAssertEqual(diff(palette, file), [], "tokens that differ from shared/tokens.json")
    }

    // MARK: 60.5 and 60.6, a changed value is caught

    func testDecodeReadsTheDataItIsGivenAndHoldsNoCopy() throws {
        var drifted = try json(fileData())
        drifted["paper"] = "#00FF00"
        drifted["probeOnly"] = "rgba(1,2,3,0.5)"
        let palette = try Palette.decode(JSONSerialization.data(withJSONObject: drifted))
        let paper = try XCTUnwrap(palette.tokens["paper"])
        XCTAssertTrue(Want(paper).matches(Want("#00FF00")!), "paper must follow the data")
        let probe = try XCTUnwrap(palette.tokens["probeOnly"], "a key the file never held must still decode")
        XCTAssertTrue(Want(probe).matches(Want("rgba(1,2,3,0.5)")!))
        XCTAssertEqual(diff(palette, drifted), [], "the drifted data decodes to itself")
    }

    func testComparatorNamesAChangedDroppedAndInventedToken() throws {
        let data = try fileData()
        let file = try json(data)
        let palette = try Palette.decode(data)
        var changed = file
        changed["paper"] = "#00FF00"
        XCTAssertEqual(diff(palette, changed), ["paper"], "a changed hex")
        changed = file
        changed["shadow"] = "rgba(28,43,36,0.07)"
        XCTAssertEqual(diff(palette, changed), ["shadow"], "a changed alpha, same bytes")
        changed = file
        changed["ink"] = nil
        XCTAssertEqual(diff(palette, changed), ["ink"], "a token the file dropped")
        changed = file
        changed["extra"] = "#010203"
        XCTAssertEqual(diff(palette, changed), ["extra"], "a token the file gained")
    }

    // MARK: parsing, in the two shapes the file holds

    func testParsesHexInEitherCase() throws {
        for text in ["#F2E9DA", "#f2e9da"] {
            let c = try Palette.RGBA(parsing: text)
            XCTAssertEqual([c.red, c.green, c.blue], [0xF2, 0xE9, 0xDA], text)
            XCTAssertEqual(c.alpha, 1, text)
        }
        let black = try Palette.RGBA(parsing: "#000000")
        let white = try Palette.RGBA(parsing: "#FFFFFF")
        XCTAssertEqual([black.red, black.green, black.blue], [0, 0, 0])
        XCTAssertEqual([white.red, white.green, white.blue], [255, 255, 255])
    }

    func testParsesRgbaWithItsAlpha() throws {
        let c = try Palette.RGBA(parsing: "rgba(28,43,36,0.06)")
        XCTAssertEqual([c.red, c.green, c.blue], [28, 43, 36])
        XCTAssertEqual(c.alpha, 0.06, accuracy: 1e-9)
        XCTAssertEqual(try Palette.RGBA(parsing: "rgba(0,0,0,1)").alpha, 1, accuracy: 1e-9)
        XCTAssertEqual(try Palette.RGBA(parsing: "rgba(255,255,255,0)").alpha, 0, accuracy: 1e-9)
    }

    func testRefusesATextItCannotReadAsAColour() {
        for text in ["", "red", "#12345", "#GGGGGG", "rgba(1,2,3)", "rgba(256,0,0,1)"] {
            XCTAssertThrowsError(try Palette.RGBA(parsing: text), "\(text) is not a colour the file may hold")
        }
    }

    func testDecodeRefusesAFileThatIsNotATokenObject() {
        let bad = ["not json", "[1,2]", "{\"paper\": 5}", "{\"paper\": \"nope\"}"]
        for text in bad {
            XCTAssertThrowsError(try Palette.decode(Data(text.utf8)), "decoded \(text)")
        }
    }
}
