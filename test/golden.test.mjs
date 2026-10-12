/* Contract tests for `npm run check:golden`, the guard on shared/fixtures/golden.
   Run: npm run test:golden. Exits 1 on any failure.

   The golden files are what scripts/gen-golden.mjs writes from src/view-rules.mjs,
   run on shared/fixtures with a fixed clock. The check regenerates them into a
   temp dir and fails if any golden file differs.

   Every case runs in a copy of the parts the check reads (package.json, src/,
   shared/, scripts/, with node_modules linked), so this file never writes into
   the checkout. A hand edit is a one-digit change made in that copy.

   Ids are G<group>.<case>:
     G1  the real golden set
         G1.1 golden/ holds at least one file
         G1.2 an untouched set passes, and its bytes do not change in the run
         G1.3 one hand-edited digit fails, and the output names that file
     G2  a generator that writes nothing (scripts/gen-golden.mjs empty, exit 0)
         G2.1 must fail the check, and the output names a golden file

   A missing script or a missing generator fails each case on an assertion, so
   no case passes by accident because the check did not run at all. */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GOLDEN_REL = path.join("shared", "fixtures", "golden");
const GOLDEN = path.join(ROOT, GOLDEN_REL);
const EMPTY_GENERATOR = "// empty stub: writes nothing and exits 0\n";

let pass = 0;
const fails = [];
function ok(cond, id, detail = "") {
  if (cond) pass++;
  else fails.push(`${id}${detail ? `\n     ${detail}` : ""}`);
}

const goldenNames = () =>
  existsSync(GOLDEN)
    ? readdirSync(GOLDEN).filter((f) => f.endsWith(".json")).sort()
    : [];

/* the golden bytes as they stand in a sandbox; {} when the folder is missing */
function snap(dir) {
  const d = path.join(dir, GOLDEN_REL);
  if (!existsSync(d)) return {};
  return Object.fromEntries(
    readdirSync(d)
      .sort()
      .map((f) => [f, readFileSync(path.join(d, f), "utf8")])
  );
}

/* a copy of what the check reads. An optional generator source replaces
   scripts/gen-golden.mjs in the copy. */
function sandbox(generatorSource) {
  const dir = mkdtempSync(path.join(tmpdir(), "golden-"));
  for (const p of ["package.json", "src", "shared", "scripts"]) {
    const from = path.join(ROOT, p);
    if (existsSync(from)) cpSync(from, path.join(dir, p), { recursive: true });
  }
  if (existsSync(path.join(ROOT, "node_modules")))
    symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");
  if (generatorSource !== undefined)
    writeFileSync(path.join(dir, "scripts", "gen-golden.mjs"), generatorSource);
  return dir;
}

function runCheck(dir) {
  const r = spawnSync("npm", ["run", "--silent", "check:golden"], {
    cwd: dir,
    encoding: "utf8",
  });
  return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/* change one digit in one golden file, in the sandbox only */
function handEdit(dir, name) {
  const file = path.join(dir, GOLDEN_REL, name);
  const text = readFileSync(file, "utf8");
  const edited = text.replace(/\d/, (d) => String((Number(d) + 1) % 10));
  if (edited === text) return false;
  writeFileSync(file, edited);
  return true;
}

const failed = (r) => r.status !== null && r.status !== 0;
const tail = (s) => s.slice(-400);

/* ---------- G1: the real golden set ---------- */

const names = goldenNames();
ok(names.length > 0, "G1.1 shared/fixtures/golden holds at least one golden file", `found none under ${GOLDEN_REL}`);

{
  const dir = sandbox(undefined);
  try {
    const before = snap(dir);
    const r = runCheck(dir);
    const after = snap(dir);
    ok(
      r.status === 0 &&
        Object.keys(before).length > 0 &&
        JSON.stringify(before) === JSON.stringify(after),
      "G1.2 an untouched golden set passes, and the run leaves its bytes unchanged",
      `exit ${r.status}; golden files ${Object.keys(before).length}; bytes unchanged ${JSON.stringify(before) === JSON.stringify(after)}\n     ${tail(r.out)}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = sandbox(undefined);
  try {
    const target = names[0];
    const edited = target ? handEdit(dir, target) : false;
    const r = edited ? runCheck(dir) : { status: null, out: "" };
    ok(
      edited && failed(r) && r.out.includes(target),
      "G1.3 one hand-edited digit fails the check, and the output names that file",
      `target ${target ?? "(none)"}; exit ${r.status}\n     ${tail(r.out)}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ---------- G2: a generator that writes nothing ---------- */

{
  const dir = sandbox(EMPTY_GENERATOR);
  try {
    const target = names[0];
    const r = runCheck(dir);
    ok(
      failed(r) && Boolean(target) && r.out.includes(target),
      "G2.1 an empty generator that exits 0 must fail the check, and the output names a golden file",
      `target ${target ?? "(none)"}; exit ${r.status}\n     ${tail(r.out)}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ---------- report ---------- */

console.log(`\n${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (fails.length) process.exit(1);
console.log("all green");
