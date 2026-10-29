// Masthead motion and save slot tests (lane N8, native-build-lanes,
// motion-reduced-leaves-it-drawn, motion-letterhead-composes-once, masthead-save-slot-reserved).
//
// Two pure values the masthead view reads. XCUITest cannot read an opacity or a scale, so
// the resting frames are pinned here and the view draws from them. Nothing below proves the
// view calls them: the UI tests in MastheadBackupUITests check that the slot and the
// letterhead exist and hold their size.
//
// Red-first. The builder adds this in native/ManifestKit/Sources/ManifestKit/:
//   public struct LetterheadFrame: Equatable, Sendable {
//       public var sealScale, sealOpacity, ruleFill, titleOpacity, talliesOpacity: Double   // ruleFill 0...1
//       public init(sealScale: Double, sealOpacity: Double, ruleFill: Double, titleOpacity: Double, talliesOpacity: Double)
//   }
//   public enum LetterheadMotion {
//       public static let final: LetterheadFrame                       // everything drawn
//       public static func start(reduceMotion: Bool) -> LetterheadFrame // the first frame the view draws
//       public static func duration(reduceMotion: Bool) -> Double       // seconds the compose runs
//   }
//   public enum SaveIndicator: CaseIterable, Equatable, Sendable {
//       case idle, saving, saved, failed
//       public var label: String
//       public static let reservedCharacters: Int
//   }
// Until these exist this file does not compile. The stub the builder starts from returns wrong
// values, so each case fails on an XCTAssert and not on a compile error
// (testing-throwing-assert-bad-kill).
//
// Web values matched (src/app.jsx): the seal is pressed from scale .68; the rules draw from
// nothing; the title and tallies fade in; the sequence ends by about 1060 ms and never runs
// past 1.1 s; a run inside 700 ms read as one blur. Under reduced motion the first frame is
// the final frame. The save slot holds one of four labels and reserves the longest.

import XCTest
@testable import ManifestKit

final class LetterheadMotionTests: XCTestCase {
    /// The finished letterhead: the seal down at full size, the rules full, the type opaque.
    func testFinalFrameIsFullyDrawn() {
        let f = LetterheadMotion.final
        XCTAssertEqual(f.sealScale, 1)
        XCTAssertEqual(f.sealOpacity, 1)
        XCTAssertEqual(f.ruleFill, 1)
        XCTAssertEqual(f.titleOpacity, 1)
        XCTAssertEqual(f.talliesOpacity, 1)
    }

    /// Reduced motion draws the final frame at once and runs no sequence. Nothing is hidden.
    func testReducedMotionShowsTheFinalFrameAtOnce() {
        XCTAssertEqual(LetterheadMotion.start(reduceMotion: true), LetterheadMotion.final,
                       "reduced motion starts on a frame that is not the final one")
        XCTAssertEqual(LetterheadMotion.duration(reduceMotion: true), 0, "reduced motion runs a sequence")
    }

    /// With motion on, the first frame is undrawn on every channel and the sequence takes
    /// more than 0.7 s and at most 1.1 s.
    func testFullMotionStartsUndrawnAndEndsWithinAboutASecond() {
        let s = LetterheadMotion.start(reduceMotion: false)
        XCTAssertNotEqual(s, LetterheadMotion.final, "the first frame is already the final one")
        XCTAssertEqual(s.sealScale, 0.68, accuracy: 0.001, "the seal is pressed from .68")
        XCTAssertEqual(s.sealOpacity, 0)
        XCTAssertEqual(s.ruleFill, 0)
        XCTAssertEqual(s.titleOpacity, 0)
        XCTAssertEqual(s.talliesOpacity, 0)
        let d = LetterheadMotion.duration(reduceMotion: false)
        XCTAssertGreaterThan(d, 0.7, "a run inside 700 ms reads as one blur")
        XCTAssertLessThanOrEqual(d, 1.1, "the last beat must land by about 1.1 s")
    }
}

final class SaveSlotTests: XCTestCase {
    static let nbsp = "\u{00A0}"

