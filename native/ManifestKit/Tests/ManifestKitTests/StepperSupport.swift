// The stepper's pins, shared by the Tally and Packages models (native-parity-table, no-layout-shift-under-pointer).
//
// TallyModel.step and PackagesModel.step are one rule on two models: one unit more or fewer, kept within 0 and the
// copy's qty, stepping from the clamped figure (the web's `got = Math.min(it.qty, received[it.key] || 0)`). The readout
// is the bundle's gotQty ("got/qty"). Each model's test file calls these functions with its own model, so the
// sequence has one home. The count is read from the model's `received`, which both models set from the store after
// each save.
//
// A step down at 0 is not pinned by the count: LedgerStore.setReceived drops any count at or below 0, so a missing
// max(_, 0) in step cannot show. The qty clamp and the clamped start can.

import XCTest
@testable import ManifestKit

@MainActor
protocol Stepping: AnyObject {
    var received: [String: Int] { get }
    var readouts: [String: String] { get }
    func step(key: String, by delta: Int) async
    func checkIn(key: String, count: Int) async throws
}

extension TallyModel: Stepping {}
extension PackagesModel: Stepping {}

/// Steps a copy with `qty` 2 and a count of 0 through both ends. The readout reads "got/2" after each step.
@MainActor
func assertStepperClamps(_ model: some Stepping, key: String, file: StaticString = #filePath, line: UInt = #line) async {
    let walk: [(delta: Int, got: Int, why: String)] = [
        (-1, 0, "a step down at 0 stays 0"),
        (1, 1, "one up from 0"),
        (1, 2, "one up to qty"),
        (1, 2, "a step up at qty stays at qty"),
        (-1, 1, "one down from qty"),
        (-1, 0, "one down to 0"),
        (-1, 0, "a step down at 0 stays 0 again"),
        (9, 2, "a large step up clamps at qty"),
        (-9, 0, "a large step down clamps at 0"),
    ]
    for (i, step) in walk.enumerated() {
        await model.step(key: key, by: step.delta)
        XCTAssertEqual(model.received[key] ?? 0, step.got, "step \(i + 1) (\(step.delta)): \(step.why)", file: file, line: line)
        XCTAssertEqual(model.readouts[key], "\(step.got)/2", "step \(i + 1): the readout follows the count", file: file, line: line)
    }
}

/// A count above qty (an old check-in on a line that later shrank) steps from the clamped figure: 5 of 2 reads
/// 2/2, and one down is 1, not 4. The copy has `qty` 2 and a count of 0.
@MainActor
func assertStepFromAnOverCount(_ model: some Stepping, key: String, file: StaticString = #filePath, line: UInt = #line) async throws {
    try await model.checkIn(key: key, count: 5)
    XCTAssertEqual(model.received[key], 5, "control: the over-count is stored", file: file, line: line)
    XCTAssertEqual(model.readouts[key], "2/2", "an over-count reads as the clamped figure", file: file, line: line)
    await model.step(key: key, by: -1)
    XCTAssertEqual(model.received[key], 1, "one down from an over-count of 5 on a qty of 2 is 1", file: file, line: line)
    XCTAssertEqual(model.readouts[key], "1/2", file: file, line: line)
}

/// gotQty written as "<got|qty>", the body of an override object (PackageCardModelTests.shimBundle takes it as it is,
/// TallyModelTests wraps it in an Object.assign), so a readout a model formatted itself cannot match it.
let gotQtyShim = "gotQty: function (got, qty) { return \"<\" + got + \"|\" + qty + \">\"; }"

/// For a model built on a bundle with `gotQtyShim`: the readout of a qty-2 copy is the bundle's text, before and after a step.
@MainActor
func assertReadoutComesFromTheBundle(_ model: some Stepping, key: String, file: StaticString = #filePath, line: UInt = #line) async {
    XCTAssertEqual(model.readouts[key], "<0|2>", "the model wrote the readout itself instead of calling gotQty", file: file, line: line)
    await model.step(key: key, by: 1)
    XCTAssertEqual(model.readouts[key], "<1|2>", "after a step the readout is still the bundle's", file: file, line: line)
}
