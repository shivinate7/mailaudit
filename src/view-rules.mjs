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
export function lostMail(date, tracking, done, now = Date.now()) {
  if (done || !/^without tracking$/i.test(tracking || "")) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  const days = Math.floor((now - t) / 86400000);
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

/* ---------- lane S3: filters, pooling, sorts and totals ----------
   Each takes its state and clock as arguments. Sticky rows and the frozen
   sort stay in src/app.jsx (no-layout-shift-under-pointer): the component
   decides WHEN to call a sort, and passes the received map it froze. */

const DAY_MS = 86400000;
const CANCELED = (it) => /^cancel/i.test(it.tracking || "");
const gotOfItem = (it, rec) => Math.min(it.qty, rec[it.key] || 0);

/* the date filter as a {from, to} range, or null for no range */
export function dateRange(filter, now) {
  if (filter.preset === "all") return null;
  if (filter.preset === "custom") {
    const from = filter.from ? Date.parse(filter.from) : null;
    const to = filter.to ? Date.parse(filter.to) + 86399999 : null;
    if (from == null && to == null) return null;
    return { from, to };
  }
  if (filter.preset === "days") {
    const n = parseInt(filter.days, 10);
    if (!n || n <= 0) return null;
    return { from: now - n * DAY_MS, to: null };
  }
  return { from: now - filter.preset * DAY_MS, to: null };
}

export function inRange(items, range) {
  if (!range) return items;
  return items.filter((it) => {
    const t = Date.parse(it.date);
    if (Number.isNaN(t)) return true; // keep undated rows visible
    if (range.from != null && t < range.from) return false;
    if (range.to != null && t > range.to) return false;
    return true;
  });
}

export const dropCanceled = (items) => items.filter((it) => !CANCELED(it));

export const dropGks = (items, gks) =>
  gks.size ? items.filter((it) => !gks.has(gkOf(it))) : items;

export function canceledPackagesOf(items) {
  const map = new Map();
  for (const it of items) {
    if (!CANCELED(it)) continue;
    const gk = gkOf(it);
    if (!map.has(gk))
      map.set(gk, { gk, orderId: it.orderId, seller: it.seller, date: it.date, items: [] });
    map.get(gk).items.push(it);
  }
  const arr = [...map.values()];
  arr.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  return arr;
}

/* callers pass the range-applied, refund-inclusive items, so a refunded
   package is in the stamped list (stamped-filter-on-the-pipeline) */
export const stampedPackagesOf = (items, gks) =>
  groupPackages(items.filter((it) => gks.has(gkOf(it))));

/* Tally: exact product name, pooled across every seller and order.
   basis = price x qty; shipping and tax are not in it. */
export function tallyGroups(items) {
  const map = new Map();
  for (const it of items) {
    if (!map.has(it.name))
      map.set(it.name, { name: it.name, items: [], sets: [], qty: 0 });
    map.get(it.name).items.push(it);
  }
  const arr = [...map.values()];
  for (const g of arr) {
    g.items.sort(
      (a, b) =>
        (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) ||
        a.seller.localeCompare(b.seller)
    );
    g.qty = g.items.reduce((s, it) => s + it.qty, 0);
    g.basis = g.items.reduce((s, it) => s + it.price * it.qty, 0);
    g.avg = g.qty ? g.basis / g.qty : 0;
    g.sets = [...new Set(g.items.map((it) => it.set).filter(Boolean))];
    g.sellerCount = new Set(g.items.map((it) => it.seller)).size;
    g.orderCount = new Set(g.items.map((it) => it.orderId)).size;
  }
  return arr;
}

/* copies still owed, and what they cost, for any level's lines */
export function outstandingOf(items, received) {
  let left = 0,
    value = 0;
  for (const it of items) {
    const out = it.qty - gotOfItem(it, received);
    left += out;
    value += it.price * out;
  }
  return { left, value };
}

export function sortTally(groups, key, received) {
  const gotOf = (g) => g.items.reduce((s, it) => s + gotOfItem(it, received), 0);
  const missingVal = (g) => outstandingOf(g.items, received).value;
  const sorted = [...groups];
  if (key === "basis")
    sorted.sort((a, b) => b.basis - a.basis || a.name.localeCompare(b.name));
  else if (key === "ordered")
    sorted.sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
  else if (key === "value")
    sorted.sort((a, b) => missingVal(b) - missingVal(a) || a.name.localeCompare(b.name));
  else if (key === "rate")
    /* avg = basis / copies, the figure the collapsed row shows; descending */
    sorted.sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));
  else if (key === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else
    sorted.sort(
      (a, b) =>
        b.qty - gotOf(b) - (a.qty - gotOf(a)) ||
        missingVal(b) - missingVal(a) ||
        a.name.localeCompare(b.name)
    );
  return sorted;
}

