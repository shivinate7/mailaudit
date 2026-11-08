/* Pure logic for the orders extension. No chrome.* and no globals: the fetch and the DOM
   parser come in as arguments, so node tests run every rule here. The device key is used
   in two places, the Authorization headers built by buildOrdersRequest and buildStatusRequest,
   and nothing logs. */

const GATE_MS = 12 * 60 * 60 * 1000;
const ORDER_PATH = "/myaccount/orderhistory";
const TOKEN_FIELD = "__RequestVerificationToken";

/* The gate is "more than 12 h old", so the boundary does not pull. */
export function shouldPull(lastSuccessAt, now) {
  if (lastSuccessAt === null || lastSuccessAt === undefined) return true;
  const at = typeof lastSuccessAt === "number" ? lastSuccessAt : Date.parse(lastSuccessAt);
  if (!Number.isFinite(at)) return true;
  return now - at > GATE_MS;
}

/* The concatenated outer HTML of each div that has the orderWrap class, in page order. */
export function trimPage(html, parseDom) {
  return [...parseDom(html).querySelectorAll("div.orderWrap")].map((el) => el.outerHTML).join("");
}

/* Carries a failure kind from the helpers below to the one catch in readAllPages. */
class ReadFailure extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind;
  }
}

/* One fetch whose request and body read share a single deadline. The timer is always cleared. */
async function fetchText(fetch, url, init, timeoutMs) {
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctl.abort();
  }, timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    const text = await res.text();
    return { ok: res.ok, url: res.url, text };
  } catch {
    throw new ReadFailure(timedOut ? "timeout" : "fetch");
  } finally {
    clearTimeout(timer);
  }
}

/* A non-2xx reply is a fetch failure. A reply that ended off the order-history path is a
   logon or revalidate redirect. */
function checked(res, base) {
  if (!res.ok) throw new ReadFailure("fetch");
  let path;
  try {
    path = new URL(res.url, base).pathname;
  } catch {
    throw new ReadFailure("fetch");
  }
  if (path.toLowerCase() !== ORDER_PATH) throw new ReadFailure("signed-out");
  return res.text;
}

const FORM_FIELDS = [TOKEN_FIELD, "ClearSessionFilters", "SearchString", "DateRange"];
const NOT_SUBMITTED = new Set(["submit", "button", "image", "reset", "file"]);

/* The filter form is the one holding DateRange. Every named field goes back with the value the
   page gave it, a browser's way: unchecked boxes and radios are left out, a select sends its
   selected option or else its first. Only DateRange is set. A field of the four that the page
   did not give is sent empty, not guessed. A missing form or token, or an action off the
   page's origin, is a fetch failure. */
function filterForm(doc, orderUrl, base) {
  const form = doc.querySelector('[name="DateRange"]')?.closest("form");
  if (!form) throw new ReadFailure("fetch");
  const params = new URLSearchParams();
  for (const el of form.querySelectorAll("input[name], select[name], textarea[name]")) {
    if (el.disabled) continue;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute("type") || "text").toLowerCase();
    if (tag === "input" && (NOT_SUBMITTED.has(type) || ((type === "checkbox" || type === "radio") && !el.checked))) continue;
    if (tag === "select") {
      const options = [...el.options];
      const chosen = options.filter((o) => o.selected);
      const sent = el.multiple ? chosen : chosen.slice(0, 1);
      for (const o of sent.length || el.multiple ? sent : options.slice(0, 1)) params.append(el.name, o.value);
    } else {
      params.append(el.name, el.value);
    }
  }
  params.set("DateRange", "Last 120 Days");
  if (!params.get(TOKEN_FIELD)) throw new ReadFailure("fetch");
  for (const name of FORM_FIELDS) if (!params.has(name)) params.set(name, "");
  let action;
  try {
    action = new URL(form.getAttribute("action") || ORDER_PATH, orderUrl);
  } catch {
    throw new ReadFailure("fetch");
  }
  if (action.origin !== new URL(base).origin) throw new ReadFailure("fetch");
  return { body: params.toString(), action: action.href };
}

/* The real end page: the filter form holding DateRange, and no password input. A logon form
   served with 200 has no such form, or has a password input, and must not read as the end. */
function isEndPage(doc) {
  const form = doc.querySelector('[name="DateRange"]')?.closest("form");
  return Boolean(form) && !doc.querySelector('input[type="password" i]');
}

/* Reads every page of the last 120 days. Returns {pages} (trimmed, page 1 first) or {failure}. */
export async function readAllPages({ fetch, base, parseDom, timeoutMs }) {
  const orderUrl = `${base}${ORDER_PATH}`;
  try {
    const first = checked(await fetchText(fetch, orderUrl, { method: "GET" }, timeoutMs), base);
    const { body, action } = filterForm(parseDom(first), orderUrl, base);
    const post = { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body };
    checked(await fetchText(fetch, action, post, timeoutMs), base);

    const pages = [];
    for (let n = 1; ; n++) {
      const html = checked(await fetchText(fetch, `${orderUrl}?PageNumber=${n}`, { method: "GET" }, timeoutMs), base);
      const trimmed = trimPage(html, parseDom);
      if (trimmed === "") {
        if (n === 1 || !isEndPage(parseDom(html))) throw new ReadFailure("signed-out");
        return { pages };
      }
      if (trimmed === pages[pages.length - 1]) return { pages };
      pages.push(trimmed);
    }
  } catch (e) {
    if (e instanceof ReadFailure) return { failure: e.kind };
    throw e;
  }
}

