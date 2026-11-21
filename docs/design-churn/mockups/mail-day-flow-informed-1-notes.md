# Mail day flow, informed designer 1: notes

Mockup: `docs/design/mail-day-flow-informed-1.html`. Open it from disk. Designer kind: informed. Blind designers in this run: 2.

Deep links (each opens one concept in one state; add `&k=1` for the keys up):

- Hand on every screen: `#c=hand&s=start`, `typing`, `envelope`, `tie`, `post`, `nomatch`, `end`, `well`, `orphaned`, `transit`.
- The pile: `#c=pile&s=start`, `count`, `work`, `tie`, `post`, `pile-done`, `nomatch`, `no-count`, `end`, `well`, `resume`.

Focus ids for the waiting page: `concept-hand` and `concept-pile` (each concept), `hand-folded` and `pile-folded` (the folded frame of each). Each concept has "Hide this concept". Each sub-option has its own Hide. "Show hidden options" brings them back.

## The pain

The person's words: "I just want to get through the pile and know I'm done." Today's app makes that hard in six places. Each is read from origin/main at d13cf0b.

1. The day starts one tap away. The app opens on Ledger (`RootView.startTab`, default `.ledger`), and Packages is the last tab.
2. The folded phone has no Card in Hand. It opens only on two pages (`PackagesTab.twoPages`, `HandScreen.swift`). Folded, in one hand, the person scrolls Packages cards to find each card.
3. A fold loses the place. Folding makes `twoPages` false, so the HandScreen overlay goes. Close clears the query, the shown envelope and the receipt (`@State` in `HandScreen`). Leaving the app loses the held card too (`HandModel` lives in memory only).
4. "How much is left" has no answer for the day. The head counts copies across all live packages (`HandScreen.counts`, "N in · M out"). The masthead's "still missing" line is ledger-wide (`MastheadModel.missingLine`). Nothing counts the pile on the table.
5. There is no end. Part 7 of `duo-hand-gaps-notes.md` (end of mail day) is unbuilt. The empty query shows the start hint (`HandScreen.answer`).
6. An odd envelope is a dead end. "No open envelope holds X" has no control (`HandScreen.answer`). Recording it means leaving for Orphaned and typing it again.

## The two concepts

Both keep every ruling in `duo-card-in-hand` and `new-envelope-ends-an-envelope`: query left, answer right on two pages; the sender pinned; "Still owed here" on the order line (item 78 a); the accent bar on the typed card's line (item 77 a); the 53 pt Post bar above the keys with its receipt (items 103 b, 104 a, 106 a); the held chip; the match hold after a tap (item 48); Suspense as several names (item 76 a); Title Case buttons (item 81 b); the Duo tab bar under the right page and hidden under the keys; Orphaned spread over both pages (item 24 b). Nothing checks in from typing; Post never runs by itself (`orphaned-mail-never-decides`).

### Concept: Hand on every screen (close to today)

Today's tabs, today's first screen, today's Card in Hand. It closes the gaps:

- Card in Hand on one page, folded and on the phone. Lines in the middle; the field, its matches and New Envelope in a dock at the foot, in thumb reach (`ux-thumb-zone`). The dock sits on the keys when they are up.
- Its place is kept across Close, a fold, a tab change and leaving the app. The Packages control reads "Card in Hand · resume" while a card is held or typed.
- A count line: "Today N envelopes done · M cards in".
- Set Aside on "No open envelope holds X" and on an undecided tie.
- Day's End: today's pile, what is not normal, and "All is well." when nothing is. "Done for Today" closes it.
- How much is left: the physical pile says it. The app does not count it.

### Concept: The pile (the bold one)

A new structure for the day, with Card in Hand inside it:

