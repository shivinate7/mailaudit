import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Papa from "papaparse";
import tokens from "../shared/tokens.json";
import {
  parseItems, lostMail, normName, isUntracked, gkOf, groupPackages, rankCandidates,
  dateRange, inRange, dropCanceled, dropGks, canceledPackagesOf, stampedPackagesOf,
  tallyGroups, sortTally, sortPackages, filterPackages, filterTally,
  totalsOf, outstandingOf, outstandingNames as outstandingNamesOf, packagesDone, salvageLedger,
} from "./view-rules.mjs";
import { photoPlan } from "./photo-rules.mjs";
import { shouldSnapshot } from "./version-rules.mjs";
import { KEY_RE, SYNC_POST_MS, SYNC_COLD_POST_MS, SYNC_TIMEOUT_MS, IDLE_APPLY_MS, idleReady, backoffMs } from "./sync-rules.mjs";
import {
  mergeItems,
  mergeLedger,
  isLiveEnvelope,
  tombstoneOf,
  mergeSummary,
  canon,
} from "./merge-rules.mjs";

/* ============================================================
   MAIL DAY LEDGER — OrderWand CSV check-in tracker
   Palette: warm parchment, violet ink and accent, gold secondary
   ============================================================ */

/* Palette D▸ — warm parchment, violet ink and accent, gold secondary.
   Every value here is contrast-checked against `card` (#FCF6EA), the surface
   most text actually sits on; the ones that carry information clear 4.5:1.
   Don't swap a value without re-checking the pair it's used against — the
   awkward ones are manilaInk (must clear 4.5 on `manila`, not on card) and
   inkSoft, which was darkened from the original #7A6E86 for exactly that
   reason. `paper` is the page, `card` is any raised surface — there is no
   pure white in this theme, so never reach for C.card. */
/* The palette lives in shared/tokens.json, see design-parchment-ledger. */
const C = tokens;

const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
/* Cochin — an 18th-century French copperplate face, present on iOS and macOS.
   Picked to match the old-style letterforms the C.H Postal Company register
   lives in; the fallbacks walk down the same family (old-style → transitional →
   generic), never to a Didone, which is the wrong register entirely.
   Note Cochin has a small x-height, so content set in it runs visually smaller
   than the same nominal px in a sans — sizes here are already paid up for that
   and shouldn't be trimmed back. */
const cochin = "Cochin, 'Hoefler Text', Palatino, Georgia, serif";

/* Line icons for the bottom bar's tabs, drawn on a 24px grid. */
const BAR_ICONS = {
  ledger: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M10.7 5.1L10.8 2.6L13.2 2.6L13.3 5.1L15.9 6.2L17.8 4.5L19.5 6.2L17.8 8.1L18.9 10.7L21.4 10.8L21.4 13.2L18.9 13.3L17.8 15.9L19.5 17.8L17.8 19.5L15.9 17.8L13.3 18.9L13.2 21.4L10.8 21.4L10.7 18.9L8.1 17.8L6.2 19.5L4.5 17.8L6.2 15.9L5.1 13.3L2.6 13.2L2.6 10.8L5.1 10.7L6.2 8.1L4.5 6.2L6.2 4.5L8.1 6.2Z" />
    </>
  ),
  mystery: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 7l9 6 9-6M10.2 11.2a1.9 1.9 0 1 1 2.6 1.7c-.5.3-.8.6-.8 1.2" />
    </>
  ),
  items: <path d="M5 5v14M9.5 5v14M14 5v14M18.5 5v14M3 17L21 7" />,
  packages: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
};

const money = (n) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* Compact money for the masthead tallies, where three figures share one row at
   375px and cents are noise. Whole dollars under 1k, then k / M with at most
   two decimals and trailing zeros trimmed: 27, 101, 4k, 63.45k, 1.2M.
   Only for display — `money()` stays the format everywhere a figure is meant to
   be read exactly. */
const compact = (n) => {
  const a = Math.abs(n);
  const trim = (x) => String(Math.round(x * 100) / 100);
  if (a >= 1e6) return `${trim(n / 1e6)}M`;
  if (a >= 1e3) return `${trim(n / 1e3)}k`;
  return String(Math.round(n));
};

/* How long a ledger may go unpushed before the app says so. A day, because the
   push is automatic and idle-debounced: anything shorter fires on an ordinary
   evening with the phone face down, and anything longer stops being a warning
   and starts being an obituary. */
const SYNC_STALE_MS = 24 * 60 * 60 * 1000;

/* Today gets a clock, anything older gets a date too. The list is read for
   "which of these is from before lunch" far more often than for the year, and
   the row has exactly one elastic column — the label — so the timestamp has to
   stay short enough not to compete with it. */
function versionWhen(at) {
  const d = new Date(at);
  const n = new Date();
  const p = (x) => String(x).padStart(2, "0");
  const clock = `${p(d.getHours())}:${p(d.getMinutes())}`;
  const sameDay =
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate();
  return sameDay ? clock : `${p(d.getMonth() + 1)}-${p(d.getDate())} ${clock}`;
}

const STORAGE_KEY = "mailday:v1";

let envSeq = 0;
const newEnvelopeId = () =>
  `env-${Date.now().toString(36)}-${(envSeq++).toString(36)}`;
/* The random tail is not decoration. envSeq resets to 0 on every page load, so
   before photos were shared these ids were unique only if two of them were
   never generated in the same millisecond — fine for a store one device owns
   alone. On a remote store keyed by id and never overwritten it stops being
   fine: a collision means the second device's push lands on an existing path,
   which we correctly read as "already there, nothing to do", and that device
   then downloads the OTHER device's photo under its own id. A silently wrong
   picture, which is the exact failure class this codebase carves modules out to
   prevent. Old ids keep working; nothing persisted changes shape. */
const rand8 = () => {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  }
};
const newPhotoId = () =>
  `pho-${Date.now().toString(36)}-${(envSeq++).toString(36)}${rand8()}`;

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

/* ---------- order stamps ----------
   One stamp per package — a status the user sets by hand ("claim filed",
   "refunded"), dated the day it was set, with an optional free line. The
   vocabulary is fixed and module-level for the same reason RANGES and
   PKG_SORTS are: the chips in the editor and the band on the card read one
   table, so they cannot drift.
   A removed stamp is a TOMBSTONE — `kind: ""` with a fresh `updatedAt` —
   rather than a deleted key, so the removal itself survives the two-device
   merge (see mergeStamps in merge-rules.mjs). Every reader goes through
   hasStamp, never key presence. */
const STAMP_KINDS = [
  ["claim", "Claim filed"],
  ["refunded", "Refunded"],
  ["contacted", "Seller contacted"],
  ["reshipped", "Reshipped"],
  ["partial", "Partial refund"],
  /* the escape hatch for anything the fixed five don't name — the note field
     carries the detail, this just keeps the order out of "nothing's wrong" */
  ["other", "Other"],
];
const STAMP_LABEL = Object.fromEntries(STAMP_KINDS);
const hasStamp = (s) => !!(s && s.kind);
/* both refund kinds take the package out of the ledger's counts, exactly as a
   canceled order is — the money is back, so nothing is outstanding */
const isRefundStamp = (s) => s?.kind === "refunded" || s?.kind === "partial";
/* the LOCAL calendar day, deliberately not toISOString(): at 8pm Central a
   claim filed today would be dated tomorrow. Same trap the month picker
   documents (test 23.16), same side of it. */
const todayLocal = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/* parseLedger validates only `mailday` and `items`, so everything that reads
   `data.stamps` off a payload goes through this — Object.keys(null) inside a
   memo would take the whole app down on a hand-edited backup */
const sanitizeStamps = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

/* ---------- Small UI atoms ---------- */

/* True for one animation's worth of time after `on` flips false -> true while
   this component stays mounted, and NEVER on a fresh mount. Everything that
   celebrates in this app — the RECEIVED stamp, the order-stamp band, the
   progress bar reaching 100% — is a state a package can already be in, so a
   bare CSS class would replay the animation every time React rebuilt the tree:
   switching Packages -> Tally would restamp four hundred finished orders at
   once, and a sort change would do it again. This ties the motion to the ACT
   rather than to the state, which is also the honest reading — the moment
   worth marking is the check-in, not the fact of having been checked in.
   The window is generous (700ms against a 380ms animation) because it only has
   to outlast the animation, and a class removed a frame early would cut it. */
function useJustBecame(on, ms = 700) {
  const was = useRef(on);
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    const rose = on && !was.current;
    was.current = on;
    if (!rose) return;
    setFresh(true);
    const t = setTimeout(() => setFresh(false), ms);
    return () => clearTimeout(t);
  }, [on, ms]);
  return fresh;
}


/* The C.H Postal Company seal — the masthead's centre ornament, and the only
   SVG in this file. Drawn as a chevron-over-bar device rather than anything
   finer: at the 36px end of its clamp there is room for roughly one bold shape,
   and every more detailed attempt turned to mud. The relief is two copies of
   the same path — a cut copy low, a raised copy 3.5 units above it — which is
   what makes it read as pressed wax rather than a printed disc.
   `id` must be unique per instance or the gradients collide when two are on the
   page at once (the masthead and the sticky bar both render one). */
function Seal({ size, id, className }) {
  const g = `wax-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <radialGradient id={g} cx="37%" cy="30%" r="78%">
          <stop offset="0" stopColor={C.waxLit} />
          <stop offset="0.5" stopColor={C.wax} />
          <stop offset="1" stopColor={C.waxDeep} />
        </radialGradient>
      </defs>
      {/* irregular edge — real wax is never a circle */}
      <path
        d="M50 2 C69 2 80 9 88 20 C96 31 99 45 96 59 C92 75 81 90 65 95
           C50 100 34 98 22 89 C9 78 2 62 3 47 C5 30 15 15 31 7 C37 4 43 2 50 2 Z"
        fill={`url(#${g})`}
      />
      <circle
        cx="50"
        cy="50"
        r="39"
        fill="none"
        stroke={C.waxDeep}
        strokeWidth="3.5"
        opacity="0.6"
      />
      <g
        fill="none"
        stroke={C.waxCut}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.78"
      >
        <path d="M29 58 L50 38 L71 58" />
        <path d="M31 72 L69 72" />
      </g>
      <g
        fill="none"
        stroke={C.waxRaised}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      >
        <path d="M29 54.5 L50 34.5 L71 54.5" />
        <path d="M31 68.5 L69 68.5" />
      </g>
      {/* the specular catch. Classed so the masthead's copy can bring it up
          after the wax has landed; the running head's copy is never selected
          and keeps the attribute value throughout. A presentation attribute,
          so with the animation off it simply reads 0.22. */}
      <ellipse
        className="mdl-shine"
        cx="34"
        cy="28"
        rx="15"
        ry="9"
        fill={C.card}
        opacity="0.22"
        transform="rotate(-35 34 28)"
      />
    </svg>
  );
}

function ProgressBar({ pct, height = 8, radius = height }) {
  /* The colour now arrives a beat after the width lands, so the two read as
     cause and effect rather than as one event, and a single pass of light
     travels a bar that has just filled.
     Note WHICH bar that can be. The two per-package bars are mounted only
     while `gotQty > 0 && !done`, so they are unmounted the instant they would
     reach 100% and never render full — a package's completion is marked on the
     card instead (see .mdl-gild). The bar this reaches is the masthead's, and
     100% there means every card in the ledger has arrived, which is the largest
     thing this app has to say and is worth the light it costs. Gated on the
     crossing rather than the state: see useJustBecame.
     `radius` is separate from `height` for the two card bars only: they sit on
     their card's own top edge, where the card's 10px corner is already doing
     the rounding and a pill would read as a second, smaller shape floating
     inside it. Everywhere else the default (a full pill) is what you want. */
  const justDone = useJustBecame(pct >= 100);
  return (
    <div
      style={{
        height,
        background: C.silver,
        borderRadius: radius,
        overflow: "hidden",
        /* the stage for .mdl-sheen, which is clipped to the bar by the
           overflow above and so can never paint over the row */
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          /* accent while in progress, green once complete. The old theme used
             ink here, which worked because it was a near-black *green*; the new
             ink is a near-black violet and read as flat black on parchment. */
          background: pct >= 100 ? C.green : C.accent,
          borderRadius: radius,
          transition: "width 240ms ease, background 340ms 280ms ease",
        }}
      />
      {justDone && <i className="mdl-sheen" aria-hidden="true" />}
    </div>
  );
}

/* ---------- Item row ---------- */

function ItemRow({
  item,
  got,
  onSet,
  variant = "package",
  onOpenOrder,
  stamped = false,
  /* set only while a card is being opened by hand, so the rows can be laid
     down in order rather than switched on at once. Absent everywhere else,
     which is what keeps a re-sort or a view switch silent. */
  className,
  revealIndex = 0,
}) {
  const done = got >= item.qty;
  const partial = got > 0 && !done;
  /* the tick draws only when this row is checked in under the finger, never
     when a done row simply renders (a view switch, a re-sort, a filter change) */
  const inked = useJustBecame(done, 400);
  const toggle = () => onSet(item.key, done ? 0 : item.qty);
  /* in the Tally view the name is the group heading, so the row leads with
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
  /* `stamped`: the copy's order carries a stamp, so it is being handled and
     the warning would nag about a claim already filed — same rule as the
     package header, plumbed down because a row knows only its own item */
  const lost = source ? lostMail(item.date, item.tracking, done || stamped) : null;
  return (
    <div
      onClick={toggle}
      className={className}
      style={{
        /* its place in the stagger; read by .mdl-reveal, inert without it */
        "--i": revealIndex,
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
          background: done ? C.green : partial ? C.manila : C.card,
          color: done ? C.card : C.manilaInk,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          /* the wash and its rule soak in rather than switching; colour only,
             so the 30px box never moves under the next tap */
          transition:
            "background 200ms ease, border-color 200ms ease, color 200ms ease",
        }}
      >
        {/* the tick is drawn, not typed: one stroke left to right, which is
            what the glyph was always standing in for. An SVG rather than the
            "✓" character purely so it can be written — the aria-label above
            carries the meaning either way, and the partial state stays a
            typographic dash because a half-drawn stroke would read as a tick
            still arriving. */}
        {done ? (
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path
              className={inked ? "mdl-nib" : undefined}
              d="M4 12.5 L9.5 18 L20 6"
              fill="none"
              stroke={C.card}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : partial ? (
          "–"
        ) : (
          ""
        )}
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
            ellipsis, and it's the key for chasing a refund. In the Tally view
            it is also the way out: this copy is one line of a real order, and
            the question it raises — "what else was in that envelope?" — has no
            other answer here. Tapping opens that whole order in Packages.
            stopPropagation is load-bearing: the whole row toggles a check-in,
            so without it a navigation tap would silently mark the card
            received. That's a data write from a gesture that meant to look,
            and exactly the mis-tap invariant no-layout-shift-under-pointer exists to prevent. */}
        {source &&
          (onOpenOrder ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenOrder(gkOf(item));
              }}
              aria-label={`Show the whole order ${item.orderId}`}
              title={item.orderId}
              style={{
                marginTop: 1,
                minHeight: 30,
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 0",
                border: 0,
                background: "transparent",
                fontFamily: mono,
                fontSize: 10.5,
                color: C.inkSoft,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {/* ellipsis has to sit on the text child of a flex row, and the
                  child needs min-width 0 or it refuses to shrink */}
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                {item.orderId}
              </span>
              <span style={{ flexShrink: 0 }}>{"\u203a"}</span>
            </button>
          ) : (
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
          ))}
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
  background: C.card,
  color: C.ink,
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  padding: 0,
};

/* the order-stamp chip: the RECEIVED stamp's construction in the advisory
   colour — manilaInk on card, rotated a touch less — since it is a status the
   user set rather than the ledger's own verdict */
/* the editor's five kinds, in the month picker's treatment: an option cell
   carrying its own rule. Referenced lazily, so it may sit above optCell. */
const stampKindCell = (on) => ({
  ...optCell(on),
  padding: "0 10px",
  border: `1px solid ${on ? C.accent : C.line}`,
});
const stampChip = {
  fontFamily: mono,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: C.manilaInk,
  border: `2px solid ${C.manilaInk}`,
  borderRadius: 4,
  padding: "3px 8px",
  transform: "rotate(-3deg)",
  /* read by the shared landing keyframes, so this chip and the RECEIVED stamp
     share one animation and each returns to its own angle */
  "--rest": "-3deg",
  flexShrink: 0,
  background: C.card,
  whiteSpace: "nowrap",
  display: "inline-block",
};

/* ---------- Package (order + seller) group ---------- */

