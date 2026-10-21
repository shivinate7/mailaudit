# Auto-apply happens now, and why that changed

Kind: process

Home: decisions/sync-revamp-cloudflare.md

**Status:** open. The design is settled, but it is a risk accepted on purpose and worth re-checking as the app changes.

**Holds while:** `PRESS_TAIL_MS` is 700 and `PRESS_MAX_MS` is 3000 in `src/sync-rules.mjs`. A change to either calls for a fresh look at this record. The record names no closing fact, only a re-check trigger.

The app applies a remote change on its own, as soon as the owner is not mid-press. The constraint is that the list must not move between a finger landing and lifting, and that what is under the pointer must not move when the apply lands. Merging forty new lines into the list under a thumb would cause the cascading mis-tap that `no-layout-shift-under-pointer` prevents.

The guard protects that mis-tap directly (owner ruling 2026-10-20: "hover doesn't count"). A reply holds while a press is down (at most `PRESS_MAX_MS`, so a lost pointerup cannot hold for ever), for `PRESS_TAIL_MS` after it ends, and while an armed guard is open: a composer draft, a pending undo, an armed Reset, Force or Restore. Hover, scroll and the wheel never hold. The older rule waited for 10 seconds of no input of any kind. That measured 3.1 to 3.3 s of delay on an idle device and 21 s under a tap burst, and it protected nothing that the press guard does not.

When the apply lands, the page scrolls so the row under a resting mouse, or else the first row in view, sits where it did (`data-anchor` rows, measured after layout). WebKit does not anchor scroll by itself. `npm run check:screens` claim 16 holds this.

An open import notice does not hold the apply. A notice has no timeout, so one unread notice held every reply. The notice the apply writes keeps the import sentence beside the merge sentence.

The merge never applies mid-thought and never applies a remote it could not read.

**Pinned by:** group 40 (the mid-thought guard), 51.17 to 51.19 (`pressHeld`), group 75 (hover, scroll, press, tail, burst timer, import notice) and `npm run check:screens` claim 16.

## See also

- `sha-accepted-only-after-apply` — the rule that keeps an auto-applied merge honest
