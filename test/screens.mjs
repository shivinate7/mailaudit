/* Headless screen check: `npm run check:screens`.

   Opens the BUILT page (index.html; run `npm run build` first, or pass another
   built page as the first argument) in Chromium, seeds a realistic ledger into
   its localStorage, and checks the two layout claims jsdom cannot see, because
   jsdom has no layout:

     1. No sideways overflow, in every view, at 375px and 760px. The head's
        three ruled cells must hold the longest sort label (decisions: the ruled
        head, `minmax(0, 1fr)`; measurements/ruled-head-heights.md).
     2. Checking one card in moves no other row in that card (invariant 5;
        measurements/card-reserved-geometry.md). Measured at 375px in Packages
        and in Tally.

   Reduced motion is on, so animation does not skew the numbers. Exit 0 when all
   checks pass; exit 1 with one `FAIL` line per failure and one summary line. */
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.resolve(process.argv[2] || path.join(ROOT, "index.html"));

/* The app's own key is `mailday:v1`; window.storage namespaces it under
   `mailday:`, so the literal localStorage key is `mailday:mailday:v1`. */
const STORE_KEY = "mailday:mailday:v1";
const WIDTHS = [375, 760];
const VIEWS = ["Orphaned", "Tally", "Packages"];
const TAP_TOLERANCE_PX = 0.5;

/* ---------- fixture ---------- */

/* Same shape as test/harness.mjs's mk(), which is the shape parseItems() emits. */
const mk = (orderId, seller, date, tracking, rows) =>
  rows.map(([name, qty, price], i) => ({
    key: `${orderId}|${i}|p${name.replace(/\W/g, "")}`,
    orderId,
    seller,
    name,
    set: "Test Set",
    condition: "Near Mint",
    finish: "",
    qty,
    price,
    date,
    tracking,
    line: "Magic",
  }));

/* Seven orders. "Lightning Bolt" sits in six of them, so the Tally card for it
   has six source rows to measure. Alpha Cards is three lines with a qty-2 line,
   the package the row-shift check taps. Alpha and Beta are deliberate
   near-duplicates, as the baseline fixture is. */
const ITEMS = [
  ...mk("A1", "Alpha Cards", "2026-07-01", "without tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Counterspell", 1, 2.0],
    ["Brainstorm", 2, 0.5],
  ]),
  ...mk("B1", "Beta Games", "2026-07-02", "without tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Counterspell", 1, 2.0],
    ["Brainstorm", 2, 0.5],
  ]),
  ...mk("C1", "Gamma Cards", "2026-06-01", "with tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Path to Exile", 1, 3.0],
    ["Swords to Plowshares", 1, 4.0],
    ["Ponder", 1, 0.75],
    ["Preordain", 1, 0.75],
  ]),
  ...mk("D1", "Delta Cards", "2026-05-01", "without tracking", [
    ["Urza's Saga", 1, 50.0],
  ]),
  ...mk("E1", "Epsilon Cards", "2026-06-15", "with tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Counterspell", 1, 2.0],
    ["Ponder", 1, 0.75],
  ]),
  ...mk("F1", "Zeta Games", "2026-06-20", "without tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Brainstorm", 1, 0.5],
  ]),
  ...mk("G1", "Eta Cards", "2026-07-05", "with tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Path to Exile", 1, 3.0],
  ]),
];

/* The sort state is set to the LONGEST label each view can show ("$ remaining"
   in Packages, "Biggest position" in Tally), so the head has to hold its worst
   case at every width. A short label would let a 1fr grid pass by accident. */
const LEDGER = {
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-1",
      createdAt: Date.parse("2026-07-10T12:00:00Z"),
      note: "",
      entries: [{ name: "Lightning Bolt", qty: 1 }],
      photos: [],
      updatedAt: 0,
    },
  ],
  stamps: {},
  sortBy: "value",
  itemSort: "basis",
  savedAt: 0,
};

/* ---------- in-page probes (self-contained: Playwright serialises them) ---------- */

/* The card holding the first element whose header button mentions `anchorText`.
   Cards carry border-radius: 10px. A row is an ItemRow: it sets --i (its reveal
   index) AND a top rule. The card's bulk action row also sets --i, but it has no
   top rule, so the rule is what keeps it out of the measurement. Packages and
   Tally rows both match. */
/* (the selector is written out inside each probe: Playwright serialises the
   function, so a module-level constant would not exist in the page) */
const measureRows = (anchorText) => {
  const anchor = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes(anchorText)
  );
  let card = anchor;
  while (card && !/border-radius:\s*10px/.test(card.getAttribute("style") || ""))
    card = card.parentElement;
  if (!card) return null;
  return [...card.querySelectorAll('div[style*="--i"][style*="border-top"]')].map((r) => {
    const box = r.getBoundingClientRect();
    return { text: r.textContent.slice(0, 60), top: box.top + window.scrollY };
  });
};

const markRow = ({ anchorText, index }) => {
  document
    .querySelectorAll("[data-screen-tap]")
    .forEach((e) => e.removeAttribute("data-screen-tap"));
  const anchor = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes(anchorText)
  );
  let card = anchor;
  while (card && !/border-radius:\s*10px/.test(card.getAttribute("style") || ""))
    card = card.parentElement;
  const row = card && card.querySelectorAll('div[style*="--i"][style*="border-top"]')[index];
  if (!row) return false;
  row.setAttribute("data-screen-tap", "");
  return true;
};

