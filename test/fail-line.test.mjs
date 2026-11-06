// Cases for the FAIL line that every suite prints when it ends red.
//
// The mutation report (claude-settings hooks/mutate_guard.py, profile "mailaudit") counts a
// mutant killed only when a suite prints a line the classifier FAIL_LINE matches. A crash
// leaves no such line. So each suite named by the profile's tests regex must print, on stdout
// at column 0, exactly `FAIL: <n> of <m> failed` when it ends red: n failed checks, m checks
// run. The cases prove:
//   A1  a red harness run prints one `FAIL: 1 of 2 failed` line;
//   A2  two failed of three print `FAIL: 2 of 3 failed`;
//   A3  control: a green run prints no FAIL line and ends `all green`;
//   A4  control: a throw prints no FAIL line, and exits nonzero (a crash is not a kill);
//   B0  test/harness.mjs calls failLine;
//   B1  each suite the profile names imports test/fail-line.mjs and calls failLine, or imports
//       harness.mjs, whose code calls it. This proves the import and a call appear together in
//       each file. It does not prove the call sits on each red exit path;
//   S   the source scan that B uses reads comment openers in strings, a multi-line template,
//       a lone quote in text (JSX, comment, regex) and import-looking or call-looking text in a
//       string correctly;
//   C0, C1  a suite whose module fails to load prints no FAIL-prefixed line, so the classifier
//       reads no kill. milestone-due and worker/core.test.mjs are both refused by a load hook.
//       The rule is stricter than the summary line alone: any FAIL-prefixed line counts;
//   D0 to D3  the shared helper, test/fail-line.mjs, exports failLine(failed, total) that returns
//       `FAIL: ${failed} of ${total} failed`, matches the classifier's regex and the summary
//       pattern, and prints full-size runs (n equal to m). A missing file is one named red.
//
//   A5  a stalled run prints no FAIL line, names the stall on its own line, and exits nonzero;
//   E   every red exit in a suite prints failLine first, unless it is a load-error catch. The scan
//       blanks strings and drops comments, and its traps run first;
//
// Run: node test/fail-line.test.mjs. Exits 1 on any failure.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSync, transformSync } from "esbuild";
import { ok, eq, report } from "./harness.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = join(ROOT, "test", "harness.mjs");
const HARNESS_URL = pathToFileURL(HARNESS).href;

// The classifier's regex, copied from claude-settings hooks/mutate_shared.py (FAIL_LINE).
// The copy is needed because CI cannot read claude-settings. A red assertion is a line it matches.
const FAIL_LINE = /^FAIL(?::|\s|$)/;
// The one line a red suite prints: failed checks of checks run, at column 0.
const SUMMARY = /^FAIL: (\d+) of (\d+) failed$/;

const linesOf = (out) => String(out).split("\n");
const failLines = (out) => linesOf(out).filter((l) => FAIL_LINE.test(l));
const summaryLines = (out) => linesOf(out).filter((l) => SUMMARY.test(l));

// A child process running a harness-based body. The body runs as an ES module with -e, so
// no file is written and no temp folder is needed.
function harnessRun(body) {
  const code = `import { ok, eq, report } from ${JSON.stringify(HARNESS_URL)};\n${body}\n`;
  return spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });
}

