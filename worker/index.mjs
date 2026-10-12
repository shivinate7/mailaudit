/* The Worker and its one Durable Object. Everything with a rule is in core.mjs. */
import { DurableObject } from "cloudflare:workers";
import { route, wsAuthorized } from "./core.mjs";

export class Ledger extends DurableObject {
  /* SQLite-backed storage; one KV value holds the whole ledger (~250KB, the
     per-value cap is 2MB). */
  store = {
    read: () => this.ctx.storage.get("state").then((s) => s ?? null),
    write: (ledger, rev) => this.ctx.storage.put("state", { ledger, rev }),
    photoList: async () => this.ctx.storage.sql.exec("SELECT id FROM photos").toArray().map((r) => r.id),
    photoGet: async (id) => {
      const r = this.ctx.storage.sql.exec("SELECT mime, bytes FROM photos WHERE id = ?", id).toArray()[0];
      return r ? { mime: r.mime, bytes: new Uint8Array(r.bytes) } : null;
    },
    photoPut: async (id, mime, bytes) => {
      this.ctx.storage.sql.exec("INSERT OR IGNORE INTO photos (id, mime, bytes) VALUES (?, ?, ?)", id, mime, bytes);
    },
    broadcast: async (obj) => {
      const msg = JSON.stringify(obj);
      for (const ws of this.ctx.getWebSockets()) {
        try { ws.send(msg); } catch {}
      }
    },
  };

  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes BLOB NOT NULL)");
  }

  async fetch(request) {
    if (new URL(request.url).pathname === "/ws") {
      if (!(await wsAuthorized(request, this.env))) return new Response("unauthorized", { status: 401 });
      if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client, headers: { "Sec-WebSocket-Protocol": "mailaudit" } });
    }
    return route(request, this.env, this.store);
  }
}

export default {
  // Fresh store per sync-revamp-cloudflare. "ledger" is the stage-2 seed and
  // "ledger-v2" is the probe store; rolling back means an older name.
  // A probe deploy sets STORE_NAME (--var STORE_NAME:probe-1) and never touches
  // the real store. wrangler.toml does not set it, so a plain deploy is ledger-v3.
  fetch: (request, env) =>
    env.LEDGER.get(env.LEDGER.idFromName(env.STORE_NAME || "ledger-v3")).fetch(request),
};
