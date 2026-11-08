/* The extension's service worker. It holds the device key (the only reader of it), starts the
   pull in a store tab, posts the pages to the Worker, and sets the toolbar badge and title.
   The key is read from storage only inside this file, goes only into core's Authorization
   headers, and is never logged, echoed in a reply, or put in a stored record. The rules sit in
   core.mjs; this file is the glue to the chrome.* APIs. */
import {
  buildOrdersRequest, buildStatusRequest, displayFor, failureOf, mergeStatus, outcomeOf, shouldPull,
} from "./core.mjs";
import { BADGE_FILL, BADGE_TEXT } from "./badge-colors.mjs";

const WORKER_ORIGIN = "https://manifestnumberone.shivamsemwal01.workers.dev";
const STORE_ORIGIN = "https://store.tcgplayer.com/";
const POST_TIMEOUT_MS = 120000;
const CHECK_TIMEOUT_MS = 10000;
const KEEPALIVE_MS = 20000;

/* The pull in progress, or null. Set before any await, so two page loads cannot start two. */
let running = null;

const store = {
  get: () => chrome.storage.local.get(["key", "run", "failure", "lastSuccessAt"]),
  set: (o) => chrome.storage.local.set(o),
};

/* ---------- toolbar ---------- */

async function showToolbar() {
  const { key, run } = await store.get();
  const d = displayFor({ hasKey: Boolean(key), pulling: running !== null, run });
  await chrome.action.setBadgeText({ text: d.text });
  if (d.text) {
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_FILL[d.kind] });
    await chrome.action.setBadgeTextColor({ color: BADGE_TEXT });
  }
  await chrome.action.setTitle({ title: d.title });
}

function changed() {
  showToolbar();
  chrome.runtime.sendMessage({ type: "changed" }).catch(() => {});
}

/* ---------- the pull ---------- */

/* One request to the Worker. A reply is {status, body}; no reply is {network: true}. */
async function send({ url, init }, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    let body = null;
    try {
      body = await res.json();
    } catch {}
    return { status: res.status, body };
  } catch {
    return { network: true };
  } finally {
    clearTimeout(timer);
  }
}

/* Runs the pull script in the tab. Anything but a clean {pages} or {failure}, such as a tab
   that closed or moved on mid-run, reads as a fetch failure. */
async function readInTab(tabId) {
  try {
    const [injected] = await chrome.scripting.executeScript({ target: { tabId }, files: ["pull.js"] });
    const r = injected?.result;
    if (Array.isArray(r?.pages) || typeof r?.failure === "string") return r;
  } catch {}
  return { failure: "fetch" };
}

async function pull(tabId, force) {
  const { key, lastSuccessAt } = await store.get();
  if (!key || (!force && !shouldPull(lastSuccessAt, Date.now()))) return;
  changed();
  /* A long pull outlives the worker's idle timer unless something keeps calling a chrome API. */
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), KEEPALIVE_MS);
  try {
    const read = await readInTab(tabId);
    const body = read.pages ? { v: 1, pages: read.pages } : { v: 1, failure: read.failure };
    const post = await send(buildOrdersRequest(WORKER_ORIGIN, key, body), POST_TIMEOUT_MS);
    const outcome = outcomeOf(read, post);
    const now = Date.now();
    const run = outcome.ok
      ? { at: now, ok: true, orders: outcome.orders, items: outcome.items, added: outcome.added, unreadable: outcome.unreadable }
      : { at: now, ok: false, kind: outcome.kind };
    await store.set({ run, failure: failureOf(outcome, now), ...(outcome.ok ? { lastSuccessAt: now } : {}) });
  } finally {
    clearInterval(keepAlive);
  }
}

/* Starts a pull unless one runs. force skips the 12 h gate (Pull now). */
function startPull(tabId, force) {
  if (running) return false;
  running = pull(tabId, force)
    .catch(() => {})
    .finally(() => {
      running = null;
      changed();
    });
  return true;
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.url?.startsWith(STORE_ORIGIN)) startPull(tabId, false);
});

/* ---------- messages from the options page ---------- */

const status = (key) => send(buildStatusRequest(WORKER_ORIGIN, key), CHECK_TIMEOUT_MS);

async function view() {
  const { key, run, failure, lastSuccessAt } = await store.get();
  const hasKey = Boolean(key);
  let shown = { run, failure };
  if (hasKey) {
    const res = await status(key);
    if (res.status === 200) shown = mergeStatus({ run, failure }, res.body);
  }
  return { hasKey, pulling: running !== null, run: shown.run ?? null, failure: shown.failure ?? null, lastSuccessAt: lastSuccessAt ?? null };
}

async function saveKey(raw) {
  const key = typeof raw === "string" ? raw.trim() : "";
  if (!key) return { saved: false };
  const { failure } = await store.get();
  await store.set({ key, ...(failure?.kind === "unauthorized" ? { failure: null } : {}) });
  const res = await status(key);
  changed();
  return { saved: true, check: res.network ? "offline" : res.status === 200 ? "accepted" : res.status === 401 ? "refused" : "offline" };
}

async function pullNow() {
  const { key } = await store.get();
  if (!key) return { started: false, reason: "no-key" };
  if (running) return { started: false, reason: "running" };
  const tabs = await chrome.tabs.query({ url: `${STORE_ORIGIN}*` });
  const tab = tabs.find((t) => t.status === "complete") ?? tabs[0];
  if (!tab) return { started: false, reason: "no-tab" };
  startPull(tab.id, true);
  return { started: true };
}

const handlers = {
  state: view,
  pull: pullNow,
  saveKey: (m) => saveKey(m.key),
  clearKey: async () => {
    await chrome.storage.local.remove("key");
    changed();
    return { cleared: true };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  const handle = sender.id === chrome.runtime.id ? handlers[msg?.type] : null;
  if (!handle) return false;
  handle(msg).then(reply, () => reply({ error: true }));
  return true;
});

/* A press on the icon opens the options page: one page holds every state and fix. */
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onInstalled.addListener(showToolbar);
chrome.runtime.onStartup.addListener(showToolbar);
