// Says whether the full Swift suite (.github/workflows/milestone.yml) is due. Decision
// milestone-runs-full-suite holds the rule.
//
// milestoneDue is pure. runs are the milestone runs on main, newest first; nativeMerges is the
// count of first-parent commits on main that touch native paths since countBase(runs).
//
// CLI, for the milestone-due job in test.yml, on a push to main only:
//   node scripts/milestone-due.mjs --native-paths <file>
// It reads the dispatched milestone runs on main (one API read with GITHUB_TOKEN), counts the
// native commits since countBase (one git log), and dispatches milestone.yml
// when due. A read that fails exits 1: an unknown read is red in CI.
//
// CLI, for the milestone-gate job in test.yml, on every event:
//   node scripts/milestone-due.mjs gate
// It reads the same runs and exits 1 unless gateVerdict passes.

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// A lane default, unmeasured. Three native merges between full runs.
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

// The merge gate. Only a successful milestone run is proof, so a run that timed out, was
// cancelled or was never taken reads as no proof (decision milestone-runs-full-suite). runs are the
// dispatched milestone runs on main, newest first; now is epoch ms. Walking from the newest:
//   - a run that is not completed is in flight. Fresh, it is skipped, since its result is not in yet.
//     Older than staleMinutes, or with an unreadable createdAt, it was not taken: fail.
//   - the first completed run decides: success passes, anything else fails.
//   - no completed run, and no stale one, is the bootstrap: pass. The first run has nothing older to prove.
export function gateVerdict({ runs, now, staleMinutes = 90 }) {
  for (const run of runs) {
    if (run.status === "completed") {
      return run.conclusion === "success"
        ? { pass: true, reason: "the newest completed milestone run succeeded" }
        : { pass: false, reason: `the newest completed milestone run ended ${run.conclusion}, so there is no proof` };
    }
    const age = (now - Date.parse(run.createdAt)) / 60_000;
    if (!(age <= staleMinutes)) {
      return { pass: false, reason: `a ${run.status} milestone run was not taken, or its age is unreadable, within ${staleMinutes} minutes` };
    }
  }
  return {
    pass: true,
    reason: runs.length === 0 ? "no milestone run yet" : "only fresh milestone runs in flight, nothing older to prove",
  };
}

// The sha the native-merge count starts from, or null to count every commit. After a failed or
// timed-out run it is that run's sha, so a push to a failed main does not dispatch again until a
// native merge follows the failure. Otherwise it is the newest successful run. A cancelled run is
// not a failure, and a queued or in-progress run has no result yet, so the choice skips both.
export function countBase(runs) {
  const newest = runs.find((r) => r.status === "completed");
  if (newest && FAILED.has(newest.conclusion)) return newest.headSha;
  const green = runs.find((r) => r.status === "completed" && r.conclusion === "success");
  return green ? green.headSha : null;
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

const RETRY_CAP_MS = 10_000;

// A read that hits a 5xx or a rate limit waits once, then tries once more. The wait is the
// Retry-After header, capped at RETRY_CAP_MS, or 2 s with none. A second failure throws, so the
// job still fails closed. A POST is never retried: a dispatch that did land must not run twice.
async function api(path, init = {}) {
  const url = `https://api.github.com/repos/${need("GITHUB_REPOSITORY")}/${path}`;
  const options = {
    ...init,
    headers: {
      authorization: `Bearer ${need("GITHUB_TOKEN")}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  };
  let res = await fetch(url, options);
  const isRead = (init.method ?? "GET") === "GET";
  const limited = res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0");
  if (isRead && !res.ok && (res.status >= 500 || limited)) {
    const asked = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(asked) && asked > 0 ? Math.min(asked * 1000, RETRY_CAP_MS) : 2000;
    console.log(`milestone-due: GitHub API ${path}: HTTP ${res.status}, retrying once in ${wait} ms`);
    await new Promise((done) => setTimeout(done, wait));
    res = await fetch(url, options);
  }
  if (!res.ok) throw new Error(`GitHub API ${path}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// Only dispatched runs on the branch count. A pull_request run of the file proves nothing about main.
async function milestoneRuns(branch) {
  const body = await api(
    `actions/workflows/milestone.yml/runs?branch=${encodeURIComponent(branch)}&event=workflow_dispatch&per_page=30`
  );
  return body.workflow_runs.map((r) => ({
    status: r.status,
    conclusion: r.conclusion,
    headSha: r.head_sha,
    createdAt: r.created_at,
  }));
}

// The milestone-gate job: fails a pull request or a push until the milestone run on main passed.
// The branch is main, named here: on a pull_request GITHUB_REF_NAME is "<n>/merge".
async function gate() {
  const verdict = gateVerdict({ runs: await milestoneRuns("main"), now: Date.now() });
  const line = `milestone-gate: ${verdict.pass ? "pass" : "fail"}: ${verdict.reason}`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  if (!verdict.pass) process.exitCode = 1;
}

async function cli(argv) {
  if (argv[0] === "gate") return gate();
  const at = argv.indexOf("--native-paths");
  if (at < 0 || !argv[at + 1]) throw new Error("usage: milestone-due.mjs --native-paths <file>");
  // The file is a grep -E regex that JS reads the same: no lookaround, no backreference.
  const nativeRe = new RegExp(readFileSync(argv[at + 1], "utf8").trim());
  const ref = need("GITHUB_REF_NAME");
  const runs = await milestoneRuns(ref);

  const base = countBase(runs);
  const range = base ? [`${base}..HEAD`] : [];
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
