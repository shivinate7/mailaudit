# The native check-in error bar is set in sans on material

**What.** The native Packages and Tally check-in error bars (`checkin-error`) use the system footnote font on `.regularMaterial`, centred. That clashes with `typography-cochin-and-mono` (no sans-serif), `design-parchment-ledger` (every colour is a token) and `ruled-head-panels-carry-no-fill` (overlay panels take the paper fill). Card in Hand's own error banner already uses Cochin on paper. The owner sees it on every failed check-in on those tabs. The gap closes when both bars use the Card in Hand style, and the shots pass a design review.

**Status:** open.

**Decision:** `typography-cochin-and-mono`.
