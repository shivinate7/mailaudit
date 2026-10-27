// RED-PROOF STUBS for step 5 (the masthead on every tab). THE BUILDER DELETES THIS FILE.
//
// Why a test file holds them: the test-author guard refuses any edit under ManifestKit/Sources, so the
// stubs that make each test fail on an assertion (never on a compile error) sit here, as Step4RedStubs did.
// Every value below is wrong on purpose.
//
// What the builder does:
//   1. Add the real type and members under native/ManifestKit/Sources/ManifestKit with the SAME names and
//      signatures. The contract is the header of MastheadModelTests.swift and MastheadComposeOnceTests.
//   2. Delete this file. A test-target type with a Sources type's name shadows it, so the tests would keep
//      reading the stub and stay red. A stub extension member next to the real member is an ambiguity error.
//   3. Add `countLine` to src/view-rules.mjs (test/view-rules.test.mjs V21 pins it), then `npm run build`, so
//      rules.js carries it. MastheadRuleLine in MastheadLineSupport.swift asks the bundle for it.

import Foundation
@testable import ManifestKit

/// Contract: MastheadModelTests.swift. The four tabs the masthead sits on.
enum MastheadTab: CaseIterable, Sendable { case ledger, orphaned, tally, packages }

extension MastheadModel {
    /// Contract: MastheadModelTests.swift (the count line per tab). Wrong on purpose: no tab has this line.
    func countLine(for tab: MastheadTab) -> String { "stub" }

    /// Contract: MastheadComposeOnceTests. Wrong on purpose: every copy composes, so none is ever told to start drawn.
    func claimStartFrame(reduceMotion: Bool) -> LetterheadFrame { LetterheadMotion.start(reduceMotion: reduceMotion) }
}
