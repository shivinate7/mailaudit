// Cases for scripts/milestone-due.mjs, which says whether the full Swift suite is due at a
// milestone, and which sha the native-merge count starts from. Both functions are pure.
//
// milestoneDue takes the milestone runs on main, newest first, and the count of native merges
// since the base. It proves:
//   N is 3;
//   no run ever -> due;
//   a queued or in-progress newest run -> not due, whatever the count;
//   count below N -> not due; count at N -> due;
//   newest run failed or timed out with one merge -> due; with no merge -> not due;
//   newest run cancelled -> not a failure;
//   a success run resets: an older failure does not make it due.
//
// countBase takes the same runs and returns the sha the count starts from, or null to count
// all. It proves:
//   no run -> null; a queued or in-progress run is skipped when choosing;
//   the newest completed run failed or timed out -> its sha, even with an older success;
//   otherwise the newest successful run's sha; a cancelled run is not a failure;
//   only cancelled, queued or in-progress runs -> null.
//
// proofVerdict takes the milestone runs on main, newest first (createdAt is an ISO string), the
// time now (epoch ms) and staleMinutes. It returns { pass, reason }. It proves:
//   no run at all -> pass, with the reason "no milestone run yet";
//   newest judged run succeeded -> pass; failure, timed_out, cancelled, neutral, skipped -> fail;
//   a newer success over an older failure passes; a newer failure over an older success fails;
//   a queued or in-progress run younger than staleMinutes is skipped, and the next run judged;
//   fresh runs over a success pass; a fresh in-progress run over a failure fails;
//   a queued or in-progress run older than staleMinutes -> fail, reason "not taken";
//   staleMinutes is the cut-off when given, and 90 when omitted;
//   an in-flight run with runAttempt above 1 is never skipped: fail, "re-run ... no proof yet";
//   staleness reads runStartedAt when the run has one, and createdAt when it does not;
//   a completed re-run that succeeded passes.
//
// Run: npm run test:milestone-due. Exits 1 on any failure. A missing script fails once.

let milestoneDue;
let N;
let countBase;
let proofVerdict;
let milestoneRuns;
try {
  ({ milestoneDue, N, countBase, proofVerdict, milestoneRuns } = await import("../scripts/milestone-due.mjs"));
} catch (e) {
  console.log(`FAIL scripts/milestone-due.mjs cannot be loaded (${e.code ?? e.message})`);
  process.exit(1);
}

let failures = 0;
function expect(label, cond, detail = "") {
  if (cond) {
    console.log(`ok   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ""}`);
  }
}

const sha = (c) => c.repeat(40);
const SHA = sha("a");
// The clock for proofVerdict. ago(m) is a createdAt m minutes before it.
const NOW = Date.parse("2026-11-01T19:00:00Z");
const ago = (minutes) => new Date(NOW - minutes * 60_000).toISOString();
const done = (conclusion, headSha = SHA, createdAt) => ({ status: "completed", conclusion, headSha, createdAt });
const queued = (headSha = SHA, createdAt) => ({ status: "queued", conclusion: null, headSha, createdAt });
const inProgress = (headSha = SHA, createdAt) => ({ status: "in_progress", conclusion: null, headSha, createdAt });
const S = done("success");
const F = done("failure");
const T = done("timed_out");
const C = done("cancelled");

expect("N is 3", N === 3, `N is ${JSON.stringify(N)}`);

// [label, runs newest first, nativeMerges, due expected]
const CASES = [
  ["no run ever, no merge", [], 0, true],
  ["last run succeeded, two merges, below N", [S], 2, false],
  ["last run succeeded, three merges, at N", [S], 3, true],
  ["newest run queued, five merges, past N", [queued(), S], 5, false],
  ["newest run in progress, after a failure, five merges", [inProgress(), F], 5, false],
  ["last run failed, one merge", [F], 1, true],
  ["last run failed, no merge", [F], 0, false],
  ["last run timed out, one merge", [T], 1, true],
  ["last run cancelled, one merge", [C], 1, false],
  ["a success resets an older failure", [S, F], 1, false],
];

for (const [label, runs, nativeMerges, want] of CASES) {
  const got = milestoneDue({ runs, nativeMerges, n: N });
  const okShape = got !== null && typeof got === "object" && typeof got.reason === "string" && got.reason !== "";
  expect(`${label}: due is ${want}`, okShape && got.due === want, `got ${JSON.stringify(got)}`);
}

