# Cloud sessions for mailaudit

**Status:** open, research only. Lane `cloud-feasibility`, 2026-11-08, from main 4d56eef. Nothing here is built or configured. The setup script draft is `docs/plans/cloud-setup.sh`.

Can mailaudit's work run in Claude Code cloud sessions (claude.ai/code, an Anthropic-hosted Ubuntu 24.04 VM) instead of on the owner's Mac?

**Verdict: mostly cloud, with a named Mac remainder.** All web, records, Worker-code and CI work runs in the cloud. Anything that needs a Mac stays on the Mac or moves to a hosted macOS runner: an Xcode build, a simulator, the Duo, a phone install, TestFlight, a native screenshot, the Cochin font. The Mac remainder is the phone install, the Duo UI tests and the sim-gate grants. TestFlight and native screenshots have a hosted-runner route, but neither is built.

## Sources

- Cloud docs, read 2026-11-08: `https://code.claude.com/docs/en/cloud-environments`, `https://code.claude.com/docs/en/settings` (section "Settings in cloud sessions"), `https://code.claude.com/docs/en/claude-code-on-the-web`.
- This repo: `build-and-deploy`, `live-verification`, `native-ships-via-testflight`, `native-ci-on-hosted-macos`, `milestone-runs-full-suite`, `one-simulator-per-mac`, `screens-checked-headless-in-ci`, `.claude/rules/*.md`, `package.json`, `Makefile`, `.github/workflows/`, `worker/`, `tools/ios-ship.json`.
- claude-settings: `cloud-setup.sh`, the README section "Cloud sessions", and the decisions `cloud-start-hooks-run-fresh`, `session-tiers`, `standing-merge-grant` and `machine-load-brake`.

## What the cloud gives

- **VM.** Ubuntu 24.04 on x86_64, about 4 vCPU, 16 GB RAM and 30 GB disk. Node 22 is on PATH, and Python 3, Docker, Chrome and `gh` are installed. There is no macOS option. A self-hosted environment can be a Mac, but it is a Team and Enterprise beta.
- **Setup script.** Bash, run as root before Claude Code launches. It runs once per environment snapshot. The snapshot is rebuilt when the script or the network hosts change, and when it reaches its expiry after about seven days. A non-zero exit fails the session start. The snapshot is taken only when setup finishes in about five minutes. A setup script gets no network secret.
- **Environment variables.** `.env` lines, stored as plain text. Anyone who uses the environment can read them. They are no place for a credential.
- **Network secrets.** A key the agent proxy adds to requests for the hosts you list, outside the VM. Type Bearer, with header `Authorization` and prefix `Bearer` by default. You cannot view the key again after you save it. The proxy never adds a secret to GitHub, to a package registry or to a setup-script request.
- **Network levels.** None, Trusted (the default allowlist), Full, or Custom. The Trusted list has GitHub, `registry.npmjs.org` and `raw.githubusercontent.com`. It does not have `*.workers.dev` or `api.cloudflare.com`, and no Playwright download host was found in it. GitHub, MCP connectors and the network-secret hosts are reachable at every level.
- **GitHub.** The session starts from a fresh clone. The credential stays on Anthropic's servers, and a proxy swaps it in. `git push` works for branches. `gh api` and other REST subcommands work. `gh pr` and `gh issue` get 403, because they use GraphQL. Built-in GitHub tools read issues and PRs and post comments.
- **Carry-over.** The repo's `CLAUDE.md`, `.claude/rules/`, `.claude/skills/` and `.claude/agents/` carry over, and so does `.claude/settings.json` in a one-repo session. The Mac's `~/.claude` does not carry over. In a session with two or more repos, no repo's hooks load.
- **Session tools.** A cloud session receives a message from a local session but cannot send one back. A local session gets no note when a cloud session it started ends a turn. Source: the Claude desktop app's session-tool notes, 2026-11-08.

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
| Coordinator, triage and lane relay | partly | A cloud session cannot message back, and a local parent gets no note from it. Lanes report through PRs and the shared notes folder only | keep the coordinator local, and run cloud lanes that report by PR; or run each lane as a subagent inside one cloud session | per the app's session-tool notes; unmeasured in practice |
| Swift package tests (`swift test`) | no | Swift on Linux has no JavaScriptCore or Apple frameworks | the `native` CI job on `macos-26`, already built | CI only |
| App build, simulator UI tests (`make native-check`) | no | Needs Xcode and a simulator | `milestone.yml` on the hosted `xcode-27` image, already built, dispatch only; no green run yet (`app-build-waits-xcode-27`) | none green |
| Duo UI tests and fold | no | Needs the shared Duo simulator, the `hinge` tool and sim-gate grants (`one-simulator-per-mac`) | Mac only; no hosted runner has the Duo | n/a |
| Native screenshots for restyle steps | no | Needs a simulator | a macOS CI job that runs UI tests and uploads screenshots; unbuilt | unmeasured |
| TestFlight | no | Needs Xcode, signing and the App Store Connect key, which live only on this Mac (`native-ships-via-testflight`) | a macOS CI job with the key as an Actions secret; unbuilt, and it departs from the ruling (below) | n/a |
| Install on the phone | no | `devicectl` over the home Wi-Fi or cable | Mac only | n/a |
| Global hooks, lint and agents (`~/.claude`) | yes | claude-settings' `cloud-setup.sh` installs them; its records show the hooks running in cloud containers on 2026-11-03 (`cloud-start-hooks-run-fresh`) | step 1 of the draft script | measured by claude-settings, not here |
| Load brake, simulator boot cap, `sim-test`, `ios-ship` | not applicable | The brake skips cloud sessions (`machine-load-brake`); the rest are Mac tools | n/a | n/a |

