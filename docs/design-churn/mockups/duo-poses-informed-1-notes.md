# Duo stacked poses, informed designer 1

Designer kind: informed. Mockup: `duo-poses-informed-1.html`, open from disk. Debt `duo-stacked-poses-unbuilt` (the Duo has no stacked poses). Decision `duo-card-in-hand` (Card in Hand on the Duo), item 28 a (answer page on top, system tab bar at the bottom).

## The pain

"It's a laptop when it's on my desk, why does it look like a phone?" Today a stacked Duo draws one phone page over the whole 669 x 951 pt window. `DuoSpread.pages(for:)` in `native/Manifest/DuoSpine.swift` returns nil for `.stacked`, with the comment "Default, not owner: stacked pages (held tall) keep one page". So rows scroll across the fold strip (y 455.5 to 495.5), and `PackagesTab.twoPages` is false, so Card in Hand never opens. The "Today" frame draws this, and its measure line reads "On the fold strip: package list".

## Deep links

Hash keys: `c` concept (`turned`, `desk`, `today`), `p` pose (`folded`, `open`, `laptop`, `tall`, `phone`), `s` state (`packages`, `empty`, `tie`, `envelope`, `held`, `posted`, `keysdown`, `transit`, `nomatch`, `tally`), `z` text (`l`, `ax5`), `t` theme (`light`, `dark`), `k` keys height (`289`, `263`). Examples: `#c=desk&p=laptop&s=held`, `#c=turned&p=tall&s=tie`, `#p=folded&z=ax5`, `#c=today`. Each frame prints a measure line read from its own layout: what sits on the fold strip, what clears the keys, how many answer lines show.

Focus for a waiting-page pick: `#turned-book` and `#desk-board`, one working frame per concept.

## Sizes and sources

- Folded 466 x 678 pt, open 951 x 669 pt with the fold at 455.5 to 495.5 pt: the brief and record `duo-fold-and-keyboard`. Stacked is the open screen turned a quarter: 669 x 951 pt, the same fold read across. `layout.py devices` answers `unknown` for this repo.
- Keys stacked: unmeasured at 669 pt wide. Drawn at 289 pt, the outer screen's taller reading, with a switch to 263 pt, the open reading (`#k=263`). At 289 pt the keys start at y 662, which leaves 166.5 pt of the bottom page above them.
- Tab bar: 83 pt with the bottom inset, the folded reading, reused stacked and on the phone. Unmeasured stacked.
- Top inset: 80 pt is the design review's reading on the open inner screen. Stacked, folded and phone tops are unmeasured; the frames draw 80, 48 and 48 pt and say so.
- iPhone 18 Pro: 402 pt wide (`TallyUITests` comment, 2026-10-28). Its height is written nowhere. The frame draws 874 pt and labels it "not written". Only Desk board's one-page option draws the phone; Turned book shows a note instead.
- Apple pages, read 2026-11-21 through the `tutorials/data` JSON, each answered 200: Typography (Large: Body 17, Footnote 13, Caption 1 12, Title 2 22, Title 3 20, Large Title 34; AX5: 53, 44, 43, 56, 55, 60), Accessibility (44 x 44 pt default control), Tab bars (floats above content at the bottom; keep it visible), Layout (respect safe areas; lay out by size class), Buttons, Toolbars, Lists and tables.

## Choices

1. **Turned book: turn the built pages.** Stacked, every spreading tab puts its right page on top and its left page below, as `DuoSpread.pageRects` already maps them ("Stacked it is the top page, and `left` is the bottom one"). Card in Hand: the sender head, lines and Past 14 days stand on top; the field, New envelope, matches and Suspense box lie below. Laptop and held tall draw the same. Gain: the least new code; the same views as the side-by-side build; item 28 a holds. Loss: the laptop's standing page still needs a reach for each line tap, and its type stays phone-sized. Pick: offer it as the safe build. Departs from: `DuoSpine.swift` `pages(for:)` default "stacked pages keep one page" (default, not owner).