// [label, runs newest first, the sha countBase must return, or null to count all]
const BASE_CASES = [
  ["no run ever: count all", [], null],
  ["the newest run succeeded: its sha", [done("success", sha("a"))], sha("a")],
  [
    "the newest run failed: its sha, not the older success",
    [done("failure", sha("b")), done("success", sha("a"))],
    sha("b"),
  ],
  [
    "the newest run timed out: its sha, not the older success",
    [done("timed_out", sha("b")), done("success", sha("a"))],
    sha("b"),
  ],
  ["a failure with no success below it: its sha", [done("failure", sha("b"))], sha("b")],
  ["two failures: the newest one", [done("failure", sha("b")), done("failure", sha("c"))], sha("b")],
  [
    "a queued run above a failure is skipped: the failure's sha",
    [queued(sha("d")), done("failure", sha("b")), done("success", sha("a"))],
    sha("b"),
  ],
  [
    "an in-progress run above a success is skipped: the success's sha",
    [inProgress(sha("d")), done("success", sha("a"))],
    sha("a"),
  ],
  [
    "an in-progress run above a failure is skipped: the failure's sha",
    [inProgress(sha("d")), done("failure", sha("b")), done("success", sha("a"))],
    sha("b"),
  ],
  [
    "a success above an older failure: the success's sha",
    [done("success", sha("a")), done("failure", sha("b"))],
    sha("a"),
  ],
  [
    "a cancelled run is not a failure: the newest success's sha",
    [done("cancelled", sha("b")), done("success", sha("a"))],
    sha("a"),
  ],
  [
    "a cancelled run above a failure: the success's sha, since a cancel is not a failure",
    [done("cancelled", sha("b")), done("failure", sha("c")), done("success", sha("a"))],
    sha("a"),
  ],
  ["a cancelled run with no success: count all", [done("cancelled", sha("b"))], null],
  ["only queued and in-progress runs: count all", [queued(sha("d")), inProgress(sha("c"))], null],
];

