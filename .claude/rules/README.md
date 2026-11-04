---
paths:
  - ".claude/rules/**"
---

# Rules

Folder-only rules live here, one file per topic (`tokens-folder-rules-load-by-path`:
path-scoped rules). Its front matter holds a `paths:` list of globs.

Four files exist now. Each file's `paths:` list is the only home of its globs.

- `.claude/rules/native.md`: the native client and its debts.
- `.claude/rules/debts.md`: the known gaps outside the native app.
- `.claude/rules/testing.md`: the testing method and the test harness.
- `.claude/rules/screens.md`: the screen rules.
