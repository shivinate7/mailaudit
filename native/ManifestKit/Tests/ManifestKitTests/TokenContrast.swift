// The one home of the WCAG 2 contrast measure the token tests share (palette-tokens-contrast-floor).
// PackageCardTokensTests, OrphanedPaintTokensTests and ControlPaintTokensTests call it, and so can
// the next paint enum's test. A new paint test calls it, and never keeps a copy.

import Foundation
import XCTest
@testable import ManifestKit

enum TokenContrast {
    /// WCAG 2 relative luminance of a token that is opaque.
    static func luminance(_ c: Palette.RGBA) -> Double {
        func channel(_ v: UInt8) -> Double {
            let s = Double(v) / 255
            return s <= 0.03928 ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(c.red) + 0.7152 * channel(c.green) + 0.0722 * channel(c.blue)
    }

    /// The ratio of two tokens by name. An unknown name fails the test through XCTUnwrap.
    static func ratio(_ a: String, on b: String, _ palette: Palette) throws -> Double {
        let x = luminance(try XCTUnwrap(palette.tokens[a], "no token \(a)"))
        let y = luminance(try XCTUnwrap(palette.tokens[b], "no token \(b)"))
        return (max(x, y) + 0.05) / (min(x, y) + 0.05)
    }
}
