import Foundation

/// What counts as a press on iOS: a touch down until it lifts or iOS cancels it (a scroll takes the
/// touch, so a scroll is a cancel). Hover and scrolling never hold (auto-apply-happens-now). The
/// verdict is `pressHeld` in the rules bundle, and Swift holds no copy of it (rules-run-in-javascriptcore).
@MainActor
public final class PressGate {
    /// A re-check while held. Under the tail, so a reply lands under a second after the tail ends.
    static let recheckMs = 250

    private let engine: RulesEngine
    private let now: @Sendable () -> Double
    private let sleep: @Sendable (Int) async -> Void
    private var downAt: Double?
    /// The time of the last down, up or cancel. 0 for a gate nothing has touched.
    private var lastAt: Double = 0

    public init(engine: RulesEngine, now: @escaping @Sendable () -> Double, sleep: @escaping @Sendable (Int) async -> Void) {
        self.engine = engine
        self.now = now
        self.sleep = sleep
    }

    public func down() {
        downAt = now()
        lastAt = downAt ?? 0
    }

    public func up() {
        downAt = nil
        lastAt = now()
    }

    public func cancel() { up() }

    /// Hover and scrolling are not a press. They are no-ops, so no caller can extend a hold by mistake.
    public func hover() {}
    public func scrolled() {}

    public func isHeld() async -> Bool {
        let down = downAt.map { String($0) } ?? "null"
        guard let out = try? await engine.call("pressHeld", "[\(down),\(lastAt),\(now())]") else { return false }
        return out == "true"
    }

    /// Returns when nothing is held, or when the task is cancelled (a stop ends a hold).
    public func waitClear() async {
        while await isHeld() {
            if Task.isCancelled { return }
            await sleep(Self.recheckMs)
            if Task.isCancelled { return }
        }
    }
}
