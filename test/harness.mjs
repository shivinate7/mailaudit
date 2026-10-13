/* Test harness: bundle app.jsx, boot it in jsdom against mocked storage, and
   drive it with real DOM events. No test framework — `node --run test` runs
   test/app.test.mjs top to bottom and it either prints "all green" or exits 1.

   The app is deliberately hard to unit-test (one file, no exports but the
   component) and that's fine: every behaviour worth protecting here is a
   behaviour you can see, so the assertions read the DOM the way a user would. */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
/* the REAL codec, not a mock of it — see the note on the remote mock below */
import { utf8ToBase64, base64ToUtf8, blobToBase64 } from "../src/b64.mjs";
import { photoName, mimeFromName } from "../src/photo-rules.mjs";
import { prunePlan } from "../src/version-rules.mjs";
import { syncStatus } from "../src/sync-rules.mjs";
import { mergeLedger } from "../src/merge-rules.mjs";
/* the Worker's real size cap, so the mock refuses what the server refuses */
import { MAX_LEDGER_BYTES } from "../worker/core.mjs";

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
/* jsdom implements no scrolling at all, so this method simply isn't there and
   calling it throws. The app scrolls in two places (the canceled reference and
   the Tally view's jump to an order); neither is a claim a test can check —
   there is no layout to move — so stub it and let the assertions be about
   *what renders*, which is the part that can actually be wrong. */
