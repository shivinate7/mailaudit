// Red branch only. The Find pill skip's symbols (ManifestKit, FindPillSkip.swift) are not on this branch, so this stand-in
// lets the UI test target compile. isUnderFindPill never skips, which is the old behaviour, so each Find pill case fails on
// its own assert. Never merge this file into a branch that holds FindPillSkip.swift: it would shadow ManifestKit's symbols
// in this module, and the pill cases would test the stand-in instead of the product.
import CoreGraphics

enum FindPillID {
    static let pill = "find-pill"
    static let field = "find-field"
    static let clear = "find-clear"
}

func isUnderFindPill(contrast: Bool, identifier: String?, element: CGRect?, pill: CGRect?) -> Bool {
    false
}
