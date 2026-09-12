import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import { utf8ToBase64, base64ToUtf8, blobToBase64 } from "./b64.mjs";
import { classifyStatus, pushBody } from "./remote-rules.mjs";
import { photoName, photoIdFromName, mimeFromName, isAlreadyThere } from "./photo-rules.mjs";
import { prunePlan } from "./version-rules.mjs";

/* ============================================================
   Platform layer. app.jsx never touches a storage API directly —
   it goes through window.storage (the ledger), window.photos
   (envelope photos), window.versions (the rollback list) and
   window.remote (the GitHub backup).
   Keeping the first two apart matters: the ledger is a single
   small JSON blob that must save fast on every keystroke, and
   photos are megabytes that must never get near it. window.remote
   is here for the same reason plus one more: the access token
   lives entirely below this seam, so app.jsx can never hold it.
   ============================================================ */

/* ---- ledger: localStorage ----
   DO NOT change the "mailday:" namespace or keys — existing saved
   progress lives under these exact keys. (github.io is one origin
   across every repo, hence the namespace.) */
const NS = "mailday:";
window.storage = {
  async get(key) {
    const v = localStorage.getItem(NS + key);
    if (v == null) throw new Error("key not found");
    return { key, value: v, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(NS + key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem(NS + key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(NS) && k.slice(NS.length).startsWith(prefix))
        keys.push(k.slice(NS.length));
    }
    return { keys, prefix, shared: false };
  },
};

/* ---- photos: IndexedDB ----
   localStorage caps out around 5MB and would be shared with the
   ledger; IndexedDB scales with free disk and stores Blobs as-is,
   with none of base64's ~33% inflation. */
const DB_NAME = "mailday-photos";
const STORE = "photos";
let dbPromise = null;

function db() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      /* same reasoning as vdb()'s — a blocked open hangs rather than throws */
      req.onblocked = () =>
        reject(new Error("photo database blocked by another tab"));
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE))
          req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return dbPromise;
}

/* `run` hands back the IDBRequest; we resolve with its result once the
   transaction itself completes, so a miss resolves undefined rather than
   leaking the request object */
