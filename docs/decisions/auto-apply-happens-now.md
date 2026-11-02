# A remote reply applies as soon as no press is in progress

Kind: build

Plan: docs/decisions/auto-apply-happens-now.md#the-press-guard (web)

Plan: docs/decisions/auto-apply-happens-now.md#native-client (native)

**Status:** open. The design is settled, but it is a risk accepted on purpose and worth re-checking as the app changes.

**Holds while:** `PRESS_TAIL_MS` is 700 and `PRESS_MAX_MS` is 3000 in `src/sync-rules.mjs`. A change to either calls for a fresh look at this record. The record names no closing fact, only a re-check trigger.

The app applies a remote change on its own, as soon as the owner is not mid-press. The outcome to protect is that the owner never taps or acts on the wrong row because the list moved under the pointer. Merging forty new lines into the list under a thumb would cause the cascading mis-tap that `no-layout-shift-under-pointer` prevents.

Owner ruling 2026-10-20 at 23:36 CDT: the guard must protect that outcome directly, and "hover doesn't count". The delay it replaced (10 seconds with no input of any kind) is in `sync-latency`.

## The press guard

- A reply holds while a press is down, for `PRESS_TAIL_MS` after it ends, and while an armed guard needs it. A press is `pointerdown` until `pointerup` or `pointercancel`. A touch scroll ends in `pointercancel`, so it ends the hold. A key press holds for `PRESS_TAIL_MS` after each keydown and keyup, because Enter and Space press a focused button.
- A press holds for at most `PRESS_MAX_MS`, so a lost `pointerup` cannot hold a reply for ever.
- Hover, a mouse move, scroll and the wheel never hold. A reply applies at once when no press is near. After a press it applies in under a second: the tail plus one quick re-check.
- The first reply after a pasted key is saved applies at once. No press holds it, neither a press that is down nor the tail of the Save tap's own press. This is because the owner just tapped Save, and a hold would only delay the first sync. An armed guard still holds it, and so does a press that starts while the photos download. The next reply waits for the press guard again.
- The armed guards are the four conditions of `mergeBlocked` in `src/app.jsx`: a composer draft, and an armed Reset, Force or Restore. An armed Reset, Force or Restore disarms itself after 4 seconds.
- The composer hold has no time limit. It stays, because an apply would discard hand-typed entries that are in no CSV and on no remote.
- An open Undo bar never holds a reply, and the apply keeps the bar and its delta. Owner ruling 2026-10-21 13:30 CDT: "it should just be able to apply anyways why does the undo bar being open have to matter". Undo subtracts its own plan (`undo-removes-only-its-delta`), so it removes only its own change after a merge and keeps the remote one. A CSV import, a restore (a backup file or a saved version) and a Reset still clear the bar.
- An open import notice does not hold the apply. A notice has no timeout, so one unread notice would hold every reply. The notice the apply writes keeps the import sentence beside the merge sentence, across any number of applies, until the owner dismisses it.
- When the apply lands, the page scrolls so the row under a resting mouse, or else the first row in view, sits where it did. Each package card, item row, Tally row and envelope card carries `data-anchor`. The correction is measured after layout, so the new rows and the notice are already in. `npm run check:screens` turns native scroll anchoring off, so claim 16 measures the page's own correction. Whether the owner's WebKit anchors on its own is unmeasured.
- The end-to-end delay with this guard is not measured, see `sync-latency-after-fix-unmeasured`.

The merge never applies mid-thought and never applies a remote it could not read.

**Pinned by:** group 40 (the mid-thought guard; mutant confirmed red: the mid-thought guard removed), 51.17 to 51.19 (`pressHeld` and the two constants), 55.3, 55.4d to 55.4f, 59.13 and 59.15 (a press holds a reply and its release ends the hold; an open import notice does not hold it; 59.15d the first reply after the Save tap applies within 300 ms, not after the press tail), group 75 (75.1 hover, 75.2 scroll and wheel, 75.3 a lost `pointerup`, 75.4 `pointercancel`, 75.5 a key press, 75.6 a cold open, 75.7a to 75.7c a press during the photo downloads, 75.12 to 75.13 an open Undo bar does not hold a reply, the apply keeps it, and Undo after the apply keeps the other device's check-in, 75.14 the import sentence stays across three applies and leaves with Dismiss), and `npm run check:screens` claim 16 (a reply lands within 1.5 s and the row in view moves no more than 0.5px).

## Native client

Lane N4b built the native gate. `PressGate` asks `pressHeld` in the rules bundle, which holds `PRESS_TAIL_MS` and `PRESS_MAX_MS`, as the web app does. A press on iOS is a finger down until it lifts or iOS cancels it. A scroll takes the touch and cancels it, so a scroll ends the hold like a lift. `PressWatcher` in `native/Manifest/SyncViews.swift` watches every touch in the window. It recognizes nothing, cancels no touch and delays none.

- Hover and scroll never hold. A press holds for at most `PRESS_MAX_MS`.
- An open Undo bar never holds a reply (owner ruling 2026-10-21 13:30 CDT, see above). Nothing in the client reads the Undo bar.
- The first reply after a key save applies at once, as on the web (`SyncClient.keySaved()`). The next reply waits again.
- A held reply re-checks every 250 ms (`PressGate.recheckMs`, a Swift constant). This is a builder default and not an owner ruling. It is under the tail, so a reply lands under a second after the tail ends.
- The gate holds for a press only. Lane N4b builds no armed guard. `OrphanedModel.load()` leaves the composer drafts alone, so an apply loses no draft. The N9 row in `native-build-lanes` names no hold for its reset or restore.

Native tests: `PressGateTests`, `SyncPressHoldTests` and `SyncKeySaveTests` in `native/ManifestKit/Tests/ManifestKitTests`. No test drives a touch through `PressWatcher` to the gate, see debt `native-sync-glue-unpinned`.

## See also

- `sha-accepted-only-after-apply` — the rule that keeps an auto-applied merge honest
- `sync-latency` — the delays measured before this guard
- `undo-removes-only-its-delta` — why an apply can keep the Undo bar
