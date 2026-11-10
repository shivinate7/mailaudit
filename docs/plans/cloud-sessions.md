# Cloud sessions for mailaudit

**Status:** open, research only. Lane `cloud-feasibility`, 2026-11-08, from main 4d56eef. The owner asked on 2026-11-08 at 16:45 CST to move this repo to the cloud. Nothing is measured on a cloud VM yet. Nothing here is built or configured. The setup script draft is `docs/plans/cloud-setup.sh`.

Can mailaudit's work run in Claude Code cloud sessions (claude.ai/code, an Anthropic-hosted Ubuntu 24.04 VM) instead of on the owner's Mac?

**Verdict: mostly cloud, with a named Mac remainder.** All web, records, Worker-code and CI work runs in the cloud. Anything that needs a Mac stays on the Mac or moves to a hosted macOS runner. Examples: an Xcode build, a simulator, the Duo, a phone install, TestFlight, a native screenshot and the Cochin font. The Mac remainder is the phone install, the Duo UI tests and the sim-gate grants. TestFlight has a hosted-runner route, the `testflight` workflow, which has uploaded a build. Native screenshots have one too, unbuilt.

## How close (2026-11-08)

- Web, records, Worker code and the orders extension are close: one owner setup (see Owner acts below) plus one measuring session.
- Native work is not close. `swift test` cannot run on Linux, because `RulesEngine` imports JavaScriptCore. The app build, simulators, the Duo, phone installs and TestFlight need macOS. Home measured a macOS CI route for the Duo (home PR 588). Run 42522664456, on 2026-11-08, made 30 shots: 20 on the Duo, folded and book, and 10 on the 18 Pro.
- `milestone.yml` has no green run yet. It waits on the hosted Xcode 27 image (record `app-build-waits-xcode-27`). No CI job shoots native screenshots.
- The current goal is the native restyle, with a screenshot after each step. Each step needs simulator runs.

## Sources

- Cloud docs, read 2026-11-08: `https://code.claude.com/docs/en/cloud-environments`, `https://code.claude.com/docs/en/settings` (section "Settings in cloud sessions"), `https://code.claude.com/docs/en/claude-code-on-the-web`.
- This repo: `build-and-deploy`, `live-verification`, `native-ships-via-testflight`, `native-ci-on-hosted-macos`, `milestone-runs-full-suite`, `one-simulator-per-mac`, `screens-checked-headless-in-ci`, `.claude/rules/*.md`, `package.json`, `Makefile`, `.github/workflows/`, `worker/`, `tools/ios-ship.json`.
- claude-settings: `cloud-setup.sh`, the README section "Cloud sessions", and the decisions `cloud-start-hooks-run-fresh`, `session-tiers`, `standing-merge-grant` and `machine-load-brake`.

- Home repo, home PR 588, 2026-11-08: the Duo CI shots (run 42522664456), cloud session messaging (home ruling, 16:48 CST), the blob host, and the subagent model variable.

## What the cloud gives

- **VM.** Ubuntu 24.04 on x86_64, about 4 vCPU, 16 GB RAM and 30 GB disk. Node 22 is on PATH, and Python 3, Docker, Chrome and `gh` are installed. There is no macOS option. A self-hosted environment can be a Mac, but it is a Team and Enterprise beta.
- **Setup script.** Bash, run as root before Claude Code launches. It runs once per environment snapshot. The snapshot is rebuilt when the script or the network hosts change, and when it reaches its expiry after about seven days. A non-zero exit fails the session start. The snapshot is taken only when setup finishes in about five minutes. A setup script gets no network secret.
- **Environment variables.** `.env` lines, stored as plain text. Anyone who uses the environment can read them. They are no place for a credential.
- **Network secrets.** A key the agent proxy adds to requests for the hosts you list, outside the VM. Type Bearer, with header `Authorization` and prefix `Bearer` by default. You cannot view the key again after you save it. The proxy never adds a secret to GitHub, to a package registry or to a setup-script request.
- **Network levels.** None, Trusted (the default allowlist), Full, or Custom. The Trusted list has GitHub, `registry.npmjs.org` and `raw.githubusercontent.com`. It does not have `*.workers.dev` or `api.cloudflare.com`, and no Playwright download host was found in it. GitHub, MCP connectors and the network-secret hosts are reachable at every level.
- **GitHub.** The session starts from a fresh clone. The credential stays on Anthropic's servers, and a proxy swaps it in. `git push` works for branches. `gh api` and other REST subcommands work. `gh pr` and `gh issue` get 403, because they use GraphQL. Built-in GitHub tools read issues and PRs and post comments.
- **Carry-over.** The repo's `CLAUDE.md`, `.claude/rules/`, `.claude/skills/` and `.claude/agents/` carry over, and so does `.claude/settings.json` in a one-repo session. The Mac's `~/.claude` does not carry over. In a session with two or more repos, no repo's hooks load.
- **Session tools.** Home measured that cloud sessions can message each other (home ruling, 2026-11-08 16:48 CST; home PR 588). The app's session-tool notes, 2026-11-08, said otherwise: a cloud session cannot send a message back. A local session gets no note when a cloud session it started ends a turn.

