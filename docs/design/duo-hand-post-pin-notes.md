# Card in Hand: a thinner pinned Post bar

Mockup: `duo-hand-post-pin.html`. Decision: `duo-card-in-hand` (Post offer paragraph). Owner ruling: item 42 b, `duo-hand-post-order`, "Build B now", 2026-11-18 23:22 CST, with the note "make the pin not so thick". Prior drawing: option B in `duo-hand-post-sender.html`.
Designer kind: informed (the brief names no kind).

Deep links: `#s=stacked`, `#s=onerow`, `#s=button`, `#s=capped`, `#s=slimhead`, `#s=posted`, `#s=refused`, `#s=folded`. Text size `z=s|m|l|ax3|ax5`, theme `t=light|dark`; join them with `&`, as in `#s=onerow&z=ax3&t=dark`. No hash shows every state at L in the system theme.

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. The open pose is drawn at the brief's size: 951 by 669 pt, fold 40 pt at 455.5 to 495.5 pt (`duo-fold-and-keyboard`). Folded is drawn only to say nothing changes: Card in Hand opens on two pages only (`PackagesTab.twoPages`).
- Keys top: 405 pt, where the panel draws, 44 pt above the 449 pt frame (`duo-keyboard-gap-unmeasured`). Status bar foot: 20 pt, the floor in `DuoHandUITests.statusBarFloor`, unmeasured.
- Text sizes: S, M, L (default), AX3, AX5. Each text scales by its own style, as `Font.custom(_:size:relativeTo:)` does (`Theme.swift`, `cochin` and `mono`). Ratios and line heights come from Apple's iOS Dynamic Type table: Body 17 (S 15, M 16, AX3 40, AX5 53), Footnote 13 (S and M 12, AX3 33, AX5 44), Caption 1 12 (S and M 11, AX3 32, AX5 43), Title 2 22 (S 20, M 21, AX3 44, AX5 56). S and M give the same Footnote and Caption 1, so the bar is the same height at both. The 44 pt hit frames, the 45 pt check box and the pads do not scale.
- Every pt figure here is read from the mockup's own layout in headless Chrome at 1 CSS px to 1 pt, not estimated. The page prints the same figures under each frame and in its table. Cochin, Menlo and Georgia are not installed on the box that measured, so Chrome's fallback faces rendered (which ones is unverified), and a wrap point can differ on the phone. A one-line bar holds its 44 pt floor either way. The builder's UI test is the real figure.
- Pin height is from the pin's top edge (its hairline) down to y 405.
- The drawn option states its pin as 126 pt (offer 110 plus 8 above and 8 below, its own estimate with a 17 pt sentence line). This page lays the same stack out at 128 pt at L, because it uses Apple's 18 pt Footnote leading.
- Themes: light is the shipped theme. Dark is a preview only: `native/project.yml` holds the app to Light (`UIUserInterfaceStyle`). It uses the twelve `dark*` keys in `shared/tokens.json`. There is no dark green-soft key, so the checked line in dark is a mix of dark green and dark card. The dark keyboard greys are iOS chrome with no token.
- Apple pages read 2026-11-18, each answered 200: Typography (the Dynamic Type table above), Buttons ("a button needs a hit region of at least 44x44 pt"), Accessibility (44x44 pt default control size; enlarge text by at least 200 percent), Layout (respect system-defined safe areas).

## Measured (pt; lines = whole lines left above the pin, at rest)

| Pin | S | M | L | AX3 | AX5 |
|---|---|---|---|---|---|
| Stacked, as drawn | 109, 3 | 109, 2 | 128, 2 | 285, 0 (covers the head by 73) | 385, 0 (fills the page) |
| One-row | 61, 3 | 61, 3 | 61, 3 | 167, 0 | 212, 0 (covers the head by 94) |
| Button-only | 53, 3 | 53, 3 | 53, 3 | 109, 0 | 137, 0 (covers the head by 19) |
| One-row, capped text | 61, 3 | 61, 3 | 61, 3 | 87, 1 | 87, 0 (top 21 pt of one) |
| Capped, slim head | 61, 4 | 61, 4 | 61, 4 | 87, 2 | 87, 1 |

## Items

1. **How thick the pin is.** Three steps. Each keeps the 44 pt Post hit frame (Buttons page).
   - Stacked pin, as drawn. The sentence sits over the button in a card inset 16 pt, with 8 pt clear above and below. 128 pt at L. Gain: both sentences show. Loss: at L, two whole lines show above it. At AX3 it covers the sender head.
   - One-row pin. A full-width bar on the keys, with a hairline on top. "Your held card came with this envelope." sits beside the Post button. 61 pt at S, M and L: 1 + 8 + 44 + 8. Gain: less than half the drawn height, three whole lines at L, and the sentence that says why Post is there stays. Loss: "Nothing is checked in until you post." moves to the button's VoiceOver hint. When the sentence and the button do not fit on one row, the button drops under the sentence (`ViewThatFits`).
   - Button-only pin. The button alone, full width, 4 pt above and below. 53 pt: 1 + 4 + 44 + 4. Gain: the thinnest bar that keeps the 44 pt frame. Loss: both sentences leave the screen. Only the button's "1 held" and the left page's held chip say why it is there. It is 8 pt thinner than one-row and shows no extra whole line at S, M or L.
   - Pick: one-row, 61 pt.
   - Departs from: the drawn option, sentence over the button (`duo-hand-post-sender.html`, option B), and `HandScreen.offerContent` (two sentences). Not blocking.
   - Owner grant: no.

