// Cases for scripts/milestone-due.mjs, which says whether the full Swift suite is due at a
// milestone. The function is pure. Its input is the milestone runs on main, newest first,
// and the count of native merges since the newest successful run. It proves:
//   N is 3;
//   no run ever -> due;
//   a queued or in-progress newest run -> not due, whatever the count;
//   count below N -> not due; count at N -> due;
//   newest run failed or timed out with one merge -> due; with no merge -> not due;
//   newest run cancelled -> not a failure;
//   a success run resets: an older failure does not make it due.
//
// Run: npm run test:milestone-due. Exits 1 on any failure. A missing script fails once.

let milestoneDue;
let N;
try {
  ({ milestoneDue, N } = await import("../scripts/milestone-due.mjs"));
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

const SHA = "a".repeat(40);
const done = (conclusion) => ({ status: "completed", conclusion, headSha: SHA });
const queued = { status: "queued", conclusion: null, headSha: SHA };
const inProgress = { status: "in_progress", conclusion: null, headSha: SHA };
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
  ["newest run queued, five merges, past N", [queued, S], 5, false],
  ["newest run in progress, after a failure, five merges", [inProgress, F], 5, false],
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

if (failures) {
  console.log(`milestone-due: ${failures} failure(s)`);
  process.exit(1);
}
console.log("milestone-due: all green");
