// Proves the sweep in PhotoTestKit.sweepRunFolders: an old sibling run folder goes, a new one
// stays, a folder not named like a run folder is never touched, and the keep folder stays even
// when it is older than the sweep age. The backdated keep folder is the case only the keep rule
// protects, so this test goes red when that rule is removed.

import Foundation
import XCTest

final class RunFolderSweepTests: XCTestCase {
    func testSweepRemovesOldSiblingAndKeepsNewOneOtherAndOldOwn() throws {
        let root = try PhotoTestKit.tempDir("sweep")
        let now = Date()
        let twoDaysAgo = now.addingTimeInterval(-2 * 24 * 60 * 60)
        let old = root.appending(path: "101-\(UUID().uuidString)", directoryHint: .isDirectory)
        let new = root.appending(path: "102-\(UUID().uuidString)", directoryHint: .isDirectory)
        let own = root.appending(path: "103-\(UUID().uuidString)", directoryHint: .isDirectory)
        let other = root.appending(path: "keep-me", directoryHint: .isDirectory)
        for dir in [old, new, own, other] {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        for dir in [old, own, other] {
            try FileManager.default.setAttributes([.modificationDate: twoDaysAgo], ofItemAtPath: dir.path)
        }

        PhotoTestKit.sweepRunFolders(root: root, keep: own, now: now)

        XCTAssertFalse(FileManager.default.fileExists(atPath: old.path), "an old sibling run folder is removed")
        XCTAssertTrue(FileManager.default.fileExists(atPath: new.path), "a new sibling run folder is kept")
        XCTAssertTrue(FileManager.default.fileExists(atPath: own.path), "the keep folder is kept, though it is older than the sweep age")
        XCTAssertTrue(FileManager.default.fileExists(atPath: other.path), "a folder not named like a run folder is kept")
    }
}
