// Takes the item 86 shots again: each option's phone (#phone) at its state, device scale 2 (804 x 1748 px).
// Run from the repo root after `npm install`:
//   node docs/design/shots/item-86-orphaned-composer-dismiss/capture.mjs
// Set CHROMIUM to a Chromium binary if Playwright's own browser is not installed.
// Prints each phone's size and the composer's and keys' edges (CSS px) as JSON.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(OUT, "../../../..");
const DIR = path.join(ROOT, "docs/design/item-86-orphaned-composer-dismiss");
const SHOTS = { a: "keys-hidden", b: "keys-up" };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const readings = {};
for (const [file, state] of Object.entries(SHOTS)) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 1400 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
  await ctx.route(/^https?:\/\//, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(DIR, `${file}.html`)).href + `#s=${state}`);
  await page.waitForTimeout(300);
  readings[file] = await page.evaluate(() => {
    const box = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      const p = document.querySelector("#phone").getBoundingClientRect();
      return { top: Math.round(r.top - p.top), bottom: Math.round(r.bottom - p.top), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return { phone: box("#phone"), composer: box(".composer"), foot: box(".foot"), keys: box(".keys"), tabbar: box(".tabbar") };
  });
  readings[file].errors = errors;
  await page.locator("#phone").screenshot({ path: path.join(OUT, `${file}-${state}.png`) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(readings));
