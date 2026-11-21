# Lost-mail warning: design notes (informed 1)

Designer kind: informed. Mockup: `docs/design/lost-mail-warning-informed-1.html`. Nothing here is built.

**The pain.** On the folded Duo and the phone, the native app never says that mail is late. The card paints the date alone (debt `native-card-lost-flags-unbuilt`). A Tally copy has no flag (debt `native-tally-copy-no-flags`). The masthead says nothing. The past-transit page opens only inside Card in Hand on the open Duo (`HandScreen.swift`, `transitBox` and `PastTransitPage`). So the owner must hunt, or finds out on day 31.

**Kept, as ruled.** Amber from 14 days and red from 30, both counted from the order date (`lost-mail-flags-use-order-date`). Tracked packages show no flag. A stamp hides the flag (`stamped-package-hides-lost-flag`). The six stamp kinds stay, with no Lost kind (`duo-card-in-hand`, item 25). The late list runs oldest last. No third tier: nearness to day 30 shows by position, never by a new colour.

**Concepts.** Late cell is the quiet concept: open `#s=packages` and focus `#focus-late-cell`. Claim ruler is the bold concept: open `#s=packages` and focus `#focus-claim-ruler`. Each focus element is on the folded Duo frame. The Options bar on the page hides each concept.

**Deep links.** `#s=packages`, `#s=late`, `#s=stamped`, `#s=tally`, `#s=none`, `#s=unknown` and `#s=today`. Light only: the native app is held to light (`design-parchment-ledger`), so there is no theme link.

## Items

1. **Flag and tracked glyph on the native card (both concepts).** What: the date line gets the flag before the date and ● tracked or ○ untracked after it. This is the web card's line (`src/app.jsx`, the package header, `lostMail(pkg.date, pkg.tracking, done || stamped)`). Gain: it closes debt `native-card-lost-flags-unbuilt`, and each card says its age where the eye already reads the date. Loss: none beyond the build. Pick: yes.

2. **Card words: web words, or the figure alone (both).** What: the web writes "⚠ 18d — may be lost ·" and "⚠ 34d — refund window closing, contact seller ·" on every card. The option writes "⚠ 18 d ·" and lets colour carry the tier. On screen the words are said once, by the Late cell or the ruler. Each card's date-line VoiceOver label carries them in every option: "28 days, may be lost. Ordered 2026-10-24. Untracked." and "34 days, refund window closing, contact seller. Ordered 2026-10-18. Untracked." Today's label, "Ordered <date>" (`PackagesView.dateLine`, `accessibilityLabel`), overrides the text, so the builder must replace it, or the flag is silent to VoiceOver. Gain: it keeps `ux-label-once`. On the folded Duo, the web's red line runs about 70 mono characters and pushes the date and the glyph past the ellipsis. Loss: a first look at a lone amber "⚠ 18 d" says less than the web's words. Pick: figure only. Departs from: `src/app.jsx` package header date line (the web words). Owner grant: yes.

3. **Flag on the Tally copy (both).** What: the copy's detail line starts with the flag, as the web Tally source row does (`src/app.jsx`, `ItemRow`, `lost = source ? lostMail(...)`). The native home is `ItemLine.detail`. Gain: it closes the flag half of debt `native-tally-copy-no-flags` and answers "did all four arrive, and which one is late". Loss: none. The order id tap is still open and is not drawn. Pick: yes.

4. **Accessibility sizes (both).** What: from AX1 up, the flag takes its own line above the date, through `ViewThatFits`. The Late cell and Stamped cell stack one per line. The ruler gives way to text (item 8). Gain: the flag never truncates. Today the date line is one line (`PackagesView.dateLine`, `lineLimit(1)`). Loss: the card grows taller at AX sizes only. Pick: yes. Departs from: `PackagesView.dateLine`, one line at every size (default, not owner). AX5 sizes are from Apple's table: Caption 1 at 43 pt (12 pt at Large) and Body at 53 pt (17 pt at Large). So the 10 pt cell draws at about 36 pt and the 11 pt date at about 34 pt.

5. **Late cell (quiet concept).** What: a "N past 14 days ○" cell in the ruled row, left of "N stamped" (`StampViews.swift`, `StampedRow`). It is amber while N > 0. One press filters Packages to the late packages, oldest last, under a summary line: "6 packages · 13 cards · $6.96 · oldest last". The list comes from the bundle's `pastTransit` rule (one home). Each late card shows the stamp buttons the past-transit row has (`PastTransitRowView`: Claim filed, Refunded, More). At 0, the cell is disabled and gives its reason, as the Stamped cell does. Gain: it stays inside the ruled-head vocabulary and works on every pose. The money is on screen. Loss: it sits at the top of the screen, out of thumb reach once scrolled (item 6 answers this). The native Packages has no filter today (`native-filters-tally-only`), and the web has no such cell, so this is new on both clients. Pick: yes, as the default concept. Owner grant: yes.

6. **Packages tab badge (option, both concepts).** What: a red badge on the Packages tab counts the packages past 14 days that carry no stamp. Apple's tab-bar page: "Use a badge to indicate that critical information is available." Gain: the count sits in the thumb zone on every tab, so the owner is told without hunting. Loss: it has the same shape as the Orphaned badge but a different meaning (`ux-one-plain-name`, one icon one meaning). A badge that stays up for weeks can become noise. A stamp clears it, so it shows only work not yet done. Pick: yes. Owner grant: yes.

