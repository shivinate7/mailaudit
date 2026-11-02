// Cases for the CI wiring of the all-jobs-passed rollup and its required check.
//
// The rollup is the one check branch protection requires, so it must report on
// every run that should pass. These checks read .github/workflows/test.yml and
// .github/stamp.json. They prove:
//   0  the workflow file is readable and parses in the indentation subset;
//   1  the rollup job exists with no name key, so its check name is its id;
//   2  its job-level if: is exactly always() && !github.event.pull_request.draft;
//   3a its step pins the shared action to a 40-hex sha;
//   3b its with: needs is ${{ toJSON(needs) }};
//   3c every other claude-settings pin in the file has the rollup's sha;
//   4  its needs are every other job except ci-done and milestone-proof (staged, see i2);
//   5  no job it needs has a job-level if: with github.event_name or .outputs.;
//   6  the stamp's merge.requiredChecks is exactly ["all-jobs-passed"];
//   7  every job, ci-done included, has !github.event.pull_request.draft in its
//      job-level if:, so a draft starts no runner;
//   8  the screens job needs scope, and its job-level if: reads no .outputs.
//
// The milestone workflow (.github/workflows/milestone.yml) and its job in test.yml
// are checked the same way, with letter ids:
//   a   its only trigger is workflow_dispatch; any other trigger fails it;
//   a2  it has two jobs, and each job-level if: has the draft guard;
//   b   every job runs on xcode-27 and selects Xcode 27.1;
//   c   every job has a run line that starts with make;
//   d   scope and milestone-due read one native path regex file, and neither job inlines it;
//   f   the rollup needs milestone-due, and that job exists in test.yml;
//   g   every step of milestone-due has an if: that requires a push to main;
//   h   scope's native regex file matches its own path, and README.md does not match it.
//
// The milestone-proof job fails a pull request until the newest milestone run on main passed.
// It is checked with these ids:
//   i1  the job exists;
//   i2  the rollup does not need it until its first green hosted run (coordinator 2026-11-01 22:06);
//   i3  its permissions are a map with actions: read and no write value;
//   i4  one run line is node scripts/milestone-due.mjs proof, with arguments allowed after it;
//   i5  no if: in the job or its steps names github.event_name or github.ref;
//   j   it stays out of ci-done and the rollup until its first green hosted run (staged with i2).
//
// The UI-test checks read the Makefile through make, the Swift classes and milestone.yml:
//   k1  DUO_UI_TESTS in the Makefile lists exactly the Duo classes in native/ManifestUITests;
//   k2  make -n ui-test skips each Duo class;
//   k3  milestone.yml has two UI-test jobs, timeout-minutes 45 and 50, and neither runs a Duo class;
//   k4  each UI-test job creates its simulator on runtime iOS-27-1;
//   k5  UI_TESTS_A holds no Duo class, the 45-minute job runs it, and the 50-minute job runs the rest;
//   k6  each UI-test job's xcodebuild gets the simulator id that CI sets, as its -destination.
//
// The dispatch switch and the merge ignore list are read from the repo:
//   m1  milestone-due's dispatch step needs MILESTONE_AUTO_DISPATCH to be 'on', and that env
//       value is 'on' exactly when milestone-proof is in the rollup's needs;
//   m2  no merge.ignoreChecks entry in the stamp names a workflow, a job the rollup needs, or a required check.
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
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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
  // milestone-proof stays out of the rollup until its first green hosted run (coordinator 2026-11-01 22:06).
  const expectedNeeds = expected.filter((id) => id !== PROOF);
  const needs = needsOf(roll);
  const missing = expectedNeeds.filter((id) => !needs.includes(id));
  const extra = needs.filter((id) => !expectedNeeds.includes(id));
  const dup = needs.length !== new Set(needs).size;
  add(
    "4",
    `rollup needs are every other job except ${CI_DONE} and ${PROOF}, which is staged out`,
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

// Assertion a: the only trigger is workflow_dispatch. A pull_request or push trigger fails it.
function triggerCheck(doc) {
  const on = isMap(doc.on) ? doc.on : {};
  const events = Object.keys(on).sort();
  return {
    ok: JSON.stringify(events) === JSON.stringify(["workflow_dispatch"]),
    detail: `events: ${events.join(", ") || "none"}`,
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
function milestoneChecks({ msText, wfText, read, makefile, classes }) {
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
  const msJobList = ms.doc && isMap(ms.doc.jobs) ? Object.values(ms.doc.jobs).filter(isMap) : [];
  const jobs = wf.doc && isMap(wf.doc.jobs) ? wf.doc.jobs : {};
  const onMs = (label, fn) => (ms.doc ? { label, ...fn() } : { label, ok: false, detail: ms.err });
  const onWf = (label, fn) => (wf.doc ? { label, ...fn() } : { label, ok: false, detail: wf.err });
  return [
    onMs("a milestone.yml runs by dispatch only until its first green run (coordinator 2026-11-01 22:44)", () =>
      triggerCheck(ms.doc)
    ),
    onMs("a2 milestone.yml has two jobs, and each job-level if: has the draft guard", () => ({
      ok: msJobList.length === 2 && msJobList.every((j) => ifText(j).replace(/\s+/g, "").includes(DRAFT_GUARD)),
      detail: `jobs: ${msJobList.length}; if: ${JSON.stringify(msJobList.map((j) => ifText(j)))}`,
    })),
    onMs("b every job runs on xcode-27 and selects Xcode 27.1", () => ({
      ok: msJobList.length > 0 && msJobList.every((j) => j["runs-on"] === XCODE && runText(j).includes(XCODE_SELECT)),
      detail: `runs-on: ${JSON.stringify(msJobList.map((j) => j["runs-on"] ?? null))}`,
    })),
    onMs("c every job reaches its tests through a make target", () => ({
      ok: msJobList.length > 0 && msJobList.every((j) => shellLines(runText(j)).some((l) => /^make(\s|$)/.test(l))),
      detail: "a job has no run line that starts with make",
    })),
    onWf("d scope and milestone-due read one regex file, and neither job inlines it", () =>
      sharedRegexCheck({ scopeJob: jobs.scope, milestoneJob: jobs[MILESTONE_DUE], read })
    ),
    onWf("f the rollup needs milestone-due, and that job exists in test.yml", () => rollupCheck(jobs)),
    onWf("g every step of milestone-due has an if: that requires a push to main", () => pushOnlyStepsCheck(jobs)),
    onWf("h scope counts its native regex file as native, and README.md as not native", () =>
      nativeSelfCheck({ scopeJob: jobs.scope, read })
    ),
    ...uiTestChecks({ makefile, classes, msDoc: ms.doc, msErr: ms.err }),
  ];
}

// The milestone-proof job fails a pull request until the newest milestone run on main passed. A
// job that cannot read its proof must fail, so the job runs on every event and no if: narrows
// it. Its token holds no write scope.
const PROOF = "milestone-proof";
const PROOF_RUN = "node scripts/milestone-due.mjs proof";
const PROOF_EVENT_TERMS = ["github.event_name", "github.ref"];
// Assertions i1 to i5 and j, on a parsed jobs map.
function milestoneProofChecks(jobs) {
  const map = isMap(jobs) ? jobs : {};
  const job = isMap(map[PROOF]) ? map[PROOF] : undefined;
  const perms = isMap(job?.permissions) ? job.permissions : undefined;
  const writes = perms ? Object.keys(perms).filter((k) => perms[k] === "write") : [];
  const runLines = runText(job).split("\n").map((l) => l.trim());
  const ran = runLines.some((l) => l === PROOF_RUN || l.startsWith(`${PROOF_RUN} `));
  const conds = [ifText(job), ...steps(job).map((s) => ifText(s))].map((c) => c.replace(/\s+/g, ""));
  const narrowed = conds.filter((c) => PROOF_EVENT_TERMS.some((t) => c.includes(t)));
  const rollNeeds = needsOf(map[ROLLUP]);
  const doneNeeds = needsOf(map[CI_DONE]);
  return [
    {
      label: `i1 job ${PROOF} exists in test.yml`,
      ok: job !== undefined,
      detail: `job present: ${job !== undefined}`,
    },
    {
      label: `i2 ${PROOF} stays out of ${ROLLUP} until its first green hosted run (coordinator 2026-11-01 22:06)`,
      ok: !rollNeeds.includes(PROOF),
      detail: `rollup needs: ${rollNeeds.join(", ") || "none"}`,
    },
    {
      label: `i3 ${PROOF} has permissions with actions: read and no write value`,
      ok: perms !== undefined && perms.actions === "read" && writes.length === 0,
      detail: `permissions: ${JSON.stringify(perms ?? null)}; write values: ${writes.join(", ") || "none"}`,
    },
    {
      label: `i4 ${PROOF} has a run line that starts with ${PROOF_RUN}`,
      ok: ran,
      detail: `no run line starts with ${PROOF_RUN}`,
    },
    {
      label: `i5 ${PROOF} names no event or ref in any if:, so it is not limited to push`,
      ok: job !== undefined && narrowed.length === 0,
      detail: `if: ${JSON.stringify(conds)}`,
    },
    {
      label: `j ${PROOF} stays out of ${ROLLUP} and ${CI_DONE} until its first green hosted run (coordinator 2026-11-01 22:06)`,
      ok: !doneNeeds.includes(PROOF) && !rollNeeds.includes(PROOF),
      detail: `${CI_DONE} needs: ${doneNeeds.join(", ") || "none"}; ${ROLLUP} needs: ${rollNeeds.join(", ") || "none"}`,
    },
  ];
}

// ---- The dispatch switch (m1) and the merge ignore list (m2) ----
// milestone-due dispatches milestone.yml on a push to main. Until the join PR (the PR that adds
// milestone-proof to all-jobs-passed's needs) it dispatches nothing: a red dispatch run on main
// reads as red-main to the merge tool and stops every merge. The job env MILESTONE_AUTO_DISPATCH
// holds the switch, "off" until the join and "on" after it. The dispatch step must read it.
const SWITCH = "MILESTONE_AUTO_DISPATCH";
const SWITCH_TERM = `env.${SWITCH}=='on'`;
const DISPATCH_RUN = "milestone-due.mjs --native-paths";
const DISPATCH_LABEL = "m1 milestone-due dispatches nothing until the join PR (coordinator 2026-11-01 23:00)";
// The merge tool skips a red newest main run of a workflow that .github/stamp.json lists in
// merge.ignoreChecks. No entry may name a workflow, so no red run is ever skipped.
const IGNORE_LABEL =
  "m2 no merge.ignoreChecks entry names a workflow, a job in all-jobs-passed's needs, or a required check";

// The parsed inputs. A missing or unreadable input throws with its reason, and each check that needs it fails.
function ignoreInputs({ stampText, msText, wfText, otherNames }) {
  if (stampText === null) throw new Error("no readable stamp file");
  if (msText === null) throw new Error("no readable milestone workflow");
  if (wfText === null) throw new Error("no readable test workflow");
  if (otherNames === null) throw new Error("cannot read the other workflows' names");
  let stamp;
  try {
    stamp = JSON.parse(stampText);
  } catch (e) {
    throw new Error(`stamp is not JSON: ${e.message}`);
  }
  const list = stamp?.merge?.ignoreChecks ?? [];
  if (!Array.isArray(list)) throw new Error("merge.ignoreChecks is not a list");
  const msName = parseWorkflow(msText).name;
  if (typeof msName !== "string") throw new Error("the milestone workflow has no name");
  return {
    list,
    msName,
    otherNames,
    required: stamp?.merge?.requiredChecks ?? [],
    rollNeeds: needsOf(parseWorkflow(wfText).jobs?.[ROLLUP]),
  };
}

// m2. Each result is { label, ok, detail }. The milestone's name comes from its file, never from this code.
function ignoreChecks(inputs) {
  let r;
  try {
    const v = ignoreInputs(inputs);
    const taken = new Set([v.msName, ...v.otherNames, ...v.rollNeeds, ...v.required]);
    const names = v.list.map((e) => (isMap(e) ? e.name : undefined));
    const bad = names.filter((n) => typeof n !== "string" || taken.has(n));
    r = { ok: bad.length === 0, detail: `names not allowed: ${bad.map(String).join(", ") || "none"}` };
  } catch (e) {
    r = { ok: false, detail: e.message };
  }
  return [{ label: IGNORE_LABEL, ok: r.ok, detail: r.detail }];
}

// m1, on the test workflow text. The dispatch step must read the switch, and the job env must hold
// "on" exactly when the proof is in the rollup's needs, and "off" otherwise.
function dispatchCheck(wfText) {
  const fail = (detail) => ({ label: DISPATCH_LABEL, ok: false, detail });
  if (wfText === null) return fail("no readable test workflow");
  let jobs;
  try {
    jobs = parseWorkflow(wfText).jobs;
  } catch (e) {
    return fail(`test workflow does not parse: ${e.message}`);
  }
  const job = isMap(jobs) ? jobs[MILESTONE_DUE] : undefined;
  if (!isMap(job)) return fail(`no ${MILESTONE_DUE} job`);
  const dispatch = steps(job).filter((s) => typeof s.run === "string" && s.run.includes(DISPATCH_RUN));
  if (dispatch.length !== 1) return fail(`dispatch steps: ${dispatch.length}`);
  const cond = normIf(ifText(dispatch[0])).replace(/"/g, "'");
  const wired = !cond.includes("||") && cond.replace(/[()]/g, "").split("&&").includes(SWITCH_TERM);
  const value = isMap(job.env) ? job.env[SWITCH] : undefined;
  const want = needsOf(jobs[ROLLUP]).includes(PROOF) ? "on" : "off";
  return {
    label: DISPATCH_LABEL,
    ok: wired && value === want,
    detail: `dispatch step reads ${SWITCH}: ${wired}; job env ${SWITCH}: ${JSON.stringify(value ?? null)}; want ${JSON.stringify(want)}`,
  };
}

// ---- The UI-test checks k1 to k5, and the readers they use ----
// GNU make reads the Makefile itself. make -f - takes the text on stdin, so no file is written, and
// make -n prints a recipe without running it. A make that cannot run throws, and the check that
// needed it fails with that reason.
const MAKEFILE = resolve(ROOT, "Makefile");
const UI_DIR = resolve(ROOT, "native/ManifestUITests");
// An xcodebuild test run, or the sim-test wrapper that runs one.
const UI_RUN = /xcodebuild test\b|\bsim-test\b/;
const SIM_IOS_27_1 = /\bxcrun simctl create\b.*\bcom\.apple\.CoreSimulator\.SimRuntime\.iOS-27-1(?![\w-])/;
const ONLY_FLAG = /-only-testing:ManifestUITests\/(\w+)/g;
const SKIP_FLAG = /-skip-testing:ManifestUITests\/(\w+)/g;
const JOB_MINUTES = [45, 50];
const duoOf = (classes) => classes.filter((c) => c.startsWith("Duo")).sort();
const listOf = (value) => value.split(/\s+/).filter((w) => w !== "");
const flagsIn = (text, re) => new Set([...text.matchAll(re)].map((m) => m[1]));
const joinContinued = (text) => text.replace(/\\\r?\n/g, " ");
const sameList = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const stepEnv = (job, step, name) => {
  if (isMap(step.env) && typeof step.env[name] === "string") return step.env[name];
  if (isMap(job.env) && typeof job.env[name] === "string") return job.env[name];
  return undefined;
};

// Runs make with the Makefile text on stdin. A UI_TEST from the environment is dropped, so the
// Makefile's own default applies unless a step sets one.
function makeRun(makefile, args, env = {}) {
  const base = { ...process.env };
  delete base.UI_TEST;
  const r = spawnSync("make", ["-f", "-", ...args], {
    input: makefile,
    cwd: ROOT,
    encoding: "utf8",
    env: { ...base, ...env },
  });
  if (r.error) throw new Error(`make cannot run (${r.error.message})`);
  return { ok: r.status === 0, out: r.stdout ?? "", err: (r.stderr ?? "").trim() };
}

// The value and origin of each named Makefile variable. An origin of "undefined" means the name is
// not set. The probe is $(info) text at the end of the file, so no shell reads a value.
function makeVars(makefile, names) {
  const probe = names.map((n) => `$(info CI_VAR ${n}=$(origin ${n})|$(${n}))`).join("\n");
  const r = makeRun(`${makefile}\n.DEFAULT_GOAL := ci-wiring-probe\nci-wiring-probe: ;\n${probe}\n`, ["-n"]);
  if (!r.ok) throw new Error(`make could not read the Makefile: ${r.err}`);
  const vars = {};
  for (const line of r.out.split("\n")) {
    const m = /^CI_VAR (\w+)=(\w+)\|(.*)$/.exec(line);
    if (m) vars[m[1]] = { origin: m[2], value: m[3].trim() };
  }
  return vars;
}

// Swift source with comments removed and string contents blanked, so a class word in either is never
// read as code. A \( ... ) interpolation is code, and the quotes in it do not end the string around
// it. Block comments nest. A """ string ends at its own """, and a #"..."# raw string ends at "#.
function swiftCode(src) {
  let i = 0;
  const n = src.length;
  const at = (s) => src.startsWith(s, i);
  const isRawStart = (k) => {
    let j = k;
    while (src[j] === "#") j++;
    return j > k && src[j] === '"';
  };
  function blockComment() {
    let depth = 0;
    do {
      if (at("/*")) {
        depth++;
        i += 2;
      } else if (at("*/")) {
        depth--;
        i += 2;
      } else i++;
    } while (depth > 0 && i < n);
  }
  function literal(hashes) {
    const multi = hashes === 0 && at('"""');
    const close = (multi ? '"""' : '"') + "#".repeat(hashes);
    const interp = `\\${"#".repeat(hashes)}(`;
    i += multi ? 3 : 1;
    while (i < n) {
      if (!multi && src[i] === "\n") return;
      if (at(interp)) {
        i += interp.length;
        code(true);
      } else if (hashes === 0 && src[i] === "\\") {
        i += 2;
      } else if (at(close)) {
        i += close.length;
        return;
      } else i++;
    }
  }
  function code(inInterp) {
    let out = "";
    let depth = 0;
    while (i < n) {
      if (at("//")) {
        while (i < n && src[i] !== "\n") i++;
      } else if (at("/*")) {
        blockComment();
        out += " ";
      } else if (src[i] === '"') {
        literal(0);
        out += '""';
      } else if (src[i] === "#" && isRawStart(i)) {
        const start = i;
        while (src[i] === "#") i++;
        literal(i - start);
        out += '""';
      } else {
        if (inInterp && src[i] === "(") depth++;
        if (inInterp && src[i] === ")") {
          if (depth === 0) {
            i++;
            return out;
          }
          depth--;
        }
        out += src[i];
        i++;
      }
    }
    return out;
  }
  return code(false);
}

const SWIFT_DECL = /\bclass\s+(\w+)\s*:\s*(\w+)/g;
const swiftDecls = (src) => [...swiftCode(src).matchAll(SWIFT_DECL)].map((m) => ({ name: m[1], superclass: m[2] }));

// The test classes: each class whose superclass is XCTestCase or another test class.
function testClassesOf(decls) {
  const tests = new Set();
  for (let grew = true; grew; ) {
    grew = false;
    for (const d of decls) {
      if (!tests.has(d.name) && (d.superclass === "XCTestCase" || tests.has(d.superclass))) {
        tests.add(d.name);
        grew = true;
      }
    }
  }
  return [...tests].sort();
}

// The UI test classes in every Swift file of a folder. An extension is not a class, so it adds none.
function swiftTestClasses(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".swift")).sort();
  return testClassesOf(files.flatMap((f) => swiftDecls(readFileSync(join(dir, f), "utf8"))));
}
// The UI test classes of this repo, or undefined when the folder cannot be read.
function repoTestClasses() {
  try {
    return swiftTestClasses(UI_DIR);
  } catch {
    return undefined;
  }
}

// The commands of a run script, one per line. A backslash at a line end joins the next line. A #
// starts a comment only outside quotes and after a space, as sh reads it.
function shellLines(text) {
  return joinContinued(String(text)).split("\n").map(shellStrip).map((l) => l.trim());
}
function shellStrip(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

// The make -n expansion of one make line, with the UI_TEST that its step sets and any extra env.
function expandLine(makefile, targets, uiTest, extraEnv = {}) {
  if (targets.length === 0) return { error: "a make line names no target" };
  const env = uiTest === undefined ? { ...extraEnv } : { ...extraEnv, UI_TEST: uiTest };
  const r = makeRun(makefile, ["-n", ...targets], env);
  return r.ok ? { text: joinContinued(r.out) } : { error: `make -n ${targets.join(" ")} failed: ${r.err}` };
}

// What one job runs: the expansion of each make line in its run scripts, or the error that stopped it.
// extraEnv is the runner's env for the make run, such as SIM_UDID from $GITHUB_ENV.
function jobTests(job, makefile, classes, extraEnv = {}) {
  const parts = [];
  for (const step of steps(job)) {
    if (typeof step.run !== "string") continue;
    const uiTest = stepEnv(job, step, "UI_TEST");
    for (const line of shellLines(step.run)) {
      if (!/^make(\s|$)/.test(line)) continue;
      const targets = line
        .split(/\s+/)
        .slice(1)
        .filter((t) => t !== "" && !t.startsWith("-") && !t.includes("="));
      parts.push(expandLine(makefile, targets, uiTest, extraEnv));
    }
  }
  const error = parts.find((p) => p.error)?.error;
  const text = parts.map((p) => p.text ?? "").join("\n");
  // The classes a run selects: the -only-testing set, or every class, less the -skip-testing set.
  const only = flagsIn(text, ONLY_FLAG);
  const skip = flagsIn(text, SKIP_FLAG);
  const base = only.size > 0 ? [...only] : classes;
  return { error, text, ui: UI_RUN.test(text), selected: base.filter((c) => !skip.has(c)).sort() };
}

// The simulator id that CI sets in $GITHUB_ENV. A test runs make and the shell with this fake one.
const CI_UDID = "TEST-UDID-1234";
const CI_DESTINATION = `platform=iOS Simulator,id=${CI_UDID}`;

// The argument list that xcodebuild gets from one printed command. sh runs the line, with xcodebuild
// set to a shell function that prints each argument on its own line, so no Xcode runs. sh expands
// $SIM_UDID from the environment, as the runner's shell does.
function xcodebuildArgs(line) {
  const shim = 'xcodebuild() { for a in "$@"; do printf "%s\\n" "$a"; done; }';
  const r = spawnSync("sh", ["-c", `${shim}\n${line}`], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, SIM_UDID: CI_UDID },
  });
  if (r.error) throw new Error(`sh cannot run (${r.error.message})`);
  if (r.status !== 0) throw new Error(`sh could not run the line (${(r.stderr ?? "").trim()})`);
  return r.stdout.replace(/\n$/, "").split("\n");
}

// The value after -destination in an argument list, or undefined when there is none.
function destinationOf(argv) {
  const i = argv.indexOf("-destination");
  return i < 0 ? undefined : argv[i + 1] ?? "";
}

// k6 for one UI-test job: each xcodebuild test line in its make expansion must get the real UDID.
function udidOfJob(job) {
  if (job.error) return { ok: false, detail: job.error };
  const lines = job.text.split("\n").filter((l) => /\bxcodebuild test\b/.test(l));
  if (lines.length === 0) return { ok: false, detail: "no xcodebuild test line in its make expansion" };
  const seen = [];
  for (const line of lines) {
    try {
      seen.push(destinationOf(xcodebuildArgs(line)) ?? "no -destination");
    } catch (e) {
      return { ok: false, detail: e.message };
    }
  }
  return {
    ok: seen.every((d) => d === CI_DESTINATION),
    detail: `xcodebuild gets destination ${seen.join(" | ")}; want ${CI_DESTINATION}`,
  };
}

// The checks k1 to k6. Each reads one input: the Makefile through make, the Swift classes, or the
// milestone workflow's jobs. A read that fails makes its check fail, and the detail says why.
function uiTestChecks({ makefile, classes, msDoc, msErr }) {
  const LABEL = {
    k1: "k1 DUO_UI_TESTS in the Makefile equals the Duo classes scanned from native/ManifestUITests",
    k2: "k2 make -n ui-test skips each Duo class",
    k3: "k3 milestone.yml has two UI-test jobs, timeout-minutes 45 and 50, and neither runs a Duo class",
    k4: "k4 each UI-test job creates its simulator on runtime iOS-27-1",
    k5: "k5 each UI test class is in exactly one of UI_TESTS_A, the B set and DUO_UI_TESTS; no class drops out",
    k6: "k6 each UI-test job's xcodebuild gets the simulator id that CI sets",
  };
  const out = [];
  const add = (id, fn) => {
    let r;
    try {
      r = fn();
    } catch (e) {
      r = { ok: false, detail: e.message };
    }
    out.push({ label: LABEL[id], ok: Boolean(r.ok), detail: r.detail ?? "" });
  };
  if (typeof makefile !== "string" || !Array.isArray(classes)) {
    const why = [typeof makefile === "string" ? "" : "no Makefile", Array.isArray(classes) ? "" : "no UI test sources"]
      .filter(Boolean)
      .join("; ");
    for (const id of Object.keys(LABEL)) out.push({ label: LABEL[id], ok: false, detail: why });
    return out;
  }
  const duo = duoOf(classes);

  add("k1", () => {
    const v = makeVars(makefile, ["DUO_UI_TESTS"]).DUO_UI_TESTS;
    if (v.origin === "undefined") {
      return { ok: false, detail: `DUO_UI_TESTS is not set in the Makefile; scanned Duo classes: ${duo.join(" ") || "none"}` };
    }
    const listed = listOf(v.value);
    const missing = duo.filter((c) => !listed.includes(c));
    const extra = listed.filter((c) => !duo.includes(c));
    return {
      ok: missing.length === 0 && extra.length === 0,
      detail: `not listed: ${missing.join(" ") || "none"}; listed but not a Duo class: ${extra.join(" ") || "none"}`,
    };
  });

  add("k2", () => {
    const r = makeRun(makefile, ["-n", "ui-test"]);
    if (!r.ok) return { ok: false, detail: `make -n ui-test failed: ${r.err}` };
    const skipped = flagsIn(joinContinued(r.out), SKIP_FLAG);
    const missing = duo.filter((c) => !skipped.has(c));
    return {
      ok: duo.length > 0 && missing.length === 0,
      detail: `ui-test does not skip: ${missing.join(" ") || (duo.length ? "none" : "no Duo class scanned")}`,
    };
  });

  const jobs = msDoc && isMap(msDoc.jobs) ? Object.entries(msDoc.jobs).filter(([, j]) => isMap(j)) : undefined;
  let ran = [];
  let ranErr;
  try {
    ran = (jobs ?? []).map(([id, job]) => ({ id, job, ...jobTests(job, makefile, classes, { SIM_UDID: CI_UDID }) }));
  } catch (e) {
    ranErr = e.message;
  }
  const uiJobs = ran.filter((j) => j.ui);
  const gate = () => {
    if (jobs === undefined) return { ok: false, detail: msErr ?? "no milestone workflow" };
    if (ranErr !== undefined) return { ok: false, detail: ranErr };
    return null;
  };

  add("k3", () => {
    const gated = gate();
    if (gated) return gated;
    const errs = ran.filter((j) => j.error).map((j) => `${j.id}: ${j.error}`);
    if (errs.length > 0) return { ok: false, detail: errs.join("; ") };
    const minutes = uiJobs.map((j) => Number(j.job["timeout-minutes"])).sort((x, y) => x - y);
    const duoRuns = uiJobs.flatMap((j) =>
      j.selected.filter((c) => c.startsWith("Duo")).map((c) => `${j.id} runs ${c}`)
    );
    const shape = uiJobs.map((j) => `${j.id} (timeout ${j.job["timeout-minutes"] ?? "none"})`).join(", ");
    return {
      ok: uiJobs.length === 2 && JSON.stringify(minutes) === JSON.stringify(JOB_MINUTES) && duoRuns.length === 0,
      detail: `UI-test jobs: ${shape || "none"}; ${duoRuns.join("; ") || "no Duo class run"}`,
    };
  });

  add("k4", () => {
    const gated = gate();
    if (gated) return gated;
    const bad = uiJobs.filter((j) => !shellLines(runText(j.job)).some((l) => SIM_IOS_27_1.test(l))).map((j) => j.id);
    return {
      ok: uiJobs.length > 0 && bad.length === 0,
      detail: `UI-test jobs with no simctl create on iOS-27-1: ${bad.join(", ") || (uiJobs.length ? "none" : "no UI-test job")}`,
    };
  });

  add("k5", () => {
    const gated = gate();
    if (gated) return gated;
    const named = makeVars(makefile, ["UI_TESTS_A"]).UI_TESTS_A;
    if (named.origin === "undefined") return { ok: false, detail: "UI_TESTS_A is not set in the Makefile" };
    const a = listOf(named.value);
    const b = classes.filter((c) => !a.includes(c) && !duo.includes(c));
    const unknown = a.filter((c) => !classes.includes(c));
    const both = a.filter((c) => duo.includes(c));
    const first = uiJobs.find((j) => Number(j.job["timeout-minutes"]) === 45);
    const second = uiJobs.find((j) => Number(j.job["timeout-minutes"]) === 50);
    if (!first || !second) return { ok: false, detail: "no UI-test job with timeout-minutes 45 and one with 50" };
    const covered = [...first.selected, ...second.selected];
    const dropped = classes.filter((c) => !duo.includes(c) && !covered.includes(c));
    const twice = [...new Set(covered.filter((c, idx) => covered.indexOf(c) !== idx))];
    return {
      ok:
        a.length > 0 &&
        unknown.length === 0 &&
        both.length === 0 &&
        sameList(first.selected, a) &&
        sameList(second.selected, b) &&
        dropped.length === 0 &&
        twice.length === 0,
      detail:
        `A: ${a.join(" ") || "empty"}; timeout 45 runs ${first.selected.join(" ") || "none"}; ` +
        `timeout 50 runs ${second.selected.join(" ") || "none"}; unknown ${unknown.join(" ") || "none"}; ` +
        `in A and Duo ${both.join(" ") || "none"}; dropped ${dropped.join(" ") || "none"}; ` +
        `twice ${twice.join(" ") || "none"}`,
    };
  });

  // k6 has one result per UI-test job, so a red shows which job's destination is wrong.
  const gated6 = gate();
  if (gated6) out.push({ label: `${LABEL.k6}: ${gated6.detail}`, ok: false, detail: gated6.detail });
  else if (uiJobs.length === 0) out.push({ label: `${LABEL.k6}: no UI-test job`, ok: false, detail: "" });
  else
    for (const j of uiJobs) {
      const r = udidOfJob(j);
      out.push({ label: `k6 ${j.id} the simulator id reaches xcodebuild as the real UDID`, ok: r.ok, detail: r.detail });
    }

  return out;
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
    makefile: readOrNull(MAKEFILE),
    classes: repoTestClasses(),
  });
  for (const r of results) expect(r.label, r.ok, r.detail);
}

