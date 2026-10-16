# Photos in git are permanent

**Status:** open.

No path ever deletes a remote photo. Discard, the sweep, and `resetAll` all stop at the device boundary. Git history keeps every photo the GitHub photo branch ever held, including the 8 that the one-time copy will send to the Worker. That copy is pending and has not run. The Worker's photo route has no delete route, and a repeat POST keeps the first bytes. So a label from an envelope you discarded stays in git, and any copy on the Worker stays there too.

**Holds while:** no code path makes a DELETE request. `src/entry.jsx` and `worker/core.mjs` have no `DELETE`, and the `/photos` route answers only GET and POST. Adding one closes this record.

A DELETE path is easy to add. It costs a new destructive control. Accepting the permanence is the better trade.

The same fact has an upside for Reset: `resetAll` keeps the device key. Whether a merge after a Reset brings the photos back from the Worker is unmeasured.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-sync-cannot-conflict` — the same one-file-per-photo design this permanence follows from
- `the-write-budget-is-shared` — the request budget a delete path would also spend
