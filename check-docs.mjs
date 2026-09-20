// A checked reader for the record corpus's own published numbers and paths.
//
// This used to read only CLAUDE.md, which was 2,385 lines and held every
// argument. CLAUDE.md is now a 297-line index; the 154 records under
// decisions/, invariants/ and measurements/ hold the prose this file used to
// check. So this walks CLAUDE.md plus every `.md` file in those three
// folders, and checks the same two claims as before, now against the whole
// corpus: the suite's published assertion count, and every repo path named
// in backticks. Run with `npm run check:docs`.
//
// FENCES ARE HISTORY, NOT A CLAIM. Most record prose sits outside a fence
// that quotes the pre-split CLAUDE.md verbatim, byte for byte — and
// `npm run check:records` (claim 3 there) checks that quote against a pinned
// commit. If this file judged text INSIDE a fence, a path or a count that
// went stale in the years since that quote was written would fail here while
// `check:records` insists the fence must not change to fix it — two checks
// telling you to do opposite things to the same line. So every claim below is
// judged only against a record's OWN prose, outside its fences. If you are
// reading this because a number or a path inside a fenced block looks wrong:
// it is supposed to look wrong. That block is a dated quote, not a live
// claim, and "fixing" it breaks check:records instead. Correct the record's
// own prose (or add a citation to the record that supersedes it) instead of
// touching the fence.
//
// What this deliberately does NOT check: the measured page figures in "The
// card's reserved geometry" and "The masthead" (185px, 347.09px, and the
// rest). Those come from a real browser viewport, not from code, and jsdom
// has no layout — there is no reader for them here, and inventing one that
// cannot see a layout shift would be worse than admitting the gap. Re-measure
// them by hand, in a real 375px viewport, the way those records describe.

import { readFileSync, readdirSync } from "fs";
import { existsSync, statSync } from "fs";
import { execFileSync } from "child_process";

const FOLDERS = ["decisions", "invariants", "measurements"];

// ---------- load the corpus: CLAUDE.md plus every record ----------

const files = [{ path: "CLAUDE.md", text: readFileSync("CLAUDE.md", "utf8") }];
for (const folder of FOLDERS) {
  for (const name of readdirSync(folder).sort()) {
    if (!name.endsWith(".md")) continue;
    const path = `${folder}/${name}`;
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
   so this always runs the suite under a fixed, non-UTC zone — unchanged from
   before the split. */
const FIXED_TZ = "America/New_York";

function suiteTotal() {
  const out = execFileSync(process.execPath, ["test/app.test.mjs"], {
    encoding: "utf8",
    env: { ...process.env, TZ: FIXED_TZ },
  });
  const m = out.match(/(\d+) passed, (\d+) failed/);
  if (!m) {
    throw new Error("could not read a pass/fail count out of npm test's output");
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
  // This is the honest finding, not a bug to paper over: `measurements/
  // suite-size.md` names the count only inside its fence (the frozen quote),
  // and its own prose deliberately never restates the number — it says how
  // to re-measure it instead. So there is currently no live claim anywhere
  // in the corpus for this file to check the real total against. That is
  // reported here rather than silently passed, but it is not treated as a
  // failure: the fence is exempt by design (see the file header), and a
  // record that only ever names a figure once, historically, is not lying
  // about the present. If a record's own prose ever states the count again,
  // the check above starts grading it automatically.
  console.log(
    `check:docs: no record's own prose states an assertion count — the figure ` +
      `lives only inside measurements/suite-size.md's fence (suite's real total: ${real})`
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

function excluded(s) {
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

let checked = 0;
const refused = new Set();
const seenPerFile = new Map(); // file -> Set(span) — de-dupe within one file, as before

for (const entry of allSpans) {
  const { file, span, index, prose: fileProse } = entry;
  if (!seenPerFile.has(file)) seenPerFile.set(file, new Set());
  const seen = seenPerFile.get(file);
  if (seen.has(span)) continue;
  seen.add(span);

  if (excluded(span)) {
    refused.add(span);
    continue;
  }

  if (span.endsWith("/")) {
    // Only judge a multi-segment directory (`.github/workflows/`) — a bare
    // single-segment one (`photos/`) is as likely to name a directory in
    // another repo as one here, and is refused rather than guessed at.
    const dir = span.slice(0, -1);
    if (!dir.includes("/")) {
      refused.add(span);
      continue;
    }
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
  let target = span;
  if (!span.includes("/")) {
    if (knownPath.has(span)) target = knownPath.get(span);
    else if (!existsSync(span)) {
      refused.add(span);
      continue;
    }
  }
  checked++;
  if (!existsSync(target)) {
    const line = lineAt(fileProse, index);
    console.error(`check:docs: ${file}:${line} names \`${span}\`, which does not exist in this repo`);
    failures++;
  }
}

console.log(`check:docs: walked ${files.length} file(s) (CLAUDE.md + ${files.length - 1} record(s))`);
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
