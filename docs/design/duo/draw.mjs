// Draws the iPhone Duo mockups in this folder. Run: node docs/design/duo/draw.mjs
// One set of components and one data set feed every option, so options differ only in what they test.
// Each output page is self-contained: inline CSS and script, no network.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(readFileSync(join(HERE, "../../../shared/tokens.json"), "utf8"));

// Sizes in points. Open and closed: measured on the device (degen WindowSupport.swift).
// Fold 469..482: degen's test fixture (DuoSpreadTests), not measured. Tall: the open size turned.
const OPEN = { w: 951, h: 669 }, CLOSED = { w: 466, h: 678 }, TALL = { w: 669, h: 951 };
const FOLD = { at: 469, w: 13 };
const PAGE = FOLD.at; // each page is 469 pt, close to the closed screen's 466 pt

// ---------- data: the shared fixture's twelve lines, with a mid-mail-day check-in state ----------
const TODAY = Date.UTC(2026, 9, 26);
const PKGS = [
  { id: "B1", seller: "Beta Games", date: "2026-07-29", tracked: false, items: [["Brainstorm", 2, 0.5, 0], ["Counterspell", 1, 2, 0], ["Lightning Bolt", 1, 1, 0]] },
  { id: "C1", seller: "Gamma Cards", date: "2026-06-01", tracked: true, items: [["Lightning Bolt", 1, 1, 0], ["Ponder", 1, 0.75, 0], ["Preordain", 1, 0.75, 0], ["Path to Exile", 1, 3, 1], ["Swords to Plowshares", 1, 4, 1]] },
  { id: "A1", seller: "Alpha Cards", date: "2026-07-01", tracked: false, items: [["Brainstorm", 2, 0.5, 1], ["Lightning Bolt", 1, 1, 1], ["Counterspell", 1, 2, 1]] },
  { id: "D1", seller: "Delta Cards", date: "2026-05-01", tracked: false, items: [["Urza's Saga", 1, 50, 1]] },
];
const money = (n) => "$" + n.toFixed(2);
const days = (d) => Math.round((TODAY - Date.parse(d)) / 864e5);
for (const p of PKGS) {
  p.qty = p.items.reduce((s, i) => s + i[1], 0);
  p.got = p.items.reduce((s, i) => s + i[3], 0);
  p.left = p.qty - p.got;
  p.leftVal = p.items.reduce((s, i) => s + (i[1] - i[3]) * i[2], 0);
  const d = days(p.date);
  p.flag = !p.tracked && p.left ? (d >= 30 ? ["deadline", d] : d >= 14 ? ["maybe", d] : null) : null;
}
const ALL = { qty: 0, got: 0, val: 0, gotVal: 0 };
for (const p of PKGS) for (const [, q, pr, g] of p.items) { ALL.qty += q; ALL.got += g; ALL.val += q * pr; ALL.gotVal += g * pr; }
const OPEN_PKGS = PKGS.filter((p) => p.left); // Showing: Unreceived hides a finished package
const TALLY = (() => {
  const m = new Map();
  for (const p of PKGS) for (const [n, q, pr, g] of p.items) {
    const t = m.get(n) || { name: n, qty: 0, got: 0, val: 0, copies: [] };
    t.qty += q; t.got += g; t.val += q * pr; t.copies.push({ p, q, pr, g });
    m.set(n, t);
  }
  return [...m.values()].map((t) => ({ ...t, left: t.qty - t.got, leftVal: t.copies.reduce((s, c) => s + (c.q - c.g) * c.pr, 0) }))
    .sort((a, b) => b.left - a.left || b.leftVal - a.leftVal);
})();
const byName = (n) => TALLY.find((t) => t.name === n);
const pkg = (id) => PKGS.find((p) => p.id === id);

// ---------- components ----------
const ICON = {
  ledger: '<circle cx="11" cy="11" r="3"/><path d="M11 2.5v2.6M11 16.9v2.6M2.5 11h2.6M16.9 11h2.6M5 5l1.8 1.8M15.2 15.2 17 17M5 17l1.8-1.8M15.2 6.8 17 5"/>',
  orphaned: '<rect x="2.5" y="5" width="17" height="12" rx="1.5"/><path d="m3 6 8 6 8-6"/>',
  tally: '<path d="M5 4v14M9 4v14M13 4v14M17 4v14M3 15 19 7"/>',
  packages: '<path d="M3 7.5 11 3l8 4.5v8L11 20l-8-4.5z"/><path d="M3 7.5 11 12l8-4.5M11 12v8"/>',
};
const icon = (k) => `<svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

function tabbar(active, cls = "", tabs = ["ledger", "orphaned", "tally", "packages"], style = "") {
  return `<nav class="tabbar ${cls}" aria-label="Views"${style ? ` style="${style}"` : ""}>${tabs.map((k) =>
    `<span class="tab${k === active ? " on" : ""}">${icon(k)}<b>${k}</b>${k === "orphaned" ? '<i class="badge">2</i>' : ""}</span>`).join("")}</nav>`;
}
const find = (cls = "") => `<div class="find ${cls}"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>Find card, set, seller, order</div>`;

function masthead(foot = `${OPEN_PKGS.length + 1} packages · autosaves`) {
  const pk = PKGS.filter((p) => !p.left).length;
  return `<header class="mh"><div class="seal-row"><i></i><span class="seal"></span><i></i></div>
