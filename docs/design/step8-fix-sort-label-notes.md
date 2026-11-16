# Sort label fit: notes

Mockup: `docs/design/step8-fix-sort-label.html`. Step 8 fix, PR 238, on `step8-amend` at e7769bd5. Designer kind: informed.

Deep links: `#o=measure`, `#o=outline`, `#o=short`, `#o=wide`; `d=375`, `d=fold`, `d=duo`; `x=normal`, `x=ax3`, `x=ax5`; `t=light`, `t=dark`. Join them with `&`. With no hash, every option shows. Hide controls: "Hide measure first", "Hide picked cell outlined", "Hide shorter label" and "Hide one label per row". "Hide one column at AX sizes" draws today's two columns in the AX frames. Focus ids: `focus-measure`, `focus-outline`, `focus-short` and `focus-wide`, each the Most missing cell in the option's 375 pt normal frame.

## Sources

- Code on e7769bd5:
  - `native/Manifest/OptionPanel.swift` `OptionPanel.button`: mono 11.5 relative to `.caption`, `lineLimit(1)`, `frame(maxWidth: .infinity, minHeight: 44)`. No padding, no `fixedSize` and no scale factor, since 9fc5bbea.
  - `LedgerTab.swift:89`.
  - `ViewOptions.swift:102`, where `itemSort` starts at `.missing`.
  - `TallyUITests.swift:235-266`.
  - `ManifestKit/Tally.swift:11`.
- The web: `src/app.jsx:1651` `optCell` and `src/app.jsx:1667` `ITEM_SORTS` ("Most missing"). Decision `native-parity-table`, line 20, which holds the six Tally sort keys on both clients.
- Debts `native-seller-scale-unmeasured` and `tally-audit-contrast-flags`.
- Run logs in the session scratchpad: `e_d_full.txt` (run 43894310154, job d), plus `d_full.txt` and `prev_d_full.txt`.
- Apple `typography`, read 2026-11-16: Caption 1 is 12 pt at Large, 22 at AX1, 26 at AX2, 32 at AX3 and 43 at AX5. `accessibility` sets the 11 pt minimum.

## Items

1. **The flag does not follow the width.** Found, not a choice.
   - "Most missing" is 12 Menlo characters. At 11.5 pt that is about 83 pt, against the 163 pt cell. That assumes a 0.602 em advance, which I did not measure.
   - "Most ordered" has the same 12 characters. It sits in the same left column, in the same 163 pt cell, and it passes in the same test.
   - So no change to the label or the cell can be argued to clear the flag.
   - Two things set Most missing apart:
     - It is the only cell audited while picked. `itemSort` starts at `.missing`. The test audits label i while label i - 1 is picked (`TallyUITests.swift:247-264`).
     - It is the first audit after the Ledger tab opens. Debt `native-cold-launch-ledger-shift` says that tab may still move then.
   - Debt `native-seller-scale-unmeasured` records the same kind of flag on a label with room to spare ("Alpha Cards", 82 pt in 238 pt).
   - The flag stayed after 9fc5bbea removed the scale factor.
   - I cannot know the cause without a run.

2. **Measure first.** The pick at the default size. Today's look.
   - What: leave the label and the cell as built. A test-author runs two probes once:
     - Pick Cost basis, reopen the grid, and audit Most missing unpicked.
     - Pick Most ordered, reopen the grid, and audit Most ordered picked.
   - Reading the result:
     - If the flag follows the picked state, item 3 is the product fix to try.
     - If it follows the first audit, the fix belongs to the test or to debt `native-cold-launch-ledger-shift`, not to the cell.
   - Gain: no product change on a guess (`building-fix-cause-not-symptom`).
   - Loss: `testEverySortLabelFitsAt375pt` stays red until the run.
   - Pick: yes. Owner grant: no.

