# Card in Hand: the first match stays above the keys

Mockup: `duo-hand-notice-match.html`. Debt: `hand-notice-cuts-match-row`. Decision: `duo-card-in-hand`.
Lane kind: informed (the brief names no kind).

Deep links: `#s=today`, `#s=under`, `#s=under-tap`, `#s=one-line`, `#s=answer-page`, `#s=folded`. Add `z=default` or `z=ax3` for one text size, for example `#s=under&z=ax3`. No hash shows all.

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. So the open pose is drawn at the brief's size: 951 by 669 pt, fold 40 pt at 455.5 to 495.5 pt (`duo-fold-and-keyboard`).
- The keys top is the brief's 405 pt: the panel draws there, 44 pt above the 449 pt frame (`duo-fold-and-keyboard`).
- The status bar foot is unmeasured. It is drawn at 20 pt, the floor in `DuoHandUITests.statusBarFloor`.
- Order and gaps come from `HandScreen.leftPage`: 16 pt padding, 12 pt gaps, a 44 pt `MiniLabel` frame for Close and New envelope, a 48 pt field, a 44 pt match row. The box is `HandScreen.notice`: 12 pt padding, a 2 pt stack.
- Text sizes. Default: the sizes in the code. AX3 (Accessibility Large 3): each element scales by its own text style, as `Font.custom(_:size:relativeTo:)` does. Ratios from the iOS Dynamic Type tables: Body and Headline 17 to 40, Caption 1 12 to 32, Footnote 13 to 33, Title 2 22 to 44. AX3 Body is 235 percent, over the 200 percent the Accessibility page asks for. The 44 and 48 pt floors do not scale.
- Every y below is read from this drawing (headless Chromium, Cochin and Menlo loaded), not from a simulator. Each caption prints its own reading. Treat each figure as an estimate within a few points.
- Sample, the same in every frame: Lightning Bolt held in Suspense, Counterspell released, "Path to" typed, one match (Path to Exile). The right page is today's built order: sender, Post offer, lines.
- The cut, checked against the code. At the default size, one box puts the match at y 317 to 361, whole. At AX3, one box puts it at y 486 to 530, cut. Two boxes (held and released, which show together after a New envelope) put it at y 401 to 445, cut by 40 pt. A long Released list, which wraps, cuts it with one box. So the debt holds at the default size with two boxes, and with any box at AX3. Today is drawn with two boxes, and so is each option.
- Theme: one. The native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-11-06, each answered 200: Typography (the Dynamic Type tables), Accessibility (44x44 pt default control size; text to at least 200 percent), Layout (respect the safe areas), Buttons (44x44 pt hit region).

## Items

1. **Where the manila box sits.** One variable changes. Every other part is the same in each frame.
   - Today (`HandScreen.leftPage`: field, boxes, This envelope, Matches). First match: default y 401 to 445, cut by 40 pt. AX3 y 705 to 749, cut by 344 pt.
   - Box under the matches: field, This envelope, Matches, then the boxes. First match: default y 233 to 277, 128 pt clear. AX3 y 336 to 380, 25 pt clear. Gain: the first match sits where it would with no box, at any text size. A box that opens while you type, or on a tap, opens below the list, so New envelope and the rows above it do not move. Lose: the boxes come last. At the default size with one match, the Suspense box shows whole and the Released box is cut. With three matches, or at AX3, both boxes sit under the keys until you scroll or close the keys. The answer page still says "Your held card came with this envelope" when it matters.
   - Box on one line: today's order; each box keeps its title and name on one line, and the foot line moves into the VoiceOver label. First match: default y 325 to 369, 36 pt clear. AX3 y 540 to 584, cut by 179 pt. Gain: today's order. Lose: it fails at AX3, so it does not close the debt. The foot ("Not checked in.") leaves the screen.
   - Box on the answer page: the boxes sit at the top of the right page, over the sender. First match: as under the matches. Gain: the boxes stay in view beside the match. Lose: Post moves from y 162 to 206 down to y 330 to 374 at the default size, and to y 682 to 770 at AX3, under the keys. That undoes the Post offer's place in `duo-card-in-hand` (item 42 on the waiting page, `duo-hand-post-order`, still open). It also departs from the header comment of `HandScreen.swift`: held cards sit on the left page.
   - Pick: Box under the matches. It is the only option that keeps the first match whole at both sizes and keeps Post above the keys. At AX3 no option can show the match and a box on the left page: the header, field, This envelope, heading and match fill 344 of the 369 pt above the keys.
   - Departs from: today's order in `HandScreen.leftPage` (boxes above This envelope). Not blocking.
   - Owner grant: no.

2. **A tap on a match** (the case in `testTappingAMatchDoesNotMoveNewEnvelope`: type "to", 3 matches, tap the 2nd). Drawn as `#s=under-tap`.
   - Today: New envelope does not move. The tapped row slides up to the first slot. If the tapped name is shared, the Suspense box opens above This envelope, and New envelope and the row move down (`hand-suspense-tap-shift`).
   - Box under the matches: New envelope does not move. The tapped row slides up to the first slot, as today. The Suspense box rises into the space the 2nd and 3rd rows left, under the finger. The box has no control, so a second tap there does nothing. A Suspense box that a tap opens opens below the list and moves nothing above it.
   - Gain toward `hand-suspense-tap-shift`: the box no longer moves New envelope or the list. It does not close that debt: the tapped row still moves.
   - Owner grant: no.

3. **Hold the list's height after a tap.** Not drawn. The list could keep its height until the next keystroke, so the box would not rise under the finger. Gain: nothing moves below the list. Lose: one more state to build, and a gap under the one match. Pick: no. The box is inert, and the tapped row already moves today. Owner grant: no.

4. **Folded pose.** Card in Hand opens only on two pages (`PackagesTab.twoPages`). The folded frame is drawn only to say that nothing changes. Owner grant: no.

## SwiftUI change implied by the pick

In `HandScreen.leftPage`, move the two `notice` calls (`hand-held`, `hand-strays`) below `matches`. Keep the error line where it is, under This envelope. A UI test pins it: with a held card and a stray, the first `hand-hit:` row's maxY sits at or above the keys' drawn top (`keys.frame.minY - keyboardDrawnAbove`), and `hand-held` sits below the last `hand-hit:` row.

Focus ids for the waiting page: `focus-under`, `focus-one-line`, `focus-answer-page` (default text), each with an `-ax3` twin; `focus-today` for Today; `focus-under-tap` for the tap pair.

## Critique (impeccable, single context: no sub-agent tool in a designer)

- Fixed: the fold, keys and tag labels were 10.5 px; now 11 px.
- Not changed, false alarm: the detector flags the 10.5 pt micro labels (the app's own `HandScreen.micro` size), the cream page (the repo's `paper` token, `design-parchment-ledger`), and the line rows flush to the list border (the built `ItemLine` look).
- Open: in the pick at AX3, nothing above the keys says a card is held. The answer page's offer says it only when the held card came with the shown envelope.

## Input needed

- Should a held card also show as a short count in the header row ("1 held"), so it stays in view at AX3 while the boxes sit under the keys? Not drawn: it changes the header, which this lane holds constant. Not blocking.