<div class="mh-title">MANIFEST</div><div class="mh-house">C.H POSTAL COMPANY</div>
<div class="tallies"><div><span>CARDS</span><b><em>${ALL.got}</em>/${ALL.qty}</b></div><div><span>PACKAGES</span><b><em>${pk}</em>/${PKGS.length}</b></div><div><span>VALUE</span><b><em>$${Math.round(ALL.gotVal)}</em>/$${Math.round(ALL.val)}</b></div></div>
<div class="pbar"><i style="width:${(100 * ALL.got / ALL.qty).toFixed(1)}%"></i></div>
<div class="mh-foot"><span>${foot}</span><span class="miss">${ALL.qty - ALL.got} still missing · ${money(ALL.val - ALL.gotVal)}</span></div></header>`;
}

const flagText = (p) => p.flag ? `<span class="${p.flag[0] === "deadline" ? "red" : "amber"}">⚠ ${p.flag[1]}d — ${p.flag[0] === "deadline" ? "refund window closing, contact seller" : "may be lost"} · </span>` : "";
const box = (got) => `<span class="cb${got ? " on" : ""}">${got ? '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3.5 8.5 3 3 6-7"/></svg>' : ""}</span>`;

function itemRow([name, q, pr, g]) {
  return `<div class="row${g >= q ? " done" : ""}">${box(g >= q)}<div class="rmain"><div class="rname">${name}</div><div class="rmeta">${q > 1 ? `×${q} · ` : ""}Test Set · Near Mint</div>${q > 1 ? `<div class="step"><i>−</i><b>${g}/${q}</b><i>+</i></div>` : ""}</div><span class="price">${money(pr)}</span></div>`;
}
// The package card as the phone draws it. `all` shows received rows too (a reveal ignores hide-received).
function card(p, { open = true, all = false, sel = false } = {}) {
  const rows = p.items.filter((i) => all || i[3] < i[1]);
  return `<section class="card${sel ? " sel" : ""}${p.left ? "" : " gilt"}"><div class="chead"><span class="chev">${open ? "▾" : "▸"}</span><div class="cwho"><div class="seller">${p.seller}</div><div class="cmeta">${flagText(p)}${p.tracked ? "tracked" : "○ untracked"}</div></div>${p.left ? `<span class="chip">${p.left} left · ${money(p.leftVal)}</span>` : '<span class="stamp">RECEIVED</span>'}</div>
${open ? `<div class="oid"><u>${p.id}</u> · ${p.date}</div><div class="acts"><span class="btn">Stamp</span><span class="btn">Mark all received</span></div>${rows.map(itemRow).join("")}` : ""}</section>`;
}
// A one-line package index row: a new component, drawn only where an option needs it.
function idxRow(p, sel) {
  return `<div class="idx${sel ? " sel" : ""}"><div class="iwho"><b>${p.seller}</b><small>${flagText(p) || ""}${p.id} · ${p.date}</small></div><span class="chip">${p.left} left · ${money(p.leftVal)}</span><i class="ibar"><i style="width:${(100 * p.got / p.qty).toFixed(0)}%"></i></i></div>`;
}
function tallyRow(t, { sel = false } = {}) {
  const sellers = new Set(t.copies.map((c) => c.p.seller)).size;
  return `<div class="trow${sel ? " sel" : ""}"><span class="chev">${sel ? "▾" : "▸"}</span><div class="twho"><b>${t.name}</b><small>${sellers} seller${sellers > 1 ? "s" : ""} · ${t.copies.length} order${t.copies.length > 1 ? "s" : ""} · Test Set</small></div><div class="tfig"><b>${t.got}/${t.qty}</b><small>${money(t.val / t.qty)} / copy</small>${t.left ? `<small class="red">${t.left} left · ${money(t.leftVal)}</small>` : ""}</div></div>`;
}
function tallyCopies(t) {
  return `<section class="card"><div class="chead"><div class="cwho"><div class="seller">${t.name}</div><div class="cmeta">${money(t.val)} across ${t.qty} copies · ${money(t.val / t.qty)} avg</div></div><span class="chip">${t.left} left · ${money(t.leftVal)}</span></div>
${t.copies.map((c) => `<div class="row${c.g >= c.q ? " done" : ""}">${box(c.g >= c.q)}<div class="rmain"><div class="rname">${c.p.seller}</div><div class="rmeta">${flagText(c.p)}${c.p.date} · Test Set · <u>${c.p.id}</u></div></div><span class="price">${money(c.pr)}</span></div>`).join("")}</section>`;
}
const ENVS = [
  { when: "2026-10-24", entries: [["Brainstorm", 2], ["Counterspell", 1]], note: "plain white envelope, no return address", cands: [["B1", "3 of 3 cards · 1 more still owed"], ["A1", "1 of 3 cards · whole package"]] },
  { when: "2026-10-25", entries: [["Ponder", 1], ["Preordain", 1]], note: "", cands: [["C1", "2 of 2 cards · 1 more still owed"]] },
];
function envelope(e, { cands = true, sel = false } = {}) {
  const n = e.entries.reduce((s, x) => s + x[1], 0);
  return `<section class="card env${sel ? " sel" : ""}"><div class="ehead"><span>Envelope · ${e.when} · ${n} cards</span><span class="mini">Edit</span><span class="mini redt">Discard</span></div>
<div class="ebody">${e.entries.map(([nm, q]) => `<div>${q > 1 ? `×${q} ` : ""}${nm}</div>`).join("")}${e.note ? `<div class="enote">${e.note}</div>` : ""}</div>
${cands ? candidates(e) : ""}</section>`;
}
function candidates(e, big = false) {
  return `<div class="cands${big ? " big" : ""}"><div class="klabel">Could have come from</div>${e.cands.map(([id, txt]) => {
    const p = pkg(id);
    return `<div class="cand"><div><b>${p.seller}</b><small>${p.date} · ${p.tracked ? "" : "○ untracked · "}${p.id}</small><small class="${txt.includes("nothing") ? "green" : ""}">${txt}</small></div><span class="mini">This one</span></div>`;
  }).join("")}</div>`;
}
const composer = `<section class="card comp"><div class="klabel">New envelope</div><div class="field">Type a card name…</div>
<div class="sugs">${OPEN_PKGS.flatMap((p) => p.items.filter((i) => i[3] < i[1]).map((i) => i[0])).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map((n) => `<span class="sug">${n}</span>`).join("")}</div>
<div class="field soft">Note (optional) — tracking #, sender, mailer type…</div><div class="acts"><span class="btn">Add photo</span><span class="btn">Cancel</span><span class="btn ink">Save envelope</span></div></section>`;
const recordBtn = `<div class="record">+ Record an envelope</div>`;

