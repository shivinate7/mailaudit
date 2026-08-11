import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

/* ============================================================
   Platform layer. app.jsx never touches a storage API directly —
   it goes through window.storage (the ledger) and window.photos
   (envelope photos). Keeping them apart matters: the ledger is a
   single small JSON blob that must save fast on every keystroke,
   and photos are megabytes that must never get near it.
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

createRoot(document.getElementById("root")).render(<App />);
