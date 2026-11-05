// Cases for scripts/tests-for.mjs, which names the suites that cover one repo path.
//
// `node scripts/tests-for.mjs <repo-relative path>` prints the suites that cover the path, one per
// line, narrowest first, and exits 0 even with no match. A suite is a file the profile's tests regex
// names: test/<name>.test.mjs or worker/core.test.mjs.
//
// Tier 1: suites that import the path directly (a static import, an export from, or a dynamic
//   import of a string literal, resolved from the suite's folder).
// Tier 2: suites that call spawn, exec or read and name the path in a string literal, by its final
//   segment (a path built with join() still counts). Used only when tier 1 has no suite but app.
// test/app.test.mjs is listed only when no other suite covers the path at any tier. It reaches a
// path by a static or a dynamic import, so it is the last resort in both tiers.
//
// The pure function suitesFor(target, files) takes [{path, text}] and returns the suite paths.
// The fixture cases below use it with source text in memory, so they need no temp folder. The
// scanner traps (comment openers in strings, a multi-line template literal, a lone quote in text,
// import-looking text in a string) run against that text. The real-tree cases run the CLI.
//
// Every case here is red on a base without the script. A missing script is named, not crashed on.
//
// P3 rows: each named line of the selector has a planted mutant. TESTS_FOR_MUTANT=<line> runs this
// file against that mutant: the named rows and that line's pin go red, and nothing else does.
//
// Run: node test/tests-for.test.mjs. Exits 1 on any failure.

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ok, eq, report } from "./harness.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "tests-for.mjs");
const SCRIPT_PRESENT = existsSync(SCRIPT);

// One planted mutant per named line: the line's anchor text, and the text that replaces it.
const MUTANTS = {
  43: ['if (last.t === "id") return REGEX_AFTER_WORD.has(last.v);', 'if (last.t === "id") return true;'],
  75: [String.raw`while (j < s.length && s[j] !== "\n") {`, "while (j < s.length) {"],
  81: ['else if (s[j] === "/" && !inClass) break;', 'else if (s[j] === "/" && inClass) break;'],
  132: ['else if (a.v === "from" && b?.t === "str") specs.push(b.v);', 'else if (a.v === "from" && b.t === "str") specs.push(b.v);'],
};
const REAL_TEXT = SCRIPT_PRESENT ? readFileSync(SCRIPT, "utf8") : "";
const MUT = process.env.TESTS_FOR_MUTANT;
const MUTANT = MUT !== undefined && Object.hasOwn(MUTANTS, MUT) ? MUT : null;
const LOADED_TEXT = MUTANT ? REAL_TEXT.replace(...MUTANTS[MUTANT]) : REAL_TEXT;
ok(MUT === undefined || MUTANT !== null, `P3 env: TESTS_FOR_MUTANT names line 43, 75, 81 or 132 (got ${JSON.stringify(MUT)})`);
// Each pin checks the text that loads, so a planted mutant reds the pin of its own line.
for (const [line, [from]] of Object.entries(MUTANTS)) {
  const onLine = LOADED_TEXT.split("\n")[Number(line) - 1] ?? "";
  ok(onLine.includes(from) && LOADED_TEXT.split(from).length === 2, `P3 pin line ${line}: the anchor sits on that line, once`);
}

// The load hook swaps the mutant's anchor for its replacement as the script loads. The hook is data: no file is written.
function mutantHook(name) {
  const [from, to] = MUTANTS[name];
  const src = [
    "export async function load(url, context, nextLoad) {",
    "  const out = await nextLoad(url, context);",
    `  if (!url.endsWith(${JSON.stringify("/scripts/tests-for.mjs")})) return out;`,
    `  return { ...out, source: String(out.source).replace(${JSON.stringify(from)}, ${JSON.stringify(to)}), shortCircuit: true };`,
    "}",
  ].join("\n");
  return `data:text/javascript;base64,${Buffer.from(src).toString("base64")}`;
}
if (MUTANT) register(mutantHook(MUTANT));

// Loaded only when the script exists. A missing file is one named red per case, never an import crash.
const mod = SCRIPT_PRESENT ? await import(pathToFileURL(SCRIPT).href) : null;
const SUITES_READY = typeof mod?.suitesFor === "function";

const T = "src/fixture-target.mjs";
const IMPORT_STATIC = `import { a } from "../src/fixture-target.mjs";\n`;
const IMPORT_DYN = `const m = await import("../src/fixture-target.mjs");\n`;
const SPAWN_NAME = `import { spawnSync } from "node:child_process";\nconst CHECK = "scripts/fixture-target.mjs";\nspawnSync(process.execPath, [CHECK]);\n`;

