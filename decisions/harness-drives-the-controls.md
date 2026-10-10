# Tests drive the controls by their labels

The ruled head replaced the native select and the chip disclosures. The harness therefore finds each head control by its visible label. Helpers wrap the common actions.

**Holds while:** `cell`, `toggleShowing`, `openRange` and `pickSort` are exported from `test/harness.mjs`.

- `cell(re)` finds a ruled-head cell by its text.
- `toggleShowing()` flips Showing.
- `openRange()` opens the range panel. `pickSort(label)` picks a sort option by its visible label. No native select is left to drive with `choose()`.
- Packages render expanded. So "Mark all received" matches several buttons. Reach into the specific card, not the first match on the page.
- The key field is uncontrolled by design. Set it with `el.value = "…"`. Do not route it through `type()`, which exists for React-tracked inputs.

## See also

- `ruled-head-masthead-vocabulary`, the head these helpers drive.
- `ruled-head-panels-carry-no-fill`, the panels that `openRange` opens.
- `the-token-is-a-credential`, the reason the key field is uncontrolled.
