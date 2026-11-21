# Envelope photos: the gallery wall (directed 2)

Mockup: `envelope-photos-directed-2.html`. Designer kind: directed. Direction: gallery wall: all unmatched envelopes as a photo grid you sort by eye.
Debts this screen would close: `native-envelope-has-no-photos`, `native-photo-screens-unwired` (the screen half only).

## Deep links

Hash keys combine with `&`. No hash shows both concepts, every device, the wall.

- Concept: `c=sheet` (Contact sheet), `c=stacks` (Stacks), `c=all`.
- State: `s=wall`, `s=loading`, `s=sync` (a photo on another device, one missing 9 days), `s=error` (today's error bar, and a photo that cannot be opened), `s=empty`, `s=filtered` (a filter emptied the sheet), `s=detail`, `s=viewer`, `s=zoom`, `s=delete` (Delete armed), `s=camera`, `s=composer`, `s=colour` (sorted by colour), `s=matched` (Undo notice), and for Stacks only `s=select`, `s=stack`, `s=compare` (open pose).
- Device: `d=folded`, `d=open`, `d=phone`, `d=ax5`, `d=all`.
- Example: `envelope-photos-directed-2.html#c=stacks&s=compare&d=open`.
- Focus ids for the waiting page: `focus-sheet` and `focus-stacks` (the folded frame of each concept).

## Sizes, theme and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt, hinge 455.5 to 495.5 pt: the brief. `layout.py devices` prints `unknown` for this repo.
- Large phone: `layout.json` names it `iphone-regular` with `size: null`, and the brief gives no size. It is drawn at the folded Duo size, and the frame has width and height fields that reflow it. See Input Needed.
- Status bar 20 pt: `DuoHandUITests.statusBarFloor`, as `duo-hand-notice-match-notes.md` reads it. Real height unmeasured.
- Open-pose tab bar: `DuoBar` and `DuoBarMetrics` in `native/Manifest/DuoSpine.swift` (64 pt pill, 12 pt lift, 24 pt inset), under the right page only. The folded pose uses the system `TabView` bar (`RootView.swift`); its height is drawn with the same metrics, an estimate.
- Keys: open pose top at 405 pt (`duo-fold-and-keyboard`, via `duo-hand-notice-match-notes.md`). Folded: the same 264 pt height, an estimate.
- Colours: `shared/tokens.json` only (`design-parchment-ledger`). Pixels inside the drawn sample photos are picture content, not interface colour. Light theme only: the native app is held to light, so no `t=dark` link exists.
- Type: Cochin for words and Menlo for numbers (`typography-cochin-and-mono`); system font for navigation bars, toolbar buttons, the segmented control and menus. Sizes from `OrphanedView.swift` where a part exists today.
- AX5 factors from the Typography page's tables: Body 17 to 53, Footnote 13 to 44, Caption 1 12 to 43, Caption 2 11 to 40.
- Apple pages read 2026-11-21, each answered 200: Layout (safe areas, size classes), Typography (Dynamic Type tables), Accessibility (44x44 pt default control, 28x28 pt minimum, text to 200 percent), Buttons, Sheets (Cancel leading, Done trailing), Tab bars (navigation, not actions), Toolbars, Collections (image content in a standard grid; avoid layout changes while people view it).

## Items

Items 1, 2, 3, 5, 6, 7 and 8 have a Hide control on the page. Hiding one returns the frames to today's behaviour. Item 4 (the sheet) has none: both concepts are built on it.

1. **Contact sheet** (concept). A square grid, newest first (today's pile order, `OrphanedView.list`). The first photo is each tile's face, with a photo count chip. An envelope with no photo shows its note on a dashed index card. A segmented filter (All, With photo, No photo), a sort menu and a Larger/Smaller toggle sit above it. Tap a tile to open the envelope page.
   - Gain: the answer to "which have pictures" is one glance; the faces carry the memory the person asked for. A standard grid (Collections page).
   - Loss: the candidates and Discard move off the wall to the envelope page, one tap deeper than today's card.
   - Pick: yes. Departs from: `OrphanedView.list` (a list of full `EnvelopeCard`s with candidates inline). Owner grant: yes.

2. **Stacks** (concept). The same envelopes pinned up a degree off true, with a gold tape corner (gold is ornament, `palette-gold-is-ornament-only`). Select, then "Stack N as one sender", groups envelopes that look alike. A stack fans its photos, takes an optional name, and opens to its members; Unstack breaks it.
   - Gain: sorting by eye becomes an act the app keeps. Two blue cat-sticker mailers stay together until the order shows up.
   - Loss: a new kind of record. A stack id on an envelope changes the saved state (`saved-state-shape`) unless stacks stay on the device. Larger tiles show fewer envelopes per screen.
   - The page says a stack is only for the eye. Each envelope still matches its own order, one at a time (`orphaned-mail-never-decides`): nothing is assigned as a stack.
   - Pick: show it. Owner grant: yes (invariant `saved-state-shape`).

3. **Record opens the camera first.** "Record an envelope" opens the system camera; Use Photo opens the composer with that photo. Hidden: the composer opens with the card field focused, as today.
   - Gain: matches "I just need to remember what it looked like". One tap to the shutter.
   - Loss: a person who wants to type cards first has one more tap (Cancel on the camera).
   - Pick: camera first. Departs from: `orphan-entry-takes-one-input` (one input, focused when the composer opens) and `ComposerView.onAppear`. Owner grant: yes.

4. **The composer is a sheet.** Cancel leading, Save trailing (Sheets page). It holds the photos (56 pt, each with a red Remove, `orphaned-colours-by-meaning`), Photo and Library tiles, today's card field with suggestions and "as typed" row, steppers and note.
   - Gain: native; the wall stays put under it, so nothing reflows.
   - Loss: today the composer sits inline above the pile.
   - Pick: sheet. Departs from: `OrphanedView.list` (inline `ComposerView`). The draft rules of `orphan-entry-takes-one-input` stand: Cancel keeps the draft. Owner grant: no.

5. **Save with a photo only.** Save is on when the draft has a card or a photo. Hidden: Save needs a card, as today.
   - Gain: the person can file an envelope before opening it.
   - Loss: an envelope with no cards matches nothing until it is edited. The envelope page says so.
   - Pick: yes. Departs from: `ComposerView` (`ready = !d.entries.isEmpty`) and the `emptyEnvelope` refusal ("An envelope needs at least one card.", `OrphanedNotice.refusal` in `Orphaned.swift`). Owner grant: yes.

6. **Viewer with zoom and delete.** A Close button (top leading), "2 of 3", swipe between photos, a filmstrip, double-tap or pinch to zoom 2.5x and drag to pan, and Delete photo, which arms in place ("Tap again to delete photo", red). Escape closes. Hidden: today's viewer, where a tap anywhere closes it and nothing zooms.
   - Gain: the person can read a label by zooming, and can delete a bad shot where they see it.
   - Loss: a tap no longer closes the viewer, because a tap is half of a double-tap.
   - Pick: yes. Departs from: `photo-thumbnails-and-viewer` (a tap anywhere dismisses) and `PhotoViewer` in `PhotoViews.swift`. Owner grant: yes.

7. **Sort by colour.** A third sort key groups envelopes by the main colour of their first photo (white, grey, yellow, brown, pink, blue), then those with no photo.
   - Gain: look-alike envelopes land side by side.
   - Loss: a colour must be computed on the device for each photo and kept beside it (not in the ledger, `photos-stay-out-of-the-ledger`). A poor photo sorts badly.
   - Pick: show it. Owner grant: yes (a new stored figure).

8. **Compare across the fold** (Stacks, open pose only). "Compare with another envelope" puts this envelope on the right page and a second on the left, with a strip to change the second. "Stack these two" stacks them. The folded pose and the phone have no Compare control (`ux-control-earns-place`).
   - Gain: the Duo's two pages used for the one job a single screen does badly.
   - Loss: an open-pose-only feature.
   - Pick: yes. Owner grant: no.

9. **Photos this phone does not hold.** A photo on another device shows a striped tile, "On another device". One missing for 9 days shows a manila tile, "Missing 9 days" (`pull-warns-on-what-it-drops`). The envelope page offers Open Sync for both (today's `openSync`). Loading tiles are a plain manila fill (`orphaned-colours-by-meaning`).
   - Gain: unknown never reads as "no photo" (`ux-unknown-is-not-empty`), and each state leads on.
   - Loss: two more tile faces to learn.
   - Pick: yes. Owner grant: no.

10. **Failed states** (`s=error`). Today's error bar (`OrphanedView.errorBar`) stays over the foot of the list. A photo that does not decode shows "This photo can't be opened" with Delete photo (arms in place) and Retake. Today `decodePhoto` returns nil and `PhotoTile` stays grey, which looks like loading.
   - Gain: a broken photo says so and can be replaced.
   - Loss: none found.
   - Pick: yes. Departs from: `PhotoTile` (grey fill on a failed decode). Owner grant: no.

11. **Kept from today.** The masthead and tab bar, the badge count, the micro line, entries, note, "Could have come from" with a tie line and "This one", the green Undo notice with Dismiss, Discard that arms in place ("Tap again to discard N cards"), and the empty line (`OrphanedNotice.emptyLine`).
   - Gain: the matching flow and its rules do not change (`orphaned-mail-never-decides`, `assign-checks-recorded-cards`).
   - Loss: none.
   - Pick: keep. The candidate meta and fit lines are drawn at 11 pt, not the 10.5 pt of `CandidateRow`, because 11 pt is the iOS minimum. "Could have come from" stays at today's 10.5 pt (`micro` in `OrphanedView.swift`), drawn as built. Owner grant: no.

12. **Accessibility sizes.** At AX5 the grid keeps two columns, the tile note moves to the envelope page and the VoiceOver label, the segmented filter becomes a "Show" menu, the size toggle goes, and Record sits in the flow under the bar instead of floating.
   - Gain: the wall still shows two envelopes across at the largest size.
   - Loss: no note on the tile at AX5.
   - Pick: yes. Owner grant: no.

An envelope with no photo shows no "No photo" text on its tile: the dashed index card says it by shape, and the filter says it once (`ux-label-once`).

## Haptics (`ux-haptics-feel-substantial`)

The quantity steppers, the stack selection checks, Stack and the armed Delete each take a light haptic in the build. A mockup cannot show it.

## Self-review (skill `design-review`, applied to this mockup)

- Structure: `new` for both concepts. The tab's first screen becomes a grid and the candidates move to an envelope page.
- Native or web-like: `native` for both. A navigation stack with a back button, a segmented control, menus with check marks, a sheet with Cancel and Save, the system camera, a modal viewer and the tab bar. The pinboard tilt and tape in Stacks are content styling, not controls.
- `check_ios_mockup.py`: safe-area and duo-frames pass. system-font fails on Cochin, the repo's ruled content font (`typography-cochin-and-mono`). The same check fails the same way on `duo-hand-notice-match.html` on main. The check looks like a false alarm for this repo.
- Click-through in headless Chrome: the main flows pass (record, shoot, compose, save, open, view, zoom, delete, take a photo on the envelope page, This one, Undo, filter, sort, stack, unstack, compare, the Hide controls). A pixel check of the hinge strip finds no content on it in the wall, viewer, composer, compare and camera states. In the open pose's default state, every button outside the tab bar measures 44 pt or more; other states were not measured.
- `label_once.py` on the rendered folded frames (wall, envelope, composer, viewer): no hits.

## Critique (impeccable, native: design review only, single context)

Heuristics: status 3, real world 4, control 3, consistency 3, error prevention 3, recognition 4, flexibility 3, minimalist 3, recovery 3, help 2. Total 31/40.

- Fixed: the open pose with no envelope said "Pick an envelope on the left page" over an empty left page. The right page is now blank.
- Fixed: the composer's Remove photo badge was clipped by the strip. It now sits inside the thumbnail corner.
- Fixed: at AX5 one tile filled the screen, so the wall showed one envelope at a time. It now keeps two columns.
- Fixed: the AX5 "Show" menu had no menu cue. It now has a chevron.
- Fixed: no failed state was drawn. `s=error` now draws the error bar and a photo that cannot be opened.
- Fixed: "No photo" showed on the filter and on every index card. It now shows on the filter only.
- Open: the wall carries five controls above the grid (three segments, sort, size). Pinch to resize, as in Photos, could replace the size toggle.
- Open: Help scores 2. Nothing explains a stack until the person opens one.
