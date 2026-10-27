# What has run against real GitHub, a real device or a Worker probe

This file draws the line between proven and unproven. It lists what has run against the live GitHub API, a real device and a Worker probe. It also names what has not. Read it before you claim a path is safe. Keep the split exactly as this file draws it.

**Holds while:** the repo `mailaudit-data` is private. An anonymous request gets 404 for it, gets 200 for `mailaudit`, and the Pages site answers 200. Checked 2026-10-10. Not re-checked in this lane: no live call was made.

Kind: build

Plan: docs/decisions/live-verification.md#worker-probes-still-needed (worker)

## The GitHub backup, retired by the switch

Web no longer writes to GitHub, and no device holds a GitHub token. The target is `shivinate7/mailaudit-data`, a private repo. The ledger lives on branch **`data`**, in the file `ledger.json`, and that branch is frozen: no device writes it, and History still reads it. The photos sat on branch **`main`**, in the directory `photos/`, until the one-time copy ran on 2026-10-16 (see the last section). Two constant objects sit above the `window.remote` block in `entry.jsx`: `REMOTE` and `PHOTOS`.

**`mailaudit` is PUBLIC and holds no data.** It is also what makes Actions and Pages free. Measured anonymously after the move, the Pages site answers **200**. But `api.github.com/repos/shivinate7/mailaudit-data` and `raw.githubusercontent.com/shivinate7/mailaudit-data/data/ledger.json` both answer **404**. The ledger repo stays private for hygiene, not secrecy. A backup store does not belong in the repo that serves a public site. The consequence was real: **every device needed a GitHub token for everything.** GitHub hides a repo that you cannot see behind a 404, not a 403.

The public seed is removed, so a clone needs no `ledger` remote to build.

Still true on the GitHub side:

- The `data` branch carries the ledger's history, 130 commits at the time of the move. Its tip blob is identical to the old repo's. Blob shas are content-addressed, so no device needed re-keying.
- Pages on `mailaudit` is set to deploy from `main` `(root)`. Nothing the app writes touches that repo, so a backup cannot trigger a site rebuild. Not re-checked in this lane.

- `.github/workflows` holds one file, `test.yml`. The guarantee that a ledger push triggers nothing rests on its filters. `test.yml` has `branches: [main]` plus a paths filter. Nothing under `src/` or `test/` ever changes on `data`, which carries one file. It deliberately does **not** trigger on `index.html`, because `npm run deploy` commits that file separately. Re-running the suite on the build output would double every deploy for no new information. `test.yml` also checks that the committed `index.html` still matches what the sources build. A local deploy can skip that check by accident. The check runs through `check:build`, which compares the whole page with the build of `src/`. A second step runs `check:seed`, which refuses a seed tag, a packed data script or a ledger payload in the committed page. The two steps together ask two questions: is the page this repo's code, and does it publish any ledger data? Read the filters before you add a workflow.

- The backup watchdog is turned off (owner ruling 2026-10-14). It lived in the private repo. Its alarm was measured to fire once, on issue #4. No alarm watches the backup: see `backup-unwatched`.

- The photos sat on the **`main`** branch of `mailaudit-data`, in `photos/`, until the one-time copy ran on 2026-10-16. `scripts/copy-photos-to-worker.mjs` made that copy, and it is a dry run by default. Private is not optional: these are pictures of mailing labels with the delivery address on them.

- Devices held one fine-grained token each, scoped to `mailaudit-data` only. GitHub caps fine-grained tokens at 366 days. The web app no longer uses one.

- The Push control left the UI on 2026-10-12. The web app writes no commit to `mailaudit`. The adapter keeps `spaceWrites()`, a one-second write gap, until slice S3.
- A second device must pull the ledger and show its thumbnails. A merge keeps every photo id, so a blob that has not arrived shows as a blank thumbnail until a sync brings it (`pull-fetches-photos-before-apply`).

- The two-device merge proof runs on the Worker now, and it is unrun: see `worker-two-device-proof-unrun`. Sync has no toggle, so that proof is a prerequisite for running the app on two devices at all.

`file://` and `http://localhost:4173` are two separate origins with two separate ledgers, so they can act as two devices without a second phone. See `file-protocol-works-locally`.

## The coverage gap at the adapter seam

The gap has a cost, and the cost was paid. The `pushForce` sha bug lived in `entry.jsx`. So **no app-level test could catch it, and none can catch its return.** Restoring the bad ordering leaves the suite green. This was verified. What the suite pins instead is the *mock's* faithfulness (35.6–35.7). That is only as good as the mock. When a rule matters and lives below this seam, the mock is the test. So keep the mock honest. This mock had mirrored the bug. It had also disabled the only failure that could expose it.

## What is still eye-only, and what a real browser has confirmed

Still only covered by eye, never by a test: anything that needs a real device. That includes the camera capture, the canvas downscale, iOS keyboard behaviour, and whether iOS fires `visibilitychange` when a home-screen app is resumed. The suite dispatches that event itself. So it pins the reaction, not the trigger.