// A. The line a red harness run prints, and the controls that must print none.
{
  const one = harnessRun(`ok(true, "passes"); ok(false, "fails"); report();`);
  eq(summaryLines(one.stdout), ["FAIL: 1 of 2 failed"], "A1 a red harness run prints one `FAIL: 1 of 2 failed` line");

  const two = harnessRun(`ok(false, "a"); ok(false, "b"); ok(true, "c"); report();`);
  eq(summaryLines(two.stdout), ["FAIL: 2 of 3 failed"], "A2 two failed of three print `FAIL: 2 of 3 failed`");

  const green = harnessRun(`ok(true, "a"); report();`);
  eq(failLines(green.stdout), [], "A3 control: a green run prints no FAIL line");
  ok(green.status === 0 && green.stdout.includes("all green"), "A3 control: a green run exits 0 and ends `all green`");

  const crash = harnessRun(`ok(true, "a"); throw new Error("fixture crash");`);
  eq(failLines(crash.stdout), [], "A4 control: a throw prints no FAIL line");
  ok(crash.status !== 0, "A4 control: a throw exits nonzero");

  // A stall is a timeout or a crash, not a failed check: a run that never reaches report() prints no FAIL line.
  const stall = harnessRun(`ok(true, "a"); (async () => { await new Promise(() => {}); })();`);
  eq(failLines(stall.stdout), [], "A5 a stalled run prints no FAIL line");
  ok(/^harness stalled: /m.test(stall.stdout), "A5 a stalled run names the stall on a line of its own");
  ok(stall.status !== 0, "A5 a stalled run exits nonzero");
}

// Source scan. esbuild parses the file, so comments are gone and string contents are data.
// Calls come from the transformed code; imports come from esbuild's metafile.
function scanSource(text, sourcefile = "suite.test.mjs") {
  const loader = sourcefile.endsWith(".jsx") ? "jsx" : "js";
  const code = transformSync(text, { loader, format: "esm", target: "esnext" }).code;
  const meta = buildSync({
    stdin: { contents: text, loader, resolveDir: join(ROOT, "test"), sourcefile },
    bundle: true,
    format: "esm",
    external: ["*"],
    metafile: true,
    write: false,
    logLevel: "silent",
  }).metafile;
  const specs = Object.values(meta.inputs).flatMap((i) => i.imports.map((x) => x.path));
  // esbuild prints string and template literals whole, so a call inside one is blanked before the call check.
  const blankStrings = code.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g, '""');
  return {
    calls: /\bfailLine\s*\(/.test(blankStrings),
    helper: specs.some((s) => /(^|\/)fail-line\.mjs$/.test(s)),
    harness: specs.some((s) => /(^|\/)harness\.mjs$/.test(s)),
  };
}

// S. Traps for the source scan itself, each one a way a naive scan reads too much or too little.
const SCAN_CASES = [
  [
    "an import-looking string is not an import",
    `const doc = 'import { failLine } from "./fail-line.mjs";';\nfailLine(1, 2);\n`,
    { helper: false, calls: true },
  ],
  [
    "a comment opener in a string does not hide a later import",
    `const open = "/*";\nimport { failLine } from "./fail-line.mjs";\nfailLine(1, 2);\n`,
    { helper: true, calls: true },
  ],
  [
    "a // in a string does not hide a later import on the same line",
    `const url = "http://x"; import { failLine } from "./fail-line.mjs"; failLine(1, 2);\n`,
    { helper: true, calls: true },
  ],
  [
    "a commented import and call are not seen",
    `// import { failLine } from "./fail-line.mjs";\n// failLine(1, 2);\n`,
    { helper: false, calls: false },
  ],
  [
    "a multi-line template does not end the scan early",
    "const doc = `\n// not a comment\n`;\nimport { failLine } from \"./fail-line.mjs\";\nfailLine(1, 2);\n",
    { helper: true, calls: true },
  ],
  [
    "a lone apostrophe in a comment does not open a string",
    `// Don't\nimport { failLine } from "./fail-line.mjs";\nfailLine(1, 2);\n`,
    { helper: true, calls: true },
  ],
  [
    "a lone apostrophe in JSX text does not open a string",
    `const el = <p>Don't</p>;\nimport { failLine } from "./fail-line.mjs";\nfailLine(1, 2);\n`,
    { helper: true, calls: true, file: "fixture.jsx" },
  ],
  [
    "a lone apostrophe in a regex literal does not hide a later call",
    `const re = /don't/;\nimport { failLine } from "./fail-line.mjs";\nfailLine(1, 2);\n`,
    { helper: true, calls: true },
  ],
  [
    "a failLine( in a double-quoted string is not a call",
    `const s = "failLine(1, 2)";\n`,
    { helper: false, calls: false },
  ],
  [
    "a failLine( in a single-quoted string is not a call",
    `const s = 'failLine(1, 2)';\n`,
    { helper: false, calls: false },
  ],
  [
    "a failLine( in a template literal is not a call",
    "const s = `\nfailLine(1, 2)\n`;\n",
    { helper: false, calls: false },
  ],
];
for (const [name, text, want] of SCAN_CASES) {
  const got = scanSource(text, want.file);
  eq({ helper: got.helper, calls: got.calls }, { helper: want.helper, calls: want.calls }, `S scanner: ${name}`);
}

