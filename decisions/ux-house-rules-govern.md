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
- L6: 44px touch hit areas, with no visual change but the Stamp editor chip row gap (below). L6 built (commit `2857876`). The chip gap built at commit `6438460`. The chip hit area was cut back so it no longer crosses the gap midpoint, at commits `475c0d1` and `94d5acc`.
- L7: semantics. Names that match labels, a modal photo viewer, and disabled controls that give a reason. L7 built (commit `2857876`).
- L8: an axe check at 375px and 760px. L8 built (commit `2857876`).
- L9: CI paths and timeouts.
- L10: the Dependabot cooldown and zizmor.
- L11: bottom bar D on the web, the CSS version of the phone bar in `phone-nav-is-bottom-bar`. It has four tabs, Ledger first, and a floating Find pill above the bar. Its tabs meet the 44px floor, as L6 does. Bottom padding keeps the last card clear of the bar. The bar moves no content, under `no-layout-shift-under-pointer`. L11a built the bar and the pill (commit `250823d`). L11b built the Ledger tab (commit `12e8721`). L11c drew the gear icon (commit `b62aebd`).

## The rules that the 2026-10-11 rulings apply

- ux-press-moves-nothing: a press moves no other content. The records `armed-reset-takes-the-row` and `motion-disclosure-panels-arrive` apply it.
- ux-a11y-floor: a touch target is 44 by 44 CSS px on touch. The record `action-row-is-ruled-cells` applies it to the Ledger tab rows.
- ux-thumb-zone: the main action on a phone sits in reach of the thumb. The bar in `phone-nav-is-bottom-bar` applies it. The tab order is ruled: Ledger, Orphaned, Tally, Packages.
- ux-ask-or-undo: a destructive press asks first or offers Undo, never both or neither. An ask names the act and its count, with first focus on Cancel. The record `armed-reset-takes-the-row` applies it.
- ux-keep-what-was-made: typed input survives a close, a back, a tab change or a leave. The record `orphan-entry-takes-one-input` applies it to the envelope draft.

**Touch call, orchestrator decisions 2026-10-12 and 2026-10-13 under Decide, gallery:** text fields are touch targets. So ux-a11y-floor (44 by 44 CSS px on touch) covers them. The label of each text field carries its hit area. Claims 9 to 13 pin the touch floor, the painted boxes, and the chip and "Sorted by" reach rules. L6 has no visual change, except the Stamp editor chip row gap. The owner declined to rule on that gap on 2026-10-13. So the orchestrator set it from 6px to 10px. Each chip is meant to get a centred 44px hit area. That area is meant to end at the gap midpoint on each side, so no two overlap. Claim 12 pins both targets. This is the one deliberate visual change in L6. Every other screen keeps no visual change. Before and after shots, 32 per side, were sent to the owner on 2026-10-13. The side-by-sides cover the Stamp editor at 375px and 760px. The builder's pixel compare found that only the 375px Stamp editor differs. Its page is 8px taller. It holds while ux-a11y-floor sets 44 by 44 CSS px on touch, and the chip gap stays 10px. The owner may overrule this call.

Orchestrator default, 2026-10-11, not an owner ruling: every ask names the count of cards it removes, and that count is true. The asks and their counts are in `armed-reset-takes-the-row`, `orphan-entry-takes-one-input`, `stamp-band-opens-the-editor` and `history-restores-a-saved-version`.

**Polish, 2026-10-12.** The owner ruled that the orchestrator makes the polish calls on the screens, judged by these house UX rules, and merges them. The orchestrator keeps a before-and-after screenshot gallery for the owner, so each call can be checked. The owner may overrule a call.

**Polish call, orchestrator decision 2026-10-12 under Decide, gallery:** the Ledger title gap is 16px, not 18px. The rule is `spacing-on-4px-grid`: every gap is a multiple of 4px. The figures sit in that record. The pin is claim 6 below. No before-and-after gallery entry is in this work. The owner may overrule this call.

**Process-only, orchestrator default, 2026-10-12, not an owner ruling:** a polish merge keeps the fresh-reviewer pass that `orchestrator-may-merge` requires for a change to a gate, a rule or product code. The owner's polish grant covers taste, not review. The owner may overrule this.

The gap for the Pull and Push anyway asks is closed. On 2026-10-12 the owner removed the GitHub controls from the UI, so their asks no longer exist (`stale-push-conflict-pull-two-tap`). The ask rule still applies to each ask that remains.

**Pinned by:**

