# Showing starts on unreceived every load

The Showing row replaces the old "Hide received" button. It shows state, not an instruction: `● Unreceived` or `○ Everything`. **It starts on `● Unreceived` on every load.**

In L11b the Showing row moved out of the ruled head. It is the first row of the View group on the Ledger tab (`ledger-tab-holds-options`). One tap on the row toggles the value.

**Holds while:** `hideDone` starts as `true` in `src/app.jsx`, and the `snapshot()` payload has no `hideDone` key. The Showing row is a `LedgerRow` that sets `aria-pressed` from `hideDone`.

The app opens with mail in hand, so the question is always what is still outstanding. Landing on the full list required a tap before the working view, every time.

Like the range disclosure, Showing is not persisted. It does not belong in the saved shape (`saved-state-shape`). It is the state each session starts from. One tap brings the received rows back for as long as that session lasts.

## See also

- `ledger-tab-holds-options` — the Ledger tab that holds the Showing row.
- `ruled-head-resume-is-reopening` — the other trigger that resets this state.
- `no-layout-shift-under-pointer` — the invariant this state avoids breaking.

**Pinned by:** 12.4 (starts on Unreceived), 12.5 and 12.6 (one tap shows the received rows, and a second tap hides them), 12.7 (Everything does not survive a reload), and 63.25 (the Showing row is unchanged). The pair 12.4 and 12.7 isolates the reload from the default.
