// One-time copy of the envelope photos on the GitHub photo branch into the Worker.
// Usage: GITHUB_TOKEN=... WORKER_KEY=... node scripts/copy-photos-to-worker.mjs [--apply]
// Dry run by default: it reads both sides and prints what it would copy. --apply writes.
// Safe to run again: a photo the Worker already holds is skipped, and the Worker keeps
// the first bytes of a name anyway. The token and the key are read from the environment
// and never printed. WORKER_URL overrides the Worker address (src/entry.jsx SYNC_URL).
import { photoIdFromName, mimeFromName } from "../src/photo-rules.mjs";
import { KEY_RE } from "../src/sync-rules.mjs";
import { MAX_PHOTO_BYTES } from "../worker/core.mjs";

const SOURCE = { owner: "shivinate7", repo: "mailaudit-data", branch: "main", dir: "photos" }; // PHOTOS in src/entry.jsx
const WORKER = (process.env.WORKER_URL || "https://manifestnumberone.shivamsemwal01.workers.dev").replace(/\/$/, "");
const apply = process.argv.includes("--apply");
const token = process.env.GITHUB_TOKEN || "";
const key = process.env.WORKER_KEY || "";

if (process.argv.slice(2).some((a) => a !== "--apply")) fail("Usage: copy-photos-to-worker.mjs [--apply]");
if (!/^(github_pat_|ghp_)/.test(token)) fail("Set GITHUB_TOKEN to a GitHub token that can read the photo repo.");
if (!KEY_RE.test(key)) fail("Set WORKER_KEY to this device's Worker key.");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

/* Only a status line is ever reported, never a header or a body. */
const gh = (path, accept) =>
  fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: accept || "application/vnd.github+json", "User-Agent": "mailaudit-copy-photos" },
  });
const worker = (path, init = {}) =>
  fetch(`${WORKER}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, ...init.headers } });

const listed = await gh(`/repos/${SOURCE.owner}/${SOURCE.repo}/git/trees/${SOURCE.branch}:${SOURCE.dir}`);
if (!listed.ok) fail(`GitHub listing failed: HTTP ${listed.status}.`);
const tree = await listed.json();
if (tree.truncated) fail("GitHub truncated the listing; nothing was copied.");
const source = (tree.tree || []).filter((e) => e.type === "blob" && photoIdFromName(e.path));

const held = await worker("/photos");
if (!held.ok) fail(`Worker listing failed: HTTP ${held.status}.`);
const there = new Set((await held.json()).ids || []);

let copied = 0;
let skipped = 0;
let failed = 0;
for (const { path: name, size } of source) {
  if (there.has(name)) {
    skipped++;
    continue;
  }
  if (size > MAX_PHOTO_BYTES) {
    console.log(`too large for the Worker (${size} bytes): ${name}`);
    failed++;
    continue;
  }
  if (!apply) {
    console.log(`would copy ${name} (${size} bytes)`);
    copied++;
    continue;
  }
  const got = await gh(`/repos/${SOURCE.owner}/${SOURCE.repo}/contents/${SOURCE.dir}/${name}?ref=${SOURCE.branch}`, "application/vnd.github.raw");
  if (!got.ok) {
    console.log(`GitHub read failed (HTTP ${got.status}): ${name}`);
    failed++;
    continue;
  }
  const bytes = new Uint8Array(await got.arrayBuffer());
  const put = await worker(`/photos/${name}`, { method: "POST", headers: { "Content-Type": mimeFromName(name) }, body: bytes });
  if (!put.ok) {
    console.log(`Worker write failed (HTTP ${put.status}): ${name}`);
    failed++;
    continue;
  }
  console.log(`copied ${name}`);
  copied++;
}
console.log(`${apply ? "Copied" : "Would copy"} ${copied}, already on the Worker ${skipped}, failed ${failed}, on GitHub ${source.length}.`);
if (!apply && copied) console.log("Dry run. Run again with --apply to write.");
process.exit(failed ? 1 : 0);