3. **Picked cell outlined.** New. Conditional on item 2.
   - What: in `OptionPanel.button`, when `cell.on` is true, draw these. Do the same in `OptionChip`, so the grids do not differ.
     - The fill is `Parchment.card`.
     - The text is `Parchment.accent`, bold.
     - The edge is `.overlay(Rectangle().strokeBorder(Parchment.accent, lineWidth: 2))`.
   - Gain: no light-on-solid text cell, if that is what the audit flags.
   - Loss: whether it clears the audit is unknown.
   - Departs from: `src/app.jsx` `optCell`, whose picked cell is a solid accent fill. Not blocking.
   - Pick: only if the probe ties the flag to the picked state. Owner grant: yes.

4. **Shorter label ("Missing").** New. Not picked.
   - Loss: it breaks parity with `ITEM_SORTS` and `native-parity-table`. It also fixes nothing that width explains, since Most ordered is as long and passes.
   - Pick: no. Owner grant: yes, because it changes a label.

5. **One label per row.** New. Not picked.
   - Loss: the grid grows from 3 rows to 6 at every size, 135 pt more at the default size. It departs from the web's `optGrid(2)`, and it adds width the label does not need.
   - Pick: no.

6. **One column at accessibility sizes.** New. The pick, with any option above. It is a real clip, separate from the flag at the default size.
   - What, in `OptionPanel`: add `@Environment(\.dynamicTypeSize) private var typeSize` and `private var cols: Int { typeSize.isAccessibilitySize ? 1 : columns }`. Use `cols` in place of `columns` in `rows` and `gridCellColumns`.
   - What it does to Most missing, by arithmetic, unmeasured. The cell text is 11.5 pt scaled by Caption 1.

     | Width | Size | Text | Today's cell | One-column cell |
     | --- | --- | --- | --- | --- |
     | 375 pt | Normal | 83 pt | 163 pt, fits | unchanged: two columns stay |
     | 375 pt | AX3 | 222 pt | 163 pt, cut to "Most mis…" | 327 pt, fits |
     | 375 pt | AX5 | 298 pt | 163 pt, cut | 327 pt, fits |
     | Folded Duo | AX5 | 298 pt | 208.5 pt, cut | 418 pt, fits |

   - At AX2 the label is 180 pt and is cut today. AX1 is 152 pt and fits. `isAccessibilitySize` covers both.
   - The same panel holds the range grid (4 columns). "All time" there is 148 pt at AX3 against 81 pt, so one column fixes it too.
   - Gain: every sort and range label shows whole at AX1 to AX5.
   - Loss: at AX sizes the six sorts take six rows and the seven ranges take seven.
   - Pick: yes. Owner grant: no. The web has no Dynamic Type, and `ux-swift-same-intent` stacks at accessibility sizes.

7. **The open Duo.** Found, not a choice. `LedgerTab` has no `DuoPages`, so the View group and the grid run across both pages and the fold. That is a code read; I took no shot. It is outside this fix.

## Unmeasured

- The Menlo advance.
- Every AX width above.
- The cause of the default-size flag, until item 2's run.
- Whether item 3 or item 6 changes any audit result.

## Critique

Skill `impeccable` (`critique`) was run on 2026-11-16 as a design review alone. The target is native, and it had no snapshot. The launcher did not run, and no PRODUCT.md or DESIGN.md exists.

- Fixed: the cell marks were drawn below their cells, because the offsets were added twice. The cell's offsetParent is the frame.
- Fixed: each route grew the frames. Their height is now the content's height.
- Fixed: the measure-first mark read green while the audit flags that cell. It now reads red, "flagged at this size, cause unknown".
- Kept: the "VIEW" group label is uppercase, as built (`LedgerTab.viewGroup`, `textCase(.uppercase)`).
- Open (P3, outside this fix): at AX3 and AX5 the Ledger row's value ("Most missing") wraps under its title. That is the row, not the grid. Debt `native-axl-rows-break` covers rows that break at AX sizes.

## Input Needed

- Item 3, picked cell outlined, departs from the web's `optCell`. Owner grant: yes. Ask only if item 2's run ties the flag to the picked state.
- Item 4, the shorter label: Owner grant: yes. Not recommended.
- `check_ios_mockup.py`: one fault, `system-font` on Cochin, which is the app's content font. It is the same fault as the step 8 mockups.