expect(
  "countBase is exported as a function",
  typeof countBase === "function",
  `the export is ${typeof countBase}`
);
for (const [label, runs, want] of BASE_CASES) {
  let got;
  if (typeof countBase !== "function") {
    got = "no countBase export";
  } else {
    try {
      got = countBase(runs);
    } catch (e) {
      got = `threw ${e.message}`;
    }
  }
  expect(`countBase: ${label}`, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

// proofVerdict cases. Runs are newest first; ago(m) is how many minutes old each run is. A case
// with no staleMinutes uses the default. A reason of a RegExp must match; a string must be exact.
const PROOF_CASES = [
  { label: "no run at all: pass, with the bootstrap reason", runs: [], pass: true, reason: "no milestone run yet" },
  { label: "newest run succeeded: pass", runs: [done("success", SHA, ago(300))], pass: true },
  { label: "newest run failed: fail", runs: [done("failure", SHA, ago(300))], pass: false },
  { label: "newest run timed out: fail", runs: [done("timed_out", SHA, ago(300))], pass: false },
  { label: "newest run cancelled: fail", runs: [done("cancelled", SHA, ago(300))], pass: false },
  { label: "newest run neutral: fail, since only success passes", runs: [done("neutral", SHA, ago(300))], pass: false },
  { label: "newest run skipped: fail", runs: [done("skipped", SHA, ago(300))], pass: false },
  {
    label: "a newer success over an older failure: pass",
    runs: [done("success", SHA, ago(10)), done("failure", SHA, ago(300))],
    pass: true,
  },
  {
    label: "a newer failure over an older success: fail",
    runs: [done("failure", SHA, ago(10)), done("success", SHA, ago(300))],
    pass: false,
  },
  {
    label: "a fresh in-progress run over a success: pass",
    runs: [inProgress(SHA, ago(10)), done("success", SHA, ago(300))],
    pass: true,
  },
  {
    label: "a fresh in-progress run over a failure: fail",
    runs: [inProgress(SHA, ago(10)), done("failure", SHA, ago(300))],
    pass: false,
  },
  {
    label: "a fresh queued run over a success: pass",
    runs: [queued(SHA, ago(5)), done("success", SHA, ago(300))],
    pass: true,
  },
  {
    label: "two fresh runs over a success: pass",
    runs: [queued(SHA, ago(5)), inProgress(SHA, ago(20)), done("success", SHA, ago(300))],
    pass: true,
  },
  {
    label: "a stale queued run over a success: fail, not taken",
    runs: [queued(SHA, ago(120)), done("success", SHA, ago(300))],
    pass: false,
    reason: /not taken/,
  },
  {
    label: "a stale in-progress run over a success: fail, not taken",
    runs: [inProgress(SHA, ago(120)), done("success", SHA, ago(300))],
    pass: false,
    reason: /not taken/,
  },
  {
    label: "staleMinutes 10: a 15-minute queued run is stale, so fail",
    runs: [queued(SHA, ago(15)), done("success", SHA, ago(300))],
    staleMinutes: 10,
    pass: false,
    reason: /not taken/,
  },
  {
    label: "staleMinutes omitted: the same 15-minute queued run is skipped, so pass",
    runs: [queued(SHA, ago(15)), done("success", SHA, ago(300))],
    pass: true,
  },
  {
    label: "staleMinutes omitted: an 89-minute queued run is skipped, so pass",
    runs: [queued(SHA, ago(89)), done("success", SHA, ago(300))],
    pass: true,
  },
  {
    label: "staleMinutes omitted: a 91-minute queued run is stale, so fail",
    runs: [queued(SHA, ago(91)), done("success", SHA, ago(300))],
    pass: false,
    reason: /not taken/,
  },
  // Re-runs. A run with runAttempt above 1 is a re-run of a run that failed, so its createdAt is
  // old and its result is not in yet. An in-flight re-run is never skipped. A run's staleness reads
  // runStartedAt when the run has one, and createdAt when it does not.
  {
    label: "a re-run in flight (attempt 2, 30 minutes old) over a success: fail, no proof yet",
    runs: [{ ...inProgress(SHA, ago(30)), runAttempt: 2 }, done("success", SHA, ago(300))],
    pass: false,
    reason: /re-run/,
  },
  {
    label: "a re-run in flight (attempt 2, fresh by createdAt and runStartedAt) over a success: fail",
    runs: [
      { ...inProgress(SHA, ago(5)), runAttempt: 2, runStartedAt: ago(5) },
      done("success", SHA, ago(300)),
    ],
    pass: false,
    reason: /re-run/,
  },
  {
    label: "a queued re-run (attempt 2, 5 minutes old) over a success: fail, no proof yet",
    runs: [{ ...queued(SHA, ago(5)), runAttempt: 2 }, done("success", SHA, ago(300))],
    pass: false,
    reason: /re-run/,
  },
  {
    label: "a re-run in flight (attempt 2, 30 minutes old) alone: fail, no proof yet",
    runs: [{ ...inProgress(SHA, ago(30)), runAttempt: 2 }],
    pass: false,
    reason: /re-run/,
  },
  {
    label: "a first attempt fresh by runStartedAt, though createdAt is 300 minutes old: skipped, pass",
    runs: [{ ...inProgress(SHA, ago(300)), runAttempt: 1, runStartedAt: ago(30) }, done("success", SHA, ago(600))],
    pass: true,
  },
  {
    label: "a first attempt stale by runStartedAt, though createdAt is 5 minutes old: fail, not taken",
    runs: [{ ...inProgress(SHA, ago(5)), runAttempt: 1, runStartedAt: ago(120) }, done("success", SHA, ago(600))],
    pass: false,
    reason: /not taken/,
  },
  {
    label: "a completed re-run that succeeded (attempt 2): pass",
    runs: [{ ...done("success", SHA, ago(300)), runAttempt: 2 }],
    pass: true,
  },
];

expect(
  "proofVerdict is exported as a function",
  typeof proofVerdict === "function",
  `the export is ${typeof proofVerdict}`
);
for (const c of PROOF_CASES) {
  let got;
  if (typeof proofVerdict !== "function") {
    got = "no proofVerdict export";
  } else {
    try {
      got = proofVerdict({ runs: c.runs, now: NOW, staleMinutes: c.staleMinutes });
    } catch (e) {
      got = `threw ${e.message}`;
    }
  }
  const shaped = got !== null && typeof got === "object" && typeof got.reason === "string" && got.reason !== "";
  const reasonOk =
    c.reason === undefined ||
    (typeof c.reason === "string" ? got?.reason === c.reason : c.reason.test(got?.reason ?? ""));
  expect(
    `proofVerdict: ${c.label}`,
    shaped && got.pass === c.pass && reasonOk,
    `got ${JSON.stringify(got)}, want pass ${c.pass}${c.reason ? ` with reason ${c.reason}` : ""}`
  );
}

// The run reader, end to end. milestoneRuns({ repo, token, fetch, wait }) reads the milestone runs
// on main through the fetch it is given, so no case touches the network. wait is the pause before a
// retry, and the cases pass a no-op. Each stub answer is a response object, or an Error to throw.
// It proves:
//   (a) one GET to /repos/<repo>/actions/runs?branch=main&event=workflow_dispatch, and it keeps
//       only the runs whose path is .github/workflows/milestone.yml;
//   (b) run_attempt, run_started_at and created_at map to runAttempt, runStartedAt and createdAt;
//   (c) one thrown network error on the GET is retried, and the retry succeeds; two throws reject;
//   (d) an attempt-2 in-flight run read this way makes proofVerdict fail.
const REPO = "owner/mail-ledger";
const RUNS_PATH = `/repos/${REPO}/actions/runs`;
const MILESTONE_PATH = ".github/workflows/milestone.yml";
const apiRun = (over) => ({
  status: "completed",
  conclusion: "success",
  head_sha: SHA,
  created_at: ago(300),
  run_started_at: ago(300),
  run_attempt: 1,
  path: MILESTONE_PATH,
  ...over,
});
const okJson = (body) => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => body });
// Records each call. Answers are used in order, and the last one repeats if the reader asks again.
function stubFetch(answers) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? "GET" });
    const answer = answers[Math.min(calls.length, answers.length) - 1];
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { fetch, calls };
}
async function readRuns(answers) {
  const stub = stubFetch(answers);
  if (typeof milestoneRuns !== "function") return { err: "no milestoneRuns export", calls: stub.calls };
  try {
    const runs = await milestoneRuns({ repo: REPO, token: "test-token", fetch: stub.fetch, wait: async () => {} });
    return { runs, calls: stub.calls };
  } catch (e) {
    return { err: e, calls: stub.calls };
  }
}

