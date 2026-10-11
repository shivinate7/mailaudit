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
  return "unknown";
}

export const isNewRev = (have, got) => got > have;

/* a Worker call that has not answered by now counts as unreachable */
export const SYNC_TIMEOUT_MS = 10000;

/* a cold open that finds the server lacking something POSTs this long after the first reply */
export const SYNC_COLD_POST_MS = 500;

/* a POST goes out this long after a change */
export const SYNC_POST_MS = 3000;

/* a pushed rev is applied only after the device has sat idle this long */
export const IDLE_APPLY_MS = 10000;
export const idleReady = (lastActivity, now) => now - lastActivity >= IDLE_APPLY_MS;

/* reconnect wait: 1 s, doubling, capped at 60 s */
export const backoffMs = (attempt) => Math.min(1000 * 2 ** attempt, 60000);
