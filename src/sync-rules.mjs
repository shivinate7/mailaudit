/* The pure rules of the Worker sync adapter (stage 4b), pulled out of entry.jsx
   so they can be asserted on. entry.jsx mounts React on import and cannot be
   loaded by the test harness. Same split as remote-rules.mjs. */

/* The device key lives at this raw localStorage key, outside the mailday:
   namespace, so a "back up everything in the namespace" sweep never takes it. */
export const SYNC_KEY_STORAGE = "mailday-sync:v1";

/* a key is the Worker's alphabet and nothing else */
export const KEY_RE = /^[A-Za-z0-9_-]+$/;

/* The key arrives as #k=<key>. Anything outside the alphabet is refused, not
   cleaned: a half-decoded key would 401 later with no hint why. */
export function keyFromHash(hash) {
  for (const part of String(hash || "").replace(/^#/, "").split("&")) {
    if (part.startsWith("k=")) {
      const v = part.slice(2);
      return KEY_RE.test(v) ? v : null;
    }
  }
  return null;
}

/* HTTP status to a code. 404 is "empty": the store is not seeded yet, which is
   normal on a first run. A 5xx or a network failure (null/0) is "unknown",
   never "ok". */
export function syncStatus(status) {
  if (status === 200) return "ok";
  if (status === 401) return "no-access";
  if (status === 404) return "empty";
  if (status === 413) return "too-big";
  if (status === 400) return "bad-shape"; /* the Worker refused the ledger's shape: retrying cannot help */
  return "unknown";
}

export const isNewRev = (have, got) => got > have;

/* a Worker call that has not answered by now counts as unreachable */
export const SYNC_TIMEOUT_MS = 10000;

/* a cold open that finds the server lacking something POSTs this long after the first reply */
export const SYNC_COLD_POST_MS = 500;

/* a POST goes out this long after a change */
export const SYNC_POST_MS = 3000;

/* A pushed rev applies as soon as the owner is not mid-press: the list must not move between a
   finger landing and lifting (no-layout-shift-under-pointer). Hover and scroll never hold.
   A press holds while it is down (at most PRESS_MAX_MS, so a lost pointerup cannot hold for ever)
   and PRESS_TAIL_MS after it ends, the beat in which a tap's own change lands. */
export const PRESS_TAIL_MS = 700;
export const PRESS_MAX_MS = 3000;
export const pressHeld = (downAt, lastAt, now) =>
  (downAt != null && now - downAt < PRESS_MAX_MS) || now - lastAt < PRESS_TAIL_MS;

/* reconnect wait: 1 s, doubling, capped at 60 s */
export const backoffMs = (attempt) => Math.min(1000 * 2 ** attempt, 60000);
