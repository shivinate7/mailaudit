# Undo a recent tap: design notes (informed designer 1)

Mockup: `undo-recent-informed-1.html` beside this file. Open it from disk. Designer kind: informed. Decision: `recent-checks-can-be-undone`. Debts: `recent-log-unbuilt` (native) and `recent-undo-under-bar` (web).

Deep links (add to the file URL): `#c=bounded|daybook`, `&d=all|folded|open|ax5|web`, `&s=closed|open|undone|inert|nothing|hidden`, `&dev=on|off`, `&ord=on|off`, `&ax=grow|cap`. Example: `#c=daybook&d=folded&s=open`. Every frame shares one state. A tap on UNDO in one frame changes that row in every frame, as a synced undo does.

Sizes: Duo folded 466 x 678 pt and Duo open 951 x 669 pt (brief, and `measurements/duo-fold-and-keyboard`). Duo folded again at AX5. Large phone: the brief and `layout.py devices` give no size, and no 18 Pro size is written in the repo, so it is drawn at 375 x 812, the screens-check viewport (`test/screens.mjs`), as the web client. Theme: light only. The native app is held to light (`Info.plist` `UIUserInterfaceStyle`, `InterfaceStyleTests`), and `src/app.jsx` has no `prefers-color-scheme` rule.

## The pain

"I tapped the wrong card and now I don't know how to fix it." Three facts make it worse today:

- The native client has no Recent screen (`recent-log-unbuilt`).
- On the web at 375 px, the first Recent row's UNDO cell sits half under the bottom bar (`recent-undo-under-bar`).
- A row does not say which device made the tap or which order the card came in.

## Choices

1. **Concept: Bounded panel** (`#c=bounded&d=folded&s=open`, focus `panel-folded`). This is today's in-flow panel (`src/app.jsx` `RecentPanel`, `toggleRecent`), with one change. The list's height is read once, at open: the smaller of 360 pt and the room down to 8 pt above the bar's top. So no row opens under the bar.
   - Gain: it keeps every ruling and the web's built behaviour. It is the smallest change.
   - Loss: at 375 px with a seeded ledger, Recent sits near y 509, so only about 2 rows fit above y 736. After the person scrolls the page, rows still pass under the bar, as any content does. The glass bar takes the tap, so no undo fires, but a tab can change.
   - Pick: the fallback.

2. **Concept: Day book (bold)** (`#c=daybook&d=folded&s=open`, focus `slip-folded`). A tap on Recent lays a paper slip over the list, from the Recent row's lower edge down to 8 pt above the bar. The slip uses the ruled overlay (`motion-disclosure-panels-arrive`) and the default paper fill (`head-panels-carry-paper-fill`). The page cannot scroll while the slip is open. Only the slip's own list scrolls, so no undo can ever sit under the bar. History, Backup and Reset stay where they were, under the slip, so nothing moves.
   - Gain: it closes `recent-undo-under-bar` for every scroll position, and it builds the ruled overlay.
   - Loss: the slip covers History and Backup until Recent closes, and the page does not scroll while it is open.
   - Pick: this.
   - Departs from: the built in-flow panel (`src/app.jsx` `RecentPanel` inside the Data card) and the earlier mockup's in-flow pick (`recent-log/recent-log-notes.md` item 3). Not blocking. Owner grant: yes.

3. **Slip opens toward the room** (Day book only, `#c=daybook&d=web&s=open`, focus `slip-web`). The slip opens downward when a heading and three rows fit above the bar. Otherwise it opens toward the larger room, as an iOS menu picks its side. Upward, it covers the masthead and the View group, and the Recent row stays put under the finger. At 375 px web it opens upward and shows 5 rows; downward it would show 2.
   - Gain: the slip always shows several rows, and nothing scrolls by itself.
   - Loss: when it opens upward, the newest row sits farthest from the Recent row.
   - Pick: this.
   - Departs from: `recent-checks-can-be-undone`, Where the entrance sits ("Its panel opens below it"). Not blocking. Owner grant: yes.

4. **The bar rule, in numbers.** The list's lower edge stays 8 pt above the bar's top.
   - Duo folded: the bar starts at y 595 (measured).
   - Duo open: the custom bar under the right page starts at y 593 (`DuoBarMetrics`: pill 64 pt and lift 12 pt).
   - Web 375: the bar starts at y 736 (`recent-undo-under-bar`).
   - In both concepts, no UNDO cell is drawn under a bar at open. The mockup checks this headless in each frame.
   - The cap: 360 pt holds a heading and four rows at the default size. At AX5 one row alone is 340 pt, so the cap never drops below a heading plus one row.

