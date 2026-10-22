// Server apply tests (lane N4b, photo-ids-restore-keep-if-known, undo-removes-only-its-delta,
// auto-apply-happens-now).
//
// Two rules that no code path can break by adding a wait, so both tests pin an outcome and are green
// on main. They stay in the lane because a wrong wiring turns them red:
//
// - PhotoIds.kept is the rule: a restore drops a photo id this device does not hold, a server apply
//   keeps every id. The N4b server apply must call it with `.sync`. On `.sync` the call is the
//   identity, so no test sees the call itself. The test sees its outcome: a reply that names a photo
//   this device does not hold keeps the id, whether the store is empty or cannot be read. A wiring
//   that passes `.restore`, or reads an unreadable store as empty, drops the id and the blob can
//   never be fetched.
// - An open Undo bar never holds a reply (owner ruling 2026-10-21 13:30 CDT), and the apply keeps the
//   bar. Undo subtracts its own delta, so after the apply it removes only its own change and keeps the
//   other device's check-in. The client has no input from the Undo bar, so nothing holds on it.

import Foundation
import XCTest
@testable import ManifestKit

final class SyncApplyKeepsTests: SyncTestCase {
    func photoEnvelope(_ photos: [String]) -> [String: Any] {
        ["id": "e1", "createdAt": 1_000, "updatedAt": 5_000, "note": "",
         "entries": [["name": "Lightning Bolt", "qty": 1]], "photos": photos]
    }

    func photoIds(_ store: LedgerStore) -> [String]? {
        (store.snapshot()["envelopes"] as? [[String: Any]])?.first { ($0["id"] as? String) == "e1" }?["photos"] as? [String]
    }

    // The store holds no photo, and the reply names two. Both ids stay.
    func testAServerReplyKeepsAPhotoIdThisDeviceDoesNotHold() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let folder = dir.appending(path: "photos", directoryHint: .isDirectory)
        client.photoStore = PhotoStore(folder: folder, engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL))
        net.enqueue(ok(try ledger(extra: ["envelopes": [photoEnvelope(["pho-aaa-1", "pho-bbb-2"])]]), rev: 2))

        let outcome = await client.pull()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(photoIds(store), ["pho-aaa-1", "pho-bbb-2"], "a server apply keeps every id")
        let saved = (try readSaved()["envelopes"] as? [[String: Any]])?.first?["photos"] as? [String]
        XCTAssertEqual(saved, ["pho-aaa-1", "pho-bbb-2"], "and so does the file")
    }

    // A folder that cannot be listed is unknown, and unknown is not empty (photo-ids-unreadable-local).
    func testAnUnreadablePhotoStoreKeepsEveryIdToo() async throws {
        let store = try makeStore()
        let client = try makeClient(store)
        let folder = dir.appending(path: "photos", directoryHint: .isDirectory)
        try Data("not a folder".utf8).write(to: folder)
        client.photoStore = PhotoStore(folder: folder, engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL))
        net.enqueue(ok(try ledger(extra: ["envelopes": [photoEnvelope(["pho-aaa-1"])]]), rev: 2))

        let outcome = await client.pull()
        XCTAssertEqual(outcome, .applied)
        XCTAssertEqual(photoIds(store), ["pho-aaa-1"])
    }

    // An Undo bar is open. A reply from the other device applies at once, with no press near. Undo then
    // removes only what the assign took and keeps the other device's check-in.
    func testAnOpenUndoNeverHoldsAReplyAndUndoKeepsTheOtherDevicesCheckIn() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Counterspell", 1)])]])
        let (model, store) = try await box.open()
        try await model.assign(envelope: "e1", to: OrphanedSandbox.a1)
        XCTAssertNotNil(model.undo, "anchor: the Undo bar is open")
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.a1Counter: 1], "anchor: the assign was written")

        // What the Worker answers: this device's data, plus the other device's check-in.
        var merged = store.snapshot()
        var received = merged["received"] as? [String: Any] ?? [:]
        var receivedAt = merged["receivedAt"] as? [String: Any] ?? [:]
        received[OrphanedSandbox.c1Bolt] = 1
        receivedAt[OrphanedSandbox.c1Bolt] = OrphanedSandbox.t0 + 500
        merged["received"] = received
        merged["receivedAt"] = receivedAt

        let rig = try await PressRig.make()
        let client = try makeHeldClient(store, rig: rig)
        net.enqueue(ok(merged, rev: 9))
        let pushed = await finish(start { await client.push() })
        XCTAssertEqual(pushed, .applied, "the Undo bar holds nothing")
        XCTAssertTrue(rig.sleeps.delays.isEmpty, "and the gate never waited")
        XCTAssertEqual(store.received()[OrphanedSandbox.c1Bolt], 1, "the other device's check-in arrived")
        XCTAssertNotNil(model.undo, "the apply keeps the bar")

        box.clock.t = OrphanedSandbox.t0 + 2_000
        try await model.undoAssign()
        XCTAssertEqual(try box.savedReceived(), [OrphanedSandbox.c1Bolt: 1], "Undo removed its own delta and kept the other device's")
    }
}
