// A checked reader for the record corpus's own published numbers and paths.
//
// This used to read only CLAUDE.md, which was 2,385 lines and held every
// argument. CLAUDE.md is now an index; the records under
// docs/decisions/, invariants/ and measurements/ hold the prose this file used to
// check. So this walks CLAUDE.md plus every `.md` file in those three
// folders, and checks four claims against the whole
// corpus: the suite's published assertion count, every repo path named in
// backticks, every code name in backticks, and every link target in
// README.md and CLAUDE.md. Run with `npm run check:docs`. Text inside a code fence is
// never judged: it is sample code, not a claim about the repo.
//
// What this deliberately does NOT check: the measured page figures in "The
// card's reserved geometry" and "The masthead" (185px, 347.09px, and the
// rest). Those come from a real browser viewport, not from code, and jsdom
// has no layout — there is no reader for them here, and inventing one that
// cannot see a layout shift would be worse than admitting the gap. Re-measure
// them by hand, in a real 375px viewport, the way those records describe.

import * as esbuild from "esbuild";
import { readFileSync, readdirSync } from "fs";
import { existsSync, statSync } from "fs";
import { execFileSync } from "child_process";

const FOLDERS = ["decisions", "invariants", "measurements", "debts"];
const DIR = (f) => (f === "decisions" || f === "debts" ? `docs/${f}` : f); // layout: docs/decisions, docs/debts

// ---------- load the corpus: CLAUDE.md plus every record ----------

const files = ["CLAUDE.md", "README.md"].map((path) => ({ path, text: readFileSync(path, "utf8") }));
for (const folder of FOLDERS) {
  if (!existsSync(DIR(folder))) continue; // a missing folder reads as empty
  for (const name of readdirSync(DIR(folder)).sort()) {
    if (!name.endsWith(".md")) continue;
    const path = `${DIR(folder)}/${name}`;
    files.push({ path, text: readFileSync(path, "utf8") });
  }
}

let failures = 0;

/* ---------- shared: fence parsing, identical to check-records.mjs ----------
   A fence opens on a line (indented at most 3 spaces, CommonMark's own
   allowance) that is nothing but a run of 3+ backticks, optionally followed
   by an info string containing no backtick. It closes on the next such
   backtick-only line whose run is AT LEAST as long as the opener's. This
   file does not re-derive that rule independently of check-records.mjs's —
   two different ideas of "where a fence ends" would let this file judge a
   line check-records.mjs considers historical, or the reverse. */
function parseFences(text) {
  const lines = text.split("\n");
  const fences = []; // { startLine, endLine, backtickLen }
  let open = null;
  lines.forEach((line, i) => {
    const stripped = line.trimStart();
    const indent = line.length - stripped.length;
    const run = stripped.match(/^`+/)?.[0].length ?? 0;
    const rest = stripped.slice(run);
    const isBacktickLine = run >= 3 && indent <= 3;
    if (open === null) {
      if (isBacktickLine && !rest.includes("`")) {
        open = { startLine: i + 1, backtickLen: run };
      }
    } else {
      if (isBacktickLine && rest.trim() === "" && run >= open.backtickLen) {
        fences.push({ ...open, endLine: i + 1 });
        open = null;
      }
    }
  });
  // An unclosed fence is check-records.mjs's problem (claim 2), not this
  // file's — but blank it out to end-of-file so an unbalanced document
  // never leaks fence content into what this file judges as prose.
  if (open) fences.push({ ...open, endLine: lines.length });
  return fences;
}

/* Returns `text` with every fenced line (opener, body and closer) replaced
   by a same-length run of spaces, never removed. Line numbers therefore stay
   identical to the original file, so every error below can still report a
   real "file:line" — only the CONTENT of a fence is made invisible to the
   regexes that follow. */
function withoutFences(text) {
  const lines = text.split("\n");
  const fences = parseFences(text);
  for (const { startLine, endLine } of fences) {
    for (let ln = startLine; ln <= endLine; ln++) {
      const i = ln - 1;
      lines[i] = " ".repeat(lines[i].length);
    }
  }
  return lines.join("\n");
}

const prose = files.map((f) => ({ ...f, prose: withoutFences(f.text) }));

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

/* ---------- claim 1: the published assertion count ----------
   The suite itself prints "<N> passed, <M> failed" — see test/harness.mjs.
   That printed total is the one true count; the corpus's prose is graded
   against it, never the other way around.

   The total is NOT stable across timezones. `ci-runs-in-utc` (and the
   `suite-size` record) document that test 38.9 skips itself in UTC, so a CI
   runner set to UTC prints one fewer assertion than a machine behind UTC.
   A count that changes with the runner's clock cannot be checked anywhere,
   so the count is always read from a run under a fixed, non-UTC zone.
   CI runs the suite once under that zone and names its output in
   CHECK_DOCS_SUITE_LOG; this reads the count from that file. With the
   variable unset (local use) it runs the suite itself, as before. A named
   file that is unreadable or holds no count is a failure, never a pass. */
