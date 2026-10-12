/* Runs the generator into a temp dir and fails if the result differs from
   shared/fixtures/golden in any file, in either direction. A generator that
   writes nothing leaves every golden file missing, so it fails too. */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const golden = path.join(here, "..", "shared", "fixtures", "golden");
const tmp = mkdtempSync(path.join(tmpdir(), "gen-golden-"));
const list = (d) => {
  try {
    return readdirSync(d).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
};
const read = (d, f) => {
  try {
    return readFileSync(path.join(d, f), "utf8");
  } catch {
    return null;
  }
};
try {
  const r = spawnSync(process.execPath, [path.join(here, "gen-golden.mjs"), tmp], { stdio: "inherit" });
  const bad = r.status === 0 ? [] : ["(generator exit " + r.status + ")"];
  for (const f of new Set([...list(golden), ...list(tmp)]))
    if (read(golden, f) !== read(tmp, f)) bad.push(f);
  if (bad.length) {
    console.error(`golden files differ: ${bad.join(", ")}\nrun: node scripts/gen-golden.mjs`);
    process.exit(1);
  }
  console.log(`golden ok (${list(golden).length} files)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
