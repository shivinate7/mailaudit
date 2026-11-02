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
// Run: npm run test:milestone-due. Exits 1 on any failure. A missing script fails once.

let milestoneDue;
let N;
let countBase;
try {
  ({ milestoneDue, N, countBase } = await import("../scripts/milestone-due.mjs"));
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
const done = (conclusion, headSha = SHA) => ({ status: "completed", conclusion, headSha });
const queued = (headSha = SHA) => ({ status: "queued", conclusion: null, headSha });
const inProgress = (headSha = SHA) => ({ status: "in_progress", conclusion: null, headSha });
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

if (failures) {
  console.log(`milestone-due: ${failures} failure(s)`);
  process.exit(1);
}
console.log("milestone-due: all green");
