# Panel paper fill: an overlay panel with and without the paper colour

Mockup: `panel-paper-fill.html`. Waiting item 63, `panel-paper-fill`. Decision: `ruled-head-panels-carry-no-fill` (an orchestrator default, not an owner ruling). Debt: `panel-paper-fill-unbuilt`. The overlay it depends on: `motion-disclosure-panels-arrive`, debt `panels-overlay-unbuilt`. Invariant: `no-layout-shift-under-pointer`.
Lane kind: informed (the brief names no kind).

Deep links: `#p=sort` or `#p=history` for the panel, `w=375` or `w=760` for the width, `t=light` for the theme, `o=paper`, `o=none`, `o=rule` or `o=built` for one frame. Example: `#o=paper&p=history&w=760&t=light`. No `o` shows every frame side by side. The Hide buttons take one frame off the page each.

## Sizes and sources

- Every frame is a headless Chromium screenshot of the committed `index.html` (built from `src/`), device scale 2. The page was seeded with `shared/fixtures/ledger.json` under the storage key `STORE_KEY` in `test/screens.mjs`, as `openSeeded` does. The capture script is `shots/panel-paper-fill/capture.mjs`. A second run gave the same readings for all 16 frames.
- Sample data: the fixture's counts and dollar figures are not real. The px readings are real measurements of the built page.
- `layout.py devices` gives `unknown` for this repo. Widths 375 and 760 px at height 812 come from `WIDTHS` and `openSeeded` in `test/screens.mjs`.
- One theme, light. `shared/tokens.json` holds one palette and `src/app.jsx` has no dark rule. The brief named light and dark tokens; there are no dark tokens.
- Panel style: `panelWrap` in `src/app.jsx` (padding 4px 8px 12px, a 1px `line` top rule, no background). Its callers: the Sorted by and Orders from panels in the View card, and `RecentPanel`, the Sync panel and the History panel in the Data card. All five open inside an `.mdl-lcard`, which paints `card`.
- Fill: `paper` #F2E9DA. Card: `card` #FCF6EA. So a paper panel reads darker than the card it opens from. Rule: `line` #DCCDB6.
- The overlay is not built. A style tag draws it: `.mdl-lcard:has(> .mdl-panel) { position: relative; overflow: visible }` and `.mdl-lcard > .mdl-panel { position: absolute; left: 0; right: 0; z-index: 4 }`. The panel keeps its place in flow and takes no space. The fill frames add `background: paper`. This geometry is the mockup's guess: `motion-disclosure-panels-arrive` names no geometry.
- Panels drawn: Sorted by (an option grid; little shows through) and History (text; much shows through). Figures read from the page, in document px:
  - Sorted by, 375: panel top 459, height 131, width 341. The View card's foot is at 522, so the panel runs 68 px past it, over the Data label and the Sync row.
  - History, 375: panel top 672, height 79, width 341, over Re-import CSV (672) and the top of Backup (724).
  - At 760 the same panels are 726 wide and sit 11 px lower.
- Row tops are equal in all three overlay frames at each width (for example at 375: Orders from 459, Sync 560, History 620, Re-import CSV 672, Backup 724, Reset 798). The fill and the rule move nothing.
- Unmeasured: the Orders from, Sync and Recent panels (the fixture has no sync key and no recent taps); touch devices and real iOS Safari; how the panel arrives over the rows during its 220 ms fade.

## Items

1. **Paper fill** (the item's first option, `#o=paper`). `panelWrap` takes `background: C.paper`.
   - Gain: the panel is opaque. Nothing under it shows, and a row you can see is a row you can tap. The option cells still sit raised: they paint `card` over the paper.
   - Lose: a square, full-bleed band, darker than the card, in a region with no other fill (the reason the old no-fill rule gave). Its foot has no rule. With the guessed geometry (the panel runs past its card's foot), it cuts the row under it through the text: the Sync row at 375 in Sorted by, Backup in History. A geometry that kept the panel inside its card would not make this cut. The owner ruled only that panels overlay, not this geometry.
   - Pick: yes, with item 3's rule. Owner grant: yes (this confirms an orchestrator default; the pick is the owner's).

2. **No fill** (the item's second option, `#o=none`). `panelWrap` as on main today, over the rows once the overlay is built.
   - Gain: no web change. The region stays free of fills.
   - Lose: the rows show through. The History text prints over Re-import CSV and Backup, and Orders from shows in the Sorted by panel's gutters. A row you can still see sits under the panel, so a tap on it reaches the panel's padding, not the row.
   - Pick: no. Owner grant: yes.

3. **Paper fill, ruled foot** (designer's variant, not on the item, `#o=rule`). Paper fill plus `borderBottom: 1px solid C.line`.
   - Gain: the cut edge becomes the region's own hairline, matching the top rule `panelWrap` already has. With the guessed geometry, the row under it is still cut, but by a line, as a ruled sheet laid on another would be.
   - Lose: one more line of style. The panel's height grows 1 px (131 to 132); it is out of flow, so nothing moves.
   - Pick: yes. Owner grant: yes (it adds a part the item did not name).

4. **As built today** (`#o=built`). Not an option: the page on main, where the panel pushes the rows down and nothing shows through. Drawn so the owner sees why the question exists only once the overlay lands. Owner grant: no.

Departs from: `panelWrap` in `src/app.jsx` (no background), which items 1 and 3 change. Not blocking.

## Notes for the builder

- The overlay and the fill belong in one lane: in flow, the fill hides nothing and only darkens the panel; as an overlay with no fill, the rows show through.
- An overlay inside `.mdl-lcard` needs `overflow: visible` on that card, or the card clips any panel that runs past the card's foot. Sorted by at 375 runs 68 px past it.
- With `overflow: visible`, the card's children are no longer clipped to its 8px corners. In these shots nothing showed it (`.mdl-lrow` paints `transparent`). Unmeasured for the Reset card's armed state.
- A check at 375 and 760 should read each row's top with a panel open and closed, and find them equal (`motion-disclosure-panels-arrive`, Web plan).

Focus ids for the waiting page: `focus-paper` (first option), `focus-none` (second option), `focus-rule` (the variant). Each frame draws its own state, so no two share a picture.

## Critique (impeccable)

Single context: a designer has no sub-agent tool. The launcher's context step was skipped, and the repo has no PRODUCT.md or DESIGN.md.

- Fixed: the four frames sat at different heights, because their tags wrapped to different lengths. A subgrid now lines the screenshots up.
- Fixed (detector): the img tags had no src until the script ran. Each now carries the Sorted by 375 shot, and a link opens the full-size shot.
- Fixed (detector): green tag text and the "nothing moved" line on paper read 4.3:1. Tag text is now ink, with the colour on the dashed border.
- Fixed (detector): 11px tracked labels are now 12px; the Theme link has its own row on a phone.
- Open (detector): one unlocated "line-height 1.22" finding remains after the labels and code were set to 1.4.
- False alarm (detector): "cream palette". The parchment page is the repo's palette (`design-parchment-ledger`).
- Open, for the owner: with the guessed geometry, the cut row under a filled panel shows in every fill frame. See items 1 and 3.
- Fixed (design review round 1): the overlay tags and the intro now say the geometry is a guess, and each cut caption ties the cut to it. The banner covers only the sample data. The capture script is committed. The Theme link keeps the panel and width.
