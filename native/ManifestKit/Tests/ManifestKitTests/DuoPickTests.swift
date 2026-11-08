import XCTest
@testable import ManifestKit

// The pick rule of the open Duo's right page (lane duo-tabs-spread).
final class DuoPickTests: XCTestCase {
    private let items = ["a", "b", "c"]

    func testThePickedItemWinsWhenPresent() {
        XCTAssertEqual(pickedOrFirst(items, picked: "b", id: { $0 }), "b")
    }

    func testAGonePickFallsToTheFirst() {
        XCTAssertEqual(pickedOrFirst(items, picked: "z", id: { $0 }), "a")
    }

    func testNoPickShowsTheFirst() {
        XCTAssertEqual(pickedOrFirst(items, picked: nil, id: { $0 }), "a")
    }

    func testAnEmptyListShowsNothing() {
        XCTAssertNil(pickedOrFirst([String](), picked: "a", id: { $0 }))
        XCTAssertNil(pickedOrFirst([String](), picked: nil, id: { $0 }))
    }
}