// The milestone-proof job and its place in the rollup and ci-done, read from the repo.
{
  let jobs;
  try {
    const text = readOrNull(WORKFLOW);
    jobs = text === null ? undefined : parseWorkflow(text).jobs;
  } catch {
    jobs = undefined;
  }
  if (jobs === undefined) expect(`${PROOF} checks: ${WORKFLOW} parses`, false, "no parsed jobs map");
  else for (const r of milestoneProofChecks(jobs)) expect(r.label, r.ok, r.detail);
}

// The dispatch switch (m1) and the merge ignore list (m2), read from the repo. The other workflows' names come from their files.
{
  let names = [];
  let namesOk = true;
  try {
    const dir = resolve(ROOT, ".github/workflows");
    names = readdirSync(dir)
      .filter((f) => /\.ya?ml$/.test(f) && resolve(dir, f) !== MILESTONE)
      .map((f) => parseWorkflow(readFileSync(resolve(dir, f), "utf8")).name)
      .filter((n) => typeof n === "string");
  } catch {
    namesOk = false;
  }
  const wfText = readOrNull(WORKFLOW);
  const results = [
    dispatchCheck(wfText),
    ...ignoreChecks({
      stampText: readOrNull(STAMP),
      msText: readOrNull(MILESTONE),
      wfText,
      otherNames: namesOk ? names : null,
    }),
  ];
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
  ["rollup needs milestone-proof before its first green run", wf({ needs: [...NEEDS, PROOF] }), GOOD_STAMP, "4"],
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

// Milestone fixtures. The good file has two UI-test jobs, one per timeout. Each red case varies
// one field of it, so it fails only the assertion it names. The Makefile fixture holds the recipes
// the UI checks read, and the Swift classes are a fixed list.
const FIX_CLASSES = ["AuditSkippingTabBarUITests", "DuoHandUITests", "TallyUITests"];
// One Makefile for the UI checks. Each option breaks one recipe or variable.
function fixtureMakefile(o = {}) {
  const duo = o.duo ?? "DuoHandUITests";
  const a = o.a ?? "AuditSkippingTabBarUITests";
  const uiTest = o.uiTest ?? `xcodebuild test -skip-testing:ManifestUITests/${duo}`;
  const uiA = o.uiA ?? "xcodebuild test -only-testing:ManifestUITests/AuditSkippingTabBarUITests";
  const uiB =
    o.uiB ??
    `xcodebuild test -skip-testing:ManifestUITests/${duo} -skip-testing:ManifestUITests/AuditSkippingTabBarUITests`;
  // The UI recipes run $(UI_TEST) with the test's arguments, as the Makefile does. Each uiA or uiB
  // text starts with "xcodebuild test", and that word is what the recipe swaps for $(UI_TEST).
  const runIt = (text) => `\t$(UI_TEST)${text.slice("xcodebuild test".length)}`;
  return [
    `DUO_UI_TESTS := ${duo}`,
    ...(o.noA ? [] : [`UI_TESTS_A := ${a}`]),
    "ui-test:",
    `\t@echo ${uiTest}`,
    "ui-a:",
    runIt(uiA),
    "ui-b:",
    runIt(uiB),
    "",
  ].join("\n");
}
const FIX_MAKEFILE = fixtureMakefile();
const FIX_INPUTS = { makefile: FIX_MAKEFILE, classes: FIX_CLASSES };
const SIM_RUNTIME = "com.apple.CoreSimulator.SimRuntime.iOS-27-1";
// The UI_TEST value that milestone.yml sets: a $$ in the value is one $ after make expands it. The
// broken form has one $, so make reads $S and prints id=IM_UDID.
const UI_TEST_FIXED = 'xcodebuild test -destination "platform=iOS Simulator,id=$$SIM_UDID" -collect-test-diagnostics never';
const UI_TEST_BROKEN = 'xcodebuild test -destination "platform=iOS Simulator,id=$SIM_UDID" -collect-test-diagnostics never';
// One UI-test job. Its run creates the simulator with the line `sim` and runs one make line with the
// step env UI_TEST set to `ui`.
function msJob(id, minutes, target, sim = `xcrun simctl create ci-sim "iPhone 18 Pro" ${SIM_RUNTIME}`, ui = UI_TEST_FIXED) {
  return [
    `  ${id}:`,
    "    if: ${{ !github.event.pull_request.draft }}",
    "    runs-on: xcode-27",
    `    timeout-minutes: ${minutes}`,
    "    steps:",
    "      - name: select Xcode 27.1",
    "        run: |",
    "          sudo xcode-select -s /Applications/Xcode_27.1.app",
    "          xcodebuild -version",
    "      - name: create the iOS 27.1 simulator",
    "        run: |",
    `          ${sim}`,
    "      - name: the UI tests",
    "        env:",
    `          UI_TEST: ${ui}`,
    `        run: ${target}`,
  ];
}
const MS_HEAD = [
  "name: milestone",
  "on:",
  "  workflow_dispatch:",
  "permissions:",
  "  contents: read",
  "jobs:",
];
const msFile = (...jobs) => [...MS_HEAD, ...jobs.flat()].join("\n") + "\n";
const MS_GOOD = msFile(msJob("part-a", 45, "make ui-a"), msJob("part-b", 50, "make ui-b"));
const MS_RED = [
  ["a: a push trigger is added", mutate(MS_GOOD, "on:\n", "on:\n  push:\n    branches: [main]\n"), "a"],
  ["a: a schedule trigger is added", mutate(MS_GOOD, "on:\n", 'on:\n  schedule:\n    - cron: "0 5 * * *"\n'), "a"],
  [
    "a: a pull_request trigger on its own path is added",
    mutate(MS_GOOD, "on:\n", `on:\n  pull_request:\n    paths:\n      - ${MILESTONE_OWN}\n`),
    "a",
  ],
  [
    "a: a pull_request trigger with a widened path is added",
    mutate(MS_GOOD, "on:\n", 'on:\n  pull_request:\n    paths:\n      - "src/**"\n'),
    "a",
  ],
  ["a: a pull_request trigger with no paths is added", mutate(MS_GOOD, "on:\n", "on:\n  pull_request:\n"), "a"],
  ["a2: the part-a job-level if: has no draft guard", mutate(MS_GOOD, "    if: ${{ !github.event.pull_request.draft }}\n", ""), "a2"],
  ["a2: a third job is added", MS_GOOD + "  extra:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n", "a2"],
  ["b: part-a runs on macos-26", mutate(MS_GOOD, "runs-on: xcode-27", "runs-on: macos-26"), "b"],
  ["b: part-a selects Xcode 26", mutate(MS_GOOD, "Xcode_27.1", "Xcode_26.4"), "b"],
  ["c: part-b runs an echo, not a make target", mutate(MS_GOOD, "run: make ui-b", "run: echo ok"), "c"],
  ["c: make ui-b is only in a comment", mutate(MS_GOOD, "run: make ui-b", "run: echo ok # make ui-b"), "c"],
  ["k1: a Duo class is scanned but not listed", MS_GOOD, "k1", { classes: [...FIX_CLASSES, "DuoNewUITests"] }],
  ["k1: DUO_UI_TESTS is not set", MS_GOOD, "k1", { makefile: FIX_MAKEFILE.replace("DUO_UI_TESTS := DuoHandUITests\n", "") }],
  ["k2: ui-test skips no Duo class", MS_GOOD, "k2", { makefile: fixtureMakefile({ uiTest: "xcodebuild test" }) }],
  ["k3: part-a's timeout is 60", mutate(MS_GOOD, "timeout-minutes: 45", "timeout-minutes: 60"), "k3"],
  [
    "k3: part-b runs a Duo class",
    MS_GOOD,
    "k3",
    { makefile: fixtureMakefile({ uiB: "xcodebuild test -skip-testing:ManifestUITests/AuditSkippingTabBarUITests" }) },
  ],
  [
    "k3: a third UI-test job is added",
    msFile(msJob("part-a", 45, "make ui-a"), msJob("part-b", 50, "make ui-b"), msJob("part-c", 50, "make ui-a")),
    "k3",
  ],
  [
    "k4: part-b creates its simulator on iOS 27.0",
    msFile(
      msJob("part-a", 45, "make ui-a"),
      msJob("part-b", 50, "make ui-b", 'xcrun simctl create ci-sim "iPhone 18 Pro" com.apple.CoreSimulator.SimRuntime.iOS-27-0')
    ),
    "k4",
  ],
  [
    "k4: the runtime is only in a comment",
    msFile(
      msJob("part-a", 45, "make ui-a", `# xcrun simctl create ci-sim "iPhone 18 Pro" ${SIM_RUNTIME}`),
      msJob("part-b", 50, "make ui-b")
    ),
    "k4",
  ],
  [
    "k4: the runtime is only in a comment that has a lone apostrophe",
    msFile(
      msJob("part-a", 45, "make ui-a", `# don't: xcrun simctl create ci-sim "iPhone 18 Pro" ${SIM_RUNTIME}`),
      msJob("part-b", 50, "make ui-b")
    ),
    "k4",
  ],
  [
    "k4: the runtime is on a simctl boot, not a create",
    msFile(
      msJob("part-a", 45, "make ui-a", `xcrun simctl boot "iPhone 18 Pro" ${SIM_RUNTIME}`),
      msJob("part-b", 50, "make ui-b")
    ),
    "k4",
  ],
  [
    "k5: UI_TESTS_A names a class that does not exist",
    MS_GOOD,
    "k5",
    { makefile: fixtureMakefile({ a: "AuditSkippingTabBarUITests GhostUITests" }) },
  ],
  ["k5: UI_TESTS_A is not set", MS_GOOD, "k5", { makefile: fixtureMakefile({ noA: true }) }],
  [
    "k5: part-b skips only the Duo class, so a class of A runs twice",
    MS_GOOD,
    "k5",
    { makefile: fixtureMakefile({ uiB: "xcodebuild test -skip-testing:ManifestUITests/DuoHandUITests" }) },
  ],
  [
    "k5: a class is in neither job",
    MS_GOOD,
    "k5",
    {
      makefile: fixtureMakefile({
        uiB: "xcodebuild test -skip-testing:ManifestUITests/DuoHandUITests -skip-testing:ManifestUITests/AuditSkippingTabBarUITests -skip-testing:ManifestUITests/TallyUITests",
      }),
    },
  ],
  // k6: the UI_TEST value reaches xcodebuild with a wrong or empty id, or no xcodebuild runs at all.
  ["k6: part-a's destination is id=IM_UDID", msFile(msJob("part-a", 45, "make ui-a", undefined, UI_TEST_BROKEN), msJob("part-b", 50, "make ui-b")), "k6"],
  ["k6: part-b's destination is id=IM_UDID", msFile(msJob("part-a", 45, "make ui-a"), msJob("part-b", 50, "make ui-b", undefined, UI_TEST_BROKEN)), "k6"],
  ["k6: part-b's UI_TEST is sim-test, so no xcodebuild runs", msFile(msJob("part-a", 45, "make ui-a"), msJob("part-b", 50, "make ui-b", undefined, "sim-test")), "k6"],
];
const MS_CHECKS = ["a", "a2", "b", "c", "k1", "k2", "k3", "k4", "k5", "k6"];
for (const [name, text, id, extra = {}] of MS_RED) {
  const results = milestoneChecks({ msText: text, wfText: null, read: () => null, ...FIX_INPUTS, ...extra });
  const bad = results.filter((r) => !r.ok);
  expect(
    `fixture red: ${name} fails assertion ${id}`,
    bad.some((r) => r.label.split(" ")[0] === id),
    `failing: ${bad.map((r) => r.label.split(" ")[0]).join(", ") || "none"}`
  );
}
{
  const results = milestoneChecks({ msText: MS_GOOD, wfText: null, read: () => null, ...FIX_INPUTS });
  const bad = results.filter((r) => MS_CHECKS.includes(r.label.split(" ")[0]) && !r.ok);
  expect(
    "fixture good: the two-job milestone file passes a, a2, b, c and k1 to k6",
    bad.length === 0,
    bad.map((r) => `${r.label} (${r.detail})`).join("; ")
  );
}
const MS_GREEN = [
  [
    "a run line with a quoted hash before the create, which is not a comment",
    msFile(
      msJob("part-a", 45, "make ui-a", `echo "#" && xcrun simctl create ci-sim "iPhone 18 Pro" ${SIM_RUNTIME}`),
      msJob("part-b", 50, "make ui-b")
    ),
  ],
  [
    "a braced make reference to SIM_UDID, which make expands from the environment, reaches xcodebuild too",
    msFile(
      msJob("part-a", 45, "make ui-a", undefined, UI_TEST_BROKEN.replace("$SIM_UDID", "${SIM_UDID}")),
      msJob("part-b", 50, "make ui-b")
    ),
  ],
];
for (const [name, text] of MS_GREEN) {
  const results = milestoneChecks({ msText: text, wfText: null, read: () => null, ...FIX_INPUTS });
  const bad = results.filter((r) => MS_CHECKS.includes(r.label.split(" ")[0]) && !r.ok);
  expect(`fixture good: ${name} passes a to k5`, bad.length === 0, bad.map((r) => `${r.label} (${r.detail})`).join("; "));
}

// Scanner cases. Each reader gets a comment opener inside a string, a multi-line string, and a lone
// quote in text. The Swift reader also gets an interpolation with nested quotes and a raw string.
const SWIFT_CASES = [
  ["a Duo class in a line comment is not a class", "// final class DuoOld: XCTestCase {}\nfinal class DuoReal: XCTestCase {}\n", ["DuoReal"]],
  ["a Duo class in a block comment is not a class", "/* final class DuoOld: XCTestCase {} */\nfinal class DuoReal: XCTestCase {}\n", ["DuoReal"]],
  ["a nested block comment ends at its own close", "/* a /* b */ final class DuoOld: XCTestCase {} */\nfinal class DuoReal: XCTestCase {}\n", ["DuoReal"]],
  ["a comment opener inside a string does not hide the class after it", 'let u = "http://x"; final class DuoReal: XCTestCase {}\n', ["DuoReal"]],
  ["a block opener inside a string does not hide the class after it", 'let s = "/* open"\nfinal class DuoReal: XCTestCase {}\n', ["DuoReal"]],
  ["a class inside a multi-line string is not a class", 'let t = """\nfinal class DuoFake: XCTestCase {}\n"""\nfinal class DuoReal: XCTestCase {}\n', ["DuoReal"]],
  ["a quote inside an interpolation does not end the string", 'let t = "\\(a ?? "-") x"\nfinal class DuoReal: XCTestCase {}\n', ["DuoReal"]],
  ["a lone quote in a comment does not open a string", '// say "hi and don\'t stop\nfinal class DuoReal: XCTestCase {}\n', ["DuoReal"]],
  ["a class inside a raw string is not a class", 'let r = #"final class DuoFake: XCTestCase {}"#\nfinal class DuoReal: XCTestCase {}\n', ["DuoReal"]],
  ["a subclass of a test class is a test class", "class DuoBase: XCTestCase {}\nfinal class DuoSub: DuoBase {}\n", ["DuoBase", "DuoSub"]],
  ["an extension of XCTestCase is not a class", "extension XCTestCase {\n  func helper() {}\n}\nfinal class DuoReal: XCTestCase {}\n", ["DuoReal"]],
  ["a class that is not a test class is left out", "final class DuoHelper: NSObject {}\nfinal class DuoReal: XCTestCase {}\n", ["DuoReal"]],
];
for (const [name, src, want] of SWIFT_CASES) {
  const got = testClassesOf(swiftDecls(src));
  expect(`swift reader: ${name}`, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}`);
}
const SHELL_CASES = [
  ["a # inside quotes is not a comment", 'echo "#" && make ui-a', ['echo "#" && make ui-a']],
  ["a comment after a command is cut", "echo ok # make ui-a", ["echo ok"]],
  ["a comment with a lone apostrophe is cut", "# don't make ui-a", [""]],
  ["a lone apostrophe in a comment after a command is cut", "echo ok # it's", ["echo ok"]],
  ["a backslash line end joins the next line", "echo one \\\n  two", ["echo one two"]],
];
for (const [name, text, want] of SHELL_CASES) {
  const got = shellLines(text).map((l) => l.replace(/\s+/g, " "));
  expect(`shell reader: ${name}`, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}`);
}
{
  const v = makeVars(FIX_MAKEFILE, ["DUO_UI_TESTS", "NOT_SET_HERE"]);
  expect(
    "make reader: a set name reads its value, and an unset name reads as undefined",
    v.DUO_UI_TESTS?.value === "DuoHandUITests" && v.NOT_SET_HERE?.origin === "undefined",
    JSON.stringify(v)
  );
  const w = makeVars("X := a\\#b\nY := don't\n", ["X", "Y"]);
  expect(
    "make reader: an escaped # is a value, and a lone apostrophe is a value",
    w.X?.value === "a#b" && w.Y?.value === "don't",
    JSON.stringify(w)
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

// Assertions i and j fixtures. PROOF_JOB_TEXT is the job as the proof needs it: a draft guard,
// contents and actions read, a checkout, and one run line. Each red case changes one piece of
// it with mutate(). The green controls keep a valid run that holds a comment opener, a lone
// apostrophe or a CLI argument.
const PROOF_JOB_TEXT = [
  `  ${PROOF}:`,
  "    if: ${{ !github.event.pull_request.draft }}",
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 5",
  "    permissions:",
  "      contents: read",
  "      actions: read",
  "    steps:",
  "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
  "        with:",
  "          persist-credentials: false",
  "      - name: fail unless the newest milestone run on main passed",
  "        env:",
  "          GITHUB_TOKEN: ${{ github.token }}",
  `        run: ${PROOF_RUN}`,
].join("\n") + "\n";
const PROOF_BASE = mutate(
  PRE_TEXT + MS_JOB_TEXT + PROOF_JOB_TEXT + rollupJob({ needs: [...NEEDS, MILESTONE_DUE] }),
  "  ci-done:\n    needs: [suite, screens, scope, native, zizmor, ste-lint]\n",
  "  ci-done:\n    needs: [suite, screens, scope, native, zizmor, ste-lint, milestone-due]\n"
);
const proofResults = (text) => milestoneProofChecks(fJobs(text));
{
  const r = proofResults(PROOF_BASE);
  expect(
    "fixture good: the proof job, its staged rollup and the ci-done need pass i1 to j",
    r.every((x) => x.ok),
    r
      .filter((x) => !x.ok)
      .map((x) => `${x.label} (${x.detail})`)
      .join("; ")
  );
}
const PROOF_RED = [
  ["the proof job is missing", mutate(PROOF_BASE, PROOF_JOB_TEXT, ""), "i1"],
  [
    "the rollup needs the proof before its first green run",
    mutate(PROOF_BASE, "      - milestone-due\n", "      - milestone-due\n      - milestone-proof\n"),
    "i2",
  ],
  [
    "the proof's permissions are write-all",
    mutate(PROOF_BASE, "    permissions:\n      contents: read\n      actions: read\n", "    permissions: write-all\n"),
    "i3",
  ],
  ["the proof has actions: write", mutate(PROOF_BASE, "      actions: read\n", "      actions: write\n"), "i3"],
  [
    "the proof also has id-token: write",
    mutate(PROOF_BASE, "      actions: read\n", "      actions: read\n      id-token: write\n"),
    "i3",
  ],
  ["the proof has no actions: read", mutate(PROOF_BASE, "      actions: read\n", ""), "i3"],
  [
    "the proof has no permissions block",
    mutate(PROOF_BASE, "    permissions:\n      contents: read\n      actions: read\n", ""),
    "i3",
  ],
  [
    "the proof runs the native-paths form",
    mutate(
      PROOF_BASE,
      `        run: ${PROOF_RUN}`,
      "        run: node scripts/milestone-due.mjs --native-paths .github/native-paths.regex"
    ),
    "i4",
  ],
  [
    "the proof command is only in a trailing YAML comment",
    mutate(PROOF_BASE, `        run: ${PROOF_RUN}`, `        run: echo ok # ${PROOF_RUN}`),
    "i4",
  ],
  [
    "the proof command is only after a quoted comment opener in a block",
    mutate(PROOF_BASE, `        run: ${PROOF_RUN}`, `        run: |\n          echo "# ${PROOF_RUN}"`),
    "i4",
  ],
  [
    "the proof step has the push-to-main guard",
    mutate(
      PROOF_BASE,
      "      - name: fail unless the newest milestone run on main passed\n",
      `      - name: fail unless the newest milestone run on main passed\n${PUSH_MAIN_IF}\n`
    ),
    "i5",
  ],
  [
    "the checkout step has an event guard",
    mutate(
      PROOF_BASE,
      "          persist-credentials: false\n      - name: fail unless",
      "          persist-credentials: false\n        if: ${{ github.event_name == 'push' }}\n      - name: fail unless"
    ),
    "i5",
  ],
  [
    "the job-level if names the push event",
    mutate(
      PROOF_BASE,
      "  milestone-proof:\n    if: ${{ !github.event.pull_request.draft }}\n",
      "  milestone-proof:\n    if: ${{ !github.event.pull_request.draft && github.event_name == 'push' }}\n"
    ),
    "i5",
  ],
  [
    "the job-level if reads a ref",
    mutate(
      PROOF_BASE,
      "  milestone-proof:\n    if: ${{ !github.event.pull_request.draft }}\n",
      "  milestone-proof:\n    if: ${{ !github.event.pull_request.draft && github.ref == 'refs/heads/main' }}\n"
    ),
    "i5",
  ],
  [
    "ci-done needs the proof before its first green run",
    mutate(PROOF_BASE, "ste-lint, milestone-due]", "ste-lint, milestone-due, milestone-proof]"),
    "j",
  ],
];
for (const [name, text, id] of PROOF_RED) {
  let r;
  try {
    r = proofResults(text);
  } catch (e) {
    r = [{ label: `0 parse: ${e.message}`, ok: false, detail: e.message }];
  }
  const bad = r.filter((x) => !x.ok);
  expect(
    `fixture red: ${name} fails assertion ${id}`,
    bad.some((x) => x.label.split(" ")[0] === id),
    `failing: ${bad.map((x) => x.label.split(" ")[0]).join(", ") || "none"}`
  );
}
const PROOF_GREEN = [
  [
    "the proof command on a later line of a block, after a quoted comment opener and a lone apostrophe",
    mutate(
      PROOF_BASE,
      `        run: ${PROOF_RUN}`,
      `        run: |\n          echo "# not a comment"\n          echo don't\n          ${PROOF_RUN}`
    ),
  ],
  [
    "the proof command with a branch argument",
    mutate(PROOF_BASE, `        run: ${PROOF_RUN}`, `        run: ${PROOF_RUN} --branch main`),
  ],
  [
    "the proof command with a YAML trailing comment holding a lone apostrophe",
    mutate(PROOF_BASE, `        run: ${PROOF_RUN}`, `        run: ${PROOF_RUN} # don't`),
  ],
];
for (const [name, text] of PROOF_GREEN) {
  const r = proofResults(text);
  expect(
    `fixture good: ${name} passes i1 to j`,
    r.every((x) => x.ok),
    r
      .filter((x) => !x.ok)
      .map((x) => `${x.label} (${x.detail})`)
      .join("; ")
  );
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

// ---- Fixtures for m1 and m2. The milestone file is MS_GOOD. ----
// m1 builds on MS_JOB_TEXT, the one home of the milestone-due job text. switchJob adds the job env
// key when value is given, and the dispatch step's if: reads the switch unless wired is false.
function switchJob(value, wired = true) {
  let t = MS_JOB_TEXT;
  if (value !== undefined) t = mutate(t, "    steps:\n", `    env:\n      ${SWITCH}: "${value}"\n    steps:\n`);
  if (wired) {
    t = mutate(
      t,
      `${PUSH_MAIN_IF}\n        env:`,
      "        if: ${{ env." + SWITCH + " == 'on' && github.event_name == 'push' && github.ref == 'refs/heads/main' }}\n        env:"
    );
  }
  return t;
}
// The test workflow with the switched milestone-due job. The rollup needs the proof only when joined.
const dueWf = (value, { proofIn = false, wired = true } = {}) =>
  PRE_TEXT + switchJob(value, wired) + rollupJob({ needs: [...NEEDS, MILESTONE_DUE, ...(proofIn ? [PROOF] : [])] });
const M1_RED = [
  ["the dispatch is on while the proof is outside the rollup", dueWf("on")],
  ["the dispatch is off while the proof is inside the rollup", dueWf("off", { proofIn: true })],
  ["the dispatch step does not read the switch", dueWf("off", { wired: false })],
  ["the job env has no switch", dueWf(undefined)],
];
const M1_GREEN = [
  ["the switch is off and read, while the proof is outside", dueWf("off")],
  ["the switch is on and read, once the proof is inside", dueWf("on", { proofIn: true })],
];
for (const [name, text] of M1_RED) {
  const r = dispatchCheck(text);
  expect(`fixture red: ${name} fails assertion m1`, !r.ok, r.detail);
}
for (const [name, text] of M1_GREEN) {
  const r = dispatchCheck(text);
  expect(`fixture good: ${name} passes m1`, r.ok, r.detail);
}

// m2. Each case gives its stamp; the milestone file and the test workflow are the same in every case.
const IGNORE_ENTRY = (name) => ({ name });
const STAMP_MERGE = { method: "merge", requiredChecks: [ROLLUP], deadlineMinutes: 65 };
const stampWith = (list) =>
  JSON.stringify({ merge: list === undefined ? STAMP_MERGE : { ...STAMP_MERGE, ignoreChecks: list } }) + "\n";
const WF_STAGED = wf({});
const IGNORE_RED = [
  ["the entry names the test workflow", { stampText: stampWith([IGNORE_ENTRY("test")]) }],
  ["the entry names the milestone workflow", { stampText: stampWith([IGNORE_ENTRY("milestone")]) }],
  ["the entry names the milestone workflow under its file's own name", { stampText: stampWith([IGNORE_ENTRY("nightly")]), msText: MS_GOOD.replace("name: milestone", "name: nightly") }],
  ["the entry names a job in all-jobs-passed's needs", { stampText: stampWith([IGNORE_ENTRY("suite")]) }],
  ["the entry names the required check", { stampText: stampWith([IGNORE_ENTRY(ROLLUP)]) }],
  ["the entry has no name", { stampText: stampWith([{ reason: "x" }]) }],
];
const IGNORE_GREEN = [
  ["no merge.ignoreChecks key", { stampText: stampWith(undefined) }],
  ["an empty merge.ignoreChecks list", { stampText: stampWith([]) }],
];
for (const [name, args] of IGNORE_RED) {
  const bad = ignoreChecks({ msText: MS_GOOD, otherNames: ["test"], wfText: WF_STAGED, ...args }).filter((r) => !r.ok);
  expect(`fixture red: ${name} fails assertion m2`, bad.length > 0, `failing: ${bad.map((r) => r.detail).join("; ") || "none"}`);
}
for (const [name, args] of IGNORE_GREEN) {
  const bad = ignoreChecks({ msText: MS_GOOD, otherNames: ["test"], wfText: WF_STAGED, ...args }).filter((r) => !r.ok);
  expect(`fixture good: ${name} passes m2`, bad.length === 0, bad.map((r) => `${r.label} (${r.detail})`).join("; "));
}

if (failures) {
  console.log(`ci-wiring: ${failures} failure(s)`);
  process.exit(1);
}
console.log("ci-wiring: all green");
