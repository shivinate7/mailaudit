# An assertion that throws is a worse kill

A test that throws on a mutant is worse than one that fails cleanly. Three mutants in the versions suite died by an unguarded `JSON.parse(null)` inside the test file. That throw aborts a top-to-bottom run with no isolation and hides every group that runs after it. The reads are guarded now so a failure stays a failure.

## The argument, as recorded

```
- **An assertion that THROWS is a worse kill than one that fails.** Three of
  group 39's mutants died by `JSON.parse(null)` inside the test file, which
  aborts a top-to-bottom suite with no isolation and masks every group after it.
  Those reads are guarded now (`beforeReset && JSON.parse(...)`).
```

## See also

- `testing-an-assertion-that-cannot-fail-is-decoration` — the neighboring failure mode of a weak assertion
- `version-tiers-are-unioned` — the version suite where the guarded reads live
