// The bundle must run restampRestore, because the native restore calls it on every restore (decision
// `a-restore-is-not-local`; debt `native-restore-later-reply-unpinned`). The web's own test pins one
// receivedAt value of that rule (test/recent-rules.test.mjs). The stamp and envelope parts are pinned
// here, through the bundle the app ships.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

/// Main actor for the same reason as the oracle: the ledger dictionaries stay on one isolation.
@MainActor
final class RestampBundleTests: XCTestCase {
    /// One check-in on each side, a stamp and an envelope only the current ledger holds, and a restore
    /// time of 9000. Every check-in key of either ledger takes the restore time. A stamp or envelope the
    /// version lacks becomes a blank stamp or a tombstone at that time.
    func testBundleExportsRestampRestoreAndGivesEachChangeTheRestoreTime() async {
        let now: Double = 9_000
        let envelope: [String: Any] = ["id": "e9", "createdAt": 1, "updatedAt": 5, "note": "",
                                       "photos": [String](), "entries": [Any]()]
        let stamp: [String: Any] = ["kind": "sent", "note": "", "at": "2026-08-01", "updatedAt": 5]
        let cur: [String: Any] = [
            "received": ["A1|0|pLightningBolt": 1] as [String: Int],
            "receivedAt": [String: Int](),
            "stamps": ["A1::Alpha Cards": stamp] as [String: Any],
            "envelopes": [envelope],
        ]
        let data: [String: Any] = [
            "received": ["B1|0|pLightningBolt": 2] as [String: Int],
            "receivedAt": ["B1|0|pLightningBolt": 7] as [String: Int],
            "stamps": [String: Any](),
            "envelopes": [Any](),
        ]
        let tombstone: [String: Any] = ["id": "e9", "createdAt": 1, "note": "", "updatedAt": 9_000,
                                        "deletedAt": 9_000, "entries": [Any](), "photos": [Any]()]
        let expected: [String: Any] = [
            "receivedAt": ["A1|0|pLightningBolt": 9_000, "B1|0|pLightningBolt": 9_000] as [String: Int],
            "stamps": ["A1::Alpha Cards": ["kind": "", "note": "", "at": "", "updatedAt": 9_000] as [String: Any]]
                as [String: Any],
            "envelopes": [tombstone],
        ]

        guard let out = await RestampOracle.restamp(cur, data, now) else { return }
        RestampOracle.assertSame(out, expected, "restampRestore")
    }

    /// Two empty ledgers have no time to give and no tombstone to make, so the answer is empty.
    func testBundleRestampOfTwoEmptyLedgersIsEmpty() async {
        guard let out = await RestampOracle.restamp([:], [:], 9_000) else { return }
        let empty: [String: Any] = ["receivedAt": [String: Int](), "stamps": [String: Any](),
                                    "envelopes": [Any]()]
        RestampOracle.assertSame(out, empty, "restampRestore of two empty ledgers")
    }
}
