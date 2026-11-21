// A Find query typed while a Packages reload is in flight. load() builds its rows from the query in force when it
// starts, then awaits the per-package refresh before it sets them. A setQuery that lands during that await must still
// decide the rows. The gated rules bundle holds the reload inside its refresh, so a case types while the reload is
// suspended, then lets the reload finish.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PackagesReloadRaceTests: XCTestCase {
    /// A model over the golden ledger copied into this run's folder. The rules bundle is gated on packagePill, the call only a
    /// load's refresh makes, after its filter has built the rows. The gate starts open, so the first load passes through.
    func makeModel() throws -> (model: PackagesModel, engine: RulesEngine) {
        let dir = try PhotoTestKit.tempDir("packages-reload")
        addTeardownBlock { try? FileManager.default.removeItem(at: dir) }
        let file = dir.appending(path: "ledger.json")
        try FileManager.default.copyItem(at: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"), to: file)
        let store = LedgerStore(fileURL: file, now: { PhotoTestKit.t0 })
        try store.load()
        let engine = try RulesEngine(bundleURL: try gatedRulesBundle(in: dir, wrapping: "packagePill", when: "true"))
        let pass = RulesCallGate()
        pass.open()
        try installGate(pass, on: engine)
        return (PackagesModel(engine: engine, store: store), engine)
    }

    /// A reload is held inside its refresh when the owner types "Urza". Only Delta Cards holds "Urza's Saga", so the query
    /// leaves one package. The reload then finishes: the rows must follow the query typed during it, not the one it began with.
    func testReloadInFlightKeepsTheQueryTypedDuringIt() async throws {
        let (model, engine) = try makeModel()
        try await model.load()
        XCTAssertEqual(model.rows.count, 4, "the setup is real: the list shows all four golden packages before the reload")

        let gate = RulesCallGate()
        addTeardownBlock { gate.open() }
        try installGate(gate, on: engine)
        let reload = Task { try await model.load() }
        try await eventually { gate.entered }
        XCTAssertTrue(gate.entered, "the setup is real: the reload is held inside its package refresh")

        let typed = Task { try await model.setQuery("Urza") }
        try await eventually { model.query == "Urza" }
        gate.open()
        try await reload.value
        try await typed.value

        XCTAssertEqual(model.rows.map(\.gk), ["D1::Delta Cards"],
                       "rows must follow the query typed during a reload: the reload set rows for the query it began with")
    }

    /// The same query with no reload in flight. Green on the old code, so the rows the race case expects are the rows this
    /// query gives when nothing else is in the way.
    func testQueryTypedWithNoReloadInFlightShowsItsRows() async throws {
        let (model, _) = try makeModel()
        try await model.load()
        try await model.setQuery("Urza")
        XCTAssertEqual(model.rows.map(\.gk), ["D1::Delta Cards"], "a typed query shows the one package whose item it names")
    }
}
