/* The Worker and its one Durable Object. Everything with a rule is in core.mjs. */
import { DurableObject } from "cloudflare:workers";
import { route, wsAuthorized } from "./core.mjs";

export class Ledger extends DurableObject {
  /* SQLite-backed storage; one KV value holds the whole ledger (~250KB, the
     per-value cap is 2MB). */
  store = {
    read: () => this.ctx.storage.get("state").then((s) => s ?? null),
    write: (ledger, rev) => this.ctx.storage.put("state", { ledger, rev }),
    broadcast: async (obj) => {
      const msg = JSON.stringify(obj);
      for (const ws of this.ctx.getWebSockets()) {
        try { ws.send(msg); } catch {}
      }
    },
  };

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
  fetch: (request, env) => env.LEDGER.get(env.LEDGER.idFromName("ledger-v3")).fetch(request),
};
