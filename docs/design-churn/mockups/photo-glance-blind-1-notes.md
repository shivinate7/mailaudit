# Photo glance, blind designer 1: notes

Designer kind: blind. The mockup is `photo-glance-blind-1.html` in this folder. It opens from disk, with no
server and no network.

The job: look at one envelope photo large enough to read the writing, step to the next one, and know
whose envelope it is and which cards came in it. Each photo belongs to one envelope. An envelope has a
day, a sender name (sometimes unknown) and a list of cards.

Each option has a Hide button in the mockup controls. Option names are Strip and Card file. Focus ids
for the waiting page are `concept-strip` and `concept-file`.

## Deep links

Combine keys with `&`. `c` = `strip` or `file`. `s` = `loaded`, `unknown`, `photofail`, `loading`,
`failed`, `empty`. `t` = `light` or `dark` (no `t` follows the system). `d` = `folded`, `open`, `phone`,
`ax5` (no `d` shows all four frames). `l=0` hides the New labels. `h=strip` or `h=file` hides an option.
For example, `#c=file&s=unknown&t=dark&d=open`.

## Choices

1. **Strip option.** The first screen is the newest photo, full width, with the sender's name under it.
   Swipe the photo or press Previous and Next to step one photo at a time, across envelopes and days. A
   row of thumbnails for that day sits above the step buttons, grouped by envelope.
   Gain: the most direct answer to "see the photo and know whose it is". It needs no learning.
   Loss: it is the shape every photo viewer has. Envelopes with two photos take two steps. The card list
   sits under the fold on the folded pose, so the name line also says how many cards there are.
   Pick: keep it as the safe option.

2. **Card file option (the bold one).** Each day is a box of manila dividers, one per envelope, with the
   sender's name on a staggered tab, like a real card file. One divider stands open with its photo and a
   one-line card summary. The two tabs before and after it stay in sight above and below. Tap a tab to
   open that envelope, or press Previous and Next. A second photo of the same envelope is a pager inside
   the divider, so a step is always one envelope.
   Gain: the sender's name is the thing you navigate by. You see the neighbours, so you know where you
   are in the day. One step equals one envelope, which matches how the mail arrives.
   Loss: the photo is smaller than in Strip on the folded pose. The metaphor costs a moment to learn. Long
   names truncate on the closed tabs on the folded pose; the open divider always shows the full name.
   Pick: my pick. It answers "whose is it" with structure, not just a caption.

3. **Duo open pose is its own layout in each option.** Strip: photo on the left page with the step
   buttons, and the envelope slip, full card list and a grid of that day's photos on the right page.
   Card file: every tab of the day on the left page, with the open one pulled out to the hinge, and the
   open divider on the right page. Nothing sits across the hinge: a check walks every element of the open
   frame in each state and each overlay. Overlays (zoom, day sheet, cards sheet, day menu) open inside
   one page.
   Gain: two different uses of the spread. Loss: each option has two layouts to build and screenshot.
   Pick: both.

4. **Zoom.** Tap the photo to open a black zoom view at 2.6 times, starting on the sender's corner of the
   envelope. Drag to move around. The sender's name stays in the zoom view's top bar, so the answer never
   leaves the screen. Fit and Done sit at the trailing edge.
   Gain: the writing is readable. Loss: one more layer. Pick: keep.

5. **Unknown sender.** The name line reads "Unknown sender" with a question mark, in a warning colour,
   and one line says no sender name is recorded. The cards still show. On a Card file tab it shows in
   italics.
   Gain: unknown never looks like empty or like a missing load (house rule `ux-unknown-is-not-empty`).
   Loss: the warning colour draws the eye to envelopes with no name, which are not errors. Pick: keep;
   with no name, the photo is the only clue, so the eye should go there.

6. **One photo fails to load.** Only the photo area says "This photo could not load", with Try again.
   The sender and cards still show. Its thumbnail shows a "!" mark.
   Gain: a failed image is not a failed envelope. Loss: the photo area holds text, not a picture, so a
   quick swipe can pass it without noticing. Pick: keep.

7. **States: loading, read failed, no photos.** Loading keeps skeleton blocks and says "Loading photos."
   Read failed says "The photos could not load." with Try again, and the server's text sits in a closed
   "What the server said" disclosure. No photos is one sentence and one control. Failed and empty sit low
   on the screen, so the control is in thumb reach. The day picker is absent in these states, since it
   would change nothing.
   Gain: no state reads as empty or done when it is not (house rule `ux-unknown-is-not-empty`). Loss: the
   message sits low, far from where the eye lands first. Pick: keep.

