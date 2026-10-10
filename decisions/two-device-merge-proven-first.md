# Prove the two-device merge before trusting auto-push

Setup ends with an actual conflict test. It does not end with a successful push. The two steps below are part of the one-time setup.

**Holds while:** `src/app.jsx` has no auto-push toggle, and the conflict control reads "Merge & push".

5. In the app: Sync → paste → Save key → Push. Expect `Pushed ✓`. Check that `mailaudit` gained no commit at all. With photos in the ledger, expect `mailaudit-data` to gain one commit per photo on `main`. The button stays on `Pushing…` until they are done. Each takes roughly a second. The ledger and the photos share one repo's write budget and one `spaceWrites()` clock.

   Then run the test worth doing. Pull onto a second device or origin, and confirm the thumbnails render. This is the one path where a wrong order fails silently. The ledger comes back looking perfect, with every photo id quietly stripped.

6. Prove the merge before trusting auto-push. Auto-push's conflict recovery is that same path, running unattended. On A, check a card in, then Push. On B, without pulling, import a CSV that adds lines, then Push. Expect the conflict. Then tap **Merge & push**. B must end holding A's check-in and its own new lines. A's next Merge must agree.

   Sync is unconditional now. There is no toggle to enable. So this proof is a prerequisite for running the app on two devices at all, not only for enabling a feature.

   `file://` and `http://localhost:4173` are two separate origins with two separate ledgers. So they can act as two devices, without a second phone. See "Running it locally".

**Pinned by:** group 34. Its fixture is the real 08-22 state from `git log origin/data`. A phone holds unpushed check-ins and a stale item list. The remote holds the laptop's fresh import.

Mutants confirmed red:
- a merge that applies the ledger before it downloads photos;
- a photo phase that surveys the pre-merge reference list;
- a conflict during the merged push that leaves no button.

Group 40 also kills a quiet merge that announces itself.

## See also

- `auto-push-safe-as-merge-exists` — why this proof matters before automatic sync runs
- `push-and-merge-guard-differently` — the guard rules this proof exercises
- `merge-rules-only-add` — the union rule this conflict test is proving
