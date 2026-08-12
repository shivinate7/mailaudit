/* Test harness: bundle app.jsx, boot it in jsdom against mocked storage, and
   drive it with real DOM events. No test framework — `node --run test` runs
   test/app.test.mjs top to bottom and it either prints "all green" or exits 1.

   The app is deliberately hard to unit-test (one file, no exports but the
   component) and that's fine: every behaviour worth protecting here is a
   behaviour you can see, so the assertions read the DOM the way a user would. */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

/* Setting input.files isn't practical in jsdom, so file input goes through the
   drop handler instead, with dataTransfer defined onto a plain Event. */
export const dropFile = async (name, contents) => {
  await act(async () => {
    const ev = new win.Event("drop", { bubbles: true });
    Object.defineProperty(ev, "dataTransfer", {
      value: {
        files: [new win.File([contents], name, { type: "application/json" })],
      },
    });
    document.querySelector('div[style*="dashed"]').dispatchEvent(ev);
  });
  await act(async () => {
    await sleep(80); // FileReader is async
  });
};

/* ---------- app driving ---------- */

/* The async storage load resolves outside act(); that warning is noise here. */
const realError = console.error;
console.error = (...a) =>
  /not wrapped in act/.test(String(a[0])) ? undefined : realError(...a);

let root = null;

/** Mount a fresh app over the given saved state and photo blobs. */
export async function boot(state, photos) {
  if (root) await act(async () => root.unmount()); // else createRoot warns
  store = {};
  photoStore = new Map(photos || []);
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

export const jpeg = () =>
  new win.Blob(["fake-jpeg-bytes"], { type: "image/jpeg" });

/* the photo sweep runs on a 2s timer; tests that assert on it must wait past it */
export const SWEEP_WAIT = 2600;
/* the ledger save is debounced 500ms */
export const SAVE_WAIT = 700;