const FIXED_TZ = "America/New_York";

function suiteTotal() {
  const log = process.env.CHECK_DOCS_SUITE_LOG;
  let out;
  if (log) {
    try {
      out = readFileSync(log, "utf8");
    } catch (e) {
      throw new Error(`could not read CHECK_DOCS_SUITE_LOG (${log}): ${e.message}`);
    }
  } else {
    out = execFileSync(process.execPath, ["test/app.test.mjs"], {
      encoding: "utf8",
      env: { ...process.env, TZ: FIXED_TZ },
    });
  }
  const m = out.match(/(\d+) passed, (\d+) failed/);
  if (!m) {
    throw new Error("could not read a pass/fail count out of the suite's output");
  }
  return Number(m[1]) + Number(m[2]);
}

const real = suiteTotal();
let countClaims = 0;
for (const f of prose) {
  for (const m of f.prose.matchAll(/(\d+)\s+assertions\b/gi)) {
    countClaims++;
    const n = Number(m[1]);
    if (n !== real) {
      const line = lineAt(f.prose, m.index);
      console.error(
        `check:docs: ${f.path}:${line} says "${n} assertions", but the suite prints ${real}`
      );
      failures++;
    }
  }
}

if (countClaims === 0) {
  // No record's prose states the count. Reported rather than silently
  // passed, but not a failure: the check above grades any record that does.
  console.log(
    `check:docs: no record's own prose states an assertion count — see ` +
      `measurements/suite-size.md (suite's real total: ${real})`
  );
} else {
  console.log(
    `check:docs: ${countClaims} assertion-count claim(s), across the corpus's own ` +
      `prose, checked against the suite's real total (${real})`
  );
}

/* ---------- claim 2: every repo path named in backticks exists ----------
   A backtick span is judged as a path only when it looks like one: no
   whitespace, no URL, no curly-brace API template, no colon (a storage key
   like `mailday:v1` or a git ref like `ledger/data:ledger.json` is not a
   filesystem path), and it either ends in a recognized file extension or in
   a trailing slash naming a directory. Everything else is refused rather
   than silently skipped, and printed with a count so the reader knows what
   this did not check. Unchanged from before the split, applied now to every
   file's own prose rather than to CLAUDE.md's alone. */
const EXT = /\.(mjs|jsx?|json|html?|md|ya?ml|py|svg|png|css|txt)$/i;
const SEMVER = /^\^?~?\d+(\.\d+){1,2}$/;
const BARE_EXT = /^\.[a-z0-9]+$/i;
// A domain read off github.com or raw.githubusercontent.com, e.g.
// `raw.githubusercontent.com/owner/repo/...` — not a path in THIS repo.
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+\//i;

// Names the records give that are NOT in this repo, by design. Each is judged
// by hand, not by the filesystem. Keep this list to what the records say lives
// elsewhere; a path that moved inside this repo must fail, not land here.
const OTHER_REPO = new Set([
  "ledger.json", // the ledger file, on the data branch of mailaudit-data
  "photos/", // the photo directory, on main of mailaudit-data
  "backup-watchdog.yml", // the watchdog workflow, lives in mailaudit-data
  "_studies.html", // the motion proof sheet, never committed (docs/decisions/motion-method-side-by-side-proof.md)
]);

function excluded(s) {
  if (OTHER_REPO.has(s)) return true;
  if (/\s/.test(s)) return true;
  if (s.includes("://")) return true;
  if (s.includes("{") || s.includes("}")) return true;
  if (s.includes(":")) return true;
  if (s.includes("@")) return true;
  if (s.includes("*") || s.includes("|")) return true;
  if (s.includes("..")) return true;
  if (s.startsWith("/")) return true; // a URL path, not a repo path
  if (SEMVER.test(s)) return true;
  if (BARE_EXT.test(s)) return true; // "`.json`" names an extension, not a file
  if (DOMAIN.test(s)) return true;
  // node_modules is generated, never committed, and any mention of it is an
  // illustrative example location, not a claim that it exists now.
  if (s.startsWith("node_modules/")) return true;
  // A record slug (e.g. `imports-merge-never-replace`) is a citation into the
  // corpus, not a filesystem path — check-records.mjs (claim 1) already
  // proves every citation resolves. This file only judges spans that look
  // like a real repo path (slash-qualified, or a recognized extension), so a
  // bare slug never reaches EXT/knownPath and is refused on its own; this
  // guard exists so a slug that HAPPENS to end in something extension-shaped
  // is still never mistaken for one.
  if (!s.includes("/") && !EXT.test(s) && /^[a-z0-9-]+$/i.test(s)) return true;
  return false;
}

