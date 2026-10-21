// Backup export tests (lane N8, native-build-lanes, backup-files-restore-two-ways,
// the-token-is-a-credential, recovery-control-not-state-gated).
//
// The Backup control hands the system one JSON file. These tests pin the bytes in it.
//
// Red-first. The builder adds this in native/ManifestKit/Sources/ManifestKit/:
//   public struct BackupFile: Equatable, Sendable {
//       public let name: String   // "mailday-backup-YYYY-MM-DD.json", the UTC date of the store's clock
//       public let data: Data
//       public init(name: String, data: Data)
//   }
//   extension LedgerStore {
//       /// A loaded store: the whole raw document as it stands in memory, serialized as
//       /// save() does (sorted keys, no photos). It reads memory, not the file. It writes
//       /// nothing and does not touch `generation`.
//       /// A store that is not loaded (never loaded, or the last load threw): the bytes of
//       /// the file at fileURL, exactly as they are. Throws when that file cannot be read.
//       public func backup() throws -> BackupFile
//   }
// Until BackupFile and backup() exist this file does not compile. The stub the builder
// starts from returns wrong values, so each case fails on an XCTAssert and not on a
// compile error (testing-throwing-assert-bad-kill).
//
// Orchestrator defaults this file takes, for the owner to overrule:
//   - A refused load still backs up the file bytes as they are. The web build does the same
//     (src/app.jsx `backup`: "export the saved text as it is"), and Backup has no data gate.
//   - The file name is the web name, and the date is the UTC date, as the web's toISOString.
//   - Photos are not in the native backup yet (lane N10 owns them).
//
// Every key here is fake. FakeKeychain stands in for the Keychain.

import Foundation
import XCTest
@testable import ManifestKit

final class BackupExportTests: XCTestCase {
    static let fakeKey = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d"
    static let checkedKey = "A1|0|pLightningBolt"
    /// 2026-10-21T02:00:00Z. On a host west of UTC the local date is still 2026-10-20.
    static let nowMs: Double = 1_792_548_000_000

    // MARK: helpers

