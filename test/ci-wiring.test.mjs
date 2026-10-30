// Cases for the CI wiring of the all-jobs-passed rollup and its required check.
//
// The rollup is the one check branch protection requires, so it must report on
// every run that should pass. These checks read .github/workflows/test.yml and
// .github/stamp.json. They prove:
//   1  the rollup job exists with no name key, so its check name is its id;
//   2  its job-level if: is exactly always() && !github.event.pull_request.draft;
//   3a its step pins the shared action to a 40-hex sha;
//   3b its with: needs is ${{ toJSON(needs) }};
//   3c every other claude-settings pin in the file has the rollup's sha;
//   4  its needs are every other job except ci-done;
//   5  no job it needs has a job-level if: with github.event_name or .outputs.;
//   6  the stamp's merge.requiredChecks is exactly ["all-jobs-passed"];
//   7  every job, ci-done included, has !github.event.pull_request.draft in its
//      job-level if:, so a draft starts no runner;
//   8  the screens job needs scope, and its job-level if: reads no .outputs.
//
// No YAML library is in node_modules, and none may be added. The workflow is read as
// text by indentation: jobs sit under jobs: at 2 spaces, job keys at 4, step keys at 8.
// A # starts a comment only after a space and outside a quoted scalar. A quote starts a
// scalar only where a YAML value or list item starts. A run: | block is text, not steps.
//
// Scanner cases: the good fixture holds a quoted if: with a comment opener inside the
// quotes, a lone apostrophe before a comment, and a run: | block with a fake pin. The
// red fixtures hide a forbidden word after a quoted comment opener and after a lone
// apostrophe. A scanner that cuts at any # goes green on a red case it must catch.
//
// Run: npm run test:ci-wiring. Exits 1 on any failure. CI_WORKFLOW and CI_STAMP name
// other files; a relative path resolves from the repo root.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = resolve(ROOT, process.env.CI_WORKFLOW || ".github/workflows/test.yml");
const STAMP = resolve(ROOT, process.env.CI_STAMP || ".github/stamp.json");

const ROLLUP = "all-jobs-passed";
const CI_DONE = "ci-done";
const ACTIONS = "shivinate7/claude-settings/actions/";
const ROLLUP_IF = "always() && !github.event.pull_request.draft";
const DRAFT_GUARD = "!github.event.pull_request.draft";
// A needed job may read the draft guard, since a draft run skips it on purpose. An
// event name or a job output in its job-level if: skips a run that should pass.
const FORBIDDEN_IF = ["github.event_name", ".outputs."];
const SHA = /^[0-9a-f]{40}$/;
const KEY = /^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/;
const BLOCK = /^[|>][-+0-9]*$/;
const isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const steps = (job) => (isMap(job) && Array.isArray(job.steps) ? job.steps.filter(isMap) : []);
const ifText = (job) => (isMap(job) && job.if != null ? String(job.if) : "");
const needsOf = (job) => {
  const v = isMap(job) ? job.needs : undefined;
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
};

// A # starts a comment only after a space and outside a quoted scalar. A quote starts
// a scalar only where a YAML value or list item starts, so a lone apostrophe in plain
// text (don't) does not open one.
function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) {
        if (quote === "'" && line[i + 1] === "'") i++;
        else quote = null;
      }
      continue;
    }
    if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
    if ((c === '"' || c === "'") && /(^|[:[,-])\s*$/.test(line.slice(0, i))) quote = c;
  }
  return line;
}

