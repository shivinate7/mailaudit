# The stored sha waits for the apply

The app stores the remote sha only after it applies the pulled bytes. Storing the sha is this device's claim to hold the remote's bytes. The claim must be true when it is made, so the sha is stored last.

**Holds while:** `pull()` in `src/entry.jsx` returns the sha without saving it. `src/app.jsx` calls `acceptPull` only after `applyBackup`.

`pull()` returns the sha. `acceptPull()` stores it. The app calls `acceptPull()` after `applyBackup` has landed. This is the rule the whole conflict scheme rests on.

Storing the sha on arrival once let a failed apply leave a current sha over stale data. A failed apply could be a rejected payload, a merge that throws, or a generation guard that bails. The next push was accepted with no conflict, and it destroyed the other device's work. Auto-push makes this unattended, within 90 seconds.

The incident happened on the first day of real two-device use. It cost a check-in. `git log origin/data` has the receipt. Commit `87793de` is byte-identical to `38017ae`, six days older. It landed on top of a newer ledger with no conflict. Diff the blobs, not just the counts. Identical blobs are how you tell which device wrote what.

Failing to accept leaves the device merely behind. The next push then conflicts loudly. That is the direction this must fail in. Group 35 pins it.

**Pinned by:** group 35. Its three mutants were each confirmed red. The first is the adapter advancing the sha inside `pull()` again. The second is `doMerge` never accepting it. The third is `doPull` never accepting it. Tests 35.4, 35.5 and 40.6 also kill `acceptPull` dropped from `doMerge`. Test 26.16 kills a pull that does not refresh the sha.

When a sync bug is reported, check what the sha did. Do not check only what the merge computed. A pull that did not land must not license a push. Group 35 exists to pin that rule.

## See also

- `pushforce-sha-only-after-write` — the same rule reached through the force door.
- `stale-push-conflict-pull-two-tap` — the conflict this rule exists to raise honestly.
- `a-restore-is-not-local` — an operation that deliberately does not touch this sha.