// B. Every suite the profile names prints the line at its red exit.
const SCOPE_RE = /^(test\/[^/]+|worker\/core)\.test\.mjs$/;
const suites = [...readdirSync(join(ROOT, "test")).map((f) => `test/${f}`), "worker/core.test.mjs"].filter((f) =>
  SCOPE_RE.test(f)
);
ok(
  suites.length >= 11 && suites.includes("worker/core.test.mjs"),
  `B scope: the profile's tests regex names ${suites.length} suites, with worker/core.test.mjs among them`
);

const harnessScan = scanSource(readFileSync(HARNESS, "utf8"), "harness.mjs");
ok(harnessScan.calls, "B0 test/harness.mjs calls failLine when it reports red");

for (const rel of suites) {
  const s = scanSource(readFileSync(join(ROOT, rel), "utf8"), rel);
  const direct = s.calls && s.helper;
  const viaHarness = s.harness && harnessScan.calls;
  ok(
    direct || viaHarness,
    `B1 ${rel} prints the FAIL line at its red exit: it imports test/fail-line.mjs and calls failLine, or it imports harness.mjs, which calls it`
  );
}

// C. A suite whose module cannot load must print no FAIL-prefixed line. A load hook refuses the
// module, passed as a data: URL, so no file is written.
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
function loadRefusedRun(suite, refused) {
  const loader =
    `export async function load(url, context, nextLoad) {\n` +
    `  if (url.endsWith(${JSON.stringify(refused)})) throw new Error("fixture: refused load");\n` +
    `  return nextLoad(url, context);\n}\n`;
  const hook = `import { register } from "node:module";\nregister(${JSON.stringify(dataUrl(loader))});\n`;
  return spawnSync(process.execPath, ["--import", dataUrl(hook), suite], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });
}
for (const [suite, refused] of [
  ["test/milestone-due.test.mjs", "/scripts/milestone-due.mjs"],
  ["worker/core.test.mjs", "/worker/core.mjs"],
]) {
  const r = loadRefusedRun(suite, refused);
  ok(
    r.status !== 0 && !r.stdout.includes("all green"),
    `C0 control: ${suite} reaches its load-error path when its module is refused, and exits nonzero`
  );
  eq(failLines(r.stdout), [], `C1 ${suite} prints no FAIL-prefixed line when its module fails to load`);
}

// D. The shared helper itself. A missing file is one named red, never a crash on import.
const HELPER = join(ROOT, "test", "fail-line.mjs");
if (!existsSync(HELPER)) {
  ok(false, "D0 test/fail-line.mjs is missing");
} else {
  const helper = await import(pathToFileURL(HELPER).href);
  ok(typeof helper.failLine === "function", "D0 test/fail-line.mjs exports failLine");
  if (typeof helper.failLine === "function") {
    const line = helper.failLine(1, 2);
    eq(line, "FAIL: 1 of 2 failed", "D1 failLine(1, 2) returns `FAIL: 1 of 2 failed`");
    ok(FAIL_LINE.test(line) && SUMMARY.test(line), "D2 the helper's line matches the classifier's FAIL_LINE and the summary pattern");
    eq(helper.failLine(3, 3), "FAIL: 3 of 3 failed", "D3 full size: failLine(3, 3) returns `FAIL: 3 of 3 failed`");
  }
}