// Each row: [case name, target, [[suite path, source text], ...], expected suite paths].
const PURE = [
  // Scanner traps for tier 1: text that looks like an import but is not one, and real imports that a naive scan would hide.
  ["TR1 import-looking text in a string is not an import", T, [["test/t.test.mjs", `const doc = 'import { a } from "../src/fixture-target.mjs";';\n`]], []],
  ["TR2 a /* in a string does not hide a later import", T, [["test/t.test.mjs", `const open = "/*";\n${IMPORT_STATIC}`]], ["test/t.test.mjs"]],
  ["TR3 a // in a string does not hide an import on the same line", T, [["test/t.test.mjs", `const url = "http://x"; ${IMPORT_STATIC}`]], ["test/t.test.mjs"]],
  ["TR4 import-looking text in a multi-line template is not an import", T, [["test/t.test.mjs", "const doc = `\nimport { a } from \"../src/fixture-target.mjs\";\n`;\n"]], []],
  ["TR5 a multi-line template does not end the scan before a real import", T, [["test/t.test.mjs", "const doc = `\nline\n`;\n" + IMPORT_STATIC]], ["test/t.test.mjs"]],
  ["TR6 a lone apostrophe in a comment does not hide a later import", T, [["test/t.test.mjs", `// Don't\n${IMPORT_STATIC}`]], ["test/t.test.mjs"]],
  ["TR7 import-looking text in comments is not an import", T, [["test/t.test.mjs", `// import { a } from "../src/fixture-target.mjs";\n/* import { a } from "../src/fixture-target.mjs"; */\n`]], []],
  ["TR8 a dynamic import of the path is an import", T, [["test/t.test.mjs", IMPORT_DYN]], ["test/t.test.mjs"]],
  ["TR9 a file with the same name in another folder is not the path", T, [["test/t.test.mjs", `import { a } from "../other/fixture-target.mjs";\n`]], []],

  ["TR10 a lone apostrophe in a template literal does not hide a later import", T, [["test/t.test.mjs", "const markup = `<p>Don't</p>`;\n" + IMPORT_STATIC]], ["test/t.test.mjs"]],
  ["TR11 a lone apostrophe in a regex literal does not hide a later import", T, [["test/t.test.mjs", "const re = /don't/;\n" + IMPORT_STATIC]], ["test/t.test.mjs"]],

  // Tier 2 traps: a path named only in a comment, or without a spawn, read or exec call, is not a cover.
  ["T2a a path named only in a comment is not a cover", T, [["test/t.test.mjs", `import { spawnSync } from "node:child_process";\n// spawnSync(process.execPath, ["scripts/fixture-target.mjs"]);\n`]], []],
  ["T2b a path named in a string with spawnSync is a cover", T, [["test/t.test.mjs", SPAWN_NAME]], ["test/t.test.mjs"]],
  ["T2c a path named in a string with readFileSync is a cover", T, [["test/t.test.mjs", `import { readFileSync } from "node:fs";\nconst src = readFileSync("scripts/fixture-target.mjs", "utf8");\n`]], ["test/t.test.mjs"]],
  ["T2d a path named with no spawn, read or exec call is not a cover", T, [["test/t.test.mjs", `const name = "fixture-target.mjs";\nconsole.log(name);\n`]], []],
  ["T2e a path built with join() still counts", T, [["test/t.test.mjs", `import { spawn } from "node:child_process";\nconst SCRIPT = join(ROOT, "scripts", "fixture-target.mjs");\nspawn(process.execPath, [SCRIPT]);\n`]], ["test/t.test.mjs"]],
  ["T2f a lone apostrophe in a comment does not hide a cover", T, [["test/t.test.mjs", `// Don't\nimport { spawnSync } from "node:child_process";\nspawnSync(process.execPath, ["scripts/fixture-target.mjs"]);\n`]], ["test/t.test.mjs"]],
  ["T2g a /* in a string does not hide a cover", T, [["test/t.test.mjs", `const open = "/*";\nimport { spawnSync } from "node:child_process";\nspawnSync(process.execPath, ["scripts/fixture-target.mjs"]);\n`]], ["test/t.test.mjs"]],

  // Tier logic: which tier answers, the app rule, and the order of the answer.
  ["L1 a static import is listed", T, [["test/a.test.mjs", IMPORT_STATIC]], ["test/a.test.mjs"]],
  ["L3 app is dropped beside a narrower suite", T, [["test/app.test.mjs", IMPORT_STATIC], ["test/narrow.test.mjs", IMPORT_STATIC]], ["test/narrow.test.mjs"]],
  ["L4 app alone is listed when no other suite covers the path at any tier", T, [["test/app.test.mjs", IMPORT_STATIC]], ["test/app.test.mjs"]],
  ["L5 tier 2 is not used when tier 1 names a suite", T, [["test/a.test.mjs", IMPORT_STATIC], ["test/c.test.mjs", SPAWN_NAME]], ["test/a.test.mjs"]],
  ["L6 tier 2 suites are listed in path order", T, [["test/d.test.mjs", SPAWN_NAME], ["test/c.test.mjs", SPAWN_NAME]], ["test/c.test.mjs", "test/d.test.mjs"]],
  ["L7 tier 1 suites are listed in path order, not input order", T, [["test/z.test.mjs", IMPORT_STATIC], ["test/a.test.mjs", IMPORT_STATIC]], ["test/a.test.mjs", "test/z.test.mjs"]],
  ["L8a a non-suite file is not listed", T, [["test/helper.mjs", IMPORT_STATIC]], []],
  ["L8b a suite outside test/ is not listed", T, [["tests/x.test.mjs", IMPORT_STATIC]], []],
  ["L8c a suite in a nested folder is not listed", T, [["test/nested/x.test.mjs", IMPORT_STATIC]], []],
  ["L8d worker/core.test.mjs is a suite", T, [["worker/core.test.mjs", IMPORT_STATIC]], ["worker/core.test.mjs"]],
  ["L8e a non-suite file with a spawn and a name is not listed", T, [["test/helper.mjs", SPAWN_NAME]], []],
  ["L9 app alone in tier 1 is dropped when a tier 2 suite covers the path", T, [["test/app.test.mjs", IMPORT_STATIC], ["test/c.test.mjs", SPAWN_NAME]], ["test/c.test.mjs"]],
  ["L10 an empty file set gives no suite", T, [], []],
  [
    "L11 full size: four importers, app dropped, the rest in path order",
    T,
    [
      ["test/app.test.mjs", IMPORT_STATIC],
      ["test/b.test.mjs", IMPORT_DYN],
      ["worker/core.test.mjs", IMPORT_STATIC],
      ["test/a.test.mjs", IMPORT_STATIC],
    ],
    ["test/a.test.mjs", "test/b.test.mjs", "worker/core.test.mjs"],
  ],
  // P3: the row named for a line goes red under that line's planted mutant, and no other row does.
  ["P3 line 43: a division after a name is not a regex", T, [["test/t.test.mjs", "const r = n / d; " + IMPORT_STATIC]], ["test/t.test.mjs"]],
  ["P3 line 75: a regex that runs to its line end leaves the next import", T, [["test/t.test.mjs", "const n = i++ / 2;\n" + IMPORT_STATIC]], ["test/t.test.mjs"]],
  ["P3 line 81: a slash inside a class does not end a regex", T, [["test/t.test.mjs", "const re = /[/']/; " + IMPORT_STATIC]], ["test/t.test.mjs"]],
  ["P3 line 81: the slash after a regex body ends it", T, [["test/t.test.mjs", "const re = /a/; " + IMPORT_STATIC]], ["test/t.test.mjs"]],
  ["P3 line 132: a file that ends on a bare from name does not throw", T, [["test/t.test.mjs", "const from = 1;\nconst x = from"]], []],

  // Measured bug (scripts/tests-for.mjs lines 84-85): after an unclosed regex stops at its line end, the next line's first word is skipped as regex flags.
  ["L12 a misread regex does not eat the next line's import keyword", "test/x.mjs", [["test/t.test.mjs", 'const n = a++ / 2;\nimport "./x.mjs";\n']], ["test/t.test.mjs"]],
];

