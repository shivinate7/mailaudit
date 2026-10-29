// Past-transit page: the stamp kinds it offers (duo-card-in-hand, item 25, deferred at 15:34 CDT: "the past-transit page
// uses the existing stamp list, with no Lost kind"; one-stamp-per-package).
//
// The list is the web's STAMP_KINDS (src/view-rules.mjs, "order stamps"), in the web's order, with the web's labels. The
// web side pins the six labels in test/app.test.mjs (case 37.3, the stamp editor). This file pins what the page reads.
// One home: STAMP_KINDS lives in the rules bundle, so the web editor and the page read the same list, and the page reads
// it through the engine (RulesEngine.constant), not from a copy.
//
// The API the test names:
//
//   extension PastTransitModel {
//       public static let stampKinds: [StampKind]    // the six kinds the page offers, in this order
//   }
//   public struct StampKind: Equatable, Sendable { public let kind: String; public let label: String }
//
// A struct or a labelled tuple with `kind` and `label` both satisfy the test. `stamp(_:kind:)` keeps taking any kind: the
// limit lives in the list, not in the model (PastTransitModel.stamp). No Lost kind exists, so none is listed.

import XCTest
@testable import ManifestKit

@MainActor
final class PastTransitStampKindsTests: XCTestCase {
    /// Kind keys and labels as the web writes them. A seventh kind, a missing one, a Lost kind or another order fails.
    func testPageOffersTheWebsSixKindsInOrder() {
        let offered = PastTransitModel.stampKinds.map { "\($0.kind)|\($0.label)" }
        XCTAssertEqual(offered, [
            "claim|Claim filed",
            "refunded|Refunded",
            "contacted|Seller contacted",
            "reshipped|Reshipped",
            "partial|Partial refund",
            "other|Other",
        ], "the past-transit page offers the web's six stamp kinds, in the web's order, and no Lost kind")
    }
}
