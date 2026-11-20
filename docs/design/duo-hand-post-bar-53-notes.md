# Card in Hand: the 53 pt Post bar

Mockup: `duo-hand-post-bar-53.html`. Decision: `duo-card-in-hand` (Post offer paragraph). Debt: `duo-post-bar-unmeasured-s-m`.
Owner rulings, 2026-11-19 19:26 CST: item 103 b (button-only bar, 53 pt), item 104 a (bar text capped at xxxLarge, large content viewer), item 105 a (the Post head keeps the seller only at the largest sizes). Item 80 (held-card words) is open: wording stays as built.
Prior drawing: `duo-hand-post-pin.html` on branch `design-duo-post-pins` (its button-only, capped and slim-head figures are the options ruled here).
Designer kind: informed (the brief names no kind).

Deep links: `#s=folded`, `#s=today`, `#s=bar`, `#s=posted`, `#s=refused`, `#s=pro`. Text size `z=s|m|l|ax1|ax2|ax3|ax5`, theme `t=light|dark`, joined with `&`, as in `#s=bar&z=ax5&t=dark`. No `z` draws each state at L, AX3 and AX5 (posted and refused at L and AX5).

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. The open Duo is drawn at the brief's size of earlier lanes: 951 by 669 pt, fold 40 pt at 455.5 pt (`duo-fold-and-keyboard`). Keys panel from y 405, frame from 449 (`duo-keyboard-gap-unmeasured`).
- Top inset: drawn at 80 pt, the design review's reading in debt `duo-post-bar-unmeasured-s-m`. Earlier mockups drew 20 pt and showed one line too many.
- Folded and iPhone 18 Pro: no Card in Hand. It opens only on two pages side by side (`HandScreen.twoPages`, `DuoSpread.pages(for:)` in `DuoSpine.swift`). Both are drawn as a note, with no frame size invented.
- Text sizes from Apple's iOS Dynamic Type table: Body 17 (AX1 28, AX2 33, AX3 40, AX5 53), Footnote 13 (xxxLarge 19), Caption 1 12 (xxxLarge 18), Title 2 22 (AX3 44, AX5 56).
- Fonts: Cochin and Menlo are not installed where this page was measured, so a fallback face set the text. Real Cochin set wider than the stand-in before (debt `duo-post-bar-unmeasured-s-m`). Wrap points can differ on the phone.
- Themes: light ships. Dark is a preview from the twelve `dark*` keys in `shared/tokens.json` (`native/project.yml` holds the app to Light).
- Apple pages read 2026-11-19, each answered 200: Typography (the table above), Buttons ("a hit region of at least 44x44 pt"), Accessibility (enlarge text by at least 200 percent), Layout (safe areas).

## Measured on this page (pt from the pin's hairline to y 405; whole lines left above it)

| Pin | S | M | L | AX1 | AX2 | AX3 | AX5 |
|---|---|---|---|---|---|---|---|
| Today, one-row as built | 61, 2 | 61, 2 | 61, 2 | 103, 0 | 151, 0 | 175, 0 | 220, 0 |
| New, 53 pt bar | 53, 2 | 53, 2 | 53, 2 | 53, 1 | 53, 1 | 53, 1 | 53, 0 |
| Receipt and refusal | 53 | 53 | 53 | 53 | 53 | 53 | 53 |

## Items

1. **The bar.** Ruled, item 103 b. `HandScreen.pinned` pads 4 pt above and below, not 8. `offerRow` becomes the Post button alone, `MiniLabel(wide: true)`, full width. The sentence and `ViewThatFits` go. 1 + 4 + 44 + 4 = 53 pt. Gain: 8 pt. Loss: at L with an 80 pt inset it shows no extra whole line. Two whole lines show, as at 61 pt; the third line shows 42 pt, not 34. Departs from: `HandScreen.offerRow` (ruled). Owner grant: no.

2. **Where "Your held card came with this envelope." goes.** Off screen. It becomes the first sentence of the Post button's VoiceOver hint: "Your held card came with this envelope. Nothing is checked in until you post." Wording as built (item 80 open). On screen, the label's "2 held" and the left page's "1 held" chip say why Post is there. Settled by item 103 b as drawn: the picked figure's caption says both sentences move to VoiceOver. Not the head: at AX sizes item 105 a leaves the head the seller only. Owner grant: no.

