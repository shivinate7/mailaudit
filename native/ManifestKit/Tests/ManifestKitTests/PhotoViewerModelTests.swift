// Photo viewer model tests (lane N10, photo-thumbnails-and-viewer).
//
// The web viewer is a modal dialog: focus moves in on open, Escape or a tap closes it, Tab stays on
// it, and on close focus returns to the thumbnail that opened it. The model holds that behaviour, so
// swift test can pin it. The SwiftUI view reads the model and does three things the package tests
// cannot check: it adds the isModal accessibility trait, it moves real VoiceOver focus to `focus`,
// and it maps the hardware Escape key and the VoiceOver escape gesture to `handle(.escape)`. Those
// three are hand checks for lane N11.
//
// Contract the tests name:
//   public enum PhotoFocus: Equatable, Sendable { case none, viewer, thumbnail(String) }
//   public enum PhotoKey: Equatable, Sendable { case escape, tab, other }
//   @MainActor @Observable public final class PhotoViewerModel {
//       public init()
//       public private(set) var shown: String?       // the photo id on screen, nil when shut
//       public private(set) var focus: PhotoFocus    // where focus sits
//       public var isModal: Bool                      // true while a photo is shown
//       public func open(_ id: String, hasImage: Bool)  // no image to show: nothing opens
//       public func dismiss()                         // a tap anywhere; Escape runs it too
//       public func handle(_ key: PhotoKey)           // escape dismisses, tab is swallowed
//   }
//
// Red-first: see PhotoStubs.swift.

import XCTest
@testable import ManifestKit

@MainActor
final class PhotoViewerModelTests: XCTestCase {
    func testItStartsShutWithNoFocusClaimed() {
        let viewer = PhotoViewerModel()

        XCTAssertNil(viewer.shown)
        XCTAssertEqual(viewer.focus, .none)
        XCTAssertFalse(viewer.isModal)
    }

    /// Open: the photo is shown, the viewer is modal, and focus moves into it.
    func testOpeningShowsThePhotoModallyAndTakesFocus() {
        let viewer = PhotoViewerModel()

        viewer.open("pho-a", hasImage: true)

        XCTAssertEqual(viewer.shown, "pho-a")
        XCTAssertTrue(viewer.isModal)
        XCTAssertEqual(viewer.focus, .viewer)
    }

    /// The web opens the dialog only when the picture has loaded (zoom && urls[zoom]). A modal over
    /// nothing would trap a VoiceOver user on an empty screen.
    func testAPhotoWithNoImageOpensNothingAndKeepsFocusWhereItWas() {
        let viewer = PhotoViewerModel()

        viewer.open("pho-a", hasImage: false)

        XCTAssertNil(viewer.shown)
        XCTAssertFalse(viewer.isModal)
        XCTAssertEqual(viewer.focus, .none)
    }

    /// Escape closes it, and focus goes back to the thumbnail that opened it.
    func testEscapeClosesAndReturnsFocusToTheThumbnail() {
        let viewer = PhotoViewerModel()
        viewer.open("pho-a", hasImage: true)

        viewer.handle(.escape)

        XCTAssertNil(viewer.shown)
        XCTAssertFalse(viewer.isModal)
        XCTAssertEqual(viewer.focus, .thumbnail("pho-a"))
    }

    /// A tap anywhere closes it the same way.
    func testATapClosesAndReturnsFocusToTheThumbnail() {
        let viewer = PhotoViewerModel()
        viewer.open("pho-b", hasImage: true)

        viewer.dismiss()

        XCTAssertNil(viewer.shown)
        XCTAssertEqual(viewer.focus, .thumbnail("pho-b"))
    }

    /// The picture is the only thing to reach, so Tab and other keys leave the viewer open and the
    /// focus on it.
    func testTabAndOtherKeysDoNotLeaveTheViewer() {
        let viewer = PhotoViewerModel()
        viewer.open("pho-a", hasImage: true)

        viewer.handle(.tab)
        viewer.handle(.other)

        XCTAssertEqual(viewer.shown, "pho-a")
        XCTAssertTrue(viewer.isModal)
        XCTAssertEqual(viewer.focus, .viewer)
    }

    /// Focus returns to the thumbnail of the photo just closed, not the first one opened.
    func testFocusReturnsToTheLatestOpener() {
        let viewer = PhotoViewerModel()
        viewer.open("pho-a", hasImage: true)
        viewer.dismiss()

        viewer.open("pho-b", hasImage: true)
        viewer.handle(.escape)

        XCTAssertEqual(viewer.focus, .thumbnail("pho-b"))
    }

    /// Escape or a tap on a viewer that is shut does nothing, and the focus stays where it was.
    func testDismissWhileShutChangesNothing() {
        let viewer = PhotoViewerModel()
        viewer.open("pho-a", hasImage: true)
        viewer.dismiss()

        viewer.handle(.escape)
        viewer.dismiss()

        XCTAssertNil(viewer.shown)
        XCTAssertEqual(viewer.focus, .thumbnail("pho-a"))
    }
}
