# Recent log, web client

**Status:** in build on branch `recent-log-web`, stacked on `recent-reset-deferred`.

Decision: `recent-checks-can-be-undone`. Debts: `recent-log-unbuilt`, `recent-log-unmeasured`.

This plan pins the shared API, so the test-author and the builder work from one shape. The native half (rules bundle, Swift screen) is out of scope and stays open in the debt.

## The module

`src/recent-rules.mjs`. Pure, no React, no storage. Every function takes `now` (ms) where a clock matters.

Entry shape. Every entry has `id` (string, from `newEntryId()`), `at` (ms) and `kind`.

| kind | fields |
|---|---|
| `count` | `key`, `before`, `after` (counts; 0 means key-absent) |
| `bulk` | `gk`, `counts`: `[{ key, before, after }]` |
| `stamp` | `gk`, `before`, `after` (stamp objects or null), `updatedAt` (the stamp's write time after this action) |
| `envelope` | `op` (`record`, `edit`, `discard`), `before`, `after` (envelope objects or null), `updatedAt` |
| `assign` | `plan`: `[{ itemKey, take }]`, `before` (envelope), `after` (envelope or null), `updatedAt` |
| `undo` | `of` (the undone entry's id) |

Exports:

- `newEntryId()` — unique across devices.
- `addEntry(log, entry, lastId)` — appends. A `count` entry merges into the entry named `lastId` when that entry is a `count` on the same key and no undo names it. `lastId` is the id this session wrote last; the app keeps it in memory, so "this device wrote it" and "no other action came between" need no device field. The merged entry keeps its id, the first `before`, the last `after` and the last `at`. A merged entry with `before === after` is dropped. Returns `{ log, lastId }`.
- `capLog(log, now)` — drops entries older than 14 days, keeps the newest 200 non-undo rows, then drops undo entries whose row is gone. Sorted by `at`, then `id`.
- `mergeRecent(a, b, now)` — union by `id`; on one id, the later `at` wins (tie: `a`). Then `capLog`. Symmetric and idempotent.
- `rowState(entry, log, ledger)` — `"live"`, `"undone"`, `"changed"` or `"nothing"`. `ledger` is `{ items, received, receivedAt, stamps, envelopes }`. Rules in the decision's How one tap undoes one action.
- `isLive(log, ledger)` — true when any row is live. The cell reads it.
- `undoEntry(entry, ledger, now)` — returns `{ ledger, undo }` (the next ledger slice and the undo entry, `at: now`), or `{ refused: state }`. Counts subtract the delta and clamp to 0..quantity (quantity from `ledger.items` by key); 0 deletes the key; `receivedAt` gets `now`. Stamps, envelopes, assigns follow the decision.
- `rowLabel(entry)` — the micro-label, such as `CHECKED`, `COUNT 2 → 3`.
- `groupByDay(rows, now)` — local calendar day groups, newest first: `TODAY`, `YESTERDAY`, then `MON OCT 5`.

`mergeLedger` in `src/merge-rules.mjs` gains the field `recent` and an optional third argument `now` (default `Date.now()`), and calls `mergeRecent`. A ledger with no `recent` merges as `[]`. The merged ledger carries `recent` only when either side had one, so older pins hold.

The rules bundle (`build.mjs`, `rules-run-in-javascriptcore`) does not gain the module in this lane.

## The app

- `recent` joins the saved shape at the five sites (`saved-state-shape`).
- One function `undoRecent(entry)` runs every undo. The Undo notice calls it with the assign entry it logged, so `undoAssign` becomes a call to it.
- Each logged action calls `addEntry` once: `setCount`, check and un-check, `bulkSet`, `setStamp`, envelope record, edit and discard, `assignEnvelope`.
- Not logged: import, merge, live apply, restore, pull, Reset, view preferences.

## The entrance

The action row is retired (`action-row-is-ruled-cells`). The decision's "cell in the ruled action row, left of History" reads as a `LedgerRow` labelled Recent, directly above History on the Ledger tab. The four-cell measurement at 375px no longer applies.

Departs from: `recent-checks-can-be-undone`, "Where the entrance sits" — a `.mdl-act` cell left of History becomes a `LedgerRow` above History, as every other cell became in L11b.

## An open panel when the cell would hide

Pick: while the Recent panel is open, the cell and the panel stay, with rows frozen. The cell re-reads `isLive` when the panel closes and when the Ledger tab is entered, never while the tab is on screen. So the last undo with the panel open moves nothing, and a live apply from the other device never pushes History under the pointer.

Departs from: `recent-checks-can-be-undone`, "The cell shows while at least one log row is live, and hides when none is" — the cell's show and hide wait for a panel close or a Ledger tab entry.
