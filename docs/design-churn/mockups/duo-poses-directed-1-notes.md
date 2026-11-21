# Duo stacked poses, directed designer 1: notes

Designer kind: directed. Direction: desk mode. The laptop pose is the primary pose. Keys and list below, answer above.

Mockup: `duo-poses-directed-1.html`. Debt: `duo-stacked-poses-unbuilt`. Decision: `duo-card-in-hand` (item 28 a: answer page on top, system tab bar at the bottom). Sample data only; nothing on the page is real.

## Sources

- Code read on origin/main at d13cf0b1: `DuoSpread.pages(for:)` and `DuoSystemBar` in `native/Manifest/DuoSpine.swift`; `DuoHinge` and `DuoSpread` in `ManifestKit/DuoSpread.swift`; `PackagesTab.twoPages`, `HandScreen.leftPage`, `HandScreen.lines`, `HandPostBar` in `native/Manifest/HandScreen.swift`; `PackageRow` in `PackagesView.swift`; `UIUserInterfaceStyle Light` in `Info.plist`.
- Figures: `duo-fold-and-keyboard` (fold 40 pt at 455.5, keys frame 263 pt, 44 pt drawn strip, outer screen 466 by 678, tab bar zone 83 pt). `duo-hand-held-box.html` (keys top 428 with no word suggestions, so 23 pt lower).
- Apple pages, read 2026-11-21 through `developer.apple.com/tutorials/data/.../<page>.json`, each answered 200: Layout (respect safe areas; a keyboard layout guide), Typography (Large default and AX5 tables: Body 17 and 53, Title 1 28 and 58, Title 2 22 and 56, Footnote 13 and 44, Caption 1 12 and 43, Large Title 34), Accessibility (44x44 pt default control, 28x28 minimum), Buttons, Tab bars ("A tab bar floats above content at the bottom of the screen"), Virtual keyboards ("Use the keyboard layout guide").

## Unmeasured, drawn as stated

- The stacked window. No record measures it. It is drawn 669 by 951 pt, the brief's open size turned a quarter, fold at y 455.5 to 495.5.
- The keys' height in a stacked pose. Drawn with the side-by-side frame (263 pt) plus the 44 pt drawn strip, from y 644. The half-open frame read 801 pt wide, so the keys may differ in laptop pose. The page prints the room this leaves: 148.5 pt above the keys, 171.5 pt with no word suggestions. Every flat-page layout below fits 148.5 pt.
- The tab bar zone in a stacked pose: drawn with the folded reading, 83 pt.
- The large phone: no record writes its size. Drawn at the folded 466 by 678 pt as a stand-in.
- Status bar: the 20 pt floor of `DuoHandUITests.statusBarFloor`, as the other Duo mockups.

## Choices

1. **Two concepts on one axis: where the presses go.** Typewriter puts every press but Post on the flat page. Desk keeps today's press places and turns the pages. Gain: one clear question for the owner. Loss: no third structure, such as a custom key pad (item 22 rules the system keys). Pick: Typewriter.

2. **Typewriter: the standing page is read-only, except Post.** Lines on it show ticks but take no tap. Gain: in laptop pose the standing page wobbles under a finger and sits at arm's length; nothing there needs a press. Loss: a person who taps a line above gets nothing. Departs from: `HandScreen.lines`, where each line is the check-in control. Owner grant: yes. Pick: yes.