Layout at 375px is no longer eyeball-only. It was measured in a real 375px viewport. The measured values were: overflow 0, thirds 114px each, seal 36px, and 0.00px row displacement when the running head pins. A package card stayed constant at 347.09px, with 0.00px row displacement across a whole check-in. Both figures were taken at the 44px action row reservation, before `BULK_ROW_H` became 46, and have not been re-measured. `npm run check:screens` asserts two of these figures in CI: no sideways overflow at 375px and 760px, and no row moving after a first check-in at 375px. The rest are not asserted.

The GitHub adapter was also exercised by hand in a real browser, against the built `index.html`. The checks were these. `window.remote` is present. A keyless push reports `no-key`. A bad-shaped key is rejected before any request. A saved key lands in `mailday-remote:v1`, and **not** in the ledger blob. `window.storage.list()` still returns only `["mailday:v1"]`. `resetAll` clears the ledger and leaves the token.

One real request *has* gone to the live API, from the deployed Pages origin. A keyless `pull()` against the empty `data` branch returned 404, which maps to `missing`. That is worth more than it looks. It proves CORS works from `shivinate7.github.io`. It proves that the branch resolves. A missing *branch* answers "No commit found for the ref", and a missing *file* answers "Not Found". It also proves that `classifyStatus` maps the real response. Since then, the `data` branch has taken **real authenticated pushes**. `git log origin/data` shows them. So that gap is closed for the ledger.

Photo sync has had its read paths verified live and without a key. The raw media type returns bytes with `access-control-allow-origin: *`. A directory listing returns `{name,type,size,sha}`. A missing directory returns 404 "Not Found". That gives `missing`, which is distinct from `no-branch`. A keyless request to the private photo repo 404s on both the tree and the repo. The repo was `mailaudit-photos` then, and it is `mailaudit-data` now. That response is the `no-access` path. After the move, the repo API and the raw ledger URL both 404 keyless. The Pages site still answers 200.

**The ledger repo's own private path is now verified live too.** This is the first real-GitHub confirmation of anything on the read side since the repo was closed. From the deployed Pages origin with no key, `pull()`, `listVersions()`, and `peek()` all return `no-access`. `peek()` answers `{known: false}`, not "nobody is ahead". That reading matters. Otherwise a keyless device could push straight over the one that can see. Measured at the same time, the site still serves **200** to an anonymous request. But `raw.githubusercontent.com/.../data/ledger.json` and the repo API both **404**. That is the whole point of the private/Pro arrangement, and it is now confirmed rather than assumed. So `peek()` comes off the unverified list.

**Still never run against real GitHub:** `pushPhoto` and `pullPhoto` on `window.remote` (`src/entry.jsx`), the GitHub photo PUT and pull. No web code calls them. `listPhotos`, `pushPhoto` and `pullPhoto` have no caller in `src/`. Photos use `window.sync`, whose `photoList`, `photoGet` and `photoPut` talk to the Worker. The one-time copy script did read the GitHub photo branch live on 2026-10-16. That read is not `pullPhoto`, so it does not close this gap. Debt: `photo-put-unrun-on-github`. And a ledger conflict. The conflict now runs on the Worker, and no live run of it is recorded (debt `worker-two-device-proof-unrun`).

That same session is what surfaced the group-28 bug: Pull was unreachable on an empty ledger. Worth remembering as a method: the suite was all green. The feature was still broken in its single most important scenario, because every test booted a ledger that already had data in it.

It is worth moving to vitest and testing-library if this grows much further. The hand-rolled `ok`/`eq` helpers and the top-to-bottom script are fine at this size. But they give no isolation between groups.

## Worker probes still needed

A probe deploy sets its own Durable Object name with the STORE_NAME variable, so a probe never touches the real store. Each lane names its probe below. A probe name is never ledger-v3, the real store, or ledger-v2, which holds an earlier probe's data.

Owner ruling, 2026-10-12: a probe deploy of the Worker is granted, under its own name and store. A live deploy needs the owner's word again.

- **W2a photo route, probe-w2a.** Ran on the probe Worker on 2026-10-12 and passed. The photos table is created through the Durable Object's SQLite API. A POST then a GET return the same bytes, with the type from the name. A second POST keeps the first bytes. A photo over 1.9 MB gets 413.
- **W3a daily snapshots and /health, probe-w3a.** Ran on the probe Worker on 2026-10-12 and passed. The snapshots table is created. The first changing write of a UTC day stores one snapshot, and a later one stores none. GET /health with no key returns only the last write time. The list and get snapshot routes answer with a device key.
- **W2b, W3b, W3c, W3d and W3e.** No probe is named. Each waits for its brief. The restore stamp that W2b and W3b waited on is built in the switch lane (`restampRestore`).

The owner then granted the live deploy ("Deploy live"). See "Worker probe results" and "Live deploy" below.

No test runs the Durable Object adapter. So the SQLite calls in worker/index.mjs are unproven until a probe runs.

## See also

