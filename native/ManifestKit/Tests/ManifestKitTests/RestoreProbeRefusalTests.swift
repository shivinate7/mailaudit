// A restore refuses when the rules bundle cannot run restampRestore (decision a-restore-is-not-local: the
// restore is a change made now, and the bundle gives its times). LedgerStore.restore calls the bundle
// before it spends the milestone, so a bundle that cannot run refuses the restore with nothing spent and
// nothing changed. The probe is the real rules.js with one override (RulesProbeBundle).
//
// Two ways the bundle cannot run: the rule is missing, or the rule throws. One case each, so a failure
// names its own cause. The scope line of each case proves the probe fails on a call first.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class RestoreProbeRefusalTests: XCTestCase {
    typealias Box = VersionSandbox

    /// A ledger over a version store whose rules bundle is `probe`, and one saved version to restore.
    /// The ledger is RestoreRestampTests' current ledger and the version its version, so both are full size.
    struct Refusal {
        let box: Box
        let store: LedgerStore
        let versions: VersionStore
        let versionID: String
        let probe: URL
    }

    /// What a refused restore must leave as it was: the milestones, the memory, the file and the generation.
    struct Before {
        let labels: [String]
        let memory: Data?
        let file: Data
        let generation: Int

        init(_ r: Refusal) throws {
            labels = try r.versions.list().map(\.label)
            memory = VersionSandbox.canon(r.store.snapshot())
            file = try Data(contentsOf: r.box.ledgerURL)
            generation = r.store.generation
        }
    }

    func makeRefusal(override: String) throws -> Refusal {
        let box = try makeVersionSandbox()
        let probe = try RulesProbeBundle.make(override)
        try box.write(try RestoreRestampTests.currentDoc())
        let versions = box.versions(rules: probe)
        let store = box.store(versions: versions)
        try store.load()
        let version = try versions.put(try Box.bytes(try RestoreRestampTests.versionDoc()), label: "before import")
        return Refusal(box: box, store: store, versions: versions, versionID: version.id, probe: probe)
    }

    /// The restore, which must throw. Returns the error it threw, or nil after one XCTFail when it went through.
    func restoreError(_ r: Refusal, file: StaticString = #filePath, line: UInt = #line) -> Error? {
        do {
            try r.store.restore(r.versionID)
            XCTFail("the restore went through although the bundle cannot run restampRestore", file: file, line: line)
            return nil
        } catch {
            return error
        }
    }

    /// Nothing changed: the milestones, the memory, the file and the generation are as `before` left them.
    func assertUnchanged(_ r: Refusal, _ before: Before, file: StaticString = #filePath, line: UInt = #line) throws {
        XCTAssertEqual(try r.versions.list().map(\.label), before.labels,
                       "the refused restore spent a milestone", file: file, line: line)
        XCTAssertEqual(VersionSandbox.canon(r.store.snapshot()), before.memory,
                       "the refused restore changed the ledger in memory", file: file, line: line)
        XCTAssertEqual(try Data(contentsOf: r.box.ledgerURL), before.file,
                       "the refused restore changed the ledger file", file: file, line: line)
        XCTAssertEqual(r.store.generation, before.generation,
                       "the refused restore moved the generation", file: file, line: line)
    }

    /// The bundle has no restampRestore. Scope: a call to it fails as a missing rule, so the restore is
    /// refused by the bundle, not by a Swift check.
    func testARestoreIsRefusedWhenTheBundleHasNoRestampRestore() throws {
        let r = try makeRefusal(override: "Rules.restampRestore=undefined")
        XCTAssertThrowsError(try RulesCore(bundleURL: r.probe).call("restampRestore", "[{},{},0]"),
                             "scope: the probe's restampRestore did not fail on a call")
        let before = try Before(r)

        let error = restoreError(r)

        XCTAssertEqual(error as? RulesFailure, RulesFailure.unknownFunction("restampRestore"),
                       "the restore did not fail on the missing restampRestore")
        try assertUnchanged(r, before)
    }

    /// The bundle's restampRestore throws. Scope: a call to it throws, so the restore is refused by the
    /// bundle, not by a Swift check.
    func testARestoreIsRefusedWhenRestampRestoreThrows() throws {
        let r = try makeRefusal(override: "Rules.restampRestore=function(){throw new Error(\"probe: restampRestore throws\")}")
        XCTAssertThrowsError(try RulesCore(bundleURL: r.probe).call("restampRestore", "[{},{},0]"),
                             "scope: the probe's restampRestore did not throw on a call")
        let before = try Before(r)

        let error = restoreError(r)

        if case .threw? = error as? RulesFailure {} else {
            XCTFail("the restore did not fail on the throwing restampRestore: \(String(describing: error))")
        }
        try assertUnchanged(r, before)
    }
}
