# Cost basis statement: directed designer 2 notes

Designer kind: directed. Direction: statement: a ledger-style statement you can export and print.

Mockup: `docs/design/cost-basis-directed-2.html`. Deep links take `c` (concept), `s` (state), `d` (device), `m` (masthead cell), `pp` (printed page), `rw` (line figures), `mm` (memo), `pm` (period control) and `t=light`, for example `#c=intally&s=open&d=folded&m=value&pp=plain&rw=money&mm=on&pm=menu&t=light`. A key left out takes its first value. Each option has a Hide button on the page.

The job, in the owner's words: "What did I actually pay for what I actually got?" Both concepts answer it with one sum: basis, less what is still missing, equals what was received. Every figure on the page comes from today's rules: `tallyGroups` (pool on the exact name), `outstandingOf` (the missing value) and the masthead's `totals.val - totals.missingVal` (received), all in `src/view-rules.mjs` and `src/app.jsx`. So the statement, the masthead and the PDF can never disagree.

## Items

1. **Concept: Statement in Tally.** The Tally view is set as a statement of account. A ruled head ("Statement", the period, Share, and the exact received figure) sits under the masthead. A column head (Copies, Received, Missing, Basis) pins while the lines scroll. Each unique item is one line. The sum sits at the foot. A line still opens to its copies, with today's check-in box, stepper, Mark all received and Clear check-ins (`ItemTotalRow` in `src/app.jsx`). Focus id: `focus-intally`.
   Gain: the working view and the statement are one thing, so the figures a person checks in are the figures they export. No new screen.
   Loss: four money columns at 466 pt leave the name about 160 pt, so long names take two lines. The foot sum is hundreds of lines down; item 6 brings the answer up top.
   Pick: this concept.

2. **Concept: Statement document.** Tally keeps today's rows (`ItemTotalRow`: got/qty, "$X / copy", "N left · $Y") and gains one ruled row under the masthead, "Statement", with the exact received figure and the page count (state "Tally, the way in"). That row pushes a Statement screen, and Back returns to Tally. The screen shows the printed statement page by page: a letterhead, an account summary, then one line per unique item, with "Carried forward to page n" at each page foot and "Brought forward from page n" at the next page head. The last page closes with the totals, the sum and the memo. A Page and Lines switch reflows the same lines as a list. Tap the page to zoom to full size. Focus id: `focus-document`.
   Gain: what you see is what prints. Carried-forward totals let a reader check any page against the next by hand, which is what a ledger is for.
   Loss: a second screen, and the page preview's text is small until zoomed. It adds a pushed screen to a tab that has none today (`TallyView` in `native/Manifest/TallyView.swift` has no navigation stack).
   Pick: not as a screen. Keep its page design as the PDF that item 9 exports from concept 1.

