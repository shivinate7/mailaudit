# Item 47, the ruled head cells: notes

Two mockups, one per option. Each draws the same seed (masthead figures, one package, sort Newest, range All time, Showing Unreceived) in the one light theme. Only the home of the three cells differs.

- `a.html`: the cells sit in the Ledger tab's View group. Focus `#view-group`.
- `b.html`: the cells sit in a ruled row under the masthead on Packages and Tally. Focus `#head-cells`.

## Sizes

- Folded: 466 by 678 pt, from `duo-fold-and-keyboard` (re-measured 2026-11-08), with the tab bar at y 595 pt, 83 pt tall. `layout.py devices` prints `unknown` for this repo, because `.claude/layout-extras.json` names no `kind`. So the width comes from the measurement. Set `drawn: 466` on each design.
- Unfolded: 951 by 669 pt, with the fold strip at 455.5 to 495.5 pt, from the same record.
- Status bar: drawn at the 20 pt floor of `DuoHandUITests.statusBarFloor`. The real inset is unmeasured.

## Choices

1. **The View group on iPhone (a).** Native `LedgerTab.swift` (`LedgerTab.body`) draws Data and Reset only. `TallyView.swift` (`controls`) keeps search, a sort menu and Hide received "until the Ledger tab's View group lands". So on iPhone the group is new. It is today's behaviour on the web: `src/app.jsx`, the `mdl-lg` "View" group of `LedgerRow`s. The rows copy `LedgerRow` in `LedgerTab.swift`. Gain: the lists show more mail, and the app matches the web. Loss: a change of sort or range takes a trip to the Ledger tab. Pick: none. The owner picks.
2. **The head cells on the lists (b).** The cells copy `src/app.jsx` before commit `12e8721` (L11b, the Ledger tab holds the options): `headCell`, `cellLab`, `cellVal`, `valUnder`, `cellFig`, in the order Orders from, Showing, Sorted by. Only Orders from carries a figure. On native, the row sits in the `ruledRow` slot of `MastheadScreen.swift`, above `StampedRow`. Gain: the state is in view where the mail is checked, and one tap opens a panel. Loss: the list starts about 48 pt lower on the folded screen. Pick: none. Owner grant: yes. Departs from: `ledger-tab-holds-options` (the working screens render no option rows), web `src/app.jsx` today.
3. **Cell label size (b).** The old web drew the labels and the figure at 10 px. The mockup draws them at 11 pt, the Apple minimum text size. Gain: they meet the floor. Loss: none at this width.
4. **Tally.** Neither file draws Tally. In a, Tally loses its sort menu and Hide received toggle, which move to the View group. In b, Tally draws the same row, with an `ITEM_SORTS` label such as "Most missing", in place of those two controls. The search field stays in both.
5. **Unfolded.** `DuoSpread.spreads` is false for Ledger and Packages, so each draws one page across the fold. The bar sits under the right page (`DuoSpine.swift`, `duoSpine`). The mockup draws today's spine and changes nothing in it.

## Sources

Apple pages read 2026-11-08, each with a 200 answer: `design/human-interface-guidelines/tab-bars` (a tab bar floats above content and is for navigation), `accessibility` (44x44 pt default control, 17 pt default text), `typography` (17 pt body, SF Pro). Mockup check: `check_ios_mockup.py` exits 0 on both files.
