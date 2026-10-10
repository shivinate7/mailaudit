# Recording an envelope takes one input

The Orphaned view records an envelope from one input. The input is autofocused when the view opens. Suggestions come from the cards still outstanding.

**Holds while:** `outstandingNames` in `src/app.jsx` still supplies the suggestions for the envelope input.

A tap adds a suggested card. A second tap bumps its quantity. The input clears and keeps focus, so the iOS keyboard never drops. The return key, or an "Add … as typed" row, records anything that is not in the ledger.

An optional note holds a tracking number or a sender. Optional photos work the same way. Neither one blocks the fast path.

Saved envelopes sit in a pile, newest first. They touch nothing in the ledger.

## See also

- `orphaned-mail-never-decides` — the limit on what an envelope may decide.
- `candidates-skip-date-filter` — how the outstanding packages get ranked against an envelope.
- `assign-checks-recorded-cards` — what assigning an envelope does.
- `label-photos-downscale-to-2000px` — the photos an envelope can carry.