3. **Typewriter: each match row carries its own check box.** A tap on the name chooses it (today's hold, item 48); a tap on the box checks that card in to its one envelope, and the box ticks at the press (`ux-answer-at-press`). A name two envelopes share shows "2 envelopes" and no box. Gain: a card checks in where it was named, in one press. Loss: two targets per row; the box is a second meaning beside the name. Departs from: today's check-in on the answer page lines (`HandScreen.lines`). Owner grant: yes. Pick: yes.

4. **Post sits at the answer page's foot in stacked poses.** The 53 pt bar, a hairline, 4 pt, the 44 pt button, 4 pt, as item 103 b, pinned above the fold. The answer page's scroll region ends above the bar, as `DuoSystemBar` keeps a content margin, so the lines scroll clear of it (the 10-line Alpha envelope fits whole). Gain: the flat page has no room: 148.5 pt holds the field row and two match rows, and the bar would cover the tapped row and land under the finger. Loss: one press on the standing page, at its lowest edge. Departs from: item 103 b, "a bar pinned just above the keys" (`HandPostBar`, `HandScreen`). Owner grant: yes. Pick: yes, both concepts.

5. **The offer stands after a row tick.** If the held card's mate checks in from its row, the bar still offers "Post the held card here". Gain: a row tick never strands the held card. Loss: none seen. Pick: yes.

6. **The field row hugs the fold.** Field, New envelope and Close share one row, 4 pt below the fold, 4 pt gaps. The head's figures ("6 in · 12 out") move up to the standing page, with "still out" added in money. Gain: two match rows fit above the keys. Loss: Close leaves the head; the head gains a money figure. Departs from: `HandScreen.leftPage` (head, field, This envelope row). Owner grant: yes. Pick: yes, both concepts.

7. **Packages spreads in stacked poses.** Orders below, the day or the picked order above. Typewriter opens the order's lines on the flat page (a push, "‹ Orders"), and the standing page keeps the summary only, so no name shows twice. Desk shows the lines above and checks them in there. Gain: the list sits under the hand and the answer stands up. Loss: a new layout for Packages. Departs from: the default "Packages does not spread on the open Duo" (default, not owner) and `DuoSpread.pages(for:)`, which keeps one page when stacked. Owner grant: yes. Pick: Typewriter's.

8. **The Card in Hand control in stacked poses.** Typewriter draws it as a field, "Type the card in hand", on the fold's lower edge. Desk draws a "Card in Hand" pill at the leading end of the search row, so an open leaves the hand's field under the finger, never its Close. Both keep item 35 a: Card in Hand opens from a control in Packages. Gain: the control says what it does. Loss: Typewriter's opener looks like a search field and is not one; Desk has search and Typewriter has none. Pick: Typewriter's.

9. **Desk adds a Packages search below the fold.** It filters by seller, order id or card name, and shows "No order matches" with Clear search when empty. Departs from: the native client has no Packages search (debt `native-filters-tally-only`). Owner grant: yes. Pick: only with Desk.

10. **The answer page sets larger type in stacked poses.** Seller as Large Title (34), lines as Body (17), day figures at 34. Gain: read at arm's length on a desk. Loss: fewer lines per page. Pick: yes.

11. **The fold is empty.** Nothing sits across y 455.5 to 495.5; the reader on each stacked frame checks it.

12. **Tall pose draws the same layout as laptop.** The app sees `DuoSpread.stacked` in both; only the hinge differs (`.flat`). Gain: one layout to build and test. Loss: held flat in two hands, the standing page no longer wobbles, so Typewriter's read-only lines cost a little there. Pick: same layout.

13. **Typewriter on the folded screen (option, its own hide button).** Card in Hand opens on the one folded page: answer above, field and matches below, keys at the foot (289 pt, the taller reading). Gain: one mental model in every pose. Loss: at AX5 no match row fits above the keys and the placeholder cuts off (the reader says so). Departs from: `PackagesTab.twoPages`, which keeps Card in Hand off the folded screen. Owner grant: yes. Pick: no, unless the AX5 loss is accepted.

14. **Folded, side by side and the large phone are unchanged.** Drawn as references. At AX5 the folded Packages masthead takes the first screen and the list scrolls; figures pair in two columns and rows stack, as `ViewThatFits` would. Today's build clips there (debts `native-masthead-axl-clips`, `native-axl-rows-break`); this drawing does not fix them.

15. **Light only.** The app ships `UIUserInterfaceStyle Light`, so there is no theme switch to draw.

16. **What is live.** The laptop and tall frames of each concept, and the folded Typewriter option (its own state, opening in Card in Hand), take taps and typing. The tab bar answers: another tab says it is not part of this mockup. Shift and 123 are drawn only. The search states exist in Desk only, since Typewriter has no Packages search.

## Self-review (design-review applied to this mockup)

- Structure verdict: `new`. Packages spreads in stacked poses, and Typewriter moves check-in to the flat page.
- Native or web-like: Typewriter laptop and tall `native` (system keys, floating tab bar, a navigation push with a back button, 44 pt targets); Desk laptop and tall `native`; folded and phone references `native`. One web-like part: the field-shaped Card in Hand opener, a button drawn as a text field.
- Readers on the page: room above the keys, controls under the keys, presses on the standing page, controls across the fold, and after each press what sits under the finger. A press that leaves a check-in or Post under the finger reads red. The click-through found none in either concept.
- `label_once.py` on the rendered frames: card names showed twice in Typewriter's open order; fixed (item 7). Remaining hits are data.
- `check_ios_mockup.py`: one fault, `system-font`, for Cochin. The app sets words in Cochin (`typography-cochin-and-mono`), and every earlier Duo mockup in this folder gets the same fault. A possible false alarm.

## Critique (impeccable, design review only)

Fixed: a row tick stranded the held card (item 5); no failed-Post state (added "Post failed"); day figures too small for arm's length (item 10); the Typewriter hint pointed at the wrong page.

Open:
- Typewriter's Close sits where the opener field sits, so a quick second tap reopens Card in Hand. It writes nothing; the reader shows it in soft ink.
- The standing page in Typewriter's order view is mostly empty paper.
- Flexibility: no hardware-keyboard path is drawn, though laptop pose invites one.
