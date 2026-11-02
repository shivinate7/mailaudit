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
// The milestone workflow (.github/workflows/milestone.yml) and its job in test.yml
// are checked the same way, with letter ids:
//   a   its triggers are exactly workflow_dispatch and pull_request limited to its own path;
//   a2  it has one job, and that job's if: has the draft guard;
//   b   its job runs on xcode-27 and selects Xcode 27.1;
//   c   its job runs make native-check;
//   d   scope and milestone-due read one native path regex file, and neither job inlines it;
//   f   the rollup needs milestone-due, and that job exists in test.yml;
//   g   every step of milestone-due has an if: that can be true only on a push to main;
//   h   scope's native regex file matches its own path, and README.md does not match it.
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
// Run: npm run test:ci-wiring. Exits 1 on any failure. CI_WORKFLOW, CI_STAMP and
// MILESTONE_WORKFLOW name other files; a relative path resolves from the repo root.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = resolve(ROOT, process.env.CI_WORKFLOW || ".github/workflows/test.yml");
const STAMP = resolve(ROOT, process.env.CI_STAMP || ".github/stamp.json");
const MILESTONE = resolve(ROOT, process.env.MILESTONE_WORKFLOW || ".github/workflows/milestone.yml");

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
// An if: expression with its ${{ }} wrapper and all spacing removed.
const normIf = (s) => s.trim().replace(/^\$\{\{([\s\S]*)\}\}$/, "$1").replace(/\s+/g, "");

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
// and block scalars (kept as text). Anything else throws, so a shape the checks do
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
  // A block scalar's lines are blank or indented past the key that opened it. Its text is
  // kept as written, trimmed per line, so a run script reads as its lines.
  function blockText(n) {
    const got = [];
    while (p < lines.length) {
      const { raw } = lines[p];
      if (raw.trim() !== "" && raw.length - raw.trimStart().length <= n) break;
      got.push(raw.trim());
      p++;
    }
    return got.join("\n");
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
      else if (BLOCK.test(rest)) out[m[1]] = blockText(n);
      else out[m[1]] = scalar(rest);
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
  const ifNorm = typeof ifRaw === "string" ? normIf(ifRaw) : null;
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

// The milestone workflow (decision tci-5: the full Swift suite at milestones) and the
// milestone-due job, which reads the same native path regex file as scope.
const MILESTONE_OWN = ".github/workflows/milestone.yml";
const MILESTONE_DUE = "milestone-due";
const XCODE = "xcode-27";
const XCODE_SELECT = "xcode-select -s /Applications/Xcode_27.1.app";
const MAKE_TARGET = "make native-check";
// The regex file must hold every alternative of the native path regex scope uses today.
const NATIVE_HOLDS = ["native/", "shared/", "view-rules", "test\\.yml"];
// A job that inlines that regex carries one of these fragments of it.
const NATIVE_INLINE = ["native/|", "|shared/", "view-rules"];

const readRepo = (rel) => readOrNull(resolve(ROOT, rel));
const runsOf = (job) => steps(job).filter((s) => typeof s.run === "string").map((s) => s.run);
const runText = (job) => runsOf(job).join("\n");

// The repo files a run script names. A token counts when read() finds it. Quotes, ;, |, &,
// $ and brackets end a token, so a path inside "..." or beside a lone apostrophe still counts.
function filesNamedIn(text, read) {
  const found = new Set();
  for (const tok of text.split(/[\s"'`;|&()<>=$]+/)) {
    if (!/[./]/.test(tok) || tok.startsWith("/") || tok.includes("..")) continue;
    const rel = tok.replace(/^\.\//, "");
    if (rel !== "" && read(rel) !== null) found.add(rel);
  }
  return found;
}

// Assertion a: the only triggers are workflow_dispatch and pull_request on its own path.
function triggerCheck(doc) {
  const on = isMap(doc.on) ? doc.on : {};
  const events = Object.keys(on).sort();
  const pr = isMap(on.pull_request) ? on.pull_request : {};
  const ok =
    JSON.stringify(events) === JSON.stringify(["pull_request", "workflow_dispatch"]) &&
    JSON.stringify(pr.paths) === JSON.stringify([MILESTONE_OWN]);
  return {
    ok,
    detail: `events: ${events.join(", ") || "none"}; pull_request paths: ${JSON.stringify(pr.paths ?? null)}`,
  };
}

// The first file in files that holds every alternative of the native path regex.
const holderIn = (files, read) => [...files].find((f) => NATIVE_HOLDS.every((s) => read(f).includes(s)));

// Assertion d: scope and milestone-due read one regex file, and neither job inlines it.
function sharedRegexCheck({ scopeJob, milestoneJob, read }) {
  const scopeRun = runText(scopeJob);
  const msRun = runText(milestoneJob);
  const msFiles = filesNamedIn(msRun, read);
  const shared = [...filesNamedIn(scopeRun, read)].filter((f) => msFiles.has(f));
  const holder = holderIn(shared, read);
  const inline = NATIVE_INLINE.filter((frag) => scopeRun.includes(frag) || msRun.includes(frag));
  return {
    ok: holder !== undefined && inline.length === 0,
    detail:
      `files both read: ${shared.join(", ") || "none"}; ` +
      `one of them holds every alternative: ${holder ?? "none"}; ` +
      `inline fragments: ${inline.join(", ") || "none"}`,
  };
}

// Assertion f: the rollup needs milestone-due, and that job exists in test.yml.
function rollupCheck(jobs) {
  const needs = needsOf(jobs[ROLLUP]);
  const present = Object.hasOwn(jobs, MILESTONE_DUE);
  return {
    ok: present && needs.includes(MILESTONE_DUE),
    detail: `job present: ${present}; rollup needs: ${needs.join(", ") || "none"}`,
  };
}

// Assertion g: every step of milestone-due has an if: that can be true only on a push to main.
// The job holds actions: write on every event, so an unguarded step can run on a pull request.
const PUSH_MAIN_TERMS = ["github.event_name=='push'", "github.ref=='refs/heads/main'"];
// True when the expression is an && of both terms and has no ||. Parentheses are dropped.
function pushToMainOnly(cond) {
  const norm = normIf(cond).replace(/"/g, "'");
  if (norm.includes("||")) return false;
  const terms = norm.replace(/[()]/g, "").split("&&");
  return PUSH_MAIN_TERMS.every((t) => terms.includes(t));
}
function pushOnlyStepsCheck(jobs) {
  const job = isMap(jobs[MILESTONE_DUE]) ? jobs[MILESTONE_DUE] : undefined;
  if (job === undefined) return { ok: false, detail: `no ${MILESTONE_DUE} job` };
  const list = Array.isArray(job.steps) ? job.steps : [];
  if (list.length === 0) return { ok: false, detail: `${MILESTONE_DUE} has no steps` };
  const bad = [];
  list.forEach((s, i) => {
    if (!isMap(s) || !pushToMainOnly(ifText(s))) bad.push(String(s?.name ?? s?.uses ?? `step ${i + 1}`));
  });
  return {
    ok: bad.length === 0,
    detail: `steps: ${list.length}; without the push-to-main guard: ${bad.join(", ") || "none"}`,
  };
}

// Assertion h: scope counts a change to its native regex file as native. scope greps the changed
// paths with that file as its pattern, so the file's own path must match it. README.md is a
// control: a regex that matched every path would pass the first half alone.
const NATIVE_CONTROL = "README.md";
function selfMatchCheck(path, text) {
  if (text === null) return { ok: false, detail: `no regex text for ${path}` };
  const hits = (p) => spawnSync("grep", ["-Eq", "-e", text.trim()], { input: `${p}\n` }).status === 0;
  const self = hits(path);
  const control = hits(NATIVE_CONTROL);
  return { ok: self && !control, detail: `${path} matches: ${self}; ${NATIVE_CONTROL} matches: ${control}` };
}
function nativeSelfCheck({ scopeJob, read }) {
  const file = holderIn(filesNamedIn(runText(scopeJob), read), read);
  if (file === undefined) return { ok: false, detail: "scope names no native regex file that holds every alternative" };
  return selfMatchCheck(file, read(file));
}

// Returns { label, ok, detail } for a, a2, b, c, d, f, g and h. A missing or unparsable file
// fails every check that reads it.
function milestoneChecks({ msText, wfText, read }) {
  const parsed = (text, what) => {
    if (text === null) return { err: `${what} is missing` };
    try {
      return { doc: parseWorkflow(text) };
    } catch (e) {
      return { err: `${what} does not parse: ${e.message}` };
    }
  };
  const ms = parsed(msText, MILESTONE_OWN);
  const wf = parsed(wfText, ".github/workflows/test.yml");
  const onlyJobs = ms.doc && isMap(ms.doc.jobs) ? Object.values(ms.doc.jobs) : [];
  const job = onlyJobs.length === 1 && isMap(onlyJobs[0]) ? onlyJobs[0] : undefined;
  const jobs = wf.doc && isMap(wf.doc.jobs) ? wf.doc.jobs : {};
  const onMs = (label, fn) => (ms.doc ? { label, ...fn() } : { label, ok: false, detail: ms.err });
  const onWf = (label, fn) => (wf.doc ? { label, ...fn() } : { label, ok: false, detail: wf.err });
  return [
    onMs("a milestone.yml triggers are exactly workflow_dispatch plus pull_request on its own path", () =>
      triggerCheck(ms.doc)
    ),
    onMs("a2 milestone.yml has one job, and its job-level if: has the draft guard", () => ({
      ok: job !== undefined && ifText(job).replace(/\s+/g, "").includes(DRAFT_GUARD),
      detail: `jobs: ${onlyJobs.length}; if: ${JSON.stringify(ifText(job))}`,
    })),
    onMs("b the job runs on xcode-27 and selects Xcode 27.1", () => ({
      ok: job !== undefined && job["runs-on"] === XCODE && runText(job).includes(XCODE_SELECT),
      detail: `runs-on: ${JSON.stringify(job?.["runs-on"] ?? null)}; selects Xcode 27.1: ${runText(job).includes(XCODE_SELECT)}`,
    })),
    onMs("c the job runs make native-check", () => ({
      ok: job !== undefined && runText(job).split("\n").some((l) => l.trim() === MAKE_TARGET),
      detail: "no run line is exactly make native-check",
    })),
    onWf("d scope and milestone-due read one regex file, and neither job inlines it", () =>
      sharedRegexCheck({ scopeJob: jobs.scope, milestoneJob: jobs[MILESTONE_DUE], read })
    ),
    onWf("f the rollup needs milestone-due, and that job exists in test.yml", () => rollupCheck(jobs)),
    onWf("g every step of milestone-due has an if: that requires a push to main", () => pushOnlyStepsCheck(jobs)),
    onWf("h scope counts its native regex file as native, and README.md as not native", () =>
      nativeSelfCheck({ scopeJob: jobs.scope, read })
    ),
  ];
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

// The milestone workflow and the milestone-due job, read from the repo.
{
  const results = milestoneChecks({
    msText: readOrNull(MILESTONE),
    wfText: readOrNull(WORKFLOW),
    read: readRepo,
  });
  for (const r of results) expect(r.label, r.ok, r.detail);
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

// Milestone fixtures. Each red case varies one field of a good file, so it fails only the
// assertion it names.
const MS_GOOD = [
  "name: milestone",
  "on:",
  "  workflow_dispatch:",
  "  pull_request:",
  "    paths:",
  `      - ${MILESTONE_OWN}`,
  "permissions:",
  "  contents: read",
  "jobs:",
  "  full-suite:",
  "    if: ${{ !github.event.pull_request.draft }}",
  "    runs-on: xcode-27",
  "    timeout-minutes: 60",
  "    steps:",
  "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
  "        with:",
  "          persist-credentials: false",
  "      - name: select Xcode 27.1",
  "        run: |",
  "          sudo xcode-select -s /Applications/Xcode_27.1.app",
  "          xcodebuild -version",
  "      - name: boot the simulator",
  '        run: xcrun simctl boot "iPhone 18 Pro" || true',
  "      - name: the full native check",
  "        run: make native-check",
].join("\n") + "\n";

const MS_RED = [
  ["a: a push trigger is added", mutate(MS_GOOD, "on:\n", "on:\n  push:\n    branches: [main]\n"), "a"],
  ["a: a schedule trigger is added", mutate(MS_GOOD, "on:\n", 'on:\n  schedule:\n    - cron: "0 5 * * *"\n'), "a"],
  ["a: the pull_request path is widened", mutate(MS_GOOD, `      - ${MILESTONE_OWN}`, '      - "src/**"'), "a"],
  ["a: pull_request has no paths", mutate(MS_GOOD, "    paths:\n      - .github/workflows/milestone.yml\n", ""), "a"],
  ["a2: the job-level if: has no draft guard", mutate(MS_GOOD, "    if: ${{ !github.event.pull_request.draft }}\n", ""), "a2"],
  ["a2: a second job is added", MS_GOOD + "  extra:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n", "a2"],
  ["b: the job runs on macos-26", mutate(MS_GOOD, "runs-on: xcode-27", "runs-on: macos-26"), "b"],
  ["b: Xcode 26 is selected", mutate(MS_GOOD, "Xcode_27.1", "Xcode_26.4"), "b"],
  ["c: the job runs make kit-test, not make native-check", mutate(MS_GOOD, "run: make native-check", "run: make kit-test"), "c"],
  ["c: make native-check is only in a comment", mutate(MS_GOOD, "run: make native-check", "run: echo ok # make native-check"), "c"],
];

for (const [name, text, id] of MS_RED) {
  const results = milestoneChecks({ msText: text, wfText: null, read: () => null });
  const bad = results.filter((r) => !r.ok);
  expect(
    `fixture red: ${name} fails assertion ${id}`,
    bad.some((r) => r.label.split(" ")[0] === id),
    `failing: ${bad.map((r) => r.label.split(" ")[0]).join(", ") || "none"}`
  );
}

{
  const results = milestoneChecks({ msText: MS_GOOD, wfText: null, read: () => null });
  const ids = ["a", "a2", "b", "c"];
  const bad = results.filter((r) => ids.includes(r.label.split(" ")[0]) && !r.ok);
  expect(
    "fixture good: the milestone file passes a, a2, b and c",
    bad.length === 0,
    bad.map((r) => `${r.label} (${r.detail})`).join("; ")
  );
}

// Assertion d fixtures. The reader is a fake, so each case names exactly the files it has.
const NATIVE_FILE = "^(native/|shared/|src/view-rules\\.mjs$|\\.github/workflows/test\\.yml$)\n";
const fakeRead = (files) => (rel) => (Object.hasOwn(files, rel) ? files[rel] : null);
const READ = fakeRead({
  ".github/native-paths.regex": NATIVE_FILE,
  ".github/other.regex": NATIVE_FILE,
  ".github/short.regex": "^(native/)$\n",
});
const jobRun = (...runs) => ({ steps: runs.map((run) => ({ run })) });
const SHARED_READ = 'grep -Eq -f .github/native-paths.regex <<< "$files"';
const scopeGood = jobRun(`${SHARED_READ} || native=false`);
const msGood = jobRun(`${SHARED_READ} || echo skip`);
const dCheck = (scopeJob, msJob) => sharedRegexCheck({ scopeJob, milestoneJob: msJob, read: READ });

expect("fixture good: scope and milestone-due read one regex file and inline none", dCheck(scopeGood, msGood).ok, dCheck(scopeGood, msGood).detail);
{
  const cases = [
    [
      "scope reads the file and also inlines the regex",
      jobRun(`${SHARED_READ} || grep -Eq '^(native/|shared/)' <<< "$files"`),
      msGood,
    ],
    [
      "milestone-due inlines its own regex and reads no file",
      scopeGood,
      jobRun("grep -Eq '^(native/|shared/|src/view-rules\\.mjs$)' <<< \"$files\""),
    ],
    [
      "the two jobs read different regex files",
      scopeGood,
      jobRun('grep -Eq -f .github/other.regex <<< "$files"'),
    ],
    [
      "the shared file does not hold every alternative",
      jobRun('grep -Eq -f .github/short.regex <<< "$files"'),
      jobRun('grep -Eq -f .github/short.regex <<< "$files"'),
    ],
    ["milestone-due job is missing", scopeGood, undefined],
  ];
  for (const [name, s, m] of cases) {
    const r = dCheck(s, m);
    expect(`fixture red: ${name} fails assertion d`, !r.ok, r.detail);
  }
}

// The milestone-due job as test.yml has it: each step carries the push-to-main guard. The f and g
// fixtures build on this one text. Each g red case changes one guard with mutate().
const PUSH_MAIN_IF = "        if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}";
const MS_JOB_TEXT = [
  `  ${MILESTONE_DUE}:`,
  "    if: ${{ !github.event.pull_request.draft }}",
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 5",
  "    permissions:",
  "      contents: read",
  "      actions: write",
  "    steps:",
  "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
  PUSH_MAIN_IF,
  "        with:",
  "          fetch-depth: 0",
  "          persist-credentials: false",
  "      - name: dispatch the full Swift suite when it is due",
  PUSH_MAIN_IF,
  "        env:",
  "          GITHUB_TOKEN: ${{ github.token }}",
  "        run: node scripts/milestone-due.mjs --native-paths .github/native-paths.regex",
].join("\n") + "\n";
// Assertion f fixtures, on the real test.yml shape.
const fJobs = (text) => parseWorkflow(text).jobs;
expect(
  "fixture good: the rollup needs milestone-due and the job exists",
  rollupCheck(fJobs(PRE_TEXT + MS_JOB_TEXT + rollupJob({ needs: [...NEEDS, MILESTONE_DUE] }))).ok
);
expect(
  "fixture red: the rollup does not need milestone-due, though the job exists",
  !rollupCheck(fJobs(PRE_TEXT + MS_JOB_TEXT + rollupJob({ needs: NEEDS }))).ok
);
expect(
  "fixture red: the rollup needs milestone-due, but the job is missing",
  !rollupCheck(fJobs(PRE_TEXT + rollupJob({ needs: [...NEEDS, MILESTONE_DUE] }))).ok
);

// Assertion g fixtures. The controls keep a valid guard that holds a comment opener or an
// apostrophe. Each red case changes one guard, or removes the job.
const gOf = (jobText) => pushOnlyStepsCheck(fJobs(PRE_TEXT + jobText));
{
  const good = gOf(MS_JOB_TEXT);
  expect("fixture good: every milestone-due step carries the push-to-main guard", good.ok, good.detail);
  const controls = [
    [
      "a lone apostrophe in the trailing comment of a guard",
      mutate(MS_JOB_TEXT, `${PUSH_MAIN_IF}\n        with:`, `${PUSH_MAIN_IF} # don't\n        with:`),
    ],
    [
      "a comment opener inside the quotes of a double-quoted guard",
      mutate(
        MS_JOB_TEXT,
        `${PUSH_MAIN_IF}\n        env:`,
        "        if: \"${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && github.ref != 'x # y' }}\"\n        env:"
      ),
    ],
  ];
  for (const [name, text] of controls) {
    const r = gOf(text);
    expect(`fixture good: ${name} still reads as the push guard`, r.ok, r.detail);
  }
  const reds = [
    ["the checkout step has no if:", mutate(MS_JOB_TEXT, `${PUSH_MAIN_IF}\n        with:`, "        with:")],
    ["the dispatch step has no if:", mutate(MS_JOB_TEXT, `${PUSH_MAIN_IF}\n        env:`, "        env:")],
    [
      "the guard exists only in a trailing comment",
      mutate(
        MS_JOB_TEXT,
        `${PUSH_MAIN_IF}\n        env:`,
        "        if: ${{ !github.event.pull_request.draft }} # github.event_name == 'push' && github.ref == 'refs/heads/main'\n        env:"
      ),
    ],
    [
      "the guard needs push or main, not both",
      mutate(
        MS_JOB_TEXT,
        `${PUSH_MAIN_IF}\n        env:`,
        "        if: ${{ github.event_name == 'push' || github.ref == 'refs/heads/main' }}\n        env:"
      ),
    ],
    [
      "the guard also admits a pull_request event",
      mutate(
        MS_JOB_TEXT,
        `${PUSH_MAIN_IF}\n        env:`,
        "        if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' || github.event_name == 'pull_request' }}\n        env:"
      ),
    ],
    ["the milestone-due job is missing", ""],
    ["the milestone-due job has no steps", `  ${MILESTONE_DUE}:\n    runs-on: ubuntu-latest\n`],
  ];
  for (const [name, text] of reds) {
    const r = gOf(text);
    expect(`fixture red: ${name} fails assertion g`, !r.ok, r.detail);
  }
}

// Assertion h fixtures. The fake reader holds the regex under the scope job's own file name. The
// first regex names its own path, so it passes. The second does not name it. The third matches
// every path, so it fails on README.md.
const NATIVE_SELF =
  "^(native/|shared/|src/view-rules\\.mjs$|\\.github/workflows/test\\.yml$|\\.github/native-paths\\.regex$)\n";
const NATIVE_ANY = "^(native/|shared/|view-rules|test\\.yml|.*)$\n";
const hOf = (regexText) =>
  nativeSelfCheck({ scopeJob: scopeGood, read: fakeRead({ ".github/native-paths.regex": regexText }) });
{
  const good = hOf(NATIVE_SELF);
  expect("fixture good: the regex that names its own path matches it, and README.md does not", good.ok, good.detail);
  const noSelf = hOf(NATIVE_FILE);
  expect("fixture red: the regex without its own path does not match it", !noSelf.ok, noSelf.detail);
  const everything = hOf(NATIVE_ANY);
  expect("fixture red: a regex that matches every path is not a pass", !everything.ok, everything.detail);
}

// Scanner cases for the new readers. A comment opener inside quotes, a lone apostrophe and a
// second line of a block must each leave the path or the text in place.
{
  const fake = fakeRead({ "package.json": "{}\n" });
  expect(
    "path finder: a path after a quoted comment opener is found",
    filesNamedIn('echo "# x" package.json', fake).has("package.json")
  );
  expect(
    "path finder: a path beside a lone apostrophe is found",
    filesNamedIn("echo don't package.json", fake).has("package.json")
  );
  expect(
    "path finder: a path on a later line of a block is found",
    filesNamedIn("set -e\necho\n  package.json\n", fake).has("package.json")
  );
  const doc = parseWorkflow(
    [
      "jobs:",
      "  j:",
      "    steps:",
      "      - run: |",
      '          echo "# not a comment"',
      "          echo don't",
      "          make native-check",
      "",
    ].join("\n")
  );
  const got = runText(doc.jobs.j).split("\n");
  expect(
    "block scalar: a quoted comment opener, a lone apostrophe and a later line all stay as run text",
    got.includes('echo "# not a comment"') && got.includes("echo don't") && got.includes("make native-check"),
    JSON.stringify(got)
  );
}

if (failures) {
  console.log(`ci-wiring: ${failures} failure(s)`);
  process.exit(1);
}
console.log("ci-wiring: all green");
