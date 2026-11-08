/* One order-history page -> OrderWand-shaped rows (parse). POST /orders in core.mjs runs it on each
   page the extension posts, then the shared parseItems keeps the TCG purchases (parser-filters).
   Pure: no fetch, no store, no secret. */

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
/* The number in a price cell, or null when it is not one. A caller that needs the value never
   defaults it; the shipping and tax summary cells, which feed no stored field, read null as "0". */
const num = (s) => {
  const v = s.replace(/[$,\s]/g, "");
  return /^-?\d+(\.\d+)?$/.test(v) ? v : null;
};
const money = (s) => num(s) ?? "0";
/* the four texts the page shows -> OrderWand's four statuses */
function shipStatus(s) {
  const t = s.toLowerCase();
  if (t.includes("without tracking")) return "without tracking";
  if (t.includes("with tracking")) return "with tracking";
  if (t.includes("cancel")) return "canceled";
  /* text this code does not know is blank, not "unknown": the refresh skips a blank, so a markup
     change cannot reset good statuses across the ledger */
  return t.includes("not confirmed") ? "unknown" : "";
}
const GRADE = /^(near mint|lightly played|moderately played|heavily played|damaged)\b\s*(.*)$/i;

/* HTML of one order-history page -> { orderIds, rows, unreadable }.
   orderIds: the id of each order on the page. rows: OrderWand-column rows, one per readable order
   line, in page order. Item number is the line's 1-based position in its order, dropped lines
   included, as the CSV has it. unreadable: how many lines were dropped because their price or
   quantity is not a number or they have no product id. A dropped line is never given a default. */
export function parse(html) {
  const out = [];
  const orderIds = [];
  let unreadable = 0;
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
    orderIds.push(id);

    /* the last summary span holds the seller and the shipping status; the status is its last title */
    const block = all(w, (n) => n.name === "span" && cls(n, "orderSummary")).pop();
    const titles = block ? all(block, (n) => cls(n, "orderTitle")) : [];
    const trackEl = first(w, (n) => /trackingnumber$/i.test(n.attrs["data-aid"] || "")) || titles[titles.length - 1];
    const status = trackEl ? shipStatus(squash(textOf(trackEl))) : "";
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
      const price = num(textOf(cell("orderHistoryPrice") || ""));
      const qty = squash(textOf(cell("orderHistoryQuantity") || ""));
      if (price === null || !/^\d+$/.test(qty) || !pid) {
        unreadable++;
        return;
      }
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
        Price: price,
        Quantity: qty,
        Party: soldA ? squash(textOf(soldA)) : orderSeller,
        "Shipping Status": status,
        "Vendor Product Id": pid,
        "Shipping Amount": shipping,
        "Tax Amount": tax,
      };
      out.push(row);
    });
  }
  return { orderIds, rows: out, unreadable };
}
