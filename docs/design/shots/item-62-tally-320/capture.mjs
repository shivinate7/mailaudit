// Takes the item-62 shots again: the mockups a.html (keep both buttons) and
// b.html (accept the move) at 320 px, light, device scale 2, at check-in 1 and 6.
// Run from the repo root after `npm install`:
//   node docs/design/shots/item-62-tally-320/capture.mjs
// Prints what each drawn page read of itself, to set beside measure.mjs.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const PAGES = path.resolve(OUT, "../../item-62-tally-320");
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const readings = {};
for (const opt of ["a", "b"]) {
  for (const s of ["1", "6"]) {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 812 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
    await ctx.route(/^https?:\/\//, (r) => r.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${pathToFileURL(path.join(PAGES, `${opt}.html`)).href}#s=${s}&w=320&t=light&g=on`);
    await page.waitForTimeout(400);
    const r = JSON.parse(await page.evaluate(() => document.body.dataset.read));
    r.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    r.errors = errors;
    readings[`${opt}-${s}`] = r;
    await page.screenshot({ path: path.join(OUT, `${opt}-${s}.png`), fullPage: true });
    await ctx.close();
  }
}
await browser.close();
console.log(JSON.stringify(readings, null, 1));
