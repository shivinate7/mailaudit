// RED-PROOF STUBS for the step 4 restyle (Tally, Ledger tab, Sync panel). THE BUILDER DELETES THIS FILE.
//
// Why a test file holds them: the test-author guard refuses any edit under ManifestKit/Sources, so the
// stubs that make each test fail on an assertion (never on a compile error) sit here, as the N6 lane's
// TallyRedStub did. Every value below is wrong on purpose.
//
// What the builder does:
//   1. Add the real types and members under native/ManifestKit/Sources/ManifestKit with the SAME names and
//      signatures. The contract is each test file's header.
//   2. Delete this file. A test-target type with a Sources type's name shadows it, so the tests would keep
//      reading the stub and stay red. A stub extension member next to the real member is an ambiguity error.
//   3. The count part is the exception: PackageCard.Part is in Sources, so no stub exists. PackageCardTokensTests
//      finds the part by its case name, and fails an assertion until `case count` exists.
//
// The stub token is "paper", a real name of shared/tokens.json, so XCTUnwrap never throws, a token test fails on its
// own comparison, and every contrast pair reads 1:1. Coverage and token-exists tests pass on the stub by construction. They guard later additions.

import Foundation
@testable import ManifestKit

/// Contract: TallyRowPaintTests.swift.
enum TallyRowPaint {
    enum Part: CaseIterable, Hashable, Sendable {
        case surface, border, disclosure, name, meta, ratio, rate, left, across
    }

    static func token(_ part: Part, done: Bool) -> String? { "paper" }
}

/// Contract: LedgerPaintTests.swift.
enum LedgerPaint {
    enum Part: CaseIterable, Hashable, Sendable {
        case title, groupLabel, cardSurface, cardBorder, rowRule, rowTitle, rowSub, rowValue, rowValueAdvisory,
             disclosure, resetText, resetFill, cancelText, versionWhen, versionLabel, versionLabelSoft,
             versionFigure, restoreText, restoreFill, restoreBorder, errorText, errorFill,
             panelRule, partLabel, partValue, photoProgress, advisoryRule
    }

    static func token(_ part: Part, armed: Bool) -> String? { "paper" }
}

/// Contract: TallyModelTests.swift (the edge bar).
extension TallyRow {
    var barFraction: Double? { 0 }
}

/// Contract: SyncPanelTests.swift.
enum SyncPanel {
    static func lastSyncText(_ at: Double?, locale: Locale, timeZone: TimeZone) -> String { "stub" }
}

extension SyncClient {
    var serverStatus: String { "stub" }
    var lastSyncAt: Double? { 0 }
}
