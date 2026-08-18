/* Test harness: bundle app.jsx, boot it in jsdom against mocked storage, and
   drive it with real DOM events. No test framework — `node --run test` runs
   test/app.test.mjs top to bottom and it either prints "all green" or exits 1.

   The app is deliberately hard to unit-test (one file, no exports but the
   component) and that's fine: every behaviour worth protecting here is a
   behaviour you can see, so the assertions read the DOM the way a user would. */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
/* the REAL codec, not a mock of it — see the note on the remote mock below */
import { utf8ToBase64, base64ToUtf8, blobToBase64 } from "../src/b64.mjs";
import { photoName, mimeFromName } from "../src/photo-rules.mjs";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

/* The bundle MUST land under the project: its own require("react") resolves
   relative to its location, and a second React copy makes every hook throw. */
const OUT = path.join(ROOT, "node_modules", ".mailday-test", "app.bundle.cjs");
const require = createRequire(path.join(ROOT, "package.json"));
const { JSDOM } = require("jsdom");
const esbuild = require("esbuild");

await esbuild.build({
  entryPoints: [path.join(ROOT, "src/app.jsx")],
  bundle: true,
  outfile: OUT,
  platform: "node",
  format: "cjs",
  external: ["react", "react-dom", "papaparse"],
  logLevel: "warning",
});

/* ---------- jsdom globals ---------- */

/* The Backup button downloads via an anchor click, which jsdom reports as an
   unimplemented navigation. It's expected here, so drop just that one. */
const virtualConsole = new (require("jsdom").VirtualConsole)();
virtualConsole.on("jsdomError", (e) => {
  if (!/Not implemented: navigation/.test(e.message)) console.error(e.message);
});
virtualConsole.on("error", (m) => console.error(m));

const dom = new JSDOM(
  `<!doctype html><html><body><div id="root"></div></body></html>`,
  { url: "http://localhost/", pretendToBeVisual: true, virtualConsole }
);
export const win = dom.window;
global.window = win;
global.document = win.document;
/* `navigator` is a getter-only property on Node's global — plain assignment
   throws, so it has to be defined */
Object.defineProperty(global, "navigator", {
  value: win.navigator,
  configurable: true,
});
for (const k of [
  "HTMLElement",
  "HTMLInputElement",
  "Node",
  "Event",
  "MouseEvent",
  "Blob",
  "URL",
  "FileReader",
  "File",
  "getComputedStyle",
])
  global[k] = win[k];
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom has no IntersectionObserver and no layout, so the masthead's collapse
   can't be driven by real scrolling here. Stub the API and keep a handle on the
   live instances instead: a test can then hand the callback an entry and assert
   the running head reacts. This verifies the wiring — observe on mount, correct
   stuck/unstuck condition — which is the part that can silently never fire.
   Whether the browser's scroller *produces* those entries is the browser's job,
   not ours. */
export const observers = [];
class FakeIntersectionObserver {
  constructor(cb) {
    this.cb = cb;
    this.targets = [];
    observers.push(this);
  }
  observe(el) {
    this.targets.push(el);
  }
  disconnect() {
    this.targets = [];
    const i = observers.indexOf(this);
    if (i > -1) observers.splice(i, 1);
  }
  unobserve(el) {
    this.targets = this.targets.filter((t) => t !== el);
  }
  /* top < 0 means the sentinel has scrolled off the top of the viewport */
  fire(isIntersecting, top) {
    this.cb([{ isIntersecting, boundingClientRect: { top } }], this);
  }
}
global.IntersectionObserver = FakeIntersectionObserver;
win.IntersectionObserver = FakeIntersectionObserver;

/* ---------- storage mocks ---------- */

/* The ledger. Same contract as the localStorage adapter in src/entry.jsx. */
let store = {};
win.storage = {
  async get(k) {
    if (!(k in store)) throw new Error("not found");
    return { key: k, value: store[k] };
  },
  async set(k, v) {
    store[k] = v;
    return { key: k, value: v };
  },
  async delete(k) {
    delete store[k];
    return { key: k, deleted: true };
  },
  async list() {
    return { keys: Object.keys(store) };
  },
};

