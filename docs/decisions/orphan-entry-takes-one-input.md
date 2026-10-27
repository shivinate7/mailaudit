# Recording an envelope takes one input

The Orphaned view records an envelope from one input. The input is autofocused when the view opens. Suggestions come from the cards still outstanding.

Kind: build

Plan: docs/decisions/orphan-entry-takes-one-input.md#the-composers-draft (web)

**Holds while:** `outstandingNames` in `src/app.jsx` still supplies the suggestions for the envelope input. Its logic is `outstandingNames` in `src/view-rules.mjs` (V11.8 to V11.10).

A tap adds a suggested card. A second tap bumps its quantity. The input clears and keeps focus, so the iOS keyboard never drops. The return key, or an "Add … as typed" row, records anything that is not in the ledger.

An optional note holds a tracking number or a sender. Optional photos work the same way. Neither one blocks the fast path.

Saved envelopes sit in a pile, newest first. They touch nothing in the ledger.

## The composer's draft

Each composer keeps its own draft. Its key is the envelope id, or `new` for a new record. Opening a second composer never loses the first one's draft. Cancel closes the composer and keeps its draft, under ux-keep-what-was-made. Only Discard or Save ends a draft. That rule is an orchestrator default of 2026-10-11, not an owner ruling.

Owner ruling, 2026-10-12 ("make it exact fix then"): a closed draft holds the photos it references, and the photo sweep keeps them. The sweep takes every other unused blob. An open composer still holds the sweep off. The sweep reads each draft's photos when its timer fires. Drafts live in memory only, so a reload clears them.

**Status:** open. Built: the per-composer keys, the Cancel rule, Save, which ends its draft, and the sweep rule for drafts above. Not built: Discard does not end a draft, see `discard-keeps-draft`. Open: Reset, and every restore, pull or merge that applies, clears all drafts. `applyBackup` and `resetAll` clear the draft map. The default allows neither. Owner to rule. The default allows neither. Owner to rule.

## Discard

Discard sits on each saved envelope. Its ask arms in place. The ask reads "Tap again to discard N cards", where N is the envelope's cards. Cancel takes first focus. The ask hangs below the row, so the arm does not shrink or move the envelope header or the Edit control (ux-press-moves-nothing). The count and the arm are built. The count is an orchestrator default of 2026-10-11.

**Pinned by:** tests 61.8 and 61.9 (the Discard ask names the cards, first focus on Cancel), 61.43 to 61.46 (the arm keeps the header row's nodes), 61.47 to 61.53 (Cancel keeps a draft, and drafts are held per composer), and 61.54 to 61.57 (61.54 is the control, with no draft, so an unused blob is swept; 61.55 a closed composer keeps its draft; 61.56 a closed draft keeps its photo and the sweep takes the rest; 61.57 an open composer holds the sweep off). Geometry is not pinned here. Check 3 of `check:screens` measures it at 375px.

## See also

- `orphaned-mail-never-decides` — the limit on what an envelope may decide.
- `candidates-skip-date-filter` — how the outstanding packages get ranked against an envelope.
- `assign-checks-recorded-cards` — what assigning an envelope does.
- `label-photos-downscale-to-2000px` — the photos an envelope can carry.
- `ux-house-rules-govern` — the house rules the composer and the Discard ask follow.
