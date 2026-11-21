# Cost basis, informed designer 1: notes

Mockup: `docs/design/cost-basis-informed-1.html`. Designer kind: informed. Sample figures only.

## The pain

The owner asks: "What did I actually pay for what I actually got?" Today no screen answers it exactly.

- The only "paid for what came" figure is the masthead's third cell, `compact(totals.val - totals.missingVal)/compact(totals.val)`, labelled "value" and rounded (`src/app.jsx`, the `mdl-wide` cell; `masthead-tallies-unequal-thirds`). A Tally row shows the unit rate and "N left · $Y" (`ItemTotalRow`; native `TallyRowView.header`), and the open row shows the cost basis (`acrossLine`). No row shows what the copies that came cost.
- Nothing exports a summary. The person cannot hand a year's figures to their records.
- Native has no date filter (debt `native-filters-tally-only`), so a year cannot be read on the phone.
- A refund stamp takes the whole package out of every count (`a-refund-leaves-every-count`, `dropGks`). On a Partial refund, the copies that did come leave the cost basis too, so "what I paid for what I got" is low.
- Shipping and tax are not in the ledger at all: `parseItems` in `src/view-rules.mjs` keeps neither column, though the CSV has `Shipping Amount`, `Tax Amount` and `Refund Amount` (`orderwand-csv`).

## Names

"Cost basis" stays the name of what was paid (`cost-basis-excludes-ship-and-tax`, the sort label). "still missing" stays the name of what has not come (masthead foot; `outstanding-value-per-level`), and rows keep "N left · $Y". The one new figure is **received**: cost basis less still missing, the money behind the copies in hand. It uses the app's own word (Mark all received, Hide received). No third name for the outstanding figure is added.

## Items

Each item: what it is, the gain, the loss, my pick. Every numbered option has a Hide control in the mockup.

