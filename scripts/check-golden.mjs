/* Runs the generator into a temp dir and fails if the result differs from
   shared/fixtures/golden in any file, in either direction. A generator that
   writes nothing leaves every golden file missing, so it fails too. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const golden = path.join(here, "..", "shared", "fixtures", "golden");
const tmp = mkdtempSync(path.join(tmpdir(), "gen-golden-"));
const list = (d) => readdirSync(d).filter((f) => f.endsWith(".json"));
const read = (d, f) => (existsSync(path.join(d, f)) ? readFileSync(path.join(d, f), "utf8") : null);
const bad = [];
try {
  const r = spawnSync(process.execPath, [path.join(here, "gen-golden.mjs"), tmp], { stdio: "inherit" });
  if (r.status !== 0) bad.push("generator exit " + r.status);
  const g = existsSync(golden) ? list(golden) : [];
  const t = list(tmp);
  if (!g.length) bad.push("no golden files in " + golden);
  if (!t.length) bad.push("generator wrote no files");
  for (const f of new Set([...g, ...t])) if (read(golden, f) !== read(tmp, f)) bad.push(f);
  if (!bad.length) console.log(`golden ok (${g.length} files)`);
} catch (e) {
  bad.push(String(e.message || e));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (bad.length) {
  console.error(`golden check failed: ${bad.join("; ")}\nrun: node scripts/gen-golden.mjs`);
  process.exitCode = 1;
}