function ledgerGroups({ panel = null } = {}) {
  const cell = (k, v, sub = "", on = false) => `<div class="cell${on ? " sel" : ""}"><div><span class="ck">${k}</span>${sub ? `<small>${sub}</small>` : ""}</div>${v ? `<span class="cv">${v}</span>` : ""}</div>`;
  const view = `<div class="klabel">View</div><div class="group">${cell("Showing", "● Unreceived")}${cell("Sorted by", "Most missing ›")}${cell("Orders from", "All time ›", "12 lines")}</div>`;
  const data = `<div class="klabel">Data</div><div class="group">${cell("Sync", "Set up ›", "This device has no sync key", panel === "sync")}${cell("History", "Saved versions ›")}${cell("Backup", "")}</div><div class="reset">Reset</div>`;
  return { view, data };
}
// Native rows only: CSV import and the key paste field are web-only (decision native-parity-table).
const syncPanel = `<section class="card panel"><div class="klabel">Sync</div><div class="pairs"><span>Server</span><b>not set up</b><span>Last sync</span><b>never</b><span>Key</span><b>none on this device</b></div><p class="hint">Open the key link on this phone to add the key.</p></section>`;

// ---------- frames ----------
const status = (l = "21:19", r = "●●● 84%") => `<div class="status"><span>${l}</span><span>${r}</span></div>`;
const foldV = `<div class="fold v" style="left:${FOLD.at}px;width:${FOLD.w}px"></div>`;
const foldH = `<div class="fold h" style="top:${FOLD.at}px;height:${FOLD.w}px"></div>`;
// An open Duo, flat: two pages side by side. `bar` holds the tab bar, drawn once at spread level.
function spread(left, right, { bar = tabbar("packages", "under-l"), extra = "" } = {}) {
  return `<div class="dev open"><div class="page l">${status("21:19", "")}<div class="body">${left}</div></div>${foldV}<div class="page r">${status("", "●●● 84%")}<div class="body">${right}</div></div>${bar}${extra}</div>`;
}
const single = (content, bar, cls = "closed") => `<div class="dev ${cls}"><div class="page all">${status()}<div class="body">${content}</div></div>${bar}</div>`;
function stacked(top, bottom, { bar = tabbar("packages", "full"), pose = "tall", extra = "" } = {}) {
  return `<div class="dev tall ${pose}"><div class="page t">${status()}<div class="body">${top}</div></div>${foldH}<div class="page b"><div class="body">${bottom}</div></div>${bar}${extra}</div>`;
}