**Docs vs evidence.** The settings page says the user settings file `~/.claude/settings.json` is "not read" in cloud sessions. The surrounding text says the Mac's file stays on the Mac. claude-settings measured its hooks running from the file that `install.sh --cloud` writes on the VM. This plan trusts the measurement. Whether a fresh mailaudit cloud session prints the `claude-settings setup: installed` line is unmeasured.

## The setup script

`docs/plans/cloud-setup.sh`:

1. Run the claude-settings paste block. It is unchanged, so `~/.claude` keeps one home.
2. Find the mailaudit clone by its `package.json` name. The docs do not say whether the clone exists when the setup script runs, so with no clone it skips the repo steps.
3. Run `npm ci`, then `npx playwright install --with-deps chromium`.
4. Print one verdict line per step and always exit 0.

Checked: `bash -n` and shellcheck are clean. On this Mac the script prints `skipped: not Linux` and `no clone found`. A run on a cloud VM is unmeasured.

The snapshot can be up to about seven days old, so `node_modules` can lag the lockfile on main. The docs' fix is a repo SessionStart hook that runs `npm ci` on every session. That needs `.claude/settings.json`, which is a config change, so it is a follow-up and is not in this lane.

## Environment variables

Names only. No value goes in this repo, which is public.

| Name | Kind | What reads it | Where to get it | Secret? |
|---|---|---|---|---|
| `TZ` | variable, `America/Chicago` | Node tests and every date a session prints; the VM clock is otherwise UTC (`ci-runs-in-utc`) | fixed value | no |
| `CLAUDE_SETTINGS_REF` | variable, optional | the claude-settings SessionStart refresh hook, to pin a commit | a claude-settings commit sha | no |
| `GH_TOKEN`, `GITHUB_TOKEN` | leave unset | `gh` and scripts; unset, they read `proxy-injected` and the GitHub proxy authenticates | nothing to get | would be a credential; never set |
| Worker device key | network secret, Bearer, host = the Worker host | `Authorization` on Worker requests | the owner's device key, from a device that holds it | yes (`the-token-is-a-credential`) |
| `WORKER_URL` | variable, optional | `scripts/copy-photos-to-worker.mjs` | the Worker's URL | no |
| Cloudflare API token | network secret, Bearer, host `api.cloudflare.com`; only if deploys move to the cloud | wrangler | Cloudflare dashboard, a token scoped to Workers edit on one account | yes |
| `CLOUDFLARE_ACCOUNT_ID` | variable; only with the token | wrangler | Cloudflare dashboard, Workers overview | no |
| App Store Connect key | never in the cloud | `ios-ship` on the Mac | stays in the ios-ship account file on the Mac | yes |

`WORKER_KEY` as a plain variable is refused: anyone who uses the environment could read the device key.

## Network access

Custom: tick the default list, then add the hosts each work kind needs.

- `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`, for the Chromium download. The current host for Playwright 1.63 is unmeasured; read it from the failing install log.
- The Worker host, only for live probes. Its network secret makes it reachable anyway.
- `api.cloudflare.com`, only if Worker deploys move to the cloud.

## Owner acts

Not taken in this lane. The coordinator brings these to the owner.

1. Make the environment: on claude.ai/code, on the new-session screen, select the first control in the row under the message box. Then select Add environment (or Edit on an existing one), then Setup script, and paste `docs/plans/cloud-setup.sh`.
2. In the same dialog, select Network access, choose Custom, tick the default list, and add the hosts above.
3. Select Environment variables, and add `TZ=America/Chicago`.
4. Only if cloud sessions will probe the Worker: select Network secrets, then Add secret. Keep the type Bearer, enter the Worker host, and paste the device key as the Value.
5. Select Save changes, then start one session on `shivinate7/mailaudit` alone and read its setup verdict lines.

## Decisions for the owner

- **TestFlight from CI.** Departs from: `native-ships-via-testflight` (the key lives only on this Mac) — the App Store Connect key becomes a GitHub Actions secret, and a macOS job uploads. Gain: no Mac is needed for the fallback. Lose: the key leaves the Mac, onto a public repo's Actions.
- **Coordinator placement.** Departs from: main, where every session is local — cloud lanes report only by PR and by notes. Recommended: keep the coordinator, batch runner and Duo work local, and send web and records lanes to the cloud.

## Follow-ups

- A repo SessionStart hook that runs `npm ci` (config change).
- A macOS CI job that uploads restyle screenshots.
- A first cloud session that measures the setup verdicts, the Chromium host, `gh api` PR creation, and a proxy-injected Worker key.
