# Form controls need their own font rule

Browsers force their own UI font onto buttons, inputs, selects, and textareas. Setting the family on the page root alone is not enough. A dedicated rule in the stylesheet makes form controls inherit Cochin. Without it, a control that does not set a family inline renders in the browser default. That looked like a Cochin regression, but it was a missing rule.

## See also

- `design-parchment-ledger` — the palette this font rule renders on top of.
- `motion-remeasure-not-rereason` — the same lesson, that a real browser must confirm what a test cannot.