// (a) The endpoint, the filter by path.
{
  const body = {
    workflow_runs: [
      apiRun({ created_at: ago(42), head_sha: sha("c") }),
      apiRun({ path: ".github/workflows/checks.yml", head_sha: sha("d") }),
      apiRun({ path: ".github/workflows/milestone-old.yml", head_sha: sha("e") }),
    ],
  };
  const { runs, err, calls } = await readRuns([okJson(body)]);
  const url = calls.length > 0 ? new URL(calls[0].url) : undefined;
  expect(
    "reader (a): one GET, to the list endpoint on main for dispatched runs",
    calls.length === 1 &&
      calls[0].method === "GET" &&
      url !== undefined &&
      url.hostname === "api.github.com" &&
      url.pathname === RUNS_PATH &&
      url.searchParams.get("branch") === "main" &&
      url.searchParams.get("event") === "workflow_dispatch",
    `calls: ${calls.map((c) => `${c.method} ${c.url}`).join("; ") || "none"}`
  );
  expect(
    "reader (a): keeps only the runs whose path is .github/workflows/milestone.yml",
    !err && Array.isArray(runs) && runs.length === 1 && runs[0].createdAt === ago(42),
    `err ${String(err)}; kept ${JSON.stringify(runs)}`
  );
}

// (b) The field mapping.
{
  const body = {
    workflow_runs: [
      apiRun({ status: "in_progress", conclusion: null, run_attempt: 3, run_started_at: ago(40), created_at: ago(42) }),
    ],
  };
  const { runs, err } = await readRuns([okJson(body)]);
  const r = Array.isArray(runs) ? runs[0] : undefined;
  expect(
    "reader (b): run_attempt, run_started_at and created_at map to runAttempt, runStartedAt and createdAt",
    !err &&
      r !== undefined &&
      r.status === "in_progress" &&
      r.runAttempt === 3 &&
      r.runStartedAt === ago(40) &&
      r.createdAt === ago(42),
    `err ${String(err)}; got ${JSON.stringify(r)}`
  );
}

// (c) The retry on a thrown network error.
{
  const body = { workflow_runs: [apiRun({})] };
  const once = await readRuns([new TypeError("fetch failed"), okJson(body)]);
  expect(
    "reader (c): one thrown network error on the GET is retried, and the retry succeeds",
    !once.err && Array.isArray(once.runs) && once.runs.length === 1 && once.calls.length === 2,
    `err ${String(once.err)}; GETs ${once.calls.length}`
  );
  const twice = await readRuns([new TypeError("fetch failed"), new TypeError("fetch failed")]);
  expect(
    "reader (c): two thrown network errors reject, after exactly two GETs",
    twice.err !== undefined && twice.calls.length === 2,
    `err ${String(twice.err)}; GETs ${twice.calls.length}`
  );
}

// (d) An attempt-2 in-flight run, read through the stub, fails the proof. The run is fresh by both
// timestamps, so only the re-run rule can fail it. An older success sits below it.
{
  const body = {
    workflow_runs: [
      apiRun({ status: "in_progress", conclusion: null, run_attempt: 2, run_started_at: ago(5), created_at: ago(5) }),
      apiRun({ created_at: ago(900) }),
    ],
  };
  const { runs, err } = await readRuns([okJson(body)]);
  const verdict = err === undefined && typeof proofVerdict === "function" ? proofVerdict({ runs, now: NOW }) : undefined;
  expect(
    "reader (d): an attempt-2 in-flight run read this way makes proofVerdict fail, as a re-run",
    verdict !== undefined && verdict.pass === false && /re-run/.test(verdict.reason),
    `err ${String(err)}; verdict ${JSON.stringify(verdict)}`
  );
}

if (failures) {
  console.log(`milestone-due: ${failures} failure(s)`);
  process.exit(1);
}
console.log("milestone-due: all green");
