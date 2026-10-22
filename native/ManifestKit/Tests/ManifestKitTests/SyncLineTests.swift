// Sync line tests (lane N4b, ruled-head-one-advisory-entrance, native-parity-table).
//
// The 401 and 413 advisory lines are in both clients. The wording of the native lines is not ruled
// (native-reply-waits-generation, Still open; the web copy is `syncSays` in src/app.jsx), so these
// tests pin what is ruled and nothing about the prose: a line exists for each failure, the two differ,
// no line shows without a failure, and the lines speak of the Worker only. The web guard
// (`NO_GITHUB_WORDS66`) fails on GitHub, push, pull, pulling, pulled, repo, private repo and your key.
// The screen is pinned in SyncAdvisoryUITests.

import XCTest
@testable import ManifestKit

final class SyncLineTests: XCTestCase {
    func testARefusedKeyAndATooBigLedgerEachHaveTheirOwnLineAndNoFailureHasNone() throws {
        XCTAssertNil(SyncLine.text(for: nil), "no failure, no line")
        let refused = try XCTUnwrap(SyncLine.text(for: "no-access"), "a 401 has a line")
        let big = try XCTUnwrap(SyncLine.text(for: "too-big"), "a 413 has a line")
        XCTAssertFalse(refused.isEmpty)
        XCTAssertFalse(big.isEmpty)
        XCTAssertNotEqual(refused, big, "the two failures are told apart")
    }

    func testTheLinesNameNoGitHubWord() throws {
        let banned = ["github", "push", "pull", "repo", "your key"]
        for code in ["no-access", "too-big"] {
            let line = try XCTUnwrap(SyncLine.text(for: code)).lowercased()
            for word in banned {
                XCTAssertFalse(line.contains(word), "the \(code) line must not say \"\(word)\": \(line)")
            }
        }
    }
}
