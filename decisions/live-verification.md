# What has run against real GitHub, a real device or a Worker probe

This file draws the line between proven and unproven. It lists what has run against the live GitHub API, a real device and a Worker probe. It also names what has not. Read it before you claim a path is safe. Keep the split exactly as this file draws it.

**Holds while:** the repo `mailaudit-data` is private. An anonymous request gets 404 for it, gets 200 for `mailaudit`, and the Pages site answers 200. Checked 2026-10-10.

## The GitHub backup one-time setup

The target is `shivinate7/mailaudit-data`. The ledger lives on branch **`data`**, in the file `ledger.json`. The photos live on branch **`main`**, in the directory `photos/`. Two constant objects sit at the top of the `window.remote` block in `entry.jsx`.

**`mailaudit` is PUBLIC and holds no data.** This arrangement is what the setup exists to produce. It is also what makes Actions and Pages free. Measured anonymously after the move, the Pages site answers **200**. But `api.github.com/repos/shivinate7/mailaudit-data` and `raw.githubusercontent.com/shivinate7/mailaudit-data/data/ledger.json` both answer **404**. The ledger repo stays private for hygiene, not secrecy. A backup store does not belong in the repo that serves a public site. The consequence is real, though. **Every device needs the key for everything.** GitHub hides a repo that you cannot see behind a 404, not a 403.

A clone also needs a remote named `ledger` for the seed to build:

```bash
git remote add ledger https://github.com/shivinate7/mailaudit-data.git && git fetch ledger data
```

Without that remote, the build is seedless. `npm run check:seed` reports this, but it does not fail. On a machine where the ref *does* resolve, though, a seedless committed page is a hard failure. That means that the build dropped a seed it could have made.

The setup steps are:

1. The `data` branch already exists in `mailaudit-data`. It carries the ledger's full history: 130 commits at the time of the move. Its tip blob is identical to the old repo's. Blob shas are content-addressed. So no device needed re-keying. To recreate the branch from scratch, run:

   ```bash
   git switch --orphan data && git commit --allow-empty -m "data branch: ledger backups live here, never merge to main" && git push -u origin data && git switch main
   ```

2. In Settings → Pages on **`mailaudit`**, the source should read "Deploy from a branch: `main` / `(root)`". Nothing the app writes touches that repo any more. So a backup can no longer trigger a site rebuild. That is by construction, not by branch discipline.

   **The repo used to have no `.github/workflows` at all. That absence was the guarantee that a ledger push triggers nothing.** There are two workflows now. So that guarantee rests on their filters instead. Read the filters before you add a third workflow. `test.yml` has `branches: [main]` plus a paths filter. Nothing under `src/` or `test/` ever changes on `data`, which carries one file. It deliberately does **not** trigger on `index.html`. `npm run deploy` commits that file separately. Re-running the suite on the build output would double every deploy for no new information. `test.yml` also checks that the committed `index.html` still matches what the sources build. A local deploy can skip that check by accident. The check runs through `check:build`. It compares the code and ignores the seed, for the reasons above. A second step runs `check:seed`. That step decodes the seed the committed page carries. It refuses anything outside `SEED_KEEP`. The two steps together ask two questions. Is the page this repo's code? And what does its data publish?

   `backup-watchdog.yml` is the check the app cannot do for itself. It reads the `data` branch's own history on a daily schedule. If nothing has landed in four days, it opens an issue. **Its alarm has been seen to fire.** It was dispatched once with `threshold=0`. That opened issue #4, which was verified and closed. A green run proves only that the watchdog stayed quiet. The `threshold` input exists so the other half can be proven too. Both sides of the comparison call `fromJSON` first. Step outputs are strings. A string/number compare that silently evaluates false is exactly how an alarm ends up never going off. The phone's "Backed up" line is only as honest as the phone. A device with an expired token, with unreadable storage, or that never gets opened cannot tell you it stopped. This watchdog cannot be fooled by anything that happens on a device.

3. The photos live on the **`main`** branch of `mailaudit-data`, in `photos/`. That branch must exist before any Contents PUT. A PUT into a repo with no commits is not a path worth relying on. If you recreate the branch, initialise it with a README. Private is not optional. These are pictures of mailing labels with the delivery address on them.

4. Create a fine-grained token at Settings → Developer settings → Personal access tokens → **Fine-grained**. Name it per device, for example `mailday-iphone`. Then one device's token can be revoked alone. Select repositories: **`mailaudit-data` only.** One repo is the point. The token used to span two repositories, and that was a listed open thread. `mailaudit` is public, and the app never writes to it.

   Set repository permissions to **Contents → Read and write**. Metadata → Read-only appears automatically, and it is required. Grant nothing else. **Fine-grained PATs cap at 366 days.** Set a real expiry and a calendar reminder. When the token lapses, the only symptom is a push that stops working.

5. No screen path is left for this step. The Push control left the UI on 2026-10-12, and the mirror push runs on its own. Check that `mailaudit` gained no commit at all. With photos in the ledger, expect `mailaudit-data` to gain one commit per photo on `main`. The button stays on `Pushing…` until they are done. Each takes roughly a second. The ledger and the photos share one repo's write budget and one `spaceWrites()` clock.

   Then run the test that matters most. A second device or origin must pull the ledger (the automatic merge does it on a fresh session), and confirm the thumbnails render. That is the one path where a wrong order fails silently. The ledger would come back looking perfect, with every photo id quietly stripped.

