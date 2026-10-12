/* The pure half of the sync server: route(request, env, store) -> Response.
   No Worker, no Durable Object, no network. The merge is the app's own. */
import { mergeLedger, canon } from "../src/merge-rules.mjs";
import { photoIdFromName, mimeFromName, photoName } from "../src/photo-rules.mjs";

const hex = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/* True when sha256(key) is one of the comma-joined hashes in DEVICE_KEY_HASHES.
   Shared by the Bearer check and the WebSocket protocol check. */
export async function keyAllowed(key, env) {
  if (!key) return false;
  const h = await hex(key);
  let hit = false;
  for (const x of (env.DEVICE_KEY_HASHES || "").split(",")) {
    const want = x.trim();
    if (want.length !== h.length) continue;
    let d = 0;
    for (let i = 0; i < h.length; i++) d |= h.charCodeAt(i) ^ want.charCodeAt(i);
    if (d === 0) hit = true;
  }
  return hit;
}

/* A browser cannot set Authorization on a WebSocket, so the key rides in
   Sec-WebSocket-Protocol as "mailaudit, <key>". Returns true when valid. */
export async function wsAuthorized(request, env) {
  const parts = (request.headers.get("Sec-WebSocket-Protocol") || "")
    .split(",")
    .map((s) => s.trim());
  return parts.length === 2 && parts[0] === "mailaudit" && keyAllowed(parts[1], env);
}

function cors(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  return origin && allowed.includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        Vary: "Origin",
      }
    : {};
}

/* Durable Object per-value cap is 2,000,000 bytes; refuse a ledger over this, which keeps 200,000 bytes of headroom. */
export const MAX_LEDGER_BYTES = 1_800_000;

/* Keep today and the 179 days before it: exactly 180 snapshots. */
export const SNAPSHOT_DAYS = 180;
const DAY_MS = 864e5;
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

/* A photo is one SQLite row; keep it under the 2,000,000 byte row cap with headroom. */
export const MAX_PHOTO_BYTES = 1_900_000;

/* A field may be absent (older saves). A wrong shape, or null, is damage: refuse, store nothing.
   No shared shape rule exists in src/ to reuse. */
const isMap = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const shapeOk = (l) =>
  ["received", "receivedAt", "stamps"].every((f) => l[f] === undefined || isMap(l[f])) &&
  (l.envelopes === undefined || Array.isArray(l.envelopes));

export async function route(request, env, store, now = Date.now()) {
  const headers = cors(request, env);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/health") return json({ at: (await store.read())?.at ?? null });

  const m = /^Bearer (.+)$/.exec(request.headers.get("Authorization") || "");
  if (!m || !(await keyAllowed(m[1], env))) return json({ error: "unauthorized" }, 401);

  if (request.method === "GET" && path === "/snapshots") {
    const all = await store.listSnapshots();
    return json(all.map(({ day, rev, at }) => ({ day, rev, at })).sort((a, b) => (a.day < b.day ? 1 : -1)));
  }
  const sm = /^\/snapshots\/([^/]+)$/.exec(path);
  if (request.method === "GET" && sm) {
    const snap = await store.readSnapshot(sm[1]);
    return snap ? json({ ledger: snap.ledger, rev: snap.rev, at: snap.at }) : json({ error: "not found" }, 404);
  }

  if (path === "/photos" || path.startsWith("/photos/")) {
    if (request.method !== "GET" && request.method !== "POST") return json({ error: "method not allowed" }, 405);
    if (path === "/photos") {
      return request.method === "GET" ? json({ ids: (await store.photoList()).map((r) => photoName(r.id, r.mime)) }) : json({ error: "method not allowed" }, 405);
    }
    // Ids are base36/hex, never percent-encoded: refuse a % rather than decode it.
    const name = path.slice(8);
    if (name.includes("%")) return json({ error: "bad photo name" }, 400);
    const id = photoIdFromName(name);
    if (!id) return json({ error: "bad photo name" }, 400);
    if (request.method === "GET") {
      const p = await store.photoGet(id);
      return p ? new Response(p.bytes, { headers: { ...headers, "Content-Type": p.mime } }) : json({ error: "not found" }, 404);
    }
    if (Number(request.headers.get("Content-Length")) > MAX_PHOTO_BYTES) return json({ error: "photo-too-large" }, 413);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length > MAX_PHOTO_BYTES) return json({ error: "photo-too-large" }, 413);
    // Write-once: an id already stored keeps its first bytes.
    if (!(await store.photoGet(id))) await store.photoPut(id, mimeFromName(name), bytes);
    return json({ id });
  }

  if (path !== "/ledger") return json({ error: "not found" }, 404);

  if (request.method === "GET") {
    const cur = await store.read();
    return cur ? json({ ledger: cur.ledger, rev: cur.rev }) : json({ error: "empty" }, 404);
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

  let incoming;
  try {
    incoming = (await request.json())?.ledger;
  } catch {
    return json({ error: "bad body" }, 400);
  }
  if (!incoming || incoming.mailday !== 1 || !Array.isArray(incoming.items))
    return json({ error: "bad ledger" }, 400);
  if (!shapeOk(incoming)) return json({ error: "bad shape" }, 400);

  const cur = await store.read();
  const merge = cur ? mergeLedger(cur.ledger, incoming) : null;
  const ledger = merge ? merge.merged : incoming;
  // No merge runs against an empty store, so there is nothing to count.
  const stats = merge ? merge.stats : mergeLedger({}, {}).stats;
  if (new TextEncoder().encode(JSON.stringify(ledger)).length > MAX_LEDGER_BYTES) return json({ error: "too-large" }, 413);
  if (cur && canon(ledger) === canon(cur.ledger)) return json({ ledger, rev: cur.rev, stats });
  const rev = (cur?.rev ?? 0) + 1;
  const day = dayOf(now);
  if (cur && !(await store.hasSnapshot(day))) await store.writeSnapshot(day, { ledger: cur.ledger, rev: cur.rev, at: cur.at });
  await store.pruneSnapshots(dayOf(now - (SNAPSHOT_DAYS - 1) * DAY_MS));
  await store.write(ledger, rev, new Date(now).toISOString());
  await store.broadcast({ rev });
  return json({ ledger, rev, stats });
}