2. **Turned book: the Mail day row moves to the top page.** With 289 pt keys only 166.5 pt of the bottom page is above them. The built left page (`HandScreen.leftPage`: Mail day row, field, This envelope row, matches) would put New envelope under the keys. So the count goes to the top page, Close joins the field row, and the field, Close, New envelope and the Post bar clear the keys. Gain: every control clears 289 pt keys. Loss: the match list sits partly under the keys (measured "matches (partly)"); the person drops the keys or scrolls to reach a second match. Pick: yes. Departs from: `HandScreen.leftPage` row order (default, not owner).

3. **Post bar on the bottom page.** Item 103 b pins the Post bar "just above the keys" and above the tab bar with keys down. Stacked, above the keys is the bottom page, so both concepts put it there. The sender head stays pinned on the top page, so "Post ... here" still names its envelope across the fold. Gain: the ruling holds as written. Loss: the button and the envelope it names sit on two pages. Pick: yes.

4. **Desk board (bold): every act under the thumbs.** The bottom page hangs one fixed stack from the fold: field and Close (48), a sideways strip of matches with New envelope fixed at its end (44), and one 53 pt slot. 8 + 48 + 8 + 44 + 4 + 53 = 165 pt, which clears 289 pt keys and never moves when the keys rise or fall. Gain: on a desk nothing needs a reach to the standing screen; no row shifts with the keys (`no-layout-shift-under-pointer`). Loss: the matches read sideways and show fewer names at once; the bottom page is half empty with the keys down. Pick: the one to try first on the device. Owner grant: yes.

5. **Desk board: the typed card's own line in the slot.** When the typed text names one line of the shown envelope, the slot holds that line: the same row and the same check-in tap as the line on the answer page (`ItemLine`, `PackagesModel.tap(key:)`), not a second path. It never fires on Return or done (`orphaned-mail-never-decides`). The slot is reserved while Card in Hand is open, so it appears and changes without moving anything. In priority it shows the Post offer, then the receipt, then the typed line, then a held-card hint. Gain: one tap per card in hand, in the thumb zone. Loss: the line shows twice on screen, once on each page. Pick: yes. Owner grant: yes. Departs from: `HandScreen.slotBar`, which holds only the offer and the receipt (owner items 103 b and 106 a rule the offer and receipt, not the empty slot).

6. **Desk board: the board in the laptop pose.** Half open, the standing page reads at arm's length: Mail day in Title 3, the seller in Large Title, lines in Title 3, the masthead figures in Title 3. Flat (held tall) it draws at the normal size. The hinge cannot tell a laptop from a book held half open, so the lines keep their taps in both: a misread costs only type size. The board drops the "It came from" micro line: the large seller says it, and the head's VoiceOver label keeps it, as item 105 a's slim head does. Gain: readable from the chair. Loss: one line fewer than Turned book would show at this type size; measured 3 of 4 lines in view with the keys up, the same as Turned book, only because Past 14 days moved off (item 7). Pick: yes. Owner grant: yes.

14. **Released cards.** New envelope with a card still held releases it (`new-envelope-ends-an-envelope`): the chip reads "1 released" and the Released box sits below the field rows in both concepts, under the keys while typing, as the built screen puts its boxes below the matches. Deep link `#s=released`.

Hide controls, one per option: Turned book, Desk board, the typed card's line (item 5; the slot falls back to its hint), the laptop board type (item 6), one-page Card in Hand (item 10), and the Today/New tags.

## Design-review self-pass

Verdicts, per frame, at L and AX5, light and dark preview, each read from a headless Chrome render and the frame's measure line:

- Turned book, laptop and held tall: pass. Fold clear; field, Close, New envelope and Post clear 289 pt keys; first match partly under them (item 2). Native: system keys, floating tab bar, 44 pt targets, Dynamic Type sizes.
- Desk board, laptop: pass. Fold clear; the whole stack clears 289 pt keys; 3 of 4 lines in view. Native, though the match strip reads like QuickType more than a SwiftUI list.
- Desk board, held tall: pass, as laptop at normal type.
- Desk board one-page, folded: fail at keys up, 0 of 4 lines (item 10); pass with keys down. AX5: the stack covers the answer (item 13).
- Desk board one-page, phone: pass, 3 of 4 lines; height unwritten.
- Folded and open, both concepts: unchanged from the build; pass. Folded AX5 Packages: tallies stack as built; pass.
- Today: fail by design, rows on the fold strip.
- `label_once.py` on ten rendered frames: two hits, both "Lightning Bolt", both data (the typed text and the Suspense box).
- A click-through script tapped every control in both working frames (keys, matches, lines, Post, New envelope, Close, Past 14 days, tabs, poses, snaps, hide buttons, a hardware keyboard): all pass, no page error.

