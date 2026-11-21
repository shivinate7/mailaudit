# Overdue mail triage list: notes (directed 2)

Designer kind: directed. Direction: triage list: a dedicated worklist ordered by days left, each row ends in a claim action.

Mockup: `docs/design/lost-mail-warning-directed-2.html`. Every figure on it is sample data. It draws the native app only, in light, because the app is held to light (`UIUserInterfaceStyle: Light`, decision `design-parchment-ledger`).

Ruled and kept, not reopened: amber from day 14 and red from day 30, both from the order date (`lost-mail-flags-use-order-date`); tracked packages are skipped (`lostMail` in `src/view-rules.mjs`); a stamp hides the warning (`stamped-package-hides-lost-flag`); no Lost stamp kind (`duo-card-in-hand`, item 25 deferred).

Each option has a box under "Options" on the page; clearing it hides that option.

## Choices

1. **Concept: Overdue desk.** A pushed page, "Overdue mail", opened from a new line under the masthead on any tab. Gain: no new tab; the warning shows where the person already looks. Loss: one more row in the masthead on every tab. Pick: the desk, if the owner accepts item 6.

2. **Concept: Claims tab.** A tab between Orphaned and Ledger, titled "Claims", with a red badge. Gain: one tap from anywhere; the badge nags without hunting. Loss: a fifth tab; two red badges in one bar. Owner grant: yes (a new tab changes the bar that `phone-nav-is-bottom-bar` and `duo-card-in-hand` item 23 a set). Pick: second to the desk.

3. **Row order: by days left.** Rows past day 30 come first, then rows before day 30, fewest days left first. Inside the red band, two orders: "Nearest day 30 first" (day 31 before day 38) or "Strict days left" (oldest first). Gain: the most urgent claim is on top. Loss: a 100-day order sinks below a 31-day one in the default. Pick: nearest day 30 first, because TCGplayer counts from the delivery estimate, so a day-31 claim is the likeliest to still be accepted. Departs from: `pastTransit` in `src/view-rules.mjs` and `PastTransitPage` in `native/Manifest/HandScreen.swift`, which list "oldest last". Not blocking.

4. **Two bands, the unit in the band head.** "Past day 30 by order date" (red) over "days over"; "Claim window open" (amber) over "days left". Each row shows one Menlo figure, with "+" on red rows ("+8"). Gain: the unit shows once (`ux-label-once`) and the "+" keeps the meaning when the head scrolls away. Loss: a reader must learn that "+" means past day 30. Pick: as drawn.

5. **The claim action is the existing "Claim filed" stamp.** It is the `claim` kind in `STAMP_KINDS` (`src/view-rules.mjs`). The desk stamps in one press: an outlined button inks a red impression in the same 132 x 44 pt slot, with Undo beside it. The tab opens a sheet first (item 11). A stamped row keeps its place until the next load, as `PastTransitModel.sticky` does today (`no-layout-shift-under-pointer`). Gain: no new stamp kind; nothing moves under the finger. Loss: the desk row offers only Claim filed; the other five stamps stay on the package card's stamp band. Departs from: `PastTransitRowView` (HandScreen.swift), which shows the first two kinds and a More menu. Not blocking.

6. **Desk: masthead line.** Under "28 still missing", a 56 pt ruled button: "6 orders may be lost", "2 past day 30" in red, the money held up, and a chevron. Empty: "No overdue mail", not a button. Failed read: "Overdue mail: unknown". Gain: told, not found. Loss: the masthead grows 56 pt; its measured heights (`ruled-head-heights`, `masthead-foot-slot`) and the one-advisory-line rule (`ruled-head-one-advisory-entrance`) are for the web head. Owner grant: yes.

7. **Tab: badge.** The badge counts the unstamped rows listed (6). A failed read shows "?", never 0 (`ux-unknown-is-not-empty`). Option: count red rows only. Gain of all rows: matches the list. Loss: a badge that rarely clears. Pick: all rows.

8. **Tab: 30-day ruler on each row.** A 4 pt bar to the day reached, with ticks at day 14 and day 30, read 0 to 38. Gain: urgency at a glance, without reading. Loss: decoration at small size; hidden from VoiceOver. Pick: keep, cheap to cut.

9. **Packages card flag (web port).** The date line gains the web text: "⚠ 28d — may be lost · " in amber and "⚠ 31d — refund window closing, contact seller · " in red (`src/app.jsx`, `PackageCard`, the `lost?.tier` spans). Closes debt `native-card-lost-flags-unbuilt`. Loss: on a 466 pt card the red text truncates the order date, as the web does at that width. Pick: port as is; the worklist carries the dates.

