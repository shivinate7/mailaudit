# Panels overlay: directed designer 2, notes

Designer kind: directed. Direction: popover: anchored to its button, never moves the list.
Mockup: `docs/design/panels-overlay-directed-2.html`. Sample figures only. Nothing is built.

Rulings this follows: `motion-disclosure-panels-arrive` (overlay, ruled 2026-10-11, debt
`panels-overlay-unbuilt`), `head-panels-carry-paper-fill` (paper fill, item 63 a, debt
`panel-paper-fill-unbuilt`), `history-sync-close-each-other`, `ruled-head-range-picked`,
`date-filter-spans-ledger-views`, `tally-sort-keys-are-six`, `ledger-tab-holds-options`,
`duo-card-in-hand`. Sizes: measurement `duo-fold-and-keyboard`.

Apple pages read 2026-11-21, each through
`developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:
Popovers, Menus, Typography (Dynamic Type table), Accessibility (control 44x44 pt default, 28x28
minimum; text 17 pt default, 11 minimum), Buttons (hit region at least 44x44 pt), Layout (size
classes, safe areas), Tab bars (navigation only; floats over content on Liquid Glass).

## Waiting-page links

One per option, folded, Orders from open, where the two differ most. Focus: `focus-slip`, `focus-tag`.

- Card-wide slip: `panels-overlay-directed-2.html#c=slip&d=folded&s=range&x=default&t=light`
- Value tag: `panels-overlay-directed-2.html#c=tag&d=folded&s=range&x=default&t=light`
- Also: the same with `s=history`, and with `x=ax5`. `d=open` for the open Duo, `d=phone` for the phone.

## Choices

1. **Popover shape: two options.** Each opens from the row's value, out of flow, on paper.
   - **Card-wide slip** (`focus-slip`): as wide as the card, with the web's option grid
     (`optGrid`, `optCell` in `src/app.jsx`: 2 columns for sort, 4 for ranges). Gain: holds
     the range panel's day stepper and month picker with no inner scroll at the default size.
     Loss: covers the rows under it edge to edge, and a grid of boxed buttons is not an iOS control:
     verdict `web-like`.
   - **Value tag** (`focus-tag`): 248 pt wide (320 for History), on the value's trailing edge,
     one column with a checkmark on the choice in effect (HIG Menus). Gain: reads as an iOS
     menu, verdict `native`, and the row titles to its left stay visible. Loss: Orders from (7
     options plus a sub-control) does not fit beside its row on the folded Duo or the phone, so it
     scrolls inside and hides Last… and By month until scrolled.
   - Pick: **Value tag**, because skill `ios-apps` rules out controls iOS does not have, and the
     slip's grid is one. Its cost is the inner scroll on Orders from. At AX5 both become full width
     and one column, and differ only in the grid fill against the checkmark.
   - Structure: both options are `same` on the folded Duo and the phone (today's tabs, rows and
     first screen; only the panel changes). The open Duo is `new` (item 8).
2. **Placement.** Below the row when it fits above the tab bar, else above, else on the larger
   side with its own scroll. The page never scrolls to make room. Gain: nothing moves but the
   popover. Loss: History on the folded Duo opens above and covers the masthead and the View
   card. Pick: this rule.
3. **One gesture closes it.** A pick, a tap outside, a tap on its row, or Escape. A tap outside is
   used up: it never also presses Showing, Backup or Reset under it. A tap on another option row
   closes this popover and opens that one in the same tap (HIG Popovers). Gain: no stray act. Loss: a
   person who meant to press Backup presses twice. Pick: this rule.
   Departs from: today's in-flow panels, where every row stays live (`LedgerTab.swift` `syncRow`,
   `history`; `src/app.jsx` `panelWrap`). Not blocking.
4. **A single choice closes on the pick.** Sorted by, a fixed range, and a month close it.
   Last… and By month keep it open and grow it. Sorted by already closes today
   (`setSortOpen(false)` in `src/app.jsx`). Gain: one tap to choose and go. Loss: a person comparing
   ranges reopens the popover each time. Pick: close on a single choice.
   Departs from: the web's range presets, which keep the panel open (`RANGES` `onClick` sets
   `dateFilter` only). Not blocking.
5. **One popover at a time.** Every option popover closes the others, not only the pairs that
   close each other today (`history-sync-close-each-other`; Sorted by and Orders from).
   Gain: HIG "show one popover at a time". Loss: none seen. Pick: yes.
