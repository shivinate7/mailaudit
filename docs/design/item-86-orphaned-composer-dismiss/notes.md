# Item 86, hide the keys in the Orphaned note form: design notes

Owner page item 86 (`orphaned-composer-dismiss`). Debt `composer-keys-cover-tab-bar`. One mockup per drawn option: `a.html` (state `keys-hidden`) and `b.html` (state `keys-up`). Each page's focus is `#phone`, 402 x 874, drawn at 402.

The third option points the test at the Return key. It changes only a test, so it has no picture.

1. **The drag (`a.html`).** The Orphaned scroll gets `.scrollDismissesKeyboard(.interactively)`, the line `HandScreen.swift` already has. The keys follow a drag down on the list and close, and the tab bar shows again. Gain: the tabs are in reach mid-draft, and the draft stays, because `OrphanedModel.draft(for:)` holds it, not the field. Loss: a change to the app, one builder, one reviewer and one Mac run. Pick: this one, as the item proposes. Owner grant: yes.
   Departs from: main has no way to hide the keys in the Orphaned form (`ComposerView`, `.onAppear { focused = .name }`, never cleared).
2. **Leave it (`b.html`).** Today's state: focus on the card name, keys up, the Save row scrolled to the keys' top edge (`ComposerView`, `scrollTo(saveRow)`), the tab bar under the keys. Gain: no change. Loss: no tab switch while typing; the draft test stays red.
3. **Same scroll offset in both.** The drag leaves the content where it was, so the form sits at the same height in both pictures and only the bottom of the screen changes. Drawn: whether SwiftUI moves the content when the keys close is unmeasured.
4. **The draft after the drag.** The field loses focus (no caret, plain border); "Light" and its matches stay. Read from `ComposerView`: the matches follow `d.input`, not focus.

## Measured versus drawn

- Nothing on either phone is measured on the iPhone 18 Pro. `layout.py devices` prints `unknown` for this repo, so the size is the brief's, 402 x 874 pt.
- Drawn, unmeasured: the safe insets (62 pt top, 34 pt bottom), the keys' height (336 pt) and rows, the tab bar's size and glass, the masthead's height, the scroll offset. The `duo-fold-and-keyboard` figures are the Duo's and are not used.
- Read from code: the 46 pt running head (`RunningHead.height`), the 16 pt gutters (`OrphanedView.list`), the form's parts and paints (`ComposerView`, `OrphanedPaint`, `ControlPaint`), tab order and the Orphaned badge (`RootView`), Return reading "done" (`submitLabel(.done)`).

## Apple pages read 2026-11-18

- https://developer.apple.com/design/human-interface-guidelines/tab-bars (200): a tab bar floats above content at the bottom; keep it visible when people move between sections.
- https://developer.apple.com/design/human-interface-guidelines/layout (200): safe areas.
- https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards (200): no figure used.

## Checks

- `check_ios_mockup.py` flags two parts on both files. `system-font`: the app's own content is set in Cochin and Menlo (`OrphanedView.swift`); the chrome (tab bar, keys) uses the system font. `duo-frames`: the brief asks for the 18 Pro, not the Duo.
- Cochin and Menlo fall back to a serif and DejaVu Sans Mono off a Mac, so the PNGs' text widths are near, not exact.
