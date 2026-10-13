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
     5. The bottom bar (decision phone-nav-is-bottom-bar) at 375px and 760px:
        four tabs of at least 44px in order, the bar 24px in from each side and
        capped at 480px, centred, 12px above the bottom edge and clear of a
        34px home indicator, the search pill 8px above it, and the last row of
        Tally and Packages clear of both when scrolled to the bottom.
     6. The Ledger tab (decision ledger-tab-holds-options) at 375px and 760px:
        each option is a 44px target, Reset is red, the gap above its title is
        16px (decision spacing-on-4px-grid), and Reset ends
        above the bar stack when the tab is scrolled to the bottom.
     7. The Sync panel on the Ledger tab (decision ledger-tab-holds-options, owner
        ruling 2026-10-12) at 375px and 760px: the panel opens from its Sync cell,
        holds no GitHub control (Pull from GitHub, Push, Push anyway, Merge & push),
        and causes no sideways overflow.
     8. An axe scan (ux-house-rules-govern L8) at 375px and 760px in every view:
        the Ledger tab, Orphaned, Tally, Tally with a card open, Packages, and
        the open photo viewer. Fails on any serious or critical violation, and
        on the experimental label-content-name-mismatch rule.
     9. Touch targets (ux-a11y-floor, L6) at 375px on a touch device: every
        visible interactive element is hit at least 44 by 44 CSS px, measured by
        elementFromPoint from its centre, so a padding or pseudo-element grow
        counts and a neighbour that cuts it short is a finding.
    10. Drawn boxes (L6, no visual change): every element's painted box at 375px
        matches test/a11y-base-boxes.json, recorded from the base commit with
        `A11Y_RECORD=1 node test/screens.mjs`. A grown hit area never grows it.

   Reduced motion is on, so animation does not skew the numbers. Exit 0 when all
   checks pass; exit 1 with one `FAIL` line per failure and one summary line. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.resolve(process.argv[2] || path.join(ROOT, "index.html"));

/* The app's own key is `mailday:v1`; window.storage namespaces it under
   `mailday:`, so the literal localStorage key is `mailday:mailday:v1`. */
const STORE_KEY = "mailday:mailday:v1";
const WIDTHS = [375, 760];
/* Every tab of the bottom bar (decision phone-nav-is-bottom-bar). Ledger has no
   Reset ask until L11b, so the Reset check below leaves it out. */
const VIEWS = ["Ledger", "Orphaned", "Tally", "Packages"];
/* Reset lives on the Ledger tab only (decision ledger-tab-holds-options, group
   63.3): the working views no longer hold it, so the ask is checked there. */
const RESET_VIEWS = ["Ledger"];
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
    left: span.getBoundingClientRect().left,
  };
};

/* ---------- harness ---------- */

const failures = [];
let checks = 0;
const fail = (name, detail) => failures.push(`FAIL ${name}: ${detail}`);

async function openSeeded(browser, width, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: 812 },
    reducedMotion: "reduce",
    ...(opts.touch ? { hasTouch: true, isMobile: true } : {}),
  });
  await ctx.addInitScript(
    ([key, value]) => {
      try {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      } catch {
        /* storage blocked: the page renders its empty state and the load check fails */
      }
    },
    [STORE_KEY, JSON.stringify(opts.ledger || LEDGER)]
  );
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(pathToFileURL(PAGE).href);
  return { ctx, page, pageErrors };
}

/* Opens a view by its tab label, matched by prefix: the Orphaned tab carries a
   count badge. Returns false when no such tab can be clicked, so a missing
   tab is a reported failure, not a thrown one. */
