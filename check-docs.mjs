// A checked reader for CLAUDE.md's own published numbers and paths.
//
// CLAUDE.md publishes two kinds of claims a reader can check by machine:
// the suite's total assertion count ("541 assertions"), and repo paths named
// in backticks (`src/app.jsx`). Neither is hard-coded here — the count comes
// from actually running the suite, and every path is checked against the
// real filesystem, so this file cannot drift out of step with either without
// failing loudly. Run with `npm run check:docs`.
//
// What this deliberately does NOT check: the measured page figures in "The
// card's reserved geometry" and "The masthead" (185px, 347.09px, and the
// rest). Those come from a real browser viewport, not from code, and jsdom
// has no layout — there is no reader for them here, and inventing one that
// cannot see a layout shift would be worse than admitting the gap. Re-measure
// them by hand, in a real 375px viewport, the way those sections describe.

import { readFileSync } from "fs";
import { existsSync, statSync } from "fs";
import { execFileSync } from "child_process";

const DOC = "CLAUDE.md";
const prose = readFileSync(DOC, "utf8");

let failures = 0;

/* ---------- claim 1: the published assertion count ----------
   The suite itself prints "<N> passed, <M> failed" — see test/harness.mjs.
   That printed total is the one true count; CLAUDE.md's prose is graded
   against it, never the other way around.

   The total is NOT stable across timezones. CLAUDE.md documents test 38.9 as
   skipping itself in UTC, "where there is nothing to claim" — a CI runner set
   to UTC prints one fewer assertion than a machine behind UTC. A count that
   changes with the runner's clock cannot be checked anywhere, so this always
   runs the suite under a fixed, non-UTC zone. America/New_York is picked
   because it is where 38.9 has something to claim; any zone behind UTC would
   do. */
const FIXED_TZ = "America/New_York";

function suiteTotal() {
  const out = execFileSync(process.execPath, ["test/app.test.mjs"], {
    encoding: "utf8",
    env: { ...process.env, TZ: FIXED_TZ },
  });
  const m = out.match(/(\d+) passed, (\d+) failed/);
  if (!m) {
    throw new Error("could not read a pass/fail count out of npm test's output");
  }
  return Number(m[1]) + Number(m[2]);
}

const real = suiteTotal();
const claimed = [...prose.matchAll(/(\d+)\s+assertions\b/gi)];

if (!claimed.length) {
  console.error(`check:docs: ${DOC} names no assertion count to check — did the prose change shape?`);
  failures++;
} else {
  for (const m of claimed) {
    const n = Number(m[1]);
    if (n !== real) {
      const line = prose.slice(0, m.index).split("\n").length;
      console.error(
        `check:docs: ${DOC}:${line} says "${n} assertions", but the suite prints ${real}`
      );
      failures++;
    }
  }
  console.log(
    `check:docs: ${claimed.length} assertion-count claim(s) checked against ` +
      `the suite's real total (${real})`
  );
}

/* ---------- claim 2: every repo path named in backticks exists ----------
   A backtick span is judged as a path only when it looks like one: no
   whitespace, no URL, no curly-brace API template, no colon (a storage key
   like `mailday:v1` or a git ref like `ledger/data:ledger.json` is not a
   filesystem path), and it either ends in a recognized file extension or in
   a trailing slash naming a directory. Everything else is refused rather
   than silently skipped, and printed with a count so the reader knows what
   this did not check. */
const EXT = /\.(mjs|jsx?|json|html?|md|ya?ml|py|svg|png|css|txt)$/i;
const SEMVER = /^\^?~?\d+(\.\d+){1,2}$/;
const BARE_EXT = /^\.[a-z0-9]+$/i;
// A domain read off github.com or raw.githubusercontent.com, e.g.
// `raw.githubusercontent.com/owner/repo/...` — not a path in THIS repo.
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+\//i;

function excluded(s) {
  if (/\s/.test(s)) return true;
  if (s.includes("://")) return true;
  if (s.includes("{") || s.includes("}")) return true;
  if (s.includes(":")) return true;
  if (s.includes("@")) return true;
  if (s.includes("*") || s.includes("|")) return true;
  if (s.includes("..")) return true;
  if (s.startsWith("/")) return true; // a URL path, not a repo path
  if (SEMVER.test(s)) return true;
  if (BARE_EXT.test(s)) return true; // "`.json`" names an extension, not a file
  if (DOMAIN.test(s)) return true;
  // node_modules is generated, never committed, and the doc's one mention of
  // it is an illustrative example location, not a claim that it exists now.
  if (s.startsWith("node_modules/")) return true;
  return false;
}

const spans = [...prose.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
const seen = new Set();
const refused = new Set();
let checked = 0;

// First pass: every slash-qualified candidate builds a basename -> full-path
// map. `src/app.jsx` is how the doc gives `app.jsx` a real location — a bare
// later mention of `app.jsx` is judged against that location, not against
// the repo root, which is what a plain-repo-file mention like `build.mjs`
// resolves against instead.
const knownPath = new Map();
for (const s of spans) {
  if (excluded(s) || s.endsWith("/") || !s.includes("/") || !EXT.test(s)) continue;
  const base = s.split("/").pop();
  if (!knownPath.has(base)) knownPath.set(base, s);
}

for (const s of spans) {
  if (seen.has(s)) continue;
  seen.add(s);
  if (excluded(s)) {
    refused.add(s);
    continue;
  }
  if (s.endsWith("/")) {
    // Only judge a multi-segment directory (`.github/workflows/`) — a bare
    // single-segment one (`photos/`) is as likely to name a directory in
    // another repo as one here, and is refused rather than guessed at.
    const dir = s.slice(0, -1);
    if (!dir.includes("/")) {
      refused.add(s);
      continue;
    }
    checked++;
    if (!(existsSync(dir) && statSync(dir).isDirectory())) {
      console.error(`check:docs: ${DOC} names \`${s}\`, which does not exist in this repo`);
      failures++;
    }
    continue;
  }
  if (!EXT.test(s)) {
    refused.add(s);
    continue;
  }
  // A qualified path is judged directly. A bare filename is judged only when
  // the doc has itself supplied a real location for it (via knownPath) or it
  // is plausibly a root file — anything else (a filename that lives only in
  // another repo, like `ledger.json`) is refused, not failed.
  let target = s;
  if (!s.includes("/")) {
    if (knownPath.has(s)) target = knownPath.get(s);
    else if (!existsSync(s)) {
      refused.add(s);
      continue;
    }
  }
  checked++;
  if (!existsSync(target)) {
    console.error(`check:docs: ${DOC} names \`${s}\`, which does not exist in this repo`);
    failures++;
  }
}

console.log(`check:docs: ${checked} path(s) checked against the filesystem`);
console.log(`check:docs: ${refused.size} backtick span(s) refused as not path-like`);
if (process.env.CHECK_DOCS_VERBOSE) {
  for (const s of refused) console.log(`  refused: ${s}`);
}

if (failures) {
  console.error(`check:docs: ${failures} problem(s) found`);
  process.exit(1);
}
console.log("check:docs: CLAUDE.md's numbers and paths check out");
