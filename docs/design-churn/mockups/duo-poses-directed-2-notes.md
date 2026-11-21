# Duo book mode: notes

Mockup: `docs/design/duo-poses-directed-2.html`. Designer kind: directed. Direction: book mode, a tall spread with two independent pages. Debt `duo-stacked-poses-unbuilt` (the Duo has no stacked poses); ruling item 28 a of `duo-card-in-hand` (answer page on top, system tab bar at the bottom).

Open it from disk. Deep links take `c` (concept), `p` (pose), `s` (state) and `ax`, joined with `&`:

- Concepts: `#c=facing`, `#c=turning`. Focus ids: `focus-facing`, `focus-turning` (the laptop frame).
- Poses: `p=folded`, `p=laptop`, `p=tall`, `p=open` (side by side), `p=phone`, `p=all`.
- States: `s=today`, `packages`, `empty`, `typing`, `envelope`, `held`, `posted`, `nomatch`, `keysdown`, `copies` (Turning leaves only), `late`.
- Text: `ax=1` (default, Large), `ax=5` (AX5, the largest).
- Example: `#c=turning&p=all&s=held&ax=5`.

Every frame works: type on the drawn keys (or a hardware keyboard), tap a match, tap a line to check it in, Post, New envelope, Close, Card in Hand, hide the keys, turn each tab, stamp a late envelope. Each page scrolls on its own.

## Concepts

- **Facing leaves.** The built side-by-side screen turned on its side. The answer page on top holds the envelope. The desk page below holds the field, the matches, the Suspense boxes and the Post bar on the keys. Each page scrolls alone.
- **Turning leaves.** Each page turns on its own, by index tabs that face the spine. The answer page turns between Envelope, All copies and Late. The desk page turns between Desk and Held. Post sits at the answer page's foot. On one screen (folded, phone) the spread closes and keeps the same order: answer, tabs, field, matches, keys.

## Geometry

- Stacked: the open screen turned, 669 x 951 pt. Hinge y 455.5 to 495.5 (from `duo-fold-and-keyboard`, turned). Top page 435.5 pt below the 20 pt status floor; bottom page 455.5 pt.
- Keys in the stacked pose: no reading exists. Drawn 264 pt, the height of the side-by-side drawn panel (669 − 405). With the keys up the desk page has 191.5 pt.
- System tab bar: 83 pt, from the folded reading. Unmeasured in the stacked pose.
- Folded: 466 x 678 pt; keys drawn 289 pt, the taller of the two outer-screen readings.
- Phone: no size is written in the device list (`layout.py devices` says unknown) or the brief. Drawn at the folded frame's size, as a stand-in.
- Status bar foot drawn at 20 pt, the UI test floor (`DuoHandUITests.statusBarFloor`); unmeasured.
- AX5: the typography page I read has no Dynamic Type table. The 2.6x text scale is drawn, not read.

## Choices

