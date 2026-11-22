# Find the package: notes (find-package-informed-1)

Mockup: `docs/design/find-package-informed-1.html`. Open it from disk. Designer kind: informed.

Deep links, one state each: `#s=today`, `#s=today-typed`; Clue Words `#s=words-rest`, `#s=words-seller`, `#s=words-two`, `#s=words-three`, `#s=words-none`, `#s=words-keys`, `#s=words-ax`; Line-up `#s=lineup-rest`, `#s=lineup-seller`, `#s=lineup-picked`, `#s=lineup-two`, `#s=lineup-three`, `#s=lineup-order`, `#s=lineup-none`, `#s=lineup-keys`, `#s=lineup-ax`. No hash shows every state. Every frame works: type in the pill, tap a box, tap an order, Show All, Clear.

Focus for the waiting page: Clue Words `#focus-words` in `#s=words-three`; Line-up `#focus-lineup` in `#s=lineup-three`.

## The pain

The person holds an envelope and must land on its order. Read from the code:

1. Two clues find nothing. `lineHit` in `src/view-rules.mjs` reads the query as one phrase against one line's joined fields. "gamma ponder" matches no line, though two open Gamma orders hold Ponder (`#s=today-typed`).
2. One seller often has several open orders. Only the date or a card tells them apart. The date is not searchable.
3. A result does not say why it matched.
4. On the open Duo, Packages draws one list across the fold. This is a code read, not a screenshot: `PackagesTab` draws `MastheadScreen`, which has no two-page layout. The brief rules that nothing sits across the fold.

The sample data holds the hard case: three open Gamma Cards orders across four weeks (Oct 22, Nov 4, Nov 13), two of them with Ponder.

## Frame

