import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import { utf8ToBase64, base64ToUtf8, blobToBase64 } from "./b64.mjs";
import { classifyStatus, pushBody } from "./remote-rules.mjs";
import { photoName, photoIdFromName, mimeFromName, isAlreadyThere } from "./photo-rules.mjs";

/* ============================================================
   Platform layer. app.jsx never touches a storage API directly —
   it goes through window.storage (the ledger), window.photos
   (envelope photos) and window.remote (the GitHub backup).
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

/* ---- remote backup: the GitHub Contents API ----
   TRANSPORT, not storage. localStorage stays the source of truth; this is a
   manual, tap-triggered push/pull so the ledger survives losing the phone, ITP
   evicting script-writable storage, or moving to another origin. Nothing here
   is automatic — see the note on `sha` below for why continuous sync was not
   the design.

   Target lives in one object so switching to a private data repo later is a
   constant swap and nothing else. `data` and not `main` on purpose: Pages
   deploys from main's root, so pushing the ledger there would trigger a site
   rebuild on every backup. */
const REMOTE = {
  owner: "shivinate7",
  repo: "mailaudit",
  branch: "data",
  path: "ledger.json",
};

/* Photos go somewhere else, and the somewhere else is PRIVATE. A mailing label
   carries a delivery address, a sender and a tracking number; the ledger repo
   is public and git is permanent, so the two cannot share a home. The ledger
   stays public precisely so a device with no key can still recover the
   irreplaceable part — see the note on a token-free pull in api() below.

   `main` rather than an orphan branch: this repo serves no Pages site, so there
   is nothing a push here could rebuild, and a README-initialised default branch
   is one less setup step to get wrong.

   One file per photo, named by id. That is the entire design: a photo path is
   written exactly once by whoever holds it, so photo sync is a set difference
   with no merge, no sha bookkeeping and no conflict possible by construction. */
const PHOTOS = {
  owner: "shivinate7",
  repo: "mailaudit-photos",
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
     everyone behind the same NAT, authenticated is 5000/hr. Absent a token the
     read still works on a public repo, which is what makes a token-free pull on
     a fresh device possible. */
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw remoteErr("offline");
  let res;
  try {
    res = await fetch(API + path, { ...init, headers });
  } catch {
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
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw remoteErr("offline");
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
   this wrapper just unpacks the response. Note on a PUBLIC repo a 404 means
   the file isn't there yet; on a private one it is also what a token with no
   access sees, since GitHub hides existence. Worth knowing if REMOTE is ever
   pointed at one. */
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

  async pull() {
    const res = await api(
      `/repos/${REMOTE.owner}/${REMOTE.repo}/contents/${REMOTE.path}?ref=${REMOTE.branch}`
    );
    if (!res.ok) throw classify(res);
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
         nothing has been pushed, so nobody is ahead of us */
      const code = classify(res).code;
      if (code === "missing" || code === "no-branch")
        return { known: true, sha: null, ahead: false };
      return { known: false, reason: code };
    }
    const tree = Array.isArray(res.body?.tree) ? res.body.tree : [];
    const entry = tree.find((e) => e.path === REMOTE.path && e.type === "blob");
    const sha = entry?.sha || null;
    return { known: true, sha, ahead: !!sha && sha !== (rec().sha || null) };
  },

  async push(text, message) {
    const r = rec();
    if (!r.token) throw remoteErr("no-key");
    /* THE load-bearing line of this whole feature: send the sha THIS DEVICE
       last saw (r.sha), never one fetched a moment ago. See pushBody. */
    const body = pushBody({
      text,
      branch: REMOTE.branch,
      sha: r.sha,
      message: message || "ledger",
      encode: utf8ToBase64,
    });
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
    if (head.ok) saveRec({ sha: head.body?.sha || null });
    else if (head.status === 404) saveRec({ sha: null });
    else throw classify(head);
    return window.remote.push(text, message);
  },
};

createRoot(document.getElementById("root")).render(<App />);
