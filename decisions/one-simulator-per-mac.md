# The Mac's CPU, disk and one simulator are shared

Kind: process

Home: decisions/one-simulator-per-mac.md

**Status:** ruled. The owner ruled the simulator lock on 2026-10-20 at 22:23 CDT. The owner ruled the whole machine rule again on 2026-10-21 at 14:54 CDT. That ruling supersedes the 14:06 CDT wording.

One simulator, one CPU and one disk serve every project on this Mac. An agent checks the CPU before it starts any agent, test suite, build, dev server or browser check, and checks the disk before it works. A lane takes a lock before any simulator boot, build-for-testing run, test run, launch or screenshot.

**Holds while:** the Mac has one booted simulator, the iPhone 18 Pro with id `8787FE1C-48CC-4213-9B5C-8605AFE7F9B3`, and other projects share it, its CPU and its disk.

The owner's words of 2026-10-21 14:54 CDT, as the lane brief relayed them:

```
Owner machine rule (2026-10-21 14:54 CDT): 1. Before any agent, test suite, build, dev server or browser check run `top -l 2 -n 0 -s 1 | grep 'CPU usage' | tail -1`; start only if idle is over 15%, else wait a few minutes and re-check with a bounded wait (never an endless sleep loop); work already running may finish. 2. Simulator only while idle is over 25%; only ONE simulator on this Mac, shared across all projects: `mkdir ~/.claude/locks/ios-simulator.lock && echo "<session name> $(date '+%F %H:%M')" > ~/.claude/locks/ios-simulator.lock/owner`; if mkdir fails read the owner file and wait; reuse the booted simulator (iPhone 18 Pro 8787FE1C-48CC-4213-9B5C-8605AFE7F9B3), never boot a second; release right after the run: `rm -r ~/.claude/locks/ios-simulator.lock`. 3. Disk: before work run `df -g /System/Volumes/Data`; under 15 GB free, stop and tell the orchestrator. 4. Remove each agent worktree once its work is pushed or merged; never remove one with unpushed work. Never end your turn while waiting.
```

## CPU, disk and worktrees

1. Before any agent, test suite, build, dev server or browser check, run `top -l 2 -n 0 -s 1 | grep 'CPU usage' | tail -1`. Start only if idle is over 15%.
2. Otherwise wait a few minutes, then check again. Use a bounded wait. Never use an endless sleep loop.
3. Work that already runs may finish.
4. Before work, run `df -g /System/Volumes/Data`. Under 15 GB free: stop and tell the orchestrator.
5. Remove each agent worktree once its work is pushed or merged. Never remove one with unpushed work.
6. Never end the turn while waiting.

## The simulator steps

1. The simulator runs only while idle CPU is over 25% in the `top` command above. Otherwise wait.
2. Take the lock: `mkdir ~/.claude/locks/ios-simulator.lock && echo "<session name> $(date '+%F %H:%M')" > ~/.claude/locks/ios-simulator.lock/owner`.
3. If `mkdir` fails, read `owner` and wait. Check again every 2 minutes. After 60 minutes, give up and report.
4. Reuse the booted iPhone 18 Pro. Never boot or create a second simulator.
5. Release the lock right after the run: `rm -r ~/.claude/locks/ios-simulator.lock`. Never hold it between runs.

A lock older than 2 hours whose owner is gone is reported. It is not cleared.

Batch the simulator work into as few runs as possible. A plain `swift build` and a macOS-only test need no lock. They still pass the CPU check in the first list.

## See also

- `native-build-lanes` — the lanes that run on the simulator.
