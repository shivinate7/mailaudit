# Tracking checker, directed designer 1: notes

Designer kind: directed. Direction: status-chip: one verdict chip per order, nothing else.

Mockup: `docs/design/tracking-checker-directed-1.html`. Screen: the tracking checker (debt
`tracking-checker-unbuilt`, owner idea 2026-10-27). Every figure on the page is a sample. Light
theme only: the app and the native client are held to light (`design-parchment-ledger`).

## Deep links

- `#s=all`: every frame.
- `#s=flip`, `#s=slot`: one concept, all four frames.
- `#s=flip-reading`: Flip chip with every chip on its reading face.
- `#s=slot-popover`: Slot verdict with the reading open on the folded and phone frames.
- `#s=slot-detail`: Slot verdict, open pose, reading on the right page.
- `#s=offline`: every tracked chip reads "Can't read".
- `#s=ax5`: both concepts, folded, at AX5 text.

Focus ids for the page writer: `flip-chip` (Flip chip, folded, first card) and `slot-chip` (Slot
verdict, folded, first card). The two show different pictures: one chip on the order id row, one
chip in the status slot.

## Choices

1. **Flip chip.** Today's "● tracked" glyph (`src/app.jsx` `PackageCard`, `tracked`) becomes a
   chip on the order id row (`PackagesView.swift` `header`, the `order-link` row, 45 pt). The chip
   shows the verdict. A tap flips it in place to the latest scan and its time. Both faces share
   one grid cell, so the cell is the taller face and a flip moves nothing (the trick of
   `PackagesView.statusSlot`). Gain: no new height on a card; the scan is one tap away and never
   leaves the card. Loss: the reading face holds two short lines, so a long scan text truncates;
   the number and claim date are not shown. Pick: yes.
2. **Slot verdict.** The verdict takes the status slot and carries the count: "Stuck 5d no scan ·
   4 left". A tap opens a popover with the scan, time, carrier, number, claim date, Copy number
   and Stamp. Gain: one chip answers "where is it" and "what is still out"; the reading has room
   and two ways on (`ux-no-dead-end`). Loss: the slot's invisible widest pill grows from "99 left ·
   refunded" to "Delivered 9d ago · 99 not here", so every seller column is narrower, tracked or
   not; the count pill no longer reads the same on tracked and untracked cards. Pick: no, keep as
   the second option. Departs from: `PackagesView.statusSlot`, the slot holds the count pill or
   RECEIVED. Build note: the chip is a control, so its hit area is 44 pt around the 28 pt chip.
   In compact width a SwiftUI `.popover` adapts by default; the build sets
   `.presentationCompactAdaptation(.popover)` (SwiftUI docs, read 2026-11-21: "Specifies how to
   adapt a presentation to compact size classes"), or the reading becomes a sheet that covers the
   list. Copy number answers "Copied" at the press; Stamp opens the six existing stamp kinds
   (`one-stamp-per-package`) in the reading.
3. **Verdicts and colours.** On its way (accent), Delivered today with cards out (amber), Delivered
   a day or more with cards out (red), Stuck (amber), Returned (red), Checking (dashed, soft ink),
   Can't read (manila), Delivered and all checked in (green, Flip chip only; Slot verdict keeps
   RECEIVED). Colours keep their app meanings (`orphaned-colours-by-meaning`). Gain: a red chip
   means act today. Loss: amber and red chips sit beside the amber and red lost-mail flags of
   untracked cards, which count from a different date. Pick: yes.
4. **Delivered but not here.** Same day: amber, "Delivered today · not here yet", since the mail
   may still be in the box. From the next day: red. Gain: no false alarm before the person has
   checked the box. Loss: the owner said "If it says delivered and it isn't here, I want to know
   today"; amber on the day may read as less than that. The toolbar's "Delivered today: red" shows
   the other side. Pick: amber. Owner grant: yes.
5. **Stuck threshold.** Drawn as no new scan for 5 days. No record sets a figure. Gain: early
   enough to act inside the 30-day window (`lost-mail-flags-use-order-date`). Loss: unmeasured;
   too short cries wolf. Owner grant: yes.
6. **A stamp mutes the chip.** A stamped order keeps its chip, in soft ink with no fill. This
   extends `stamped-package-hides-lost-flag` (the order is handled by hand) by analogy. Gain: no
   nag on a claim already filed. Loss: a new scan after the stamp is easy to miss. Owner grant: yes.
7. **Untracked cards stay as today.** "○ untracked" and the lost-mail flags stay, and tracked
   cards still get no lost-mail flag (`duo-card-in-hand`, Tracked late packages, owner 15:34 CDT;
   `lostMail` in `src/view-rules.mjs`). The chip is what a tracked card gets instead. Gain: no
   change to a ruled flag. Loss: two warning systems, one per kind of package. Pick: keep, as
   today's behaviour (`building-port-keeps-behaviour`).
