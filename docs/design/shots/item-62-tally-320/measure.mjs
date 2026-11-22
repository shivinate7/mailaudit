// Measures the real Tally card for waiting item 62 (tally-320-move) on the built
// index.html, at 320 px, light, Everything filter, card open.
// Steps: rest, then check-ins 1 to 6 on "Lightning Bolt" (six copies: the
// test/screens.mjs fixture minus order H1, so check-in 6 completes it, as in the
// card-reserved-geometry record).
//   b (as built): the page as it is.
//   a (both buttons kept): after each step, a clone of the visible bulk button is
//     put in the missing button's slot with visibility: hidden. Not built code.
// Run from the repo root after `npm install && npm run build`:
//   node docs/design/shots/item-62-tally-320/measure.mjs [width]
// Set CHROMIUM to a Chromium binary if Playwright's own browser is not installed.
// Prints the readings as JSON. Add --html to print the card's markup per step.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(OUT, "../../../..");
const WIDTH = Number(process.argv.find((a) => /^\d+$/.test(a)) || 320);
const WANT_HTML = process.argv.includes("--html");
const STORE_KEY = "mailday:mailday:v1"; // STORE_KEY in test/screens.mjs

const mk = (orderId, seller, date, tracking, rows) =>
  rows.map(([name, qty, price], i) => ({
    key: `${orderId}|${i}|p${name.replace(/\W/g, "")}`,
    orderId, seller, name, set: "Test Set", condition: "Near Mint", finish: "",
    qty, price, date, tracking, line: "Magic",
  }));
// ITEMS in test/screens.mjs, orders A1 to G1 (H1 left out: it is a seventh copy).
const ITEMS = [
  ...mk("A1", "Alpha Cards", "2026-07-01", "without tracking", [["Lightning Bolt", 1, 1.0], ["Counterspell", 1, 2.0], ["Brainstorm", 2, 0.5]]),
  ...mk("B1", "Beta Games", "2026-07-02", "without tracking", [["Lightning Bolt", 1, 1.0], ["Counterspell", 1, 2.0], ["Brainstorm", 2, 0.5]]),
  ...mk("C1", "Gamma Cards", "2026-06-01", "with tracking", [["Lightning Bolt", 1, 1.0], ["Path to Exile", 1, 3.0], ["Swords to Plowshares", 1, 4.0], ["Ponder", 1, 0.75], ["Preordain", 1, 0.75]]),
  ...mk("D1", "Delta Cards", "2026-05-01", "without tracking", [["Urza's Saga", 1, 50.0]]),
  ...mk("E1", "Epsilon Cards", "2026-06-15", "with tracking", [["Lightning Bolt", 1, 1.0], ["Counterspell", 1, 2.0], ["Ponder", 1, 0.75]]),
  ...mk("F1", "Zeta Games", "2026-06-20", "without tracking", [["Lightning Bolt", 1, 1.0], ["Brainstorm", 1, 0.5]]),
  ...mk("G1", "Eta Cards", "2026-07-05", "with tracking", [["Lightning Bolt", 1, 1.0], ["Path to Exile", 1, 3.0]]),
];
const LEDGER = {
  mailday: 1, items: ITEMS,
  dateFilter: { preset: "custom", from: "2026-04-01", to: "2026-08-31" },
  received: {}, envelopes: [], stamps: {}, sortBy: "value", itemSort: "basis", savedAt: 0,
};

const read = ({ withClone }) => {
  const card = document.querySelector('[data-anchor="t:Lightning Bolt"]');
  if (!card) return null;
  const btns = [...card.querySelectorAll("button")].filter((b) => /^(Mark all received|Clear check-ins)$/.test(b.textContent.trim()));
  const row = btns[0]?.parentElement || null;
  let clone = null;
  if (withClone && row && btns.length === 1) {
    const has = btns[0].textContent.trim();
    clone = btns[0].cloneNode(true);
    clone.textContent = has === "Mark all received" ? "Clear check-ins" : "Mark all received";
    clone.style.visibility = "hidden";
    clone.setAttribute("aria-hidden", "true");
    clone.dataset.probeClone = "1";
    if (has === "Mark all received") row.appendChild(clone);
    else row.insertBefore(clone, btns[0]);
  }
  const ct = card.getBoundingClientRect().top;
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: +(r.top - ct).toFixed(2), left: +r.left.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  };
  const rows = [...card.querySelectorAll('div[style*="--i"][style*="border-top"]')];
  const out = {
    card: box(card),
    header: box(card.querySelector(":scope > button")),
    actionRow: row ? box(row) : null,
    buttons: [...(row ? row.children : [])].map((b) => ({ text: b.textContent.trim(), hidden: b.style.visibility === "hidden", ...box(b) })),
    firstRowTop: rows[0] ? box(rows[0]).top : null,
    rowHeights: rows.map((r) => +r.getBoundingClientRect().height.toFixed(2)),
    monoFont: row && row.children[0] ? getComputedStyle(row.children[0]).fontFamily : null,
  };
  if (clone) clone.remove();
  return out;
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 812 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
await ctx.route(/^https?:\/\//, (r) => r.abort());
await ctx.addInitScript(([k, v]) => { try { if (!localStorage.getItem(k)) localStorage.setItem(k, v); } catch {} }, [STORE_KEY, JSON.stringify(LEDGER)]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(pathToFileURL(path.join(ROOT, "index.html")).href);
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /^Ledger/ }).first().click();
await page.waitForTimeout(300);
await page.locator("button.mdl-lrow", { hasText: "Showing" }).click();
await page.waitForFunction(() => [...document.querySelectorAll("button.mdl-lrow")].some((b) => b.textContent.includes("Everything")), null, { timeout: 3000 });
await page.getByRole("button", { name: /^Tally/ }).first().click();
await page.waitForTimeout(300);
await page.locator('[data-anchor="t:Lightning Bolt"] > button').click();
await page.waitForTimeout(600);

const steps = [];
const html = {};
for (let step = 0; step <= 6; step++) {
  if (step > 0) {
    const tap = page.locator('[data-anchor="t:Lightning Bolt"] button[aria-label="Mark as received"]').first();
    await tap.scrollIntoViewIfNeeded();
    await tap.click();
    await page.waitForTimeout(900);
  }
  const b = await page.evaluate(read, { withClone: false });
  const a = await page.evaluate(read, { withClone: true });
  steps.push({ step, b, a });
  if (WANT_HTML && [0, 1, 5, 6].includes(step))
    html[step] = await page.evaluate(() => document.querySelector('[data-anchor="t:Lightning Bolt"]').outerHTML);
}
await browser.close();
const shift = (k) => steps.slice(1).map((s, i) => +(s[k].firstRowTop - steps[i][k].firstRowTop).toFixed(2));
console.log(JSON.stringify({ width: WIDTH, errors, shiftB: shift("b"), shiftA: shift("a"), steps, ...(WANT_HTML ? { html } : {}) }, null, 1));