function PackageCard({
  pkg,
  received,
  onSet,
  onBulk,
  hiddenByFilters = 0,
  revealed = false,
  onToggleReveal,
  innerRef,
  stamp,
  onStamp,
}) {
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
  const missingVal = outstandingOf(pkg.items, received).value;
  const missingValLabel =
    missingVal >= 100
      ? `$${Math.round(missingVal).toLocaleString()}`
      : `$${missingVal.toFixed(2)}`;
  /* true only when this card is opened by hand, never when it renders already
     open — an unreceived package starts expanded (`useState(!done)`), so a
     bare class would set every open card on the page animating at once on
     load, competing with the letterhead's own sequence. Same gate, same
     reason, as the stamp landing below. */
  const justOpened = useJustBecame(open, 500);
  const justStamped = useJustBecame(done);
  const stamped = hasStamp(stamp);
  /* the order stamp the user sets by hand lands the same way the ledger's own
     verdict does — same keyframes, its own resting angle */
  const justBanded = useJustBecame(stamped);
  const refunded = isRefundStamp(stamp);
  /* a stamped order is being handled — the warning would nag about a claim
     that is already filed, and for a reshipment the original order date means
     nothing at all. `done` already means "no warning"; so does this. */
  const lost = lostMail(pkg.date, pkg.tracking, done || stamped);

  /* the stamp editor, local to the card. Two-tap on Remove, the same pair
     EnvelopeCard carries: one timer, one armed control, cleared on unmount. */
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState("");
  const [note, setNote] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const timer = useRef(null);
  const cancelRef = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  /* an ask puts first focus on its way out (ux-ask-or-undo) */
  useEffect(() => {
    if (confirmRemove) cancelRef.current?.focus();
  }, [confirmRemove]);
  const disarm = () => setConfirmRemove(false);
  const arm = (set, val) => {
    disarm();
    set(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(disarm, 4000);
  };
  /* seeded at open time, not at mount: a merge can change the stamp under a
     mounted card, and the editor should open on what is there now */
  const openEditor = () => {
    setKind(stamped ? stamp.kind : "");
    setNote(stamped ? stamp.note || "" : "");
    setEditing(true);
  };
  const closeEditor = () => {
    clearTimeout(timer.current);
    disarm();
    setEditing(false);
  };

  return (
    <div
      ref={innerRef}
      style={{
        position: "relative",
        background: C.card,
        border: `1px solid ${done ? C.green : C.line}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: `0 1px 2px ${C.shadow}`,
        /* clears the 46px running head when the Tally view scrolls us here */
        scrollMarginTop: 58,
      }}
    >
      {/* One pass of gold across the card on the tap that completes it, on the
          same beat as the stamp landing. This is where the completion moment
          actually lives: the per-package progress bar is mounted only while
          `gotQty > 0 && !done`, so it is gone before it can ever render at
          100% — the bar cannot mark its own completion because it does not
          survive it. The card does. Absolutely positioned and pointer-events
          none inside the card's existing relative/overflow-hidden box, so it
          is clipped to the card, catches no taps and moves nothing. */}
      {justStamped && <i className="mdl-gild" aria-hidden="true" />}
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
            /* the sheet's easing, and long enough to read: on the way closed
               this is the only thing that moves, because the rows are gone in
               the same commit as the tap */
            transition: "transform 200ms cubic-bezier(.16,1,.3,1)",
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
            /* it is a stamp, so it lands like one — but only on the tap that
               actually completed the package. `justStamped` is false on a fresh
               mount, which is what keeps a view switch from restamping every
               finished order on the page at once. */
            className={justStamped ? "mdl-land" : undefined}
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
              /* the angle the landing returns to, read by the shared keyframes */
              "--rest": "-4deg",
              flexShrink: 0,
              background: C.card,
            }}
          >
            RECEIVED
          </span>
        ) : (
          <span
            style={{
              /* deliberately Cochin, not mono: the user wanted the outstanding
                 pill to read as part of the letterhead voice rather than as
                 tabular data. The exception to "mono for numbers". */
              fontFamily: cochin,
              fontSize: 12.5,
              fontWeight: 700,
              /* manila once refunded: the cards are still out, but no money
                 is — the red figure would be claiming a loss that isn't one */
              color: refunded ? C.manilaInk : C.red,
              background: refunded ? C.manila : C.redSoft,
              borderRadius: 999,
              padding: "3px 10px",
              flexShrink: 0,
            }}
          >
            {totalQty - gotQty} left · {refunded ? "refunded" : missingValLabel}
          </span>
        )}
      </button>

      {/* The stamp band: the order's status, visible collapsed too, and — once
          a stamp exists — the control that edits it. A sibling of the header
          button, above the rows, so nothing moves under a thumb mid-check-in
          (invariant no-layout-shift-under-pointer); opening the editor is a deliberate tap on the band,
          the same class of move as expanding the package. */}
      {stamped && !editing && (
        <button
          onClick={openEditor}
          aria-label={`Edit stamp on ${pkg.seller}`}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px 10px",
            border: 0,
            background: "transparent",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span
            className={justBanded ? "mdl-land" : undefined}
            style={stampChip}
          >
            {STAMP_LABEL[stamp.kind].toUpperCase()} · {(stamp.at || "").slice(5)}
          </span>
          {/* ellipsis has to sit on the text child, which needs min-width 0 */}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: cochin,
              fontStyle: "italic",
              fontSize: 13.5,
              lineHeight: 1.3,
              color: C.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {stamp.note || ""}
          </span>
          <span
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: C.inkSoft,
              flexShrink: 0,
            }}
          >
            {"\u203a"}
          </span>
        </button>
      )}
      {editing && (
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ ...subHead, margin: "0 0 8px" }}>
            <span style={cellLab}>Stamp</span>
            <span style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          {/* six cells will not fit one row at 375px; wrapping is the plan */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STAMP_KINDS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                style={stampKindCell(kind === k)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything else — what they said, when…"
            aria-label="Stamp note"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 10,
              fontFamily: cochin,
              /* 16px or focusing it zooms the page on iOS */
              fontSize: 16,
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: C.card,
              color: C.ink,
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            {stamped && (
              <button
                onClick={() => {
                  if (confirmRemove) {
                    onStamp(pkg.gk, null);
                    closeEditor();
                  } else arm(setConfirmRemove, true);
                }}
                style={{
                  ...miniBtn,
                  fontSize: 11,
                  padding: "5px 9px",
                  color: confirmRemove ? C.card : C.red,
                  background: confirmRemove ? C.red : C.card,
                  borderColor: confirmRemove ? C.red : C.redSoft,
                  fontWeight: confirmRemove ? 700 : 400,
                }}
              >
                {confirmRemove ? `Tap again to remove stamp from ${cardsOf(totalQty)}` : "Remove stamp"}
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button ref={cancelRef} onClick={closeEditor} style={miniBtn}>
              Cancel
            </button>
            <button
              onClick={() => {
                onStamp(pkg.gk, { kind, note });
                closeEditor();
              }}
              disabled={!kind}
              style={{
                ...miniBtn,
                background: kind ? C.ink : C.card,
                color: kind ? C.card : C.inkSoft,
                borderColor: kind ? C.ink : C.line,
                fontWeight: kind ? 700 : 400,
                cursor: kind ? "pointer" : "default",
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Out of flow, on the card's own top edge — see edgeBar. In flow this
          was a 15px child appearing between the header and the item rows on
          the FIRST check-in, so it pushed every remaining row in the package
          down by 15px, under the thumb that had just tapped one of them
          (invariant no-layout-shift-under-pointer). Mounting an absolutely positioned element reflows
          nothing, so the gate can stay exactly as it was — which is what keeps
          .mdl-gild the sole marker of completion. */}
      {gotQty > 0 && !done && (
        <div style={edgeBar}>
          <ProgressBar
            pct={(gotQty / totalQty) * 100}
            height={EDGE_BAR_H}
            radius={0}
          />
        </div>
      )}

      {open && (
        <>
          <div
            className={justOpened ? "mdl-reveal" : undefined}
            style={{
              "--i": 0,
              display: "flex",
              gap: 8,
              padding: "0 14px 8px",
              justifyContent: "flex-end",
              /* held at its tallest state so the row never changes height when
                 a button joins or leaves it — see BULK_ROW_H */
              minHeight: BULK_ROW_H,
              boxSizing: "content-box",
            }}
          >
            {/* the first stamp's only entrance; once one exists the band is
                the control. marginRight auto keeps the bulk buttons right. */}
            {!stamped && !editing && (
              <button
                onClick={openEditor}
                style={{ ...miniBtn, marginRight: "auto" }}
              >
                Stamp
              </button>
            )}
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
          {pkg.items.map((it, i) => (
            <ItemRow
              key={it.key}
              className={justOpened ? "mdl-reveal" : undefined}
              revealIndex={i + 1}
              item={it}
              got={Math.min(it.qty, received[it.key] || 0)}
              onSet={onSet}
            />
          ))}
          {/* The way out of a search. A filtered card looks exactly like a
              one-line order, which is the wrong thing to believe when you are
              holding the envelope — so say how many lines the filters took and
              offer the whole order. Deliberately below the rows and outside
              the tap area of any of them. */}
          {(hiddenByFilters > 0 || revealed) && onToggleReveal && (
            <button
              onClick={() => onToggleReveal(pkg.gk)}
              aria-expanded={revealed}
              style={{
                width: "100%",
                minHeight: CTL_H,
                padding: "8px 14px",
                textAlign: "left",
                border: 0,
                borderTop: `1px solid ${C.line}`,
                background: "transparent",
                fontFamily: mono,
                fontSize: 11,
                color: C.inkSoft,
                cursor: "pointer",
              }}
            >
              {revealed ? (
                <>
                  Showing the whole order{" "}
                  <u style={{ textUnderlineOffset: 2 }}>back to matches</u>
                </>
              ) : (
                <>
                  +{hiddenByFilters} more line{hiddenByFilters === 1 ? "" : "s"}{" "}
                  in this order{" "}
                  <u style={{ textUnderlineOffset: 2 }}>show all</u>
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Item total (same product name across every seller) ---------- */

function ItemTotalRow({ item, received, onSet, onBulk, onOpenOrder, stampedGks }) {
  const totalQty = item.qty;
  const gotQty = item.items.reduce(
    (s, it) => s + Math.min(it.qty, received[it.key] || 0),
    0
  );
  const done = gotQty >= totalQty;
  const [open, setOpen] = useState(false);
  /* same gate as PackageCard's: the act of opening, never a re-render */
  const justOpened = useJustBecame(open, 500);
  const missingVal = outstandingOf(item.items, received).value;
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
        /* the containing block for the top-edge progress bar below; PackageCard
           already had one for .mdl-gild */
        position: "relative",
        background: C.card,
        border: `1px solid ${done ? C.green : C.line}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: `0 1px 2px ${C.shadow}`,
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
            /* the sheet's easing, and long enough to read: on the way closed
               this is the only thing that moves, because the rows are gone in
               the same commit as the tap */
            transition: "transform 200ms cubic-bezier(.16,1,.3,1)",
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
          {/* the unit rate, not the whole position — what one copy averaged.
              Labelled, so it never reads as the red outstanding figure below.
              The full position is still one tap away: expanding shows
              "$X across N copies · $Y avg". */}
          <div
            style={{
              fontFamily: mono,
              fontSize: 11.5,
              color: C.inkSoft,
              whiteSpace: "nowrap",
            }}
          >
            {money(item.avg)} / copy
          </div>
          {!done && (
            <div
              style={{
                fontFamily: cochin,
                fontSize: 12,
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

      {/* the same top-edge bar as PackageCard's, for the same reason — see
          edgeBar. The wrapper above carries `position: relative` only to be
          this bar's containing block. */}
      {gotQty > 0 && !done && (
        <div style={edgeBar}>
          <ProgressBar
            pct={(gotQty / totalQty) * 100}
            height={EDGE_BAR_H}
            radius={0}
          />
        </div>
      )}

      {open && (
        <>
          <div
            className={justOpened ? "mdl-reveal" : undefined}
            style={{
              "--i": 0,
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
          {/* deliberately NOT reserved the way PackageCard's row is: there is no
              Stamp button here, so the two bulk buttons are 282px of the 313px
              a card gives them at 375px, neither wraps, and the row is one line
              in every state it passes through. Add a third control here and it
              will start wrapping like that one — reserve it then, and measure
              at 375px rather than assuming BULK_ROW_H still fits. */}
          <div
            className={justOpened ? "mdl-reveal" : undefined}
            style={{
              "--i": 1,
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
          {item.shown.map((it, i) => (
            <ItemRow
              key={it.key}
              className={justOpened ? "mdl-reveal" : undefined}
              revealIndex={i + 2}
              item={it}
              got={Math.min(it.qty, received[it.key] || 0)}
              onSet={onSet}
              variant="source"
              onOpenOrder={onOpenOrder}
              stamped={!!stampedGks?.has(gkOf(it))}
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
  background: C.card,
  color: C.ink,
};

/* "14 cards" */
const cardsOf = (n) => `${n} card${n === 1 ? "" : "s"}`;

const miniBtn = {
  fontFamily: mono,
  fontSize: 11.5,
  padding: "8px 12px",
  borderRadius: 5,
  border: `1px solid ${C.line}`,
  background: C.card,
  color: C.ink,
  cursor: "pointer",
};

/* ---------- the card's reserved geometry ----------
   Both of these exist for one reason: a card must not change height on the tap
   that checks a card in, because the rows below it are under the thumb that
   just tapped (invariant no-layout-shift-under-pointer). This is the same defect the save indicator's
   reserved slot fixed in the masthead, one level down and larger — measured at
   375px it was 28px, against that one's 12–14px.

   The progress bar is taken OUT OF FLOW rather than reserved: it lives on the
   card's top edge, absolutely positioned inside the card's existing
   `overflow: hidden` rounded box, so it is clipped to the card, catches no
   taps, and can be mounted and unmounted without moving anything. That is why
   it keeps its `gotQty > 0 && !done` gate — and so why it still cannot render
   at 100%, leaving .mdl-gild the only marker of a package completing. A
   reserved in-flow slot would have cost that. 3px because it is now a rule on
   an edge rather than a bar in a row, and it reads at a glance against the
   card's border either way. */
const EDGE_BAR_H = 3;
const edgeBar = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  /* it now lies across the top of the header button, so it must be invisible
     to the pointer — a bar that swallowed that tap would stop the card from
     collapsing, and the rounding it does not need is the card's corner's job
     (hence radius={0} at the call sites) */
  pointerEvents: "none",
};

/* The package card's contextual action row, reserved at its TALLEST state.
   Its membership changes on the same tap — "Clear check-ins" joins "Stamp" and
   "Mark all received" — and at 375px those three want 60.6 + 143.7 + 129.9 px
   plus two 8px gaps = 350px in the 313px the card gives them, so both bulk
   labels wrap to a second line and the row grows 31px -> 46px. It shrinks by
   the same 15px on the tap that COMPLETES a package, where "Mark all received"
   leaves: reserving the tallest state pins both transitions at once.

   This is a counted constant, exactly like the save slot's 13ch, and it goes
   stale the same way: it is two lines of 11.5px mono plus miniBtn's 8px
   padding. Change either of those labels, miniBtn's font size or padding, or
   the card's width, and RE-MEASURE — jsdom has no layout, so the suite pins
   that the reservation is there and never varies, and can never say whether it
   is big enough.

   Measured, content height needed against the 46 reserved: 57 at 320px, 46 at
   360 / 375 / 390, 31 at 430 and 760 (where all three fit one line and the
   reservation is 15px of slack). So this covers 360px up, and **at 320px the
   row still steps 11px** — three buttons wrap to a THIRD line there. Left
   deliberately: 320 is below this app's stated 380px floor and is not a
   viewport current iOS runs, and reserving 57 would buy it by spending 26px of
   dead space in every expanded card at the widths that are real. The bar half
   of the fix is width-independent, so 320 still improves from 28px to 11px.
   If that last 11px is ever wanted, the way to get it without the dead space
   is to keep all three buttons mounted and hide the inapplicable one
   (`visibility: hidden`), which makes the row self-measuring at every width —
   at the cost of the visible label wrapping at rest, which is a look. */
const BULK_ROW_H = 46;

/* How long the app has to be in the background before coming back counts as
   "reopening it" rather than "glancing away". iOS keeps a home-screen web app's
   page alive when you switch away, so without this the only thing that resets
   Showing is the system evicting the page — which can be days. A short hop out
   to read a tracking number and straight back is not a new session, and
   flipping the list under someone mid-check-in is the mis-tap invariant no-layout-shift-under-pointer
   exists to prevent. A minute is comfortably longer than that hop and far
   shorter than any real "I'll come back to this later". */
const RESUME_RESET_MS = 60_000;

/* ---------- the toolbar vocabulary ----------
   One height for every control inside the disclosure panels. Before this,
   chips were `5px 11px`, selects `9px 8px` and buttons `9px 12px`, so nothing
   shared a baseline and the rows wrapped raggedly — that mismatch, not the
   colours, is what read as unfinished. Change CTL_H and every option cell,
   the day stepper and the key field follow. (The boxed `ctl`/`chip` controls
   this constant was written for are gone: the last of them — the file
   actions and the Sync panel's buttons — became a ruled action row and an
   option grid, see `.mdl-lrow` and the Ledger tab.) */
const CTL_H = 34;

/* preset → label, module-level so the collapsed control and the expanded chips
   cannot drift apart. The values are deliberately heterogeneous — "all", raw
   numbers, "days", "custom" — because the numeric ones are used arithmetically
   when the range is applied. Do not stringify them. */
const RANGES = [
  ["all", "All time"],
  [30, "30 days"],
  [45, "45 days"],
  [60, "60 days"],
  [90, "90 days"],
  ["days", "Last…"],
  ["custom", "By month"],
];

/* ---------- the ruled head ----------
   The masthead already establishes a vocabulary the control region used to
   ignore: hairline rules, ruled thirds, uppercase mono micro-labels over
   values. This is that vocabulary continued — no boxes, no radii, no fills
   except the one accent that means "active" everywhere else in the app.
   Rules are `line`, NOT `gold`: gold is masthead ornament and fails for
   anything carrying information (2.09:1). */
const RULE = { height: 1, background: C.line };
const RULE_THIN = { height: 1, background: C.line, opacity: 0.55 };

const cellLab = {
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: C.inkSoft,
};
/* minWidth 0 and the ellipsis on the TEXT CHILD, not here: text-overflow does
   nothing on a flex container, and a flex item defaults to minWidth:auto so it
   refuses to shrink. Measured before this was fixed — a long sort label took
   its cell from 114px to 182px, squeezed the other two, and pushed the document
   to 377px in a 375px viewport. */
const cellVal = {
  fontFamily: cochin,
  fontSize: 15,
  lineHeight: 1.15,
  color: C.ink,
  display: "flex",
  alignItems: "baseline",
  gap: 5,
  minWidth: 0,
};
const cellValText = {
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const cellFig = {
  fontSize: 10,
  color: C.inkSoft,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
/* `last` drops the divider on the right-hand cell */
const headCell = (last) => ({
  minHeight: 46,
  padding: "7px 9px 8px",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  border: 0,
  borderRight: last ? "none" : `1px solid ${C.line}`,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  minWidth: 0,
});
/* the affordance. A cell built out of the same parts as the masthead's
   READ-ONLY tallies reads as a statistic, so the two cells that open something
   underline their value — a form's write-on rule, not a button box. */
const valUnder = (open) => ({
  borderBottom: `1px solid ${open ? C.accent : C.line}`,
  /* the rule takes the ink rather than switching to it — the same beat as the
     caret turning beside it, so the cell reads as one gesture */
  transition: "border-color 200ms ease",
});
const headCaret = (open) => ({
  fontSize: 10,
  color: C.inkSoft,
  flexShrink: 0,
  transform: open ? "rotate(180deg)" : "none",
  transition: "transform 140ms ease",
});
/* one option in the date or sort panel. The 1px gap over a `line` background
   is what draws the grid, so a missing cell would show the rule colour through
   — hence the last option spans the row. */
const optCell = (on) => ({
  height: CTL_H,
  border: 0,
  background: on ? C.accent : C.card,
  color: on ? C.card : C.ink,
  fontFamily: mono,
  fontSize: 11.5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  cursor: "pointer",
});

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* sort vocabularies, one per view. Module-level so the panel and the collapsed
   value in the head cannot drift apart — the same mistake the date range's
   label made before RANGES was hoisted. */
const PKG_SORTS = [
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["value", "$ remaining"],
  ["rate", "Unit rate"],
  ["seller", "Seller A–Z"],
];
const ITEM_SORTS = [
  ["missing", "Most missing"],
  ["basis", "Cost basis"],
  ["ordered", "Most ordered"],
  ["value", "$ remaining"],
  ["rate", "Unit rate"],
  ["name", "Name A–Z"],
];

/* No fill. With `background: C.card` this painted a beige rectangle ruled top
   and bottom whose left and right edges simply stopped, square-cornered and
   full-bleed to the column, in an app where every other filled surface is a
   rounded inset card. The fill was the only thing creating an edge to resolve —
   and the region's whole thesis is hairlines, no boxes and no fills. The option
   grid still reads: optGrid paints C.line and each optCell paints C.card over
   it, so the cells sit slightly raised against the page. */
const panelWrap = {
  padding: "4px 9px 11px",
  borderTop: `1px solid ${C.line}`,
};
/* the 1px gap over a `line` background IS the grid — cells paint `card` over it */
const optGrid = (cols) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  gap: 1,
  background: C.line,
  border: `1px solid ${C.line}`,
  marginTop: 10,
});
const subRow = { display: "flex", alignItems: "center", gap: 9, marginTop: 10 };
const subHead = { display: "flex", alignItems: "center", gap: 9, margin: "11px 0 8px" };
/* the rule is an inset shadow, not a border: a 1px border eats the content box
   and leaves the − and + at 32px, under the app's own touch floor */
const well = {
  display: "inline-flex",
  alignItems: "stretch",
  height: CTL_H,
  borderRadius: 999,
  background: C.card,
  overflow: "hidden",
  boxShadow: `inset 0 0 0 1px ${C.line}`,
};
const dayStep = {
  width: CTL_H,
  border: 0,
  background: "transparent",
  color: C.ink,
  fontFamily: mono,
  fontSize: 15,
  cursor: "pointer",
};
const numBox = {
  width: 46,
  border: 0,
  background: "transparent",
  textAlign: "center",
  fontFamily: mono,
  fontSize: 13,
  color: C.ink,
  outline: "none",
  boxShadow: `inset 1px 0 0 ${C.line}, inset -1px 0 0 ${C.line}`,
};
const exactToggle = {
  height: CTL_H,
  display: "flex",
  alignItems: "center",
  gap: 7,
  marginTop: 11,
  border: 0,
  background: "transparent",
  fontFamily: mono,
  fontSize: 11,
  color: C.inkSoft,
  cursor: "pointer",
  padding: 0,
};
const cancCell = (on) => ({
  flexShrink: 0,
  border: 0,
  borderLeft: `1px solid ${C.line}`,
  background: "transparent",
  padding: "0 10px",
  fontFamily: mono,
  fontSize: 10,
  color: on ? C.ink : C.inkSoft,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  whiteSpace: "nowrap",
  cursor: "pointer",
});

/* An underlined text button, for secondary actions that shouldn't carry a
   control's weight — same treatment as the "N canceled — view" link. */
const linkBtn = {
  fontFamily: mono,
  fontSize: 11,
  color: C.inkSoft,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 2,
  padding: 0,
};

/* ---------- the Sync panel's particulars ----------
   Micro-label beside a mono value: the head cells' own two parts, laid on
   their side so three of them stack under the option grid. `minmax(0, 1fr)`
   on the value track for the reason headCell needs minWidth 0 — the photo
   target is 44 characters, wider than a 375px column minus the label, and it
   has to wrap inside its track rather than push the panel past the page. */
/* One row of the Ledger tab: label and sub line left, mono value right. The
   chevron is CSS, shown only on a row that opens something (aria-expanded), so
   it never enters the row's text. */
const LedgerRow = ({ label, sub, value, accent, expanded, pressed, onClick, disabled }) => (
  <button
    className="mdl-lrow"
    onClick={onClick}
    disabled={disabled}
    aria-expanded={expanded}
    aria-pressed={pressed}
  >
    <span className="l">
      <span className="t">{label}</span>
      {sub && <span className="s">{sub}</span>}
    </span>
    {value && (
      <span className="v" style={accent ? { color: accent } : null}>
        {value}
      </span>
    )}
  </button>
);

const partGrid = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  columnGap: 12,
  rowGap: 6,
  alignItems: "baseline",
  marginTop: 2,
};
const partLab = { ...cellLab, whiteSpace: "nowrap" };

/* ---------- the saved-versions list ----------
   A hairline per row and the head cells' own two parts laid on their side, so
   the list reads as more of the ruled region rather than as a tray dropped
   into it. No fills and no radii: `restoreCell` is the one exception, and only
   when armed, because a primed destructive control has to be unmistakable. */
const verRow = { borderTop: `1px solid ${C.line}`, paddingTop: 8 };
const verHead = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  width: "100%",
  padding: 0,
  border: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
};
const verWhen = { fontFamily: mono, fontSize: 11, color: C.ink, flexShrink: 0 };
const verFig = {
  fontFamily: mono,
  fontSize: 10.5,
  color: C.inkSoft,
  marginLeft: "auto",
  flexShrink: 0,
};
/* the force's treatment, in red rather than manila: a restore replaces the
   ledger, which is the one thing "Push anyway" does not do */
const restoreCell = (armed) => ({
  ...optCell(false),
  padding: "0 12px",
  border: `1px solid ${armed ? C.red : C.line}`,
  background: armed ? C.red : C.redSoft,
  color: armed ? C.card : C.red,
  fontWeight: armed ? 700 : 400,
});
const partVal = {
  fontFamily: mono,
  fontSize: 11,
  lineHeight: 1.5,
  color: C.inkSoft,
  minWidth: 0,
  overflowWrap: "anywhere",
};
/* The token field is a write-on rule like FIND, not a box. 16px is not a
   choice: iOS zooms the page on focusing any input smaller than that, and the
   viewport meta deliberately leaves the user able to zoom. */
const keyField = {
  flex: "1 1 140px",
  minWidth: 0,
  height: CTL_H,
  boxSizing: "border-box",
  border: 0,
  borderBottom: `1px solid ${C.line}`,
  borderRadius: 0,
  background: "transparent",
  fontFamily: mono,
  fontSize: 16,
  color: C.ink,
  outline: "none",
  padding: "0 2px",
};
/* the month chips' treatment: an option cell carrying its own rule */
const keySave = {
  ...optCell(false),
  padding: "0 12px",
  border: `1px solid ${C.line}`,
  flexShrink: 0,
};

/* Every way the remote backup can fail, phrased for someone holding a phone.
   Keyed by the `.code` window.remote puts on its errors — see entry.jsx.
   The offline wording is deliberately reassuring: nothing was lost, this is a
   backup rather than a sync, and the ledger on the device is still the real
   one. */
const REMOTE_SAYS = {
  "no-key": "Older versions can’t be loaded on this device.",
  "no-access": "Older versions can’t be loaded on this device.",
  "bad-key": "Older versions can’t be loaded on this device.",
  auth: "Older versions can’t be loaded on this device.",
  forbidden: "Older versions can’t be loaded on this device.",
  "rate-limit": "Too many requests. Try again shortly.",
  conflict: "The backup changed in the meantime.",
  missing: "There are no older versions yet.",
  "no-branch": "There are no older versions yet.",
  offline: "No connection. The ledger is safe on this device.",
  server: "The backup service is having trouble. Try again.",
  "bad-response":
    "That isn’t a Mail Day ledger. Nothing on this device was changed.",
};

/* One retry on an unknown look, shared by the foreground check and autoPush:
   a single transient failure must not read as "behind" or "ahead". */
async function peekTwice() {
  const look = () => window.remote.peek().catch(() => null);
  const p = await look();
  /* a retry cannot change either of these */
  if (p && (p.known || p.reason === "no-access" || p.reason === "rate-limit")) return p;
  return look();
}

/* A SEPARATE table, and photo failures get a separate piece of state, because
   the ledger's codes drive `pushState` and `pushState === "conflict"` is the
   only thing gating "Push anyway" — which force-overwrites the LEDGER. GitHub
   answers 409 to rapid successive writes on one repo, so routing a throttled
   photo upload through the ledger's error path would offer the user a button
   that silently discards another device's check-ins. Photos must never be able
   to arm that. */
/* A timer that only schedules background work (a push, a retry, a sweep) must
   not keep a Node host alive after the page is gone. In a browser the handle
   is a number and unref does not exist, so this is a plain setTimeout there. */
function bgTimeout(fn, ms) {
  const t = setTimeout(fn, ms);
  t?.unref?.();
  return t;
}
const NO_PHOTO_BACKUP =
  "Some photos are not backed up yet. They stay on this device and sync again on their own.";
const PHOTO_SAYS = {
  "no-access":
    "Photos need more setup on this device, so they could not sync from it.",
  "no-key": "Photos need a key to sync. The ledger above is safe either way.",
  auth: NO_PHOTO_BACKUP,
  forbidden: NO_PHOTO_BACKUP,
  "rate-limit": NO_PHOTO_BACKUP,
  "no-branch": NO_PHOTO_BACKUP,
  missing: NO_PHOTO_BACKUP,
  offline: "No connection, so photos didn’t sync. Nothing was lost.",
  unreadable: "This device’s photos could not be read, so no new photos were backed up.",
  conflict: NO_PHOTO_BACKUP,
  server: NO_PHOTO_BACKUP,
};

/* The ONE place a payload is turned into a ledger, and the only thing standing
   between a corrupt file and a wiped one. Two callers now — the restore path
   and the merge path — which is exactly why it stopped being two inline lines
   inside applyBackup. `{"hello":"world"}` parses as JSON perfectly well; the
   `mailday` marker and an items ARRAY are what make it ours.
   Throws bare, like it always did: callers report `bad-response`. */
function parseLedger(text) {
  const data = JSON.parse(text);
  if (!data.mailday || !Array.isArray(data.items)) throw new Error();
  return data;
}

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
          fontFamily: cochin,
          fontWeight: 700,
          fontSize: 14,
          background: C.ink,
          color: C.card,
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
/* `epoch` exists because the key below is the id list and nothing else, and a
   pull can write blobs WITHOUT changing that list — same ids, new array,
   identical join, so the effect never re-runs and the photos you just
   downloaded stay blank squares until a reload. Anything that writes to the
   photo store bumps the epoch; that is what puts them on screen. */
/* The set of package keys whose stamp satisfies `pred`, with an identity that
   changes only when the MEMBERSHIP does. `stamps` is a fresh object on every
   note edit, and if that rebuilt liveItems → packages, packageOrder would
   re-freeze the sort mid-check-in — the leapfrog invariant no-layout-shift-under-pointer exists to
   prevent. Keying the memo on the sorted membership string keeps a typo fix
   from reshuffling the list. `pred` must be a module-level constant. */
function useGkSet(stamps, pred) {
  const key = useMemo(
    () =>
      Object.keys(stamps)
        .filter((gk) => pred(stamps[gk]))
        .sort()
        .join("\u0000"),
    [stamps, pred]
  );
  return useMemo(() => new Set(key ? key.split("\u0000") : []), [key]);
}

function usePhotoUrls(ids, epoch = 0) {
  const key = `${epoch}|${(ids || []).join(",")}`;
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

function PhotoStrip({ ids, onRemove, epoch = 0 }) {
  const urls = usePhotoUrls(ids, epoch);
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
                  background: C.card,
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
            background: C.scrim,
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
function EnvelopeComposer({ initial, suggestions, onSave, onCancel, target, draftRef }) {
  /* reopen on the draft the app kept for this target, if there is one */
  const kept = draftRef.current.get(target) ?? null;
  const [draft, setDraft] = useState(kept?.draft ?? "");
  const [entries, setEntries] = useState(
    () => kept?.entries ?? (initial?.entries || []).map((e) => ({ ...e }))
  );
  const [note, setNote] = useState(kept?.note ?? (initial?.note || ""));
  const [photos, setPhotos] = useState(
    () => kept?.photos ?? [...(initial?.photos || [])]
  );
  /* hand the draft up only when it differs from where it started */
  useEffect(() => {
    const dirty =
      draft !== "" ||
      note !== (initial?.note || "") ||
      JSON.stringify(entries) !== JSON.stringify(initial?.entries || []) ||
      photos.join() !== (initial?.photos || []).join();
    /* delete then set, so the last key is the most recently touched composer */
    draftRef.current.delete(target);
    if (dirty) draftRef.current.set(target, { target, draft, entries, note, photos });
  }, [draft, entries, note, photos, initial, target, draftRef]);
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
        boxShadow: `0 1px 2px ${C.shadow}`,
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
            fontFamily: cochin,
            /* 16px or iOS Safari zooms the page on focus and never zooms back */
            fontSize: 16,
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: C.card,
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
                  fontFamily: cochin,
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
                fontFamily: cochin,
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
                    style={dayStep}
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
                    style={dayStep}
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
            fontFamily: cochin,
            fontSize: 16,
            padding: "9px 12px",
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: C.card,
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
            background: entries.length ? C.ink : C.card,
            color: entries.length ? C.card : C.inkSoft,
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

function EnvelopeCard({ env, ranked, onAssign, onDiscard, onEdit, photoEpoch }) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  /* two-tap, same as the Reset button. Arming anything disarms everything
     else: one timer, one armed control. */
  const disarm = () => {
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
        boxShadow: `0 1px 2px ${C.shadow}`,
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
        {/* The arm must not shrink or move the label or Edit
            (ux-press-moves-nothing). So the long ask cannot sit in this row:
            Discard keeps its width, and the ask and its Cancel open as a
            panel that hangs below the row without taking space. */}
        <span style={{ position: "relative", display: "flex" }}>
          <button
            onClick={() => arm(setConfirmDiscard, true)}
            style={{
              ...miniBtn,
              fontSize: 11,
              padding: "5px 9px",
              color: confirmDiscard ? C.card : C.red,
              background: confirmDiscard ? C.red : C.card,
              borderColor: confirmDiscard ? C.red : C.redSoft,
            }}
          >
            Discard
          </button>
          {confirmDiscard && (
            <span
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 5,
                display: "flex",
                gap: 6,
                padding: 4,
                background: C.card,
                border: `1px solid ${C.redSoft}`,
                borderRadius: 8,
                boxShadow: `0 2px 6px ${C.shadow}`,
              }}
            >
              <button
                autoFocus
                onClick={disarm}
                style={{ ...miniBtn, fontSize: 11, padding: "5px 9px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => onDiscard(env.id)}
                style={{
                  ...miniBtn,
                  fontSize: 11,
                  padding: "5px 9px",
                  whiteSpace: "nowrap",
                  color: C.card,
                  background: C.red,
                  borderColor: C.red,
                  fontWeight: 700,
                }}
              >
                {`Tap again to discard ${cardsOf(total)}`}
              </button>
            </span>
          )}
        </span>
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
            <PhotoStrip ids={env.photos} epoch={photoEpoch} />
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
                      onClick={() => onAssign(env, c)}
                      style={{
                        ...miniBtn,
                        flexShrink: 0,
                        fontSize: 11.5,
                        padding: "8px 10px",
                      }}
                    >
                      This one
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
  /* item key -> ms of its last check or un-check; what lets the two-device merge
     carry an un-check. Persisted: invariant saved-state-shape. */
  const [receivedAt, setReceivedAt] = useState({});
  const [opened, setLoaded] = useState(false);
  /* the raw saved text when a list field is present but the wrong shape; the
     load stopped, so `loaded` stays false and nothing writes or syncs. */
  const [damaged, setDamaged] = useState(null);
  const loaded = opened && !damaged;
  const damagedRef = useRef(null);
  damagedRef.current = damaged;
  /* Lane B1: the one line a mend leaves, and the originals already kept this page */
  const [mended, setMended] = useState("");
  const keptRef = useRef(new Set());
  /* save the ledger as it came in to History, and wait for it. Throws when it
     cannot be written: the caller then refuses and changes nothing.
     milestones-taken-before-risk */
  const keep = async (text) => {
    if (keptRef.current.has(text)) return;
    if (!window.versions) throw new Error("unsaved");
    let lines = 0;
    let checked = 0;
    try {
      const d = JSON.parse(text);
      lines = Array.isArray(d.items) ? d.items.length : 0;
      checked = Object.values(d.received && typeof d.received === "object" ? d.received : {}).reduce(
        (n, v) => n + (typeof v === "number" ? v : 0),
        0
      );
    } catch {}
    try {
      await window.versions.put({ text, label: "damaged, as it came in", kind: "milestone", lines, checked });
    } catch {
      throw new Error("unsaved"); /* callers tell "no copy" from "not a ledger" by this message */
    }
    keptRef.current.add(text);
  };
  const mendNotice = (n) =>
    `${n} entr${n === 1 ? "y" : "ies"} could not be read; the original is in History.`;
  const [saving, setSaving] = useState("idle"); // idle | saving | saved | error
  const [query, setQuery] = useState("");
  /* the date range collapses to one control; this opens the chip set. Not
     persisted — it's a disclosure, not a preference, and it should start shut
     on every load so the toolbar is at its shortest when you open the app. */
  const [rangeOpen, setRangeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [exactOpen, setExactOpen] = useState(false);
  /* Defaults to on: the app is opened with mail in hand, and the question is
     always "what is still outstanding". Not persisted (it isn't in the saved
     shape) — this is the state every load starts from, and one tap on the
     Showing cell brings the received rows back for the session. */
  const [hideDone, setHideDone] = useState(true);
  const [showCanceled, setShowCanceled] = useState(false);
  /* the stamped filter — a filter on top of the normal list, like Showing,
     and ephemeral like it: not in the saved shape, starts off on every load */
  const [showStamped, setShowStamped] = useState(false);
  const canceledRef = useRef(null);
  useEffect(() => {
    if (showCanceled)
      // wait a frame so the section exists before scrolling
      requestAnimationFrame(() =>
        canceledRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
  }, [showCanceled]);
  const [sticky, setSticky] = useState(() => new Set()); // just-checked rows stay visible under hideDone
  /* Packages that ignore the filters and render their whole order. Search
     filters *inside* a package, so one matching line draws a card that looks
     like a one-line order; this is the way back to the rest of it. Ephemeral
     UI state — never persisted, so invariant saved-state-shape's five-site rule doesn't apply
     and `resetAll` has nothing to do here. */
  const [revealed, setRevealed] = useState(() => new Set());
  const [jumpGk, setJumpGk] = useState(null);
  const jumpRef = useRef(null);
  const [uploadErr, setUploadErr] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmForce, setConfirmForce] = useState(false);
  /* ---- saved versions ----
     A rollback list, so the operations that can lose data in bulk each have
     something standing in front of them. All ephemeral UI state plus a cache of
     what the store holds — nothing here is persisted into the ledger, so
     invariant saved-state-shape's five sites (and merge-rules' sixth) do not apply. The
     versions themselves are built from snapshot(), which is what keeps it that
     way: a third READER of the one payload builder, never a fourth builder, so
     a new persisted key reaches them for free. `stamps` proved that — it
     shipped after this and needed no change here. */
  const [versionList, setVersionList] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openVersion, setOpenVersion] = useState(null);
  /* holds the id being confirmed rather than a boolean — see `arm` below */
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [versionMsg, setVersionMsg] = useState(null);
  /* which row the message belongs to (a version id, sha, or "older"): an error
     shows where the finger was, not at the top of the panel (ux-answer-at-press) */
  const [versionMsgAt, setVersionMsgAt] = useState(null);
  /* null = the store is answering. A string = it is not, and every promise
     this feature makes is currently void — see the write path below. */
  const [versionsDown, setVersionsDown] = useState(null);
  /* null = never asked, [] = asked and the branch had none */
  const [olderVersions, setOlderVersions] = useState(null);
  const [olderBusy, setOlderBusy] = useState(false);
  const lastVersionAt = useRef(null);
  const skipFirstVersion = useRef(true);
  const [importMsg, setImportMsg] = useState("");
  const resetTimer = useRef(null);
  /* The remote backup collapses behind one control, exactly like the date
     range above — a disclosure, not a preference, so it isn't persisted and
     starts shut on every load. Push and Pull are manual: this is a backup, not
     a sync, and nothing here ever fires on its own. */
  const [syncOpen, setSyncOpen] = useState(false);
  const [remoteTarget, setRemoteTarget] = useState(null);
  const [remoteInfo, setRemoteInfo] = useState(null); // { hasKey, sha, pushedAt, pulledAt }
  const [workerKeySet, setWorkerKeySet] = useState(null); // null until asked, then true | false
  const [syncKeyMsg, setSyncKeyMsg] = useState("");
  const syncKeyInput = useRef(null);
  const [workerSyncedAt, setWorkerSyncedAt] = useState(null); // when a Worker call last succeeded
  const [serverDown, setServerDown] = useState(false); // false | "unknown" | "too-big" | "no-access": the last Worker call failed
  const [pushState, setPushState] = useState("idle"); // idle | pushing | pushed | conflict
  const [mergeState, setMergeState] = useState("idle"); // idle | merging
  /* "the other device has pushed since we last looked" — set by peek() on
     foreground, cleared by a merge or a pull. Never persisted: it is a fact
     about the remote right now, and a stale one restored from disk would
     nag about a device that has since been caught up with. */
  const [ahead, setAhead] = useState(false);
  const [photoTarget, setPhotoTarget] = useState(null);
  /* Photos get their own message and their own progress. See PHOTO_SAYS: a
     photo failure that reached `pushState` could arm "Push anyway" and
     overwrite the ledger. */
  const [photoMsg, setPhotoMsg] = useState(null); // { tone, text }
  /* "I could not look" at the photo store rides the one advisory line
     (syncBroken) and clears when a later look succeeds. It never touches
     pushState. The GitHub peek raises nothing: the user sees no GitHub state. */
  const [photoUnreadable, setPhotoUnreadable] = useState(false);
  const [photoSync, setPhotoSync] = useState(null); // { dir, done, total }
  /* Bumped by every write to the photo store, so thumbnails re-resolve after a
     pull that kept the same ids — see usePhotoUrls. */
  const [photoEpoch, setPhotoEpoch] = useState(0);
  /* One flag for the whole operation, ledger phase and photo phase together.
     Without it the "Pushed ✓" flash flips Push back to enabled 2.5s in while
     uploads are still queued, and a second tap starts a CONCURRENT second loop:
     duplicate PUTs, double the rate budget, and genuinely simultaneous writes
     to one repo — which is what produces the 409 in the first place. */
  const [syncBusy, setSyncBusy] = useState(false);
  /* The sweep reads this synchronously. setState commits on React's schedule,
     and a timer armed two seconds ago does not wait for that. */
  const syncingRef = useRef(false);
  /* A sync now runs for minutes rather than milliseconds, so Reset and a
     restore can land in the middle of one. Every await-resume checks that its
     generation is still current and bails if the world moved on. */
  const syncGen = useRef(0);
  const [keyOpen, setKeyOpen] = useState(false);
  /* uncontrolled on purpose: the token is read once on submit and never enters
     React state, so it can't turn up in a state snapshot or a DevTools dump */
  const keyInput = useRef(null);
  const [dateFilter, setDateFilter] = useState({ preset: "all", from: "", to: "" });
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("packages"); // packages | items | mystery | ledger
  const listView = view === "packages" || view === "items";
  /* The Ledger tab sorts the working view it came from, so it remembers the
     last list view. Inferred from package-sort-swaps-with-view, not ruled. */
  const lastList = useRef("packages");
  if (listView) lastList.current = view;
  const sortView = listView ? view : lastList.current;

  /* Masthead collapse. The tall block is ordinary content that scrolls away;
     the slim bar below it is `position: sticky` with a FIXED height, so it is
     always in flow and pinning changes paint, never layout. The observer only
     toggles opacity/transform — both compositor-only. This is deliberate:
     invariant no-layout-shift-under-pointer forbids anything moving under the pointer mid-check-in, and a
     header that resized on scroll would be exactly that bug. Do not "improve"
     this into a height animation. */
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
    /* `loaded` matters: the first commit renders the "Opening the ledger…"
       shell, so the sentinel isn't in the DOM yet and this would attach to
       nothing and never retry. Depending on it re-runs the effect once the
       real masthead mounts. */
  }, [opened]);
  const [itemSort, setItemSort] = useState("missing");
  /* orphaned mail: cards recorded off an unidentifiable envelope, parked until
     the user ties them to a package by hand */
  const [envelopes, setEnvelopes] = useState([]); // newest first; holds tombstones
  /* the ONE reader for everything the user sees or counts: a discarded envelope
     stays in `envelopes` as a tombstone so the discard can travel */
  const liveEnvelopes = useMemo(
    () => envelopes.filter(isLiveEnvelope),
    [envelopes]
  );
  /* order stamps, keyed by package gk — persisted, see invariant saved-state-shape */
  const [stamps, setStamps] = useState({});
  const [composing, setComposing] = useState(null); // null | "new" | envelopeId
  /* The composer's unsaved draft. A ref, not state: the composer writes it on
     every keystroke, and re-rendering the whole ledger per key drops characters
     under the iOS keyboard. It lives here so a change of view does not destroy
     it (ux-keep-what-was-made). It is never saved: no storage key, no ledger
     field. */
  const composerDraft = useRef(new Map()); // composer target -> its draft
  const resumeTarget = useRef(null); // the composer open when the person left Orphaned
  const [undo, setUndo] = useState(null); // last assignment, reversible
  const [backupBusy, setBackupBusy] = useState(false);
  const [photoUsage, setPhotoUsage] = useState(null);
  const receivedRef = useRef({});
  useEffect(() => {
    receivedRef.current = received;
  });
  /* the one writer for receivedAt: every check or un-check calls it */
  const touchReceived = useCallback((keys) => {
    const now = Date.now();
    setReceivedAt((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = now;
      return next;
    });
  }, []);
  const saveTimer = useRef(null);
  const skipFirstSave = useRef(true);
  /* "what you are looking at is a snapshot of someone else's ledger" — true
     only for a visitor, since seeding requires no key on the device */
  const [seedShown, setSeedShown] = useState(false);
  /* the notice is about PROVENANCE, not about being unsaved, so it survives
     edits: the ledger on screen is still someone else's, however much of it the
     visitor has since ticked off. It goes when they clear or replace it. */

  /* load persisted state */
  useEffect(() => {
    (async () => {
      try {
        let value = null;
        try {
          value = (await window.storage.get(STORAGE_KEY))?.value || null;
        } catch {
          /* nothing saved yet */
        }
        /* ---- the public seed ----
           Nothing saved AND no key on this device: that is someone who has just
           opened the public URL. Give them the snapshot build.mjs baked in, so
           they land on a populated app rather than an empty one, and let them
           do whatever they like with it — it hydrates into THEIR localStorage
           and nothing here can reach back.

           The `hasKey` half is the guard that matters. A device with a key is
           one of the owner's, and the seed is a build-time snapshot: seeding
           over a cleared owner-device would put stale data under a live sha,
           and auto-push would publish it. So a keyed device gets nothing here
           and recovers the way it always has, by pulling. */
        if (!value && window.seed) {
          const info = await window.remote?.status?.().catch(() => null);
          /* a Worker key is a key too: that device is one of the owner's */
          const workerKeyed = await window.sync?.hasKey?.().catch(() => false);
          if (!info?.hasKey && !workerKeyed) {
            const seeded = await window.seed.load().catch(() => null);
            if (seeded) {
              value = seeded;
              setSeedShown(true);
            }
          }
        }
        /* Not JSON at all: refuse, keep the text untouched (fallback 2). */
        let parsed = null;
        let refused = false;
        if (value) {
          try {
            parsed = JSON.parse(value);
          } catch {
            refused = true;
          }
        }
        /* A field of the wrong shape (null counts): keep a copy of the original
           in History, then go on with every entry that can be read. If the copy
           cannot be written, refuse as before (fallback 1).
           native-ledger-is-raw-json */
        /* valid JSON that is not an object (null, 5, a list) is not usable either */
        if (!refused && value && !(parsed && typeof parsed === "object" && !Array.isArray(parsed)))
          refused = true;
        const { data, dropped } = salvageLedger(parsed);
        if (!refused && dropped) {
          try {
            await keep(value);
            setMended(mendNotice(dropped));
            skipFirstSave.current = false; /* the mended ledger replaces the damaged text */
          } catch {
            refused = true;
          }
        }
        if (refused) {
          setDamaged(value);
        } else if (data) {
          setItems(data.items || []);
          setReceived(data.received || {});
          // absent on anything saved before receivedAt shipped
          setReceivedAt(data.receivedAt || {});
          // absent on anything saved before orphaned mail shipped;
          // photos absent on anything saved before photos shipped
          setEnvelopes(
            (data.envelopes || []).map((e) => ({ ...e, photos: e.photos || [] }))
          );
          // absent on anything saved before stamps shipped
          setStamps(sanitizeStamps(data.stamps));
          // device-local, never in snapshot(): when the Worker last agreed
          if (data.workerSyncedAt)
            setWorkerSyncedAt((p) => Math.max(p || 0, data.workerSyncedAt));
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
            receivedAt,
            envelopes,
            stamps,
            dateFilter,
            sortBy,
            itemSort,
            workerSyncedAt,
            savedAt: Date.now(),
          })
        );
        setSaving("saved");
      } catch {
        setSaving("error");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [items, received, receivedAt, envelopes, stamps, dateFilter, sortBy, itemSort, loaded]);

  /* The last Worker agreement is device-local and survives a reload, but a
     successful sync must not flash the save indicator (decision
     remote-sync-is-off-the-save-path). So it has its own silent write, which
     reads the newest ledger fields from a ref. */
  const payloadRef = useRef(null);
  payloadRef.current = { items, received, receivedAt, envelopes, stamps, dateFilter, sortBy, itemSort };
  useEffect(() => {
    if (!loaded || !workerSyncedAt) return;
    const t = bgTimeout(() => {
      window.storage
        .set(
          STORAGE_KEY,
          JSON.stringify({ ...payloadRef.current, workerSyncedAt, savedAt: Date.now() })
        )
        .catch((e) => console.warn("workerSyncedAt save failed", e));
    }, 500);
    return () => clearTimeout(t);
  }, [workerSyncedAt, loaded]);

  /* ONE payload builder, shared by the file download and the GitHub push.
     Keeping it single is a documentation requirement as much as a DRY one:
     invariant saved-state-shape says adding a persisted key means touching five sites, and a
     second builder would quietly make it six — with the next person to add a
     key missing one. Note there is deliberately no timestamp in here; the push
     puts one in the commit message instead, so the payload shape stays frozen
     and identical to what the Backup file has always contained. */
  /* One list, three readers: the backup packer, the sweep, and photo sync. They
     were three separate flatMaps over the same field, which is three chances
     for them to disagree about what "in use" means. */
  const referencedPhotoIds = useMemo(
    () => [...new Set(liveEnvelopes.flatMap((e) => e.photos || []))],
    [liveEnvelopes]
  );

  /* The same figure takeVersion stores, and deliberately NOT totals.got —
     that one is filtered by the active date range, so a version would appear to
     differ from now every time the range changed. */
  const checkedTotal = useMemo(
    () => Object.values(received).reduce((n, v) => n + v, 0),
    [received]
  );

  /* ---- the one thing sync is allowed to say ----
     Everything else about the remote is silent now: no toggle, no Merge cell in
     the action row, no "the other device is ahead" notice. Sync happens or it
     doesn't, and the only case worth a pixel is the one where it has stopped —
     because a ledger that quietly stopped reaching GitHub is exactly the
     failure the remote exists to prevent, and it is invisible by nature.

     Deliberately NOT gated on there being local data. A device with an empty
     ledger and no key is the fresh phone, and this line is its only way to the
     Pull that recovers it — the "a control that recovers state must not be
     gated on that state existing" rule that widened Backup once and Sync twice
     already. */
  /* The last time this device and the Worker agreed. One definition, read by
     the decision below, by the line's own copy and by the Last sync row. It
     reads the Worker only (owner ruling 2026-10-12, default 5): the GitHub
     mirror's push and pull times never reach the screen. */
  const syncedAt = workerSyncedAt;

  const syncBroken = useMemo(() => {
    if (!window.sync && !window.remote) return null;
    /* A visitor is not an unbacked-up device, and "tap to set it up" is
       meaningless advice to someone looking at a copy of someone else's
       ledger. Say what is actually true instead. */
    if (seedShown) return "seeded";
    if (serverDown)
      return serverDown === "unknown" ? "server" : serverDown === "no-access" ? "key-refused" : serverDown;
    if (photoUnreadable) return "photos-unreadable";
    /* null until the key lookup has run: "I could not look" is not "no key" */
    if (workerKeySet === null) return null;
    /* no sync key on this device: the line is the one entrance for pasting it */
    if (workerKeySet === false) return syncOpen ? null : "sync-key";
    /* **The clock is the last time this device AGREED with the Worker**
       (decision ruled-head-stale-clock-agreement). No agreement yet is a call
       in flight, or a failure that serverDown already raised above. */
    if (syncedAt && Date.now() - syncedAt > SYNC_STALE_MS) return "stale";
    return null;
  }, [seedShown, syncedAt, photoUnreadable, serverDown, workerKeySet, syncOpen]);

  /* One sentence per sync state: the advisory line on a working screen says it
     whole, and the Sync row on the Ledger tab says it without the "tap to". */
  const syncSays = (
syncBroken === "seeded"
                    ? "A snapshot of someone else’s ledger — anything you change stays on this device"
                    : syncBroken === "server"
                    ? "The sync server could not be reached — tap to fix"
                    : syncBroken === "sync-key"
                    ? "This device has no sync key — tap to paste it"
                    : syncBroken === "key-refused"
                    ? "This device’s sync key was refused — tap to fix"
                    : syncBroken === "too-big"
                    ? "The ledger is too big for the sync server — tap to fix"
                    : syncBroken === "bad-shape"
                    ? "The sync server refused this ledger’s shape, so it is not backed up — tap to fix"
                    : syncBroken === "photos-unreadable"
                    ? "This device’s photos could not be read, so no new photos were backed up — tap to fix"
                    : !syncBroken
                    ? syncedAt
                      ? `Backed up ${new Date(syncedAt).toISOString().slice(0, 10)} — tap to close`
                      : "Not synced yet — tap to close"
                    : syncBroken === "stale"
                    ? `Not backed up since ${new Date(syncedAt)
                        .toISOString()
                        .slice(0, 10)} — tap to fix`
                    : "The sync server needs attention — tap to fix"
  );
  /* Sync group particulars: the Cloudflare server's state, from the last
     Worker call, and when that call last succeeded. */
  const serverStatus =
    workerKeySet === false
      ? "No sync key on this device"
      : serverDown === "no-access"
      ? "Sync key refused"
      : serverDown === "bad-shape"
      ? "Ledger shape refused"
      : serverDown === "too-big"
      ? "Ledger too big for the server"
      : serverDown
      ? "Could not be reached"
      : workerKeySet
      ? "Connected"
      : "Not checked";
  const lastSyncText = syncedAt
    ? new Date(syncedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not yet";

  const snapshot = useCallback(
    () => ({
      mailday: 1,
      items,
      received,
      receivedAt,
      envelopes,
      stamps,
      dateFilter,
      sortBy,
      itemSort,
    }),
    [items, received, receivedAt, envelopes, stamps, dateFilter, sortBy, itemSort]
  );

  /* Two backups on purpose. The plain one is small and quick and holds the
     irreplaceable part — the ledger and every check-in. Photos are memory
     aids that would multiply the file size, so they're opt-in. */
  const backup = useCallback(
    async (withPhotos) => {
      /* a refused load holds nothing in state: export the saved text as it is */
      const payload = damaged ? null : snapshot();
      if (payload && withPhotos && window.photos) {
        setBackupBusy(true);
        const out = {};
        for (const id of referencedPhotoIds) {
          const b = await window.photos.get(id).catch(() => null);
          if (b) {
            const url = await blobToDataUrl(b);
            if (url) out[id] = url;
          }
        }
        payload.photos = out;
        setBackupBusy(false);
      }
      const blob = new Blob([payload ? JSON.stringify(payload) : damaged], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `mailday-backup-${stamp}${withPhotos ? "-photos" : ""}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    [snapshot, referencedPhotoIds, damaged]
  );

  /* The one restore path, shared by a dropped file and a GitHub pull.
     Funnelled rather than duplicated for two reasons: the validation below is
     the ONLY thing standing between a corrupt payload and a wiped ledger, so
     it should exist once; and the "pending envelopes were replaced" warning
     now covers the pull too, where it matters more, because a pull is one tap
     rather than a deliberate file drop.
     Throws on anything unusable — and throws BEFORE the first setState, so a
     failed restore leaves this device completely untouched. */
  const refreshVersions = useCallback(async () => {
    if (!window.versions) return;
    try {
      setVersionList(await window.versions.list());
      setVersionsDown(null);
    } catch {
      /* NOT `.catch(() => [])`. An empty array renders "No versions saved on
         this device yet", which is indistinguishable from an intact list that
         failed to read once — and there is no retry, so one transient failure
         told the user for the rest of the session that the escape hatch did
         not exist. Leave the list alone and say what actually happened. */
      setVersionsDown("Saved versions can't be read on this device right now.");
    }
  }, []);

  /* The chokepoint for ledger text coming in (a restore, a pull, a merge):
     parse, keep a copy of the original when something is unreadable, mend.
     Throws, with nothing changed, when it is not a ledger or the copy cannot be
     written. */
  const readLedger = async (text) => {
    const { data, dropped } = salvageLedger(parseLedger(text));
    if (dropped) {
      await keep(text);
      refreshVersions();
      setMended(mendNotice(dropped));
    }
    return data;
  };

  /* Save a version of where the ledger stands right now.

     Built from snapshot() and nothing else — the same payload the download and
     the GitHub push send. That is why adding a version tier costs nothing at
     invariant saved-state-shape's five sites: give this its own builder and the next person to
     add a persisted key silently ships a rollback list that drops it. `stamps`
     is the proof — it landed after this and needed no change here.

     Two kinds, and the difference is WHEN, not what. A milestone is taken
     BEFORE a bulk operation, so it holds the world as it was in front of the
     thing that might have ruined it. A recent is taken after an ordinary
     change, so it holds where you got to.

     Fire-and-forget: snapshot() is read synchronously before the first await,
     so a caller can take a milestone and mutate state on the very next line.
     Nothing the user is doing should block on a backup of it. */
  const takeVersion = useCallback(
    (label, kind = "recent") => {
      if (!window.versions || damaged) return;
      if (!shouldSnapshot(kind, lastVersionAt.current)) return;
      lastVersionAt.current = Date.now();
      const payload = snapshot();
      const text = JSON.stringify(payload);
      const checked = Object.values(payload.received || {}).reduce(
        (n, v) => n + v,
        0
      );
      window.versions
        .put({ text, label, kind, lines: payload.items.length, checked })
        .then(() => {
          setVersionsDown(null);
          refreshVersions();
        })
        .catch(() => {
          /* This used to be `.catch(() => {})`, and that silence was the worst
             thing in the feature. With IndexedDB unavailable — private
             browsing, quota exhausted by the photo store, iOS storage pressure
             — every version fails, including the `before reset` milestone. The
             ledger is then destroyed by a Reset the app has told the user is
             recoverable, and History says "No versions saved on this device
             yet", which is affirmatively wrong rather than merely unhelpful.
             A promise this feature cannot keep has to be withdrawn out loud. */
          setVersionsDown(
            "Versions can't be saved on this device right now — a Reset or a restore would not be undoable."
          );
          /* and don't let a failed attempt also swallow the next 30 seconds */
          lastVersionAt.current = null;
        });
    },
    [snapshot, refreshVersions, damaged]
  );

  const applyBackup = useCallback(
    async (text, source /* "file" | "remote" | "merge" | "server" */, extraPresent = null, notice = null) => {
      const data = await readLedger(text);
      const remote = source === "remote";
      /* a restore ends a refused load and its first save must not be skipped; the
         refused text goes to History first, and if it cannot be copied the restore
         changes nothing (as Reset does) */
      if (damagedRef.current) await keep(damagedRef.current);
      skipFirstSave.current = false;
      setDamaged(null);
      /* AFTER the parse and before the first setState: a payload that isn't a
         ledger throws above this line, so a rejected restore doesn't spend a
         version slot, and a restore about to land always has the world it is
         replacing saved in front of it. This is what makes every restore —
         file, pull, merge and the History list itself — undoable. */
      if (source !== "server")
        takeVersion(
          source === "file" ? "before restore" : "before sync",
          "milestone"
        );
      /* A merge keeps the later change per key, and names every removal in its
         notice, so the two warnings below are not merely unnecessary there —
         they are false. Nothing is replaced wholesale, and saying so would
         teach the user to fear the one safe button in the panel. */
      const replacing = source !== "merge" && source !== "server";
      /* a restore replaces everything, so anything still in flight against the
         old world must not land on the new one */
      syncGen.current++;
      /* Keep a photo id when its blob is inlined in this payload OR already on
         this device; strip only the rest. The old rule was all-or-nothing on
         `data.photos`, which is right for a file restore onto a fresh origin
         and silent data loss everywhere else: a pushed payload never carries
         photos (they stay local by design), so pulling onto the very device
         that took them stripped every id — and the sweep effect then deleted
         the blobs from IndexedDB two seconds later, with nothing to restore
         from.

         `extraPresent` widens that to a third case: ids the REMOTE is known to
         hold. A pull downloads before it applies, so the blobs are usually
         local by now and this changes nothing — but it is what saves the two
         cases where they aren't. One GET out of twelve failing would otherwise
         strip that one id, the debounced save would write the stripped ledger,
         and the next push would publish it — destroying the link to a photo
         sitting safe on GitHub that a retry would have fetched. And when the
         photo repo can't be reached at all (no key, offline), every id would go
         at once. Keeping an id costs a blank tile until the next pull; stripping
         it costs the photo. */
      const inlined =
        data.photos && typeof data.photos === "object" ? data.photos : null;
      const inlinedIds = Object.keys(inlined || {});
      /* a union, not a read-back after the writes below: those go in through a
         fire-and-forget IIFE that hasn't run yet when this set is built */
      /* Three-valued, for the same reason `listPhotos` is. `.catch(() => [])`
         read "I could not look" as "this device holds nothing" — so with
         IndexedDB unavailable (private browsing, quota, storage pressure) every
         id not already on the photo remote was stripped below, the debounced
         save wrote the stripped ledger, and the next push published it. That
         severs the link to photos sitting safe on another device or waiting to
         be uploaded. The remote half of this rule is argued at length above
         ("keeping an id costs a blank tile, stripping it costs the photo") and
         test 26.13b pins it; the LOCAL read never got the same treatment.
         `null` here means unreadable, and unreadable keeps everything. */
      let localIds = null;
      if (window.photos) {
        try {
          localIds = await window.photos.keys();
        } catch {
          localIds = null;
        }
      } else localIds = [];
      /* a server apply keeps every id: its photos travel by GitHub (L4b), and
         keeping an id costs a blank tile, stripping it costs the photo */
      const present =
        localIds === null || source === "server"
          ? null
          : new Set([...localIds, ...inlinedIds, ...(extraPresent || [])]);
      setItems(data.items);
      setReceived(data.received || {});
      setReceivedAt(data.receivedAt || {});
      setEnvelopes(
        (data.envelopes || []).map((e) => ({
          ...e,
          /* present === null is "the store would not answer" — keep every id
             rather than publishing a ledger with the links cut out */
          photos: present
            ? (e.photos || []).filter((id) => present.has(id))
            : e.photos || [],
        }))
      );
      setStamps(sanitizeStamps(data.stamps));
      if (inlinedIds.length && window.photos)
        (async () => {
          for (const [id, url] of Object.entries(inlined)) {
            const b = await dataUrlToBlob(url);
            if (b) await window.photos.put(id, b).catch(() => {});
          }
        })();
      composerDraft.current.clear();
      setComposing(null);
      setUndo(null);
      if (data.dateFilter) setDateFilter(data.dateFilter);
      if (data.sortBy) setSortBy(data.sortBy);
      if (data.itemSort || data.cardSort)
        setItemSort(data.itemSort || data.cardSort);
      setImportMsg(
        /* Three-valued, and `!= null` rather than `||` is the point: an empty
           string has to be able to mean "say nothing", which only the
           unattended merge uses and only when it added nothing. Under `||` it
           falls through to the default sentence, which would be a lie about an
           operation nobody asked for. */
        notice != null
          ? notice
          :
        `Backup restored — ${
          data.items.length
        } lines and your check-ins are back.` +
          (inlinedIds.length
            ? ` ${inlinedIds.length} photo${
                inlinedIds.length === 1 ? "" : "s"
              } too.`
            : "") +
          /* a restore is a full replace, and envelopes are hand-typed —
             losing them silently would be the worst kind of quiet */
          (replacing && liveEnvelopes.length > 0
            ? ` ${liveEnvelopes.length} pending envelope${
                liveEnvelopes.length === 1 ? " was" : "s were"
              } replaced by the ${remote ? "remote copy" : "backup"}'s.`
            : "")
      );
      setShowUpload(false);
    },
    [liveEnvelopes, takeVersion]
  );

  const handleFile = useCallback(
    (file) => {
      setUploadErr("");
      if (/\.json$/i.test(file.name)) {
        // restore from a Mail Day backup
        const reader = new FileReader();
        reader.onload = () => {
          applyBackup(reader.result, "file").catch((e) =>
            setUploadErr(
              e?.message === "unsaved"
                ? "A copy of that file could not be saved to History, so nothing was changed."
                : "That file isn\u2019t a Mail Day backup. Use a backup downloaded from the Backup button, or an OrderWand CSV."
            )
          );
        };
        reader.onerror = () =>
          setUploadErr("Couldn\u2019t read that file. Try again.");
        reader.readAsText(file);
        return;
      }
      if (damagedRef.current) {
        setUploadErr("Your saved ledger is damaged and was not loaded. Restore a saved version first.");
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
          /* MERGE, invariant imports-merge-never-replace: keep everything already tracked, add what's
             new. Shared with the two-device merge rather than kept as a second
             Map-union here — one definition of "union line items by key", so
             the two cannot drift. */
          takeVersion("before import", "milestone");
          const { items: mergedItems, added } = mergeItems(items, parsed);
          setItems(mergedItems);
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
    [items, envelopes, takeVersion]
  );

  const setCount = useCallback((key, n) => {
    touchReceived([key]);
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
  }, [hideDone, query, dateFilter, view, showStamped]);

  /* Showing is the state a session starts from, and on iOS "closing" a
     home-screen app usually just backgrounds it — the page survives, so a
     mount is not what reopening looks like. Coming back after a real absence
     is the same event as a fresh load, so treat it as one. Only Showing
     resets: the query, the range and the reveals are things you were in the
     middle of, and dropping those would read as the app forgetting rather
     than as a fresh start. */
  const hiddenAt = useRef(null);
  /* The one-shot "that foreground was a new session" signal, handed forward to
     the peek effect below — which is where the automatic merge lives, because
     the peek is already making the one network read the decision needs.

     It has to be HANDED forward rather than re-derived, and this is the trap.
     The handler below runs FIRST — it registers on the first commit, while the
     peek effect waits on `loaded` — and nulls `hiddenAt` before returning. So
     anything downstream that reads `hiddenAt` measures zero forever and the
     merge never fires: no error, nothing on screen, nothing to notice.

     Written on BOTH branches, so a short hop out can cancel a signal an earlier
     long absence left standing. One-shot BY CONTRACT, enforced at the consumer
     — see `check()`, which also runs on mount and on every `syncBusy` flip, and
     a merge flips `syncBusy` twice.

     Starts TRUE: a cold mount is a new session too, and the more valuable half
     — a fresh phone should come back already reconciled. */
  const freshSession = useRef(true);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current == null ? 0 : Date.now() - hiddenAt.current;
      hiddenAt.current = null;
      const fresh = away >= RESUME_RESET_MS;
      freshSession.current = fresh;
      /* Two consequences of one finding, landing seconds apart — this one
         synchronously, the merge after a network round trip. Two reshapes of
         the same list on one resume is fine precisely BECAUSE it is a resume:
         nothing is under the pointer. */
      if (fresh) setHideDone(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* A reveal is scoped to the search that made it necessary — a new query is a
     new question, and a stale gk would keep one card unfiltered for no visible
     reason. Deliberately NOT keyed on `view`: the Tally jump sets `revealed`
     and `view` in the same handler, so a `view` dep would wipe the reveal on
     the very next commit and land you on a still-filtered card. */
  useEffect(() => {
    setRevealed(new Set());
  }, [query, dateFilter]);

  const toggleReveal = useCallback((gk) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(gk)) next.delete(gk);
      else next.add(gk);
      return next;
    });
  }, []);

  /* Tally → Packages, on the order this copy came from. The reveal is what
     makes the landing reliable rather than lucky: under a search the package
     is filtered down to the matching line, and under "Unreceived" a package
     whose copies are all checked in isn't in the list at all — so the jump
     would arrive at nothing. Revealing bypasses both. */
  const openOrder = useCallback((gk) => {
    setRevealed((prev) => (prev.has(gk) ? prev : new Set(prev).add(gk)));
    /* the stamped filter would otherwise swallow an unstamped target — the
       same "jump lands on nothing" failure group 32 fixed for hideDone */
    setShowStamped(false);
    setView("packages");
    setJumpGk(gk);
  }, []);

  useEffect(() => {
    if (!jumpGk || view !== "packages") return;
    // a frame, so the packages list exists before we scroll to it
    requestAnimationFrame(() => {
      jumpRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setJumpGk(null);
    });
  }, [jumpGk, view]);

  const bulkSet = useCallback((pkgItems, on) => {
    touchReceived(pkgItems.map((it) => it.key));
    setReceived((prev) => {
      const next = { ...prev };
      for (const it of pkgItems) {
        if (on) next[it.key] = it.qty;
        else delete next[it.key];
      }
      return next;
    });
  }, []);

  /* The one writer for stamps, so `updatedAt` — what the two-device merge
     ranks copies by — is set in exactly one place. `patch` null removes: a
     tombstone rather than a delete, so the removal itself travels. The date
     survives a note-only edit; picking a different kind re-dates it, since
     "refunded on the 4th" is a different fact from "claim filed on the 1st". */
  const setStamp = useCallback((gk, patch) => {
    setStamps((prev) => {
      const cur = prev[gk];
      if (!patch && !hasStamp(cur)) return prev; // nothing to remove
      const next = patch
        ? {
            kind: patch.kind,
            note: (patch.note || "").trim(),
            at: cur?.kind === patch.kind && cur.at ? cur.at : todayLocal(),
            updatedAt: Date.now(),
          }
        : { kind: "", note: "", at: "", updatedAt: Date.now() };
      return { ...prev, [gk]: next };
    });
  }, []);

  /* Two-tap confirms, invariant no-native-dialogs — no native dialogs. There are three armable
     controls in this component now (Reset, Pull, Push anyway), so arming one
     has to disarm the others: two primed destructive buttons sitting side by
     side is precisely the mis-tap the pattern exists to prevent. */
  const disarm = useCallback(() => {
    setConfirmReset(false);
    setConfirmForce(false);
    setConfirmRestore(null);
  }, []);
  /* `arm` takes a VALUE rather than always setting true, because Restore has
     one button per version on screen at once, so "which one is primed" has to
     be an id. Disarming is still a single call. */
  const arm = useCallback(
    (set, value = true) => {
      disarm();
      set(value);
      clearTimeout(resetTimer.current);
      resetTimer.current = bgTimeout(disarm, 4000);
    },
    [disarm]
  );

  const resetAll = useCallback(async () => {
    if (!confirmReset) {
      arm(setConfirmReset);
      return;
    }
    clearTimeout(resetTimer.current);
    disarm();
    /* a refused load holds nothing in state: keep its raw text first, or do not reset */
    if (damagedRef.current) {
      try {
        await keep(damagedRef.current);
        refreshVersions();
      } catch {
        setVersionsDown("Versions can't be saved on this device right now — a Reset would not be undoable.");
        return;
      }
      setDamaged(null);
    }
    /* The most valuable version this app takes. Reset is the one control that
       destroys everything, and versions deliberately survive it — so a Reset
       tapped twice by accident is recoverable rather than final. */
    takeVersion("before reset", "milestone");
    /* A sync now runs for minutes, not milliseconds, so it can easily still be
       in flight here. Bumping the generation makes every await-resume inside it
       bail: otherwise a mid-flight pull would finish and cheerfully restore the
       ledger that was just cleared. */
    syncGen.current++;
    setItems([]);
    setReceived({});
    setReceivedAt({});
    /* envelopes have to go too — left in state they'd be written straight back
       by the next debounced save and reappear pointing at a ledger that's gone */
    setEnvelopes([]);
    setStamps({});
    setShowStamped(false);
    composerDraft.current.clear();
    setComposing(null);
    setUndo(null);
    setSticky(new Set());
    setImportMsg("");
    try {
      await window.storage.delete(STORAGE_KEY);
      await window.photos?.clear();
      /* The GitHub token and the remote sha deliberately survive a Reset. The
         token is a device credential rather than ledger data, and dropping the
         sha would make the very next push 422 for no reason. */
    } catch {
      /* fine */
    }
  }, [confirmReset, arm, disarm, takeVersion]);

  /* Two-tap, because restoring is a full replace — invariant no-native-dialogs. It is also the
     one destructive control in the app that is genuinely undoable, because
     applyBackup takes a "before restore" milestone on the way in: tap the wrong
     row and the row above it is the world you just left. */
  const restoreVersion = useCallback(
    async (id) => {
      if (confirmRestore !== id) {
        arm(setConfirmRestore, id);
        return;
      }
      clearTimeout(resetTimer.current);
      disarm();
      setVersionMsg(null);
      setVersionMsgAt(null);
      const text = await window.versions?.get(id).catch(() => null);
      if (!text) {
        setVersionMsgAt(id);
        setVersionMsg("That version could not be read from this device.");
        return;
      }
      try {
        /* "file" and not a fourth source: this IS a local full replace, and it
           should carry exactly the warnings one does. */
        await applyBackup(text, "file", null, null);
        setOpenVersion(null);
      } catch {
        setVersionMsgAt(id);
        setVersionMsg("That version could not be restored — it looks corrupt.");
      }
    },
    [confirmRestore, arm, disarm, applyBackup]
  );

  /* The branch's own history, behind an explicit tap. Every push has always
     been a commit, so this archive already existed — it was only unreachable
     from the phone. Both calls are reads, so nothing here touches the
     content-write budget. Both need the key, like every call here does now.
     Not fetched on open: two round trips for something wanted rarely, and the
     local list already answers "undo what I just did". */
  const loadOlder = useCallback(async () => {
    if (!window.remote || typeof window.remote.listVersions !== "function")
      return;
    setOlderBusy(true);
    setVersionMsg(null);
    setVersionMsgAt(null);
    try {
      setOlderVersions(await window.remote.listVersions());
    } catch (e) {
      setOlderVersions(null);
      setVersionMsgAt("older");
      setVersionMsg(
        REMOTE_SAYS[e?.code || "bad-response"] || REMOTE_SAYS["bad-response"]
      );
    } finally {
      setOlderBusy(false);
    }
  }, []);

  /* Same two taps and the same funnel as a local restore — only the source of
     the bytes differs. It deliberately does NOT touch the stored sha, and that
     is right: rolling the sha BACK would 409 the next push against a remote
     this device is not behind, forcing the user through Merge — which unions line
     items (see merge-rules.mjs), and would therefore silently re-add the very
     lines the rollback removed. The repair path would undo the repair.

     What is NOT true, and used to be claimed here, is that a restore is purely
     local. It rewrites items/received/envelopes, which are three of the
     auto-push debounce's deps — so ninety seconds later the rolled-back ledger
     is published, unattended, and accepted (the stored sha is still current, so
     there is no conflict to raise). Every push is a commit and the other device
     recovers by merging, but "this only affects this device" was wrong and the
     two-tap copy said nothing about it. The same is true of restoreVersion. */
  const restoreOlder = useCallback(
    async (sha) => {
      if (confirmRestore !== sha) {
        arm(setConfirmRestore, sha);
        return;
      }
      clearTimeout(resetTimer.current);
      disarm();
      setVersionMsg(null);
      setVersionMsgAt(null);
      let text = null;
      try {
        text = await window.remote.getVersion(sha);
      } catch (e) {
        setVersionMsgAt(sha);
        setVersionMsg(
          REMOTE_SAYS[e?.code || "bad-response"] || REMOTE_SAYS["bad-response"]
        );
        return;
      }
      try {
        await applyBackup(text, "file", null, null);
        setOpenVersion(null);
      } catch {
        setVersionMsgAt(sha);
        setVersionMsg("That version could not be restored — it looks corrupt.");
      }
    },
    [confirmRestore, arm, disarm, applyBackup]
  );

  /* Through a ref, for the reason autoPushRef exists: takeVersion depends on
     snapshot(), so its identity changes whenever ANY persisted field does —
     including dateFilter and sortBy. Listed as a dep it would re-arm the effect
     below on every commit, and re-sorting the screen would save a version. */
  const takeVersionRef = useRef(takeVersion);
  useEffect(() => {
    takeVersionRef.current = takeVersion;
  });

  useEffect(() => {
    if (opened) refreshVersions();
  }, [opened, refreshVersions]);

  /* The rolling half of the list. Deliberately only the fields that are REAL
     data — the same ones the auto-push debounce watches, and for the same
     reason: re-sorting the screen is not a change worth a version.

     Taken AFTER the change, the opposite of a milestone and correct for both. A
     milestone answers "what was it like before that import"; this answers
     "where had I got to". The 30s gate in shouldSnapshot keeps a mail day's
     hundreds of taps from spending the whole ring on one package. */
  useEffect(() => {
    if (!loaded) return;
    /* the load effect's first commit is not a change the user made */
    if (skipFirstVersion.current) {
      skipFirstVersion.current = false;
      return;
    }
    takeVersionRef.current("check-ins");
  }, [items, received, envelopes, stamps, loaded]);

  /* ---- remote backup: manual push / pull ----
     Transport only. localStorage stays the source of truth, nothing here runs
     on a timer, and every failure path leaves both ends exactly as they were. */

  useEffect(() => {
    if (!loaded || !window.remote) return;
    (async () => {
      setRemoteTarget(await window.remote.target().catch(() => null));
      const st = await window.remote.status().catch(() => null);
      setRemoteInfo(st);
      if (typeof window.remote.photoTarget === "function")
        setPhotoTarget(await window.remote.photoTarget().catch(() => null));
    })();
  }, [loaded, syncOpen]);

  /* ---- the photo phase ----
     Shared by push and pull. Photos are immutable and addressed by id, so the
     whole algorithm is a set difference — nothing to merge, no sha, and no
     conflict possible: every remote path is written once by whoever holds it.

     Feature-detected, because the harness (and any cached older bundle) exposes
     a window.remote without these methods, and an undefined call here would be
     swallowed by the caller's catch and surfaced as a generic ledger error. */
  const photoSyncAvailable =
    !!window.remote && typeof window.remote.listPhotos === "function";

  /* Per tap, so a first-ever backfill can't sit uploading for an hour: GitHub
     allows 500 content-generating requests an hour and the ledger push shares
     that budget. The set difference makes the next tap resume rather than
     repeat. */
  const PHOTO_BATCH = 25;

  /* Feature-detected: a cached older bundle exposes a window.remote whose
     pull() still advances the sha on its own, and an undefined call here would
     be swallowed by the caller's catch and reported as a failed sync. */
  const acceptPull = useCallback(async (sha) => {
    if (typeof window.remote?.acceptPull === "function")
      await window.remote.acceptPull(sha).catch(() => {});
  }, []);

  const surveyPhotos = useCallback(
    async (referenced) => {
      if (!photoSyncAvailable || !window.photos || !referenced.length)
        return null;
      /* Same three-valued rule as the remote read beside it: an unreadable
         LOCAL store is not an empty one. Read as empty, every referenced id
         looks missing-from-this-device, so the plan wants to pull all of them
         and treats anything the remote lacks as lost. Bail instead — a sync we
         cannot survey honestly is one we should not run. */
      let local;
      try {
        local = await window.photos.keys();
      } catch {
        return { unreadable: true };
      }
      const remote = await window.remote.listPhotos().catch((e) => ({
        known: false,
        reason: e?.code || "server",
      }));
      return { plan: photoPlan({ referenced, local, remote }), remote };
    },
    [photoSyncAvailable]
  );

  /* Leaving Orphaned has to drop both mid-thought flags, because both stop
     being true the moment the view unmounts — and both silently block every
     background sync while they are set (`autoMerge` and `autoPush` refuse on
     them, correctly, since applyBackup nulls them).

     `composing` is the clear-cut one: EnvelopeComposer holds its entries in
     local state inside the mystery block, so a view switch has already
     destroyed the draft. Keeping the flag set afterwards protects nothing and
     costs all backup for the rest of the session.

     `undo` is deliberately NOT dropped here. It survives a trip to Packages on
     purpose — "assign, hand-edit elsewhere, come back and undo only your own
     delta" is a real workflow and group 14 pins it. The sync stall it used to
     cause is fixed at the other end instead: see autoPush's guard list. */
  const leaveFor = useCallback(
    (v) => {
      /* Leaving drops the flag, so sync is not held off while the draft waits
         in the ref; coming back reopens the composer on it. */
      if (view === "mystery" && v !== "mystery") {
        resumeTarget.current = composing;
        setComposing(null);
      }
      /* only a composer that was open when the person left comes back; one
         closed with Cancel keeps its draft but stays closed */
      const t = resumeTarget.current;
      if (v === "mystery" && t) {
        resumeTarget.current = null;
        if (
          composerDraft.current.has(t) &&
          (t === "new" || liveEnvelopes.some((e) => e.id === t))
        )
          setComposing(t);
      }
      /* the View panels belong to the Ledger tab: a visit starts them shut */
      setSortOpen(false);
      setRangeOpen(false);
      setView(v);
    },
    [view, liveEnvelopes, composing]
  );

  const flashTimer = useRef(null);

  /* `refs` overrides what counts as referenced. The merge needs it: it applies
     a union of both devices' envelopes, and React has not committed that state
     by the time this runs — reading referencedPhotoIds here would survey the
     PRE-merge list and quietly skip every photo the merge just adopted. */
  const pushPhotos = useCallback(
    async (gen, refs) => {
      const survey = await surveyPhotos(refs || referencedPhotoIds);
      if (syncGen.current !== gen) return;
      setPhotoUnreadable(!!survey?.unreadable);
      if (survey?.unreadable) {
        setPhotoMsg({ tone: "advice", text: PHOTO_SAYS.unreadable });
        return;
      }
      if (!survey) return;
      setPhotoMsg(null);
      const { plan, remote } = survey;
      if (!plan.known) {
        setPhotoMsg({ tone: "advice", text: PHOTO_SAYS[remote.reason] || PHOTO_SAYS.server });
        return;
      }
      const batch = plan.toPush.slice(0, PHOTO_BATCH);
      if (!batch.length) return;
      setPhotoSync({ dir: "push", done: 0, total: batch.length });
      let done = 0;
      for (const id of batch) {
        if (syncGen.current !== gen) return;
        let blob;
        try {
          blob = await window.photos.get(id);
        } catch {
          setPhotoUnreadable(true);
          setPhotoMsg({ tone: "advice", text: PHOTO_SAYS.unreadable });
          return;
        }
        if (!blob) continue; /* swept or reset out from under us */
        try {
          await window.remote.pushPhoto(id, blob, `photo ${id}`);
          done++;
          setPhotoSync({ dir: "push", done, total: batch.length });
        } catch (e) {
          const code = e?.code || "server";
          setPhotoMsg({
            tone: "advice",
            text:
              done > 0
                ? `${done} of ${batch.length} photos synced. ${
                    PHOTO_SAYS[code] || PHOTO_SAYS.server
                  }`
                : PHOTO_SAYS[code] || PHOTO_SAYS.server,
          });
          /* stop, don't grind: GitHub's guidance on a throttle is to back off,
             and continuing the loop extends the block */
          return;
        }
      }
      const left = plan.toPush.length - batch.length;
      if (left > 0)
        setPhotoMsg({
          tone: "advice",
          text: `${done} photos sent · ${left} still to go — tap to send the rest.`,
        });
    },
    [surveyPhotos, referencedPhotoIds]
  );

  const doPush = useCallback(
    async (force, quiet = false, mirror = false) => {
      if (!window.remote || damagedRef.current) return;
      /* doMerge clears this too. A "Pushed ✓" flash
         from 2s ago would otherwise fire mid-way through the next push and
         reset a freshly-set "conflict" to idle — taking Merge, Push anyway and
         the advisory line off the screen with it, leaving a real conflict with
         no surface at all. */
      clearTimeout(flashTimer.current);
      disarm();
      setPushState("pushing");
      /* Every push, mirror or not, writes the merge with the last server ledger
         once one is known, never a raw snapshot: a snapshot that has not yet
         applied the server's lines holds fewer than GitHub does, and writing it
         is how a failed merge POST once shrank GitHub from 15 lines to 3. */
      let text = JSON.stringify(
        lastServer.current
          ? mergeLedger(snapshot(), lastServer.current).merged
          : snapshot()
      );
      /* the timestamp goes here rather than into the payload, so the pushed
         shape stays byte-identical to the Backup file's — and it lands where
         it's actually useful, in the commit list */
      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const message = `ledger ${stamp} · ${items.length} lines · ${liveEnvelopes.length} envelopes`;
      const gen = ++syncGen.current;
      syncingRef.current = true;
      setSyncBusy(true);
      try {
        try {
          await (force
            ? window.remote.pushForce(text, message)
            : window.remote.push(text, message));
        } catch (e) {
          if (!(mirror && e?.code === "conflict")) throw e;
          /* a mirror conflict: GitHub moved. Read it, merge it into the ledger
             being pushed, write under the fresh sha, and give the Worker the
             merge. Never write a copy that has not merged what GitHub holds. */
          const res = await window.remote.pull();
          const merged = mergeLedger(JSON.parse(text), await readLedger(res.text)).merged;
          text = JSON.stringify(merged);
          await window.remote.push(text, message, res.sha);
          /* the merge is the newest ledger this device knows, whatever the Worker
             answers: it is what the mirror writes next, and it is applied here */
          growServer(merged);
          tryApplyRef.current();
          if (window.sync) {
            try {
              await settleReply(await withTimeout(window.sync.post(merged)), true);
            } catch {
              mirrorRef.current = false;
            }
            /* the Worker did not take the merge: the next push reconciles with
               GitHub by the peek path, even if a retry turns mirror mode back on */
            if (!mirrorRef.current) githubNext.current = true;
          }
        }
        setRemoteInfo(await window.remote.status().catch(() => null));
        /* Only now, after the ledger is actually on GitHub. A conflict here
           means this device is out of sync, and spraying photos at the remote
           while the ledger that references them was rejected is the wrong order
           to fail in. */
        await pushPhotos(gen);
        if (syncGen.current !== gen) return;
        /* the flash starts AFTER the photos, not before — "Pushed ✓" while a
           dozen uploads are still queued is simply a lie, and it re-enables the
           button into a second concurrent loop */
        setPushState("pushed");
        flashTimer.current = bgTimeout(() => setPushState("idle"), 2500);
        return { ok: true };
      } catch (e) {
        const code = e?.code || "server";
        /* the mirror treats a stale sha as a forced write, so no conflict state */
        if (mirror && code === "conflict") return { ok: false, code };
        setPushState(code === "conflict" ? "conflict" : "idle");
        /* `quiet` is auto-push, and this is the same reasoning doMerge's quiet
           mode already encodes: nobody tapped anything, and setKeyOpen swaps
           "saved on this device" for an empty field, which reads as *your key
           is gone*. An expired token would otherwise flip the panel into that
           state unattended, with (until now) no cancel to get out of it.
           No GitHub failure reaches the screen; the watchdog catches a stopped
           mirror. */
        if (!quiet && (code === "no-key" || code === "auth")) setKeyOpen(true);
        /* returned rather than only rendered, so the auto path can resolve a
           conflict by merging instead of leaving a button armed on a screen
           nobody is looking at */
        return { ok: false, code };
      } finally {
        syncingRef.current = false;
        setSyncBusy(false);
        setPhotoSync(null);
        /* same reason as doMerge's: a generation guard can return out of the
           middle and leave the label reading "Pushing…" forever. Only the
           in-flight label is cleared here — "pushed" and "conflict" are
           outcomes and must survive. */
        setPushState((p) => (p === "pushing" ? "idle" : p));
      }
    },
    [snapshot, items, liveEnvelopes, disarm, pushPhotos]
  );

  /* Returns the ids applyBackup should treat as present, and downloads what it
     can first. Never throws: a photo problem must not abort the ledger pull,
     which is the part that matters. */
  const pullPhotos = useCallback(
    async (text, gen) => {
      /* A SECOND parse site, deliberately non-authoritative. applyBackup owns
         the "is this even a ledger" question — the check there is the only
         thing between a corrupt payload and a wiped ledger, so it stays in one
         place. Here we only want the photo ids, and anything unexpected simply
         means we learn nothing. Note {"hello":"world"} parses fine, so the
         envelopes field has to be treated as optional. */
      let incoming = [];
      try {
        const data = JSON.parse(text);
        incoming = [
          ...new Set(
            (Array.isArray(data?.envelopes) ? data.envelopes : [])
              .filter(isLiveEnvelope)
              .flatMap((e) => e?.photos || [])
          ),
        ];
      } catch {
        return null;
      }
      if (!incoming.length) return null;

      const survey = await surveyPhotos(incoming);
      if (!survey || syncGen.current !== gen) return null;
      if (survey.unreadable) {
        setPhotoUnreadable(true);
        return null;
      }
      setPhotoUnreadable(false);
      setPhotoMsg((m) => (m?.text === PHOTO_SAYS.unreadable ? null : m));
      const { plan, remote } = survey;

      if (!plan.known) {
        /* We could not see the store, so we know nothing — and "I can't see it"
           must never be reported as "it's gone". Keep every id: the bytes are
           very likely on GitHub, and a blank tile until the next pull is a far
           smaller loss than the photo. */
        setPhotoMsg({
          tone: "advice",
          text: PHOTO_SAYS[remote.reason] || PHOTO_SAYS.server,
        });
        return incoming;
      }

      /* What this pull is about to destroy: photos the CURRENT ledger references
         and the incoming one does not. applyBackup replaces envelopes wholesale,
         so those ids simply stop existing and the sweep deletes their blobs two
         seconds later — and if they were never pushed, that is the last copy.

         Measured against `incoming`, deliberately, NOT against plan.toPush.
         `plan` is keyed on the incoming ledger's ids, so its toPush is the set
         that is referenced, held here and not yet uploaded — precisely the set
         that SURVIVES this pull untouched. Warning on that told the user their
         photos were gone at the exact moment they were safe, and said nothing
         in the case that actually loses them. */
      const incomingSet = new Set(incoming);
      const remoteSet = new Set(remote.ids || []);
      const stranded = referencedPhotoIds.filter(
        (id) => !incomingSet.has(id) && !remoteSet.has(id)
      ).length;

      const batch = plan.toPull.slice(0, PHOTO_BATCH);
      if (batch.length) setPhotoSync({ dir: "pull", done: 0, total: batch.length });
      let done = 0;
      const got = [];
      for (const id of batch) {
        if (syncGen.current !== gen) return null;
        try {
          const blob = await window.remote.pullPhoto(id);
          await window.photos.put(id, blob);
          got.push(id);
          done++;
          setPhotoSync({ dir: "pull", done, total: batch.length });
        } catch {
          /* keep going: one bad fetch shouldn't cost the other eleven */
        }
      }
      if (got.length) setPhotoEpoch((n) => n + 1);

      const notes = [];
      if (stranded)
        notes.push(
          `${stranded} photo${stranded === 1 ? " had" : "s had"} no other copy and ${
            stranded === 1 ? "is" : "are"
          } now gone.`
        );
      if (plan.lost.length)
        notes.push(
          `${plan.lost.length} photo${
            plan.lost.length === 1 ? " has" : "s have"
          } no copy left on any device and ${plan.lost.length === 1 ? "was" : "were"} lost.`
        );
      const left = plan.toPull.length - batch.length;
      if (left > 0) notes.push(`${left} more will arrive on the next sync.`);
      if (notes.length) setPhotoMsg({ tone: "advice", text: notes.join(" ") });

      /* every id the remote holds, not just the ones fetched this time: a GET
         that failed is a retry, not a reason to sever the link */
      return [...got, ...plan.toPull];
    },
    [surveyPhotos, referencedPhotoIds]
  );

  /* ---- merge: the resolution the conflict path never had ----

     Pull and Push anyway are the two halves of the same mistake: each keeps one
     device's work by discarding the other's. This keeps both. The later
     change wins per key — see merge-rules.mjs — and the notice names any
     removal, so it needs no two-tap confirm and is safe to re-run.

     Two entrances, one function: the conflict (where it also completes the push
     that was rejected) and the "other device is ahead" notice (where it does
     not, because there may be nothing local to send and an empty commit is
     noise). */
  const doMerge = useCallback(
    async (alsoPush, quiet = false, reply = null) => {
      /* `reply` is a ledger the Worker answered a POST with: the same merge, a
         different source. No pull, no photo download, no sha to accept. */
      if ((!reply && !window.remote) || damagedRef.current) return { ok: false, code: "server" };
      clearTimeout(flashTimer.current);
      disarm();
      setPhotoMsg(null);
      setMergeState("merging");
      let gen = ++syncGen.current;
      syncingRef.current = true;
      setSyncBusy(true);
      try {
        /* this also refreshes the device sha, which is the thing that actually
           clears the conflict — the merged push below is no longer stale */
        const res = reply ? { text: JSON.stringify(reply) } : await window.remote.pull();
        /* photos BEFORE applying: the
           merge unions both devices' envelopes, so ids arriving from the other
           device have no blob here yet and applyBackup would strip every one of
           them. Tests 30.5-30.9 pin the same trap. */
        /* photos stay on GitHub (L4b): keep every merged id, as applyBackup's
           "keeping an id costs a blank tile, stripping it costs the photo" */
        const extraPresent = reply ? null : await pullPhotos(res.text, gen);
        if (syncGen.current !== gen) return { ok: false, code: "server" };
        const { merged, stats } = mergeLedger(snapshot(), await readLedger(res.text));
        const text = JSON.stringify(merged);
        const before = syncGen.current;
        /* An unattended merge that added and removed nothing has nothing to report, and
           reporting it anyway is worse than silence — `peek` says "ahead" on
           any new blob sha, and a push writes one whenever the ledger is
           re-saved, so an empty-data commit elsewhere would otherwise greet the
           user on their next resume with a notice about a merge they never
           asked for that did nothing. When it DID add or remove something the summary
           stays even quietly: the list just changed shape, and that sentence is
           the only thing explaining why. */
        const changed =
          stats.itemsAdded +
            stats.checkInsAdded +
            stats.envelopesAdded +
            stats.checkInsRemoved +
            stats.envelopesRemoved +
            (stats.stampsRemoved || 0) +
            (stats.stampsAdded || 0) >
          0;
        if (reply) {
          /* nothing to merge: no apply, no milestone. Canonical compare, so a
             note, a photo id or a receivedAt that differs alone still counts. */
          if (canon(merged) === canon(snapshot())) {
            setSeedShown(false); /* a server ledger has landed: this page is the owner's now */
            return { ok: true };
          }
          /* a milestone only in front of a removal, and before the apply */
          if (stats.checkInsRemoved + stats.envelopesRemoved + (stats.stampsRemoved || 0) > 0)
            takeVersion("before sync", "milestone");
        }
        const notice = quiet && !changed ? "" : mergeSummary(stats);
        /* remembered so the next apply can tell this notice from an import's */
        if (reply) serverNotice.current = notice;
        await applyBackup(text, reply ? "server" : "merge", extraPresent, notice);
        if (reply) setSeedShown(false); /* seed-load-guards: no longer someone else's ledger */
        /* applyBackup bumps syncGen — it has to, since a restore replaces the
           world and anything still in flight against the old one must not land.
           A merge PUSHES after applying, so without re-adopting the generation here
           every gen-guarded step below bails and the photo phase and the
           "Pushed ✓" flash silently never run. Exactly one bump is ours; any
           other number means something really did move on. */
        if (syncGen.current !== before + 1) return { ok: false, code: "server" };
        gen = syncGen.current;
        /* the merged state is in, so this device may now claim the remote's
           sha — and must, or the push below would conflict against itself */
        if (!reply) {
          await acceptPull(res.sha);
          setAhead(false);
          setPushState("idle");
        }
        if (alsoPush) {
          const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
          await window.remote.push(
            text,
            `merge ${stamp} · ${merged.items.length} lines · ${merged.envelopes.filter(isLiveEnvelope).length} envelopes`
          );
          setRemoteInfo(await window.remote.status().catch(() => null));
          /* the MERGED envelopes' ids, not referencedPhotoIds — applyBackup's
             setState has not committed yet, so the hook's value is still the
             pre-merge list and every adopted photo would be skipped */
          await pushPhotos(gen, [
            ...new Set(
              merged.envelopes
                .filter(isLiveEnvelope)
                .flatMap((e) => e.photos || [])
            ),
          ]);
          if (syncGen.current !== gen) return { ok: false, code: "server" };
          setPushState("pushed");
          flashTimer.current = bgTimeout(() => setPushState("idle"), 2500);
        }
        return { ok: true };
      } catch (e) {
        /* parseLedger throws bare on a payload that isn't a ledger; anything
           from the adapter carries a code. Either way the merge landed nothing,
           because applyBackup throws before its first setState. */
        const code = e?.code || "bad-response";
        /* a third writer landed between our pull and our push. Re-arm the
           conflict controls rather than leaving a bare message and no way
           forward — merging again is the right next move, and it converges. */
        /* NOT suppressed on the quiet path: a control, not a message. It is
           what puts the repair kit within reach. */
        if (code === "conflict") setPushState("conflict");
        if (!quiet) {
          /* Every one of these strings is phrased for someone who just tapped a
             button — "Paste a new one", "Try again". Nobody tapped anything
             here. setKeyOpen is the worse of the two: it swaps "saved on this
             device" for an empty field, which reads as *your key is gone*.
             Suppressing costs nothing, because a failed merge lands nothing —
             applyBackup throws before its first setState. */
          if (code === "auth" || code === "no-key") setKeyOpen(true);
        }
        return { ok: false, code };
      } finally {
        syncingRef.current = false;
        setSyncBusy(false);
        setMergeState("idle");
        setPhotoSync(null);
      }
    },
    [disarm, applyBackup, pullPhotos, pushPhotos, snapshot, acceptPull, takeVersion]
  );

  /* ---- the merge, run for you ----

     Declined once, and the reason was right: applying forty imported lines into
     the package list mid-check-in is the cascading mis-tap invariant no-layout-shift-under-pointer exists
     to prevent. What changed is not the risk but the evidence. Coming back
     after RESUME_RESET_MS away is not mid-check-in — it is a new session, and
     the app already stakes a list reshape on exactly that finding when it
     resets Showing. This spends the same finding twice. And the merge keeps
     the later change and names any removal, so the residual risk is that the
     list changes shape, never that something is lost unreported.

     Needs the key, like everything else since the ledger moved into the
     private repo. A device that has never been set up gets `no-access` here and
     the repair kit's line says so — which is the honest answer, where "nobody
     is ahead" would be the dangerous one.

     It does not push. `alsoPush` is false, so no empty commit is manufactured
     for a device with nothing to send; if this device IS holding unpushed work,
     the merge just rewrote the three deps of the auto-push debounce, so the
     union goes out 90 seconds later through the path that peeks first. */
  const mergeBlocked = !!(
    composing ||
    undo ||
    confirmReset ||
    confirmForce ||
    confirmRestore
  );
  const autoMerge = useCallback(async () => {
    /* The mid-thought states, and here the stake is higher than for a push —
       this one APPLIES. applyBackup calls setComposing(null) and setUndo(null),
       so a merge landing while a half-built envelope is open DISCARDS entries
       that are hand-typed, in no CSV and on no remote. "Open the composer, duck
       out to read the mailing label, come back two minutes later" is this
       feature's own workflow, over the threshold by construction. */
    if (mergeBlocked) return;
    /* quiet: nobody tapped anything, so nothing may speak in the voice of
       something that was tapped. See doMerge's catch. */
    await doMerge(false, true);
  }, [mergeBlocked, doMerge]);

  /* Through a ref, for the reason autoPushRef exists below: doMerge's identity
     churns on essentially every render, and its consumer is the peek effect,
     whose deps are `[loaded, syncBusy]`. Listing it there would re-register the
     listener on every commit AND re-run `check()`, which is a network read — so
     a sort change would peek. Declared HERE, above that effect, so this updater
     runs first within a commit's effect phase. */
  const autoMergeRef = useRef(autoMerge);
  useEffect(() => {
    autoMergeRef.current = autoMerge;
  });

  /* ---- Worker sync (stage 4b) ----
     With a key, a POST of snapshot() goes out SYNC_POST_MS after a change and on
     foreground, pageshow and online. The reply is held, then applied only after
     IDLE_APPLY_MS with no input and no armed guard: applying mid-tap is the
     layout shift no-layout-shift-under-pointer forbids. */
  const lastActivity = useRef(Date.now());
  const pendingReply = useRef(null);
  const applyTimer = useRef(null);
  const postTimer = useRef(null);
  const skipFirstPost = useRef(true);
  const tryApplyRef = useRef(null);
  tryApplyRef.current = () => {
    clearTimeout(applyTimer.current);
    if (!pendingReply.current || damagedRef.current) return;
    /* a pasted key is a tap the user just made: its first reply applies at once */
    const idle = applyNow.current || idleReady(lastActivity.current, Date.now());
    /* an import notice holds the apply; the notice a server apply left does not */
    const noticeOpen = importMsg && importMsg !== serverNotice.current;
    if (!idle || mergeBlocked || noticeOpen || syncingRef.current) {
      /* wake when the idle gate opens; an armed guard is re-checked each second */
      const left = IDLE_APPLY_MS - (Date.now() - lastActivity.current);
      applyTimer.current = bgTimeout(() => tryApplyRef.current(), idle ? 1000 : Math.max(left, 100));
      return;
    }
    const reply = pendingReply.current;
    pendingReply.current = null;
    applyNow.current = false;
    doMerge(false, true, reply);
  };
  const serverNotice = useRef("");
  const applyNow = useRef(false);
  const lastServer = useRef(null); // the newest ledger the Worker answered with
  const lastRev = useRef(0); // the newest rev whose reply landed
  const inflightRev = useRef(0);
  /* Mirror mode: GitHub is a mirror (no peek, no auto-merge) only while the
     Worker answers. Off at first, on after an ok or empty reply, off again on any
     failure. Off is today's GitHub path, unchanged. */
  const mirrorRef = useRef(false);
  const cycleRef = useRef(null); // the Worker call in flight, for the peek to wait on
  const failN = useRef(0);
  const nextTry = useRef(0);
  const retryTimer = useRef(null);
  const postsInFlight = useRef(0);
  const heldRev = useRef(0); // the highest rev heard while a POST was in flight
  const refusedRef = useRef(false); // a 401: no more calls until the page reloads
  const closeRef = useRef(null);
  const tooBigRef = useRef(false);
  const githubNext = useRef(false); // the next push takes the GitHub path
  /* a Worker call that never answers counts as unreachable */
  const withTimeout = (p) => {
    let t;
    return Promise.race([
      p,
      new Promise((res) => {
        t = setTimeout(() => res({ status: null, body: null, code: "unknown" }), SYNC_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(t));
  };
  /* does the server lack anything this device holds? Merging the snapshot into
     the server ledger changes it only then. View prefs are not data. */
  const dataOf = (l) => ({
    items: l.items || [],
    received: l.received || {},
    receivedAt: l.receivedAt || {},
    envelopes: l.envelopes || [],
    stamps: l.stamps || {},
  });
  /* user-made data: check-ins, envelopes, stamps. Lines alone come back from a CSV. */
  const holdsUserDataRef = useRef(null);
  holdsUserDataRef.current = () => {
    const d = dataOf(snapshot());
    return Object.keys(d.received).length > 0 || d.envelopes.length > 0 || Object.keys(d.stamps).length > 0;
  };
  const lacksRef = useRef(null);
  lacksRef.current = (srv) =>
    canon(dataOf(mergeLedger(srv, snapshot()).merged)) !== canon(dataOf(srv));
  /* one home for a held reply, from a POST or from a rev-gated GET. A reply
     with a rev below the newest landed one is stale and is dropped. */
  /* The ONLY writer of lastServer and pendingReply. The server copy only grows:
     each is the merge of what it held and what arrived, never the arrival alone,
     so a late older reply cannot shrink a bigger merge that is still held. */
  const growServer = (ledger) => {
    lastServer.current = lastServer.current
      ? mergeLedger(lastServer.current, ledger).merged
      : ledger;
    pendingReply.current = pendingReply.current
      ? mergeLedger(pendingReply.current, ledger).merged
      : lastServer.current;
  };
  const holdReply = (r) => {
    const rev = r.body?.rev;
    if (typeof rev === "number") {
      if (rev < lastRev.current) return;
      lastRev.current = rev;
    }
    if (!r.body?.ledger) return;
    growServer(r.body.ledger);
    tryApplyRef.current();
  };
  /* One verdict for every Worker reply. empty (404) is a healthy server with
     nothing stored yet. Anything else but ok is a failure: mirror off, the
     advisory state set, and the retry follows backoffMs, not every save. */
  const settleReply = async (r, fromPost = false) => {
    /* Lane B1: a reply with unreadable entries is kept in History as it came, then
       mended before it is held. No copy, no reply: it counts as a failed call. */
    if (r.code === "ok" && r.body?.ledger) {
      const { data, dropped } = salvageLedger(r.body.ledger);
      if (dropped) {
        try {
          await keep(JSON.stringify(r.body.ledger));
          refreshVersions();
          setMended(mendNotice(dropped));
          r = { ...r, body: { ...r.body, ledger: data } };
        } catch {
          r = { ...r, code: "unknown" };
        }
      }
    }
    if (r.code === "ok" || r.code === "empty") {
      /* only a successful POST clears a too-big state; a GET still holds its reply */
      if (tooBigRef.current && !(fromPost && r.code === "ok")) {
        if (r.code === "ok") holdReply(r);
        return r;
      }
      tooBigRef.current = false;
      mirrorRef.current = true;
      failN.current = 0;
      nextTry.current = 0;
      clearTimeout(retryTimer.current);
      setServerDown(false);
      setWorkerSyncedAt((p) => Math.max(p || 0, Date.now())); // never moves back
      if (r.code === "ok") holdReply(r);
      return r;
    }
    tooBigRef.current = r.code === "too-big";
    mirrorRef.current = false;
    setServerDown(["too-big", "no-access", "bad-shape"].includes(r.code) ? r.code : "unknown");
    if (r.code === "bad-shape") {
      /* a refused shape stays refused: no backoff retry. The next change POSTs again. */
      clearTimeout(retryTimer.current);
      return r;
    }
    if (r.code === "no-access") {
      /* a refused key stays refused: stop POSTs, retries and the socket */
      refusedRef.current = true;
      clearTimeout(retryTimer.current);
      if (closeRef.current) closeRef.current();
      closeRef.current = null;
      return r;
    }
    const wait = backoffMs(failN.current++);
    nextTry.current = Date.now() + wait;
    clearTimeout(retryTimer.current);
    retryTimer.current = bgTimeout(() => postRef.current(), wait);
    return r;
  };
  const postRef = useRef(null);
  postRef.current = () => {
    const p = (async () => {
      if (!window.sync || !(await window.sync.hasKey())) return;
      /* 50 ms of slack: a timer that fires a hair early still retries */
      /* a page that shows the seed holds someone else's ledger: it never POSTs
         (seed-load-guards) */
      if (seedShown || damagedRef.current || refusedRef.current || Date.now() < nextTry.current - 50) return;
      postsInFlight.current++;
      let r;
      try {
        r = await withTimeout(window.sync.post(snapshot()));
      } finally {
        postsInFlight.current--;
      }
      await settleReply(r, true);
      /* a rev heard while the POST was out is this device's own write if the
         reply carries it; only a higher one is another device's */
      if (postsInFlight.current === 0) {
        const held = heldRev.current;
        heldRev.current = 0;
        if (held > lastRev.current) revRef.current(held);
      }
    })();
    cycleRef.current = p;
    return p;
  };
  /* a cold open with a key reads the server at once; the reply is held like any */
  const coldRef = useRef(null);
  coldRef.current = () => {
    cycleRef.current = (async () => {
      try {
        await coldCycle();
      } finally {
        /* every cold path ends here: no reply is held for the apply, so the
           apply-at-once exception of a saved key ends with it */
        if (!pendingReply.current) applyNow.current = false;
      }
    })();
  };
  const coldCycle = async () => {
    {
      if (!window.sync || !(await window.sync.hasKey()) || damagedRef.current) return;
      const r = await settleReply(await withTimeout(window.sync.get()));
      /* a cold open where this device holds something the server lacks (on an
         empty store, any check-ins, envelopes or stamps) sends it within a beat of the first reply */
      const send =
        r.code === "ok"
          ? r.body?.ledger && lacksRef.current(r.body.ledger)
          : r.code === "empty" && holdsUserDataRef.current();
      if (send) bgTimeout(() => postRef.current(), SYNC_COLD_POST_MS);
    }
  };
  /* Paste a Worker key. The field is validated by the same rule as a #k= link,
     stored through window.sync.setKey, cleared, then the cold-open path runs:
     a GET, and a POST when this device holds something the server lacks. */
  const saveSyncKey = async () => {
    const v = (syncKeyInput.current?.value || "").trim();
    /* the field is cleared on every path, the refusals included */
    if (syncKeyInput.current) syncKeyInput.current.value = "";
    if (!KEY_RE.test(v)) {
      setSyncKeyMsg("That is not a valid sync key. Paste it again.");
      return;
    }
    try {
      await window.sync.setKey(v);
    } catch (e) {
      setSyncKeyMsg(
        e?.code === "storage"
          ? "This device could not save the sync key. Try again."
          : "That is not a valid sync key. Paste it again."
      );
      return;
    }
    setSyncKeyMsg("Sync key saved.");
    setWorkerKeySet(true);
    /* a new key lifts a 401 stop and every backoff, and opens the socket if none is open */
    refusedRef.current = false;
    failN.current = 0;
    nextTry.current = 0;
    tooBigRef.current = false;
    setServerDown(false);
    /* the old socket carries the old key: close it, then connect with the new one */
    if (closeRef.current) closeRef.current();
    closeRef.current = window.sync.connect((rev) => revRef.current(rev));
    applyNow.current = true;
    coldRef.current();
  };
  /* the save message is stale once the panel closes or the Worker refuses the key */
  useEffect(() => {
    if (!syncOpen || serverDown === "no-access") setSyncKeyMsg("");
  }, [syncOpen, serverDown]);
  useEffect(() => {
    if (window.sync) window.sync.hasKey().then(setWorkerKeySet, () => setWorkerKeySet(null));
  }, []);
  /* a rev above the last one seen (or already being fetched) is one GET */
  const revRef = useRef(null);
  revRef.current = async (rev) => {
    if (postsInFlight.current > 0) {
      heldRev.current = Math.max(heldRev.current, rev);
      return;
    }
    if (refusedRef.current || damagedRef.current) return;
    if (rev <= Math.max(lastRev.current, inflightRev.current)) return;
    inflightRev.current = rev;
    const r = await withTimeout(window.sync.get());
    if (r.code !== "ok") inflightRev.current = lastRev.current;
    await settleReply(r);
  };
  /* a guard clearing is a reason to look again now, not at the next poll */
  useEffect(() => {
    tryApplyRef.current();
  }, [mergeBlocked, importMsg]);
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!window.sync || !(await window.sync.hasKey()) || dead || refusedRef.current) return;
      closeRef.current = window.sync.connect((rev) => revRef.current(rev));
    })();
    return () => {
      dead = true;
      if (closeRef.current) closeRef.current();
      closeRef.current = null;
    };
  }, []);
  useEffect(() => {
    const touch = () => {
      lastActivity.current = Date.now();
    };
    const evs = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart", "wheel"];
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
    return () =>
      evs.forEach((e) => window.removeEventListener(e, touch, { capture: true }));
  }, []);
  useEffect(() => {
    if (!loaded) return;
    /* a resume, a pageshow or coming online is a reason to try now: the
       backoff paces the retry timer, not the person returning to the app */
    const go = () => {
      nextTry.current = 0;
      postRef.current();
    };
    coldRef.current();
    const vis = () => document.visibilityState === "visible" && go();
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pageshow", go);
    window.addEventListener("online", go);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pageshow", go);
      window.removeEventListener("online", go);
      clearTimeout(applyTimer.current);
      clearTimeout(retryTimer.current);
    };
  }, [loaded]);
  useEffect(() => {
    if (!loaded) return;
    if (skipFirstPost.current) {
      skipFirstPost.current = false;
      return;
    }
    clearTimeout(postTimer.current);
    postTimer.current = bgTimeout(() => {
      /* a save that left the snapshot equal to the server's ledger needs no POST */
      if (lastServer.current && !lacksRef.current(lastServer.current)) return;
      postRef.current();
    }, SYNC_POST_MS);
    return () => clearTimeout(postTimer.current);
  }, [items, received, receivedAt, envelopes, stamps, loaded]);

  /* ---- is the other device ahead? ----
     One cheap read on foreground (see remote.peek). Deliberately NOT on a
     timer: the app has never polled, and the question only has a consequence
     when someone is actually looking at the screen.

     A keyless device cannot read the private repo, so it cannot merge either —
     `peek` answers {known:false} and the merge is refused rather than guessed.
     "I could not look" must never render as "nobody is ahead": that reading is
     what would let this device push over the one that can see. */
  useEffect(() => {
    if (!loaded || !window.remote || typeof window.remote.peek !== "function")
      return;
    const check = async () => {
      /* Consumed synchronously, before anything can await, and on EVERY path
         out including the early returns below. The signal is about THIS
         foreground; letting it survive to whatever re-runs check() next is
         precisely the failure mode, because this effect's deps are
         `[loaded, syncBusy]` and a merge flips syncBusy twice — a surviving
         flag would let the laptop's push land mid-session, with no resume
         anywhere in sight. Dropping a signal costs one tap on the repair kit;
         keeping one costs the guarantee that this only fires on a measured
         absence. */
      const fresh = freshSession.current;
      freshSession.current = false;
      if (document.visibilityState === "hidden" || syncingRef.current) return;
      /* while the Worker answers, GitHub is a mirror: no peek, no merge. The
         Worker call for this foreground settles first. */
      await cycleRef.current;
      if (mirrorRef.current) return;
      const p = await peekTwice();
      /* known:false is "we could not look", which must never render as "all
         clear" — leave the flag exactly as it was. Restructured into an early
         return so the merge below sits INSIDE the known branch rather than
         beside it: an unknown remote cannot license reading it any more than
         writing it, and the structure is what says so. */
      if (!p || !p.known) return;
      setAhead(!!p.ahead);
      /* Not awaited: check() has nothing left to do, and doMerge returns a code
         rather than throwing, so there is no floating rejection here. */
      if (p.ahead && fresh) autoMergeRef.current();
    };
    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, [loaded, syncBusy]);

  /* ---- auto-push ----
     Safe only because the merge above exists. Automating pushes without it
     would turn the conflict trap from something hit occasionally into the
     normal way the two devices meet. */
  const AUTO_PUSH_MS = 90000;
  const autoTimer = useRef(null);
  /* unmount stops every pending background timer, so none fires into a dead app */
  useEffect(
    () => () => {
      for (const r of [resetTimer, saveTimer, flashTimer, applyTimer, postTimer, retryTimer, autoTimer])
        clearTimeout(r.current);
    },
    []
  );
  const skipFirstAuto = useRef(true);
  const mirrorDirty = useRef(false);

  const autoPush = useCallback(async () => {
    if (!window.remote || syncingRef.current) return;
    /* Armed destructive buttons only. `composing` and `undo` are guarded for
       the MERGE, which applies a remote ledger and nulls both — but a push
       changes nothing on this device, and neither state makes the ledger wrong:
       a half-built envelope is not in it yet, and a pending undo sits on top of
       a check-in that genuinely happened and is already saved.
       Guarding a push on them was over-broad, and it stalled: `undo` survives a
       trip to Packages by design (group 14), so an assignment followed by a
       view switch used to stop all backup for the rest of the session,
       invisibly. */
    if (
      confirmReset ||
      confirmForce ||
      /* an armed Restore is an armed destructive button like the rest — and the
         one most likely to have the ground move under it, because a merge or a
         push takes a milestone and prepends a row, shifting every row down
         between the user's two taps */
      confirmRestore
    ) {
      /* and come back to it. The timer is otherwise only re-armed by a change
         to the ledger, so a composer left open past the 90s mark simply dropped
         the pending push until the next edit — a mail day can easily end that
         way. */
      clearTimeout(autoTimer.current);
      autoTimer.current = bgTimeout(() => autoPushRef.current(), AUTO_PUSH_MS);
      return;
    }
    const info = await window.remote.status().catch(() => null);
    if (!info?.hasKey) return;
    /* With a Worker key, GitHub is a mirror: no peek, no merge, and a stale sha
       merges GitHub in and writes under the fresh sha (see doPush), no two-tap. */
    if (mirrorRef.current && !githubNext.current) {
      /* the mirror writes only when the ledger changed since its last write: an
         unchanged resume must not touch GitHub, and a conflict means a merge */
      if (!mirrorDirty.current) return;
      /* cleared BEFORE the push: a change made in flight sets it again */
      mirrorDirty.current = false;
      let r;
      try {
        r = await doPush(false, true, true);
      } finally {
        if (!r?.ok) mirrorDirty.current = true;
      }
      return;
    }
    githubNext.current = false;
    if (typeof window.remote.peek === "function") {
      const p = await peekTwice();
      /* "could not look" means DO NOT PUSH. This is the whole reason peek is
         three-valued: pushing on an unknown remote state is how a device
         overwrites the other one. */
      if (!p || !p.known) return;
      if (p.ahead) {
        setAhead(true);
        return;
      }
    }
    const r = await doPush(false, true);
    /* a conflict opened between the peek and the push — resolve it the safe
       way rather than leaving "Push anyway" armed on an unattended screen */
    if (r && !r.ok && r.code === "conflict") await doMerge(true);
  }, [confirmReset, confirmForce, confirmRestore, doPush, doMerge]);

  /* Through a ref, and that is the whole point: autoPush's identity changes on
     essentially every render (it depends on doPush, which depends on snapshot),
     so listing it as a dep would re-arm the debounce on every commit — a sort
     change would push, and the comment below would be a lie. */
  const autoPushRef = useRef(autoPush);
  useEffect(() => {
    autoPushRef.current = autoPush;
  });

  useEffect(() => {
    if (!loaded) return;
    /* the load effect's first commit is not a change the user made */
    if (skipFirstAuto.current) {
      skipFirstAuto.current = false;
      return;
    }
    mirrorDirty.current = true;
    clearTimeout(autoTimer.current);
    autoTimer.current = bgTimeout(() => autoPushRef.current(), AUTO_PUSH_MS);
    return () => clearTimeout(autoTimer.current);
    /* deliberately only the three fields that are REAL data. dateFilter,
       sortBy and itemSort are on the debounced save because they persist, but
       re-sorting the screen is not a reason to open a network connection. */
  }, [items, received, receivedAt, envelopes, stamps, loaded]);

  /* Backgrounding is the last chance to catch a mail day that never went idle
     for 90s. Best-effort by construction: fetch(keepalive) caps at 64KB and a
     1000-line ledger base64s to roughly 470KB, so iOS will often kill this
     mid-flight. The foreground catch-up above is what actually guarantees it. */
  useEffect(() => {
    if (!loaded) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") autoPushRef.current();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [loaded]);

  const clearKey = useCallback(async () => {
    if (!window.remote) return;
    await window.remote.clearKey().catch(() => {});
    setKeyOpen(true);
    setRemoteInfo(await window.remote.status().catch(() => null));
  }, []);

  /* date range */
  const range = useMemo(() => dateRange(dateFilter, Date.now()), [dateFilter]);

  /* ---- orphaned mail ---- */

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
                  /* what lets the two-device merge tell an edit from a stale
                     copy of the same envelope. Optional and defaulted (absent
                     reads as 0), so envelopes written before this shipped keep
                     loading untouched — invariant saved-state-shape. */
                  updatedAt: Date.now(),
                }
              : e
          )
        : [
            {
              id: newEnvelopeId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              note: draft.note,
              entries: draft.entries,
              photos: draft.photos || [],
            },
            ...prev,
          ]
    );
    composerDraft.current.delete(draft.id ?? "new");
    setComposing(null);
  }, []);

  /* Photos live outside the ledger, so nothing deletes them implicitly —
     discarding an envelope, assigning it away, restoring a backup and
     cancelling a half-built envelope all leave blobs behind. One sweep covers
     every case. Held off while an undo is live, since that can bring an
     envelope (and its photo ids) back. A draft in composerDraft (an open
     composer, or a closed one that kept its draft) holds its own photos: the
     timer reads them when it fires and adds them to the keep set, so the
     draft's photos survive while every other unused blob is still swept. */
  useEffect(() => {
    if (!loaded || undo || composing || syncBusy || !window.photos) return;
    const t = bgTimeout(() => {
      /* checked again HERE, not just in the guard above: a pull writes blobs
         while `envelopes` still holds the old list, so nothing re-runs this
         effect and a timer armed two seconds earlier would delete the very
         photos we just downloaded. The ref is set synchronously; the state
         behind syncBusy is not. */
      if (syncingRef.current) return;
      const keep = new Set(referencedPhotoIds);
      for (const d of composerDraft.current.values())
        for (const id of d.photos || []) keep.add(id);
      window.photos.sweep(keep).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [referencedPhotoIds, undo, composing, syncBusy, loaded]);

  const discardEnvelope = useCallback((id) => {
    setEnvelopes((prev) =>
      prev.map((e) => (e.id === id ? tombstoneOf(e, Date.now()) : e))
    );
    setUndo((u) => (u && u.envelope.id === id ? null : u));
  }, []);

  /* Applies exactly the cards the user recorded — never the rest of the
     package. Counts only ever grow here, so a key is never written as 0. */
  const assignEnvelope = useCallback(
    (env, cand) => {
      const index = liveEnvelopes.findIndex((e) => e.id === env.id);
      const qtyOf = {};
      for (const it of cand.pkg.items) qtyOf[it.key] = it.qty;

      touchReceived(cand.plan.map((p) => p.itemKey));
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
          ? /* keep id/createdAt/note so it holds its place in the pile.
               updatedAt moves, though: assignment SHRINKS an envelope, and
               without a fresh stamp the other device's larger stale copy would
               win the merge and resurrect the entries just checked in. */
            prev.map((e) =>
              e.id === env.id
                ? { ...e, entries: leftovers, updatedAt: Date.now() }
                : e
            )
          : prev.map((e) => (e.id === env.id ? tombstoneOf(e, Date.now()) : e))
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
    [liveEnvelopes, range, touchReceived]
  );

  /* stores the deltas, not a snapshot: if the package was hand-edited before
     the undo, subtracting composes where restoring would clobber */
  const undoAssign = useCallback(() => {
    if (!undo) return;
    touchReceived(undo.plan.map((p) => p.itemKey));
    setReceived((prev) => {
      const next = { ...prev };
      for (const { itemKey, take } of undo.plan) {
        const v = (next[itemKey] || 0) - take;
        if (v > 0) next[itemKey] = v;
        else delete next[itemKey]; // back to key-absent, not a stored 0
      }
      return next;
    });
    /* back in place, with a fresh updatedAt so it beats the tombstone (or the
       shrunk copy) it replaces on the other device too */
    const back = { ...undo.envelope, updatedAt: Date.now() };
    setEnvelopes((prev) => {
      if (prev.some((e) => e.id === back.id))
        return prev.map((e) => (e.id === back.id ? back : e));
      return [back, ...prev];
    });
    setUndo(null);
  }, [undo, touchReceived]);

  /* items ─► activeItems (not canceled) ─► rangedActive (in range) ─► rangedItems (not refunded) ─► packages
                          └─► liveItems (not refunded)                    └─► stampedPackages
     Two exclusions, one chokepoint each. Canceled is the CSV's word; refunded
     is the user's stamp, and it leaves the counts the same way — the money is
     back, so nothing is outstanding. Everything downstream (totals, Tally,
     envelope candidates) inherits both without knowing about either. */
  const activeItems = useMemo(
    () => dropCanceled(items),
    [items]
  );
  const canceledCount = items.length - activeItems.length;
  const refundedGks = useGkSet(stamps, isRefundStamp);
  const stampedGks = useGkSet(stamps, hasStamp);
  const liveItems = useMemo(
    () => dropGks(activeItems, refundedGks),
    [activeItems, refundedGks]
  );

  const canceledPackages = useMemo(() => canceledPackagesOf(items), [items]);

  /* the range applied BEFORE the refund exclusion, so the stamped filter can
     source refunded packages back in — they are otherwise out of the list, and
     that list is the only place a refund can be found and un-stamped */
  const rangedActive = useMemo(() => inRange(activeItems, range), [activeItems, range]);
  const rangedItems = useMemo(
    () => dropGks(rangedActive, refundedGks),
    [rangedActive, refundedGks]
  );

  const hiddenCount = liveItems.length - rangedItems.length;

  /* ---- the ruled head's derived values ----
     Months are read off the orders that actually exist, newest first. That is
     what lets the custom range be picked rather than typed: iOS's numeric
     keypad has no hyphen key, so a masked date field is uncompletable on the
     only device this ships to, and a month can never be 2026-02-31. */
  const months = useMemo(() => {
    const seen = new Set();
    for (const it of items) {
      /* Read the month off an ISO string directly. Going through Date and
         local getters shifts it: Date.parse("2026-05-01") is UTC midnight, and
         getMonth() in any behind-UTC zone rolls it back to April. Older
         exports use M/D/YY, which parses as LOCAL midnight — so those want the
         local getters, and only those. */
      const iso = /^(\d{4})-(\d{2})/.exec(it.date || "");
      if (iso) {
        seen.add(`${iso[1]}-${iso[2]}`);
        continue;
      }
      const t = Date.parse(it.date);
      if (!t) continue;
      const d = new Date(t);
      seen.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return [...seen].sort().reverse();
  }, [items]);

  /* the year is only worth printing when the ledger spans more than one */
  const oneYear = useMemo(
    () => new Set(months.map((k) => k.slice(0, 4))).size <= 1,
    [months]
  );
  const monthLabel = useCallback(
    (k) => MON[+k.slice(5, 7) - 1] + (oneYear ? "" : ` ’${k.slice(2, 4)}`),
    [oneYear]
  );

  /* a custom range that happens to be exactly one whole month is shown as that
     month, so picking "Aug" reads back as "Aug" rather than as "Custom" */
  const monthKey =
    dateFilter.preset === "custom" &&
    dateFilter.from &&
    dateFilter.to &&
    dateFilter.from.slice(0, 7) === dateFilter.to.slice(0, 7) &&
    dateFilter.from.endsWith("-01")
      ? dateFilter.from.slice(0, 7)
      : null;

  const pickMonth = useCallback((k) => {
    const [y, m] = k.split("-").map(Number);
    const last = new Date(y, m, 0).getDate(); // day 0 of next month
    setDateFilter((d) => ({
      ...d,
      preset: "custom",
      from: `${k}-01`,
      to: `${k}-${String(last).padStart(2, "0")}`,
    }));
  }, []);

  const bumpDays = useCallback((by) => {
    setDateFilter((d) => {
      const n = Math.max(1, (parseInt(d.days, 10) || 21) + by);
      return { ...d, preset: "days", days: String(n) };
    });
  }, []);

  const rangeLabel = useMemo(() => {
    const p = dateFilter.preset;
    if (p === "days")
      return dateFilter.days ? `Last ${dateFilter.days}d` : "Last…";
    if (p === "custom") {
      if (monthKey) return monthLabel(monthKey);
      return dateFilter.from || dateFilter.to ? "Custom" : "By month";
    }
    return (RANGES.find(([v]) => v === p) || RANGES[0])[1];
  }, [dateFilter, monthKey, monthLabel]);

  const sortLabel = useMemo(() => {
    const [list, cur] =
      sortView === "items" ? [ITEM_SORTS, itemSort] : [PKG_SORTS, sortBy];
    return (list.find(([v]) => v === cur) || list[0])[1];
  }, [sortView, itemSort, sortBy]);

  /* grouping + filtering */
  const packages = useMemo(() => groupPackages(rangedItems), [rangedItems]);

  /* The stamped filter's source. Built from rangedActive, not rangedItems, so
     refunded packages are in it; filtered to stamped gks; and it obeys the
     range because the count and the list derive from one array — the cell can
     never promise a package the list then hides. Showing and Find still apply
     downstream in `visible`, so the count CAN read higher than the list,
     exactly as "N lines" can. */
  const stampedPackages = useMemo(
    () => stampedPackagesOf(rangedActive, stampedGks),
    [rangedActive, stampedGks]
  );
  const stampedCount = stampedPackages.length;
  /* derived rather than trusted: the effect clears a stale toggle, but without
     this guard the commit before it runs would render an empty list */
  const stampedMode = showStamped && stampedCount > 0;
  useEffect(() => {
    if (stampedCount === 0) setShowStamped(false);
  }, [stampedCount]);
  const orderSource = stampedMode ? stampedPackages : packages;

  /* Envelope candidates deliberately ignore the date filter — a mystery
     envelope is just as likely to be an old order as a recent one. */
  const allPackages = useMemo(() => groupPackages(liveItems), [liveItems]);

  const outstandingNames = useMemo(
    () => outstandingNamesOf(liveItems, received),
    [liveItems, received]
  );

  /* Derived, never stored — so a package received by other means simply stops
     being offered, with no stale-suggestion bookkeeping to get wrong. */
  const envelopeCandidates = useMemo(() => {
    const map = new Map();
    if (view !== "mystery") return map; // only ever read in that view
    for (const env of liveEnvelopes)
      map.set(env.id, rankCandidates(env.entries, allPackages, received));
    return map;
  }, [liveEnvelopes, allPackages, received, view]);

  const photoCount = referencedPhotoIds.length;
  /* Ids, not blobs. After a pull that kept ids whose bytes are still on GitHub,
     the two genuinely differ, and reporting only the first would claim photos
     are "stored" on a device holding none of them — and offer a
     "Backup + photos" whose photos map comes out empty. */
  const [photosHere, setPhotosHere] = useState(null);

  useEffect(() => {
    if (view !== "mystery" || !window.photos) return;
    window.photos.usage().then(setPhotoUsage).catch(() => {});
    window.photos
      .keys()
      .then((keys) => {
        const here = new Set(keys || []);
        setPhotosHere(referencedPhotoIds.filter((id) => here.has(id)).length);
      })
      .catch(() => setPhotosHere(null));
  }, [view, photoCount, photoEpoch, referencedPhotoIds]);

  /* package ordering — computed when sort/filters change, frozen while checking
     so packages don't leapfrog mid-session on value-based sorts */
  const packageOrder = useMemo(() => {
    /* orderSource, not packages: a refunded package is only ever in the
       stamped list, and ranking off `packages` would leave every one of them
       at ?? 1e9 — last under every sort */
    const order = new Map();
    sortPackages(orderSource, sortBy, receivedRef.current).forEach((p, i) =>
      order.set(p.gk, i)
    );
    return order;
  }, [orderSource, sortBy]);

  const visible = useMemo(() => {
    /* a stamp is the package's, not a line's: filterPackages reads its label
       and note through this, so the label table stays here */
    const stampText = (gk) => {
      const s = stamps[gk];
      return hasStamp(s) ? `${STAMP_LABEL[s.kind] || ""} ${s.note || ""}` : "";
    };
    return filterPackages(orderSource, {
      query,
      hideDone,
      received,
      sticky,
      revealed,
      stampText,
    }).sort(
      (a, b) => (packageOrder.get(a.gk) ?? 1e9) - (packageOrder.get(b.gk) ?? 1e9)
    );
  }, [orderSource, stamps, query, hideDone, received, sticky, packageOrder, revealed]);

  /* Tally totals: exact product-name match, pooled across every seller/order.
     TCGplayer names are a scrape, so identical items carry byte-identical names.
     basis = what the copies cost (price × qty); shipping and tax are per-order
     in the CSV, not per-line, so they're not in it. */
  const itemGroups = useMemo(() => tallyGroups(rangedItems), [rangedItems]);

  /* frozen while checking, same as packageOrder */
  const itemOrder = useMemo(() => {
    const order = new Map();
    sortTally(itemGroups, itemSort, receivedRef.current).forEach((g, i) =>
      order.set(g.name, i)
    );
    return order;
  }, [itemGroups, itemSort]);

  const visibleItems = useMemo(
    () =>
      filterTally(itemGroups, { query, hideDone, received, sticky }).sort(
        (a, b) => (itemOrder.get(a.name) ?? 1e9) - (itemOrder.get(b.name) ?? 1e9)
      ),
    [itemGroups, query, hideDone, received, sticky, itemOrder]
  );

  /* `val` is what the range cost, `missingVal` what hasn't landed; the
     masthead shows val - missingVal as the figure already in hand. Both
     exclude canceled orders, since rangedItems already does. */
  const totals = useMemo(() => totalsOf(rangedItems, received), [rangedItems, received]);
  const ledgerCards = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items]);
  /* Reset also clears the envelopes, so its count must include their cards */
  const envelopeCards = useMemo(
    () => liveEnvelopes.reduce((n, e) => n + e.entries.reduce((m, x) => m + x.qty, 0), 0),
    [liveEnvelopes]
  );

  /* Packages fully checked in, for the masthead tally. */
  const pkgsDone = useMemo(() => packagesDone(packages, received), [packages, received]);

  const remaining = totals.total - totals.got;

  if (!opened)
    return (
      <div
        style={{
          fontFamily: cochin,
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

  /* The two exports, as data, for the History panel's grid — one entry per
     export. */
  const backupActions = [
    { key: "backup", onClick: () => backup(false), label: "Backup" },
  ];
  if (photoCount > 0)
    backupActions.push({
      key: "photos",
      onClick: () => backup(true),
      disabled: backupBusy,
      label: backupBusy ? "Packing…" : "Backup + photos",
    });

  /* Backup and Backup + photos moved OUT of here and into the History panel.
     They are version actions — "save one off this device" — not sync actions,
     and this panel is now a repair kit reached only when something has broken.
     Leaving them here would put the two controls a healthy device might
     actually want behind a door that only opens on failure. */
  /* The ○/● Auto-push toggle lived here. It is gone on purpose, and not
     because the feature was dropped — sync is unconditional now. A per-device
     switch for "does this work" made the thing the app is supposed to do
     quietly into a thing you had to opt into, and an off toggle on the other
     device is a silent way to be unbacked-up for months. The `auto` field
     survives in entry.jsx's record, unread; removing a stored field is its own
     migration question. */

  const versionMsgBox = (
    <div
      style={{
        fontFamily: cochin,
        fontSize: 13.5,
        lineHeight: 1.4,
        padding: "8px 10px",
        background: C.redSoft,
        color: C.red,
      }}
    >
      {versionMsg}
    </div>
  );

  return (
    <div
      style={{
        fontFamily: cochin,
        background: C.paper,
        minHeight: "100vh",
        color: C.ink,
      }}
    >
      <style>{`
        button:focus-visible { outline: 2px solid ${C.green}; outline-offset: 2px; }
        input:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 1px; }
        button, input { -webkit-tap-highlight-color: transparent; }

        /* Form controls do NOT inherit font-family — browsers force their own
           UI font. Without this, every button that didn't set one explicitly
           rendered in the UA default (Arial in Chrome) rather than the theme
           theme face, which is what made seller names look like a different face.
           font-family only: the many controls that set their own size/weight
           inline must keep them, and inline styles already win over this. */
        button, input, select, textarea { font-family: inherit; }

        /* ── Masthead ────────────────────────────────────────────────────
           Sizing is by clamp() rather than breakpoints: this file has no
           media queries anywhere and responds intrinsically, so clamp keeps
           that property — it is only a value, not a new layout mode. Each
           curve is tuned to hit its two design sizes at 375px and at 760px,
           which is where the content column stops growing. */
        .mdl-head { text-align: center; padding: 14px 8px 0; }
        .mdl-rule { display: flex; align-items: center; justify-content: center;
                    gap: 13px; max-width: 270px; margin: 0 auto 11px; }
        .mdl-rule i { flex: 1; height: 1px; background: ${C.gold}; opacity: .75; }
        .mdl-seal { width: clamp(36px, calc(20px + 4.2vw), 52px); height: auto; }
        .mdl-title { margin: 0; font-weight: 400; text-transform: uppercase;
                     font-size: 31px; font-size: clamp(31px, calc(24px + 1.9vw), 38px);
                     letter-spacing: .22em; text-indent: .22em; line-height: 1.06; }
        .mdl-house { font-family: ${mono}; letter-spacing: .26em;
                     font-size: 10px;
                     text-transform: uppercase; color: ${C.inkSoft}; margin-top: 9px; }

        .mdl-tallies { border-top: 1px solid ${C.line}; margin-top: 13px;
                       padding-top: 11px; text-align: left; }
        .mdl-thirds { display: flex; text-align: center; margin-bottom: 9px; }
        /* NOT equal thirds. Measured at 375px: the content column is 343px, the
           two counts are 7 characters ("559/905") and the value is 15
           ("$38.32k/$47.94k") — about 55px against 117px at mono 13px. Equal
           tracks starve the only cell that needs room and leave ~59px unused in
           each of the other two, so the value ran into the divider on its left.
           1/1/1.5 gives 98/98/147 and every figure clears its cell. It gets
           worse as the ledger grows, so the track is sized past today: at 1.5
           the six-figure "$100.24k/$118.60k" (133.1px) still overran a 123.9px
           cell. At 1.7, measured at 375px, all three land on the SAME headroom
           — 23.3 / 23.3 / 23.2px — and the six-figure case fits exactly rather
           than clipping. Re-measure if the type size or padding changes. */
        .mdl-thirds > div { flex: 1; min-width: 0; padding: 0 6px; }
        .mdl-thirds .mdl-wide { flex: 1.7; }
        .mdl-thirds .mdl-mid { border-left: 1px solid ${C.line};
                               border-right: 1px solid ${C.line}; }
        .mdl-k { font-family: ${mono}; font-size: 10px; letter-spacing: .16em;
                 text-transform: uppercase; color: ${C.inkSoft}; }
        .mdl-fig { font-family: ${mono}; font-size: 13px; margin-top: 3px;
                   white-space: nowrap; }
        .mdl-fig b { color: ${C.accent}; font-weight: 700; }
        .mdl-fig span { color: ${C.inkSoft}; }
        .mdl-foot { display: flex; justify-content: space-between; flex-wrap: wrap;
                    gap: 2px 12px; margin-top: 8px; font-family: ${mono};
                    font-size: 10.5px; color: ${C.inkSoft}; }

        /* Fixed height, always in flow, bled to the column edges so content
           passes under it rather than beside it. Only opacity/transform
           change when it pins — never height.
           This height is load-bearing TWICE. It is the running head, and while
           unpinned it is also the masthead's bottom margin — the 46px of air
           above the view switch is this element, not a margin anywhere. That
           spacing is wanted: it drops the filters into one-handed thumb reach.
           So don't "reclaim" it by shrinking this to fit the text; if the bar
           ever goes away, give the masthead an explicit marginBottom instead. */
        .mdl-sticky { position: sticky; top: 0; z-index: 30; height: 46px;
                      margin: 0 -16px; padding: 0 16px;
                      display: flex; align-items: center; gap: 10px;
                      background: ${C.paper};
                      border-bottom: 1px solid ${C.line};
                      opacity: 0; pointer-events: none;
                      transform: translateY(-3px);
                      transition: opacity 160ms ease, transform 160ms ease; }
        .mdl-sticky[data-stuck="yes"] { opacity: 1; transform: none;
                                        pointer-events: auto; }
        .mdl-sticky-t { font-size: 16px; letter-spacing: .18em;
                        text-transform: uppercase; }
        .mdl-sticky-f { margin-left: auto; font-family: ${mono}; font-size: 11px;
                        color: ${C.inkSoft}; white-space: nowrap; }

        /* The bottom bar: a floating glass capsule, 24px in from each side,
           12px above the home indicator, capped at 480px and centred. Each
           tab is a 44px-plus target. The active tab is a card-colour pill. */
        .mdl-bar { position: fixed; z-index: 50; left: 24px; right: 24px;
                   max-width: 480px; margin: 0 auto; height: 64px;
                   bottom: calc(12px + env(safe-area-inset-bottom));
                   display: flex; gap: 2px; padding: 5px;
                   box-sizing: border-box; border: 1px solid ${C.line};
                   border-radius: 999px;
                   background: color-mix(in srgb, ${C.paper} 62%, transparent);
                   -webkit-backdrop-filter: blur(18px) saturate(1.8);
                   backdrop-filter: blur(18px) saturate(1.8);
                   box-shadow: 0 8px 24px ${C.shadow}, 0 1px 3px ${C.shadow}; }
        .mdl-bar button { position: relative; flex: 1; min-width: 44px;
                   min-height: 44px; display: flex; flex-direction: column;
                   align-items: center; justify-content: center; gap: 3px;
                   padding: 0; border: 0; border-radius: 999px;
                   background: transparent; color: ${C.ink}; cursor: pointer;
                   font-family: ${mono}; font-size: 10px; letter-spacing: .09em;
                   text-transform: uppercase; }
        .mdl-bar button svg { width: 22px; height: 22px; fill: none;
                   stroke: currentColor; stroke-width: 1.8;
                   stroke-linecap: round; stroke-linejoin: round; }
        .mdl-bar button.on { background: color-mix(in srgb, ${C.card} 90%, transparent);
                   color: ${C.accent}; box-shadow: inset 0 0 0 1px ${C.line}; }
        .mdl-bar button b { position: absolute; top: 6px; left: 50%;
                   margin-left: 13px; font-size: 10px; font-weight: 700;
                   color: ${C.red}; }
        .mdl-pill { position: fixed; z-index: 50; left: 24px; right: 24px;
                   max-width: 480px; margin: 0 auto; height: 48px;
                   bottom: calc(12px + 64px + 8px + env(safe-area-inset-bottom));
                   display: flex; align-items: center; gap: 10px;
                   padding: 0 18px; box-sizing: border-box;
                   border: 1px solid ${C.line}; border-radius: 999px;
                   background: color-mix(in srgb, ${C.paper} 62%, transparent);
                   -webkit-backdrop-filter: blur(18px) saturate(1.8);
                   backdrop-filter: blur(18px) saturate(1.8);
                   box-shadow: 0 8px 24px ${C.shadow}, 0 1px 3px ${C.shadow}; }
        .mdl-pill:focus-within { border-color: ${C.accent}; }
        .mdl-pill svg { flex: none; width: 20px; height: 20px; fill: none;
                   stroke: ${C.inkSoft}; stroke-width: 1.8;
                   stroke-linecap: round; }
        .mdl-pill input { flex: 1; min-width: 0; height: 100%; border: 0;
                   background: transparent; outline: none;
                   font-family: ${cochin}; color: ${C.ink}; padding: 0; }

        /* ── The Ledger tab ─────────────────────────────────────────────
           Grouped cards of full-width rows: label (and a sub line) left, a
           mono value right, a chevron drawn by CSS so it never enters the
           row's text. Each row is a 52px target. Reset sits in its own card;
           armed, it fills in place beside Cancel and nothing around it moves. */
        .mdl-lh { margin: 18px 0 0; text-align: center; font-weight: 400;
                  font-family: ${mono}; font-size: 12px; letter-spacing: .3em;
                  text-indent: .3em; text-transform: uppercase; color: ${C.inkSoft}; }
        .mdl-lg { margin: 16px 4px 8px; font-family: ${mono}; font-size: 11px;
                  letter-spacing: .2em; text-transform: uppercase; color: ${C.inkSoft}; }
        .mdl-lcard { background: ${C.card}; border: 1px solid ${C.line};
                     border-radius: 16px; overflow: hidden; }
        .mdl-lrow { display: flex; align-items: center; gap: 12px; width: 100%;
                    min-height: 52px; padding: 10px 16px; border: 0;
                    border-top: 1px solid ${C.line}; background: transparent;
                    text-align: left; color: ${C.ink}; cursor: pointer; }
        .mdl-lcard > :first-child { border-top: 0; }
        .mdl-lrow > .l { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .mdl-lrow .t { font-size: 20px; line-height: 1.15; }
        .mdl-lrow .s { font-size: 13.5px; line-height: 1.3; color: ${C.inkSoft}; }
        .mdl-lrow .v { font-family: ${mono}; font-size: 14px; color: ${C.accent};
                       text-align: right; }
        .mdl-lrow::after { content: "›"; font-size: 22px; line-height: 1;
                           color: ${C.inkSoft}; flex-shrink: 0;
                           transition: transform 140ms ease; }
        .mdl-lrow:not([aria-expanded])::after { content: none; }
        .mdl-lrow[aria-expanded="true"]::after { transform: rotate(90deg); }
        .mdl-lrow:disabled { opacity: .6; cursor: default; }
        .mdl-reset { display: flex; }
        .mdl-act { flex: 1; min-width: 0; min-height: 52px; padding: 10px 16px;
                   border: 0; background: transparent; text-align: left;
                   font-size: 20px; color: ${C.ink}; cursor: pointer; }
        .mdl-act > span { display: block; min-width: 0; overflow: hidden;
                          text-overflow: ellipsis; white-space: nowrap; }
        .mdl-act.cancel { flex: 0 0 auto; border-left: 1px solid ${C.line}; }
        .mdl-act.danger { color: ${C.red}; }
        .mdl-act.armed { background: ${C.red}; color: ${C.card}; font-weight: 700; font-size: 15px; }

        /* ── Motion ──────────────────────────────────────────────────────
           A joy pass, under one rule: NOTHING HERE MAY REFLOW. Every keyframe
           below touches opacity, transform, colour or box-shadow and nothing
           else — no width, height, margin or padding on anything a finger is
           about to land on. That is invariant no-layout-shift-under-pointer restated as a stylesheet
           constraint, and it is why the sliding switch thumb is an absolutely
           positioned element rather than a background that moves between three
           buttons, and why the check tick is drawn with stroke-dashoffset
           inside a box whose 30px never changes.

           The register is stationery, not software: a stamp rocked onto paper,
           a seal pressed, rules drawn like a pen stroke, gold catching light
           once. Nothing springs, nothing bounces past its rest and hangs there.
           The one overshoot in here — the stamp's +1deg — is the wrist roll
           that inks a rubber stamp's edges, and it returns THROUGH rest rather
           than oscillating around it.

           Every rule is switched off in the reduced-motion block at the foot of
           this sheet, where the app is exactly what it was before this pass:
           each animated thing has a resting state that is its own final frame,
           so a plain animation:none leaves it drawn, not hidden. (No
           backticks anywhere in this sheet's comments — it is one template
           literal, and a stray one would end the string.) */

        /* The letterhead composes itself once per load: the seal is pressed,
           then the rules are drawn outward from it, then the type settles.
           These are both-filled animations on elements that mount once, so
           they run on first paint and never again — a re-render does not
           rebuild them, and nothing here is on a timer. */
        .mdl-head .mdl-seal { animation: mdl-press 600ms cubic-bezier(.22,.85,.3,1) both; }
        @keyframes mdl-press {
          0%   { opacity: 0; transform: scale(.68) rotate(-10deg); }
          58%  { opacity: 1; transform: scale(1.06) rotate(2.5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        /* the catch of light, once the wax is down and still. Only the
           masthead's seal; the running head's is left alone. */
        .mdl-head .mdl-seal .mdl-shine {
          animation: mdl-shine 520ms 420ms ease-out both; }
        @keyframes mdl-shine { from { opacity: 0; } to { opacity: .22; } }
        /* drawn outward from the seal, and AFTER it — the order a page is
           actually made in: press the wax, then rule the paper */
        .mdl-rule i { animation: mdl-draw 680ms 240ms cubic-bezier(.16,1,.3,1) both; }
        .mdl-rule i:first-child { transform-origin: right center; }
        .mdl-rule i:last-child  { transform-origin: left center; }
        @keyframes mdl-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* The sequence is staged rather than crowded: five overlapping beats
           landing in the order a letterhead is actually made — wax, rules,
           name, house, figures — and finished by ~1060ms. An earlier cut ran
           the whole thing inside 700ms and it read as one blur rather than as
           a sequence; the ceremony is the point, and it is bought at the price
           the owner chose knowingly, which is that the tallies arrive last.
           That price is the thing to re-examine if this is ever revisited: the
           figures are what the app is opened to read. Keep the last beat under
           ~1.1s, and never let the tallies start after the house line. */
        .mdl-title   { animation: mdl-settle 540ms 360ms cubic-bezier(.16,1,.3,1) both; }
        .mdl-house   { animation: mdl-settle 500ms 470ms cubic-bezier(.16,1,.3,1) both; }
        .mdl-tallies { animation: mdl-settle 500ms 560ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes mdl-settle {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: none; }
        }

        /* A stamp lands: down at an angle, rocked flat, settled back. It plays
           only when a package actually completes under the user's finger —
           useJustBecame gates it — because a class alone would restamp every
           finished order on the page each time React rebuilt the tree.
           The --rest property carries the element's own resting angle, so the
           RECEIVED
           stamp (-4deg) and the order-stamp band (-3deg) share one keyframe
           set and each returns to its own place. */
        .mdl-land { animation: mdl-stamp 380ms cubic-bezier(.32,.7,.3,1) both; }
        @keyframes mdl-stamp {
          0%   { opacity: 0; transform: rotate(-13deg) scale(1.3); }
          45%  { opacity: 1; transform: rotate(1deg) scale(.97); }
          72%  { transform: rotate(-6deg) scale(1.01); }
          100% { opacity: 1; transform: rotate(var(--rest, -4deg)) scale(1); }
        }

        /* Gold catching light, once, along a bar that has just filled. It is a
           sibling inside the bar's own overflow:hidden box, so it is clipped to
           the bar and can never paint over the row. */
        .mdl-sheen { position: absolute; inset: 0; pointer-events: none;
                     background: linear-gradient(100deg, transparent 32%,
                       ${C.card} 50%, transparent 68%);
                     animation: mdl-sheen 620ms 140ms cubic-bezier(.3,0,.2,1) both; }
        @keyframes mdl-sheen {
          from { opacity: .9; transform: translateX(-105%); }
          to   { opacity: 0;  transform: translateX(105%); }
        }

        /* Gold catching light across a package that has just been completed.
           Faint and quick: the band is the ornamental gold, which is never
           allowed to carry information, and here it carries none — it says
           only that something finished. Opacity is animated on the element
           rather than baked into the gradient stops so the palette stays whole
           values from C, with no alpha literal in the gradient. */
        .mdl-gild { position: absolute; inset: 0; pointer-events: none;
                    background: linear-gradient(100deg, transparent 34%,
                      ${C.gold} 50%, transparent 66%);
                    animation: mdl-gild 620ms 60ms cubic-bezier(.32,0,.24,1) both; }
        @keyframes mdl-gild {
          0%   { opacity: 0;   transform: translateX(-60%); }
          35%  { opacity: .30; }
          100% { opacity: 0;   transform: translateX(60%); }
        }

        /* The tick is written rather than switched on: one stroke, left to
           right, in the time it takes to notice it happened. 300ms is the
           ceiling here and not a preference — this fires hundreds of times on
           a mail day, and anything slower would start to feel like latency. */
        .mdl-nib { stroke-dasharray: 26; animation: mdl-nib 300ms cubic-bezier(.4,.1,.3,1) both; }
        @keyframes mdl-nib { from { stroke-dashoffset: 26; } to { stroke-dashoffset: 0; } }

        /* A card opening. Its contents are laid down in order rather than
           switched on at once — the same gesture as a letter being unfolded,
           and the same rule as the panels below: the SPACE the card takes
           appears in one commit and is never animated. Animating the height
           would reflow every card beneath it for the length of the animation,
           which is the one thing this sheet may not do.

           Collapsing is deliberately NOT animated, and that is the same rule
           read the other way. An exit animation means keeping the rows mounted
           after the tap and shrinking the card a fifth of a second later — a
           delayed layout change, under a thumb that has already moved on, which
           is worse than an immediate one. The caret carries both directions
           instead: it is the one thing that moves on the way closed.

           The stagger is capped so a twenty-line order finishes as promptly as
           a three-line one — past the sixth row every remaining row shares the
           last beat. It is gated on useJustBecame, so a card that renders
           already open (an unreceived package starts expanded) stays still. */
        .mdl-reveal { animation: mdl-reveal 240ms cubic-bezier(.16,1,.3,1) both;
                      animation-delay: min(calc(var(--i, 0) * 22ms), 132ms); }
        @keyframes mdl-reveal {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: none; }
        }

        /* Disclosures. The panel's arrival is animated; the space it takes is
           not, and must not be — the layout it pushes down is the same layout
           it has always pushed down, one commit after the tap. */
        .mdl-panel { animation: mdl-panel 220ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes mdl-panel {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mdl-sticky { transition: none; transform: none; }
            /* Each of these rests at its own final frame, so switching the
             animation off leaves the thing drawn and in place rather than
             stranded at opacity 0 — the seal is visible, the rules are full
             width, the tick is complete, the stamp sits at its inline angle. */
          .mdl-head .mdl-seal, .mdl-head .mdl-seal .mdl-shine, .mdl-rule i,
          .mdl-title, .mdl-house, .mdl-tallies,
          .mdl-land, .mdl-nib, .mdl-panel, .mdl-reveal { animation: none; }
          .mdl-sheen, .mdl-gild { display: none; }
        }
      `}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px calc(148px + env(safe-area-inset-bottom))" }}>
        {/* ── Masthead ───────────────────────────────────────────────────
            A letterhead: seal, title, house line, then the tallies folded in
            under a rule. One composed block, not three stacked boxes — the
            stats used to be their own bordered card and the two edges fought
            each other 20px apart. */}
        <div className="mdl-head">
          <div className="mdl-rule">
            <i />
            <Seal id="head" size={52} className="mdl-seal" />
            <i />
          </div>
          <h1 className="mdl-title">Manifest</h1>
          <div className="mdl-house">C.H Postal Company</div>

          {items.length > 0 && (
            <div className="mdl-tallies">
              {/* done / total for each of the three things being tracked.
                  Cards and packages are counts; value is compacted, because
                  three figures share one row at 375px and cents are noise
                  there — `money()` is still used everywhere a figure has to be
                  read exactly. */}
              <div className="mdl-thirds">
                <div>
                  <div className="mdl-k">cards</div>
                  <div className="mdl-fig">
                    <b>{totals.got}</b>
                    <span>/{totals.total}</span>
                  </div>
                </div>
                <div className="mdl-mid">
                  <div className="mdl-k">packages</div>
                  <div className="mdl-fig">
                    <b>{pkgsDone}</b>
                    <span>/{packages.length}</span>
                  </div>
                </div>
                <div className="mdl-wide">
                  <div className="mdl-k">value</div>
                  <div className="mdl-fig">
                    <b>${compact(totals.val - totals.missingVal)}</b>
                    <span>/${compact(totals.val)}</span>
                  </div>
                </div>
              </div>
              <ProgressBar
                pct={totals.total ? (totals.got / totals.total) * 100 : 0}
              />
              <div className="mdl-foot">
                <span style={{ whiteSpace: "nowrap" }}>
                  {view === "mystery"
                    ? `${liveEnvelopes.length} envelope${
                        liveEnvelopes.length === 1 ? "" : "s"
                      } waiting`
                    : view === "items"
                    ? `${itemGroups.length} unique item${
                        itemGroups.length === 1 ? "" : "s"
                      }${range ? " in range" : ""}`
                    : `${packages.length} packages${range ? " in range" : ""}`}
                  {" · autosaves"}
                </span>
                {/* the exact outstanding figure — the compacted third above
                    rounds, and this is the number the whole app exists for */}
                <span
                  style={{
                    fontWeight: 700,
                    color: remaining === 0 ? C.green : C.red,
                  }}
                >
                  {remaining === 0
                    ? "ALL ACCOUNTED FOR ✓"
                    : `${remaining} still missing · ${money(totals.missingVal)}`}
                </span>
                {/* The indicator's slot is RESERVED, never sized by what is
                    in it. `.mdl-foot` wraps, so a slot that exists only while
                    a save is in flight can add a whole LINE to the row — and
                    every package card below it then steps down ~14px on the
                    tap and back up when the save clears. By then the masthead
                    has scrolled away and the thumb is on a card, so what
                    actually moves is the list: the layout shift under the
                    pointer invariant no-layout-shift-under-pointer exists to prevent, twice per check-in.
                    Measured at 375px against the seeded ledger, 4 of 10
                    realistic figure pairs moved by 12–14px; which ones depends
                    only on where the two figures happen to fall relative to
                    the wrap point, which is why the fix is to take the
                    indicator out of that arithmetic rather than to widen
                    anything. The width is the LONGEST of the three states —
                    "couldn’t save", 13 monospace characters — so the content
                    swaps inside a box that never changes size. Change that
                    copy and re-measure at 375px: jsdom has no layout, so no
                    test can catch the shift itself. Group 42 pins what is
                    left — that the reservation exists, that the slot is never
                    empty, and that the longest message still fits the `ch`
                    reserved here. Whether that many `ch` is enough in the
                    font the page actually renders is a viewport's answer. */}
                <span
                  style={{
                    minWidth: "13ch",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    color: saving === "error" ? C.red : undefined,
                  }}
                >
                  {saving === "saving"
                    ? "saving…"
                    : saving === "saved"
                    ? "saved ✓"
                    : saving === "error"
                    ? "couldn’t save"
                    : /* idle. A non-breaking space, not nothing: the reserved
                         width alone is not enough, because an EMPTY flex item
                         is zero pixels TALL, and when the slot wraps onto a
                         line of its own that line collapses — which put the
                         shift straight back (measured: 14px idle against 26px
                         saving). One space gives the box the row's own line
                         box without hard-coding a height. */
                      "\u00a0"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sentinel + running head. The bar is always in flow at a fixed
            height, so pinning it never moves anything; only its opacity
            changes. See the note on `stuck` above — this is load-bearing for
            invariant no-layout-shift-under-pointer. */}
        <div ref={sentinel} style={{ height: 1 }} aria-hidden="true" />
        <div className="mdl-sticky" data-stuck={stuck ? "yes" : "no"}>
          <Seal id="bar" size={22} />
          <span className="mdl-sticky-t">Manifest</span>
          {items.length > 0 && (
            <span className="mdl-sticky-f">
              {totals.got}/{totals.total}
              {remaining > 0 && ` · ${money(totals.missingVal)}`}
            </span>
          )}
        </div>

        {/* envelopes can outlive the ledger, so the switch has to survive an
            empty item list or they'd be stranded with no way back to them.
            Equal thirds at full width: the pill can no longer overflow the
            column, so the constraint moved inside — the longest label plus its
            badge has to fit one third (~114px at 375px) and the lever is the
            clamped font-size, not the padding. */}
        {/* The bottom bar (phone-nav-is-bottom-bar). It shows on every
            ledger, empty included, so Re-import and Reset stay reachable and
            envelopes are never stranded. Four tabs, Ledger first. */}
        <nav className="mdl-bar" aria-label="Views">
          {[
            ["ledger", "Ledger", BAR_ICONS.ledger],
            ["mystery", "Orphaned", BAR_ICONS.mystery],
            ["items", "Tally", BAR_ICONS.items],
            ["packages", "Packages", BAR_ICONS.packages],
          ].map(([v, label, d]) => (
            <button
              key={v}
              onClick={() => leaveFor(v)}
              aria-current={view === v ? "page" : undefined}
              className={view === v ? "on" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">{d}</svg>
              {label}
              {v === "mystery" && liveEnvelopes.length > 0 && (
                <b>{liveEnvelopes.length}</b>
              )}
            </button>
          ))}
        </nav>

        {listView && items.length > 0 && (
          <div className="mdl-pill" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find card, set, seller, order"
              aria-label="Search cards, sets, sellers and order ids"
              /* 16px or focusing it zooms the page on iOS */
              style={{ fontSize: 16 }}
            />
          </div>
        )}

        {view !== "ledger" &&
          ((listView &&
            items.length > 0 &&
            (canceledCount > 0 || (view === "packages" && stampedCount > 0))) ||
            !!syncBroken) && (
          <section style={{ marginBottom: 16 }}>
            {/* The working screens keep only the canceled and stamped
                references and the sync advisory. Every option moved to the
                Ledger tab (decision ledger-tab-holds-options). */}
            <div style={RULE} />
            {listView && items.length > 0 && (
              <>
                  {/* Find moved to the floating pill above the bottom bar
                      (phone-nav-is-bottom-bar). The canceled reference and the
                      stamped filter keep their ruled row, and the row exists
                      only while one of them has something to show. */}
                  {(canceledCount > 0 ||
                    (view === "packages" && stampedCount > 0)) && (
                  <>
                  <div
                    style={{ display: "flex", alignItems: "stretch", height: 40, justifyContent: "flex-end" }}
                  >
                    {canceledCount > 0 && (
                      <button
                        onClick={() => setShowCanceled((s) => !s)}
                        aria-expanded={showCanceled}
                        style={cancCell(showCanceled)}
                      >
                        {canceledCount} canceled
                        <i style={{ fontSize: 10 }}>{showCanceled ? "▾" : "▸"}</i>
                      </button>
                    )}
                    {/* a filter, not a disclosure — hence the Showing cell's
                        ○/● and aria-pressed rather than the caret. Packages
                        only: a stamp belongs to a package, and Tally has no
                        package to filter. */}
                    {view === "packages" && stampedCount > 0 && (
                      <button
                        onClick={() => setShowStamped((s) => !s)}
                        aria-pressed={showStamped}
                        style={cancCell(showStamped)}
                      >
                        {stampedCount} stamped
                        <i
                          style={{
                            fontSize: 10,
                            color: showStamped ? C.accent : C.inkSoft,
                          }}
                        >
                          {showStamped ? "●" : "○"}
                        </i>
                      </button>
                    )}
                  </div>

                  <div style={RULE_THIN} />
                  </>
                  )}
              </>
            )}
            {syncBroken && (
                /* The one thing sync says on a working screen, and the way
                   into the Sync group on the Ledger tab. Advisory manila,
                   never red: being unbacked-up is a state to fix, not a loss
                   that has happened. It shows only when something is wrong
                   (ledger-tab-holds-options). */
                <button
                  aria-expanded={syncOpen}
                  onClick={() => {
                    setHistoryOpen(false);
                    setSyncOpen(true);
                    leaveFor("ledger");
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    fontFamily: cochin,
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    padding: "9px 9px 10px",
                    border: 0,
                    borderTop: `1px solid ${C.line}`,
                    background: C.manila,
                    color: C.manilaInk,
                    cursor: "pointer",
                  }}
                >
                  {syncSays}
                </button>
              )}
            <div style={RULE} />
          </section>
        )}

        {view === "ledger" && (
          <section style={{ marginBottom: 16 }} aria-label="Ledger options">
            <h2 className="mdl-lh">Ledger</h2>
            {items.length > 0 && (
              <>
                <div className="mdl-lg">View</div>
                <div className="mdl-lcard">
                  <LedgerRow
                    label="Showing"
                    value={`${hideDone ? "●" : "○"} ${hideDone ? "Unreceived" : "Everything"}`}
                    onClick={() => setHideDone((h) => !h)}
                    pressed={hideDone}
                  />
                  <LedgerRow
                    label="Sorted by"
                    value={sortLabel}
                    expanded={sortOpen}
                    onClick={() => {
                      setRangeOpen(false);
                      setSortOpen((o) => !o);
                    }}
                  />
                  {sortOpen && (
                    <div className="mdl-panel" style={panelWrap}>
                      {/* two columns, not three: these labels are words, and
                          the Tally set runs to "Biggest position" */}
                      <div style={optGrid(2)}>
                        {(sortView === "items" ? ITEM_SORTS : PKG_SORTS).map(
                          ([val, label], i, arr) => {
                            const cur = sortView === "items" ? itemSort : sortBy;
                            return (
                              <button
                                key={val}
                                onClick={() => {
                                  if (sortView === "items") setItemSort(val);
                                  else setSortBy(val);
                                  setSortOpen(false);
                                }}
                                aria-pressed={cur === val}
                                style={{
                                  ...optCell(cur === val),
                                  ...(arr.length % 2 === 1 &&
                                  i === arr.length - 1
                                    ? { gridColumn: "1 / -1" }
                                    : null),
                                }}
                              >
                                {label}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                  <LedgerRow
                    label="Orders from"
                    sub={`${rangedItems.length} line${rangedItems.length === 1 ? "" : "s"}${
                      hiddenCount > 0 ? ` · ${hiddenCount} outside` : ""
                    }`}
                    value={rangeLabel}
                    expanded={rangeOpen}
                    onClick={() => {
                      setSortOpen(false);
                      setRangeOpen((o) => !o);
                    }}
                  />
                  {rangeOpen && (
                    <div className="mdl-panel" style={panelWrap}>
                      {/* four columns, not three: seven options over three
                          rows cost a row more than the chip set they replaced.
                          Four fits 2 rows, and the last spans the two cells it
                          would otherwise leave showing the grid's rule colour
                          through as a solid slab. */}
                      <div style={optGrid(4)}>
                        {RANGES.map(([val, label], i) => (
                          <button
                            key={String(val)}
                            onClick={() =>
                              setDateFilter((d) => ({ ...d, preset: val }))
                            }
                            aria-pressed={dateFilter.preset === val}
                            style={{
                              ...optCell(dateFilter.preset === val),
                              ...(i === RANGES.length - 1
                                ? { gridColumn: "span 2" }
                                : null),
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {dateFilter.preset === "days" && (
                        <div style={subRow}>
                          <span style={cellLab}>Last</span>
                          <span style={well}>
                            <button
                              onClick={() => bumpDays(-1)}
                              aria-label="Fewer days"
                              style={dayStep}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              inputMode="numeric"
                              value={dateFilter.days ?? ""}
                              onChange={(e) =>
                                setDateFilter((d) => ({
                                  ...d,
                                  days: e.target.value,
                                }))
                              }
                              placeholder="21"
                              aria-label="Number of days"
                              style={numBox}
                            />
                            <button
                              onClick={() => bumpDays(1)}
                              aria-label="More days"
                              style={dayStep}
                            >
                              +
                            </button>
                          </span>
                          <span style={cellLab}>days</span>
                        </div>
                      )}

                      {dateFilter.preset === "custom" && (
                        <>
                          {/* Picked from the orders that exist rather than
                              typed. iOS's numeric keypad has no hyphen key, so
                              a masked YYYY-MM-DD field is uncompletable on the
                              one device this ships to; months need no keyboard
                              at all and cannot produce 2026-02-31. */}
                          <div style={subHead}>
                            <span style={cellLab}>Month</span>
                            <span style={{ flex: 1, height: 1, background: C.line }} />
                          </div>
                          <div
                            style={{ display: "flex", flexWrap: "wrap", gap: 5 }}
                          >
                            {months.map((k) => (
                              <button
                                key={k}
                                onClick={() => pickMonth(k)}
                                aria-pressed={monthKey === k}
                                style={{
                                  ...optCell(monthKey === k),
                                  padding: "0 10px",
                                  border: `1px solid ${
                                    monthKey === k ? C.accent : C.line
                                  }`,
                                }}
                              >
                                {monthLabel(k)}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setExactOpen((o) => !o)}
                            aria-expanded={exactOpen}
                            style={exactToggle}
                          >
                            <span style={{ color: C.accent, width: 10 }}>
                              {exactOpen ? "–" : "+"}
                            </span>
                            Exact dates
                          </button>
                          {exactOpen && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                flexWrap: "wrap",
                              }}
                            >
                              <input
                                type="date"
                                value={dateFilter.from}
                                onChange={(e) =>
                                  setDateFilter((d) => ({
                                    ...d,
                                    from: e.target.value,
                                  }))
                                }
                                style={dateInput}
                                aria-label="From date"
                              />
                              <span style={{ color: C.inkSoft }}>–</span>
                              <input
                                type="date"
                                value={dateFilter.to}
                                onChange={(e) =>
                                  setDateFilter((d) => ({
                                    ...d,
                                    to: e.target.value,
                                  }))
                                }
                                style={dateInput}
                                aria-label="To date"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mdl-lg">Data</div>
            <div className="mdl-lcard">
              {(window.remote || window.sync) && (
                <LedgerRow
                  label="Sync"
                  sub={syncOpen && !syncBroken ? syncSays : syncSays.replace(/ — tap.*$/, "")}
                  value={
                    workerKeySet === false
                      ? "Set up"
                      : !syncBroken
                      ? "On"
                      : syncBroken === "sync-key"
                      ? "Set up"
                      : "Check"
                  }
                  accent={syncBroken ? C.manilaInk : undefined}
                  expanded={syncOpen}
                  onClick={() => {
                    setHistoryOpen(false);
                    setSyncOpen((o) => !o);
                  }}
                />
              )}
              {syncOpen && (window.remote || window.sync) && (
                /* The Sync group holds the server status, the device key paste
                   box and the last sync time, and no GitHub control (owner
                   ruling 2026-10-12). The GitHub mirror still pushes in the
                   background; a conflict there waits for it, with no button. */
                <div
                  className="mdl-panel"
                  style={{ ...panelWrap, display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {photoSync && (
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 10.5,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: C.inkSoft,
                      }}
                    >
                      {photoSync.dir === "push" ? "Sending" : "Fetching"} photos{" "}
                      {photoSync.done}/{photoSync.total}
                    </div>
                  )}
                  {photoMsg && (
                    <div
                      style={{
                        padding: "7px 9px",
                        borderRadius: 8,
                        background: C.manila,
                        color: C.manilaInk,
                        fontFamily: cochin,
                        fontSize: 13.5,
                        lineHeight: 1.35,
                      }}
                    >
                      {photoMsg.text}
                    </div>
                  )}
                  <div style={partGrid}>
                    <span style={partLab}>Server</span>
                    <span style={partVal}>{serverStatus}</span>
                    <span style={partLab}>Last sync</span>
                    <span style={partVal}>{lastSyncText}</span>
                    {window.sync && workerKeySet !== null && (
                      <>
                        <span style={partLab}>Sync key</span>
                        <span
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            minWidth: 0,
                          }}
                        >
                          <input
                            ref={syncKeyInput}
                            type="password"
                            placeholder="paste the sync key"
                            aria-label="Sync key"
                            autoComplete="off"
                            spellCheck={false}
                            autoCapitalize="off"
                            style={keyField}
                          />
                          <button onClick={saveSyncKey} style={keySave}>
                            Save sync key
                          </button>
                          {/* always rendered, on its own line, one line tall: the Save
                              button never moves when text arrives */}
                          <span style={{ ...partVal, flexBasis: "100%", minHeight: 17 }}>
                            {syncKeyMsg}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {(!!window.versions || !!window.remote) && (
                <LedgerRow
                  label="History"
                  value="Saved versions"
                  expanded={historyOpen}
                  onClick={() => {
                    /* closes Sync: both panels are tall, and stacked they push
                       the options off the screen */
                    setSyncOpen(false);
                    setVersionMsg(null);
                    setVersionMsgAt(null);
                    setHistoryOpen((o) => !o);
                  }}
                />
              )}
              {historyOpen && (
                /* The same surface and the same parts as the sort and Sync
                   disclosures: an option grid of actions over a list built from
                   the head cells' label-and-value pair. Nothing here is a
                   rounded box. */
                <div
                  className="mdl-panel"
                  style={{
                    ...panelWrap,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {versionsDown && (
                    <div
                      style={{
                        fontFamily: cochin,
                        fontSize: 13.5,
                        lineHeight: 1.4,
                        padding: "8px 10px",
                        background: C.manila,
                        color: C.manilaInk,
                      }}
                    >
                      {versionsDown}
                    </div>
                  )}
                  {versionList.length === 0 && !versionsDown && (
                    <div style={{ ...partVal, marginTop: 2 }}>
                      No versions saved on this device yet.
                    </div>
                  )}
                  {versionList.map((v) => {
                    const open = openVersion === v.id;
                    const dLines = v.lines - items.length;
                    const dChecked = v.checked - checkedTotal;
                    const delta = (n, word) =>
                      n === 0
                        ? null
                        : `${n > 0 ? "+" : "\u2212"}${Math.abs(n)} ${word}`;
                    const diff = [
                      delta(dLines, "lines"),
                      delta(dChecked, "checked"),
                    ]
                      .filter(Boolean)
                      .join(" \u00b7 ");
                    return (
                      <div key={v.id} style={verRow}>
                        <button
                          onClick={() => setOpenVersion(open ? null : v.id)}
                          aria-expanded={open}
                          style={verHead}
                        >
                          <span style={verWhen}>{versionWhen(v.at)}</span>
                          <span
                            style={{
                              ...cellValText,
                              fontFamily: cochin,
                              fontSize: 14,
                              color: v.kind === "milestone" ? C.ink : C.inkSoft,
                            }}
                          >
                            {v.label}
                          </span>
                          <span style={verFig}>
                            {v.lines}/{v.checked}
                          </span>
                        </button>
                        {open && (
                          <div style={{ marginTop: 8 }}>
                            <div
                              style={{ ...partVal, marginBottom: 8 }}
                            >
                              {v.lines} lines, {v.checked} checked in
                              {diff
                                ? ` \u2014 ${diff} against now`
                                : " \u2014 same as now"}
                              .
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {confirmRestore === v.id && (
                                <button
                                  autoFocus
                                  onClick={disarm}
                                  style={{ ...restoreCell(false), color: C.ink, background: C.card, border: `1px solid ${C.line}` }}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => restoreVersion(v.id)}
                                style={{ ...restoreCell(confirmRestore === v.id), flex: 1 }}
                              >
                                {confirmRestore === v.id
                                  ? `Tap again to replace ${cardsOf(ledgerCards)}`
                                  : "Restore this version"}
                              </button>
                            </div>
                            {versionMsg && versionMsgAt === v.id && versionMsgBox}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(olderVersions || []).map((v) => {
                    const open = openVersion === v.sha;
                    return (
                      <div key={v.sha} style={verRow}>
                        <button
                          onClick={() => setOpenVersion(open ? null : v.sha)}
                          aria-expanded={open}
                          style={verHead}
                        >
                          <span style={verWhen}>{versionWhen(v.at)}</span>
                          <span
                            style={{
                              ...cellValText,
                              fontFamily: cochin,
                              fontSize: 14,
                              color: C.inkSoft,
                            }}
                          >
                            {v.message.split("\n")[0]}
                          </span>
                        </button>
                        {open && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              {confirmRestore === v.sha && (
                                <button
                                  autoFocus
                                  onClick={disarm}
                                  style={{ ...restoreCell(false), color: C.ink, background: C.card, border: `1px solid ${C.line}` }}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => restoreOlder(v.sha)}
                                style={{ ...restoreCell(confirmRestore === v.sha), flex: 1 }}
                              >
                                {confirmRestore === v.sha
                                  ? `Tap again to replace ${cardsOf(ledgerCards)}`
                                  : "Restore this version"}
                              </button>
                            </div>
                            {versionMsg && versionMsgAt === v.sha && versionMsgBox}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {window.remote &&
                    typeof window.remote.listVersions === "function" &&
                    olderVersions === null && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                        <button
                          onClick={loadOlder}
                          disabled={olderBusy}
                          style={linkBtn}
                        >
                          {olderBusy ? "Looking…" : "Load older versions"}
                        </button>
                        {versionMsg && versionMsgAt === "older" && versionMsgBox}
                      </div>
                    )}
                  {olderVersions?.length === 0 && (
                    <div style={partVal}>
                      Nothing older has been backed up yet.
                    </div>
                  )}
                  <div style={partGrid}>
                    <span style={partLab}>Stored</span>
                    <span style={partVal}>
                      {versionList.length} version
                      {versionList.length === 1 ? "" : "s"} ·{" "}
                      {(() => {
                        const kb =
                          versionList.reduce((n, v) => n + (v.bytes || 0), 0) /
                          1024;
                        return kb >= 1024
                          ? `${Math.round(kb / 102.4) / 10} MB`
                          : `${Math.round(kb)} kB`;
                      })()}{" "}
                      on this device
                    </span>
                  </div>
                </div>
              )}
              <LedgerRow
                label="Re-import CSV"
                value="Merges"
                expanded={showUpload || (items.length === 0 && liveEnvelopes.length === 0)}
                onClick={() => setShowUpload((s) => !s)}
              />
              {backupActions.map((a) => (
                <LedgerRow key={a.key} label={a.label} onClick={a.onClick} disabled={a.disabled} />
              ))}
              {versionMsg && !versionMsgAt && (
                <div style={{ padding: "0 16px 12px" }}>{versionMsgBox}</div>
              )}
            </div>

            {(showUpload || (items.length === 0 && liveEnvelopes.length === 0)) && (
              <div style={{ marginTop: 12 }}>
                <UploadZone
                  onFile={handleFile}
                  error={uploadErr}
                  replacing={items.length > 0}
                />
              </div>
            )}

            {/* Reset arms in place, in its own box, last
                (armed-reset-takes-the-row). Cancel sits after it, so the label
                never moves. Cancel takes first focus. It
                shows on an empty ledger too (recovery-control-not-state-gated). */}
            <div className="mdl-lcard mdl-reset" style={{ marginTop: 20 }}>
              <button
                onClick={resetAll}
                className={confirmReset ? "mdl-act armed" : "mdl-act danger"}
              >
                <span>
                  {confirmReset
                    ? `Tap again to clear ${cardsOf(ledgerCards + envelopeCards)}`
                    : "Reset"}
                </span>
              </button>
              {confirmReset && (
                <button autoFocus onClick={disarm} className="mdl-act cancel">
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* On the working screens the zone is up unprompted only on a
            genuinely empty ledger (no items and no pending envelope). The
            Ledger tab holds its own copy under Re-import CSV. */}
        {view !== "ledger" &&
          items.length === 0 &&
          liveEnvelopes.length === 0 && (
          <div style={{ marginBottom: 20 }}>
            <UploadZone
              onFile={handleFile}
              error={uploadErr}
              replacing={items.length > 0}
            />
          </div>
        )}

        {damaged && (
          <Notice>
            Your saved ledger is damaged and was not loaded. Nothing has been
            changed or sent. Open History to restore a saved version, or use
            Backup to keep a copy of what is saved.
          </Notice>
        )}

        {mended && <Notice onDismiss={() => setMended("")}>{mended}</Notice>}

        {importMsg && (
          <Notice onDismiss={() => setImportMsg("")}>{importMsg}</Notice>
        )}

        {view === "mystery" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {composing === "new" ? (
              <EnvelopeComposer
                suggestions={outstandingNames}
                target="new"
                draftRef={composerDraft}
                onSave={saveEnvelope}
                onCancel={() => setComposing(null)}
              />
            ) : (
              <button
                onClick={() => setComposing("new")}
                style={{
                  fontFamily: cochin,
                  fontWeight: 700,
                  fontSize: 15,
                  background: C.ink,
                  color: C.card,
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 20px",
                  cursor: "pointer",
                }}
              >
                + Record an envelope
              </button>
            )}

            {liveEnvelopes.map((env, i) => (
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
                    target={env.id}
                    draftRef={composerDraft}
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
                    photoEpoch={photoEpoch}
                  />
                )}
              </React.Fragment>
            ))}

            {/* the pile emptied out from under it — still needs somewhere to go */}
            {undo && undo.index >= liveEnvelopes.length && (
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

            {liveEnvelopes.length === 0 && composing !== "new" && (
              <div
                style={{
                  textAlign: "center",
                  color: C.inkSoft,
                  fontSize: 14,
                  padding: "28px 8px",
                  lineHeight: 1.5,
                }}
              >
                Nothing waiting: record a package here when you can’t tell who
                sent it.
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
                {photoCount} photo{photoCount === 1 ? "" : "s"}
                {/* ids and blobs are the same number right up until a pull
                    keeps an id whose bytes are still on GitHub, and then
                    "7 photos stored" would be a claim about a device holding
                    none of them */}
                {photosHere != null && photosHere !== photoCount
                  ? ` · ${photosHere} on this device`
                  : " stored"}
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
        {listView && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {view === "items"
            ? visibleItems.map((g) => (
                <ItemTotalRow
                  key={g.name}
                  item={g}
                  received={received}
                  onSet={setCount}
                  onBulk={bulkSet}
                  onOpenOrder={openOrder}
                  stampedGks={stampedGks}
                />
              ))
            : visible.map((pkg) => (
                <PackageCard
                  key={pkg.gk}
                  pkg={pkg}
                  received={received}
                  onSet={setCount}
                  onBulk={bulkSet}
                  hiddenByFilters={pkg.hiddenByFilters}
                  revealed={revealed.has(pkg.gk)}
                  onToggleReveal={toggleReveal}
                  innerRef={pkg.gk === jumpGk ? jumpRef : null}
                  stamp={stamps[pkg.gk]}
                  onStamp={setStamp}
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
                ? "Everything here has been checked in."
                : view === "items"
                ? "No items match that search."
                : "No cards match that search."}
              {query && (
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setQuery("")} style={linkBtn}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {listView && showCanceled && canceledPackages.length > 0 && (
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
