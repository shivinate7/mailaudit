# Cost basis, directed designer 1: notes

Designer kind: directed. Direction: one-number. A single honest number up front, detail one tap down.

Mockup: `docs/design/cost-basis-directed-1.html`. Two concepts, named Sum line and One scale. Each has a
hide control on the page. The waiting page can focus `#sum-line-figure` and `#one-scale-figure`, the
figure block in each concept's folded frame.

Deep links (hash): `c=both|sum|scale`, `s=loaded|row|panel|sheet|search|arrived|empty|loading|failed`,
`g=0` hides the Today and New tags, `h=sum,scale` hides a concept.

Every figure is sample data: a seeded ledger of about 2,000 lines, 255 card names and 64 sellers, from
2025-10 to 2026-11, with 6 refunded, 3 partial-refund and 4 canceled orders.

## Items

1. **The one figure: "Paid for what arrived".** It is the sum of price × copies received, over the live
   items in the date range. Today the number exists, but it is rounded and has no label. It is the
   numerator of the masthead value cell: `compact(totals.val - totals.missingVal)` in `src/app.jsx`
   (`.mdl-wide`), and `MastheadView.tallies` in `native/Manifest/MastheadView.swift`.
   - Gain: it answers the owner's question, "what did I actually pay for what I actually got", as one
     exact figure.
   - Loss: Tally gains a figure.
   - Pick: both concepts lead with it.
   - Owner grant: yes. It adds a figure to Tally that no ruling holds.

2. **The figure's name, and the sentence around it.** On Tally the figure sits inside a sentence: "You
   paid / $5,357.74 / for the 2,294 of 2,434 copies that arrived." That puts the owner's own question,
   "what did I actually pay for what I actually got", on the screen, with no small label over a big
   number. The sheet and the file name it "Paid for what arrived". "Cost basis" stays the name of the
   sort key (`tally-sort-keys-are-six`). That key ranks by `basis`, the total spent, which is a different
   number. Tests 61.27 and 61.28 pin the six sort labels, and no label changes.
   - Gain: no word means two numbers, and the copy count beside the figure shows what it covers.
   - Loss: the sentence's count changes on each check-in. It is one line at 375 pt with four-digit
     counts. Five-digit counts were not measured.
   - Pick: this sentence.

3. **Sum line: one money figure per row.** The row keeps `got/ordered` and gains what that name cost for
   the copies that came. The unit rate and the red "N left · $Y" line move into the opened row, as an
   Ordered / Arrived / Still in the mail / Per copy grid.
   - Both lines stay mounted in every state, so a tap that completes a copy changes no height
     (`card-tally-row-counts-first`).
   - Departs from: `unit-rate-is-not-the-position`. Today `ItemTotalRow` in `src/app.jsx` shows
     `item.avg` as "$X / copy", and native shows `TallyRow.rateLine` in `ManifestKit/Tally.swift`.
   - Departs from: `outstanding-value-per-level`. Today `ItemTotalRow` shows "N left · $Y", and native
     shows `TallyRow.leftLine`.
   - Gain: each row answers the owner's question.
   - Loss: the outstanding money per row moves one tap down. The masthead keeps today's rounded value
     cell ($5.36k/$5.66k) right above the exact figure, so the same money shows twice in two forms. Item
     5's masthead change would fix that here too.
   - Pick: Sum line, if the owner wants money on the rows.
   - Owner grant: yes.

4. **One scale: rows carry counts, never money.** The row shows `got/ordered` only. Opening a row makes
   the pinned scale weigh that card name, with a reserved "All cards" control to go back. On the open
   Duo, a tap on a row weighs it on the right page, with each line and its price.
   - Departs from: the same two rulings as item 3, and `tally-row-lists-its-copies` (the collapsed row's
     rate and outstanding figure).
   - Gain: money shows in one place, so no figure contradicts another.
   - Loss: to compare two names you open each in turn. The figure no longer reads beside each name.
   - Pick: One scale. It is the stronger form of this direction.
   - Owner grant: yes.

5. **One scale drops the masthead's money.** The value cell goes, and "still missing" keeps its count
   but loses its dollars. The pinned scale is the one home of money on Tally.
   - Departs from: `masthead-tallies-unequal-thirds` (`.mdl-wide` at `flex: 1.7`, and native `Thirds`
     at 1 : 1 : 1.7).
   - Departs from: `outstanding-value-per-level` (the exact "still missing · $Y" foot in `src/app.jsx`,
     and native `model.missingLine`).
   - The drawing shows Tally only. Whether Packages also loses it is open.
   - Gain: no rounded figure sits above the exact one.
   - Loss: Packages and Orphaned have no money at a glance, if this applies to every view.
   - Pick: Tally only, as drawn.
   - Owner grant: yes.

