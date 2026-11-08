/* Pure logic for the orders extension. No chrome.* and no globals: the fetch and the DOM
   parser come in as arguments, so node tests run every rule here. The device key is used
   in one place, the Authorization header built by buildOrdersRequest, and nothing logs. */

const GATE_MS = 12 * 60 * 60 * 1000;
const ORDER_PATH = "/myaccount/orderhistory";
const TOKEN_FIELD = "__RequestVerificationToken";

/* The gate is "more than 12 h old", so the boundary does not pull. */
export function shouldPull(lastSuccessAt, now) {
  if (lastSuccessAt === null || lastSuccessAt === undefined) return true;
  return now - lastSuccessAt > GATE_MS;
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

/* Reads every page of the last 120 days. Returns {pages} (trimmed, page 1 first) or {failure}. */
export async function readAllPages({ fetch, base, parseDom, timeoutMs }) {
  const orderUrl = `${base}${ORDER_PATH}`;
  try {
    const first = checked(await fetchText(fetch, orderUrl, { method: "GET" }, timeoutMs), base);
    const token = parseDom(first).querySelector(`input[name="${TOKEN_FIELD}"]`)?.value;
    if (!token) throw new ReadFailure("fetch");

    const form = new URLSearchParams({
      [TOKEN_FIELD]: token,
      ClearSessionFilters: "false",
      SearchString: "",
      DateRange: "Last 120 Days",
    });
    const post = { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form.toString() };
    checked(await fetchText(fetch, orderUrl, post, timeoutMs), base);

    const pages = [];
    for (let n = 1; ; n++) {
      const html = checked(await fetchText(fetch, `${orderUrl}?PageNumber=${n}`, { method: "GET" }, timeoutMs), base);
      const trimmed = trimPage(html, parseDom);
      if (trimmed === "") {
        if (n === 1) throw new ReadFailure("signed-out");
        return { pages };
      }
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