6. Prove the merge before trusting auto-push. Auto-push's conflict recovery is that same path, running unattended. On A, check a card in, then Push. On B, without pulling, import a CSV that adds lines, then Push. Expect the conflict. Then the automatic merge runs on B. No control is left. B must end holding A's check-in *and* its own new lines. A's next merge must agree. Sync is unconditional now. There is no toggle to enable. So this proof is a prerequisite for running the app on two devices at all. It is not only a prerequisite for enabling a feature.

   `file://` and `http://localhost:4173` are two separate origins with two separate ledgers. So they can act as two devices, without a second phone. See "Running it locally".

## The coverage gap at the adapter seam

The gap has a cost, and the cost was paid. The `pushForce` sha bug lived in `entry.jsx`. So **no app-level test could catch it, and none can catch its return.** Restoring the bad ordering leaves the suite green. This was verified. What the suite pins instead is the *mock's* faithfulness (35.6–35.7). That is only as good as the mock. When a rule matters and lives below this seam, the mock is the test. So keep the mock honest. This mock had mirrored the bug. It had also disabled the only failure that could expose it.

## What is still eye-only, and what a real browser has confirmed

Still only covered by eye, never by a test: anything that needs a real device. That includes the camera capture, the canvas downscale, iOS keyboard behaviour, and whether iOS fires `visibilitychange` when a home-screen app is resumed. The suite dispatches that event itself. So it pins the reaction, not the trigger.

Layout at 375px is no longer eyeball-only. It was measured in a real 375px viewport. The measured values were: overflow 0, thirds 114px each, seal 36px, and 0.00px row displacement when the running head pins. A package card stayed constant at 347.09px, with 0.00px row displacement across a whole check-in. Both figures were taken at the 44px action row reservation, before `BULK_ROW_H` became 46, and have not been re-measured. `npm run check:screens` asserts two of these figures in CI: no sideways overflow at 375px and 760px, and no row moving after a first check-in at 375px. The rest are not asserted.

The GitHub adapter was also exercised by hand in a real browser, against the built `index.html`. The checks were these. `window.remote` is present. A keyless push reports `no-key`. A bad-shaped key is rejected before any request. A saved key lands in `mailday-remote:v1`, and **not** in the ledger blob. `window.storage.list()` still returns only `["mailday:v1"]`. `resetAll` clears the ledger and leaves the token.

One real request *has* gone to the live API, from the deployed Pages origin. A keyless `pull()` against the empty `data` branch returned 404, which maps to `missing`. That is worth more than it looks. It proves CORS works from `shivinate7.github.io`. It proves that the branch resolves. A missing *branch* answers "No commit found for the ref", and a missing *file* answers "Not Found". It also proves that `classifyStatus` maps the real response. Since then, the `data` branch has taken **real authenticated pushes**. `git log origin/data` shows them. So that gap is closed for the ledger.

Photo sync has had its read paths verified live and without a key. The raw media type returns bytes with `access-control-allow-origin: *`. A directory listing returns `{name,type,size,sha}`. A missing directory returns 404 "Not Found". That gives `missing`, which is distinct from `no-branch`. A keyless request to the private photo repo 404s on both the tree and the repo. The repo was `mailaudit-photos` then, and it is `mailaudit-data` now. That response is the `no-access` path. After the move, the repo API and the raw ledger URL both 404 keyless. The Pages site still answers 200.

**The ledger repo's own private path is now verified live too.** This is the first real-GitHub confirmation of anything on the read side since the repo was closed. From the deployed Pages origin with no key, `pull()`, `listVersions()`, and `peek()` all return `no-access`. `peek()` answers `{known: false}`, not "nobody is ahead". That reading matters. Otherwise a keyless device could push straight over the one that can see. Measured at the same time, the site still serves **200** to an anonymous request. But `raw.githubusercontent.com/.../data/ledger.json` and the repo API both **404**. That is the whole point of the private/Pro arrangement, and it is now confirmed rather than assumed. So `peek()` comes off the unverified list.

**Still never run against real GitHub: an authenticated photo PUT, a photo pull that returns bytes, and a ledger conflict.**

That same session is what surfaced the group-28 bug: Pull was unreachable on an empty ledger. Worth remembering as a method: the suite was all green. The feature was still broken in its single most important scenario, because every test booted a ledger that already had data in it.

It is worth moving to vitest and testing-library if this grows much further. The hand-rolled `ok`/`eq` helpers and the top-to-bottom script are fine at this size. But they give no isolation between groups.

## Worker probes still needed

A probe deploy sets its own Durable Object name with the STORE_NAME variable, so a probe never touches the real store. Each lane names its probe below. A probe name is never ledger-v3, the real store, or ledger-v2, which holds an earlier probe's data.

Owner ruling, 2026-10-12: a probe deploy of the Worker is granted, under its own name and store. A live deploy needs the owner's word again.

- **W2a photo route, probe-w2a.** Still to run on Cloudflare: the photos table is created through the Durable Object's SQLite API. A POST then a GET return the same bytes, with the type from the name. A second POST keeps the first bytes. A photo over 1.9 MB gets 413.
- **W3a daily snapshots and /health, probe-w3a.** Still to run on Cloudflare: the snapshots table is created. The first changing write of a UTC day stores one snapshot, and a later one stores none. GET /health with no key returns only the last write time. The list and get snapshot routes answer with a device key.
- **W2b, W3b, W3c, W3d and W3e.** No probe is named. Each waits for its brief.

No test runs the Durable Object adapter. So the SQLite calls in worker/index.mjs are unproven until a probe runs.

## See also

- `peek-is-three-valued`, the design confirmed live in this file.
- `pull-needs-a-key-too`, why every device needs a token for reads too.
- `pushforce-sha-only-after-write`, the bug this file's coverage gap describes.
- `watchdog-catches-silent-failure`, the alarm mentioned in the setup steps.
