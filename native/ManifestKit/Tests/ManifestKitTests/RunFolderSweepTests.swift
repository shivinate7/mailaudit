// Proves the sweep in RunFolder (test-temp-standard): an old sibling run folder goes, a new one
// and the run's own folder stay, and a folder not named like a run folder is never touched.

import Foundation
import XCTest

final class RunFolderSweepTests: XCTestCase {
    func testSweepRemovesOldSiblingAndKeepsNewOneAndOwn() throws {
        let root = try RunFolder.fresh("sweep")
        let now = Date()
        let old = root.appending(path: "101-\(UUID().uuidString)", directoryHint: .isDirectory)
        let new = root.appending(path: "102-\(UUID().uuidString)", directoryHint: .isDirectory)
        let own = root.appending(path: "103-\(UUID().uuidString)", directoryHint: .isDirectory)
        let other = root.appending(path: "keep-me", directoryHint: .isDirectory)
        for dir in [old, new, own, other] {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        let twoDaysAgo = now.addingTimeInterval(-2 * 24 * 60 * 60)
        try FileManager.default.setAttributes([.modificationDate: twoDaysAgo], ofItemAtPath: old.path)
        try FileManager.default.setAttributes([.modificationDate: twoDaysAgo], ofItemAtPath: other.path)

        RunFolder.sweep(root: root, keep: own, now: now)

        XCTAssertFalse(FileManager.default.fileExists(atPath: old.path), "an old sibling run folder is removed")
        XCTAssertTrue(FileManager.default.fileExists(atPath: new.path), "a new sibling run folder is kept")
        XCTAssertTrue(FileManager.default.fileExists(atPath: own.path), "the run's own folder is kept")
        XCTAssertTrue(FileManager.default.fileExists(atPath: other.path), "a folder not named like a run folder is kept")
    }
}