6. **Paper, edge and notch.** Fill `paper`, a 1 pt `line` edge, 8 pt corners, the `shadow`
   token stacked four times, and a notch on the value. The open row also takes `paper`, so row and
   popover read as one sheet. Gain: rounded and lifted, so the square-edge question in
   `head-panels-carry-paper-fill` goes away. Loss: one more shape (the notch).
   Paper on the native popovers and on Orders from and Sync is the default, not owner-confirmed
   (item 63 a covered the web's Sorted by and History). Pick: yes.
7. **Arrival.** 220 ms, opacity and 4 pt, toward the row (`motion-disclosure-panels-arrive`,
   `motion-timings`). Reduced motion: no animation. Gain: keeps the ruled timing. Loss: when Last…
   or By month opens, the popover grows with no animation; HIG Popovers asks for a smooth size
   change, and `motion-nothing-may-reflow` bans animating a height. Pick: no size animation.
8. **Open Duo: two pages.** Left page: the Ledger options. Right page: the Tally list they
   govern, which re-sorts and filters as the person picks. Nothing sits on the fold strip.
   Gain: the answer shows on the facing page while the popover stays put. Loss: the open Ledger
   tab now holds a second view. Pick: two pages. **Owner grant: yes.**
   Departs from: `duo-card-in-hand`, round 2 item 24 b, "Ledger stays full width".
9. **Option text size.** Options are mono 14 pt relative to Callout, rows 44 pt tall. Gain: above
   the 11 pt minimum and on the 44 pt target. Loss: fewer options fit. Pick: 14 pt.
   Departs from: the web's `optCell`, mono 11.5. Native has no option grid today. Not blocking.
10. **AX5.** Every size scales by its text style's Large-to-AX5 ratio (HIG Typography: Callout 16
    to 51, Title 3 20 to 55, and so on). Grids fall to one column. Gain: no clipped option. Loss:
    the popover is nearly a sheet, and the two options converge. Pick: scale, and keep the popover.
    The masthead is drawn simple and wraps; the real one clips (debt `native-masthead-axl-clips`).
11. **Compact width.** HIG Popovers: "Avoid displaying popovers in compact views ... use a sheet".
    The folded Duo and the phone are compact. The direction asks for a popover there anyway.
    Gain: nothing moves, and the row stays in view. Loss: departs from Apple's guidance. I did not
    read the SwiftUI page for keeping a popover in compact width, so whether SwiftUI gives one is
    unknown. Pick: popover, per the direction. **Owner grant: yes.**
12. **Native View group.** The mockup draws Showing, Sorted by and Orders from on native. They are
    ruled for the restyle lane (item 59 a) and not built (debt `native-ledger-tab-unbuilt`).
    Gain: the popovers that matter most are drawn. Loss: the native screen shows rows not yet built.
    Pick: draw them.
13. **Showing, Backup, Reset.** Showing toggles. Backup puts "Share sheet opens (sample)" in its
    value slot. Reset arms in place with Cancel (`armed-reset-takes-the-row`). Gain: every tap
    answers, and no row grows. Loss: the Backup sample text is not the real share sheet. Pick: yes.
    The tab bar is drawn only; other tabs are not drawn.

## Sizes

- Duo folded: 466 x 678 pt; tab bar from y 595, 83 pt. Duo open: 951 x 669 pt, fold 455.5 to
  495.5 pt. Status bar: the 20 pt UI test floor (`DuoHandUITests.statusBarFloor`), unmeasured.
- Open Duo tab bar: 76 pt, the cap a `DuoShellUITests` comment names, not a measurement.
- Large phone: no written size in the repo or the brief. Drawn at a stand-in 430 x 900 pt.
- One theme, light: native `Parchment.color` reads only the light tokens, and `src/app.jsx` has
  no dark rule.

## Checks

- `python3 ~/.claude/lint/check_ios_mockup.py` reports `system-font`: the frames set content in
  Cochin, the repo's ruled content font (`typography-cochin-and-mono`). The page chrome, the status
  bar and the tab bar use the system font. A possible false alarm for a repo with a content font.
- `python3 ~/.claude/lint/label_once.py` prints nothing. It reads the static page only; the frames
  are drawn by script, so it did not read them.
