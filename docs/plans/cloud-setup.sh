#!/usr/bin/env bash
# Draft setup script for a mailaudit cloud environment (plan docs/plans/cloud-sessions.md).
# Paste it in the environment's Setup script row. It runs as root on Ubuntu 24.04, before Claude
# Code launches, and only when the environment snapshot is rebuilt (about every seven days, or
# when the script or the network hosts change). It holds no token and reads no secret: a setup
# script gets no network secret, and none belongs here (invariant the-token-is-a-credential).
# It never fails setup: every step prints one verdict line, and the script exits 0.
set -u

say() { printf 'mailaudit setup: %s\n' "$*"; }

# Step 1. The global layer: claude-settings' own cloud installer, the one home for ~/.claude.
# This is the paste block from the claude-settings README, section "Cloud sessions", unchanged
# in effect. It installs agents, hooks, skills and the output style.
f=$(mktemp)
if ! curl -fsS --max-time 20 https://raw.githubusercontent.com/shivinate7/claude-settings/main/cloud-setup.sh -o "$f"; then
  : > "$f"
  for d in ${CLAUDE_SETTINGS_SEARCH_ROOTS:-/home/user /root}; do
    for c in "$d"/*/cloud-setup.sh; do
      case "$(git -C "${c%/*}" config --get remote.origin.url 2>/dev/null)" in
        *github.com[/:]shivinate7/claude-settings|*github.com[/:]shivinate7/claude-settings.git) cp "$c" "$f" && break 2 ;;
      esac
    done
  done
fi
if [ -s "$f" ]; then bash "$f" || true; else echo "claude-settings setup: no source: GitHub down, or the repo is private and not under the environment's Repositories"; fi
rm -f "$f"

# Step 2. Playwright's pinned Chromium and its system libraries, for npm run check:screens and
# the axe audits. This provisions the VM only and needs no clone. npm ci is project setup, so a
# session runs it first; the plan's follow-up moves it to a repo SessionStart hook. The version
# is the one pinned in package.json. The browser lands in the default cache of the setup user,
# root. The docs do not say whether sessions run as root; if not, a session re-runs the install
# without --with-deps. The two download hosts are not on the Trusted list: see the plan.
if npx --yes playwright@1.63.0 install --with-deps chromium >/tmp/mailaudit-playwright.log 2>&1; then
  say "Chromium installed"
else
  say "Chromium install failed (log /tmp/mailaudit-playwright.log); check the network hosts"
fi

exit 0
