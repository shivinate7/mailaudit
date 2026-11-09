/* Source of extension/pull.js, the script the background injects into a store tab. It runs in
   the tab's isolated world, so fetch carries the page's own cookies, and it holds no device
   key and reads no cookie. extension/build.mjs bundles it with core.mjs into one file, since an
   injected file cannot import. Its last statement is a promise of {pages}, {failure} or
   {stopped}, which executeScript waits for.
   It talks to the background over the runtime message channel only: it sends the page number
   it is on, and it stops reading when the background sends {type: "stop"}. */
import { readAllPages } from "./core.mjs";

const PAGE_TIMEOUT_MS = 30000;

export async function run() {
  const stop = new AbortController();
  const onMessage = (msg) => {
    if (msg?.type === "stop") stop.abort();
  };
  chrome.runtime.onMessage.addListener(onMessage);
  try {
    return await readAllPages({
      fetch: (url, init) => fetch(url, init),
      base: location.origin,
      parseDom: (html) => new DOMParser().parseFromString(html, "text/html"),
      timeoutMs: PAGE_TIMEOUT_MS,
      stopSignal: stop.signal,
      onPage: (page) => chrome.runtime.sendMessage({ type: "progress", page }).catch(() => {}),
    });
  } finally {
    chrome.runtime.onMessage.removeListener(onMessage);
  }
}