/* jsdom has no IndexedDB, and polyfilling it would test the polyfill. The app
   only ever sees window.photos, so mock that surface — a Map of Blobs matches
   the IndexedDB adapter's contract exactly. */
export let photoStore = new Map();
win.photos = {
  async put(id, blob) {
    photoStore.set(id, blob);
    return id;
  },
  async get(id) {
    return photoStore.get(id) ?? null;
  },
  async delete(id) {
    photoStore.delete(id);
  },
  async keys() {
    return [...photoStore.keys()];
  },
  async clear() {
    photoStore.clear();
  },
  async sweep(keep) {
    const dead = [...photoStore.keys()].filter((k) => !keep.has(k));
    dead.forEach((k) => photoStore.delete(k));
    return dead.length;
  },
  async usage() {
    return { used: photoStore.size * 100000, quota: 2e9 };
  },
};

/* The GitHub backup. Same contract as the Contents API adapter in
   src/entry.jsx — including that a push without a key never reaches the
   network, so `calls` counts only attempts that would have hit GitHub.

   Note this stores its payload as base64 through the REAL utf8ToBase64 /
   base64ToUtf8. That's deliberate: the codec is the one part of this feature
   that fails by producing plausible corrupted data rather than an error, and
   entry.jsx (where it's wired up) is unreachable from here because it mounts
   on import. Routing the mock through it means an app-level push→pull test
   exercises the actual encoder.

   `sha` vs `deviceSha` is the point of the whole feature, so the mock enforces
   it for real rather than faking a conflict: `sha` is what the remote holds,
   `deviceSha` is what this device last saw, and a push carrying a stale one is
   rejected exactly as GitHub would. A seeded remote that this device has never
   pulled is the second-device case. */
export let remote = {
  content: null, // base64, as GitHub hands it back
  sha: null, // what the remote holds
  deviceSha: null, // what this device last saw — a push sends THIS
  key: null,
  calls: [],
  fail: null, // an error `.code` to throw from the next push/pull
  photoFail: null, // ditto, but for the photo methods only
  pushedAt: null,
  pulledAt: null,
};
/* fixed so a snapshot never depends on the clock */
const REMOTE_NOW = Date.parse("2026-08-12T14:03:00Z");

/* The remote photo store: filename -> base64, exactly as GitHub holds it.
   Encoded through the REAL blobToBase64 for the same reason the ledger goes
   through the real utf8ToBase64 — a codec regression has to be able to fail an
   app-level test, and every blob the fixture makes is otherwise small and
   boring enough that a broken encoder would sail through. */
export let remotePhotos = new Map();
/* what listPhotos can see. `null` = readable; a code = we cannot tell what is
   there, which is what a private repo answers a keyless device. */
export let photosUnknown = null;

export function setPhotosUnknown(reason) {
  photosUnknown = reason;
}
export function remotePhotoIds() {
  return [...remotePhotos.keys()].map((n) => n.replace(/\.[^.]+$/, ""));
}

/* test-only inverse of blobToBase64; the app never decodes photo base64,
   because a real pull reads raw bytes off the wire */
function b64ToBlob(b64, type) {
  const bin = Buffer.from(b64, "base64");
  return new win.Blob([new Uint8Array(bin)], { type });
}

