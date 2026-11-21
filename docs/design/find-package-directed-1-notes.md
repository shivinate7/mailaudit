# Find a package: directed designer 1, search-first

Designer kind: directed. Direction: search-first. One box finds an order by any word. The results are ranked, and nothing else is on the screen.

Mockup: `docs/design/find-package-directed-1.html`. It is a mockup only. Nothing is built, and no undecided item ships.

## Frame

- Packages tab, native app. The poses come in this order: Duo folded, Duo folded at AX5, iPhone 18 Pro, then Duo open.
- `layout.py devices` prints `unknown` for this repo, so the sizes come from the brief and the records:
  - Duo folded: 466 x 678 pt. The tab bar starts at y 595 (`duo-fold-and-keyboard`).
  - Duo open: 951 x 669 pt, with the fold at 455.5 to 495.5 pt. The Duo bar is 76 pt (`DuoBarMetrics.height`, PR 238, the step 8 build pull request).
  - iPhone 18 Pro: 402 x 874 pt, with the tab bar from y 791. These figures are in PR 238's step 8 notes, on the unmerged branch `origin/step8-build`.
- Keys:
  - Folded: drawn from y 389. That uses the 289 pt keyboard frame reading. The drawn top on the outer screen is unmeasured.
  - Open: the panel is drawn from y 405.
  - 18 Pro: no keyboard height is measured, so its frames show the keys down.
- The status bar foot is drawn at a 20 pt floor. It is unmeasured on every device here.
- One theme, light. The native app is held to light (`UIUserInterfaceStyle: Light`). The page has no dark switch.
- Deep links:
  - `#c=index|deck` picks one concept.
  - `s=rest|due|typed|tie|narrow|open|none|received|loading|failed|empty` picks a state.
  - `k=up|down` sets the keys.
  - Join them with `&`, for example `#c=deck&s=tie&k=down`.
