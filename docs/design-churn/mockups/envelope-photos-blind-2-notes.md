# Envelope photos, blind designer 2: notes

Designer kind: blind. Mockup: `envelope-photos-blind-2.html` (this folder). I saw no current screen,
spec, token file or other mockup. Every colour, size and word here is my own choice within the house
files, or a value from an Apple page cited below.

## Deep links

Open the mockup from disk and add a hash. Keys combine with `&`.

- `c=shoebox` or `c=envelope`: show one concept.
- `d=folded`, `d=open`, `d=phone`, `d=ax5`: show one device.
- `s=loading`, `s=empty`, `s=error`, `s=camera-off`: the state. No `s` means loaded.
- `t=light`, `t=dark`: the theme. No `t` follows the system.
- `scr=detail`, `scr=inside`, `scr=viewer`, `scr=zoom`, `scr=camera`, `scr=match`: open a screen.
- `hide=shoebox` or `hide=envelope`: hide a concept. Each concept has a Hide button too.
- `pw=<pt>&ph=<pt>`: draw the phone at a given size.
- `focus=concept-shoebox` or `focus=concept-envelope`: scroll to the element that carries the choice.

## Apple pages read

All read on 2026-11-21 through the `tutorials/data/...json` form, each answered 200.

- Layout, https://developer.apple.com/design/human-interface-guidelines/layout. Safe areas. It gives
  no iPhone point size in its text (see item 14).
- Typography, https://developer.apple.com/design/human-interface-guidelines/typography. The iOS
  Dynamic Type tables. Large (default): Large Title 34/41, Headline 17/22 semibold, Body 17/22,
  Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13. AX5: Large Title
  60/70, Title 2 56/66, Headline and Body 53/62, Subhead 49/58, Footnote 44/52.
- Accessibility, https://developer.apple.com/design/human-interface-guidelines/accessibility. Default
  control size 44x44 pt.
- Buttons, https://developer.apple.com/design/human-interface-guidelines/buttons. Hit region.
- Sheets, https://developer.apple.com/design/human-interface-guidelines/sheets. Cancel on the leading
  edge, Done on the trailing edge, Done inactive until the task can finish.
- Tab bars, https://developer.apple.com/design/human-interface-guidelines/tab-bars. A tab bar is for
  navigation, not actions.
- Toolbars and Lists and tables (same path form). Toolbar actions; text in lists.

## Choices

1. **Two concepts.** Shoebox list: a list of envelopes, then one envelope's page. Open envelope: one
   envelope at a time, outside (photos) and inside (note and cards), with a stamp rail as the whole
   pile. Gain: the owner compares a known shape with one no common app uses. Loss: two flows to
   judge. Pick: show both and let the owner cull. A third, a photo-wall grid, was dropped: on these
   widths it was the Shoebox list with bigger thumbnails.

2. **Bold structure: the hinge is the envelope fold.** Unfolded, the left page is the outside and the
   right page is the inside. Folded, a two-part switch flips the envelope over, with a 3D turn that
   becomes a fade under reduced motion. Gain: the device's own shape carries the model "outside,
   inside". Loss: one envelope at a time hides the list. The stamp rail (item 3) pays that back.
   Pick: keep.

3. **Which envelopes have photos, at a glance.** Shoebox: a photo thumbnail with a count, or a dashed
   hollow envelope outline. Open envelope: a photo stamp, or a dashed hollow stamp with a camera.
   Both: one line above, such as "5 envelopes, 2 without a photo". Shape carries it, never colour
   alone, so it holds in forced colours. The words "no photo yet" live only in each control's
   accessible name, so no status word repeats on screen. Gain: a scan finds the bare ones. Loss: none
   seen. Pick: keep.

4. **Photo cap: four per envelope.** The brief says "up to a few". At four, the add control is gone
   and one line says why. The camera's shutter turns off at the cap and says why. Gain: a short strip
   and a known end. Loss: a fifth angle needs a delete first. Pick: four. Owner grant: yes.

5. **A new envelope starts with the camera.** "Photograph an envelope" opens the camera first. The note
   and cards come after, on the envelope's page. In the person's words: "I just need to remember what
   it looked like." Gain: one press to the thing they came for. Loss: an envelope with no photo needs
   the camera's Cancel; the empty envelope is not made. Pick: keep. A "Choose from Photos" control
   sits beside the shutter.

6. **Where "take a photo" sits.** Shoebox: a full-width button in a bottom toolbar, in thumb reach.
   Open envelope: a filled "+" stamp at the end of the rail, and "Photograph this envelope" or
   "Add a photo" on the outside face. Never in a tab bar (Apple: tab bars navigate). Gain: thumb
   reach, one-hand use. Loss: in the Open envelope concept the "+" stamp is small (56 x 68 pt, above
   the 44 pt floor). Pick: keep.

7. **No tab bar.** The brief names one job. A tab bar here would hold one tab. The house token says
   phones use a bottom tab bar for navigation; this screen is one section of an app whose other
   sections I cannot see. Gain: no empty chrome. Loss: the frame does not show how this screen sits
   among the app's sections. Pick: none drawn; the builder places it in the app's own tab bar.

