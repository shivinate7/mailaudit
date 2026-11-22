import XCTest

// The Orphaned composer steps that OrphanedUITests and DuoSpreadUITests share (one home). The shared seed holds no
// envelope, so a test that needs one records it here, through the composer's own controls.

extension XCUIApplication {
    /// Types `typed` into the composer's one input and taps the suggestion named `name`.
    @MainActor func addEnvelopeCard(typed: String, name: String, file: StaticString = #filePath, line: UInt = #line) {
        let input = byID("orphaned-input")
        XCTAssertTrue(input.waitForExistence(timeout: 5), "the composer has no input", file: file, line: line)
        if !keyboards.element.exists { input.tap() }
        input.typeText(typed)
        let row = byID("suggestion:\(name)")
        XCTAssertTrue(row.waitForExistence(timeout: 5), "typing \(typed) did not suggest \(name)", file: file, line: line)
        row.tap()
    }

    /// Opens the composer, adds each card, taps Save, and waits for the pile to show an envelope.
    /// One page: the envelope card `envelope:<id>`. Two pages (duo-card-in-hand): the list cell `orphaned-cell:<id>`.
    @MainActor func recordEnvelope(_ cards: [(typed: String, name: String)], file: StaticString = #filePath, line: UInt = #line) {
        byID("orphaned-record").tap()
        for card in cards { addEnvelopeCard(typed: card.typed, name: card.name, file: file, line: line) }
        let save = byID("orphaned-save")
        XCTAssertTrue(save.waitForExistence(timeout: 5), "the composer has no Save", file: file, line: line)
        save.tap()
        let pile = descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH %@ OR identifier BEGINSWITH %@", "envelope:", "orphaned-cell:")).firstMatch
        XCTAssertTrue(pile.waitForExistence(timeout: 5), "Save did not put an envelope in the pile", file: file, line: line)
    }

    /// Opens the composer and types `text` into its one input, with the keys up.
    @MainActor func typeInComposer(_ text: String, file: StaticString = #filePath, line: UInt = #line) {
        byID("orphaned-record").tap()
        let input = byID("orphaned-input")
        XCTAssertTrue(input.waitForExistence(timeout: 5), "the composer has no input", file: file, line: line)
        if !keyboards.element.exists { input.tap() }
        input.typeText(text)
    }

    /// Drags down from above the keys, so the Orphaned page scrolls and the keys drop away. Card in Hand does the same
    /// (`scrollDismissesKeyboard(.interactively)` in HandScreen.swift). The drag runs from 20 % to 45 % of the window's
    /// height, which is above the keys when they are up.
    @MainActor func dragToHideKeys() {
        let from = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.2))
        let to = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45))
        from.press(forDuration: 0.05, thenDragTo: to, withVelocity: .slow, thenHoldForDuration: 0.3)
    }
}
