# Tracking checker, blind designer 2: notes

Designer kind: blind. Mockup: `tracking-checker-blind-2.html`, in this folder. Every figure in it is a sample.
I read only the brief, the house files `principles.md`, `layout.md` and `tokens.md`, the glossary, and the Apple
pages listed at the end. I read no screen, spec, token file or mockup of this repo. The job, as I read it:
show the carrier's word and a plain verdict for each tracked order. Warn early when one is stuck. Above all, catch
"it says delivered and it isn't here" on the same day.

Deep links: `#c=watchlist`, `#c=doorstep`, `#c=runway`. Add `&s=loading|failed|allwell|empty`, `&t=light|dark`,
and `&d=a1` to open one package in every frame. `&hide=doorstep` hides one concept. The page also has a Hide button
for each concept. Each concept draws the Duo folded, the Duo open, the large phone, and the Duo folded at AX5.

## Concepts

1. **Watchlist.** The first screen is one list, grouped by verdict, most urgent first. A ring on each row shows
   the days left to claim. Tap a row and the package screen pushes in. When open, the list is on the left page and
   the package is on the right.
   Gain: the most familiar shape. Every package is one scroll away, and the open pose reads like Mail.
   Loss: "Delivered, not here" is only the top row. A person who opens the app and scrolls past it can miss it.
   Pick: keep. It is the safe baseline.

2. **Doorstep.** The first screen asks one question at a time, in the thumb zone: "UPS says it was delivered
   yesterday, 2:14 pm. Is it here?", with two big answers. Stuck and returned packages get their own questions.
   The answer shows inside the card, and Next moves on. When the questions run out, the screen says "All is well."
   The full list is behind "See all tracked", in a sheet. When open, the left page asks and the right page shows
   the answers given today, each with Undo, and everything else.
   Gain: the job's sentence, "I want to know today", becomes the first screen. Nothing urgent can be scrolled past.
   Loss: browsing all packages takes one more tap. A day with many questions is slower than a scan of a list.
   Pick: my lead pick for the job as written.

3. **Runway (the bold concept).** There is no list. Each package is a pill on a vertical ruler of days left to
   claim. The nearest deadline is at the bottom, by the thumb, inside a tinted "under 7 days" band. Pills too close
   to fit move up, and a line ties each one back to its true day. Tap a pill and its card opens in place, over the
   ruler, so nothing else moves. Packages with no date (no scan yet, in hand) sit on a shelf above the ruler. When
   open, the ruler is on the left page and the package is on the right.
   Gain: the claim deadline, which the job says the person is racing, is the layout itself. Distance from the
   bottom is urgency. No tracking app I know is built this way.
   A one-line key above the ruler names each shape once. A package marked here keeps its place until its card
   closes, so "Marked here" and "Not here after all" stay at the press.
   Loss: the verdict reads from colour and shape, through the key, not from a section header. A long seller name
   truncates on a pill. At AX5 the ruler cannot hold its pills (item 16).
   Pick: keep, for the owner to judge. It works best beside Doorstep's question card. A hybrid is possible: the
   question card on top, with the ruler below.

## Choices that hold in every concept

4. **Six verdicts, not four.** The brief names four: on its way, delivered, stuck, returned. I split "delivered"
   into **Delivered, not here** (the carrier says delivered, the person has not marked it) and **In hand**. I also
   added **No scan yet**, so a label with no scan never reads as "on its way" (house rule ux-unknown-is-not-empty).
   Gain: the job's main worry has its own verdict. Loss: six words to learn. Pick: six. **Owner grant: yes.**

5. **"Not here" needs a received mark.** The brief's data shape is carrier, number, latest status and time. To
   know "it isn't here", the tool must also know whether the person checked the package in. I assumed a per-order
   "marked here" flag exists or can be added. "It's here" sets it, and "Not here after all" clears it.
   Gain: the job's sentence works. Loss: it needs a field the brief does not list. **Owner grant: yes.**

6. **Stuck means no new scan for 4 days.** This is my choice, held in one constant in the mockup.
   Gain: an early warning, well before any claim window. Loss: slow ground services may trip it. **Owner grant: yes.**

7. **Claim windows are sample figures.** Each package shows "N of M days left to claim" and the closing date.
   Real windows depend on each carrier's rules and on the order. The package screen says so in a fine line.
   **Owner grant: yes**: where the real windows come from.

8. **Fixed order.** Groups go from most urgent to least: Delivered, not here; Stuck; Returned; On its way; No scan
   yet; In hand. Within a group, the fewest days left to claim come first. A marked package leaves its group, and
   the next row takes its slot (ux-order-holds-still). Doorstep fixes today's questions when the screen opens, so an
   answer never reorders them.