export function sortPackages(pkgs, key, received) {
  const t = (p) => Date.parse(p.date) || 0;
  const missing = (p) => outstandingOf(p.items, received).value;
  const sorted = [...pkgs];
  if (key === "oldest")
    sorted.sort((a, b) => t(a) - t(b) || a.seller.localeCompare(b.seller));
  else if (key === "value")
    sorted.sort((a, b) => missing(b) - missing(a) || t(b) - t(a));
  else if (key === "rate") {
    /* what one card in this package averaged: basis over copies, 0 at qty 0 */
    const rate = (p) => {
      const q = p.items.reduce((s, it) => s + it.qty, 0);
      return q ? p.items.reduce((s, it) => s + it.price * it.qty, 0) / q : 0;
    };
    sorted.sort((a, b) => rate(b) - rate(a) || t(b) - t(a));
  } else if (key === "seller")
    sorted.sort((a, b) => a.seller.localeCompare(b.seller) || t(b) - t(a));
  else sorted.sort((a, b) => t(b) - t(a) || a.seller.localeCompare(b.seller));
  return sorted;
}

const lineHit = (it, q) =>
  [it.name, it.set, it.seller, it.orderId].join(" ").toLowerCase().includes(q);

/* opts {query, hideDone, received, sticky, revealed, stampText(gk)}; input order kept */
export function filterPackages(pkgs, opts) {
  const { hideDone, received, sticky, revealed, stampText } = opts;
  const q = opts.query.trim().toLowerCase();
  return pkgs
    .map((p) => {
      /* a revealed package ignores the query AND hideDone
         (a-reveal-ignores-hidedone-too) */
      if (revealed.has(p.gk)) return { ...p, hiddenByFilters: 0 };
      // a package in full drops at once under hideDone, even with sticky lines
      if (hideDone && p.items.every((it) => (received[it.key] || 0) >= it.qty))
        return { ...p, items: [], hiddenByFilters: 0 };
      /* a stamp is the package's, so a hit on its text keeps every line */
      const pkgHit = !!q && stampText(p.gk).toLowerCase().includes(q);
      let its = p.items;
      if (q && !pkgHit) its = its.filter((it) => lineHit(it, q));
      if (hideDone)
        its = its.filter((it) => (received[it.key] || 0) < it.qty || sticky.has(it.key));
      return { ...p, items: its, hiddenByFilters: p.items.length - its.length };
    })
    .filter((p) => p.items.length > 0);
}

/* a Tally row keeps its counts; only the `shown` copies are narrowed */
export function filterTally(groups, opts) {
  const { hideDone, received, sticky } = opts;
  const q = opts.query.trim().toLowerCase();
  return groups
    .map((g) => {
      /* an item row is one line in a long scan: a just-checked copy keeps it */
      const allDone = g.items.every((it) => (received[it.key] || 0) >= it.qty);
      if (hideDone && allDone && !g.items.some((it) => sticky.has(it.key)))
        return { ...g, shown: [] };
      let shown = g.items;
      if (q) shown = shown.filter((it) => lineHit(it, q));
      if (hideDone)
        shown = shown.filter((it) => (received[it.key] || 0) < it.qty || sticky.has(it.key));
      return { ...g, shown };
    })
    .filter((g) => g.shown.length > 0);
}

export function totalsOf(items, received) {
  let total = 0,
    got = 0,
    missingVal = 0,
    val = 0;
  for (const it of items) {
    const g = gotOfItem(it, received);
    total += it.qty;
    got += g;
    val += it.price * it.qty;
    missingVal += it.price * (it.qty - g);
  }
  return { total, got, missingVal, val };
}

