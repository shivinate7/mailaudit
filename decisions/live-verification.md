# What has run against real GitHub or a real device

This file draws the line between proven and unproven. It lists what has run against the live GitHub API and a real device, and it names what has not. Read it before you claim a path is safe, and keep the split exactly as the source draws it.

## The GitHub backup one-time setup, and its own verification steps

```
### The GitHub backup (one-time setup)

Target is `shivinate7/mailaudit-data` — branch **`data`**, file `ledger.json`
for the ledger; branch **`main`**, directory `photos/` for the photos. Two
constant objects at the top of the `window.remote` block in `entry.jsx`.

**`mailaudit` itself is PUBLIC and holds no data.** That is the arrangement this
setup exists to produce, and it is what makes Actions and Pages free. The
separation, measured anonymously after the move: the Pages site answers **200**,
while `api.github.com/repos/shivinate7/mailaudit-data` and
`raw.githubusercontent.com/shivinate7/mailaudit-data/data/ledger.json` both
**404**. The ledger repo stays private for hygiene rather than secrecy — a
backup store does not belong in the repo that serves a public site — but the
consequence is real: **every device needs the key for everything**, because
GitHub hides a repo you cannot see behind a 404 rather than a 403.

A clone also needs a remote named `ledger` for the seed to build:
```

```bash
git remote add ledger https://github.com/shivinate7/mailaudit-data.git && git fetch ledger data
```

```
Without it the build is seedless, and `npm run check:seed` says so rather than
failing — but on a machine where the ref *does* resolve, a seedless committed
page is a hard failure, because that means the build dropped a seed it could
have made.
```

```
1. The `data` branch already exists in `mailaudit-data`, carrying the ledger's
   full history (130 commits at the time of the move, tip blob identical to the
   old repo's — blob shas are content-addressed, which is why no device needed
   re-keying). To recreate it from scratch:
```

```bash
   git switch --orphan data && git commit --allow-empty -m "data branch: ledger backups live here, never merge to main" && git push -u origin data && git switch main
```

```
2. Settings → Pages on **`mailaudit`** should read "Deploy from a branch:
   `main` / `(root)`". Nothing the app writes touches that repo any more, so a
   backup can no longer trigger a site rebuild by construction rather than by
   branch discipline.
   **The repo used to have no `.github/workflows` at all, and that absence was
   the guarantee that a ledger push triggers nothing.** There are two workflows
   now, so that guarantee rests on their filters instead — read them before
   adding a third. `test.yml` is `branches: [main]` plus a paths filter (nothing
   under `src/` or `test/` ever changes on `data`, which carries one file), and
   it deliberately does **not** trigger on `index.html`, because `npm run
   deploy` commits that separately and re-running the suite on the build output
   would double every deploy for no new information. It also checks the
   committed `index.html` still matches what the sources build — the one thing a
   local deploy can skip by accident — via `check:build`, which compares the
   code and ignores the seed for the reasons above. A second step runs
   `check:seed`, which decodes the seed the committed page actually carries and
   refuses anything outside `SEED_KEEP`: the two together ask whether the page
   is this repo's code, and then what its data publishes.
   `backup-watchdog.yml` is the check the app cannot do for itself: it reads the
   `data` branch's own history on a daily schedule and opens an issue if nothing
   has landed in four days. **Its alarm has been seen to fire** — dispatched
   once with `threshold=0`, which opened issue #4, since verified and closed. A
   green run proves only that it stayed quiet; that input exists so the other
   half can be proven too, and both sides of the comparison go through
   `fromJSON` because step outputs are strings and a string/number compare that
   silently evaluates false is exactly how an alarm ends up never going off. The phone's "Backed up" line is only as honest as
   the phone — a device whose token expired, whose storage is unreadable, or
   that simply never gets opened has no way to tell you it stopped. This one
   cannot be fooled by anything happening on a device.
3. The photos live on `mailaudit-data`'s **`main`**, in `photos/`. That branch
   must exist before any Contents PUT — a PUT into a repo with no commits is not
   a path worth relying on, so initialise with a README if recreating. Private is
   not optional: these are pictures of mailing labels with the delivery address
   on them.
4. Settings → Developer settings → Personal access tokens → **Fine-grained**.
   Name it per device (`mailday-iphone`) so one can be revoked alone. Only
   select repositories: **`mailaudit-data` only.** One repo, which is the point
   — the token used to span two and that was a listed open thread. `mailaudit`
   is public and the app never writes to it.
   Repository permissions: **Contents → Read and write** (Metadata → Read-only
   appears automatically and is required). Nothing else. **Fine-grained PATs cap at 366 days** — set a real expiry and a
   calendar reminder, because when it lapses the only symptom is a push that
   stops working.
5. In the app: Sync → paste → Save key → Push. Expect `Pushed ✓`, and check
   `mailaudit` gained no commit at all. With photos in the ledger, expect
   `mailaudit-data` to gain one commit per photo on `main` and the button to stay
   on `Pushing…` until they are done, roughly a second each — the ledger and the
   photos now share one repo's write budget and one `spaceWrites()` clock.

   Then the test worth actually doing: **pull onto a second device or origin**
   and confirm the thumbnails render. That is the one path where getting the
   order wrong is silent — the ledger would come back looking perfect with every
   photo id quietly stripped.

6. **Prove the merge before trusting auto-push**, because auto-push's conflict
   recovery is that same path running unattended. On A: check a card in, Push.
   On B *without pulling*: import a CSV that adds lines, Push — expect the
   conflict, then **Merge & push**. B must end holding A's check-in *and* its
   own new lines, and A's next Merge must agree. There is no toggle to turn on
   any more — sync is unconditional — so this proof is a prerequisite for
   running the app on two devices at all, not just for enabling something.

   `file://` and `http://localhost:4173` are two separate origins with two
   separate ledgers, so they stand in for two devices without needing a second
   phone — see "Running it locally".