const savedReceivedPositive = (key) => {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "{}");
    return Object.values(s.received || {}).some((v) => v > 0);
  } catch {
    return false;
  }
};

const overflowOf = () => ({
  sw: document.documentElement.scrollWidth,
  iw: window.innerWidth,
});

/* ---------- harness ---------- */

const failures = [];
let checks = 0;
const fail = (name, detail) => failures.push(`FAIL ${name}: ${detail}`);

async function openSeeded(browser, width) {
  const ctx = await browser.newContext({
    viewport: { width, height: 812 },
    reducedMotion: "reduce",
  });
  await ctx.addInitScript(
    ([key, value]) => {
      try {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      } catch {
        /* storage blocked: the page renders its empty state and the load check fails */
      }
    },
    [STORE_KEY, JSON.stringify(LEDGER)]
  );
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(pathToFileURL(PAGE).href);
  return { ctx, page, pageErrors };
}

async function showView(page, view) {
  /* the Orphaned button carries a count badge, so match by its label prefix */
  await page.locator(".mdl-switch button", { hasText: view }).click();
  await page.waitForTimeout(250);
}

async function loadedOk(page) {
  try {
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("button")].some((b) =>
          b.textContent.includes("Alpha Cards")
        ),
      null,
      { timeout: 8000 }
    );
    return true;
  } catch {
    return false;
  }
}

async function overflowChecks(browser) {
  const { ctx, page, pageErrors } = await openSeeded(browser, WIDTHS[0]);
  try {
    if (!(await loadedOk(page))) {
      fail("load", "seeded ledger did not render; no view can be checked");
      return;
    }
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 812 });
      await page.waitForTimeout(200);
      for (const view of VIEWS) {
        checks++;
        await showView(page, view);
        const { sw, iw } = await page.evaluate(overflowOf);
        if (sw > iw)
          fail(
            `overflow ${view} ${width}px`,
            `document is ${sw}px wide in a ${iw}px viewport`
          );
      }
    }
    for (const e of pageErrors) fail("overflow page error", e);
  } finally {
    await ctx.close();
  }
}

/* Expand one card, record its rows, check the first one in, record again. */
async function rowShiftCheck(browser, { view, anchorText, expand }) {
  const name = `rowshift ${view} 375px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, 375);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    await showView(page, view);
    if (expand) {
      await page.locator("button", { hasText: anchorText }).first().click();
      await page.waitForTimeout(250);
    }
    const before = await page.evaluate(measureRows, anchorText);
    if (!before || before.length < 3) {
      fail(name, `expected an expanded card with 3+ rows, found ${before ? before.length : "no card"}`);
      return;
    }
    const tapIndex = 0;
    const marked = await page.evaluate(markRow, { anchorText, index: tapIndex });
    if (!marked) {
      fail(name, "could not locate the first row to tap");
      return;
    }
    await page.locator("[data-screen-tap]").click();
    try {
      await page.waitForFunction(savedReceivedPositive, STORE_KEY, { timeout: 4000 });
    } catch {
      fail(name, "the tap did not check a card in (nothing saved to received)");
      return;
    }
    await page.waitForTimeout(300);
    const after = await page.evaluate(measureRows, anchorText);
    if (!after || after.length !== before.length) {
      fail(name, `row count changed from ${before.length} to ${after ? after.length : "none"}`);
      return;
    }
    for (let i = 0; i < before.length; i++) {
      if (i === tapIndex) continue;
      const moved = after[i].top - before[i].top;
      if (Math.abs(moved) > TAP_TOLERANCE_PX)
        fail(
          name,
          `row ${i} ("${before[i].text.split("$")[0].trim()}") moved ${moved.toFixed(2)}px after the first check-in`
        );
    }
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

async function main() {
  const t0 = Date.now();
  if (!existsSync(PAGE)) {
    console.log(`FAIL setup: ${PAGE} not found; run npm run build first`);
    console.log("check:screens FAIL: 0 checks run");
    process.exitCode = 1;
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.log(`FAIL setup: chromium did not launch (${e.message.split("\n")[0]}); run npx playwright install chromium`);
    console.log("check:screens FAIL: 0 checks run");
    process.exitCode = 1;
    return;
  }
  try {
    const phases = [
      () => overflowChecks(browser),
      () => rowShiftCheck(browser, { view: "Packages", anchorText: "Alpha Cards", expand: false }),
      () => rowShiftCheck(browser, { view: "Tally", anchorText: "Lightning Bolt", expand: true }),
    ];
    for (const phase of phases) {
      try {
        await phase();
      } catch (e) {
        /* an exception is a failed check, reported on its own line, not a crash */
        fail("phase error", e.message.split("\n")[0]);
      }
    }
  } finally {
    await browser.close();
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  for (const line of failures) console.log(line);
  if (failures.length) {
    console.log(`check:screens FAIL: ${failures.length} of ${checks} checks failed (${secs}s)`);
    process.exitCode = 1;
  } else {
    console.log(`check:screens PASS: ${checks} checks green (${secs}s)`);
  }
}

await main();