/* The Worker request. The key goes in the Authorization header and nowhere else. */
export function buildOrdersRequest(workerOrigin, key, body) {
  return {
    url: `${workerOrigin.replace(/\/+$/, "")}/orders`,
    init: {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  };
}

/* The result is a read failure {failure} or the Worker's reply {status, body}. A 200 that
   only records a posted failure ({recorded}) is not a success. */
export function badgeFor(result) {
  if (result?.failure === "signed-out") {
    return { text: "in", kind: "signed-out", title: "Sign in to TCGplayer, then pull again" };
  }
  if (result?.status === 200 && !result.body?.recorded) {
    const added = result.body?.added;
    return { text: Number.isInteger(added) && added > 0 ? String(added) : "", kind: "success" };
  }
  return { text: "!", kind: "failure" };
}

/* The status request. Like buildOrdersRequest, it is the only other place the key is used. */
export function buildStatusRequest(workerOrigin, key) {
  return {
    url: `${workerOrigin.replace(/\/+$/, "")}/orders/status`,
    init: { method: "GET", headers: { authorization: `Bearer ${key}` } },
  };
}

/* ---------- What the toolbar and the options page show. Pure, so node can read them. ---------- */

/* The owner's local time, as the options page and the icon title show it. */
export function whenText(ms) {
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function timeText(ms) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/* The gate's next moment, or null when the next store page load already pulls. */
export function nextPullAt(lastSuccessAt, now) {
  if (lastSuccessAt === null || lastSuccessAt === undefined) return null;
  const at = lastSuccessAt + GATE_MS;
  return at > now ? at : null;
}

/* Chrome fits about four characters, so a count over 999 reads 999+. */
export function capBadgeText(text) {
  return /^\d+$/.test(text) && Number(text) > 999 ? "999+" : text;
}

/* What one pull came to, from the read ({pages} or {failure}) and the Worker's reply
   ({status, body}, or {network: true} when no reply came). A posted failure that the Worker
   records keeps the read's own kind. Any other reply that is not a success names its own
   kind, the one the owner can act on. */
export function outcomeOf(read, post) {
  if (post?.network) return { ok: false, kind: "network" };
  const status = post?.status;
  if (status === 200) {
    if (read?.failure || post.body?.recorded) return { ok: false, kind: read?.failure ?? post.body.recorded };
    const n = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
    return { ok: true, orders: n(post.body?.orders), items: n(post.body?.items), added: n(post.body?.added), unreadable: n(post.body?.unreadable) };
  }
  if (status === 401) return { ok: false, kind: "unauthorized" };
  if (status === 413 || status === 400) return { ok: false, kind: "too-large" };
  if (status === 422 && (post.body?.error === "empty" || post.body?.error === "no-items")) return { ok: false, kind: post.body.error };
  return { ok: false, kind: "server" };
}

/* The last-failure record an outcome leaves: its own kind, or the unreadable lines of a
   success. A clean success leaves none. */
export function failureOf(outcome, now) {
  if (!outcome.ok) return { kind: outcome.kind, at: now };
  if (outcome.unreadable > 0) return { kind: "unreadable", at: now, count: outcome.unreadable };
  return null;
}

/* The toolbar for a state: badge text, kind (picks the fill), and the icon title, set in every
   state. run is the stored last attempt: {at, ok, added} or {at, ok: false, kind}. */
export function displayFor({ hasKey, pulling, run }) {
  const lead = "MANIFEST orders: ";
  if (!hasKey) return { text: "", kind: "none", title: `${lead}no device key. Open Options to paste one.` };
  if (pulling) return { text: "…", kind: "pulling", title: `${lead}pulling your orders.` };
  if (!run) return { text: "", kind: "none", title: `${lead}no pull yet. It runs when a store page loads.` };
  if (run.ok) {
    const added = Number.isInteger(run.added) ? run.added : 0;
    const badge = badgeFor({ status: 200, body: { added } });
    const lines = added > 0 ? `${added} new ${added === 1 ? "line" : "lines"}` : "no new lines";
    return { text: capBadgeText(badge.text), kind: badge.kind, title: `${lead}${lines}. Pulled ${whenText(run.at)}.` };
  }
  const badge = badgeFor({ failure: run.kind });
  const title = badge.kind === "signed-out"
    ? `${lead}signed out of TCGplayer. Sign in, then load any store page.`
    : `${lead}the last pull failed. Open Options for the fix.`;
  return { text: badge.text, kind: badge.kind, title };
}

/* The options page shows the extension's own last attempt. The Worker's record (GET
   /orders/status) stands in when there is none, or when it holds a later event, such as a pull
   from another browser. Returns the run and the failure to show. */
export function mergeStatus(local, server) {
  const okAt = Date.parse(server?.lastSuccessAt ?? "");
  const failAt = Date.parse(server?.lastFailure?.at ?? "");
  const newest = Math.max(Number.isFinite(okAt) ? okAt : -Infinity, Number.isFinite(failAt) ? failAt : -Infinity);
  if (!Number.isFinite(newest) || (local.run && local.run.at >= newest)) return { run: local.run, failure: local.failure };
  const failed = Number.isFinite(failAt) && failAt === newest;
  const run = failed ? { at: failAt, ok: false, kind: server.lastFailure.kind } : { at: okAt, ok: true };
  const failure = Number.isFinite(failAt) ? { ...server.lastFailure, at: failAt } : null;
  return { run, failure };
}
