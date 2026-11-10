# Card in Hand gaps: notes

Mockup: `docs/design/duo-hand-gaps.html`. Open it from disk. Deep links: `#s=folded`, `#s=line-now`, `#s=this-envelope`, `#s=still-owed`, `#s=keep-held`, `#s=held-lines`, `#s=tie-post`, `#s=end-of-day`, `#s=suspense-rank`. With no hash, every part shows. Each option has a Hide button. "Show hidden options" brings them back.

Debt `duo-hand-mockup-gaps` (Card in Hand mockup gaps). Decision `duo-card-in-hand` (Card in Hand on the Duo). The October mockup, "the round 2 mockup" below, is `docs/design/duo-card-in-hand/index.html` at commit b8d11e7 (Duo round 2 draws Lost and degen's stack order as options). It was never on main. Its line numbers below are at that commit.

Designer kind: informed. No brief named a kind.

## Frame

- Open pose only, inner screen 951 x 669 pt. That is the brief size the round 2 mockup README gives, and the size the three earlier `duo-hand-*` mockups use. `layout.py devices` gives `unknown` for this repo. Fold 40 pt at 455.5 to 495.5 pt, and keys panel from y 405 pt (`duo-fold-and-keyboard`, fold strip and keyboard figures). The status bar foot is drawn at 20 pt, which is unmeasured.
- The folded frame comes first and is the outer screen, 466 x 678 pt (`duo-fold-and-keyboard`, re-measured 2026-11-08). It is drawn as "no change", because Card in Hand opens only on two pages (`PackagesTab.twoPages`, `native/Manifest/HandScreen.swift:32`).
- Light theme only, because the native app is held to light (`UIUserInterfaceStyle: Light`, decision `native-build-lanes`, the N13 notes).
- Tokens come from `shared/tokens.json`. Cochin sets words and Menlo sets numbers (`typography-cochin-and-mono`). The system font is used for page chrome only.
- Apple pages read on 2026-11-08. Each answered 200 through `developer.apple.com/tutorials/data/.../*.json`:
  - human-interface-guidelines/layout: respect the safe areas.
  - human-interface-guidelines/typography: iOS default size 17 pt, minimum 11 pt.
  - human-interface-guidelines/accessibility: control size 44x44 pt by default, 28x28 pt at least.
  - human-interface-guidelines/buttons: hit region at least 44x44 pt.

  Every new control is 44 pt or more, and all new text is 11 pt or more.
- `python3 ~/.claude/lint/check_ios_mockup.py docs/design/duo-hand-gaps.html` exits 0.

## Restyle check

None of the eight parts lives in PackagesView, TallyView, OrphanedView or RootView. All eight are in `HandScreen.swift`, with model support in `HandModel.swift`. Parts 1 and 5 mark a line. Draw that mark from `HandScreen.line(_:)` (`HandScreen.swift:303`), as a background or overlay around `ItemLine`. Do not add a new `ItemLine` state: `ItemLine` is shared with Packages (`PackagesView.swift:86`) and Tally (`TallyView.swift:273`). No part is "restyle owns".

## The eight parts

1. **The typed card's line.** Owner ruling: accent bar (waiting page item 77, option a, 2026-11-09 19:19 CST).
   - What: a mark on the line of the card you typed.
   - Sources:
     - The round 2 mockup paints the line greenSoft (`.line.now`, index.html:101, :163).
     - The build paints a done line greenSoft too (`PackageCard.token(.rowFill)`, `native/ManifestKit/Sources/ManifestKit/PackageCard.swift:30`).
     - The chosen match already carries a 3 pt accent bar (`HandScreen.swift:160`, item 48).
   - Options:
     - Accent bar, the owner's ruling. Gain: one mark for "this card" on both pages, and it still shows on a done line. Loss: it departs from the round 2 drawing.
     - Green fill. Gain: it is the round 2 drawing. Loss: it cannot be told apart from done, and on a done line it disappears.
   - The bar goes in ItemLine's 4 pt leading pad, so no text moves.
   - Departs from: round 2 mockup pose 1.
   - Test: on the line whose name matches the shown hit, the mark is present and carries the accessibility trait `.isSelected` or the id `hand-now:<key>`. The line's name frame is the same with and without the mark.

2. **This envelope, with its cards so far.** Carried over.
   - Source: round 2 mockup index.html:153, :223, :256. Today the row shows a label only (`HandScreen.swift:111` to `:118`).
   - What: under the label, the cards checked in since the last New envelope, from line taps, steps and Post, each with its copies (`×N`). When the list is empty, it reads "Nothing checked in yet".
   - Layout: one line only. Fit as many names as the width allows, then "+N more". VoiceOver reads every name. The label and the value are two lines inside the 44 pt row that New envelope's hit frame already sets. New envelope is top-aligned, so it never moves.
   - Model need: `HandModel` keeps no such list. Add one, and clear it in `newEnvelope()`.
   - Test 1: check in two cards. `hand-new-envelope` keeps its frame across both check-ins, and the `hand-this-envelope` value names both.
   - Test 2: New envelope resets the value to "Nothing checked in yet".

3. **Still owed here.** Option picked: on the order line.
   - Source: decision `outstanding-value-per-level` (each level states what is still outstanding) asks each package for "N left · $Y". That text is the bundle's `packagePill`, which `PackagesModel.pills[gk]` already holds (`native/ManifestKit/Sources/ManifestKit/Packages.swift:32`). Use it; do not build a second formatter. The round 2 mockup puts card names under the lines (index.html:167).
   - Options:
     - On the order line, the pick. "Still owed here" with the red figure at the trailing end of the "ordered" line, y 92 to 106. Gain: it adds no row, the Post offer does not move, and it shows above the keys at any envelope length. Loss: the line is busier. At large text it wraps under the date.
     - Under the lines, the round 2 place. Gain: it reads after the lines it sums. Loss: with the keys up and three or more lines, it sits under the keys (y 498 with five lines).
   - When nothing is owed, it reads "complete" in ink. Green at 11 pt is 4.29:1, under the 4.5:1 text floor.
   - Departs from: the round 2 place and its card-name wording. Not blocking.
   - Test: `hand-owed` reads `packages.pills[gk]`. Its frame's maxY is less than 405 with five lines and the keys up. A line tap updates it with no change in the line frames.

4. **Keep held.** Carried over.
   - Source: round 2 mockup index.html:271 to :272. Today the offer has Post only (`HandScreen.swift:324` to `:334`).
   - Placement: Keep held goes beside Post in the offer slot under the sender. That is the place in decision `duo-card-in-hand`, Post offer paragraph. Item 42 is still open.
   - A press hides the offer and leaves a receipt of the same height, as `receiptBox` does (`HandScreen.swift:341` to `:353`). The receipt says "Kept on the Suspense line. Nothing is checked in." It clears with the next card or New envelope. The held card stays held, and the typed card's own line tap still works.
   - Test: Keep held changes no line frame and no slot height. `hand.held` is unchanged. Nothing is saved: the store generation is the same.

5. **Held cards marked on their lines.** Carried over.
   - Source: round 2 mockup `.line.held`, index.html:102, :267 to :268.
   - What: a manila tint at 55% over card, and " · on the Suspense line" appended to the detail line in manilaInk bold. Both are added in `HandScreen.line(_:)`. The box stays open.
   - Test: the line whose normName equals `hand.held` gets the words in its accessibility label. No other line gets them. The line height is the same as the line with no hold.

6. **Post at a tie.** Carried over.
   - Source: round 2 mockup index.html:228 to :243. Today each tie card shows the seller and a count only (`HandScreen.swift:258` to `:275`).
   - What: each tie envelope lists its open lines as 28 pt read-out rows. "in hand" marks the typed card and "held" marks a card on the Suspense line. Each envelope has its own "Post N cards here".
   - Departs from: the round 2 label "Post here". The new label is the act's one name, from the offer (`ux-one-plain-name`).
   - Layout: two columns of 203 pt. Three or more envelopes wrap to rows of two. Neither button is filled, because a tie has no first choice.
   - Model need: `handStep` returns "hold" with no plan for a tie (rules.js `handStep`). A press needs a plan for the chosen gk from `matchEnvelope`, the bundle's one matcher, with the typed and held names. The owner presses: nothing is chosen for them (`orphaned-mail-never-decides`).
   - Test 1: the two `hand-tie-post:<gk>` buttons exist, are equal in size, and are not filled.
   - Test 2: a press checks in only that envelope's copies, in one save.
   - Test 3: both buttons' maxY is under 405 with the keys up.

7. **End of mail day.** Carried over, with an option picked for what opens it: the empty query.
   - Source: round 2 mockup index.html:171 to :195 and :382 to :406. Today the empty query shows the start hint (`HandScreen.swift:249` to `:251`).
   - Left page: "Today's pile", which lists envelopes with a check-in since local midnight (from the saved `receivedAt`). Each row shows got/qty, red when short.
   - Right page: "Not normal today", which lists only short envelopes. Each row names the missing cards and their "N left · $Y", so it has no Open (`ux-control-earns-place`). Departs from: round 2 mockup, which gave each row an Open. Today's `transitBox` follows, unchanged. With nothing to list, it says "All is well." (`ux-all-is-well`). Under its own label, "Across all orders", the masthead's own "still missing" line follows in red (`MastheadModel.missingLine`), outside the "Not normal today" block.
   - What opens it:
     - Empty query, the pick. It shows once one card is in today. Gain: no new control. Loss: the view appears without being asked for.
     - A "Day's end" control. Gain: the view shows only on purpose. Loss: one more control, plus a state to leave.
   - Also drawn: the round 2 no-match frame (index.html:394 to :405), with the answer at the query and Hold in Suspense. It needs the multi-name Suspense line of part 8.
   - Test 1: with an empty query and one check-in today, `hand-pile` lists that envelope.
   - Test 2: with no check-in today, the hint shows.
   - Test 3: with nothing short and nothing past 14 days, `hand-not-normal` reads "All is well.".

8. **Suspense ranks the accounts it fits.** Carried over.
   - Source: round 2 mockup index.html:286 to :312. Today `HandModel.held` is one name with no count (`native/ManifestKit/Sources/ManifestKit/HandModel.swift:21`). `handStep` keeps the first held name when a second shared name is typed.
   - What: the Suspense line holds several names with copies. The right page ranks accounts by named copies with the bundle's `rankCandidates`, the rule Orphaned uses, so no second ranker is built. The top account's "Post N cards here" is filled. When the top two rank equal, the tie of part 6 shows instead. Post checks in only the cards an account ordered. The rest stay on the line.
   - Departs from: round 2 "Leave in Suspense", which is left out. Doing nothing already leaves the cards on the line (`ux-control-earns-place`).
   - Model need: a multi-name held list. See Owner grant item 1.
   - Each row reads OrphanedView's fit line, the words Orphaned uses for the same rank.
   - Test 1: three held copies rank Low Tide, "explains all 3 · nothing left over", above Tinpot, "2 of 3 cards · 2 more still owed", and only the top button is filled.
   - Test 2: posting the second account leaves one Arcane Signet on the line.

## Owner grant items

1. **A Suspense line of several names.** Parts 5 and 8, and part 7's Hold in Suspense, hold more than one name at once. `new-envelope-ends-an-envelope` rules on "a name held", and `HandModel` holds one. The round 2 mockup draws several, and the decision's Suspense concept implies several. Owner grant: yes, because it widens the held rule the model enforces.
   - Gain: an envelope with no sender can be checked in, and parts 5 and 8 work.
   - Loss: more held state to show and to release on New envelope.
   - Pick: yes.

2. **Button case.** Owner ruling: Title Case (waiting page item 81, option b, 2026-11-09 19:19 CST). Every button label moves from sentence case to Title Case, such as "New envelope" to "New Envelope".

## Out of scope, for the orchestrator

- The decision's status line says "five mockup parts" (`duo-card-in-hand`, Status). The debt lists eight. The record needs a fix.
- The built micro labels are 10.5 pt (`HandScreen.micro`, `HandScreen.swift:405` to `:407`), under the 11 pt iOS minimum on the HIG typography page.
- The keyboard frame top (449) plus its height (263) is 712 pt. The inner screen drawn here is 669 pt. One of the figures is out of date.
