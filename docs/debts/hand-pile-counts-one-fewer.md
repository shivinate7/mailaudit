# A same-day decrement shows as checked in today

**What.** The end-of-day pile on Card in Hand (`HandModel.todaysPile`, from PR 390) lists an envelope when one of its lines has a count above 0 and a `receivedAt` stamp at or after local midnight. A "One fewer" made today on a copy checked in on an earlier day also stamps that line today. So the envelope shows under "checked in today" with no check-in today. The saved data cannot tell a check-in from a decrement. A new field would tell them apart, but invariant `saved-state-shape` rules out a new field.

**Status:** named limit. Owner ruling in chat 2026-11-22, about 17:46 CST (waiting page item 126, answer b): keep the wording "checked in today" and record the false entry as a known gap. It reopens only on a new owner ruling.

**Decision:** `duo-card-in-hand`.
