import CoreGraphics
import Foundation

/// The accessibility identifiers of the Find pill (the view is Manifest/FindPill.swift). The view sets them and the audit skip
/// reads them, so the two cannot drift apart (audit-skips-measured-flags). `pill` is the container, `field` and `clear` are its
/// own children.
public enum FindPillID {
    public static let pill = "find-pill"
    public static let field = "find-field"
    public static let clear = "find-clear"
}

/// The Find pill skip, owner ruling 95 b (2026-11-21 19:54 CST, audit-skips-measured-flags): the contrast audit skips a finding
/// whose element's frame shares area with the pill's frame. The pill's own field and clear control stay audited, so the pill
/// is not exempt from its own contrast. Any other audit type is kept.
///
/// `contrast` is true when the finding's audit type is `.contrast`: XCUIAccessibilityAuditType lives in XCTest, which the app
/// links no code against, so the caller reads the type and passes the answer. Kept, so false: a finding with no element, no
/// pill, an empty or null frame on either side, or a frame that only touches the pill's edge (an edge shares no area).
public func isUnderFindPill(contrast: Bool, identifier: String?, element: CGRect?, pill: CGRect?) -> Bool {
    guard contrast, let element, let pill, !element.isEmpty, !pill.isEmpty else { return false }
    if let identifier, identifier == FindPillID.field || identifier == FindPillID.clear { return false }
    return !pill.intersection(element).isEmpty
}
