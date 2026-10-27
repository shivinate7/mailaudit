# The lost tile waits for the first POST

**What.** The lost tile shows only after the push survey that follows a successful POST. A session that opens with nothing to send shows no tile until its first POST. This delays a warning, and it cannot raise a false one. Found in the round 3 review of PR #108, 2026-10-17.

**Status:** open. Accepted as a delay.

**Decision:** `pull-warns-on-what-it-drops`.
