# When a chokepoint has two branches

A shared chokepoint can have two read paths. A mutant on one branch can hide behind the other branch, which still computes the right answer on its own. In group 37, the refund exclusion was dropped from `liveItems` alone. Every masthead figure still came out right. Those figures derive from `rangedItems`, which excludes refunds on its own. The first draft of group 37 checked only counts and lists, so it let the mutant live. Only the Orphaned candidates read `liveItems`. So only an envelope test could see the mutant. A chokepoint with two branches needs an assertion on each one.

**Holds while:** `liveItems` and `rangedItems` in `src/app.jsx` both filter out refunded packages.

## See also

- `testing-one-tier-not-decides` — a related shape, where one tier can hide a mutant on another
- `merge-rules-only-add` — the two-branch chokepoint that hid the refund mutant