// Reads the workflow subset: mappings, lists, flow lists, quoted and plain scalars,
// and block scalars (skipped as text). Anything else throws, so a shape the checks do
// not understand fails loudly instead of passing by accident.
function parseWorkflow(text) {
  const lines = text.split(/\r?\n/).map((raw) => ({
    raw,
    n: raw.length - raw.trimStart().length,
    t: stripComment(raw).trim(),
  }));
  let p = 0;
  const skip = () => {
    while (p < lines.length && lines[p].t === "") p++;
  };
  const isItem = (t) => t === "-" || t.startsWith("- ");

  function unquote(s) {
    const q = s[0];
    if ((q === '"' || q === "'") && s.length >= 2 && s.endsWith(q)) {
      const body = s.slice(1, -1);
      return q === "'" ? body.replaceAll("''", "'") : body;
    }
    return s;
  }
  function scalar(s) {
    if (s.startsWith("[") && s.endsWith("]")) {
      const inner = s.slice(1, -1).trim();
      return inner === "" ? [] : inner.split(",").map((x) => unquote(x.trim()));
    }
    return unquote(s);
  }
  // A block scalar's lines are blank or indented past the key that opened it.
  function skipBlock(n) {
    while (p < lines.length) {
      const { raw } = lines[p];
      if (raw.trim() !== "" && raw.length - raw.trimStart().length <= n) break;
      p++;
    }
  }
  function child(n, itemsAtSameIndent) {
    skip();
    if (p >= lines.length) return null;
    const { n: m, t } = lines[p];
    if (m > n || (itemsAtSameIndent && m === n && isItem(t))) return block(m);
    return null;
  }
  function block(n) {
    skip();
    return isItem(lines[p].t) ? seq(n) : map(n);
  }
  function map(n) {
    const out = {};
    for (;;) {
      skip();
      if (p >= lines.length || lines[p].n !== n || isItem(lines[p].t)) return out;
      const m = KEY.exec(lines[p].t);
      if (!m) throw new Error(`line ${p + 1} is not a key: ${lines[p].raw.trim()}`);
      if (Object.hasOwn(out, m[1])) throw new Error(`line ${p + 1} repeats key ${m[1]}`);
      const rest = m[2] ?? "";
      p++;
      if (rest === "") out[m[1]] = child(n, true);
      else if (BLOCK.test(rest)) {
        skipBlock(n);
        out[m[1]] = "";
      } else out[m[1]] = scalar(rest);
    }
  }
  function seq(n) {
    const out = [];
    for (;;) {
      skip();
      if (p >= lines.length || lines[p].n !== n || !isItem(lines[p].t)) return out;
      const line = lines[p];
      const rest = line.t.slice(1).trimStart();
      if (rest === "") {
        p++;
        out.push(child(n, false));
      } else if (KEY.test(rest)) {
        // The first key of a list item sits where the text after "- " starts.
        lines[p] = { ...line, n: n + line.t.length - rest.length, t: rest };
        out.push(map(lines[p].n));
      } else {
        p++;
        out.push(scalar(rest));
      }
    }
  }

  skip();
  const doc = p < lines.length ? map(lines[p].n) : {};
  skip();
  if (p < lines.length) {
    throw new Error(`line ${p + 1} is not reached by the parser: ${lines[p].raw.trim()}`);
  }
  return doc;
}

