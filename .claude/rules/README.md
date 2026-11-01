---
paths:
  - ".claude/rules/**"
---

# Rules

A rule that matters only under one folder lives here as a file named for its topic. Its front matter holds a `paths:` list of globs.

Four files exist now:

- `.claude/rules/native.md`: the native client and its debts. Loads for `native/**`.
- `.claude/rules/debts.md`: the known gaps outside the native app. Loads for `docs/debts/**`.
- `.claude/rules/testing.md`: the testing method and the test harness. Loads for `test/**`.
- `.claude/rules/screens.md`: the screen rules. Loads for `src/app.jsx` and `src/view-rules.mjs`.
