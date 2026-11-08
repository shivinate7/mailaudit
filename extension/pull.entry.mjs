/* Source of extension/pull.js, the script the background injects into a store tab. It runs in
   the tab's isolated world, so fetch carries the page's own cookies, and it holds no device
   key and reads no cookie. extension/build.mjs bundles it with core.mjs into one file, since an
   injected file cannot import. Its last statement is a promise of {pages} or {failure}, which
   executeScript waits for. */
import { readAllPages } from "./core.mjs";

const PAGE_TIMEOUT_MS = 30000;

export function run() {
  return readAllPages({
    fetch: (url, init) => fetch(url, init),
    base: location.origin,
    parseDom: (html) => new DOMParser().parseFromString(html, "text/html"),
    timeoutMs: PAGE_TIMEOUT_MS,
  });
}
