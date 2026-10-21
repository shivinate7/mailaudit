// Shared helpers for the lane N10 photo tests (native-build-lanes, native/ManifestKit).
//
// Pictures are made in code with CoreGraphics and ImageIO. The package tests build for
// macOS, so nothing here imports UIKit. Every name starts with Photo, so it cannot collide
// with a helper from another lane in the same test module.

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers
import XCTest
@testable import ManifestKit

enum PhotoTestKit {
    /// The fixed clock the golden and ledger tests use.
    static let t0: Double = 1_786_543_380_000

    static func engine() throws -> RulesEngine {
        try RulesEngine(bundleURL: RulesGoldenTests.bundleURL)
    }

    /// A fresh folder under the temp dir. The caller removes it in tearDown.
    static func tempDir(_ label: String = "n10") throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appending(path: "\(label)-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    // MARK: pictures

    struct Size: Equatable, CustomStringConvertible {
        let w, h: Int
        var description: String { "\(w)x\(h)" }
    }

    struct ImageInfo {
        /// "public.jpeg", "public.png" and so on. Nil when ImageIO reads no type.
        let type: String?
        /// The stored pixel size, before the orientation tag turns it.
        let stored: Size
        /// EXIF orientation, 1 when the file has none.
        let orientation: Int
        /// The size a person sees: the stored size, turned on its side for tags 5 to 8.
        var upright: Size { (5...8).contains(orientation) ? Size(w: stored.h, h: stored.w) : stored }
    }

    /// Nil when the bytes are not a picture ImageIO can open.
    static func info(_ data: Data) -> ImageInfo? {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
              let w = props[kCGImagePropertyPixelWidth] as? Int,
              let h = props[kCGImagePropertyPixelHeight] as? Int else { return nil }
        return ImageInfo(
            type: CGImageSourceGetType(src) as String?,
            stored: Size(w: w, h: h),
            orientation: props[kCGImagePropertyOrientation] as? Int ?? 1)
    }

    /// A colour gradient, or random pixels when `noise` is set. Noise does not compress,
    /// so a noise PNG is large and a gradient PNG is small.
    static func image(width: Int, height: Int, noise: Bool = false) -> CGImage {
        let space = CGColorSpace(name: CGColorSpace.sRGB)!
        let info = CGImageAlphaInfo.noneSkipLast.rawValue
        let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
                            bytesPerRow: width * 4, space: space, bitmapInfo: info)!
        if noise {
            arc4random_buf(ctx.data!, width * 4 * height)
        } else {
            let colors = [CGColor(red: 0.9, green: 0.4, blue: 0.1, alpha: 1),
                          CGColor(red: 0.1, green: 0.3, blue: 0.8, alpha: 1)] as CFArray
            let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1])!
            ctx.drawLinearGradient(gradient, start: .zero,
                                   end: CGPoint(x: width, y: height), options: [])
        }
        return ctx.makeImage()!
    }

    private static func encode(_ image: CGImage, as type: UTType, properties: [CFString: Any]) -> Data {
        let out = NSMutableData()
        let dest = CGImageDestinationCreateWithData(out, type.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(dest, image, properties as CFDictionary)
        precondition(CGImageDestinationFinalize(dest), "the test picture did not encode")
        return out as Data
    }

    static func png(width: Int, height: Int, noise: Bool = false) -> Data {
        encode(image(width: width, height: height, noise: noise), as: .png, properties: [:])
    }

    /// `orientation` is the EXIF tag. An iPhone held upright saves a landscape picture with tag 6.
    static func jpeg(width: Int, height: Int, orientation: Int = 1, quality: Double = 0.9) -> Data {
        encode(image(width: width, height: height), as: .jpeg, properties: [
            kCGImageDestinationLossyCompressionQuality: quality,
            kCGImagePropertyOrientation: orientation,
        ])
    }

    /// The same pixels as `data`, encoded again as a JPEG at `quality`. Its size is the yardstick
    /// for the quality test: a lower quality is smaller, a higher one is larger.
    static func reencodedSize(_ data: Data, quality: Double) -> Int? {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { return nil }
        return encode(img, as: .jpeg, properties: [kCGImageDestinationLossyCompressionQuality: quality]).count
    }

    // MARK: ledger files

    static func liveEnvelope(_ id: String, photos: [String] = [], updatedAt: Double = 1_000) -> [String: Any] {
        ["id": id, "createdAt": 1_000, "updatedAt": updatedAt, "note": "",
         "entries": [["name": "Lightning Bolt", "qty": 1]], "photos": photos]
    }

    /// A discard leaves a tombstone: deletedAt set, entries and photos emptied.
    static func deletedEnvelope(_ id: String) -> [String: Any] {
        ["id": id, "createdAt": 900, "updatedAt": 2_000, "deletedAt": 2_000, "note": "",
         "entries": [Any](), "photos": [Any]()]
    }

    /// Writes a clean ledger and returns the bytes written.
    @discardableResult
    static func writeLedger(to url: URL, envelopes: [[String: Any]]) throws -> Data {
        let doc: [String: Any] = [
            "mailday": 1, "items": [Any](), "received": [String: Any](),
            "receivedAt": [String: Any](), "stamps": [String: Any](), "envelopes": envelopes,
        ]
        let data = try JSONSerialization.data(withJSONObject: doc, options: [.sortedKeys])
        try data.write(to: url)
        return data
    }

    static func readLedger(_ url: URL) throws -> [String: Any] {
        try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
    }

    static func envelope(_ id: String, in ledger: [String: Any]) -> [String: Any]? {
        (ledger["envelopes"] as? [[String: Any]])?.first { ($0["id"] as? String) == id }
    }

    // MARK: rules bundle

    /// The Worker file name for a photo, from the bundle's photoName (photo-rules.mjs).
    static func fileName(_ id: String, mime: String, engine: RulesEngine) async throws -> String {
        let out = try await engine.call("photoName", "[\"\(id)\",\"\(mime)\"]")
        return try XCTUnwrap(JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String)
    }

    /// The id the Worker route reads from a file name, from the bundle's photoIdFromName.
    static func idFromName(_ name: String, engine: RulesEngine) async throws -> String? {
        let out = try await engine.call("photoIdFromName", "[\"\(name)\"]")
        return try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String
    }
}
