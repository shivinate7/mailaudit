# Sessions pause at 93% of the weekly usage

Kind: process

Home: docs/decisions/usage-pause-at-93.md

The owner ruled on 2026-11-09 at 23:46 CST, relayed by the degen coordinator and then by this repo's coordinator at 23:47 CST. The account's 7-day usage stood at 87%, and it resets on Saturday 2026-11-14 at 13:00 CST.

- Under 93%: favour work close to landing, start little new, and keep working.
- At 93% or more: hard pause. Start nothing and end the turn. A CI run already going may finish.
- The pause ends at the reset, or on the owner's word.
- A session reads the figure on demand: the list_events tool on its own session id, with kinds rate_limit_event, field utilization. The coordinator also sends PAUSE.

**Holds while:** the owner has not lifted the ruling, and the account's 7-day usage has not reset. Dated by the reset on 2026-11-14 13:00 CST.
