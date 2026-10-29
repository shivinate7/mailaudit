// Shared set-up for the bulk-check-in cases: Mark all received, Clear check-ins and the Undo of a Mark all
// (undo-removes-only-its-delta, recent-checks-can-be-undone, rules-run-in-javascriptcore).
//
// The rules have one home, src/view-rules.mjs, pinned by V39 in test/view-rules.test.mjs (the contract is stated at the
// top of that file). Swift reads them from rules.js and keeps no copy:
//   bulkApply(items, on, received) -> received      bulkTakes(items, received) -> [{itemKey, take, qty}]
//   undoBulk(takes, received) -> received           totalsOf(items, received).got -> the Clear ask's N
//
// The model calls the builder adds. The cases below call them through the protocols here, so they compile before the
// build and fail on a throw that names the missing call. Each requirement has a default that throws BulkNotBuilt. A method
// of the same name and signature on the model satisfies the requirement and wins over the default, so the builder
// deletes nothing. A different signature (a return value, another label) leaves the default in place and the cases
// fail with the same message, so the signatures are part of the contract:
//   PackagesModel.bulk(gk: String, on: Bool) async throws     the package's lines, on: each to its qty, off: each cleared
//   PackagesModel.undoBulk() async throws                     takes back the last Mark all's delta; nothing to undo is a no-op
//   TallyModel.bulk(name: String, on: Bool) async throws      EVERY copy of the product (item.items), the filtered ones too
//   TallyModel.undoBulk() async throws                        as PackagesModel's
// Rulings the cases carry, from the spec of the step and the web (src/app.jsx bulkSet, undoAssign):
//   - One bulk is one LedgerStore save and one clock reading: every key of the package gets the same receivedAt, the
//     ones the press leaves as they were included (the web's single touchReceived call stamps every key).
//   - The model holds one Undo entry, for the last Mark all. A Clear, a check-in or a stamp on this device, and a newer bulk,
//     end it. A write the model did not make (a Worker apply, simulated here by writing the store) does not.
//   - Undo takes back the press's own delta (V39), writes the keys it changes at the time of the undo, and bumps the
//     store's generation. An un-check needs a fresh receivedAt to beat an older check on another device.
//
// Fake fixtures only. LiveFixture (TallyPackagesLiveItemsTests.swift) builds the ledgers.

import Foundation
import XCTest
@testable import ManifestKit

struct BulkNotBuilt: Error, CustomStringConvertible {
    let call: String
    var description: String { "\(call) is not built, or its signature is not the one in BulkSupport.swift" }
}

@MainActor
protocol PackagesBulking: AnyObject {
    func bulk(gk: String, on: Bool) async throws
    func undoBulk() async throws
}

extension PackagesBulking {
    func bulk(gk: String, on: Bool) async throws { throw BulkNotBuilt(call: "PackagesModel.bulk(gk:on:)") }
    func undoBulk() async throws { throw BulkNotBuilt(call: "PackagesModel.undoBulk()") }
}

extension PackagesModel: PackagesBulking {}

@MainActor
protocol TallyBulking: AnyObject {
    func bulk(name: String, on: Bool) async throws
    func undoBulk() async throws
}

extension TallyBulking {
    func bulk(name: String, on: Bool) async throws { throw BulkNotBuilt(call: "TallyModel.bulk(name:on:)") }
    func undoBulk() async throws { throw BulkNotBuilt(call: "TallyModel.undoBulk()") }
}

extension TallyModel: TallyBulking {}

/// The model as the protocol, so a call reaches the model's own method when it has one and the default when it has not.
@MainActor func bulking(_ m: PackagesModel) -> any PackagesBulking { m }
@MainActor func bulking(_ m: TallyModel) -> any TallyBulking { m }

/// One rules call on the real bundle, the JSON result decoded. A thrown error is a failed assertion, not a crash, so a rule
/// the bundle does not export yet fails its own case. StampRulesTests.rule was this function and now calls it. The `rule` helpers
/// of PackagesRulesTests and HandRulesBundleTests return the JSON text, and PackageCardRulesTests takes an array of arguments:
/// other shapes, so they stay as they are.
func bundleRule(_ name: String, _ args: String, file: StaticString = #filePath, line: UInt = #line) async -> Any? {
    do {
        let text = try await RulesEngine(bundleURL: RulesGoldenTests.bundleURL).call(name, args)
        return try JSONSerialization.jsonObject(with: Data(text.utf8), options: [.fragmentsAllowed])
    } catch {
        XCTFail("\(name) threw \(error)", file: file, line: line)
        return nil
    }
}

/// Undo takes back a press's own delta and leaves a later edit alone. It is one rule on two models, so the sequence has
/// one home and each model's test file calls it with its own press and undo (the way StepperSupport does for the stepper).
///
/// press (at time 1000), then `later` written straight to the store at 2000 (a count of 0 is an un-check): the owner's
/// hand edit or a Worker apply, which the model did not make and so does not end the Undo. Then undo at 3000. The ledger
/// must equal `expect`. A snapshot restore would bring back what the press found: a line the owner un-checked after it, and
/// it would lose a key checked after it. `restamped` is a key the undo changed: its receivedAt moves to the undo's time.
@MainActor
func assertBulkUndoKeepsLaterEdits(
    store: LedgerStore, clock: PressClock, press: () async throws -> Void, undo: () async throws -> Void,
    later: [String: Int], expect: [String: Int], restamped: String, file: StaticString = #filePath, line: UInt = #line
) async throws {
    clock.t = 1_000
    try await press()
    clock.t = 2_000
    for (key, count) in later.sorted(by: { $0.key < $1.key }) { try store.commitReceived(key, count: count) }
    let generation = store.generation
    clock.t = 3_000

    try await undo()

    XCTAssertEqual(store.received(), expect, "undo must take back only what the press added, and keep the later edits", file: file, line: line)
    XCTAssertGreaterThan(store.generation, generation, "an undo bumps the generation the sync client reads", file: file, line: line)
    let stamped = (store.snapshot()["receivedAt"] as? [String: Any])?[restamped] as? Double
    XCTAssertEqual(stamped, 3_000, "a key the undo changed carries the time of the undo, so the un-check beats an older check", file: file, line: line)
}