## Work kinds

Gold standard for each row: the work runs in a cloud session with the same verdict it gives on the Mac.

| Work | Cloud? | Why | Nearest cloud route | Measured |
|---|---|---|---|---|
| Web build, `npm test`, golden, rules, worker unit tests | yes | Pure Node; the `suite` job already runs them on ubuntu-latest | none needed | `suite` job 229–248 s, 7 green main runs before 2026-11-08 |
| Records and doc checks (`check:records`, `check:docs`, their tests) | yes | Same `suite` job | none needed | same runs |
| Screen check (`check:screens`, axe) | partly | Chromium runs on Linux, but Cochin exists only on macOS. So a cloud verdict is not the ruled check (`screens-checked-headless-in-ci`) | the `screens` job on `macos-26` stays the verdict; the cloud run is a smoke test | unmeasured in a cloud VM |
| Web screenshots for restyle steps | partly | Same font gap; Chromium is not the owner's WebKit | a CI job that shoots on macOS and uploads the images as an artifact; unbuilt | unmeasured |
| Worker code and probe deploy | partly | Code and tests: yes. A deploy needs `api.cloudflare.com` and a Cloudflare token as a network secret. Whether wrangler accepts a proxy-injected token is unknown | keep deploys on the Mac; they need the owner's word anyway (`live-verification`) | unmeasured |
| Worker live calls (probes, `/health`, `/kept`) | partly | The device key travels as `Authorization: Bearer`, which a network secret can add. `scripts/copy-photos-to-worker.mjs` checks the key's shape in the VM, so it cannot run on a proxy-injected key. The WebSocket key rides in `Sec-WebSocket-Protocol` | network secret on the Worker host, for curl-style probes only | unmeasured |
| GitHub sync to `mailaudit-data` | mostly retired | Per `live-verification`, no device writes it; the ledger lives on the Worker. Adding the repo makes a two-repo session, which loads no repo hooks | do not attach it; a one-off read runs on the Mac | not needed |
| PRs and merges (deploy branch, batch runner) | partly | `gh pr create` in `npm run deploy` gets 403. The batch runner already merges from the cloud through the GitHub MCP tools and the merge tool's cloud role (`session-tiers`, `standing-merge-grant`). The REST route `gh api .../pulls` is untried | the GitHub MCP tools, or `gh api` REST calls | unmeasured |
| Coordinator, triage and lane relay | partly | Home measured that cloud sessions can message each other (home ruling, 2026-11-08 16:48 CST; home PR 588). The app's session-tool notes say a cloud session cannot send a message back. Lanes reported through PRs and the shared notes folder only | one cloud session per role: coordinator, triage, batch runner and lanes | home PR 588; not measured here |
| Swift package tests (`swift test`) | no | `RulesEngine.swift` imports JavaScriptCore, which Swift on Linux lacks, and `Package.swift` lists only macOS and iOS platforms | the `native` CI job on `macos-26`, already built | CI only |
| App build, simulator UI tests (`make native-check`) | no | Needs Xcode and a simulator | `milestone.yml` on the hosted `xcode-27` image, already built, dispatch only; no green run yet (`app-build-waits-xcode-27`) | none green |
| Duo UI tests and fold | no | Needs the shared Duo simulator, the `hinge` tool and sim-gate grants (`one-simulator-per-mac`) on the Mac. Home measured a hosted route: GitHub's xcode-27 macOS runner image has the iPhone Duo device type, and `hinge` works there (home PR 588) | a macOS CI job on the xcode-27 image, as home ran it: run 42522664456 (2026-11-08) made 30 shots, 20 on the Duo (folded and book) and 10 on the 18 Pro | home run 42522664456, 2026-11-08 |
| Native screenshots for restyle steps | no | Needs a simulator | a macOS CI job that runs UI tests and uploads screenshots; unbuilt | unmeasured |
| TestFlight | no | Needs Xcode, signing and the App Store Connect key | the `testflight` workflow on the xcode-27 image, dispatch only, with the key as repo secrets (`native-ships-via-testflight`) | upload run 42750597378 sent build 202611100404, 2026-11-09 |
| Install on the phone | no | `devicectl` over the home Wi-Fi or cable | Mac only | n/a |
| Global hooks, lint and agents (`~/.claude`) | yes | claude-settings' `cloud-setup.sh` installs them; its records show the hooks running in cloud containers on 2026-11-03 (`cloud-start-hooks-run-fresh`) | step 1 of the draft script | measured by claude-settings, not here |
| Load brake, simulator boot cap, `sim-test`, `ios-ship` | not applicable | The brake skips cloud sessions (`machine-load-brake`); the rest are Mac tools | n/a | n/a |