const remoteApi = {
  async target() {
    return {
      owner: "shivinate7",
      repo: "mailaudit",
      branch: "data",
      path: "ledger.json",
    };
  },
  async status() {
    return {
      hasKey: !!remote.key,
      sha: remote.sha,
      pushedAt: remote.pushedAt,
      pulledAt: remote.pulledAt,
    };
  },
  async setKey(t) {
    const v = String(t || "").trim();
    if (!/^(github_pat_|ghp_)/.test(v))
      throw Object.assign(new Error("bad-key"), { code: "bad-key" });
    remote.key = v;
  },
  async clearKey() {
    remote.key = null;
  },
  async pull() {
    if (remote.fail)
      throw Object.assign(new Error(remote.fail), { code: remote.fail });
    remote.calls.push({ op: "pull", key: remote.key });
    if (remote.content == null)
      throw Object.assign(new Error("missing"), { code: "missing" });
    remote.deviceSha = remote.sha; // a pull is how a device catches up
    remote.pulledAt = REMOTE_NOW;
    return { text: base64ToUtf8(remote.content), sha: remote.sha };
  },
  async push(text, message) {
    if (!remote.key)
      throw Object.assign(new Error("no-key"), { code: "no-key" });
    remote.calls.push({ op: "push", text, message, sha: remote.deviceSha });
    if (remote.fail)
      throw Object.assign(new Error(remote.fail), { code: remote.fail });
    /* the real optimistic-concurrency check, not a simulated one */
    if (remote.sha !== remote.deviceSha)
      throw Object.assign(new Error("conflict"), { code: "conflict" });
    remote.content = utf8ToBase64(text);
    remote.sha = `sha-${remote.calls.length}`;
    remote.deviceSha = remote.sha;
    remote.pushedAt = REMOTE_NOW;
    return { sha: remote.sha, pushedAt: remote.pushedAt };
  },
  async photoTarget() {
    return {
      owner: "shivinate7",
      repo: "mailaudit-photos",
      branch: "main",
      dir: "photos",
    };
  },
  async listPhotos() {
    remote.calls.push({ op: "listPhotos" });
    /* a private repo 404s a caller it doesn't trust, and "I can't see it" is
       not "it's empty" — the app must not read this as "every photo is lost" */
    if (photosUnknown) return { known: false, reason: photosUnknown };
    /* The photo repo is PRIVATE, and GitHub hides a private repo's existence
       behind a 404 rather than admitting a 403. So a keyless device cannot tell
       "no photos yet" from "not allowed to look" — which is the whole reason
       listPhotos is three-valued. Modelling it as readable-without-a-key would
       make the suite blind to the exact bug this shape exists to prevent. */
    if (!remote.key) return { known: false, reason: "no-access" };
    const ids = [];
    const sizes = {};
    for (const name of remotePhotos.keys()) {
      const id = name.replace(/\.[^.]+$/, "");
      ids.push(id);
      sizes[id] = 1000;
    }
    return { known: true, ids, sizes, truncated: false };
  },
  async pushPhoto(id, blob, message) {
    if (!remote.key)
      throw Object.assign(new Error("no-key"), { code: "no-key" });
    if (remote.photoFail)
      throw Object.assign(new Error(remote.photoFail), {
        code: remote.photoFail,
      });
    const name = photoName(id, blob?.type);
    remote.calls.push({ op: "pushPhoto", id, name, message });
    /* immutable by id: a path that already holds bytes is success, not an
       overwrite and not a conflict */
    if (remotePhotos.has(name)) return { id, skipped: true };
    remotePhotos.set(name, await blobToBase64(blob));
    return { id, skipped: false };
  },
  async pullPhoto(id) {
    /* a real download takes time, and the sweep runs on a 2s timer — the race
       between the two is a real one and needs to be reachable from a test */
    if (remote.photoDelay) await sleep(remote.photoDelay);
    if (remote.photoFail)
      throw Object.assign(new Error(remote.photoFail), {
        code: remote.photoFail,
      });
    const name = [...remotePhotos.keys()].find(
      (n) => n.replace(/\.[^.]+$/, "") === id
    );
    if (!name)
      throw Object.assign(new Error("missing"), { code: "missing" });
    remote.calls.push({ op: "pullPhoto", id, name });
    return b64ToBlob(remotePhotos.get(name), mimeFromName(name));
  },

  async pushForce(text, message) {
    remote.fail = null; // the force is what clears a conflict
    remote.deviceSha = remote.sha; // adopt the remote's sha, then overwrite
    return remoteApi.push(text, message);
  },
};
win.remote = remoteApi;

