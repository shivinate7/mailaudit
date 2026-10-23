import Foundation

/// The colour tokens of shared/tokens.json, decoded as the file holds them
/// (shared-tokens-and-fixtures). The app turns these into SwiftUI colours.
public struct Palette: Equatable, Sendable {
    public struct RGBA: Equatable, Sendable {
        public let red: UInt8
        public let green: UInt8
        public let blue: UInt8
        public let alpha: Double

        /// "#RRGGBB" or "#RGB" in either case, or "rgba(r,g,b,a)" with optional spaces, as CSS reads them. Throws on anything else.
        public init(parsing text: String) throws {
            let bad = CocoaError(.coderInvalidValue)
            if text.hasPrefix("#") {
                let hex = text.dropFirst()
                guard hex.count == 6 || hex.count == 3, hex.allSatisfy(\.isHexDigit) else { throw bad }
                // #RGB doubles each digit, so #abc reads as #aabbcc.
                let full = hex.count == 3 ? hex.flatMap { [$0, $0] } : Array(hex)
                guard let v = Int(String(full), radix: 16) else { throw bad }
                (red, green, blue, alpha) = (UInt8(v >> 16 & 255), UInt8(v >> 8 & 255), UInt8(v & 255), 1)
            } else if text.hasPrefix("rgba("), text.hasSuffix(")") {
                let p = text.dropFirst(5).dropLast().split(separator: ",", omittingEmptySubsequences: false)
                    .map { $0.trimmingCharacters(in: .whitespaces) }
                guard p.count == 4, let r = UInt8(p[0]), let g = UInt8(p[1]), let b = UInt8(p[2]),
                    let a = Double(p[3]), (0...1).contains(a)
                else { throw bad }
                (red, green, blue, alpha) = (r, g, b, a)
            } else {
                throw bad
            }
        }
    }

    public let tokens: [String: RGBA]

    /// Reads every key it is given; no token name is held here.
    public static func decode(_ data: Data) throws -> Palette {
        let texts = try JSONDecoder().decode([String: String].self, from: data)
        return Palette(tokens: try texts.mapValues(RGBA.init(parsing:)))
    }
}
