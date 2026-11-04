---
paths:
  - ".claude/rules/**"
---

# Rules

Folder-only rules live here, one file per topic, named for it (claude-settings rule
`tokens-folder-rules-load-by-path`). Each file's front matter holds a `paths:` list of globs.

Nine files exist now. Each file's `paths:` list is the only home of its globs.

- `.claude/rules/native.md`: the native client and its debts.
- `.claude/rules/debts.md`: the known gaps outside the native app.
- `.claude/rules/testing.md`: the testing method and the test harness.
- `.claude/rules/screens.md`: the screen rules.
- `.claude/rules/sync.md`: storage, sync, the remote and the token.
- `.claude/rules/photos.md`: envelope photos.
- `.claude/rules/versions.md`: saved versions and recovery.
- `.claude/rules/build-ci.md`: the public seed, and build, CI and assets.
- `.claude/rules/retired.md`: retired and closed records.