// Every slash-qualified candidate across the WHOLE corpus builds one
// basename -> full-path map, the same way CLAUDE.md alone used to: a record
// gives `src/app.jsx` a real location, and a bare later mention of
// `app.jsx` — in that record or any other — is judged against that
// location, not against the repo root.
const allSpans = []; // { path, file, span, index }
for (const f of prose) {
  for (const m of f.prose.matchAll(/`([^`\n]+)`/g)) {
    allSpans.push({ file: f.path, span: m[1], index: m.index, prose: f.prose });
  }
}

const knownPath = new Map();
for (const { span } of allSpans) {
  if (excluded(span) || span.endsWith("/") || !span.includes("/") || !EXT.test(span)) continue;
  const base = span.split("/").pop();
  if (!knownPath.has(base)) knownPath.set(base, span);
}

// Every file in the repo, for bare filenames that live below the root.
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");

// A bare filename's real location: the corpus's own qualified mention, then the
// root, then any tracked file with that basename. null when it is nowhere.
function resolveBare(name) {
  if (knownPath.has(name)) return knownPath.get(name);
  if (existsSync(name)) return name;
  const hits = tracked.filter((t) => t.endsWith("/" + name));
  return hits.length > 1 ? { ambiguous: hits } : hits[0] ?? null;
}
function lineCount(path) {
  const t = readFileSync(path, "utf8");
  return t.split("\n").length - (t.endsWith("\n") ? 1 : 0);
}

let checked = 0;
const refused = new Set();
const seenPerFile = new Map(); // file -> Set(span) — de-dupe within one file, as before

for (const entry of allSpans) {
  const { file, span, index, prose: fileProse } = entry;
  if (!seenPerFile.has(file)) seenPerFile.set(file, new Set());
  const seen = seenPerFile.get(file);
  if (seen.has(span)) continue;
  seen.add(span);

  // `file:line` (or `file:a-b`): the file must exist with at least that many lines.
  const fl = span.match(/^([^\s:]+\.[a-z]+):(\d+)(?:-(\d+))?$/i);
  if (fl) {
    checked++;
    const need = Number(fl[3] ?? fl[2]);
    const where = fl[1].includes("/") ? (existsSync(fl[1]) ? fl[1] : null) : resolveBare(fl[1]);
    if (where?.ambiguous) {
      console.error(`check:docs: ${file}:${lineAt(fileProse, index)} names \`${span}\`, which is ambiguous: ${where.ambiguous.join(", ")}`);
      failures++;
      continue;
    }
    const have = where ? lineCount(where) : -1;
    if (have < need) {
      const line = lineAt(fileProse, index);
      console.error(
        `check:docs: ${file}:${line} names \`${span}\`, but ` +
          (have < 0 ? "that file does not exist" : `${fl[1]} has only ${have} line(s)`)
      );
      failures++;
    }
    continue;
  }

  if (excluded(span)) {
    refused.add(span);
    continue;
  }

  if (span.endsWith("/")) {
    // Every directory is judged, single-segment ones too: prose that
    // names a directory in another repo says so without backticks.
    const dir = span.slice(0, -1);
    checked++;
    if (!(existsSync(dir) && statSync(dir).isDirectory())) {
      const line = lineAt(fileProse, index);
      console.error(`check:docs: ${file}:${line} names \`${span}\`, which does not exist in this repo`);
      failures++;
    }
    continue;
  }

  if (!EXT.test(span)) {
    refused.add(span);
    continue;
  }

  // A qualified path is judged directly. A bare filename is judged only when
  // the corpus has itself supplied a real location for it (via knownPath) or
  // it is plausibly a root file — anything else (a filename that lives only
  // in another repo, like `ledger.json`) is refused, not failed.
  const found = span.includes("/") ? span : resolveBare(span) ?? span;
  if (found.ambiguous) {
    console.error(`check:docs: ${file}:${lineAt(fileProse, index)} names \`${span}\`, which is ambiguous: ${found.ambiguous.join(", ")}`);
    failures++;
    continue;
  }
  const target = found;
  checked++;
  if (!existsSync(target)) {
    const line = lineAt(fileProse, index);
    console.error(`check:docs: ${file}:${line} names \`${span}\`, which does not exist in this repo`);
    failures++;
  }
}

/* ---------- claim 3: every code-shaped name in backticks occurs in the code ----------
   A span shaped like a code name (camelCase, PascalCase, snake_case, CONST_CASE, or
   `name()`) must occur as a whole word somewhere in the code roots below.
   A renamed function then turns every record that cites it red. Names the
   code cannot hold are listed in EXTERNAL, one reason each. */
