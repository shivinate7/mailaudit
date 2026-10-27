// The one home of the WCAG 2 contrast check for the paint tests (palette-tokens-contrast-floor).
// PackageCardTokensTests held it first. It moved here so every paint suite calls one copy.

import Foundation
import XCTest
@testable import ManifestKit

enum Contrast {
    /// The tokens of shared/tokens.json, as the app decodes them.
    static func palette() throws -> Palette {
        try Palette.decode(Data(contentsOf: PaletteTests.tokensURL))
    }

    /// WCAG 2 relative luminance of a token that is opaque.
    static func luminance(_ c: Palette.RGBA) -> Double {
        func channel(_ v: UInt8) -> Double {
            let s = Double(v) / 255
            return s <= 0.03928 ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(c.red) + 0.7152 * channel(c.green) + 0.0722 * channel(c.blue)
    }

    static func ratio(_ a: String, on b: String, _ palette: Palette) throws -> Double {
        let x = luminance(try XCTUnwrap(palette.tokens[a], "no token \(a)"))
        let y = luminance(try XCTUnwrap(palette.tokens[b], "no token \(b)"))
        return (max(x, y) + 0.05) / (min(x, y) + 0.05)
    }
}
