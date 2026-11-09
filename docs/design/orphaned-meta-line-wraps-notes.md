# Orphaned candidate: the meta line wraps, or keeps one line

Mockup: `orphaned-meta-line-wraps.html`. Owner page item 56 (`orphaned-meta-line-wraps`, "Candidate line wraps"). Debt: `native-candidate-lines-wrap`, closed by the owner's ruling or by a one-line version that passes the audit. Decisions: `orphaned-colours-by-meaning`, `design-parchment-ledger`, `audit-skips-measured-flags`. Invariant: `no-layout-shift-under-pointer`.
Lane kind: informed (the brief names no kind).

Deep links: `#o=wrap`, `#o=shrink`, `#o=cut`, `#o=cutline`, `#o=capped`, `#o=web`; `#size=default`, `#size=xxxl`, `#size=ax3`, `#size=ax5`. Join them with `&`, for example `#o=cutline&size=ax5`. No hash shows all, with the summary table first. Each one-line candidate has a Hide button.

Focus ids for the waiting page: `focus-wrap` (the "Wrap is right on the phone" head over the Wrap column) and `focus-one-line` (the "Keep looking for a one-line version" head over the four candidates). `focus-wrap-row` marks the wrapped meta line at AX3; `focus-web-row` marks the web row's meta line.

Screenshots: `shots/orphaned-meta-line-wraps/<option>-<size>.png`, one per option per text size (20), plus `web-375.png` and `open-duo-wrap.png`. Headless Chromium, device scale 2.

## Sizes and sources

