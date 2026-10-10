# Form controls need their own font rule

Browsers force their own UI font onto `button`, `input`, `select` and `textarea`. Setting `font-family` on the page root alone is not enough. A rule in the `<style>` tag makes these controls inherit Cochin: `button, input, select, textarea { font-family: inherit }`. Without that rule, every button that does not set a family inline renders in the UA default, Arial in Chrome. This looked like seller names that were not in Cochin.

No test can catch a regression here, because jsdom has no UA stylesheet. The regression was caught by reading `getComputedStyle` in a real browser. That is the only way to catch it again.

## See also

- `design-parchment-ledger` — the palette this font rule renders on top of.
- `motion-remeasure-not-rereason` — the same lesson, that a real browser must confirm what a test cannot.
