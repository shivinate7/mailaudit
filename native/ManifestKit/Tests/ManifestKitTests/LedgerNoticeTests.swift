// Ledger notice tests (owner ruling 2026-10-12, "Keep a copy, then go on").
//
// After a damaged load the app shows one plain line. The line is built here, in
// ManifestKit, by a pure function the app calls. It names no sync words.
//
// Red-first. The builder adds this in native/ManifestKit/Sources/ManifestKit/:
//   public enum LedgerNotice {
//       /// nil when nothing was dropped; otherwise one plain sentence.
//       public static func damagedLine(dropped: Int) -> String?
//   }
// Until that exists this file does not compile. That compile error is the red proof.
//
// Fake fixtures only.

import XCTest
@testable import ManifestKit

final class LedgerNoticeTests: XCTestCase {
    /// No line when the last load dropped nothing.
    func testNoLineWhenNothingWasDropped() {
        XCTAssertNil(LedgerNotice.damagedLine(dropped: 0), "a clean load shows no line")
    }

    /// Plural count, one line, and the kept-copy promise.
    func testOneLineNamesTheCountAndTheKeptCopy() {
        XCTAssertEqual(
            LedgerNotice.damagedLine(dropped: 3),
            "3 entries could not be read; the original is kept on this device.",
            "three dropped entries give the plain line"
        )
    }

    /// Singular count reads as one entry.
    func testSingularCountReadsAsOneEntry() {
        XCTAssertEqual(
            LedgerNotice.damagedLine(dropped: 1),
            "1 entry could not be read; the original is kept on this device.",
            "one dropped entry gives the singular line"
        )
    }

    /// The line never names the sync path: no GitHub, token, remote, Worker or push words.
    func testLineNamesNoSyncWords() throws {
        let line = try XCTUnwrap(LedgerNotice.damagedLine(dropped: 3), "a damaged load has a line")
        let lower = line.lowercased()
        for word in ["github", "token", "remote", "worker", "push", "sync", "pull", "merge"] {
            XCTAssertFalse(lower.contains(word), "the notice must not mention \(word)")
        }
        XCTAssertFalse(line.contains("\n"), "the notice is one line")
    }
}