9. **Each label shows once per screen.** A verdict word is a group header, and each row shows it by shape and
   colour only: arrow (on its way), house with a mark (delivered, not here), pause bars (stuck), U-turn (returned),
   dashed ring (no scan yet), tick (in hand). "Days left to claim" is one column header, and the rows show a ring
   and a number. In the open pose, the package page names the seller, not the verdict, because the list beside it
   already names it (ux-label-once).

10. **Machine text is behind a disclosure.** The carrier's raw status and the tracking number sit under "What UPS
    said", with Copy number. The visible text is a plain sentence (ux-machine-text-hidden). Loss: the number is one
    tap away. Pick: keep it behind the disclosure.

11. **States.** Loading shows "Checking carriers, 3 of 7" with Stop (ux-long-run-stops), and grey rows that keep
    the loaded size. If the whole check fails, a banner gives the time of the last good answer, with Try again. If
    one carrier fails, that row gets its own line. Empty is one sentence with one control. "All is well." shows
    alone when nothing needs the person (ux-all-is-well). Every state has a deep link.

12. **Empty state: "Add a tracking number".** The empty state needs one control that fills it. I drew a sheet
    with Cancel and Add (HIG sheets), and what is typed survives Cancel (ux-keep-what-was-made).
    Loss: I do not know how numbers reach the tool today. If they come only from imports, this control should
    lead there instead. **Owner grant: yes.**

13. **Acts and answers.** On every package: "It's here" and "Check again". On a package in hand: "Not here after
    all". The answer shows under the button that was pressed, such as "Checked at 9:41 am. No change."
    (ux-answer-at-press). The buttons sit in the thumb zone, above the tab bar. Haptics: a light haptic on
    "It's here" and on a Doorstep answer (ux-haptics-feel-substantial). The design reviewer checks it on a phone.

14. **Way in: a Tracking tab.** I cannot see the tool's other tabs, so the tab bar shows a dashed
    "Today: the tool's other tabs" placeholder beside a new Tracking tab. Loss: the real tab bar may have no room.
    Departs from: unknown, because I may not read the current screen.

15. **Open pose.** Each concept has its own two-page layout. Nothing crosses x 455.5 to 495.5: a script measured
    every element in the open frames, and none crossed. The tab bar sits on the left page only.

16. **Biggest text (AX5).** Sizes are from the HIG's AX5 table (body 53 pt, large title 60 pt). Watchlist rows
    stack, with the name on its own line. Doorstep buttons stack full width. Runway falls back to day bands
    ("Closes within 7 days", "8 to 21 days", "Later") as rows, because a ruler of 53 pt pills is unreadable
    (`ViewThatFits` in SwiftUI). The status bar does not scale.

17. **Large phone size.** The device list gives no size for any device, and the brief gives none for the large
    phone. The HIG layout page I read on 2026-11-21 holds no device size table. I drew it at 440 x 956 pt, a figure
    from my memory that no page I read confirms. The layout is fluid, so a different size changes only how much
    shows. **Input needed:** the real size.

18. **Safe areas.** Frames pad with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. No page I read
    gives a Duo status bar or home indicator height, so the drawn bars (44 and 20 pt) are placeholders.

19. **Colour and type.** House tokens give the 4 pt step and the 8 pt radius, but no colours. I chose a cool
    paper surface and a blue-violet ink accent. Each verdict has a role colour: moving, alarm, stuck, returned,
    none, done, each in a light and a dark set. Glyphs carry shape too, for colour blindness and forced colours.
    Type is the system font at the Dynamic Type sizes, with tabular figures for days.

20. **Early warning outside the app (not drawn).** The job says "warned early". I drew warnings in the app only.
    A notification at the moment a package turns stuck or delivered-not-here would reach the person sooner.
    **Owner grant: yes**: whether the tool may notify.

## Apple pages read 2026-11-21 (each answered 200, through `tutorials/data/...json`)

- Layout: safe areas, size classes. It has no device size table (item 17).
- Typography: the iOS Dynamic Type tables at Large (default) and AX5. All type sizes come from these tables.
- Accessibility: the default control size, 44x44 pt.
- Buttons: a hit region of at least 44x44 pt.
- Sheets: Cancel dismisses a sheet.
- Tab bars: on iOS, a tab bar floats above content at the bottom of the screen.
- Toolbars: use a large title.
- Lists and tables: fetched, but I used nothing from it beyond the plain list rows.