// ---------- page shell ----------
const CSS = `
:root{${Object.entries(T).map(([k, v]) => `--${k}:${v};`).join("")}
--serif:Cochin,'Hoefler Text',Palatino,Georgia,serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sys:-apple-system,system-ui,sans-serif;color-scheme:light}
*{box-sizing:border-box}
html,body{margin:0}
body{background:#E7DECD;color:var(--ink);font-family:var(--sys);-webkit-text-size-adjust:100%}
.top{position:sticky;top:0;z-index:9;background:color-mix(in srgb,#E7DECD 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;flex-direction:column;gap:8px}
.top h1{margin:0;font:600 18px var(--sys)}
.top p{margin:0;font-size:13px;color:var(--inkSoft);max-width:72ch}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips button,.hide{font:600 12px var(--sys);min-height:36px;padding:0 12px;border-radius:18px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.chips button[aria-pressed=false]{opacity:.5;text-decoration:line-through}
main{display:flex;flex-direction:column;gap:32px;padding:16px;max-width:1040px;margin-inline:auto}
.opt{display:flex;flex-direction:column;gap:8px}
.opt[hidden]{display:none}
.ohead{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}
.ohead h2{margin:0;font:600 16px var(--sys);flex:1 1 20rem}
.var{margin:0;font-size:13px;color:var(--accent)}
.gl{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:8px;font-size:13px}
.gl p{margin:0;padding:8px 12px;border-radius:8px;background:var(--card);border:1px solid var(--line)}
.gl b{font-weight:600}
.fit{overflow:hidden;padding:12px}
.cap{font-size:12px;color:var(--inkSoft);margin:0}
a{color:var(--accent)}
/* the device */
.dev{position:relative;background:var(--paper);border-radius:32px;box-shadow:0 0 0 10px #22202a,0 16px 40px rgba(0,0,0,.25);overflow:hidden;font-family:var(--serif);margin:10px}
.dev.open{width:${OPEN.w}px;height:${OPEN.h}px}.dev.closed{width:${CLOSED.w}px;height:${CLOSED.h}px}.dev.tall{width:${TALL.w}px;height:${TALL.h}px}
.page{position:absolute;overflow:hidden}
.page.l{left:0;top:0;bottom:0;width:${PAGE}px}.page.r{left:${FOLD.at + FOLD.w}px;top:0;bottom:0;width:${OPEN.w - FOLD.at - FOLD.w}px}
.page.all{inset:0}.page.t{left:0;right:0;top:0;height:${FOLD.at}px}.page.b{left:0;right:0;top:${FOLD.at + FOLD.w}px;bottom:0}
.fold{position:absolute;z-index:4;background:repeating-linear-gradient(45deg,rgba(51,46,63,.10) 0 2px,transparent 2px 6px)}
.fold.v{top:0;bottom:0;border-inline:1px dashed rgba(111,92,166,.55)}
.fold.h{left:0;right:0;border-block:1px dashed rgba(111,92,166,.55)}
.status{height:44px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 28px 6px;font:600 13px var(--sys)}
.body{position:absolute;top:44px;left:0;right:0;bottom:0;padding:8px 16px 0;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.page.b .body{top:0;padding-top:12px}
/* masthead */
.mh{display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:4px}
.seal-row{display:flex;align-items:center;gap:12px;width:100%;justify-content:center}
.seal-row i{height:1px;background:var(--gold);flex:0 1 104px}
.seal{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 40% 35%,var(--waxLit),var(--wax) 55%,var(--waxDeep));box-shadow:inset 0 0 0 4px rgba(94,31,26,.35)}
.mh-title{font:400 32px var(--serif);letter-spacing:.2em;padding-left:.2em}
.mh-house{font:10px var(--mono);letter-spacing:.26em;color:var(--inkSoft)}
.tallies{display:grid;grid-template-columns:1fr 1.15fr 1.2fr;width:100%;border-top:1px solid var(--line);margin-top:4px;padding-top:8px}
.tallies div{display:flex;flex-direction:column;align-items:center;gap:2px}
.tallies div+div{border-left:1px solid var(--line)}
.tallies span{font:10px var(--mono);letter-spacing:.16em;color:var(--inkSoft)}
.tallies b{font:600 13px var(--mono);color:var(--inkSoft)}.tallies em{font-style:normal;color:var(--accent)}
.pbar{width:100%;height:6px;border-radius:3px;background:var(--silver);overflow:hidden;margin-top:4px}.pbar i{display:block;height:100%;background:var(--accent)}
.mh-foot{width:100%;display:flex;justify-content:space-between;font:10.5px var(--mono);color:var(--inkSoft)}.miss{color:var(--red);font-weight:700}
/* cards */
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;flex-shrink:0;box-shadow:0 1px 2px var(--shadow)}
.card.sel{outline:2px solid var(--accent);outline-offset:-1px}
.card.gilt{border-color:var(--gold);box-shadow:inset 0 0 0 1px var(--gold)}
.chead{display:flex;align-items:flex-start;gap:8px;padding:12px}
.chev{font:11px var(--mono);color:var(--inkSoft);width:12px;padding-top:4px}
.cwho{flex:1;min-width:0}
.seller{font:700 16px var(--serif)}
.cmeta{font:11px var(--mono);color:var(--inkSoft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.red{color:var(--red);font-weight:700}.amber{color:var(--amber);font-weight:700}.green{color:var(--green);font-weight:700}
.chip{font:700 11px var(--mono);color:var(--red);background:var(--redSoft);border-radius:999px;padding:4px 8px;white-space:nowrap}
.stamp{font:700 11px var(--mono);letter-spacing:.16em;color:var(--green);border:2px solid var(--green);border-radius:4px;padding:2px 8px;transform:rotate(-4deg)}
.oid{font:11px var(--mono);color:var(--inkSoft);padding:0 12px 8px 32px}.oid u{color:var(--ink)}
.acts{display:flex;justify-content:space-between;gap:8px;padding:0 12px 12px}
.btn{font:12px var(--mono);border:1px solid var(--line);border-radius:6px;padding:0 12px;min-height:44px;display:inline-flex;align-items:center;background:var(--card)}
.btn.ink{background:var(--ink);color:var(--card);border-color:var(--ink)}
.row{display:flex;gap:12px;align-items:flex-start;padding:12px;border-top:1px solid var(--line)}
.cb{flex:0 0 24px;height:24px;border:2px solid var(--inkSoft);border-radius:6px;display:grid;place-items:center;color:var(--card)}
.cb.on{background:var(--green);border-color:var(--green)}
.rmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.rname{font:600 15px var(--serif)}.row.done .rname{color:var(--inkSoft)}
.rmeta{font:11px var(--serif);color:var(--inkSoft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rmeta u{font-family:var(--mono);color:var(--ink)}
.price{font:13px var(--mono)}
.step{display:flex;align-items:center;gap:8px;margin-top:4px}.step i{font-style:normal;width:36px;height:32px;border:1px solid var(--line);border-radius:6px;display:grid;place-items:center}.step b{font:600 13px var(--mono)}
/* index rows (new) */
.idx{display:grid;grid-template-columns:1fr auto;gap:4px 8px;padding:8px 12px;min-height:56px;background:var(--card);border:1px solid var(--line);border-radius:8px;flex-shrink:0}
.idx.sel{outline:2px solid var(--accent);outline-offset:-1px}
.iwho{display:flex;flex-direction:column;min-width:0}.iwho b{font:700 15px var(--serif)}.iwho small{font:10.5px var(--mono);color:var(--inkSoft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.idx .chip{align-self:start}
.ibar{grid-column:1/-1;height:3px;background:var(--silver);border-radius:2px;overflow:hidden}.ibar i{display:block;height:100%;background:var(--accent)}
/* tally */
.trow{display:flex;gap:8px;align-items:flex-start;padding:12px;background:var(--card);border:1px solid var(--line);border-radius:8px;flex-shrink:0}
.trow.sel{outline:2px solid var(--accent);outline-offset:-1px}
.twho{flex:1;min-width:0;display:flex;flex-direction:column}.twho b{font:600 16px var(--serif)}.twho small{font:11px var(--mono);color:var(--inkSoft)}
.tfig{display:flex;flex-direction:column;align-items:flex-end}.tfig b{font:700 15px var(--mono)}.tfig small{font:11px var(--mono);color:var(--inkSoft)}.tfig small.red{color:var(--red);font-family:var(--serif)}
/* orphaned */
.record{background:var(--ink);color:var(--card);border-radius:8px;min-height:44px;display:grid;place-items:center;font:700 15px var(--serif);flex-shrink:0}
.ehead{display:flex;gap:8px;align-items:center;padding:12px;font:10.5px var(--mono);letter-spacing:.06em;color:var(--inkSoft)}.ehead span:first-child{flex:1}
.mini{font:11px var(--mono);border:1px solid var(--line);border-radius:6px;padding:4px 8px;background:var(--card);color:var(--ink);white-space:nowrap}.mini.redt{color:var(--red);border-color:var(--redSoft)}
.ebody{padding:0 12px 8px;font-size:13.5px;display:flex;flex-direction:column;gap:2px}.enote{font:11px var(--mono);color:var(--inkSoft);margin-top:4px}
.cands{border-top:1px solid var(--line);padding:8px 12px 12px;display:flex;flex-direction:column;gap:8px}
.klabel{font:10.5px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--inkSoft)}
.cand{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;padding:8px}.cand>div{flex:1;display:flex;flex-direction:column}.cand b{font:700 14px var(--serif)}.cand small{font:11px var(--mono);color:var(--inkSoft)}.cand small.green{color:var(--green)}
.cands.big .cand{padding:12px}.cands.big .cand b{font-size:16px}.cands.big .mini{min-height:44px;display:inline-flex;align-items:center;padding:0 12px}
.comp{padding:12px;display:flex;flex-direction:column;gap:8px}.comp .acts{padding:0;justify-content:flex-end}
.field{border:1px solid var(--accent);border-radius:8px;min-height:44px;display:flex;align-items:center;padding:0 12px;font:16px var(--serif);color:var(--inkSoft);background:var(--card)}.field.soft{border-color:var(--line);font-size:14px}
.sugs{display:flex;flex-wrap:wrap;gap:8px}.sug{font:13px var(--serif);border:1px solid var(--line);border-radius:999px;padding:0 12px;min-height:36px;display:inline-flex;align-items:center;background:var(--paper)}
.empty{font-size:14px;color:var(--inkSoft);text-align:center;padding:24px 16px}
/* ledger */
.ltitle{font:12px var(--mono);letter-spacing:.3em;text-align:center;color:var(--inkSoft);padding-top:8px}
.group{background:var(--card);border:1px solid var(--line);border-radius:8px;flex-shrink:0}
.cell{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:52px;padding:8px 16px}.cell+.cell{border-top:1px solid var(--line)}
.cell.sel{background:color-mix(in srgb,var(--accent) 8%,var(--card))}
.cell>div{display:flex;flex-direction:column}.ck{font:18px var(--serif)}.cell small{font:11px var(--serif);color:var(--inkSoft)}.cv{font:13px var(--mono);color:var(--accent);white-space:nowrap}
.reset{border:1px solid var(--red);color:var(--red);border-radius:8px;min-height:52px;display:flex;align-items:center;padding:0 16px;font:18px var(--serif);flex-shrink:0}
.panel{padding:12px;display:flex;flex-direction:column;gap:12px}.pairs{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font:13px var(--mono)}.pairs span{color:var(--inkSoft)}.hint{margin:0;font-size:13px;color:var(--inkSoft)}
.spanrow .cell{min-height:56px}
/* chrome */
.tabbar{position:absolute;z-index:6;bottom:32px;height:64px;display:flex;align-items:stretch;padding:4px;gap:4px;border-radius:32px;border:1px solid var(--line);background:color-mix(in srgb,var(--paper) 62%,transparent);backdrop-filter:blur(14px) saturate(1.4);box-shadow:0 6px 18px var(--shadow)}
.tabbar.under-l{left:24px;width:${PAGE - 48}px}
.tabbar.full{left:24px;right:24px;margin-inline:auto;max-width:480px}
.tabbar.across{left:50%;transform:translateX(-50%);width:420px}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:28px;color:var(--ink);position:relative;min-width:44px}
.tab b{font:600 10px var(--mono);letter-spacing:.08em;text-transform:uppercase}
.tab.on{background:color-mix(in srgb,var(--card) 90%,transparent);color:var(--accent);box-shadow:0 0 0 1px var(--line)}
.badge{position:absolute;top:6px;right:calc(50% - 22px);font:700 9px var(--mono);font-style:normal;background:var(--red);color:var(--card);border-radius:8px;padding:1px 4px}
.find{position:absolute;z-index:6;height:48px;bottom:104px;border-radius:24px;border:1px solid var(--line);background:var(--card);display:flex;align-items:center;gap:8px;padding:0 16px;font:16px var(--serif);color:var(--inkSoft);box-shadow:0 4px 12px var(--shadow)}
.find.on-l{left:24px;width:${PAGE - 48}px}.find.on-r{left:${FOLD.at + FOLD.w + 24}px;width:${PAGE - 48}px}.find.full{left:24px;right:24px;max-width:480px;margin-inline:auto}
.find.top-r{bottom:auto;top:52px;left:${FOLD.at + FOLD.w + 24}px;width:${PAGE - 48}px}
.split-bar{position:absolute;z-index:6;bottom:32px;height:64px}
.note{position:absolute;z-index:7;font:600 11px var(--sys);background:var(--accent);color:#fff;border-radius:6px;padding:4px 8px}
.kbd{position:absolute;z-index:8;left:0;right:0;bottom:0;height:300px;background:#cfd3da;display:grid;place-items:center;font:600 13px var(--sys);color:#555;border-top:1px solid #aaa}
.dim{opacity:.35}
.spacer{flex:1}
`;

