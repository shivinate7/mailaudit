# Lost mail line: notes

Designer kind: directed. Direction: glance-only: one line in the top band, tap to expand; never a separate screen.

Mockup: `docs/design/lost-mail-warning-directed-1.html`. Sample data only. Light theme only: the native app is held to light (`design-parchment-ledger`).

## Deep links

Each control on the page writes the URL hash. Keys combine with `&`.

- `#s=closing` (default), `#s=late`, `#s=open`, `#s=stamped`, `#s=quiet`, `#s=unread`, `#s=failed`, `#s=scrolled`, `#s=sync`
- `#slot=own` (default), `#slot=sync-first`, `#slot=lost-first`
- `#place=foot` (default), `#place=crown`
- `#o=last` (default, today), `#o=first`
- `#rh=mark` (default), `#rh=none`
- `#ax=cap` (default), `#ax=grow`
- `#h=postmark` or `#h=ruler` hides an option. Each option also has a Hide button.
- The focus ids for the waiting page are `lm-postmark` and `lm-ruler`. Both are on the folded Duo frame.

## Sizes

- Duo folded: 466 x 678 pt, from the brief. The repo's own reading, 382 x 644 pt of safe content (`duo-fold-and-keyboard`), is different. The two readings do not agree.
- Duo open: 951 x 669 pt. The hinge strip, x 455.5 to 495.5, holds nothing.
- Large phone: no size is written for it. `layout.py devices` printed `unknown` because the extras file names no `kind`. It is drawn at 375 x 812 pt, the width the repo measures (`testTalliesAreUnequalThirdsAt375pt`, `card-reserved-geometry`).
- AX5: the folded Duo is drawn at the largest accessibility size. The letterhead sizes are scaled from Apple's AX5 table. The title is approximate, because `minimumScaleFactor` shrinks it to fit.

## Apple pages read 2026-11-21

Each page answered 200: layout, typography (Large, xxxLarge and AX5 tables), accessibility, buttons, tab-bars and disclosure-controls.

- 44 x 44 pt is the minimum hit region. Every control in the mockup meets it.
- Footnote is 13 pt at the default size, 19 pt at xxxLarge and 44 pt at AX5.
- The tab bar floats above the content.

## Items

1. **Concept.** There are two options.
   - Postmark line: a sentence, with a ring that holds the oldest wait in days.
   - Thirty-day rule: a ruler from 14 to 34 days, with one pip per package and a red wall at 30. Its list draws each wait as a bar on the same scale.

   Gain of the ruler: distance to day 30 reads at a glance. Loss of the ruler: a pip carries no seller, pips crowd near 30, a bare count needs its tick labels, and the graphic does not grow with Dynamic Type. Pick: Postmark line.

2. **The list replaces the past-transit page.** Today the page opens on the open Duo only, from Card in Hand's "Past 14 days" box (`HandScreen.swift` `transitBox`, `PastTransitPage`, `hand-past-transit-open`). Here the same rows open in place under the line, on every working tab and on every device. Gain: the warning reaches the folded Duo and the phone, where today it never shows. Loss: the past-transit page goes away. The Card in Hand screen draws no letterhead. Proposal, not drawn: its box opens the same list in place on the answer page. Departs from: `duo-card-in-hand`, Ruled, "Late envelopes sit on their own page". Pick: replace. Owner grant: yes.

3. **Slot.**
   - Own line in the letterhead (default). Gain: lost mail and sync can both show. Loss: two lines where the record says one.
   - Shared advisory slot, sync first or lost first. Gain: one line. Loss: one warning hides while the other one fires (`#s=sync`).

   Departs from: `ruled-head-one-advisory-entrance` ("one line on the working screens"). Pick: own line. Owner grant: yes.

4. **Place.**
   - Under the still-missing line (foot). This is the default.
   - Above the seal (crown).

   At AX5 the letterhead pushes the foot line below the folded screen. The page says so in a drawn note. The crown puts the line first at every size. Loss: the seal stops opening the letterhead (`masthead-is-one-letterhead`). Pick: the foot at the default sizes, and the crown at the accessibility sizes. Owner grant: yes.

