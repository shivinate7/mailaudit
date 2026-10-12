// Packages check-in toggle through the bundle (lane N5, rules-run-in-javascriptcore,
// no-native-dialogs, never-drop-an-item-silently).
//
// PackagesModel.toggle(key:) asks the bundle's toggleCount for the count to write, and
// writes it through checkIn. The probe below proves that: the bundle is the real
// rules.js plus an override that returns a sentinel. If the model copied the rule
// instead of calling the bundle, the sentinel would never reach the store.
//
// A failed save is surfaced: PackagesModel.checkInError holds the message, so the view
// can show it. The view's `try?` is what drops it today.
//
// The names PackagesModel.toggle(key:) and PackagesModel.checkInError exist now.
// The fault cases at the end (toggle rule throws or returns a non-integer; label
// refresh fails after a good save) are red: the toggle fault leaves checkInError nil,
// and the refresh fault leaves checkInError nil after the save clears it.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PackagesToggleTests: XCTestCase {
    static let checkedKey = "A1|0|pLightningBolt"
    static let sentinel = 777

    func freshLedgerURL() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n5-toggle-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "ledger.json")
        try FileManager.default.copyItem(
            at: RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json"), to: url)
        return url
    }

    /// The real bundle, with toggleCount overridden to return a sentinel.
    func sentinelBundle() throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = FileManager.default.temporaryDirectory
            .appending(path: "n5-toggle-probe-\(UUID().uuidString).js")
        let override = "\n;Rules.toggleCount=function(){return \(Self.sentinel)};\n"
        try (real + override).write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }

    /// The model's toggle writes the bundle's count, not a count the model worked out.
    func testToggleWritesTheCountTheBundleGives() async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: try sentinelBundle())
        try store.load()
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()

        try await model.toggle(key: Self.checkedKey)

        XCTAssertEqual(store.received()[Self.checkedKey], Self.sentinel,
                       "toggle wrote a count the bundle did not give")
        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        let received = try XCTUnwrap(obj["received"] as? [String: Any])
        XCTAssertEqual(received[Self.checkedKey] as? Int, Self.sentinel, "the saved file did not take the bundle's count")
    }

    /// A failed save is kept on the model, so the view can show it.
    func testFailedSaveSurfacesTheError() async throws {
        let url = try freshLedgerURL()
        let dir = url.deletingLastPathComponent()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        try store.load()
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()
        XCTAssertNil(model.checkInError, "no error before any check-in")

        try FileManager.default.setAttributes([.posixPermissions: 0o555], ofItemAtPath: dir.path)
        defer { try? FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path) }
        do {
            try await model.checkIn(key: Self.checkedKey, count: 1)
            XCTFail("a check-in must throw when the save fails")
        } catch {}

        XCTAssertNotNil(model.checkInError, "a failed save must leave an error the view can show")

        // A later save that works clears the error.
        try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir.path)
        try await model.checkIn(key: Self.checkedKey, count: 1)
        XCTAssertNil(model.checkInError, "a successful save must clear the error")
    }

    /// The real bundle with `override` appended. The override reassigns the global
    /// `Rules` object, so the glue reads the replaced functions.
    func overriddenBundle(_ override: String) throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = FileManager.default.temporaryDirectory
            .appending(path: "n5-toggle-fault-\(UUID().uuidString).js")
        try (real + "\n" + override + "\n").write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }

    /// A toggle whose rule throws changes nothing, and the failure reaches checkInError.
    func testToggleRuleThrowSurfacesErrorAndKeepsRows() async throws {
        try await assertToggleFaultSurfaces(
            "Rules=Object.assign({},Rules,{toggleCount:function(){throw new Error('toggle boom')}});")
    }

    /// A toggle whose rule returns a non-integer is refused the same way.
    func testToggleRuleNonIntegerSurfacesErrorAndKeepsRows() async throws {
        try await assertToggleFaultSurfaces(
            "Rules=Object.assign({},Rules,{toggleCount:function(){return 1.5}});")
    }

    func assertToggleFaultSurfaces(_ override: String) async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: try overriddenBundle(override))
        try store.load()
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()
        let rowsBefore = model.rows
        let receivedBefore = store.received()
        XCTAssertNil(model.checkInError, "no error before the toggle")

        do {
            try await model.toggle(key: Self.checkedKey)
            XCTFail("a toggle whose rule fails must throw")
        } catch {}

        XCTAssertNotNil(model.checkInError, "a failed toggle rule must surface checkInError")
        XCTAssertEqual(model.rows, rowsBefore, "a failed toggle must leave the rows unchanged")
        XCTAssertEqual(store.received(), receivedBefore, "a failed toggle must write nothing")
    }

    /// A label refresh that fails after a good save surfaces an error. The save stands.
    func testLabelRefreshFailureAfterGoodSaveSurfacesError() async throws {
        let url = try freshLedgerURL()
        let store = LedgerStore(fileURL: url, now: { 1_786_543_380_000 })
        let engine = try RulesEngine(bundleURL: try overriddenBundle(
            "var __realCountLabel=Rules.countLabel;"
            + "Rules=Object.assign({},Rules,{countLabel:function(r,q){"
            + "if(r>0)throw new Error('label boom');return __realCountLabel(r,q);}});"))
        try store.load()
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()
        XCTAssertNil(model.checkInError, "no error before the check-in")

        do {
            try await model.checkIn(key: Self.checkedKey, count: 1)
            XCTFail("a label refresh that fails must throw")
        } catch {}

        let obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        let received = try XCTUnwrap(obj["received"] as? [String: Any])
        XCTAssertEqual(received[Self.checkedKey] as? Int, 1, "the save before the refresh must stand")
        XCTAssertNotNil(model.checkInError, "a label refresh failure after a good save must surface checkInError")
    }
}
