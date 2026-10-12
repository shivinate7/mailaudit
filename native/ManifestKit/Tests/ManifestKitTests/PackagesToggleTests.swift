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
// Red-first. These names do not exist yet: PackagesModel.toggle(key:) and
// PackagesModel.checkInError. Until the builder adds them the target does not compile,
// so this file's reds are a compile error on the missing names. The builder's stub
// turns each into an XCTAssert red.
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
}
