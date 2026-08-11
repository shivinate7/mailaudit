import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Papa from "papaparse";

/* ============================================================
   MAIL DAY LEDGER — OrderWand CSV check-in tracker
   Palette: cool paper, pine ink, stamp green, signal red, manila
   ============================================================ */

const C = {
  paper: "#F4F5F2",
  card: "#FFFFFF",
  ink: "#1C2B24",
  inkSoft: "#5A6B62",
  line: "#DDE1DA",
  green: "#2E7D4F",
  greenSoft: "#E7F2EB",
  red: "#C0442B",
  redSoft: "#F9ECE8",
  manila: "#EFE6CF",
  manilaInk: "#7A6A3E",
  amber: "#A8720E",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const sans = "'Avenir Next', 'Segoe UI', system-ui, -apple-system, sans-serif";

const money = (n) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STORAGE_KEY = "mailday:v1";

/* ---------- CSV helpers ---------- */

function normalizeRow(row) {
  const out = {};
  for (const k of Object.keys(row)) out[k.trim().toLowerCase()] = row[k];
  return out;
}

function pickColumn(r, ...names) {
  for (const n of names) {
    if (r[n] != null && String(r[n]).trim() !== "") return String(r[n]).trim();
  }
  return "";
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseItems(rows) {
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
    const seller = (r["party"] || r["seller"] || "Unknown seller").trim();
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
function lostMail(date, tracking, done) {
  if (done || !/^without tracking$/i.test(tracking || "")) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days >= 30) return { tier: "deadline", days };
  if (days >= 14) return { tier: "maybe", days };
  return null;
}

/* ---------- Mystery mail ---------- */

/* Names are matched loosely on purpose. iOS smart punctuation turns a typed
   ' into ’, so "Urza’s Saga" off the phone would never equal the CSV's
   "Urza's Saga" under a plain compare. Also collapses "Fire // Ice". */
function normName(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Æther / Jötun / Séance
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

let envSeq = 0;
const newEnvelopeId = () =>
  `env-${Date.now().toString(36)}-${(envSeq++).toString(36)}`;
const newPhotoId = () =>
  `pho-${Date.now().toString(36)}-${(envSeq++).toString(36)}`;

const bytes = (n) =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(1)} GB`
    : n >= 1e6
    ? `${Math.round(n / 1e6)} MB`
    : `${Math.round(n / 1e3)} KB`;

/* A photo here is a mailing label you need to READ later, so it keeps enough
   resolution for a tracking number — 2000px is plenty and still lands a few
   hundred KB, which IndexedDB doesn't care about. Falls back to the original
   file if anything about the canvas path fails. */
const MAX_EDGE = 2000;
function shrinkImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 800000) return resolve(file);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.8);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });

async function dataUrlToBlob(url) {
  try {
    const res = await fetch(url);
    return await res.blob();
  } catch {
    return null;
  }
}

const isUntracked = (p) => /^without tracking$/i.test(p.tracking || "");

function groupPackages(source) {
  const map = new Map();
  for (const it of source) {
    const gk = `${it.orderId}::${it.seller}`;
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
function matchEnvelope(entries, pkg, received) {
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
function rankCandidates(entries, pkgs, received) {
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

/* ---------- Small UI atoms ---------- */

function ProgressBar({ pct, height = 8 }) {
  return (
    <div
      style={{
        height,
        background: C.line,
        borderRadius: height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: pct >= 100 ? C.green : C.ink,
          borderRadius: height,
          transition: "width 240ms ease",
        }}
      />
    </div>
  );
}

/* ---------- Item row ---------- */

function ItemRow({ item, got, onSet, variant = "package" }) {
  const done = got >= item.qty;
  const partial = got > 0 && !done;
  const toggle = () => onSet(item.key, done ? 0 : item.qty);
  /* in the by-item view the name is the group heading, so the row leads with
     where this copy came from instead */
  const source = variant === "source";
  const title = source ? item.seller : item.name;
  const meta = (item.qty > 1 ? [`×${item.qty}`] : [])
    .concat(
      (source
        ? [item.date, item.set, item.finish, item.condition]
        : [item.set, item.finish, item.condition]
      ).filter(Boolean)
    )
    .join(" · ");
  const lost = source ? lostMail(item.date, item.tracking, done) : null;
  return (
    <div
      onClick={toggle}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderTop: `1px solid ${C.line}`,
        background: done ? C.greenSoft : "transparent",
        transition: "background 160ms ease",
        cursor: "pointer",
      }}
    >
      {/* check indicator (whole row is tappable) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        aria-label={done ? "Mark as not received" : "Mark as received"}
        style={{
          width: 30,
          height: 30,
          marginTop: 1,
          flexShrink: 0,
          borderRadius: 8,
          border: `2px solid ${done ? C.green : partial ? C.manilaInk : C.inkSoft}`,
          background: done ? C.green : partial ? C.manila : "#fff",
          color: done ? "#fff" : C.manilaInk,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
        }}
      >
        {done ? "✓" : partial ? "–" : ""}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.35,
              color: done ? C.inkSoft : C.ink,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <span
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: C.inkSoft,
              flexShrink: 0,
            }}
          >
            ${item.price.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11.5,
            color: C.inkSoft,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lost && (
            <span
              style={{
                color: lost.tier === "deadline" ? C.red : C.amber,
                fontWeight: 700,
              }}
            >
              ⚠ {lost.days}d ·{" "}
            </span>
          )}
          {meta || "—"}
        </div>
        {/* order ids are long; on its own line it never loses the tail to
            ellipsis, and it's the key for chasing a refund */}
        {source && (
          <div
            style={{
              marginTop: 1,
              fontFamily: mono,
              fontSize: 10.5,
              color: C.inkSoft,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={item.orderId}
          >
            {item.orderId}
          </div>
        )}
        {item.qty > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: mono,
              fontSize: 13,
              cursor: "default",
            }}
          >
            <button
              onClick={() => onSet(item.key, Math.max(0, got - 1))}
              style={stepBtn}
              aria-label="One fewer received"
            >
              –
            </button>
            <span
              style={{
                minWidth: 44,
                textAlign: "center",
                color: partial ? C.manilaInk : C.ink,
                fontWeight: partial ? 700 : 400,
              }}
            >
              {got}/{item.qty}
            </span>
            <button
              onClick={() => onSet(item.key, Math.min(item.qty, got + 1))}
              style={stepBtn}
              aria-label="One more received"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const stepBtn = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: "#fff",
  color: C.ink,
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  padding: 0,
};

/* ---------- Package (order + seller) group ---------- */

function PackageCard({ pkg, received, onSet, onBulk }) {
  const totalQty = pkg.items.reduce((s, it) => s + it.qty, 0);
  const gotQty = pkg.items.reduce(
    (s, it) => s + Math.min(it.qty, received[it.key] || 0),
    0
  );
  const done = gotQty >= totalQty;
  const [open, setOpen] = useState(!done);
  const tracked = /^with tracking$/i.test(pkg.tracking || "")
    ? "tracked"
    : /^without tracking$/i.test(pkg.tracking || "")
    ? "untracked"
    : null;
  const missingVal = pkg.items.reduce(
    (s, it) => s + it.price * (it.qty - Math.min(it.qty, received[it.key] || 0)),
    0
  );
  const missingValLabel =
    missingVal >= 100
      ? `$${Math.round(missingVal).toLocaleString()}`
      : `$${missingVal.toFixed(2)}`;
  const lost = lostMail(pkg.date, pkg.tracking, done);

  return (
    <div
      style={{
        position: "relative",
        background: C.card,
        border: `1px solid ${done ? C.green : C.line}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(28,43,36,0.06)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: C.inkSoft,
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 140ms ease",
            display: "inline-block",
            flexShrink: 0,
          }}
        >
          ▶
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pkg.seller}
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: C.inkSoft,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={pkg.orderId}
          >
            {lost?.tier === "deadline" && (
              <span style={{ color: C.red, fontWeight: 700 }}>
                ⚠ {lost.days}d — refund window closing, contact seller ·{" "}
              </span>
            )}
            {lost?.tier === "maybe" && (
              <span style={{ color: C.amber, fontWeight: 700 }}>
                ⚠ {lost.days}d — may be lost ·{" "}
              </span>
            )}
            {pkg.date && `${pkg.date} · `}
            {tracked === "tracked" && (
              <>
                <span style={{ color: C.green }}>●</span> tracked ·{" "}
              </>
            )}
            {tracked === "untracked" && (
              <>
                <span style={{ color: C.manilaInk }}>○</span> untracked ·{" "}
              </>
            )}
            {pkg.orderId}
          </div>
        </div>
        {done ? (
          <span
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: C.green,
              border: `2px solid ${C.green}`,
              borderRadius: 4,
              padding: "3px 8px",
              transform: "rotate(-4deg)",
              flexShrink: 0,
              background: "#fff",
            }}
          >
            RECEIVED
          </span>
        ) : (
          <span
            style={{
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 700,
              color: C.red,
              background: C.redSoft,
              borderRadius: 999,
              padding: "3px 10px",
              flexShrink: 0,
            }}
          >
            {totalQty - gotQty} left · {missingValLabel}
          </span>
        )}
      </button>

      {gotQty > 0 && !done && (
        <div style={{ padding: "0 14px 10px" }}>
          <ProgressBar pct={(gotQty / totalQty) * 100} height={5} />
        </div>
      )}

      {open && (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "0 14px 8px",
              justifyContent: "flex-end",
            }}
          >
            {!done && (
              <button onClick={() => onBulk(pkg.items, true)} style={miniBtn}>
                Mark all received
              </button>
            )}
            {gotQty > 0 && (
              <button onClick={() => onBulk(pkg.items, false)} style={miniBtn}>
                Clear check-ins
              </button>
            )}
          </div>
          {pkg.items.map((it) => (
            <ItemRow
              key={it.key}
              item={it}
              got={Math.min(it.qty, received[it.key] || 0)}
              onSet={onSet}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- Item total (same product name across every seller) ---------- */

function ItemTotalRow({ item, received, onSet, onBulk }) {
  const totalQty = item.qty;
  const gotQty = item.items.reduce(
    (s, it) => s + Math.min(it.qty, received[it.key] || 0),
    0
  );
  const done = gotQty >= totalQty;
  const [open, setOpen] = useState(false);
  const missingVal = item.items.reduce(
    (s, it) => s + it.price * (it.qty - Math.min(it.qty, received[it.key] || 0)),
    0
  );
  /* counts always cover every copy of the item; only the breakdown is filtered */
  const hiddenCopies = item.items.length - item.shown.length;
  const setLabel =
    item.sets.length === 0
      ? ""
      : item.sets.length === 1
      ? item.sets[0]
      : `${item.sets[0]} +${item.sets.length - 1} more`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const copies = (n) => `${n} cop${n === 1 ? "y" : "ies"}`;
  /* counts first: they're short and always survive, while a long set list
     degrades to an ellipsis — and each copy's set is in the breakdown anyway */
  const meta = [plural(item.sellerCount, "seller"), plural(item.orderCount, "order"), setLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${done ? C.green : C.line}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(28,43,36,0.06)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: C.inkSoft,
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 140ms ease",
            display: "inline-block",
            flexShrink: 0,
          }}
        >
          ▶
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.3,
              color: C.ink,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: C.inkSoft,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 15,
              fontWeight: 700,
              color: done ? C.green : C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {gotQty}/{totalQty}
            {done ? " ✓" : ""}
          </div>
          {/* labelled, so it never reads as the red outstanding figure below */}
          <div
            style={{
              fontFamily: mono,
              fontSize: 11.5,
              color: C.inkSoft,
              whiteSpace: "nowrap",
            }}
          >
            {money(item.basis)} basis
          </div>
          {!done && (
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                color: C.red,
                whiteSpace: "nowrap",
              }}
            >
              {totalQty - gotQty} left · {money(missingVal)}
            </div>
          )}
        </div>
      </button>

      {gotQty > 0 && !done && (
        <div style={{ padding: "0 14px 10px" }}>
          <ProgressBar pct={(gotQty / totalQty) * 100} height={5} />
        </div>
      )}

      {open && (
        <>
          <div
            style={{
              padding: "0 14px 6px",
              fontFamily: mono,
              fontSize: 10.5,
              color: C.inkSoft,
            }}
          >
            {money(item.basis)} across {copies(totalQty)} · {money(item.avg)} avg
            {hiddenCopies > 0 &&
              ` · ${copies(hiddenCopies)} hidden by filters`}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "0 14px 8px",
              justifyContent: "flex-end",
            }}
          >
            {!done && (
              <button onClick={() => onBulk(item.items, true)} style={miniBtn}>
                Mark all received
              </button>
            )}
            {gotQty > 0 && (
              <button onClick={() => onBulk(item.items, false)} style={miniBtn}>
                Clear check-ins
              </button>
            )}
          </div>
          {item.shown.map((it) => (
            <ItemRow
              key={it.key}
              item={it}
              got={Math.min(it.qty, received[it.key] || 0)}
              onSet={onSet}
              variant="source"
            />
          ))}
        </>
      )}
    </div>
  );
}

