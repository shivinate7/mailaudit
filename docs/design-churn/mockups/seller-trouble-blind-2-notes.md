# Seller trouble, blind designer 2: notes

Designer kind: blind. Mockup: `seller-trouble-blind-2.html`, in this folder. Every seller, order and
count in it is sample data.

The job, in the person's words: "Who keeps burning me?" Each seller has orders, cards ordered, cards
received, orders late or lost, and the days each order took. The person wants to stop buying from a
bad seller, or open a complaint.

Deep links: `#c=ledger|docket|field`, `&s=loaded|loading|failed|unknown|empty|allwell|filtered`,
`&t=light|dark` (no `t` follows the system), `&h=<concept>,…` hides concepts. Each concept's frames sit
in the element `#concept-<c>`, the focus target for a pick.

Each item: what it is, the gain, the loss, and my pick. Every concept is shown; the owner culls. The
Hide control beside each concept tab removes it with one press.

## Concepts

1. **Ranked ledger** (familiar structure). A list of sellers, the most bad orders first. Each row has
   a strip with one mark per order, oldest to newest, and a "bad orders / closed orders" figure. Tap a
   seller for the record and the two acts. Open pose: list on the left page, record on the right.
   Gain: fastest to scan; the strip shows a pattern ("two lost in a row") before any number. Loss: it
   looks like a report; the person must decide what to do on their own. Pick: keep.
2. **Verdict docket** (the deliberately bold concept). No list to browse. Each seller who keeps
   burning you opens a case, worst first, one at a time. The case shows the evidence in sentences and
   asks for a ruling: Keep buying, Watch, or Avoid this seller, plus Draft a complaint. A ruling moves
   to the next case and leaves an Undo where the press was. Ruled cases sit under "Ruled (n)" and can
   reopen. When none is left: "All is well." Open pose: the docket list on the left, the case file
   on the right. Gain: it turns "who burned me" into a decision, and it ends; nothing like it is common
   in shopping or order apps. Loss: a person who only wants to look must still pass through cases;
   comparing two sellers side by side needs the open pose. Pick: keep.
3. **Speed field** (unusual structure). A map of sellers: left to right is how many days its slower
   orders took, top to bottom is the share of cards that came right. The slow or short corner is
   shaded. Tap a dot for its card with the two acts; "Show as list" reads the same field in words.
   Open pose: the field on the left, the record on the right. Gain: outliers jump out at once, and the
   two kinds of trouble (slow, short) separate in space. Loss: the hardest to read at large text sizes
   and for a screen-reader user, so it needs the list view; dots can crowd. Pick: keep.

## Shared choices

4. **Rank order: "keeps burning".** Most bad orders first, then most cards that did not come right,
   then the higher share. Options: share of bad orders (lets a two-order seller with one slip outrank
   a seller who failed four times), or a weighted score (lost counts more than late; harder to
   explain on screen). Gain: matches "keeps"; the shown figure explains the order. Loss: a big seller
   with many orders ranks high on count alone. Pick: count. Owner grant: yes (it sets a product rule).
5. **One mark per order.** Filled dot came fine, ring late, cross lost, half dot short, diamond wrong
   cards, dash on the way. Shape and colour both carry the kind, so it reads without colour. The
   filter chips (ledger) and the legend (field) name each kind once; elsewhere the shape carries it
   (house rule ux-label-once). When an order is both late and short, the worst kind wins: lost, then
   wrong, then short, then late. Gain: dense, scannable. Loss: a second problem on one order hides
   behind the first; the record's sentence still says both. Pick: keep.