8. **"Add a photo" in the empty state.** A blind designer cannot know whether the product can add a
   photo here. The control shows a sample toast, "this would open the camera".
   Gain: the empty state leads somewhere. Loss: it may promise an action the product lacks. Pick: keep if
   the action exists; else the sentence names where photos are added, with a control that goes there.
   Owner grant: yes. It assumes an add-photo action exists on this screen.

9. **Step controls in the thumb zone.** Previous and Next sit at the foot of the folded and phone frames,
   48 pt tall, Next filled. Previous is dimmed on the newest item; in the mockup its reason is a hover title only, so the builder
   must also give it to VoiceOver (house rule `ux-control-earns-place`).
   The count ("3 of 7", "Envelope 3 of 5") keeps a fixed width so a press moves nothing.
   Gain: one-hand use. Loss: the bar takes 64 pt of a short screen from the photo. Pick: keep. A light haptic on each step is suggested (house rule
   `ux-haptics-feel-substantial`); the builder decides.

10. **Largest text size (AX5).** Type uses the AX5 row of Apple's table. Strip: the photo gets shorter
    (16:9), the day thumbnails go, and the step buttons become 96 pt chevrons with spoken labels, so the
    name still shows under the photo. Card file: the tab before the open one hides and only the next tab
    stays, tabs wrap instead of truncating, and the file scrolls.
    Gain: the name is readable at 58 pt. Loss: the card list needs a scroll. Pick: keep.

11. **Day navigation.** Strip: a "Thu 19 Nov" button with a calendar icon opens a sheet of days (Cancel on
    the leading edge, per the sheets page). Card file: a day menu under the title, and a dashed "Wed 18 Nov"
    tab at the end of each day's file opens the next day.
    Gain: a jump to an older day takes two taps, not many swipes. Loss: two different controls for the same
    job across the options. Pick: keep both, one per option.

12. **Colour and type.** Colour roles are my own: a cool grey-green surface, a postal blue accent and a
    manila tab colour, in a light and a dark set. App chrome uses the system font. The envelope art uses a
    handwriting font, as content. Spacing is on the 4 px step, and each gap sits on the parent (house rule
    `ux-gap-on-parent`). Radius is 8 px (house token); sheets and the day menu use 12 px, and the depth lines
    of the card file use 1 px, as drawn shapes. Line heights are Apple's leading values (Body 17/22); the
    critique's "tight line height" warning is that, not a defect.
    Gain: manila ties the Card file to paper mail; postal blue reads as an action colour in both themes.
    Loss: manila is close to the warning amber in dark mode. Pick: keep, and check the pair on a device.

13. **Sample data.** All sellers, cards and days are made up. The envelope art shows a sender name only, no
    street address. Thu 19 Nov 2026 is a Thursday.
    Gain: no personal datum on the page. Loss: real envelopes are messier than the drawings, so legibility
    of real writing at the drawn sizes is unmeasured. Pick: keep.

## Sizes and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge at x 455.5 to 495.5 come from the brief.
  `layout.py devices` printed `unknown` for this repo, and the house device list has no written size.
- The large phone is drawn at 402 x 874 pt. This is a placeholder: the brief gives no size and no page I
  read gives one. Which size should it be?
- The status bar (32 pt) and home indicator (20 pt) heights are placeholders. No page I read gives them.
- Apple pages read 2026-11-21, each answered 200 through the `tutorials/data` JSON path:
  - layout: respect safe areas; lay out by size class, not device.
  - typography: Dynamic Type table, Large (default) and AX5 rows; body 17 pt.
  - accessibility: default text 17 pt, minimum 11 pt; text enlargement to at least 200 percent.
  - buttons: hit region at least 44 x 44 pt; a press state on custom buttons.
  - sheets: Cancel on the leading edge, Done on the trailing edge.
  - tab-bars and toolbars: read; no tab bar is drawn, because the brief names no sections.

## Input needed

- Owner grant: yes. Item 8, the "Add a photo" control.
- The large phone's size, in points.
- Critique questions: should a seller's name be searchable from this screen? Should a step in Strip move by
  envelope instead of by photo? Is one card-summary line on the folded Card file enough, or must the full
  list show without a tap?
