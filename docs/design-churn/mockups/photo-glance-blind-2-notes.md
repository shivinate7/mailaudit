# Envelope photo glance: blind designer 2

Designer kind: blind. Designer photo-glance-blind-2. Drawn 2026-11-21.
Mockup: `photo-glance-blind-2.html` beside this file. It opens from disk with no network.

The job, in the person's words: "I just need to see the photo and know whose it is."
Every figure, name, address and photo on the mockup is a sample.

Deep links (append to the file URL):

- `#c=lightbox`, `#c=log`, `#c=dial`: one option. `#c=all` shows all three.
- `s=`: `loaded`, `pair` (two photos of one envelope), `unknown` (sender unknown), `end` (last photo),
  `photofail` (one photo did not load), `loading`, `failed` (could not read photos), `empty`.
- `t=light` or `t=dark`. With no `t`, the system setting decides.
- `d=folded`, `d=open`, `d=phone`, `d=ax5`: one device.
- `sheet=1` opens the cards sheet. `zoom=1` zooms the photo. `loupe=1` turns the loupe on (Sorting dial).
- `labels=off` hides the dashed "New:" part labels.

Example: `photo-glance-blind-2.html#c=dial&s=unknown&t=dark&d=folded&loupe=1`.

Focus ids for the waiting page: `choice-lightbox`, `choice-log`, `choice-dial` (the folded frame of each option).

## Choices

1. **Lightbox (option).** The photo fills the screen. Swipe or press an arrow to step. A plate under
   the thumb shows the sender, the day, which photo of the envelope this is, and a one-line card list.
   A tap on the plate opens a sheet with every card.
   Gain: the biggest photo of the three; the identity needs no tap; one hand does everything.
   Loss: no overview of a day; finding one envelope among 50 means many steps.
   Pick: strong second. Owner grant: yes (a new structure for the screen).

2. **Mail log (option).** The first screen is a list by day. Each row shows the envelope cut down to
   its return address, large enough to read, with the sender and cards under it. A tap opens the photo,
   with Previous and Next in a bottom toolbar and the cards under the photo.
   Gain: the most familiar shape; an overview of each day; the sender's own handwriting is readable
   in the list. Loss: two levels (list, then photo); the photo is smaller than in Lightbox; a crop of an
   envelope with no return address shows paper only.
   Pick: safest option. Owner grant: yes (a new structure for the screen).

3. **Sorting dial (bold option).** A ruler of the mail sits under the thumb: one notch per photo, the
   notches of one envelope grouped in a band, each day cut by a tall line. Drag the ruler or tap a notch;
   it snaps to a notch on release. The sender's name stands over the needle and changes live while the
   ruler moves. Press and hold the photo, or turn on the loupe, to read the writing at 3x without zooming
   the whole photo. No common photo or mail app steps this way.
   Gain: one gesture covers both "next" and "jump to Tuesday"; the band shows how many photos an
   envelope has before you reach it; the loupe keeps the whole envelope in view while you read one line.
   Loss: a new control to learn; the dial needs drag or tap precision; the photo is smaller than in
   Lightbox to make room for the dial.
   Pick: my pick. It answers both halves of the job (see it, know whose) at the place the thumb rests.
   Owner grant: yes (a new structure and a new control).

4. **Identity without a tap.** Every option, in every pose, shows the sender and day without a press.
   Gain: the job's second half ("know whose it is") is met at a glance. Loss: less room for the photo.
   Pick: keep in all options.

5. **Two photos of one envelope.** Stepping from photo 1 to photo 2 of the same envelope changes only
   "Photo 1 of 2" to "Photo 2 of 2"; the sender line holds still. In the open pose, thumbnails of the
   envelope's photos sit under the sender (Lightbox) and dots sit under the photo (Mail log).
   Gain: the person sees at once that it is the same envelope. Loss: none found. Pick: keep.

6. **Reading small writing.** Lightbox and Mail log: double-tap to zoom at the point, drag to pan, and a
   zoom button for one-handed use and for a mouse. Sorting dial: a loupe at 3x, lifted 96 pt above the
   finger so the finger does not hide it. Gain: the zoom is common and known; the loupe keeps context.
   Loss: the loupe needs a hold or a mode switch. Pick: as drawn, one per option, so the owner can compare.

7. **Order.** Newest day first; within a day, in the order the photos were taken. Next goes to the older
   photo. At the last photo, Next turns into "Back to the newest photo" (a circular arrow, and the count
   reads "9 of 9, the last"). Previous on the newest photo is off and says why on hover and on focus.
   Gain: the mail that just arrived is first. Loss: "Next" means older, which may surprise.
   Pick: newest first. Owner grant: yes, if the product already has an order.