const SCRIPT = `
(function(){
  var opts=[].slice.call(document.querySelectorAll('.opt'));
  var chips=document.querySelector('.chips');
  function apply(){
    var m=/(?:^|[#&])s=([a-z0-9,-]+)/.exec(location.hash);
    var want=m&&m[1]!=='all'?m[1].split(','):null;
    opts.forEach(function(o){o.hidden=!!want&&want.indexOf(o.id)<0;});
    sync();fit();
  }
  function sync(){[].forEach.call(chips.querySelectorAll('button[data-o]'),function(b){b.setAttribute('aria-pressed',String(!document.getElementById(b.dataset.o).hidden));});}
  function setHash(){var shown=opts.filter(function(o){return !o.hidden;}).map(function(o){return o.id;});history.replaceState(null,'',shown.length===opts.length?'#s=all':'#s='+shown.join(','));}
  opts.forEach(function(o){
    var b=document.createElement('button');b.type='button';b.dataset.o=o.id;b.textContent=o.dataset.short;
    b.onclick=function(){o.hidden=!o.hidden;sync();setHash();fit();};chips.appendChild(b);
    o.querySelector('.hide').onclick=function(){o.hidden=true;sync();setHash();};
  });
  var all=document.createElement('button');all.type='button';all.textContent='Show all';all.onclick=function(){location.hash='s=all';};chips.appendChild(all);
  function fit(){[].forEach.call(document.querySelectorAll('.fit'),function(f){var d=f.firstElementChild;d.style.zoom=1;var w=d.offsetWidth+20;d.style.zoom=Math.min(1,(f.clientWidth-24)/w);});}
  addEventListener('hashchange',apply);addEventListener('resize',fit);apply();
})();`;

