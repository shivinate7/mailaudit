/* The orders job: TCGplayer purchase history -> the ledger. Pure apart from the injected fetch
   and store, so node tests run it. Pages become OrderWand-shaped rows (parse), the shared
   parseItems keeps the TCG purchases (parser-filters), and mergeIntoStore is POST /ledger's
   merge (imports-merge-never-replace). The cookie is read once, sent once per request, and
   never logged, stored or returned (the-token-is-a-credential). */
import { parseItems } from "../src/view-rules.mjs";
import { mergeIntoStore } from "./core.mjs";

/* ---------- a small HTML reader: runs in Workers and in node, no dependency ----------
   Tags and attributes are read by hand so a quoted ">" or "//" stays text, a comment opens
   nothing, and script and style bodies are skipped whole. Not a full HTML5 parser: no implied
   end tags (the order-history markup closes everything it opens). */
const VOID = new Set(["br", "img", "input", "hr", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);
const RAW = new Set(["script", "style"]);
const WS = /\s/;

function readHtml(html) {
  const root = { name: "#root", attrs: {}, kids: [] };
  const stack = [root];
  const text = (s) => {
    const kids = stack[stack.length - 1].kids;
    if (typeof kids[kids.length - 1] === "string") kids[kids.length - 1] += s;
    else kids.push(s);
  };
  const tag = /<(\/?)([a-zA-Z][^\s/>]*)/y;
  const n = html.length;
  let i = 0;
  while (i < n) {
    const lt = html.indexOf("<", i);
    if (lt < 0) {
      text(html.slice(i));
      break;
    }
    if (lt > i) text(html.slice(i, lt));
    i = lt;
    if (html.startsWith("<!--", i)) {
      const e = html.indexOf("-->", i + 4);
      i = e < 0 ? n : e + 3;
      continue;
    }
    tag.lastIndex = i;
    const m = tag.exec(html);
    if (!m) {
      if (html[i + 1] === "!" || html[i + 1] === "?") {
        const e = html.indexOf(">", i);
        i = e < 0 ? n : e + 1;
      } else {
        text("<");
        i++;
      }
      continue;
    }
    const name = m[2].toLowerCase();
    i += m[0].length;
    if (m[1]) {
      const e = html.indexOf(">", i);
      i = e < 0 ? n : e + 1;
      for (let d = stack.length - 1; d > 0; d--)
        if (stack[d].name === name) {
          stack.length = d;
          break;
        }
      continue;
    }
    const attrs = Object.create(null);
    for (;;) {
      while (i < n && (WS.test(html[i]) || html[i] === "/")) i++;
      if (i >= n) break;
      if (html[i] === ">") {
        i++;
        break;
      }
      const s = i;
      while (i < n && !WS.test(html[i]) && html[i] !== "=" && html[i] !== "/" && html[i] !== ">") i++;
      const key = html.slice(s, i).toLowerCase();
      while (i < n && WS.test(html[i])) i++;
      let val = "";
      if (html[i] === "=") {
        i++;
        while (i < n && WS.test(html[i])) i++;
        const q = html[i];
        if (q === '"' || q === "'") {
          const e = html.indexOf(q, i + 1);
          val = html.slice(i + 1, e < 0 ? n : e);
          i = e < 0 ? n : e + 1;
        } else {
          const s2 = i;
          while (i < n && !WS.test(html[i]) && html[i] !== ">") i++;
          val = html.slice(s2, i);
        }
      }
      if (key && !(key in attrs)) attrs[key] = val;
    }
    const node = { name, attrs, kids: [] };
    stack[stack.length - 1].kids.push(node);
    if (RAW.has(name)) {
      const end = new RegExp(`</${name}`, "gi");
      end.lastIndex = i;
      const e = end.exec(html);
      i = e ? e.index : n;
    } else if (!VOID.has(name)) stack.push(node);
  }
  return root;
}

const isEl = (k) => typeof k !== "string";
const cls = (n, c) => (n.attrs.class || "").split(/\s+/).includes(c);
function* walk(n) {
  for (const k of n.kids)
    if (isEl(k)) {
      yield k;
      yield* walk(k);
    }
}
const first = (n, f) => {
  for (const x of walk(n)) if (f(x)) return x;
};
const all = (n, f) => [...walk(n)].filter(f);
/* <br> reads as a newline; entities stay as written, as in an OrderWand file (parseItems decodes them) */
const textOf = (n) => (typeof n === "string" ? n : n.name === "br" ? "\n" : n.kids.map(textOf).join(""));
const ownText = (n) => n.kids.filter((k) => typeof k === "string").join("");
const squash = (s) => s.replace(/\s+/g, " ").trim();

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
function isoDay(s) {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(s.trim());
  const mo = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return mo < 0 ? s.trim() : `${m[3]}-${String(mo + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}
const money = (s) => {
  const v = s.replace(/[$,\s]/g, "");
  return /^-?\d+(\.\d+)?$/.test(v) ? v : "0";
};
/* the four texts the page shows -> OrderWand's four statuses */
function shipStatus(s) {
  const t = s.toLowerCase();
  if (t.includes("without tracking")) return "without tracking";
  if (t.includes("with tracking")) return "with tracking";
  if (t.includes("cancel")) return "canceled";
  return "unknown";
}
const GRADE = /^(near mint|lightly played|moderately played|heavily played|damaged)\b\s*(.*)$/i;

/* HTML of one order-history page -> OrderWand-column rows, one per order line, in page order.
   Item number is the line's 1-based position in its order, as the CSV has it. */
export function parse(html) {
  const out = [];
  const wraps = [];
  (function find(n) {
    for (const k of n.kids)
      if (isEl(k)) {
        if (k.name === "div" && cls(k, "orderWrap")) wraps.push(k);
        else find(k);
      }
  })(readHtml(String(html ?? "")));

  for (const w of wraps) {
    const header = first(w, (n) => n.name === "div" && cls(n, "orderHeader"));
    if (!header) continue;
    /* the header's spans are date, source, order number, buttons: found by position and by which
       one holds bare text (the number), not by title wording */
    const spans = header.kids.filter((k) => isEl(k) && k.name === "span");
    const dateEl = spans[0] && first(spans[0], (x) => x.name === "span" && !cls(x, "orderTitle"));
    const date = dateEl ? isoDay(squash(textOf(dateEl))) : "";
    const idSpan = spans.find((sp) => squash(ownText(sp)));
    const id = idSpan ? squash(ownText(idSpan)) : "";
    const direct = !!idSpan && /direct/i.test(textOf(first(idSpan, (x) => cls(x, "orderTitle")) || ""));
    if (!id) continue;

    /* the last summary span holds the seller and the shipping status; the status is its last title */
    const block = all(w, (n) => n.name === "span" && cls(n, "orderSummary")).pop();
    const titles = block ? all(block, (n) => cls(n, "orderTitle")) : [];
    const trackEl = first(w, (n) => /trackingnumber$/i.test(n.attrs["data-aid"] || "")) || titles[titles.length - 1];
    const status = trackEl ? shipStatus(squash(textOf(trackEl))) : "unknown";
    /* a TCGplayer Direct order names no seller up here; each line says "Sold by X" */
    const sellerA = !direct && block && first(block, (n) => n.name === "a" && cls(n, "nocontext"));
    const orderSeller = sellerA ? squash(textOf(sellerA)) : "";

    const sum = first(w, (n) => n.name === "table" && !cls(n, "orderTable"));
    const amount = (re) => {
      for (const tr of sum ? all(sum, (n) => n.name === "tr") : []) {
        const tds = tr.kids.filter((k) => isEl(k) && k.name === "td");
        if (tds.length > 1 && re.test(squash(textOf(tds[0])))) return money(textOf(tds[1]));
      }
      return "0";
    };
    const shipping = amount(/^shipping:?$/i);
    const tax = amount(/^sales tax/i);

    const table = first(w, (n) => n.name === "table" && cls(n, "orderTable"));
    const lines = table ? all(table, (n) => n.name === "tr" && n.kids.some((k) => isEl(k) && k.name === "td" && cls(k, "orderHistoryItems"))) : [];
    lines.forEach((tr, idx) => {
      const cell = (c) => tr.kids.find((k) => isEl(k) && k.name === "td" && cls(k, c));
      const items = cell("orderHistoryItems");
      const nameA = first(items, (n) => n.name === "a" && cls(n, "nocontext"));
      const holder = nameA && first(items, (n) => n.name === "span" && n.kids.includes(nameA));
      /* the set is the first bare text beside the name link; the listing note and "Sold by" sit in elements */
      const set = holder ? squash(holder.kids.filter((k) => typeof k === "string" && k.trim()).slice(0, 1).join("")) : "";
      const sold = first(items, (n) => cls(n, "orderSoldby"));
      const soldA = sold && first(sold, (n) => n.name === "a");
      const pid = /\/(\d+)_[^/]*$/.exec(first(items, (n) => n.name === "img")?.attrs.src || "")?.[1] ?? "";
      const cond = textOf(cell("orderHistoryDetail") || "").split("\n").map(squash).find((l) => /^condition:/i.test(l));
      const grade = GRADE.exec((cond || "").replace(/^condition:\s*/i, ""));
      const row = {
        Type: "purchase",
        Vendor: "TCG",
        "Order Id": id,
        "Ordered At": date,
        "Item Number": String(idx + 1),
        "Product Name": nameA ? textOf(nameA).trim() : "",
        "Set Name": set,
        Condition: grade ? grade[1] : (cond || "").replace(/^condition:\s*/i, ""),
        Finish: grade ? grade[2] : "",
        Price: money(textOf(cell("orderHistoryPrice") || "")),
        Quantity: squash(textOf(cell("orderHistoryQuantity") || "")),
        Party: soldA ? squash(textOf(soldA)) : orderSeller,
        "Shipping Status": status,
        "Vendor Product Id": pid,
        "Shipping Amount": shipping,
        "Tax Amount": tax,
      };
      out.push(row);
    });
  }
  return out;
}

/* ---------- the job ---------- */
const PAGE_URL = "https://store.tcgplayer.com/myaccount/orderhistory?PageNumber=";
/* The free plan allows 50 subrequests a run. 40 page fetches plus the one hop from the schedule
   to the Durable Object stay under it. */
export const MAX_PAGES = 40;
const LOGON = /log\s?on|log\s?in|sign\s?in/i;

/* Pages newest first and merges what it read. Returns {kind} on failure or {complete} on success. */
async function pull(env, store, fetchFn, prev, now) {
  const cookie = env.TCG_COOKIE;
  if (typeof cookie !== "string" || !cookie) return { kind: "no-cookie" };
  const stored = (await store.read())?.ledger?.items;
  const known = new Set(Array.isArray(stored) ? stored.map((i) => i?.key) : []);
  const items = [];
  let kind = null;
  let complete = false;
  for (let page = 1; page <= MAX_PAGES; page++) {
    let rows;
    try {
      const res = await fetchFn(PAGE_URL + page, { method: "GET", redirect: "manual", headers: { Cookie: cookie, Accept: "text/html" } });
      if (res.status >= 300 && res.status < 400) {
        kind = LOGON.test(res.headers.get("location") || "") ? "signed-out" : "other";
        break;
      }
      if (!res.ok) {
        kind = "other";
        break;
      }
      rows = parse(await res.text());
    } catch {
      kind = "other";
      break;
    }
    if (!rows.length) {
      /* an empty first page is a failure (a logon form served with 200 looks the same); an empty later page is the end */
      if (page === 1) kind = "empty";
      else complete = true;
      break;
    }
    const got = parseItems(rows);
    items.push(...got);
    /* an all-known page ends the run only if the last run left no gap behind it */
    if (prev?.complete === true && got.every((i) => known.has(i.key))) {
      complete = true;
      break;
    }
  }
  /* what was read before a failure is still merged */
  if (items.length) {
    const refresh = new Map(items.map((i) => [i.key, i.tracking]));
    const r = await mergeIntoStore({ mailday: 1, items, received: {}, envelopes: [], stamps: {} }, store, now, refresh);
    if (r.status !== 200) kind ||= "other";
  }
  return kind ? { kind } : { complete };
}

/* Never rejects: a failed run is recorded as the status, not thrown. Nothing here logs. */
export async function runOrders(env, store, fetchFn, now = Date.now()) {
  const at = new Date(now).toISOString();
  let prev = null;
  let out;
  try {
    prev = await store.readOrdersStatus();
    out = await pull(env, store, fetchFn, prev, now);
  } catch {
    out = { kind: "other" };
  }
  const status = out.kind
    ? { lastSuccessAt: prev?.lastSuccessAt ?? null, lastFailure: { kind: out.kind, at }, complete: false }
    : { lastSuccessAt: at, lastFailure: null, complete: out.complete };
  try {
    await store.writeOrdersStatus(status);
  } catch {}
  return status;
}
