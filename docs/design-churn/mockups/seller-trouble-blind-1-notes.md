# Seller trouble: blind designer 1

Designer kind: blind. Mockup: `seller-trouble-blind-1.html`. The job: "Who keeps burning me?"
Every seller, order and figure in the mockup is sample data.

This designer saw no current screen, spec, token file or other mockup. It cannot know what the
product shows today, so the mockup draws no "Today:" label. Each new part has a dashed "New:"
label, which the "Show New labels" box turns off.

## Options and how to open each

| Option | Focus id | Deep link |
|---|---|---|
| Strike strip | `strike-choice` | `#c=strike` |
| Burn map | `map-choice` | `#c=map` |

Other hash keys: `s=loaded|calm|early|empty|loading|failed`, `t=light|dark`,
`d=folded|ax5|open|phone`, `ax=5`, `v=detail|complaint|stopped|complaints|list`.
Examples: `#c=strike&v=detail&t=dark`, `#c=map&s=early`, `#c=map&ax=5`.
The "Hide Strike strip" and "Hide Burn map" buttons each remove one option.

## Design choices

1. **Strike strip (option).** A ranked list of sellers. Each row has one tile per order, and the
   tile's shape gives the kind of trouble: striped is slow, half full is short, a cross is lost, a
   ring is a wrong card, solid is fine, dashed is still in the mail. Tabs: Sellers, Stopped,
   Complaints. On the open Duo, the list is on the left page and the seller is on the right page.
   Gain: one glance down the rows shows who fails often and how. A pattern ("always slow") shows
   without a number. Loss: a familiar list structure, so it is the less bold option. Pick: keep as
   the safe option.
2. **Burn map (bold option).** No list first and no tabs. Each seller is a dot: across is the
   typical days to arrive, up is the share of cards that never came right. The person drags their
   own "slow" line, and the region past it is shaded as "Burning you". A small corner box holds the
   fine sellers. Tapping a dot opens the seller in a sheet (folded) or on the right page (open).
   Gain: it separates the two ways a seller burns you (slow against lossy) and lets the person set
   what slow means to them. Loss: a plot needs a key and is harder at the largest text size; it
   can't show more than a few dozen sellers before dots overlap. Pick: offer it; a List switch
   gives the same ranking as text.
3. **Rank by cards with trouble.** A card counts once if its order was lost or slow, or if it was
   missing or wrong. Gain: matches the brief's "late or lost" count and puts a seller who is slow
   every time near the top. Loss: a slow card weighs the same as a lost card, though only the lost
   one costs money. Other choice: rank by cards that never came right, then by slow orders.
   Pick: cards with trouble. Owner grant: yes (sets which seller shows first).
4. **"Lost" after 30 days with no arrival.** An order with no arrival in 30 days counts as lost;
   before that it is "still in the mail", shown as unknown, never as fine. Gain: a new order never
   makes a seller look bad or clean too early. Loss: 30 is this designer's pick, not a measured
   figure. Pick: 30 days, to be set by the owner. Owner grant: yes (a new rule that judges orders).
5. **Slow means over 10 days.** Strike strip uses a fixed 10 days; Burn map lets the person drag
   it from 5 to 30. Gain: the map answers "who burns me by my standard". Loss: a saved setting, and
   the two options then disagree on slow. Pick: 10 days default; the map's line is saved per
   person. Owner grant: yes (adds a saved setting).
6. **Wrong cards have no field.** The brief names wrong cards as a trouble kind, but its data
   gives only cards ordered, received, late or lost, and days. The mockup assumes a count of wrong
   cards per order and draws it under "New:" labels (the ring tile and "Never came right").
   Gain: covers the whole job. Loss: needs a new field the person must enter or the import must
   give. Pick: draw it and ask. Owner grant: yes (adds a data field).
