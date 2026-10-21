# A lane takes a lock before it uses the one simulator

Kind: process

Home: decisions/one-simulator-per-mac.md

**Status:** ruled. The owner ruled this on 2026-10-20 at 22:23 CDT.

One simulator serves every project on this Mac. A lane takes a lock before any simulator boot, build-for-testing run, test run, launch or screenshot.

**Holds while:** the Mac has one booted simulator, the iPhone 18 Pro with id `8787FE1C-48CC-4213-9B5C-8605AFE7F9B3`, and other projects share it.

## The steps

1. Idle CPU is over 25% in `top -l 2 -n 0 -s 1 | grep "CPU usage"`. Otherwise wait.
2. Take the lock: `mkdir ~/.claude/locks/ios-simulator.lock && echo "<lane> $(date '+%F %H:%M')" > ~/.claude/locks/ios-simulator.lock/owner`.
3. If `mkdir` fails, read `owner`. Check again every 2 minutes. After 60 minutes, give up and report.
4. Use only the booted iPhone 18 Pro. Never boot or create another simulator.
5. Release the lock right after the run: `rm -r ~/.claude/locks/ios-simulator.lock`. Never hold it between runs.

A lock older than 2 hours whose owner is gone is reported. It is not cleared.

Batch the simulator work into as few runs as possible. A plain `swift build` and a macOS-only test need no lock.

## See also

- `native-build-lanes` — the lanes that run on the simulator.