8. **Unknown is not empty.** Checking (no scan read yet) and Can't read (the carrier gave no
   answer) are their own chips, never blank and never "On its way" (`ux-unknown-is-not-empty`).
   Can't read keeps the last scan read on its reading face. Gain: a failed read never looks safe.
   Loss: two more chip looks to learn. Pick: yes.
9. **Open pose, Flip chip.** One grid in two page columns, the fold as the gutter; Card in Hand
   (`hand-open`) stays at the top. Gain: twice the cards on screen. Loss: the grid reads left,
   right, left, so the list order runs across the fold. Departs from: `DuoSpread.swift`
   `DuoTab.packages` (Packages keeps one page on the open Duo, default, not owner).
10. **Open pose, Slot verdict.** The list on the left page, the reading on the right page, a list
    beside its detail (HIG layout). The picked card carries an accent bar in its gutter, as Card
    in Hand marks a tapped row (`duo-card-in-hand`). The right page starts with one sentence and
    one control. Departs from: `DuoSpread.swift` `DuoTab.packages` and `HandScreen.swift`
    `PackagesTab` (one page, default, not owner).
11. **Tab badge option.** Off by default, "Show tab badge option" shows it: a red count on the
    Packages tab of red and stuck chips. Gain: a warning reaches the person before they scroll.
    Loss: it breaks the direction ("nothing else") and adds a second place for one fact. Pick: no.
    Owner grant: yes, if kept.
12. **AX5.** Large Body 17 pt to AX5 Body 53 pt; `Font.cochin` and `Font.mono` scale relative to
    `.body` (`native/Manifest/Theme.swift`), so content is drawn at size x 53/17. Flip chip takes its
    own row under the order id; Slot verdict's slot drops under the seller. The system tab bar is
    drawn at its default size. Gain: nothing clips. Loss: one card fills the screen. Pick: yes, a
    stack that fits (`ux-swift-same-intent`, `ViewThatFits`).
13. **Data source.** `orderwand-csv` says the export holds no tracking numbers or carriers. The page
    makes no claim about where a scan comes from or how often it is read
    (`ux-statements-are-true`). A builder needs a source first; that is outside this mockup. Not a
    design choice: no pick.

14. **Flip mark and dot.** The verdict face ends in a small two-arrow mark (drawn, an SF Symbol in
    the build) so the chip reads as something that turns over, and the reading face keeps the
    verdict's coloured dot. Gain: the flip is findable, and a flipped chip still says how worried
    to be. Loss: one more glyph per chip. Pick: yes (from the critique).
15. **A past claim date is not shown.** Returned and other red readings past 30 days say "refund
    window closing", not a date already gone, as the past-transit page does (`HandScreen.swift`
    `PastTransitRowView`). Gain: no stale date. Loss: the exact date is gone from the reading.
    Pick: yes, as today's behaviour.

## Sizes

- Folded Duo: 466 x 678 pt, tab bar from y 595 pt, 83 pt tall (`duo-fold-and-keyboard`).
- Open Duo: 951 x 669 pt, fold 455.5 to 495.5 pt (the brief and `duo-fold-and-keyboard`). Nothing
  sits across the fold. The open tab bar height is unmeasured; drawn at 83 pt.
- Large phone: no size is written (`layout.py devices` says unknown; the brief gives none). Drawn at
  the folded Duo's 466 x 678 pt and labelled so.
- Status bar foot: unmeasured, drawn at 20 pt as the earlier Duo mockups do.

## Apple pages read 2026-11-21 (each answered 200)

- HIG layout: safe areas; lay out by size class.
- HIG typography: Large (default) and AX5 tables (Body 17/22 and 53/62; Caption 2 11 and 40).
- HIG accessibility: default control 44x44 pt, text 17 pt.
- HIG buttons: hit region at least 44x44 pt.
- HIG tab bars: the tab bar floats above content at the bottom; it is for navigation, not actions.
- HIG sheets, toolbars, lists and tables: read; the reading uses a popover-sized card, not a sheet.

## Native or web-like

- Flip chip: native. A chip in a card row, the system tab bar, no web control.
- Slot verdict: native. A popover from a control, list beside detail when open.

## Checks

- `check_ios_mockup.py`: one fault, `system-font`, because content uses Cochin first. The repo rules
  Cochin for content (`typography-cochin-and-mono`); chrome uses the system font. Every Cochin
  mockup in `docs/design/` faults the same. Likely a false alarm of the check; reported.