export function outstandingNames(items, received) {
  const map = new Map();
  for (const it of items) {
    const out = it.qty - gotOfItem(it, received);
    if (out <= 0) continue;
    const nk = normName(it.name);
    if (!map.has(nk)) map.set(nk, { nk, name: it.name, qty: 0, sellers: new Set() });
    const e = map.get(nk);
    e.qty += out;
    e.sellers.add(it.seller);
  }
  return [...map.values()].map(({ nk, name, qty, sellers }) => ({
    nk,
    name,
    qty,
    sellerCount: sellers.size,
  }));
}

export const packagesDone = (pkgs, received) =>
  pkgs.filter((p) => p.items.every((it) => gotOfItem(it, received) >= it.qty)).length;

/* Lane N5: the check-in toggle and the "N of M" label. Swift calls both through
   RulesEngine (rules-run-in-javascriptcore). A line that is in toggles to 0, else to qty. */
export const isDone = (got, qty) => got >= qty;
export const toggleCount = (got, qty) => (isDone(got, qty) ? 0 : qty);
export const countLabel = (got, qty) => `${Math.min(got, qty)} of ${qty}`;

/* Lane N6: one money format for both clients (rules-run-in-javascriptcore). Rounded half up on
   the decimal value, shifted by exponent so 1.005 is $1.01 and 0.125 is $0.13; toFixed and
   Swift's formatted() round the binary value or half to even and would differ. Fixed to en-US so a
   phone and a laptop in different locales print the same figure. */
export const money = (n) => {
  const [m, e = 0] = String(Math.abs(n)).split("e");
  const cents = Math.round(Number(`${m}e${+e + 2}`));
  return `$${n < 0 ? "-" : ""}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* Compact money for the masthead tallies, where three figures share one row at
   375px and cents are noise. Whole dollars under 1k, then k / M with at most
   two decimals and trailing zeros trimmed: 27, 101, 4k, 63.45k, 1.2M.
   Lane N8: one home for the web and the native masthead. Only for display — `money()` stays the format everywhere a figure is meant to
   be read exactly. */
export const compact = (n) => {
  const a = Math.abs(n);
  const trim = (x) => String(Math.round(x * 100) / 100);
  if (a >= 1e6) return `${trim(n / 1e6)}M`;
  if (a >= 1e3) return `${trim(n / 1e3)}k`;
  return String(Math.round(n));
};

/* Lane N15: the package card's text forms, one home for the web and native cards.
   TCGplayer's buyer order-history page, searched by order id (owner ruling 2026-10-21).
   Whether the page honours SearchString is unconfirmed; debt tcgplayer-link-opens-history-list. */
export const tcgplayerOrderUrl = (id) =>
  `https://store.tcgplayer.com/myaccount/orderhistory?SearchString=${encodeURIComponent(id)}`;

/* "N left · $X" for the copies a package still owes, or null when none is. N counts copies
   and an over-count clamps per line (outstandingOf). X is whole dollars with grouping from
   $100, else cents; en-US so a phone and a laptop print the same figure. */
export function packagePill(items, received) {
  const { left, value } = outstandingOf(items, received);
  if (left <= 0) return null;
  const x = value >= 100 ? `$${Math.round(value).toLocaleString("en-US")}` : `$${value.toFixed(2)}`;
  return `${left} left · ${x}`;
}

/* An item row's detail line: "×qty" when more than one, then set, finish and condition,
   empty ones left out; an em dash when nothing is left. */
export const itemDetail = (it) =>
  [it.qty > 1 ? `×${it.qty}` : "", it.set, it.finish, it.condition].filter(Boolean).join(" · ") || "\u2014";

/* The mono got/qty read-out of a line with more than one copy, as the web stepper prints it;
   null for a one-copy line, which has none. An over-count clamps, as countLabel does. */
export const gotQty = (got, qty) => (qty > 1 ? `${Math.min(got, qty)}/${qty}` : null);

/* Lane B1 (saved-state-shape, native-ledger-is-raw-json): keep every entry of a
   ledger that can be read, drop the rest. Pure: data -> { data, dropped }; the
   input is never changed. Checked fields are received and receivedAt (counts and
   times, numbers), stamps (objects), envelopes (objects with a string id). A field
   that is absent is not damage; a field of the wrong shape, JSON null included,
   is dropped whole and counts 1. Each dropped entry counts 1. */
const isRecord = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const SALVAGE = {
  received: (v) => typeof v === "number" && Number.isFinite(v),
  receivedAt: (v) => typeof v === "number" && Number.isFinite(v),
  stamps: isRecord,
  envelopes: (e) => isRecord(e) && typeof e.id === "string",
};
export function salvageLedger(data) {
  if (!isRecord(data)) return { data, dropped: 0 };
  const out = { ...data };
  let dropped = 0;
  for (const [k, ok] of Object.entries(SALVAGE)) {
    const v = data[k];
    if (v === undefined) continue;
    if (k === "envelopes") {
      if (!Array.isArray(v)) {
        delete out[k];
        dropped++;
      } else {
        out[k] = v.filter(ok);
        dropped += v.length - out[k].length;
      }
    } else if (!isRecord(v)) {
      delete out[k];
      dropped++;
    } else {
      out[k] = Object.fromEntries(Object.entries(v).filter(([, x]) => ok(x)));
      dropped += Object.keys(v).length - Object.keys(out[k]).length;
    }
  }
  return { data: out, dropped };
}

/* ---------- Card in Hand (duo-hand-rules) ----------
   Pure rules for the Duo's card-name entry. State comes in as arguments; none reads the clock
   except through `now`. They reuse the web's matchers (lineHit, matchEnvelope, lostMail). */

const copiesOut = (it, received) => it.qty > gotOfItem(it, received);

/* items still owed copies, in a package that is neither canceled nor refunded */
const openItems = (items, received, refundedGks) =>
  dropGks(dropCanceled(items), refundedGks).filter((it) => copiesOut(it, received));

/* handHits: gk of each open package with a line the typed text hits, groupPackages order */
export function handHits(items, query, received, refundedGks) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return groupPackages(openItems(items, received, refundedGks).filter((it) => lineHit(it, q))).map((p) => p.gk);
}