8. **Photo viewer.** Full screen, black. Done leading, a count in the middle, Delete trailing. Zoom by
   double-tap, by the zoom-in and zoom-out buttons, or by the zoom figure (it resets to 1x). Drag pans
   when zoomed. Prev and next buttons page through. Unfolded, the viewer fills one page only. Gain:
   zoom works with one thumb and with no pinch. Loss: no pinch in the mockup; the built app adds the
   system pinch. Pick: keep.

9. **Delete with Undo, no dialog.** Delete removes the photo at once. A bar at the photo's place says
   "Photo deleted." with Undo. It stays until the next press. No native or custom confirm dialog.
   Gain: one press, and safe. Loss: Undo goes away after the next press. Pick: keep.

10. **Match to an order.** A sheet with Cancel and Done. Orders that list the same card names come
    first, ranked once when the sheet opens. Names that are on the envelope are underlined, with a
    count such as "4 of 5 names on this envelope". Done stays off until an order is picked. After
    Done, the envelope leaves the pile, the next envelope takes its place, and a "Matched to <seller>"
    bar with Undo shows at that place. Gain: the card names the person typed do the finding. Loss:
    the ranking assumes the app can read orders' card names. Pick: keep. Owner grant: yes, because it
    sets what "match" writes and that the order list is ranked.

11. **Note saves as you type.** No Save button. The text stays when the person leaves the envelope
    and comes back. Gain: nothing to lose. Loss: no "saved" cue. Pick: keep.

12. **Cards inside: one row per card, free text.** Two copies show as two rows. Each row has a remove
    control. A field and an Add button add one name; Return adds too. Gain: matches how a person
    counts cards out of an envelope. Loss: a long list of copies; a quantity stepper would be shorter.
    Pick: rows. A stepper is the alternative.

13. **Unfolded layouts.** Shoebox: list on the left page, the chosen envelope on the right page, with
    the chosen row tinted. Open envelope: outside left, inside right, the rail on the left page, the
    Match button pinned on the right page. The camera, the viewer and the match sheet each take one
    page. Nothing crosses x 455.5 to 495.5; a scripted check of each page's box passed. Gain: no
    content in the hinge. Loss: none seen. Pick: keep.

14. **Large phone size.** Neither the brief, the repo's device list (`layout.py devices` printed
    `unknown`) nor the Apple pages I read give a size. I drew it at 440 x 956 pt and printed
    "unmeasured" on its caption. `pw` and `ph` in the hash redraw it at a given size. Gain: the owner
    sees a tall one-hand phone. Loss: the size is not from a source. Pick: keep until the owner names
    a size.

15. **AX5 (largest accessibility text) on the folded Duo.** Rows restack with the photo above the
    text. The navigation title wraps under the back button. The flip switch stacks its two parts. Each
    screen scrolls as one column. The list's main button and the stamp rail stay pinned; an envelope
    page's Match button follows its content. The rail's summary line moves into the accessible name.
    Gain: no clipped text. Loss: at AX5 Match is not in thumb reach until scrolled. Pick: keep.

16. **States.** Loading: skeleton rows (or a skeleton photo and stamps) at the loaded size. Empty: one
    sentence and "Photograph an envelope". Read failed: one sentence, Try again, and a closed "What
    the device said" disclosure. Camera off: one sentence, "Turn on in Settings", and "Choose from
    Photos". None shows as empty or zero. Pick: keep.

17. **Colour and type.** System font for all chrome. Postal-ink blue accent on cool grey paper, with a
    light and a dark set named by role. Photos are drawn SVG envelopes on a desk, so a glance reads
    "envelope" without a real image. Corner radius 8 pt; spacing on the 4 pt step. Pick: keep.

18. **Haptics.** The built app should give a light haptic on the shutter, on Delete, on a zoom step and
    on Match Done (house rule ux-haptics-feel-substantial). A mockup cannot show it. Pick: keep.

19. **Status bar and home indicator.** Drawn at 32 pt and 20 pt as plain drawing choices, through
    `env(safe-area-inset-*)` with those values as the floor. No source gives the Duo's insets.
    Unmeasured.

20. **Not drawn: discard an envelope.** The brief asks to delete photos, not envelopes. An envelope
    made by mistake stays until it is matched. Gain: no destructive control on the page. Loss: no way
    to remove junk mail. Pick: ask the owner.

21. **Search in the match sheet.** A field above the orders filters by seller or card name as the
    person types. A search with no hit shows one sentence and "Clear search". Gain: works when the
    order list is long. Loss: one more control in the sheet. Pick: keep.

22. **Arrival date under each stamp.** Each stamp in the rail carries its date in caption size, so two
    hollow stamps can be told apart. Hidden at AX5, where the stamp's accessible name still says it.
    Gain: recognition, not recall. Loss: a little height. Pick: keep.

23. **"Today:" and "New:" labels.** A blind designer cannot see today's screen. Each concept carries
    one dashed "New: the whole screen" label and no "Today:" label.