function tx(mode, run) {
  return db().then(
    (d) =>
      new Promise((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        let req;
        try {
          req = run(t.objectStore(STORE));
        } catch (e) {
          reject(e);
          return;
        }
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

window.photos = {
  put: (id, blob) => tx("readwrite", (s) => s.put(blob, id)).then(() => id),
  get: (id) => tx("readonly", (s) => s.get(id)).then((r) => r ?? null),
  delete: (id) => tx("readwrite", (s) => s.delete(id)),
  keys: () => tx("readonly", (s) => s.getAllKeys()),
  clear: () => tx("readwrite", (s) => s.clear()),
  /* drop anything no envelope references any more */
  async sweep(keep) {
    const all = await window.photos.keys();
    const dead = (all || []).filter((k) => !keep.has(k));
    for (const k of dead) await window.photos.delete(k);
    return dead.length;
  },
  async usage() {
    try {
      const est = await navigator.storage?.estimate?.();
      return est ? { used: est.usage || 0, quota: est.quota || 0 } : null;
    } catch {
      return null;
    }
  },
};

/* ---- saved versions: IndexedDB ----
   A rollback list for the ledger, so "go back to before that import"
   is a tap on the phone rather than `git show data~5:ledger.json` on
   a laptop that isn't in the room.

   Its OWN database, not another store bolted onto mailday-photos.
   Adding a store means a version bump, and an upgrade that fails
   takes the whole connection with it — photos are irreplaceable and
   these are a convenience, so they must not be able to hurt each
   other. Two connections is the cheaper risk.

   Two stores rather than one, and that split is load-bearing:
   `list()` runs every time the History panel opens, and IndexedDB
   getAll() hands back whole records. With the payloads in the same
   store that would materialise every saved ledger — megabytes — to
   render a list of dates. `meta` is small and read often; `blobs`
   is large and read only when something is actually restored. */
const VDB_NAME = "mailday-versions";
const VMETA = "meta";
const VBLOBS = "blobs";
let vdbPromise = null;

function vdb() {
  if (!vdbPromise)
    vdbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(VDB_NAME, 1);
      /* Unreachable at version 1, and one line now rather than a mystery later:
         the day this schema needs version 2, a second open tab holding the old
         connection leaves this promise PENDING rather than rejected — every
         versions call hangs, with no message anywhere, which is the one failure
         mode this codebase has no copy for. */
      req.onblocked = () =>
        reject(new Error("versions database blocked by another tab"));
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(VMETA))
          d.createObjectStore(VMETA, { keyPath: "id" });
        if (!d.objectStoreNames.contains(VBLOBS)) d.createObjectStore(VBLOBS);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return vdbPromise;
}

function vtx(stores, mode, run) {
  return vdb().then(
    (d) =>
      new Promise((resolve, reject) => {
        const t = d.transaction(stores, mode);
        let req;
        try {
          req = run(...stores.map((s) => t.objectStore(s)));
        } catch (e) {
          reject(e);
          return;
        }
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

/* Built into Safari, so no dependency — the ledger is JSON with a
   few hundred near-identical repeated keys and gzips about tenfold.
   The `gz` flag rides along in the metadata rather than being assumed,
   so a record written on a browser without CompressionStream still
   reads back on one that has it, and vice versa. */
async function gzipText(text) {
  const raw = new Blob([text]);
  if (typeof CompressionStream !== "function") return { blob: raw, gz: false };
  try {
    const s = raw.stream().pipeThrough(new CompressionStream("gzip"));
    return { blob: await new Response(s).blob(), gz: true };
  } catch {
    return { blob: raw, gz: false };
  }
}

async function gunzipBlob(blob, gz) {
  if (!gz) return blob.text();
  const s = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(s).text();
}

window.versions = {
  /* `text` is whatever app.jsx's snapshot() produced — this layer never
     parses it, exactly as window.storage never parses the ledger. The
     counts come in already computed for the same reason: the platform
     layer knowing what a "line" is would be the seam leaking. */
  async put({ text, label, kind = "recent", lines = 0, checked = 0 }) {
    const at = Date.now();
    const id = `v${at}-${Math.random().toString(36).slice(2, 8)}`;
    const { blob, gz } = await gzipText(text);
    await vtx([VMETA, VBLOBS], "readwrite", (meta, blobs) => {
      meta.put({ id, at, label, kind, lines, checked, gz, bytes: blob.size });
      blobs.put(blob, id);
    });
    /* Deliberately not awaited into the caller's failure. The record is on
       disk by now; prune runs a separate transaction per deletion, so one of
       those rejecting used to reject `put` as well — reporting a version that
       exists as one that failed, which the app then surfaces as "versions can't
       be saved". Partial success is not failure. */
    await window.versions.prune().catch(() => {});
    return id;
  },

  /* metadata only — see the two-store note above */
  async list() {
    const all = (await vtx([VMETA], "readonly", (m) => m.getAll())) || [];
    return all.sort((a, b) => b.at - a.at);
  },

  async get(id) {
    const meta = await vtx([VMETA], "readonly", (m) => m.get(id));
    if (!meta) return null;
    const blob = await vtx([VBLOBS], "readonly", (b) => b.get(id));
    if (!blob) return null;
    return gunzipBlob(blob, meta.gz);
  },

  async remove(id) {
    await vtx([VMETA, VBLOBS], "readwrite", (meta, blobs) => {
      meta.delete(id);
      blobs.delete(id);
    });
  },

  /* Runs on every write rather than on a timer: the rules are cheap,
     and a prune that only happens when someone remembers to call it is
     a prune that has already stopped happening. */
  async prune() {
    const all = await window.versions.list();
    const dead = prunePlan(all);
    for (const id of dead) await window.versions.remove(id);
    return dead.length;
  },

  async usage() {
    const all = await window.versions.list();
    return { count: all.length, bytes: all.reduce((n, r) => n + (r.bytes || 0), 0) };
  },
};

/* ---- the public seed ----
   A snapshot baked into index.html by build.mjs, so someone opening the public
   URL lands on a populated app instead of an empty one. The ledger repo is
   private and Pages has never served it; this is how the site carries data
   without the repo carrying it publicly.

   Read-only and one-way by construction: it hydrates into the visitor's OWN
   localStorage, so anything they do afterwards is theirs and stays on their
   device. Pushing back needs a token they do not have.

   Inflated here rather than in app.jsx for the same reason gzip lives in the
   version store: the app deals in ledger text and never learns how it was
   packed. Returns null whenever there is no seed, which is every local build
   made without the data branch to hand. */
window.seed = {
  async load() {
    const tag = document.getElementById("seed");
    const packed = tag?.textContent?.trim();
    if (!packed) return null;
    try {
      const bytes = Uint8Array.from(atob(packed), (c) => c.charCodeAt(0));
      if (typeof DecompressionStream !== "function") return null;
      const s = new Blob([bytes]).stream().pipeThrough(
        new DecompressionStream("gzip")
      );
      const text = await new Response(s).text();
      return typeof text === "string" && text ? text : null;
    } catch {
      return null;
    }
  },
};

/* ---- remote backup: the GitHub Contents API ----
   TRANSPORT, not storage. localStorage stays the source of truth; this is a
   manual, tap-triggered push/pull so the ledger survives losing the phone, ITP
   evicting script-writable storage, or moving to another origin. Nothing here
   is automatic — see the note on `sha` below for why continuous sync was not
   the design.

   Target lives in one object, which is what made the move into the private repo
   a two-line change.

   `data` and not `main`, and the ORIGINAL reason for that is now dead: it was
   "Pages deploys from main's root, so pushing the ledger there would trigger a
   site rebuild", and this repo serves no Pages site. It survives on a reason
   that is actually current — `listVersions` asks for
   `commits?path=ledger.json&sha=data`, so **the branch's commit log IS the
   version archive**. Sharing `main` with the photos would interleave a commit
   per photo into that log and leave the path filter doing real work to hide
   them. Don't "simplify" the branch away on the strength of the dead reason. */
const REMOTE = {
  owner: "shivinate7",
  repo: "mailaudit-data",
  branch: "data",
  path: "ledger.json",
};

/* Photos share the repo with the ledger now, on their own branch. They did not
   always: the split existed because a mailing label carries a delivery address
   while the ledger repo was PUBLIC, and git is permanent. That argument died
   when the ledger repo went private, and the two halves were merged when
   `mailaudit` went public and the ledger had to leave it anyway.

   What the merge buys: one repo in the token's blast radius instead of two.
   `shivinate7.github.io` is a single origin across every Pages project, so
   script from any other project there can read the stored token — the mitigation
   is the fine-grained, Contents-only, now genuinely SINGLE-repo scope.

   `main` rather than the ledger's `data`: see REMOTE above — that branch's
   commit log is the version archive and photo commits must stay out of it.
   Sharing a repo does cost one thing, and push() pays it: GitHub wants ≥1s
   between Contents writes to one repo, so the ledger PUT and the photo PUTs are
   now on the same `spaceWrites()` clock where before they were independent.

   One file per photo, named by id. That is the entire design: a photo path is
   written exactly once by whoever holds it, so photo sync is a set difference
   with no merge, no sha bookkeeping and no conflict possible by construction. */
const PHOTOS = {
  owner: "shivinate7",
  repo: "mailaudit-data",
  branch: "main",
  dir: "photos",
};

/* Deliberately OUTSIDE the "mailday:" namespace above. window.storage.list()
   enumerates that prefix; nothing calls it today, but the day someone adds
   "back up everything in the namespace" the token would be swept into a file
   the user emails to themselves. Keeping it out makes that impossible by
   construction rather than by remembering. */
const REMOTE_KEY = "mailday-remote:v1"; // { token, sha, pushedAt, pulledAt }

function rec() {
  try {
    return JSON.parse(localStorage.getItem(REMOTE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function saveRec(patch) {
  const next = { ...rec(), ...patch };
  localStorage.setItem(REMOTE_KEY, JSON.stringify(next));
  return next;
}

function remoteErr(code, extra) {
  return Object.assign(new Error(code), { code, ...extra });
}

const API = "https://api.github.com";

/* One request. Returns { ok, status, body, headers } or throws `offline`.
   We authenticate with a header rather than cookies, so `credentials` stays at
   its default omit — which is also why this works from file://. */
async function api(path, init = {}) {
  const { token } = rec();
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(init.headers || {}),
  };
  /* sent on reads too: unauthenticated GETs share a 60/hr *per-IP* budget with
     everyone behind the same NAT, authenticated is 5000/hr. It used to be
     optional on reads, because the ledger repo was public and a keyless pull was
     how a fresh device recovered before it had been set up. Both repos are one
     private repo now, so every call here needs the token and a keyless read gets
     a 404 that means "you cannot see this" — see classifyLedger. */
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(API + path, { ...init, headers });
  } catch {
    /* The ONLY place `offline` is decided, and deliberately so. There used to
       be a `navigator.onLine === false` pre-flight above this, which treated a
       browser flag as authoritative — and Chrome on macOS leaves it stuck false
       after a sleep/wake or a VPN interface change. Measured on the laptop:
       onLine false, and this very fetch reaching GitHub and answering 404. The
       app was refusing requests that worked, sync was dead for five days, and
       the only symptom was a banner saying the connection was gone.

       It is the same rule peek(), listPhotos() and classifyLedger() are all
       three-valued for: "I could not look" is not a fact about the world. The
       guard only ever saved a doomed request; a genuinely offline device
       rejects here and gets the identical error one round trip later. */
    throw remoteErr("offline");
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* 5xx and rate-limit pages are sometimes not JSON */
  }
  return { ok: res.ok, status: res.status, body, headers: res.headers };
}

/* Same request, but asking GitHub for the file's own bytes instead of a JSON
   envelope. Returns the Response undigested, because a photo is binary and
   res.json() would be nonsense.

   The raw media type is what keeps photos off the base64 decode path entirely,
   and it sidesteps the Contents API's 1MB cliff: over that size the JSON
   `content` field comes back empty, while raw serves the bytes up to 100MB. */
async function apiRaw(path) {
  const { token } = rec();
  const headers = {
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(API + path, { headers });
  } catch {
    throw remoteErr("offline");
  }
  return res;
}

/* GitHub asks for at least a second between writes to one repo, and caps
   content-generating requests at 80/min and 500/hr. This lives here rather than
   in app.jsx because window.remote is the transport — rate-limit policy is a
   property of the wire, not of the ledger. It also means the test harness,
   which replaces window.remote wholesale, never pays a real second per photo. */
const WRITE_GAP_MS = 1000;
let lastWrite = 0;
async function spaceWrites() {
  const wait = lastWrite + WRITE_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastWrite = Date.now();
}

/* The mapping itself lives in src/remote-rules.mjs so it can be asserted on —
   this wrapper just unpacks the response. Note the 404 is ambiguous on the
   PRIVATE repo everything now lives in: it means both "the file isn't there
   yet" and "this token cannot see the repo", because GitHub hides existence
   rather than admitting a 403. Ledger reads go through classifyLedger, which
   disambiguates; this plain wrapper does not, and its callers are the writes
   and the photo calls, which have a key by definition. */
function classify(res) {
  const { status, body, headers } = res;
  const msg = String(body?.message || "");
  const retryAfter = Number(headers?.get?.("retry-after")) || null;
  const code = classifyStatus(status, msg, {
    retryAfter,
    remaining: headers?.get?.("x-ratelimit-remaining"),
  });
  return remoteErr(code, { status, detail: msg, retryAfter });
}

/* A 404 from the ledger repo is ambiguous the moment that repo is PRIVATE:
   GitHub hides a repo you cannot see rather than admitting a 403, so "no
   ledger has been pushed yet" and "you need a key" arrive identically. The
   photo repo has always had this problem and disambiguates with one extra
   read; the ledger repo inherited it the day it stopped being public.

   Getting this wrong is not cosmetic. `missing` renders as "No ledger has been
   pushed yet" — which, told to someone whose ledger is sitting safely on a
   branch they simply cannot read, is an invitation to push over it or to
   conclude the backup never worked. One request, only on the 404 path, only
   when it matters. */
async function classifyLedger(res) {
  const err = classify(res);
  if (res.status !== 404) return err;
  const repo = await api(`/repos/${REMOTE.owner}/${REMOTE.repo}`);
  /* readable, so the file or branch really is absent — keep the precise code */
  if (repo.ok) return err;
  if (repo.status === 404) return remoteErr("no-access", { status: 404 });
  return classify(repo);
}

window.remote = {
  async target() {
    return { ...REMOTE };
  },
  async status() {
    const r = rec();
    return {
      hasKey: !!r.token,
      sha: r.sha || null,
      pushedAt: r.pushedAt || null,
      pulledAt: r.pulledAt || null,
      /* A DEVICE setting, not ledger data — which is why it lives in this
         record beside the token rather than in the saved state. Whether this
         phone pushes on its own is a property of this phone; syncing it would
         mean the laptop turning the phone's background traffic on. It also
         keeps invariant 2's five-site rule out of it entirely. */
      auto: !!r.auto,
    };
  },
  async setAuto(on) {
    saveRec({ auto: !!on });
  },
  async setKey(token) {
    const t = String(token || "").trim();
    /* catches the commonest paste error (a partial copy, or the wrong string
       entirely) here, where it can say so, instead of as a 401 two taps later */
    if (!/^(github_pat_|ghp_)/.test(t)) throw remoteErr("bad-key");
    saveRec({ token: t });
  },
  async clearKey() {
    saveRec({ token: null });
  },

  /* ---- older versions, read straight off the branch's history ----
     Every push has always been a commit, so the branch IS a version archive —
     this just makes it reachable from the phone. Both calls are READS, so they
     spend nothing from the 500-content-writes/hour budget the push and the
     photos share. Both need the key, like everything else here now that the
     ledger lives in the private repo.

     Deliberately behind an explicit tap in the UI rather than fetched on open:
     it is two round trips for something wanted rarely, and the local list
     already answers "undo what I just did". */
  async listVersions(limit = 30) {
    const res = await api(
      `/repos/${REMOTE.owner}/${REMOTE.repo}/commits?path=${REMOTE.path}` +
        `&sha=${REMOTE.branch}&per_page=${limit}`
    );
    if (!res.ok) throw await classifyLedger(res);
    const rows = Array.isArray(res.body) ? res.body : [];
    return rows.map((c) => ({
      sha: c.sha,
      /* the COMMITTED date, not the authored one: a push is both, but only the
         committed date is what GitHub orders the list by */
      at: Date.parse(c.commit?.committer?.date || c.commit?.author?.date || 0),
      message: c.commit?.message || "",
    }));
  },

  /* The bytes of ledger.json as of one commit. `?ref=` takes any commit-ish,
     so this is the same Contents call `pull` makes with a sha in place of the
     branch name — including the over-1MB fallback, which is why it is worth
     sharing the shape rather than reaching for the raw host. */
  async getVersion(sha) {
    const res = await api(
      `/repos/${REMOTE.owner}/${REMOTE.repo}/contents/${REMOTE.path}?ref=${sha}`
    );
    if (!res.ok) throw await classifyLedger(res);
    const b = res.body || {};
    if (b.encoding === "base64" && b.content) return base64ToUtf8(b.content);
    if (b.download_url) {
      /* `r.ok` and the empty check are both load-bearing, and `pull` has the
         second one for the same reason. download_url is a short-lived signed
         URL; when it 404s or 500s, fetch RESOLVES (it only rejects on network
         failure) and .text() hands back the error body. Returned as-is, that
         reaches parseLedger, throws, and the app blames the user's backup —
         "it looks corrupt" — for what was a transient network failure. */
      let text;
      try {
        const raw = await fetch(b.download_url);
        if (!raw.ok) throw remoteErr("server", { status: raw.status });
        text = await raw.text();
      } catch (e) {
        throw e?.code ? e : remoteErr("offline");
      }
      if (typeof text !== "string" || !text) throw remoteErr("bad-response");
      return text;
    }
    throw remoteErr("bad-response", { status: res.status });
  },

  async pull() {
    const res = await api(
      `/repos/${REMOTE.owner}/${REMOTE.repo}/contents/${REMOTE.path}?ref=${REMOTE.branch}`
    );
    if (!res.ok) throw await classifyLedger(res);
    const b = res.body || {};
    let text;
    if (b.encoding === "base64" && b.content) text = base64ToUtf8(b.content);
    else if (b.download_url) {
      /* files over 1MB come back with content: "" — the sha in this same
         response is still valid, so only the bytes need a second trip */
      try {
        const r2 = await fetch(b.download_url);
        text = await r2.text();
      } catch {
        throw remoteErr("offline");
      }
    } else throw remoteErr("bad-response", { status: res.status });
    if (typeof text !== "string" || !text) throw remoteErr("bad-response");
    /* THE SHA IS NOT SAVED HERE, and that is load-bearing.

       The stored sha is this device's claim to be holding the remote's bytes.
       Writing it the moment they arrive makes the claim true only if the app
       then applies them — and when it doesn't (a payload it rejects, a merge
       that throws, a generation guard that bails), the device is left holding
       a CURRENT sha over STALE data. Its next push carries that sha, GitHub
       accepts it, and the other device's work is destroyed with no conflict
       raised. With auto-push on, that happens within 90 seconds, unattended.

       So the caller accepts it via acceptPull() once the data is genuinely in.
       Failing to accept leaves this device merely behind, which conflicts
       loudly on the next push — the direction this should fail in. */
    return { text, sha: b.sha || null };
  },

  /* Only called after a pull's bytes have actually been applied. */
  async acceptPull(sha) {
    saveRec({ sha: sha || null, pulledAt: Date.now() });
  },

  /* "Has the other device pushed since I last looked?" — for a few hundred
     bytes and no content-generating request.

     The Trees API rather than Contents, for the same reason listPhotos uses it:
     a Contents GET on ledger.json answers with the entire file base64'd (~470KB
     at 1000 lines) merely to report a sha, and this runs on every foreground.
     A tree entry carries the BLOB sha, which is exactly the value push() stores
     from `content.sha` and exactly what r.sha is compared against — so `ahead`
     is a real answer rather than a heuristic. This is a read, against the
     5000/hr authenticated budget, not the 500/hr content-generating one.

     Three-valued like listPhotos, and for a sharper reason: this drives whether
     auto-push is allowed to fire. "I could not look" must never be reported as
     "nothing has changed", because that is precisely the state in which pushing
     overwrites the other device. Unknown means: do not push. */
  async peek() {
    let res;
    try {
      res = await api(
        `/repos/${REMOTE.owner}/${REMOTE.repo}/git/trees/${REMOTE.branch}`
      );
    } catch (e) {
      return { known: false, reason: e?.code || "offline" };
    }
    if (!res.ok) {
      /* the branch or the file simply not being there yet is a real answer:
         nothing has been pushed, so nobody is ahead of us. But on a PRIVATE
         ledger repo a keyless 404 means "you cannot see this", which is the
         opposite — and reading it as "nobody is ahead" is exactly the state in
         which this device would go on pushing over the other one. */
      const err = await classifyLedger(res);
      if (err.code === "missing" || err.code === "no-branch")
        return { known: true, sha: null, ahead: false };
      return { known: false, reason: err.code };
    }
    const tree = Array.isArray(res.body?.tree) ? res.body.tree : [];
    const entry = tree.find((e) => e.path === REMOTE.path && e.type === "blob");
    const sha = entry?.sha || null;
    return { known: true, sha, ahead: !!sha && sha !== (rec().sha || null) };
  },

  async push(text, message, overrideSha) {
    const r = rec();
    if (!r.token) throw remoteErr("no-key");
    /* THE load-bearing line of this whole feature: send the sha THIS DEVICE
       last saw (r.sha), never one fetched a moment ago. See pushBody.

       `overrideSha` is the ONE exception and it belongs to pushForce, which
       has deliberately just looked the remote up. It is passed through rather
       than stored first — storing a sha for bytes that have not been written
       is the exact bug group 35 exists for, and the force door was the last
       place in the codebase still doing it. */
    const body = pushBody({
      text,
      branch: REMOTE.branch,
      sha: overrideSha !== undefined ? overrideSha : r.sha,
      message: message || "ledger",
      encode: utf8ToBase64,
    });
    /* The ledger and the photos live in ONE repo now, and GitHub's "≥1s between
       writes" is per-repo. Before the merge this call could skip the gap because
       it was the only write its repo ever saw; app.jsx pushes the ledger and
       then immediately loops photo uploads, so without this the ledger PUT and
       the first photo PUT land back-to-back and the second 409s. */
    await spaceWrites();
    const res = await api(
      `/repos/${REMOTE.owner}/${REMOTE.repo}/contents/${REMOTE.path}`,
      { method: "PUT", body: JSON.stringify(body) }
    );
    if (!res.ok) throw classify(res);
    /* the BLOB sha (content.sha), not the commit sha — the next PUT needs it */
    const sha = res.body?.content?.sha || null;
    const pushedAt = Date.now();
    saveRec({ sha, pushedAt });
    return { sha, pushedAt };
  },

  /* The only force in the feature, reachable only from a conflict, so a device
     holding the copy worth keeping isn't stuck behind a conflict it could
     otherwise clear only by destroying that copy. Safe-ish because every push
     is a commit: the overwritten version stays in the branch's history. */
  /* ---- photos ----
     Blob in, blob out, ids only. app.jsx never learns that a photo is a file or
     what it is called — the same seam that keeps the string "ledger.json" out
     of it. The id -> filename map below is why: only this layer knows the
     extension, and it is the extension that carries the image type, because a
     raw GET answers with GitHub's media type rather than the file's own. */
  async photoTarget() {
    return { ...PHOTOS };
  },

  /* Populated by listPhotos, read by pullPhoto. Every pull lists before it
     fetches, so this is always warm by the time it is needed. */
  _names: new Map(),

  /* One request, via the Trees API rather than Contents: it returns the whole
     directory with an explicit `truncated` flag and no 1000-entry cap to guess
     at. The Contents endpoint is documented to stop at 1000 files without
     saying what it does past that, and a 403 there would classify as
     `forbidden` — telling the user their perfectly good token needs write
     access.

     THREE-VALUED ON PURPOSE. A 404 means "no photos pushed yet" on a repo you
     can see and "you cannot see this repo" on a private one, because GitHub
     hides existence rather than admitting a 403. Collapsing that to an empty
     set makes a device that simply has no key conclude every photo it owns is
     lost. So on a 404 we ask one cheap follow-up question — can we see the repo
     at all? — and only claim knowledge when we have it. */
  async listPhotos() {
    const res = await api(
      `/repos/${PHOTOS.owner}/${PHOTOS.repo}/git/trees/${PHOTOS.branch}:${PHOTOS.dir}`
    );
    if (res.ok) {
      const tree = Array.isArray(res.body?.tree) ? res.body.tree : [];
      const ids = [];
      const sizes = {};
      window.remote._names = new Map();
      for (const e of tree) {
        if (e.type !== "blob") continue;
        const id = photoIdFromName(e.path);
        if (!id) continue; /* a README or anything else that isn't ours */
        ids.push(id);
        sizes[id] = e.size || 0;
        window.remote._names.set(id, e.path);
      }
      return { known: true, ids, sizes, truncated: !!res.body?.truncated };
    }
    if (res.status === 404) {
      const repo = await api(`/repos/${PHOTOS.owner}/${PHOTOS.repo}`);
      /* the repo is there and readable, so the directory simply doesn't exist
         yet — which is exactly the state of a freshly created backup repo */
      if (repo.ok) {
        window.remote._names = new Map();
        return { known: true, ids: [], sizes: {}, truncated: false };
      }
      return { known: false, reason: repo.status === 404 ? "no-access" : classify(repo).code };
    }
    return { known: false, reason: classify(res).code };
  },

  /* Always a create, so never a sha — see pushBody. A PUT onto a path that
     already holds bytes is success, not a conflict: the photo is immutable and
     addressed by its id, so "already there" means the job is done. That test
     reads the raw status, not the classified code, because classifyStatus folds
     a sha-less 422 and a throttling 409 into the same "conflict" and they mean
     opposite things here. */
  async pushPhoto(id, blob, message) {
    const r = rec();
    if (!r.token) throw remoteErr("no-key");
    const name = photoName(id, blob?.type);
    const body = {
      message: message || `photo ${id}`,
      content: await blobToBase64(blob),
      branch: PHOTOS.branch,
    };
    await spaceWrites();
    const res = await api(
      `/repos/${PHOTOS.owner}/${PHOTOS.repo}/contents/${PHOTOS.dir}/${name}`,
      { method: "PUT", body: JSON.stringify(body) }
    );
    if (res.ok) {
      window.remote._names.set(id, name);
      return { id, skipped: false };
    }
    if (isAlreadyThere(res.status, res.body?.message)) {
      window.remote._names.set(id, name);
      return { id, skipped: true };
    }
    throw classify(res);
  },

  /* NOT res.blob(). That would take its type from the response Content-Type,
     which is GitHub's media type rather than image/jpeg — and that blob flows
     straight into blobToDataUrl on the "Backup + photos" path, which would
     write data:application/vnd.github.raw into the backup file and faithfully
     restore the wrong type later. One pulled photo would quietly poison the
     local backup format. Build the blob from the bytes and the filename. */
  async pullPhoto(id) {
    const name = window.remote._names.get(id) || photoName(id, "image/jpeg");
    const res = await apiRaw(
      `/repos/${PHOTOS.owner}/${PHOTOS.repo}/contents/${PHOTOS.dir}/${name}?ref=${PHOTOS.branch}`
    );
    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {
        /* raw errors are not always JSON */
      }
      throw classify({ ok: false, status: res.status, body, headers: res.headers });
    }
    const bytes = await res.arrayBuffer();
    return new Blob([bytes], { type: mimeFromName(name) });
  },

  async pushForce(text, message) {
    const head = await api(
      `/repos/${REMOTE.owner}/${REMOTE.repo}/contents/${REMOTE.path}?ref=${REMOTE.branch}`
    );
    let sha;
    if (head.ok) sha = head.body?.sha || null;
    else if (head.status === 404) sha = null;
    else throw classify(head);
    /* Handed to the PUT, NOT written to the record first. It used to
       `saveRec({ sha })` right here, which made this the one place left that
       recorded a claim to hold bytes it had not written — and if the PUT then
       failed (offline, throttled, a 409 racing the photo repo), the device sat
       on a current sha over stale data and its next auto-push was ACCEPTED
       with no conflict. That is verbatim the incident in the sha note above,
       reached through the force door instead of the pull. push() records the
       sha itself, once the bytes are actually on GitHub. */
    return window.remote.push(text, message, sha);
  },
};

createRoot(document.getElementById("root")).render(<App />);