8. **Card line on the plate.** A one-line list ("4 cards: Ember Wyrm, Tidecaller Adept ×2, …") instead of
   a count alone. Gain: the person can tell which cards came without a tap. Loss: long lists cut off.
   Pick: keep; the sheet (or the open pose's second page) shows the full list.

9. **Sender unknown.** The name reads "Sender unknown" with a question-mark icon, in its own colour,
   never blank. Its cards still show. Gain: unknown never looks like missing data. Loss: none.
   Pick: keep. A "Name this sender" act is out of scope and not drawn.

10. **Open pose (Duo).** Each option uses the two pages as two jobs, never one layout stretched:
    Lightbox puts the photo on the left page and the envelope page (sender, day, photo thumbnails, cards,
    Previous and Next) on the right. Mail log puts the list on the left and the open envelope on the
    right. Sorting dial puts the photo and loupe on the left and the index card and dial on the right.
    Nothing, sheets and the loupe included, crosses the hinge gap (x 455.5 to 495.5): each lives inside
    its page. Gain: the photo gets a whole page and the full card list shows with no sheet. Loss: the
    photo page is narrower than the folded screen's full width is tall, so a 4:3 photo is no larger than
    folded. Pick: as drawn.

11. **Largest text (AX5).** Text uses the AX5 sizes (Body 53 pt, Title 3 55 pt, Title 1 58 pt, Large
    Title 60 pt). The identity panel may take up to 60 to 64 percent of the height and scrolls inside
    itself; the photo keeps the rest and still zooms. Previous and Next move to their own row in Lightbox.
    The dial drops its band and day labels at AX5, since the index above it already says both.
    Gain: identity stays readable. Loss: the photo is small at AX5. Pick: as drawn.

12. **States.** Loading keeps the loaded size (skeleton photo and text). Could not read: one sentence,
    "Try again", and the raw reply behind "What the server said". No photos yet: one sentence and one
    control, "Photograph an envelope". One photo did not load: the photo area says so with "Try again",
    and the sender, day and cards still show, so the person still knows whose it is.
    Gain: no state looks like another; a failed photo never hides whose envelope it is. Loss: the empty
    control assumes the product can take a photo, which a blind designer cannot know.
    Pick: as drawn; the empty control's words wait on that answer.

13. **Disabled Previous.** On the newest photo, Previous is off. It gives its reason ("This is the newest
    photo") on hover, on keyboard focus, and in its spoken name. Gain: no silent dead control. Loss:
    none. Pick: keep.

14. **No tab bar.** The house rule puts phone sections in a bottom tab bar. This is one screen, and
    a blind designer does not know the product's sections, so no tab bar is drawn. Each option fits
    under a tab bar if the product has one; the bottom plate, toolbar and dial would then sit above it.
    Gain: the full height goes to the photo. Loss: a tab bar would take about one control's height from
    the photo. Pick: no tab bar on this screen.

15. **Haptics.** The dial gives a light haptic at each notch it passes and a firmer one at a day line
    (house rule ux-haptics-feel-substantial). Not drawable in HTML; noted for the builder.
    Gain: the person feels each photo and each day pass without looking down. Loss: none found.
    Pick: keep.

16. **Tokens.** Colour by role, my own values (cool grey surface, a deep blue accent, an amber for
    unknown), with a light and a dark set. Spacing on the 4 pt step, radius 8 pt, system font. The photo
    sits on a dark stage in both themes, so the envelope's paper reads true. No colour, font or spacing
    of any product was used. Gain: the photo's own colours stay honest. Loss: the light theme still has
    a dark photo area, which may feel heavy. Pick: dark stage in both themes.

## Open questions

- Are envelope photos landscape or portrait? A 4:3 landscape photo leaves about 40% of the folded
  Lightbox stage empty. Portrait photos would fill it.
- Can the product take a photo itself? It decides the empty state's control.
- What size is the large phone? It is drawn at the Duo folded size until one is written.

## Sizes and sources

- Duo folded 466 × 678 pt and open 951 × 669 pt with the hinge gap at x 455.5 to 495.5: from the brief.
  `layout.py devices` printed `unknown` for this repo, so the brief's sizes are the only source.
- Large phone: no size is written in the brief or in the device list. It is drawn at 466 × 678 pt, the
  brief's only size, and its frame can be resized by dragging the corner.
- Safe-area insets: the frames use `env(safe-area-inset-*)`, with placeholder fallbacks of 24 pt (top)
  and 20 pt (bottom). No Apple page read gives a Duo inset; these numbers are mine.
- Apple pages read 2026-11-21 (each answered 200), through the `.json` form:
  - Typography (design/human-interface-guidelines/typography): Dynamic Type sizes at Large (default)
    and AX5; Body 17 pt at the default size.
  - Accessibility (…/accessibility): 44 × 44 pt default control size, 28 × 28 pt minimum; 17 pt default
    text, 11 pt minimum; contrast 4.5:1 up to 17 pt.
  - Buttons (…/buttons), Sheets (…/sheets: Cancel or Close on the leading edge), Tab bars (…/tab-bars:
    navigation, not actions), Toolbars (…/toolbars: large title turns standard on scroll), Layout
    (…/layout: safe areas, size classes), Lists and tables (…/lists-and-tables).
- The envelope art uses the device's handwriting font where one exists (content, not chrome).