1. **Received line in an open row** (Received line concept, id `received-line`). A new line under the across line: "$4.49 received · 4 of 5 copies". The across line stays word for word (`tally-row-lists-its-copies` holds while it renders). Gain: the per-card answer, one tap away, exact. Loss: one more line in an open row. It changes on each check-in, so it is always mounted and keeps one height (`no-layout-shift-under-pointer`). Pick: yes.
2. **Masthead third says "received", not "value"** (id `value-label`). The cell already shows received over cost basis; the label hides that. Gain: the masthead answers the question at a glance. Loss: a ruled cell label changes (`masthead-tallies-unequal-thirds` names it "value"); and "received" then shows twice on a screen with the footing or the summary (`label_once.py` hit, `ux-label-once`). Offered in both concepts. Departs from: `src/app.jsx` `mdl-wide` label "value" and native `MastheadView` cell label. Owner grant: yes. Pick: yes.
3. **Year-end summary cell on the Ledger tab** (id `summary-cell`). A ruled cell whose underlined value is the year (`disclosure-cells-underline-value`). It opens a sheet: the three figures footed, refunds named, the top five cards by cost basis, "What the file holds", and Share. Gain: the summary sits with the other ledger-wide acts (Sync, Backup, History), and the working screens stay free of option rows (`ledger-tab-holds-options`). Loss: one more tab to visit at year end. Pick: yes. On the web, the sheet reads the "Orders from" range and adds no control of its own.
4. **Year control** (ids `year-control`, both concepts). Segmented 2025 / 2026 / All years. Native has no date filter, so this is the only way to scope a year on the phone. It scopes the summary or the Statement only; the masthead stays all-time. Gain: the year-end job works on the phone. Loss: a second scope control next to the web's "Orders from" (`date-filter-spans-ledger-views`). The year is the order date, as lost-mail flags use (`lost-mail-flags-use-order-date`). Departs from: debt `native-filters-tally-only` (no native date scope). Owner grant: yes. Pick: yes.
5. **Refunded packages named, not counted** (id `refund-line`). "2 refunded packages, $16.30, are not in these figures", and in a row or a card's detail, the refunded copy struck through. The money is price × qty of the copies the stamp took out; the data already reaches `stampedPackagesOf` refund-inclusive. Gain: the year's records show money that came back, so the totals reconcile with the bank. Loss: the views show copies that `a-refund-leaves-every-count` says leave. Departs from: `a-refund-leaves-every-count` (refunded packages leave every view). Owner grant: yes. Pick: yes.
6. **A partial refund keeps the copies that came** (id `partial-keeps`; drawn on the Marlowe Singles order: the summary's refund note, the Statement's refund note, and the Paths in an open Path to Exile row. The Partial refund state opens Thoughtseize, whose Marlowe copy never came). Today the stamp drops the whole package. With this, a `partial` stamp drops only the copies not checked in. Gain: cost basis and received stay true for cards in hand. Loss: a rule change in `dropGks` / `isRefundStamp` and the native `LiveItems`; a Partial refund then changes counts on a check-in, which it never did. Hide it to see today's rule: the Marlowe Paths vanish from both figures. Departs from: `a-refund-leaves-every-count`, `src/view-rules.mjs` `dropGks`. Owner grant: yes. Pick: yes.
7. **Shipping and tax as their own lines in the file** (id `ship-tax`). The file gains one shipping row and one tax row per order. Never added to cost basis. Gain: full spend for tax records. Loss: needs a parser change (`parseItems` keeps neither column) and new item fields, so `saved-state-shape` and `imports-merge-never-replace` need a look; extension orders carry both fields (`orderwand-csv`). Departs from: the Holds-while line of `cost-basis-excludes-ship-and-tax` ("no code reads the CSV Shipping Amount or Tax Amount columns"). Owner grant: yes. Pick: show it, let the owner cull.
8. **Check in or Statement switch on the Tally** (Statement concept, id `mode-switch`). A segmented control under the masthead. Check in is today's Tally, unchanged. Statement is a read-only account page. Gain: the year-end view lives where the per-card figures already are, with search and the same six sort keys (`tally-sort-keys-are-six`, labels kept). Loss: a mode on a working screen; a person could look for check-in controls on the Statement. Departs from: `native/Manifest/TallyView.swift` `TallyView.list` (the Tally is one list of check-in rows today). Owner grant: yes. Pick: yes, as the bold concept.
9. **The footing** (id `statement-footing`). Cost basis, less still missing, double rule, Received. The two money columns run down the whole page: cost basis and still missing stand in the cost basis column, Received in the received column, so the footing names the columns and the lines need no column heads (`ux-label-once`). A violet double rule (accent token, the ledger's ink) runs left of the money wherever figures stand. Gain: the answer reads as a sum the eye can check, and every line sits under its total. Loss: the Statement lines show no unit rate (it stays in Check in; `unit-rate-is-not-the-position`). Pick: yes.
10. **Closed seal** (id `closed-seal`). A year with nothing missing gets a wax seal, "CLOSED 2025", pressed once (the `mdl-press` frames of `motion-stationery-not-software`; reduced motion draws it at rest). Ornament only: the wax ramp, no meaning carried in colour alone, the footing still says "nothing missing". Gain: an end to the year that is felt. Loss: one more ornament, and a second use of the wax tokens. Departs from: `design-parchment-ledger` (only `<Seal>` uses the wax ramp). Owner grant: yes. Pick: yes, owner may cull.
11. **The year's letter on the open Duo** (id `statement-letter`). With no card picked, the right page shows the year as a short letter and a Share button. Picking a card shows its copies; "Show the year's letter" returns. Departs from: `TallyView.swift` `pickedOrFirst` (the right page always shows a row). Owner grant: yes. Pick: yes.
12. **Statement only reads.** A card's detail lists its copies with chips (received, missing, refunded). It checks nothing in. Gain: no mis-tap on a page you read for money. Loss: a hop to Check in to fix a count. Pick: yes.
13. **Share goes through the system share sheet** (HIG activity views: "Use the Share button to display an activity view"). It hands over a CSV, one row per card name, and a plain summary. "Saved to Files: <name>" shows at the press (`ux-answer-at-press`). The file holds no seller contact, key or token. Gain: Files, Mail, Print and Copy with no app code per target. Loss: no in-app preview of the CSV itself; "What the file holds" names its columns instead. Pick: yes.
14. **Search and Hide received never change the footing** (`search-hide-keep-tally-counts`). The page says so under the lines. Gain: a search never makes the year look cheaper. Loss: a figure for "just these cards" needs the per-card detail. Pick: yes.
15. **States.** No ledger: one sentence and Open Sync; filters hidden (`ux-unknown-is-not-empty`). Figures unreadable (the rules bundle fails): a dash, never $0, and Try again. A year with no orders: one sentence and Show all years. Search empties: Clear search, figures kept. Gain: no state reads as a zero. Loss: none beyond the copy. Pick: yes.
16. **AX5.** Each size is scaled by its own text style (HIG typography, AX5 over default). Figures stack under names. The masthead foot keeps "5 still missing · $5.97" whole on its own line (debt `native-masthead-axl-clips`). The footing leads with Received at AX sizes; the sheet's toolbar puts its title on its own row. Tab labels are drawn as icons only, as debt `duo-bar-dynamic-type-clips` stands. Gain: the answer shows on the first screen of the footing. Loss: the footing's order differs by text size. Pick: yes.
17. **Duo open.** Nothing crosses 455.5 to 495.5 pt. Sheets and the share sheet open on the right page. The left page keeps the masthead and the list, as `TallyView` does today. Gain: the list stays in reach under a sheet. Loss: the sheet is one page wide. Pick: yes.
18. **Large phone.** The device list writes no size for it (`layout.py devices`: size null), and the brief gives none. Drawn at the brief's folded size, 466 x 678 pt, as one page. Gain: no invented size. Loss: the phone frame proves nothing the folded frame does not. Pick: draw it again once a size is written.
19. **Theme.** Light only: the native app is held to light (`design-parchment-ledger`). No dark frame is drawn. Gain: no unshipped theme to judge. Loss: none today. Pick: yes.
20. **Tabs this concept does not change** (Orphaned, Packages, and Ledger in the Statement concept) draw a one-line stub with a way back, so every tap lands. Pick: mockup only.
21. **Deep links.** `#c=<concept>&s=<state>&d=<device>&h=<option,...>`. `h` hides options, so each option has a link with it shown and one with it hidden. Every option's id was checked to find a visible element on its deep link, tags on and off.

## Concepts

- **Received line** keeps today's structure: items 1 to 7.
- **Statement** (bold) leaves it: a second Tally mode drawn as one ruled account page, items 4 to 12.

## Owner grant: yes

Items 2, 4, 5, 6, 7, 8, 10 and 11. Item 2 is offered in both concepts.

## Design review, applied by the designer (skill design-review)

No Agent tool in this run, so no blind reviewers A and B and no design reviewer. Applied here: the Mockup set check's structure verdict and the iOS `native` or `web-like` line, plus `label_once.py` on the rendered frames.

- Received line: structure `same` (today's Tally, Ledger tab and first screen; adds a line and a sheet). `native`: system tab bar capsule, a sheet with Cancel leading and Share trailing, the system share sheet, segmented year control, 44 pt targets.
- Statement: structure `new` (a second Tally mode, a read-only page, a letter on the open Duo's right page). `native`: segmented mode and year controls, a pushed detail with a back button on the folded pose, the system share sheet. The ruled account page is the app's own stationery, not web chrome.
- Verdict per frame (folded, open, large phone, folded AX5; light only): both concepts pass in every state drawn. AX5 failed at first (toolbar title collision, year control clipped) and passes after the fix.

## Self-critique (impeccable critique, design review only: the screens are native)

Fixed in the mockup:

- The year showed twice in the Statement head ("Statement, 2026" over a 2026 control). The head now says "Statement"; the control alone names the year.
- At AX5 the summary sheet's toolbar title ran into Cancel and Share, and the year control clipped two of its three choices. The toolbar now puts the title on its own row, and the control stacks whole.
- The summary sheet held a blank 44 pt row for the Saved answer. It now shows only after a save.
- At AX5 the Received figure sat below three tall rows. The footing now leads with it at AX sizes (item 16).
- The masthead showed rounded "$24/$30" over the Statement's exact figures with no shared name. Item 2 is now offered in the Statement concept too.

Left as is, with the reason:

- The detector's "cream palette" warning: the parchment palette is ruled (`design-parchment-ledger`).
- `label_once.py` first counted "received" and "cost basis" up to three times. Fixed: the Statement's column heads are gone (the footing names its columns) and the summary table reads "$4.40 of $6.35". One hit stays: "received" twice when item 2 is on, written into item 2's loss.
- The system share sheet's greys sit outside the tokens: it is iOS chrome, as the keyboard is in `duo-hand-gaps.html`.

Questions from the critique, for the owner:

- Is "received" the right word for the new figure, or would "paid for what came" read plainer, at the cost of length?
- Should the Statement replace the Received line concept's summary sheet, or should both ship (sheet on the web, Statement on the phone)?
- Does a year end need the closed seal, or is "nothing missing" enough?

## Pages read (2026-11-21, each answered 200)

HIG layout, typography (the Dynamic Type tables, default and AX5), accessibility (44x44 pt control), buttons, sheets (Cancel leading, Done trailing), tab bars, toolbars, activity views, lists and tables, segmented controls; JSON at `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`.
