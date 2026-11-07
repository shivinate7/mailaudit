# Card in Hand: a tap on a match moves nothing under the finger

Mockup: `duo-hand-tap-shift.html`. Debt: `hand-suspense-tap-shift`, closed by the pick once a test pins it. Decision: `duo-card-in-hand`. Invariant: `no-layout-shift-under-pointer`.
Lane kind: informed (the brief names no kind).

Deep links: `#s=before`, `#s=today`, `#s=hold`, `#s=keep-slot`, `#s=trim`, `#s=folded`. Add `c=unique` or `c=shared` for one case, for example `#s=hold&c=shared`. Add `k=down` to leave the keys out, so what sits under them shows. No hash shows all.

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. So the open pose is drawn at the brief's size: 951 by 669 pt, fold 40 pt at 455.5 to 495.5 pt (`duo-fold-and-keyboard`).
- Keys top: 405 pt, the drawn panel top in `duo-fold-and-keyboard`. Every frame draws the keys from 405. A dotted line marks 428 pt, the keys top with no word suggestions. That figure is the brief's, not in a record.
- Field top: about 155 pt, from the brief: the built page sits about 63 pt lower than `duo-hand-notice-match` drew it. This drawing reads 156. What fills the 63 pt band is not read here, so the band is drawn empty and labelled.
- The status bar foot is unmeasured. It is drawn at 20 pt, the floor in `DuoHandUITests.statusBarFloor`.
- Order and gaps come from `HandScreen.leftPage`: 16 pt padding, a 12 pt stack gap, which also falls between match rows (the `ForEach` in `matches` sits in that stack), a 48 pt field, a 44 pt `MiniLabel` frame, 44 pt match rows. The box is `HandScreen.notice`.
- Read from the drawing (headless Chromium, Cochin and Menlo): row 1 y 296 to 340, row 2 y 352 to 396, row 3 y 408 to 452. Row 3 sits under the keys; at 428 pt its top 20 pt shows. Each frame prints its own reading. Treat each figure as an estimate within a few points. The builder's UI test is the real check.
- Default text size only. AX3 is not drawn: there the field and This envelope already push the first row under the keys (`duo-hand-notice-match-notes`, item 1), and the rule after a tap is the same.
- Theme: one. The native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-11-07, each answered 200: Accessibility (44x44 pt default control size; 4.5:1 minimum contrast), Buttons (44x44 pt hit region), Layout (respect the safe areas), Typography.
- Sample, the same in every frame: "to" typed; the seed's three matches, Brainstorm, Path to Exile and Swords to Plowshares (the case in `testTappingAMatchDoesNotMoveNewEnvelope`); the finger on row 2. The shared case is a sample: in the seed, Path to Exile is in one envelope only. Only the list's rule after the tap changes between options.
- Seed case for a shared-name test, read by hand from `shared/fixtures/ledger.json`, not run: type "n". The list should read Lightning Bolt, Counterspell, Brainstorm, Ponder, Preordain. Row 2, Counterspell, is in Alpha Cards and Beta Games.

## The web app

- The web has no Card in Hand list. `handHits` and `handStep` in `src/view-rules.mjs` serve the native engine; `src/app.jsx` never calls `handHits`.
- The nearest web list is the match list in `EnvelopeComposer` (`src/app.jsx`). Its `addName` runs `setDraft("")`, so the whole list unmounts on a tap, and the entries below it rise. That is the same collapse, so it is no precedent for a fix. No test pins it. Reported, not drawn: it is outside this screen.
- The web's own answer under the invariant is the sticky row: a checked row stays visible until the filters change, and the sort order holds while checking (`no-layout-shift-under-pointer`; house rule `ux-order-holds-still`). Hold the list copies that pattern.

## Items