2. **The bar's text at accessibility sizes.** Uncapped, the one-row pin is 167 pt at AX3 and 212 pt at AX5, and no whole line shows. Capped, its Footnote stops at 19 pt and its Caption 1 at 18 pt (xxxLarge), as the held chip does. The bar is then 87 pt at AX3 and AX5. The button gets `.accessibilityShowsLargeContentViewer()`, so a long press shows the label large. Gain: one whole line at AX3. Loss: two bar texts stay under the 200 percent the Accessibility page asks for. The lines and the sender still scale in full. Pick: cap. Departs from: every Card in Hand text scales with its style today (`relativeTo:` on each font in `HandScreen.swift`). Not blocking. Owner grant: yes.

3. **The pinned head at accessibility sizes.** With the capped bar and the full head, AX5 shows the top 21 pt of a line and no whole line. At AX3 and AX5 the pinned head keeps the seller only. "It came from" and the order date move to the head's VoiceOver label. AX5 then shows 1 whole line, and AX3 shows 2. Gain: a whole line shows at AX5, which the brief asks for. Loss: at AX sizes the date is not on screen while Post shows. A builder's alternative is to let the head scroll away with the lines. It shows nothing more at rest, so it is not drawn. Pick: slim head at AX3 and AX5 only. Departs from: the drawn option's full pinned head. Not blocking. Owner grant: yes.

4. **After Post.** The hidden offer still sizes the slot (`HandScreen.receiptBox`), so the receipt is the bar's own height: 61 pt at L, 87 pt capped at AX sizes. The lines above do not grow into the bar under the finger (`no-layout-shift-under-pointer`). But today's overlay is a VStack, a sentence over a 44 pt line, about 70 pt, and it would overflow a 61 pt bar. So the overlay becomes one row, capped like the bar. On success it reads "Posted." in Cochin, then "2 cards checked in · 1 was held" in mono, `manilaInk`, as built. On a refusal it reads "Not posted." then "Type the card again to post." in Cochin, `Parchment.red`, as built (`#s=refused`). Pick: one-row receipt. Departs from: `receiptBox`'s success sentence, "Posted with this envelope. The next card you type clears this line.", which is cut to "Posted." to fit one row. Not blocking. Owner grant: no.

5. **The keyboard figure.** A pin made with `safeAreaInset(edge: .bottom)` ends at SwiftUI's keyboard inset, the 449 pt frame. The panel draws from 405. So every step here sits on the keys only with a 44 pt pad, which is unmeasured (`duo-keyboard-gap-unmeasured`). If the panel draws higher, the bar sits under the keys and no scroll reaches it. A thinner bar does not change this. The builder's UI test checks that the Post button's maxY is at or above `keys.frame.minY - keyboardDrawnAbove`. Owner grant: no.

6. **The order.** The lines go back under the sender, as before the Post-under-sender change. The scroll to the page top when the offer shows (`hand-post-top-scroll-unpinned`) is no longer needed: the bar is always on screen. Owner grant: no (item 42 b rules it).

## SwiftUI change implied

In `HandScreen`, pin the sender block (micro, seller, date) above the scroll view. At accessibility sizes, keep the seller only. Put `postBox` in `.safeAreaInset(edge: .bottom)` as one full-width bar: an `HStack` of the first sentence and the Post button inside `ViewThatFits`, with a 1 pt `Parchment.line` hairline on top and `Parchment.manila.opacity(0.5)` fill. Pad it 8 pt top and bottom and 16 pt at the sides, and add the 44 pt keyboard pad. Cap the bar at `.dynamicTypeSize(...DynamicTypeSize.xxxLarge)` and add the large content viewer. Keep the receipt sized by the hidden offer, and make its overlay one `HStack` row, capped like the bar. Drop the scroll to the top.

## Critique (impeccable, on this mockup)

Method: design review in one context (no sub-agent run, so a degraded run by the skill's terms), plus `impeccable detect` on the page. Snapshot step left out (outside the design folder).

- Detector: 6 warnings. False alarms: the lines list and the device frame read as "cramped padding" (rows run edge to edge, as a native list does). Fixed: the FOLD label, 10.5 to 11 px. Open, product: the app's micro labels ("It came from", "Matches") are Menlo 10.5 pt at the default size (`HandScreen.micro`), under the Accessibility page's 11 pt minimum.
- Fixed: the receipt's overlay was a sentence over a 44 pt line, which a one-row bar cannot hold; it is now one row, with a refused state.

- Fixed: the "Today: lines" tag was clipped by the scroll window; it now sits inside the list.
- Fixed: the keys note sat under the bar on the right page; it now sits on the left page.
- Fixed: the pin was laid out in the page flow, so at AX5 it was pushed under the keys and measured short. It is now pinned on the keys, as `safeAreaInset` pins it, and the page reports where it covers the head.
- Fixed: the page's own heading and captions were set in Cochin; they are now the system font, and Cochin is left to the app's content.
- Open, product: at AX3 and AX5 the uncapped bar covers the sender head (items 2 and 3).
- Open, page: the page has 21 controls (size, theme, state, hide). They are mockup chrome for the owner, not app controls.
- Open, check: `check_ios_mockup.py` faults the Cochin content font, which the app ships (`typography-cochin-and-mono`). The prior Duo mockup gets the same fault.

### Input Needed

- Is 61 pt thin enough, or is the 8 pt the sentence costs over the button-only bar worth giving up?
- At AX sizes, cap the bar and slim the head (items 2 and 3), or let the bar grow and accept that no line shows?
