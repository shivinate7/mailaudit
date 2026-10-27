import CoreGraphics
import XCTest
@testable import ManifestKit

// Duo spread rules (lane duo-spread-kit; decision duo-card-in-hand; measurement duo-fold-and-keyboard).
// The open iPhone Duo's inner screen splits at the fold: two pages side by side, or stacked when the fold is horizontal.
//
// API this file pins. The builder adds it in native/ManifestKit/Sources/ManifestKit/DuoSpread.swift.
//   public enum DuoHinge: Equatable, Sendable { case none, closed, halfOpen, flat }
//   public enum DuoSpread: Equatable, Sendable {
//       case single
//       case sideBySide(left: CGRect, right: CGRect)   // a fold taller than wide
//       case stacked(top: CGRect, bottom: CGRect)      // a fold wider than tall
//       public static func layout(window: CGSize, folds: [CGRect], hinge: DuoHinge) -> DuoSpread
//       public var pageRects: (left: CGRect, right: CGRect)? { get }   // nil on one page
//       public static func spreads(tab: DuoTab) -> Bool
//   }
//   public enum DuoTab: Equatable, Sendable { case ledger, tally, orphaned, cardInHand }  // the enum may hold more cases
//   public enum DuoTabBar {
//       public static func frame(in spread: DuoSpread, height: CGFloat) -> CGRect?
//   }
//
// pageRects: the answer page is `right` side by side. When stacked, the answer page is `left`, the first rect, on top.
// Rects are in window points, origin top-left.

final class DuoSpreadTests: XCTestCase {
    // The open inner screen is 951 x 669 pt. Its fold is 40 pt wide, at 455.5 to 495.5 pt.
    private let window = CGSize(width: 951, height: 669)
    private let fold = CGRect(x: 455.5, y: 0, width: 40, height: 669)
    private let leftPage = CGRect(x: 0, y: 0, width: 455.5, height: 669)
    private let rightPage = CGRect(x: 495.5, y: 0, width: 455.5, height: 669)

    // Held tall, the same screen is 669 x 951 pt, and its fold runs across it at 455.5 to 495.5 pt.
    private let heldTall = CGSize(width: 669, height: 951)
    private let heldTallFold = CGRect(x: 0, y: 455.5, width: 669, height: 40)

    func testFortyPointFoldGivesTwoPages() throws {
        for hinge in [DuoHinge.halfOpen, .flat] {
            XCTAssertEqual(DuoSpread.layout(window: window, folds: [fold], hinge: hinge),
                           .sideBySide(left: leftPage, right: rightPage),
                           "\(hinge): a 40 pt fold splits 951 pt into two 455.5 pt pages")
        }
        let rects = try XCTUnwrap(DuoSpread.layout(window: window, folds: [fold], hinge: .halfOpen).pageRects)
        XCTAssertEqual(rects.right, rightPage, "the answer page is second when side by side")
    }

    func testClosedIsSingle() {
        XCTAssertEqual(DuoSpread.layout(window: window, folds: [fold], hinge: .closed), .single,
                       "a closed device shows the outer screen as one page")
    }

    func testFoldAtEdgeIsSingle() {
        // A fold that reaches an edge leaves one page empty, so it does not split the screen.
        let cases: [(size: CGSize, fold: CGRect)] = [
            (window, CGRect(x: 0, y: 0, width: 40, height: 669)),      // left edge
            (window, CGRect(x: 911, y: 0, width: 40, height: 669)),    // right edge
            (heldTall, CGRect(x: 0, y: 0, width: 669, height: 40)),    // top edge
            (heldTall, CGRect(x: 0, y: 911, width: 669, height: 40)),  // bottom edge
        ]
        for (size, edge) in cases {
            XCTAssertEqual(DuoSpread.layout(window: size, folds: [edge], hinge: .halfOpen), .single,
                           "a fold at the edge, \(edge), gives one page")
        }
    }

    func testStackedPutsAnswerOnTop() throws {
        let spread = DuoSpread.layout(window: heldTall, folds: [heldTallFold], hinge: .halfOpen)
        let top = CGRect(x: 0, y: 0, width: 669, height: 455.5)
        let bottom = CGRect(x: 0, y: 495.5, width: 669, height: 455.5)

        XCTAssertEqual(spread, .stacked(top: top, bottom: bottom), "held tall, the fold stacks the pages")
        let rects = try XCTUnwrap(spread.pageRects)
        XCTAssertEqual(rects.left, top, "the answer page is first when stacked, so it sits on top")
        XCTAssertEqual(rects.right, bottom, "the other page is second when stacked, so it sits below")
    }

    func testBarUnderRightPage() {
        let spread = DuoSpread.layout(window: window, folds: [fold], hinge: .halfOpen)

        XCTAssertEqual(DuoTabBar.frame(in: spread, height: 50), CGRect(x: 495.5, y: 619, width: 455.5, height: 50),
                       "two pages side by side put the tab bar under the right page")
    }

    func testBarNilWhenStacked() {
        let stacked = DuoSpread.layout(window: heldTall, folds: [heldTallFold], hinge: .halfOpen)

        XCTAssertNil(DuoTabBar.frame(in: stacked, height: 50), "stacked pages keep the system bar")
        XCTAssertNil(DuoTabBar.frame(in: .single, height: 50), "one page keeps the system bar")
    }

    func testLedgerFullWidth() {
        XCTAssertFalse(DuoSpread.spreads(tab: .ledger), "the Ledger tab stays full width on the open Duo")
        for tab in [DuoTab.tally, .orphaned, .cardInHand] {
            XCTAssertTrue(DuoSpread.spreads(tab: tab), "\(tab) spreads over both pages")
        }
    }
}