6. **How it adds up, one tap down.** A tap on the figure or on its underlined cell opens a panel that
   overlays the list. It has the paper fill and no reflow (`motion-disclosure-panels-arrive`,
   `head-panels-carry-paper-fill`, `disclosure-cells-underline-value`). The cell is also the way out, as
   in `sync-line-toggles-its-panel`.
   - Its lines read: Spent on cards, less Still in the mail, then a ruled "Equals" line.
   - On the open Duo the panel stays open on the right page.
   - Both patterns are ruled but not built (debts `panels-overlay-unbuilt` and `panel-paper-fill-unbuilt`).
     The builder makes the overlay; no component exists to reuse.
   - Gain: the proof sits beside the claim.
   - Loss: none found.
   - Pick: both concepts.

7. **What the figure leaves out, said out loud.** The panel lists, with value, each refunded package,
   each partial-refund package and each canceled order. It says that shipping and tax are not counted,
   and that search and Showing never move the figure but the date range does
   (`search-hide-keep-tally-counts`).
   - Read from: `isRefundStamp`, and `dropGks` through `liveItems`, in `src/view-rules.mjs` and
     `src/app.jsx` (`a-refund-leaves-every-count`), and `dropCanceled` (`canceled-orders-leave-the-list`).
   - Gain: the figure is honest about what it leaves out.
   - Loss: more text one tap down.
   - Pick: both concepts.

8. **Partial refunds drop cards that arrived.** Today a partial-refund package leaves every count,
   including cards that did arrive. So "paid for what arrived" undercounts it. The mockup keeps today's
   rule and names it in the left-out list.
   - The other route is to keep the arrived cards and subtract the refund. But no record holds the refund
     amount: only the stamp's note does. So the page cannot draw that route with a true figure, and it
     stays prose here.
   - Departs from: `a-refund-leaves-every-count`, the other route only.
   - Gain: a truer figure.
   - Loss: a new field for the refund amount.
   - Pick: keep today's rule. This is not blocking.
   - Owner grant: yes, the other route only.

9. **Shipping and tax.** They are not counted (`cost-basis-excludes-ship-and-tax`), and the figure says
   so: "Card prices, before shipping and tax."
   - Option: the Year-end summary adds the CSV's per-order Shipping Amount and Tax Amount as two separate
     totals, never split onto cards.
   - That needs the parser to read two columns it skips today (`orderwand-csv`). This is outside the
     design folder.
   - Drawn in the sheet as a New-tagged block: Shipping, Tax and "Spent in all", with sample amounts.
     "Hide this option" removes it, and `o=0` in the hash opens the page without it.
   - Gain: the year-end summary holds the whole spend.
   - Loss: parser work, and a second figure on the summary.
   - Pick: offer it. This is not blocking.
   - Owner grant: yes.

10. **Year-end summary, an export.** A sheet in HIG form: Cancel on the leading edge, and Save CSV on the
    trailing edge as the confirming act. It holds Spent, Still in the mail, the ruled Paid for what
    arrived, Left out, the first lines of the file, Save CSV and Copy summary.
    - The CSV has one row per card name: card name, copies ordered, copies arrived, paid for arrived,
      still in the mail, per copy, sellers. Then an all-cards row and the left-out rows.
    - Save CSV works on this page.
    - The web saves the file as the backup download does (`a.download` in `src/app.jsx`). Native hands
      the file to the system share sheet.
    - A share sheet is not a browser dialog (`no-native-dialogs` bans `window.confirm` and `alert`).
    - Gain: a clean record for the owner's books.
    - Loss: a new capability to build and test on two clients.
    - Pick: both concepts.
    - Owner grant: yes.

11. **The year comes from the existing date filter.** The sheet's "Covers" line has a Change control
    that opens the date range, "By month", set to January to December (`RANGES` in `src/app.jsx`,
    `ruled-head-range-picked`). The sheet adds no second picker.
    - Native has no date filter yet (debt `native-filters-tally-only`). So on the phone the sheet has
      no way to pick a year.
    - Gain: one home for date scope.
    - Loss: the native sheet waits for that debt to close, or gains a year control of its own.
    - Pick: wait for the debt.
    - Owner grant: yes.

12. **Nothing moves under the finger.**
    - The figure box is one line, 41 pt tall (the Large Title leading), and left-aligned. A change of
      digits moves nothing beside it.
    - Row order is taken once and freezes while cards are checked in (`tally-sort-keys-are-six`,
      `no-layout-shift-under-pointer`).
    - Measured on this page, 2026-11-21, headless Chrome: in the six default-size frames, a check-in tap
      changed the figure. Every row, copy line, cell and control kept its box.

13. **The open Duo.** Tally spreads over both pages, and the tab bar sits under the right page
    (`duo-card-in-hand`, round 2, items 24 b and 23 a). Nothing sits on the hinge strip from x 455.5 to
    495.5.
    - Sum line: the list is on the left page. The sum, with How it adds up always open, is on the right.
    - One scale: the list, with counts, is on the left page. The scale of the tapped row is on the right.

