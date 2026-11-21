# Find a card: notes for search-everything-blind-2

Designer kind: blind. Mockup: `search-everything-blind-2.html`, in this folder. Drawn 2026-11-21.
Every figure in the mockup is sample data from a seeded generator: 420 orders, about 2,300 card lines,
May to Nov. No figure is real.

The job, from the brief: a person holds a card, or half-remembers a name, and asks "where is it?" They type
part of a name, a seller, a price or a day. The answer is the order, the seller and whether the card arrived.

## How to open a state

Open the file from disk and add a hash. `c` is the concept (`answer` or `map`). `s` is the state: `idle`,
`results`, `one`, `order`, `none`, `loading`, `failed`, `empty`. `t=dark` or `t=light` sets the theme. With no `t`,
the theme follows `prefers-color-scheme`. `h=map` hides a concept. Examples:

- `search-everything-blind-2.html#c=answer&s=results`
- `search-everything-blind-2.html#c=map&s=order&t=dark`

Each state draws 4 frames: Duo folded (466 × 678 pt, first), Duo open (951 × 669 pt, hinge gap 455.5 to
495.5 left empty), large phone, and Duo folded at Dynamic Type AX5.

Waiting-page focus ids: `answer-list` and `order-map`. Each id is on one element in the folded frame.

## Apple pages read

All read 2026-11-21 from `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`.
Each answered 200: layout, typography, accessibility, buttons, sheets, lists-and-tables, tab-bars,
toolbars, search-fields. Every type size comes from the typography page's iOS Dynamic Type table, using the
Large (default) and AX5 rows. The 44 pt targets come from the accessibility and buttons pages. The
search-fields page gives the bottom placement ("Place search at the bottom if there's room") and
search-as-you-type.

## Choices

Blind: I read no current screen, so every part is "New". The mockup marks the part each concept adds with a
dashed "New:" frame, and a checkbox hides those frames. I could not read the spec, so I do not know whether any
item changes it. Each item says `Owner grant: unknown`.

1. **Concept "Answer list".** One search field, a list of matching card lines, and an answer card when only
   one line matches. Gain: the plain, fast route; nothing to learn. Loss: it shows no sense of time or of
   the history as a whole. Pick: keep, as the safe baseline. Owner grant: unknown.
2. **Concept "Order map" (the bold one).** The first screen is the whole history: one dot per card, one band
   per month, each order's dots side by side. A filled dot arrived; a ring did not. Typing lights the
   matches where they sit in time. Tap a month to list it. Slide a finger along a month to read the order
   under it, and lift to open it. Gain: "where is it" becomes a place in time. The screen also shows at a
   glance where unarrived mail clusters (the rings near Nov). Loss: on the folded pose the map takes about
   half the screen, so about 2 result rows show above the field (checked in a screenshot, 2026-11-21). The
   keyboard would cover more. The slide gesture is found only through the hint sentence. Pick: keep as the
   bold option. If the owner picks it, a builder should collapse the map to a short strip while the
   keyboard is up. Owner grant: unknown.
3. **Search field at the bottom, in thumb reach.** Gain: one-hand use (house rule ux-thumb-zone); HIG puts
   search at the bottom when there is room. Loss: the keyboard rises over the lower results. Pick: bottom.
4. **One field reads each word by its kind.** `$0.25` or `.25` is a price. `oct`, `oct 3` or `10/3` is a
   day. Other words must each appear in the card name or the seller. All words must match. Gain: no
   field picker, so the person types what they remember. Loss: a lone number with no month, such as `3`,
   is read as whole dollars ($3.00 to $3.99). That may surprise someone who meant a day. Pick: dollars,
   and the owner may rule. Owner grant: unknown.
5. **Rows: newest first, with an arrival shape.** Each row shows the name, seller, order day and price, with a
   filled dot or a ring. The words "arrived" and "not yet" show once, in the count line above the list
   (house rule ux-label-once). Matched text is highlighted. A price or day that matched turns bold. Gain:
   one scan answers all three questions. Loss: the shape needs the count line to decode it on first use.
   Pick: as drawn.
