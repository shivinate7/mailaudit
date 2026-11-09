# The ready Orphaned composer fails contrast on its card count and its Save

**What.** `testAccessibilityAuditOrphanedComposerReady` (the ready composer's contrast audit) failed "Contrast failed" on 2 of 2 tries in duo-ui run 42653870499, job pro-ui-a, on main `9bafcad` plus one Makefile comment line (2026-11-09). It flags two elements: the "1 card" text, which has no id, and the ready Save envelope button (`orphaned-save`). The audit skips contrast on disabled elements by owner ruling (`inactiveContrast`, decision `audit-skips-measured-flags`, the owner's ruling on named audit skips). Save is disabled in the not-ready states, so their passes say nothing about Save. The ready state is audited in full. The Cancel, Edit and Discard buttons have a named skip, and these two elements have no such ruling. Debt `native-orphaned-colours-unbuilt` covers a different finding: text with no element, which comes and goes. The gap closes when the ready audit passes, through an owner-granted named skip or through a found cause. A skip alone does not find the cause.

**Colours clear by the tokens.** These figures are computed from `shared/tokens.json`. They are not sampled from rendered pixels. Source: the designer's notes on branch `lane/orphaned-composer-contrast` at `99e1b30`.

- "1 card" count: `inkSoft` on `card`, 5.24:1 (floor 4.5:1).
- Ready Save text: `card` on `ink`, 12.17:1 (floor 4.5:1).
- Ready Save fill against the `card` around it: `ink` on `card`, 12.17:1 (floor 3:1).

So the colours are not the likely cause.

**The cause is unmeasured.** The likely cause is how the audit samples rendered pixels. That is the same class as debt `tally-audit-contrast-flags` (the Tally audits' contrast flags, which also clear by the tokens). The container shadow measured on Tally does not apply here. Orphaned puts its shadow on the fill, not the container (designer's notes).

**Open route.** A named skip is the open route, and it needs an owner grant. The coordinator sends the question to the owner as waiting-page item 84, which cites decision `audit-skips-measured-flags`. The designer's mockup and its size and frame picks are parked on branch `lane/orphaned-composer-contrast` at `99e1b30`. None is built, and no Mac runs are spent. The "1 card" count has no id, so a skip for it needs one first (designer's notes).

**Status:** open. The test stays red under this debt, by coordinator ruling (2026-11-09 12:01 CST). The open route waits on an owner grant (waiting-page item 84). Tracked at roadmap step `orphaned-composer-colours`, the roadmap item for this debt.

**Assigned:** the mailaudit coordinator session.

**Fix by:** 2026-12-01.

**Decision:** `orphaned-colours-by-meaning` (Orphaned uses the app's colour meanings).
