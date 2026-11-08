# The recent-actions log is not built in the native client

**What.** The web client ships the log, its merge rule, its panel and its undo (plan `recent-log-web`). The native client does not. The rules bundle does not carry `src/recent-rules.mjs` yet, and the Swift client draws no Recent screen. The gap closes when the native client ships the log with the proof that `recent-checks-can-be-undone` lists.

**Status:** open. The web half is built. No native lane is briefed.

**Decision:** `recent-checks-can-be-undone`.
