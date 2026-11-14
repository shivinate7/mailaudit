// Cases for the Duo UI workflow, the Makefile targets it runs and the Duo test classes it names.
//
// The Duo UI tests run on an iPhone Duo simulator in two poses: a flat pass and a closed pass. Two
// pro passes run the Pro simulator's classes. These checks read .github/workflows/duo-ui.yml, the
// Makefile (through make), native/ManifestUITests/*.swift, scripts/ci-sim.sh when a step runs it,
// and the ci-done pin in .github/workflows/checks.yml. Each failure names one cause:
//   d1  duo-ui.yml exists and parses; its triggers are pull_request only (a-d);
//   d2  top-level permissions are contents: read only; the duo-ui job runs on xcode-27, has a
//       positive timeout-minutes, and its if: gate runs on a ready PR or a PR with the duo-ui label, and
//       still runs on a labeled event for another label (a-d);
//   d3  DUO_CLOSED_TESTS is set and equals the Class/method ids of the Duo test methods whose body
//       calls requirePose(.closed) (a-b);
//   d4  make -n ui-duo-flat and make -n ui-duo-closed pass exactly the ids the two sets name (a-d);
//   d5  the flat, closed and pro passes run xcodebuild test-without-building with
//       -retry-tests-on-failure and -resultBundlePath; a step runs its make target when its run:
//       text names it once each $VAR and ${VAR} is read from the step, job or workflow env; the
//       flags may sit in the step, its env, the workflow env or scripts/ci-sim.sh; the closed pass's
//       if: holds !cancelled() and reads env otherwise, never success(), failure() or always(); a
//       step fetches hinge at its pinned sha (a-f);
//   d6  every uses: is pinned by a 40-hex sha, every checkout keeps no credentials, and no run:
//       block in any job holds a GitHub expression (a-c);
//   d7  ci-done needs duo-ui, pro-ui-a and pro-ui-b, and uses ci-done-comment at checks.yml's pin (a-b);
//   d8  pro-ui-a and pro-ui-b run on xcode-27 with a positive timeout-minutes, and each if: requires
//       the pro-ui label, never the draft gate alone, and still runs on a labeled event for another
//       label (a-d);
//   d9  the concurrency group sets cancel-in-progress to the literal true, not an if: expression (a),
//       and its group holds the PR draft state, so a draft run never cancels a ready run (b).
//
// The fixtures prove the checker: a good set passes, each mutant fails its named check, and the
// scanners get the comment-opener, multi-line string and lone-quote cases.
//
// The workflow reader is a copy of the subset reader in test/ci-wiring.test.mjs. That file runs its
// checks when it loads and exports nothing, and another lane owns it, so this file carries its own
// copy. The Swift reader, the make probe and the if: evaluator are new here.
//
// Run: npm run test:duo-ui-wiring (also chained from npm run test:ci-wiring). Exits 1 on any failure.

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { failLine } from "./fail-line.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW_PATH = ".github/workflows/duo-ui.yml";
const CHECKS_PATH = ".github/workflows/checks.yml";
const SWIFT_DIR = "native/ManifestUITests";
const SCRIPT_PATH = "scripts/ci-sim.sh";
const DUO_JOB = "duo-ui";
const PRO_A = "pro-ui-a";
const PRO_B = "pro-ui-b";
const CI_DONE = "ci-done";
const XCODE = "xcode-27";
const TRIGGER_TYPES = ["opened", "synchronize", "reopened", "ready_for_review", "labeled"];
const PASS_FLAGS = ["-retry-tests-on-failure", "-resultBundlePath"];
const HINGE_REPO = "artemnovichkov/hinge";
const HINGE_SHA = "afb8f0bd277cb12187f0844a79542cbac35e7385";
const CI_DONE_ACTION = "shivinate7/claude-settings/actions/ci-done-comment";
const SHA = /^[0-9a-f]{40}$/;
const DUO_FILE = /^Duo.*UITests\.swift$/;
const KEY = /^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/;
const BLOCK = /^[|>][-+0-9]*$/;
const ONLY_FLAG = /-only-testing:ManifestUITests\/(\S+)/g;
const SKIP_FLAG = /-skip-testing:ManifestUITests\/(\S+)/g;
// The target name ends where the name does, so make ui-duo-flat-old is not the flat pass.
const FLAT_RUN = /\bmake\s+ui-duo-flat(?![\w-])/;
const CLOSED_RUN = /\bmake\s+ui-duo-closed(?![\w-])/;
const PRO_A_RUN = /\bmake\s+ui-a(?![\w-])/;
const PRO_B_RUN = /\bmake\s+ui-b(?![\w-])/;

const isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const show = (v) => (v === undefined ? "nothing" : JSON.stringify(v));
const listOf = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : typeof v === "string" ? [v] : []);
const words = (s) => s.split(/\s+/).filter((w) => w !== "");
const stepsOf = (job) => (isMap(job) && Array.isArray(job.steps) ? job.steps.filter(isMap) : []);
const jobsOf = (doc) => (isMap(doc) && isMap(doc.jobs) ? Object.entries(doc.jobs).filter(([, j]) => isMap(j)) : []);
const stripWrap = (s) => String(s ?? "").trim().replace(/^\$\{\{([\s\S]*)\}\}$/, "$1").trim();
const positiveMinutes = (job) => /^[1-9]\d*$/.test(String(job["timeout-minutes"] ?? ""));
const pass = { ok: true, detail: "" };
const fail = (detail) => ({ ok: false, detail });

// Copied from the subset reader in test/ci-wiring.test.mjs (see the header for why it is not imported).
// A # starts a comment only after a space and outside a quoted scalar. A quote starts a scalar only
// where a YAML value or list item starts, so a lone apostrophe in plain text (don't) opens none.
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

// Reads the workflow subset: mappings, lists, flow lists and maps, quoted and plain scalars, and
// block scalars (kept as text). Anything else throws, so a shape the checks do not read fails loudly.
function parseYaml(text) {
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
    if (s.startsWith("{") && s.endsWith("}")) {
      const inner = s.slice(1, -1).trim();
      const out = {};
      if (inner === "") return out;
      for (const entry of inner.split(",")) {
        const i = entry.indexOf(":");
        if (i < 0) throw new Error(`flow map entry has no key: ${entry.trim()}`);
        const key = entry.slice(0, i).trim();
        if (Object.hasOwn(out, key)) throw new Error(`flow map repeats key ${key}`);
        out[key] = unquote(entry.slice(i + 1).trim());
      }
      return out;
    }
    return unquote(s);
  }
  // A block scalar's lines are blank or indented past the key that opened it. They are kept as
  // written, trimmed per line, so a comment-looking line inside a run: block is still its text.
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
  if (p < lines.length) throw new Error(`line ${p + 1} is not reached by the parser: ${lines[p].raw.trim()}`);
  return doc;
}

// Swift source with comments removed and string contents blanked. Newlines are kept, so a call word
// in a comment or a string is never read as code. Comments are read before strings, so a lone quote
// in a comment opens nothing. Block comments nest. A """ string ends at its own """.
function swiftCode(src) {
  const blank = (s) => s.replace(/[^\n]/g, " ");
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("//", i)) {
      let end = src.indexOf("\n", i);
      if (end < 0) end = src.length;
      out += blank(src.slice(i, end));
      i = end;
    } else if (src.startsWith("/*", i)) {
      let depth = 0;
      let j = i;
      do {
        if (src.startsWith("/*", j)) {
          depth++;
          j += 2;
        } else if (src.startsWith("*/", j)) {
          depth--;
          j += 2;
        } else j++;
      } while (depth > 0 && j < src.length);
      out += blank(src.slice(i, j));
      i = j;
    } else if (src.startsWith('"""', i)) {
      let j = i + 3;
      while (j < src.length && !(src.startsWith('"""', j) && src[j - 1] !== "\\")) j++;
      j = Math.min(j + 3, src.length);
      out += blank(src.slice(i, j));
      i = j;
    } else if (src[i] === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"' && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      j = Math.min(j + 1, src.length);
      out += blank(src.slice(i, j));
      i = j;
    } else {
      out += src[i];
      i++;
    }
  }
  return out;
}

// The index of the brace that closes the one at `open`, in code with comments and strings blanked.
function matchBrace(code, open) {
  let depth = 0;
  for (let j = open; j < code.length; j++) {
    if (code[j] === "{") depth++;
    else if (code[j] === "}" && --depth === 0) return j;
  }
  return code.length - 1;
}