1. **The pick: Turning leaves or Facing leaves.** Turning gain: Post stays under the lines it names; the held cards never sit under the keys; the matches fit a 191.5 pt desk page; one layout serves every pose. Turning loss: new structure (tabs, All copies, Card in Hand on one screen), so more build and more departures. Facing gain: a close port, small build. Facing loss: with the keys up and a held card, the 53 pt Post bar leaves the desk page room for the field and one row; the matches scroll out of sight. Pick: Turning leaves. Owner grant: yes.
2. **Card in Hand opens in the stacked poses, on two pages.** Both concepts. `DuoSpread.layout` already returns `.stacked`, and `pageRects` already names the top page as the answer page. Only `DuoSpine.pages(for:)` keeps one page ("Default, not owner: stacked pages keep one page"). Gain: ruling item 28 a is met; nothing crosses the hinge. Loss: none found. Pick: yes. Departs from: `native/Manifest/DuoSpine.swift`, `pages(for:)`, a default, not owner.
3. **Packages in the stacked pose: list on top, letterhead and the Card in Hand control on the desk page.** Both concepts. Today Packages keeps one page, and its rows run under the hinge (`DuoSpread.spreads(tab:)` returns false for `.packages`; state `s=today`). Gain: nothing under the hinge; the opener sits near the hands. Loss: the letterhead leaves the top of the list; the desk page is half empty. Pick: yes. Departs from: `DuoSpread.spreads(tab:)` and decision `duo-card-in-hand`, Defaults ("Packages does not spread"). Owner grant: yes.
4. **Tally, Orphaned and Ledger in the stacked pose: not drawn.** Today each keeps one page held tall, across the hinge. The brief names Card in Hand and its list, count and money. Pick: a later mockup. Owner grant: yes (whether they get stacked pages).
5. **The running head moves to the answer page.** "Mail day", the counts, the money owed and Close sit at the top of the answer page, not the desk page. Gain: the desk page keeps its 191.5 pt for typing. Loss: in laptop pose Close is on the standing screen, far from the hands. Pick: yes. Departs from: `HandScreen.leftPage`, the Mail day row.
6. **New envelope sits beside the field; the "This envelope" label goes.** Gain: 52 pt on the desk page. Loss: the label; New envelope is 8 pt from the field. Pick: yes. Departs from: `HandScreen.leftPage`, the "This envelope" row.
7. **Where the Post bar goes when the pages stack.** Facing leaves: on the keys, on the desk page, the literal reading of item 103 b. Turning leaves: at the answer page's foot, above the spine tabs, under the lines it names. Gain (Turning): "Post … here" sits under its envelope; the desk page keeps its room. Loss (Turning): in laptop pose the press is on the standing screen, but at its lowest edge, nearest the hinge, where it tips the screen least. Pick: Turning's place. Owner grant: yes (item 103 b says "pinned just above the keys").
8. **Index tabs at the spine (Turning).** Answer page: Envelope, All copies, Late (badge: envelopes past 14 days with no stamp). Desk page: Desk, Held (badge: held cards). Each page turns on its own. Gain: the late mail and the held cards are one tap away and never under the keys; the tabs sit at the edge nearest the hands. Loss: one more control row per page; side by side the spine is vertical, so the tabs sit at the page heads there. Pick: yes. Departs from: `HandScreen.transitBox` (the Past 14 days box and Open) and `PastTransitPage` (Back). Owner grant: yes.
9. **All copies (Turning).** The answer page shows every copy of the card in hand, from every seller: in or out, price, order date, and "0 of 3 in · $1.26 still owed". It reads the same copies the Tally row lists (`tally-row-lists-its-copies`); a tap checks nothing in. Gain: answers "did all of them arrive" without leaving Card in Hand. Loss: new scope. Pick: yes. Owner grant: yes.
10. **Held is its own tab (Turning).** The Suspense boxes move to the desk page's Held tab; the tab's badge does the held chip's job. Gain: the decision's named loss, boxes under the keys, is gone. Loss: one tap to read a held name; the built chip (`hand-held-chip`) goes on two pages. Pick: yes. Departs from: `HandScreen` chip and box order. Owner grant: yes.
11. **Matches in one row under the field, with the keys up (Turning).** Like the system word suggestions. A tap holds the row: every name keeps its place, the tapped one is marked (`no-layout-shift-under-pointer`). With the keys down the vertical list returns, as built. Gain: the matches stay above the keys on a short desk page. Loss: names past the edge need a sideways swipe; the row changes shape when the keys go. Pick: yes. Departs from: `HandScreen.matches`, the vertical list.
12. **Card in Hand on one screen (Turning: folded and phone).** Answer on top, tabs, field, matches row, keys. The Card in Hand control shows on Packages there too. Gain: the same tool in every pose, in the same order. Loss: about 120 pt of answer with the keys up. Pick: yes. Departs from: `PackagesTab.twoPages` and decision `duo-card-in-hand`, Defaults ("Two pages show only when the hinge reports a fold"). Owner grant: yes.
13. **Laptop and held tall share one layout.** In Turning leaves, Card in Hand opens with the keys up in laptop pose (the flat page is a keyboard deck), and on a field tap held tall. `DuoHinge` tells `.halfOpen` from `.flat`. Gain: one layout to build and test. Loss: no pose-only size change for reading the standing page from farther away. Pick: yes.
14. **The system tab bar sits at the bottom of the desk page, under the keys while they are up.** Item 28 a and the 15:34 CDT ruling. Pick: as ruled.
15. **The running head and the tabs are capped at xxxLarge, with the large-content viewer on a long press.** It follows the Duo bar ruling in `duo-card-in-hand` (Tab bar text) and item 104 a. Gain: no tab clips at AX5. Loss: chrome text does not grow past the cap. Pick: yes. Owner grant: yes.
16. **AX5 on one screen with the keys up: the running head and the tabs step aside** for the field, New envelope, the matches row, Post and the seller. Hide brings them back. Loss: at AX5 about one line of the envelope shows while typing, and the counts hide. Pick: yes.
17. **Side by side.** Facing leaves: the built screen, unchanged. Turning leaves: the built screen plus the tabs at each page head. Pick: as drawn.
18. **One theme.** The native app is held to light (`design-parchment-ledger`). Pick: light only.

## Sources

Apple pages read 2026-11-21, each answered 200 (the `tutorials/data` JSON form): layout (safe areas, margins), typography (17 pt default, 11 pt minimum; no Dynamic Type table on the page), accessibility (44 x 44 pt default control, 200 percent text), buttons (44 x 44 pt hit region), tab-bars (the bar floats at the bottom of the screen).

Repo reads: `measurements/duo-fold-and-keyboard.md`, `docs/decisions/duo-card-in-hand.md`, `docs/debts/duo-stacked-poses-unbuilt.md`, `native/ManifestKit/Sources/ManifestKit/DuoSpread.swift`, `native/Manifest/DuoSpine.swift`, `native/Manifest/HandScreen.swift`, `shared/tokens.json`, `src/view-rules.mjs` (`STAMP_KINDS`).

## Not measured

- The keyboard frame in the stacked pose (drawn 264 pt). A build needs one reading.
- The tab bar and the status bar in the stacked pose.
- Whether the stacked pose reports the fold through the same division region.
