# Large text: a fixed core that never clips

Designer kind: directed. Direction: fixed core: pin the three core facts in a band that scales but never
clips; the rest scrolls. Mockup: `large-text-directed-2.html`. Light theme only, as the native app is held to
light (`design-parchment-ledger`). Every figure on the page is sample data.

The sample screen is the Tally tab. On the open Duo it spreads over two pages (`DuoSpread.spreads`, in
`native/ManifestKit/Sources/ManifestKit/DuoSpread.swift`), so the open pose gets its own layout. The core
facts are the masthead's `cards` cell (`have/total`, with no thousands separator; `Masthead.swift`, `TallyCell`)
and the money still missing (`MastheadView.missingLine`). The primary button comes from `BulkRow`
(`native/Manifest/BulkViews.swift`).

## Choices

1. **Foot band (concept).** The core sits in one band, docked on the tab bar, and the list scrolls above it.
   On the open Duo, the band sits at the foot of the right page, beside the detail it acts on; the bar there
   is the custom one at x 520 to 927, y 593 to 657. The scroll region ends at band plus bar plus 16 pt, so the
   last row always scrolls clear (deep link `k=end`). This closes the `hand-open-under-bar-at-l` class of
   failure. Gain: the button is in thumb reach (`ux-thumb-zone`), and the facts never leave the screen.
   Loss: the band covers the foot of the list all the time; at AX5 on the folded Duo it takes 207 of 575 pt.
   Departs from: `MastheadScreen.swift`, `RunningHead`. The running head stops pinning, because the band
   carries its figures. Pick: yes. Owner grant: yes (changes `masthead-running-head-sticky`).
2. **Core page (concept).** On the open Duo, the left page becomes the core: the seal, the title, both
   figures at full size, the open name and the button. None of it scrolls. The Tally names move to the right
   page and open in place. When folded, and on the phone, the core is a head band. It sits in flow under the
   letterhead and pins when the letterhead scrolls away (sticky, so its height never changes). Gain: at AX5
   the open pose shows every core fact at full size, with no step-down. Loss: on the folded Duo the button
   sits at the top, out of thumb reach. The open pose changes the Tally spread. Departs from: `TallyView`,
   `DuoPages(pages:) { list } right: { detail }` (the list on the left, the detail on the right). Pick: no,
   but the open-pose page could pair with Foot band when folded. Owner grant: yes.
3. **Holds at half (band size, pick) against Grows with the text.** The band takes the reader's size, then
   steps down one Dynamic Type size at a time until it fits in half the height between the status bar and
   the tab bar. On the folded Duo at AX5 that is AX3. On the 320 pt phone it is AX2. The list keeps the
   reader's size. Press and hold the band for the large content viewer at the reader's size. Gain: the list
   keeps more than half the screen. Loss: the band's text can sit below the reader's chosen size. Apple
   says to rely on the large content viewer only for items that must stay small, such as tab bar buttons.
   Grows with the text: nothing clips, but at AX5 the band is 369 pt when folded (the list keeps about one
   row) and 482 pt on the phone. Owner grant: yes (a new rule on Dynamic Type).
4. **The band's shape is picked by fit.** The band tries four shapes in order, like `ViewThatFits`: one row,
   then a pair, then ledger lines (the label left, the figure right), then a stack. A figure is two unbreaking
   parts, "1205/" and "1350", so it breaks only after its slash (size-grows-phone). The "got" part reserves
   the width of the total's digits, so a check-in never changes the band's width. Gain: the band never
   clips, and the proof line under each frame shows that. Loss: the shape can change between text sizes.
   Pick: yes.
5. **Labels "cards" and "missing".** "cards" is the masthead cell's own label. "missing" shortens the missing
   line's "still missing", so the ledger-lines shape fits at AX3 on 466 pt. Departs from:
   `MastheadModel.missingLine` wording. Pick: yes.
6. **The action slot.** "Mark all received" shows while a copy is owed, then Undo takes its slot. When every
   copy is in, "Clear check‑ins" shows. It asks with two taps, "Tap again to clear N check-ins", lapses after
   4 s, and Cancel takes first focus (`BulkRow`, `armed-reset-takes-the-row`). Cancel hangs outside the band,
   as `BulkRow.hangingAsk` hangs the ask today, so the band keeps its height. All faces are stacked in one
   cell (the `SaveSlot` pattern), so the slot holds its tallest face. Each face shrinks to 0.75 before it
   wraps (`minimumScaleFactor(0.75)`, which the spec asked of the count line). While a copy is out and
   another is in, Clear stays in the detail's own bulk row. Departs from: `native-bulk-check-in` (the bulk row
   sits under the stamp slot, in `TallyRowView.detail`). Owner grant: yes.
7. **Progress on the band's edge.** A 4 pt bar runs along the band's edge: accent, then green at 100%
   (`progress-bar-accent-then-green`). It is out of flow, so it moves nothing. Gain: "where am I" at a glance.
   Loss: it repeats the masthead's 8 pt bar. Pick: yes. Hide it if the owner reads it as a second bar.
