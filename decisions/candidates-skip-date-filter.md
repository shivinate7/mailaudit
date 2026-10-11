# Candidates ignore the date filter and canceled orders

Each pending envelope lists the outstanding packages that could explain it. The list ranks them, best first, and shows how much each one explains.

**Holds while:** `rankCandidates` in `src/view-rules.mjs` takes the entries, the packages and the received map. It takes no date range. V6 in `test/view-rules.test.mjs` pins the ranking and the tie.

Candidates ignore the date filter on purpose. An orphaned envelope is as likely to come from an old order. Candidates also exclude canceled orders.

The candidate list is derived, never stored. So a package received by other means stops being offered at once.

## See also

- `orphaned-mail-never-decides` — the limit that keeps a ranked candidate from deciding anything.
- `canceled-orders-leave-the-list` — why canceled orders are excluded.
- `orphan-entry-takes-one-input` — where the envelope gets its entries.
- `assign-checks-recorded-cards` — what happens when the user picks a candidate.
