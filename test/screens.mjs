/* Headless screen check: `npm run check:screens`.

   Opens the BUILT page (index.html; run `npm run build` first, or pass another
   built page as the first argument) in Chromium, seeds a realistic ledger into
   its localStorage, and checks the two layout claims jsdom cannot see, because
   jsdom has no layout:

     1. No sideways overflow, in every view, at 375px and 760px. The head's
        three ruled cells must hold the longest sort label (decisions: the ruled
        head, `minmax(0, 1fr)`; measurements/ruled-head-heights.md).
     2. Checking one card in moves no other row in that card (invariant no-layout-shift-under-pointer;
        measurements/card-reserved-geometry.md). Measured at 375px in Packages
        and in Tally.
     3. Arming Discard on an envelope card moves no element on the page and
        causes no sideways overflow. The arm adds a panel; it takes no space.
        Measured at 375px in Orphaned, the view that holds envelope cards.
     4. The armed Reset ask shows its full label: the text is not cut, so no
        ellipsis. Measured at 375px in each view.

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
  /* The long case. A seller name with no break opportunity, as run-together
     TCGplayer store names are, and a set name long enough to fill a Tally meta
     line. Most cards and rows are overflow:hidden, so a long value inside them
     is clipped rather than widening the document: this case only reaches
     documentElement.scrollWidth through an unclipped element (the head, or the
     Orphaned candidate rows if their clip is removed). See the handback. */
  ...mk("H1", "CollectorsVaultTradingCardEmporiumOutletSuperStoreOfficialLLC", "2026-07-08", "with tracking", [
    ["Lightning Bolt", 1, 1.0],
    ["Ponder", 1, 0.75],
  ]).map((it) => ({
    ...it,
    set: "Commander Legends Battle for Baldur's Gate Extended Art Foil",
  })),
];

/* A year of history outside the date range. The range is absolute (not "last
   N days"), so the fixture does not drift as the clock moves. The head's
   "N lines · M outside" figure has to hold a four-digit count, which is the
   longest figure the head can show. */
const ARCHIVE = Array.from({ length: 60 }, (_, i) =>
  mk(
    `Z${i}`,
    "Archive Bin Trading Cards",
    "2025-01-15",
    "without tracking",
    Array.from({ length: 20 }, (_, j) => [`Archive Card ${j}`, 1, 0.1])
  )
).flat();

/* The sort state is set to the LONGEST label each view can show ("$ remaining"
   in Packages, "Biggest position" in Tally), so the head has to hold its worst
   case at every width. A short label would let a 1fr grid pass by accident. */
const LEDGER = {
  mailday: 1,
  items: [...ITEMS, ...ARCHIVE],
  dateFilter: { preset: "custom", from: "2026-06-10", to: "2026-08-31" },
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

/* Every element's box, in document coordinates, so a scroll between the two
   snapshots reads as no move. Kept on window: the before-snapshot outlives
   the evaluate call that takes it. A sticky or fixed element is the exception:
   a scroll moves it on screen while its place in the layout stays put, so it
   is marked `pinned` and skipped. Its descendants move with it, so an element
   inside a pinned one is marked too. */
/* page.evaluate serialises this function, so the helper lives inside it. */
const snapshotBoxes = () => {
  const isPinned = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "sticky" || p === "fixed") return true;
    }
    return false;
  };
  const boxes = new Map();
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    boxes.set(el, {
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      w: r.width,
      h: r.height,
      pinned: isPinned(el),
    });
  });
  window.__screenBoxes = boxes;
  return boxes.size;
};

const boxesMovedSince = (tol) => {
  const moved = [];
  let gone = 0;
  for (const [el, b] of window.__screenBoxes) {
    if (!el.isConnected) {
      gone++;
      continue;
    }
    if (b.pinned) continue; // sticky or fixed: a scroll moves it, not a layout change
    const r = el.getBoundingClientRect();
    const d = Math.max(
      Math.abs(r.top + window.scrollY - b.top),
      Math.abs(r.left + window.scrollX - b.left),
      Math.abs(r.width - b.w),
      Math.abs(r.height - b.h)
    );
    if (d > tol) moved.push({ tag: el.tagName, text: (el.textContent || "").trim().slice(0, 40), d });
  }
  return { gone, count: moved.length, first: moved[0] || null };
};

/* The armed Reset label: its own text span, measured against its cell. */
const resetAskProbe = () => {
  const span = document.querySelector("button.mdl-act.armed > span");
  if (!span) return null;
  return {
    label: span.textContent.trim(),
    sw: span.scrollWidth,
    cw: span.clientWidth,
  };
};

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

/* Arm Discard on the first envelope card. Nothing on the page may move, and
   the page may not widen. The Discard panel is absolutely placed, so it is
   the one thing the arm may add; it must not push anything else. */
async function discardArmCheck(browser) {
  const name = "discard arm orphaned 375px";
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, 375);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    await showView(page, "Orphaned");
    const discard = page.locator("button").filter({ hasText: /^Discard$/ });
    if ((await discard.count()) === 0) {
      fail(name, "no envelope card with a Discard control in Orphaned");
      return;
    }
    await page.evaluate(snapshotBoxes);
    await discard.first().click();
    try {
      await page.waitForFunction(
        () => [...document.querySelectorAll("button")].some((b) => /^Tap again to discard/.test(b.textContent.trim())),
        null,
        { timeout: 4000 }
      );
    } catch {
      fail(name, "the first tap did not open the Discard ask");
      return;
    }
    await page.waitForTimeout(300);
    const moved = await page.evaluate(boxesMovedSince, TAP_TOLERANCE_PX);
    if (moved.gone)
      fail(name, `${moved.gone} element(s) left the page when Discard was armed`);
    if (moved.count)
      fail(
        name,
        `${moved.count} element(s) moved when Discard was armed; first is <${moved.first.tag.toLowerCase()}> "${moved.first.text}" by ${moved.first.d.toFixed(2)}px`
      );
    const { sw, iw } = await page.evaluate(overflowOf);
    if (sw > iw) fail(name, `document is ${sw}px wide in a ${iw}px viewport once Discard is armed`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Arm Reset in one view and read its ask. The label is one line, and the cell
   that holds it must be wide enough: scrollWidth above clientWidth is the
   ellipsis the cell would otherwise hide behind. */
async function resetAskCheck(browser, view) {
  const name = `reset ask ${view} 375px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, 375);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    await showView(page, view);
    await page.locator("button.mdl-act.danger").first().click();
    try {
      await page.waitForSelector("button.mdl-act.armed", { timeout: 4000 });
    } catch {
      fail(name, "the first Reset tap did not arm the ask");
      return;
    }
    const ask = await page.evaluate(resetAskProbe);
    if (!ask) {
      fail(name, "the armed Reset has no label span");
      return;
    }
    if (!/^Tap again to clear \d/.test(ask.label))
      fail(name, `the armed label reads "${ask.label}"`);
    if (ask.sw > ask.cw + TAP_TOLERANCE_PX)
      fail(name, `the ask label is cut: ${ask.sw}px of text in a ${ask.cw}px cell`);
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
      () => discardArmCheck(browser),
      ...VIEWS.map((view) => () => resetAskCheck(browser, view)),
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
