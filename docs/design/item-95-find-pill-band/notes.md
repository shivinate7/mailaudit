# Item 95: Find pill band, notes

Mockups of the two options of waiting-page item 95 (PR 238, restyle step 8): `a.html` ends the list above the pill on a
paper band; `b.html` keeps the pill floating over the list and skips the contrast audit on its frame. Designer kind:
informed. iPhone 18 Pro, 402 x 874 pt, light theme, normal text size, Packages at rest. Shots: `../shots/item-95-find-pill-band/`.

## Figures

- Measured (lane restyle-step8's screen check of PR 238, coordinator message 2026-11-18 15:31 CST): pill top 731 pt; list end
  and band rule 723 pt; 8 pt between them.
- Measured, from the item text: the failing text frame "Test Set · Near Mint" at 73, 723, 102 x 14. Both files put that line there.
- From PR 238's body (screen-check run 43952443921), not the brief: pill bottom 782 pt, tab bar top 791 pt, 401.7 pt of
  visible list at normal size (so the list starts near 321 pt).
- Unmeasured, drawn: top safe area (54 pt, the house guess in step8-packages-tally-filters.html), the masthead's inner
  layout, card and row heights, the tab bar capsule, the pill's place under option b (drawn at 731).

## Choices

1. Same list in both files. What: identical rows at identical y; only the foot differs. Gain: the owner compares one
   thing, the band. Loss: none. Pick: yes.
2. Whole phone as `focus` (`#phone`), drawn at 402. Gain: the band reads against the full screen. Loss: on the page's card the
   phone is about 482 px tall at 221.8 px wide, so its bottom 4 to 5 pt scroll; no deciding part sits there. Pick: yes.
3. Option a draws the cut line under "Brainstorm" hidden below the rule. What: at rest the measured line at 723 sits
   just under the band's rule. Gain: honest picture of the 8 pt cost. Loss: the card ends mid-row. Pick: yes.
4. Option b marks the row with an open-bottomed red box running into the pill, and the pill's frame in green as the new
   skip. Gain: the label never covers the row text it is about. Loss: the pill's own "Today" tag is dropped for room.
   Pick: yes.
5. Tab order Ledger, Orphaned, Tally, Packages, from RootView.swift on step8-build. Pick: yes.
6. Apple's layout page (read 2026-11-18, answered 200) asks for a scroll edge effect, not a solid or semi-opaque
   background, under controls. Option a's paper band is a solid background. Departs from: that guidance, and from
   FindPill.swift:3 on main (the floating pill). Owner grant: yes (the item itself asks it).
7. The built masthead sets text at 10 and 10.5 pt (MastheadView.swift: house line, tally labels, count line), under
   the 11 pt floor. Drawn as built; not this item's change.

Apple pages read 2026-11-18: human-interface-guidelines/layout, human-interface-guidelines/tab-bars ("A tab bar floats
above content at the bottom of the screen").
