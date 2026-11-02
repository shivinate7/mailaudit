// Says whether the full Swift suite (.github/workflows/milestone.yml) is due. Decision
// milestone-runs-full-suite holds the rule.
//
// milestoneDue is pure. runs are the milestone runs on main, newest first; nativeMerges is the
// count of first-parent commits on main that touch native paths since countBase(runs).
//
// CLI, for the milestone-due job in test.yml, on a push to main only:
//   node scripts/milestone-due.mjs --native-paths <file>
// It reads the dispatched milestone runs on main (one API read with GITHUB_TOKEN, through milestoneRuns), counts the
// native commits since countBase (one git log), and dispatches milestone.yml
// when due. A read that fails exits 1: an unknown read is red in CI.
//
// CLI, for the milestone-proof job in test.yml, on every event:
//   node scripts/milestone-due.mjs proof
// It reads the same runs and exits 1 unless proofVerdict passes.

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

// The milestone proof. Only a successful milestone run is proof, so a run that timed out, was
// cancelled or was never taken reads as no proof (decision milestone-runs-full-suite). runs are the
// dispatched milestone runs on main, newest first; now is epoch ms. Walking from the newest:
//   - a run that is not completed is in flight. Fresh, it is skipped, since its result is not in yet.
//     Older than staleMinutes (from runStartedAt, else createdAt), or unreadable, it was not taken: fail.
//     An in-flight re-run (runAttempt above 1) is never skipped: fail.
//   - the first completed run decides: success passes, anything else fails.
//   - no completed run, and no stale one, is the bootstrap: pass. The first run has nothing older to prove.
export function proofVerdict({ runs, now, staleMinutes = 90 }) {
  for (const run of runs) {
    if (run.status === "completed") {
      return run.conclusion === "success"
        ? { pass: true, reason: "the newest completed milestone run succeeded" }
        : { pass: false, reason: `the newest completed milestone run ended ${run.conclusion}, so there is no proof` };
    }
    // A re-run keeps createdAt, so an in-flight re-run of a failed run would read as fresh. It is
    // never skipped: the run it replaced has no proof, and this one has none yet.
    if (run.runAttempt > 1) return { pass: false, reason: "re-run of a failed run; no proof yet" };
    const age = (now - Date.parse(run.runStartedAt ?? run.createdAt)) / 60_000;
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
const MILESTONE_FILE = ".github/workflows/milestone.yml";

// The pieces of one GitHub API session. fetch and wait are parameters so a test drives the reader
// with no network and no pause.
function session({ repo, token, fetch = globalThis.fetch, wait = (ms) => new Promise((done) => setTimeout(done, ms)) }) {
  return { repo, token, fetch, wait };
}

// A read that hits a 5xx, a rate limit or a network error waits once, then tries once more. The wait is the
// Retry-After header, capped at RETRY_CAP_MS, or 2 s with none. A second failure throws, so the
// job still fails closed. A POST is never retried: a dispatch that did land must not run twice.
async function api(ctx, path, init = {}) {
  const url = `https://api.github.com/repos/${ctx.repo}/${path}`;
  const options = {
    ...init,
    headers: {
      authorization: `Bearer ${ctx.token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  };
  const isRead = (init.method ?? "GET") === "GET";
  let res = null;
  let netError = null;
  try {
    res = await ctx.fetch(url, options);
  } catch (e) {
    if (!isRead) throw e;
    netError = e;
  }
  const limited = res !== null && (res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0"));
  if (isRead && (netError !== null || (!res.ok && (res.status >= 500 || limited)))) {
    const asked = res === null ? NaN : Number(res.headers.get("retry-after"));
    const pause = Number.isFinite(asked) && asked > 0 ? Math.min(asked * 1000, RETRY_CAP_MS) : 2000;
    console.log(`milestone-due: GitHub API ${path}: ${netError ? netError.message : `HTTP ${res.status}`}, retrying once in ${pause} ms`);
    await ctx.wait(pause);
    res = await ctx.fetch(url, options);
  }
  if (!res.ok) throw new Error(`GitHub API ${path}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// The one reader of the milestone runs, for the proof CLI and milestone-due. It reads the repo's run
// list on main, which answers even when the workflow file is not on main yet (a per-workflow
// endpoint would 404), and keeps the dispatched runs of the milestone file. Only the first page is
// read: 100 runs, newest first. A pull_request run of the file proves nothing about main, so the
// event filter drops it.
export async function milestoneRuns(opts) {
  const body = await api(session(opts), "actions/runs?branch=main&event=workflow_dispatch&per_page=100");
  return body.workflow_runs
    .filter((r) => String(r.path).split("@")[0] === MILESTONE_FILE)
    .map((r) => ({
      status: r.status,
      conclusion: r.conclusion,
      headSha: r.head_sha,
      createdAt: r.created_at,
      runAttempt: r.run_attempt,
      runStartedAt: r.run_started_at,
    }));
}

function envSession() {
  return session({ repo: need("GITHUB_REPOSITORY"), token: need("GITHUB_TOKEN") });
}

// The milestone-proof job: fails a pull request or a push until the milestone run on main passed.
async function proof() {
  const verdict = proofVerdict({ runs: await milestoneRuns(envSession()), now: Date.now() });
  const line = `milestone-proof: ${verdict.pass ? "pass" : "fail"}: ${verdict.reason}`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  if (!verdict.pass) process.exitCode = 1;
}

async function cli(argv) {
  if (argv[0] === "proof") return proof();
  const at = argv.indexOf("--native-paths");
  if (at < 0 || !argv[at + 1]) throw new Error("usage: milestone-due.mjs --native-paths <file>");
  // The file is a grep -E regex that JS reads the same: no lookaround, no backreference.
  const nativeRe = new RegExp(readFileSync(argv[at + 1], "utf8").trim());
  const ref = need("GITHUB_REF_NAME");
  const ctx = envSession();
  const runs = await milestoneRuns(ctx);

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
    await api(ctx, "actions/workflows/milestone.yml/dispatches", {
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
