# Orphaned composer: keep Save clear of the keys

Mockup: `orphaned-composer-contrast.html`. Designer kind: informed. Owner page item 84: a pass that the ready composer's contrast audit (`OrphanedUITests.testAccessibilityAuditOrphanedComposerReady`) cannot flag. Debt `orphaned-composer-contrast`.

Deep links: `#s=all` (default: Today keys up, New keys up, New keys closed), `#s=today`, `#s=keys`, `#s=closed`. `#k=250` draws the 250 pt keyboard, and `#k=289` (default) the 289 pt one. `#o=<option id>` draws an option and rings the element it changes: `margin-strip`, `margin-clear`, `count-inksoft`, `count-ink`, `save-pill`, `save-fills`. The parts combine, as in `#s=keys&k=250&o=margin-clear`.

Option ids: `margin-clear` is item 1 (12 pt, picked); `margin-strip` is item 2 (56 pt, not picked).

Size and theme: iPhone Duo folded, 466 x 678 pt only (owner page item 109, decision `phone-forms-and-mockup-size`, still on branch `ruling-109-phone-forms`). Default text size. Light only: `native/project.yml` sets `UIUserInterfaceStyle: Light`.

## The cause the mockup draws

The colours are not the cause. The position is.

- The empty composer's audit passes (debt `orphaned-composer-contrast`: "their passes"). Its count, "0 cards", is the same text as the ready count: Menlo 11, inkSoft on card, enabled, and under no skip. So the same pair at the same size passes in one state and fails in the other.
- `ComposerView` scrolls the Save row to the bottom of the space above the keys only on a focus change (`.onChange(of: focused)`) and on `keyboardDidShowNotification`. `MastheadScreen` does this with `scrollTo(id, anchor: .bottom)`.
- The test's `addEnvelopeCard` (`OrphanedRecordSupport.swift`) keeps the keys up. `OrphanedModel.addName` clears the input, so the suggestion list closes as the entry row lands. Neither change moves focus or shows the keys again, so nothing re-scrolls.
- The net change is the entry block, 8 + 1 + 44 + 1 = 54 pt, plus its 8 pt stack spacing: the Save row drops 62 pt. On the folded Duo with the 289 pt keys, the row lies at y 407 to 451, wholly under the keys (top y 389). It is above the tab bar (y 595), so the tab-bar skip (`auditSkippingTabBar`, owner item 148 b) does not drop it. The audit reads keyboard pixels inside the count's frame and Save's frame. Cancel's frame is there too, and its flag is already skipped.

This is a strong reading, not a measured one. The red run was on the iPhone 18 Pro, whose keyboard height no record gives. The fix check below measures it.

## Contrast by the tokens

Computed for this mockup with the WCAG 2 relative-luminance formula from `shared/tokens.json`. Floors: Apple's accessibility page gives 4.5:1 for text up to 17 pt at any weight.

| Pair | Ratio | Least glyph-pixel share for 4.5:1 |
|---|---|---|
| "1 card" count: inkSoft #6E6379 on card #FCF6EA | 5.24:1 | 93% |
| Save text: card #FCF6EA on ink #332E3F | 12.17:1 | 52% |
| Save fill: ink #332E3F in the card #FCF6EA composer (floor 3:1) | 12.17:1 | n/a |
| Count, Ink option: ink #332E3F on card #FCF6EA | 12.17:1 | 68% |

The last column is the share of a pixel that must be the text colour, the rest card, for that pixel to clear 4.5:1.

## Items

1. **Margin: the Save row's bottom 12 pt above the keyboard's reported top.** Pick (owner ruling 123 a, 2026-11-22). Re-scroll each time the composer's height changes: an entry added or removed, the suggestion list opened or closed, a field growing to its third line. Do it as well as the focus and keys-shown scrolls. Folded, with the 289 pt keys: the row lies at y 333 to 377, the composer at y 122 to 389. With the 250 pt keys: the row lies at y 372 to 416.
   - Gain: the row clears the keys' reported top. It also fixes what a person sees: today the first card puts Save out of sight under the keys. 44 pt more of the page shows than at 56 pt.
   - Loss: the keys drew a 44 pt strip above their frame on the open Duo (`DuoHandUITests.keyboardDrawnAbove`, measurement `duo-fold-and-keyboard`). If they draw it here too, the row sits inside the strip, and the audit still reads keyboard pixels. The strip is measured on the open Duo only. On the folded screen and the 18 Pro it is unmeasured.
   - Departs from: `ComposerView` `.onChange(of: focused)` and the `keyboardDidShowNotification` handler, which scroll on focus and keys only, and `MastheadScreen` `scrollTo(anchor: .bottom)`, which leaves no margin. Not blocking.
   - Reach: `scrollTo` cannot scroll past the end of the content. The audited run starts with an empty pile, since the seed fixture `shared/fixtures/ledger.json` holds items only. The composer hides the empty line, so only the composer's 12 pt padding and the list's 16 pt bottom padding lie below the Save row, 28 pt in all. That covers the 12 pt margin, so the scroll needs no extra content below. Item 2 would need 28 pt more.
   - Pointer: the re-scroll moves the composer about 62 pt up just after a tap on a suggestion row. Invariant `no-layout-shift-under-pointer` forbids a row moving under the thumb after a press. Today the same tap already moves every row below the input by 62 pt as the list closes and the entry lands, but the re-scroll moves the input itself, which today stays still. To keep the move small, scroll only when the Save row lies below the keys' drawn top, and only by the distance needed. Owner grant: yes.
   - Builder: give the check an outcome, not a picture. With the keys up and one card added, Save's frame `maxY` ≤ the keyboard's `minY` − 12. The test reads the 12 pt margin from one constant and never copies it.