6. **One match becomes an answer card.** The card gives seller, order day, price and arrival (or "Not yet, N
   days since the order"), with one button: "Open the order". Gain: it answers the job in one look. Loss:
   the list layout changes when the count reaches 1. Pick: answer card.
7. **Order view.** The seller as the title, the order day, the card count and total, one sentence on arrival,
   then every line in the order, with the matched line marked. Gain: it shows what else came in that
   package, which helps when a card is missing. Loss: none found. Pick: as drawn.
8. **Open pose: two pages, each its own layout.** Answer list: the list on the left page, the order on the
   right. Order map: the map and field on the left, the matches or the order on the right, with a
   "Matches" back control. The field never crosses the hinge. Gain: map and list side by side. Pick: as drawn.
9. **Largest text (AX5).** Rows stack: name, then seller and day, then price. Month labels sit above their
   dots. The answer card stacks its labels. Gain: nothing clips. Loss: about 2 rows per screen. Pick: as
   drawn.
10. **States.** Reading shows one sentence and placeholder rows. Read failed says so and has "Try again";
    the raw reason sits under "What the app said". No orders yet hides the field and offers "Import orders".
    No match keeps the field and offers "Clear search". Gain: no state looks like an empty list (house rule
    ux-unknown-is-not-empty). Pick: as drawn.
11. **Recent searches when nothing is typed.** Answer list only. Gain: one tap repeats a lookup. Loss: it
    needs stored history, which may not exist. Pick: show; the owner may cut it. Owner grant: unknown.
12. **Colour and type.** Colours are my own, named by role, with a light set and a dark set. The text is the
    system font at Dynamic Type sizes. Spacing uses the 4 px step and the radius is 8 px, from the house
    tokens. Pick: as drawn.
13. **Large phone at a stand-in size.** No size is written for it, so I drew it at the folded size,
    466 × 678 pt. The frame can be dragged wider or narrower. Pick: stand-in until the owner names a size.
14. **Not drawn:** the keyboard (no page I read gives its height), a tab bar (the brief names no other
    sections), and haptics (no control changes a value).

## Parked: concept "Clue board" (not built; back on the roadmap)

Plan only. The query is a sentence with four blanks at the bottom of the screen: "A card named ___ from ___
ordered ___ for ___". Each blank is its own field. Under the sentence, a line shows how each filled blank
narrows the count. Results sit above the sentence, bottom-anchored, so the best match is nearest the
thumb. When one line remains, its values fill the empty blanks in a different style, and one more
sentence says whether it arrived, with "Open the order". Open pose: the sentence and results on the left
page, the order on the right. At AX5 each blank takes a full line. The gain is a structured query that
turns into the answer. The cost is four fields to tap instead of one.

## Critique (impeccable, 2026-11-21)

Run degraded, in a single context: the coordinator allowed no sub-agents, and I read only the critique
reference. The detector reported 1 finding: cramped padding on the theme switch of the mockup's own
control bar. That bar is not part of the app, and its 44 px buttons centre their text, so I count it as a
false alarm.

- Fixed: each month's match count read like a date ("May 7"). It now has a lit dot before it.
- Fixed: the phone frame now says it is a stand-in size.
- Open: on the Order map folded pose, the map leaves about 2 result rows above the field (item 2). The
  fix is a builder choice: collapse the map while the keyboard is up.
- Open: the slide gesture on a month is hard to find (item 2).
- Open: a lone number reads as dollars (item 4).

## Input needed

- The large phone's size (item 13).
- Whether items 1, 2, 4 and 11 change the spec or a ruling. A blind designer cannot tell.
- Critique questions: should the map shrink while the keyboard is up? Is a lone number a price or a day?
  Is there stored search history to show as recent searches?
