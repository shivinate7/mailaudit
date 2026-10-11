# Merge never needs a two-tap arm

Merge and push pulls, unions, applies, and pushes in one step. A merge can lower a count, but only to apply an un-check the owner made later on the other device. So it removes only what the owner removed. Every removal it applies is a later write that the owner made. Pull and Push anyway are the two halves of the same mistake. Each keeps one device's work by discarding the other's. `Merge & push` keeps both, except for those removals.

**Holds while:** `doMerge` in `src/app.jsx` runs on one tap, with no confirm state of its own. `applyBackup` in `src/app.jsx` takes a milestone before a merge applies. Each removal follows the later-time rule in `merge-later-change-wins`.

It carries no two-tap arm, on purpose. The two-tap pattern in `no-native-dialogs` guards a mis-tap on a control that destroys work. A merge removes only what a later owner write removed. A confirm would only ask the owner to repeat that removal. A saved version still restores a wrong un-check (`milestones-taken-before-risk`). The merge skips the confirm pattern for that reason.

There are two entrances to one function, `doMerge`:

- The conflict. Here it also completes the rejected push.
- The ahead-notice. Here it does not complete a push. There may be nothing local to send, and an empty commit is noise.

**Pinned by:** group 34. Mutant confirmed red: a merge that stops disarming the other armed confirms.

## See also

- `stale-push-conflict-pull-two-tap` — the confirm pattern this control skips.
- `sha-accepted-only-after-apply` — the rule merge still depends on.
- `merge-later-change-wins` — the rule that picks which removal a merge applies.
- `milestones-taken-before-risk` — the saved version that restores a wrong un-check.