async function showView(page, view) {
  try {
    await page.getByRole("button", { name: new RegExp(`^${view}`) }).first().click({ timeout: 3000 });
  } catch {
    return false;
  }
  await page.waitForTimeout(250);
  return true;
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
        if (!(await showView(page, view))) {
          fail(`overflow ${view} ${width}px`, "no tab opens this view");
          continue;
        }
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
    /* where the Reset label sits before the first tap: the second tap has to
       land on the same spot, so the armed label must not move from it */
    const before = await page.evaluate(() => {
      const s = [...document.querySelectorAll("button.mdl-act.danger > span")].find((x) =>
        /^Reset$/.test(x.textContent.trim())
      );
      return s ? s.getBoundingClientRect().left : null;
    });
    if (before == null) {
      fail(name, "no Reset label on the Ledger tab");
      return;
    }
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
    if (Math.abs(ask.left - before) > TAP_TOLERANCE_PX)
      fail(
        name,
        `the armed label moved from ${before.toFixed(1)}px to ${ask.left.toFixed(1)}px between the first and second tap`
      );
    if (ask.sw > ask.cw + TAP_TOLERANCE_PX)
      fail(name, `the ask label is cut: ${ask.sw}px of text in a ${ask.cw}px cell`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* The bottom bar and its search pill (decision phone-nav-is-bottom-bar), at
   375px and 760px. jsdom has no layout, so each claim here is a box. The bar
   holds four tabs, each a 44px target. It is 24px in from each side, capped at
   480px and centred. It sits 12px above the bottom edge, and the pill sits 8px
   above the bar. Clearance: at the bottom of a scrolled view, the last row
   ends above the pill, so the bar never covers it. */
const BAR_TABS = ["Ledger", "Orphaned", "Tally", "Packages"];
const BAR_SEL = 'nav[aria-label="Views"]';
const PILL_SEL = '[role="search"]';
const BAR_BOTTOM_PX = 12;
const BAR_INSET_PX = 24;
const BAR_MAX_PX = 480;
const PILL_GAP_PX = 8;
const TAB_MIN_PX = 44;
const HOME_INDICATOR_PX = 34;

/* page.evaluate serialises these functions, so each one is self-contained. */
const barState = () => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  const bar = document.querySelector('nav[aria-label="Views"]');
  const pill = document.querySelector('[role="search"]');
  return {
    vw: window.innerWidth,
    vh: window.innerHeight,
    bar: bar ? box(bar) : null,
    pill: pill ? box(pill) : null,
    tabs: bar
      ? [...bar.querySelectorAll("button")].map((b) => {
          const aria = b.getAttribute("aria-current");
          return {
            name: b.textContent.replace(/\d+$/, "").trim(),
            current: !!aria && aria !== "false",
            ...box(b),
          };
        })
      : [],
    scrolls: document.documentElement.scrollHeight > window.innerHeight,
  };
};

/* The bottom of the lowest visible text leaf that is not part of the bar or
   the pill. Fixed elements are skipped: they do not scroll with the list. */
const lastRowBottom = () => {
  let max = -Infinity;
  for (const el of document.body.querySelectorAll("*")) {
    if (el.children.length || !el.textContent.trim()) continue;
    if (el.closest('nav[aria-label="Views"], [role="search"]')) continue;
    if (getComputedStyle(el).position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    max = Math.max(max, r.bottom);
  }
  return max;
};

async function barCheck(browser, width) {
  const name = `bottom bar ${width}px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, width);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    const s = await page.evaluate(barState);
    if (!s.bar) {
      fail(name, 'no nav[aria-label="Views"]: the bottom bar is missing');
      return;
    }
    const names = s.tabs.map((t) => t.name);
    if (JSON.stringify(names) !== JSON.stringify(BAR_TABS))
      fail(name, `tabs read ${names.join(", ")}, want ${BAR_TABS.join(", ")}`);
    for (const t of s.tabs) {
      if (t.width < TAB_MIN_PX - TAP_TOLERANCE_PX || t.height < TAB_MIN_PX - TAP_TOLERANCE_PX)
        fail(name, `tab ${t.name} is ${t.width.toFixed(1)}x${t.height.toFixed(1)}px, under ${TAB_MIN_PX}px`);
    }
    const current = s.tabs.filter((t) => t.current).map((t) => t.name);
    if (JSON.stringify(current) !== JSON.stringify(["Packages"]))
      fail(name, `current tab on load is ${JSON.stringify(current)}, want ["Packages"]`);

    const wantW = Math.min(BAR_MAX_PX, s.vw - 2 * BAR_INSET_PX);
    if (Math.abs(s.bar.width - wantW) > 1)
      fail(name, `bar is ${s.bar.width.toFixed(1)}px wide, want ${wantW}px`);
    const off = (s.bar.left + s.bar.right) / 2 - s.vw / 2;
    if (Math.abs(off) > 1) fail(name, `bar is ${off.toFixed(1)}px off centre`);
    const bottomGap = s.vh - s.bar.bottom;
    if (Math.abs(bottomGap - BAR_BOTTOM_PX) > 1)
      fail(name, `bar sits ${bottomGap.toFixed(1)}px above the bottom edge, want ${BAR_BOTTOM_PX}px`);

    if (!s.pill) {
      fail(name, 'no [role="search"] pill above the bar');
    } else {
      const pillGap = s.bar.top - s.pill.bottom;
      if (Math.abs(pillGap - PILL_GAP_PX) > 1)
        fail(name, `pill sits ${pillGap.toFixed(1)}px above the bar, want ${PILL_GAP_PX}px`);
      if (Math.abs(s.pill.width - s.bar.width) > 1)
        fail(name, `pill is ${s.pill.width.toFixed(1)}px wide, the bar ${s.bar.width.toFixed(1)}px`);
    }
    if (s.bar.left < -0.5 || s.bar.right > s.vw + 0.5)
      fail(name, `bar runs off the screen (${s.bar.left.toFixed(1)} to ${s.bar.right.toFixed(1)})`);

    /* clearance: at the bottom of each list view, the last row ends above the
       stack (the pill, when shown, else the bar). A page that cannot scroll
       proves nothing, so that case is a failure too. */
    for (const view of ["Tally", "Packages"]) {
      await page.locator(BAR_SEL).getByRole("button", { name: new RegExp(`^${view}`) }).click();
      await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(250);
      const at = await page.evaluate(barState);
      const last = await page.evaluate(lastRowBottom);
      const stackTop = at.pill ? Math.min(at.pill.top, at.bar.top) : at.bar.top;
      if (!at.scrolls) fail(name, `${view}: page does not scroll, so clearance proves nothing`);
      else if (last > stackTop + 0.5)
        fail(name, `${view}: last row ends at ${last.toFixed(1)}px, under the bar stack at ${stackTop.toFixed(1)}px`);
    }

    /* the home indicator: the bar must clear it by the 12px, not sit on it */
    if (width === 375) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Emulation.setSafeAreaInsetsOverride", {
        insets: { top: 0, bottom: HOME_INDICATOR_PX, left: 0, right: 0 },
      });
      await page.waitForTimeout(250);
      const inset = await page.evaluate(barState);
      const lift = inset.vh - inset.bar.bottom;
      if (lift < HOME_INDICATOR_PX + BAR_BOTTOM_PX - 1)
        fail(name, `with a ${HOME_INDICATOR_PX}px home indicator the bar sits ${lift.toFixed(1)}px up, want at least ${HOME_INDICATOR_PX + BAR_BOTTOM_PX}px`);
    }
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* The Ledger tab (decision ledger-tab-holds-options), at 375px and 760px. The
   options sit on the tab, each a target of at least 44px. Reset is the red
   control and ends above the bar stack at the bottom of the scroll. Clearance
   is checked whether or not the tab scrolls: a tab that fits on screen cannot
   hide Reset under the bar, so it is never a failure to fit. */
const LEDGER_OPTIONS = [
  /^Showing/,
  /^Sorted by/,
  /^Orders from/,
  /^Sync/,
  /^History/,
  /^Re-import CSV/,
  /^Backup$/,
  /^Reset$/,
];

const ledgerState = () => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
  };
  return [...document.querySelectorAll("button")]
    .filter((b) => !b.closest('nav[aria-label="Views"], [role="search"]'))
    .map((b) => ({ name: b.textContent.trim(), color: getComputedStyle(b).color, ...box(b) }));
};

async function ledgerCheck(browser, width) {
  const name = `ledger tab ${width}px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, width);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    await page.locator(BAR_SEL).getByRole("button", { name: /^Ledger/ }).click();
    await page.waitForTimeout(250);
    const controls = await page.evaluate(ledgerState);
    /* the gap from the ruled head to the Ledger title is pinned to its decided 16px
       (decision spacing-on-4px-grid, ruled 2026-10-12). */
    const titleGap = await page.evaluate(() => {
      const h = [...document.querySelectorAll("h2.mdl-lh")].find((x) => x.textContent.trim() === "Ledger");
      if (!h) return null;
      let prev = h.closest("section")?.previousElementSibling;
      while (prev && getComputedStyle(prev).position === "fixed") prev = prev.previousElementSibling;
      if (!prev) return null;
      return h.getBoundingClientRect().top - prev.getBoundingClientRect().bottom;
    });
    if (titleGap === null) fail(name, "no Ledger title above the options");
    else if (Math.round(titleGap) !== 16)
      fail(name, `the gap above the Ledger title is ${titleGap.toFixed(1)}px; want 16px`);
    for (const re of LEDGER_OPTIONS) {
      const c = controls.find((x) => re.test(x.name));
      if (!c) {
        fail(name, `no ${re} control on the Ledger tab`);
        continue;
      }
      if (c.width < TAB_MIN_PX - TAP_TOLERANCE_PX || c.height < TAB_MIN_PX - TAP_TOLERANCE_PX)
        fail(name, `${c.name} is ${c.width.toFixed(1)}x${c.height.toFixed(1)}px, under ${TAB_MIN_PX}px`);
    }
    const reset = controls.find((x) => /^Reset$/.test(x.name));
    if (reset) {
      const [r, g, b] = (reset.color.match(/\d+(\.\d+)?/g) || []).map(Number);
      if (!(r > g + 60 && r > b + 60)) fail(name, `Reset is ${reset.color}, not a red`);
    }

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
    const at = await page.evaluate(barState);
    const after = await page.evaluate(ledgerState);
    const resetAtBottom = after.find((x) => /^Reset$/.test(x.name));
    const stackTop = at.pill ? Math.min(at.pill.top, at.bar.top) : at.bar.top;
    if (resetAtBottom && resetAtBottom.bottom > stackTop + 0.5)
      fail(name, `Reset ends at ${resetAtBottom.bottom.toFixed(1)}px, under the bar stack at ${stackTop.toFixed(1)}px`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* The Sync panel on the Ledger tab (decision ledger-tab-holds-options; owner
   ruling 2026-10-12). Opened from its Sync cell. The panel holds no GitHub
   control, and the open panel causes no sideways overflow. */
const GITHUB_CONTROL_NAMES = [/Pull from GitHub/, /^Push$/, /^Pushed ✓$/, /Push anyway/, /Merge & push/];

async function syncPanelCheck(browser, width) {
  const name = `sync panel ${width}px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, width);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    await page.locator(BAR_SEL).getByRole("button", { name: /^Ledger/ }).click();
    await page.waitForTimeout(250);
    const syncCell = page.locator("button", { hasText: /^Sync/ }).first();
    if (!(await syncCell.count())) {
      fail(name, "no Sync cell on the Ledger tab");
    } else {
      await syncCell.click();
      await page.waitForTimeout(250);
    }
    const names = await page.evaluate(() =>
      [...document.querySelectorAll("button")].map((b) => b.textContent.trim())
    );
    for (const re of GITHUB_CONTROL_NAMES) {
      const hit = names.find((n) => re.test(n));
      if (hit) fail(name, `the Sync panel still shows "${hit}"`);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > TAP_TOLERANCE_PX)
      fail(name, `sideways overflow of ${overflow.toFixed(1)}px with the Sync panel open`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* ---------- L8: axe, and L6: touch targets and drawn boxes ---------- */

/* Each state a screen can be in, opened from the bar. The photo viewer is the
   last state, because it overlays the page and the states after it would open
   on top of it. */
const SCREEN_STATES = ["Ledger", "Orphaned", "Tally", "Tally card open", "Packages"];
const AXE_STATES = [...SCREEN_STATES, "Photo viewer"];
const AXE_BLOCKING = new Set(["serious", "critical"]);
const AXE_PHOTO_ID = "pho-axe";
/* One stamped package, so the stamp band on Packages is in the scan. Its
   button is named "Edit stamp on <seller>" over a visible kind and note, the
   name-versus-label mismatch that the seeded page shows and this fixture
   did not. */
const AXE_LEDGER = {
  ...LEDGER,
  envelopes: [{ ...LEDGER.envelopes[0], photos: [AXE_PHOTO_ID] }],
  stamps: { "A1::Alpha Cards": { kind: "claim", at: "2026-07-01", note: "", updatedAt: 1 } },
};

/* The 44px floor is half-width 22px from the drawn centre, on each axis. */
const TOUCH_HALF_PX = 22;
const TOUCH_SELECTOR =
  'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="checkbox"], summary, [tabindex]:not([tabindex="-1"])';
const BASE_BOXES = path.join(ROOT, "test", "a11y-base-boxes.json");
const BOX_TOL_PX = 0.5;
const RECORD = process.env.A11Y_RECORD === "1";

/* Opens one state; false when it does not open, so the caller fails loudly. */
async function openScreenState(page, state) {
  if (state === "Tally card open") {
    if (!(await showView(page, "Tally"))) return false;
    await page.locator("button", { hasText: "Lightning Bolt" }).first().click();
    await page.waitForTimeout(250);
    return true;
  }
  if (state === "Photo viewer") {
    if (!(await showView(page, "Orphaned"))) return false;
    try {
      await page.getByRole("button", { name: "View photo" }).first().click({ timeout: 3000 });
      await page.waitForSelector('img[alt="Envelope photo"]', { timeout: 4000 });
    } catch {
      return false;
    }
    return true;
  }
  return showView(page, state);
}

/* Writes one small PNG into the photo store the app reads (mailday-photos,
   store photos), keyed by the envelope's photo id. The page reloads after, so
   the thumbnail resolves its blob. */
async function seedPhotoBlob(page) {
  await page.evaluate(async (id) => {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("mailday-photos", 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains("photos"))
          req.result.createObjectStore("photos");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, AXE_PHOTO_ID);
}

async function axeCheck(browser, width) {
  const { ctx, page, pageErrors } = await openSeeded(browser, width, { ledger: AXE_LEDGER });
  try {
    if (!(await loadedOk(page))) {
      fail(`axe ${width}px`, "seeded ledger did not render; no view can be scanned");
      return;
    }
    await seedPhotoBlob(page);
    await page.reload();
    if (!(await loadedOk(page))) {
      fail(`axe ${width}px`, "seeded ledger did not render after the photo was stored");
      return;
    }
    for (const state of AXE_STATES) {
      const name = `axe ${state} ${width}px`;
      checks++;
      if (!(await openScreenState(page, state))) {
        fail(name, "the state did not open, so it cannot be scanned");
        continue;
      }
      await page.waitForTimeout(150);
      const results = await new AxeBuilder({ page })
        .options({ rules: { "label-content-name-mismatch": { enabled: true } } })
        .analyze();
      for (const v of results.violations) {
        if (!AXE_BLOCKING.has(v.impact) && v.id !== "label-content-name-mismatch") continue;
        fail(name, `${v.id} (${v.impact}) on ${v.nodes.length} node(s)`);
      }
    }
    for (const e of pageErrors) fail(`axe ${width}px`, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Runs in the page, once per state. Scrolls each visible interactive element to
   the centre, then reads its painted box and how far its hit area reaches from
   the drawn centre on each side. Serialised by Playwright, so self-contained. */
const measureTouch = ({ selector, half }) => {
  const isPinned = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "sticky" || p === "fixed") return true;
    }
    return false;
  };
  const hitsTarget = (el, x, y) => {
    const h = document.elementFromPoint(x, y);
    return !!h && (h === el || el.contains(h));
  };
  const els = [...document.querySelectorAll(selector)].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  });
  return els.map((el, i) => {
    el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    const cs = getComputedStyle(el);
    const paints =
      cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      cs.backgroundImage !== "none" ||
      (cs.borderTopStyle !== "none" && parseFloat(cs.borderTopWidth) > 0) ||
      cs.boxShadow !== "none";
    /* A painted element is drawn by its border box. Otherwise only its contents
       are drawn, and a Range over them ignores padding. */
    let box = el.getBoundingClientRect();
    if (!paints) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rr = range.getBoundingClientRect();
      if (rr.width > 0 && rr.height > 0) box = rr;
    }
    const pinned = isPinned(el);
    const ex = el.getBoundingClientRect();
    const cx = ex.left + ex.width / 2;
    const cy = ex.top + ex.height / 2;
    const ext = { l: 0, r: 0, u: 0, d: 0 };
    let offscreen = false;
    for (const [dir, dx, dy] of [
      ["r", 1, 0],
      ["l", -1, 0],
      ["d", 0, 1],
      ["u", 0, -1],
    ]) {
      for (let s = 1; s <= half; s++) {
        const px = cx + dx * s;
        const py = cy + dy * s;
        if (px < 0 || py < 0 || px > window.innerWidth || py > window.innerHeight) {
          offscreen = true;
          break;
        }
        if (!hitsTarget(el, px, py)) break;
        ext[dir] = s;
      }
    }
    const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
    return {
      key: `${i}|${el.tagName.toLowerCase()}|${text}`,
      text,
      pinned,
      x: pinned ? box.left : box.left + window.scrollX,
      y: pinned ? box.top : box.top + window.scrollY,
      w: box.width,
      h: box.height,
      ext,
      offscreen,
    };
  });
};

/* The two L6 claims in one touch context: the hit floor and the drawn boxes.
   In record mode it writes the base boxes instead of comparing them. */
async function touchCheck(browser) {
  const name = "touch 375px";
  const { ctx, page, pageErrors } = await openSeeded(browser, 375, { touch: true });
  const recorded = {};
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    if (!coarse) {
      fail(name, "the page does not report a coarse pointer, so the 44px floor is not measured on touch");
      return;
    }
    const base = RECORD ? null : JSON.parse(readFileSync(BASE_BOXES, "utf8"))["375"];
    for (const state of SCREEN_STATES) {
      const stateName = `touch ${state} 375px`;
      checks++;
      if (!(await openScreenState(page, state))) {
        fail(stateName, "the state did not open, so it cannot be measured");
        continue;
      }
      await page.waitForTimeout(150);
      const items = await page.evaluate(measureTouch, { selector: TOUCH_SELECTOR, half: TOUCH_HALF_PX });
      const measured = items.filter((it) => !it.offscreen);
      if (measured.length < items.length)
        console.log(`note ${stateName}: ${items.length - measured.length} target(s) at the viewport edge not measured`);
      const small = measured.filter(
        (it) => it.ext.l + it.ext.r < 2 * TOUCH_HALF_PX || it.ext.u + it.ext.d < 2 * TOUCH_HALF_PX
      );
      if (small.length) {
        const first = small[0];
        fail(
          stateName,
          `${small.length} of ${measured.length} targets under 44px; first is "${first.text}" (${first.key.split("|")[1]}) with a hit area ${first.ext.l + first.ext.r}x${first.ext.u + first.ext.d}px`
        );
      }
      if (RECORD) {
        recorded[state] = {};
        for (const it of items) recorded[state][it.key] = { x: it.x, y: it.y, w: it.w, h: it.h, pinned: it.pinned };
        continue;
      }
      const want = base && base[state];
      if (!want) {
        fail(stateName, "no base boxes for this state; re-record with A11Y_RECORD=1 on the base commit");
        continue;
      }
      const wantKeys = Object.keys(want);
      if (wantKeys.length !== items.length) {
        fail(stateName, `${items.length} interactive elements, the base has ${wantKeys.length}`);
        continue;
      }
      const moved = [];
      for (const it of items) {
        const b = want[it.key];
        if (!b) {
          moved.push(`${it.key} is new`);
          continue;
        }
        const d = Math.max(
          Math.abs(it.x - b.x),
          Math.abs(it.y - b.y),
          Math.abs(it.w - b.w),
          Math.abs(it.h - b.h)
        );
        if (d > BOX_TOL_PX) moved.push(`${it.key} moved or resized by ${d.toFixed(2)}px`);
      }
      if (moved.length)
        fail(stateName, `${moved.length} drawn box(es) changed from the base; first: ${moved[0]}`);
    }
    if (RECORD) {
      const out = { 375: recorded };
      writeFileSync(BASE_BOXES, JSON.stringify(out, null, 1) + "\n");
      console.log(`recorded ${Object.values(recorded).reduce((n, s) => n + Object.keys(s).length, 0)} base boxes to test/a11y-base-boxes.json`);
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
    const phases = RECORD
      ? [() => touchCheck(browser)]
      : [
      () => overflowChecks(browser),
      ...WIDTHS.map((width) => () => axeCheck(browser, width)),
      () => touchCheck(browser),
      ...WIDTHS.map((width) => () => barCheck(browser, width)),
      ...WIDTHS.map((width) => () => ledgerCheck(browser, width)),
      ...WIDTHS.map((width) => () => syncPanelCheck(browser, width)),
      () => rowShiftCheck(browser, { view: "Packages", anchorText: "Alpha Cards", expand: false }),
      () => rowShiftCheck(browser, { view: "Tally", anchorText: "Lightning Bolt", expand: true }),
      () => discardArmCheck(browser),
      ...RESET_VIEWS.map((view) => () => resetAskCheck(browser, view)),
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
