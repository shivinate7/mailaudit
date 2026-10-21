/* The Worker and its one Durable Object. Everything with a rule is in core.mjs. */
import { DurableObject } from "cloudflare:workers";
import { route, wsAuthorized } from "./core.mjs";

export class Ledger extends DurableObject {
  /* SQLite-backed storage; one KV value holds the whole ledger (~250KB, the
     per-value cap is 2MB). */
  store = {
    read: () => this.ctx.storage.get("state").then((s) => s ?? null),
    write: (ledger, rev, at) => this.ctx.storage.put("state", { ledger, rev, at }),
    hasSnapshot: async (day) => this.sql.exec("SELECT 1 FROM snapshots WHERE day = ?", day).toArray().length > 0,
    writeSnapshot: async (day, { ledger, rev, at }) =>
      void this.sql.exec("INSERT INTO snapshots (day, rev, at, ledger) VALUES (?, ?, ?, ?)", day, rev, at ?? null, JSON.stringify(ledger)),
    readSnapshot: async (day) => {
      const r = this.sql.exec("SELECT rev, at, ledger FROM snapshots WHERE day = ?", day).toArray()[0];
      return r ? { ledger: JSON.parse(r.ledger), rev: r.rev, at: r.at } : null;
    },
    listSnapshots: async () => this.sql.exec("SELECT day, rev, at FROM snapshots").toArray(),
    pruneSnapshots: async (beforeDay) => void this.sql.exec("DELETE FROM snapshots WHERE day < ?", beforeDay),
    writeKept: async (at, { ledger, rev }) =>
      void this.sql.exec("INSERT INTO kept (at, rev, ledger) VALUES (?, ?, ?)", at, rev, JSON.stringify(ledger)),
    readKept: async (at) => {
      const r = this.sql.exec("SELECT rev, ledger FROM kept WHERE at = ?", at).toArray()[0];
      return r ? { ledger: JSON.parse(r.ledger), rev: r.rev } : null;
    },
    listKept: async () => this.sql.exec("SELECT at, rev FROM kept").toArray(),
    pruneKept: async (beforeDay) => void this.sql.exec("DELETE FROM kept WHERE substr(at, 1, 10) < ?", beforeDay),
    photoList: async () => this.ctx.storage.sql.exec("SELECT id, mime FROM photos").toArray().map((r) => ({ id: r.id, mime: r.mime })),
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
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS snapshots (day TEXT PRIMARY KEY, rev INTEGER, at TEXT, ledger TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS kept (at TEXT PRIMARY KEY, rev INTEGER, ledger TEXT)");
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes BLOB NOT NULL)");
  }

  async fetch(request) {
    if (new URL(request.url).pathname === "/ws") {
      if (!(await wsAuthorized(request, this.env))) return new Response("unauthorized", { status: 401 });
      if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server);
      /* a socket that was down across a broadcast heard nothing: tell it the rev now (web/sync-latency) */
      try {
        const cur = await this.store.read();
        if (cur) server.send(JSON.stringify({ rev: cur.rev }));
      } catch {} // the hello is a courtesy: a failure must not fail the upgrade
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
