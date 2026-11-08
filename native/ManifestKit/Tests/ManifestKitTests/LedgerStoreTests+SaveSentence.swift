import Foundation
import XCTest
@testable import ManifestKit

extension LedgerStoreTests {
    /// A save that fails inside commit(noting:) sets the failure line to "Could not save. " and the caught
    /// error's localizedDescription. It does not use the error's raw description.
    func testFailedSaveNotingSetsTheLocalizedSentence() throws {
        let store = makeStore()  // never loaded, so the save throws
        var failure: String? = nil
        var caught: Error? = nil
        do {
            try store.commit(noting: &failure) {}
            XCTFail("a save before load throws")
        } catch {
            caught = error
        }
        let error = try XCTUnwrap(caught, "the save error is caught")
        XCTAssertEqual(failure, "Could not save. \(error.localizedDescription)",
                       "the failure line is the sentence built from localizedDescription")
    }
}