7. **Stamped row keeps its place (both).** What: after Claim filed, the row stays where it is with "Stamped Claim filed" and Undo, until the filter turns off (Late cell) or the page reloads (Claim ruler). This is today's behaviour (`PastTransitModel.sticky`). Gain: no row moves under the finger (`no-layout-shift-under-pointer`). Loss: the count in the cell drops while the stamped row still shows. Pick: yes.

8. **Claim ruler in the masthead (bold concept).** What: under the "still missing" line, a 14-to-30-day scale. Each late package is an envelope mark at its age. Marks that share a day show a count, and 30 days and over pool in one "30+" bin. A red line stands at 30. The label reads "Past 14 days · 6 · 13 cards · $6.96" with Open. The whole band is one button, and its VoiceOver label speaks the counts and the money. With nothing late, the empty scale reads "Nothing past 14 days." at the same height. At AX sizes the scale becomes three lines of text and an Open button. Gain: on every working tab, the owner sees at a glance how close the late mail is to day 30, with no new tier. Loss: it adds a band to the letterhead (`masthead-is-one-letterhead`). It is a second always-on status on the working screens beside the one sync advisory (`ruled-head-one-advisory-entrance`). It sits at the top, out of thumb reach (item 6 helps). Pick: offer, not the default. Departs from: the masthead model in `MastheadView.swift`, `tallies`, which ends at the missing line. Owner grant: yes.

9. **Past 14 days page on every pose (bold concept).** What: the ruler opens today's page (`PastTransitPage`) as a pushed page on the folded Duo and the phone, with Back. Gain: the one late list reaches the pose the owner carries on mail day. Loss: a second way in beside Card in Hand. Pick: yes, with item 8. Departs from: `HandScreen.swift`, where the page is reachable only through `hand-open` on the open Duo. Owner grant: yes.

10. **Track to day 30 on each row (bold concept).** What: a thin bar under the seller fills toward a red end mark at day 30, in the row's tier colour. A stamped row's bar goes neutral. Gain: 28 days reads as nearly full beside 14 days, so urgency shows inside the two ruled tiers. Loss: every row at 30 days or more is equally full. The "refund window closing" words carry those rows. Pick: yes.

11. **Owed money per row (option, both).** What: each past-transit row adds "3 left · $2.10", in the words the package pill uses. The summary keeps today's whole-list figures (`PastTransitModel.owedCards`, `owedValue`). In Late cell, the card's own pill already shows it. Gain: it shows which claim is worth filing. Loss: one more figure per row. Pick: yes. Owner grant: no. A past-transit row is one package, and `outstanding-value-per-level` rules "Each package says 'N left · $Y'".

12. **Owed unknown (both).** What: when the bundle cannot compute the money (`owedValue` is nil), the rows still list. The summary drops the figures and says "Owed amounts could not be read. The list is complete." The ruler and the box say "owed unknown". It never shows $0.00 (`ux-unknown-is-not-empty`). Pick: yes.

13. **Open Duo, Late cell: today's route.** What: Card in Hand keeps the past-transit box, and the box adds "13 cards · $6.96 owed". Open shows the page on the right page, as today. Gain: no layout change on the open Duo. Loss: on the open Duo, Packages itself gains only the cell. Pick: yes.

14. **Open Duo, Claim ruler: Packages spreads.** What: Packages takes two pages, the list on the left and the Past 14 days desk on the right, with a large ruler. A press on a row marks its card on the left page and scrolls to it. Gain: it is a real two-page layout (list beside detail), and nothing sits across the hinge. Loss: Packages no longer opens one page on the open Duo. Departs from: `DuoSpread.spreads(tab:)`, which returns false for `.packages`, and item 35 a ("Keep Packages; add a Card in Hand control"). Card in Hand's control stays. Owner grant: yes.

15. **Refunded beside the late list.** What: `duo-card-in-hand` rules that "Refunded sits beside them". `PastTransitPage` draws no Refunded list, and no debt names the gap. The mockup draws a "Refunded · 2 packages" line, tagged "Today: ruled, not built". Pick: keep the ruled line. The gap needs a debt, which is outside this designer's write scope.

16. **Sizes not written.** The folded Duo is 466 x 678 pt with the system tab bar from y 595 (`duo-fold-and-keyboard`). The open Duo is 951 x 669 pt from the brief. The phone has no written size (`layout.py devices` reads unknown), so it is drawn 375 pt wide, the width of `testTalliesAreUnequalThirdsAt375pt`, at content height. The status bar foot is drawn at 20 pt (unmeasured). The open Duo's custom bar is a 64 pt pill under the right page, with its bottom gap unmeasured.

## Recommendation

Late cell, with the tab badge and the figure-only card words. It stays in the masthead's ruled vocabulary, works on every pose, and puts the count in the thumb zone. The Claim ruler is the stronger glance, at the price of a new masthead band and a new Packages spread. Its per-row track (item 10) can ride on the Late cell's list alone, if the owner likes the track but not the band.

## Sources

Apple pages read 2026-11-21, each answered 200, through `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:

- layout: safe areas, and size classes.
- typography: the Large (default) and AX5 Dynamic Type tables.
- accessibility: 44 x 44 pt default control, 28 x 28 pt minimum.
- buttons: 44 x 44 pt hit region.
- tab-bars: the tab bar floats, and a badge marks critical information.
- lists-and-tables: show text in a list.
