# Newer features have only test proof

Daily use verifies most features. These features are newer. Only `npm test` proves them so far:

- the Tally view and cost basis;
- Orphaned and envelope photos;
- Push and Pull, the two-device merge and auto-push;
- the resume reset on Showing.

**Holds while:** `live-verification` records no field run of these features. It records no real iPhone run of the camera or the resume reset.

Auto-push is the one feature here with a field record. That record is bad. Its first day of real two-device use destroyed a check-in. The merge was not wrong. Replayed against the two real ledgers, it is correct.

The adapter advanced the stored sha before the app applied the bytes. So a stale ledger pushed with no conflict. Group 35 pins the fix. The rule is in `sha-accepted-only-after-apply`.

Treat the rest of the list as unproven, not merely untested. The camera path has never run on a real iPhone. Neither has the resume reset. jsdom can prove that the listener is wired and the arithmetic is right.

Whether iOS fires `visibilitychange` on a home-screen app's return is WebKit's decision. Real requests have reached GitHub. The data branch has taken real authenticated pushes. See `live-verification` for what has not run.

## See also

- `live-verification` — what has run against real GitHub or a real device.
- `sha-accepted-only-after-apply` — the sha rule that the auto-push incident broke.
- `the-conflict-guard-is-unverified` — the conflict guard, which has never run against real GitHub.
- `peek-is-verified-only-on-refusal` — the one peek path that has run against real GitHub.