    func freshDir() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "n8-backup-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    /// The shared fixture ledger (12 items, no `mailday`), plus whatever `extra` adds.
    func writeLedger(_ extra: [String: Any] = [:]) throws -> URL {
        let fixture = RulesGoldenTests.root.appending(path: "shared/fixtures/ledger.json")
        var obj = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: fixture)) as? [String: Any])
        for (k, v) in extra { obj[k] = v }
        let url = try freshDir().appending(path: "ledger.json")
        try JSONSerialization.data(withJSONObject: obj).write(to: url)
        return url
    }

    func loaded(_ url: URL) throws -> LedgerStore {
        let store = LedgerStore(fileURL: url, now: { Self.nowMs })
        try store.load()
        return store
    }

    func parse(_ data: Data) throws -> [String: Any] {
        try XCTUnwrap(try JSONSerialization.jsonObject(with: data) as? [String: Any], "the backup is not a JSON object")
    }

    // MARK: the bytes are the snapshot

    /// After a save, the backup bytes are the ledger file's bytes. A field the client does
    /// not name rides along, and a ledger with no `mailday` exports `mailday:1`.
    func testExportBytesEqualTheSavedSnapshot() throws {
        let url = try writeLedger(["savedAt": 1_786_000_000_000, "zzFutureField": ["a": [1, 2, 3]]])
        let store = try loaded(url)
        try store.commitReceived(Self.checkedKey, count: 1)

        let file = try store.backup()

        XCTAssertEqual(file.data, try Data(contentsOf: url), "the backup bytes differ from the saved ledger bytes")
        XCTAssertEqual(try store.backup().data, file.data, "two backups of one state differ")
        let obj = try parse(file.data)
        XCTAssertEqual(obj["mailday"] as? Int, 1, "the backup lacks mailday:1")
        XCTAssertEqual((obj["items"] as? [Any])?.count, 12, "the backup lacks the items")
        XCTAssertEqual((obj["received"] as? [String: Int])?[Self.checkedKey], 1, "the backup lacks the check-in")
        XCTAssertNotNil(obj["zzFutureField"], "the backup dropped a field the client does not name")
        XCTAssertEqual(obj["savedAt"] as? Int, 1_786_000_000_000, "the backup dropped savedAt")
    }

    /// The backup is the state in memory. An edit that has not been saved yet is in it,
    /// and taking the backup writes nothing and moves nothing.
    func testExportCarriesEditsThatAreNotSavedAndChangesNothing() throws {
        let envelope: [String: Any] = ["id": "e1", "entries": [["name": "Lightning Bolt", "qty": 1]], "photos": [], "updatedAt": 1]
        let url = try writeLedger(["envelopes": [envelope]])
        let store = try loaded(url)
        store.setReceived(Self.checkedKey, count: 2)
        store.setStamp("A1::Alpha Cards", kind: "refund", note: "n", at: "2026-10-01")
        store.discardEnvelope("e1")
        let onDiskBefore = try Data(contentsOf: url)
        let generationBefore = store.generation

        let obj = try parse(try store.backup().data)

        XCTAssertEqual((obj["received"] as? [String: Int])?[Self.checkedKey], 2, "the backup lacks an unsaved check-in")
        let stamp = (obj["stamps"] as? [String: Any])?["A1::Alpha Cards"] as? [String: Any]
        XCTAssertEqual(stamp?["kind"] as? String, "refund", "the backup lacks an unsaved stamp")
        let tomb = (obj["envelopes"] as? [[String: Any]])?.first
        XCTAssertNotNil(tomb?["deletedAt"], "the backup lacks an unsaved envelope tombstone")
        XCTAssertEqual(try Data(contentsOf: url), onDiskBefore, "taking a backup wrote the ledger file")
        XCTAssertEqual(store.generation, generationBefore, "taking a backup moved the generation")
    }

    /// The web name, and the UTC date of the store's clock.
    func testBackupNameIsTheWebNameWithTheUTCDate() throws {
        let store = try loaded(try writeLedger())
        XCTAssertEqual(try store.backup().name, "mailday-backup-2026-10-21.json")
    }

    // MARK: a backup restores

    /// The export loads as a ledger with nothing dropped and no kept copy, and a backup of
    /// the restored store is the same bytes. The web picker reads this file through the same
    /// salvageLedger rule that load calls.
    func testExportRestoresAsALedgerWithNothingDropped() throws {
        let src = try loaded(try writeLedger(["zzFutureField": "kept"]))
        try src.commitReceived(Self.checkedKey, count: 1)
        let file = try src.backup()

        let dir = try freshDir()
        let url = dir.appending(path: "ledger.json")
        try file.data.write(to: url)
        let restored = try loaded(url)

        XCTAssertEqual(restored.droppedCount, 0, "a fresh backup lost entries on restore")
        let kept = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasPrefix("ledger.kept-") }
        XCTAssertEqual(kept, [], "a fresh backup was copied as damaged")
        XCTAssertEqual(restored.received(), [Self.checkedKey: 1])
        XCTAssertEqual(restored.items().count, 12)
        XCTAssertEqual(try restored.backup().data, file.data, "export, restore, export changed the bytes")
    }

    // MARK: a refused load is still backed up

    /// A load that throws leaves the file as it was, and Backup hands over those bytes.
    func testRefusedLoadStillExportsTheFileAsItIs() throws {
        let cases: [(String, String)] = [
            ("invalid JSON", #"{"mailday":1,"items":["#),
            ("mailday other than 1", #"{"mailday":2,"items":[],"received":{"k":1}}"#),
            ("a top level that is a list", #"[1,2,3]"#),
        ]
        for (name, text) in cases {
            let dir = try freshDir()
            let url = dir.appending(path: "ledger.json")
            try Data(text.utf8).write(to: url)
            let store = LedgerStore(fileURL: url, now: { Self.nowMs })
            XCTAssertThrowsError(try store.load(), "\(name): load should refuse")

            XCTAssertEqual(try store.backup().data, Data(text.utf8), "\(name): the backup is not the file as it is")
            XCTAssertEqual(try store.backup().name, "mailday-backup-2026-10-21.json", "\(name): wrong file name")
        }
    }

    /// No file and no ledger: there is nothing to back up, and the backup says so.
    func testBackupOfAMissingFileThrows() throws {
        let store = LedgerStore(fileURL: try freshDir().appending(path: "ledger.json"), now: { Self.nowMs })
        XCTAssertThrowsError(try store.backup(), "a backup of nothing must not be an empty file")
    }

    // MARK: no key in the export (the-token-is-a-credential)

    /// A key stored through KeyIntake must not reach the backup file, its name, or the store.
    func testNoKeyInTheBackupExport() async throws {
        let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
        let keys = KeyStore(service: "test.manifest.n8.backup", account: "device-key", backend: FakeKeychain())
        let link = try XCTUnwrap(URL(string: "manifestledger://sync#k=\(Self.fakeKey)"))
        let outcome = await KeyIntake.accept(link, engine: engine, store: keys)
        XCTAssertEqual(outcome, .stored, "the fake key must be stored, or the scan proves nothing")
        XCTAssertTrue(keys.hasKey())

        let store = try loaded(try writeLedger())
        try store.commitReceived(Self.checkedKey, count: 1)
        let file = try store.backup()

        XCTAssertGreaterThan(file.data.count, 100, "the export is empty, so the scan proves nothing")
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: file), "the backup file holds the key")
        XCTAssertFalse(String(decoding: file.data, as: UTF8.self).contains(Self.fakeKey), "the backup bytes hold the key")
        XCTAssertFalse(file.name.contains(Self.fakeKey), "the backup name holds the key")
        XCTAssertFalse(mirrorFinds(Self.fakeKey, in: store), "the store holds the key")
    }

    // MARK: positive controls for the scan

    /// The scan must see a key inside a BackupFile's Data, or the test above proves nothing.
    func testMirrorScanFindsKeyInsideABackupFile() {
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: BackupFile(name: "x.json", data: Data(Self.fakeKey.utf8))))
    }

    /// A key sitting in a field the client does not name rides through the export, and the
    /// scan finds it there. This shows the export is the raw document, not a typed subset.
    func testMirrorScanFindsKeyPlantedInAnUnknownLedgerField() throws {
        let store = try loaded(try writeLedger(["zzNote": Self.fakeKey]))
        XCTAssertTrue(mirrorFinds(Self.fakeKey, in: try store.backup()))
    }
}