const CLASS_DECL = /\bclass\s+(\w+)\s*:\s*\w+/g;
const TEST_FUNC = /\bfunc\s+(test\w*)\s*\(\s*\)[^{]*\{/g;
const CLOSED_CALL = /\brequirePose\s*\(\s*\.closed\s*\)/;

// The Class/method ids of the Duo test methods whose body calls requirePose(.closed). Only files named
// Duo*UITests.swift are read, and each method belongs to the last class declared before it.
function swiftClosedIds(files) {
  const ids = [];
  for (const name of Object.keys(files).sort()) {
    if (!DUO_FILE.test(name)) continue;
    const code = swiftCode(files[name]);
    const classes = [...code.matchAll(CLASS_DECL)];
    for (const m of code.matchAll(TEST_FUNC)) {
      const open = m.index + m[0].length - 1;
      const body = code.slice(open, matchBrace(code, open) + 1);
      if (!CLOSED_CALL.test(body)) continue;
      const cls = classes.filter((c) => c.index < m.index).pop();
      ids.push(`${cls ? cls[1] : "?"}/${m[1]}`);
    }
  }
  return ids;
}

// Runs make with a Makefile given on stdin. The UI_TEST variable of the caller's environment is
// removed, so only the arguments set it.
function makeRun(makefile, args) {
  const env = { ...process.env };
  delete env.UI_TEST;
  const r = spawnSync("make", ["-f", "-", ...args], { input: makefile, cwd: ROOT, encoding: "utf8", env });
  if (r.error) return { ok: false, out: "", err: `make cannot run: ${r.error.message}` };
  return { ok: r.status === 0, out: r.stdout ?? "", err: (r.stderr ?? "").trim().split("\n")[0] };
}

// The origin and value of each named variable, read by make itself. An origin of "undefined" means
// the name is not set. The probe is $(info) text after the file, so no shell reads a value.
function readVars(makefile, names) {
  const probe = names.map((n) => `$(info DUO_VAR ${n}=$(origin ${n})|$(${n}))`).join("\n");
  const r = makeRun(`${makefile}\n.DEFAULT_GOAL := duo-ui-wiring-probe\nduo-ui-wiring-probe: ;\n${probe}\n`, ["-n"]);
  if (!r.ok) return { error: `make could not read the Makefile: ${r.err}` };
  const vars = {};
  for (const line of r.out.split("\n")) {
    const m = /^DUO_VAR (\w+)=([^|]+)\|(.*)$/.exec(line);
    if (m) vars[m[1]] = { origin: m[2], value: m[3].trim() };
  }
  return { vars };
}

const flagsIn = (out, re) => [...out.matchAll(re)].map((m) => m[1]);

// Compares two id lists. Names what is only in one list, what is only in the other, and any repeat.
function compareSets(actual, expected, actualName, expectedName) {
  const extra = actual.filter((x) => !expected.includes(x));
  const missing = expected.filter((x) => !actual.includes(x));
  const repeats = actual.length !== new Set(actual).size;
  if (extra.length === 0 && missing.length === 0 && !repeats) return pass;
  const parts = [];
  if (missing.length) parts.push(`in ${expectedName} but not ${actualName}: ${missing.join(", ")}`);
  if (extra.length) parts.push(`in ${actualName} but not ${expectedName}: ${extra.join(", ")}`);
  if (repeats) parts.push(`${actualName} repeats an id`);
  return fail(parts.join("; "));
}

// The boolean value of a job-level if: over one PR event. A term the reader does not know throws,
// so an if: the check cannot read fails by name instead of passing by guess.
const IF_TOKEN = /\s*(&&|\|\||==|!=|!|\(|\)|,|'[^']*'|[A-Za-z_][\w.*-]*)/y;
function ifTokens(src) {
  const toks = [];
  let pos = 0;
  while (src.slice(pos).trim() !== "") {
    IF_TOKEN.lastIndex = pos;
    const m = IF_TOKEN.exec(src);
    if (!m) throw new Error(`the if: cannot be read at "${src.slice(pos).trim()}"`);
    toks.push(m[1]);
    pos = IF_TOKEN.lastIndex;
  }
  return toks;
}
function ifRuns(cond, sc) {
  if (cond === "") return true;
  const t = ifTokens(cond);
  let i = 0;
  const peek = () => t[i];
  const eat = (x) => {
    if (t[i] !== x) throw new Error(`the if: expects ${x} and finds ${t[i] ?? "the end"}`);
    i++;
  };
  const quoted = (tok) => {
    if (!/^'[^']*'$/.test(tok ?? "")) throw new Error(`the if: expects a quoted string and finds ${tok ?? "the end"}`);
    return tok.slice(1, -1);
  };
  const atom = () => {
    const tok = t[i++];
    if (tok === "(") {
      const v = orExpr();
      eat(")");
      return v;
    }
    if (tok === "github.event.pull_request.draft") return sc.draft;
    if (tok === "contains") {
      eat("(");
      eat("github.event.pull_request.labels.*.name");
      eat(",");
      const name = quoted(t[i++]);
      eat(")");
      return sc.labels.includes(name);
    }
    if (tok === "github.event.action" || tok === "github.event.label.name") {
      const op = t[i++];
      if (op !== "==" && op !== "!=") throw new Error(`the if: compares ${tok} with ${op ?? "nothing"}`);
      const same = (tok === "github.event.action" ? sc.action : sc.labelName) === quoted(t[i++]);
      return op === "==" ? same : !same;
    }
    throw new Error(`the if: reads a term the check does not know: ${tok ?? "the end"}`);
  };
  const unary = () => {
    if (peek() === "!") {
      i++;
      return !unary();
    }
    return atom();
  };
  const andExpr = () => {
    let v = unary();
    while (peek() === "&&") {
      i++;
      const r = unary();
      v = v && r;
    }
    return v;
  };
  const orExpr = () => {
    let v = andExpr();
    while (peek() === "||") {
      i++;
      const r = andExpr();
      v = v || r;
    }
    return v;
  };
  const value = orExpr();
  if (i !== t.length) throw new Error(`the if: has an extra term ${t[i]}`);
  return Boolean(value);
}

// The closed pass's if: as a tree of its terms. A term is !cancelled(), an env comparison, or a group of those
// joined by && and ||. Any other term throws, and the throw names it.
function guardTree(cond) {
  const t = ifTokens(cond);
  let i = 0;
  const peek = (k = 0) => t[i + k];
  const eat = (x) => {
    if (t[i] !== x) throw new Error(`the closed pass if: expects ${x} and finds ${t[i] ?? "the end"}`);
    i++;
  };
  const joined = (op, parts) =>
    parts.length === 1 ? parts[0] : { op, items: parts.flatMap((p) => (p.op === op ? p.items : [p])) };
  const orExpr = () => {
    const parts = [andExpr()];
    while (peek() === "||") {
      i++;
      parts.push(andExpr());
    }
    return joined("||", parts);
  };
  const andExpr = () => {
    const parts = [unary()];
    while (peek() === "&&") {
      i++;
      parts.push(unary());
    }
    return joined("&&", parts);
  };
  const unary = () => {
    if (peek() === "!" && peek(1) === "cancelled") {
      i += 2;
      eat("(");
      eat(")");
      return { op: "!cancelled" };
    }
    if (peek() === "!") {
      i++;
      return { op: "!", inner: unary() };
    }
    return primary();
  };
  const primary = () => {
    const tok = t[i++];
    if (tok === undefined) throw new Error("the closed pass if: ends before its last term");
    if (tok === "(") {
      const v = orExpr();
      eat(")");
      return v;
    }
    if (peek() === "(") {
      if (tok === "cancelled") throw new Error("the closed pass if: calls cancelled() without !, so only a cancelled job runs it");
      throw new Error(`the closed pass if: calls ${tok}(), but only !cancelled() and env reads may gate it`);
    }
    if (tok.startsWith("env.")) {
      const op = t[i++];
      if (op !== "==" && op !== "!=") throw new Error(`the closed pass if: compares ${tok} with ${op ?? "nothing"}, not == or !=`);
      if (!/^'[^']*'$/.test(t[i] ?? "")) throw new Error(`the closed pass if: compares ${tok} with ${t[i] ?? "the end"}, not a quoted string`);
      i++;
      return { op: "env" };
    }
    throw new Error(`the closed pass if: reads ${tok}, which is neither !cancelled() nor an env read`);
  };
  const tree = orExpr();
  if (i !== t.length) throw new Error(`the closed pass if: has an extra term ${t[i]}`);
  return tree;
}
const holdsCancelled = (n) =>
  n.op === "!cancelled" ||
  (n.op === "!" ? holdsCancelled(n.inner) : (n.op === "&&" || n.op === "||") && n.items.some(holdsCancelled));
// The one cause the closed pass's if: fails on, or "" when it gates every run on !cancelled() and reads env otherwise.
// Its value is then !cancelled() and an env condition, so no earlier step's outcome can change when the pass runs.
function closedGuardFault(cond) {
  if (cond === "") return "the closed pass has no if:, so GitHub's default success() skips it after a red flat pass";
  let tree;
  try {
    tree = guardTree(cond);
  } catch (e) {
    return e.message;
  }
  const conjuncts = tree.op === "&&" ? tree.items : [tree];
  if (!conjuncts.some((c) => c.op === "!cancelled")) {
    return "the closed pass if: does not require !cancelled() on every run, so a cancelled job could run it";
  }
  const nested = conjuncts.some((c) => c.op !== "!cancelled" && holdsCancelled(c));
  return nested ? "the closed pass if: puts !cancelled() inside an OR or a NOT, so it does not gate every run" : "";
}

const describe = (sc) =>
  `draft=${sc.draft}, labels=[${sc.labels.join(", ")}], action=${sc.action}${sc.labelName ? `, labelName=${sc.labelName}` : ""}`;

// The PR events a gate must run on, and the ones it must not. A label-gated job must not run on a draft
// alone, and a duo-ui gate must run on a ready PR and on a duo-ui labeled draft. A labeled event for
// another label still runs the job: the merge tool judges the newest run, so a skipped job hides a red one.
const DUO_GATE = {
  mustRun: [
    { draft: false, labels: [], action: "opened", labelName: "" },
    { draft: true, labels: ["duo-ui"], action: "labeled", labelName: "duo-ui" },
    { draft: false, labels: ["duo-ui", "pro-ui"], action: "labeled", labelName: "pro-ui" },
  ],
  mustNotRun: [{ draft: true, labels: [], action: "opened", labelName: "" }],
};
const PRO_GATE = {
  mustRun: [
    { draft: false, labels: ["pro-ui"], action: "opened", labelName: "" },
    { draft: false, labels: ["pro-ui"], action: "labeled", labelName: "pro-ui" },
    { draft: false, labels: ["duo-ui", "pro-ui"], action: "labeled", labelName: "duo-ui" },
  ],
  mustNotRun: [
    { draft: false, labels: [], action: "opened", labelName: "" },
    { draft: true, labels: [], action: "opened", labelName: "" },
    { draft: false, labels: ["duo-ui"], action: "opened", labelName: "" },
  ],
};
function gateResult(job, gate) {
  const cond = stripWrap(job.if);
  const bad = [];
  for (const sc of gate.mustRun) if (!ifRuns(cond, sc)) bad.push(`does not run on ${describe(sc)}`);
  for (const sc of gate.mustNotRun) if (ifRuns(cond, sc)) bad.push(`runs on ${describe(sc)}`);
  return bad.length === 0 ? pass : fail(bad[0]);
}

// Every uses: value in the workflow, with the job or step it sits in.
function usesOf(doc) {
  return jobsOf(doc).flatMap(([name, job]) => {
    const refs = typeof job.uses === "string" ? [{ where: `job ${name}`, uses: job.uses }] : [];
    stepsOf(job).forEach((s, k) => {
      if (typeof s.uses === "string") refs.push({ where: `job ${name} step ${s.name ?? k + 1}`, uses: s.uses });
    });
    return refs;
  });
}
const checkoutsOf = (doc) =>
  jobsOf(doc).flatMap(([name, job]) =>
    stepsOf(job)
      .filter((s) => typeof s.uses === "string" && s.uses.startsWith("actions/checkout@"))
      .map((step) => ({ where: `job ${name}`, step }))
  );

// The one ci-done-comment pin checks.yml names.
function checksPinOf(text) {
  if (text === null) return { error: `${CHECKS_PATH} is missing, so no ci-done-comment pin can be read` };
  let doc;
  try {
    doc = parseYaml(text);
  } catch (e) {
    return { error: `${CHECKS_PATH} does not parse in the subset: ${e.message}` };
  }
  const pins = [
    ...new Set(
      usesOf(doc)
        .map((r) => r.uses)
        .filter((u) => u.startsWith(CI_DONE_ACTION + "@"))
        .map((u) => u.slice(CI_DONE_ACTION.length + 1))
    ),
  ];
  if (pins.length !== 1) return { error: `${CHECKS_PATH} names ${pins.length} ci-done-comment pins, not one` };
  if (!SHA.test(pins[0])) return { error: `${CHECKS_PATH} pins ci-done-comment at ${pins[0]}, not a 40-hex sha` };
  return { pin: pins[0] };
}

// The env a step sees: the workflow's, then the job's, then the step's, so the step's value wins, as GitHub reads it.
const envOf = (wf, job, step) => {
  const out = {};
  for (const env of [wf?.env, job.env, step.env]) {
    if (isMap(env)) for (const [k, v] of Object.entries(env)) out[k] = String(v);
  }
  return out;
};

// A run text as its shell reads it, line by line: comment lines are dropped, and each $VAR or ${VAR} the env
// sets becomes its value, once. A name no env sets stays as written, so the caller can name it.
const RUN_REF = /\$\{([A-Za-z_]\w*)\}|\$([A-Za-z_]\w*)/g;
const runLines = (run) => run.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
const runText = (run, env) =>
  runLines(run).replace(RUN_REF, (whole, braced, bare) => {
    const name = braced ?? bare;
    return Object.hasOwn(env, name) ? env[name] : whole;
  });

// The names the operands of a ci-sim.sh run command read that no env sets. Only those operands are read, so a
// name a step sets at run time, such as one read by check-results, is not named as a fault.
const unsetRunNames = (run, env) => {
  const names = [];
  for (const cmd of runLines(run).matchAll(/ci-sim\.sh\s+run\b([^\n]*)/g)) {
    for (const ref of cmd[1].matchAll(RUN_REF)) {
      const name = ref[1] ?? ref[2];
      if (!Object.hasOwn(env, name)) names.push("$" + name);
    }
  }
  return names;
};

// The check of one pass step: the step that runs make target must hold the xcodebuild pass flags.
// Its text is the workflow, job and step env and the run text, plus scripts/ci-sim.sh when the run names it.
function checkDuo(input) {
  const out = [];
  const check = (id, label, fn) => {
    let r;
    try {
      r = fn();
    } catch (e) {
      r = fail(`the check could not read its input: ${e.message}`);
    }
    out.push({ id, label, ok: r.ok, detail: r.ok ? "" : r.detail });
  };

  let wf = null;
  let wfError = "";
  if (input.workflow === null) {
    wfError = `${WORKFLOW_PATH} is missing`;
  } else {
    try {
      const doc = parseYaml(input.workflow);
      if (isMap(doc)) wf = doc;
      else wfError = `${WORKFLOW_PATH} is not a mapping`;
    } catch (e) {
      wfError = `${WORKFLOW_PATH} does not parse in the subset: ${e.message}`;
    }
  }
  const wfCheck = (id, label, fn) => check(id, label, () => (wf === null ? fail(wfError) : fn()));
  const jobOf = (name) => (isMap(wf?.jobs) && isMap(wf.jobs[name]) ? wf.jobs[name] : null);
  const jobMiss = (name) => fail(`${WORKFLOW_PATH} has no job ${name}`);

  const vars = readVars(input.makefile, ["DUO_UI_TESTS", "DUO_CLOSED_TESTS"]);
  const varWords = (name) => {
    if (vars.error) return { error: vars.error };
    const v = vars.vars[name];
    if (!v || v.origin !== "file") return { error: `${name} is not set in the Makefile` };
    return { words: words(v.value) };
  };
  const flatRun = makeRun(input.makefile, ["-n", "ui-duo-flat", "UI_TEST=echo"]);
  const closedRun = makeRun(input.makefile, ["-n", "ui-duo-closed", "UI_TEST=echo"]);

  // The env of the workflow, the job and the step each hold a value a pass can inherit: make reads
  // UI_TEST from the environment, so one shared value at the top of the workflow is a valid home.
  const passText = (job, step) => {
    const parts = [];
    for (const env of [wf?.env, job.env, step.env]) if (isMap(env)) parts.push(...Object.values(env).map(String));
    const run = typeof step.run === "string" ? step.run : "";
    parts.push(run);
    if (run.includes(SCRIPT_PATH) && input.script !== null) parts.push(input.script);
    return parts.join("\n").replace(/\\\n/g, " ");
  };
  const passFlags = (text) => {
    const lines = text.split("\n").filter((l) => l.includes("xcodebuild test-without-building"));
    if (lines.length === 0) {
      return fail("no xcodebuild test-without-building command in the step, its env or scripts/ci-sim.sh");
    }
    const count = (l) => PASS_FLAGS.filter((f) => l.includes(f)).length;
    const best = lines.reduce((a, b) => (count(b) > count(a) ? b : a));
    const missing = PASS_FLAGS.filter((f) => !best.includes(f));
    return missing.length === 0
      ? pass
      : fail(`the xcodebuild test-without-building command lacks ${missing.join(", ")}`);
  };
  // A step runs the target when its run text, with each $VAR and ${VAR} read from the env, names the target.
  const stepRunning = (job, re) =>
    stepsOf(job).find((s) => typeof s.run === "string" && re.test(runText(s.run, envOf(wf, job, s))));
  // The detail when no step runs the target. It names an unset variable in a ci-sim.sh run command, when there is one.
  const noStepDetail = (jobName, job, target) => {
    const unset = [
      ...new Set(stepsOf(job).flatMap((s) => (typeof s.run === "string" ? unsetRunNames(s.run, envOf(wf, job, s)) : []))),
    ];
    const base = `no step in ${jobName} runs make ${target}`;
    return unset.length === 0 ? base : `${base}; a ci-sim.sh run command names ${unset.join(", ")}, which no env block sets`;
  };
  const passStepCheck = (jobName, re, target) => {
    const j = jobOf(jobName);
    if (j === null) return jobMiss(jobName);
    const s = stepRunning(j, re);
    if (s === undefined) return fail(noStepDetail(jobName, j, target));
    return passFlags(passText(j, s));
  };
  const runsOnAndTimeout = (name) => {
    const j = jobOf(name);
    if (j === null) return jobMiss(name);
    if (j["runs-on"] !== XCODE) return fail(`${name} runs-on is ${show(j["runs-on"])}`);
    return positiveMinutes(j) ? pass : fail(`${name} timeout-minutes is ${show(j["timeout-minutes"])}`);
  };

  // d1: the file, its triggers and its secrets.
  check("d1a", `${WORKFLOW_PATH} exists and parses in the subset`, () => (wf === null ? fail(wfError) : pass));
  wfCheck("d1b", "its triggers are pull_request only", () => {
    const keys = isMap(wf.on) ? Object.keys(wf.on) : listOf(wf.on);
    return keys.length === 1 && keys[0] === "pull_request"
      ? pass
      : fail(`triggers on ${keys.join(", ") || "nothing"}`);
  });
  wfCheck("d1c", "its pull_request types include opened, synchronize, reopened, ready_for_review and labeled", () => {
    const pr = isMap(wf.on) ? wf.on.pull_request : undefined;
    const types = isMap(pr) ? listOf(pr.types) : [];
    const missing = TRIGGER_TYPES.filter((t) => !types.includes(t));
    return missing.length === 0 ? pass : fail(`types lack ${missing.join(", ")}`);
  });
  wfCheck("d1d", "it names no secrets. context", () =>
    /secrets\./.test(input.workflow) ? fail(`${WORKFLOW_PATH} names secrets.`) : pass
  );

  // d2: the top-level permissions and the duo-ui job's runner, timeout and gate.
  wfCheck("d2a", "top-level permissions are contents: read and nothing else", () => {
    const p = wf.permissions;
    return isMap(p) && Object.keys(p).join() === "contents" && p.contents === "read"
      ? pass
      : fail(`permissions are ${show(p)}`);
  });
  wfCheck("d2b", `job ${DUO_JOB} runs on ${XCODE}`, () => {
    const j = jobOf(DUO_JOB);
    if (j === null) return jobMiss(DUO_JOB);
    return j["runs-on"] === XCODE ? pass : fail(`runs-on is ${show(j["runs-on"])}`);
  });
  wfCheck("d2c", `job ${DUO_JOB} has a positive whole timeout-minutes`, () => {
    const j = jobOf(DUO_JOB);
    if (j === null) return jobMiss(DUO_JOB);
    return positiveMinutes(j) ? pass : fail(`timeout-minutes is ${show(j["timeout-minutes"])}`);
  });
  wfCheck("d2d", `job ${DUO_JOB} runs on a ready PR, or on a PR with the duo-ui label`, () => {
    const j = jobOf(DUO_JOB);
    if (j === null) return jobMiss(DUO_JOB);
    return gateResult(j, DUO_GATE);
  });

  // d3: DUO_CLOSED_TESTS against the test methods that call requirePose(.closed).
  check("d3a", "DUO_CLOSED_TESTS is set in the Makefile", () => {
    if (vars.error) return fail(vars.error);
    const v = vars.vars.DUO_CLOSED_TESTS;
    return v && v.origin === "file" ? pass : fail("DUO_CLOSED_TESTS is not set in the Makefile");
  });
  check("d3b", "DUO_CLOSED_TESTS equals the Duo test ids whose body calls requirePose(.closed)", () => {
    const scanned = swiftClosedIds(input.swift);
    const listed = varWords("DUO_CLOSED_TESTS");
    if (listed.error) return fail(`${listed.error}; the tests call requirePose(.closed) in: ${scanned.join(", ") || "none"}`);
    return compareSets(listed.words, scanned, "DUO_CLOSED_TESTS", "the tests");
  });

  // d4: the flags the two make targets pass to xcodebuild.
  check("d4a", "make -n ui-duo-flat runs and prints the flat pass", () => {
    if (!flatRun.ok) return fail(`make -n ui-duo-flat failed: ${flatRun.err}`);
    return flatRun.out.trim() === "" ? fail("make -n ui-duo-flat printed nothing") : pass;
  });
  check("d4b", "make -n ui-duo-flat passes -only-testing for exactly the DUO_UI_TESTS classes", () => {
    if (!flatRun.ok) return fail("make -n ui-duo-flat did not run, so it passes no flags");
    const want = varWords("DUO_UI_TESTS");
    if (want.error) return fail(want.error);
    return compareSets(flagsIn(flatRun.out, ONLY_FLAG), want.words, "the flat pass", "DUO_UI_TESTS");
  });
  check("d4c", "make -n ui-duo-flat passes -skip-testing for exactly the DUO_CLOSED_TESTS ids", () => {
    if (!flatRun.ok) return fail("make -n ui-duo-flat did not run, so it passes no flags");
    const want = varWords("DUO_CLOSED_TESTS");
    if (want.error) return fail(want.error);
    return compareSets(flagsIn(flatRun.out, SKIP_FLAG), want.words, "the flat pass skip", "DUO_CLOSED_TESTS");
  });
  check("d4d", "make -n ui-duo-closed passes -only-testing for exactly the DUO_CLOSED_TESTS ids", () => {
    if (!closedRun.ok) return fail(`make -n ui-duo-closed failed: ${closedRun.err}`);
    const want = varWords("DUO_CLOSED_TESTS");
    if (want.error) return fail(want.error);
    return compareSets(flagsIn(closedRun.out, ONLY_FLAG), want.words, "the closed pass", "DUO_CLOSED_TESTS");
  });

  // d5: the pass steps, the closed pass's guard and the hinge pin.
  wfCheck("d5a", "the flat pass runs make ui-duo-flat with the xcodebuild pass flags", () =>
    passStepCheck(DUO_JOB, FLAT_RUN, "ui-duo-flat")
  );
  wfCheck("d5b", "the closed pass runs make ui-duo-closed with the xcodebuild pass flags", () =>
    passStepCheck(DUO_JOB, CLOSED_RUN, "ui-duo-closed")
  );
  wfCheck("d5c", "the closed pass's if: requires !cancelled() and reads env otherwise, so a red flat pass does not skip it", () => {
    const j = jobOf(DUO_JOB);
    if (j === null) return jobMiss(DUO_JOB);
    const s = stepRunning(j, CLOSED_RUN);
    if (s === undefined) return fail(noStepDetail(DUO_JOB, j, "ui-duo-closed"));
    const fault = closedGuardFault(stripWrap(s.if));
    return fault === "" ? pass : fail(fault);
  });
  wfCheck("d5d", `a ${DUO_JOB} step fetches ${HINGE_REPO} pinned at ${HINGE_SHA}`, () => {
    const j = jobOf(DUO_JOB);
    if (j === null) return jobMiss(DUO_JOB);
    const hit = stepsOf(j).some((s) => {
      const t = passText(j, s);
      return t.includes(HINGE_REPO) && t.includes(HINGE_SHA);
    });
    return hit ? pass : fail(`no ${DUO_JOB} step names ${HINGE_REPO} at ${HINGE_SHA}`);
  });
  wfCheck("d5e", `${PRO_A} runs make ui-a with the xcodebuild pass flags`, () =>
    passStepCheck(PRO_A, PRO_A_RUN, "ui-a")
  );
  wfCheck("d5f", `${PRO_B} runs make ui-b with the xcodebuild pass flags`, () =>
    passStepCheck(PRO_B, PRO_B_RUN, "ui-b")
  );

  // d6: pins, checkout credentials and GitHub expressions in run blocks, across every job.
  wfCheck("d6a", "every uses: names a 40-hex sha pin", () => {
    const refs = usesOf(wf);
    if (refs.length === 0) return fail(`${WORKFLOW_PATH} has no uses: line`);
    const bad = refs.filter((r) => !SHA.test(r.uses.slice(r.uses.lastIndexOf("@") + 1)));
    return bad.length === 0
      ? pass
      : fail(`not pinned by a sha: ${bad.map((r) => `${r.where} ${r.uses}`).join("; ")}`);
  });
  wfCheck("d6b", "every actions/checkout step has persist-credentials: false", () => {
    const cos = checkoutsOf(wf);
    if (cos.length === 0) return fail(`${WORKFLOW_PATH} has no actions/checkout step`);
    const bad = cos.filter((c) => !(isMap(c.step.with) && c.step.with["persist-credentials"] === "false"));
    return bad.length === 0 ? pass : fail(`checkout keeps credentials in ${bad.map((c) => c.where).join(", ")}`);
  });
  wfCheck("d6c", "no run: block in any job holds a GitHub expression", () => {
    const bad = jobsOf(wf).flatMap(([name, job]) =>
      stepsOf(job)
        .filter((s) => typeof s.run === "string" && s.run.includes("${{"))
        .map(() => `job ${name}`)
    );
    return bad.length === 0 ? pass : fail(`a run: block in ${bad.join(", ")} holds a GitHub expression`);
  });

  // d7: ci-done waits on the three jobs and uses the shared action at checks.yml's pin.
  wfCheck("d7a", `${CI_DONE} needs ${DUO_JOB}, ${PRO_A} and ${PRO_B}`, () => {
    const j = jobOf(CI_DONE);
    if (j === null) return jobMiss(CI_DONE);
    const missing = [DUO_JOB, PRO_A, PRO_B].filter((n) => !listOf(j.needs).includes(n));
    return missing.length === 0 ? pass : fail(`${CI_DONE} does not need ${missing.join(", ")}`);
  });
  wfCheck("d7b", `${CI_DONE} uses ${CI_DONE_ACTION} at the pin ${CHECKS_PATH} names`, () => {
    const pin = checksPinOf(input.checks);
    if (pin.error) return fail(pin.error);
    const j = jobOf(CI_DONE);
    if (j === null) return jobMiss(CI_DONE);
    const refs = stepsOf(j)
      .filter((s) => typeof s.uses === "string" && s.uses.startsWith(CI_DONE_ACTION + "@"))
      .map((s) => s.uses.slice(CI_DONE_ACTION.length + 1));
    if (refs.length === 0) return fail(`${CI_DONE} has no step that uses ${CI_DONE_ACTION}`);
    const wrong = refs.filter((r) => r !== pin.pin);
    return wrong.length === 0 ? pass : fail(`${CI_DONE} pins ${wrong.join(", ")}, not ${pin.pin}`);
  });

  // d8: the two pro jobs.
  wfCheck("d8a", `${PRO_A} runs on ${XCODE} with a positive timeout-minutes`, () => runsOnAndTimeout(PRO_A));
  wfCheck("d8b", `${PRO_B} runs on ${XCODE} with a positive timeout-minutes`, () => runsOnAndTimeout(PRO_B));
  wfCheck("d8c", `${PRO_A} runs on the pro-ui label, never on the draft gate alone`, () => {
    const j = jobOf(PRO_A);
    if (j === null) return jobMiss(PRO_A);
    return gateResult(j, PRO_GATE);
  });
  wfCheck("d8d", `${PRO_B} runs on the pro-ui label, never on the draft gate alone`, () => {
    const j = jobOf(PRO_B);
    if (j === null) return jobMiss(PRO_B);
    return gateResult(j, PRO_GATE);
  });

  // d9: the concurrency group cancels older runs with the literal true, so no event's if: decides it.
  wfCheck("d9a", "concurrency.cancel-in-progress is the literal true", () => {
    const c = isMap(wf.concurrency) ? wf.concurrency["cancel-in-progress"] : undefined;
    return c === "true" ? pass : fail(`cancel-in-progress is ${show(c)}`);
  });
  wfCheck("d9b", "concurrency.group holds github.event.pull_request.draft", () => {
    const g = isMap(wf.concurrency) ? wf.concurrency.group : undefined;
    return typeof g === "string" && g.includes("github.event.pull_request.draft") ? pass : fail(`group is ${show(g)}`);
  });

  return out;
}

// ---- Live run: the repo as it stands.
function readRepo(rel) {
  try {
    return readFileSync(resolve(ROOT, rel), "utf8");
  } catch {
    return null;
  }
}
function readSwift() {
  const dir = resolve(ROOT, SWIFT_DIR);
  let names;
  try {
    names = readdirSync(dir).filter((n) => n.endsWith(".swift"));
  } catch {
    return {};
  }
  return Object.fromEntries(names.map((n) => [n, readFileSync(resolve(dir, n), "utf8")]));
}

let failures = 0;
let total = 0;
function expect(label, cond, detail = "") {
  total++;
  if (cond) {
    console.log(`ok   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ""}`);
  }
}

const LIVE = {
  workflow: readRepo(WORKFLOW_PATH),
  makefile: readRepo("Makefile") ?? "",
  swift: readSwift(),
  checks: readRepo(CHECKS_PATH),
  script: readRepo(SCRIPT_PATH),
};
for (const r of checkDuo(LIVE)) expect(`${r.id} ${r.label}`, r.ok, r.detail);

// ---- Fixtures. The good set is what a correct lane writes, with the traps the readers must get right.

function mutate(src, from, to) {
  if (!src.includes(from)) throw new Error(`fixture edit did not apply: ${from.slice(0, 60)}`);
  return src.replace(from, () => to);
}
function mutateLast(src, from, to) {
  const i = src.lastIndexOf(from);
  if (i < 0) throw new Error(`fixture edit did not apply: ${from.slice(0, 60)}`);
  return src.slice(0, i) + to + src.slice(i + from.length);
}
function mutateAll(src, from, to) {
  if (!src.includes(from)) throw new Error(`fixture edit did not apply: ${from.slice(0, 60)}`);
  return src.split(from).join(to);
}

const CHECKOUT_SHA = "1".repeat(40);
const CI_DONE_SHA = "2".repeat(40);
const XB = "xcodebuild test-without-building -destination id=$SIM_UDID -collect-test-diagnostics never";
const FLAT_TEST = XB + " -retry-tests-on-failure -test-iterations 2 -resultBundlePath flat.xcresult";
const CLOSED_TEST = XB + " -retry-tests-on-failure -test-iterations 2 -resultBundlePath closed.xcresult";
const PRO_A_TEST = XB + " -retry-tests-on-failure -test-iterations 2 -resultBundlePath pro-a.xcresult";
const PRO_B_TEST = XB + " -retry-tests-on-failure -test-iterations 2 -resultBundlePath pro-b.xcresult";
const DUO_IF = "${{ !github.event.pull_request.draft || contains(github.event.pull_request.labels.*.name, 'duo-ui') }}";
const PRO_IF = "${{ contains(github.event.pull_request.labels.*.name, 'pro-ui') }}";
const CLOSED_IF = "        if: ${{ !cancelled() }}";
const CHECKOUT = "      - uses: actions/checkout@" + CHECKOUT_SHA;
const HINGE_LINE = '          git -C "$RUNNER_TEMP/hinge" checkout -q ' + HINGE_SHA;

const proLines = (name, target, test) => [
  "  " + name + ":",
  "    if: " + PRO_IF,
  "    runs-on: xcode-27",
  "    timeout-minutes: 60",
  "    steps:",
  CHECKOUT,
  "        with:",
  "          persist-credentials: false",
  "      - name: " + name + " pass",
  "        env:",
  "          UI_TEST: " + test,
  '        run: make ' + target + ' UI_TEST="$UI_TEST"',
];

const WF_GOOD =
  [
    "name: duo-ui",
    "",
    "on:",
    "  pull_request:",
    "    types: [opened, synchronize, reopened, ready_for_review, labeled]",
    "    paths:",
    '      - "native/**"',
    "      - Makefile",
    '      - "shared/**"',
    '      - ".github/workflows/duo-ui.yml"',
    "",
    "permissions:",
    "  contents: read",
    "",
    "concurrency:",
    "  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}-${{ github.event.pull_request.draft }}",
    "  cancel-in-progress: true",
    "",
    "jobs:",
    "  duo-ui:",
    "    if: " + DUO_IF,
    "    runs-on: xcode-27",
    "    timeout-minutes: 60 # provisional",
    "    steps:",
    CHECKOUT,
    "        with:",
    "          persist-credentials: false",
    "      - name: Fetch hinge",
    "        run: |",
    '          git clone -q https://github.com/artemnovichkov/hinge "$RUNNER_TEMP/hinge"',
    HINGE_LINE,
    "      - name: Duo's flat pass # don't panic",
    "        env:",
    "          UI_TEST: " + FLAT_TEST,
    '        run: make ui-duo-flat UI_TEST="$UI_TEST"',
    "      - name: Closed pass",
    CLOSED_IF,
    "        env:",
    "          UI_TEST: " + CLOSED_TEST,
    '        run: make ui-duo-closed UI_TEST="$UI_TEST"',
    ...proLines(PRO_A, "ui-a", PRO_A_TEST),
    ...proLines(PRO_B, "ui-b", PRO_B_TEST),
    "  ci-done:",
    "    needs: [duo-ui, pro-ui-a, pro-ui-b]",
    "    if: ${{ !cancelled() && github.event_name == 'pull_request' }}",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 5",
    "    permissions:",
    "      pull-requests: write",
    "    steps:",
    "      - uses: " + CI_DONE_ACTION + "@" + CI_DONE_SHA + " # main 2026-11-06 (#1341)",
    "        with:",
    "          needs: ${{ toJSON(needs) }}",
  ].join("\n") + "\n";

const CHECKS_GOOD = [
  "name: checks",
  "",
  "on:",
  "  pull_request:",
  "",
  "jobs:",
  "  ci-done:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - uses: " + CI_DONE_ACTION + "@" + CI_DONE_SHA + " # main 2026-11-06 (#1341)",
  "        with:",
  "          needs: ${{ toJSON(needs) }}",
  "",
].join("\n");

const MAKEFILE = (closedIds) =>
  [
    "UI_TEST ?= sim-test",
    "APP := Manifest",
    "NATIVE := native",
    "DUO_UI_TESTS := DuoHandUITests DuoSpreadUITests DuoShellUITests",
    "DUO_CLOSED_TESTS := " + closedIds.join(" "),
    "DUO_FLAT_ONLY := $(addprefix -only-testing:ManifestUITests/,$(DUO_UI_TESTS))",
    "DUO_FLAT_SKIP := $(addprefix -skip-testing:ManifestUITests/,$(DUO_CLOSED_TESTS))",
    "DUO_CLOSED_ONLY := $(addprefix -only-testing:ManifestUITests/,$(DUO_CLOSED_TESTS))",
    "",
    "ui-a:",
    "\tcd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO",
    "",
    "ui-b:",
    "\tcd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO",
    "",
    "ui-duo-flat:",
    "\tcd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO $(DUO_FLAT_ONLY) $(DUO_FLAT_SKIP)",
    "",
    "ui-duo-closed:",
    "\tcd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO $(DUO_CLOSED_ONLY)",
    "",
  ].join("\n");

// The ids the good Swift set names. Typed here, so a scanner that misreads a trap fails the good set.
const CLOSED_IDS = [
  "DuoShellUITests/testBracesInBody",
  "DuoShellUITests/testClosedKeepsSystemBar",
  "DuoShellUITests/testLoneQuoteInComment",
  "DuoShellUITests/testUrlBeforeRealCall",
  "DuoSpreadUITests/testClosedTallyIsOnePage",
];

const SWIFT_GOOD = {
  "DuoHandUITests.swift": [
    "import XCTest",
    "",
    "final class DuoHandUITests: XCTestCase {",
    "    func testHandShowsTwoButtons() throws {",
    '        let label = "guard app.requirePose(.closed) else { return }"',
    "        guard app.requirePose(.flat) else { return }",
    "    }",
    "}",
    "",
  ].join("\n"),
  "DuoSpreadUITests.swift": [
    "import XCTest",
    "",
    "final class DuoSpreadUITests: XCTestCase {",
    "    func testOpenSpreadIsFlat() throws {",
    "        guard app.requirePose(.flat) else { return }",
    "    }",
    "    func testClosedTallyIsOnePage() throws {",
    "        guard app.requirePose(.closed) else { return }",
    "    }",
    "}",
    "",
  ].join("\n"),
  "DuoShellUITests.swift": [
    "import XCTest",
    "",
    "final class DuoShellUITests: XCTestCase {",
    "    func testClosedKeepsSystemBar() throws {",
    "        guard app.requirePose(.closed) else { return }",
    "    }",
    "    func testBlockTextIsNotACall() throws {",
    '        let text = """',
    "        guard app.requirePose(.closed) else { return }",
    '        """',
    "        guard app.requirePose(.flat) else { return }",
    "    }",
    "    func testUrlBeforeRealCall() throws {",
    '        let url = "http://example.test"; guard app.requirePose(.closed) else { return }',
    "    }",
    "    func testLoneQuoteInComment() throws {",
    '        // he said "no',
    "        guard app.requirePose(.closed) else { return }",
    "    }",
    "    func testCommentedCall() throws {",
    "        // guard app.requirePose(.closed) else { return }",
    "        /* guard app.requirePose(.closed) else { return } */",
    "        guard app.requirePose(.flat) else { return }",
    "    }",
    "    func testBracesInBody() throws {",
    "        if true { }",
    '        let s = "}"',
    "        guard app.requirePose(.closed) else { return }",
    "    }",
    "}",
    "",
  ].join("\n"),
  "TallyUITests.swift": [
    "import XCTest",
    "",
    "final class TallyUITests: XCTestCase {",
    "    func testClosedTally() throws {",
    "        guard app.requirePose(.closed) else { return }",
    "    }",
    "}",
    "",
  ].join("\n"),
};

const SCRIPT_GOOD = [
  "#!/usr/bin/env bash",
  "# Prints the xcodebuild test command for a Duo or pro pass.",
  "test-command() {",
  '  echo "' + XB + ' -retry-tests-on-failure -test-iterations 2 -resultBundlePath $RESULT_BUNDLE"',
  "}",
  "",
].join("\n");

// Moves the flags out of the env blocks and into scripts/ci-sim.sh, as one shared command.
const viaScript = (text) =>
  text.replace(
    / {8}env:\n {10}UI_TEST: [^\n]*\n( {8}run: make \S+) UI_TEST="\$UI_TEST"/g,
    '$1 UI_TEST="$(scripts/ci-sim.sh test-command)"'
  );

const GOOD = { workflow: WF_GOOD, makefile: MAKEFILE(CLOSED_IDS), swift: SWIFT_GOOD, checks: CHECKS_GOOD, script: null };
const SCRIPT_INPUT = { ...GOOD, workflow: viaScript(WF_GOOD), script: SCRIPT_GOOD };

// One shared value in the top-level env, read by every pass through the environment. The step-level
// UI_TEST blocks move up into it.
const SHARED_TEST = XB + " -retry-tests-on-failure -test-iterations 2 -resultBundlePath $RESULT_BUNDLE";
const toWorkflowEnv = (text) =>
  text
    .replace(/ {8}env:\n {10}UI_TEST: [^\n]*\n/g, "")
    .replace("\njobs:\n", () => "\nenv:\n  UI_TEST: " + SHARED_TEST + "\n\njobs:\n");
const WF_ENV_INPUT = { ...GOOD, workflow: toWorkflowEnv(WF_GOOD) };

// The live shape: the four commands sit in the workflow env, and each pass runs one through scripts/ci-sim.sh run.
// The closed pass names its command as ${VAR}, so the braced form is read too.
const toCmdEnv = (text) => {
  let t = mutate(text, '        run: make ui-duo-flat UI_TEST="$UI_TEST"', "        run: scripts/ci-sim.sh run $DUO_FLAT_CMD");
  t = mutate(t, '        run: make ui-duo-closed UI_TEST="$UI_TEST"', "        run: scripts/ci-sim.sh run ${DUO_CLOSED_CMD}");
  t = mutate(t, '        run: make ui-a UI_TEST="$UI_TEST"', "        run: scripts/ci-sim.sh run $PRO_A_CMD");
  t = mutate(t, '        run: make ui-b UI_TEST="$UI_TEST"', "        run: scripts/ci-sim.sh run $PRO_B_CMD");
  return mutate(
    t,
    "\nenv:\n  UI_TEST: ",
    "\nenv:\n  DUO_FLAT_CMD: make ui-duo-flat\n  DUO_CLOSED_CMD: make ui-duo-closed\n  PRO_A_CMD: make ui-a\n  PRO_B_CMD: make ui-b\n  UI_TEST: "
  );
};
const CMD_WF = toCmdEnv(WF_ENV_INPUT.workflow);
const CMD_INPUT = { ...GOOD, workflow: CMD_WF };
const FLAT_STEP_RUN = "        run: scripts/ci-sim.sh run $DUO_FLAT_CMD";
// Each good variant moves one thing about where the command sits or how its line reads. Each passes every check.
const jobEnvCmd = mutate(
  mutate(CMD_WF, "  DUO_CLOSED_CMD: make ui-duo-closed\n", ""),
  "    timeout-minutes: 60 # provisional\n    steps:\n",
  "    timeout-minutes: 60 # provisional\n    env:\n      DUO_CLOSED_CMD: make ui-duo-closed\n    steps:\n"
);
const stepEnvCmd = mutate(
  mutate(CMD_WF, "  DUO_FLAT_CMD: make ui-duo-flat\n", ""),
  FLAT_STEP_RUN,
  "        env:\n          DUO_FLAT_CMD: make ui-duo-flat\n" + FLAT_STEP_RUN
);
const quotedHashCmd = mutate(CMD_WF, FLAT_STEP_RUN, "        run: \"echo '#' && scripts/ci-sim.sh run $DUO_FLAT_CMD\"");
const apostropheCmd = mutate(
  CMD_WF,
  FLAT_STEP_RUN,
  "        run: |\n          echo don't\n          scripts/ci-sim.sh run $DUO_FLAT_CMD"
);

const methodLines = (name, pose) => [
  "    func " + name + "() throws {",
  "        guard app.requirePose(." + pose + ") else { return }",
  "    }",
];
const classFile = (cls, lines) => ["final class " + cls + ": XCTestCase {", ...lines, "}", ""].join("\n");
const EMPTY_SWIFT = {
  "DuoHandUITests.swift": classFile("DuoHandUITests", methodLines("testHandShowsTwoButtons", "flat")),
  "DuoSpreadUITests.swift": classFile("DuoSpreadUITests", methodLines("testOpenSpreadIsFlat", "flat")),
  "DuoShellUITests.swift": classFile("DuoShellUITests", methodLines("testKeepsBar", "flat")),
};
// Full size: three classes of thirty methods, and every fifth method closed.
const FULL_SWIFT = {};
const FULL_CLOSED = [];
for (const cls of ["DuoHandUITests", "DuoSpreadUITests", "DuoShellUITests"]) {
  const lines = [];
  for (let k = 0; k < 30; k++) {
    const name = "testItem" + k;
    const closed = k % 5 === 0;
    lines.push(...methodLines(name, closed ? "closed" : "flat"));
    if (closed) FULL_CLOSED.push(cls + "/" + name);
  }
  FULL_SWIFT[cls + ".swift"] = classFile(cls, lines);
}

// Mutants. Each changes one piece of the good set, and the named check must go red on it. A row's optional
// fourth field is the cause its red detail must contain.
const onWf = (from, to) => (g) => ({ ...g, workflow: mutate(g.workflow, from, to) });
const onWfLast = (from, to) => (g) => ({ ...g, workflow: mutateLast(g.workflow, from, to) });
const onMk = (from, to) => (g) => ({ ...g, makefile: mutate(g.makefile, from, to) });
const onSwift = (name, from, to) => (g) => ({ ...g, swift: { ...g.swift, [name]: mutate(g.swift[name], from, to) } });
const onChecks = (from, to) => (g) => ({ ...g, checks: mutate(g.checks, from, to) });
// Edits the live-shape fixture, whose commands sit in the env. The good set is not read.
const onCmd = (from, to) => () => ({ ...CMD_INPUT, workflow: mutate(CMD_WF, from, to) });

// The job ifs with the labeled-event narrowing: a labeled event runs a job only for its own label. A
// narrowed label run skips the other job, so the newest run on a head can pass while an earlier run is red.
const DUO_IF_NARROW = "${{ (!github.event.pull_request.draft || contains(github.event.pull_request.labels.*.name, 'duo-ui')) && (github.event.action != 'labeled' || github.event.label.name == 'duo-ui') }}";
const PRO_IF_NARROW = "${{ contains(github.event.pull_request.labels.*.name, 'pro-ui') && (github.event.action != 'labeled' || github.event.label.name == 'pro-ui') }}";
const narrowDuo = (g) => ({ ...g, workflow: mutate(g.workflow, "    if: " + DUO_IF, "    if: " + DUO_IF_NARROW) });
const narrowPro = (g) => ({ ...g, workflow: mutateAll(g.workflow, "    if: " + PRO_IF, "    if: " + PRO_IF_NARROW) });

const MUTANTS = [
  ["workflow file missing", "d1a", (g) => ({ ...g, workflow: null })],
  ["push trigger added after a comment with a lone apostrophe", "d1b", onWf("on:\n  pull_request:", "on:\n  # Don't add push here\n  push:\n    branches: [main]\n  pull_request:")],
  ["labeled type dropped", "d1c", onWf(", labeled]", "]")],
  ["a secrets. reference in a top-level env", "d1d", onWf("permissions:\n  contents: read\n", "env:\n  TOKEN: ${{ secrets.TOKEN }}\npermissions:\n  contents: read\n")],
  ["permissions add actions: write", "d2a", onWf("permissions:\n  contents: read\n", "permissions:\n  contents: read\n  actions: write\n")],
  ["duo job runs on macos", "d2b", onWf("  duo-ui:\n    if: " + DUO_IF + "\n    runs-on: xcode-27", "  duo-ui:\n    if: " + DUO_IF + "\n    runs-on: macos-15")],
  ["duo timeout is zero", "d2c", onWf("timeout-minutes: 60 # provisional", "timeout-minutes: 0 # provisional")],
  ["duo if needs the draft gate and the label", "d2d", onWf(DUO_IF, DUO_IF.replace(" || ", " && "))],
  ["flat pass drops -retry-tests-on-failure", "d5a", onWf(FLAT_TEST, FLAT_TEST.replace(" -retry-tests-on-failure", ""))],
  ["closed pass drops its -resultBundlePath", "d5b", onWf(CLOSED_TEST, CLOSED_TEST.replace(" -resultBundlePath closed.xcresult", ""))],
  ["closed pass is guarded by success()", "d5c", onWf(CLOSED_IF, "        if: ${{ success() }}")],
  ["closed pass is guarded by !cancelled() and success()", "d5c", onWf(CLOSED_IF, "        if: ${{ !cancelled() && success() }}"), "calls success()"],
  ["closed pass is guarded by !cancelled() and failure()", "d5c", onWf(CLOSED_IF, "        if: ${{ !cancelled() && failure() }}"), "calls failure()"],
  ["closed pass is guarded by !cancelled() or an env read", "d5c", onWf(CLOSED_IF, "        if: ${{ !cancelled() || env.SIM_UDID != '' }}"), "does not require !cancelled()"],
  ["hinge is checked out at another sha", "d5d", onWf(HINGE_LINE, HINGE_LINE.replace(HINGE_SHA, "b".repeat(40)))],
  ["pro-ui-a pass drops -retry-tests-on-failure", "d5e", onWf(PRO_A_TEST, PRO_A_TEST.replace(" -retry-tests-on-failure", ""))],
  ["pro-ui-b pass drops -resultBundlePath", "d5f", onWf(PRO_B_TEST, PRO_B_TEST.replace(" -resultBundlePath pro-b.xcresult", ""))],
  ["checkout pinned to a tag", "d6a", onWf(CHECKOUT, "      - uses: actions/checkout@v4")],
  ["ci-done-comment pinned to a branch", "d6a", onWf("@" + CI_DONE_SHA, "@main")],
  ["duo checkout keeps credentials", "d6b", onWf("persist-credentials: false", "persist-credentials: true")],
  ["pro-ui-b checkout keeps credentials", "d6b", onWfLast("persist-credentials: false", "persist-credentials: true")],
  ["a run block holds a GitHub expression", "d6c", onWf('        run: make ui-duo-closed UI_TEST="$UI_TEST"', '        run: make ui-duo-closed UI_TEST="$UI_TEST" && echo "${{ github.sha }}"')],
  ["a quoted # hides a GitHub expression in a run", "d6c", onWf('        run: make ui-a UI_TEST="$UI_TEST"', '        run: make ui-a UI_TEST="$UI_TEST"\n      - name: Trap\n        run: "echo a # ${{ github.sha }}"')],
  ["a lone apostrophe does not hide a GitHub expression in a run", "d6c", onWf('        run: make ui-b UI_TEST="$UI_TEST"', '        run: make ui-b UI_TEST="$UI_TEST"\n      - name: Trap\n        run: echo don\'t ${{ github.sha }}')],
  ["a # line in a run block still holds a GitHub expression", "d6c", onWf('        run: make ui-b UI_TEST="$UI_TEST"', '        run: |\n          make ui-b UI_TEST="$UI_TEST"\n          # ${{ github.sha }}')],
  ["ci-done needs drops pro-ui-b", "d7a", onWf("    needs: [duo-ui, pro-ui-a, pro-ui-b]", "    needs: [duo-ui, pro-ui-a]")],
  ["ci-done needs drops duo-ui", "d7a", onWf("    needs: [duo-ui, pro-ui-a, pro-ui-b]", "    needs: [pro-ui-a, pro-ui-b]")],
  ["ci-done pins another sha than checks.yml", "d7b", onWf(CI_DONE_ACTION + "@" + CI_DONE_SHA, CI_DONE_ACTION + "@" + "3".repeat(40))],
  ["checks.yml names no ci-done-comment pin", "d7b", onChecks("      - uses: " + CI_DONE_ACTION + "@" + CI_DONE_SHA, "      - run: echo none")],
  ["pro-ui-a runs on macos", "d8a", onWf("  pro-ui-a:\n    if: " + PRO_IF + "\n    runs-on: xcode-27", "  pro-ui-a:\n    if: " + PRO_IF + "\n    runs-on: macos-15")],
  ["pro-ui-b timeout is zero", "d8b", onWf("  pro-ui-b:\n    if: " + PRO_IF + "\n    runs-on: xcode-27\n    timeout-minutes: 60", "  pro-ui-b:\n    if: " + PRO_IF + "\n    runs-on: xcode-27\n    timeout-minutes: 0")],
  ["pro-ui-a if is the draft gate alone", "d8c", onWf("  pro-ui-a:\n    if: " + PRO_IF, "  pro-ui-a:\n    if: ${{ !github.event.pull_request.draft }}")],
  ["pro-ui-b if asks for another label", "d8d", onWf("  pro-ui-b:\n    if: " + PRO_IF, "  pro-ui-b:\n    if: ${{ contains(github.event.pull_request.labels.*.name, 'pro-ui-x') }}")],
  ["pro-ui-a job is renamed", "d8a", onWf("  pro-ui-a:\n", "  pro-ui-z:\n")],
  ["DUO_CLOSED_TESTS is unset", "d3a", onMk("DUO_CLOSED_TESTS := ", "# DUO_CLOSED_TESTS := ")],
  ["DUO_CLOSED_TESTS lists a call that sits in a comment", "d3b", onMk(" DuoSpreadUITests/testClosedTallyIsOnePage", " DuoSpreadUITests/testClosedTallyIsOnePage DuoShellUITests/testCommentedCall")],
  ["DUO_CLOSED_TESTS lists a call that sits in a multi-line string", "d3b", onMk(" DuoSpreadUITests/testClosedTallyIsOnePage", " DuoSpreadUITests/testClosedTallyIsOnePage DuoShellUITests/testBlockTextIsNotACall")],
  ["a closed test loses its call in Swift", "d3b", onSwift("DuoSpreadUITests.swift", ".closed", ".flat")],
  ["the flat pass -only-testing lists part of DUO_UI_TESTS", "d4b", onMk("$(addprefix -only-testing:ManifestUITests/,$(DUO_UI_TESTS))", "$(addprefix -only-testing:ManifestUITests/,DuoHandUITests DuoSpreadUITests)")],
  ["the flat pass -skip-testing names one closed id only", "d4c", onMk("$(addprefix -skip-testing:ManifestUITests/,$(DUO_CLOSED_TESTS))", "$(addprefix -skip-testing:ManifestUITests/,DuoShellUITests/testBracesInBody)")],
  ["the closed pass -only-testing names one closed id only", "d4d", onMk("$(addprefix -only-testing:ManifestUITests/,$(DUO_CLOSED_TESTS))", "$(addprefix -only-testing:ManifestUITests/,DuoShellUITests/testBracesInBody)")],
  ["the flat target is renamed", "d4a", onMk("ui-duo-flat:", "ui-duo-flat-old:")],
  ["the flat pass's script drops -retry-tests-on-failure", "d5a", (g) => ({ ...SCRIPT_INPUT, script: mutate(SCRIPT_GOOD, " -retry-tests-on-failure", "") })],
  ["the workflow env drops -retry-tests-on-failure", "d5a", (g) => ({ ...WF_ENV_INPUT, workflow: mutate(WF_ENV_INPUT.workflow, SHARED_TEST, SHARED_TEST.replace(" -retry-tests-on-failure", "")) })],
  ["the workflow env drops its -resultBundlePath", "d5f", (g) => ({ ...WF_ENV_INPUT, workflow: mutate(WF_ENV_INPUT.workflow, " -resultBundlePath $RESULT_BUNDLE", "") })],
  // The four rows below edit the live-shape fixture. Each names its cause in the fourth field, so a crash or another failure cannot pass as the red.
  ["the env names the wrong target for the flat pass", "d5a", onCmd("  DUO_FLAT_CMD: make ui-duo-flat\n", "  DUO_FLAT_CMD: make ui-duo-closed\n"), "no step in duo-ui runs make ui-duo-flat"],
  ["the flat step names a variable no env sets", "d5a", onCmd(FLAT_STEP_RUN, "        run: scripts/ci-sim.sh run $DUO_FLAT_COMMAND"), "$DUO_FLAT_COMMAND, which no env block sets"],
  ["the env names a longer target than the flat pass", "d5a", onCmd("  DUO_FLAT_CMD: make ui-duo-flat\n", "  DUO_FLAT_CMD: make ui-duo-flat-old\n"), "no step in duo-ui runs make ui-duo-flat"],
  ["the flat command sits only on a comment line", "d5a", onCmd(FLAT_STEP_RUN, "        run: |\n          # scripts/ci-sim.sh run $DUO_FLAT_CMD\n          true"), "no step in duo-ui runs make ui-duo-flat"],
  ["labeled-event narrowing on the duo-ui if", "d2d", narrowDuo, "does not run on draft=false, labels=[duo-ui, pro-ui], action=labeled, labelName=pro-ui"],
  ["labeled-event narrowing on the pro-ui ifs", "d8c", narrowPro, "does not run on draft=false, labels=[duo-ui, pro-ui], action=labeled, labelName=duo-ui"],
  ["labeled-event narrowing on the pro-ui ifs", "d8d", narrowPro, "does not run on draft=false, labels=[duo-ui, pro-ui], action=labeled, labelName=duo-ui"],
  ["the group drops the draft state", "d9b", onWf("-${{ github.event.pull_request.draft }}", ""), "group is"],
  ["cancel-in-progress is an if: expression", "d9a", onWf("  cancel-in-progress: true", "  cancel-in-progress: ${{ github.event.action != 'labeled' }}"), "cancel-in-progress is \"${{ github.event.action != 'labeled' }}\""],
];

for (const [name, id, build, cause] of MUTANTS) {
  let res;
  try {
    res = checkDuo(build(GOOD));
  } catch (e) {
    expect(`fixture red: ${name} fails ${id}`, false, `fixture edit failed: ${e.message}`);
    continue;
  }
  const hit = res.find((r) => r.id === id);
  const caught = hit !== undefined && !hit.ok && (cause === undefined || hit.detail.includes(cause));
  const got = hit ? (hit.ok ? "passed" : hit.detail) : "no such check";
  expect(`fixture red: ${name} fails ${id}`, caught, `${id}: ${got}${cause && !caught ? `; want the cause "${cause}"` : ""}`);
  if (caught) console.log(`     named cause: ${hit.detail}`);
}

// The good set passes every check. The variants reach the empty set and the full-size set, and
// the flags moved into scripts/ci-sim.sh.
const FULL ={ ...GOOD, swift: FULL_SWIFT, makefile: MAKEFILE(FULL_CLOSED) };
const VARIANTS = [
  ["fixture good: the good set", GOOD],
  ["fixture good: the closed pass if: reads env beside !cancelled()", { ...GOOD, workflow: mutate(GOOD.workflow, CLOSED_IF, "        if: ${{ !cancelled() && env.SIM_UDID != '' }}") }],
  ["fixture good: no closed test (empty DUO_CLOSED_TESTS)", { ...GOOD, swift: EMPTY_SWIFT, makefile: MAKEFILE([]) }],
  ["fixture good: full size (90 methods, 18 closed)", FULL],
  ["fixture good: flags in scripts/ci-sim.sh", SCRIPT_INPUT],
  ["fixture good: flags in the workflow env", WF_ENV_INPUT],
  ["fixture good: commands in the workflow env, one braced", CMD_INPUT],
  ["fixture good: the closed command in the duo-ui job env", { ...GOOD, workflow: jobEnvCmd }],
  ["fixture good: the flat command in its step env", { ...GOOD, workflow: stepEnvCmd }],
  ["fixture good: a # inside quotes on the flat command line", { ...GOOD, workflow: quotedHashCmd }],
  ["fixture good: a lone apostrophe on an earlier run line", { ...GOOD, workflow: apostropheCmd }],
  ["fixture good: commands from the env, full size", { ...CMD_INPUT, swift: FULL_SWIFT, makefile: MAKEFILE(FULL_CLOSED) }],
];
for (const [name, input] of VARIANTS) {
  const bad = checkDuo(input).filter((r) => !r.ok);
  expect(name, bad.length === 0, bad.map((r) => `${r.id} (${r.detail})`).join("; "));
}

// Scanner cases. Each names the closed ids its Swift text must produce.
const scanCase = (body) => ({
  "DuoScanUITests.swift": ["final class DuoScanUITests: XCTestCase {", ...body, "}", ""].join("\n"),
});
const SCAN_CASES = [
  ["a comment opener inside a string keeps the real call after it", scanCase(["    func testA() throws {", '        let u = "http://x"; guard app.requirePose(.closed) else { return }', "    }"]), ["DuoScanUITests/testA"]],
  ["a call inside a multi-line string is not a call", scanCase(["    func testB() throws {", '        let t = """', "        guard app.requirePose(.closed) else { return }", '        """', "    }"]), []],
  ["a lone quote in a comment opens no string", scanCase(["    func testC() throws {", '        // he said "no', "        guard app.requirePose(.closed) else { return }", "    }"]), ["DuoScanUITests/testC"]],
  ["a call inside a nested block comment is not a call", scanCase(["    func testD() throws {", "        /* outer /* inner */ guard app.requirePose(.closed) else { return } */", "    }"]), []],
  ["a brace inside a string does not end the body early", scanCase(["    func testE() throws {", '        let s = "}"', "        guard app.requirePose(.closed) else { return }", "    }"]), ["DuoScanUITests/testE"]],
  ["a call belongs to the method that holds it", scanCase(["    func testF() throws {", "        guard app.requirePose(.flat) else { return }", "    }", "    func testG() throws {", "        guard app.requirePose(.closed) else { return }", "    }"]), ["DuoScanUITests/testG"]],
  ["a non-Duo file is outside the scan", { "TallyUITests.swift": "final class TallyUITests: XCTestCase {\n    func testH() throws {\n        guard app.requirePose(.closed) else { return }\n    }\n}\n" }, []],
];
for (const [name, files, want] of SCAN_CASES) {
  const got = swiftClosedIds(files);
  expect(
    `scanner: ${name}`,
    JSON.stringify([...got].sort()) === JSON.stringify([...want].sort()),
    `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`
  );
}

// The workflow reader keeps a quoted # and a lone apostrophe as text, and keeps a comment-looking
// line inside a block scalar.
const tryParse = (text) => {
  try {
    return parseYaml(text);
  } catch (e) {
    return { error: e.message };
  }
};
{
  const doc = tryParse('k: "a # b"\n');
  expect("yaml: a quoted # is not a comment", doc.k === "a # b", `got ${show(doc.k)}`);
}
{
  const doc = tryParse("k: Duo's pass # don't panic\n");
  expect("yaml: a lone apostrophe in a plain scalar is text, and the # after a space is a comment", doc.k === "Duo's pass", `got ${show(doc.k)}`);
}
{
  const doc = tryParse("run: |\n  echo ok\n  # ${{ github.sha }}\n");
  expect("yaml: a # line inside a block scalar stays in its text", String(doc.run).includes("# ${{ github.sha }}"), `got ${show(doc.run)}`);
}

if (failures) {
  console.log(failLine(failures, total));
  process.exit(1);
}
console.log("duo-ui-wiring: all green");