**Docs versus evidence.** The settings page says the user settings file `~/.claude/settings.json` is "not read" in cloud sessions. The surrounding text says the Mac's file stays on the Mac. claude-settings measured its hooks running from the file that `install.sh --cloud` writes on the VM. This plan trusts the measurement. Whether a fresh mailaudit cloud session prints the `claude-settings setup: installed` line is unmeasured.

## The setup script

`docs/plans/cloud-setup.sh`:

1. Run the claude-settings paste block. It is unchanged, so `~/.claude` keeps one home.
2. Install Chromium for Playwright 1.63.0, the version pinned in `package.json`, with its system libraries. This step needs no clone.
3. Print one verdict line per step and always exit 0.

The script provisions the VM only, as the docs advise. `npm ci` is project setup, and the docs put it in a SessionStart hook. Nothing shows that a `node_modules` written at setup time survives into a session's fresh clone. Until the hook lands, each cloud session runs `npm ci` first.

The docs do not say which user a session runs as. The browser lands in root's cache. If a session is not root, it runs the Chromium install again without `--with-deps`.

Setup must finish in about five minutes, or no snapshot is taken. The claude-settings install is capped at 240 s. The total with the browser install is unmeasured.

Checked: `bash -n` and shellcheck are clean. On this Mac the script prints `skipped: not Linux` for step 1. A run on a cloud VM is unmeasured.

## Environment variables

Names only. No value goes in this repo, which is public.

| Name | Kind | What reads it | Where to get it | Secret? |
|---|---|---|---|---|
| `TZ` | variable, `America/Chicago` | Node tests and every date a session prints; the VM clock is otherwise UTC (`ci-runs-in-utc`) | fixed value | no |
| `CLAUDE_SETTINGS_REF` | variable, optional | the claude-settings SessionStart refresh hook, to pin a commit | a claude-settings commit sha | no |
| `CLAUDE_CODE_SUBAGENT_MODEL` | variable | Claude Code's subagent model. Home found that the SessionStart hook writes `settings.json` after Claude Code reads it, so set it here (home PR 588) | the value the owner picks; not stated in this plan | no |
| `GH_TOKEN`, `GITHUB_TOKEN` | leave unset | `gh` and scripts; unset, they read `proxy-injected` and the GitHub proxy authenticates | nothing to get | would be a credential; never set |
| Worker device key | network secret, Bearer, host = the Worker host | `Authorization` on Worker requests | the owner's device key, from a device that holds it | yes (`the-token-is-a-credential`) |
| `WORKER_URL` | variable, optional | `scripts/copy-photos-to-worker.mjs` | the Worker's URL | no |
| Cloudflare API token | network secret, Bearer, host `api.cloudflare.com`; only if deploys move to the cloud | wrangler | Cloudflare dashboard, a token scoped to Workers edit on one account | yes |
| `CLOUDFLARE_ACCOUNT_ID` | variable; only with the token | wrangler | Cloudflare dashboard, Workers overview | no |
| App Store Connect key | repo secrets `ASC_KEY_P8`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, for the `testflight` workflow only; never in a cloud session | `ios-ship` in the workflow, and on the Mac | App Store Connect, Users and Access, Integrations; the Mac copy stays in the ios-ship account file | yes |

`WORKER_KEY` as a plain variable is refused: anyone who uses the environment could read the device key.

## Network access

Custom: tick the default list, then add the hosts each work kind needs.

- `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`, for the Chromium download. These are the two download hosts in `playwright-core` 1.63.0's `lib/coreBundle.js`, read 2026-11-08. `--with-deps` also runs apt. Whether the Ubuntu mirrors are on the Trusted list is unmeasured.
- The Worker host, only for live probes. Its network secret makes it reachable anyway.
- `api.cloudflare.com`, only if Worker deploys move to the cloud.
- `*.blob.core.windows.net`, for downloading CI artifacts into a cloud session. Home measured this need (home PR 588).