    /// The four labels are the web labels, character for character.
    func testLabelsAreTheWebLabels() {
        XCTAssertEqual(SaveIndicator.idle.label, Self.nbsp)
        XCTAssertEqual(SaveIndicator.saving.label, "saving\u{2026}")
        XCTAssertEqual(SaveIndicator.saved.label, "saved \u{2713}")
        XCTAssertEqual(SaveIndicator.failed.label, "couldn\u{2019}t save")
        XCTAssertEqual(SaveIndicator.allCases.count, 4)
    }

    /// The idle slot is one no-break space, never empty, so its line box keeps the row's height.
    func testIdleSlotIsNeverEmpty() {
        for s in SaveIndicator.allCases { XCTAssertFalse(s.label.isEmpty, "\(s) has an empty label") }
        XCTAssertEqual(SaveIndicator.idle.label.unicodeScalars.map(\.value), [0x00A0])
    }

    /// The slot reserves the longest label, counted. A longer message fails here.
    func testSlotReservesTheLongestLabel() {
        let longest = SaveIndicator.allCases.map(\.label.count).max()
        XCTAssertEqual(longest, 13, "the longest label is `couldn\u{2019}t save`")
        XCTAssertEqual(SaveIndicator.reservedCharacters, longest, "the reservation is not the longest label")
        for s in SaveIndicator.allCases {
            XCTAssertLessThanOrEqual(s.label.count, SaveIndicator.reservedCharacters, "\(s) outgrows the slot")
        }
    }
}

// Step 5: the letterhead composes once per launch, not once per tab (motion-letterhead-composes-once).
// The masthead sits on four tabs, so four copies of the view exist, and each held its own "composed" flag.
// The flag moves above the views, onto the model, which a launch builds once. The first copy to appear
// asks the model for its first frame and gets the animated one. Every later copy gets the final frame and
// draws at once. XCUITest cannot read an opacity or a scale, and a seeded run draws the final frame, so no
// UI test can see this; the claim is pinned here, on the value each copy draws from.
//
// Red-first. The builder adds, in native/ManifestKit/Sources/ManifestKit/ (Step5RedStubs.swift holds the stub):
//   extension MastheadModel {
//       /// The first frame a masthead copy draws. The first call on a model gives
//       /// LetterheadMotion.start(reduceMotion:). Every later call gives LetterheadMotion.final.
//       public func claimStartFrame(reduceMotion: Bool) -> LetterheadFrame
//   }
// and MastheadView calls it in place of reading LetterheadMotion.start itself.

@MainActor
final class MastheadComposeOnceTests: XCTestCase {
    /// A model with no ledger behind it: the compose flag reads nothing from the store.
    func model() throws -> MastheadModel {
        let url = FileManager.default.temporaryDirectory.appending(path: "step5-compose-\(UUID().uuidString).json")
        return MastheadModel(engine: try RulesEngine(bundleURL: RulesGoldenTests.bundleURL), store: LedgerStore(fileURL: url, now: { 0 }))
    }

    /// The first copy composes. The second, third and fourth copies (one per remaining tab) start drawn.
    func testTheFirstCopyComposesAndEveryLaterCopyStartsDrawn() throws {
        let m = try model()

        XCTAssertEqual(m.claimStartFrame(reduceMotion: false), LetterheadMotion.start(reduceMotion: false), "the first copy does not compose")
        for copy in 2...4 {
            XCTAssertEqual(m.claimStartFrame(reduceMotion: false), LetterheadMotion.final, "copy \(copy) composes again")
        }
    }

    /// A launch builds a new model, so the next launch composes again.
    func testANewLaunchComposesAgain() throws {
        let first = try model()
        _ = first.claimStartFrame(reduceMotion: false)
        _ = first.claimStartFrame(reduceMotion: false)

        let next = try model()
        XCTAssertEqual(next.claimStartFrame(reduceMotion: false), LetterheadMotion.start(reduceMotion: false), "the flag outlived its launch")
    }

    /// Reduced motion draws the final frame at once, for the first copy and every later one.
    func testReducedMotionStartsEveryCopyDrawn() throws {
        let m = try model()

        for copy in 1...3 {
            XCTAssertEqual(m.claimStartFrame(reduceMotion: true), LetterheadMotion.final, "copy \(copy) is not drawn under reduced motion")
        }
    }
}
