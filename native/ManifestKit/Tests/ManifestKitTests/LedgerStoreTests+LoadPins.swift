// Load pins for native-ledger-is-raw-json and native-files-are-frozen. The kept copy's name carries
// whole milliseconds. A ledger.json that is not there makes load throw, and nothing is written.
// The cases extend LedgerStoreTests, so they share its folder, clock and store helpers.

import Foundation
import XCTest
@testable import ManifestKit

extension LedgerStoreTests {
    /// The kept copy is named from the store's clock in UTC: ISO 8601 with milliseconds, colons removed.
    /// t0 plus 125.25 ms is 2026-08-12T14:03:00.125Z, so the copy is ledger.kept-2026-08-12T140300.125Z.json.
    func testKeptCopyNameCarriesWholeMilliseconds() throws {
        try Data(#"{"mailday":1,"received":"x"}"#.utf8).write(to: fileURL)
        clock = Self.t0 + 125.25

        XCTAssertNoThrow(try makeStore().load(), "a damaged received loads after its copy is kept")
        XCTAssertEqual(try folderNames(), ["ledger.json", "ledger.kept-2026-08-12T140300.125Z.json"],
                       "the kept copy is named with whole milliseconds")
    }

    /// A missing ledger.json makes a cold load throw a Foundation error. The failed load leaves the store
    /// unloaded, so the save after it throws and creates no file.
    func testMissingLedgerFileOnColdLoadThrowsAndWritesNothing() throws {
        let store = makeStore()

        XCTAssertThrowsError(try store.load(), "a missing ledger.json makes load throw")
        XCTAssertThrowsError(try store.save(), "a save after the failed load throws")
        XCTAssertEqual(try folderNames(), [], "a failed load and a save leave the folder empty")
    }

    /// The same when a good load is followed by the file going missing. The failed reload leaves the store
    /// unloaded, so the save after it throws and does not write the old document back.
    func testMissingLedgerFileOnReloadThrowsAndWritesNothing() throws {
        try Data(#"{"mailday":1}"#.utf8).write(to: fileURL)
        let store = makeStore()
        try store.load()
        try FileManager.default.removeItem(at: fileURL)

        XCTAssertThrowsError(try store.load(), "a reload with ledger.json gone makes load throw")
        XCTAssertThrowsError(try store.save(), "a save after the failed reload throws")
        XCTAssertEqual(try folderNames(), [], "a failed reload and a save leave the folder empty")
    }

    /// Every name in the ledger folder, sorted.
    private func folderNames() throws -> [String] {
        try FileManager.default.contentsOfDirectory(atPath: dir.path).sorted()
    }
}
