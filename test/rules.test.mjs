/* Contract tests for `npm run check:rules`, the guard on the committed rules
   bundle native/ManifestKit/Resources/rules.js (rules-run-in-javascriptcore).
   Run: npm run test:rules. Exits 1 on any failure.

   The check rebuilds the bundle from src/ into a temp dir and fails if the
   committed bytes differ. Every case runs in a sandbox copy of the parts the
   check reads (package.json, build.mjs, src/, shared/, scripts/, the bundle
   folder, with node_modules linked). The sandbox is not a git repo and has no
   ledger remote, so the check must not need either. This file never writes
   into the checkout.

   Ids are R<group>.<case>:
     R1  the committed bundle
         R1.1 the committed bundle exists in the sandbox
         R1.2 an untouched copy passes, and the bundle bytes do not change in the run
     R2  a stale bundle
         R2.1 an edited src/view-rules.mjs with no rebuild fails, and the output names rules.js
         R2.2 a hand-edited bundle fails, and the output names rules.js
         R2.3 a missing bundle fails, and the output names rules.js

   A missing script fails every case on an assertion, so no case passes by
   accident because the check did not run at all. A stale case also asserts
   that its edit changed something, so the case cannot pass on a no-op edit. */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE_REL = path.join("native", "ManifestKit", "Resources", "rules.js");
const SRC_REL = path.join("src", "view-rules.mjs");
// a visible code change: the regex literal survives esbuild, so the bundle bytes move
const STALE_FROM = "/^without tracking$/i";
const STALE_TO = "/^without trackingX$/i";

let pass = 0;
const fails = [];
function ok(cond, id, detail = "") {
  if (cond) pass++;
  else fails.push(`${id}${detail ? `\n     ${detail}` : ""}`);
}

/* a copy of what the check reads. Returns the sandbox dir. */
function sandbox({ withBundle = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "rules-"));
  for (const p of ["package.json", "build.mjs", "src", "shared", "scripts"]) {
    const from = path.join(ROOT, p);
    if (existsSync(from)) cpSync(from, path.join(dir, p), { recursive: true });
  }
  if (withBundle) {
    const from = path.join(ROOT, BUNDLE_REL);
    mkdirSync(path.dirname(path.join(dir, BUNDLE_REL)), { recursive: true });
    if (existsSync(from)) cpSync(from, path.join(dir, BUNDLE_REL));
  }
  if (existsSync(path.join(ROOT, "node_modules")))
    symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");
  return dir;
}

function runCheck(dir) {
  const r = spawnSync("npm", ["run", "check:rules"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GIT_DIR: path.join(dir, "no-such-git-dir") },
  });
  return { status: r.status, out: `${r.stdout || ""}${r.stderr || ""}` };
}

const bundleBytes = (dir) => {
  const f = path.join(dir, BUNDLE_REL);
  return existsSync(f) ? readFileSync(f, "utf8") : null;
};

/* replace one literal in a sandbox file; returns false when the literal is absent */
function replaceIn(dir, rel, from, to) {
  const f = path.join(dir, rel);
  if (!existsSync(f)) return false;
  const before = readFileSync(f, "utf8");
  if (!before.includes(from)) return false;
  writeFileSync(f, before.replace(from, to));
  return true;
}

const failed = (r) => r.status !== 0 && r.status !== null;
const tail = (s) => s.trim().split("\n").slice(-4).join("\n     ");

/* ---------- R1: the committed bundle ---------- */

{
  const dir = sandbox();
  try {
    ok(
      existsSync(path.join(dir, BUNDLE_REL)),
      "R1.1 the committed bundle native/ManifestKit/Resources/rules.js must exist",
      `looked in ${path.join(ROOT, BUNDLE_REL)}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = sandbox();
  try {
    const before = bundleBytes(dir);
    const r = runCheck(dir);
    const after = bundleBytes(dir);
    ok(
      r.status === 0,
      "R1.2 an untouched copy must pass check:rules",
      `exit ${r.status}\n     ${tail(r.out)}`
    );
    ok(
      before !== null && before === after,
      "R1.2 the check must not change the bundle bytes in the run"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ---------- R2: a stale bundle ---------- */

{
  const dir = sandbox();
  try {
    const changed = replaceIn(dir, SRC_REL, STALE_FROM, STALE_TO);
    ok(changed, "R2.1 the probe literal must exist in src/view-rules.mjs", STALE_FROM);
    const r = runCheck(dir);
    ok(
      failed(r) && /rules\.js/.test(r.out),
      "R2.1 an edited src/view-rules.mjs with no rebuild must fail, and the output must name rules.js",
      `exit ${r.status}\n     ${tail(r.out)}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = sandbox();
  try {
    const changed = replaceIn(dir, BUNDLE_REL, STALE_FROM.slice(1, -2), STALE_TO.slice(1, -2));
    ok(changed, "R2.2 the probe literal must exist in the committed bundle", STALE_FROM);
    const r = runCheck(dir);
    ok(
      failed(r) && /rules\.js/.test(r.out),
      "R2.2 a hand-edited bundle must fail, and the output must name rules.js",
      `exit ${r.status}\n     ${tail(r.out)}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = sandbox({ withBundle: false });
  try {
    const r = runCheck(dir);
    ok(
      failed(r) && /rules\.js/.test(r.out),
      "R2.3 a missing bundle must fail, and the output must name rules.js",
      `exit ${r.status}\n     ${tail(r.out)}`
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
