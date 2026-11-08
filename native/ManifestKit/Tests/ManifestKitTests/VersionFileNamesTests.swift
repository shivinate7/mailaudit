// Version file names. The versions folder's names freeze on first ship (decision
// native-files-are-frozen): a renamed file hides the versions a device holds. The other version
// tests go through put, list and data, so none reads the folder. This one reads it, and pins the
// file pair, the id shape, and the whole milliseconds of the injected clock.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

final class VersionFileNamesTests: XCTestCase {
    /// 2023-11-14T22:13:20.123Z, with a fraction. The id takes the whole milliseconds, so the digits
    /// are 1700000000123 and not a rounded 1700000000124.
    static let fractionalNow: Double = 1_700_000_000_123.7

    func testPutLeavesOnlyTheBinAndJsonNamedByTheIdInTheFolder() throws {
        let box = try makeVersionSandbox()
        box.clock.t = Self.fractionalNow
        let rec = try box.versions().put(Data("{}".utf8), label: "before reset")

        // Scope first: what is on disk, read without the store.
        let names = try FileManager.default.contentsOfDirectory(atPath: box.versionsURL.path)
        XCTAssertEqual(names.count, 2, "a put leaves exactly two files in the versions folder")
        let stem = names.first.map { ($0 as NSString).deletingPathExtension } ?? ""
        XCTAssertEqual(Set(names), [stem + ".bin", stem + ".json"], "the pair is <id>.bin and <id>.json")
        XCTAssertEqual(stem, rec.id, "the files are named by the id that put returns")

        guard let m = stem.wholeMatch(of: /v(\d+)-[0-9a-f]{8}/) else {
            XCTFail("the id \(stem) is not the letter v, digits, a dash and 8 lowercase hex digits")
            return
        }
        XCTAssertEqual(String(m.1), "1700000000123", "the id digits are the whole milliseconds of the clock")

        let json = (try? Data(contentsOf: box.versionsURL.appending(path: stem + ".json")))
            .flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        XCTAssertEqual(json?["id"] as? String, stem, "the .json holds an id key equal to the file stem")
    }

    /// The versions folder is named "versions" beside ledger.json (native-files-are-frozen). The app
    /// builds it alone, so no other test holds the name.
    func testTheFolderIsVersionsBesideTheLedger() {
        let support = URL(filePath: "/tmp/Application Support/dev.shivinate.manifest", directoryHint: .isDirectory)
        let ledger = support.appending(path: "ledger.json")
        let folder = VersionStore.folder(besideLedger: ledger)

        XCTAssertEqual(folder.path, support.appending(path: "versions").path, "the folder is named versions and sits beside ledger.json")
        XCTAssertTrue(folder.hasDirectoryPath, "the folder is a directory URL, not a file")
    }
}
