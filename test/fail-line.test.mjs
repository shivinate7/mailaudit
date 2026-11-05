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
//   B0  test/harness.mjs calls failLine on its red paths;
//   B1  each suite the profile names imports test/fail-line.mjs and calls failLine, or imports
//       harness.mjs, whose report() calls it;
//   S   the source scan that B uses reads comment openers in strings, a multi-line template,
//       a lone quote in text (JSX and comment) and import-looking text in a string correctly;
//   C1  a suite whose module fails to load prints no line the classifier reads as a kill.
//
// The shared helper, test/fail-line.mjs, exports failLine(failed, total), which returns
// `FAIL: ${failed} of ${total} failed`. Only the call and the import are checked here.
//
// Run: node test/fail-line.test.mjs. Exits 1 on any failure.

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
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
  return {
    calls: /\bfailLine\s*\(/.test(code),
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
ok(harnessScan.calls, "B0 test/harness.mjs calls failLine on its red paths (report and stalled)");

for (const rel of suites) {
  const s = scanSource(readFileSync(join(ROOT, rel), "utf8"), rel);
  const direct = s.calls && s.helper;
  const viaHarness = s.harness && harnessScan.calls;
  ok(
    direct || viaHarness,
    `B1 ${rel} prints the FAIL line at its red exit: it imports test/fail-line.mjs and calls failLine, or it imports harness.mjs, which calls it`
  );
}

// C. A suite whose module cannot load must not print a line the classifier reads as a kill.
// A load hook refuses scripts/milestone-due.mjs. The hook is passed as data: URLs, so no file is written.
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
{
  const loader =
    `export async function load(url, context, nextLoad) {\n` +
    `  if (url.endsWith("/scripts/milestone-due.mjs")) throw new Error("fixture: refused load");\n` +
    `  return nextLoad(url, context);\n}\n`;
  const hook = `import { register } from "node:module";\nregister(${JSON.stringify(dataUrl(loader))});\n`;
  const r = spawnSync(process.execPath, ["--import", dataUrl(hook), "test/milestone-due.test.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });
  ok(
    r.status !== 0 && !r.stdout.includes("all green"),
    "C0 control: the refused load reaches the suite's load-error path and exits nonzero"
  );
  eq(failLines(r.stdout), [], "C1 a suite whose module fails to load prints no line the classifier reads as a kill");
}

report();
