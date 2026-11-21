# Cost basis, blind 2: notes

Designer kind: blind. Designer: cost-basis-blind-2. Mockup: `cost-basis-blind-2.html`.
I saw no current screen, code, spec or token file. All colour, type and spacing come from the
house `tokens.md` (4 px step, 8 px radius, colour by role, system font) or are my own choice.
Every figure, card name and seller is sample data.

Deep links (append to the file URL): `#t=dark`, `#t=light`, `#s=loading`, `#s=empty`,
`#s=failed`, `#s=unknown` (lines with no price), `#s=filtered` (a filter that empties the list),
`#c=card-list` or `#c=split-ledger` (one concept only), `#v=sellers` or `#v=statement` (Card list
tab), `#sel=<n>` (open card n), `#sheet=1` (Split ledger, "Close the year"), `#f=out|ref|late`
(a filter). They combine with `&`.

Apple pages read 2026-11-21 (each answered): typography (Dynamic Type table, default and AX5),
layout (safe areas, size classes), accessibility (44x44 pt default control, 17 pt default text,
contrast 4.5:1), tab bars (floats at the bottom, single-word labels, five or fewer tabs), sheets
(Cancel leading, Done or the act trailing, grabber on a resizable sheet). Every type size is a
Dynamic Type style from that table.

Sizes. `layout.py devices` prints `unknown` for this repo, so I drew at the brief's sizes: Duo
folded 466 x 678 pt, Duo open 951 x 669 pt with the hinge at x 455.5 to 495.5. The brief gives no
size for the large phone; I drew it at 440 x 956 pt as a stand-in. The status bar (28 pt) and
home indicator (20 pt) insets are stand-ins too: no source I read gives them.

## Concepts

1. **Card list** (`#concept-card-list`). Tab bar: Cards, Sellers, Statement. The first screen
   holds three figures: Arrived, Still out, Refunded. Each figure is also the filter for the list
   under it, so the answer and the way in are one control. A row shows the card's pooled
   arrived/still-out/refunded split as a bar, "n of m", and the figure the filter asked for. A card
   opens its lines grouped by status, pooled across sellers, with the cost per arrived copy on top.
   Open pose: list on the left page, the card on the right.
   Gain: familiar iOS structure, fast to learn, the year-end statement has its own tab.
   Loss: the still-out figure per card shows only under the Still out filter or in the card.
   Pick: keep as the safe concept.
2. **Split ledger** (`#concept-split-ledger`), the bold one. One screen, no tab bar. Each card is a
   line of a T account: paid for arrived copies left of a spine, paid for copies still out right of
   it. In the open pose the hinge is the spine: the left page holds what arrived, the right page
   what is still out, and the two pages scroll together row for row. Nothing sits across the hinge.
   A tap opens the line in place, with arrived lines on the left and still-out and refunded lines
   on the right. The column heads sort. "Close the year" opens the statement as a sheet.
   Gain: both halves of the question ("what did I pay for what I got", "what never came") read on
   one line, and the Duo's hinge carries meaning. Loss: folded, each line is three text lines
   high, so about six cards show per screen; at AX5 the T cannot hold and each line stacks.
   Pick: this one. Owner grant: yes (it drops the house bottom tab bar; see item 9).

## Design choices

3. **Shipping split into each card's cost.** Each order's shipping is shared by its copies and
   added to their cost. Gain: the cost basis is what was really paid. Loss: the split is an
   estimate when an order mixes cheap and dear cards. Pick: split, with a switch on the statement
   to leave it out. Owner grant: yes (a cost rule).
4. **Refunds leave the cost.** A refunded line counts in neither Arrived nor Still out; it shows
   struck through, with its amount under Refunded. Gain: Arrived is only money for cards in hand.
   Loss: a part refund is not drawn. Pick: as drawn. Owner grant: yes (a cost rule).
5. **Late at 21 days.** A copy still out after 21 days is marked late (a filled dark-red dot).
   Gain: lost mail stands out. Loss: 21 is my guess. Pick: 21, owner to set. Owner grant: yes.
6. **Colour roles.** Ink blue = paid and arrived, red ink = paid and still out, violet = refunded,
   on a grey-green ledger paper. Shape backs colour: a filled dot is arrived, a ring is still out,
   a filled dark-red dot is late, hatching in the bar is refunded.
7. **Lines with no price** (`#s=unknown`). Figures leave them out and say so with a count and a
   "Show those cards" control. A row shows "price unknown", never $0.00.
8. **States.** Loading shows progress in lines read and a Stop control. Empty shows one sentence
   and "Import orders". Failed says no figure is known and offers "Try again", with the raw text
   behind "What the app said". A filter that empties the list keeps the filter and offers "Clear
   search and filter".
9. **No tab bar in Split ledger.** The house rule puts phone navigation in a bottom tab bar. Split
   ledger has one screen and one sheet, so there is nothing for tabs to switch between. Gain: the
   bottom bar holds search and the main act in thumb reach. Loss: departs from a house default.
   Owner grant: yes.
10. **Year scope.** The main screens pool all imported orders; only the statement picks a year.
    Gain: nothing hides. Loss: the main figures and the statement total differ. Pick: as drawn;
    a year control on the main screen is the other option. Owner grant: yes.
11. **Statement.** Year, split shipping, list still-out copies, list refunds, CSV or PDF, and a
    preview of the first rows and the totals. The answer to Share shows beside the button
    ("statement ready ... the share sheet opens next"). Card list puts Share in the bottom bar.
12. **AX5.** Rows stack, search moves to the top of the list, the stats stack, and the line under
    the title hides in Card list. The tab labels and status bar keep their size.
13. **Haptics.** The switches and the year and file segments give a selection haptic on change.
    A sort or filter press gives none.
14. **Points, not rem.** Type is in points from the Dynamic Type table, because the screen is
    native iOS; AX5 is drawn as its own frame.

## Critique (impeccable, single context: no sub-agent tool here)

Detector: three "tight line height" hits are Apple's own Dynamic Type leading (22/17): a false
alarm. One "repeating stripes" hit: the hinge was striped (fixed, now solid); the refund hatch in
the bar stays, because it carries meaning without colour.
Findings fixed: Card list rows showed the arrived figure under every filter (now the row shows the
filtered figure); the Split ledger bottom bar clipped "Close the year"; AX5 hid the main act; the
statement's Share sat below the fold (now in the bottom bar); zero cells read $0.00 (now a dash).
Open: Split ledger shows about six cards per folded screen; the sort on the column heads is found
only by tapping.

## Input needed

- Which concept goes forward, or a mix (for example the ledger's T inside the Card list's card).
- The large phone's size, and the Duo's safe-area insets.
- Items 3, 4, 5, 9 and 10.
