// Version store tests (lane N9, native-build-lanes, retention-tiers-are-unioned,
// unwritable-store-says-so). The contract is in VersionTestSupport.swift.
//
// The store keeps what it is given byte for byte and prunes with the rules bundle on every put.
// Swift holds no copy of the retention rule: the tests ask the bundle (VersionOracle) and add
// hand-derived fixtures with one tier deciding each (testing-isolate-each-tier). Every fixture
// keeps its same-bucket records a few minutes apart and away from :00, because the hour and day
// keys are local time and CI runs outside UTC.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

final class VersionStoreTests: XCTestCase {
    static let payload = Data(#"{"mailday":1,"items":[]}"#.utf8)

    // MARK: put, list, data

    /// The store never parses what it keeps: bytes that are not even UTF-8 come back as they went in.
    func testPutKeepsTheBytesExactlyAndListsTheRecord() throws {
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let bytes = Data([0xff, 0xfe, 0x00, 0x7b, 0x22])
        let rec = try vs.put(bytes, label: "before reset", kind: "milestone", lines: 12, checked: 3)
        XCTAssertEqual(try vs.data(for: rec.id), bytes)
        XCTAssertEqual(try vs.list(), [rec])
        XCTAssertEqual(rec.at, VersionSandbox.t0, "a record is stamped with the store's clock")
        XCTAssertEqual([rec.label, rec.kind], ["before reset", "milestone"])
        XCTAssertEqual([rec.lines, rec.checked], [12, 3])
    }

    /// A mash of taps can put twice at one instant. Both are kept and neither overwrites the other.
    func testTwoPutsAtOneInstantKeepTwoDistinctRecords() throws {
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let a = try vs.put(Data("a".utf8), label: "before sync")
        let b = try vs.put(Data("b".utf8), label: "before sync")
        XCTAssertNotEqual(a.id, b.id)
        XCTAssertEqual(Set(try vs.list().map(\.id)), [a.id, b.id])
        XCTAssertEqual(try vs.data(for: a.id), Data("a".utf8))
        XCTAssertEqual(try vs.data(for: b.id), Data("b".utf8))
    }

    func testTheListIsNewestFirst() throws {
        let box = try makeVersionSandbox()
        let vs = box.versions()
        box.clock.t = VersionSandbox.t0 + 2_000
        let mid = try vs.put(Data("m".utf8), label: "before restore")
        box.clock.t = VersionSandbox.t0
        let old = try vs.put(Data("o".utf8), label: "before sync")
        box.clock.t = VersionSandbox.t0 + 9_000
        let new = try vs.put(Data("n".utf8), label: "before reset")
        XCTAssertEqual(try vs.list().map(\.id), [new.id, mid.id, old.id])
    }

    /// A phone that has never saved a version has no folder yet. That lists nothing, and is no error.
    func testAFreshStoreListsNothing() throws {
        let box = try makeVersionSandbox()
        XCTAssertEqual(try box.versions().list(), [])
    }

    func testARelaunchSeesTheSameVersions() throws {
        let box = try makeVersionSandbox()
        let first = try box.versions().put(Self.payload, label: "before reset", lines: 12, checked: 3)
        let again = box.versions()
        XCTAssertEqual(try again.list(), [first])
        XCTAssertEqual(try again.data(for: first.id), Self.payload)
    }

    func testRemoveDropsTheRecordAndItsBytes() throws {
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let keep = try vs.put(Data("k".utf8), label: "before sync")
        let drop = try vs.put(Data("d".utf8), label: "before sync")
        try vs.remove(drop.id)
        XCTAssertEqual(try vs.list().map(\.id), [keep.id])
        XCTAssertThrowsError(try vs.data(for: drop.id)) { XCTAssertEqual($0 as? VersionError, .unreadable(drop.id)) }
    }

    func testDataForAnUnknownIdIsUnreadable() throws {
        let box = try makeVersionSandbox()
        XCTAssertThrowsError(try box.versions().data(for: "v0-none")) {
            XCTAssertEqual($0 as? VersionError, .unreadable("v0-none"))
        }
    }

    // MARK: a store that is broken says so

    /// A plain file where the folder should be. The list throws: an unreadable list is never an
    /// empty one (unwritable-store-says-so). A put throws too: a milestone that was not saved is
    /// never reported as saved.
    func testAFileWhereTheFolderShouldBeIsAnErrorNotAnEmptyList() throws {
        let box = try makeVersionSandbox()
        try box.replaceWithFile(box.versionsURL)
        let vs = box.versions()
        XCTAssertThrowsError(try vs.list(), "the list must not read as empty")
        XCTAssertThrowsError(try vs.put(Self.payload, label: "before reset"), "the put must not read as saved")
    }

    /// The record is on disk when the prune runs. A prune that fails is partial success, and the
    /// caller is not told the version failed (it would refuse a Reset it has just protected).
    func testAFailedPruneDoesNotFailThePut() throws {
        let box = try makeVersionSandbox()
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = box.root.appending(path: "probe-rules.js")
        try (real + "\n;Rules.prunePlan = function () { throw new Error('boom'); };\n").write(to: probe, atomically: true, encoding: .utf8)
        let vs = box.versions(rules: probe)
        let rec = try vs.put(Self.payload, label: "before reset")
        XCTAssertEqual(try vs.list(), [rec], "the version was kept")
    }

    // MARK: the prune is the bundle's, on every put

    /// 25 recents inside one hour and one day. The ring keeps the newest `recentKeep`; the earliest
    /// is the hour and day anchor, and sits outside the ring. Nothing else survives. Each put prunes.
    func testThePruneRunsOnEveryPutAndKeepsTheNewestRingPlusTheAnchor() async throws {
        let r = try await VersionOracle.retention()
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let n = r.recentKeep + 5
        var ids: [String] = []
        for i in 0..<n {
            box.clock.t = VersionSandbox.t0 + Double(i) * 1_000
            ids.append(try vs.put(Data("{}".utf8), label: "r\(i)", kind: "recent").id)
        }
        let expected = Set([ids[0]] + ids[(n - r.recentKeep)...])
        XCTAssertEqual(expected.count, r.recentKeep + 1, "anchor: the ring is full and the anchor is outside it")
        XCTAssertEqual(Set(try vs.list().map(\.id)), expected)
    }

    /// Four milestones and a recent, one tier deciding each. The old pair: the earliest is the day
    /// anchor, the second is past 30 days and is no anchor, so only the age rule drops it. The new
    /// pair: the second is no anchor and is kept by the milestone window alone. The store's clock
    /// decides the age (the wall clock sits 70 days away from t0).
    func testAMilestoneKeepsItsWindowOnTheStoreClock() async throws {
        let r = try await VersionOracle.retention()
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let t0 = VersionSandbox.t0, day = VersionSandbox.day, minute = VersionSandbox.minute
        func put(_ at: Double, _ kind: String, _ label: String) throws -> String {
            box.clock.t = at
            return try vs.put(Data("{}".utf8), label: label, kind: kind).id
        }
        let old1 = try put(t0 - Double(r.milestoneDays + 10) * day, "milestone", "old1")
        let old2 = try put(t0 - Double(r.milestoneDays + 10) * day + minute, "milestone", "old2")
        let new1 = try put(t0 - 10 * day, "milestone", "new1")
        let new2 = try put(t0 - 10 * day + minute, "milestone", "new2")
        let last = try put(t0, "recent", "last")
        let survivors = Set(try vs.list().map(\.id))
        XCTAssertFalse(survivors.contains(old2), "past the milestone window and no anchor: dropped")
        XCTAssertEqual(survivors, [old1, new1, new2, last])
    }

    /// 65 milestones inside one hour: the cap keeps the newest `milestoneMax`; the earliest is the
    /// anchor. The ring does not count milestones.
    func testTheMilestoneCapKeepsTheNewestMilestones() async throws {
        let r = try await VersionOracle.retention()
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let n = r.milestoneMax + 5
        var ids: [String] = []
        for i in 0..<n {
            box.clock.t = VersionSandbox.t1 + Double(i) * 10_000
            ids.append(try vs.put(Data("{}".utf8), label: "before sync", kind: "milestone").id)
        }
        let expected = Set([ids[0]] + ids[(n - r.milestoneMax)...])
        XCTAssertEqual(expected.count, r.milestoneMax + 1, "anchor: the cap bites and the anchor is outside it")
        XCTAssertEqual(Set(try vs.list().map(\.id)), expected)
    }

    /// A mixed history, put oldest first. After every put the survivors are the records the bundle's
    /// prunePlan(records, now) leaves, with `now` the store's clock. The history holds every tier:
    /// a ring, hour anchors, day anchors, milestones inside and outside their window, and a record
    /// older than the day tier.
    func testThePruneEqualsTheBundleOnAMixedHistory() async throws {
        let r = try await VersionOracle.retention()
        let box = try makeVersionSandbox()
        let vs = box.versions()
        let day = VersionSandbox.day, hour = VersionSandbox.hour, minute = VersionSandbox.minute
        var plan: [(off: Double, kind: String, name: String)] = []
        for d in [170, 150, 120, 90, 60, 45] {
            plan.append((-Double(d) * day, "recent", "day\(d)a"))
            plan.append((-Double(d) * day + minute, "recent", "day\(d)b"))
        }
        plan.append((-Double(r.dayDays + 20) * day, "recent", "ancient"))
        plan.append((-100 * day, "milestone", "ms100"))
        plan.append((-Double(r.milestoneDays + 5) * day, "milestone", "ms35a"))
        plan.append((-Double(r.milestoneDays + 5) * day + minute, "milestone", "ms35b"))
        for d in [20, 12, 6, 2] { plan.append((-Double(d) * day, "milestone", "ms\(d)")) }
        for h in stride(from: 23, through: 2, by: -3) { plan.append((-Double(h) * hour, "recent", "hr\(h)")) }
        for i in 0..<(r.recentKeep + 5) { plan.append((-Double(r.recentKeep + 4 - i) * minute, "recent", "burst\(i)")) }
        plan.sort { $0.off < $1.off }

        var oracle: [VersionRecord] = []
        var nameOf: [String: String] = [:]
        for step in plan {
            box.clock.t = VersionSandbox.t0 + step.off
            let rec = try vs.put(Data("{}".utf8), label: step.name, kind: step.kind)
            nameOf[rec.id] = step.name
            oracle.append(rec)
            let dead = try await VersionOracle.plan(oracle, now: box.clock.t)
            oracle.removeAll { dead.contains($0.id) }
            XCTAssertEqual(Set(try vs.list().map(\.id)), Set(oracle.map(\.id)), "after putting \(step.name)")
        }

        let names = Set(try vs.list().compactMap { nameOf[$0.id] })
        XCTAssertLessThan(names.count, plan.count, "anchor: the prune dropped something")
        XCTAssertFalse(names.contains("ancient"), "anchor: past the day tier and outside the ring")
        XCTAssertTrue(names.contains("ms100"), "anchor: a day anchor outlives the milestone window")
        XCTAssertFalse(names.contains("ms35b"), "anchor: past the window and no anchor")
        XCTAssertTrue(names.contains("hr23"), "anchor: outside the ring, kept by an hour or day anchor")
    }
}
