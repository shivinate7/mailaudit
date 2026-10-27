# Merge runs unattended, with no two-tap arm

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md

Merge pulls, unions, applies, and pushes in one step. A merge can lower a count, but only to apply an un-check the owner made later on the other device. So it removes only what the owner removed. Every removal it applies is a later write that the owner made. The old Pull and Push anyway controls were the two halves of one mistake. Each kept one device's work by discarding the other's. `doMerge` keeps both, except for those removals.

**Holds while:** `doMerge` in `src/app.jsx` runs on one call, with no confirm state of its own. `applyBackup` in `src/app.jsx` takes a milestone before a merge applies. Each removal follows the later-time rule in `merge-later-change-wins`.

It carries no two-tap arm, on purpose. The two-tap pattern in `no-native-dialogs` guards a mis-tap on a control that destroys work. A merge removes only what a later owner write removed. A confirm would only ask the owner to repeat that removal. A saved version still restores a wrong un-check (`milestones-taken-before-risk`). The merge skips the confirm pattern for that reason.

There are three entrances to one function, `doMerge`. No button calls it now (2026-10-12).

- The conflict in the automatic push. `doMerge(true)` runs there. It also completes the rejected push.
- The ahead notice. A Worker reply on a fresh session runs `doMerge(reply)`, the one merge path. The GitHub push it once completed is gone, so there is no empty commit to avoid.
- A Worker reply. `doMerge(false, true, reply)` applies it, with no pull and no photo download.

**Pinned by:** group 34. Mutant confirmed red: a merge that stops disarming the other armed confirms.

## See also

- `stale-push-conflict-pull-two-tap` — the stale-push rule that the mirror conflict runs.
- `sha-accepted-only-after-apply` — the rule merge still depends on.
- `merge-later-change-wins` — the rule that picks which removal a merge applies.
- `milestones-taken-before-risk` — the saved version that restores a wrong un-check.