- `peek-is-three-valued`, the design confirmed live in this file.
- `pull-needs-a-key-too`, why every device needs a token for reads too.
- `pushforce-sha-only-after-write`, the bug this file's coverage gap describes.
- `watchdog-catches-silent-failure`, the alarm mentioned in the setup steps.

## Worker probe results

Run on 2026-10-12 with wrangler 4.149.0, against `https://manifest-probe.shivamsemwal01.workers.dev`. The Worker name is `manifest-probe`, the store is `probe-live6`, and the key is a fresh random key whose hash is the Worker secret. The live Worker `manifestnumberone` was not touched. The probe Worker stays deployed. All checks PASS.

- POST /ledger to the empty store: 200, rev 1. A changed ledger: 200, rev 2.
- GET /snapshots: 200, one entry for the day, no ledger body. After the first write, the list is empty. The snapshot is taken at the first changing write.
- GET /snapshots/<day>: 200, the ledger as it was before the second write, rev 1.
- GET /health with no key: 200, only `at`.
- POST /photos/pho-probe1.jpg: 200. GET /photos: 200, the name carries `.jpg`. GET of the photo: 200, `image/jpeg`, same bytes. A second POST with other bytes: 200, and the first bytes stay.
- POST of 1,900,001 bytes: 413. DELETE /photos/x: 405.
- /ledger, /snapshots, /photos and a photo GET with no key: 401.

Two traps found while probing. Both are about a probe deploy, not about the code.

- A secret change does not reach a Durable Object that is already running. The key got 401 until a deploy followed the secret change. Set the secret, then deploy.
- A deploy that changes STORE_NAME serves both names for a short while. Ledger and photo writes then land in different stores and read back as missing. Deploy the same STORE_NAME twice before the probe, so every live version agrees.

## Live deploy

Run on 2026-10-12 at 15:39 UTC from main at 2cecd18, with wrangler 4.149.0. The new version is 85a7a137. The rollback version is 1f09b61e.

- Before and after, the ledger read rev 3, 908 items and 4 envelopes.
- The Durable Object ran the old code for about 3 minutes after the deploy, then the new code. Measured: /health gave 401 until 15:40:31, then 200 by 15:43:09. Check again after a few minutes before calling a deploy failed.
- After: GET /health with no key gave 200 with only `at`. GET /snapshots gave `[]`. GET /photos gave `{"ids":[]}`. /ledger and /photos with no key gave 401.

## Live deploy of the shape check and kept copies

Run on 2026-10-13 at about 01:10 UTC, from main at e1ea8ac, with wrangler 4.149.0, on the owner's word ("Deploy live"). The new version is fdea6a6b. The rollback version is 85a7a137.

- Before, a read-only probe ran `salvageLedger` on the live ledger: rev 3, 908 items, 4 envelopes, 0 damaged.
- The new code answered at 01:13:52 UTC, a few minutes after the deploy.
- After: GET /kept with the key gave `[]`. /kept with no key gave 401. A POST with `received: null` gave 400 `bad ledger`, and the ledger stayed at rev 3, 908 items, 4 envelopes, 0 damaged. GET /health gave `{"at":null}`.

## Live deploy of 2026-10-14

Run from main `7729d31` at 21:15 CDT on 2026-10-14 (02:15 UTC on 2026-10-15), on the owner's word of 21:12 CDT. The new version is `65bc7095-2142-4569-a699-47d0ce7a5c0d`. The rollback version is `fdea6a6b`.

- The probe read the live store: GET /kept with the key gave 200, and with no key gave 401. GET /ledger read rev 3, 908 items and 4 envelopes.
- The deploy includes the merge fix from PR #96, which keeps unknown top-level keys in a merge. The probe did not exercise that path, so the fix is unmeasured on live data.
- Recorded from the owner's word. This lane made no live call, so the probe is not re-run here.

## Switch and photo copy, 2026-10-16

Recorded from the orchestrator's report. This lane made no live call.

- PR #100 merged as `a214855`, committed at 03:02:14 CDT. The web app syncs through Cloudflare only. Photos are on the Worker, the public seed is removed, and the restore rules are in. That merge changed no file under `worker/`, so the Worker was not redeployed. The live Worker stays at version `65bc7095`.
- Between 03:02 and 03:08 CDT (exact minutes unmeasured) the one-time photo copy ran as a dry run, then with `--apply`. It copied 8 photos and failed 0. A second dry run read 0 to copy and 8 on the Worker. The run used a scratch copy of the script, because the script accepts only `github_pat_` and `ghp_` tokens. The `gh` login token is a `gho_` OAuth token, and it reads the photo repo.
- Between 03:02 and 03:08 CDT the backup watchdog workflow (id `356631798`) in `shivinate7/mailaudit-data` was disabled with `gh workflow disable`. The owner ruled on 2026-10-14 at 21:55 CDT that it is turned off. See `backup-unwatched`.
- Between 03:02 and 03:08 CDT a probe read the live Worker. `/kept` gave 401 without the key and 200 with it. `/photos` listed 8 photos. `/ledger` read rev 4, 908 items and 4 envelopes.
