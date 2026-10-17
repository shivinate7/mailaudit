// Contract test for window.sync.photoGet, the list-first fallback in src/entry.jsx.
// Run: npm test (it runs this after the app suite), or node test/photoget.test.mjs.
// Exits 1 on any failure.
//
// entry.jsx mounts React on import, so test/harness.mjs never loads it and mocks
// photoGet instead. This test bundles the real file with esbuild, swaps only
// ./app.jsx for an empty component, evaluates the bundle in jsdom, and answers
// fetch from a scripted Worker.
//
// The cases run against the real photoGet:
//   a  the id is on the last list: no relist, and the photo is read by the listed
//      name, so a .png keeps its type
//   b  the id is not on the last list and the relist finds it: the name it found
//      is read
//   c  the relist lacks the id: 404 "empty", and no photo is read
//   d  the relist fails: its code comes back, and no photo is read
//
// Mutants are text swaps in the bundled copy of entry.jsx. src/ is never written.
// A swap that finds no single match throws, so a stale mutant cannot pass quietly.
// Each mutant must turn the case it names red. The output prints each case's
// colour under each mutant, and the first reason for the named case.

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = join(REPO, "src", "entry.jsx");
const PAGE = '<!doctype html><html><body><div id="root"></div></body></html>';
const KEY = "photoget-test-key"; /* matches KEY_RE in src/sync-rules.mjs */

/* ---------- the scripted Worker ---------- */

const reply = (status, body, bytes) => ({
  status,
  json: async () => body,
  arrayBuffer: async () => (bytes ?? new Uint8Array()).slice().buffer,
});

/* w.lists: replies to GET /photos, in order. w.photos: name -> bytes for
   GET /photos/<name>. An unscripted list is a 500, so an extra relist shows up. */
function fakeWorker() {
  const w = { calls: [], lists: [], photos: {} };
  w.fetch = async (url, init = {}) => {
    const { pathname } = new URL(url);
    const method = init.method || "GET";
    w.calls.push({ method, path: pathname });
    if (method === "GET" && pathname === "/photos") {
      return w.lists.shift() ?? reply(500, { error: "unscripted list" });
    }
    if (method === "GET" && pathname.startsWith("/photos/")) {
      const name = decodeURIComponent(pathname.slice("/photos/".length));
      return Object.hasOwn(w.photos, name)
        ? reply(200, undefined, w.photos[name])
        : reply(404, { error: "not found" });
    }
    return reply(500, { error: "unscripted route" });
  };
  return w;
}

const listCalls = (w) => w.calls.filter((c) => c.path === "/photos").length;
const photoReads = (w) => w.calls.filter((c) => c.path.startsWith("/photos/")).map((c) => c.path);
const same = (got, want) => JSON.stringify(got) === JSON.stringify(want);
const check = (ok, why) => (ok ? null : why);

/* ---------- the cases: each returns the failed checks, empty when green ---------- */

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

const CASES = [
  {
    id: "a",
    async run(win, w) {
      w.lists.push(reply(200, { ids: ["pho-a1.png"] }));
      w.photos["pho-a1.png"] = PNG;
      await win.sync.photoList();
      const r = await win.sync.photoGet("pho-a1");
      return [
        check(listCalls(w) === 1, `a: ${listCalls(w)} list calls, want 1 (no relist)`),
        check(same(photoReads(w), ["/photos/pho-a1.png"]), `a: photo reads ${JSON.stringify(photoReads(w))}`),
        check(r.code === "ok", `a: code ${r.code}, want ok`),
        check(r.body?.blob?.type === "image/png", `a: blob type ${r.body?.blob?.type}, want image/png`),
      ];
    },
  },
  {
    id: "b",
    async run(win, w) {
      w.lists.push(reply(200, { ids: ["pho-b9.png"] }), reply(200, { ids: ["pho-b2.jpg", "pho-b9.png"] }));
      w.photos["pho-b2.jpg"] = JPG;
      await win.sync.photoList();
      const r = await win.sync.photoGet("pho-b2");
      return [
        check(listCalls(w) === 2, `b: ${listCalls(w)} list calls, want 2 (one relist)`),
        check(same(photoReads(w), ["/photos/pho-b2.jpg"]), `b: photo reads ${JSON.stringify(photoReads(w))}`),
        check(r.code === "ok", `b: code ${r.code}, want ok`),
        check(r.body?.blob?.type === "image/jpeg", `b: blob type ${r.body?.blob?.type}, want image/jpeg`),
      ];
    },
  },
  {
    id: "c",
    async run(win, w) {
      w.lists.push(reply(200, { ids: ["pho-c1.png"] }), reply(200, { ids: ["pho-c1.png"] }));
      await win.sync.photoList();
      const r = await win.sync.photoGet("pho-c3");
      return [
        check(listCalls(w) === 2, `c: ${listCalls(w)} list calls, want 2 (one relist)`),
        check(photoReads(w).length === 0, `c: photo reads ${JSON.stringify(photoReads(w))}, want none`),
        check(r.status === 404 && r.code === "empty", `c: status ${r.status}, code ${r.code}, want 404 empty`),
      ];
    },
  },
  {
    id: "d",
    async run(win, w) {
      w.lists.push(reply(500, { error: "down" }));
      const r = await win.sync.photoGet("pho-d4");
      return [
        check(listCalls(w) === 1, `d: ${listCalls(w)} list calls, want 1`),
        check(photoReads(w).length === 0, `d: photo reads ${JSON.stringify(photoReads(w))}, want none`),
        check(r.status === 500 && r.code === "unknown", `d: status ${r.status}, code ${r.code}, want 500 unknown`),
      ];
    },
  },
];