- iPhone Duo folded, 466 x 678 pt. System tab bar from y 595 pt, 83 pt tall (`duo-fold-and-keyboard`). Keys frame 250 to 289 pt tall; drawn at 289.
- iPhone Duo open, 951 x 669 pt. Fold at 455.5 to 495.5 pt. Keys drawn from y 405 pt (frame from 449). The Duo bar sits on the right page, 64 pt tall, 12 pt up (`DuoBarMetrics.height` 76, PR 238).
- iPhone 18 Pro, 402 x 874 pt. The brief gives no size. It comes from PR 238's notes (`FindPillUITests` log) and the item 95 mockup, which measured the pill top at 731 pt. Keys are not drawn: the 18 Pro keyboard frame is unmeasured.
- Largest text (AX5): the folded Duo. Body text drawn at 53/17 of its size.
- Top safe area unmeasured: drawn at 20 pt (Duo) and 54 pt (18 Pro), as PR 238 drew it.
- Light theme only: `native/project.yml` sets `UIUserInterfaceStyle: Light`. No dark frames are drawn.
- Tokens from `shared/tokens.json`. Cochin sets words, Menlo sets numbers (`typography-cochin-and-mono`). Chrome uses the system font.
- `python3 ~/.claude/lint/layout.py devices <repo>` prints `unknown` for this repo, so sizes come from the brief and the records above.
- Apple pages read 2026-11-21 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`, each 200:
  - search-fields: a search field holds a Search icon, a Clear button and placeholder text; placeholder text says what search covers; "Place search at the bottom if there's room"; scope bars and tokens narrow a search; show suggestions and recent searches.
  - typography: Body is 17 pt at Large and 53 pt at AX5 (the AX5 table).
  - accessibility: controls 44 x 44 pt by default; text at least 11 pt.
  - layout: lay out by size class; respect the safe areas.
  - tab-bars: read; no number used.
- `check_ios_mockup.py`: one fault, `system-font: a font declaration starts with cochin`. Cochin is the app's content font (`typography-cochin-and-mono`); chrome is on the system font. PR 238's mockup and the Duo mockups on main fail the same way. Possible false alarm. The system-font order was not changed to pass it, because that would draw the wrong face.

## Ruled items kept

- Card in Hand stays a control on Packages, not the Packages tab (item 35 a). Both concepts draw it on the open Duo.
- The Find pill's clear button (item 46 a). Title Case button labels (item 81 b): Clear Search, Show All, Mark All Received, Back to Matches.
- The band under the pill is solid paper with a 1 pt line rule (item 101 a). Item 101 is closed as moot by item 95 b (owner, 2026-11-21 19:54 CST). The float control shows the form item 95 b keeps: the pill floats over the list.
- A search shows only the matching lines, with a way back (`search-filters-inside-package`).
- Showing starts on unreceived (`ruled-head-showing-unreceived`): received orders stay out of both concepts. This holds only once PR 238's Showing lands on native. Main's native Packages has no hide-received (`native-filters-tally-only`), so the Today frames show the received order with RECEIVED.
- A tapped row holds its place, bold with an accent bar, on a 10 pt pad (item 48 hold, `duo-card-in-hand`).
- A tie is reported, never decided (`rankCandidates` in `src/view-rules.mjs`).
- Late figures: 14 days amber, 30 days red (`lost-mail-flags-use-order-date`). No new figure.
- No native dialogs (`no-native-dialogs`). No row moves under the finger (`no-layout-shift-under-pointer`).

## Items

1. **Clue Words (quiet concept).** New.
   - What: the list stays as today. Every typed word must match the same open order somewhere: seller, card, set, month or order no. Lines narrow only on a card or set word. Matched text is underlined in accent.
   - Gain: "gamma ponder oct" lands on one order. The person never leaves the list they know.
   - Loss: a typo in one word empties the list. The no-match state says which words matched, so the person drops one.
   - Pick: owner's choice, between this and item 2.

2. **Line-up (bold concept).** New.
   - What: on one page, typing swaps the list for "Which order?": a sideways rail of the orders a word hits, ranked by how many words they fit, then the picked order's card under it. A tile that fits every word has a solid edge; one that fits some is dashed and says "Fits 1 of 2 words". When one order alone fits every word, its card shows at once. Two or more that fit every word are a tie, whatever the weights say: no card shows, and the sentence reads "The first 2 fit equally. Pick one by its date, or add a word." The weights only order the rail. Each tile shows the order date and its age in days. Close clears the search and brings the list back.
   - On the open Duo: Packages becomes list beside order: open orders on the left page, the picked order on the right, the pill on the right page above the bar.
   - Gain: a wrong word still leaves a way in ("Fits 1 of 2 words"). The date and age sit on every tile, the clue read off a postmark. The person picks between three Gamma orders by date without opening any.
   - Loss: a second screen shape on Packages. On one page, only one card shows at a time. On the open Duo it overlaps Card in Hand (item 11).
   - Departs from: `duo-card-in-hand` Defaults, "Packages does not spread on the open Duo" (default, not owner). Not blocking.
   - Pick: owner's choice. Owner grant: yes, because it changes the Packages screen shape.

3. **The clue matcher.** New, both concepts.
   - What: words split on spaces. A word reads as seller, card or set by part of the text; as an order no. when it holds a digit and is 3 or more characters; as a month when it starts a month name (3 or more letters).
   - Departs from: `lineHit`, `filterPackages` and `handHits` in `src/view-rules.mjs`, the one matcher both clients share (`rules-run-in-javascriptcore`). The web search changes too, and so does Card in Hand's typed match, since `handHits` calls `lineHit`. Not blocking.
   - Gain: two or three clues combine. Loss: a phrase like "lightning bolt" now also matches an order with "Lightning Helix" and "Bolt" on two lines. Rare in this ledger, unmeasured.
   - Pick: apply. Owner grant: yes (a rule both clients share).

4. **Month words.** New. Control: "Hide month words".
   - What: "oct" matches orders placed in October. It is a search word, not a filter. It ranks or narrows only this search.
   - Home: the month names should come from the one home of the Orders from month names. On main that is the web's `RANGES` and `rangeLabel` in `src/app.jsx`. PR 238 (unmerged) moves them to `src/view-rules.mjs` and adds `monthChoices` there. It adds no date filter on Packages. Orders from stays in the Ledger View group (item 47 a, PR 238).
   - Gain: the postmark month separates one seller's orders. Loss: the postmark month is the mail month, not the order month, so a late-October order mailed in November needs "oct", not "nov". The tiles show the order date, so the person can check.
   - Pick: apply. Owner grant: yes (it adds a search scope the web lacks).

5. **The clue line.** New, both concepts. Control: "Hide the clue line".
   - What: one 28 pt row in the band, above the pill. At rest it says what words can name. While typing, it shows each word and how it was read ("gamma seller", "oct month", "zzz no match"). In Clue Words the order count ends the row. In Line-up the count lives once, in the sentence under "Which order?" (ux-label-once). It is always laid out, so the first letter moves nothing. Text capped near xxxLarge; at AX5 it wraps.
   - Gain: the answer shows at the pill (ux-answer-at-press). A miss names the word that missed. Loss: 32 pt of list at rest; on the 18 Pro the band rule moves from y 723 to about 691.
   - Pick: apply.

6. **Match marks.** New, Clue Words. Control: "Hide match marks".
   - What: matched text in the seller, card, set and order no. gets a 2 pt accent underline. Text weight and size stay, so nothing reflows.
   - Gain: the reason shows on the card. Loss: one more mark beside the order no. link's underline.
   - Pick: apply.

7. **Age on the tile.** New, Line-up. Control: "Hide age colour".
   - What: "Nov 4 · 16 days", amber from 14 days, red from 30 (`lost-mail-flags-use-order-date`).
   - Gain: the late order reads at a glance. Loss: native cards still lack the flag (`native-card-lost-flags-unbuilt`), so the tile shows it before the card does.
   - Pick: apply.

8. **The band under the pill.** Items 101 a and 95. Item 101 a is closed as moot by item 95 b (owner, 2026-11-21 19:54 CST). Control: the float control.
   - What: drawn as ruled solid paper on both phones and on the open Duo's right page.
   - Gain: no list text sits under the pill, so the contrast audit needs no skip. Loss: the list ends higher; with the clue line, about 40 pt higher on the 18 Pro.
   - Pick: as 101 a. Item 95 is answered (option b, 2026-11-21 19:54 CST); the float control shows its other form.

9. **Clue Words on the open Duo.** New.
   - What: the list keeps to the left page. The right page holds the masthead, the stamped cell, Card in Hand and the band with the pill above the Duo bar.
   - Departs from: Card in Hand's place, "at the top of Packages … covers both pages" (`duo-card-in-hand` Defaults, default, not owner). It moves to the right page, beside the pill. Not blocking.
   - Gain: nothing crosses the fold; the pill sits by its controls. Loss: the right page is mostly empty paper while searching.
   - Pick: apply with Clue Words. Owner grant: yes.

10. **Empty results.** New wording, one sentence and Clear Search (ux-unknown-is-not-empty).
    - Clue Words, a word that fits nothing: "A word marked "no match" fits no open order. Remove it to widen the search." Every word fits something but no one order: "Each word matches some order, but no one order holds them all. Remove a word to widen the search."
    - Line-up: "No open order matches any word."
    - Departs from: PR 238's "No cards match that search." Not blocking.
    - Gain: the sentence names the fix. Loss: two sentences to keep in step with the clue line.
    - Pick: apply.

11. **Line-up and Card in Hand overlap on the open Duo.** Question only.
    - Card in Hand types card names one by one and posts. Line-up finds the order from any clue, folded too. Both live on Packages.
    - Gain of keeping both: no ruled screen changes. Loss: two ways to find an envelope by a card name on the open Duo.
    - Pick: keep both now. Owner grant: yes, if the owner wants them folded into one later.

12. **Largest text.** New.
    - Clue Words: prompt reads "Find" (PR 238), the clue line wraps, the card grows in full.
    - Line-up: the rail becomes a stack (ViewThatFits), and head, stack and card scroll as one.
    - Gain: no text clips. Loss: at AX5 the band takes about a third of the folded screen. Close stays at the system size in the drawing; the build should scale it.
    - Pick: apply.

13. **What each tied order holds.** New, Line-up, from the critique.
    - What: on a tie, the space under the rail lists each tied order's cards in one line ("Gamma Cards, Oct 22: Ponder, Preordain ×2, Brainstorm"). Plain text, not a control: a tap there would swap the area for a card under the finger (`no-layout-shift-under-pointer`). The tiles above stay the only way to pick.
    - Gain: the person holds the list against the cards in the envelope and picks with no extra word. Loss: card names can run long and wrap.
    - Pick: apply.

## Self-check (skill design-review, no agents spawned)

- Structure verdicts (Mockup set check): Clue Words `same` (today's list, tabs and first screen; the pill and band are PR 238's). Line-up `new` (typing swaps the list for a line-up; the open Duo becomes list beside order).
- Native verdicts: Clue Words `native` (bottom search with Clear, scope read-back like search tokens, system tab bar). Line-up `native` (a sideways rail and a list beside its detail, both iOS patterns; Close in the head). The page's own option buttons are review chrome, not app UI.

## Guesses

- Scoring weights (order 10, card 3, seller 3, month 2, set 1) are this drawing's, not measured on real searches.
- The 18 Pro and Duo top safe areas, and the folded keys at 289 pt.
- Order no. format, card sets and all figures are samples.
- Card parts (Stamp slot, bulk row, lines) are drawn from the code at sample sizes, not from a shot.
- Duo bar and tab icons are plain boxes, not SF Symbols.

## Critique

Skill `impeccable`, `critique`, 2026-11-21. Method: design review only (detector not applicable, native platform). The launcher was not run; no PRODUCT.md or DESIGN.md exists. No snapshot.

Heuristic scores (Line-up / Clue Words): status 3/3, real world 4/3, control 3/3, consistency 3/3, error prevention 3/2, recognition 4/3, efficiency 3/3, minimalist 3/3, error recovery 3/3, help 2/2. Totals 31/40 and 28/40.

- Fixed: Line-up said its count twice, in the clue line and under "Which order?" (ux-label-once). The clue line now holds no count in Line-up.
- Fixed: a one-word search showed "Fits" on every tile, which told nothing. One word now shows no fit line.
- Fixed: the Clue Words no-match sentence did not say which word to drop. It now says whether a word missed outright or only the mix missed.
- Fixed: a tie left an empty answer area. It now lists what each tied order holds (item 13).
- Fixed: the weights could break a tie between two full fits. Every full fit is now in the tie.
- Fixed: "Fits every word" showed on several tiles (ux-label-once). A full fit now shows by its solid edge.
- Fixed: the clear button drew a text glyph; it is now a drawn mark.
- Kept on purpose: the 3 pt accent bar on the picked tile is item 48's ruled hold, not decoration.
- Open, a question: in Clue Words, the masthead and stamped cell sit above the results on one page, so the folded Duo shows one result card. Scrolling to the first result on a typed word would move the list; the running head rules are outside this mockup.
- Open, a question: at AX5 the band takes about a third of the folded screen, and the query scrolls inside one line (as PR 238 does).
- Open, outside this folder: the matcher change (item 3) lands in `src/view-rules.mjs` and needs tests on both clients.