- Focus ids for the waiting page: `focus-index`, `focus-deck` and `focus-due`.
- Apple pages were read 2026-11-21 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`. Each answered 200.
  - typography: the Large (default) row is Body 17/22, Footnote 13/18 and Caption 2 11/13. The AX5 row is Body and Headline 53/62, Footnote 44/52 and Caption 2 40/48.
  - search-fields: the field holds a Search icon, a Clear button and placeholder text. "Place search at the bottom if there's room." Tokens and suggestions are native options.
  - accessibility: controls are 44x44 pt by default and 28x28 pt at the least. Text should scale to at least 200 percent.
  - layout: lay out by size class, and respect the safe areas.
  - tab-bars: a tab bar is for navigation, not actions.
  - buttons and lists-and-tables were read; no figure is taken from them.
- Item 101 a ("the band under the pill is solid paper, ruled") comes from the brief. `duo-card-in-hand` on main does not hold it. Item 95 (whether the native pill stops floating) is still open, so the band is drawn for it.

## Items

1. **Concept: Thumb Index.** New.
   - What: the box sits at the bottom of the screen. The best match sits right above it, and worse matches stack upward. A tap opens the whole order. On the open Duo, the results take the left page and the chosen order takes the right page.
   - Gain: the best answer is always under the thumb (`ux-thumb-zone`). At AX5 with the keys up, it is the one result that stays whole. The open Duo becomes a list beside its detail, as the layout page's size-class rule asks.
   - Loss: the eye starts at the bottom, which is unusual for a list. Opening an order is one more tap than the Deck.
   - Pick: Thumb Index.
   - Departs from: `PackagesView.body`, the full card list. Not blocking.
   - Owner grant: yes.
2. **Concept: Deck.** New.
   - What: each match is one whole order, ready to tick, on its own page. Swipe, or press ‹ ›, for the next match. A strip shows the place, such as "1 of 5" and "3 equal". On the open Duo, two orders sit side by side.
   - Gain: no tap is needed to tick the best match. On the Duo, two near-equal orders can be compared, which `search-filters-inside-package` wants ("near-duplicate candidates can be compared side by side").
   - Loss: on the folded Duo with the keys up, only one line of the order shows. At AX5 with the keys up, only the order's head shows. You do not see the other matches at a glance, and the strip sits at the top, away from the thumb.
   - Pick: not picked. It is second to Thumb Index.
   - Owner grant: yes.
3. **Nothing else on the screen.** New.
   - What: at rest, the screen holds the running head, the box and the tab bar. The full masthead, the ruled row (canceled and stamped cells) and the card list leave Packages.
   - Gain: the box is the one thing to do with an envelope in hand.
   - Loss: you can no longer browse every order on Packages. The masthead's figures leave this tab.
   - Pick: apply.
   - Departs from: `MastheadScreen` on every tab, and `StampedRow` and the canceled cell on Packages (`PackagesView.body`, PR 238 notes item 7). The ruled row would move to the Ledger tab's View group, as Showing and Orders from did (owner item 47 a). Not blocking.
   - Owner grant: yes.
4. **Due Now, the empty box ranks too.** New sub-option of both concepts.
   - What: with no words typed, the list shows the unreceived orders that were ordered 5 to 14 days ago, oldest first. 14 days is the amber flag (`lost-mail-flags-use-order-date`). 5 days is a guess and unmeasured.
   - Gain: the likely envelopes are one tap away before you type anything.
   - Loss: the screen is not blank at rest, so this bends the direction.
   - Pick: not picked; keep the blank page. The "Hide Due Now" control removes it.
   - Owner grant: yes.
5. **The ranker.** New.
   - What: every typed word must hit somewhere in the order, or the order drops out. Each word scores its best field:
     - an order number of 3 or more characters scores 100;
     - a seller scores 60 at the start of a word, 40 inside one;
     - a card name scores 50, or 30;
     - a set scores 25, or 15;
     - a month name scores 35;
     - a stamp's text scores 20.
   - The order's score is the sum of its words. Equal scores are shown as equal, never guessed apart. `rankCandidates` never picks one either. Among equal scores, newest comes first, which is the web default `sortPackages "newest"`.
   - Gain: "light" puts the seller Lighthouse Games above four orders that hold a Lightning card. "bolt jul" finds the one July order.
   - Loss: the weights are a designer's guess and are unmeasured on real orders.
   - Pick: apply.
   - Departs from: `lineHit` and `filterPackages` in `src/view-rules.mjs`, which filter with no rank and keep the input order. Not blocking.
   - Owner grant: yes.
6. **Month words match.** New.
   - What: "jul" or "july" matches an order placed in July. The match is marked on the result's date.
   - Gain: it covers "roughly when they bought" from the job.
   - Loss: a card named after a month also matches as a card. The higher score wins.
   - Pick: apply.
   - Departs from: `lineHit`, which reads no date. Not blocking.
   - Owner grant: yes.
7. **A result is the whole order.** New.
   - What: a result row names the order, and the words that matched are marked inside the order's own text. A glyph shows which field matched: card, set, order number, month or stamp. A seller hit is marked in the seller's name. Opening a result shows every line of the order.
   - Gain: there is no "one-line lie", so there is no "+N more lines, show all" footer and no reveal.
   - Loss: the reveal code (`revealed`, `PackageRow.revealFooter`) has no job on Packages.
   - Pick: apply.
   - Departs from: `search-filters-inside-package` and `filterPackages`, which keep only the matching lines. This serves that record's own aim. Not blocking.
   - Owner grant: yes.
8. **Ranking holds while you tick.** Kept behaviour.
   - What: the list re-ranks only on a keystroke. A tick, Mark All Received or a full order never moves a result. A fully received order stays in the list until the next keystroke.
   - Source: `no-layout-shift-under-pointer` ("Sort order is snapshotted"), and the hold rule of owner item 85 in `duo-card-in-hand`.
   - Owner grant: no.
9. **Received, canceled and refunded orders.** Kept behaviour.
   - Received orders stay hidden. The search starts on unreceived, because `hideDone` starts true (`ruled-head-showing-unreceived`). When only received orders match, the screen says "Only received orders match "moth"." and offers Show Them.
   - Canceled and refunded orders stay out (`canceled-orders-leave-the-list`, `a-refund-leaves-every-count`).
   - A stamp's label and note still match (`filterPackages`, `stampText`).
   - Owner grant: no.
10. **The band under the box.** It follows item 101 a; item 95 is open.
    - What: the box sits in a band of solid paper, with a 1 pt line rule on top. The list ends at the rule. This is as built in PR 238 (`View.findPill`, `findPillRule`).
    - On the open Duo, Thumb Index puts the band under the left page's results. Deck puts it under the left order.
    - Departs from: `findPillOnDuo`, which floats the pill on the right page. Not blocking.
    - Owner grant: yes, for the open Duo placement.
11. **The count in the box.** New.
    - What: a figure in the box, such as "5", gives the number of matches. It is spoken as "5 matches". Its slot is a fixed 28 pt, so the field never changes width.
    - Gain: the answer shows where you type (`ux-answer-at-press`).
    - Loss: a bare figure is easy to miss.
    - Pick: apply.
    - Owner grant: no.
12. **Equal matches.** New.
    - What: in Thumb Index, a gold left rule marks each order that ties with the best one. One sentence, "3 orders match equally well.", sits above the group. In the Deck, the strip says "3 equal".
    - Gold is ornament only (`palette-gold-is-ornament-only`), and the words carry the meaning.
    - Owner grant: no.
13. **The states.** Each state other than results shows one sentence and one control (`ux-unknown-is-not-empty`):
    - Reading: the box is off. There is no control, because the read ends by itself.
    - Read failed: Try Again.
    - Empty ledger: the box is hidden. The control is Open Sync, because CSV import stays on the web (`csv-import-stays-web`).
    - No match: Clear Search.
    - Only received: Show Them.
14. **The placeholder.** The box says "Seller, card, order or month" at normal sizes, and "Find" at accessibility sizes, as `FindPill.promptText` does. The longer wording was cut on the 18 Pro.
    - Departs from: "Find card, set, seller, order". The new words name the month search and drop set. Not blocking.
    - Owner grant: no.
15. **AX5 on the folded Duo.**
    - Thumb Index: the running head leaves, because its 44 pt cannot hold AX5 type (debt `masthead-at-ax-sizes`). The count and the date share one line. The best match stays whole above the box, keys up or down.
    - Deck: with the keys up, only the order's head shows. Search, or a tap, drops the keys.
16. **Card in Hand stays.** On the open Duo, the Card in Hand control stays in the running head (owner item 35 a).
    - The ranker covers the card-name search that `handHits` does. One home in `src/view-rules.mjs` should serve both (`building-one-home-per-capability`). That is product code, outside this designer's scope.
17. **Haptics.** No haptic is drawn. A tick is the house's existing check-in, and this mockup changes nothing about it (`ux-haptics-feel-substantial`).

## Guesses and unknowns

- The ranker weights and the 5-day start of Due Now are not measured.
- The folded keys' drawn top, every status bar foot and the 18 Pro keyboard are unmeasured.

## Checks

- `check_ios_mockup.py`: one fault. It says "a font declaration starts with cochin". Cochin is the app's content font (`typography-cochin-and-mono`). PR 238's mockups and main's Duo mockups fail it the same way, so it may be a false alarm.
- `label_once.py` on the rendered page: every hit is data repeated across the nine frames, such as seller names and the typed word. None is a label.
- Self-check, design review style: Thumb Index is native, because it uses a bottom search field, a list, a pushed detail with a back control, and the system tab bar. Deck is native: it is a paged TabView. The structure is new in both, because Packages stops being a card list.

## Critique

Impeccable critique, native method: a design review only, with no detector.

- P1, fixed: the folded Deck's lines drew a circle around each check box. The CSS for the search box also matched the line box. The search box is now `.findbox`.
- P1, fixed: AX5 frames clipped the running head, the back control, the arrows, the cells and the line prices. Each now scales or wraps, and the running head leaves at AX5.
- P2, fixed: the placeholder was cut on the 18 Pro (item 14).
- P2, fixed: the count in the box had no spoken meaning. It now reads "N matches".
- P2, fixed: the seller showed twice when the seller matched. It is now marked in the name.
- P1, open: the Deck hides the order's lines while the keys are up on the folded Duo. A fix moves the matched line first, which departs from the order's A to Z lines (`groupPackages`). See Input Needed.
- P2, open: Thumb Index's back control sits at the top. The system edge swipe also goes back.
- P2, open: the card glyph and the set glyph look alike at 14 pt. The spoken label tells them apart.

## Input Needed

- Pick Thumb Index or Deck, or neither.
- Keep the blank box at rest, or let it rank Due Now.
- Should a matched line rise to the top of its order while you search? It would fix the Deck's folded keys-up view and help Thumb Index too, but it departs from the A to Z line order.
- Should Packages give up browsing entirely, with Tally kept as the list view? Or should an empty box show every unreceived order, as today?