3. **The collapsed line shows money columns, not the unit rate.** Each line shows got/ordered, received, missing (a dash at zero) and basis. The unit rate moves to the open line's "$X across N copies · $Y avg" line, which exists today.
   Departs from: `unit-rate-is-not-the-position` (the collapsed row shows `money(item.avg)` / copy, `ItemTotalRow` in `src/app.jsx`).
   Options: "Money columns" (`rw=money`) and "Unit rate, as today" (`rw=rate`, today's row inside the statement).
   Gain: each line answers the job's question by itself. Loss: the rate needs a tap. Pick: money columns. Owner grant: yes.

4. **One column head, labels once.** Copies, Received, Missing and Basis name the columns once, in a head that pins under the statement head. At AX5 the head hides and each figure carries its own label, because the figures stack (`ux-label-once` holds at default sizes). New. Pick: as drawn.

5. **The sum at the foot.** "Basis, N copies of M unique items" less "still missing, N copies" equals "Received, N copies", under a double rule. The words are today's: basis (`tally-sort-keys-are-six`), still missing (`outstanding-value-per-level`), copies (`tally-row-lists-its-copies`). "Received" is the column's name, so the answer has one name. New. Pick: as drawn.

6. **The exact received figure in the statement head.** "Received $8,264.54 of $8,657.57 basis", under "Statement". The masthead's value cell rounds it (`compact`), and the foot sum is far down. After a share, the same line shows the receipt ("Saved cost-basis-2026.csv to Files"), so the answer to the press shows where the press was (`ux-answer-at-press`). The line has a reserved height, so nothing moves. New. Pick: as drawn.

7. **A memo of what is not counted.** "Not counted: 3 refunded packages, 1 of them partial, $41.18 of cards." and "Not counted: 2 canceled orders, 9 lines." It counts nothing into the sum.
   Departs from: `a-refund-leaves-every-count` and `canceled-orders-leave-the-list` only in that the statement names these packages and their card value; every count and the basis still drop them (`liveItems`, `dropGks`, `dropCanceled`).
   Options: "Not-counted memo" (`mm=on`) and "No memo, as today" (`mm=off`).
   Gain: a year-end record says why the basis is lower than the money that left the account. Loss: a new figure to build and test. Pick: the memo. Owner grant: yes.

8. **The period lives in the statement head.** "Orders from 2026" opens a menu: 2026, 2025, All time, and By month, which goes to the Ledger tab. A year writes today's Orders from range as By month, January to December (`RANGES` "custom" and `dateFilter` in `src/app.jsx`). Nothing new is saved. The range still spans both ledger views (`date-filter-spans-ledger-views`).
   Departs from: `ledger-tab-holds-options` (working screens hold no option rows).
   Options: "Menu in the statement head" (`pm=menu`) and "Text only, changed on the Ledger tab" (`pm=text`).
   Gain: at year end the period is one tap from the export. Loss: a second place that changes the range, and Packages changes with it. Pick: the menu in the head. Owner grant: yes.

9. **Share hands a file to the iOS share sheet.** The Share button opens a menu with Statement (PDF) and Spreadsheet (CSV), each with its page or row count. The system share sheet then offers Print, Save to Files and the rest. The app adds no Print button of its own (Apple HIG, Activity views: "Use the Share button to display an activity view", and "Avoid creating duplicate versions of common actions"). On the web the same menu would download the CSV and print the page. In the mockup, Save to Files downloads the CSV for real, and Print opens the browser's print dialog with every statement page. New. Pick: as drawn.

10. **The PDF.** US Letter, 612 by 792 pt. Page 1: letterhead (MANIFEST in Cochin caps, the house line, a gold hairline as ornament only, `palette-gold-is-ornament-only`), the period, the prepared date, the account summary and the memo. Then the lines, sorted by name, 25 on page 1 and 33 on each later page, with carried-forward totals. The last page holds the totals, the sum, the memo and the footnote "Basis is price × quantity of each copy. Shipping and tax are not included." Cochin sets words and Menlo sets figures (`typography-cochin-and-mono`). New. Letter, not A4, is my default for a US account; say if A4 is wanted.

11. **Statement order.** The PDF and CSV always sort by name, A to Z, because a ledger is read by name. Concept 1's lines follow today's Sorted by (`itemSort`, `tally-sort-keys-are-six`), drawn at Name A–Z. Gain: a stable printed order. Loss: the PDF order can differ from the screen. Pick: as drawn.

12. **The CSV.** One row per unique item: Item, Copies ordered, Copies received, Received, Missing, Basis, Sellers, Orders, Sets. Plain decimals, no currency sign, so a spreadsheet sums them. The memo is not in the CSV. New. Pick: as drawn.

13. **Masthead value cell: "value" or "basis".** The cell shows received over total basis. Option "Named value, as today" (`focus-mast-value`) keeps the label. Option "Named basis" (`focus-mast-basis`) renames it, so one figure has one name on the masthead and the statement (`ux-one-plain-name`).
    Departs from: `masthead-tallies-unequal-thirds` (cells named cards, packages and value; `.mdl-k` in `src/app.jsx`, `Thirds` in `native/Manifest/MastheadView.swift`).
    Gain: one name. Loss: "basis" over a received/total pair may read as total only. Pick: Named basis. Owner grant: yes.

14. **Printed page: plain paper or parchment tint.** Plain paper (`focus-page-plain`) paints no background in print, so the sheet's own white is the page and no white literal is needed (`design-parchment-ledger`); on screen the card token, the theme's white, stands for that sheet. Parchment tint (`focus-page-tint`) prints the paper token behind every page, and shows it on screen. Gain of tint: it looks like the app. Loss: toner on every page, and some printers drop page backgrounds. Pick: plain paper.

15. **The open Duo, Statement in Tally.** Tally spreads over both pages (`duo-card-in-hand`, round 2 item 24 b). Left page: the masthead, the column head and the lines. Right page: the statement head, then the sum and the memo, or, when a line is tapped, that line's own sum and its copies. The tab bar sits under the right page (item 23 a). The share menu and sheet stay on the right page; nothing crosses the hinge strip at 455.5 to 495.5 pt. New. Pick: as drawn.

16. **The open Duo, Statement document.** Left page: the periods, each with its basis and page count, the totals and memo, and a page index by name range ("Arcane Signet – Briar Lamplighter"). Right page: the page, fitted to height, with the pager under it. No tab bar: a pushed screen hides it. New.

17. **Largest text (AX5).** Concept 1: the masthead thirds stack in one column, as the native masthead does at accessibility sizes (`masthead-tallies-unequal-thirds`, The native client). The title, one word, is drawn at a 56 pt cap, as a minimum scale factor would draw it; today it clips (debt `native-masthead-axl-clips`). Each line stacks name, then labelled figures, then the meta line, which wraps. Concept 2: the Statement opens on Lines at an accessibility size, because a printed page cannot grow its text; Page still shows the page. The tab bar, toolbar and menus are drawn at the default size. Text factors come from the HIG Dynamic Type tables, AX5 over Large (Body 53/17, Caption 1 43/12, Footnote 44/13).

18. **Shipping and tax stay out.** The basis is price × quantity (`cost-basis-excludes-ship-and-tax`), and the statement says so on screen and on every page. Option, not drawn: a memo line with the period's Shipping Amount and Tax Amount totals, outside the basis, off by default. It breaks that record's Holds-while line (no code reads those columns). Gain: a year-end record of the whole spend. Loss: a parser change. Pick: leave out unless the owner wants it. Owner grant: yes.

19. **Check-in stays.** An open line keeps today's copies: seller, date, set and order id, the box, the stepper for two or more, Mark all received and Clear check-ins, kept mounted with hidden visibility so the row does not change height (`card-tally-row-counts-first`, `no-layout-shift-under-pointer`). Every figure sits in a fixed-width column (ch units), so a check-in changes digits, not places. The lost-mail flag on a copy is not drawn: the web has it, native does not (debt `native-tally-copy-no-flags`).

20. **The meta line keeps its counts.** "16 sellers · 17 orders · Bloomburrow +3 more" takes the full width under the figures, so the counts never truncate and only the set list ellipsizes (`card-tally-row-counts-first`).

21. **Empty period.** "No orders from 2024. Pick another period to see its statement." with one control, Show all time. The period control stays, because a filter emptied the list (`ux-unknown-is-not-empty`). Share is absent with nothing to share (HIG Printing: "Present a printing option only when it's possible").

22. **Devices.** `layout.py devices` printed "unknown" for this repo, so sizes come from the brief and the repo's records. Duo folded: 466 by 678 pt, the brief and `duo-fold-and-keyboard` (system tab bar from y 595 pt, 83 pt tall). Duo open: 951 by 669 pt with the hinge strip at 455.5 to 495.5 pt, the brief. Large phone: no size is written anywhere. It is drawn 375 pt wide, the width of `testTalliesAreUnequalThirdsAt375pt`, and 678 pt tall, the folded Duo's height, as a stand-in; its tab bar copies the folded Duo's 83 pt. The status bar is drawn at the 20 pt floor of `DuoHandUITests.statusBarFloor`, as the earlier Duo mockups do. One theme, light: the app and the native client ship light only.

## Sources

Apple pages, read 2026-11-21, each answered 200 (text from `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`): layout, typography (Dynamic Type tables, Large and AX5), accessibility (44 by 44 pt controls, 11 pt minimum), buttons, sheets, lists-and-tables, tab-bars, toolbars, activity-views (Share button, no duplicate Print), printing (offer print only when possible), segmented-controls.

## Critique (impeccable critique, run on this page)

Run as a single-context design review: no agent tool is open to a designer, so it is degraded. The detector found nothing (`impeccable detect --json`: `[]`).

- Fixed: the meta line truncated its counts at 466 pt ("17 ord…"); it now takes the full width (item 20).
- Fixed: the exact answer sat only at the foot of 330 lines; the statement head now carries it (item 6).
- Fixed: the document's Lines view drew read-only lines as buttons; they are plain rows now.
- Fixed: on the open Duo the Statement title showed twice on the left page; the page heading is gone.
- Fixed: the zoomed page clipped its left edge; it now scrolls from the left.
- Fixed: the Statement screen's Back did nothing, and no frame showed the way in; Back now returns to Tally, which carries the Statement row.
- Fixed: plain paper and parchment tint looked the same on screen.

`check_ios_mockup.py` reports one fault: "a font declaration starts with cochin". Cochin sets the words of the native app (`typography-cochin-and-mono`, `Font.cochin` in `native/Manifest/Theme.swift`), and the check reports the same fault on `duo-hand-gaps.html` and `duo-hand-tap-shift.html`. The chrome (status bar, nav bar, toolbar, menus, share sheet, tab bar) starts with `-apple-system`. The mockup keeps Cochin.
- Open: "Received" shows three times on the open Duo's right page (the head line, the sum and the column head on the left page). Each is a different place in a statement; left as drawn.
- Open: menus and the share sheet are drawn at the default text size in the AX5 frame. Their real size at AX5 is not on any page I read.

## Input needed

- Items 3, 7, 8, 13 and 18 carry `Owner grant: yes`.
- A Partial refund stamp drops its whole package, so the cards that did arrive in it leave "what I paid for what I got" (`a-refund-leaves-every-count`). Should a year-end statement count the received cards of a partly refunded package? The mockup keeps today's rule.
- Native has no date filter (debt `native-filters-tally-only`), so item 8 on native needs that build first.
- Questions from the critique: should the statement replace Tally's working rows outright, or should the money columns show only when the period is a whole year? Is Letter right for the PDF, or A4?
