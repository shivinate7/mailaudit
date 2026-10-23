// Lane N13, a light-only interface (owner ruling 2026-10-22: parchment always, no dark
// variant). UIUserInterfaceStyle Light in Info.plist holds the app to its paper. The
// plist is generated from project.yml by xcodegen (make archive), so project.yml must
// carry the key too, or the next generate drops it. Both read real files, no device.

import Foundation
import XCTest

final class InterfaceStyleTests: XCTestCase {
    private let native = LedgerStoreTests.root.appending(path: "native")

    func testInfoPlistHoldsTheInterfaceToLight() throws {
        let data = try Data(contentsOf: native.appending(path: "Manifest/Info.plist"))
        let plist = try XCTUnwrap(
            PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any])
        XCTAssertEqual(plist["CFBundleDisplayName"] as? String, "MANIFEST", "the plist read works")
        XCTAssertEqual(plist["UIUserInterfaceStyle"] as? String, "Light")
    }

    /// An exact whole-line match, so a comment line that names the key cannot satisfy it.
    func testProjectYmlCarriesTheLightStyleForXcodegen() throws {
        let text = try String(contentsOf: native.appending(path: "project.yml"), encoding: .utf8)
        let lines = text.split(whereSeparator: \.isNewline).map { $0.trimmingCharacters(in: .whitespaces) }
        let accepted: Set<String> = [
            "UIUserInterfaceStyle: Light", "UIUserInterfaceStyle: \"Light\"", "UIUserInterfaceStyle: 'Light'",
        ]
        XCTAssertTrue(lines.contains(where: accepted.contains), "no info.properties line sets UIUserInterfaceStyle: Light")
    }
}
