# Order numbers: one tap lands on the order

Mockup: `order-ids-directed-2.html`. Designer kind: directed. Direction: link-first: one tap opens that exact order at the seller.
Debts: `order-id-visible-unbuilt` (the Tally number ends in an ellipsis), `tcgplayer-link-opens-history-list` (the link may open the order list). Decision: `order-id-button-stops-propagate`. Answered, item 61 (owner, 2026-11-21 19:56 CST).

Deep links: `#s=today`, `#s=slip`, `#s=carry`; `#d=folded`, `#d=ax5`, `#d=open`, `#d=phone`; `#st=rest`, `#st=copied`, `#st=menu`, `#st=opened`, `#st=ask&chk=on`; `#t=light`, `#t=dark`. Join with `&`, for example `#s=slip&d=folded&st=copied`. No hash shows all. Focus ids for the waiting page: `choice-slip-folded` and `choice-carry-folded` (and `-ax5`, `-open`, `-phone`).

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. Duo sizes are the brief's: folded 466 x 678 pt; open 951 x 669 pt, hinge 455.5 to 495.5 pt. Nothing in the open frame crosses the hinge except the system status bar.
- Large phone: 402 pt wide, the window width read in `TallyUITests.swift` (comment of 2026-10-28, iPhone 18 Pro). Its height is not written, so the frame shows the top 720 pt, with a dashed foot.
- Status bar and home indicator: unmeasured, drawn at the 20 pt floor of `DuoHandUITests.statusBarFloor`.
- Copy line from `ItemLine`: 45 pt check frame, 8 pt gap, text column padded 12 pt, 4 pt between lines. Tally card from `TallyRowView` (header, across line, bulk row). Open pose: names on the left page, the picked name's detail on the right (`TallyView`, `DuoPages`).
- AX5: `Font.custom(_:size:relativeTo: .body)` (`Theme.swift`) scales by Body, 17 to 53 pt, so x 3.118.
- Readings print under each frame from the drawing (headless Chromium, Cochin and Menlo fall back on Linux). Folded at the default size: slip number 181 pt at 14 pt in a 361 pt column, one line; carry 164 pt at 13 pt. AX5: three lines, broken at the dashes, never cut.
- Apple pages read 2026-11-21, each answered 200: Layout, Typography (Dynamic Type tables, Large and AX5), Accessibility (44 x 44 pt default control), Buttons (44 pt), Edit menus ("let people select and copy noneditable text"), Context menus (use the system icons for Copy and Share), Sheets.
- Theme: the native app is held to light (`design-parchment-ledger`). `t=dark` draws the web's dark tokens, for the web row. No dark `greenSoft` token exists, so the done row mixes `darkGreen` 16% into `darkCard`.
- Sample data in the ledger item shape (`shared/fixtures/ledger.json`). Ids follow the 8-6-5 dash shape and are invented.

## Items