for (const [name, target, rows, want] of PURE) {
  if (!SCRIPT_PRESENT) {
    ok(false, `${name}: scripts/tests-for.mjs is missing`);
    continue;
  }
  if (!SUITES_READY) {
    ok(false, `${name}: scripts/tests-for.mjs does not export suitesFor`);
    continue;
  }
  const files = rows.map(([path, text]) => ({ path, text }));
  let got;
  try {
    got = mod.suitesFor(target, files);
  } catch (e) {
    ok(false, `${name}: suitesFor threw ${e.message}`);
    continue;
  }
  eq(got, want, name);
}

// Real-tree cases: the CLI reads the repository. The targets and expected lists live in
// test/tests-for-real.json, not in this file. A target named here would make this suite a tier-2
// cover for that target (it calls spawnSync). Each expected list is the suites that import or spawn
// that path today, with app dropped where a narrower suite exists.
const REAL = JSON.parse(readFileSync(join(ROOT, "test", "tests-for-real.json"), "utf8"));

for (const { target, suites: want, why } of REAL) {
  if (!SCRIPT_PRESENT) {
    ok(false, `REAL ${target} (${why}): scripts/tests-for.mjs is missing`);
    continue;
  }
  const r = spawnSync(process.execPath, [SCRIPT, target], { cwd: ROOT, encoding: "utf8", timeout: 120000 });
  ok(r.status === 0, `REAL exit ${target}: the CLI exits 0 (${why})`);
  eq(r.stdout.split("\n").filter(Boolean), want, `REAL ${target}: prints ${want.length ? want.join(", ") : "nothing"}`);
}

report();
