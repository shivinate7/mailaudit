# Item 39, stamp editor: notes

Two mockups, one per option: `a.html` (keep both) and `b.html` (match the mockup). Both use the same seed rows, the same theme and the same layout. Only the note field, the "0 stamped" cell and their labels differ.

1. **Size.** Drawn at 466 pt wide by 678 pt tall: the folded Duo outer window in measurement `duo-fold-and-keyboard` (read 2026-11-08). `layout.py devices` prints `unknown`, because `.claude/layout-extras.json` names no `"kind"`. The top inset is unmeasured, so it is drawn at the 20 pt floor the Duo mockups use. The tab bar starts at y 595 pt (same record).
2. **Theme.** Light only. The native app is held to light.
3. **Focus.** `#stamp-choice` in both files. It wraps the stamped row down through the editor, so both parts of the choice are in frame.
4. **States.** `#s=editor` (default) and `#s=tap-cell` in both files. In a, a tap on "0 stamped" does nothing. In b, it turns the filter on and the list goes empty. `PackagesView` draws no empty-state line.
5. **Note field, a.** Uses `StampViews.swift` `noteField`, which has `lineLimit(2...6)`: two 18.35 pt lines (36.7 pt) in a box of at least 44 pt. At rest, the box is the same height in both options. A long sample note shows the difference: a wraps it onto two lines, and b cuts it at the edge.
6. **Note field, b.** Follows the web's one-line `<input>` in `src/app.jsx`, the stamp editor's note field (placeholder "Anything else — what they said, when…"). The box stays 44 pt.
7. **"0 stamped" cell.** `StampedRow` sets `.disabled(count == 0 && !on)`. `PaintedButtonStyle` (`ControlViews.swift`) only dims on press and never reads `isEnabled`. The colours are explicit tokens. So the shipped disabled cell looks the same as an active one. Item 39 calls it "greyed out", and the code does not support that. This is not measured on a device. Both mockups draw the cell in the same colours.
8. **Step 6 mockup.** It is not under `docs/design` on main, in the HTML history, or on `archive/step6-ready`. Option b is built from the item's `how` text and the web input.
9. **Apple pages** (read 2026-11-08): HIG accessibility (44x44 pt default control size) and HIG text fields (multiline text goes in a text view).
10. **iOS mockup check.** `check_ios_mockup.py` fails on both files with "no unfolded frame". No unfolded pose is drawn. Step 6 covers the phone card only, and the open Duo's Packages page belongs to item 35 (decision `stamp-band-opens-the-editor`).