- Screen: the folded Duo outer screen, 466 pt wide (`duo-fold-and-keyboard`, re-measured 2026-11-08). The open Duo's right page is 455.5 pt (same record). `layout.py devices` gives `unknown` for this repo, so the brief's "phone" is drawn as the folded Duo.
- Gutters: the list pads 16 pt (`OrphanedView.list`). The candidates block pads 8, 12, 12 and stacks at 8 (`EnvelopeCard.card`). A row pads 8 and keeps 8 pt to "This one" (`CandidateRow.body`). The drawing reads the meta column at 307 pt at the default size, 279 at xxxLarge, 214 at AX3, 186 at AX5.
- Type at the default size (`CandidateRow.body`): seller Cochin 14 bold, relative to Body; meta Menlo 10.5, relative to Caption 1; fit line Menlo 11, Caption 1. "This one" is `MiniLabel` at Menlo 11.5, Caption 1, 8 pt padding, 44 pt hit frame. Header micro 11 and section micro 10.5, Caption 1 (`micro` in `OrphanedView.swift`). Entries Cochin 13.5, Body. Tie line Cochin 12.5, Footnote (`AdvisoryText`).
- Scaling: `Font.custom(_:size:relativeTo:)` scales by its text style. Apple's iOS Dynamic Type tables give Body 17, 23, 40, 53 and Caption 1 12, 18, 32, 43 at Large (the default), xxxLarge, AX3 and AX5. So the meta line draws at 10.5, 15.75, 28 and 37.6 pt.
- Colours: meta and fit line inkSoft; seller ink; row border line; tie line manilaInk on manila (`OrphanedPaint.token`, `ControlPaint`).
- The order number needs 133, 199, 354 and 476 pt at the four sizes (21 characters at Menlo's 0.602 em advance). From AX3 on it is wider than the whole column by itself.
- Unmeasured: the text size of the 2026-10-27 audit. `OrphanedUITests.launch` passes no `-UIPreferredContentSizeCategoryName`, so `testAccessibilityAuditOrphanedEnvelopeWithATie` ran at the simulator's own setting, and no record names it. AX5 is drawn as the worst case; `DuoSpreadUITests.testFlatBarLabelsFitThePillAtAccessibilityXXXL` uses it. AX3 is drawn as the repo's usual large size (`duo-hand-notice-match-notes`).
- Unmeasured: the width SwiftUI gives "This one" at AX3 and AX5. Drawn at its natural width, capped at half the row, so it wraps to two lines there.
- Unmeasured: where SwiftUI breaks the order number. Chromium breaks after a hyphen, and inside the number when one part is still too wide.
- Fonts: Menlo is drawn from DejaVu Sans Mono and keeps its advance, so mono widths are the same as on a Mac. Cochin falls back to Liberation Serif here, so seller and entry widths are estimates. Line heights are Chromium's; row heights are estimates within a few points.
- Theme: one. The native app is held to light (`design-parchment-ledger`, `UIUserInterfaceStyle`).
- Apple pages read 2026-11-08, each answered 200: Typography (the Dynamic Type tables; 11 pt minimum), Accessibility, Buttons (44x44 pt hit region), Layout.
- Sample, the same in every frame: an envelope of Lightning Bolt, Counterspell and Brainstorm; two packages tie. Alpha Cards, 2026-07-01, untracked, order `7C41B09E-3A5F12-D80C4`; Beta Games, 2026-07-29, order `E93A6D21-0B7C48-15FAE`. The order numbers are invented in the 8-6-5 shape that a TCGplayer order number has. The seed's own ids (`A1`, `B1`) are too short to show the problem.

## The web row

- `EnvelopeCard` in `src/app.jsx`: the meta line is one line, `whiteSpace: "nowrap"`, `textOverflow: "ellipsis"`, Menlo 10.5 px, with the order id in a `title`. The page pads 16 px (the wrapper at `src/app.jsx` around line 5984).
- At 375 px the web row cuts the untracked row's order number to "7C41B0…". A phone has no hover, so the rest of the number is out of reach there. The web text is in px and does not follow iOS text size.

## Items

1. **Wrap (today).** `CandidateRow.body`: the meta `Text` has no line limit. Drawn as `#o=wrap`.
   - Gain: every character shows at every size. The audit raises no clipped-text finding on the line (commit 7c887ab, 2026-10-27). Nothing to build: the ruling closes the debt.
   - Lose: rows grow with text size. Row 1 reads 63, 120, 293 and 598 pt tall at the four sizes; at AX5 one candidate takes most of the 678 pt screen. Tied rows can differ by a line (row 1 carries the untracked tag): at AX3, 4 lines against 3. The phone differs from the web.
   - Pick: yes.

2. **Shrink to fit.** `lineLimit(1)` with `minimumScaleFactor(0.5)`, then "…": what the seller line ships today. Drawn as `#o=shrink`.
   - Gain: one line at every size, as on the web.
   - Lose: the audit called the meta line "Text clipped" with this rule (measured 2026-10-27, debt `native-candidate-lines-wrap`; commit 1cbc69b). At xxxLarge the untracked row shrinks to 9.7 pt, smaller than at the default size, while the other rows grow. From AX3 on it hides the whole order number.
   - Pick: no. Fails the audit.

3. **Cut at full size.** `lineLimit(1)`, tail truncation: the web's rule. Drawn as `#o=cut`.
   - Gain: one line; the text never shrinks.
   - Lose: a `Text` with a line limit and tail truncation makes the audit raise "Text clipped" with no element (measured 2026-10-28 on the Tally meta line, `audit-skips-measured-flags`), so no named skip can match it. Hides part of the order number at xxxLarge, and all of it from AX3 on.
   - Pick: no. Fails the audit.

4. **Cut line.** The Tally meta line's `CutLine` (`ControlViews.swift`): the text is hard-clipped at the column with a drawn "…", and it wraps at accessibility sizes. Drawn as `#o=cutline`.
   - Gain: one line up to xxxLarge, as on the web. One home: the Tally line and the stamp note already draw through it. The audit raised nothing on the Tally line (2026-10-28).
   - Lose: at AX1 and up it wraps, so there it is the same as Wrap. Up to xxxLarge it hides part of the order number. Its audit on this row is unmeasured. It does not close the debt as written, which asks for one line at the large size.
   - Pick: no. It keeps one line only where the line is short anyway.

5. **Capped size.** The meta line stops growing at xxxLarge (`.dynamicTypeSize(...DynamicTypeSize.xxxLarge)`, as `DuoSpine.swift` caps the bar at `.large`), and it cuts as Cut line does. Drawn as `#o=capped`.
   - Gain: one line at every size.
   - Lose: the line stays at 15.75 pt while the rest of the row reaches 37 to 53 pt. It hides part of the order number from xxxLarge on, and all of it from AX3 on. Its clipped-text audit is unmeasured. The audit's Dynamic Type check may flag text that stops growing; unmeasured.
   - Pick: no.

6. **What decides it.** From AX3 the order number alone (354 pt) is wider than the meta column (214 pt). So at full size, no one-line rule can show the whole order number there; each candidate hides it, shrinks it, or caps it. Owner grant: yes (the pick closes the debt by ruling, and departs from the web).

Departs from: `EnvelopeCard` in `src/app.jsx` keeps the meta line on one line with "…". The pick, Wrap, keeps the phone's current behaviour and departs from the web only. Not blocking.

`no-layout-shift-under-pointer`: no option moves a row on a press. Row height follows text size, never state.

## What the pick changes

Nothing in Swift. The debt `native-candidate-lines-wrap` closes on the ruling; its Status line and the waiting item's home need the owner's answer, outside this folder.

## Critique (impeccable, single context: no sub-agent tool in a designer; native method, design review only)

The launcher's context step was skipped (`impeccable-review-only`); the repo has no PRODUCT.md or DESIGN.md. The detector does not apply to a native screen.

- Fixed: at the default size all five columns draw the same, and the comparison lay below the fold. A summary table now opens the page: lines, size, characters hidden and row height for each option at each size, plus the room each size leaves the order number.
- Fixed: the dashed tag labels sat over the meta line they marked, at small sizes over the text itself. The tag words now sit in each frame's caption and column head; the line keeps only its dashed outline.
- Fixed: a long code span pushed the page 568 px wide at 390 px. Code spans wrap now; the grid, the web row and the open Duo scroll inside their own boxes.
- Fixed: `check_ios_mockup.py` found no device frame (frames are built by script). The grid and the open Duo box carry `data-device`.
- Fixed: the readout now flags a meta line drawn smaller than at the default size (Shrink to fit, 9.7 pt at xxxLarge).
- Open, carried: the meta line is 10.5 pt and the header micro 10.5 to 11 pt at the default size, under the 11 pt iOS minimum (`CandidateRow.body`, `micro`). Product finding, outside the design folder.
- Open: under Wrap, tied rows can differ in height by a line at large text, so a tie does not look like a tie.
- Product finding, outside the design folder: the web row hides the untracked package's order number at 375 px, with no way to read it on a phone.

## Input needed

- Is wrapping right on the phone (the pick), or should a lane keep looking for a one-line version? Owner grant: yes. Not blocking: the phone ships the wrap meanwhile.
- Should the order number get its own line on the phone at every size, so tied rows keep the same shape? Not drawn. Not blocking.
- Should the web row show the whole order number on a phone, since it has no hover? Not drawn. Not blocking.