1. **Today** (`HandScreen.matches`: `Button { query = name }`; `hitNames` filters by the query). Drawn as `#s=today`.
   - The list collapses at once to the tapped row. Path to Exile moves from y 352 up to y 296, 56 pt, and empty paper sits under the finger.
   - Shared name: about 150 ms later (the settle in the field's `.task(id: query)`, then `HandModel.type`), the Suspense box opens at y 352 to 424, under the same finger. 53 pt of it shows above the keys.
   - A second tap there hits the inert box or nothing. A tap aimed at row 3's old place lands on the box.

2. **Hold the list.** Drawn as `#s=hold`. After a tap, every row keeps its place until the next keystroke. The tapped row reads as chosen: bold, a 3 pt accent bar, the selected trait for VoiceOver. The other rows stay live, in inkSoft (4.68:1 on paper).
   - Gain: nothing on the left page moves on a tap, in both cases. A mis-tap is mended with one more tap on the right row. It copies the web's sticky row. The list still says what "to" matched.
   - Lose: one more state to build (the held names and the chosen one). For a shared name, the Suspense box opens below the held rows, at y 464 to 536, wholly under the keys. Nothing on the left page above the keys then says the card is held. The right page's tie ("2 envelopes hold this card") says the name decides nothing yet. Same gap as `hand-held-box-under-keys`.
   - Pick: yes.

3. **Keep the slot.** Drawn as `#s=keep-slot`. After a tap, the tapped row stays in its slot. The others leave the eye and VoiceOver but keep their space until the next keystroke.
   - Gain: nothing moves. The one match reads as the answer.
   - Lose: a blank slot above the match looks like a fault. A mis-tap needs a keystroke to bring the list back. The Suspense box opens under the keys, as in Hold the list. The rows that leave are a change of state the house rule `ux-press-moves-nothing` counts, though no row moves.
   - Pick: no.

4. **Trim below.** Drawn as `#s=trim`. After a tap, the rows above the tapped one and the tapped row stay; the rows below go.
   - Gain: nothing above or under the finger moves. Less held state than Hold the list: the list is cut, never frozen. The Suspense box opens one slot higher, at y 408 to 480: under the keys at 405, with 20 pt showing at 428.
   - Lose: the box takes the slot row 3 left, so a quick second tap aimed at row 3 lands on the box (`ux-press-moves-nothing`). The rows above stay but read as live matches, not as a choice. The rule is harder to say in one sentence.
   - Pick: no.

5. **What ends the hold** (Hold the list and Keep the slot).
   - A keystroke that changes the field ends it: a letter, a delete, a cleared field. So does Close. Then the list is read from the field, as today.
   - New envelope does not end it: it changes no name in the list.
   - A tap on a dimmed row sets the query to that name and moves the chosen mark. The rows stay.
   - The held names are a snapshot taken at the first tap. A check-in on the right page does not drop a held row, as the web's sticky row stays until the filters change.
   - Pick: as above. Owner grant: no.

6. **Folded pose.** Card in Hand opens only on two pages (`PackagesTab.twoPages`). The folded frame is drawn only to say that nothing changes. Owner grant: no.

Departs from: today's collapse to the tapped row in `HandScreen.matches` (`Button { query = name }`, with `hitNames` filtered by the full name). Not blocking. Owner grant: no.

## SwiftUI change implied by the pick

In `HandScreen`, keep the names on screen and the chosen name in state. On a match tap: if no list is held, hold the names on screen; set the query and the chosen name. When the query changes to anything but the chosen name, drop the held list. `matches` draws the held list if there is one, else `hitNames`; a row that is not chosen is `Parchment.inkSoft`; the chosen row gets `.isSelected`. Close drops the held list.

Tests. `testTappingAMatchDoesNotMoveNewEnvelope` expects the collapse (`waitForHits(app, count: 1, ...)`): re-point it, red first. It should assert three rows after the tap and the tapped row's `minY` unchanged. Add a shared-name twin (type "n", tap Counterspell): the tapped row's `minY` is unchanged, and `hand-held` `minY` is at or below the last `hand-hit:` row's `maxY`. Together they close `hand-suspense-tap-shift`.

Focus ids for the waiting page: `focus-hold`, `focus-keep-slot`, `focus-trim`, each with a `-shared` twin; `focus-today` and `focus-today-shared` for Today; `focus-before` for the frame before the tap.

## Critique (impeccable, single context: no sub-agent tool in a designer)

Design review only: the drawing is of a native screen, so the detector does not apply. The launcher's context step was refused (`impeccable-review-only`), and the repo has no PRODUCT.md or DESIGN.md.

- Fixed: the finger covered the row's text in every frame; it now sits beside the name.
- Fixed: the 428 pt label lay over the top key row; it is shorter and sits right of the keys.
- Fixed: with the keys up, the reader could not see where the Suspense box opens in the hold options. `k=down` leaves the keys out.
- Fixed: `check_ios_mockup.py` found no static unfolded frame (the frames are drawn by script); each frame set now carries `data-device="iphone-duo-unfolded"`.
- Open, in the pick: inkSoft rows may read as disabled, though a tap on one picks it. See Input needed.
- Open, all options: for a shared name the left page shows nothing held above the keys (`hand-held-box-under-keys`).
- Product finding, outside the design folder: the match list in the web's `EnvelopeComposer` collapses on a tap and the entries below rise. No test pins it.
- Product finding, carried: the micro labels and the box title are 10.5 pt (`HandScreen.micro`, `HandScreen.notice`), under the 11 pt iOS minimum.

## Input needed

- In Hold the list, should the other rows stay ink, with only the chosen row marked, so none reads as disabled? Drawn in inkSoft. Not blocking.
- Should a held card also show as a short count in the header row ("1 held"), so it stays above the keys while the Suspense box opens under them? Not drawn: it changes the header, which this lane holds constant. Carried from `duo-hand-notice-match-notes`. Not blocking.