win.HTMLElement.prototype.scrollIntoView = function () {};
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
  /* one-shot, push only. Models the race the sha check exists for: the remote
     moves between the peek and the write, so a look that said "all clear" is
     already out of date by the time the PUT lands. `fail` cannot express this
     — it would reject the recovering pull too. */
  pushFailOnce: null,
  photoFail: null, // ditto, but for the photo methods only
  pushedAt: null,
  pulledAt: null,
  auto: false,
  /* what peek() can see. null = readable; a code = "we could not look", which
     is the state auto-push must refuse to act on. */
  peekUnknown: null,
  /* one-shot, peek only. The first look is "could not look" and the next one
     reads normally: the transient a single retry exists for. Consumed by the
     look that reads it, so a test can check it was used. */
  peekUnknownOnce: null,
  /* the ledger repo is private: a keyless device gets 404, not the file */
  private: false,
  history: [], // every push, as a commit
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
      auto: !!remote.auto,
    };
  },
  async setAuto(on) {
    remote.auto = !!on;
  },
  /* Modelled off the same two fields the push check uses, so "ahead" here means
     exactly what it means on the wire: the remote holds a blob this device has
     not seen. Counted in `calls` so a test can prove auto-push looked BEFORE it
     wrote — the ordering is the whole safety property. */
  async peek() {
    remote.calls.push({ op: "peek" });
    if (remote.peekUnknown) return { known: false, reason: remote.peekUnknown };
    if (remote.peekUnknownOnce) {
      const reason = remote.peekUnknownOnce;
      remote.peekUnknownOnce = null;
      return { known: false, reason };
    }
    /* "I cannot see it" is not "nobody is ahead" — that reading is the state in
       which this device goes on pushing over the other one */
    if (remote.private && !remote.key)
      return { known: false, reason: "no-access" };
    return {
      known: true,
      sha: remote.sha,
      ahead: !!remote.sha && remote.sha !== remote.deviceSha,
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
  /* Reads, both of them: no key needed on the public ledger repo, and nothing
     spent from the content-write budget. */
  async listVersions(limit = 30) {
    remote.calls.push({ op: "listVersions" });
    if (remote.fail)
      throw Object.assign(new Error(remote.fail), { code: remote.fail });
    return [...remote.history]
      .reverse()
      .slice(0, limit)
      .map((h) => ({ sha: h.sha, at: h.at, message: h.message }));
  },
  async getVersion(sha) {
    remote.calls.push({ op: "getVersion", sha });
    const h = remote.history.find((x) => x.sha === sha);
    if (!h) throw Object.assign(new Error("missing"), { code: "missing" });
    return h.text;
  },

  async pull() {
    if (remote.fail)
      throw Object.assign(new Error(remote.fail), { code: remote.fail });
    /* the ledger repo is PRIVATE now, and GitHub hides a repo you cannot see
       behind a 404 — so a keyless device must get `no-access`, never `missing`.
       Modelling it as readable keylessly would make the suite blind to the
       whole bug class, exactly as it would for listPhotos. */
    if (remote.private && !remote.key)
      throw Object.assign(new Error("no-access"), { code: "no-access" });
    remote.calls.push({ op: "pull", key: remote.key });
    if (remote.content == null)
      throw Object.assign(new Error("missing"), { code: "missing" });
    /* deliberately NOT advancing deviceSha here — the real adapter doesn't
       either. A device catches up when it has APPLIED the bytes, not when it
       has received them; conflating the two lets a failed apply leave a
       current sha over stale data, which then pushes with no conflict. */
    return { text: base64ToUtf8(remote.content), sha: remote.sha };
  },
  async acceptPull(sha) {
    remote.calls.push({ op: "acceptPull", sha });
    remote.deviceSha = sha;
    /* Date.now(), NOT the frozen REMOTE_NOW — the same correction `push` below
       already carries, and for the same reason now that it is also true here:
       `syncBroken` measures staleness against the later of pushedAt/pulledAt,
       so a frozen pulledAt would make every merged device permanently stale and
       put the healthy state out of the suite's reach. It was left frozen while
       nothing read it. The adapter uses Date.now(); so must this. */
    remote.pulledAt = Date.now();
  },
  async push(text, message, overrideSha) {
    if (!remote.key)
      throw Object.assign(new Error("no-key"), { code: "no-key" });
    /* the force hands its freshly-looked-up sha through rather than recording
       it first — see pushForce */
    const sending = overrideSha !== undefined ? overrideSha : remote.deviceSha;
    remote.calls.push({ op: "push", text, message, sha: sending });
    /* held by holdRemotePushes(): the push is in flight until the test releases it */
    if (remote.hold) await remote.hold;
    if (remote.fail)
      throw Object.assign(new Error(remote.fail), { code: remote.fail });
    if (remote.pushFailOnce) {
      const code = remote.pushFailOnce;
      remote.pushFailOnce = null;
      throw Object.assign(new Error(code), { code });
    }
    /* the real optimistic-concurrency check, not a simulated one */
    if (remote.sha !== sending)
      throw Object.assign(new Error("conflict"), { code: "conflict" });
    remote.content = utf8ToBase64(text);
    remote.sha = `sha-${remote.calls.length}`;
    /* every push is a commit, which is the whole basis of the older-versions
       list — the archive is not a feature the remote grew, it is what a branch
       already is */
    remote.history.push({
      sha: remote.sha,
      at: REMOTE_NOW + remote.history.length * 60_000,
      message,
      text,
    });
    remote.deviceSha = remote.sha;
    /* Date.now(), NOT the frozen REMOTE_NOW. `syncBroken` measures staleness
       against this, so a fixed 2026-08-12 makes every fixture permanently
       "not backed up since…" and the healthy state — syncBroken === null —
       becomes unreachable from a test. The frozen clock is there so PAYLOAD
       snapshots don't depend on the wall clock; this is status metadata and
       nothing asserts on its value. */
    remote.pushedAt = Date.now();
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
    /* Looks the remote up and HANDS that sha to the PUT — it does not record
       it first. The mock used to do `deviceSha = remote.sha` here, mirroring a
       real bug in the adapter, and it also cleared `remote.fail` so the force
       could never fail — which is exactly why no test could catch it. Model
       both faithfully or the force is the one write path with no coverage. */
    return remoteApi.push(text, message, remote.sha);
  },
};
win.remote = remoteApi;

/* window.sync: the Worker adapter of stage 4b. The contract is route() in
   worker/core.mjs. GET answers {ledger, rev}, or 404 while the object is empty.
   POST merges with the app's own mergeLedger and answers {ledger, rev, stats}.
   The web app counts its own stats, so this fake leaves stats out. A
   missing or wrong key answers 401, and a merged ledger over the cap answers
   413. The real adapter keeps the device key at the raw localStorage key
   "mailday-sync:v1", outside the "mailday:" namespace. Here the key lives in
   `sync.key`, outside `store`, so storage.list() cannot see it.
   HARNESS CONTRACT ONLY. entry.jsx is not bundled here, so these cases prove
   this mock, not the adapter. */
const syncFresh = () => ({ key: null, ledger: null, rev: 0, netFail: false, tooBig: false, badShape: false, badShapes: 0, refused: false, calls: [], onRev: null });
let sync = syncFresh();
export const syncCalls = () => sync.calls;
/* how many close functions connect() has handed out and that were called.
   Kept outside `sync`, so a close from the unmounting app still counts after
   boot() swaps in a fresh mock. */
let syncCloses = 0;
export const syncCloseCount = () => syncCloses;
export const syncRev = () => sync.rev;
/* another device's POST, as the Worker's rev channel reports it: the server
   moves to `rev` (and to `ledger`, when given), then the open connect()
   handler is told that rev */
export const fireSyncRev = async (rev, ledger) => {
  sync.rev = rev;
  if (ledger) sync.ledger = ledger;
  await act(async () => {
    sync.onRev?.(rev);
    await sleep(0);
  });
};
/* holds every GitHub push until the returned release() is called, so a test can
   change the ledger while a mirror push is in flight. Set after boot(), which
   resets `remote`. */
export const holdRemotePushes = () => {
  let release;
  remote.hold = new Promise((r) => (release = r));
  return () => {
    remote.hold = null;
    release();
  };
};
/* the rev channel fires `rev` without moving the server. A test uses it for the
   rev of a POST still in flight, which the POST then gives when released. */
export const fireSyncRevOnly = async (rev) => {
  await act(async () => {
    sync.onRev?.(rev);
    await sleep(0);
  });
};
/* holds every POST until the returned release() is called, so a test can fire
   a rev while this device's own write is still in flight */
export const holdSyncPosts = () => {
  let release;
  sync.hold = new Promise((r) => (release = r));
  return () => {
    sync.hold = null;
    release();
  };
};
/* the Worker's object is emptied: its next GET answers 404, a healthy empty store */
export const clearSyncStore = () => {
  sync.ledger = null;
};
/* a network failure: the adapter answers {status: null, body: null}, which
   syncStatus maps to "unknown" */
export const setSyncNetFail = (on) => {
  sync.netFail = !!on;
};
/* a POST the server refuses as too big: a 413, which syncStatus maps to
   "too-big" */
export const setSyncTooBig = (on) => {
  sync.tooBig = !!on;
};
/* a POST the Worker refuses as a bad shape: the real 400 body, which syncStatus maps
   to "bad-shape". syncBadShapeCount() counts the 400s served, so a test can see one. */
export const setSyncBadShape = (on) => {
  sync.badShape = !!on;
};
export const syncBadShapeCount = () => sync.badShapes;
/* the Worker refuses this device's key: every call answers 401 */
export const setSyncKeyRefused = (on) => {
  sync.refused = !!on;
};
const syncErr = (code) => Object.assign(new Error(code), { code });
/* every reply is {status, body, code}, code = syncStatus(status), as the
   real adapter in entry.jsx answers it */
const syncReply = (status, body) => ({ status, body, code: syncStatus(status) });
const syncApi = {
  async hasKey() {
    return !!sync.key;
  },
  async setKey(k) {
    const v = String(k || "").trim();
    if (!/^[A-Za-z0-9_-]+$/.test(v)) throw syncErr("bad-key");
    sync.key = v;
  },
  async get() {
    sync.calls.push({ op: "get", keyed: !!sync.key });
    if (sync.netFail) return syncReply(null, null);
    if (sync.refused || !sync.key) return syncReply(401, { error: "unauthorized" });
    if (sync.ledger == null) return syncReply(404, { error: "empty" });
    return syncReply(200, { ledger: sync.ledger, rev: sync.rev });
  },
  async post(ledger) {
    sync.calls.push({ op: "post", keyed: !!sync.key, body: JSON.stringify(ledger) });
    /* held by holdSyncPosts(): the POST is in flight until the test releases it */
    if (sync.hold) await sync.hold;
    if (sync.netFail) return syncReply(null, null);
    if (sync.refused || !sync.key) return syncReply(401, { error: "unauthorized" });
    if (sync.tooBig) return syncReply(413, { error: "too-big" });
    if (sync.badShape) {
      sync.badShapes += 1;
      return syncReply(400, { error: "bad ledger" });
    }
    if (!ledger || ledger.mailday !== 1 || !Array.isArray(ledger.items))
      return syncReply(400, { error: "bad ledger" });
    const merged = sync.ledger ? mergeLedger(sync.ledger, ledger).merged : ledger;
    const size = new TextEncoder().encode(JSON.stringify(merged)).length;
    if (size > MAX_LEDGER_BYTES) return syncReply(413, { error: "too-large" });
    sync.ledger = merged;
    sync.rev += 1;
    return syncReply(200, { ledger: merged, rev: sync.rev });
  },
  /* the real adapter returns a close function whether or not a key is set.
     onRev is called only by fireSyncRev() in the tests. */
  connect(onRev) {
    sync.calls.push({ op: "connect", keyed: !!sync.key, key: sync.key });
    sync.onRev = onRev;
    return () => {
      syncCloses += 1;
    };
  },
};
win.sync = syncApi;

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
    pushFailOnce: null,
    photoFail: null,
    photoDelay: 0,
    pushedAt: null,
    pulledAt: null,
    auto: false,
    peekUnknown: null,
    peekUnknownOnce: null,
    private: false,
    history: [],
  };
};
/* what the remote is actually holding, decoded */
export const remoteText = () =>
  remote.content == null ? null : base64ToUtf8(remote.content);
