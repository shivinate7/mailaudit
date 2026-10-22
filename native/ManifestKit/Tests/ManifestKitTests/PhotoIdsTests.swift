// Photo id keep-or-drop tests (lane N10, photo-ids-restore-keep-if-known, photo-ids-unreadable-local).
//
// Owner ruling 2026-10-15: a restore drops an envelope photo id that this device does not hold. A merge
// and a server apply keep every id. A store that cannot be read keeps every id on a restore too:
// unreadable is not empty. The web rule lives inline in applyBackup (src/app.jsx), so it is not in the
// rules bundle, and the native rule is this one function. The callers are lanes N9 (a milestone restore)
// and N4a (a server apply); this lane builds the rule and leaves the calls to them.
//
// Contract the tests name:
//   public enum PhotoApply: Equatable, Sendable { case restore, sync }   // sync: a merge or a server apply
//   public enum PhotoIds {
//       /// `held` is PhotoStore.heldIds(): nil when the store cannot be read.
//       public static func kept(_ ids: [String], held: Set<String>?, on kind: PhotoApply) -> [String]
//   }
//
// Red-first: see PhotoStubs.swift.

import XCTest
@testable import ManifestKit

final class PhotoIdsTests: XCTestCase {
    func testARestoreDropsAnIdThisDeviceDoesNotHoldAndKeepsTheOrder() {
        let kept = PhotoIds.kept(["pho-c", "pho-a", "pho-b"], held: ["pho-a", "pho-c"], on: .restore)

        XCTAssertEqual(kept, ["pho-c", "pho-a"])
    }

    /// A store that is readable and empty holds nothing, so a restore drops every id.
    func testARestoreOnAnEmptyStoreDropsEveryId() {
        XCTAssertEqual(PhotoIds.kept(["pho-a", "pho-b"], held: [], on: .restore), [])
    }

    /// Unreadable is not empty: a store that cannot answer keeps every id.
    func testARestoreWithAnUnreadableStoreKeepsEveryId() {
        XCTAssertEqual(PhotoIds.kept(["pho-a", "pho-b"], held: nil, on: .restore), ["pho-a", "pho-b"])
    }

    /// A merge and a server apply keep every id. The holder's blob may reach this device later.
    func testAServerApplyKeepsEveryIdWhateverTheStoreHolds() {
        XCTAssertEqual(PhotoIds.kept(["pho-a", "pho-b"], held: ["pho-a"], on: .sync), ["pho-a", "pho-b"])
        XCTAssertEqual(PhotoIds.kept(["pho-a", "pho-b"], held: [], on: .sync), ["pho-a", "pho-b"])
        XCTAssertEqual(PhotoIds.kept(["pho-a", "pho-b"], held: nil, on: .sync), ["pho-a", "pho-b"])
    }
}
