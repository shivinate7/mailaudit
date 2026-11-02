---
paths:
  - "docs/debts/**"
---

# Known gaps

Holds the known gaps outside the native app.

## Debts

One known gap per file under `docs/debts/`. Each carries a Status line and a Decision line that names its record or says none.

- `seed-in-public-history` — The seed stays in git history, deferred by the owner.
- `claim-11-fixed-edge-taps` — Claim 11 skips taps at a fixed control's edge.
- `chip-gap-tolerance-at-12px` — The chip-gap tolerance needs a 12px re-measure.
- `claim-9-fractional-box-edges` — Claim 9 can pass a box just under 44px.
- `tally-card-moves-at-320px` — The Tally card moves 14px at 320px.
- `key-re-accepts-token-shape` — The key check accepts a GitHub token's shape.
- `tests-33-35-40-45-cannot-fail` — Tests 33.35, 33.40 and 33.45 cannot fail.
- `received-at-size-unmeasured` — The size of receivedAt is unmeasured.
- `suite-hang-cause-unmeasured` — The 13-minute hang after the suite summary is unexplained.
- `card-action-row-unmeasured` — The action row at its tallest state is unmeasured.
- `card-eleven-px-step-unmeasured` — The 11px row step at 320px is unmeasured.
- `reset-leaves-sync-unpinned` — No test pins that an armed Reset leaves Sync open.
- `reset-all-keeps-token-unpinned` — No test pins that resetAll keeps the GitHub token.
- `token-state-and-bundle-unpinned` — Nothing pins the token's React-state or bundle guarantees.
- `reimport-received-unpinned` — Nothing pins that received survives a re-import.
- `ruled-head-heights-unremeasured` — The ruled head heights have not been re-measured.
- `photo-put-unrun-on-github` — The GitHub photo PUT and pull have never run.
- `tally-audit-contrast-flags` — The Tally audit flags contrast and inaccessible text that the token pairs clear.
- `web-armed-restore-moves` — The web armed Restore moves under the pointer.
- `reset-vs-worker-copy-unmeasured` — A Reset's effect on the Worker's copy is unmeasured.
- `notes` — One-line findings not likely in normal work.
- `recent-log-unbuilt` — The recent-actions log is not built.
- `recent-log-unmeasured` — The recent-actions log has three measurements to take.
- `armed-reset-mistap-unmeasured` — A mis-tap beside the armed Reset box is unmeasured.
- `orphaned-reach-unpinned` — Re-import, Backup and Reset on Orphaned have no test.
- `panels-overlay-unbuilt` — Disclosure panels still push the list.
- `panel-paper-fill-unbuilt` — Overlay panels carry no paper fill.
- `order-id-visible-unbuilt` — The Tally order id has no narrow-width rule.
- `tcgplayer-link-opens-history-list` — The TCGplayer link may not search by order id.
- `header-gestures-unmeasured` — Header gestures are unmeasured.
- `ios-touch-adjust-unmeasured` — iOS touch adjustment near the order id link is unmeasured.
- `discard-keeps-draft` — Discard does not end a composer draft.
- `type-floor-unbuilt` — Some labels are below the 10px floor.
- `universal-link-unbuilt` — The universal-link key fallback is not built.
- `web-photos-have-no-backup` — No Worker snapshot covers a web photo.
- `web-reads-no-worker-snapshots` — Web History reads no Worker snapshot.
- `cloudflare-access-login-untested` — A Cloudflare Access login in an iOS home-screen app is untested.
- `backup-unwatched` — No alarm watches the backup after the watchdog is off.
- `worker-two-device-proof-unrun` — The two-device merge is not proven against the Worker.
- `sweep-settle-masks-30-13-stall` — The SWEEP_WAIT settle after 19.6 hides a stall at 30.13.
- `photoget-throw-counts-as-kill` — A throw counts as a kill in the photoGet test.
- `lost-photo-clock-is-envelope-age` — The lost-photo clock runs from envelope age.
- `lost-tile-waits-for-first-post` — The lost tile waits for the first POST.
- `failed-photo-download-no-retry` — A failed photo download is not retried.
- `half-open-socket-has-no-ping` — A half-open socket has no ping.
- `hidden-tab-apply-delay-unmeasured` — The apply delay on a hidden tab is unmeasured.
- `sync-latency-after-fix-unmeasured` — The sync delay with the press guard is unmeasured.
- `screens-45px-width-flake` — The screens check once measured every target 45px wide.
- `screens-touch-context-flake` — The nightly screens check once failed the touch context.
- `tracking-checker-unbuilt` — A future checker that passively checks tracking numbers. It blocks nothing.
- `orders-job-unbuilt` — The Worker orders cron, its key test and its status screen are unbuilt.
- `claim-17a-ci-red-unexplained` — Claim 17a failed twice on CI, and why only those runs is unknown.
