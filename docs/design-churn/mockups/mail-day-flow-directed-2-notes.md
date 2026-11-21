# Mail day workbench: notes

Mockup: `docs/design/mail-day-flow-directed-2.html`. Open it from disk.

Designer kind: directed. Direction: workbench: everything visible at once, no steps.

Deep links: `#s=start`, `#s=working`, `#s=typing`, `#s=held`, `#s=post`, `#s=nomatch`, `#s=done`, `#s=away`, `#s=failed`. The card field is docked low by default on one-page frames; add `&f=top` to put it at the top (item 17). Add `&c=bench` or `&c=wall` for one concept, and `&d=folded`, `&d=open`, `&d=phone` or `&d=ax5` for one device. `#hide=wall,count` hides options. With no hash, the page reopens where the viewer left it (browser storage), else on `#s=working`.

Every drawn control works. The "Card in hand" buttons above each concept type a sample card. "Leave the App" and "Open Again" show that the bench comes back as it was left. "Make Saves Fail" makes every write refuse, so each failed state can be pressed. Each option has a Hide button, and "Show hidden options" brings them back.

Focus ids for the waiting page, one per option: `opt-bench` and `opt-wall` (item 1), `opt-piles` and `opt-count` (item 3). Each shows its own option in its own state.

## Frame

- Duo folded first: 466 x 678 pt, the outer screen (`duo-fold-and-keyboard`, re-measured 2026-11-08). The system tab bar starts at y 595 pt and is 83 pt tall. The keys are drawn 289 pt tall, the taller of the two outer readings, so they start at y 389 pt.
- Duo open: 951 x 669 pt. The fold strip is 455.5 to 495.5 pt, and nothing sits across it. The keys draw from y 405 pt. The tab bar sits under the right page (`duo-card-in-hand`, Tab bar; drawn as in `docs/design/duo-hand-gaps.html`).
- Large phone: `layout.py devices` gives `unknown`, `lint/layout.json` lists `iphone-regular` with no size, the brief gives no size, and no Apple page I read gives one. So 430 x 932 pt is a number I chose, not a written size, against the rule to draw only written sizes. Two inputs on the page set the real size, and the layout follows. Its keys and tab bar reuse the Duo outer figures. All three are unmeasured. See Input Needed item 4.
- Biggest accessibility size: the folded frame again at AX5. Every text size is multiplied by 53/17, the Body size at AX5 over the default (HIG typography).
- The status bar foot on both Duo screens is unmeasured. It is drawn at the 20 pt floor the Duo UI tests use.
- Light theme only. The native app is held to light (`UIUserInterfaceStyle: Light`, decision `design-parchment-ledger`), so the page has no theme switch.
- Tokens: `shared/tokens.json`. Cochin sets words, Menlo sets numbers (`typography-cochin-and-mono`). The system font sets page chrome, the status bar, the tab bar and the keys.
- Apple pages read 2026-11-21. Each answered 200 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:
  - layout: respect the safe areas, margins and guides.
  - typography: iOS default text 17 pt, minimum 11 pt; Body 17 pt at Large (default), 23 pt at xxxLarge, 53 pt at AX5.
  - accessibility: default control size 44x44 pt, minimum 28x28 pt; let text grow to at least 200 percent.
  - buttons: a hit region of at least 44x44 pt.
  - tab-bars: a tab bar floats above content at the bottom of the screen.
  Every control on the drawn screens is 44 pt or more, and no text is under 11 pt.

## Choices

1. **Concept: the bench, or the wall.** Each concept has its own section and its own Hide button (`opt-bench`, `opt-wall`).
   - The bench. One envelope sits on the bench. The pile rail, the card field and three trays always sit around it. Gain: it works the same at 5 envelopes and at 500 open packages; it keeps today's Card in Hand flow (type a card, the envelope answers). Loss: you see only one envelope at a time, so "who else might this be" needs the tie card.
   - The wall. Every open package is a tile on one wall, oldest order first. A typed card lights the tiles that hold it and dims the rest, and a tap on a lit tile puts it on the bench. Gain: the most "everything at once" of the two, and the wall shows the whole day's progress as green tiles. Loss: it does not scale. With hundreds of cards from many sellers, the wall runs to many screens on the folded Duo, and a lit tile can sit below the keys.
   - Pick: the bench. Take one part of the wall: a lit-tile strip could replace the tie card later.

