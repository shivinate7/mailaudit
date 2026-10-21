import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

/// A photo as stored and sent: the bytes and the type the Worker file name carries.
public struct PhotoBlob: Equatable, Sendable {
    public let data: Data
    public let mime: String
    public init(data: Data, mime: String) { self.data = data; self.mime = mime }
}

/// The web rule, shrinkImage in src/app.jsx (label-photos-downscale-to-2000px).
public enum PhotoDownscale {
    public static let maxEdge = 2000
    public static let quality = 0.8
    /// A picture that needs no shrink and weighs less than this passes through untouched.
    static let passThroughBytes = 800_000

    /// Bytes that do not decode come back as they were, as the web falls back to the original file.
    public static func shrink(_ data: Data) -> PhotoBlob {
        let octet = "application/octet-stream"
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
              let w = props[kCGImagePropertyPixelWidth] as? Int,
              let h = props[kCGImagePropertyPixelHeight] as? Int else {
            return PhotoBlob(data: data, mime: octet)
        }
        let own = (CGImageSourceGetType(src) as String?).flatMap { UTType($0)?.preferredMIMEType } ?? octet
        // The long edge is the same either way a tag turns the picture.
        let long = max(w, h)
        if long <= maxEdge && data.count < passThroughBytes { return PhotoBlob(data: data, mime: own) }

        // The transform turns the pixels upright, so the JPEG needs no orientation tag.
        let opts: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: min(long, maxEdge),
        ]
        let out = NSMutableData()
        guard let image = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary),
              let dest = CGImageDestinationCreateWithData(out, UTType.jpeg.identifier as CFString, 1, nil) else {
            return PhotoBlob(data: data, mime: own)
        }
        CGImageDestinationAddImage(dest, image, [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary)
        guard CGImageDestinationFinalize(dest) else { return PhotoBlob(data: data, mime: own) }
        return PhotoBlob(data: out as Data, mime: "image/jpeg")
    }
}