3. **The cap.** Ruled, item 104 a. Put `.dynamicTypeSize(...DynamicTypeSize.xxxLarge)` on the pinned bar, so it covers the offer and the receipt. Put `.accessibilityShowsLargeContentViewer()` on the Post button, as `heldChip` does. The bar is then 53 pt at every size, and its label stays on one line at AX5 on this page. Departs from: `relativeTo:` scaling with no cap (ruled). Owner grant: no.

4. **The receipt at the cap.** "Posted." with the long count ("12 cards checked in · 2 were held") does not fit the 423 pt row at xxxLarge on this page, from AX1 up. Pick: `ViewThatFits(in: .horizontal)`, with both texts first, then the second text alone. The receipt's VoiceOver label keeps both. Gain: one row, 53 pt, no overflow, and the text keeps its capped size. Loss: at AX sizes, a long count drops the word "Posted." from the screen; "checked in" still says it. The other way is `lineLimit(1)` with `minimumScaleFactor`, which shrinks below the cap that item 104 a set. It is not drawn. The refusal fits on this page. The same fallback keeps "Type the card again to post." if Cochin runs wider. The control "Hide the short receipt" shows the overflow. Departs from: `HandScreen.receiptRow`, where both texts always show. Not blocking. Owner grant: no.

5. **The head.** Ruled, item 105 a. At AX3 and above (`dynamicTypeSize >= .accessibility3`), the head keeps the seller only. "It came from" and the order date move to the head's VoiceOver label. AX3 and above is the range the picked option drew. AX1 and AX2 keep the full head and still show 1 whole line, so nothing calls for a wider range. Owner grant: no.

6. **AX5 still shows no whole line.** Even with the cap and the slim head, the lines window is 184 pt. One line at AX5 is about 190 pt, because its name and price wrap. The prior page's "1 whole line at AX5" assumed a 20 pt top inset. Pick: accept. Most of the first line shows, and the line scrolls. One alternative is a head that scrolls away with the lines at AX5. It is not drawn, because it would change item 105 a. Owner grant: no.

7. **Keys down.** No change. The bar keeps the `DuoBarMetrics.height` pad over the tab bar, unmeasured (debt `duo-post-bar-unmeasured-s-m`). Owner grant: no.

## What the builder measures on the simulator

- A UI test of the offer bar's own height: 53 pt within 1 pt at S, M, L, AX3 and AX5. Today only the receipt is read (`testPostReceiptIsOneRowAboutSixtyOnePointsTall`). Retarget that test to 53 pt for the receipt and the refusal.
- `testPostBarPinsAboveTheKeysAtTheirDrawnTop` allows 10 pt either side. With a 4 pt foot, tighten it, or a bar with no foot still passes.
- At AX5: the label stays on one line, a long press on Post shows the large content viewer, and the receipt is one row with the long plural count.
- The head: full at xxxLarge and AX2, the seller only at AX3 and AX5, with "It came from" and the date in its VoiceOver label.
- The Post button's VoiceOver hint reads both sentences in order.
- Whole lines above the bar at L, AX3 and AX5. This page says 2, 1 and 0 with an 80 pt inset.

## Records the builder's lane must change (outside the design folder)

- Decision `duo-card-in-hand`, Post offer paragraph: the 61 pt figure, the one-row sentence, the button that drops under it, the hint text, the "wait for items 104 and 105" sentence, and the mockup pointer.
- Debt `duo-post-bar-unmeasured-s-m`: the 61 pt figure and the AX status.

## Critique (impeccable, on this mockup)

Method: degraded, single context, because no sub-agent tool is exposed. A design review by eye at L and AX5 in light and dark, plus `impeccable detect`. The snapshot step is left out, because it is outside the design folder.

- Detector, 6 warnings. Fixed: the "top inset 80 pt" note, from 10.5 to 11 px. False alarms: four cramped-padding hits on the device frame and the lines list, whose rows run edge to edge as a native list does. Open, page chrome: 11 px annotation text. Open, product: the app's micro labels are Menlo 10.5 pt at L (`HandScreen.micro`), under the 11 pt minimum. This finding is unchanged from before.
- Fixed: the receipt overflowed its row at the cap (item 4).
- Open, product: at L the 8 pt buys no whole line (item 1). At AX5 no whole line shows (item 6).
- Open, page: the dashed "New" outline sits over the bar's 1 pt hairline.
- Open, check: `check_ios_mockup.py` faults the Cochin content font, which the app ships (`typography-cochin-and-mono`), as on the earlier Duo mockups.

### Input Needed

- None blocking. Item 6: is no whole line at AX5 acceptable, or should the head scroll away at AX5? Pick: accept.