- Start: "Today's Post". Count each small pile with 44 pt steppers, or skip the count.
- Middle: a row of drawn envelopes, grouped by pile, with the count left in large figures. The current envelope is lifted in accent. Ended ones carry a tick (done), a gap (short) or a band (set aside), so shape carries the state as well as colour. Under it, "Pile 1 of 2 · envelope 3 of 4" and the cards so far.
- Each envelope ends one of two ways: Next Envelope (fills in accent once every line is in) or Set Aside. So the count left is always true.
- End of a pile: a one-row receipt in the Post bar's slot, "Pile 1 done. 4 envelopes · 2 to go".
- End of the day: a wax seal (the palette's wax tokens) lands once, with the count of envelopes. Under it, "For later": short envelopes, set-aside envelopes, released cards and the past-14-days box, each with a control that leads on, or "All is well.".
- On two pages, the left page also lists the pile envelope by envelope.

## Design choices

1. **The concept.** What: Hand on every screen, or The pile.
   - Gain (hand): the least to build; no new state; nothing new to learn.
   - Loss (hand): "how much is left" stays in the person's head; the end is a page, not a moment.
   - Gain (pile): each next step is one of two buttons; the count left is always on screen; the end is a clear moment.
   - Loss (pile): a count step at the start, more state to keep, more to build.
   - Pick: The pile. It answers all three parts of the job: the next step, how much is left, and done.
   - Departs from: item 35 a, "Keep Packages; add a Card in Hand control". The pile keeps Packages and adds a "Mail Day" control, which opens Card in Hand inside the pile.
   - Owner grant: yes.

2. **Card in Hand on one page.** Both concepts. What: Card in Hand on the folded Duo and the phone, with the dock at the foot.
   - Gain: the folded phone in one hand does the whole day.
   - Loss: on one page the lines get about 150 to 250 pt between the head and the dock. With the keys up, about two lines show; the lines scroll.
   - Pick: yes.
   - Departs from: the default "the control sits at the top of Packages, on two pages side by side only" (`duo-card-in-hand`, Defaults; default, not owner).

3. **Keep the place.** Both concepts. What: the hand state (query, held names, released names, the envelope so far) and, in the pile, the pile itself, survive Close, a fold, a tab change and leaving the app.
   - Gain: nothing in the flow loses the person's place, as the brief asks.
   - Loss: it needs a store. Two places fit. (a) Device only, with SwiftUI scene storage: no ledger change, but it does not follow the person to the Mac. (b) A new optional field in the saved ledger: synced, but it widens `saved-state-shape` and needs a migration under `storage-keys-are-frozen`.
   - Pick: (a), device only. The pile is one sitting on one device.
   - Departs from: `HandModel.close` clearing the shown envelope, and `HandScreen` `@State`.
   - Owner grant: yes, only if (b) is chosen. (a) changes no saved state.

4. **Count the pile.** The pile only. Options:
   - Small piles: one stepper per pile, as the person sorts. Gain: matches the brief's "sort it into small piles"; a pile end is a small win. Loss: more taps at the start.
   - One count. Gain: one stepper. Loss: no pile ends.
   - Skip the count: always offered. The count shows "?" and "End the Pile" ends the day by hand (`ux-unknown-is-not-empty`: unknown never reads as zero).
   - Pick: Small piles, with Skip always there.

5. **Next Envelope.** The pile only. What: the act that ends an envelope.
   - Gain: in a pile the word says what happens next.
   - Loss: a second name for the act that New Envelope names today (`ux-one-plain-name`).
   - Pick: Next Envelope in the pile, New Envelope in Hand on every screen. The rule in `new-envelope-ends-an-envelope` holds as it is: a held card becomes released.
   - Departs from: the label "New Envelope". Owner grant: yes (a ruled label).

6. **Next Envelope fills when the envelope is whole.** What: the button is outlined until every line is in, then filled in accent.
   - Gain: the next step is obvious; no layout moves (colour only, `no-layout-shift-under-pointer`).
   - Loss: a short envelope never fills it. That is on purpose: a short envelope is a pause.
   - Pick: yes.

7. **Set Aside.** Both concepts. What: one press records the envelope in Orphaned with the card names typed or held, then ends the envelope. It checks nothing in and assigns nothing.
   - Gain: an odd envelope is set aside in one press, with no second typing.
   - Loss: a second way to record an envelope beside Orphaned's own form.
   - Pick: yes. It records names only, so `orphaned-mail-never-decides` and `orphan-entry-takes-one-input` hold.
   - Where: in the pile, in the dock beside Next Envelope; in Hand on every screen, on the no-match answer and the tie.
   - Owner grant: yes. It adds a way to write an Orphaned envelope.

8. **How the day's end opens.** Hand on every screen. Options:
   - A Day's End control in the head. Gain: shows only on purpose. Loss: one more control.
   - The empty field, part 7's pick. Gain: no new control. Loss: it appears unasked, and it is not a moment.
   - Pick: the control. Each option has its own Hide.

9. **The end in the pile.** What: the wax seal, then "For later".
   - Gain: the end is a moment, and odd things are set aside in one list with a way on.
   - Loss: one decorative element. It lands once (`motion-use-just-became`); reduced motion draws it at rest (`motion-reduced-leaves-it-drawn`).
   - Pick: yes.
   - Departs from: part 7, which gave short rows no Open. Here a short row opens its Packages card, where its stamp lives.

10. **The lone match on one page.** What: on one page, a single match that already equals the typed text is not drawn.
    - Gain: about 60 pt more for the lines.
    - Loss: it differs from two pages, which keep the list.
    - Pick: yes. Departs from: `HandScreen.matches` (default, not owner).

11. **The cards so far on one page, in the pile.** What: they ride on the pile note ("Pile 1 of 2 · envelope 1 of 4 · Sol Ring, Command Tower ×2") instead of a row of their own.
    - Gain: 44 pt more for the lines.
    - Loss: it clips sooner.
    - Pick: yes.

12. **AX5 on the folded Duo.** What: the head and the answer scroll as one; the Post bar and the dock stay pinned at the foot. Dock buttons and the pile count stop at xxxLarge, as the Post bar ruling does (item 104 a), with the large content viewer. The field's text scales in full. The head shows the seller only (item 105 a).
    - Gain: Post, the field and the end-of-envelope buttons stay in reach at the largest size.
    - Loss: at AX5 the lines scroll under a tall dock.
    - Pick: yes. Owner grant: yes, for capping the dock buttons (item 104 a covers the Post bar only).

## Frame

- Device sizes: `layout.py devices` gives `unknown` for this repo, and `layout.json` lists no sizes. The Duo sizes are the brief's: folded 466 x 678 pt, open 951 x 669 pt, fold at x 455.5 to 495.5. They match `duo-fold-and-keyboard`.
- The large phone has no written size, and the brief gives none. Drawn at the folded size as a stand-in, resizable by dragging. Its layout is the one-page layout. Size: unmeasured.
- Folded keys: 289 pt, the taller reading (`duo-fold-and-keyboard`), drawn from the frame top, since no drawn top was read on the outer screen. Open keys: drawn from y 405. Status bar: 20 pt, unmeasured.
- Light theme only: the native app is held to light. There is no dark deep link.
- Tokens: `shared/tokens.json`. Cochin sets words, Menlo sets numbers, the system font sets iOS chrome.
- Apple pages, read 2026-11-21 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`, each 200: layout, typography, accessibility, buttons, tab-bars, sheets. Used: the Dynamic Type tables (Large: Body 17, Title 2 22, Caption 1 12, Footnote 13; xxxLarge: Body 23, Title 2 28, Caption 1 18, Footnote 19; AX5: Body 53, Title 2 56, Caption 1 43, Footnote 44); controls 44 x 44 pt. The layout page no longer lists device sizes (updated 2026-09-09), so no phone size came from it.
- Sample data: eight packages and one older Orphaned envelope, all invented, in the ledger's shapes.

## Checks run

- `check_ios_mockup.py`: exit 1, `system-font` only. It faults the ruled Cochin (`typography-cochin-and-mono`). The same fault shows on `duo-hand-gaps.html` and `duo-hand-held-box.html` on main. Possible false alarm; see the report.
- Headless Chrome: every deep link renders with no script error. A click-through proves Start, a line tap, Next Envelope, typing on the drawn keys, Set Aside, the Orphaned badge, leaving and coming back, a page reload, the tie, Post, a tab change and back, Day's End and the past-14-days page.
- impeccable critique, single context (a designer cannot spawn). Detector: one finding, the cream palette. False alarm: the palette is ruled (`design-parchment-ledger`).