function workflowChecks(text) {
  const out = [];
  const add = (id, what, ok, detail = "") =>
    out.push({ id, label: `${id} ${what}`, ok: Boolean(ok), detail });

  if (text === null) {
    add("0", "workflow file is readable", false, "no readable file");
    return out;
  }
  let doc;
  try {
    doc = parseWorkflow(text);
  } catch (e) {
    add("0", "workflow parses in the indentation subset", false, e.message);
    return out;
  }

  const jobs = isMap(doc.jobs) ? doc.jobs : {};
  const ids = Object.keys(jobs);
  const roll = Object.hasOwn(jobs, ROLLUP) && isMap(jobs[ROLLUP]) ? jobs[ROLLUP] : undefined;

  add(
    "1",
    `rollup job ${ROLLUP} exists with no name key`,
    roll && !Object.hasOwn(roll, "name"),
    !roll ? "no job with that id" : Object.hasOwn(roll, "name") ? "it has a name key" : ""
  );

  const ifRaw = roll?.if;
  const ifNorm =
    typeof ifRaw === "string"
      ? ifRaw.trim().replace(/^\$\{\{([\s\S]*)\}\}$/, "$1").replace(/\s+/g, "")
      : null;
  add(
    "2",
    `rollup job-level if: is exactly "${ROLLUP_IF}", bare or in a \${{ }} wrapper, spacing ignored`,
    ifNorm === ROLLUP_IF.replace(/\s+/g, ""),
    `if: is ${JSON.stringify(ifRaw ?? null)}`
  );

  const rollPin = ACTIONS + ROLLUP + "@";
  const rollStep = steps(roll).find((s) => typeof s.uses === "string" && s.uses.startsWith(rollPin));
  const rollUses = rollStep?.uses;
  const rollSha = rollUses === undefined ? undefined : rollUses.slice(rollPin.length);
  add(
    "3a",
    `rollup step uses ${ACTIONS}${ROLLUP} pinned to a 40-hex sha`,
    rollSha !== undefined && SHA.test(rollSha),
    `uses is ${JSON.stringify(rollUses ?? null)}`
  );

  const withNeeds = isMap(rollStep?.with) ? rollStep.with.needs : undefined;
  add(
    "3b",
    "rollup step with: needs is ${{ toJSON(needs) }}",
    typeof withNeeds === "string" && withNeeds.replace(/\s+/g, "") === "${{toJSON(needs)}}",
    `with.needs is ${JSON.stringify(withNeeds ?? null)}`
  );

  const others = [];
  for (const id of ids) {
    for (const s of steps(jobs[id])) {
      if (typeof s.uses === "string" && s.uses.startsWith(ACTIONS) && s !== rollStep) {
        others.push({ id, uses: s.uses });
      }
    }
  }
  const off = others.filter((o) => o.uses.split("@")[1] !== rollSha);
  add(
    "3c",
    "every other claude-settings pin has the rollup's sha",
    rollSha !== undefined && off.length === 0,
    rollSha === undefined ? "no rollup sha to compare" : off.map((o) => `${o.id} ${o.uses}`).join("; ")
  );

  // Assertions 5 and 8 check the set assertion 4 names, so they still bite when the
  // rollup is missing or short.
  const expected = ids.filter((id) => id !== ROLLUP && id !== CI_DONE).sort();
  const needs = needsOf(roll);
  const missing = expected.filter((id) => !needs.includes(id));
  const extra = needs.filter((id) => !expected.includes(id));
  const dup = needs.length !== new Set(needs).size;
  add(
    "4",
    `rollup needs are every other job except ${CI_DONE}`,
    roll && missing.length === 0 && extra.length === 0 && !dup,
    `missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}` +
      (dup ? "; a job is listed twice" : "")
  );

  const badIfs = [];
  for (const id of expected) {
    const cond = ifText(jobs[id]);
    for (const frag of FORBIDDEN_IF) if (cond.includes(frag)) badIfs.push(`${id} if: has ${frag}`);
  }
  add(
    "5",
    "no job the rollup needs has a job-level if: with an event name or an output",
    badIfs.length === 0,
    badIfs.join("; ")
  );

  const noGuard = ids.filter((id) => !ifText(jobs[id]).replace(/\s+/g, "").includes(DRAFT_GUARD));
  add(
    "7",
    `every job, ${CI_DONE} included, has ${DRAFT_GUARD} in its job-level if:`,
    noGuard.length === 0,
    `no draft guard: ${noGuard.join(", ") || "none"}`
  );

  const screens = jobs.screens;
  const screensIf = ifText(screens);
  add(
    "8",
    `screens job needs scope and its job-level if: reads no .outputs.`,
    isMap(screens) && needsOf(screens).includes("scope") && !screensIf.includes(".outputs."),
    `needs: ${JSON.stringify(needsOf(screens))}; if: ${JSON.stringify(screensIf)}`
  );
  return out;
}

function stampCheck(text) {
  const label = `6 stamp merge.requiredChecks is exactly ["${ROLLUP}"]`;
  if (text === null) return [{ id: "6", label, ok: false, detail: "no readable stamp file" }];
  let stamp;
  try {
    stamp = JSON.parse(text);
  } catch (e) {
    return [{ id: "6", label, ok: false, detail: `not JSON: ${e.message}` }];
  }
  const got = stamp?.merge?.requiredChecks;
  return [
    {
      id: "6",
      label,
      ok: JSON.stringify(got) === JSON.stringify([ROLLUP]),
      detail: `requiredChecks is ${JSON.stringify(got ?? null)}`,
    },
  ];
}

