/* Pure view rules: no React, no DOM, so JavaScriptCore can run them
   (rules-run-in-javascriptcore). src/app.jsx imports them. */

function normalizeRow(row) {
  const out = {};
  for (const k of Object.keys(row)) out[k.trim().toLowerCase()] = row[k];
  return out;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseItems(rows) {
  const items = [];
  rows.forEach((raw, i) => {
    const r = normalizeRow(raw);
    const type = (r["type"] || "").trim().toLowerCase();
    if (type && type !== "purchase") return; // skip sales rows
    const vendor = (r["vendor"] || "").trim();
    if (vendor && !/^tcg/i.test(vendor)) return; // TCGplayer only (skip eBay etc.)
    const name = decodeEntities((r["product name"] || "").trim());
    if (!name) return;
    const orderId = (r["order id"] || "unknown").trim();
    const seller = decodeEntities(
      (r["party"] || r["seller"] || "Unknown seller").trim()
    );
    const itemNumber = (r["item number"] || String(i)).trim();
    const productId = (r["vendor product id"] || "").trim();
    let set = decodeEntities((r["set name"] || "").trim());
    if (/^sold by /i.test(set)) set = ""; // TCGplayer Direct quirk
    const cond = (r["condition"] || "").trim();
    items.push({
      key: `${orderId}|${itemNumber}|${productId}`,
      orderId,
      seller,
      name,
      set,
      condition: /^unknown$/i.test(cond) ? "" : cond,
      finish: (r["finish"] || "").trim(),
      qty: Math.max(1, parseInt(r["quantity"], 10) || 1),
      price: parseFloat(r["price"]) || 0,
      date: (r["ordered at"] || "").trim(),
      tracking: (r["shipping status"] || "").trim(),
      line: (r["product line"] || "").trim(),
    });
  });
  return items;
}

/* lost-mail heuristics for untracked, unreceived mail:
   14d ≈ TCGplayer est. delivery window + grace; 30d = refund deadline floor */
export function lostMail(date, tracking, done) {
  if (done || !/^without tracking$/i.test(tracking || "")) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days >= 30) return { tier: "deadline", days };
  if (days >= 14) return { tier: "maybe", days };
  return null;
}

/* ---------- Orphaned mail ---------- */

/* Names are matched loosely on purpose. iOS smart punctuation turns a typed
   ' into ’, so "Urza’s Saga" off the phone would never equal the CSV's
   "Urza's Saga" under a plain compare. Also collapses "Fire // Ice". */
export function normName(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Æther / Jötun / Séance
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const isUntracked = (p) => /^without tracking$/i.test(p.tracking || "");

/* A package's identity: one order from one seller. Written in many places
   (grouping, filters, the Tally view's "show me this order" jump), so every
   site calls this one function and they cannot drift — a gk that disagrees
   with the one in `packages` silently matches nothing. */
export const gkOf = (it) => `${it.orderId}::${it.seller}`;

export function groupPackages(source) {
  const map = new Map();
  for (const it of source) {
    const gk = gkOf(it);
    if (!map.has(gk))
      map.set(gk, {
        gk,
        orderId: it.orderId,
        seller: it.seller,
        date: it.date,
        tracking: it.tracking,
        items: [],
      });
    map.get(gk).items.push(it);
  }
  const arr = [...map.values()];
  arr.forEach((p) => p.items.sort((a, b) => a.name.localeCompare(b.name)));
  arr.sort(
    (a, b) =>
      (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) ||
      a.seller.localeCompare(b.seller)
  );
  return arr;
}

/* What an envelope's contents can and can't explain about one package.
   Returns the score AND the exact check-ins it would apply, so what the user
   is shown and what gets written can never drift apart. */
export function matchEnvelope(entries, pkg, received) {
  /* pool the package's still-outstanding copies by name — this is what makes
     qty>1 lines and two separate lines of the same card the same case */
  const pool = new Map();
  let poolTotal = 0;
  for (const it of pkg.items) {
    const out = it.qty - Math.min(it.qty, received[it.key] || 0);
    if (out <= 0) continue;
    const nk = normName(it.name);
    if (!pool.has(nk)) pool.set(nk, { qty: 0, slots: [] });
    const b = pool.get(nk);
    b.qty += out;
    b.slots.push({ key: it.key, out });
    poolTotal += out;
  }

  const plan = [];
  const perEntry = {};
  let matchedQty = 0;
  let entriesTotal = 0;
  for (const e of entries) {
    entriesTotal += e.qty;
    const nk = normName(e.name);
    const b = pool.get(nk);
    if (!b) continue;
    /* greedy is exact here rather than an approximation: entry names are
       unique by normName within an envelope, so no two entries can ever
       compete for the same pool bucket */
    let want = Math.min(e.qty, b.qty);
    perEntry[nk] = want;
    matchedQty += want;
    for (const slot of b.slots) {
      if (want <= 0) break;
      const take = Math.min(want, slot.out);
      if (take > 0) {
        plan.push({ itemKey: slot.key, take });
        want -= take;
      }
    }
  }
  return { matchedQty, entriesTotal, poolTotal, plan, perEntry };
}

/* Ranks the packages an envelope could have come from. It never picks one:
   near-duplicate packages are real (the same commons from different sellers),
   so a confident-looking single answer would be a lie. Ties are reported. */
export function rankCandidates(entries, pkgs, received) {
  const list = [];
  for (const pkg of pkgs) {
    const m = matchEnvelope(entries, pkg, received);
    if (m.matchedQty <= 0) continue; // never offer a package that explains nothing
    list.push({
      pkg,
      ...m,
      pkgLeft: m.poolTotal - m.matchedQty, // cards this package is still owed
      envLeft: m.entriesTotal - m.matchedQty, // cards this package can't explain
      exact: m.poolTotal === m.matchedQty && m.entriesTotal === m.matchedQty,
    });
  }
  list.sort(
    (a, b) =>
      b.matchedQty - a.matchedQty ||
      a.pkgLeft - b.pkgLeft ||
      a.envLeft - b.envLeft ||
      /* nothing below here is a claim about which package is likelier — it
         only fixes a stable render order among equally-good candidates */
      (isUntracked(b.pkg) ? 1 : 0) - (isUntracked(a.pkg) ? 1 : 0) ||
      (Date.parse(a.pkg.date) || 0) - (Date.parse(b.pkg.date) || 0) ||
      a.pkg.gk.localeCompare(b.pkg.gk)
  );

  const top = list[0];
  const tied = top
    ? list.filter(
        (c) =>
          c.matchedQty === top.matchedQty &&
          c.pkgLeft === top.pkgLeft &&
          c.envLeft === top.envLeft
      ).length
    : 0;
  /* every entry at least one candidate could account for — the rest are
     cards with no outstanding copy anywhere (freebie, mis-ship, pre-history) */
  const explainable = new Set();
  for (const c of list)
    for (const nk of Object.keys(c.perEntry))
      if (c.perEntry[nk] > 0) explainable.add(nk);
  return { list, tied, explainable };
}
