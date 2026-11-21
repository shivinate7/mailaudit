# cost-basis-blind-1: notes

Designer kind: blind. Mockup: `cost-basis-blind-1.html`. Every figure, card name and seller in it
is sample data, made by a seeded generator in the page.

The job, in the person's words: "What did I actually pay for what I actually got?" The page draws
two concepts. Each has its own structure, its own way to move and its own first screen.

## Sizes and sources

- Devices: `layout.py devices` printed `unknown` for this repo. The Duo sizes come from the brief:
  folded 466 x 678 pt, open 951 x 669 pt, hinge gap x 455.5 to x 495.5.
- The large phone has no size in the brief or in any page read. It is drawn at the folded size, in
  a frame that the reviewer can drag to any size. No phone size was typed.
- Status bar and home indicator heights are drawn from the 4 px spacing step. No Apple page read
  gives them.
- Apple pages read 2026-11-21, each answered 200, through the `.json` data path:
  - layout: safe areas, and layout by size class. The open pose is a list beside its detail.
  - typography: the text sizes. Large (default) and AX5 are both drawn from its tables. Body is
    17/22 at the default size and 53/62 at AX5.
  - accessibility: control size 44x44 pt.
  - buttons: hit region 44x44 pt.
  - sheets: Cancel on the leading edge, the confirming act on the trailing edge, and a grabber on a
    resizable sheet.
  - tab-bars: a tab bar is for moving between sections, not for actions, and it floats.
  - toolbars, lists-and-tables, segmented-controls (about five segments at most on iPhone),
    activity-views (use the Share button to open the share sheet).

## Data shape the mockup assumes

An order has a seller, a date, a shipping charge and lines. A line has a card name, a quantity, a
unit price (which can be missing), and a count of copies in each state: arrived, in the mail and
refunded. One line can hold copies in two states, such as 3 arrived and 1 refunded. A card name pools
every line with that name, across sellers and orders.

## Choices

1. **Two concepts: Ledger and Sentence.**
   Ledger is a three-tab app (Cards, Sellers, Year). Sentence has no tab bar. Its first screen is a
   sentence, and each figure in the sentence opens the lines that add up to it.
   Gain: the owner sees a safe structure beside a bold one. Loss: two builds to judge.
   Pick: owner culls. "Hide Ledger" and "Hide Sentence" each remove one concept with one press.

2. **What "paid for what you got" counts.** The headline figure is the price of copies that arrived.
   Copies in the mail and refunded copies each have their own figure, never added in silently.
   "Spent, after refunds" is arrived plus in the mail.
   Gain: the figure answers the question as asked. Loss: a fourth figure on the Year screen.
   Pick: as drawn. Owner grant: yes (it defines cost basis).

3. **Shipping in cost basis.** A switch, "Count shipping in what cards cost", spreads each order's
   shipping over its cards by price. Off by default.
   Gain: a seller's true cost per card, when the owner wants it. Loss: one more control, and figures
   that change when it flips.
   Pick: drawn as a switch, off. Owner grant: yes (a tax-basis rule the owner must choose).

4. **Copies show state by shape, and the word shows once.** Arrived is a filled dot, in the mail a
   ring, refunded a slashed ring. Each screen shows the words once, in a legend or in the totals,
   and rows show only the shapes, with the words in the row's accessible label.
   Gain: "3 of 4" reads at a glance, with no state word repeated per row (ux-label-once). Loss: the
   shapes must be learned once. At AX5 the shapes hide and the "3 of 4" text stays.
   Pick: as drawn.

5. **Ledger: the three totals are the filter.** Arrived, In the mail and Refunded sit above the
   list. A press on one filters the list to card names with copies in that state, and the row
   figure changes to match. Arrived is the default, so a card with no copy arrived yet shows only
   under In the mail or Refunded, and the line above the list names the filter in words.
   Gain: no separate filter row, and the control sits next to what it changes. Loss: a total that is
   also a button is less obvious than a segmented control.
   Pick: as drawn.