- `check:screens`, claim 1: no sideways overflow at 375px and 760px.
- `check:screens`, claim 2: no row shift on check-in.
- `check:screens`, claim 3: the Discard arm moves nothing.
- `check:screens`, claim 4: the Reset ask is not cut off.
- `check:screens`, claim 5: the bottom bar's geometry at 375px and 760px.
- `check:screens`, claim 6: the gap above the Ledger title is 16px, a multiple of 4px (`spacing-on-4px-grid`).
- `check:screens`, claim 7: the Sync panel on the Ledger tab opens, holds no GitHub control, and causes no sideways overflow.
- `check:screens`, claim 8 (L8): an axe scan at 375px and 760px covers nine states. The states are: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open; Photo viewer. It passes only with no serious or critical violation, and no `label-content-name-mismatch` at any impact.
- `check:screens`, claim 9 (L6): at 375px on touch, each visible interactive element is hit at least 44 by 44 CSS px. The check walks from each element's whole-pixel centre, using `elementFromPoint`. The centre sample counts as one px (owner ruling 2026-10-13). It runs in these eight states: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open. A tap on a label counts for the field that label owns, so the label can carry the hit area. A padding or pseudo-element grow counts. A neighbour that cuts it short is a finding. A target whose 44px reach runs past the viewport edge is skipped by this floor only. Each state prints one note with the count of such targets. Its drawn box and its overlap probe still count. The check does not cover the photo viewer or any other state.
- `check:screens`, claim 10 (L6): at 375px, the painted box of each interactive element matches `test/a11y-base-boxes.json` within 0.5px. It runs in these eight states: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open. The other seven states are recorded from the base commit `f7d51ba`. The Stamp editor is recorded at commit `b06d6dd`, under the 10px chip row gap. Re-record it alone with `A11Y_RECORD=1 A11Y_RECORD_ONLY="Stamp editor open" node test/screens.mjs`. A state fails when its count of interactive elements differs from the base, or when an element has no base box. A grown hit area moves no drawn box. Other painted boxes are not recorded.
- `check:screens`, claim 11 (L6): at 375px, the probe taps 1px outside each control's side, from corner to corner. A point counts for a control only when it is strictly nearer to that control than to any other control. So each side's probes stop at the gap midpoint. The probe steps 1px along each side and includes the far end, so the full side counts, not four points. A tap inside another control's own border box counts for that control, and is not a finding. A tap that a neighbour takes outside its border box is a finding. The check runs in these eight states: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open. A state that tests no tap fails. Points outside the viewport are skipped. Only the 1px ring around each side is probed.
- `check:screens`, claim 12 (L6, the 2026-10-13 chip gap): it runs at 375px on touch, in the Stamp editor state. Each of the six kind chips has a hit area at least 44px tall. The hit area is centred on the chip. It ends at the gap midpoint to the chip above and to the chip below. The reach is walked from the chip's drawn box up and down its centre column, in 0.25px steps. It stops at the first point that is not inside the chip's own button. The span, centring and midpoint checks allow a 0.25px tolerance. The constant is `STAMP_TOL_PX`. Owner ruling 2026-10-13 22:20 CDT. Measured cause: the chip rows sit at fractional offsets (the chip at y=388.875). Chromium rounds hit-tests near the gap midpoint. So up to 0.25px past the midpoint can return the farther chip (689 of 55,161 samples at 0.125px steps). No CSS removes it. A finger cannot aim that fine.
- `check:screens`, claim 13 (L6, Sorted by top rule): at 375px on touch, on the Ledger tab, each tap on the painted 1px top rule of "Sorted by" lands on "Sorted by". The check samples every 0.25px down the rule, and every 4px across the row, inset 2px from each end.
- Test group 70 (L7, `test/app.test.mjs`): 70.1 and 70.2 name the four bar tabs and the Ledger rows by their visible labels, with a count as its own word. 70.3 pins the photo viewer as a modal dialog that takes focus on open, closes on Escape, and returns focus to its thumbnail. 70.4 pins that each disabled control names its reason through `aria-describedby`.
- Tests 65.1 to 65.4 keep the removed GitHub verbs off every screen. Test 65.8 pins the armed Reset's Cancel after Reset.

Tests 21.4 and 62.1 to 62.10 pin the bar. Tests 63.4 to 63.7 pin the Ledger tab's order and its current tab. Tests 63.21 to 63.24 pin the armed Reset's count, its neighbours and its first focus. Tests 61.8 to 61.9, 61.11 to 61.16, 61.41 to 61.42 and 61.43 to 61.57 pin the other rules. Tests 61.33 to 61.35 cover a draft that survives a tab change. The test pins check the DOM, not geometry.

## Holes, named

- A tap within 0.25px of a chip gap midpoint can go to either chip. Claim 12 allows that reach (owner ruling 2026-10-13).
- Claim 12 passes a chip hit area of 43.75px with a 0.25px centring offset. Three chips (Claim filed, Refunded, Seller contacted) measure that on the lane build. The other three measure 44px.
- Claim 9 reads fractional box edges up to 1px high. A 43.5px box reads as 44px, so claim 9 can pass a box just under 44px.

## See also

- `spacing-on-4px-grid` — the spacing default this repo follows.
- `phone-nav-is-bottom-bar` — the phone navigation ruling, which takes the house default for a bottom bar.
- `ledger-tab-holds-options` — the Ledger tab that the bar holds.