// Each result is { id, label, ok, detail }. The ids are the assertion numbers above.
function checkAll(workflowText, stampText) {
  return [...workflowChecks(workflowText), ...stampCheck(stampText)].sort(
    (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10) || a.id.localeCompare(b.id)
  );
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

const readOrNull = (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

// The repo's own files.
{
  const wf = readOrNull(WORKFLOW);
  const st = readOrNull(STAMP);
  if (wf === null) expect(`cannot read ${WORKFLOW}`, false);
  if (st === null) expect(`cannot read ${STAMP}`, false);
  for (const r of checkAll(wf, st)) expect(r.label, r.ok, r.detail);
}

// Self-test. Fixture text is built from arrays, not template literals, so the YAML
// ${{ }} expressions are never read as JS interpolation.
const ACTION_PIN = "1cc47f015bdaf073d8cb0f043a988c28d09aa3e1";
const NEEDS = ["suite", "screens", "scope", "native", "zizmor", "ste-lint"];
const DRAFT_IF = "    if: ${{ !github.event.pull_request.draft }}";
const NATIVE_IF =
  "    if: ${{ !cancelled() && needs.suite.result == 'success' && !github.event.pull_request.draft }} don't # github.event_name is only a comment here";
const STE_IF =
  "    if: \"${{ needs.suite.result == 'success' && !github.event.pull_request.draft && github.ref != 'refs/heads/x # y' }}\"";
const STE_IF_NO_DRAFT =
  "    if: \"${{ needs.suite.result == 'success' && github.ref != 'refs/heads/x # y' }}\"";
const STE_IF_RED =
  "    if: \"${{ needs.suite.result == 'success' && !github.event.pull_request.draft && github.ref != 'refs/heads/x # y' && github.event_name == 'push' }}\"";

const PRE_TEXT =
  [
    "name: test",
    "on:",
    "  push:",
    "    branches: [main]",
    "  pull_request:",
    "    branches: [main]",
    "    # ready_for_review starts the native job once a draft is marked ready.",
    "    types: [opened, synchronize, reopened, ready_for_review]",
    "permissions:",
    "  contents: read",
    "jobs:",
    "  suite:",
    "    runs-on: ubuntu-latest",
    DRAFT_IF,
    "    steps:",
    "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
    "        with:",
    "          persist-credentials: false",
    "      # A run block is text: the fake pin and the lone apostrophe below are not steps.",
    "      - name: block scalar text is not a step",
    "        run: |",
    "          # uses: shivinate7/claude-settings/actions/all-jobs-passed@main",
    "          echo \"don't read this line as a pin or a step\"",
    "      - run: npm test",
    "  scope:",
    "    runs-on: ubuntu-latest",
    DRAFT_IF,
    "    outputs:",
    "      native: ${{ steps.d.outputs.native }}",
    "    steps:",
    "      - id: d",
    "        run: echo \"native=true\" >> \"$GITHUB_OUTPUT\"",
    "  screens:",
    "    needs: scope",
    DRAFT_IF,
    "    runs-on: macos-26",
    "    steps:",
    "      - name: path scope is step-level",
    "        if: ${{ needs.scope.outputs.native == 'true' }}",
    "        run: npm run check:screens",
    "  native:",
    "    needs: [suite, scope]",
    NATIVE_IF,
    "    runs-on: macos-26",
    "    steps:",
    "      - name: skip on a draft at step level",
    "        if: ${{ !github.event.pull_request.draft }}",
    "        run: swift test --package-path native/ManifestKit",
    "  zizmor:",
    "    runs-on: ubuntu-latest",
    DRAFT_IF,
    "    steps:",
    "      - uses: zizmorcore/zizmor-action@85b2b9fb8e3325e7a23d7d0a9d7ba5ae0f999e3e # v0.7.1",
    "  ste-lint:",
    "    needs: suite",
    STE_IF,
    "    runs-on: ubuntu-latest",
    "    steps:",
    `      - uses: ${ACTIONS}ste-lint@${ACTION_PIN} # main 2026-10-29`,
    "  ci-done:",
    "    needs: [suite, screens, scope, native, zizmor, ste-lint]",
    "    if: ${{ !cancelled() && !github.event.pull_request.draft && github.event_name == 'pull_request' }}",
    "    runs-on: ubuntu-latest",
    "    steps:",
    `      - uses: ${ACTIONS}ci-done-comment@${ACTION_PIN} # main 2026-10-29`,
    "        with:",
    "          needs: ${{ toJSON(needs) }}",
  ].join("\n") + "\n";

// The rollup job. Each red or green case varies one field.
function rollupJob(o = {}) {
  const {
    ifLine = "${{ " + ROLLUP_IF + " }}",
    pin = ACTIONS + ROLLUP + "@" + ACTION_PIN,
    withNeeds = "${{ toJSON(needs) }}",
    needs = NEEDS,
    nameLine = null,
  } = o;
  return (
    [
      `  ${ROLLUP}:`,
      ...(nameLine ? [nameLine] : []),
      "    needs:",
      ...needs.map((n) => `      - ${n}`),
      `    if: ${ifLine}`,
      "    runs-on: ubuntu-latest",
      "    steps:",
      `      - uses: ${pin}`,
      "        with:",
      `          needs: ${withNeeds}`,
    ].join("\n") + "\n"
  );
}

const wf = (o) => PRE_TEXT + rollupJob(o);
const GOOD = wf({});
const GOOD_STAMP = '{"merge":{"requiredChecks":["all-jobs-passed"]}}\n';

// Replaces one piece that must exist, so a fixture cannot go green by a silent no-op.
function mutate(src, from, to) {
  if (!src.includes(from)) throw new Error(`fixture edit did not apply: ${from}`);
  return src.replace(from, () => to);
}

{
  const bad = checkAll(GOOD, GOOD_STAMP).filter((r) => !r.ok);
  expect(
    "fixture good: every assertion passes, with the draft guard, comment, quote and block-scalar controls",
    bad.length === 0,
    bad.map((r) => `${r.label} (${r.detail})`).join("; ")
  );
}

const RED = [
  ["rollup job missing", PRE_TEXT, GOOD_STAMP, "1"],
  ["rollup job has a name key", wf({ nameLine: "    name: all jobs passed" }), GOOD_STAMP, "1"],
  ["rollup if: is !cancelled() alone", wf({ ifLine: "${{ !cancelled() }}" }), GOOD_STAMP, "2"],
  ["rollup if: is success() alone", wf({ ifLine: "${{ success() }}" }), GOOD_STAMP, "2"],
  ["rollup needs list missing zizmor", wf({ needs: NEEDS.filter((n) => n !== "zizmor") }), GOOD_STAMP, "4"],
  ["rollup with: needs is not toJSON(needs)", wf({ withNeeds: "${{ toJSON(github) }}" }), GOOD_STAMP, "3b"],
  ["rollup pinned to @main", wf({ pin: ACTIONS + ROLLUP + "@main" }), GOOD_STAMP, "3a"],
  [
    "rollup sha differs from the other pins",
    wf({ pin: ACTIONS + ROLLUP + "@" + "f".repeat(40) }),
    GOOD_STAMP,
    "3c",
  ],
  [
    "needed native reads a job output in its job-level if",
    mutate(GOOD, NATIVE_IF, "    if: ${{ needs.scope.outputs.native == 'true' }}"),
    GOOD_STAMP,
    "5",
  ],
  [
    "needed native has an event name after a lone apostrophe, in code",
    mutate(GOOD, NATIVE_IF, "    if: ${{ !cancelled() }} don't github.event_name"),
    GOOD_STAMP,
    "5",
  ],
  [
    "needed ste-lint has an event name after a quoted comment opener, in code",
    mutate(GOOD, STE_IF, STE_IF_RED),
    GOOD_STAMP,
    "5",
  ],
  ["ste-lint job-level if has no draft guard", mutate(GOOD, STE_IF, STE_IF_NO_DRAFT), GOOD_STAMP, "7"],
  ["screens does not need scope", mutate(GOOD, "    needs: scope\n", ""), GOOD_STAMP, "8"],
  [
    "screens job-level if reads an output",
    mutate(
      GOOD,
      "  screens:\n    needs: scope\n" + DRAFT_IF,
      "  screens:\n    needs: scope\n    if: ${{ needs.scope.outputs.native == 'true' && !github.event.pull_request.draft }}"
    ),
    GOOD_STAMP,
    "8",
  ],
  ["stamp requiredChecks names protection", GOOD, '{"merge":{"requiredChecks":["protection"]}}\n', "6"],
  ["stamp file missing", GOOD, null, "6"],
];

for (const [name, text, stamp, id] of RED) {
  const bad = checkAll(text, stamp).filter((r) => !r.ok);
  expect(
    `fixture red: ${name} fails assertion ${id}`,
    bad.some((r) => r.id === id),
    `failing: ${bad.map((r) => r.id).join(", ") || "none"}`
  );
}

const GREEN = [
  ["bare if: always() && !github.event.pull_request.draft", wf({ ifLine: ROLLUP_IF }), GOOD_STAMP],
  [
    "if: spacing inside the ${{ }} wrapper is ignored",
    wf({ ifLine: "${{always()&&!github.event.pull_request.draft}}" }),
    GOOD_STAMP,
  ],
];

for (const [name, text, stamp] of GREEN) {
  const bad = checkAll(text, stamp).filter((r) => !r.ok);
  expect(`fixture green: ${name} passes`, bad.length === 0, bad.map((r) => r.label).join("; "));
}

if (failures) {
  console.log(`ci-wiring: ${failures} failure(s)`);
  process.exit(1);
}
console.log("ci-wiring: all green");
