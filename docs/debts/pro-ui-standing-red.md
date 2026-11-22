# The pro-ui shards fail on every run, and the cause is unmeasured

**What.** The pro-ui shards of the duo-ui workflow fail on every run where they ran, back to 2026-11-20. Nine tests fail on every run:

- `MastheadBackupUITests.testAccessibilityAuditMastheadOnTally`
- `PackageBulkUITests.testAccessibilityAuditPackagesWithBothBulkControls`
- `PackageBulkUITests.testAccessibilityAuditPackagesWithTheUndo`
- `PackageBulkUITests.testAStampSaveOrRemoveMovesNeitherTheSlotNorTheBulkRow`
- `PackageStampUITests.testAccessibilityAuditPackagesWithAStampedCard`
- `PackageStampUITests.testAccessibilityAuditStampEditor`
- `PackageStampUITests.testAccessibilityAuditStampRemoveArmed`
- `PackageStampUITests.testNothingMovesWhenAStampIsSavedOrRemoved`
- `PackagesShellUITests.testAccessibilityAuditTallyScreen`

**Evidence.** CI runs 45025120326 and 45025191429 (pull request 389), 45025121981 and 45025202524 (pull request 388), and 44981596640 (pull request 387).

**The cause is unmeasured.** The iOS 27.2 runtime is a guess, not a measurement.

**No main baseline.** The duo-ui workflow runs on pull requests only, so main never runs these shards. Nothing on main shows whether they pass there.

**Harm.** Native pull requests cannot show a green pro-ui shard.

**Ruling.** Owner ruling 122 c (triage, 2026-11-22 12:29 CST): the `pro-ui` label comes off pull request 388, which is done. The owner said not to dig into the cause now. This debt is the known gap until a cause is found.

**Related debt:** `tally-audit-contrast-flags`. Two of the nine tests above, the masthead audit on Tally and the Tally screen audit, also appear in that debt.

**Status:** open. The pro-ui shards stay red under this debt. The owner said not to dig in now.

**Decision:** `audit-skips-measured-flags`.
