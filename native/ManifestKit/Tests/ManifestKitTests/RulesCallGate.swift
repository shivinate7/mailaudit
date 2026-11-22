// The one home for holding a rules call inside the JavaScript engine until a test opens a gate, so a case can act
// while the call is suspended in an await. The hand tests and the packages reload race both use it.

import Foundation
import JavaScriptCore
import XCTest
@testable import ManifestKit

/// Holds a rules call inside its JS function until the test lets go. A wrapped rules function calls the global `__gate()`
/// there, and the call blocks on the engine's thread, with no clock to race. It is a latch: once opened it stays open, so a
/// read that runs again passes straight through. The wait is capped at 10 s, so a gate nobody opens cannot block an engine
/// thread for good.
final class RulesCallGate: @unchecked Sendable {
    private let cond = NSCondition()
    private var isEntered = false
    private var isOpen = false

    /// True once a call is blocked in the gate. A poll reads it on the main actor and never waits on it there: a call
    /// hops back to the main actor between its engine calls.
    var entered: Bool { cond.lock(); defer { cond.unlock() }; return isEntered }

    /// Runs on the engine's thread, inside the JS call.
    func hold() {
        cond.lock()
        defer { cond.unlock() }
        isEntered = true
        let deadline = Date(timeIntervalSinceNow: 10)
        while !isOpen && cond.wait(until: deadline) {}
    }

    func open() {
        cond.lock()
        isOpen = true
        cond.broadcast()
        cond.unlock()
    }

    /// The JS function `__gate`. It is built here, off the main actor: a block made inside a @MainActor test is main-actor
    /// isolated and traps when JavaScriptCore calls it from the engine's thread.
    var jsFunction: @convention(block) () -> Void { { [self] in hold() } }
}

/// The real rules bundle with one function wrapped: `fn` calls `__gate()` whenever `condition` holds, where `arguments` is
/// that call's arguments. The bundle is written into `dir`, which the caller removes.
func gatedRulesBundle(in dir: URL, wrapping fn: String, when condition: String) throws -> URL {
    let gated = """

    Rules.\(fn)=(function(o){return function(){if(\(condition)){__gate()}return o.apply(null,arguments)}})(Rules.\(fn));
    """
    let url = dir.appending(path: "rules-gated.js")
    try (try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8) + gated).write(to: url, atomically: true, encoding: .utf8)
    return url
}

/// Gives the engine's JSContext the global `__gate`, which calls `gate`. RulesEngine keeps its JSContext private and has no
/// hook for a test, so Mirror reaches it with no product code. A renamed field fails here with its message, never as a pass.
@MainActor
func installGate(_ gate: RulesCallGate, on engine: RulesEngine) throws {
    let core = try XCTUnwrap(Mirror(reflecting: engine).children.first { $0.label == "core" }?.value as? RulesCore,
                             "RulesEngine no longer keeps its RulesCore in a field named core")
    let context = try XCTUnwrap(Mirror(reflecting: core).children.first { $0.label == "context" }?.value as? JSContext,
                                "RulesCore no longer keeps its JSContext in a field named context")
    context.setObject(unsafeBitCast(gate.jsFunction, to: AnyObject.self), forKeyedSubscript: "__gate" as NSString)
}

/// Polls up to 3 s for `cond`, so a state that settles after an await is still caught. It asserts nothing.
@MainActor
func eventually(_ cond: @escaping @MainActor () -> Bool) async throws {
    for _ in 0..<60 {
        if cond() { return }
        try await Task.sleep(for: .milliseconds(50))
    }
}