export const resetRemote = (seedText) => {
  remote = {
    content: seedText == null ? null : utf8ToBase64(seedText),
    sha: seedText == null ? null : "sha-0",
    /* a fresh device has seen nothing, so seeding a remote without pulling is
       exactly the state a second phone is in before its first pull */
    deviceSha: null,
    key: null,
    calls: [],
    fail: null,
    photoFail: null,
    photoDelay: 0,
    pushedAt: null,
    pulledAt: null,
  };
};
/* what the remote is actually holding, decoded */
export const remoteText = () =>
  remote.content == null ? null : base64ToUtf8(remote.content);
export const pushes = () => remote.calls.filter((c) => c.op === "push");

export const photoKeys = () => [...photoStore.keys()];
export const getPhoto = (id) => photoStore.get(id);
export const saved = () => JSON.parse(store["mailday:v1"] || "{}");

const React = require("react");
const { createRoot } = require("react-dom/client");
/* React.act since 18.3; react-dom/test-utils still works but warns */
const act = React.act || require("react-dom/test-utils").act;
const App = require(OUT).default;
export { act };

/* ---------- assertions ---------- */

let pass = 0;
const fails = [];

export function ok(cond, label) {
  if (cond) pass++;
  else fails.push(label);
}

export function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) pass++;
  else fails.push(`${label}\n     expected ${e}\n     actual   ${a}`);
}

