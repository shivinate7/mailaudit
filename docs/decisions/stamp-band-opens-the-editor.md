# The stamp band is the control

A stamp shows as a band under the package header. Once a stamp exists, the band itself opens the editor.

**Holds while:** `STAMP_KINDS` in `src/view-rules.mjs` lists six kinds, and `Other` comes last. Both clients read it from there (`rules-run-in-javascriptcore`).

The band is a rotated chip, built like the RECEIVED stamp. It is manila, not green. It carries the note in Cochin italic. It stays visible while the package is collapsed.

The first stamp comes from a `Stamp` button. That button sits first in the expanded card's action row. Once a stamp exists, the button goes away. The band takes its place and shows a trailing `›`, as the Tally order-id link does.

The editor offers the six kinds as option cells, in the month picker's treatment. `Other` comes last. It covers anything the fixed five do not name. The free line carries the detail. The six kind chips sit in rows 10px apart, so each chip keeps a 44px hit area. The call is recorded in `ux-house-rules-govern`.

The editor also has a note field at 16px, so iOS does not zoom. It has a two-tap Remove stamp control, and Cancel and Save buttons. The Remove stamp arm reads "Tap again to remove stamp from N cards", where N is the package's cards. First focus goes to Cancel. The count is an orchestrator default of 2026-10-11, and it is built. Unmeasured: whether the longer arm label moves Cancel or Save at 375px.

**Pinned by:** tests 37.1 and 37.3 (the Stamp entrance, and the editor offers six stamps with Other included), 37.8 (the band replaces the Stamp button), and 61.11 to 61.13 (the band opens an editor whose Remove stamp ask shows a card count, puts first focus on Cancel, and keeps the stamp on Cancel). `check:screens` claim 12 pins the chip hit areas. Test 61.11 pins that a count is shown, not that the count is right.

The native card (step 6) keeps one 48pt slot at rest that holds either the Stamp button or the band, so a save or a remove moves no line (`no-layout-shift-under-pointer`). Its armed Remove ask hangs below the editor row as an overlay, as the native Orphaned Discard does, because the web's in-place label needs about 413pt in a 326pt row and would drop Cancel and Save a line under the thumb. The ask's count is the package's `totalQty`, as on the web. The native stamped-filter row is 44pt tall, not the web's 40, for the hit region.

## See also

- `one-stamp-per-package` — why picking a kind replaces the stamp.
- `stamp-removal-writes-a-tombstone` — how a removed stamp survives a merge.
- `order-id-button-stops-propagate` — the other trailing `›` control.
- `motion-the-stamp-lands` — the motion the stamp uses when it appears.
