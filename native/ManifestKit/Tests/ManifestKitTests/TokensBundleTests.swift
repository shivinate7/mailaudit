// Lane N13, one home for the palette (shared-tokens-and-fixtures). The app target bundles
// shared/tokens.json as a resource, the way it bundles shared/fixtures/ledger.json, and no
// second copy sits in the app or the package. Both checks read real files. The project.yml
// check is a whole-line match, so a comment line that names the path cannot satisfy it.

import Foundation
import XCTest

final class TokensBundleTests: XCTestCase {
    private let native = LedgerStoreTests.root.appending(path: "native")

    func testProjectYmlBundlesTheSharedTokensAsAResource() throws {
        let text = try String(contentsOf: native.appending(path: "project.yml"), encoding: .utf8)
        let lines = text.split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        let at = lines.firstIndex(of: "- path: ../shared/tokens.json")
        XCTAssertNotNil(at, "project.yml has no `- path: ../shared/tokens.json` line, as the ledger.json entry has")
        if let at {
            XCTAssertEqual(lines.dropFirst(at + 1).first, "buildPhase: resources")
        }
    }

    func testNoSecondCopyOfTheTokensSitsInTheAppOrPackage() {
        for dir in ["Manifest", "ManifestKit/Sources"] {
            let found = FileManager.default.enumerator(at: native.appending(path: dir), includingPropertiesForKeys: nil)?
                .compactMap { ($0 as? URL)?.lastPathComponent }
                .filter { $0 == "tokens.json" } ?? []
            XCTAssertEqual(found, [], "a copy of tokens.json under native/\(dir) is a second home")
        }
    }
}
