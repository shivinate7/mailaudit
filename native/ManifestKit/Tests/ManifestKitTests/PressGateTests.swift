// Press gate tests (lane N4b, auto-apply-happens-now, no-layout-shift-under-pointer).
//
// The owner ruled on 2026-10-20: a reply holds while a press is down and for PRESS_TAIL_MS after it,
// and "hover doesn't count". A press holds for at most PRESS_MAX_MS, so a lost lift cannot hold for
// ever. The verdict is pressHeld in the rules bundle; Swift holds no copy of it
// (rules-run-in-javascriptcore). The contract is the header of N4bRedStubs.swift.
//
// Not pinned by ST: which SwiftUI or UIKit events call down(), up(), cancel(), hover() and
// scrolled(). That wiring needs a device or a simulator.
//
// Every clock and sleep here is under test control. Fake fixtures only.

import Foundation
import XCTest
@testable import ManifestKit

@MainActor
final class PressGateTests: XCTestCase {
    var rig: PressRig!

    override func setUp() async throws {
        rig = try await PressRig.make()
    }

    func held() async -> Bool { await rig.gate.isHeld() }

    /// Waits until `condition` holds. Fails after `timeout` seconds. For a state that must arrive.
    func waitFor(_ what: String, timeout: Double = 1, line: UInt = #line, _ condition: @escaping @MainActor () -> Bool) async {
        let end = Date().addingTimeInterval(timeout)
        while !condition() {
            if Date() > end {
                XCTFail("timed out waiting for: \(what)", line: line)
                return
            }
            try? await Task.sleep(for: .milliseconds(5))
        }
    }

    // A press holds while it is down, and for the tail after it lifts. The tail ends on the beat:
    // one millisecond short still holds, the full tail does not.
    func testAPressHoldsWhileDownAndForTheTailAfterTheLift() async {
        let fresh = await held()
        XCTAssertFalse(fresh, "a gate nothing has touched holds nothing, so a cold open applies at once")
        rig.gate.down()
        rig.advance(100)
        let down = await held()
        XCTAssertTrue(down, "a finger on the screen holds")
        rig.gate.up()
        rig.advance(rig.tail - 1)
        let inTail = await held()
        XCTAssertTrue(inTail, "one millisecond short of the tail still holds")
        rig.advance(1)
        let after = await held()
        XCTAssertFalse(after, "the full tail ends the hold")
    }

    // A lift that is lost (iOS never reports it) holds for at most PRESS_MAX_MS.
    func testALostLiftEndsAtPressMax() async {
        rig.gate.down()
        rig.advance(rig.maxHold - 1)
        let inside = await held()
        XCTAssertTrue(inside, "a press holds up to the limit")
        rig.advance(1)
        let past = await held()
        XCTAssertFalse(past, "the limit ends a hold whose lift was lost")
    }

    // iOS cancels a touch when a scroll takes it. A cancel ends the press as a lift does,
    // and the tail follows it.
    func testACancelEndsAPressLikeALift() async {
        rig.gate.down()
        rig.advance(300)
        rig.gate.cancel()
        rig.advance(rig.tail - 1)
        let inTail = await held()
        XCTAssertTrue(inTail, "the tail follows a cancel")
        rig.advance(1)
        let after = await held()
        XCTAssertFalse(after)
    }

    // Hover never holds, and never stretches a tail. The first lines are a control: a press does hold,
    // so the lines after it can fail.
    func testHoverNeverHoldsAndNeverExtendsATail() async {
        rig.gate.down()
        rig.gate.up()
        let pressed = await held()
        XCTAssertTrue(pressed, "control: a press holds")
        rig.advance(rig.tail)
        let clear = await held()
        XCTAssertFalse(clear, "control: and its tail ends")

        rig.gate.hover()
        rig.advance(1_000)
        rig.gate.hover()
        let hovered = await held()
        XCTAssertFalse(hovered, "hover alone holds nothing")

        rig.gate.down()
        rig.gate.up()
        rig.advance(rig.tail - 200)
        rig.gate.hover()
        rig.advance(200)
        let end = await held()
        XCTAssertFalse(end, "a hover inside the tail does not extend it")
    }

