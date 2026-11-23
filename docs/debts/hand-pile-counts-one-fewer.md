# A same-day decrement shows as checked in today

**What.** The end-of-day pile on Card in Hand (`HandModel.todaysPile`, from PR 390) lists an envelope when one of its lines has a count above 0 and a `receivedAt` stamp at or after local midnight. A "One fewer" made today on a copy checked in on an earlier day also stamps that line today. So the envelope shows under "checked in today" with no check-in today. A decrement to 0 leaves no pile row, since the pile needs a count above 0. The saved data cannot tell a check-in from a decrement. A new field would tell them apart. Adding one needs an owner ruling and the five-site change that invariant `saved-state-shape` sets out.

**Status:** named limit. Owner ruling in chat 2026-11-22, about 17:46 CST (waiting page item 126, answer b): keep the wording "checked in today" and record the false entry as a known gap. Owner ruling 2026-11-22 19:41 CST (waiting page item 127, answer b, with c "if possible"): ship PR 390 with this gap; a follow-up lane adds a per-envelope check-in date field (option c) and retires this debt. That lane is the `docs/todo.md` line for option c.

**Decision:** `duo-card-in-hand`.
