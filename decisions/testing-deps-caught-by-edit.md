# A missing dependency shows only on an edit

A memo that omits a dependency stays hidden while the memo re-runs for other reasons. A query change re-runs the closure anyway. So a query test cannot see the missing dependency. Only an edit to a value the memo reads, made while a search is live, exposes it.

**Holds while:** `visible` in `src/app.jsx` lists `stamps` in its dependency array, and test 37.34 edits a note under a live search.

Test 37.34 edits a note under a live search. The hit must disappear. That is the only shape that catches `stamps` missing from `visible`'s dependency array. Keep this test if group 37 is ever trimmed.

## See also

- `one-stamp-per-package`, the stamp rule this memo serves.
- `testing-surviving-mutant`, the related lesson on states a fixture never reaches.
