# MANIFEST screens follow the house UX rules

MANIFEST screens follow the house UX rules. The rules are in the claude-settings record `ux-house-rules`. Each Swift screen lane runs them, and each rule has a check that the lane runs.

**Holds while:** `src/app.jsx` renders the screens, and the claude-settings record `ux-house-rules` holds the rule ids this repo cites.

## The ruling

The owner ruled on 2026-10-11: "apply the latest from claude settings' ux guidelines, along with /design-review /ci-hygiene /fresh-prose". The same ruling adds: "when acting upon your plan".

A repo design record can add to a house rule. It cannot cancel one.

The **house UX audit of 2026-10-11** is the source of the lane labels L1 to L10 in these records. L11 comes from the owner's bar ruling in `phone-nav-is-bottom-bar`, as W2 and W3 come from the owner's rulings in `native-build-lanes`. The web lanes are:

- L1: copy and asks. Counts and Cancel in asks, a Clear control in empty states, a shorter Tally sort label, and the 10px label floor.
- L2: component state. The envelope draft survives a view change, and errors show in the pressed row.
- L3: the deploy guard. Deploy stops when the seed fetch fails.
- L4: record text.
- L5: record and link checks.
- L6: 44px touch hit areas, with no visual change.
- L7: semantics. Names that match labels, a modal photo viewer, and disabled controls that give a reason.
- L8: an axe check at 375px and 760px.
- L9: CI paths and timeouts.
- L10: the Dependabot cooldown and zizmor.
- L11: bottom bar D on the web, the CSS version of the phone bar in `phone-nav-is-bottom-bar`. It has four tabs, the Ledger tab with a gear icon, and a floating Find field above the bar. Its tabs meet the 44px floor, as L6 does. Bottom padding keeps the last card clear of the bar. The bar moves no content, under `no-layout-shift-under-pointer`. Ruled, not built. Not yet briefed.

## The rules that the 2026-10-11 rulings apply

- ux-press-moves-nothing: a press moves no other content. The records `armed-reset-takes-the-row` and `motion-disclosure-panels-arrive` apply it.
- ux-a11y-floor: a touch target is 44 by 44 CSS px on touch. The record `action-row-is-ruled-cells` applies it.
- ux-thumb-zone: the main action on a phone sits in reach of the thumb. The bar in `phone-nav-is-bottom-bar` applies it. The tab order is still open.
- ux-ask-or-undo: a destructive press asks first or offers Undo, never both or neither. An ask names the act and its count, with first focus on Cancel. The record `armed-reset-takes-the-row` applies it.
- ux-keep-what-was-made: typed input survives a close, a back, a tab change or a leave. The record `orphan-entry-takes-one-input` applies it to the envelope draft.

Orchestrator default, 2026-10-11, not an owner ruling: every ask names the count of cards it removes, and that count is true. The asks and their counts are in `armed-reset-takes-the-row`, `orphan-entry-takes-one-input`, `stamp-band-opens-the-editor` and `history-restores-a-saved-version`.

Known gap under that default: Pull's ask, "Tap again to replace", names no count and has no Cancel. See `stale-push-conflict-pull-two-tap`. The gap closes in lane L11, where Sync moves into the Ledger tab (`ledger-tab-holds-options`).

**Pinned by:** `check:screens` (its four claims: no sideways overflow at 375px and 760px, no row shift on check-in, the Discard arm moves nothing, and the Reset ask is not cut off), and tests 61.8 to 61.9, 61.11 to 61.16, 61.33 to 61.35 (a draft survives a tab change), 61.41 to 61.42, and 61.43 to 61.56. The test pins check the DOM, not geometry.

## See also

- `spacing-on-4px-grid` — the spacing default this repo follows.
- `phone-nav-is-bottom-bar` — the phone navigation ruling, which takes the house default for a bottom bar.
- `ledger-tab-holds-options` — the Ledger tab that the bar holds.