function page(file, title, intro, options) {
  const body = options.map((o) => `<section class="opt" id="${o.id}" data-short="${o.id.toUpperCase()} · ${o.short}">
<div class="ohead"><h2>${o.id.toUpperCase()} · ${o.title}</h2><button type="button" class="hide">Hide ${o.id.toUpperCase()}</button></div>
<p class="var">Tests: ${o.tests}</p>
<div class="gl"><p><b>Gain.</b> ${o.gain}</p><p><b>Loss.</b> ${o.loss}</p></div>
<div class="fit">${o.frame}</div>${o.cap ? `<p class="cap">${o.cap}</p>` : ""}</section>`).join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>${CSS}</style></head><body>
<div class="top"><h1>${title}</h1><p>${intro}</p><p>Light theme only: the repo ships one palette. Deep links: <code>#s=a</code>, <code>#s=b,c</code>, <code>#s=all</code>. <a href="index.html">All Duo mockups</a>.</p><div class="chips" aria-label="Options"></div></div>
<main>${body}</main><script>${SCRIPT}</script></body></html>`;
  writeFileSync(join(HERE, file), html);
}

const SIZE = `Open, flat: ${OPEN.w}×${OPEN.h} pt, two pages of ${PAGE} pt. The hatched band is the fold, ${FOLD.w} pt at x ${FOLD.at} (degen test value, unmeasured).`;
const B = OPEN_PKGS[0], G = OPEN_PKGS[1], A = OPEN_PKGS[2];

// ---------- Packages ----------
page("packages.html", "Duo · Packages", `${SIZE} Held constant: data, scale, the tab bar under the left page, and Find over the page whose list it filters. Only the page split changes.`, [
  { id: "a", short: "index + package", title: "Index left, open package right", tests: "a list of packages on one page, one package on the other.",
    gain: "The open package never scrolls away while you check its cards. A tap on the left changes only the right page, with no Back step.",
    loss: "A new one-line index row that the phone does not have. The masthead and the index share one page, so fewer packages show.",
    frame: spread(masthead() + OPEN_PKGS.map((p, i) => idxRow(p, i === 0)).join(""), card(B, { all: true }), { extra: find("on-l") }) },
  { id: "b", short: "two columns", title: "Two columns of cards, each card keeps its column", tests: "the phone list drawn twice as wide, as two fixed columns.",
    gain: "No new component: each column is today's phone list. The most open cards on screen at once.",
    loss: "Reading order crosses the fold. One scroll moves both pages. An open card pushes only its own column, so the columns go uneven.",
    frame: spread(masthead() + card(B), card(G) + card(A), { extra: find("on-l") }),
    cap: "Cards go left, right, left in sort order. A card never moves to the other column, so opening one moves nothing on the other page." },
  { id: "c", short: "masthead page", title: "Masthead left, package list right", tests: "the masthead pinned on its own page.",
    gain: "The tallies and the still-missing figure stay in view on every check-in. The right page is exactly the phone list.",
    loss: "About 300 pt of the left page stays empty. Fewer cards show than in B.",
    frame: spread(masthead() + '<div class="spacer"></div>', card(B) + card(G), { extra: find("on-r") }) },
]);

// ---------- Tally ----------
const LB = byName("Lightning Bolt");
page("tally.html", "Duo · Tally", `${SIZE} Held constant: data, scale, the tab bar under the left page, and Find over the Tally list. Only the page split changes.`, [
  { id: "a", short: "rows + copies", title: "Tally rows left, the open row's copies right", tests: "a row's expansion moved to the other page.",
    gain: "\"Did all four arrive\" reads on one page, with every copy and its check box. Rows below never move when a row opens.",
    loss: "The right page needs a default before the first tap: the top row. Drawn after a tap on Lightning Bolt.",
    frame: spread(masthead(`${TALLY.length} unique items · autosaves`) + TALLY.slice(0, 4).map((t, i) => tallyRow(t, { sel: i === 1 })).join(""), tallyCopies(LB), { bar: tabbar("tally", "under-l"), extra: find("on-l") }) },
  { id: "b", short: "Tally + package", title: "Tally left, the tapped copy's whole package right", tests: "the right page shows the package, not the copy list.",
    gain: "Mail-day flow: find a card in Tally, then check the rest of that envelope on the right. No view switch.",
    loss: "Two views at once. An order id tap on the phone goes to Packages; here it fills the right page instead.",
    frame: spread(masthead(`${TALLY.length} unique items · autosaves`) + tallyRow(LB, { sel: true }) + tallyCopies(LB) + tallyRow(TALLY[0]), card(B, { all: true }), { bar: tabbar("tally", "under-l"), extra: find("on-l") }),
    cap: "Left: the phone's Tally with Lightning Bolt open. Right: Beta Games, the package of the copy last tapped." },
  { id: "c", short: "masthead page", title: "Masthead left, Tally list right", tests: "the masthead pinned on its own page, as Packages C.",
    gain: "Same page roles as Packages C, so the two views feel like one book.",
    loss: "The left page is mostly empty. An open row still pushes rows below it on the right page.",
    frame: spread(masthead(`${TALLY.length} unique items · autosaves`), TALLY.slice(0, 6).map((t) => tallyRow(t)).join(""), { bar: tabbar("tally", "under-l"), extra: find("on-r") }) },
]);

// ---------- Orphaned ----------
page("orphaned.html", "Duo · Orphaned", `${SIZE} Held constant: two saved envelopes, scale, the tab bar under the left page. Find does not show on Orphaned. No keyboard drawn: its span on the open Duo is unmeasured.`, [
  { id: "a", short: "pile + composer", title: "Envelope pile left, composer right", tests: "the composer gets its own page.",
    gain: "Recording never hides the pile, so you see what you logged yesterday. The draft stays open beside it.",
    loss: "The keyboard may span both pages and cover the pile's lower half. Unmeasured.",
    frame: spread(masthead(`${ENVS.length} envelopes waiting · autosaves`) + recordBtn + envelope(ENVS[0], { cands: false }) + envelope(ENVS[1], { cands: false }), composer, { bar: tabbar("orphaned", "under-l") }) },
  { id: "b", short: "envelope + candidates", title: "Envelope left, its candidates right", tests: "candidates move off the envelope card to the other page.",
    gain: "Envelope cards stay short, so more fit. The candidates get room for full package names and a 44 pt This one target.",
    loss: "The composer must open over the left page. One more tap to see an envelope's candidates.",
    frame: spread(masthead(`${ENVS.length} envelopes waiting · autosaves`) + recordBtn + envelope(ENVS[0], { cands: false, sel: true }) + envelope(ENVS[1], { cands: false }), `<div class="klabel" style="padding-top:8px">Envelope · ${ENVS[0].when}</div>` + candidates(ENVS[0], true).replace('class="cands big"', 'class="cands big card"') , { bar: tabbar("orphaned", "under-l") }) },
  { id: "c", short: "Orphaned + Packages", title: "Orphaned left, Packages right", tests: "the right page is the Packages list, filtered to the candidates. The left envelope keeps its candidates, unlike A and B.",
    gain: "You see each candidate's whole package before you pick it, with its other cards.",
    loss: "A second home for candidate ranking in the Packages list. Tie notes and \"explains all\" do not fit a package card.",
    frame: spread(masthead(`${ENVS.length} envelopes waiting · autosaves`) + recordBtn + envelope(ENVS[0], { sel: true }), card(B) + card(A, { all: true }), { bar: tabbar("orphaned", "under-l") }) },
]);

// ---------- Ledger ----------
const LG = ledgerGroups(), LGs = ledgerGroups({ panel: "sync" });
page("ledger.html", "Duo · Ledger", `${SIZE} Held constant: the same rows, scale and tab bar. Only where the groups and panels sit changes.`, [
  { id: "a", short: "one page", title: "Ledger on the left page, right page keeps the last working view", tests: "the Ledger stays a phone page.",
    gain: "No new layout. The working view stays visible, so a filter change shows its effect at once.",
    loss: "Sync and History still open inline and push the rows below them.",
    frame: spread(masthead() + '<div class="ltitle">LEDGER</div>' + LG.view + LG.data, card(B), { bar: tabbar("ledger", "under-l") }),
    cap: "The right page is Packages, dimmed by nothing: it stays live while the Ledger is open." },
  { id: "b", short: "groups + panel", title: "Groups left, the open panel right", tests: "a disclosure panel opens on the other page.",
    gain: "A panel never pushes the list. History and Sync already close each other, so they share one right page.",
    loss: "The right page is empty until a row opens. The default shows Sync.",
    frame: spread(masthead() + '<div class="ltitle">LEDGER</div>' + LGs.view + LGs.data, syncPanel, { bar: tabbar("ledger", "under-l") }) },
  { id: "c", short: "View | Data", title: "View group left, Data group right", tests: "the two groups split across the fold.",
    gain: "Every option shows at one glance, with no scroll.",
    loss: "Panels still need a place to open. Reset sits on the right page, far from the bar.",
    frame: spread(masthead() + '<div class="ltitle">LEDGER</div>' + LG.view, '<div class="ltitle">&nbsp;</div>' + LG.data, { bar: tabbar("ledger", "under-l") }) },
]);

// ---------- Closed ----------
page("closed.html", "Duo · Closed", `Closed: the outer screen, ${CLOSED.w}×${CLOSED.h} pt, measured on the device. One page and the phone's bottom bar. The open state before the close is Packages A, Beta Games open.`, [
  { id: "a", short: "keeps right", title: "Closing keeps the right page", tests: "the open package fills the outer screen.",
    gain: "Degen's rule: what you looked at stays. The card you were checking is still under your thumb.",
    loss: "You land inside one package. Back to the list is one more tap.",
    frame: `<div style="display:flex;gap:32px;align-items:center;flex-wrap:wrap">${single('<div class="ltitle">‹ Packages</div>' + card(B, { all: true }), tabbar("packages", "full"))}</div>` },
  { id: "b", short: "keeps left", title: "Closing keeps the left page", tests: "the list, the place you were, fills the outer screen.",
    gain: "Closing lands where the phone app starts: masthead and list. Nothing to back out of.",
    loss: "The card you were checking is now one card in the list. You find it again by its seller.",
    frame: single(masthead() + card(B) + card(G, { open: false }), tabbar("packages", "full") + find("full")) },
]);