8. **Opening and failed states.** The band keeps its size and shows one sentence in the figures' place:
   "Opening the ledger" (the word from `RootView.Placeholder`). When the read fails, the sentence is "The
   ledger did not open." with an Open Ledger control, because the Ledger tab works with no ledger
   (`recovery-control-not-state-gated`). No figure ever shows as 0 (`ux-unknown-is-not-empty`). Departs
   from: `RootView`. Today the failed tab shows only the failure text, with no control. Owner grant: no.
9. **Rows that scroll stack at accessibility sizes.** The Orphaned envelope header label wraps at word breaks,
   and Discard drops below it (`OrphanedView.swift`). The Tally name takes the full width, with counts first
   (`TallyView.swift`, `TallyRowView`; `card-tally-row-counts-first`). The armed Reset ask wraps, and Cancel
   goes after it at full width. This drops the fixed 80 pt `cancelWidth` and `lineLimit(1)` in
   `LedgerTab.swift`, `AskRow.resetRow`. `AskRow.restoreRow` and `BulkRow` already stack on
   `typeSize.isAccessibilitySize`, so this extends today's behaviour. Pick: yes.
10. **Section label removed.** The "Tally" label above the list repeated the tab's own label
    (`ux-label-once`), and at AX5 it cost a row. Pick: yes.

## Not drawn

- The masthead foot row: the count line, the missing line and `SaveSlot`. With a band, the missing line
  repeats the band. A follow-up should decide whether it gives way at accessibility sizes, which closes
  `native-masthead-axl-clips`, and whether the count line takes `minimumScaleFactor(0.75)`
  (`native-count-line-clips`).
- The Packages, Orphaned and Ledger tabs. The band works the same way there, and its action slot follows
  the open card. On Ledger, the slot is empty (`ux-control-earns-place`).

## Devices, sizes and sources

- Folded Duo: 466 × 678 pt, with the tab bar from y 595 and 83 pt tall (`duo-fold-and-keyboard`). Open
  Duo: 951 × 669 pt, with the hinge from x 455.5 to 495.5 (from the brief). Nothing crosses the hinge.
- Status bar: drawn at the 20 pt floor that the earlier Duo mockups use. It is unmeasured. The bottom inset
  of the open Duo is also unmeasured, so the core page pads 20 pt.
- Large phone: no written size. It is drawn at the brief's 320 pt width. Its 678 pt height and 83 pt bar
  are borrowed from the folded Duo and are not real.
- Text sizes: Large, xxxLarge, AX1, AX2, AX3 and AX5 come from the Dynamic Type tables. A base size is scaled
  by its text style's ratio, as `Font.custom(_:size:relativeTo:)` does.
- Fit: every proof line was read in headless Chrome on Linux, which has neither Cochin nor Menlo. That
  means Georgia or serif, and DejaVu Sans Mono, with the same 0.6 em figure width as Menlo. The real fit is
  a device check. Every frame read "Nothing clipped" at its own size, at xxxLarge, and at AX1 with 2-digit
  counts.
- Apple pages, read 2026-11-21:
  - HIG Typography: the Dynamic Type tables, and "keep primary elements toward the top".
  - HIG Accessibility: controls are 44 × 44 pt, and text should be able to grow to 200 percent.
  - HIG Buttons and HIG Layout.
  - HIG Tab bars: a tab bar floats above the content.
  - SwiftUI: `accessibilityShowsLargeContentViewer()`, `dynamicTypeSize(_:)` (a range) and `ViewThatFits`.

## Review lines (design-review, applied to my own work)

- Foot band: structure `same`, because it keeps the tabs, the first screen and the two-page Tally. It reads
  `native`: a system tab bar, and a band like a bottom safe-area inset.
- Core page: structure `new`, because the open pose gives the left page to the core and moves the list
  right. It reads `native`: a pinned section header when folded.
- Mockup check: `check_ios_mockup.py` exits 1 on `system-font` because of Cochin. Cochin is the app's content
  font by ruling (`typography-cochin-and-mono`). The house tokens allow brand fonts in content. The mockups
  already in the repo fail the same way. This is a possible false alarm.

## Deep links

`#s=<frame>`. Each frame has a frame id: today, foot-folded-ax5, foot-folded-l, foot-phone-ax5,
foot-open-ax5, core-folded-ax5, core-phone-ax5, core-open-ax5, core-open-l, size-half, size-grows,
size-grows-phone and rows-ax5. Add `&k=armed|undo|end|loading|failed` for a state, `&ts=L|xxxL|ax1|ax3|ax5`
to put every frame at one size, and `&n=2` for 2-digit counts. Focus ids: `band-foot-folded-ax5` (Foot
band), `band-core-open-ax5` (Core page), `band-size-half` (Holds at half) and `band-size-grows` (Grows with
the text).