// E. Every red exit in a suite prints the FAIL line first. A load error exits from a catch block and
// prints no count, so a catch is the one exception. Strings are blanked and comments dropped first,
// so an exit inside a string or a comment is not an exit.
// The quote characters are hex escapes, so this file's own scan does not read them as string starts.
const STRING_RE = /\x22(?:\\.|[^\x22\\\n])*\x22|\x27(?:\\.|[^\x27\\\n])*\x27|\x60(?:\\.|[^\x60\\])*\x60/g;
// Any exit call and any exitCode assignment counts, so a red exit that takes an expression is still seen.
const EXIT_RE = /\bprocess\.exit\s*\(|\bprocess\.exitCode\s*=/g;
function exitVerdicts(text) {
  const code = transformSync(text, { loader: "js", format: "esm", target: "esnext" }).code;
  const blanked = code.replace(STRING_RE, (m) => " ".repeat(m.length));
  return [...blanked.matchAll(EXIT_RE)].map((m) => {
    let depth = 0;
    let open = -1;
    for (let i = m.index - 1; i >= 0 && open < 0; i--) {
      if (blanked[i] === "}") depth++;
      else if (blanked[i] === "{") {
        if (depth === 0) open = i;
        else depth--;
      }
    }
    const guarded = open >= 0 && /\bfailLine\s*\(/.test(blanked.slice(open, m.index));
    const exempt = open >= 0 && /\bcatch\s*(\([^)]*\))?\s*$/.test(blanked.slice(0, open));
    return { guarded, exempt };
  });
}

// Traps for the exit scan: each is a way a naive scan reads too much or too little.
const EXIT_CASES = [
  ["an exit inside a string is not an exit", `const s = "process.exit(1)";\n`, []],
  ["an exit inside a comment is not an exit", `// process.exit(1);\n`, []],
  ["a failLine print before the exit guards it", `if (x) {\n  console.log(failLine(1, 2));\n  process.exit(1);\n}\n`, [{ guarded: true, exempt: false }]],
  ["a failLine inside a string does not guard the exit", `if (x) {\n  const s = "failLine(1, 2)";\n  process.exit(1);\n}\n`, [{ guarded: false, exempt: false }]],
  ["an exit with no print is unguarded", `if (x) {\n  process.exit(1);\n}\n`, [{ guarded: false, exempt: false }]],
  ["process.exitCode = 1 with no print is unguarded", `if (x) {\n  process.exitCode = 1;\n}\n`, [{ guarded: false, exempt: false }]],
  ["an exit whose argument is an expression is an exit", `if (x) {\n  process.exit(y ? 1 : 0);\n}\n`, [{ guarded: false, exempt: false }]],
  ["an exitCode set to an expression is an exit", `if (x) {\n  process.exitCode = code;\n}\n`, [{ guarded: false, exempt: false }]],
  ["an exit in a catch is a load error, exempt", `try {\n  f();\n} catch (e) {\n  process.exit(1);\n}\n`, [{ guarded: false, exempt: true }]],
  ["a multi-line template with a brace does not end the block early", "const t = `\n}\n`;\nif (x) {\n  process.exit(1);\n}\n", [{ guarded: false, exempt: false }]],
];
for (const [name, text, want] of EXIT_CASES) eq(exitVerdicts(text), want, `E scanner: ${name}`);

// Every suite: each red exit is guarded by failLine, or is a load-error catch.
for (const rel of suites) {
  exitVerdicts(readFileSync(join(ROOT, rel), "utf8")).forEach((v, k) => {
    ok(v.guarded || v.exempt, `E ${rel}: red exit ${k + 1} prints failLine first, or is a load-error catch`);
  });
}

report();
