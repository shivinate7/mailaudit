/* The pure half of the sync server: route(request, env, store) -> Response.
   No Worker, no Durable Object, no network. The merge is the app's own. */
import { mergeLedger } from "../src/merge-rules.mjs";

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

/* Durable Object per-value cap is 2MB; refuse a ledger over this, less headroom. */
export const MAX_LEDGER_BYTES = 1.9 * 1024 * 1024;

export async function route(request, env, store) {
  const headers = cors(request, env);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const m = /^Bearer (.+)$/.exec(request.headers.get("Authorization") || "");
  if (!m || !(await keyAllowed(m[1], env))) return json({ error: "unauthorized" }, 401);

  if (new URL(request.url).pathname !== "/ledger") return json({ error: "not found" }, 404);

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

  const cur = await store.read();
  const ledger = cur ? mergeLedger(cur.ledger, incoming).merged : incoming;
  if (new TextEncoder().encode(JSON.stringify(ledger)).length > MAX_LEDGER_BYTES) return json({ error: "too-large" }, 413);
  const rev = (cur?.rev ?? 0) + 1;
  await store.write(ledger, rev);
  await store.broadcast({ rev });
  return json({ ledger, rev });
}