2. **The pile rail.** New, in both concepts. A fixed-height strip at the top of the bench. It says "N to go" and "M of T opened", and draws one pip per envelope: green when matched, red when short, manila when set aside, violet for the one on the bench, empty for the rest. Gain: the person always knows how much is left, which the brief asks for first. Loss: the person must enter the day's count (item 3). Today nothing counts envelopes: `hand-count` counts cards in and out (`HandScreen.swift`, `leftPage`). Pick: the rail.
   Owner grant: yes. The count, and the bench state of item 9, need a new saved field. See Input Needed item 1.

3. **How the day's post is counted.** Each option has a Hide button (`opt-piles`, `opt-count`).
   - Piles. "+ Pile" adds one pile with its count. The rail groups pips by pile, so a finished pile shows as its own small done. Gain: it matches how the person sorts. Loss: one more entry per pile.
   - One count. A stepper for the whole day. Gain: less to enter. Loss: no pile grouping.
   - Pick: piles. With no count yet, the bench itself asks for the first pile, so the empty state has one sentence and one control (`ux-unknown-is-not-empty`). A pip past the count still draws, and the rail says "N more than counted".

4. **The bench is on the Packages tab, in both poses.** Today Card in Hand opens only on two pages, from the `hand-open` control, and covers both pages (`PackagesTab.twoPages`, `PackagesView.openHand`, `HandScreen.swift`). Here the bench is the top of the Packages tab, folded and open, and today's package list goes on below it, unchanged (tagged "Today: package list", not drawn in full). There is no Close, because there is nothing to close.
   - Gain: no step to open the bench, and the folded phone gets it too.
   - Loss: the package list starts lower on the folded phone.
   - Departs from: `PackagesTab.twoPages` and `hand-close`. It also answers waiting page item 35, `duo-card-in-hand-entry`, which is open, with "yes, the Packages tab itself".
   Owner grant: yes (item 35 is the owner's to rule).

5. **Trays.** New. Done today (each envelope finished today, with got/qty, red when short), Set aside (each set-aside envelope's names) and Not normal (short envelopes, and packages past 14 days in transit). On the folded and AX5 frames they are three chips with a count and the latest item; a press opens that tray in place, with Close. On the large phone and the open Duo they are lists.
   - Not normal follows `ux-all-is-well`: with nothing to list, it says "All is well."
   - Departs from: the past-transit page behind its Open control (`hand-past-transit-open`, `HandScreen.swift`). Past-transit packages list inline here, with their days. The page itself is not removed.
   - Gain: the day's state is on view. Loss: one more block on the folded screen.

6. **Set Aside.** New act on the bench. It records an Orphaned envelope from the names typed for this envelope (held, loose and an unmatched name), and checks nothing in (`orphaned-mail-never-decides`, `orphan-entry-takes-one-input`). The pile rail counts it as opened, manila. "Add Another Card" adds one more typed name to a blank envelope before Set Aside. Set Aside is filled only when loose cards wait and no shared name could still decide the envelope; at a tie it is plain, so the next card stays the first choice.
   - Gain: an odd envelope leaves the bench in one press and waits on Orphaned for later, which the brief asks for.
   - Loss: a second way to make an Orphaned envelope, beside `orphaned-record`. It writes the same record, so it is one capability with two entrances.
   - Departs from: today's held box with Post only (`HandScreen.swift`, `notice(id: "hand-held")`).

7. **New Envelope.** Today's act, today's name, in Title Case (owner ruling, waiting page item 81 b). It ends the envelope: one with a check-in lands in Done today, and held or loose cards are released with a receipt, as today (`new-envelope-ends-an-envelope`). It is the filled button once a line is checked in.
   - Gain: no new name to learn; the rail and Done today answer the press. Loss: an envelope left with no check-in is not counted, so a person who presses it on an empty envelope sees no pip fill. Pick: keep it.

8. **The end of the day.** New. When the opened count reaches the pile count and nothing is on the bench, the bench card becomes "That's the pile. You're done." with the matched and set-aside counts, cards in, cost basis, and how many need a second look. The rail turns gold-edged and a gold rule draws under the pips once. Gold is ornament only, never text (`palette-gold-is-ornament-only`); reduced motion draws the rule at once (`motion-reduced-leaves-it-drawn`). "More Post Came" adds a pile.
   - Departs from: `docs/design/duo-hand-gaps-notes.md` part 7, which opens the end view on an empty query once one card is in today. Here the count decides, so the end is a clear moment, not a blank field.
   - Gain: a clear done. Loss: it needs the count of item 3.

9. **Leaving and coming back.** The bench, the typed text, held and loose cards, the piles and the trays all stay when the person leaves and returns (`ux-keep-what-was-made`). Today the query lives in view state (`HandScreen.query`) and Close clears the hand (`hand.close()`), so an app kill loses the place.
   - Model need: keep this bench state on the device. Device-local, like `workerSyncedAt`, so it never syncs a half-open envelope to the other device.
   Owner grant: yes. `saved-state-shape` names one device-local field. This adds a second. See Input Needed item 1.

10. **Typed card, held cards and the Post offer.** Kept from today, on the bench card. The typed card's line carries the accent bar (owner, item 77 a). A held card's line carries the manila tint and "on the Suspense line" (`duo-hand-gaps-notes.md` part 5). The Post offer sits under the sender, above the lines (`duo-card-in-hand`, Post offer paragraph; item 42 is open), with Keep Held beside it (part 4). The receipt holds the same slot.
   - Gain: the rulings already made carry over unchanged. Loss: none new. Pick: keep them.

11. **The wall's rules.** Tiles keep one order, oldest order first, and never move (`ux-order-holds-still`, `no-layout-shift-under-pointer`). A check-in turns a tile green in place. Past usual transit adds an amber dot and the days. A tile tap is the person's own pick. While a checked-in envelope is on the bench, a tap on another tile is refused, and the answer shows beside the tiles: "Finish <seller> first: New Envelope." (`ux-answer-at-press`). On one page the wall sits right under the field, so the lit tiles stay above the keys. The wall draws no list of names, because the lit tiles are the list.
   - Gain: the wall never moves under the finger. Loss: a refused tap costs a press. Pick: these rules, if the wall is kept.

12. **Keys up on the folded Duo.** The bench concept keeps the rail, the field, and the envelope's name and first line above y 389 pt. The wall keeps the rail, the field and three rows of tiles there. The tab bar hides under the keys, as on the open Duo (`duo-card-in-hand`, 15:34 CDT).
   - Gain: the answer to a typed card shows above the keys. Loss: the trays sit under the keys while typing; the rail still gives the count. Pick: this order.

13. **AX5.** One column that scrolls, rail first. The pips grow with the text, to twice their size (HIG typography: grow meaningful icons as text grows). The trays stack. The card field's placeholder clips at AX5; a built field should wrap (`TextField` with a vertical axis). Not drawn.
   - Gain: every word stays readable, and the count stays first. Loss: "everything at once" fails at AX5; only the rail, the field and the envelope's name fit before a scroll. Pick: this; the workbench gives way to one column at AX5.

14. **Badge.** The Orphaned tab's badge counts the set-aside envelopes, as `RootView` badges `orphaned.badgeCount` today.
   - Gain: what was set aside shows from any tab. Loss: none new. Pick: keep today's badge.

15. **Undo the last envelope.** New Envelope and Set Aside each end an envelope, so each leaves its answer and an Undo in the receipt slot where the press was (`ux-answer-at-press`). On the day-done card it reads "Undo Last Envelope". The next typed card or line tap ends the offer. The mockup restores a copy of the bench; a build undoes only the act's own delta (`undo-removes-only-its-delta`) and writes a Recent entry as other check-ins do (`recent-checks-can-be-undone`).
   - Gain: a mis-press on New Envelope no longer counts an envelope that is still open.
   - Loss: one more control in the receipt.
   - Departs from: today's New Envelope, which has no undo (`HandScreen.swift`, `hand-new-envelope`).

16. **A save that fails.** Draw with `#s=failed`, or press "Make Saves Fail". A failed line tap says "Not saved. Tap again." in the line's own detail slot, and its box stays empty. A failed New Envelope or Set Aside answers under the buttons, so no button moves, and the envelope stays on the bench with no pip filled. A failed Post keeps the offer, as today (`duo-card-in-hand`, Post offer paragraph), and says so in the offer's text slot. Opening the ledger keeps today's placeholder (`RootView`, `Placeholder`). With no count, the rail says "No count yet", never 0 (`ux-unknown-is-not-empty`).
   - Gain: a failed write never reads as done. Loss: the New Envelope error adds a line under the buttons, which moves the trays below by one line. Pick: this.

17. **Where the card field sits (`ux-thumb-zone`).** The person carries the phone in one hand. Two places, each with a control above each concept ("At the Top", "Docked Low") and the deep link `&f=top` or `&f=low`:
   - At the top, today's place on the two-page Card in Hand (`HandScreen.leftPage`). Gain: the field sits next to the rail and reads first. Loss: on the folded Duo and the large phone the thumb must reach near the top to start each envelope.
   - Docked low. The field sits just above the tab bar, or on the keys while they are up; its matches open above it as an overlay, so nothing in the scroll moves. Gain: the main input is in thumb reach on every one-page frame. Loss: it departs from today's order, and the dock takes 64 pt from the scroll.
   - Pick: docked low on one page (folded Duo, large phone). At AX5 and on the open Duo the field stays at the top.
   - Departs from: `HandScreen.leftPage`, field second from the top. Not blocking.

## Design review of my own work

Skill `design-review` runs its reviewers from the orchestrator; a designer cannot spawn them. These are my own lines, for the design reviewer to check.

- Native or web-like, per pose: Duo folded `native` (a floating tab bar, the system keys, 44 pt controls, one column); Duo open `native` (each page its own layout, nothing across the fold, the bar under the right page); large phone `native`, same as folded; AX5 `native`, one column that scrolls. The mono pill buttons are the repo's own `MiniLabel`, not a system button style; a reviewer may call them web-like.
- Structure, per concept: the bench `new`: it moves Card in Hand onto the Packages tab in both poses, removes `hand-open` and `hand-close`, and adds the pile rail and trays. The wall `new`: the first screen becomes a map of every open package.
- `label_once.py` on the rendered DOM of both folded frames: one hit, "mail day" 3 times. Each is the rail title in a different frame of the page (the concept and the two counting options), not a repeat on one screen. On one screen it shows once.

## Critique pass

Run with skill `impeccable`, `critique`, as a design review only: this is a native app drawn in HTML, the launcher was not run, PRODUCT.md and DESIGN.md do not exist, and no sub-agent could be spawned. Fixed in the mockup:

- New Envelope and Set Aside had no undo (item 15).
- Set Aside showed beside the Post offer, where the envelope's own lines decide it. It now shows only with no envelope on the bench (item 6).
- The pips filled done first, then set aside. They now fill in the order the envelopes were opened.
- The pips stayed 10 pt at AX5. They now grow (item 13).
- The wall's count read "14 envelopes" over 16 tiles. It now reads "14 still owed".

Not fixed: the wall does not scale to hundreds of open packages (item 1); the AX5 field placeholder clips (item 13).

## Input Needed

1. Owner grant: a saved field for the pile count and the bench state (items 2 and 9). Device-local, like `workerSyncedAt`, is the pick. It changes `saved-state-shape`.
2. Owner grant: the bench as the Packages tab itself, in both poses (item 4). This answers waiting page item 35.
3. The pick between the bench and the wall (item 1), and between piles and one count (item 3).
4. The large phone's size in points. No record holds it.
5. `check_ios_mockup.py` exits 1 with one fault: a font declaration starts with Cochin. The repo's typography is owner-ruled (`typography-cochin-and-mono`), and all seven earlier mockups in `docs/design/` fail the same check today. The Duo frames fault is fixed. Either the check should accept a repo's ruled content font, or the ruling changes.
6. Questions from the critique:
   - Should the end of the day also close the bench, or should the field stay live for late post, as drawn?
   - Is a count of envelopes worth one entry per pile, or would the person rather skip it and lose the "N to go"?
   - Should the wall show only packages inside the usual transit window, so it stays one screen?