## Self-critique (impeccable critique, native: design review only)

Fixed in the mockup: the slot was 57 pt with the typed line in it and dipped under 289 pt keys (now 53 pt, ends at y 660.5); a second New envelope on the no-match answer repeated a label (removed); collapsed package rows were squeezed by their list (fixed); the board lost a line to "It came from" (dropped, see item 6); Desk board's stack moved with the keys (now hangs from the fold).

Open, stated in the items above: Turned book's first match sits partly under 289 pt keys (item 2); the one-page option shows no line on the folded screen with the keys up (item 10); at AX5 the one-page stack covers the answer (item 13); Desk board's bottom page is half empty with the keys down (item 4).

7. **Desk board: Past 14 days moves to the bottom page.** The button opens a page, so it sits with the other acts, below the stack. Gain: one more line on the standing page. Loss: it hides under the keys while typing. Pick: yes. Departs from: `HandScreen.rightPage` `transitBox` on the answer page (default, not owner).

8. **Packages stacked: masthead on top, list below.** In both concepts the masthead (cards, packages, value, still missing) stands on the top page and the package list with the Card in Hand control lies below. Gain: no row on the fold; the count and money owed stand where they are read, the list lies where it is tapped. Loss: the list is about half the height it is today. Pick: yes. Departs from: `DuoSpread.spreads(tab:)` "Packages keeps the web's one page" (default, not owner).

9. **Card in Hand opens stacked.** The `hand-open` control shows on Packages when stacked too, top right of the bottom page. Departs from: `PackagesTab.twoPages` and the record's default "the control sits at the top of Packages, on two pages side by side only" (default, not owner).

10. **Desk board option: Card in Hand on one page (folded and phone).** The same bottom stack sits above the keys, and the answer fills what is left above it. Measured: folded with the keys up, 0 of 4 lines show; only the sender head fits. With the keys down the lines show. Gain: one stack serves stacked, folded and the phone, so one view, not three. Loss: folded typing shows the sender and the slot's one line, not the envelope. Pick: show it, and let the owner cull it (Hide one-page Card in Hand). Owner grant: yes. Departs from: `HandScreen.twoPages` (Card in Hand opens on two pages side by side only; default, not owner).

11. **Tally and Orphaned stacked.** Already coded by `pageRects`: the picked item on top, the list below. Tally is drawn; Orphaned is a stub that names the same rule. Pick: as coded.

12. **Ledger stacked.** Item 24 b rules Ledger full width. Stacked, a full-width scroll would cross the fold. Drawn: the masthead on top, Ledger's rows full width on the bottom page only. Owner grant: yes, because it reads a ruling in a pose the ruling did not name.

13. **Folded and the open pose stay as built.** Neither concept changes the side-by-side Card in Hand or the folded Packages, except the option in item 10. Both draw at AX5: the folded Packages masthead stacks its tallies as built; Desk board's one-page stack grows past its 165 pt and covers the answer.

## Input needed

- The keys' height at 669 pt wide, and the stacked top inset. Both decide how much of the bottom page clears the keys. A Device Hub reading or `DuoMeasureUITests` turned stacked would settle them.
- The iPhone 18 Pro's height in points.
- Items 4, 5, 6, 10 and 12 need an owner grant.
- Critique questions. Desk board stacked lists matches in a sideways strip, but the open pose keeps the built vertical list: is one app with two match patterns acceptable, or should the open pose take the strip too? On a desk, would you rather type every card (Desk board's slot) or tap lines on the standing page (Turned book)? Should Card in Hand open folded at all, given only the sender fits above the keys?
