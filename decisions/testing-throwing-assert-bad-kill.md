# An assertion that throws is a worse kill

A test that throws on a mutant is worse than one that fails cleanly. Three of group 39's mutants, in the versions suite, died by `JSON.parse(null)` inside the test file. That throw aborts a top-to-bottom run with no isolation. It also hides every group after it. The reads are guarded now, as `beforeReset && JSON.parse(...)`, so a failure stays a failure.

**Holds while:** the group 39 reads in `test/app.test.mjs` are guarded as `beforeReset && JSON.parse(...)`.

## See also

- `testing-unfailable-assert-decor` — the neighboring failure mode of a weak assertion
- `milestones-taken-before-risk` — group 39, the version suite where the guarded reads live