6. **Ledger: sort.** One button cycles Name, Most paid, Most in the mail.
   Gain: one control. Loss: a cycle hides the choices. A native menu would show all three.
   Pick: as drawn for the mockup. The build should use a menu.

7. **Ledger, open pose: list left, detail right.** The tab bar and search stay on the left page. On
   the Year tab, the right page holds the export panel, so no sheet is needed.
   Gain: the open pose uses its width. Loss: none seen.
   Pick: as drawn.

8. **Sentence: the sentence is the navigation.** "In 2026 you paid $X for N cards that arrived. $Y
   is still in the mail, in K orders. $Z came back as refunds. That is $T spent, after refunds."
   Each figure but the last is a link; the total is the sum of the first and second. Open, the
   sentence stays on the left page and the right page shows the lines behind the chosen figure.
   Gain: the first screen answers the question with no tap. Loss: no tab bar, which departs from the
   house default in tokens.md ("On a phone, navigation uses a bottom tab bar"). Sellers have no
   home of their own in this concept.
   Pick: owner choice. Owner grant: yes (departs from a house default).

9. **Sentence: a card's page is a sentence too.** "You got 9 of 11 Glass Tutor for $101.26, $11.25
   a copy. 2 copies, $1.13, are still in the mail."
   Gain: same voice on every screen. Loss: long names make long sentences at AX5.
   Pick: as drawn.

10. **Export.** Ledger: Year tab, "Export 2026 summary", a sheet with Spreadsheet or PDF, "Only
    cards that arrived", a preview of the rows and the total, Share (top right) and "Copy as text".
    Sentence: the Share button opens the same choices, with the sentence on top of the table, so the
    shared file says in words what the figures mean.
    Gain: a clean year-end record in two taps. Loss: the table shows one row per card name, not per
    line. Pick: one row per card name. Owner grant: yes (the export format becomes a record the
    owner keeps).

11. **Needs a look, or All is well.** Both concepts list only what is not normal: orders in the mail
    more than 30 days, and lines with no price in the file. With neither, the line reads "All is
    well." Each item opens its lines.
    Gain: lost mail and bad rows show without a hunt (ux-all-is-well). Loss: the 30-day line is a
    guess. Pick: 30 days. Owner grant: yes (sets when mail counts as late).

12. **A line with no price is unknown, not zero.** It shows "price not in file", is left out of
    every total, and is counted under Needs a look (ux-unknown-is-not-empty).
    Pick: as drawn.

13. **States.** Loading shows the figure boxes at their loaded size, a count of lines read, and
    Stop. Stopped shows no total, because a part total would mislead. Empty hides the totals and
    filters and offers "Import order history". A failed read hides the totals, offers "Try again",
    and puts the reader's text in a closed "What the reader said". A search with no hit keeps the
    search and offers "Clear search".
    Pick: as drawn.

14. **Search.** Ledger: a search field above the tab bar, in thumb reach, that filters the list.
    Sentence: "Look up a card" in the bottom toolbar, with results above it.
    Pick: as drawn.

15. **Haptics.** The shipping switch, "Only cards that arrived", the file-type and year segments
    should each give a light haptic on change (ux-haptics-feel-substantial). A mockup cannot show
    it. Pick: add in the build.

16. **Colour and type.** System font only (SF Pro through `-apple-system`), sizes from Apple's text
    styles. Colours are this designer's own, by role, light and dark: a cool grey surface, deep
    blue-grey text, a deep teal accent, and one hue per copy state (green arrived, amber in the
    mail, violet refunded). No repo colour was read or used.
    Pick: as drawn; the build swaps in the repo's tokens.

## Deep links

Hash keys combine with `&`: `c=ledger|sentence` (one concept), `s=loading|empty|error|nomatch`,
`t=light|dark`, `v=card|wait|refunds|late|sellers|seller|year|export|search`, and
`hide=ledger|sentence`. Example: `#c=sentence&v=card&t=dark`.