// ---------- Poses ----------
page("poses.html", "Duo · Tall and laptop", `Held tall, or half open in the laptop pose: ${TALL.w}×${TALL.h} pt, the open size turned. The fold runs across, so pages stack. Degen's tests use 626×890 here; see the README. Packages only.`, [
  { id: "a", short: "tall: masthead top", title: "Tall, flat: masthead top, list bottom", tests: "the Packages C split, stacked.",
    gain: "The scoreboard stays on the top page. The list sits in thumb reach.",
    loss: "Each page is 469 pt tall, so about one open card shows.",
    frame: stacked(masthead(), card(B) + card(G), { extra: find("full") }) },
  { id: "b", short: "tall: list top", title: "Tall, flat: index top, open package bottom", tests: "the Packages A split, stacked.",
    gain: "The check boxes you press sit on the bottom page, in thumb reach.",
    loss: "The masthead does not fit with the index on the top page; only the foot line shows.",
    frame: stacked(`<div class="mh-foot" style="padding-top:4px"><span>${OPEN_PKGS.length + 1} packages</span><span class="miss">${ALL.qty - ALL.got} still missing · ${money(ALL.val - ALL.gotVal)}</span></div>` + OPEN_PKGS.map((p, i) => idxRow(p, i === 0)).join(""), card(B, { all: true })) },
  { id: "c", short: "laptop", title: "Laptop pose: the stand shows the package, the desk half holds its rows", tests: "the half-open pose, with the top page read from a distance.",
    gain: "Stand the phone by the mail pile. The top page names the package; you tap check boxes flat on the desk.",
    loss: "A new large header for the top page. The tab bar sits on the desk page.",
    frame: stacked(masthead() + `<div class="seller" style="font-size:28px;text-align:center">${B.seller}</div><div class="cmeta" style="text-align:center">${flagText(B)}${B.id} · ${B.left} left · ${money(B.leftVal)}</div>`, `<section class="card">${B.items.map(itemRow).join("")}</section>`, { pose: "laptop" }),
    cap: "Tent pose: not drawn, as degen ruled for itself. MANIFEST has no use for a screen that faces away." },
]);