const dateInput = {
  fontFamily: mono,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 6,
  border: `1px solid ${C.line}`,
  background: "#fff",
  color: C.ink,
};

const miniBtn = {
  fontFamily: mono,
  fontSize: 11.5,
  padding: "8px 12px",
  borderRadius: 5,
  border: `1px solid ${C.line}`,
  background: "#fff",
  color: C.ink,
  cursor: "pointer",
};

/* ---------- Upload zone ---------- */

function UploadZone({ onFile, error, replacing }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      style={{
        border: `2px dashed ${drag ? C.green : C.inkSoft}`,
        borderRadius: 12,
        background: drag ? C.greenSoft : C.card,
        padding: "42px 24px",
        textAlign: "center",
        transition: "all 140ms ease",
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 8 }}>📬</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>
        Drop your OrderWand CSV here
      </div>
      <div style={{ fontSize: 13, color: C.inkSoft, margin: "6px 0 16px" }}>
        {replacing
          ? "CSV imports merge with what\u2019s here; a .json backup restores everything."
          : "In OrderWand: pick \u201COrderWand CSV\u201D from the drop list, click File, then bring it here."}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 14,
          background: C.ink,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {error && (
        <div
          style={{
            marginTop: 14,
            color: C.red,
            background: C.redSoft,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            display: "inline-block",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/* ---------- Notice banner ---------- */

function Notice({ children, actionLabel, onAction, onDismiss }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: C.greenSoft,
        border: `1px solid ${C.green}`,
        color: C.ink,
        borderRadius: 8,
        padding: "9px 12px",
        fontSize: 13,
        marginBottom: 14,
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{ ...miniBtn, fontSize: 11.5, padding: "5px 10px", flexShrink: 0 }}
        >
          {actionLabel}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: C.inkSoft,
            fontSize: 14,
            padding: 2,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* ---------- Envelope photos ---------- */

/* Resolves photo ids to object URLs and revokes them on the way out — leaking
   these keeps whole images alive in memory for the life of the page. */
function usePhotoUrls(ids) {
  const key = (ids || []).join(",");
  const [urls, setUrls] = useState({});
  useEffect(() => {
    let dead = false;
    const made = [];
    (async () => {
      const next = {};
      for (const id of ids || []) {
        const blob = await window.photos?.get(id).catch(() => null);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        made.push(url);
        next[id] = url;
      }
      if (dead) made.forEach((u) => URL.revokeObjectURL(u));
      else setUrls(next);
    })();
    return () => {
      dead = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

function PhotoStrip({ ids, onRemove }) {
  const urls = usePhotoUrls(ids);
  const [zoom, setZoom] = useState("");
  if (!ids?.length) return null;
  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ids.map((id) => (
          <div key={id} style={{ position: "relative" }}>
            <button
              onClick={() => setZoom(id)}
              aria-label="View photo"
              style={{
                width: 56,
                height: 56,
                padding: 0,
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: urls[id] ? `url(${urls[id]}) center/cover` : C.manila,
                cursor: "pointer",
                display: "block",
              }}
            />
            {onRemove && (
              <button
                onClick={() => onRemove(id)}
                aria-label="Remove photo"
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  lineHeight: "20px",
                  borderRadius: 999,
                  border: `1px solid ${C.line}`,
                  background: "#fff",
                  color: C.red,
                  fontSize: 12,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {zoom && urls[zoom] && (
        <div
          onClick={() => setZoom("")}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,43,36,0.92)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            cursor: "zoom-out",
          }}
        >
          <img
            src={urls[zoom]}
            alt="Envelope photo"
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }}
          />
        </div>
      )}
    </>
  );
}

/* ---------- Envelope composer ---------- */

/* Draft state lives here, not in the app: re-rendering the whole ledger on
   every keystroke drops characters with the iOS keyboard up. */
function EnvelopeComposer({ initial, suggestions, onSave, onCancel }) {
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState(() =>
    (initial?.entries || []).map((e) => ({ ...e }))
  );
  const [note, setNote] = useState(initial?.note || "");
  const [photos, setPhotos] = useState(() => [...(initial?.photos || [])]);
  const [busy, setBusy] = useState(false);
  const camera = useRef(null);

  /* photos land in IndexedDB immediately; the envelope only ever carries ids.
     An orphan (added, then Cancel) is cleaned up by the sweep in the app. */
  const addPhoto = async (file) => {
    if (!file || !window.photos) return;
    setBusy(true);
    try {
      const blob = await shrinkImage(file);
      const id = newPhotoId();
      await window.photos.put(id, blob);
      setPhotos((p) => [...p, id]);
    } catch {
      /* out of space or an unreadable image — the envelope still saves */
    } finally {
      setBusy(false);
    }
  };

  const addName = (name) => {
    const nk = normName(name);
    if (!nk) return;
    setEntries((prev) => {
      const i = prev.findIndex((e) => normName(e.name) === nk);
      if (i === -1) return [{ name: name.trim(), qty: 1 }, ...prev];
      /* a re-tapped card bumps its count and jumps to the top, so the number
         you just changed is where you're already looking */
      const bumped = { ...prev[i], qty: prev[i].qty + 1 };
      return [bumped, ...prev.slice(0, i), ...prev.slice(i + 1)];
    });
    setDraft("");
  };

  const setQty = (nk, n) =>
    setEntries((prev) =>
      n <= 0
        ? prev.filter((e) => normName(e.name) !== nk)
        : prev.map((e) => (normName(e.name) === nk ? { ...e, qty: n } : e))
    );

  const q = normName(draft);
  const tokens = q ? q.split(" ") : [];
  const matches = q
    ? suggestions
        .filter((s) => tokens.every((t) => s.nk.includes(t)))
        .map((s) => ({
          s,
          rank: s.nk.startsWith(q) ? 0 : s.nk.includes(` ${q}`) ? 1 : 2,
        }))
        .sort(
          (a, b) =>
            a.rank - b.rank ||
            b.s.qty - a.s.qty ||
            a.s.name.localeCompare(b.s.name)
        )
        .slice(0, 6)
        .map((m) => m.s)
    : [];
  const exactHit = matches.some((s) => s.nk === q);
  const total = entries.reduce((s, e) => s + e.qty, 0);

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.ink}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(28,43,36,0.06)",
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.inkSoft,
          padding: "12px 14px 8px",
        }}
      >
        {initial ? "Edit envelope" : "New envelope"}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addName(draft);
        }}
        style={{ padding: "0 14px" }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a card name…"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Card name"
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: sans,
            /* 16px or iOS Safari zooms the page on focus and never zooms back */
            fontSize: 16,
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: "#fff",
            color: C.ink,
            outline: "none",
          }}
        />
      </form>

      {draft.trim() && (
        <div
          style={{
            margin: "8px 14px 0",
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            maxHeight: "40vh",
            overflowY: "auto",
          }}
        >
          {matches.map((s) => (
            <button
              key={s.nk}
              /* keeps focus in the input so the keyboard never dips */
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => addName(s.name)}
              style={{
                display: "flex",
                width: "100%",
                textAlign: "left",
                alignItems: "center",
                gap: 10,
                minHeight: 44,
                padding: "8px 12px",
                border: "none",
                borderBottom: `1px solid ${C.line}`,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: sans,
                  fontSize: 14,
                  color: C.ink,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10.5,
                  color: C.inkSoft,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {s.qty} out · {s.sellerCount} seller
                {s.sellerCount === 1 ? "" : "s"}
              </span>
            </button>
          ))}
          {!exactHit && (
            <button
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => addName(draft)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                minHeight: 44,
                padding: "8px 12px",
                border: "none",
                background: C.manila,
                color: C.manilaInk,
                fontFamily: sans,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Add “{draft.trim()}” as typed
            </button>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}` }}>
          {entries.map((e) => {
            const nk = normName(e.name);
            return (
              <div
                key={nk}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 14px",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    color: C.ink,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {e.name}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => setQty(nk, e.qty - 1)}
                    style={stepBtn}
                    aria-label={`One fewer ${e.name}`}
                  >
                    –
                  </button>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 13,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {e.qty}
                  </span>
                  <button
                    onClick={() => setQty(nk, e.qty + 1)}
                    style={stepBtn}
                    aria-label={`One more ${e.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: "10px 14px 0" }}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional) — tracking #, sender, mailer type…"
          aria-label="Envelope note"
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: sans,
            fontSize: 16,
            padding: "9px 12px",
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: "#fff",
            color: C.ink,
            outline: "none",
          }}
        />
      </div>

      {window.photos && (
        <div
          style={{
            padding: "10px 14px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* `capture` opens the camera straight away on iOS rather than the
              photo picker — one tap from envelope in hand to label captured */}
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addPhoto(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => camera.current?.click()}
            disabled={busy}
            style={{ ...miniBtn, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Adding…" : "Photo of the label"}
          </button>
          <PhotoStrip
            ids={photos}
            onRemove={(id) => setPhotos((p) => p.filter((x) => x !== id))}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px 12px",
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 11, color: C.inkSoft }}>
          {total} card{total === 1 ? "" : "s"}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={onCancel} style={miniBtn}>
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({ id: initial?.id, entries, note: note.trim(), photos })
          }
          disabled={entries.length === 0}
          style={{
            ...miniBtn,
            background: entries.length ? C.ink : "#fff",
            color: entries.length ? "#fff" : C.inkSoft,
            borderColor: entries.length ? C.ink : C.line,
            fontWeight: entries.length ? 700 : 400,
            cursor: entries.length ? "pointer" : "default",
          }}
        >
          {initial ? "Save changes" : "Save envelope"}
        </button>
      </div>
    </div>
  );
}

/* ---------- A recorded envelope, waiting to be tied to a package ---------- */

function EnvelopeCard({ env, ranked, onAssign, onDiscard, onEdit }) {
  const [confirmGk, setConfirmGk] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  /* two-tap, same as the Reset button. Arming anything disarms everything
     else: one timer, one armed control. */
  const disarm = () => {
    setConfirmGk("");
    setConfirmDiscard(false);
  };
  const arm = (set, val) => {
    disarm();
    set(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(disarm, 4000);
  };

  const total = env.entries.reduce((s, e) => s + e.qty, 0);
  const { list, tied, explainable } = ranked;
  const shown = showAll ? list : list.slice(0, 3);
  const when = new Date(env.createdAt).toISOString().slice(0, 10);

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(28,43,36,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 14px 8px",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.inkSoft,
          }}
        >
          Envelope · {when} · {total} card{total === 1 ? "" : "s"}
        </span>
        <button
          onClick={() => onEdit(env.id)}
          style={{ ...miniBtn, fontSize: 11, padding: "5px 9px" }}
        >
          Edit
        </button>
        <button
          onClick={() =>
            confirmDiscard ? onDiscard(env.id) : arm(setConfirmDiscard, true)
          }
          style={{
            ...miniBtn,
            fontSize: 11,
            padding: "5px 9px",
            color: confirmDiscard ? "#fff" : C.red,
            background: confirmDiscard ? C.red : "#fff",
            borderColor: confirmDiscard ? C.red : C.redSoft,
            fontWeight: confirmDiscard ? 700 : 400,
          }}
        >
          {confirmDiscard ? "Tap again to discard" : "Discard"}
        </button>
      </div>

      <div style={{ padding: "0 14px 10px" }}>
        {env.entries.map((e) => {
          const nk = normName(e.name);
          return (
            <div
              key={nk}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                fontSize: 13.5,
                color: C.ink,
                padding: "2px 0",
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                {e.qty > 1 ? `×${e.qty} ` : ""}
                {e.name}
              </span>
              {!explainable.has(nk) && (
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: C.manilaInk,
                    background: C.manila,
                    borderRadius: 999,
                    padding: "1px 7px",
                    flexShrink: 0,
                  }}
                >
                  no outstanding copy
                </span>
              )}
            </div>
          );
        })}
        {env.note && (
          <div
            style={{
              marginTop: 6,
              fontFamily: mono,
              fontSize: 11,
              color: C.inkSoft,
              wordBreak: "break-word",
            }}
          >
            {env.note}
          </div>
        )}
        {env.photos?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <PhotoStrip ids={env.photos} />
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 14px 12px" }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 13, color: C.inkSoft }}>
            No outstanding package accounts for any of these. It'll start
            matching if a later import brings in the order.
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10.5,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.inkSoft,
                marginBottom: 8,
              }}
            >
              Could have come from
            </div>
            {tied > 1 && (
              <div
                style={{
                  fontSize: 12.5,
                  color: C.manilaInk,
                  background: C.manila,
                  borderRadius: 6,
                  padding: "6px 10px",
                  marginBottom: 8,
                }}
              >
                {tied} packages fit these cards equally well — pick the right
                one yourself.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {shown.map((c) => {
                const armed = confirmGk === c.pkg.gk;
                return (
                  <div
                    key={c.pkg.gk}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: `1px solid ${C.line}`,
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: C.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.pkg.seller}
                      </div>
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 10.5,
                          color: C.inkSoft,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={c.pkg.orderId}
                      >
                        {c.pkg.date && `${c.pkg.date} · `}
                        {isUntracked(c.pkg) ? "○ untracked · " : ""}
                        {c.pkg.orderId}
                      </div>
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          color: c.exact ? C.green : C.inkSoft,
                          fontWeight: c.exact ? 700 : 400,
                        }}
                      >
                        {c.exact
                          ? `explains all ${c.matchedQty} · nothing left over`
                          : `${c.matchedQty} of ${c.entriesTotal} cards` +
                            (c.pkgLeft
                              ? ` · ${c.pkgLeft} more still owed`
                              : " · whole package")}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        armed ? onAssign(env, c) : arm(setConfirmGk, c.pkg.gk)
                      }
                      style={{
                        ...miniBtn,
                        flexShrink: 0,
                        fontSize: 11.5,
                        padding: "8px 10px",
                        background: armed ? C.green : "#fff",
                        color: armed ? "#fff" : C.ink,
                        borderColor: armed ? C.green : C.line,
                        fontWeight: armed ? 700 : 400,
                      }}
                    >
                      {armed ? "Tap again to check in" : "This one"}
                    </button>
                  </div>
                );
              })}
            </div>
            {list.length > 3 && (
              <button
                onClick={() => setShowAll((s) => !s)}
                style={{
                  marginTop: 8,
                  fontFamily: mono,
                  fontSize: 11,
                  color: C.inkSoft,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  padding: 0,
                }}
              >
                {showAll
                  ? "show fewer"
                  : `show ${list.length - 3} more candidate${
                      list.length - 3 === 1 ? "" : "s"
                    }`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Main app ---------- */

export default function MailDayLedger() {
  const [items, setItems] = useState([]);
  const [received, setReceived] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState("idle"); // idle | saving | saved | error
  const [query, setQuery] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const canceledRef = useRef(null);
  useEffect(() => {
    if (showCanceled)
      // wait a frame so the section exists before scrolling
      requestAnimationFrame(() =>
        canceledRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
  }, [showCanceled]);
  const [sticky, setSticky] = useState(() => new Set()); // just-checked rows stay visible under hideDone
  const [uploadErr, setUploadErr] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const resetTimer = useRef(null);
  const [dateFilter, setDateFilter] = useState({ preset: "all", from: "", to: "" });
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("packages"); // packages | items | mystery
  const [itemSort, setItemSort] = useState("missing");
  /* mystery mail: cards recorded off an unidentifiable envelope, parked until
     the user ties them to a package by hand */
  const [envelopes, setEnvelopes] = useState([]); // newest first
  const [composing, setComposing] = useState(null); // null | "new" | envelopeId
  const [undo, setUndo] = useState(null); // last assignment, reversible
  const [backupBusy, setBackupBusy] = useState(false);
  const [photoUsage, setPhotoUsage] = useState(null);
  const receivedRef = useRef({});
  useEffect(() => {
    receivedRef.current = received;
  });
  const saveTimer = useRef(null);
  const skipFirstSave = useRef(true);

  /* load persisted state */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          const data = JSON.parse(res.value);
          setItems(data.items || []);
          setReceived(data.received || {});
          // absent on anything saved before mystery mail shipped;
          // photos absent on anything saved before photos shipped
          setEnvelopes(
            (data.envelopes || []).map((e) => ({ ...e, photos: e.photos || [] }))
          );
          if (data.dateFilter) setDateFilter(data.dateFilter);
          if (data.sortBy) setSortBy(data.sortBy);
          // cardSort: the key this setting shipped under before the rename
          if (data.itemSort || data.cardSort)
            setItemSort(data.itemSort || data.cardSort);
        }
      } catch {
        /* nothing saved yet — fresh start */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  /* debounced save */
  useEffect(() => {
    if (!loaded) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSaving("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({
            items,
            received,
            envelopes,
            dateFilter,
            sortBy,
            itemSort,
            savedAt: Date.now(),
          })
        );
        setSaving("saved");
      } catch {
        setSaving("error");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [items, received, envelopes, dateFilter, sortBy, itemSort, loaded]);

  /* Two backups on purpose. The plain one is small and quick and holds the
     irreplaceable part — the ledger and every check-in. Photos are memory
     aids that would multiply the file size, so they're opt-in. */
  const backup = useCallback(
    async (withPhotos) => {
      const payload = {
        mailday: 1,
        items,
        received,
        envelopes,
        dateFilter,
        sortBy,
        itemSort,
      };
      if (withPhotos && window.photos) {
        setBackupBusy(true);
        const out = {};
        for (const id of envelopes.flatMap((e) => e.photos || [])) {
          const b = await window.photos.get(id).catch(() => null);
          if (b) {
            const url = await blobToDataUrl(b);
            if (url) out[id] = url;
          }
        }
        payload.photos = out;
        setBackupBusy(false);
      }
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `mailday-backup-${stamp}${withPhotos ? "-photos" : ""}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    [items, received, envelopes, dateFilter, sortBy, itemSort]
  );

  const handleFile = useCallback(
    (file) => {
      setUploadErr("");
      if (/\.json$/i.test(file.name)) {
        // restore from a Mail Day backup
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (!data.mailday || !Array.isArray(data.items)) throw new Error();
            setItems(data.items);
            setReceived(data.received || {});
            /* a backup taken without photos can't restore them, so drop the
               ids rather than leave envelopes pointing at blobs that no
               longer exist anywhere */
            const hasPhotos = data.photos && Object.keys(data.photos).length > 0;
            setEnvelopes(
              (data.envelopes || []).map((e) =>
                hasPhotos ? e : { ...e, photos: [] }
              )
            );
            if (hasPhotos && window.photos)
              (async () => {
                for (const [id, url] of Object.entries(data.photos)) {
                  const b = await dataUrlToBlob(url);
                  if (b) await window.photos.put(id, b).catch(() => {});
                }
              })();
            setComposing(null);
            setUndo(null);
            if (data.dateFilter) setDateFilter(data.dateFilter);
            if (data.sortBy) setSortBy(data.sortBy);
            if (data.itemSort || data.cardSort)
              setItemSort(data.itemSort || data.cardSort);
            setImportMsg(
              `Backup restored — ${data.items.length} lines and your check-ins are back.` +
                (hasPhotos
                  ? ` ${Object.keys(data.photos).length} photo${
                      Object.keys(data.photos).length === 1 ? "" : "s"
                    } too.`
                  : "") +
                /* a restore is a full replace, and envelopes are hand-typed —
                   losing them silently would be the worst kind of quiet */
                (envelopes.length > 0
                  ? ` ${envelopes.length} pending envelope${
                      envelopes.length === 1 ? " was" : "s were"
                    } replaced by the backup's.`
                  : "")
            );
            setShowUpload(false);
          } catch {
            setUploadErr(
              "That file isn\u2019t a Mail Day backup. Use a backup downloaded from the Backup button, or an OrderWand CSV."
            );
          }
        };
        reader.onerror = () =>
          setUploadErr("Couldn\u2019t read that file. Try again.");
        reader.readAsText(file);
        return;
      }
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = parseItems(results.data || []);
          if (!parsed.length) {
            setUploadErr(
              "No card rows found. This doesn\u2019t look like an OrderWand CSV — expected columns like \u201CProduct Name\u201D and \u201COrder Id\u201D."
            );
            return;
          }
          // MERGE: keep everything already tracked, add/refresh lines from the new file
          const map = new Map(items.map((it) => [it.key, it]));
          let added = 0;
          for (const it of parsed) {
            if (!map.has(it.key)) added++;
            map.set(it.key, it);
          }
          setItems([...map.values()]);
          setUndo(null); // its plan referenced the pre-merge line-up
          setImportMsg(
            items.length === 0
              ? `Imported ${parsed.length} lines across your orders.`
              : added > 0
              ? `Added ${added} new line${added === 1 ? "" : "s"} from the file — existing cards and check-ins untouched.`
              : "No new lines — everything in that file was already being tracked."
          );
          setShowUpload(false);
        },
        error: () => setUploadErr("Couldn\u2019t read that file. Try re-exporting from OrderWand."),
      });
    },
    [items, envelopes]
  );

  const setCount = useCallback((key, n) => {
    setReceived((prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[key];
      else next[key] = n;
      return next;
    });
    if (n > 0)
      setSticky((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  /* reset sticky rows whenever the view context changes */
  useEffect(() => {
    setSticky(new Set());
  }, [hideDone, query, dateFilter, view]);

  const bulkSet = useCallback((pkgItems, on) => {
    setReceived((prev) => {
      const next = { ...prev };
      for (const it of pkgItems) {
        if (on) next[it.key] = it.qty;
        else delete next[it.key];
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    clearTimeout(resetTimer.current);
    setConfirmReset(false);
    setItems([]);
    setReceived({});
    /* envelopes have to go too — left in state they'd be written straight back
       by the next debounced save and reappear pointing at a ledger that's gone */
    setEnvelopes([]);
    setComposing(null);
    setUndo(null);
    setSticky(new Set());
    setImportMsg("");
    try {
      await window.storage.delete(STORAGE_KEY);
      await window.photos?.clear();
    } catch {
      /* fine */
    }
  }, [confirmReset]);

  /* date range */
  const range = useMemo(() => {
    if (dateFilter.preset === "all") return null;
    if (dateFilter.preset === "custom") {
      const from = dateFilter.from ? Date.parse(dateFilter.from) : null;
      const to = dateFilter.to ? Date.parse(dateFilter.to) + 86399999 : null;
      if (from == null && to == null) return null;
      return { from, to };
    }
    if (dateFilter.preset === "days") {
      const n = parseInt(dateFilter.days, 10);
      if (!n || n <= 0) return null;
      return { from: Date.now() - n * 86400000, to: null };
    }
    return { from: Date.now() - dateFilter.preset * 86400000, to: null };
  }, [dateFilter]);

  /* ---- mystery mail ---- */

  const saveEnvelope = useCallback((draft) => {
    setEnvelopes((prev) =>
      draft.id
        ? prev.map((e) =>
            e.id === draft.id
              ? {
                  ...e,
                  entries: draft.entries,
                  note: draft.note,
                  photos: draft.photos || [],
                }
              : e
          )
        : [
            {
              id: newEnvelopeId(),
              createdAt: Date.now(),
              note: draft.note,
              entries: draft.entries,
              photos: draft.photos || [],
            },
            ...prev,
          ]
    );
    setComposing(null);
  }, []);

  /* Photos live outside the ledger, so nothing deletes them implicitly —
     discarding an envelope, assigning it away, restoring a backup and
     cancelling a half-built envelope all leave blobs behind. One sweep covers
     every case. Held off while an undo is live, since that can bring an
     envelope (and its photo ids) back. */
  useEffect(() => {
    if (!loaded || undo || composing || !window.photos) return;
    const keep = new Set(envelopes.flatMap((e) => e.photos || []));
    const t = setTimeout(() => {
      window.photos.sweep(keep).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [envelopes, undo, composing, loaded]);

  const discardEnvelope = useCallback((id) => {
    setEnvelopes((prev) => prev.filter((e) => e.id !== id));
    setUndo((u) => (u && u.envelope.id === id ? null : u));
  }, []);

  /* Applies exactly the cards the user recorded — never the rest of the
     package. Counts only ever grow here, so a key is never written as 0. */
  const assignEnvelope = useCallback(
    (env, cand) => {
      const index = envelopes.findIndex((e) => e.id === env.id);
      const qtyOf = {};
      for (const it of cand.pkg.items) qtyOf[it.key] = it.qty;

      setReceived((prev) => {
        const next = { ...prev };
        for (const { itemKey, take } of cand.plan) {
          const cur = Math.min(qtyOf[itemKey] ?? Infinity, next[itemKey] || 0);
          next[itemKey] = cur + take;
        }
        return next;
      });

      const leftovers = env.entries
        .map((e) => ({
          ...e,
          qty: e.qty - (cand.perEntry[normName(e.name)] || 0),
        }))
        .filter((e) => e.qty > 0);
      setEnvelopes((prev) =>
        leftovers.length
          ? /* keep id/createdAt/note so it holds its place in the pile */
            prev.map((e) => (e.id === env.id ? { ...e, entries: leftovers } : e))
          : prev.filter((e) => e.id !== env.id)
      );

      const t = Date.parse(cand.pkg.date);
      const outOfRange =
        !!range &&
        !Number.isNaN(t) &&
        ((range.from != null && t < range.from) ||
          (range.to != null && t > range.to));
      setUndo({
        envelope: env,
        index: index < 0 ? 0 : index,
        plan: cand.plan,
        pkgLabel: cand.pkg.seller,
        matchedQty: cand.matchedQty,
        leftoverQty: leftovers.reduce((s, e) => s + e.qty, 0),
        outOfRange,
      });
    },
    [envelopes, range]
  );

  /* stores the deltas, not a snapshot: if the package was hand-edited before
     the undo, subtracting composes where restoring would clobber */
  const undoAssign = useCallback(() => {
    if (!undo) return;
    setReceived((prev) => {
      const next = { ...prev };
      for (const { itemKey, take } of undo.plan) {
        const v = (next[itemKey] || 0) - take;
        if (v > 0) next[itemKey] = v;
        else delete next[itemKey]; // back to key-absent, not a stored 0
      }
      return next;
    });
    setEnvelopes((prev) => {
      const without = prev.filter((e) => e.id !== undo.envelope.id);
      const at = Math.min(Math.max(undo.index, 0), without.length);
      return [...without.slice(0, at), undo.envelope, ...without.slice(at)];
    });
    setUndo(null);
  }, [undo]);

  const liveItems = useMemo(
    () => items.filter((it) => !/^cancel/i.test(it.tracking || "")),
    [items]
  );
  const canceledCount = items.length - liveItems.length;

  const canceledPackages = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      if (!/^cancel/i.test(it.tracking || "")) continue;
      const gk = `${it.orderId}::${it.seller}`;
      if (!map.has(gk))
        map.set(gk, {
          gk,
          orderId: it.orderId,
          seller: it.seller,
          date: it.date,
          items: [],
        });
      map.get(gk).items.push(it);
    }
    const arr = [...map.values()];
    arr.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    return arr;
  }, [items]);

  const rangedItems = useMemo(() => {
    if (!range) return liveItems;
    return liveItems.filter((it) => {
      const t = Date.parse(it.date);
      if (Number.isNaN(t)) return true; // keep undated rows visible
      if (range.from != null && t < range.from) return false;
      if (range.to != null && t > range.to) return false;
      return true;
    });
  }, [liveItems, range]);

  const hiddenCount = liveItems.length - rangedItems.length;

  /* grouping + filtering */
  const packages = useMemo(() => groupPackages(rangedItems), [rangedItems]);

  /* Envelope candidates deliberately ignore the date filter — a mystery
     envelope is just as likely to be an old order as a recent one. */
  const allPackages = useMemo(() => groupPackages(liveItems), [liveItems]);

  const outstandingNames = useMemo(() => {
    const map = new Map();
    for (const it of liveItems) {
      const out = it.qty - Math.min(it.qty, received[it.key] || 0);
      if (out <= 0) continue;
      const nk = normName(it.name);
      if (!map.has(nk))
        map.set(nk, { nk, name: it.name, qty: 0, sellers: new Set() });
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
  }, [liveItems, received]);

  /* Derived, never stored — so a package received by other means simply stops
     being offered, with no stale-suggestion bookkeeping to get wrong. */
  const envelopeCandidates = useMemo(() => {
    const map = new Map();
    if (view !== "mystery") return map; // only ever read in that view
    for (const env of envelopes)
      map.set(env.id, rankCandidates(env.entries, allPackages, received));
    return map;
  }, [envelopes, allPackages, received, view]);

  const photoCount = useMemo(
    () => envelopes.reduce((s, e) => s + (e.photos?.length || 0), 0),
    [envelopes]
  );

  useEffect(() => {
    if (view !== "mystery" || !window.photos) return;
    window.photos.usage().then(setPhotoUsage).catch(() => {});
  }, [view, photoCount]);

  /* package ordering — computed when sort/filters change, frozen while checking
     so packages don't leapfrog mid-session on value-based sorts */
  const packageOrder = useMemo(() => {
    const rec = receivedRef.current;
    const t = (p) => Date.parse(p.date) || 0;
    const missing = (p) =>
      p.items.reduce(
        (s, it) => s + it.price * (it.qty - Math.min(it.qty, rec[it.key] || 0)),
        0
      );
    const sorted = [...packages];
    if (sortBy === "oldest")
      sorted.sort((a, b) => t(a) - t(b) || a.seller.localeCompare(b.seller));
    else if (sortBy === "value")
      sorted.sort((a, b) => missing(b) - missing(a) || t(b) - t(a));
    else if (sortBy === "seller")
      sorted.sort((a, b) => a.seller.localeCompare(b.seller) || t(b) - t(a));
    else sorted.sort((a, b) => t(b) - t(a) || a.seller.localeCompare(b.seller));
    const order = new Map();
    sorted.forEach((p, i) => order.set(p.gk, i));
    return order;
  }, [packages, sortBy]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages
      .map((p) => {
        // a fully-received package disappears immediately under hideDone,
        // even if some rows were sticky (nothing left to mis-tap)
        if (
          hideDone &&
          p.items.every((it) => (received[it.key] || 0) >= it.qty)
        )
          return { ...p, items: [] };
        let its = p.items;
        if (q)
          its = its.filter((it) =>
            [it.name, it.set, it.seller, it.orderId]
              .join(" ")
              .toLowerCase()
              .includes(q)
          );
        if (hideDone)
          its = its.filter(
            (it) => (received[it.key] || 0) < it.qty || sticky.has(it.key)
          );
        return { ...p, items: its };
      })
      .filter((p) => p.items.length > 0)
      .sort(
        (a, b) => (packageOrder.get(a.gk) ?? 1e9) - (packageOrder.get(b.gk) ?? 1e9)
      );
  }, [packages, query, hideDone, received, sticky, packageOrder]);

  /* by-item totals: exact product-name match, pooled across every seller/order.
     TCGplayer names are a scrape, so identical items carry byte-identical names.
     basis = what the copies cost (price × qty); shipping and tax are per-order
     in the CSV, not per-line, so they're not in it. */
  const itemGroups = useMemo(() => {
    const map = new Map();
    for (const it of rangedItems) {
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
  }, [rangedItems]);

  /* frozen while checking, same as packageOrder */
  const itemOrder = useMemo(() => {
    const rec = receivedRef.current;
    const gotOf = (g) =>
      g.items.reduce((s, it) => s + Math.min(it.qty, rec[it.key] || 0), 0);
    const missingVal = (g) =>
      g.items.reduce(
        (s, it) => s + it.price * (it.qty - Math.min(it.qty, rec[it.key] || 0)),
        0
      );
    const sorted = [...itemGroups];
    if (itemSort === "basis")
      sorted.sort((a, b) => b.basis - a.basis || a.name.localeCompare(b.name));
    else if (itemSort === "ordered")
      sorted.sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
    else if (itemSort === "value")
      sorted.sort(
        (a, b) => missingVal(b) - missingVal(a) || a.name.localeCompare(b.name)
      );
    else if (itemSort === "name")
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    else
      sorted.sort(
        (a, b) =>
          b.qty - gotOf(b) - (a.qty - gotOf(a)) ||
          missingVal(b) - missingVal(a) ||
          a.name.localeCompare(b.name)
      );
    const order = new Map();
    sorted.forEach((g, i) => order.set(g.name, i));
    return order;
  }, [itemGroups, itemSort]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return itemGroups
      .map((g) => {
        /* unlike a package — a physical thing you finish — an item row is one
           line in a long scan, and most items have a single copy. Completing
           one must not yank the row out from under the finger, so an item that
           was just checked stays until the filters change and sticky clears. */
        const allDone = g.items.every((it) => (received[it.key] || 0) >= it.qty);
        if (hideDone && allDone && !g.items.some((it) => sticky.has(it.key)))
          return { ...g, shown: [] };
        let shown = g.items;
        if (q)
          shown = shown.filter((it) =>
            [it.name, it.set, it.seller, it.orderId]
              .join(" ")
              .toLowerCase()
              .includes(q)
          );
        if (hideDone)
          shown = shown.filter(
            (it) => (received[it.key] || 0) < it.qty || sticky.has(it.key)
          );
        return { ...g, shown };
      })
      .filter((g) => g.shown.length > 0)
      .sort(
        (a, b) =>
          (itemOrder.get(a.name) ?? 1e9) - (itemOrder.get(b.name) ?? 1e9)
      );
  }, [itemGroups, query, hideDone, received, sticky, itemOrder]);

  const totals = useMemo(() => {
    let total = 0,
      got = 0,
      missingVal = 0;
    for (const it of rangedItems) {
      const g = Math.min(it.qty, received[it.key] || 0);
      total += it.qty;
      got += g;
      missingVal += it.price * (it.qty - g);
    }
    return { total, got, missingVal };
  }, [rangedItems, received]);

  const remaining = totals.total - totals.got;

  if (!loaded)
    return (
      <div
        style={{
          fontFamily: sans,
          background: C.paper,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.inkSoft,
        }}
      >
        Opening the ledger…
      </div>
    );

  return (
    <div
      style={{
        fontFamily: sans,
        background: C.paper,
        minHeight: "100vh",
        color: C.ink,
      }}
    >
      <style>{`
        button:focus-visible { outline: 2px solid ${C.green}; outline-offset: 2px; }
        input:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 1px; }
        button, input { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: "0.18em",
              color: C.inkSoft,
              textTransform: "uppercase",
            }}
          >
            TCGplayer check-in
          </div>
          <h1
            style={{
              margin: "2px 0 0",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            Mail Day Ledger
          </h1>
        </div>

        {/* envelopes can outlive the ledger, so the switch has to survive an
            empty item list or they'd be stranded with no way back to them */}
        {(items.length > 0 || envelopes.length > 0) && (
          <div
            style={{
              display: "inline-flex",
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              overflow: "hidden",
              background: "#fff",
              marginBottom: 14,
            }}
          >
            {[
              ["packages", "Packages"],
              ["items", "By item"],
              ["mystery", "Mystery mail"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "8px 14px",
                  border: "none",
                  background: view === v ? C.ink : "transparent",
                  color: view === v ? "#fff" : C.inkSoft,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {v === "mystery" && envelopes.length > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontWeight: 700,
                      color: view === v ? "#fff" : C.red,
                    }}
                  >
                    {envelopes.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Overall progress */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 13 }}>
                  <strong>{totals.got}</strong> of{" "}
                  <strong>{totals.total}</strong> cards checked in
                </span>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: remaining === 0 ? C.green : C.red,
                  }}
                >
                  {remaining === 0
                    ? "ALL ACCOUNTED FOR ✓"
                    : `${remaining} still missing · $${totals.missingVal.toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}`}
                </span>
              </div>
              <ProgressBar
                pct={totals.total ? (totals.got / totals.total) * 100 : 0}
              />
              <div
                style={{
                  marginTop: 8,
                  fontFamily: mono,
                  fontSize: 10.5,
                  color: C.inkSoft,
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "2px 12px",
                }}
              >
                <span style={{ whiteSpace: "nowrap" }}>
                  {view === "mystery"
                    ? `${envelopes.length} envelope${
                        envelopes.length === 1 ? "" : "s"
                      } waiting`
                    : view === "items"
                    ? `${itemGroups.length} unique item${
                        itemGroups.length === 1 ? "" : "s"
                      }${range ? " in range" : ""}`
                    : `${packages.length} packages${range ? " in range" : ""}`}
                  {" · autosaves"}
                </span>
                <span>
                  {saving === "saving" && "saving…"}
                  {saving === "saved" && "saved ✓"}
                  {saving === "error" && (
                    <span style={{ color: C.red }}>couldn’t save</span>
                  )}
                </span>
              </div>
            </div>

            {/* Date range — hidden under mystery mail, where it applies to
                nothing: envelope candidates are matched against every live
                order, and a visible filter would imply otherwise */}
            {view !== "mystery" && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10.5,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.inkSoft,
                  marginRight: 2,
                }}
              >
                Orders from
              </span>
              {[
                ["all", "All time"],
                [30, "30d"],
                [45, "45d"],
                [60, "60d"],
                [90, "90d"],
                ["days", "# days"],
                ["custom", "Custom…"],
              ].map(([val, label]) => {
                const active = dateFilter.preset === val;
                return (
                  <button
                    key={String(val)}
                    onClick={() =>
                      setDateFilter((d) => ({ ...d, preset: val }))
                    }
                    style={{
                      fontFamily: mono,
                      fontSize: 11.5,
                      padding: "5px 11px",
                      borderRadius: 999,
                      border: `1px solid ${active ? C.ink : C.line}`,
                      background: active ? C.ink : "#fff",
                      color: active ? "#fff" : C.ink,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              {dateFilter.preset === "days" && (
                <span
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    fontFamily: mono,
                    fontSize: 12,
                    color: C.inkSoft,
                  }}
                >
                  last
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={dateFilter.days ?? ""}
                    onChange={(e) =>
                      setDateFilter((d) => ({ ...d, days: e.target.value }))
                    }
                    placeholder="21"
                    style={{ ...dateInput, width: 64, textAlign: "center" }}
                    aria-label="Number of days"
                  />
                  days
                </span>
              )}
              {dateFilter.preset === "custom" && (
                <span
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    fontFamily: mono,
                    fontSize: 12,
                    color: C.inkSoft,
                  }}
                >
                  <input
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) =>
                      setDateFilter((d) => ({ ...d, from: e.target.value }))
                    }
                    style={dateInput}
                    aria-label="From date"
                  />
                  –
                  <input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) =>
                      setDateFilter((d) => ({ ...d, to: e.target.value }))
                    }
                    style={dateInput}
                    aria-label="To date"
                  />
                </span>
              )}
              {(hiddenCount > 0 || canceledCount > 0) && (
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: C.inkSoft,
                    marginLeft: "auto",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {hiddenCount > 0 && <span>{hiddenCount} lines outside range</span>}
                  {canceledCount > 0 && (
                    <button
                      onClick={() => setShowCanceled((s) => !s)}
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        color: showCanceled ? C.ink : C.inkSoft,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                        padding: 0,
                      }}
                    >
                      {showCanceled
                        ? "hide canceled"
                        : `${canceledCount} canceled — view`}
                    </button>
                  )}
                </span>
              )}
            </div>
            )}

            {/* Controls */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* search / sort / hide only describe the ledger lists; Backup
                  and Reset stay reachable from every view */}
              {view !== "mystery" && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search card, set, seller, or order…"
                style={{
                  flex: 1,
                  minWidth: 160,
                  fontFamily: sans,
                  fontSize: 14,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.line}`,
                  background: C.card,
                  color: C.ink,
                  outline: "none",
                }}
              />
              )}
              {view === "mystery" ? null : view === "items" ? (
                <select
                  value={itemSort}
                  onChange={(e) => setItemSort(e.target.value)}
                  aria-label="Sort items"
                  style={{
                    ...dateInput,
                    padding: "9px 8px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <option value="missing">Sort: most missing</option>
                  <option value="basis">Sort: biggest position</option>
                  <option value="ordered">Sort: most ordered</option>
                  <option value="value">Sort: $ remaining</option>
                  <option value="name">Sort: name A–Z</option>
                </select>
              ) : (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort packages"
                  style={{
                    ...dateInput,
                    padding: "9px 8px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <option value="newest">Sort: newest</option>
                  <option value="oldest">Sort: oldest</option>
                  <option value="value">Sort: $ remaining</option>
                  <option value="seller">Sort: seller A–Z</option>
                </select>
              )}
              {view !== "mystery" && (
              <button
                onClick={() => setHideDone((h) => !h)}
                style={{
                  ...miniBtn,
                  fontSize: 12,
                  padding: "9px 12px",
                  background: hideDone ? C.ink : "#fff",
                  color: hideDone ? "#fff" : C.ink,
                }}
              >
                {hideDone ? "Showing remaining only" : "Hide received"}
              </button>
              )}
              {view === "mystery" && <span style={{ flex: 1 }} />}
              <button
                onClick={() => setShowUpload((s) => !s)}
                style={{ ...miniBtn, fontSize: 12, padding: "9px 12px" }}
              >
                Re-import CSV
              </button>
              <button
                onClick={() => backup(false)}
                style={{ ...miniBtn, fontSize: 12, padding: "9px 12px" }}
              >
                Backup
              </button>
              {photoCount > 0 && (
                <button
                  onClick={() => backup(true)}
                  disabled={backupBusy}
                  style={{
                    ...miniBtn,
                    fontSize: 12,
                    padding: "9px 12px",
                    opacity: backupBusy ? 0.6 : 1,
                  }}
                >
                  {backupBusy ? "Packing…" : "Backup + photos"}
                </button>
              )}
              <button
                onClick={resetAll}
                style={{
                  ...miniBtn,
                  fontSize: 12,
                  padding: "9px 12px",
                  color: confirmReset ? "#fff" : C.red,
                  background: confirmReset ? C.red : "#fff",
                  borderColor: confirmReset ? C.red : C.redSoft,
                  fontWeight: confirmReset ? 700 : 400,
                }}
              >
                {confirmReset ? "Tap again to clear everything" : "Reset"}
              </button>
            </div>
          </>
        )}

        {(items.length === 0 || showUpload) && (
          <div style={{ marginBottom: 20 }}>
            <UploadZone
              onFile={handleFile}
              error={uploadErr}
              replacing={items.length > 0}
            />
          </div>
        )}

        {importMsg && (
          <Notice onDismiss={() => setImportMsg("")}>{importMsg}</Notice>
        )}

        {view === "mystery" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {composing === "new" ? (
              <EnvelopeComposer
                suggestions={outstandingNames}
                onSave={saveEnvelope}
                onCancel={() => setComposing(null)}
              />
            ) : (
              <button
                onClick={() => setComposing("new")}
                style={{
                  fontFamily: sans,
                  fontWeight: 700,
                  fontSize: 15,
                  background: C.ink,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 20px",
                  cursor: "pointer",
                }}
              >
                + Record an envelope
              </button>
            )}

            {envelopes.map((env, i) => (
              <React.Fragment key={env.id}>
                {undo && undo.index === i && (
                  <Notice
                    actionLabel="Undo"
                    onAction={undoAssign}
                    onDismiss={() => setUndo(null)}
                  >
                    {`Checked in ${undo.matchedQty} card${
                      undo.matchedQty === 1 ? "" : "s"
                    } against ${undo.pkgLabel}.`}
                    {undo.leftoverQty > 0 &&
                      ` ${undo.leftoverQty} card${
                        undo.leftoverQty === 1 ? "" : "s"
                      } still in the envelope.`}
                    {undo.outOfRange &&
                      " That order is outside your date filter, so it won't show in the other views."}
                  </Notice>
                )}
                {composing === env.id ? (
                  <EnvelopeComposer
                    initial={env}
                    suggestions={outstandingNames}
                    onSave={saveEnvelope}
                    onCancel={() => setComposing(null)}
                  />
                ) : (
                  <EnvelopeCard
                    env={env}
                    ranked={
                      envelopeCandidates.get(env.id) || {
                        list: [],
                        tied: 0,
                        explainable: new Set(),
                      }
                    }
                    onAssign={assignEnvelope}
                    onDiscard={discardEnvelope}
                    onEdit={setComposing}
                  />
                )}
              </React.Fragment>
            ))}

            {/* the pile emptied out from under it — still needs somewhere to go */}
            {undo && undo.index >= envelopes.length && (
              <Notice
                actionLabel="Undo"
                onAction={undoAssign}
                onDismiss={() => setUndo(null)}
              >
                {`Checked in ${undo.matchedQty} card${
                  undo.matchedQty === 1 ? "" : "s"
                } against ${undo.pkgLabel}.`}
                {undo.outOfRange &&
                  " That order is outside your date filter, so it won't show in the other views."}
              </Notice>
            )}

            {envelopes.length === 0 && composing !== "new" && (
              <div
                style={{
                  textAlign: "center",
                  color: C.inkSoft,
                  fontSize: 14,
                  padding: "28px 8px",
                  lineHeight: 1.5,
                }}
              >
                Nothing waiting. When a package turns up that you can’t place,
                record what was in it here — nothing is checked in until you
                say which package it came from.
              </div>
            )}

            {photoCount > 0 && (
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10.5,
                  color: C.inkSoft,
                  textAlign: "center",
                  paddingTop: 4,
                }}
              >
                {photoCount} photo{photoCount === 1 ? "" : "s"} stored
                {photoUsage?.quota
                  ? ` · ${bytes(photoUsage.used)} of ${bytes(
                      photoUsage.quota
                    )} used on this device`
                  : ""}
              </div>
            )}
          </div>
        )}

        {/* Packages / items */}
        {view !== "mystery" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {view === "items"
            ? visibleItems.map((g) => (
                <ItemTotalRow
                  key={g.name}
                  item={g}
                  received={received}
                  onSet={setCount}
                  onBulk={bulkSet}
                />
              ))
            : visible.map((pkg) => (
                <PackageCard
                  key={pkg.gk}
                  pkg={pkg}
                  received={received}
                  onSet={setCount}
                  onBulk={bulkSet}
                />
              ))}
          {items.length > 0 &&
            (view === "items" ? visibleItems.length : visible.length) === 0 && (
            <div
              style={{
                textAlign: "center",
                color: C.inkSoft,
                fontSize: 14,
                padding: "32px 0",
              }}
            >
              {hideDone && !query
                ? "Everything here has been checked in. 🎉"
                : view === "items"
                ? "No items match that search."
                : "No cards match that search."}
            </div>
          )}
        </div>
        )}

        {view !== "mystery" && showCanceled && canceledPackages.length > 0 && (
          <div ref={canceledRef} style={{ marginTop: 28, scrollMarginTop: 12 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.inkSoft,
                marginBottom: 10,
              }}
            >
              Canceled orders — for cross-checking refunds
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {canceledPackages.map((p) => (
                <div
                  key={p.gk}
                  style={{
                    border: `1px dashed ${C.inkSoft}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    opacity: 0.85,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: C.inkSoft,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.seller}
                      </div>
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 10.5,
                          color: C.inkSoft,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={p.orderId}
                      >
                        {p.date && `${p.date} · `}
                        {p.orderId}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: C.red,
                        border: `1.5px solid ${C.red}`,
                        borderRadius: 4,
                        padding: "2px 7px",
                        flexShrink: 0,
                      }}
                    >
                      CANCELED
                    </span>
                  </div>
                  {p.items.map((it) => (
                    <div
                      key={it.key}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "baseline",
                        fontSize: 12.5,
                        color: C.inkSoft,
                        padding: "3px 0",
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {it.qty > 1 ? `×${it.qty} ` : ""}
                        {it.name}
                      </span>
                      <span
                        style={{ fontFamily: mono, fontSize: 11.5, flexShrink: 0 }}
                      >
                        ${(it.price * it.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