    // Scrolling never holds. A touch scroll is a touch down and then a cancel, so it holds exactly as
    // the touch does and no longer: the scroll frames add nothing to it.
    func testScrollingNeverHoldsOnItsOwnAndAddsNothingToATouch() async {
        rig.gate.scrolled()
        rig.advance(500)
        rig.gate.scrolled()
        let alone = await held()
        XCTAssertFalse(alone, "a wheel or trackpad scroll holds nothing")

        rig.gate.down()
        for _ in 0..<10 {
            rig.advance(100)
            rig.gate.scrolled()
        }
        let moving = await held()
        XCTAssertTrue(moving, "the finger is still down while the page moves")
        rig.gate.cancel()
        rig.advance(rig.tail - 100)
        rig.gate.scrolled()
        rig.advance(100)
        let end = await held()
        XCTAssertFalse(end, "a scroll frame inside the tail does not extend it")
    }

    // The verdict is the bundle's. A probe that always answers true, and one that always answers
    // false, move the gate with it, so Swift keeps no second copy of the rule.
    func testTheVerdictComesFromTheBundle() async throws {
        let yes = try await PressRig.make(bundle: try probeBundleFile("Rules.pressHeld=function(){return true}", for: self))
        let alwaysHeld = await yes.gate.isHeld()
        XCTAssertTrue(alwaysHeld, "a bundle that holds, holds")

        let no = try await PressRig.make(bundle: try probeBundleFile("Rules.pressHeld=function(){return false}", for: self))
        no.gate.down()
        let neverHeld = await no.gate.isHeld()
        XCTAssertFalse(neverHeld, "a bundle that never holds, never holds")
    }

    // The gate hands pressHeld what its signature asks for: downAt (nil when no touch is down), the
    // time of the last down, up or cancel, and now.
    func testTheBundleGetsDownAtLastAtAndNow() async throws {
        let probe = try probeBundleFile(
            "Rules.__seen=[];Rules.pressHeld=function(d,l,n){Rules.__seen.push([d,l,n]);return false}", for: self)
        let r = try await PressRig.make(bundle: probe)
        let t0 = PressRig.t0
        r.gate.down()
        r.advance(100)
        _ = await r.gate.isHeld()
        r.gate.up()
        r.advance(50)
        _ = await r.gate.isHeld()

        let json = try await r.engine.constant("__seen")
        let seen = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[Any]])
        func same(_ call: [Any], _ expected: [Double?]) -> Bool {
            call.count == 3 && zip(call, expected).allSatisfy { got, want in
                if let want { return (got as? NSNumber)?.doubleValue == want }
                return got is NSNull
            }
        }
        XCTAssertTrue(seen.contains { same($0, [t0, t0, t0 + 100]) }, "a touch down: downAt, lastAt and now. Got \(seen)")
        XCTAssertTrue(seen.last.map { same($0, [nil, t0 + 100, t0 + 150]) } ?? false, "after the lift downAt is null. Got \(seen)")
    }

    // MARK: waiting

    // With nothing held, waitClear returns without a sleep. While a press holds, it sleeps a short
    // re-check and looks again, until the tail ends.
    func testWaitClearChecksAgainUntilTheTailEnds() async {
        let idle = Flag()
        Task {
            await rig.gate.waitClear()
            idle.value = true
        }
        await waitFor("waitClear returns with nothing held") { idle.value }
        XCTAssertTrue(rig.sleeps.delays.isEmpty, "no press, no wait")

        rig.gate.down()
        let done = Flag()
        Task {
            await rig.gate.waitClear()
            done.value = true
        }
        await waitFor("it sleeps while the finger is down") { self.rig.sleeps.delays.count >= 1 }
        XCTAssertFalse(done.value)
        XCTAssertTrue(
            rig.sleeps.delays.allSatisfy { $0 > 0 && $0 <= 300 },
            "a re-check is short, so a reply lands in under a second after the tail. Got \(rig.sleeps.delays)")

        rig.gate.up()
        rig.sleeps.release()
        await waitFor("it checks again inside the tail") { self.rig.sleeps.delays.count >= 2 }
        XCTAssertFalse(done.value, "the tail still holds")

        rig.advance(rig.tail)
        rig.sleeps.release()
        await waitFor("it returns once the tail is over") { done.value }
    }

    // A cancelled wait ends at once. Stop relies on it.
    func testACancelledWaitReturns() async {
        rig.gate.down()
        let done = Flag()
        let task = Task {
            await rig.gate.waitClear()
            done.value = true
        }
        await waitFor("it sleeps") { self.rig.sleeps.delays.count >= 1 }
        task.cancel()
        rig.sleeps.release()
        await waitFor("a cancelled wait returns") { done.value }
    }
}

@MainActor
final class Flag {
    var value = false
}