6. **Late and lost lines.** Late: more than 10 days to arrive. Lost: no arrival after 30 days. Both
   are my assumptions; the brief gives neither. Gain: a plain rule the screen can state ("The line
   marks 10 days"). Loss: a seller far away may be "late" every time. Option: use each order's promised
   date, if the data has one. Pick: fixed lines until the owner rules. Owner grant: yes.
7. **Wrong cards.** The brief names wrong cards as trouble, but its data list has no count of wrong
   cards. The mockup draws a wrong-card count per order. If the data has none, the Wrong cards chip,
   the diamond mark and the evidence line go away. Pick: show it, pending the data. Owner grant: yes.
8. **"Avoid this seller" marks the seller in this app only.** It blocks nothing on the marketplace,
   and the reply under the button says so. In the ledger, an avoided seller sinks to an "Avoiding"
   group; other rows keep their order (house guidance ux-order-holds-still). Undo sits at the press.
   Gain: true copy; a reversible act. Loss: the person must still remember to skip the seller when
   buying. Pick: keep.
9. **When a case opens (docket).** Two bad orders, or one lost order. One small slip opens no case;
   those sellers are named in one sentence under the case. Gain: the docket stays short (4 cases, not
   7). Loss: a seller with one wrong card is not asked about. Pick: keep. Owner grant: yes.
10. **Complaint is a draft, never a send.** "Draft a complaint" opens a sheet (Cancel leading, Done
    trailing) with a filled-in text that lists the bad orders. "Copy text" answers "Copied" on the
    button. The app sends nothing, and the sheet says so. The draft survives closing and reopening
    (house rule ux-keep-what-was-made); the build must store it. Gain: true; works for any
    marketplace. Loss: one more step to paste. Pick: keep.
11. **Field axis: the slower orders, not the typical order.** The x axis is the day count a quarter
    of the seller's orders took longer than (lost counts as 30+). The median hid a seller who is late
    four times in nine. Gain: chronic lateness shows. Loss: harder to name; the axis says "Days its
    slower orders took". Pick: keep.
12. **Field title starts as a standard title on compact width.** The field needs the height above
    the seller card, so the large title does not start large there. The open pose and AX5 keep the
    large title. Loss: unlike the other concepts. Pick: keep.
13. **Crowded dots.** Dots whose 44 pt hit areas overlap merge into one numbered dot, coloured by the
    worst trouble among its members, so a merge never hides trouble behind a clean colour. A tap lists
    its sellers in the card. Name labels try right, left, below, then above, to avoid each other.
    Pick: keep.
14. **Largest text (AX5).** Body 53 pt. Rows stack. The acts and the verdict buttons sit in the
    flow, not pinned, because a pinned bar of 53 pt buttons would cover the whole screen. The field
    shows as its list, with one sentence that says so. Pick: keep.
15. **States.** Loading keeps the row size. Read failed says no seller is rated, with Try again and
    the app's text in a closed "What the app said" disclosure. "Too early to tell" (every order on the
    way) never shows as clean. No orders: one sentence, one control, no filters. Filter emptied: the
    chips stay, one control clears the filter. "All is well." stands alone in the summary. Only the
    ledger has a filter, so the state menu disables "Filter emptied" on the others and says why.
    Sellers with no trouble sit behind a disclosure; sellers still too early are named apart.
16. **Open pose.** Each pose is its own layout: a list or field on the left page, the record or case
    on the right. Sheets open on the right page only. The tab bar sits on the left page. Nothing sits
    across the hinge gap (x 455.5 to 495.5): a headless check of every concept in its six main states
    found 0 elements across it.
17. **Tab bar.** Drawn floating, with this screen's tab and a dashed "Other tabs" slot. A blind
    designer does not know the app's other tabs. The tab icon is a neutral sorted-list mark, so no
    order mark gets a second meaning.
18. **Docket verdict labels.** The three verdict buttons read Keep buying, Watch and Avoid this
    seller, the same names as everywhere else, so "Avoid" is never a second name for one act (house
    rule ux-one-plain-name). Until a ruling, the reply line above them says what Keep and Watch mean;
    after a ruling it names the ruling and offers Undo. Loss: the buttons wrap to two lines on the
    folded Duo. Pick: keep.
19. **Tab bar at AX5.** Tab labels keep their size at AX5, as iOS tab bars do; a press and hold on a
    tab shows its icon and label large (the Large Content Viewer, which Apple's typography page names
    for navigation controls). Gain: two tabs still fit 466 pt. Loss: the label is small until held.
    Pick: keep.
20. **Colours and type.** Colours are my own, by role, light and dark (house tokens give no values).
    Type is the system font at Apple's Dynamic Type sizes. Space is on the 4 px step; radius 8 px.

## Sizes, reads and limits

- Duo folded 466 x 678 pt and open 951 x 669 pt come from the brief; `layout.py devices` printed
  "unknown" for this repo.
- The large phone has no written size. 440 x 956 pt is a stand-in until the owner names one, and its frame says
  so. Owner grant: yes (name the size).
- The safe-area fallbacks (48 pt top, 20 pt bottom) and the tab bar height (60 pt) are my own; no page
  I read gives them. Unmeasured.
- Apple pages read 2026-11-21, each as JSON from developer.apple.com, each answered 200: Layout,
  Typography (iOS Dynamic Type tables, Large (default) and AX5), Accessibility (44 x 44 pt control,
  17 pt default text), Buttons, Sheets (Cancel and Done placement), Tab bars (floats above content),
  Toolbars, Lists and tables.
- Departs from: none known. A blind designer sees no current screen.