const CODE_ROOTS = ["src", "test", "build.mjs", "check-records.mjs", "icon", "native", "package.json", ".github"];
const EXTERNAL = new Set([
  "currentTime", // Web Animations API, set by hand when measuring motion
  "getAnimations", // Web Animations API, used by hand when measuring motion
  "removeChild", // DOM method named in the save-slot measurement note
  "enforce_admins", // GitHub branch-protection setting, not our code
  "fromJSON", // GitHub Actions expression function
]);
function walk(path, out) {
  if (!existsSync(path)) return;
  if (statSync(path).isDirectory()) {
    for (const n of readdirSync(path)) if (n !== "node_modules" && !n.startsWith(".")) walk(`${path}/${n}`, out);
  } else if (!/\.(png|jpe?g)$/i.test(path)) {
    let t = readFileSync(path, "utf8");
    // A name in a comment is prose, not code: esbuild drops JS comments (it
    // keeps strings and regex literals intact). A file it cannot parse fails
    // the check by name; it is never treated as clear. Known ceiling: non-JS
    // files (.py, .yml) are not stripped, so a name in a `#` comment still counts.
    // And esbuild folds constant expressions: `false && X` becomes `false`, so a
    // name that lives only in such dead code reads as absent.
    if (/\.(mjs|jsx?)$/.test(path)) {
      try {
        t = esbuild.transformSync(t, { loader: "jsx", legalComments: "none" }).code;
      } catch (e) {
        console.error(`check:docs: cannot parse ${path}: ${e.errors?.[0]?.text ?? e.message}`);
        failures++;
        t = "";
      }
    }
    out.push(t);
  }
}
const codeParts = [];
for (const r of CODE_ROOTS) walk(r, codeParts);
const codeText = codeParts.join("\n");
const NAME_SHAPE = /^(?:[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*|[a-z][a-z0-9]*(?:_[a-z0-9]+)+|[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+|[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+|[A-Za-z_$][\w$]*\(\))$/;
const nameSeen = new Set();
let namesJudged = 0;
for (const { file, span, index, prose: fileProse } of allSpans) {
  if (!NAME_SHAPE.test(span)) continue;
  const name = span.replace(/\(\)$/, "");
  if (EXTERNAL.has(name)) continue;
  const key = `${file}\0${name}`;
  if (nameSeen.has(key)) continue;
  nameSeen.add(key);
  namesJudged++;
  const re = new RegExp(`(?<![\\w$])${name.replace(/\$/g, "\\$")}(?![\\w$])`);
  if (!re.test(codeText)) {
    console.error(`check:docs: ${file}:${lineAt(fileProse, index)} names \`${span}\`, which occurs nowhere in the code`);
    failures++;
  }
}
console.log(`check:docs: ${namesJudged} code name(s) judged against the code`);

/* ---------- claim 4: markdown link targets in README.md and CLAUDE.md resolve ----------
   [text](target): a relative file target must exist. URLs and bare #anchors are
   not judged. A #fragment on a file target is stripped; the file is judged.
   Fences are already blank. Code spans are blanked here too (same length, so
   line numbers hold), so a `[x](y)` shown as sample text is not a link.
   Titled links `[x](y "t")` judge y. A path with spaces must use the
   `[x](<a b.md>)` form. Reference-style links `[x][ref]` / `[ref]: y` are
   NOT checked: the repo uses none. */
{
  let links = 0;
  const blankSpans = (t) =>
    t.replace(/(`+)(?!`)[^\n]*?[^`]\1(?!`)/g, (m) => m.replace(/[^\n]/g, " "));
  for (const f of prose.filter((x) => x.path === "README.md" || x.path === "CLAUDE.md")) {
    const text = blankSpans(f.prose);
    for (const m of text.matchAll(/\]\(\s*(?:<([^>\n]+)>|([^)\s]+))/g)) {
      const t = (m[1] ?? m[2]).split("#")[0];
      if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t)) continue;
      links++;
      if (!existsSync(t)) {
        console.error(`check:docs: ${f.path}:${lineAt(text, m.index)} links to \`${t}\`, which does not exist`);
        failures++;
      }
    }
  }
  console.log(`check:docs: ${links} markdown link target(s) checked`);
}

console.log(`check:docs: walked ${files.length} file(s) (CLAUDE.md, README.md + ${files.length - 2} record(s))`);
console.log(`check:docs: ${checked} path(s) checked against the filesystem, outside any fence`);
console.log(`check:docs: ${refused.size} backtick span(s) refused as not path-like`);
if (process.env.CHECK_DOCS_VERBOSE) {
  for (const s of refused) console.log(`  refused: ${s}`);
}

if (failures) {
  console.error(`check:docs: ${failures} problem(s) found`);
  process.exit(1);
}
console.log("check:docs: the corpus's numbers and paths check out");
