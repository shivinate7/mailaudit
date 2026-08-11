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

function ItemRow({ item, got, onSet }) {
  const done = got >= item.qty;
  const partial = got > 0 && !done;
  const toggle = () => onSet(item.key, done ? 0 : item.qty);
  const meta = (item.qty > 1 ? [`×${item.qty}`] : [])
    .concat([item.set, item.finish, item.condition].filter(Boolean))
    .join(" · ");
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
            {item.name}
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
          {meta || "—"}
        </div>
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
  /* lost-mail heuristics for untracked, unreceived packages:
     14d ≈ TCGplayer est. delivery window + grace; 30d = refund deadline floor */
  const days = Math.floor((Date.now() - (Date.parse(pkg.date) || Date.now())) / 86400000);
  const lostTier =
    !done && tracked === "untracked" && days >= 30
      ? "deadline"
      : !done && tracked === "untracked" && days >= 14
      ? "maybe"
      : null;

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
            {lostTier === "deadline" && (
              <span style={{ color: C.red, fontWeight: 700 }}>
                ⚠ {days}d — refund window closing, contact seller ·{" "}
              </span>
            )}
            {lostTier === "maybe" && (
              <span style={{ color: C.amber, fontWeight: 700 }}>
                ⚠ {days}d — may be lost ·{" "}
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
          if (data.dateFilter) setDateFilter(data.dateFilter);
          if (data.sortBy) setSortBy(data.sortBy);
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
          JSON.stringify({ items, received, dateFilter, sortBy, savedAt: Date.now() })
        );
        setSaving("saved");
      } catch {
        setSaving("error");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [items, received, dateFilter, sortBy, loaded]);

  const backup = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ mailday: 1, items, received, dateFilter, sortBy })],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mailday-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [items, received, dateFilter, sortBy]);

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
            if (data.dateFilter) setDateFilter(data.dateFilter);
            if (data.sortBy) setSortBy(data.sortBy);
            setImportMsg(
              `Backup restored — ${data.items.length} lines and your check-ins are back.`
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
    [items]
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
  }, [hideDone, query, dateFilter]);

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
    setSticky(new Set());
    setImportMsg("");
    try {
      await window.storage.delete(STORAGE_KEY);
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
  const packages = useMemo(() => {
    const map = new Map();
    for (const it of rangedItems) {
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
    arr.forEach((p) =>
      p.items.sort((a, b) => a.name.localeCompare(b.name))
    );
    arr.sort(
      (a, b) =>
        (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) ||
        a.seller.localeCompare(b.seller)
    );
    return arr;
  }, [rangedItems]);

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
                  {packages.length} packages
                  {range ? " in range" : ""} · autosaves
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

            {/* Date range */}
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
              <button
                onClick={() => setShowUpload((s) => !s)}
                style={{ ...miniBtn, fontSize: 12, padding: "9px 12px" }}
              >
                Re-import CSV
              </button>
              <button
                onClick={backup}
                style={{ ...miniBtn, fontSize: 12, padding: "9px 12px" }}
              >
                Backup
              </button>
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
            <span style={{ flex: 1 }}>{importMsg}</span>
            <button
              onClick={() => setImportMsg("")}
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
          </div>
        )}

        {/* Packages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((pkg) => (
            <PackageCard
              key={pkg.gk}
              pkg={pkg}
              received={received}
              onSet={setCount}
              onBulk={bulkSet}
            />
          ))}
          {items.length > 0 && visible.length === 0 && (
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
                : "No cards match that search."}
            </div>
          )}
        </div>

        {showCanceled && canceledPackages.length > 0 && (
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