export const pushes = () => remote.calls.filter((c) => c.op === "push");
export const peeks = () => remote.calls.filter((c) => c.op === "peek");

/* Backgrounding the app runs auto-push immediately, with no 90s wait — which
   is both the fast seam for a test and a real path the user takes every time
   they switch away mid-mail-day. jsdom leaves visibilityState read-only, hence
   defineProperty. */
export const background = async () => {
  Object.defineProperty(win.document, "visibilityState", {
    value: "hidden",
    configurable: true,
  });
  await act(async () => {
    win.document.dispatchEvent(new win.Event("visibilitychange"));
    await sleep(0);
  });
  await act(async () => await sleep(0));
  /* restore silently — the point of this helper is "run auto-push now", not
     "leave the page hidden for every test that follows". Left hidden, the
     foreground peek returns early and the Merge button never appears, which
     shows up as an unrelated test failing to find a button. */
  Object.defineProperty(win.document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
};
/* autoPush is a chain of awaits (status, peek, then the write), and a single
   act() flush does not reach its end. Pump the queue until the chain settles. */
export const drain = async (turns = 30) => {
  for (let i = 0; i < turns; i++) await act(async () => await sleep(0));
};
export const foreground = async () => {
  Object.defineProperty(win.document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
  await act(async () => {
    win.document.dispatchEvent(new win.Event("visibilitychange"));
    await sleep(0);
  });
  await act(async () => await sleep(0));
};

export const photoKeys = () => [...photoStore.keys()];

/* ---- window.versions ----
   Mocked directly rather than polyfilled, for the reason window.photos is:
   jsdom has no IndexedDB, the app only ever sees this API, and a Map matches
   its contract exactly.

   Two deliberate choices. It prunes through the REAL prunePlan, so an
   app-level "take a version" exercises the actual retention rules rather than
   a convenient fiction — the same reason the remote mock encodes through the
   real b64. And it stores the text uncompressed: gzip is the platform layer's
   business, app.jsx never learns whether it happened, and CompressionStream
   does not exist in jsdom. */
export let versionStore = new Map(); // id -> { meta, text }
export const versionMetas = () =>
  [...versionStore.values()].map((v) => v.meta).sort((a, b) => b.at - a.at);
export const versionText = (label) => {
  const hit = versionMetas().find((m) => m.label === label);
  return hit ? versionStore.get(hit.id).text : null;
};

const versionsApi = {
  async put({ text, label, kind = "recent", lines = 0, checked = 0 }) {
    const at = Date.now();
    /* the counter is not decoration: several versions can land inside one
       millisecond here, and a colliding id would silently overwrite the
       version a test is about to assert on */
    const id = `v${at}-${versionStore.size}`;
    versionStore.set(id, {
      meta: { id, at, label, kind, lines, checked, bytes: text.length },
      text,
    });
    await versionsApi.prune();
    return id;
  },
  async list() {
    return versionMetas();
  },
  async get(id) {
    return versionStore.get(id)?.text ?? null;
  },
  async remove(id) {
    versionStore.delete(id);
  },
  async prune() {
    const dead = prunePlan(versionMetas());
    for (const id of dead) versionStore.delete(id);
    return dead.length;
  },
  async usage() {
    const all = versionMetas();
    return { count: all.length, bytes: all.reduce((n, v) => n + v.bytes, 0) };
  },
};
export const getPhoto = (id) => photoStore.get(id);
export const saved = () => JSON.parse(store["mailday:v1"] || "{}");
/* the saved text exactly as stored, unparsed: a refusal must leave it byte for byte */
export const savedText = () => store["mailday:v1"] ?? null;

const React = require("react");
const { createRoot } = require("react-dom/client");
/* React.act since 18.3; react-dom/test-utils still works but warns */
const act = React.act || require("react-dom/test-utils").act;
const App = require(OUT).default;
export { act };

/* ---------- assertions ---------- */

let pass = 0;
const fails = [];

/* A stalled await never reaches report(), so the run would end silent or hang.
   The watchdog is idle-based: every assertion re-arms it, so a run that is making
   progress never trips it, and one that stops for WATCHDOG_MS reports the failure
   and the live handle kinds. It is unref'd, so it never keeps a finished run alive. */
const WATCHDOG_MS = Number(process.env.MAILDAY_TEST_WATCHDOG_MS) || 300_000;
/* Node's own timers, captured here: the virtual clock below swaps globalThis.setTimeout
   for groups 53 to 56, and a watchdog on that clock would only fire when time is advanced. */
const wdSetTimeout = globalThis.setTimeout;
const wdClearTimeout = globalThis.clearTimeout;
let watchdog = null;
let reported = false;
function arm() {
  wdClearTimeout(watchdog);
  watchdog = wdSetTimeout(() => stalled(`no assertion for ${WATCHDOG_MS / 1000} s, so the run stalled`), WATCHDOG_MS);
  watchdog.unref();
}

export function ok(cond, label) {
  arm();
  if (cond) pass++;
  else fails.push(label);
}

export function eq(actual, expected, label) {
  arm();
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) pass++;
  else fails.push(`${label}\n     expected ${e}\n     actual   ${a}`);
}

/* A run that ends with a live timer or socket never exits, so it hangs until
   something kills it, and a hang reports nothing. Node names each live handle
   by kind. The TTY and the stdio pipes are not ours to close, so they are skipped. */
const STDIO_KINDS = new Set(["TTYWrap", "PipeWrap"]);
export function liveHandleKinds() {
  return process.getActiveResourcesInfo().filter((k) => !STDIO_KINDS.has(k));
}

export function report() {
  reported = true;
  wdClearTimeout(watchdog);
  win.close(); // jsdom keeps the process alive otherwise
  const live = liveHandleKinds();
  if (live.length)
    fails.push(`${live.length} live handle(s) after the run, so the process would hang: ${live.join(", ")}`);
  console.log(`\n${pass} passed, ${fails.length} failed`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  console.log(`live handles: ${live.length ? live.join(", ") : "none"}`);
  if (fails.length) process.exit(1);
  console.log("all green");
}

/* The run ended or stalled without report(). Print what it had, name the live
   handles, and exit red. Once only: report() and this path never both speak. */
function stalled(why) {
  if (reported) return;
  reported = true;
  win.close();
  const live = liveHandleKinds();
  fails.push(`${why}; live handles: ${live.length ? live.join(", ") : "none"}`);
  console.log(`\n${pass} passed, ${fails.length} failed`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(1);
}
/* a run whose last await never settled can end with nothing alive: beforeExit still fires */
process.once("beforeExit", () => stalled("the run ended without reaching report()"));
arm();

/* ---------- DOM helpers ---------- */

/* ── the virtual clock (harness only) ──
   Groups 53 to 61 and 67 to 68 drive the app's timers on demand, not in real time. While
   the clock is installed, Date.now and every setTimeout of 1 ms or more run on
   a virtual clock. sleep(ms) advances that clock by ms, and fires each timer
   that comes due, in order. A zero delay, and every real wait, stays real.
   Groups 1 to 52 and 62 to 66 never install it, so their real timers are untouched.
   Node's own timers are captured first, so the harness can always wait for
   real. No src/ code changes. */
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
const realSetImmediate = globalThis.setImmediate;
const realDateNow = Date.now;
let vclock = null;
/* Between two virtual timers, the app's async work (IndexedDB, merges, state
   commits) still runs on real turns. A few real milliseconds let it settle. */
const yieldReal = async () => {
  for (let i = 0; i < 2; i++) await new Promise((r) => realSetTimeout(r, 5));
  await new Promise((r) => realSetImmediate(r));
};
export const installClock = () => {
  if (vclock) return;
  vclock = { now: realDateNow(), timers: [], seq: 0 };
  Date.now = () => vclock.now;
  globalThis.setTimeout = (fn, ms = 0, ...args) => {
    if (!(Number(ms) >= 1)) return realSetTimeout(fn, ms, ...args);
    const h = { id: ++vclock.seq, at: vclock.now + Number(ms), fn, args, virtual: true };
    vclock.timers.push(h);
    return h;
  };
  globalThis.clearTimeout = (h) => {
    if (h && h.virtual) {
      vclock.timers = vclock.timers.filter((x) => x !== h);
      return;
    }
    return realClearTimeout(h);
  };
};
export const uninstallClock = () => {
  if (!vclock) return;
  Date.now = realDateNow;
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
  vclock = null;
};
const advanceClock = (ms) => {
  const target = vclock.now + ms;
  /* Each timer runs inside its own act, so React commits its effects at the
     timer's own virtual time. Inside one long act, effects wait for the end,
     and the timers they set would land after the target. */
  const run = async () => {
    let quiet = 0;
    while (quiet < 3) {
      await yieldReal();
      const due = vclock.timers
        .filter((t) => t.at <= target)
        .sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) {
        quiet += 1;
        continue;
      }
      quiet = 0;
      vclock.timers = vclock.timers.filter((t) => t !== due);
      vclock.now = Math.max(vclock.now, due.at);
      await act(async () => {
        due.fn(...due.args);
        await yieldReal();
      });
    }
    vclock.now = target;
  };
  return run();
};
export const sleep = (ms) =>
  vclock && Number(ms) >= 1
    ? advanceClock(Number(ms))
    : new Promise((r) => realSetTimeout(r, ms));
export const text = () => document.body.textContent;
export const buttons = () => [...document.querySelectorAll("button")];
export const btn = (re) => buttons().find((b) => re.test(b.textContent));
export const allBtns = (re) => buttons().filter((b) => re.test(b.textContent));

export const click = async (el, label) => {
  /* a missing control is recorded as a failed case, and the run goes on: one
     red case must not stop the groups after it from reporting their own */
  if (!el) {
    fails.push(`no element to click: ${label || "(unlabelled)"}`);
    return;
  }
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

/* The Ledger tab holds the options (decision ledger-tab-holds-options). Each
   helper finds its control on the current screen first, and visits the Ledger
   tab only when the control is absent, so one helper serves the base and the
   built page. onLedger returns the working view it came from, so a helper that
   only flips a setting can hand that view back. */
const viewTabEls = () =>
  [...(document.querySelector('nav[aria-label="Views"]')?.querySelectorAll("button") ?? [])];
const tabLabel = (b) => b.textContent.replace(/\d+$/, "").trim();
export const onLedger = async () => {
  const cur = viewTabEls().find(
    (b) => b.getAttribute("aria-current") && b.getAttribute("aria-current") !== "false"
  );
  const prev = cur ? tabLabel(cur) : null;
  const ledgerTab = viewTabEls().find((b) => tabLabel(b) === "Ledger");
  if (prev !== "Ledger" && ledgerTab) await click(ledgerTab, "Ledger tab");
  return prev;
};
/* Visit the Ledger tab only when a control matching `re` is not on screen. */
export const reachFor = async (re) => {
  if (!buttons().some((b) => re.test(b.textContent.trim()))) await onLedger();
};
export const showingText = async () => {
  await reachFor(/^Showing/);
  return cell(/^Showing/)?.textContent ?? "";
};
export const backTo = async (prev) => {
  if (!prev || prev === "Ledger") return;
  const t = viewTabEls().find((b) => tabLabel(b) === prev);
  if (t) await click(t, `${prev} tab`);
};

export const toggleShowing = async () => {
  const prev = cell(/^Showing/) ? null : await onLedger();
  await click(cell(/^Showing/), "showing cell");
  await backTo(prev);
};

/* Background the page for `awayMs` and bring it back — what iOS actually does
   when you switch apps and return, which is not a remount. Composes the
   plain background()/foreground() pair above and adds the one thing the
   resume reset needs: a frozen clock, so the elapsed time is the argument
   rather than the wall clock. */
export async function backgroundFor(awayMs) {
  const realNow = Date.now;
  let clock = realNow();
  try {
    Date.now = () => clock;
    await background();
    clock += awayMs;
    await foreground();
  } finally {
    Date.now = realNow;
  }
}

export const openRange = async () => {
  if (!cell(/^Orders from/)) await onLedger();
  const c = cell(/^Orders from/);
  if (!c) {
    fails.push("no range cell on screen");
    return;
  }
  if (c.getAttribute("aria-expanded") !== "true") await click(c, "open range");
};

/* Sort is a panel of options now, not a <select>, so pick by visible label. */
export const pickSort = async (label) => {
  const prev = cell(/^Sorted by/) ? null : await onLedger();
  const c = cell(/^Sorted by/);
  if (!c) {
    fails.push("no sort cell on screen");
    await backTo(prev);
    return;
  }
  if (c.getAttribute("aria-expanded") !== "true") await click(c, "open sort");
  const opt = buttons().find((b) => b.textContent.trim() === label);
  if (!opt) {
    fails.push(`no sort option "${label}"`);
    await backTo(prev);
    return;
  }
  await click(opt, `sort ${label}`);
  await backTo(prev);
};

/* Opens the Sync panel, which holds the GitHub key field. Push, Pull and Merge
   left the UI (owner ruling 2026-10-12): GitHub is a mirror that runs itself,
   so tests reach it through background() and assert pushes() instead. */
export const openSync = async () => {
  /* idempotent on the panel being open: the key field is its own mark, and
     the Sync cell's aria-expanded says it when the field is not shown */
  if (
    cell(/^Sync/)?.getAttribute("aria-expanded") === "true" ||
    document.querySelector('input[aria-label="GitHub access token"]')
  )
    return;
  /* the advisory line, while it shows, opens the same panel; otherwise the
     Sync cell on the Ledger tab does (decision ledger-tab-holds-options) */
  if (btn(/tap to/)) await click(btn(/tap to/), "open the repair kit");
  else {
    await onLedger();
    await click(cell(/^Sync/), "open Sync");
  }
};

/* Idempotent, like openSync. History is a cell on the Ledger tab; its panel
   opens inside that tab. */
export const openHistory = async () => {
  if (cell(/^History/)?.getAttribute("aria-expanded") === "true") return;
  if (!cell(/^History/)) await onLedger();
  await click(cell(/^History/), "open history");
};

/* The GitHub token field left the UI (owner ruling 2026-10-12, group 64: the
   Sync panel holds the Worker's device key and nothing for GitHub). A device
   gets its GitHub key the way the owner's devices do, before the mount
   (boot's remoteKey) or on the adapter, so this sets it on the adapter. */
export const saveGitHubKey = async (token = "github_pat_testtoken") => {
  await win.remote.setKey(token);
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
  /* the snapshot build.mjs bakes into index.html. Mocked as plain text: the
     gzip+base64 packing is the platform layer's business, exactly as it is for
     the version store, and jsdom has no DecompressionStream. */
  if (opts.seed) win.seed = { async load() { return opts.seed; } };
  else if (opts.noSeed === false) delete win.seed;
  else delete win.seed;
  versionStore = new Map(opts.versions || []);
  if (opts.noVersions) delete win.versions;
  /* failPut: every version write rejects, as IndexedDB does under quota or in private
     browsing. A milestone that cannot be written (67.F1) is the case it serves. */
  else if (opts.failPut)
    win.versions = { ...versionsApi, async put() { throw new Error("quota exceeded"); } };
  else win.versions = versionsApi;
  /* `remoteAtBoot` seeds BEFORE the app mounts, which is the cold-start case:
     this device opens against a remote that is already ahead. `remote` seeds
     AFTER, which is what almost every fixture actually means — the other device
     pushed at some point since, and then you looked at your phone.

     The distinction only started mattering when a resume began merging on its
     own, because a cold mount counts as a fresh session: seeded before the
     mount, every one of those fixtures would auto-merge away the very conflict
     it was written to produce. It is also the more faithful model of the wire,
     which is why this is a fix rather than a workaround. */
  resetRemote(opts.remoteAtBoot ?? null);
  /* a key present BEFORE the app mounts — the state every one of the owner's
     devices is in, and the one the seed guard turns on */
  if (opts.remoteKey) remote.key = opts.remoteKey;
  /* a private ledger repo BEFORE the mount, so the cold-start look meets it.
     Setting `private` after boot is a glance, not a cold start. */
  if (opts.remotePrivate) remote.private = true;
  if (opts.noRemote) delete win.remote;
  else win.remote = remoteApi;
  /* a fresh device has no sync key; each boot is a new device */
  sync = syncFresh();
  /* set before the mount, so the cold-open GET already fails: a boot-time Worker
     reply that never arrives (group 66). A setter called before boot is erased
     by the fresh mock above, so it must be an option. */
  if (opts.syncNetFail) sync.netFail = true;
  /* the Worker adapter ships in every real build, so a test that needs it opts
     in. Without it the app sees no adapter, and no sync-key entrance is offered
     to a keyless device, which is what groups 1-52 were written against. */
  if (opts.syncKey || opts.syncAdapter) win.sync = syncApi;
  else delete win.sync;
  /* a seeded device key and server ledger, set before mount so the app sees
     them at its first read. The server is at rev 1 once it holds a ledger. */
  if (opts.syncKey) sync.key = opts.syncKey;
  if (opts.syncLedger) {
    sync.ledger = opts.syncLedger;
    sync.rev = 1;
  }
  if (state) store["mailday:v1"] = JSON.stringify(state);
  /* the saved text as it is, not parsed: an unparseable saved text (67.F2) cannot
     be written as a state */
  if (opts.raw != null) store["mailday:v1"] = opts.raw;
  document.getElementById("root").innerHTML = "";
  await act(async () => {
    root = createRoot(document.getElementById("root"));
    root.render(React.createElement(App));
  });
  await act(async () => {
    await sleep(0);
  });
  if (opts.remote != null) {
    remote.content = utf8ToBase64(opts.remote);
    remote.sha = "sha-0";
    /* and now you look at your phone. Without this the app never re-peeks —
       check() runs on mount and on syncBusy, neither of which a bare
       assignment touches — so nothing would know the remote had moved. The
       away-clock is untouched, so this is a glance, not a new session. */
    await foreground();
  }
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
  /* the envelope form lives on the Orphaned tab; a test may arrive from the
     Ledger tab (openHistory leaves the app there) */
  if (!btn(/Record an envelope/)) await goTo("orphaned");
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

/** One-tap assign against the Nth candidate. Undo is the way back, not a second tap. */
export async function assign(n = 0) {
  await click(allBtns(/^This one$/)[n], `candidate ${n}`);
}

export const envelopeCount = () => allBtns(/^Discard$/).length;

/* ---------- fixture ---------- */

/* Alpha and Beta are deliberate near-duplicates: identical contents from
   different sellers. That is the case invariant orphaned-mail-never-decides exists for,
   and it is normal for this user, so it belongs in the baseline fixture.
   The fixture is shared/fixtures/ledger.json, so the native app reads the same one
   (decision shared-tokens-and-fixtures). */
export const ITEMS = JSON.parse(
  readFileSync(path.join(ROOT, "shared", "fixtures", "ledger.json"), "utf8")
).items;
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