5. **Open pose: nothing across the fold** (`#d=open`, focus `frame-open`). Today the Ledger tab stays full width on the open Duo (`DuoSpread.spreads(tab:)` returns false for `.ledger`), so its rows run across the fold at x 455.5 to 495.5. The brief forbids that, so both concepts change it:
   - Bounded panel: the Data card and its in-flow panel sit on the left page. No bar sits there, so the list reaches its 360 pt cap. Reset moves to the right page.
   - Day book: the left page holds the Ledger options, with an accent mark on the picked row. The right page is the Recent book: full height, ending at y 585, with UNDO on the right edge, under the right thumb. A tap on History swaps the right page.
   - The shell already has the custom bar under the right page (`DuoSpine`).
   - Departs from: `duo-card-in-hand`, Ruled, round 2 item 24 ("Ledger stays full width", owner). No option keeps both that ruling and the brief's fold rule. Not blocking. Owner grant: yes.

6. **The change, shown as a ledger correction** (Day book only, focus `row-r1-folded`). A fixed figure column shows the old count struck through, beside the new count: struck 0, then `1 OF 1`. After an undo, the tap's count is struck and the old count is inked again. That reads as a later correction, which is what an undo is (`undo-removes-only-its-delta`).
   - Gain: the person sees what the wrong tap did before pressing UNDO.
   - Loss: the column costs 56 to 76 pt of name width. At 375 px, long names cut sooner.
   - Pick: this.
   - Departs from: What a row shows (a mono figure such as `1 of 4` on the name line). Not blocking. Owner grant: yes.

7. **The undo has its own column.** A 3 pt double rule (the `line` token) splits the UNDO cell from the text. The text is never a control.
   - Targets: 72 x 72 pt at the default size, 92 x 92 at xxxLarge, and full width x 72 at AX5. All are at least 44 x 44 (Apple, Buttons and Accessibility).
   - Neighbouring UNDO cells sit one row height apart (72 pt or more), so a near-miss lands on the cell above or below, never on another control.

8. **Device on the row** (`&dev=on` and `&dev=off`, focus `row-r1-folded`). The seller line ends with the device that made the tap: `THIS DUO` in ink, or another device's name, such as `MAC`, in inkSoft.
   - Gain: the brief asks for it. It also explains why a row shows up that the person does not remember making.
   - Loss: entries carry no device today (`src/recent-rules.mjs`: `newEntryId`, `addEntry`). The log would need a field inside each `recent` entry, plus the merge tests. It is a field inside `recent`, not a new saved key, so `saved-state-shape` and `storage-keys-are-frozen` still hold. At xxxLarge it crowds the seller name.
   - Departs from: `recent-checks-can-be-undone`, What a row shows ("A row does not say which device wrote it"). Not blocking. Owner grant: yes.

9. **Order date on the seller line** (`&ord=on` and `&ord=off`). The line reads `Ridgeback TCG, order of Nov 3`.
   - Gain: the brief asks for the order. One seller can have two open orders.
   - Loss: the seller is cut sooner at 375 px.
   - Pick: shown.
   - Departs from: What a row shows ("A second line names the seller"). Not blocking. Owner grant: yes.

10. **Largest text** (`#d=ax5&ax=grow` and `&ax=cap`, focus `row-r1-ax5`).
    - Grow to AX5: sizes from Apple's AX5 table (Body 53, Footnote 44, Caption 2 40, Title 3 55). The row stacks, and UNDO becomes a full-width band, 72 pt tall, under the text. A row is 340 pt, so one row shows at a time.
    - Stop at xxxLarge: the row text stops at Apple's xxxLarge sizes (Body 23, Caption 2 17). The row keeps its side-by-side form at 92 pt, and the cell offers the large content viewer. This copies owner ruling item 104 a on the post bar.
    - Pick: Grow, because Apple's Accessibility page asks for at least 200 percent.
    - Owner grant: yes.

11. **Kept as ruled.**
    - One tap, no arm, no redo.
    - Rows freeze at open. An undo changes only its own row's right edge, its strike and (Day book) its figure. No row is added or moved.
    - Day headings stick.
    - The cell reads `Undo a tap` and keeps its value while the panel is open. With nothing live it reads `Nothing to undo` until the next tab entry, then it hides (`#s=nothing`, then `#s=hidden`).
    - Recent, History and Sync close one another.
    - End states: `UNDONE 14:35`, `CHANGED SINCE`, `NOTHING TO UNDO`, in inkSoft. Gold is never text.

12. **Not measured.** All of these are drawn, not read:
    - the status bar (20 pt) and the masthead heights;
    - the folded bar's pill inside its measured band;
    - the web View group, abridged to place Recent near the y 509 estimate in `recent-log-notes.md` item 9;
    - the native tab bar on a large phone.

## Sources

Apple pages read 2026-11-21, through the `tutorials/data/...json` copies:
- HIG Layout (safe areas, size classes).
- HIG Typography (the Large, xxxLarge and AX5 tables).
- HIG Accessibility (controls 44 x 44 pt by default, 28 x 28 pt at least; text up to 200 percent).
- HIG Buttons (hit region 44 x 44 pt).
- HIG Lists and tables.
- HIG Tab bars ("a tab bar floats above content"; navigation, not actions).
- HIG Sheets and HIG Toolbars, read; no number used.

## Critique

See the report. Findings fixed in the mockup are listed under Fixed below.
