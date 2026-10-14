# Claim 11 skips taps at a fixed control's edge

Claim 11 of `check:screens` does not test a tap just past a fixed control's edge, where the tap lands on scrolling content, or the reverse. The check skips that pair on purpose, by owner ruling of 2026-10-14 08:10 CDT. The gap closes when a check tests those taps without the skip.

**Status:** open.

**Decision:** `ux-house-rules-govern`.
