// Orphaned composer tests (lane N7, native-build-lanes, orphan-entry-takes-one-input,
// envelope-names-match-normname, orphaned-mail-never-decides).
//
// One input records an envelope. A tap on a suggestion adds a card, a second tap bumps
// it, and the return key records anything not in the ledger. Each composer keeps its own
// draft (key: the envelope id, or new). Cancel keeps the draft, and only Save ends it.
// Recording an envelope checks nothing in. The contract is in OrphanedTestSupport.swift.
//
// Fake fixtures only. These tests read no Keychain item.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class OrphanedComposerTests: XCTestCase {
    // MARK: suggestions

    /// The input suggests cards that are still outstanding. Each check-in lowers the count
    /// and the seller count, and a card nobody owes any more is not suggested.
    func testSuggestionsListOnlyCardsStillOutstanding() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, store) = try await box.open()

        var found = await model.suggestions(for: "bolt")
        XCTAssertEqual(
            found, [Suggestion(name: "Lightning Bolt", qty: 3, sellerCount: 3)],
            "Lightning Bolt is owed by three sellers, one copy each")
        found = await model.suggestions(for: "bolt lightning")
        XCTAssertEqual(found.map(\.name), ["Lightning Bolt"], "every token must match, in any order")

        try store.commitReceived(OrphanedSandbox.a1Bolt, count: 1)
        try await model.load()
        found = await model.suggestions(for: "bolt")
        XCTAssertEqual(
            found, [Suggestion(name: "Lightning Bolt", qty: 2, sellerCount: 2)],
            "one copy in leaves two owed by two sellers")

        try store.commitReceived("B1|0|pLightningBolt", count: 1)
        try store.commitReceived(OrphanedSandbox.c1Bolt, count: 1)
        try await model.load()
        found = await model.suggestions(for: "bolt")
        XCTAssertEqual(found, [], "a card nobody owes any more is not suggested")
    }

    // MARK: one input

    /// A tap adds a card at the front. A second tap bumps its count and moves it to the top.
    /// The input clears after each add, so the keyboard never has to drop.
    func testATapAddsACardAndASecondTapBumpsIt() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, _) = try await box.open()
        model.open(.new)

        model.setInput("bolt", for: .new)
        try await model.addName("Lightning Bolt", for: .new)
        XCTAssertEqual(model.draft(for: .new).entries, orphanedCards(("Lightning Bolt", 1)), "a tap adds one copy")
        XCTAssertEqual(model.draft(for: .new).input, "", "the input clears after an add")

        try await model.addName("Lightning Bolt", for: .new)
        XCTAssertEqual(model.draft(for: .new).entries, orphanedCards(("Lightning Bolt", 2)), "a second tap bumps the count")

        try await model.addName("Counterspell", for: .new)
        XCTAssertEqual(
            model.draft(for: .new).entries, orphanedCards(("Counterspell", 1), ("Lightning Bolt", 2)), "a new card goes to the front")

        try await model.addName("Lightning Bolt", for: .new)
        XCTAssertEqual(
            model.draft(for: .new).entries, orphanedCards(("Lightning Bolt", 3), ("Counterspell", 1)),
            "a bumped card jumps to the top")
    }

    /// iOS smart punctuation types a curly apostrophe. The ledger keeps a straight one.
    /// Both reach the same card after normName, so the second add bumps the first.
    func testTypedNameMatchesAfterNormalizing() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, _) = try await box.open()
        model.open(.new)

        try await model.addName("Urza's Saga", for: .new)
        try await model.addName("Urza\u{2019}s Saga", for: .new)

        XCTAssertEqual(
            model.draft(for: .new).entries, orphanedCards(("Urza's Saga", 2)),
            "a curly and a straight apostrophe are one card, and the first spelling stays")
        let found = await model.suggestions(for: "urza")
        XCTAssertEqual(found.map(\.name), ["Urza's Saga"], "the suggestion finds the straight spelling")
    }

    /// The return key records a name that is not in the ledger, trimmed, as typed.
    /// A blank input and a punctuation-only input add nothing.
    func testReturnRecordsANameNotInTheLedgerAsTyped() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, _) = try await box.open()
        model.open(.new)

        model.setInput("  Mystery Card ", for: .new)
        try await model.addName(model.draft(for: .new).input, for: .new)
        XCTAssertEqual(model.draft(for: .new).entries, orphanedCards(("Mystery Card", 1)), "a typed name is recorded, trimmed")
        XCTAssertEqual(model.draft(for: .new).input, "", "the input clears")

        try await model.addName("   ", for: .new)
        try await model.addName("!!!", for: .new)
        XCTAssertEqual(model.draft(for: .new).entries, orphanedCards(("Mystery Card", 1)), "a blank or punctuation-only name adds nothing")
    }

    // MARK: a suggestion tap does not wait on the engine

    /// A model whose engine counts its normName calls. The count lives in the bundle, so the test reads it
    /// back through the engine like any other rule constant.
    private func countedComposer() async throws -> (model: OrphanedModel, normCalls: () async throws -> Int) {
        let probe = try probeBundleFile(
            "Rules.normCalls=0;(function(f){Rules.normName=function(s){Rules.normCalls++;return f(s)}})(Rules.normName)",
            for: self)
        let engine = try RulesEngine(bundleURL: probe)
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, _) = try await box.open(engine: engine)
        model.open(.new)
        return (model, {
            let json = try await engine.constant("normCalls")
            return try XCTUnwrap(Int(json))
        })
    }

    /// A name already in the suggestion pool adds with no normName call, so Save is ready the moment the
    /// card shows. A hop to the rules actor first left Save disabled while the app looked idle.
    /// Task.immediate runs addName up to its first suspension, so a draft already written when it
    /// returns shows that no hop came first.
    func testASuggestionTapWritesTheDraftBeforeAnyEngineCall() async throws {
        let (model, normCalls) = try await countedComposer()
        let before = try await normCalls()

        let tap = Task.immediate { try await model.addName("Lightning Bolt", for: .new) }
        XCTAssertEqual(
            model.draft(for: .new).entries, orphanedCards(("Lightning Bolt", 1)), "the draft is written before the tap returns")
        try await tap.value

        let bump = Task.immediate { try await model.addName("Lightning Bolt", for: .new) }
        XCTAssertEqual(model.draft(for: .new).entries, orphanedCards(("Lightning Bolt", 2)), "a second tap bumps with no wait too")
        try await bump.value

        let after = try await normCalls()
        XCTAssertEqual(after, before, "a name in the pool never reaches normName")
    }

    /// A typed name that is not in the pool still goes through normName: the ledger holds no key for it.
    func testATypedNameNotInThePoolStillGoesThroughTheEngine() async throws {
        let (model, normCalls) = try await countedComposer()
        let before = try await normCalls()

        try await model.addName("Mystery Card", for: .new)

        let after = try await normCalls()
        XCTAssertGreaterThan(after, before, "anchor: the counter counts a normName call")
        XCTAssertEqual(model.draft(for: .new).entries, orphanedCards(("Mystery Card", 1)), "the name still lands once the engine answers")
    }

    // MARK: save

    /// Save records the envelope at the top of the pile, writes it to the file, and checks
    /// nothing in. The draft ends and the composer closes.
    func testSaveRecordsAnEnvelopeAndChecksNothingIn() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, store) = try await box.open()
        let before = store.generation
        model.open(.new)
        try await model.addName("Lightning Bolt", for: .new)
        try await model.addName("Lightning Bolt", for: .new)
        model.setNote("9400 1111 0000", for: .new)
        box.clock.t = OrphanedSandbox.t0 + 1_000

        try await model.save(.new)

        XCTAssertEqual(model.envelopes.map(\.entries), [orphanedCards(("Lightning Bolt", 2))], "the model lists the new envelope")
        let rec = try box.savedEnvelopes()
        XCTAssertEqual(rec.count, 1, "the file holds one envelope")
        let e = try XCTUnwrap(rec.first)
        XCTAssertFalse((e["id"] as? String ?? "").isEmpty, "the envelope has an id")
        XCTAssertEqual(e["createdAt"] as? Double, OrphanedSandbox.t0 + 1_000, "createdAt is the store's clock")
        XCTAssertEqual(e["updatedAt"] as? Double, OrphanedSandbox.t0 + 1_000, "updatedAt is the store's clock")
        XCTAssertEqual(e["note"] as? String, "9400 1111 0000")
        XCTAssertEqual(OrphanedSandbox.entries(of: e), orphanedCards(("Lightning Bolt", 2)))
        XCTAssertEqual((e["photos"] as? [Any])?.count, 0, "a new envelope holds no photos")
        XCTAssertNil(e["deletedAt"], "a new envelope is live")
        XCTAssertGreaterThan(store.generation, before, "a save bumps the generation the sync client reads")
        XCTAssertEqual(try box.savedReceived(), [String: Int](), "recording checks no card in")
        XCTAssertEqual(try box.savedReceivedAt(), [String: Double](), "recording stamps no check-in time")
        XCTAssertNil(model.composing, "Save closes the composer")
        XCTAssertEqual(model.draft(for: .new), EnvelopeDraft(input: "", entries: [], note: ""), "Save ends the draft")

        // The next envelope sits above it.
        box.clock.t = OrphanedSandbox.t0 + 2_000
        model.open(.new)
        try await model.addName("Counterspell", for: .new)
        try await model.save(.new)
        XCTAssertEqual(
            try box.savedEnvelopes().map { OrphanedSandbox.entries(of: $0) },
            [orphanedCards(("Counterspell", 1)), orphanedCards(("Lightning Bolt", 2))], "newest first in the file")
        XCTAssertEqual(model.envelopes.map(\.entries), [orphanedCards(("Counterspell", 1)), orphanedCards(("Lightning Bolt", 2))], "and in the pile")
    }

    /// Two envelopes recorded at one instant still get two ids (web: newEnvelopeId has a sequence).
    func testTwoSavesAtOneInstantGetDistinctIds() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, _) = try await box.open()
        for name in ["Lightning Bolt", "Counterspell"] {
            model.open(.new)
            try await model.addName(name, for: .new)
            try await model.save(.new)
        }
        let ids = try box.savedEnvelopes().compactMap { $0["id"] as? String }
        XCTAssertEqual(ids.count, 2, "two envelopes were recorded")
        XCTAssertEqual(Set(ids).count, 2, "the two ids differ")
    }

    // MARK: edit

    /// Editing keeps the id, createdAt, photos and any field the client does not name,
    /// and it stamps a fresh updatedAt so the edit beats a stale copy in a merge.
    func testEditKeepsIdCreatedAtPhotosAndUnknownFields() async throws {
        let box = try makeOrphanedSandbox()
        let created = OrphanedSandbox.t0 - OrphanedSandbox.day
        try box.write(extra: ["envelopes": [
            OrphanedSandbox.env("e1", [("Lightning Bolt", 1)], created: created, updated: OrphanedSandbox.t0 - 1_000, note: "old",
                        photos: ["pho-1"], extra: ["colour": "manila"]),
        ]])
        let (model, _) = try await box.open()

        model.open(.edit("e1"))
        XCTAssertEqual(
            model.draft(for: .edit("e1")), EnvelopeDraft(input: "", entries: orphanedCards(("Lightning Bolt", 1)), note: "old"),
            "an edit composer starts on the saved envelope")
        try await model.addName("Counterspell", for: .edit("e1"))
        model.setNote("new", for: .edit("e1"))
        box.clock.t = OrphanedSandbox.t0 + 5_000
        try await model.save(.edit("e1"))

        XCTAssertEqual(try box.savedEnvelopes().count, 1, "an edit does not add a second envelope")
        let e = try box.savedEnvelope("e1")
        XCTAssertEqual(OrphanedSandbox.entries(of: e), orphanedCards(("Counterspell", 1), ("Lightning Bolt", 1)), "the edit is saved")
        XCTAssertEqual(e["note"] as? String, "new")
        XCTAssertEqual(e["updatedAt"] as? Double, OrphanedSandbox.t0 + 5_000, "an edit stamps a fresh updatedAt")
        XCTAssertEqual(e["createdAt"] as? Double, created, "an edit keeps createdAt")
        XCTAssertEqual(e["photos"] as? [String], ["pho-1"], "an edit keeps the photo ids")
        XCTAssertEqual(e["colour"] as? String, "manila", "an edit keeps a field the client does not name")
        XCTAssertEqual(model.envelopes.map(\.note), ["new"])
    }

    // MARK: drafts

    /// Opening a second composer never loses the first one's draft. Each target has its own.
    func testEachComposerKeepsItsOwnDraft() async throws {
        let box = try makeOrphanedSandbox()
        try box.write(extra: ["envelopes": [OrphanedSandbox.env("e1", [("Lightning Bolt", 1)], note: "saved")]])
        let (model, _) = try await box.open()

        model.open(.new)
        model.setInput("coun", for: .new)
        try await model.addName("Counterspell", for: .new)
        model.setInput("pat", for: .new)
        model.open(.edit("e1"))
        model.setInput("pon", for: .edit("e1"))
        try await model.addName("Ponder", for: .edit("e1"))

        XCTAssertEqual(
            model.draft(for: .new), EnvelopeDraft(input: "pat", entries: orphanedCards(("Counterspell", 1)), note: ""),
            "the new-envelope draft survived opening the second composer")
        XCTAssertEqual(
            model.draft(for: .edit("e1")),
            EnvelopeDraft(input: "", entries: orphanedCards(("Ponder", 1), ("Lightning Bolt", 1)), note: "saved"),
            "the edit draft is its own")
        XCTAssertEqual(model.composing, .edit("e1"), "the second composer is the open one")
    }

    /// Cancel closes the composer and keeps its draft, so reopening finds the work.
    /// Only Save ends a draft. Nothing is written to the file by typing or by Cancel.
    func testCancelKeepsTheDraftAndOnlySaveEndsIt() async throws {
        let box = try makeOrphanedSandbox()
        try box.write()
        let (model, store) = try await box.open()
        let bytes = try box.bytes()

        model.open(.new)
        try await model.addName("Lightning Bolt", for: .new)
        model.setInput("coun", for: .new)
        model.setNote("tape on the flap", for: .new)
        model.cancel()

        XCTAssertNil(model.composing, "Cancel closes the composer")
        let kept = EnvelopeDraft(input: "coun", entries: orphanedCards(("Lightning Bolt", 1)), note: "tape on the flap")
        XCTAssertEqual(model.draft(for: .new), kept, "Cancel keeps the draft")
        XCTAssertEqual(try box.bytes(), bytes, "a draft is never written to the ledger")
        XCTAssertEqual(store.generation, 0, "typing and Cancel are not edits")

        model.open(.new)
        XCTAssertEqual(model.composing, .new)
        XCTAssertEqual(model.draft(for: .new), kept, "reopening finds the same draft")

        try await model.save(.new)
        XCTAssertEqual(model.draft(for: .new), EnvelopeDraft(input: "", entries: [], note: ""), "Save ends the draft")
    }
}
