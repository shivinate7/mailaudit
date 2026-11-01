---
paths:
  - ".claude/rules/**"
---

# Rules

A rule that matters only under one folder lives here as a file named for its topic. Its front matter holds a `paths:` list of globs.

Four files exist now:

- `.claude/rules/native.md`: the native client and its debts. Loads for `native/**`, `shared/**`, `tools/ios-ship.json`, `.github/workflows/test.yml`, `scripts/send-key.mjs`, `scripts/gen-golden.mjs`, `src/*-rules.mjs` and `build.mjs`.
- `.claude/rules/debts.md`: the known gaps outside the native app. Loads for `docs/debts/**`.
- `.claude/rules/testing.md`: the testing method and the test harness. Loads for `test/**`.
- `.claude/rules/screens.md`: the screen rules. Loads for `src/app.jsx`, `src/view-rules.mjs`, `src/merge-rules.mjs`, `shared/tokens.json`, `build.mjs`, `test/screens.mjs`, `test/a11y-base-boxes.json`, `native/Manifest/Theme.swift` and `native/ManifestKit/Sources/ManifestKit/LedgerStore.swift`.