## Wind down

Owner ruling, 2026-11-08 16:52 CST: winding down comes before anything comes to main. State lives in `~/.claude/handoffs`, which does not carry to the cloud. So each lane puts its handoff into its branch's draft PR body before it stops.

- **Restyle.** Let the step 7 batch (PR 231) merge. Push branch `step8-build` (round 2). Still owed: step 8's simulator red runs.
- **Duo.** Push branches `duo-hand-open-env` and `hand-post-pins`, and the mockup branches for items 11 and 13. Still owed: post pins and chip runs on the Duo, and the keyboard-gap measure.
- **Pins.** Push the branch for item 60. Queued: the photo fetch and sweep, the PhotoSync wiring, and item 58.
- **Orders extension.** Push its branches. Nothing deploys.
- **Batch runner.** Finish the open batch. The phone runs the last merged main.
- **Triage.** Nothing to move. The waiting page and the `roadmap` record branch already live off the Mac.
- **Gatekeeper and sim-gate grants.** Mac only. Stop it last.
- **Coordinator.** Its handoff goes into this plan's PR body, once the plan has one.

## Restart in the cloud

In this order:

1. The owner sets up the environment (see Owner acts below).
2. One measuring session checks each of these:
   - the setup verdict lines and the `claude-settings setup: installed` line;
   - `npm ci` and `npm test`;
   - a PR made through `gh api` REST;
   - a write to the waiting page through the claude-artifacts connector;
   - a merge through the GitHub MCP tools.
3. One cloud session per role: coordinator, triage, batch runner and lanes. Home measured that cloud sessions can message each other (home ruling, 2026-11-08 16:48 CST; home PR 588). This follows the claude-settings decision `lanes-start-as-agents` (one placement for the whole team, and a lane is a session).
4. Web, records, Worker and extension lanes restart from their PR bodies.
5. Native lanes run on hosted macOS CI only, per the ruling in Decisions for the owner, below.

## Owner acts

Not taken in this lane. The coordinator brings these to the owner.

1. Make the environment: on claude.ai/code, on the new-session screen, select the first control in the row under the message box. Then select Add environment (or Edit on an existing one), then Setup script, and paste `docs/plans/cloud-setup.sh`.
2. In the same dialog, select Network access, choose Custom, tick the default list, and add the hosts above.
3. Select Environment variables, and add `TZ=America/Chicago` and `CLAUDE_CODE_SUBAGENT_MODEL`, with the value the owner picks.
4. Only if cloud sessions will probe the Worker: select Network secrets, then Add secret. Keep the type Bearer, enter the Worker host, and paste the device key as the Value.
5. Select Save changes, then start one session on `shivinate7/mailaudit` alone and read its setup verdict lines.

## Decisions for the owner

- **TestFlight from CI.** Ruled. Owner, 2026-11-08 19:38 CST, item 65 a: the upload runs from the `testflight` workflow, with the key as repo secrets (`native-ships-via-testflight`).
- **Team placement.** Owner ruling, 2026-11-04 07:56 CST (claude-settings `lanes-start-as-agents`): the team of coordinator, triage, batch runner and lanes runs all on the Mac or all in the cloud. All-cloud fits that ruling, but the Mac remainder above still needs one Mac session. A split, with the coordinator local and the lanes in the cloud, departs from: `lanes-start-as-agents` (one placement for the whole team). Superseded by the owner ruling of 2026-11-08 16:50 CST: the whole team moves to the cloud (see Native work during the move).
- **Native work during the move.** Ruled. Owner, 2026-11-08 16:50 CST: the whole team moves to the cloud, with no Mac simulators. Native builds, simulator and UI tests, and screenshots move to macOS CI jobs (decision `native-ci-on-hosted-macos`). Home measured a macOS CI route for the Duo (home PR 588). The TestFlight key question (item 65) is ruled: see TestFlight from CI.

## Follow-ups

- A repo SessionStart hook that runs `npm ci` (config change).
- A macOS CI job that uploads restyle screenshots.
- A first cloud session that measures the setup verdicts, the Chromium host, `gh api` PR creation, and a proxy-injected Worker key.
- Shared screen-check plan: home's `docs/plans/plan-shared-screen-check.md`, which degen agreed to in degen PR 531. The three repos aim for one setup script in claude-settings and one coordinator shape.
