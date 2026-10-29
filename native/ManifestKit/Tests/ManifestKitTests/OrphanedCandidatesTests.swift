// Orphaned candidate tests (lane N7, native-build-lanes, orphaned-mail-never-decides,
// candidates-skip-date-filter, a-refund-leaves-every-count).
//
// The app may rank the packages an envelope could have come from. It never auto-assigns
// one. A perfect fingerprint match is not an action. Equally good candidates are a tie,
// and a tie has no emphasis. Candidates are derived, never stored. The ranking itself is
// the bundle's rankCandidates (rules-run-in-javascriptcore); these tests pass its numbers
// through and add the native rules around it. The contract is in OrphanedTestSupport.swift.
//
// Fixture facts (shared/fixtures/ledger.json): A1 and B1 hold the same cards (Lightning Bolt,
// Counterspell, Brainstorm x2), so any envelope that fits one fits the other. C1 holds
// Lightning Bolt and four more. D1 holds Urza's Saga alone.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class OrphanedCandidatesTests: XCTestCase {
    // MARK: no auto-assign

    /// An envelope that matches one package exactly is OFFERED, and nothing is checked in.
    /// Loading writes nothing. Recording the same cards through the composer writes the
    /// envelope and checks nothing in either.
    func testAnExactMatchIsOfferedAndNothingIsCheckedIn() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e-urza", [("Urza's Saga", 1)])]])
        let seeded = try box.bytes()
        let (model, store) = try await box.open()

        let ranked = model.ranked(for: "e-urza")
        XCTAssertEqual(ranked.list.map(\.pkg.gk), [OrphanedSandbox.d1], "the one package that fits is offered")
        XCTAssertEqual(ranked.list.first?.exact, true, "and it is a perfect fit")
        XCTAssertEqual(ranked.list.first?.plan, [PlanStep(itemKey: OrphanedSandbox.d1Saga, take: 1)], "with the exact check-in it would apply")
        XCTAssertEqual(try box.bytes(), seeded, "a load writes nothing")
        XCTAssertEqual(store.generation, 0, "a load is not an edit")
        XCTAssertEqual(store.received(), [String: Int](), "nothing is checked in")

        model.open(.new)
        try await model.addName("Urza's Saga", for: .new)
        try await model.save(.new)
        let recorded = try XCTUnwrap(model.envelopes.first { $0.id != "e-urza" }, "the second envelope is listed")
        XCTAssertEqual(model.ranked(for: recorded.id).list.first?.exact, true, "the new envelope is offered the same package")
        XCTAssertEqual(try box.savedReceived(), [String: Int](), "recording checks no card in")
        XCTAssertEqual(try box.savedReceivedAt(), [String: Double](), "recording stamps no check-in time")
    }

    // MARK: ties

    /// A and B hold the same cards, so an envelope of those cards fits both exactly. That is a
    /// tie, and no tied candidate is emphasized. A single exact fit is emphasized, so the
    /// check can fail: it is the positive control for the tie.
    func testATieHasNoEmphasisAndASingleExactFitDoes() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e-tie", [("Lightning Bolt", 1), ("Counterspell", 1), ("Brainstorm", 2)], updated: OrphanedSandbox.t0 - 2_000),
            OrphanedSandbox.env("e-one", [("Urza's Saga", 1)], updated: OrphanedSandbox.t0 - 1_000),
        ]])
        let (model, _) = try await box.open()

        let tie = model.ranked(for: "e-tie")
        XCTAssertEqual(tie.list.prefix(2).map(\.pkg.gk), [OrphanedSandbox.a1, OrphanedSandbox.b1], "A and B fit the envelope equally well")
        XCTAssertEqual(tie.tied, 2, "the tie is counted")
        XCTAssertEqual(tie.list.prefix(2).map(\.exact), [true, true], "both are perfect fits")
        for c in tie.list {
            XCTAssertFalse(tie.emphasized(c), "\(c.pkg.gk) is emphasized in a tie")
        }

        let one = model.ranked(for: "e-one")
        XCTAssertEqual(one.tied, 1, "one fit is not a tie")
        let fit = try XCTUnwrap(one.list.first, "anchor: D is offered")
        XCTAssertTrue(one.emphasized(fit), "a single perfect fit is emphasized")
    }

    /// The numbers come from the bundle: how many cards each package explains, what it is
    /// still owed, what the envelope has left over. Best fit first.
    func testCandidatesCarryTheBundlesRanking() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Lightning Bolt", 1), ("Counterspell", 1)])]])
        let (model, _) = try await box.open()

        let r = model.ranked(for: "e1")
        XCTAssertEqual(r.list.map(\.pkg.gk), [OrphanedSandbox.a1, OrphanedSandbox.b1, OrphanedSandbox.c1], "two packages fit both cards, one fits one")
        XCTAssertEqual(r.tied, 2)
        let a = try XCTUnwrap(r.list.first)
        XCTAssertEqual([a.matchedQty, a.entriesTotal, a.poolTotal, a.pkgLeft, a.envLeft], [2, 2, 4, 2, 0], "A explains 2 of 2 and is owed 2 more")
        XCTAssertFalse(a.exact, "A is owed more than the envelope holds, so it is not a perfect fit")
        XCTAssertEqual(a.plan.map(\.itemKey).sorted(), [OrphanedSandbox.a1Bolt, OrphanedSandbox.a1Counter].sorted(), "the plan names the two lines")
        let c = try XCTUnwrap(r.list.last)
        XCTAssertEqual([c.matchedQty, c.envLeft], [1, 1], "C explains one card and cannot explain the other")
    }

    // MARK: no candidate

    /// A card nobody owes explains nothing: no package is offered, the tie count is 0, and
    /// the entry is not explainable. In a mixed envelope only the entry a package can
    /// explain is explainable (the "no outstanding copy" tag).
    func testACardNobodyOwesGetsNoCandidateAndNoExplanation() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e-none", [("Mystery Card", 1)]),
            OrphanedSandbox.env("e-mix", [("Path to Exile", 1), ("Mystery Card", 1)]),
        ]])
        let (model, _) = try await box.open()

        let none = model.ranked(for: "e-none")
        XCTAssertEqual(none.list.count, 0, "a package that explains nothing is never offered")
        XCTAssertEqual(none.tied, 0)
        XCTAssertEqual(none.explainable, Set<String>())

        let mix = model.ranked(for: "e-mix")
        XCTAssertEqual(mix.list.map(\.pkg.gk), [OrphanedSandbox.c1], "only C holds Path to Exile")
        XCTAssertEqual(mix.explainable, ["path to exile"], "Mystery Card has no outstanding copy anywhere")
        XCTAssertEqual(model.ranked(for: "no-such-envelope").list.count, 0, "an unknown id has no candidates")
    }

    /// A canceled order is not offered and its cards are not suggested. The positive anchor is
    /// another envelope in the same ledger that does get a candidate.
    func testCanceledOrdersAreNeverOffered() async throws {
        let box = try makeOrphanedSandbox()
        var items = try OrphanedSandbox.fixtureItems()
        items.append([
            "key": "X1|0|pBlackLotus", "orderId": "X1", "seller": "Xi Cards", "name": "Black Lotus", "set": "Test Set",
            "condition": "Near Mint", "finish": "", "qty": 1, "price": 9, "date": "2026-08-01", "tracking": "Canceled",
            "line": "Magic",
        ])
        try box.write(items: items, extra: ["envelopes": [
            OrphanedSandbox.env("e-lotus", [("Black Lotus", 1)]),
            OrphanedSandbox.env("e-path", [("Path to Exile", 1)]),
        ]])
        let (model, _) = try await box.open()

        XCTAssertEqual(model.ranked(for: "e-path").list.map(\.pkg.gk), [OrphanedSandbox.c1], "anchor: a live order is offered")
        XCTAssertEqual(model.ranked(for: "e-lotus").list.count, 0, "a canceled order is not offered")
        let found = await model.suggestions(for: "lotus")
        XCTAssertEqual(found, [], "and its card is not suggested")
    }

    // MARK: untracked tag

    /// The model passes each offered package's tracking status through the bundle's isUntracked, and
    /// holds no matching of its own. The statuses are the web's own: "without tracking" and
    /// "with tracking" from shared/fixtures/ledger.json, and the mixed-case "Without Tracking" the
    /// rule's V2.13 case holds. A Swift `==` on the string would miss the third. The anchor is the
    /// offered list, so the tracked package is a real candidate and not just absent.
    func testTheUntrackedTagFollowsTheBundlesRuleForEachOfferedPackage() async throws {
        let box = try makeOrphanedSandbox()
        var items = try OrphanedSandbox.fixtureItems()
        items.append([
            "key": "X1|0|pBlackLotus", "orderId": "X1", "seller": "Xi Cards", "name": "Black Lotus", "set": "Test Set",
            "condition": "Near Mint", "finish": "", "qty": 1, "price": 9, "date": "2026-08-01", "tracking": "Without Tracking",
            "line": "Magic",
        ])
        try box.write(items: items, extra: ["envelopes": [
            OrphanedSandbox.env("e-bolt", [("Lightning Bolt", 1)]),
            OrphanedSandbox.env("e-lotus", [("Black Lotus", 1)]),
        ]])
        let (model, _) = try await box.open()

        let offered = model.ranked(for: "e-bolt").list.map(\.pkg.gk)
        XCTAssertEqual(Set(offered), [OrphanedSandbox.a1, OrphanedSandbox.b1, OrphanedSandbox.c1], "anchor: all three packages holding the card are offered")
        XCTAssertTrue(model.isUntracked(OrphanedSandbox.a1), "a package that ships without tracking is tagged")
        XCTAssertTrue(model.isUntracked(OrphanedSandbox.b1), "and so is the other one")
        XCTAssertFalse(model.isUntracked(OrphanedSandbox.c1), "a tracked package is not")
        XCTAssertEqual(model.ranked(for: "e-lotus").list.map(\.pkg.gk), ["X1::Xi Cards"], "anchor: the mixed-case package is offered")
        XCTAssertTrue(model.isUntracked("X1::Xi Cards"), "the bundle's rule ignores case, so the tag does too")
        XCTAssertFalse(model.isUntracked("Z9::No Such Seller"), "an unknown package is not tagged")
    }

    // MARK: derived, never stored

    /// A package received by other means stops being offered at once, with nothing stale to
    /// clean up. The saved envelope is the same bytes before and after.
    func testAPackageReceivedByOtherMeansStopsBeingOffered() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Path to Exile", 1)])]])
        let (model, store) = try await box.open()
        XCTAssertEqual(model.ranked(for: "e1").list.map(\.pkg.gk), [OrphanedSandbox.c1], "anchor: C is offered first")
        let envelopeBefore = try JSONSerialization.data(withJSONObject: try box.savedEnvelope("e1"), options: [.sortedKeys])

        try store.commitReceived(OrphanedSandbox.c1Path, count: 1)
        try await model.load()

        XCTAssertEqual(model.ranked(for: "e1").list.count, 0, "C is not offered once its Path to Exile is in")
        XCTAssertEqual(model.envelopes.map(\.id), ["e1"], "the envelope is still waiting")
        let envelopeAfter = try JSONSerialization.data(withJSONObject: try box.savedEnvelope("e1"), options: [.sortedKeys])
        XCTAssertEqual(envelopeAfter, envelopeBefore, "no candidate was ever stored in the envelope")
    }

    // MARK: refunded packages

    /// A package stamped Refunded or Partial refund leaves every count, so it is not offered and its cards
    /// are not suggested (a-refund-leaves-every-count). Only C owes Path to Exile. A and B still owe a Lightning Bolt: the anchor.
    func testRefundedPackagesAreNeverOffered() async throws {
        for kind in ["refunded", "partial"] {
            let box = try makeOrphanedSandbox()
            try box.write(extra: [
                "stamps": [OrphanedSandbox.c1: OrphanedSandbox.stamp(kind)],
                "envelopes": [OrphanedSandbox.env("e-path", [("Path to Exile", 1)]), OrphanedSandbox.env("e-bolt", [("Lightning Bolt", 1)])],
            ])
            let (model, _) = try await box.open()

            XCTAssertEqual(model.ranked(for: "e-bolt").list.map(\.pkg.gk), [OrphanedSandbox.a1, OrphanedSandbox.b1], "\(kind): C is not offered for the bolt either, A and B still are")
            XCTAssertEqual(model.ranked(for: "e-path").list.count, 0, "\(kind): a package with a refund stamp is offered")
            XCTAssertEqual(model.ranked(for: "e-path").explainable, Set<String>(), "\(kind): its card still counts as outstanding")
            let found = await model.suggestions(for: "path")
            XCTAssertEqual(found, [], "\(kind): its card is still suggested")
            let bolt = await model.suggestions(for: "bolt")
            XCTAssertEqual(bolt, [Suggestion(name: "Lightning Bolt", qty: 2, sellerCount: 2)], "\(kind): the pool still counts the refunded copy")
            do {
                try await model.assign(envelope: "e-path", to: OrphanedSandbox.c1)
                XCTFail("\(kind): assign to a refunded package must throw")
            } catch {}
            XCTAssertEqual(try box.savedReceived(), [String: Int](), "\(kind): a refused assign checked a card in")
        }
    }

    /// A refund can break a tie. A and B hold the same cards. With A refunded the envelope fits B alone, so it is
    /// no tie and B stands out.
    func testARefundBreaksATie() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: [
            "stamps": [OrphanedSandbox.a1: OrphanedSandbox.stamp("refunded")],
            "envelopes": [OrphanedSandbox.env("e-tie", [("Lightning Bolt", 1), ("Counterspell", 1), ("Brainstorm", 2)])],
        ])
        let (model, _) = try await box.open()

        let r = model.ranked(for: "e-tie")
        XCTAssertEqual(r.list.first?.pkg.gk, OrphanedSandbox.b1, "B is the best fit")
        XCTAssertFalse(r.list.contains { $0.pkg.gk == OrphanedSandbox.a1 }, "the refunded A is offered")
        XCTAssertEqual(r.tied, 1, "a refunded package still makes a tie")
        let fit = try XCTUnwrap(r.list.first)
        XCTAssertTrue(r.emphasized(fit), "B is the lone perfect fit")
    }

    /// Other stamps and a removed stamp are not refunds: the package stays in. These are the anchors for the
    /// two tests above, so a rule that drops every stamped package fails here.
    func testOnlyARefundStampTakesAPackageOut() async throws {
        for kind in ["claim", "contacted", "reshipped", "other", ""] {
            let box = try makeOrphanedSandbox()
            try box.write(extra: [
                "stamps": [OrphanedSandbox.c1: OrphanedSandbox.stamp(kind)],
                "envelopes": [OrphanedSandbox.env("e-path", [("Path to Exile", 1)])],
            ])
            let (model, _) = try await box.open()

            XCTAssertEqual(model.ranked(for: "e-path").list.map(\.pkg.gk), [OrphanedSandbox.c1], "kind \"\(kind)\": the package was dropped")
            let found = await model.suggestions(for: "path")
            XCTAssertEqual(found.map(\.name), ["Path to Exile"], "kind \"\(kind)\": its card was dropped from the suggestions")
        }
    }

    /// The stamp is read on every load, never cached. Stamping a refund takes the package out at the next load,
    /// and removing the stamp (the store writes a tombstone, kind "") brings it back.
    func testStampingAndUnstampingARefundMovesThePackageOnTheNextLoad() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e-path", [("Path to Exile", 1)])]])
        let (model, store) = try await box.open()
        XCTAssertEqual(model.ranked(for: "e-path").list.map(\.pkg.gk), [OrphanedSandbox.c1], "anchor: C is offered")

        store.setStamp(OrphanedSandbox.c1, kind: "refunded", note: "", at: "2026-08-01")
        try await model.load()
        XCTAssertEqual(model.ranked(for: "e-path").list.count, 0, "a refund stamped since the last load still offers C")

        store.removeStamp(OrphanedSandbox.c1)
        try await model.load()
        XCTAssertEqual(model.ranked(for: "e-path").list.map(\.pkg.gk), [OrphanedSandbox.c1], "removing the stamp does not bring C back")
    }
}
