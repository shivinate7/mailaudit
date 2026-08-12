import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import { utf8ToBase64, base64ToUtf8 } from "./b64.mjs";
import { classifyStatus, pushBody } from "./remote-rules.mjs";

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
    };
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
    saveRec({ sha: b.sha || null, pulledAt: Date.now() });
    return { text, sha: b.sha || null };
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
