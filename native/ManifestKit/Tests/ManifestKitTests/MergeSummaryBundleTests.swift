// The merge notice's wording comes from the rules bundle (owner ruling, waiting page item 60, choice a).
// mergeSummary in src/merge-rules.mjs is bundled as the web wrote it, so the native notice cannot drift
// from the web's. Each expected string below is the web function's output for the same stats, run in node
// and pasted as a literal, so the test fails on a wrong word, a missing plural or a wrong join.
//
// Fake fixtures only. No Keychain item is read.

import Foundation
import XCTest
@testable import ManifestKit

/// mergeSummary(stats) from the rules bundle, through RulesEngine. Returns nil after one XCTFail that
/// names the cause when the bundle cannot run it. A throw would end the case before its other asserts run.
@MainActor
enum MergeSummaryOracle {
    /// The seven counts a reply's `stats` carries. A count not named is zero.
    static func stats(_ counts: [String: Int] = [:]) -> [String: Int] {
        let kinds = ["itemsAdded", "checkInsAdded", "envelopesAdded", "stampsAdded",
                     "checkInsRemoved", "envelopesRemoved", "stampsRemoved"]
        return Dictionary(uniqueKeysWithValues: kinds.map { ($0, counts[$0] ?? 0) })
    }

    static func summary(_ stats: [String: Int], file: StaticString = #filePath, line: UInt = #line) async -> String? {
        let out: String
        do {
            let engine = try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
            let args = try JSONSerialization.data(withJSONObject: [stats] as [Any])
            out = try await engine.call("mergeSummary", String(decoding: args, as: UTF8.self))
        } catch {
            XCTFail("the rules bundle does not run mergeSummary: \(error)", file: file, line: line)
            return nil
        }
        guard let text = (try? JSONSerialization.jsonObject(with: Data(out.utf8), options: .fragmentsAllowed)) as? String else {
            XCTFail("mergeSummary did not return a string: \(out)", file: file, line: line)
            return nil
        }
        return text
    }
}

@MainActor
final class MergeSummaryBundleTests: XCTestCase {
    /// Empty stats: the other device was merely ahead, and the sentence says so.
    func testNothingNewSaysTheOtherDeviceHadNothingNew() async {
        guard let text = await MergeSummaryOracle.summary(MergeSummaryOracle.stats()) else { return }
        XCTAssertEqual(text, "Merged \u{2014} the other device had nothing new.",
                       "mergeSummary of empty stats")
    }

    /// One of each added kind: every noun takes its singular form.
    func testOneOfEachAddedKindUsesTheSingularWords() async {
        let s = MergeSummaryOracle.stats(["itemsAdded": 1, "checkInsAdded": 1, "envelopesAdded": 1, "stampsAdded": 1])
        guard let text = await MergeSummaryOracle.summary(s) else { return }
        XCTAssertEqual(text,
                       "Merged \u{2014} 1 new line, 1 check-in, 1 envelope and 1 stamp from the other device. Nothing of yours was lost.",
                       "mergeSummary of one of each added kind")
    }

    /// Three kinds of addition: the list joins with commas and the last pair with "and", and each count is plural.
    func testThreeKindsJoinWithCommasAndAndWithPlurals() async {
        let s = MergeSummaryOracle.stats(["itemsAdded": 2, "checkInsAdded": 3, "stampsAdded": 4])
        guard let text = await MergeSummaryOracle.summary(s) else { return }
        XCTAssertEqual(text,
                       "Merged \u{2014} 2 new lines, 3 check-ins and 4 stamps from the other device. Nothing of yours was lost.",
                       "mergeSummary of three added kinds, plural")
    }

    /// Removals and no additions: no addition sentence, only the removal sentence, under the "Merged." lead.
    func testRemovalsOnlyNameTheRemovalsUnderTheShortLead() async {
        let s = MergeSummaryOracle.stats(["checkInsRemoved": 1, "envelopesRemoved": 2, "stampsRemoved": 3])
        guard let text = await MergeSummaryOracle.summary(s) else { return }
        XCTAssertEqual(text,
                       "Merged. Removed by the other device's later changes: un-checked 1 card, 2 envelopes, 3 stamps.",
                       "mergeSummary of removals only")
    }

    /// Additions and a removal: the addition sentence comes first, and the removal sentence replaces "Nothing of yours was lost."
    func testAdditionsAndRemovalsGiveTheAdditionSentenceThenTheRemovalSentence() async {
        let s = MergeSummaryOracle.stats(["checkInsAdded": 2, "stampsRemoved": 1])
        guard let text = await MergeSummaryOracle.summary(s) else { return }
        XCTAssertEqual(text,
                       "Merged \u{2014} 2 check-ins from the other device. Removed by the other device's later changes: 1 stamp.",
                       "mergeSummary of additions and a removal")
    }

    /// Additions and no removal: the sentence ends by saying nothing of the person's was lost.
    func testAdditionsWithNoRemovalsEndWithNothingWasLost() async {
        let s = MergeSummaryOracle.stats(["itemsAdded": 1, "envelopesAdded": 2])
        guard let text = await MergeSummaryOracle.summary(s) else { return }
        XCTAssertEqual(text,
                       "Merged \u{2014} 1 new line and 2 envelopes from the other device. Nothing of yours was lost.",
                       "mergeSummary of additions with no removals")
    }

    /// Full size: every one of the seven counts is set, one of them large, so the whole sentence is exercised.
    func testFullSizeWithEverySevenCountSetGivesBothSentences() async {
        let s = MergeSummaryOracle.stats([
            "itemsAdded": 120, "checkInsAdded": 3, "envelopesAdded": 2, "stampsAdded": 1,
            "checkInsRemoved": 2, "envelopesRemoved": 1, "stampsRemoved": 4,
        ])
        guard let text = await MergeSummaryOracle.summary(s) else { return }
        XCTAssertEqual(text,
                       "Merged \u{2014} 120 new lines, 3 check-ins, 2 envelopes and 1 stamp from the other device. Removed by the other device's later changes: un-checked 2 cards, 1 envelope, 4 stamps.",
                       "mergeSummary with every count set")
    }
}