```

## The coverage gap at the adapter seam

```
That gap has a cost worth naming, because it was paid: the `pushForce` sha bug
lived in `entry.jsx`, so **no app-level test could catch it, and none can catch
its return.** Restoring the bad ordering leaves the suite green — verified. What
the suite pins instead is the *mock's* faithfulness (35.6–35.7), which is only
as good as the mock. When a rule matters and lives below this seam, the mock is
the test, so keep it honest: this one had mirrored the bug and disabled the only
failure that could expose it.
```

## What is still eye-only, and what a real browser has confirmed

```
Still only covered by eye, never by a test: anything that needs a real device —
the camera capture, the canvas downscale, iOS keyboard behaviour, and whether
iOS actually fires `visibilitychange` when a home-screen app is resumed (the
suite dispatches the event itself, so it pins the reaction and not the trigger). Layout at
375px is no longer eyeball-only: it was measured in a real 375px viewport
(overflow 0, thirds 114px each, seal 36px, 0.00px row displacement when the
running head pins, and a package card constant at 347.09px with 0.00px row
displacement across a whole check-in), though those numbers are not asserted in
CI.

The GitHub adapter was also exercised by hand in a real browser against the
built `index.html`: `window.remote` present, a keyless push reporting `no-key`,
a bad-shaped key rejected before any request, a saved key landing in
`mailday-remote:v1` and **not** in the ledger blob, with `window.storage.list()`
still returning only `["mailday:v1"]`, and `resetAll` clearing the ledger while
leaving the token.

One real request *has* gone to the live API, from the deployed Pages origin: a
keyless `pull()` against the empty `data` branch returned 404 → `missing`. That
is worth more than it looks — it proves CORS works from `shivinate7.github.io`,
that the branch resolves (a missing *branch* answers "No commit found for the
ref", a missing *file* answers "Not Found"), and that `classifyStatus` maps the
real response. Since then the `data` branch has taken **real authenticated
pushes** (`git log origin/data` shows them), so that gap is closed for the
ledger. Photo sync has had its read paths verified live and keylessly — the raw
media type returns bytes with `access-control-allow-origin: *`, a directory
listing returns `{name,type,size,sha}`, a missing directory returns 404 "Not
Found" (so `missing`, distinct from `no-branch`), and a keyless request to the
private photo repo (then `mailaudit-photos`, now `mailaudit-data`) 404s on both
the tree and the repo, which is the `no-access` path. Re-measured after the
move against `mailaudit-data`: repo API and raw ledger URL both 404 keyless,
while the Pages site still answers 200.

**The ledger repo's own private path is now verified live too** — the first
real-GitHub confirmation of anything on the read side since the repo was closed.
From the deployed Pages origin with no key, `pull()`, `listVersions()` and
`peek()` all return `no-access`, and `peek()` answers `{known: false}` rather
than "nobody is ahead", which is the reading that would otherwise let a keyless
device push straight over the one that can see. Measured at the same time: the
site still serves **200** to an anonymous request while
`raw.githubusercontent.com/.../data/ledger.json` and the repo API both **404**.
That is the whole point of the private/Pro arrangement, confirmed rather than
assumed. So `peek()` comes off the unverified list.

**Still never run against real GitHub: an authenticated photo PUT, a photo pull
that returns bytes, and a ledger conflict.**

That same session is what surfaced the group-28 bug — Pull unreachable on an
empty ledger. Worth remembering as a method: the suite was all green and the
feature was still broken in its single most important scenario, because every
test booted a ledger that already had data in it.

Worth moving to vitest + testing-library if this grows much further; the
hand-rolled `ok`/`eq` and the top-to-bottom script are fine at this size but
give no isolation between groups.
```

## See also

- `peek-is-three-valued`, the design confirmed live in this file.
- `pull-needs-a-key-too`, why every device needs a token for reads too.
- `pushforce-records-sha-only-after-write`, the bug this file's coverage gap describes.
- `backup-watchdog-catches-silent-failure`, the alarm mentioned in the setup steps.