2. **Margin: 56 pt above the reported top.** The same re-scroll with the strip added: 44 pt for the strip plus the 12 pt clearance. Not picked.
   - Gain: the row clears the keys even if the folded screen and the 18 Pro draw the same strip.
   - Loss: 44 pt less of the page shows above the composer.
3. **Count stays inkSoft.** Pick. No colour change, at 5.24:1.
   - Gain: keeps the note meaning (decision `orphaned-colours-by-meaning`) and the web's count (`src/app.jsx` `EnvelopeComposer`).
   - Loss: thin headroom. A glyph pixel with less than 93% inkSoft falls under 4.5:1. The empty audit shows that this does not flag the count today.
4. **Count in ink.** 12.17:1, the colour of the quantity numeral in the row above.
   - Gain: wide headroom. A pixel down to 68% ink still clears.
   - Loss: changes a paint that `OrphanedPaint` pins (`note` → inkSoft), and it departs from the web. It is not needed if item 1 is the cause. Owner grant: yes.
5. **Save pill stays as today.** Pick. MiniLabel, a pill of about 29 pt inside its 44 pt hit frame.
   - Gain: no change to a shared control.
   - Loss: two card strips of about 7 pt sit inside Save's audited frame. No run shows they matter once the row is clear of the keys.
6. **Save and Cancel fill their 44 pt hit frame.** From the parked mockup on branch `lane/orphaned-composer-contrast`.
   - Gain: Save's audited frame holds only fill, border and text.
   - Loss: taller pills than the web's `miniBtn`. Decision `audit-skips-measured-flags` measured that a bordered MiniLabel flags in every container, so the change is likely to change nothing. Not picked.
7. **The gap between Cancel and Save stays 8 pt** (`HStackLayout(spacing: 8)`). The hit frames do not overlap. No evidence points at Cancel as the neighbour that sets off the flag. The neighbour that does is the keyboard, and item 1 is its margin.

## What moves compared with today

- With the keys up, the composer scrolls up after each card is added. With the 289 pt keys it moves 74 pt: from y 196–463 to y 122–389. Today the row is 62 pt under the keys' top, and the pick puts it 12 pt above that top.
- With the keys closed, nothing moves that does not move today. The scroll offset stays where the last re-scroll left it. That is my reading of SwiftUI's scroll view, and it is unmeasured. The row then lies 218 pt above the tab bar (179 pt with the 250 pt keys), so the audit checks it, with no overlap and no skip.
- No colour, size, font or control changes in the picks.

## The fix check

Run `testAccessibilityAuditOrphanedComposerReady` 5 times through `sim-test --device pro` before the change and 5 times after it. The red run was on the 18 Pro (job pro-ui-a). Add one Duo run, folded. Log Save's frame and the keyboard frame before each audit, so the run proves the row's place and not only the verdict. If the count or Save still flags with the row clear, item 1 is not the cause. Then fall back to items 4 and 6, or to the named skip that item 84 offered.

## Check verdict

`python3 ~/.claude/lint/check_ios_mockup.py` exits 1 with two faults, both expected:
- `duo-frames`: no unfolded frame. Owner item 109 rules mockups folded only. Decision `phone-forms-and-mockup-size` lists the skill (`ios-apps`, Mockups) as not yet in line.
- `system-font`: the drawn app uses Cochin (decision `typography-cochin-and-mono`), as every mockup in this folder does. The page chrome is in the system font.

## Sources

- `native/Manifest/OrphanedView.swift` `ComposerView`; `native/Manifest/MastheadScreen.swift`; `native/Manifest/ControlViews.swift` `MiniLabel`; `native/ManifestKit` `OrphanedModel.addName`, `OrphanedPaint`, `ControlPaint`; `native/ManifestUITests/OrphanedUITests.swift`, `OrphanedRecordSupport.swift` and `DuoHandUITests.swift`.
- Measurement `duo-fold-and-keyboard`: a 466 x 678 pt window, a tab bar from y 595, keys 250 to 289 pt tall folded, and the 44 pt drawn strip measured on the open Duo.
- Apple HIG Accessibility (the contrast table, and 44x44 pt as the default control size) and Buttons (a 44x44 pt hit region). Both read 2026-11-21 as JSON, and each answered 200.
