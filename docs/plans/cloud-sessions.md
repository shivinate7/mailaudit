# Cloud sessions for mailaudit: what is still unbuilt

**Status:** open. The cloud team runs this repo (the Mac team wound down on 2026-11-08 at 17:20 CST, and the whole team moved to the cloud by the owner's ruling of 2026-11-08 16:50 CST). What a cloud session can reach is measured and lives in `cloud-session-reach`. This plan holds only what is not built or not measured. Nothing below is measured on a cloud VM unless it says so.

**Unmeasured:** whether the environment ran `docs/plans/cloud-setup.sh`, and what its verdict lines print. Read a fresh session's setup lines before you build on any row here.

## The setup script

`docs/plans/cloud-setup.sh` is a draft. It runs as root before Claude Code launches, once per environment snapshot. The snapshot is rebuilt after about seven days, and when the script or the network hosts change. A non-zero exit fails the session start, and a setup script gets no network secret.

1. Run the claude-settings paste block, so `~/.claude` keeps one home.
2. Install Chromium for Playwright 1.63.0, the version pinned in `package.json`, with its system libraries.
3. Print one verdict line per step and always exit 0.

`npm ci` is project setup, so it belongs in a SessionStart hook, which is unbuilt. Until then each cloud session runs `npm ci` first. Setup must finish in about five minutes, or no snapshot is taken.

## Environment variables

Names only. No value goes in this repo, which is public.

| Name | Kind | What reads it | Secret? |
|---|---|---|---|
| `TZ` | variable, `America/Chicago` | Node tests and every date a session prints; the VM clock is UTC (`ci-runs-in-utc`) | no |
| `CLAUDE_CODE_SUBAGENT_MODEL` | variable | Claude Code's subagent model; the SessionStart hook writes `settings.json` too late for it | no |
| Cloudflare API token | network secret, Bearer, host `api.cloudflare.com`; only if Worker deploys move to the cloud | wrangler | yes |
| `CLOUDFLARE_ACCOUNT_ID` | variable; only with the token | wrangler | no |

Never set `GH_TOKEN` or `GITHUB_TOKEN` to a real token: the GitHub proxy authenticates, and a session may show a placeholder. The device key is a network secret on the Worker host and never a variable (`cloud-session-reach`, `the-token-is-a-credential`). The App Store Connect key is a repo secret for the `testflight` workflow and never enters a cloud session.

## Network access

Custom: tick the default list, then add the hosts a work kind needs.

- `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`, for the Chromium download (the two hosts in `playwright-core` 1.63.0's `lib/coreBundle.js`, read 2026-11-08). Whether the Ubuntu mirrors for `--with-deps` are on the default list is unmeasured.
- `api.cloudflare.com`, only if Worker deploys move to the cloud.
- `*.blob.core.windows.net`, to download CI artifacts into a cloud session (home PR 588 measured the need).

## Still to build or measure

- A repo SessionStart hook that runs `npm ci` (config change).
- A macOS CI job that shoots web and native screenshots on a macOS runner and uploads them. The Cochin font exists only on macOS, so a Linux screen check is a smoke test and the `screens` job stays the verdict (`screens-checked-headless-in-ci`).
- A cloud session that measures the setup verdict lines, the Chromium download host, a PR made through `gh api` REST, and whether wrangler accepts a proxy-injected Cloudflare token.
- A write to the waiting page through the claude-artifacts connector, and a merge through the GitHub MCP tools.
- Whether a fresh session prints the claude-settings `installed` line. The docs say the user settings file is not read in cloud sessions, and claude-settings measured its hooks running anyway.
- Whether cloud sessions can message each other. Home measured that they can (home ruling, 2026-11-08 16:48 CST; home PR 588); the app's session-tool notes say a session cannot send a message back. Unmeasured here.
- Do not attach `mailaudit-data` to a session: a session with two or more repos loads no repo hooks (docs, read 2026-11-08). The ledger lives on the Worker, so no session needs that repo.
- Shared screen-check plan, with one setup script in claude-settings and one coordinator shape across the three repos: home's `docs/plans/plan-shared-screen-check.md`, which degen agreed to in degen PR 531.