/* ---------- the bundle: the real entry.jsx, with only its app import stubbed ---------- */

const APP_STUB = "export default function App() { return null; }";

/* A mutant is one exact text swap. It must match exactly once, or it throws. */
const MUTANTS = [
  { name: "always-relist", killedBy: "a", from: "if (!heldNames.has(id)) {", to: "if (true) {" },
  {
    name: "no-relist",
    killedBy: "b",
    from: 'const l = await window.sync.photoList();\n      if (l.code !== "ok") return l;',
    to: "",
  },
  {
    name: "guess-name",
    killedBy: "c",
    from: 'if (!name) return { status: 404, body: { error: "not found" }, code: "empty" };',
    to: 'if (!name) return { ...(await photoCall("GET", `${id}.jpg`)), code: "empty" };',
  },
  { name: "swallow-relist-failure", killedBy: "d", from: 'if (l.code !== "ok") return l;', to: "" },
];

function swap(src, m) {
  const hits = src.split(m.from).length - 1;
  if (hits !== 1) throw new Error(`mutant ${m.name}: ${hits} matches in entry.jsx, want 1`);
  return src.split(m.from).join(m.to);
}

async function bundle(mutant) {
  const out = await build({
    entryPoints: [ENTRY],
    bundle: true,
    format: "iife",
    write: false,
    loader: { ".jsx": "jsx" },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
    plugins: [
      {
        name: "photoget-under-test",
        setup(b) {
          b.onResolve({ filter: /^\.\/app\.jsx$/ }, () => ({ path: "app", namespace: "stub" }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: APP_STUB, loader: "jsx" }));
          b.onLoad({ filter: /entry\.jsx$/ }, async ({ path }) => {
            let src = await readFile(path, "utf8");
            if (mutant) src = swap(src, mutant);
            return { contents: src, loader: "jsx", resolveDir: dirname(path) };
          });
        },
      },
    ],
  });
  return out.outputFiles[0].text;
}

/* ---------- run ---------- */

/* A fresh jsdom window per case: photoGet keeps its id -> name map in the bundle. */
async function runCase(code, c) {
  const w = fakeWorker();
  const win = new JSDOM(PAGE, { url: "https://mailday.test/", runScripts: "outside-only" }).window;
  try {
    win.fetch = w.fetch;
    win.eval(code);
    await win.sync.setKey(KEY);
    return (await c.run(win, w)).filter((x) => x !== null);
  } catch (e) {
    return [`threw: ${e.message}`];
  } finally {
    win.close();
  }
}

async function runAll(code) {
  const got = {};
  for (const c of CASES) got[c.id] = await runCase(code, c);
  return got;
}

const colours = (got) => CASES.map((c) => `${c.id} ${got[c.id].length ? "red" : "green"}`).join(", ");

let problems = 0;
const bad = (msg) => {
  problems++;
  console.log(`  ✗ ${msg}`);
};

const real = await runAll(await bundle(null));
for (const c of CASES) for (const why of real[c.id]) bad(`real photoGet, case ${why}`);
console.log(`photoget: real photoGet: ${colours(real)}`);

for (const m of MUTANTS) {
  const got = await runAll(await bundle(m));
  console.log(`photoget: mutant ${m.name}: ${colours(got)}; killed by ${m.killedBy}`);
  const reason = got[m.killedBy][0];
  if (!reason) bad(`mutant ${m.name} survived case ${m.killedBy}`);
  else console.log(`    ${reason}`);
}

if (problems) {
  console.log(`photoget: ${problems} problem(s)`);
  process.exitCode = 1;
} else {
  console.log("photoget: all green");
}