// ---------- Chrome: tab bar and Find ----------
const spreadBare = (bar, extra = "") => spread(masthead() + OPEN_PKGS.map((p, i) => idxRow(p, i === 0)).join(""), card(B, { all: true }), { bar, extra });
page("chrome.html", "Duo · Tab bar and Find", `${SIZE} Held constant: Packages A. Options A to C move only the tab bar. Options D and E move only Find.`, [
  { id: "a", short: "bar under left", title: "Custom bar under the left page", tests: "the tab bar position.",
    gain: "No control crosses the fold. The left page is the place you are, and the bar belongs to it.",
    loss: "A custom bar, not the system glass bar the phone uses. The right thumb reaches no tab.",
    frame: spreadBare(tabbar("packages", "under-l"), find("on-l")) },
  { id: "b", short: "system bar", title: "The system bar, centred on the spread", tests: "the tab bar position.",
    gain: "The real iOS glass bar, as on the phone. No custom code.",
    loss: "Degen measured it at 29–71% of the width, so it crosses the fold. Orphaned and Tally sit on the fold.",
    frame: spreadBare(tabbar("packages", "across"), find("on-l") + `<span class="note" style="left:${FOLD.at - 40}px;bottom:104px">crosses the fold</span>`) },
  { id: "c", short: "split bar", title: "Two half bars, one per page", tests: "the tab bar position.",
    gain: "Each thumb reaches two tabs. Nothing crosses the fold.",
    loss: "The tab order breaks at the fold. Two bars read as two apps.",
    frame: spreadBare(tabbar("packages", "under-l", ["ledger", "orphaned"]) + tabbar("packages", "", ["tally", "packages"], `left:${FOLD.at + FOLD.w + 24}px;width:${PAGE - 48}px`), find("on-l")) },
  { id: "d", short: "Find over list", title: "Find over the page that holds the list", tests: "Find's position. The bar stays as A.",
    gain: "Find sits over what it filters. In Packages C it moves to the right page.",
    loss: "Find moves between pages as the view changes.", cap: "Drawn as A. In Packages C and Tally C, Find moves to the right page.",
    frame: spreadBare(tabbar("packages", "under-l"), find("on-l")) },
  { id: "e", short: "Find top right", title: "Find at the top of the right page", tests: "Find's position. The bar stays as A.",
    gain: "One fixed place on every view. The left page bottom holds only the bar.",
    loss: "Out of thumb reach. The phone puts Find above the bar, so the two clients differ.",
    frame: spread(masthead() + OPEN_PKGS.map((p, i) => idxRow(p, i === 0)).join(""), '<div style="height:56px;flex-shrink:0"></div>' + card(B, { all: true }), { extra: find("top-r") }) },
]);

// ---------- Index ----------
const MOCKS = [
  ["packages.html", "Packages", ["a", "b", "c"]], ["tally.html", "Tally", ["a", "b", "c"]], ["orphaned.html", "Orphaned", ["a", "b", "c"]],
  ["ledger.html", "Ledger", ["a", "b", "c"]], ["closed.html", "Closed outer screen", ["a", "b"]], ["poses.html", "Tall and laptop", ["a", "b", "c"]],
  ["chrome.html", "Tab bar and Find", ["a", "b", "c", "d", "e"]],
];
writeFileSync(join(HERE, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Duo mockups</title><style>
:root{${Object.entries(T).map(([k, v]) => `--${k}:${v};`).join("")}color-scheme:light}
*{box-sizing:border-box}body{margin:0;background:#E7DECD;color:var(--ink);font:14px -apple-system,system-ui,sans-serif}
header{padding:16px;display:flex;flex-direction:column;gap:4px;max-width:72rem;margin-inline:auto}h1{margin:0;font-size:20px}header p{margin:0;color:var(--inkSoft)}
.grid{display:grid;gap:16px;padding:16px;grid-template-columns:repeat(auto-fill,minmax(min(20rem,100%),1fr));max-width:96rem;margin-inline:auto}
.m{background:var(--card);border:1px solid var(--line);border-radius:8px;display:flex;flex-direction:column;overflow:hidden}
.m .shot{position:relative;height:240px;overflow:hidden;border-bottom:1px solid var(--line);background:#E7DECD}
.m iframe{position:absolute;top:0;left:0;width:1040px;height:1000px;border:0;transform:scale(.3);transform-origin:0 0;pointer-events:none}
.m div.t{padding:12px;display:flex;flex-direction:column;gap:8px}.m h2{margin:0;font-size:16px}
.links{display:flex;flex-wrap:wrap;gap:8px}.links a{min-height:36px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:18px;color:var(--accent);text-decoration:none;background:var(--paper)}
</style></head><body><header><h1>MANIFEST on the iPhone Duo</h1><p>Ideation only. Each card opens one mockup; each chip opens one option. The ideation note is README.md in this folder.</p></header>
<div class="grid">${MOCKS.map(([f, t, os]) => `<article class="m"><a class="shot" href="${f}" aria-label="Open ${t}"><iframe src="${f}#s=${os[0]}" loading="lazy" tabindex="-1" title="${t}, option A"></iframe></a><div class="t"><h2><a href="${f}">${t}</a></h2><div class="links">${os.map((o) => `<a href="${f}#s=${o}">${o.toUpperCase()}</a>`).join("")}<a href="${f}#s=all">all</a></div></div></article>`).join("")}</div></body></html>`);
console.log("drew", MOCKS.length, "mockups and index.html");