10. **Tally copy flag (web port).** A copy line gains "⚠ 28d · " (`src/app.jsx`, the Tally source row `lost` span). Closes the flag part of debt `native-tally-copy-no-flags`. Pick: port.

11. **Tab: claim sheet.** Cancel at the leading edge (HIG sheets), the seller, "day 31 · past day 30 by order date", one sentence on what to do, the order number with Copy, ordered date, tracking, each card still owed with its price, and the total. Claim filed, Seller contacted and Other stamps are pinned at the sheet's foot, in thumb reach (`ux-thumb-zone`). Gain: the facts a claim form asks for, in one place. Loss: two presses to stamp, and Copy is a new act (the clipboard). Pick: keep Copy.

12. **Open Duo, desk: claim-by calendar.** The list on the left page; on the right page a five-week calendar of claim-by dates (a tick per order, red or amber, today ringed), then the chosen order's cards. Tapping a date picks its row; tapping a row rings its date. Gain: "how long" becomes a place in time. Loss: a second view of the same dates. Pick: keep; cut first if the owner wants less.

13. **Open Duo, tab: claim facts on the right page.** As Tally and Orphaned spread (`duo-card-in-hand`, item 24 b). The chosen row carries the accent bar the hand list uses. Pick: as drawn.

14. **The page replaces "Past 14 days" and reaches every pose.** Today the past-transit page opens only from Card in Hand on the open Duo (`HandScreen.transitBox`). Here the desk or the tab opens on folded, open and phone, and Card in Hand's Open goes to it. Departs from: `PastTransitPage` reachable only on two pages. Not blocking.

15. **States.** Loading keeps three rows at their full height. Read failed: "The ledger could not be read, so overdue mail is unknown." with Try again. Empty: "All is well." with Open Packages (`ux-all-is-well`). Owed unknown: rows load, money reads "unknown" (`PastTransitModel.owedValue` nil). Stamp not saved: the slot reads "Not saved, press again", in red, in the same box.

16. **Largest text (AX5).** Rows stack: figure with its unit ("+1 day over"), seller, cards owed, dates, then a full-width button. Sizes from the HIG AX5 table. The figure is capped at xxxLarge Title 1 (34 pt) and the button text at xxxLarge Body (23 pt) with the large content viewer, as the post bar does (item 104 a). Loss: a capped label; one row per screen. Pick: as drawn. Not blocking.

## For the builder (not an owner question)

- Each row needs its own cards and money owed. `PastTransitRow` holds `gk`, `tier`, `days`, `claimBy` and `stamp`; `PastTransitModel` computes owed only as page totals (`owedCards`, `owedValue`). Model change, reported to the orchestrator.
- The order number is `gk` before "::" (gkOf).

## Sizes and sources

- Folded 466 x 678 pt, tab bar from y 595 at 83 pt; open 951 x 669 pt with the fold at 455.5 to 495.5 pt (`duo-fold-and-keyboard`). The open pose reuses the folded tab-bar height: unmeasured.
- The status bar foot is unmeasured on every pose; drawn at 20 pt.
- Large phone: no size in `layout.py devices` (it prints "unknown") or in the brief. Drawn at a placeholder 440 x 900 pt.
- Apple pages read 2026-11-21 through the `tutorials/data/...json` form, each answered 200: layout, typography (Dynamic Type tables: default, xxxLarge, AX5), accessibility (44 x 44 pt control, 17 pt text), buttons, lists-and-tables, tab-bars ("floats above content"), toolbars. Sheets was not fetched; its rule is the one the `ios-apps` skill quotes.
- `check_ios_mockup.py`: duo-frames and safe-area pass. system-font faults on Cochin, the repo's word face (`typography-cochin-and-mono`, `Font.cochin`). `duo-hand-post-sender.html` on main faults the same way. Likely a false alarm for this repo.

## Critique (impeccable, design review only, native)

Fixed: the red and amber figures shared one column with opposite meanings ("+" added); six filled purple buttons formed a wall (the stamp is now an outline until pressed); the sheet's buttons sat below the fold (pinned at the foot); the AX5 figure lost its unit when the head scrolled away (unit added at AX sizes).

Open: the red card flag truncates the date (web behaviour, item 9); two red badges in the tab bar (item 7); "Claim filed" repeats on each row, a `label_once` hit that is a control label, not a status word.
