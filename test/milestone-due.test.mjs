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
// gateVerdict takes the milestone runs on main, newest first (createdAt is an ISO string), the
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
let gateVerdict;
try {
  ({ milestoneDue, N, countBase, gateVerdict } = await import("../scripts/milestone-due.mjs"));
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
// The clock for gateVerdict. ago(m) is a createdAt m minutes before it.
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

// gateVerdict cases. Runs are newest first; ago(m) is how many minutes old each run is. A case
// with no staleMinutes uses the default. A reason of a RegExp must match; a string must be exact.
const GATE_CASES = [
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
  "gateVerdict is exported as a function",
  typeof gateVerdict === "function",
  `the export is ${typeof gateVerdict}`
);
for (const c of GATE_CASES) {
  let got;
  if (typeof gateVerdict !== "function") {
    got = "no gateVerdict export";
  } else {
    try {
      got = gateVerdict({ runs: c.runs, now: NOW, staleMinutes: c.staleMinutes });
    } catch (e) {
      got = `threw ${e.message}`;
    }
  }
  const shaped = got !== null && typeof got === "object" && typeof got.reason === "string" && got.reason !== "";
  const reasonOk =
    c.reason === undefined ||
    (typeof c.reason === "string" ? got?.reason === c.reason : c.reason.test(got?.reason ?? ""));
  expect(
    `gateVerdict: ${c.label}`,
    shaped && got.pass === c.pass && reasonOk,
    `got ${JSON.stringify(got)}, want pass ${c.pass}${c.reason ? ` with reason ${c.reason}` : ""}`
  );
}

if (failures) {
  console.log(`milestone-due: ${failures} failure(s)`);
  process.exit(1);
}
console.log("milestone-due: all green");