7. **Stop buying.** One press marks a seller as stopped. The answer shows at the press ("You
   stopped buying from them on 21 Nov.") and the button becomes "Start buying again". Stopped
   sellers stay in the ranking with a stopped mark, so the order holds still. No dialog asks first,
   since the act undoes in one press. Gain: fast, safe. Loss: adds a saved stop list. Pick: as
   drawn. Owner grant: yes (adds saved data).
8. **Draft complaint.** A sheet with the trouble orders pre-ticked and a message built from them.
   Close (leading) keeps what was typed; Done (trailing) saves it to Complaints. "Copy message"
   copies it. The sheet says the app does not send it, which is true of this mockup. Gain: the
   complaint carries dates and counts the person would otherwise look up. Loss: adds saved drafts;
   no send. Pick: as drawn. Owner grant: yes (adds saved data).
9. **Filters are the key (Strike strip).** The kind chips (Lost, Short, Wrong, Slow) show the tile
   beside each word, so the filter row doubles as the legend and each kind word shows once. A chip
   shows only when some seller has that kind. A filter that empties the list keeps the chips and
   offers "Show all sellers". Pick: as drawn.
10. **States.** Loading shows progress and Stop. Failed says no seller is judged yet, offers Try
    again, and hides the raw reason behind "What the app said". Empty has one sentence and Import
    orders, with no filters. "Still in the mail" (every order unarrived) says "Too early to tell"
    and lists who it waits on. "All is well" shows those words and nothing else in the summary.
11. **Largest text (AX5).** Its own frame on the folded Duo. Rows stack, figures go to one
    column, actions move from the bottom bar into the page, and the plot drops its in-plot words
    (the axis words and the list below carry them). The tab bar keeps its size, as the system tab
    bar does. Loss: at AX5 the first screen is mostly the summary sentence.
12. **Thumb zone.** On the folded Duo and phone, Stop buying and Draft complaint sit in a bar just
    above the tab bar; in Burn map they sit near the top of the bottom sheet, which is itself in
    thumb reach.
13. **Search by seller name.** A search field under the Sellers title (Strike strip) and in List
    mode and the open right page (Burn map). It answers "did this one seller burn me?" when there
    are many sellers. No match shows one sentence and "Clear search". Pick: as drawn.
14. **Seller detail figures.** The verdict line carries the orders ("Burned you on 4 of 7
    orders") and the typical wait. Below it, "Late or lost" and "Never came right" lead in large
    type; "Cards ordered" and "Received" sit smaller beneath. Gain: the trouble reads first.
    Loss: the volume figures are quieter. Pick: as drawn.
15. **Haptics.** The Burn map's slow line gives a light haptic at each one-day step, so the drag
    feels counted. Stop buying gives one light haptic at the press.
16. **Open Duo, Burn map.** The map is on the left page and the list ("Worst first") is on the
    right page, so the open pose drops the Map/List switch, which would change nothing there.
17. **Colour and type.** System font only, sizes from Apple's Dynamic Type table (Large default and
    AX5). Colours are this designer's own, by role, with a light and a dark set: a cool grey-green
    surface, an ink blue for actions, and one hue per trouble kind. Shape repeats each hue, so no
    kind depends on colour alone. Spacing is on the 4 px step; corner radius 8 px.

## Sizes and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge gap at x 455.5 to 495.5 come from
  the brief. `layout.py devices` printed `unknown` for this repo.
- Large phone: no size is written in the brief or the device list, and Apple's layout page no
  longer carries a device table (its change log: "September 9, 2026, Updated guidance"). It is
  drawn at the brief's folded size, 466 x 678, and the frame can be resized by its corner.
- Status bar and home indicator heights are unmeasured stand-ins (`--sim-top` 32 Duo, 54 phone;
  `--sim-bottom` 20 Duo, 24 phone), each behind `env(safe-area-inset-*)`.
- Hinge proof: a headless check of every element in the open frame, for all six states and the
  detail, complaint, stopped, complaints and list views, in light and dark, found 0 that cross
  the gap. The same run found no screen body wider than its frame.
- Label check: `label_once.py` on single-frame captures (Strike strip list, detail, stopped and
  open; Burn map map, list, open and open detail) prints nothing.
- Apple pages read 2026-11-21, each answered 200: layout (safe areas, size classes), typography
  (Dynamic Type sizes, Large and AX5), accessibility (44 x 44 pt default control), buttons, sheets
  (Cancel or Close leading, Done trailing; grabber; medium detent), tab bars (floats above
  content; labels under icons), toolbars (large title), lists and tables.

## Critique (impeccable, run on this mockup)

Run single-context: this agent has no sub-agent tool. Detector: 3 cramped-padding warnings on
the viewer's segmented controls (fixed) and 1 striped-gradient advisory on the slow tile (kept:
the stripes are the slow shape, not decoration). Review findings, all fixed: the map said
"Burning you" twice on one screen; the map had no colour key; "All is well" carried an extra
sentence and sat beside sellers still in the mail; no search by seller name; six equal figures
flattened the seller detail; the open map's back button named a page that did not exist; the
word "stopped" repeated in rows (now an icon with a spoken label). Known limit: in a forced-colors
browser the slow, short and lost tiles lose their fills and look alike; the product is iOS, so
this is the mockup's floor only.