export function report() {
  console.log(`\n${pass} passed, ${fails.length} failed`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  win.close(); // jsdom keeps the process alive otherwise
  if (fails.length) process.exit(1);
  console.log("all green");
}

/* ---------- DOM helpers ---------- */

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const text = () => document.body.textContent;
export const buttons = () => [...document.querySelectorAll("button")];
export const btn = (re) => buttons().find((b) => re.test(b.textContent));
export const allBtns = (re) => buttons().filter((b) => re.test(b.textContent));

export const click = async (el, label) => {
  if (!el) throw new Error(`no element to click: ${label || "(unlabelled)"}`);
  await act(async () => {
    el.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  });
};

/* React tracks the input's value internally, so setting .value directly is
   ignored — go through the native setter, then fire the event React listens for */
const valueSetter = Object.getOwnPropertyDescriptor(
  win.HTMLInputElement.prototype,
  "value"
).set;
export const type = async (input, value) => {
  await act(async () => {
    valueSetter.call(input, value);
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
  });
};

/* ---------- the ruled head ----------
   The three reporting cells replaced a Hide-received button, a native <select>
   and a chip disclosure. Each cell is a button whose text starts with its
   micro-label, so they're addressable without reaching for structure. */
export const cell = (re) => buttons().find((b) => re.test(b.textContent.trim()));

export const toggleShowing = () => click(cell(/^Showing/), "showing cell");

export const openRange = async () => {
  const c = cell(/^Orders from/);
  if (!c) throw new Error("no range cell on screen");
  if (c.getAttribute("aria-expanded") !== "true") await click(c, "open range");
};

/* Sort is a panel of options now, not a <select>, so pick by visible label. */
export const pickSort = async (label) => {
  const c = cell(/^Sorted by/);
  if (!c) throw new Error("no sort cell on screen");
  if (c.getAttribute("aria-expanded") !== "true") await click(c, "open sort");
  const opt = buttons().find((b) => b.textContent.trim() === label);
  if (!opt) throw new Error(`no sort option "${label}"`);
  await click(opt, `sort ${label}`);
};

/* Backup, Push and Pull all sit behind the Sync disclosure now — one tap
   deeper than Backup used to be, which is the cost of keeping the toolbar's
   third row to three controls. Idempotent, so tests can just call it. */
export const openSync = async () => {
  if (!btn(/^Push$/)) await click(btn(/^Sync/), "open sync panel");
};

/* The key field is uncontrolled by design (the token must never reach React
   state), so a plain .value assignment is exactly what a paste does. */
export const saveGitHubKey = async (token = "github_pat_testtoken") => {
  await openSync();
  const el = document.querySelector('input[aria-label="GitHub access token"]');
  if (!el) throw new Error("no GitHub key field on screen");
  el.value = token;
  await click(btn(/^Save key$/), "save key");
};

/* Setting input.files isn't practical in jsdom, so file input goes through the
   drop handler instead, with dataTransfer defined onto a plain Event.
   The app routes on the file *name*, but papaparse still wants a real Blob, so
   the type tracks the extension. */
export const dropFile = async (name, contents) => {
  const type = /\.csv$/i.test(name) ? "text/csv" : "application/json";
  await act(async () => {
    const ev = new win.Event("drop", { bubbles: true });
    Object.defineProperty(ev, "dataTransfer", {
      value: { files: [new win.File([contents], name, { type })] },
    });
    document.querySelector('div[style*="dashed"]').dispatchEvent(ev);
  });
  await act(async () => {
    await sleep(80); // FileReader is async
  });
};

/* An OrderWand export, as the real thing is shaped. `rows` are objects keyed by
   the CSV's own column names; anything omitted falls back to a sane default. */
export const csv = (rows) => {
  const cols = [
    "Type", "Vendor", "Order Id", "Ordered At", "Item Number", "Product Name",
    "Set Name", "Condition", "Finish", "Price", "Quantity", "Total Amount",
    "Product Line", "Party", "Shipping Status", "Vendor Product Id",
  ];
  const base = {
    Type: "purchase",
    Vendor: "TCGplayer",
    "Ordered At": "2026-07-01",
    "Set Name": "Test Set",
    Condition: "Near Mint",
    Finish: "",
    Price: "1.00",
    Quantity: "1",
    "Product Line": "Magic",
    "Shipping Status": "without tracking",
  };
  const cell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [
    cols.join(","),
    ...rows.map((r, i) => {
      const full = { "Item Number": String(i), ...base, ...r };
      full["Total Amount"] ??= String(
        (parseFloat(full.Price) || 0) * (parseInt(full.Quantity, 10) || 1)
      );
      full["Vendor Product Id"] ??= `p${i}`;
      return cols.map((c) => cell(String(full[c] ?? ""))).join(",");
    }),
  ].join("\n");
};

/* ---------- app driving ---------- */

/* The async storage load resolves outside act(); that warning is noise here. */
const realError = console.error;
console.error = (...a) =>
  /not wrapped in act/.test(String(a[0])) ? undefined : realError(...a);

let root = null;

/** Mount a fresh app over the given saved state and photo blobs.
    `opts.remote` seeds what the GitHub copy already holds (a JSON string);
    `opts.noRemote` boots a platform with no window.remote at all. */
export async function boot(state, photos, opts = {}) {
  if (root) await act(async () => root.unmount()); // else createRoot warns
  store = {};
  photoStore = new Map(photos || []);
  /* the suite has no isolation between groups — leave these set and group 30
     leaks straight into 31 */
  remotePhotos = new Map(opts.remotePhotos || []);
  photosUnknown = opts.photosUnknown || null;
  resetRemote(opts.remote);
  if (opts.noRemote) delete win.remote;
  else win.remote = remoteApi;
  if (state) store["mailday:v1"] = JSON.stringify(state);
  document.getElementById("root").innerHTML = "";
  await act(async () => {
    root = createRoot(document.getElementById("root"));
    root.render(React.createElement(App));
  });
  await act(async () => {
    await sleep(0);
  });
}

export const goTo = (view) =>
  click(btn(new RegExp(`^${view}`, "i")), `${view} tab`);
export const cardInput = () =>
  document.querySelector('input[aria-label="Card name"]');

/* Drive a <select>. React tracks the DOM value node, so assigning `.value`
   directly is silently ignored on re-render — go through the native setter,
   then dispatch, the same way a user's change would arrive. */
export const choose = async (labelRe, value) => {
  const sel = [...document.querySelectorAll("select")].find((s) =>
    labelRe.test(s.getAttribute("aria-label") || "")
  );
  if (!sel) throw new Error(`no select matching ${labelRe}`);
  const setter = Object.getOwnPropertyDescriptor(
    win.HTMLSelectElement.prototype,
    "value"
  ).set;
  await act(async () => {
    setter.call(sel, value);
    sel.dispatchEvent(new win.Event("change", { bubbles: true }));
  });
};


/** Record an envelope, tapping suggestions where they exist. */
export async function record(names, note) {
  await click(btn(/Record an envelope/), "new envelope");
  for (const n of names) {
    await type(cardInput(), n.slice(0, 9));
    const sug = buttons().find(
      (b) => b.textContent.startsWith(n) && /out ·/.test(b.textContent)
    );
    if (sug) await click(sug, `suggestion ${n}`);
    else {
      await type(cardInput(), n);
      await click(btn(/^Add “/), `as typed ${n}`);
    }
  }
  if (note)
    await type(
      document.querySelector('input[aria-label="Envelope note"]'),
      note
    );
  await click(btn(/Save envelope/), "save envelope");
}

/** Two-tap assign against the Nth candidate. */
export async function assign(n = 0) {
  await click(allBtns(/^This one$/)[n], `candidate ${n}`);
  await click(btn(/Tap again to check in/), "confirm assign");
}

export const envelopeCount = () => allBtns(/^Discard$/).length;

/* ---------- fixture ---------- */

const mk = (orderId, seller, date, tracking, rows) =>
  rows.map(([name, qty, price], i) => ({
    key: `${orderId}|${i}|p${name.replace(/\W/g, "")}`,
    orderId,
    seller,
    name,
    set: "Test Set",
    condition: "Near Mint",
    finish: "",
    qty,
    price,
    date,
    tracking,
    line: "Magic",
  }));

/* Alpha and Beta are deliberate near-duplicates — identical contents from
   different sellers. That's the case invariant 7 exists for, and it's normal
   for this user, so it belongs in the baseline fixture rather than one test. */
export const ITEMS = [
  ...mk("A1", "Alpha Cards", "2026-07-01", "without tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Counterspell", 1, 2.0],
    ["Brainstorm", 2, 0.5],
  ]),
  ...mk("B1", "Beta Games", "2026-07-02", "without tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Counterspell", 1, 2.0],
    ["Brainstorm", 2, 0.5],
  ]),
  ...mk("C1", "Gamma Cards", "2026-06-01", "with tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Path to Exile", 1, 3.0],
    ["Swords to Plowshares", 1, 4.0],
    ["Ponder", 1, 0.75],
    ["Preordain", 1, 0.75],
  ]),
  ...mk("D1", "Delta Cards", "2026-05-01", "without tracking", [
    ["Urza's Saga", 1, 50.0], // straight apostrophe, as the CSV has it
  ]),
];
export const TOTAL_CARDS = ITEMS.reduce((s, it) => s + it.qty, 0); // 14

/* distinguishable bytes, including high ones — a JPEG is not UTF-8, and an
   encoder that treats it as text corrupts exactly these */
export const jpegBytes = (seed = 1) => {
  const a = new Uint8Array(512);
  for (let i = 0; i < a.length; i++) a[i] = (i * 7 + seed * 31 + 199) % 256;
  return a;
};
export const jpegOf = (seed = 1) =>
  new win.Blob([jpegBytes(seed)], { type: "image/jpeg" });
export const bytesOf = async (blob) =>
  blob ? [...new Uint8Array(await blob.arrayBuffer())] : null;

export const jpeg = () =>
  new win.Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });

/* the photo sweep runs on a 2s timer; tests that assert on it must wait past it */
export const SWEEP_WAIT = 2600;
/* the ledger save is debounced 500ms */
export const SAVE_WAIT = 700;
