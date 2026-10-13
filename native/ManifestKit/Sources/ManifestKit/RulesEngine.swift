import Foundation
import JavaScriptCore

public enum RulesFailure: Error, Equatable {
    case bundleUnreadable(String)
    case bundleDidNotLoad(String)
    case unknownFunction(String)
    case threw(String)
}

/// The synchronous core: the bundled web rules (Sources/ManifestKit/rules.js) in one JSContext.
/// Not thread-safe. RulesEngine wraps it in an actor; LedgerStore.load uses it
/// directly because load is synchronous (rules-run-in-javascriptcore).
final class RulesCore {
    typealias Failure = RulesFailure

    private let context: JSContext
    private let invoke: JSValue

    init(bundleURL: URL) throws {
        guard let source = try? String(contentsOf: bundleURL, encoding: .utf8) else {
            throw Failure.bundleUnreadable(bundleURL.path)
        }
        guard let ctx = JSContext() else { throw Failure.bundleDidNotLoad("no JSContext") }
        var thrown: String?
        ctx.exceptionHandler = { _, e in thrown = e?.toString() }
        ctx.evaluateScript(source)
        // One trampoline: name and args JSON in, result JSON out. "null" stands for undefined.
        let glue = """
        (function (name, argsJSON) {
          var f = Rules[name];
          if (typeof f !== "function") throw new Error("unknown function: " + name);
          var out = JSON.stringify(f.apply(null, JSON.parse(argsJSON)));
          return out === undefined ? "null" : out;
        })
        """
        guard thrown == nil, let fn = ctx.evaluateScript(glue), thrown == nil else {
            throw Failure.bundleDidNotLoad(thrown ?? "unknown")
        }
        ctx.exceptionHandler = nil
        context = ctx
        invoke = fn
    }

    /// Calls `Rules[name](...JSON.parse(argsJSON))` and returns the result as JSON.
    func call(_ name: String, _ argsJSON: String) throws -> String {
        var thrown: String?
        context.exceptionHandler = { _, e in thrown = e?.toString() }
        defer { context.exceptionHandler = nil }
        let out = invoke.call(withArguments: [name, argsJSON])
        if let thrown {
            throw thrown.hasPrefix("Error: unknown function")
                ? Failure.unknownFunction(name) : Failure.threw(thrown)
        }
        guard let s = out?.toString() else { throw Failure.threw("no result") }
        return s
    }
}

/// Runs the bundled web rules in JavaScriptCore.
/// Data crosses as JSON strings. The context lives inside the actor, so it is
/// only ever touched from one place (rules-run-in-javascriptcore).
public actor RulesEngine {
    public typealias Failure = RulesFailure

    private let core: RulesCore

    public init(bundleURL: URL) throws { core = try RulesCore(bundleURL: bundleURL) }

    /// Calls `Rules[name](...JSON.parse(argsJSON))` and returns the result as JSON.
    public func call(_ name: String, _ argsJSON: String) throws -> String {
        try core.call(name, argsJSON)
    }
}
