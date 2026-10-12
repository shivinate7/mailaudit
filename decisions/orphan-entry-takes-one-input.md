# Recording an envelope takes one input

The Orphaned view records an envelope from one input. The input is autofocused when the view opens. Suggestions come from the cards still outstanding.

**Holds while:** `outstandingNames` in `src/app.jsx` still supplies the suggestions for the envelope input. Its logic is `outstandingNames` in `src/view-rules.mjs` (V11.8 to V11.10).

A tap adds a suggested card. A second tap bumps its quantity. The input clears and keeps focus, so the iOS keyboard never drops. The return key, or an "Add … as typed" row, records anything that is not in the ledger.

An optional note holds a tracking number or a sender. Optional photos work the same way. Neither one blocks the fast path.

Saved envelopes sit in a pile, newest first. They touch nothing in the ledger.

## The composer's draft

Each composer keeps its own draft. Its key is the envelope id, or `new` for a new record. Opening a second composer never loses the first one's draft. Cancel closes the composer and keeps its draft, under ux-keep-what-was-made. Only Discard or Save ends a draft. That rule is an orchestrator default of 2026-10-11, not an owner ruling.

**Status:** open. Built: the per-composer keys, the Cancel rule, and Save, which ends its draft. Not built: Discard does not end a draft. `discardEnvelope` in `src/app.jsx` never clears it. The draft stays, and while any draft is held the photo sweep does not run. Open: Reset, and every restore, pull or merge that applies, clears all drafts. `applyBackup` and `resetAll` clear the draft map. The default allows neither. Owner to rule.

## Discard

Discard sits on each saved envelope. Its ask arms in place. The ask reads "Tap again to discard N cards", where N is the envelope's cards. Cancel takes first focus. The ask hangs below the row, so the arm does not shrink or move the envelope header or the Edit control (ux-press-moves-nothing). The count and the arm are built. The count is an orchestrator default of 2026-10-11.

## See also

- `orphaned-mail-never-decides` — the limit on what an envelope may decide.
- `candidates-skip-date-filter` — how the outstanding packages get ranked against an envelope.
- `assign-checks-recorded-cards` — what assigning an envelope does.
- `label-photos-downscale-to-2000px` — the photos an envelope can carry.
- `ux-house-rules-govern` — the house rules the composer and the Discard ask follow.
