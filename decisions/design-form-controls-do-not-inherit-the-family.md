# Form controls need their own font rule

Browsers force their own UI font onto buttons, inputs, selects, and textareas. Setting the family on the page root alone is not enough. A dedicated rule in the stylesheet makes form controls inherit Cochin. Without it, a control that does not set a family inline renders in the browser default. That looked like a Cochin regression, but it was a missing rule.

## The argument, as recorded

```
**Form controls do not inherit `font-family`.** Browsers force their own UI
font onto `button`/`input`/`select`/`textarea`, so setting the family on the
root is not enough — a `button, input, select, textarea { font-family: inherit }`
rule in the `<style>` tag is what actually makes them Cochin. Without it every
button that doesn't set a family inline silently renders in the UA default
(Arial in Chrome); it looked like seller names "weren't Cochin". **jsdom has no
UA stylesheet doing this, so no test can catch a regression here** — it was
caught by reading `getComputedStyle` in a real browser, and that's the only way
it will be caught again.
```

## See also

- `design-parchment-ledger` — the palette this font rule renders on top of.
- `motion-remeasure-not-rereason` — the same lesson, that a real browser must confirm what a test cannot.
