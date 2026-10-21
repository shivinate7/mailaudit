# The Mac's CPU, disk and one simulator are shared

Kind: process

Home: decisions/one-simulator-per-mac.md

**Status:** ruled. The owner ruled the simulator lock on 2026-10-20 at 22:23 CDT. The owner ruled the CPU, disk and worktree rules on 2026-10-21 at 14:06 CDT.

One simulator, one CPU and one disk serve every project on this Mac. A lane takes a lock before any simulator boot, build-for-testing run, test run, launch or screenshot. A lane starts a new agent or a heavy command only while the CPU has room.

**Holds while:** the Mac has one booted simulator, the iPhone 18 Pro with id `8787FE1C-48CC-4213-9B5C-8605AFE7F9B3`, and other projects share it, its CPU and its disk.

The owner's words of 2026-10-21 14:06 CDT, as the lane brief relayed them:

```
Owner resource rules 2026-10-21 14:06 CDT: start a new agent or heavy command only while the CPU is under 85% busy (`top -l 2 -n 0 -s 1 | grep "CPU usage"`: idle 15% or more), else wait; the simulator runs only under 75% busy (idle over 25%), one simulator on the whole Mac behind ~/.claude/locks/ios-simulator.lock (mkdir; owner file; release right after; use only iPhone 18 Pro 8787FE1C-48CC-4213-9B5C-8605AFE7F9B3; never boot another); free disk stays at or above 15 GB; a lane removes its worktrees once it merges. Wait only with the Monitor tool or single checks; never end your turn while waiting.
```

## CPU, disk and worktrees

1. A new agent or heavy command starts only while the CPU is under 85% busy: idle is 15% or more in `top -l 2 -n 0 -s 1 | grep "CPU usage"`. Otherwise wait.
2. Free disk stays at or above 15 GB.
3. A lane removes its worktrees once it merges.
4. Wait only with the Monitor tool or single checks. Never end the turn while waiting.

## The simulator steps

1. The simulator runs only under 75% busy: idle CPU is over 25% in `top -l 2 -n 0 -s 1 | grep "CPU usage"`. Otherwise wait.
2. Take the lock: `mkdir ~/.claude/locks/ios-simulator.lock && echo "<lane> $(date '+%F %H:%M')" > ~/.claude/locks/ios-simulator.lock/owner`.
3. If `mkdir` fails, read `owner`. Check again every 2 minutes. After 60 minutes, give up and report.
4. Use only the booted iPhone 18 Pro. Never boot or create another simulator.
5. Release the lock right after the run: `rm -r ~/.claude/locks/ios-simulator.lock`. Never hold it between runs.

A lock older than 2 hours whose owner is gone is reported. It is not cleared.

Batch the simulator work into as few runs as possible. A plain `swift build` and a macOS-only test need no lock.

## See also

- `native-build-lanes` — the lanes that run on the simulator.
