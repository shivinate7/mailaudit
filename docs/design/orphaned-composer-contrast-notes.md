# Orphaned composer, ready: contrast flags

Mockup: `orphaned-composer-contrast.html`. It covers the two "Contrast failed" findings of audit run 42653870499 in `OrphanedUITests.testAccessibilityAuditOrphanedComposerReady` (iPhone 18 Pro, 402 x 874 pt). Light only: the app sets `UIUserInterfaceStyle: Light` in `native/project.yml`.

Deep links: `#s=ready` (default, the audited state), `#s=empty` (Save disabled), `#o=<option id>` to focus one option, such as `#o=count-larger` or `#o=save-fills`.

## Ratios by the tokens (`shared/tokens.json`)

| Part | Text | Pair | Floor | Before | After (picks) |
|---|---|---|---|---|---|
| "1 card" count | Menlo 11 regular | `inkSoft` #6E6379 on `card` #FCF6EA | 4.5:1 | 5.24:1 | 5.24:1 (Menlo 13) |
| Ready Save text | Menlo 11.5 bold | `card` on `ink` #332E3F | 4.5:1 | 12.17:1 | 12.17:1 |
| Ready Save fill | none | `ink` on the `card` surround | 3:1 | 12.17:1 | 12.17:1 |

Both pairs clear their floor on paper, so the colours do not cause the flags. The likely cause is the audit's pixel sampling, as in debt `tally-audit-contrast-flags`. No change below touches a colour.

The not-ready audits do not show that Save passes. Save is disabled there, and those audits skip contrast on disabled elements (`inactiveContrast`, decision `audit-skips-measured-flags`). The audit checks Save only in the ready state.

Paint sources: `OrphanedView.swift` `ComposerView`, where the count is `.mono(11)` in `paint(.note)` and ready Save is `MiniLabel(bold: true, text: paint(.saveReadyText), fill/border: paint(.saveReadyFill))`. `OrphanedPaint` maps note to inkSoft, saveReadyText to card and saveReadyFill to ink. `CardChrome` puts the shadow on the fill, not the container, so the container-shadow cause measured on Tally does not apply here.

## Items

1. **Count: Menlo 13 regular, still inkSoft.** Pick. At 11 pt the count sits at the iOS minimum text size (Apple HIG, Accessibility). That page says "Thicker weights are easier to read for smaller font sizes." A thin stroke at the minimum size is the likely place for a pixel sample to read lighter than the token. 13 pt is the size of the quantity numeral in the row above (`Text("\(e.qty)").font(.mono(13))`).
   - Gain: a thicker, larger stroke, with the colour and its meaning kept. The frame grows from 40 x 13 to 47 x 15 pt. The footer row stays 44 pt tall, so nothing moves.
   - Loss: the count reads a little louder. Whether the audit stops flagging is unmeasured.
   - Departs from: `src/app.jsx` `EnvelopeComposer`, where the count is 11 px. Not blocking.
2. **Count: a named contrast skip.** Add the count to the skip list, as owner item 45 a did for the done-row detail at 4.51:1. The count needs an id first (for example `orphaned-count`), because today it has none.
   - Gain: no visual change, and it follows the precedent.
   - Loss: one more skip, and this pair has more margin (5.24) than the one item 45 a skipped. Owner grant: yes.
3. **Count: Menlo 11 bold.** Same width, because Menlo Bold keeps the advance.
   - Gain: a thicker stroke at the same size.
   - Loss: it competes with bold Save for weight. Not picked.
4. **Count: ink.** 12.17:1.
   - Gain: the largest margin.
   - Loss: it raises a colour that already passes, against item 45 a, where the owner kept inkSoft. Not picked. Owner grant: yes (it changes a paint meaning that `OrphanedPaint` pins).
5. **Save: fill the 44 pt frame.** Pick. Today the pill is about 29.4 pt tall (11.5 x 1.164 line plus 8 + 8 padding) inside a 44 pt hit frame. So two card-coloured strips of about 7 pt sit inside the audited box, and card is also Save's text colour. This is the only design factor the measurement points at: the decision measured a bordered `MiniLabel` in its 44 pt frame flagging at 12.2:1 in every container. With the change, Save and Cancel pills fill their 44 pt frame in both states, so the audited box holds only fill, border and text. Builder: give `MiniLabel` an option that applies `frame(minHeight: 44)` before the stroke and fill, and use it for both composer footer buttons.
   - Gain: no colour change. Both buttons keep one height, so Cancel stays level with Save (Apple HIG Buttons warns against two sizes side by side), and the footer row stays 44 pt.
   - Loss: this is a hypothesis, not a measured fix. Cancel's own flag is still skipped (its fill is card, the same as the surround).
   - Departs from: `src/app.jsx` `miniBtn`, which uses 8 x 12 padding. Not blocking.
6. **Save: a named contrast skip.** Add `orphaned-save` to the contrast skip with Cancel, Edit and Discard. It is the same measured class. The ruling of 2026-10-27 named only Cancel, Edit and Discard, and the record does not say why ready Save was left out.
   - Gain: no visual change, and the class is already measured.
   - Loss: one more skip on a primary control. Owner grant: yes. Fallback if item 5 still flags.
7. **Save: Menlo 13 bold, in both states.** This is the brief's size lever.
   - Gain: a larger glyph.
   - Loss: it is the weak lever. Save is bold already, and regular Cancel flags at 12.2:1. Not picked. Changing size in the ready state only would move Cancel when the first card lands (`no-layout-shift-under-pointer`), so it applies to both states.

## The fix check

The builder runs `testAccessibilityAuditOrphanedComposerReady` 5 times through `sim-test --device pro`, before and after the change, which is the debt's own method. The composer audits passed 10 of 10 on 2026-10-28, so one green run proves nothing. If either pick still flags in 5 runs, fall back to the skip for that element (items 2 and 6).

## Device and sizes

`python3 ~/.claude/lint/layout.py devices` prints `unknown` for this repo, so the page draws the brief's size: iPhone 18 Pro, 402 x 874 pt, at the default text size. The footer is placed at the audit's y 568. The masthead and the tab bar are placeholders, and their heights are not measured here. The page draws no Duo frame, and `check_ios_mockup.py` fails on that alone. The drawn Save pill is 114 pt wide (0.602 em advance), and the audit reports 118. The 4 pt gap is unmeasured.

## Sources

- Apple HIG Accessibility (minimum text size, weight at small sizes, contrast table) and Buttons (44 x 44 pt hit region, matched button sizes). Both read 2026-11-09 as JSON, and each answered 200.
- `native/Manifest/OrphanedView.swift` `ComposerView`; `native/Manifest/ControlViews.swift` `MiniLabel`; `native/ManifestKit` `OrphanedPaint` and `ControlPaint`; `src/app.jsx` `EnvelopeComposer` and `miniBtn`.
