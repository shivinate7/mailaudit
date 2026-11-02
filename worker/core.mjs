/* The pure half of the sync server: route(request, env, store) -> Response.
   No Worker, no Durable Object, no network. The merge is the app's own. */
import { mergeLedger, canon } from "../src/merge-rules.mjs";
import { salvageLedger } from "../src/view-rules.mjs";
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

  if (request.method === "GET" && path === "/kept") {
    const all = await store.listKept();
    return json(all.map(({ at, rev }) => ({ at, rev })).sort((a, b) => (a.at < b.at ? 1 : -1)));
  }
  const km = /^\/kept\/([^/]+)$/.exec(path);
  if (request.method === "GET" && km) {
    const k = await store.readKept(decodeURIComponent(km[1]));
    return k ? json({ ledger: k.ledger, rev: k.rev }) : json({ error: "not found" }, 404);
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

  if (request.method === "GET" && path === "/orders/status")
    return json((await store.readOrdersStatus()) ?? { lastSuccessAt: null, lastFailure: null, complete: false });

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
  const r = await mergeIntoStore(incoming, store, now);
  return json(r.body, r.status);
}

/* The one merge path: POST /ledger and the orders job both end here.
   `refresh` (the job only) maps a key to the shipping status the page shows now. A stored line
   whose key is in it takes that status and nothing else; a CSV import passes none, so its merge
   keeps the stored status. Returns {status, body}. */
export async function mergeIntoStore(incoming, store, now, refresh = null) {
  if (!incoming || incoming.mailday !== 1 || !Array.isArray(incoming.items))
    return { status: 400, body: { error: "bad ledger" } };
  /* a received, receivedAt, stamps or envelopes of the wrong shape never reaches the store */
  if (salvageLedger(incoming).dropped) return { status: 400, body: { error: "bad ledger" } };

  /* a stored ledger saved before the shape check shipped is mended before the merge;
     the original is kept below */
  const stored = await store.read();
  const mend = stored ? salvageLedger(stored.ledger) : null;
  const cur = mend?.dropped ? { ...stored, ledger: mend.data } : stored;
  const base =
    refresh && cur
      ? { ledger: { ...cur.ledger, items: cur.ledger.items.map((it) => (refresh.get(it.key) && refresh.get(it.key) !== it.tracking ? { ...it, tracking: refresh.get(it.key) } : it)) } }
      : cur;
  const merge = base ? mergeLedger(base.ledger, incoming) : null;
  const ledger = merge ? merge.merged : incoming;
  // No merge runs against an empty store, so there is nothing to count.
  const stats = merge ? merge.stats : mergeLedger({}, {}).stats;
  if (new TextEncoder().encode(JSON.stringify(ledger)).length > MAX_LEDGER_BYTES) return { status: 413, body: { error: "too-large" } };
  if (cur && !mend.dropped && canon(ledger) === canon(cur.ledger)) return { status: 200, body: { ledger, rev: cur.rev, stats } };
  const rev = (cur?.rev ?? 0) + 1;
  const day = dayOf(now);
  /* a mend always keeps the damaged original, whatever the snapshots hold */
  if (mend?.dropped) await store.writeKept(new Date(now).toISOString(), { ledger: stored.ledger, rev: stored.rev });
  if (cur && !(await store.hasSnapshot(day))) await store.writeSnapshot(day, { ledger: stored.ledger, rev: stored.rev, at: stored.at });
  await store.pruneSnapshots(dayOf(now - (SNAPSHOT_DAYS - 1) * DAY_MS));
  await store.pruneKept(dayOf(now - (SNAPSHOT_DAYS - 1) * DAY_MS));
  await store.write(ledger, rev, new Date(now).toISOString());
  await store.broadcast({ rev });
  return { status: 200, body: { ledger, rev, stats } };
}
