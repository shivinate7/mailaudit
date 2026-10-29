// Order stamps on the native Packages card, the model side (step 6, one-stamp-per-package,
// a-refund-leaves-every-count, stamped-filter-on-the-pipeline, rules-run-in-javascriptcore).
//
// The stamp rules have one home, src/view-rules.mjs, pinned by V35 to V38 in test/view-rules.test.mjs
// (the contract is stated at the top of that file). Swift reads them from rules.js and keeps no copy.
// These cases pin the glue, and each proves its source with a shim, as PackageCardModelTests does for gotQty:
// the real bundle with one export replaced, so a model that decides in Swift gives another answer.
//
// What each case needs from the builder:
//   - Rules.STAMP_KINDS, hasStamp, isRefundStamp, nextStamp, stampBandText and refundedPill are exported, with
//     the names and shapes of the V35 block. Swift calls Rules.isRefundStamp itself (a per-stamp call), not a
//     wrapper that calls it inside the bundle, or the shim below would not reach it.
//   - LiveItems.of drops the packages the bundle's isRefundStamp names, and no others. Packages, Tally, Orphaned,
//     the masthead and Card in Hand all call it, so one case covers the five.
//   - PackagesModel gains stored properties, all filled by load() the way `pills` and `details` are, from the
//     bundle and never from Swift text:
//       stamps        group key to the stored stamp
//       stampedCount  Int: the live stamps (the bundle's hasStamp) among the packages of the list before the refund
//                     exclusion, canceled orders left out
//       showStamped   Bool, false at launch
//       bands         [String: String]: group key to the bundle's stampBandText, one per live stamp counted above
//       refundPills   [String: String]: group key to the bundle's refundedPill(items, received), one per package
//                     the bundle's isRefundStamp names, none when no copy is owed
//       stampKinds    the bundle's STAMP_KINDS constant, in its order (the element type is the builder's)
//     A test cannot name a property that does not exist yet, so the cases that read them go through Mirror (the way
//     PackageCardTokensTests finds the count part by name). They read `name` or the `_name` @Observable stores it under.
//   - PastTransitModel.stamp saves the record the bundle's nextStamp returns: PastTransitModelTests.
//
// Fake fixtures only. LiveFixture (TallyPackagesLiveItemsTests.swift) builds the ledgers.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class StampRulesTests: XCTestCase {
    /// One rules call on the real bundle. A thrown error is reported as a failure, not a crash.
    func rule(_ name: String, _ args: String) async -> Any? {
        do {
            let text = try await RulesEngine(bundleURL: RulesGoldenTests.bundleURL).call(name, args)
            return try JSONSerialization.jsonObject(with: Data(text.utf8), options: [.fragmentsAllowed])
        } catch {
            XCTFail("\(name) threw \(error)")
            return nil
        }
    }

    // MARK: the bundle exports the rules

    /// Each stamp rule is in the bundle and gives the value the Node cases pin (V35 to V38).
    func testTheBundleExportsTheStampRules() async throws {
        do {
            let kinds = try await RulesEngine(bundleURL: RulesGoldenTests.bundleURL).constant("STAMP_KINDS")
            let pairs = try JSONSerialization.jsonObject(with: Data(kinds.utf8)) as? [[String]]
            XCTAssertEqual(pairs?.map { $0.joined(separator: "=") },
                           ["claim=Claim filed", "refunded=Refunded", "contacted=Seller contacted", "reshipped=Reshipped",
                            "partial=Partial refund", "other=Other"], "STAMP_KINDS: the six kinds in order, Other last")
        } catch {
            XCTFail("STAMP_KINDS is not in the bundle: \(error)")
        }
        let refund = await rule("isRefundStamp", #"[{"kind":"partial"}]"#)
        XCTAssertEqual(refund as? Bool, true, "isRefundStamp: partial is a refund")
        let claim = await rule("isRefundStamp", #"[{"kind":"claim"}]"#)
        XCTAssertEqual(claim as? Bool, false, "isRefundStamp: a claim is not")
        let has = await rule("hasStamp", #"[{"kind":"","note":"kept"}]"#)
        XCTAssertEqual(has as? Bool, false, "hasStamp: a tombstone has none")
        let band = await rule("stampBandText", #"[{"kind":"claim","note":"","at":"2026-07-04"}]"#)
        XCTAssertEqual(band as? String, "CLAIM FILED \u{00B7} 07-04", "stampBandText")
        let items = #"[{"key":"a","qty":1,"price":1},{"key":"b","qty":2,"price":1}]"#
        let pill = await rule("refundedPill", "[\(items),{\"a\":1}]")
        XCTAssertEqual(pill as? String, "2 left \u{00B7} refunded", "refundedPill: copies still owed")
        let next = await rule("nextStamp", #"[{"kind":"claim","note":"a","at":"2026-07-01","updatedAt":5},{"kind":"refunded","note":" b "},"2026-07-04",9]"#)
        let record = next as? [String: Any]
        XCTAssertEqual(record?["kind"] as? String, "refunded", "nextStamp: the new kind")
        XCTAssertEqual(record?["note"] as? String, "b", "nextStamp: the note is trimmed")
        XCTAssertEqual(record?["at"] as? String, "2026-07-04", "nextStamp: another kind is dated today")
        XCTAssertEqual(record?["updatedAt"] as? Double, 9, "nextStamp: the clock it was given")
    }

    // MARK: the refund kinds come from the bundle

    /// "shimrefund" is the only refund the shim knows. A refunded stamp is none.
    static let refundShim = #"Rules = Object.assign({}, Rules, { isRefundStamp: function (s) { return !!s && s.kind === "shimrefund"; } });"#
    /// R1 / Seller R (items r1, r2) is stamped shimrefund and must go. E1 is stamped "refunded", which the shim does
    /// not call a refund, so it must stay. The rest is the base ledger.
    static let stamps: [LiveStamp] = [("R1", "Seller R", "shimrefund"), ("E1", "Seller E", "refunded")]

    func shimmedEngine() async throws -> RulesEngine {
        let engine = try RulesEngine(bundleURL: try probeBundleFile(Self.refundShim, for: self))
        // positive control: the override is live, and the rest of the bundle is intact
        let live = try await engine.call("isRefundStamp", #"[{"kind":"shimrefund"}]"#)
        XCTAssertEqual(live, "true", "the shim's override must be live, or this test proves nothing")
        let off = try await engine.call("isRefundStamp", #"[{"kind":"refunded"}]"#)
        XCTAssertEqual(off, "false", "the shim must not call refunded a refund")
        let rest = try await engine.call("outstandingOf", "[[],{}]")
        XCTAssertEqual(rest, "{\"left\":0,\"value\":0}", "the shim must leave the other exports alone")
        return engine
    }

    func ledger() async throws -> LedgerStore {
        try await LiveFixture.store(items: LiveFixture.base + LiveFixture.refunded, stamps: Self.stamps, engine: try LiveFixture.engine())
    }

    /// LiveItems.of, which every count and list reads, drops the packages the bundle's isRefundStamp names. Swift's
    /// own literal of the two refund kinds would drop E1 and keep R1 / Seller R, the opposite.
    func testLiveItemsDropsWhatTheBundlesIsRefundStampNames() async throws {
        let store = try await ledger()
        let out = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: try await shimmedEngine())
        let kept = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [[String: Any]])
        XCTAssertEqual(kept.compactMap { $0["key"] as? String }.sorted(), ["a1", "a2", "e1", "f1", "s1"],
                       "the package the bundle calls a refund goes, and the one it does not stays")
    }

    /// The Packages list is built from it: no card for a package the bundle calls a refund.
    func testPackagesModelListsWhatTheBundlesIsRefundStampKeeps() async throws {
        let model = PackagesModel(engine: try await shimmedEngine(), store: try await ledger())
        try await model.load()
        XCTAssertEqual(model.rows.map(\.gk).sorted(), ["A1::Seller A", "E1::Seller E", "F1::Seller F", "R1::Seller S"])
    }

    // MARK: the stamped list and its count

    /// What the Mirror finds under `name`, or under the `_name` @Observable stores it as.
    func peek<T>(_ model: Any, _ name: String, as type: T.Type = T.self) -> T? {
        Mirror(reflecting: model).children.first { $0.label == name || $0.label == "_" + name }?.value as? T
    }

    /// E1 holds a claim, R1 / Seller R a refund, F1 a removed stamp (a tombstone) and the canceled X1 a claim.
    /// The cell counts E1 and the refunded R1, which the normal list has dropped: the web's stampedPackagesOf runs on the
    /// list before the refund exclusion (stamped-filter-on-the-pipeline). A tombstone is no stamp, and a canceled
    /// order is out of the list altogether (canceled-orders-leave-the-list). The filter is off at launch.
    func testPackagesModelCountsLiveStampsIncludingRefundsAndNothingElse() async throws {
        let stamps: [LiveStamp] = [("E1", "Seller E", "claim"), ("R1", "Seller R", "refunded"), ("F1", "Seller F", ""), ("X1", "Seller X", "claim")]
        let store = try await LiveFixture.store(items: LiveFixture.base + LiveFixture.refunded + LiveFixture.canceled, stamps: stamps,
                                                engine: try LiveFixture.engine())
        let model = PackagesModel(engine: try LiveFixture.engine(), store: store)
        try await model.load()

        XCTAssertEqual(try XCTUnwrap(peek(model, "stampedCount") as Int?, "PackagesModel has no stampedCount"), 2,
                       "two live stamps in the list before the refund exclusion; not the tombstone, not the canceled order")
        let held = try XCTUnwrap(peek(model, "stamps") as [String: Any]?, "PackagesModel has no stamps map")
        XCTAssertTrue(Set(held.keys).isSuperset(of: ["E1::Seller E", "R1::Seller R"]), "the stamps map lacks a live stamp: \(held.keys.sorted())")
        XCTAssertEqual(peek(model, "showStamped") as Bool?, false, "the stamped filter starts off")
        XCTAssertFalse(model.rows.map(\.gk).contains("R1::Seller R"), "the refunded package is out of the normal list")
    }

    // MARK: the count, the band, the pill and the kinds come from the bundle

    /// Two kinds of the shim's own, a hasStamp that knows only them, and marker text for the band and the pill.
    static let textShim = """
        Rules = Object.assign({}, Rules, {
          STAMP_KINDS: [["shimA", "Shim A"], ["shimB", "Shim B"]],
          hasStamp: function (s) { return !!s && (s.kind === "shimA" || s.kind === "shimB"); },
          isRefundStamp: function (s) { return !!s && s.kind === "shimB"; },
          stampBandText: function (s) { return "BAND " + s.kind + " " + s.at; },
          refundedPill: function (items) { return "PILL " + items.length; }
        });
        """

    /// E1 holds shimA, R1 / Seller R shimB (a refund to the shim, two lines), and F1 a "claim", which the shim's hasStamp
    /// does not call a stamp. Swift text for any of the four would give another answer: the real bundle counts F1 and reads
    /// "CLAIM FILED", and the real pill is "N left \u{00B7} refunded".
    func testPackagesModelReadsTheStampTextFromTheBundle() async throws {
        let engine = try RulesEngine(bundleURL: try probeBundleFile(Self.textShim, for: self))
        // positive control: the overrides are live
        let kinds = try await engine.constant("STAMP_KINDS")
        XCTAssertTrue(kinds.contains("Shim A") && !kinds.contains("Claim filed"), "the shim's STAMP_KINDS must be live, or this test proves nothing")
        let has = try await engine.call("hasStamp", #"[{"kind":"claim"}]"#)
        XCTAssertEqual(has, "false", "the shim's hasStamp must be live")

        let stamps: [LiveStamp] = [("E1", "Seller E", "shimA"), ("R1", "Seller R", "shimB"), ("F1", "Seller F", "claim")]
        let store = try await LiveFixture.store(items: LiveFixture.base + LiveFixture.refunded, stamps: stamps, engine: try LiveFixture.engine())
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()

        XCTAssertEqual(peek(model, "stampedCount") as Int?, 2, "the count is the bundle's hasStamp: E1 and R1 / Seller R, not F1's claim")
        let bands = try XCTUnwrap(peek(model, "bands") as [String: String]?, "PackagesModel has no bands map")
        XCTAssertEqual(bands["E1::Seller E"], "BAND shimA 2026-07-02", "the band text is the bundle's stampBandText")
        XCTAssertEqual(bands["R1::Seller R"], "BAND shimB 2026-07-02", "a refunded package has its band too")
        XCTAssertNil(bands["F1::Seller F"], "no band for what the bundle's hasStamp does not call a stamp")
        let pills = try XCTUnwrap(peek(model, "refundPills") as [String: String]?, "PackagesModel has no refundPills map")
        XCTAssertEqual(pills["R1::Seller R"], "PILL 2", "the refunded pill is the bundle's refundedPill, given the package's two lines")
        XCTAssertNil(pills["E1::Seller E"], "a package the bundle's isRefundStamp does not name has no refunded pill")
        let held = String(describing: try XCTUnwrap(peek(model, "stampKinds") as [Any]?, "PackagesModel has no stampKinds"))
        XCTAssertTrue(held.contains("Shim A") && held.contains("Shim B") && !held.contains("Claim filed"), "the kinds are the bundle's STAMP_KINDS, got \(held)")
    }

    // MARK: the writes, and a check-in on a refunded package (UI tests are not in CI, so these hold the model's glue)

    /// The real nextStamp, dated 2026-01-02 whatever the clock, with "SHIM " put before the note of a stamp it writes.
    /// A record built in Swift, or by LedgerStore.setStamp, carries neither.
    static let writerShim = """
        (function () {
          var real = Rules.nextStamp;
          Rules = Object.assign({}, Rules, { nextStamp: function (cur, patch, today, now) {
            var r = real(cur, patch, "2026-01-02", now);
            if (r && r.kind) r.note = "SHIM " + r.note;
            return r;
          } });
        })();
        """
    static let clock = 1_786_543_380_000.0  // the clock LiveFixture.store gives the ledger
    static let r1 = "R1::Seller R", e1 = "E1::Seller E", a1 = "A1::Seller A"
    static let dot = "\u{00B7}"

    /// stamp() writes what the bundle's nextStamp makes, with the note it was given, and then reads the ledger again:
    /// the stamps, the count, the bands and the refunded pills all follow, and a refund leaves the list.
    /// Fails if the writer call goes, if the note is not passed on, or if the reload after the write goes.
    func testStampWritesTheBundlesRecordAndTheMapsFollow() async throws {
        let engine = try RulesEngine(bundleURL: try probeBundleFile(Self.writerShim, for: self))
        let live = try await engine.call("nextStamp", #"[null,{"kind":"claim","note":"x"},"2030-01-01",5]"#)
        XCTAssertTrue(live.contains("SHIM x") && live.contains("2026-01-02"), "the shim must be live, or this test proves nothing: \(live)")
        let store = try await LiveFixture.store(items: LiveFixture.base + LiveFixture.refunded, stamps: [], engine: try LiveFixture.engine())
        let model = PackagesModel(engine: engine, store: store)
        try await model.load()
        XCTAssertEqual([model.stamps.count, model.stampedCount, model.bands.count, model.refundPills.count], [0, 0, 0, 0], "anchor: no stamp yet")
        XCTAssertTrue(model.rows.map(\.gk).contains(Self.r1), "anchor: R1 is in the list before its refund")

        try await model.stamp(Self.r1, kind: "refunded", note: "lost")
        let held = try XCTUnwrap(model.stamps[Self.r1], "stamps lacks the record")
        XCTAssertEqual(held["kind"] as? String, "refunded")
        XCTAssertEqual(held["note"] as? String, "SHIM lost", "the record is the bundle's nextStamp, made with the note given")
        XCTAssertEqual(held["at"] as? String, "2026-01-02", "the date is the bundle's")
        XCTAssertEqual(held["updatedAt"] as? Double, Self.clock, "the store's clock")
        XCTAssertEqual(store.stamps()[Self.r1]?["note"] as? String, "SHIM lost", "the ledger holds the record")
        XCTAssertEqual(model.stampedCount, 1, "a refund is counted before the refund exclusion")
        XCTAssertEqual(model.bands[Self.r1], "REFUNDED \(Self.dot) 01-02", "the band is the bundle's stampBandText")
        XCTAssertEqual(model.refundPills[Self.r1], "2 left \(Self.dot) refunded", "R1 owes two copies")
        XCTAssertFalse(model.rows.map(\.gk).contains(Self.r1), "the refunded package leaves the list")

        try await model.stamp(Self.e1, kind: "claim", note: "")
        XCTAssertEqual(model.stampedCount, 2)
        XCTAssertEqual(model.bands[Self.e1], "CLAIM FILED \(Self.dot) 01-02")
        XCTAssertNil(model.refundPills[Self.e1], "a claim is not a refund")
        XCTAssertEqual(model.stamps.count, 2)
    }

    /// removeStamp() goes through the writer: a live stamp becomes a tombstone (kind, note and date cleared, the clock
    /// stamped), and the count, the band and the refunded pill go with it. A package with no stamp gets nothing, where
    /// LedgerStore.removeStamp alone would write a tombstone for any key. Fails if the writer call goes, if the call
    /// skips the writer for the store, or if the reload after the write goes.
    func testRemoveStampLeavesATombstoneAndTheMapsFollow() async throws {
        let stamps: [LiveStamp] = [("E1", "Seller E", "claim"), ("R1", "Seller R", "refunded")]
        let store = try await LiveFixture.store(items: LiveFixture.base + LiveFixture.refunded, stamps: stamps, engine: try LiveFixture.engine())
        let model = PackagesModel(engine: try LiveFixture.engine(), store: store)
        try await model.load()
        XCTAssertEqual(model.stampedCount, 2, "anchor: two live stamps")
        XCTAssertNotNil(model.refundPills[Self.r1], "anchor: R1 has its refunded pill")
        XCTAssertFalse(model.rows.map(\.gk).contains(Self.r1), "anchor: R1 is out of the list")

        try await model.removeStamp(Self.r1)
        let tomb = try XCTUnwrap(model.stamps[Self.r1], "a removal keeps the key")
        let want: [String: Any] = ["kind": "", "note": "", "at": "", "updatedAt": Self.clock]
        XCTAssertTrue(NSDictionary(dictionary: tomb).isEqual(to: want), "a tombstone, nothing more: \(tomb)")
        XCTAssertEqual(model.stampedCount, 1, "the tombstone is no stamp")
        XCTAssertNil(model.bands[Self.r1])
        XCTAssertNil(model.refundPills[Self.r1])
        XCTAssertNotNil(model.bands[Self.e1], "the other package keeps its band")
        XCTAssertTrue(model.rows.map(\.gk).contains(Self.r1), "a package whose refund is gone is back in the list")

        try await model.removeStamp(Self.a1)
        XCTAssertNil(store.stamps()[Self.a1], "no stamp, no tombstone")
        XCTAssertNil(model.stamps[Self.a1])
    }

    /// With the stamped filter on, a refunded package is in the list, so a check-in on its card reaches the refund
    /// refresh: its refunded pill follows the count. A claim-stamped package beside it never gets one. Fails if the
    /// refresh goes, if it runs for a package the bundle does not call a refund, or if load() stops handing it the refunds.
    func testACheckInRefreshesTheRefundedPillWithTheFilterOn() async throws {
        let stamps: [LiveStamp] = [("A1", "Seller A", "claim"), ("R1", "Seller R", "refunded")]
        let store = try await LiveFixture.store(items: LiveFixture.base + LiveFixture.refunded, stamps: stamps, engine: try LiveFixture.engine())
        let model = PackagesModel(engine: try LiveFixture.engine(), store: store)
        try await model.load()
        try await model.toggleStamped()
        XCTAssertTrue(model.showStamped, "anchor: the filter is on")
        XCTAssertEqual(model.rows.map(\.gk).sorted(), [Self.a1, Self.r1], "anchor: the stamped list holds the refunded package")
        XCTAssertEqual(model.refundPills[Self.r1], "2 left \(Self.dot) refunded", "anchor: r1 has 1 of 2 in, r2 none")

        try await model.checkIn(key: "r2", count: 1)
        XCTAssertEqual(model.refundPills[Self.r1], "1 left \(Self.dot) refunded", "the check-in moves the refunded pill")
        try await model.checkIn(key: "a2", count: 1)
        XCTAssertNil(model.refundPills[Self.a1], "A1 owes a copy but holds a claim: no refunded pill")
        try await model.checkIn(key: "r1", count: 2)
        XCTAssertNil(model.refundPills[Self.r1], "every copy in: no pill, and no entry left over")
    }

    /// The tombstone LedgerStore.removeStamp writes is the one the bundle's nextStamp makes for a removal (the web's
    /// record). LedgerStoreTests pins the store's literal, this one pins it to the bundle, so one cannot move without the other.
    func testTheStoresTombstoneIsTheBundlesTombstone() async throws {
        let engine = try LiveFixture.engine()
        let store = try await LiveFixture.store(items: LiveFixture.base, stamps: [("E1", "Seller E", "claim")], engine: engine)
        let live = try XCTUnwrap(store.stamps()[Self.e1], "anchor: E1 holds a stamp")
        let liveJSON = String(decoding: try JSONSerialization.data(withJSONObject: live), as: UTF8.self)
        let out = try await engine.call("nextStamp", "[\(liveJSON),null,\"2026-07-04\",\(Int(Self.clock))]")
        let bundle = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(out.utf8)) as? [String: Any], "nextStamp gave no tombstone: \(out)")
        XCTAssertEqual(bundle["kind"] as? String, "", "anchor: the bundle's record is a tombstone")

        store.removeStamp(Self.e1)
        let stored = try XCTUnwrap(store.stamps()[Self.e1])
        XCTAssertTrue(NSDictionary(dictionary: stored).isEqual(to: bundle), "the store's tombstone \(stored) is not the bundle's \(bundle)")
    }
}
