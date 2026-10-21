// Photo downscale tests (lane N10, label-photos-downscale-to-2000px).
//
// An envelope photo is a snap of a mailing label. It keeps a tracking number the person would not
// type, so it keeps a 2000px long edge at JPEG 0.8. This is the web rule, shrinkImage in src/app.jsx:
//   scale = min(1, 2000 / long edge)
//   a picture that needs no shrink and weighs under 800,000 bytes passes through untouched;
//   any other picture is drawn at round(w * scale) by round(h * scale) and encoded as JPEG 0.8;
//   bytes that do not decode come back as they were.
//
// Red-first. The builder moves the declarations in PhotoStubs.swift into
// native/ManifestKit/Sources/ManifestKit, makes them real, and deletes the stub file
// (testing-throwing-assert-bad-kill: the stubs return wrong values, so each test fails on an assert).
//
// Contract the tests name:
//   public struct PhotoBlob: Equatable, Sendable { public let data: Data; public let mime: String }
//   public enum PhotoDownscale {
//       public static let maxEdge: Int            // 2000
//       public static let quality: Double         // 0.8
//       public static func shrink(_ data: Data) -> PhotoBlob
//   }
//
// Pictures are made in code. The orientation case matters: an iPhone saves a portrait label as a
// landscape picture with EXIF tag 6, and the shrink must keep it upright.

import Foundation
import XCTest
@testable import ManifestKit

final class PhotoDownscaleTests: XCTestCase {
    typealias Kit = PhotoTestKit

    /// The long edge and the JPEG quality are the two numbers label-photos-downscale-to-2000px holds.
    func testLongEdgeIs2000AndQualityIsPoint8() {
        XCTAssertEqual(PhotoDownscale.maxEdge, 2000)
        XCTAssertEqual(PhotoDownscale.quality, 0.8, accuracy: 1e-9)
    }

    func testLandscapePhotoComesOutAt2000x1500AsJpeg() throws {
        let source = Kit.png(width: 4032, height: 3024)

        let blob = PhotoDownscale.shrink(source)

        let info = try XCTUnwrap(Kit.info(blob.data), "the shrunk bytes are not a picture")
        XCTAssertEqual(info.type, "public.jpeg", "a shrunk photo is a JPEG")
        XCTAssertEqual(blob.mime, "image/jpeg")
        XCTAssertEqual(info.upright, Kit.Size(w: 2000, h: 1500))
        XCTAssertEqual(Array(blob.data.prefix(3)), [0xFF, 0xD8, 0xFF], "JPEG bytes start FF D8 FF")
    }

    func testPortraitPhotoComesOutAt1500x2000() throws {
        let blob = PhotoDownscale.shrink(Kit.png(width: 3024, height: 4032))

        let info = try XCTUnwrap(Kit.info(blob.data), "the shrunk bytes are not a picture")
        XCTAssertEqual(info.upright, Kit.Size(w: 1500, h: 2000), "the long edge is the height here")
        XCTAssertEqual(blob.mime, "image/jpeg")
    }

    /// A portrait label from an iPhone: 4000x3000 stored, tag 6 turns it upright to 3000x4000.
    /// The shrink must come out 1500x2000 as a person sees it, not 2000x1500 on its side.
    func testOrientationTagKeepsAPortraitLabelUpright() throws {
        let source = Kit.jpeg(width: 4000, height: 3000, orientation: 6)
        XCTAssertEqual(Kit.info(source)?.upright, Kit.Size(w: 3000, h: 4000), "the source should read as portrait")

        let blob = PhotoDownscale.shrink(source)

        let info = try XCTUnwrap(Kit.info(blob.data), "the shrunk bytes are not a picture")
        XCTAssertEqual(info.upright, Kit.Size(w: 1500, h: 2000), "the label must stay upright")
    }

    /// scale is capped at 1: a smaller picture is never drawn larger. A large file at scale 1 is
    /// still encoded again, as JPEG, at the same size.
    func testLargeFileAtScaleOneIsEncodedAgainAndNeverUpscaled() throws {
        let source = Kit.png(width: 1000, height: 800, noise: true)
        XCTAssertGreaterThanOrEqual(source.count, 800_000, "the source should be a large file")

        let blob = PhotoDownscale.shrink(source)

        let info = try XCTUnwrap(Kit.info(blob.data), "the shrunk bytes are not a picture")
        XCTAssertEqual(info.type, "public.jpeg", "a large file is encoded as JPEG")
        XCTAssertEqual(blob.mime, "image/jpeg")
        XCTAssertEqual(info.upright, Kit.Size(w: 1000, h: 800), "a picture is never upscaled")
        XCTAssertLessThan(blob.data.count, source.count, "the JPEG should be lighter than the noise PNG")
    }

    /// Under 800,000 bytes and no shrink needed: the original file passes through, byte for byte,
    /// keeping its own type. A PNG screenshot stays a PNG.
    func testSmallPictureAtScaleOnePassesThroughUntouched() {
        let source = Kit.png(width: 800, height: 600)
        XCTAssertLessThan(source.count, 800_000, "the source should be a small file")

        let blob = PhotoDownscale.shrink(source)

        XCTAssertEqual(blob.data, source, "a small picture must come back byte for byte")
        XCTAssertEqual(blob.mime, "image/png", "it keeps its own type")
    }

    /// The web falls back to the original file when the canvas path fails. Bytes that are no
    /// picture come back as they were, with the type the Worker file name maps to .bin.
    func testBytesThatAreNoPictureComeBackUnchanged() {
        let source = Data("not a picture".utf8)

        let blob = PhotoDownscale.shrink(source)

        XCTAssertEqual(blob.data, source)
        XCTAssertEqual(blob.mime, "application/octet-stream")
    }

    /// The JPEG quality is 0.8 and not another value. The quantization tables depend on the quality alone,
    /// so the output must carry the tables an ImageIO encode at 0.8 carries, and not those of 0.5 or 1.0.
    func testTheJpegIsEncodedAtQualityPointEight() throws {
        let blob = PhotoDownscale.shrink(Kit.png(width: 3024, height: 4032))

        let got = try XCTUnwrap(Kit.quantTables(blob.data), "the output is not a JPEG with tables")
        for quality in [0.5, 0.8, 1.0] {
            let tables = try XCTUnwrap(Kit.quantTables(Kit.jpeg(width: 64, height: 64, quality: quality)))
            XCTAssertEqual(got == tables, quality == 0.8, "output tables equal the tables of quality \(quality)? Only 0.8 should")
        }
    }
}
