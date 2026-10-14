# Spacing moves to a 4px grid with an 8px card radius

Kind: build

Plan: decisions/spacing-on-4px-grid.md#web-plan (web)

Spacing uses a 4px step. Every gap is a multiple of 4px. The card corner radius is 8px. The owner ruled on 2026-10-11: "Re-space to the grid."

**Status:** built on web at the grid lane head. The re-space and the 8px card corners landed in `528bbde`. The six snaps and the photo badge overhang are named under Web plan. `check:screens` claim 14 is the pin for this record. The records writer did not run `check:screens` at the head, so no check result is stated here. The gap above the Ledger title is 16px, down from 18px (orchestrator decision 2026-10-12 under Decide, gallery; see `ux-house-rules-govern`). The builder reported 18.0px before and 16px after, at 375px and 760px. The records writer did not re-measure those figures. Claim 6 accepts any multiple of 4 under 18px. `check:screens` passed at `eb61351`.

**Holds while:** the house default in the claude-settings record `ux-house-rules` sets a 4px step and an 8px radius. A change to that default calls for a fresh look at this record.

## Web plan

The build is the grid on web. Every margin, padding, row gap and column gap is a multiple of 4px. Each card's four corners are 8px.

- Claim 14 in `check:screens` pins it, in `test/screens.mjs`, at 375px and 760px, and at 375px on touch, in every state. The probe reads computed margin, padding, row gap and column gap. Auto margins are skipped, and a gap of "normal" counts as 0. It also reads each card's four corners. It does not walk insets or pseudo-elements. So an inset such as the photo badge's -6px offset, and a pseudo-element such as the chip ::after, are not checked.
- `GRID_EXEMPT` in `test/screens.mjs` is an empty list. No element is exempt. The test header gives the reason: no offender at the lane head is out of scope, and none is a UA default.
- Six snaps break the nearest-multiple-of-4 rule. Each keeps its value, with a one-line code comment in `src/app.jsx` that names its reason. There are seven comment sites, because the envelope composer has two.
  - Stamp chip row gap, 12px: keeps a 44px target.
  - Note-field margin, 12px: keeps the chips' 44px target clear of the field.
  - Envelope composer photo row and footer padding, 12px: keeps the 44px targets of the controls there.
  - Item row meta top margin, 4px, and the `.mdl-lrow > .l` gap, 4px: keeps a tap 1px outside a capsule corner off the control beneath.
  - `.mdl-cell` left padding, 8px, beside a transparent 3px left border: keeps the text in place.
- The photo badge overhang (top and right -6px) is decoration, not spacing. It stays, and this record names it as outside the spacing rule. Any other inset used as spacing snaps by the nearest rule. The tab badge top moved from 6px to 4px (`dc73fc3`).

## Re-measure

- `card-reserved-geometry` was re-measured at `f97e423`, the grid head then. Its status says so.
- `ruled-head-heights` holds the control region figures at 375px, taken by the round-1 builder on the grid lane. The records writer did not re-measure them.

## See also

- `card-the-bar-is-out-of-flow` — the card whose corner moved to 8px.
- `action-row-is-ruled-cells` — the 40px row, which is already a multiple of 4.
- `ux-house-rules-govern` — the house rule set this record follows.
