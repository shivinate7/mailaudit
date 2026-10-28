# Simulator boots and load follow the global machine rules

Kind: process

Home: docs/decisions/one-simulator-per-mac.md

**Status:** ruled. The owner ruled on 2026-10-26 at 16:35 CDT that the global load brake governs mailaudit. The owner ruled on 2026-10-28 at 02:31 CDT that simulator tests run through the shared `sim-test`.

**Holds while:** the global load brake and the simulator boot cap stay in force, no rule checks load outside a lane, and `bin/sim-test` in claude-settings still reuses a booted iPhone and shuts down only what it booted.

Mailaudit's load and simulator rules come from the owner's global settings. This record keeps only the steps those rules do not cover.

## Global homes

- Load at lane start: `machine-load-brake`. It reads memory and free disk at lane start, never CPU.
- Simulator boots, in `sweep-shuts-down-idle-simulators`: `simulator-boot-cap` (at most two booted) and `simulator-boot-twin` (refuses a boot when an idle twin exists).
- Worktree removal: `when-a-worktree-may-be-removed`.

## Running tests on the simulator

Run simulator tests through `sim-test`, the shared tool at `bin/sim-test` in the claude-settings repo. Run it from the folder that holds the project: `sim-test <xcodebuild test args without -destination>`.

It reuses the first booted iPhone. With none booted, it boots the shared iPhone 18 Pro (`8787FE1C-48CC-4213-9B5C-8605AFE7F9B3`), and it shuts down only what it booted, also on failure. The claude-settings README section "Simulator tests" holds the rest.

## Repo steps

These stay with the lane:

1. Do not create a simulator.
2. Batch simulator work into as few runs as possible.
3. When a lane start is refused, wait, then retry. Use a bounded wait. Never use an endless sleep loop.
4. Never end the turn while waiting.
5. If `sim-test` exits 1 without printing a `sim-test: using` line, its boot failed and no test ran. Read the `simctl` error. Retry once after a bounded wait only when the error says the machine is busy. Never rerun in a loop.

The tool takes no lock and waits for no load. The boot guard reads the command word of a Bash call, so it does not see the boot inside `sim-test`, and the cap of two booted is not enforced on that path. Check `xcrun simctl list devices booted` before a run.

## The Duo device

The iPhone Duo simulator is `AC2E94F9`, on iOS 27.1. It is shared with degen. Fold it with `~/.local/bin/hinge`, never with Device Hub. It boots only when the orchestrator clears it. `sim-test` cannot target the Duo. It takes the first iPhone in the `xcrun simctl list devices booted` listing, so it picks the Duo when the Duo is booted and listed first, never by choice. For a Duo run, call `xcodebuild test` with the Duo's destination instead.

## See also

- `native-build-lanes` — the lanes that run on the simulator.
