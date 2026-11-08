# Todo

Tasks a session caught and did not do. One line each.

- `src/entry.jsx` still sends a stored GitHub token on GitHub calls. Web History's reads of the private `mailaudit-data` repo are unproven with no token.
- Code comments still say the ledger push and photo uploads share GitHub's content-write budget, though the web app makes no GitHub writes: `src/app.jsx` near 3172 and 4026, `src/entry.jsx` near 418, 505, 601-608 and 660, `test/harness.mjs` near 297. The GitHub write functions in `src/entry.jsx` (near 640, 745, 794) are unreachable from the UI.
- Decision `duo-card-in-hand` says "five mockup parts", but debt `duo-hand-mockup-gaps` says eight. One of them is wrong.
- The review round 1 notes for PR #154 cannot be found, so its findings 3, 5 and 6 are unknown. The side-session note `orders-scrape-spike.md` is the 10-27 research spike, not those notes.
