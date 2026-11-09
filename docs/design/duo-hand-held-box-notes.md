# Card in Hand: a held card shows above the keys

Mockup: `duo-hand-held-box.html`. Debt: `hand-held-box-under-keys`, closed by the pick once a test pins it. Decision: `duo-card-in-hand`. Invariant: `no-layout-shift-under-pointer`.
Lane kind: informed (the brief names no kind).

Deep links: `#s=today`, `#s=field`, `#s=row`, `#s=strip`, `#s=press`, `#s=folded`. Filters: `z=default` or `z=ax3`, `c=1` or `c=2` (matches), `k=down` (keys left out, to see under them). Join with `&`, for example `#s=field&z=ax3&c=2`. No hash shows all. Three buttons hide one option each.

Focus ids for the waiting page (default text, two matches): `focus-today` (the Suspense box), `focus-field`, `focus-row` (the chip), `focus-strip` (the strip's chip).

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. The open pose is drawn at the brief's size: 951 by 669 pt, fold 40 pt at 455.5 to 495.5 pt (`duo-fold-and-keyboard`, Figures, fold strip).
- Keys top: 405 pt, the drawn panel top (`duo-fold-and-keyboard`, Figures, "Keyboard panel, drawn"; `DuoHandUITests.swift:75`, `keyboardDrawnAbove = 44` over the 449 pt frame). A dotted line marks 428 pt, the keys top with no word suggestions (`hand-held-box-under-keys`, measured 2026-11-07).
- Status bar foot: unmeasured, drawn at 20 pt (`DuoHandUITests.swift:72`, `statusBarFloor`).
- Field top about 155 pt: the 63 pt band from `duo-hand-tap-shift-notes` (Sizes and sources). What fills it is not read; it is drawn empty and labelled.
- Left page: 16 pt padding (`HandScreen.swift:130`), 12 pt stack gap (`HandScreen.swift:83`), field `minHeight: 48` (`:95`), match rows `minHeight: 44` with a 10 pt inset (`:158-159`), the box 12 pt padding and a 2 pt stack (`:170-177`). Order: header, field, This envelope, error, matches, Suspense box, Released box (`:84-128`).
- Chip type: Menlo 12 relative to Caption, the type of `hand-count` (`HandScreen.swift:88`). Colours: `manila` `#EADBBA` and `manilaInk` `#695832` (`shared/tokens.json:14-15`), the boxes' own. Contrast 5.04:1, over the 4.5:1 floor on the Accessibility page.
- AX3 ratios (HIG Typography, read 2026-11-08): Body and Headline 17 to 40, Caption 1 12 to 32, Footnote 13 to 33, Title 2 22 to 44. The chip is capped at xxxLarge: Caption 1 12 to 18 (same page).
- Calibration: today, default text, one match, keys at 405: the drawing puts the Suspense box at y 352 to 424 (19 pt under the keys) and the Released box wholly under them. That is the 2026-11-07 reading in the debt: last line cut, Released hidden.
- Every other y comes from the drawing's own reader (headless Chromium, Cochin and Menlo), not a simulator. Treat each as within a few points. The builder's UI test is the real check.
- Theme: one. The native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-11-08, each answered 200: Accessibility (44x44 pt control, 11 pt minimum text, 200 percent text, 4.5:1), Buttons (44x44 pt hit region), Layout (safe areas), Typography (the Dynamic Type tables).
- Sample: Lightning Bolt held (shared by Alpha Cards and Beta Games, as in `HandModelTests`), Counterspell released, Alpha Cards with its Post offer on the right page. One match: "Path to". Two matches: "to". Presses: "Wr" typed, tap Wrath of God (shared, so it is held after the 150 ms settle, `HandScreen.swift:104`, then `HandModel.type`, `HandModel.swift:51`); New envelope moves held to released (`HandModel.swift:117`).

## Today, read from the drawing

- Default, one match: the Suspense box is cut by 19 pt and the Released box is hidden.
- Default, two matches: both boxes wholly under the keys.
- AX3: the first match itself sits at y 399 to 443, under the keys, before any box. So no option that adds height above the matches can show a box at AX3. Only a notice inside a part that is already above the keys can.

## Items

1. **Where the short held line sits.** One variable. Every frame keeps today's boxes below the matches, the same sample, and the same chip text: "1 held", "n released", or both joined by " · ". VoiceOver reads the names: "Held: Lightning Bolt. Released: Counterspell. Not checked in."
   - **Chip in the field (pick).** Trailing edge of the field, inside its 48 pt box. Chip y 169 to 192 at default, 215 to 245 at AX3: above the keys at both sizes, with one or two matches. Gain: the field is the highest content and the place the eye rests while typing. Its height does not change, so the chip comes, changes and goes with nothing moving (press readers: field, New envelope and every row keep their place, at both sizes). Lose: typed text gets 236 pt at default and 168 pt at AX3, so a long name scrolls in the field at AX3. A chip in a search field can read as a search token. Departs from: `HandScreen.leftPage`, where the field holds the TextField alone (`HandScreen.swift:92-98`). An addition; nothing moves. Not blocking.
   - **Chip in the envelope row.** Between "This envelope" and New envelope. Chip y 227 to 250 at default, 289 to 319 at AX3. Gain: the held card sits beside the control that releases it, so a New envelope press answers where it was pressed. Lose: at AX3 the row has no room; New envelope runs 183 pt past the page edge. The button's place follows the chip's width: on its own press at AX3 it moves 98 pt left, and a tap that holds a card moves it 42 pt right. That breaks `no-layout-shift-under-pointer`. Departs from: the row in `HandScreen.swift:111-118`. Not blocking.
   - **Strip above the field.** A reserved line between the header and the field, there whether or not a card is held: a line that came with the card would push everything under the finger. Chip y 156 to 179 at default, 206 to 237 at AX3. Gain: never shares a line with a control or with typed text. Lose: 35 pt lower for every part on every frame (the field's 12 pt gap plus the line). At default the second match goes under the keys (y 387 to 431), so the tap it would need is lost. An empty band shows when nothing is held. Departs from: `HandScreen.swift:84-92`, where the field follows the header. Not blocking.
   - Pick: Chip in the field. It alone shows the held line above the keys at every size and match count, and moves nothing on a tap or a New envelope press.
   - Owner grant: no.

2. **The chip's size at AX3.** Capped at xxxLarge (Caption 1 18 pt, 150 percent), under the 200 percent the Accessibility page asks for. Uncapped, at 32 pt, "1 held · 1 released" would fill the field and leave no room to type. The Suspense and Released boxes still scale in full; the chip only points at them. The builder adds `.accessibilityShowsLargeContentViewer()` so a long press shows it large. Gain: the field stays usable at AX3. Lose: one text below the 200 percent floor. Departs from: every left-page text scales with its style today (`HandScreen.swift`, `relativeTo:` on each font). Owner grant: yes.

3. **The word "held" twice.** While the Post offer shows, its button reads "Post 2 cards here, 1 held" (`HandScreen.swift:330`) and the chip reads "1 held". `ux-label-once` passes a word in a sentence, and the button's text is one. The same holds in every option. Owner grant: no.

4. **A tap on the chip.** Not drawn. A tap could close the keys and scroll the left page to the boxes. Gain: one press to see which card. Lose: a control that moves the page; the keys' own close does it today. Pick: no; the chip stays inert. Owner grant: no.

5. **Not drawn: the header row and the right page.** The header at AX3 already wraps to 94 pt (title and count), so "1 held" there would move every part below it. The right page was drawn and rejected in `duo-hand-notice-match-notes` item 1: a box above the sender puts Post under the keys, and item 42 (`duo-hand-post-order`) is open. Owner grant: no.

6. **Post at AX3, outside this lane.** On the right page at AX3, Post sits under the keys in every frame here, today included. That is the place item 42 asks about. Reported, not drawn as a change.

7. **Folded pose.** Card in Hand opens only on two pages (`HandScreen.swift:32`, `PackagesTab.twoPages`). The folded frame is drawn at the 2026-11-08 outer screen, 466 by 678 pt (`duo-fold-and-keyboard`), only to say nothing changes. Owner grant: no.

## SwiftUI change implied by the pick

In `HandScreen.leftPage`, put the TextField and a chip in one `HStack(spacing: 8)` inside the field's background and border, so the 48 pt box holds both. The chip shows when `hand.held != nil || !hand.strays.isEmpty`, with `.lineLimit(1)`, `.fixedSize()`, `.dynamicTypeSize(...DynamicTypeSize.xxxLarge)`, `.accessibilityShowsLargeContentViewer()`, and an accessibility label that names the cards. The boxes stay where they are. A UI test closes the debt: at AX3 with two matches and a held card, the chip's maxY sits at or above `keys.frame.minY - keyboardDrawnAbove`, and the field's frame is the same before and after a tap that holds a card and after New envelope.

## Critique (impeccable, design review only: native platform, no sub-agent tool in a designer)

- Fixed: the envelope-row reader read only y, so it missed the button's sideways move; it now reads x too, and the row option's caption says what it found.
- Fixed: a tap pair whose tapped row sits under the keys (every AX3 pair, and the strip at default) read as a pass. It now reads as unknown: it checks the layout rule only, since no finger reaches the row.
- Fixed: the page edge check fired at 1 pt from rounding; the limit is now 441 pt.
- Fixed: the frames are drawn by script, so the iOS mockup check found no unfolded frame; each slot now carries `data-device`.
- Open, product: the chip may read as a search token. A builder can test that with the owner; no change here.
- Open, product: Post sits under the keys at AX3 (item 6).

## Input needed

- Item 2: cap the chip at xxxLarge at the largest text sizes? Not blocking; the builder can ship the cap and change it.
