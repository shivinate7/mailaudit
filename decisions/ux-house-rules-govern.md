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
- L11: bottom bar D on the web, the CSS version of the phone bar in `phone-nav-is-bottom-bar`. It has four tabs, Ledger first, and a floating Find pill above the bar. Its tabs meet the 44px floor, as L6 does. Bottom padding keeps the last card clear of the bar. The bar moves no content, under `no-layout-shift-under-pointer`. L11a built the bar and the pill (commit `250823d`). L11b built the Ledger tab (commit `12e8721`). L11c drew the gear icon (commit `b62aebd`).

## The rules that the 2026-10-11 rulings apply

- ux-press-moves-nothing: a press moves no other content. The records `armed-reset-takes-the-row` and `motion-disclosure-panels-arrive` apply it.
- ux-a11y-floor: a touch target is 44 by 44 CSS px on touch. The record `action-row-is-ruled-cells` applies it to the Ledger tab rows.
- ux-thumb-zone: the main action on a phone sits in reach of the thumb. The bar in `phone-nav-is-bottom-bar` applies it. The tab order is ruled: Ledger, Orphaned, Tally, Packages.
- ux-ask-or-undo: a destructive press asks first or offers Undo, never both or neither. An ask names the act and its count, with first focus on Cancel. The record `armed-reset-takes-the-row` applies it.
- ux-keep-what-was-made: typed input survives a close, a back, a tab change or a leave. The record `orphan-entry-takes-one-input` applies it to the envelope draft.

Orchestrator default, 2026-10-11, not an owner ruling: every ask names the count of cards it removes, and that count is true. The asks and their counts are in `armed-reset-takes-the-row`, `orphan-entry-takes-one-input`, `stamp-band-opens-the-editor` and `history-restores-a-saved-version`.

**Polish, 2026-10-12.** The owner ruled that the orchestrator makes the polish calls on the screens, judged by these house UX rules, and merges them. The orchestrator keeps a before-and-after screenshot gallery for the owner, so each call can be checked. The owner may overrule a call.

**Process-only, orchestrator default, 2026-10-12, not an owner ruling:** a polish merge keeps the fresh-reviewer pass that `orchestrator-may-merge` requires for a change to a gate, a rule or product code. The owner's polish grant covers taste, not review. The owner may overrule this.

The gap for the Pull and Push anyway asks is closed. On 2026-10-12 the owner removed the GitHub controls from the UI, so their asks no longer exist (`stale-push-conflict-pull-two-tap`). The ask rule still applies to each ask that remains.

**Pinned by:**

- `check:screens`, claim 1: no sideways overflow at 375px and 760px.
- `check:screens`, claim 2: no row shift on check-in.
- `check:screens`, claim 3: the Discard arm moves nothing.
- `check:screens`, claim 4: the Reset ask is not cut off.
- `check:screens`, claim 5: the bottom bar's geometry at 375px and 760px.
- Tests 65.1 to 65.4 keep the removed GitHub verbs off every screen. Test 65.8 pins the armed Reset's Cancel after Reset.

Tests 21.4 and 62.1 to 62.10 pin the bar. Tests 63.4 to 63.7 pin the Ledger tab's order and its current tab. Tests 63.21 to 63.24 pin the armed Reset's count, its neighbours and its first focus. Tests 61.8 to 61.9, 61.11 to 61.16, 61.41 to 61.42 and 61.43 to 61.57 pin the other rules. Tests 61.33 to 61.35 cover a draft that survives a tab change. The test pins check the DOM, not geometry.

## See also

- `spacing-on-4px-grid` — the spacing default this repo follows.
- `phone-nav-is-bottom-bar` — the phone navigation ruling, which takes the house default for a bottom bar.
- `ledger-tab-holds-options` — the Ledger tab that the bar holds.
