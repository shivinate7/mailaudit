// Says whether the full Swift suite (.github/workflows/milestone.yml) is due. Decision
// milestone-runs-full-suite holds the rule.
//
// milestoneDue is pure. runs are the milestone runs on main, newest first; nativeMerges is the
// count of first-parent commits on main that touch native paths since the newest successful run.
//
// CLI, for the milestone-due job in test.yml, on a push to main only:
//   node scripts/milestone-due.mjs --native-paths <file>
// It reads the dispatched milestone runs on main (one API read with GITHUB_TOKEN), counts the
// native commits since the newest successful run (one git log), and dispatches milestone.yml
// when due. A read that fails exits 1: an unknown read is red in CI.

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The coordinator's pick, pending the owner. Three native merges between full runs.
export const N = 3;

const FAILED = new Set(["failure", "timed_out"]);

export function milestoneDue({ runs, nativeMerges, n }) {
  if (runs.length === 0) return { due: true, reason: "no milestone run yet" };
  const newest = runs[0];
  if (newest.status !== "completed") {
    return { due: false, reason: `the newest run is ${newest.status}` };
  }
  // A failed or timed-out run is retried on the next native merge. A cancelled run is
  // not a failure, so it waits for the count like a success does.
  if (FAILED.has(newest.conclusion)) {
    return nativeMerges >= 1
      ? { due: true, reason: `the newest run ${newest.conclusion}, and ${nativeMerges} native merge(s) since` }
      : { due: false, reason: `the newest run ${newest.conclusion}, and no native merge since` };
  }
  return nativeMerges >= n
    ? { due: true, reason: `${nativeMerges} native merges since the last success, at or past ${n}` }
    : { due: false, reason: `${nativeMerges} native merges since the last success, below ${n}` };
}

// Counts the commits in `git log --first-parent -m --name-only -z --format=%x01%H` that touch a
// native path. Each commit is \x01, its hash, NUL, a newline, then its NUL-separated paths. -z
// keeps a path with a quote in it as written.
export function nativeCommits(log, nativeRe) {
  let count = 0;
  for (const chunk of log.split("\x01").slice(1)) {
    const [, ...rest] = chunk.split("\0");
    const paths = rest.map((p) => p.replace(/^\n/, "")).filter((p) => p !== "");
    if (paths.some((p) => nativeRe.test(p))) count++;
  }
  return count;
}

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${need("GITHUB_REPOSITORY")}/${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${need("GITHUB_TOKEN")}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

async function cli(argv) {
  const at = argv.indexOf("--native-paths");
  if (at < 0 || !argv[at + 1]) throw new Error("usage: milestone-due.mjs --native-paths <file>");
  // The file is a grep -E regex that JS reads the same: no lookaround, no backreference.
  const nativeRe = new RegExp(readFileSync(argv[at + 1], "utf8").trim());
  const ref = need("GITHUB_REF_NAME");

  // Only dispatched runs on main count. A pull_request run of the file proves nothing about main.
  const body = await api(
    `actions/workflows/milestone.yml/runs?branch=${encodeURIComponent(ref)}&event=workflow_dispatch&per_page=30`
  );
  const runs = body.workflow_runs.map((r) => ({ status: r.status, conclusion: r.conclusion, headSha: r.head_sha }));

  const lastGreen = runs.find((r) => r.status === "completed" && r.conclusion === "success");
  const range = lastGreen ? [`${lastGreen.headSha}..HEAD`] : [];
  const log = execFileSync(
    "git",
    ["log", "--first-parent", "-m", "--no-renames", "--name-only", "-z", "--format=%x01%H", ...range],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  const nativeMerges = nativeCommits(log, nativeRe);

  const verdict = milestoneDue({ runs, nativeMerges, n: N });
  const line = `milestone-due: ${verdict.due ? "due" : "not due"}: ${verdict.reason}`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  if (verdict.due) {
    await api("actions/workflows/milestone.yml/dispatches", {
      method: "POST",
      body: JSON.stringify({ ref }),
    });
    console.log(`milestone-due: dispatched milestone.yml on ${ref}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).catch((e) => {
    console.error(`milestone-due: ${e.message}`);
    process.exit(1);
  });
}
