# A remote reply applies as soon as no press is in progress

Kind: build

Plan: decisions/auto-apply-happens-now.md#the-press-guard (web)

Plan: decisions/auto-apply-happens-now.md#native-client (native)

**Status:** open. The design is settled, but it is a risk accepted on purpose and worth re-checking as the app changes.

**Holds while:** `PRESS_TAIL_MS` is 700 and `PRESS_MAX_MS` is 3000 in `src/sync-rules.mjs`. A change to either calls for a fresh look at this record. The record names no closing fact, only a re-check trigger.

The app applies a remote change on its own, as soon as the owner is not mid-press. The outcome to protect is that the owner never taps or acts on the wrong row because the list moved under the pointer. Merging forty new lines into the list under a thumb would cause the cascading mis-tap that `no-layout-shift-under-pointer` prevents.

Owner ruling 2026-10-20 at 23:36 CDT: the guard must protect that outcome directly, and "hover doesn't count". The delay it replaced (10 seconds with no input of any kind) is in `sync-latency`.

## The press guard

- A reply holds while a press is down, for `PRESS_TAIL_MS` after it ends, and while an armed guard needs it. A press is `pointerdown` until `pointerup` or `pointercancel`. A touch scroll ends in `pointercancel`, so it ends the hold. A key press holds for `PRESS_TAIL_MS` after each keydown and keyup, because Enter and Space press a focused button.
- A press holds for at most `PRESS_MAX_MS`, so a lost `pointerup` cannot hold a reply for ever.
- Hover, a mouse move, scroll and the wheel never hold. A reply applies at once when no press is near. After a press it applies in under a second: the tail plus one quick re-check.
- The armed guards are the five conditions of `mergeBlocked` in `src/app.jsx`: a composer draft, a pending undo, and an armed Reset, Force or Restore. An armed Reset, Force or Restore disarms itself after 4 seconds.
- The composer hold has no time limit. It stays, because an apply would discard hand-typed entries that are in no CSV and on no remote.
- The undo hold has no time limit either, see `undo-holds-reply-unbounded`.
- An open import notice does not hold the apply. A notice has no timeout, so one unread notice would hold every reply. The notice the apply writes keeps the import sentence beside the merge sentence.
- When the apply lands, the page scrolls so the row under a resting mouse, or else the first row in view, sits where it did. Each package card, item row, Tally row and envelope card carries `data-anchor`. The correction is measured after layout, so the new rows and the notice are already in. `npm run check:screens` turns native scroll anchoring off, so claim 16 measures the page's own correction. Whether the owner's WebKit anchors on its own is unmeasured.
- The end-to-end delay with this guard is not measured, see `sync-latency-after-fix-unmeasured`.

The merge never applies mid-thought and never applies a remote it could not read.

**Pinned by:** group 40 (the mid-thought guard; mutant confirmed red: the mid-thought guard removed), 51.17 to 51.19 (`pressHeld` and the two constants), 55.3, 55.4d to 55.4f, 59.13 and 59.15 (a press holds a reply and its release ends the hold; an open import notice does not hold it), group 75 (75.1 hover, 75.2 scroll and wheel, 75.3 a lost `pointerup`, 75.4 `pointercancel`, 75.5 a key press, 75.6 a cold open, 75.7a to 75.7c a press during the photo downloads), and `npm run check:screens` claim 16 (a reply lands within 1.5 s and the row in view moves no more than 0.5px).

## Native client

Lane N4b takes `PRESS_TAIL_MS`, `PRESS_MAX_MS` and `pressHeld` from the rules bundle, as the web app does. That lane defines what counts as a press on iOS. Two rules hold: hover and scroll never hold, and a press holds for at most `PRESS_MAX_MS`. Debt: `n4b-socket-idle-gate-unbuilt`.

## See also

- `sha-accepted-only-after-apply` — the rule that keeps an auto-applied merge honest
- `sync-latency` — the delays measured before this guard
- `undo-holds-reply-unbounded` — the guard that still holds with no limit