/* handStep: {action: post|hold|none, gk, plan, held}. A name two open envelopes share is held
   until the next card names one envelope that also holds it. */
export function handStep(items, received, refundedGks, held, typed) {
  const open = openItems(items, received, refundedGks);
  const envelopesOf = (nk) => groupPackages(open.filter((it) => normName(it.name) === nk));
  /* the envelope with all its open lines, not only the ones that name the typed card */
  const whole = (p) => groupPackages(open).find((q) => q.gk === p.gk);
  const nk = normName(typed);
  const hk = held ? normName(held) : null;
  const hold = (h) => ({ action: "hold", gk: null, plan: null, held: h });
  const post = (pkg, entries, h) => ({
    action: "post",
    gk: pkg.gk,
    plan: matchEnvelope(entries, whole(pkg), received).plan,
    held: h,
  });
  if (!nk) return hk ? hold(hk) : { action: "none", gk: null, plan: null, held: null };
  const mine = envelopesOf(nk);
  if (!hk || hk === nk) {
    if (mine.length >= 2) return hold(nk);
    if (mine.length === 0) return hk ? hold(hk) : { action: "none", gk: null, plan: null, held: null };
    /* a held name typed again is two cards; matchEnvelope caps it at the copies out */
    return post(mine[0], [{ name: typed, qty: hk ? 2 : 1 }], null);
  }
  if (mine.length !== 1) return hold(hk);
  const pkg = mine[0];
  if (!envelopesOf(hk).some((p) => p.gk === pkg.gk)) return post(pkg, [{ name: typed, qty: 1 }], hk);
  return post(pkg, [{ name: held, qty: 1 }, { name: typed, qty: 1 }], null);
}

/* pastTransit: untracked, unreceived, unstamped packages at 14+ days, oldest last */
export function pastTransit(items, received, stampedGks, now) {
  const rows = [];
  for (const p of groupPackages(dropCanceled(items))) {
    if (!isUntracked(p) || stampedGks.has(p.gk) || !p.items.some((it) => copiesOut(it, received))) continue;
    const lost = lostMail(p.date, p.tracking, false, now);
    if (!lost) continue;
    /* the order's calendar date, read as written, so the zone never shifts it */
    const t = new Date(Date.parse(p.date));
    const [, y, m, d] = /^(\d{4})-(\d\d)-(\d\d)/.exec(p.date) || [0, t.getFullYear(), t.getMonth() + 1, t.getDate()];
    const claimBy = new Date(Date.UTC(y, m - 1, +d + 30)).toISOString().slice(0, 10);
    rows.push({ gk: p.gk, tier: lost.tier, days: lost.days, claimBy });
  }
  return rows;
}