5. **A reserved slot.** In the own slot, the line is always present. With nothing late, it reads "No untracked package is past 14 days." (`ux-all-is-well`). Gain: the letterhead never changes height when the last late package is stamped, which `MastheadView` already promises. Loss: one 44 pt row on every tab. The shared slot shows nothing when nothing is late, as the sync line does today. Pick: reserve.

6. **Order.** "Oldest last" is today (`PastTransitPage` summary; `duo-card-in-hand`). "Oldest first" puts the nearest deadline at the top, under the thumb that just opened the list. Departs from: oldest last. Pick: oldest first. Owner grant: yes.

7. **Line words.** The line says "6 past 14 days · 2 past 30", then the money, then the ring. It reuses the page's name, "Past 14 days". Each row keeps "claim by <date>", and "refund window closing, contact seller" for a red row (`src/app.jsx`), and the drawer keeps today's footnote. No copy says "closes in N days", because the order date is only a proxy for TCGplayer's window (`lost-mail-flags-use-order-date`). VoiceOver reads one sentence, with the counts and the dollars. Pick: as drawn.

8. **The running head.** When scrolled, the 46 pt running head carries a red ring with the count (`#s=scrolled`). A tap scrolls to the top and opens the list. Gain: the warning outlives the first scroll, so the person does not have to hunt. Loss: a third item in a head that today shows the seal, the name and two figures (`masthead-running-head-sticky`). Pick: mark on. Owner grant: yes.

9. **Largest text.**
   - Cap the line at xxxLarge (19 pt) and offer the large content viewer, as items 104 a and 106 a did for the Post bar.
   - Let the line grow to AX5 (44 pt).

   Pick: cap.

10. **The drawer.** It overlays and never pushes the list: a fade and a 4 pt move over 220 ms, and none with reduced motion (`motion-disclosure-panels-arrive`). It takes the paper fill. That is the default, not owner-confirmed, for panels other than Sorted by and History (`head-panels-carry-paper-fill`). It stops above the floating tab bar and scrolls inside. A second tap on the line closes it, as the sync line does, and so does its own Close. A stamped row keeps its place until a reload (`PastTransitPage`). Pick: as drawn.

11. **Per-row money.** Each row shows "N left · $X", the `packagePill` form. Gain: the person sees what each claim is worth. Loss: `PastTransitRow` holds no per-row cards or money, so the model must add them. Pick: add.

12. **Stamps.** The Postmark list keeps today's row: Claim filed, Refunded, then More for the other four kinds (`PastTransitRowView`). The ruler list puts all six kinds in one Stamp menu per row. Either way there is no Lost kind, because item 25 is deferred. Pick: today's row.

13. **States.** "Not read yet", "could not be read" with a Try again button, and "No untracked package is past 14 days" are three separate states (`ux-unknown-is-not-empty`). Pick: as drawn.

14. **The open Duo.** Tally spreads over two pages. The line and its list stay on the left page, under the letterhead, and the Tally detail stays on the right page. Not drawn, as an option: the list opens on the right page instead. Packages draws one page on the open Duo today (`DuoSpread.spreads`). It is unchanged and not drawn. Pick: left page.

15. **Shared-slot colour.** On the manila fill, amber measures 4.19:1 and red 4.31:1, so both fail 4.5:1 for small text. The words use manilaInk (5.04:1), and the colour stays in the ring. With a package past 30, the slot takes the redSoft fill with red words (4.76:1). Pick: as drawn.

16. **Card flags.** The web card's date line says "⚠ 27d — may be lost", and the native card has no flag (`native-card-lost-flags-unbuilt`). The mockup tags it Today and leaves it as it is. The line adds to the flag and does not replace it.

17. **Thumb reach.** The line sits at the top, out of one-hand reach. The running-head mark helps only after a scroll. Not drawn: scroll the line to the top when it opens, so the list gets more room. That would move the tapped line under the finger (`no-layout-shift-under-pointer`), so it is not proposed.

## Gaps for others

- `PastTransitModel` starts at `owedCards = 0` and `owedValue = "$0.00"`, so before its first load it reads as loaded and empty. Item 13 needs a separate unread state.
- `PastTransitRow` has no per-row cards or money (item 11).
- `check_ios_mockup.py` flags `system-font` on the Cochin content font. It does the same on `duo-hand-gaps.html`. The repo sets words in Cochin (`typography-cochin-and-mono`), and the page chrome uses `-apple-system`. This may be a false alarm.
