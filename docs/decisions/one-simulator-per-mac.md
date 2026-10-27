# Simulator boots and load follow the global machine rules

Kind: process

Home: docs/decisions/one-simulator-per-mac.md

**Status:** ruled. The owner ruled on 2026-10-26 at 16:35 CDT that the global load brake governs mailaudit.

**Holds while:** the global load brake and the simulator boot cap stay in force, and no rule checks load outside a lane.

Mailaudit's load and simulator rules come from the owner's global settings. This record keeps only the steps those rules do not cover.

## Global homes

- Load at lane start: `machine-load-brake`. It reads memory and free disk at lane start, never CPU.
- Simulator boots, in `sweep-shuts-down-idle-simulators`: `simulator-boot-cap` (at most two booted) and `simulator-boot-twin` (refuses a boot when an idle twin exists).
- Worktree removal: `when-a-worktree-may-be-removed`.

## Repo steps

No global record covers these:

1. Do not create a simulator. The mailaudit simulator is the iPhone 18 Pro, id `8787FE1C-48CC-4213-9B5C-8605AFE7F9B3`.
2. Batch simulator work into as few runs as possible.
3. When a lane start is refused, wait, then retry. Use a bounded wait. Never use an endless sleep loop.
4. Never end the turn while waiting.

## See also

- `native-build-lanes` — the lanes that run on the simulator.
