# No test pins that resetAll keeps the GitHub token

**What.** No test pins that `resetAll` keeps the GitHub token. `resetAll` deliberately does not clear either credential. When a test pins that `resetAll` keeps the token, the gap closes.

**Status:** open.

**Decision:** `the-token-is-a-credential`.