14. **States.** No unknown state ever shows $0.00 (house rule `ux-unknown-is-not-empty`).
    - Loading: "Reading…" in soft ink.
    - Failed: "Not read", with Read again.
    - Empty: "No orders", one sentence, and Open Sync. CSV import stays on the web
      (`csv-import-stays-web`), so the phone's way in is Sync.
    - All arrived: "Everything you paid for has arrived" in green.
    - In loading, failed and empty, the figure is plain text, not a disabled button, so no control
      sits there without a reason.

15. **AX5 on the folded Duo.** The sizes come from the HIG AX5 table: Large Title 60, Body 53, Subhead 49,
    Caption 1 43, Caption 2 40.
    - Rows stack, and the masthead cells stack, as native does at accessibility sizes.
    - One scale stops pinning at AX5, or it would fill the screen.
    - The tab bar labels stop at the default size, as built (`duo-card-in-hand`, Tab bar text).
    - At AX5 How it adds up opens in the flow and pushes the list down, because an overlay that tall
      would cover the whole screen. Departs from: `motion-disclosure-panels-arrive` (panels overlay the
      list), at AX5 only. A tap on the cell opens it, so the list moves below the finger, and never covers it.
    - The sheet's toolbar stays at the default size. Whether the system grows a sheet toolbar at AX5 was
      not read, so it is unknown. The sheet's body text grows.
    - Measured on this page, 2026-11-21: at AX5, in loaded, all arrived, row open, panel and sheet, no
      row figure, name or sheet line passes the right edge of its row or sheet.

16. **Type.** Cochin sets words and Menlo sets numbers (`typography-cochin-and-mono`). The status bar,
    the tab bar and the sheet toolbar use the system font. `check_ios_mockup.py` faults the page on
    Cochin, because it reads any font that is not the system font as a fault. The repo rules Cochin for
    content, and the house tokens allow a brand font in content. So the fault is likely a false alarm.
    The other two checks pass: safe area, and the Duo frames, folded first.

17. **The row's copy lines are ruled, never boxed.** Inside an opened row, the copy lines run full width
    with a hairline between them. They are not a second card inside the row card. The check mark is a
    drawn tick, not a text glyph. On One scale, the tapped row carries the 3 pt accent bar that Card in
    Hand uses for a chosen match (`duo-card-in-hand`, owner item 48).

18. **The double gold rule.** In a ledger, a double rule closes a final sum. It sits under the figure and
    under the Equals line. It is gold, so it is ornament and never text
    (`palette-gold-is-ornament-only`).

19. **Devices and theme.**
    - `layout.py devices` answers "unknown" for this repo.
    - The folded pose is drawn at the brief's 466 × 678 pt. The record `duo-fold-and-keyboard` reads the
      outer screen as 382 × 644 pt of safe content. The two do not agree.
    - No phone size is written. The phone is drawn 375 pt wide, the width `check:screens` used before the three forms, and
      `testTalliesAreUnequalThirdsAt375pt` use, and 760 pt tall as a guess.
    - The status bar is the 20 pt UI-test floor, as `duo-hand-tap-shift.html` draws it.
    - There is one theme: native is held to light, and the dark tokens belong to the extension.

## Design review of this mockup, by its designer

The design reviewer still gives the real verdicts. These are the designer's own.

- Native or web-like, per screen:
  - Tally on Sum line: web-like. The disclosure cells are underlined text, as `disclosure-cells-underline-value`
    requires, and iOS has no such control. The search field sits in the list as a box, as the web has it,
    not in the navigation bar. The row's qty stepper is drawn, not the system stepper.
  - Tally on One scale: web-like, for the same three reasons.
  - Year-end summary sheet: native. It has a grabber, Cancel on the leading edge, the confirming act on
    the trailing edge, and the system font in its toolbar.
  - Open Duo right pages: native in layout. They use the same underlined cells.
- Structure, per concept:
  - Sum line: changed in part. The list stays, but each row's money changes, and a sum heads the view.
  - One scale: changed. Money leaves the rows and the masthead, and one pinned figure follows what is
    open.

## Apple pages read, 2026-11-21

Each page was read as JSON under `developer.apple.com/tutorials/data/`.

- `design/human-interface-guidelines/layout`: safe areas, and size classes over device type.
- `design/human-interface-guidelines/typography`: the Large (default) and AX5 Dynamic Type tables.
- `design/human-interface-guidelines/accessibility`: 44 × 44 pt controls and 11 pt minimum text.
- `design/human-interface-guidelines/sheets`: Cancel leading, the confirming act trailing, the grabber.
- `design/human-interface-guidelines/tab-bars`: the bar is for navigation, not actions. Export stays
  out of it.