1. **Order slip** (`#s=slip`). The number, whole, at 14 pt (the seller's size), is one link to the order. Its tail is a 44 pt copy key. "Copied" shows over the key for 1.6 s, out of flow. A long press opens the system menu: Open on TCGplayer, Copy Order Number, Share.
   - Gain: two plain acts, each one tap. The clipboard changes only when asked. The number reads at a glance, so it can also be read aloud or typed.
   - Lose: each copy line grows by about 30 pt (a 44 pt slip in place of a 13 pt line). Two icon-only keys per line, explained once by the legend.
   - Pick: yes.
   - Owner grant: yes. A copy control departs from the ruling of 2026-10-21 (`order-id-button-stops-propagate`: "the copy button and its Copied stamp go away"), made for the package header after the owner was asked what a refused copy should show.
   - A refused copy: native `UIPasteboard` takes a write with no permission ask, so it cannot refuse. The web can. There the key turns red, says "Copy blocked. Hold the number to select it", and the number becomes selectable text (`#st=refused`). "Copied" shows only when the write resolved.
2. **Open and carry** (`#s=carry`). One link. A tap copies the number, shows "Copied. Opening TCGplayer" at the press, then opens Safari. A long press offers Copy Order Number, or Open without Copying.
   - Gain: one tap does the whole job: the person lands where the message to the seller is written, with the number ready to paste. Smallest line: 13 pt, no new box.
   - Lose: every open overwrites the clipboard, which may hold a tracking number the person still needs. The receipt says so, and the menu gives a way round it, but the default is a side effect.
   - Pick: no. Keep it if the owner wants the fewest taps.
   - Owner grant: yes, same ruling as item 1.
   - A refused copy (web only): the receipt says "Not copied. Opening TCGplayer", and Safari still opens. From the menu, Copy Order Number refused shows the item 1 state.
3. **Whole number, broken at dashes only.** Each dash group is unbreakable; a break may fall after a dash. No ellipsis at any size. Closes `order-id-visible-unbuilt` for the Tally row. Today: 10.5 pt, `.fixedSize()` on native (`ItemLine.lines`), ellipsis on the web (`ItemRow`).
   - Gain: the person never meets a cut number. Lose: rows grow at AX sizes. Pick: yes.
4. **Where the link lands.** Both concepts use `tcgplayerOrderUrl` (`orderhistory?SearchString=<id>`). Whether TCGplayer shows only that order is unmeasured (`tcgplayer-link-opens-history-list`). So the legend says "opens TCGplayer, searched for that order" until the landing is seen, and the glyph is the open-out arrow. A "My order list" answer swaps the glyph to a magnifier and the legend to "opens your TCGplayer order list, searched for it".
   - The direction asks for the exact order. The only known route to it is this search. A per-order URL from the order-history page's order blocks is unmeasured; storing one would touch `saved-state-shape`. Not drawn.
   - Pick: keep the search URL; the owner's one signed-in check closes the debt.
5. **Landing check** (`Landing check: on`, `#st=ask&chk=on`). After the first return from Safari, a one-time ask laid over the line: "Did TCGplayer show only this order?" Only this order / My order list. The answer sets the legend and glyph for every row.
   - Gain: the screen stops guessing. Lose: an in-app question that serves one check by one person. Pick: no; the owner checks once by hand.
   - Owner grant: yes (new UI).
6. **The Tally jump to Packages.** Departs from: `ItemRow` in `src/app.jsx`, where a tap on the number opens the whole order in Packages (`onOpenOrder`, `a-reveal-ignores-hidedone-too`). Link-first gives that tap to TCGplayer. Proposal, not drawn: the seller name carries the jump, as a button that stops its click. Native has no jump today (`ItemLine`: "Native has no such route yet"). Not blocking.
7. **Clicks stay off the check-in.** On the web the whole row checks in on a tap. The slip, the copy key and the carry link each call `stopPropagation`, as the decision requires. On native only the 45 pt box checks in. The stepper sits 4 pt under the slip. The header's Chromium touch sweep (claim 17a) found link taps drifting up to 11.8 px; the Tally row needs the same sweep before build.
8. **Long press is the system menu.** iOS context menu with the system icons, the pressed number lifted above the dim (Context menus page). The web gets no long press; it keeps text selection.
9. **Safari, not an in-app browser.** The link opens Safari, as the package header's `Link` does today, so the person's TCGplayer sign-in applies. Whether an in-app Safari view shares that sign-in was not read on an Apple page this session: unknown. Where Safari opens on the open Duo is unmeasured; the drawing lays it on the right page.
10. **One legend per open row.** "A number opens TCGplayer... copies it." shows once under the bulk row, so no line repeats "TCGplayer" (`ux-label-once`; `label_once.py` prints nothing on the rendered page).
11. **Copy gives a light success haptic.** Pick: yes, as a confirmation, not a value change (`ux-haptics-feel-substantial` considered).
12. **The package header takes the same slip** (one home, `building-one-home-per-capability`). Not drawn.
    - Owner grant: yes. It brings copy back to the header, against the 2026-10-21 ruling. The refused state is item 1's.
13. **AX5.** The slip stacks: number above, the copy key below with its word. The stepper's glyphs stay 16 pt beside a 40 pt count (`ItemLine.stepButton` uses a fixed system size). Outside this lane; reported.

## Own review (skill design-review, applied to this mockup)

Native or web-like, per concept:

- Today: `native`. Plain text in the item line, as built.
- Order slip: `native`, with one risk. The link and copy keys are system glyphs (Context menus page), the long press is the system menu, and Safari opens as `Link` does. The bordered slip is the part a reviewer may call web-like. It stays because the border shows one 44 pt control split in two, which a bare number cannot. If the owner prefers, the border can go and the copy key keeps a 44 pt frame.
- Open and carry: `native`. An underlined link with a trailing glyph, as the package header draws its link today.

Verdict per frame, read from one full-page capture at 1080 px wide (headless Chromium, 2026-11-21), plus state shots:

| Frame | Today | Order slip | Open and carry |
| --- | --- | --- | --- |
| Duo folded | pass | pass | pass |
| Folded, AX5 | fail, as built: the number is cut at 414 pt in a 361 pt column | pass | pass |
| Duo open | pass | pass | pass |
| Large phone | pass | pass, after the legend fix | pass, after the legend fix |
| Dark (web tokens) | unknown, not shot | pass (open) | pass (all four) |

States seen: copied, refused, long press (slip on the phone, carry folded), opened (carry, open pose), landing ask (slip, folded). `label_once.py` on the rendered page: no hit.
