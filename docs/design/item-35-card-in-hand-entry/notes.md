# Item 35, Card in Hand entry: mockup notes

Two mockups for waiting-page item 35 (`duo-card-in-hand-entry`): `a.html` keeps Packages and its Card in Hand control; `b.html` makes the Packages tab open Card in Hand. Each draws the open Duo at 951 x 669 pt, light theme only (the native app is held to light), plus the folded outer screen at half size.

1. **Keep Packages; add a Card in Hand control.** State `keep-packages`, focus `#duo-keep-packages`. This is today's native build: `hand-open` in `PackagesView.swift`, opened by `PackagesTab` in `HandScreen.swift`. Gain: Packages stays the list you know, the same as when folded. Loss: one extra tap each mail day. Pick: the item's default.
2. **Packages becomes Card in Hand.** State `packages-is-hand`, focus `#duo-packages-is-hand`. Follows the PR 144 mockup (README line 5). Gain: no extra tap. Loss: the list moves one tap in, and the same tab opens two screens, depending on the pose. Departs from: main's Packages tab, which opens the list (`DuoSpread.spreads(tab:)` is false for `.packages`). Owner grant: yes (it changes the Defaults of decision `duo-card-in-hand`).
3. **The way to the list in the second option.** Drawn as a "Packages list" control where Close sits today, and a way back drawn where `hand-open` sits today. Both the name and the place are proposals, not built.

## Measured versus drawn

- Measured: the 951 pt width and the 40 pt fold at 455.5 pt (`duo-fold-and-keyboard`); the outer screen at 466 x 678 pt (same record, 2026-11-08); the `hand-open` top at y 416, 44 pt tall at the default text size, and the tab bar at x 520 to 927, y 593 to 657 (debt `hand-open-under-bar-at-l`, 2026-11-08).
- Inferred: the 669 pt height, from the bar's foot (y 657) plus its 12 pt lift (`DuoBarMetrics`).
- From the code, not measured: the list runs across the fold; the control sits at the trailing edge; Card in Hand opens with the keys down (nothing focuses the field on open); the bar order is Ledger, Orphaned, Tally, Packages (`RootView.swift`).
- Unmeasured: the status bar foot (drawn at 20 pt, as in the house mockups), every masthead height, and the control's x.

## Sources

- Apple HIG, Tab bars and Buttons, read 2026-11-18 (both answered 200). "Use a tab bar to support navigation, not to provide actions." A button hit region is at least 44 x 44 pt.
- `docs/map/` does not exist in this repo, so the code was read directly.
- `check_ios_mockup.py` flags the Cochin font. The app sets its content in Cochin (`typography-cochin-and-mono`), and `duo-hand-gaps.html` gets the same finding, so the font stays.
