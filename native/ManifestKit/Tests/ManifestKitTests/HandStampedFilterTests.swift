// Card in Hand with the stamped filter on (stamped-filter-on-the-pipeline; debt hand-reads-stamped-filter-rows).
//
// Card in Hand draws an envelope's lines from PackagesModel: the per-line maps (labels, details, readouts) and the two
// writers a line calls (toggle for a tap, step for the stepper). With the stamped filter on, `rows` is the stamped list
// alone. toggleStamped says it "changes the list, not the counts", so a line the filter hides is still a live line
// of the ledger, and Card in Hand can name its envelope (HandModel reads the store, not `rows`). These cases pin the
// model half of the fix: with the filter on, a hidden live line still checks in, steps, and has the same line text
// it has with the filter off.
//
// Not pinned here: which list Card in Hand reads its envelopes and its count line from. No unit name is ruled for it, so the
// builder picks one. DuoHandUITests pins the screen (the envelope shows, and the count line holds every live copy).
//
// LiveFixture (TallyPackagesLiveItemsTests.swift) builds the ledger. Its base ledger holds E1 with an "other" stamp, so the
// stamped list is E1 alone. A1 / Seller A (a1, a2), R1 / Seller S (s1) and F1 are live and unstamped, so the filter hides them.
// a2 holds two copies, so it has a readout and a stepper. s1 holds one copy and none is in.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class HandStampedFilterTests: XCTestCase {
    static let e1 = "E1::Seller E"

    /// Live lines the filter hides: s1 holds one copy, a2 two. Neither is in at rest (LiveFixture.received).
    static let hidden = ["s1", "a2"]

    /// A loaded model over the base ledger, and its store, with the stamped filter off.
    func makeModel() async throws -> (model: PackagesModel, store: LedgerStore) {
        let engine = try LiveFixture.engine()
        let store = try await LiveFixture.store(items: LiveFixture.base, stamps: LiveFixture.baseStamps, engine: engine)
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()
        return (model, store)
    }

    /// The model with the filter turned on. The anchors fail first when the fixture, not the model, is what moved.
    func filterOn(_ model: PackagesModel) async throws {
        XCTAssertEqual(model.rows.count, 4, "anchor: the filter off lists the four live packages")
        try await model.toggleStamped()
        XCTAssertTrue(model.showStamped, "anchor: the filter is on")
        XCTAssertEqual(model.rows.map(\.gk), [Self.e1], "anchor: the stamped list holds E1 alone")
    }

    /// A tap on a line the filter hides checks it in: the count is written, and the line's own text follows it.
    /// Today toggle looks the key up in `rows`, finds nothing, and returns with no write and no error.
    func testATapOnAHiddenLineChecksItIn() async throws {
        let (model, store) = try await makeModel()
        try await filterOn(model)
        XCTAssertNil(store.received()["s1"], "anchor: s1 is not in at rest")

        try await model.toggle(key: "s1")

        XCTAssertEqual(store.received()["s1"], 1, "a tap on a live line the stamped filter hides wrote nothing")
        XCTAssertNil(model.checkInError, "the tap reported an error")
        XCTAssertEqual(model.labels["s1"], "1 of 1", "the hidden line's label did not follow its check-in")
    }

    /// The stepper on a line the filter hides steps it, and the readout follows. The step is the other writer that reads `rows`.
    func testAStepOnAHiddenLineStepsIt() async throws {
        let (model, store) = try await makeModel()
        try await filterOn(model)
        XCTAssertNil(store.received()["a2"], "anchor: a2 is not in at rest")

        await model.step(key: "a2", by: 1)

        XCTAssertEqual(store.received()["a2"], 1, "a step on a live line the stamped filter hides wrote nothing")
        XCTAssertEqual(model.readouts["a2"], "1/2", "the hidden line's readout did not follow its step")
    }

    /// The line text Card in Hand draws for a hidden line is the text it has with the filter off. load() fills each map
    /// for the listed lines only, so with the filter on the hidden lines have none: no label, no detail line, and no
    /// stepper for a line of two copies.
    func testTheLineTextOfAHiddenLineIsTheTextTheFilterOffGives() async throws {
        let (model, _) = try await makeModel()
        let (labels, details, readouts) = (model.labels, model.details, model.readouts)
        XCTAssertEqual(labels["s1"], "0 of 1", "anchor: the filter off labels s1")
        XCTAssertEqual(readouts["a2"], "0/2", "anchor: the filter off reads a2 as 0/2")
        XCTAssertFalse(details["s1"]?.isEmpty ?? true, "anchor: the filter off gives s1 a detail line")

        try await filterOn(model)

        for key in Self.hidden {
            XCTAssertEqual(model.labels[key], labels[key], "the filter changed the label of the hidden line \(key)")
            XCTAssertEqual(model.details[key], details[key], "the filter changed the detail line of the hidden line \(key)")
            XCTAssertEqual(model.readouts[key], readouts[key], "the filter changed the readout of the hidden line \(key)")
        }
    }
}
