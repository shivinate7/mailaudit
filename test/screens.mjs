/* Headless screen check: `npm run check:screens`.

   Opens the BUILT page (index.html; run `npm run build` first, or pass another
   built page as the first argument) in Chromium, seeds a realistic ledger into
   its localStorage, and checks the two layout claims jsdom cannot see, because
   jsdom has no layout:

     1. No sideways overflow, in every view, at 375px and 760px, and in the
        lost-photo tile state (LOST_STATE). The head's three ruled cells must hold
        the longest sort label (decisions: the ruled head, `minmax(0, 1fr)`;
        measurements/ruled-head-heights.md).
     2. Every check-in moves no other row in its card (invariant
        no-layout-shift-under-pointer; measurement card-reserved-geometry). Each
        card is checked in row by row through completion, at 375px and 760px: Tally
        under Unreceived and under Everything, and Packages under Everything.
        Packages under Unreceived is checked one line short of completion, since
        its completed package drops out (view-rules filterPackages). A failing
        check-in names each moved row and its shift.
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
     8. An axe scan (ux-house-rules-govern L8) at 375px and 760px in every state
        of SCREEN_STATES, and in the open photo viewer. Fails on any serious or
        critical violation, and on the experimental label-content-name-mismatch rule.
        LOST_STATE is the last state of SCREEN_STATES and of the scan: it needs a key,
        a mocked Worker and an old envelope, so it reloads the page (openLostTile).
     9. Touch targets (ux-a11y-floor, L6) at 375px on a touch device, in every
        state of SCREEN_STATES: each visible interactive element is hit at least
        44 by 44 CSS px, measured by elementFromPoint from its centre, the centre
        sample included. A tap that lands on a label counts for the field the label
        owns. A padding or pseudo-element grow counts, and a neighbour that cuts it
        short is a finding. A target whose 44px reach runs past the viewport edge is
        skipped by this floor only: each state prints one `note` line with the number
        of such targets. Its drawn box and its overlap probe still count.
    10. Drawn boxes (L6): in every state of SCREEN_STATES, each element's painted
        box at 375px matches test/a11y-base-boxes.json. The base is recorded at the
        grid lane head, commit 528bbde (the re-space build under
        spacing-on-4px-grid), with `A11Y_RECORD=1 node test/screens.mjs`. The six
        touch states that the tab badge top 6px to 4px moved were re-recorded at
        dc73fc3 with `A11Y_RECORD_ONLY`. "Tally card open" was re-recorded at
        a95b180 with `A11Y_RECORD_ONLY`, after the Tally row shift fix. It is no
        longer the f7d51ba base: the grid is a deliberate visual change, so this
        check now guards drift from the grid head, not the grid change itself.
        "Packages" and "Stamp editor open" were re-recorded at 2b4fd8f with
        `A11Y_RECORD_ONLY`, after the order id became a link: each package card
        went from one header button to a chevron button plus an id link (6 more
        elements per state), and the header grew 12px. Both were re-recorded again
        at 4e61484 with `A11Y_RECORD_ONLY`, after the id line moved 12px clear of the
        date line and the header grew 12px more: in each card the id link moved 12px
        and each box under it 24px, on top of the cards above. Every other state
        stayed. A grown hit area never grows it. Keys mask digits in their text, so a day
        count in a card does not move a key. After any deliberate visual change,
        re-record every state the same way; A11Y_RECORD_ONLY="<state>" re-records
        one.
    11. Overlap (L6, F2): in the same states, a tap 1px outside any point of a
        control's side, corner to corner, counts when that point is strictly
        nearer to that control than to any other control. So the walk along a side
        stops at the gap midpoint. A tap that lands inside another control's own
        border box counts for that control. A tap that lands on a neighbour's
        pseudo-element, outside its border box, is a finding. A pair is skipped
        when exactly one control is position: fixed (the search pill, the bottom
        bar) and the other is scrolling content, not fixed (owner ruling
        2026-10-14 08:10 CDT). A sticky control is not fixed, so its pairs are still
        checked. Named hole: no check covers a tap just past a fixed control's
        edge. The probe must test at least one tap per state, or the state fails.
    12. Stamp chips (L6, decision 2026-10-13): at 375px touch, in the Stamp editor
        state, each of the six kind chips has a hit area at least 44px tall, centred
        on its drawn box, that ends at the gap midpoint to the chip above and to the
        chip below. Reach is walked from the drawn box in 0.25px steps. The span,
        centring and midpoint checks allow 0.25px (cause in the claim 12 header).
    13. Ledger rule (L6, Sorted by top rule): at 375px touch on the Ledger tab, each tap in the
        top 1px band of the "Sorted by" row, inset 2px from each end (every 0.25px
        down, every 4px across), returns "Sorted by", not the row above it.
    14. Spacing grid (decision spacing-on-4px-grid, owner ruling 2026-10-11 "Re-space
        to the grid"): at 375px and 760px, and at 375px touch (the pointer: coarse
        block sets its own padding), in every state of SCREEN_STATES, each visible
        element's computed margin, padding, row-gap and column-gap is a multiple of
        4px. Auto margins are skipped and gap "normal" counts as 0. Each card's four
        corners are 8px. A card is a DIV on the card surface (#FCF6EA) with a 1px
        border. Pseudo-elements are not walked. Exemptions are named in GRID_EXEMPT,
        each with its reason.
    15. Lost tile size (decision pull-warns-on-what-it-drops) at 375px and 760px: in a
        strip that holds a View photo thumbnail and a lost tile, both are 56 by 56
        drawn px (0.5px tolerance), by bounding rect. A content-box tile measures 58.
    16. A remote reply lands without moving what the owner is looking at (invariant
        no-layout-shift-under-pointer; owner ruling 2026-10-20 23:36 CDT, "hover doesn't
        count"). At 375px and 760px with a mouse at rest on a row, and at 375px touch with a row
        in view, in Packages and in Tally: a mocked Worker pushes {rev} over the socket and
        answers the GET with a ledger that adds rows above the row. 16a: the reply is applied
        within 1.5 s (a hover is not a press, so nothing holds it). 16b: once it has landed
        (up to 13 s, so a build that still waits lands too), the row has moved no more than
        0.5px and is still under the pointer, merge notice and new rows included.
        Chromium anchors scroll natively. Whether the owner's WebKit does is unmeasured, so the
        claim turns overflow-anchor off and measures the page's own correction either way.
        A scroll gate and a missing correction fail separately.
        `SCREENS_ONLY=16 node test/screens.mjs` runs this claim alone.
    17. Order id link (owner ruling 2026-10-21) at 375px touch and 760px, on Alpha's
        order A1: the chevron toggles on a click (a tap at 375px) and on Enter while
        the seller name is selected, open or collapsed. At 760px a mouse drag from the
        seller name into the date line selects text and leaves the card open, and a
        plain click still collapses it. Claim 17a, at 320px and 375px touch, with
        Alpha stamped and not: no real tap on the seller name, the date line, the
        chevron or the row under the header (the Stamp band, or the action row's
        buttons) opens TCGplayer. The taps are Chromium touches with a 1px and a
        12px radius, on a 1px grid within 32px of the id link's area (8px beyond), so
        Chromium's touch adjustment is in play. Header whitespace is not swept.

   Reduced motion is on, so animation does not skew the numbers. Exit 0 when all
   checks pass; exit 1 with one `FAIL` line per failure and one summary line. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { SYNC_KEY_STORAGE } from "../src/sync-rules.mjs";

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

/* The card holding the first element whose header text mentions `anchorText`.
   Cards carry the radius CARD_RADIUS_PX (decision spacing-on-4px-grid, 8px). A row
   is an ItemRow: it sets --i (its reveal index) AND a top rule. The card's bulk
   action row also sets --i, but it has no top rule, so the rule is what keeps it
   out of the measurement. Packages and Tally rows both match. */
/* (the radius is passed in and the regex is built inside each probe: Playwright
   serialises the function, so a module-level constant would not exist in the page) */
const measureRows = ({ anchorText, radius }) => {
  /* the first visible text that holds anchorText, whatever element carries it:
     a package header is a button today and a plain element once its text selects */
  const anchor = (() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode())
      if (n.textContent.includes(anchorText) && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName))
        return n.parentElement;
    return null;
  })();
  let card = anchor;
  const cardStyle = new RegExp(`border-radius:\\s*${radius}px`);
  while (card && !cardStyle.test(card.getAttribute("style") || ""))
    card = card.parentElement;
  if (!card) return null;
  /* top is taken from the card's own top, so a card that moves as a whole does not
     read as a row that moved. key is the row's title (seller in Tally, line name in
     Packages); done is its check button's state; height is its own box. */
  const cardTop = card.getBoundingClientRect().top;
  return [...card.querySelectorAll('div[style*="--i"][style*="border-top"]')].map((r) => {
    const box = r.getBoundingClientRect();
    const title = r.querySelector('div[style*="font-weight: 600"]');
    return {
      key: (title || r).textContent.trim().slice(0, 60),
      top: box.top - cardTop,
      height: box.height,
      done: !!r.querySelector('button[aria-label="Mark as not received"]'),
    };
  });
};

/* The first row in the card that is not yet received, marked for the tap. Its
   own button is "Mark as received" until it is checked in. Scrolled to the middle
   of the viewport, so a fixed bar cannot cover the row the tap is sent to. */
const markFirstUndone = ({ anchorText, radius }) => {
  document
    .querySelectorAll("[data-screen-tap]")
    .forEach((e) => e.removeAttribute("data-screen-tap"));
  /* the first visible text that holds anchorText, whatever element carries it:
     a package header is a button today and a plain element once its text selects */
  const anchor = (() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode())
      if (n.textContent.includes(anchorText) && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName))
        return n.parentElement;
    return null;
  })();
  let card = anchor;
  const cardStyle = new RegExp(`border-radius:\\s*${radius}px`);
  while (card && !cardStyle.test(card.getAttribute("style") || ""))
    card = card.parentElement;
  if (!card) return null;
  const rows = [...card.querySelectorAll('div[style*="--i"][style*="border-top"]')];
  const index = rows.findIndex((r) => r.querySelector('button[aria-label="Mark as received"]'));
  if (index < 0) return null;
  const row = rows[index];
  row.setAttribute("data-screen-tap", "");
  row.scrollIntoView({ block: "center" });
  const title = row.querySelector('div[style*="font-weight: 600"]');
  return { index, key: (title || row).textContent.trim().slice(0, 60) };
};

/* True once `n` rows hold a received count above zero. Counts rows, not the sum,
   because one tap sets a qty-2 line to 2. */
const receivedKeysAtLeast = ([key, n]) => {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "{}");
    return Object.values(s.received || {}).filter((v) => v > 0).length >= n;
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

/* ---------- a fresh visitor, with a seed planted ----------
   The public seed is removed (owner ruling 2026-10-14). This plants a synthetic
   seed tag in a copy of the page, opens the copy with nothing in storage, and
   checks the visitor lands on the empty ledger, with no snapshot notice. It is
   red while entry.jsx still reads the tag. The copy lives under node_modules and
   every network request is aborted, so no Worker or GitHub call can happen. */
async function freshVisitorCheck(browser) {
  const name = "fresh visitor";
  const packed = gzipSync(
    Buffer.from(
      JSON.stringify({
        mailday: 1,
        items: mk("Z9", "Probe Seller", "2026-07-01", "without tracking", [
          ["Planted Probe Card", 1, 1.0],
        ]),
        received: {},
        envelopes: [],
        stamps: {},
        dateFilter: { preset: "all", from: "", to: "" },
        sortBy: "newest",
        itemSort: "missing",
      }),
      "utf8"
    )
  ).toString("base64");
  const stripped = readFileSync(PAGE, "utf8").replace(/<script id="seed"[^>]*>[^<]*<\/script>\n?/, "");
  const planted = stripped.replace(
    '<div id="root"></div>',
    () => `<div id="root"></div>\n<script id="seed" type="application/gzip-base64">${packed}</script>`
  );
  if (!planted.includes(packed)) {
    fail(name, 'the page has no <div id="root"></div> to plant the seed beside; nothing was tested');
    return;
  }
  const dir = path.join(ROOT, "node_modules", ".mailday-test");
  mkdirSync(dir, { recursive: true });
  const probe = path.join(dir, "fresh-visitor.html");
  writeFileSync(probe, planted);
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
  try {
    await ctx.route(/^https?:\/\//, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(probe).href);
    await page
      .getByText("Drop your OrderWand CSV here")
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {});
    const body = await page.innerText("body");
    checks++;
    if (!body.includes("Drop your OrderWand CSV here"))
      fail(name, "a fresh visitor does not land on the empty-ledger state");
    checks++;
    if (body.includes("Planted Probe Card"))
      fail(name, "the planted seed's items reached a fresh visitor's screen");
    checks++;
    if (/someone else’s ledger/.test(body)) fail(name, "a fresh visitor is shown a snapshot notice");
  } finally {
    await ctx.close();
  }
}

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
      () => {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode())
          if (n.textContent.includes("Alpha Cards") && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) return true;
        return false;
      },
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

/* Claim 1 for the lost-photo tile state: it is a state, not a tab, so the per-view
   loop above never opens it. */
async function lostTileOverflow(browser, width) {
  const name = `overflow ${LOST_STATE} ${width}px`;
  const { ctx, page, pageErrors } = await openSeeded(browser, width);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    checks++;
    if (!(await openScreenState(page, LOST_STATE))) {
      fail(name, "the state did not open, so it cannot be measured");
      return;
    }
    const { sw, iw } = await page.evaluate(overflowOf);
    if (sw > iw) fail(name, `document is ${sw}px wide in a ${iw}px viewport`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Claim 15: the lost tile is the size of the thumbnails beside it. The strip holds one
   of each: a photo the Worker holds (so a View photo button) and the lost one. Both
   are 56 by 56 drawn px. Measured by bounding rect, so a content-box tile (56px plus a
   1px border each side = 58) fails, and the FAIL line prints both measures. */
async function lostTileSize(browser, width) {
  const name = `size ${LOST_STATE} ${width}px`;
  const { ctx, page, pageErrors } = await openSeeded(browser, width);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    checks++;
    if (!(await openLostTile(page, { ledger: lostSizeLedger(), workerNames: [`${HELD_PHOTO_ID}.jpg`] }))) {
      fail(name, "the state did not open, so it cannot be measured");
      return;
    }
    const m = await page.evaluate((tileSel) => {
      const size = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      };
      return {
        tile: size(document.querySelector(tileSel)),
        thumb: size(document.querySelector('button[aria-label="View photo"]')),
      };
    }, LOST_TILE_SELECTOR);
    const px = (b) => `${b.w}x${b.h}`;
    const off = (a, b) => Math.abs(a.w - b.w) > BOX_TOL_PX || Math.abs(a.h - b.h) > BOX_TOL_PX;
    const want = { w: THUMB_PX, h: THUMB_PX };
    if (!m.tile) fail(name, `no lost tile matches ${LOST_TILE_SELECTOR}, so it cannot be measured`);
    else if (!m.thumb) fail(name, `lost tile ${px(m.tile)}, and no View photo thumbnail beside it to compare`);
    else if (off(m.tile, want) || off(m.tile, m.thumb))
      fail(name, `lost tile ${px(m.tile)}, thumbnail ${px(m.thumb)}; both must be ${px(want)}`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Checks in every row of one card, one at a time, through completion. Before each
   tap the card's rows are measured; after the save and a settle past the 400ms
   just-checked tick (useJustBecame), they are measured again. No row other than the
   tapped one may move within its card (invariant no-layout-shift-under-pointer). A
   failing check-in names each moved row and its shift.

   Under Unreceived, a package drops at once when its last line is checked
   (view-rules filterPackages), so that card is measured through one line short of
   completion. With Showing set to Everything the completed card stays, and it is
   measured through completion. A Tally card stays under Unreceived while its copies
   are just-checked (sticky), so it is measured through completion there. */
async function rowShiftCheck(browser, { view, anchorText, expand, showAll, stopShort, width }) {
  const name = `rowshift ${view}${showAll ? " (everything)" : ""} ${width}px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, width);
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    if (showAll) {
      await showView(page, "Ledger");
      try {
        await page.locator("button.mdl-lrow", { hasText: "Showing" }).click({ timeout: 3000 });
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll("button.mdl-lrow")].some((b) =>
              b.textContent.includes("Everything")
            ),
          null,
          { timeout: 3000 }
        );
      } catch {
        fail(name, 'the Ledger "Showing" row did not switch to Everything');
        return;
      }
    }
    await showView(page, view);
    if (expand) {
      await page.locator("button", { hasText: anchorText }).first().click();
      await page.waitForTimeout(250);
    }
    const start = await page.evaluate(measureRows, { anchorText, radius: CARD_RADIUS_PX });
    if (!start || start.length < 3) {
      fail(name, `expected a card with 3+ rows, found ${start ? start.length : "no card"}`);
      return;
    }
    const total = start.length;
    const steps = stopShort ? total - 1 : total;
    for (let step = 1; step <= steps; step++) {
      const label = `check-in ${step}/${total}`;
      const before = await page.evaluate(measureRows, { anchorText, radius: CARD_RADIUS_PX });
      if (!before) {
        fail(name, `${label}: the card is gone before the tap`);
        return;
      }
      const tapped = await page.evaluate(markFirstUndone, { anchorText, radius: CARD_RADIUS_PX });
      if (!tapped) {
        fail(name, `${label}: no row left to tap`);
        return;
      }
      try {
        await page.locator("[data-screen-tap]").click({ timeout: 4000 });
      } catch (e) {
        fail(name, `${label}: the tap on "${tapped.key}" did not land (${e.message.split("\n")[0]})`);
        return;
      }
      try {
        await page.waitForFunction(receivedKeysAtLeast, [STORE_KEY, step], { timeout: 4000 });
      } catch {
        fail(name, `${label}: the tap on "${tapped.key}" did not save to received`);
        return;
      }
      await page.waitForTimeout(600);
      const after = await page.evaluate(measureRows, { anchorText, radius: CARD_RADIUS_PX });
      if (!after) {
        fail(name, `${label}: the card is gone after the tap on "${tapped.key}"`);
        return;
      }
      if (after.length !== before.length) {
        fail(name, `${label}: row count changed from ${before.length} to ${after.length}`);
        return;
      }
      const moved = [];
      for (let i = 0; i < before.length; i++) {
        if (i === tapped.index) continue;
        if (before[i].key !== after[i].key) {
          fail(name, `${label}: row ${i} "${before[i].key}" is now "${after[i].key}"; rows changed order`);
          return;
        }
        const d = after[i].top - before[i].top;
        if (Math.abs(d) > TAP_TOLERANCE_PX)
          moved.push(`row ${i} "${before[i].key}" ${d > 0 ? "+" : ""}${d.toFixed(2)}px`);
      }
      if (moved.length) {
        const own = after[tapped.index].height - before[tapped.index].height;
        fail(
          name,
          `${label} on "${tapped.key}" (its own height ${own >= 0 ? "+" : ""}${own.toFixed(2)}px): ${moved.join("; ")}`
        );
      }
    }
    const end = await page.evaluate(measureRows, { anchorText, radius: CARD_RADIUS_PX });
    const undone = end ? end.filter((r) => !r.done).length : -1;
    if (undone !== total - steps)
      fail(name, `after check-in ${steps}/${total}, ${undone} row(s) not received; want ${total - steps}`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Packages under Unreceived (stops one line short: its completed package drops),
   Packages under Everything (through completion, the card stays), and Tally under
   Unreceived and under Everything (through completion: the card stays while its
   copies are just-checked, and the measurement record's Tally steps ran under
   Everything). */
const ROW_SHIFT_CARDS = [
  { view: "Packages", anchorText: "Alpha Cards", expand: false, showAll: false, stopShort: true },
  { view: "Packages", anchorText: "Alpha Cards", expand: false, showAll: true, stopShort: false },
  { view: "Tally", anchorText: "Lightning Bolt", expand: true, showAll: false, stopShort: false },
  { view: "Tally", anchorText: "Lightning Bolt", expand: true, showAll: true, stopShort: false },
];

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
const BASE_STATES = [
  "Ledger",
  "Orphaned",
  "Tally",
  "Tally card open",
  "Packages",
  "Stamp editor open",
  "Envelope composer open",
  "Sync panel open",
];
/* The lost-photo tile (decision pull-warns-on-what-it-drops) comes last, after the
   photo viewer: its opener reloads the page with a sync key, a mocked Worker and a
   different ledger, so no later state could count on the ledger it began with. */
const LOST_STATE = "Lost photo tile";
const SCREEN_STATES = [...BASE_STATES, LOST_STATE];
const AXE_STATES = [...BASE_STATES, "Photo viewer", LOST_STATE];
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
/* A base key masks the digits in its text, so a day count does not move it.
   The index and tag stay as they are, so repeated labels stay apart. */
const keyMasked = (key) => {
  const [i, tag, ...rest] = key.split("|");
  return [i, tag, rest.join("|").replace(/\d+/g, "#")].join("|");
};

/* The lost-photo tile shows once the push survey has run: the Worker answered the
   photo list, and the envelope's photo is held by neither this device nor the
   Worker. So the page needs a device key (any string in the key alphabet), a Worker
   that answers, and an envelope older than the 7-day grace. The age is relative to
   now, because the grace is: an absolute date would drift out of the fixture. */
const LOST_PHOTO_ID = "pho-lost";
const LOST_DEVICE_KEY = "screens-device-key";
const LOST_ENVELOPE_AGE_MS = 8 * 86400000;
const lostLedger = () => ({
  ...LEDGER,
  envelopes: [
    {
      ...LEDGER.envelopes[0],
      id: "env-lost",
      createdAt: Date.now() - LOST_ENVELOPE_AGE_MS,
      photos: [LOST_PHOTO_ID],
    },
  ],
});

/* The size claim needs a thumbnail beside the tile, and lostLedger() must stay as it is:
   one more button in the lost state would move every index in its recorded boxes
   (claim 10). So the strip has its own fixture: a photo the Worker holds, then the lost
   one. A photo the Worker holds is not lost, and it draws as a View photo button. */
const HELD_PHOTO_ID = "pho-held";
const THUMB_PX = 56; /* decision photo-thumbnails-and-viewer */
const LOST_TILE_SELECTOR = '[role="img"][aria-label^="Photo lost"]';
const lostSizeLedger = () => {
  const l = lostLedger();
  return { ...l, envelopes: [{ ...l.envelopes[0], photos: [HELD_PHOTO_ID, LOST_PHOTO_ID] }] };
};

/* Answers the three Worker routes the survey walks, and aborts everything else, so no
   request, key or socket leaves the machine. A cold open reads the ledger (404, empty),
   POSTs its own 500 ms later, and surveys the photos 1 s after that. The POST reply
   carries no ledger: a held ledger would be applied, and an apply drops the survey.
   `workerNames` are the photo file names its list holds (id.ext, as the Worker lists them):
   a photo it holds is not lost. `live`, when given, is {ledger, rev, sockets}: the GET answers
   with live.ledger once it is set, and every socket the page opens is kept in live.sockets. */
async function mockWorker(ctx, workerNames = [], live = null) {
  const hits = { ledgerGet: 0, ledgerPost: 0, photoList: 0 };
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  };
  await ctx.route(/^https?:\/\//, (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());
    const json = (status, body) =>
      route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (pathname === "/ledger" && req.method() === "GET") {
      hits.ledgerGet++;
      return live?.ledger ? json(200, { ledger: live.ledger, rev: live.rev }) : json(404, { error: "empty" });
    }
    if (pathname === "/ledger" && req.method() === "POST") {
      hits.ledgerPost++;
      return json(200, { rev: live?.rev ?? 1 });
    }
    if (pathname === "/photos" && req.method() === "GET") {
      hits.photoList++;
      return json(200, { ids: workerNames });
    }
    return route.abort();
  });
  /* a handler that never connects to the server mocks the socket whole. `live` keeps each
     page-side socket, so a claim can push {rev} down it, and the ledger the GET answers with */
  await ctx.routeWebSocket(/.*/, (ws) => {
    live?.sockets.push(ws);
  });
  return hits;
}

/* Waits on the visible word "Lost", not on the tile's role or label: those are what
   a fix to the tile changes. A tile that never shows prints what the Worker was asked. */
async function openLostTile(page, { ledger = lostLedger(), workerNames = [] } = {}) {
  const hits = await mockWorker(page.context(), workerNames);
  /* The document that reads the ledger and the key also writes them, ahead of the app.
     Written before the reload, under load they were sometimes missing from the new
     document, which booted on the seed with no key. The script stays on this page: the
     lost tile is the last state each caller opens, and nothing navigates after it. */
  await page.addInitScript(
    ([ledgerKey, ledger, keyKey, key]) => {
      try {
        localStorage.setItem(ledgerKey, ledger);
        localStorage.setItem(keyKey, key);
      } catch {
        /* storage blocked: the page boots empty and the "Lost" wait reports it */
      }
    },
    [STORE_KEY, JSON.stringify(ledger), SYNC_KEY_STORAGE, LOST_DEVICE_KEY]
  );
  await page.reload();
  if (!(await loadedOk(page))) return false;
  if (!(await showView(page, "Orphaned"))) return false;
  try {
    await page.getByText("Lost", { exact: true }).first().waitFor({ timeout: 8000 });
  } catch {
    console.log(`note ${LOST_STATE}: no "Lost" tile after the survey; the Worker was asked ${JSON.stringify(hits)}`);
    return false;
  }
  return true;
}

/* Opens one state; false when it does not open, so the caller fails loudly. */
async function openScreenState(page, state) {
  if (state === LOST_STATE) return openLostTile(page);
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
  /* Each opener waits for the control it is for, so a state that opens empty
     fails here rather than passing on an empty page. */
  if (state === "Stamp editor open") {
    if (!(await showView(page, "Packages"))) return false;
    try {
      /* Beta Games is unstamped in both fixtures, so its bulk row has "Stamp" */
      await page.getByText("Beta Games", { exact: true }).first().click({ timeout: 3000 });
      await page.waitForTimeout(250);
      await page.getByRole("button", { name: "Stamp", exact: true }).first().click({ timeout: 3000 });
      await page.waitForSelector('input[aria-label="Stamp note"]', { timeout: 4000 });
    } catch {
      return false;
    }
    return true;
  }
  if (state === "Envelope composer open") {
    if (!(await showView(page, "Orphaned"))) return false;
    try {
      await page.getByRole("button", { name: "+ Record an envelope" }).click({ timeout: 3000 });
      await page.waitForSelector('input[aria-label="Card name"]', { timeout: 4000 });
    } catch {
      return false;
    }
    return true;
  }
  if (state === "Sync panel open") {
    if (!(await showView(page, "Ledger"))) return false;
    try {
      await page.locator("button", { hasText: /^Sync/ }).first().click({ timeout: 3000 });
      /* the key field renders only once hasKey() resolves, so wait for it */
      await page.waitForSelector('input[aria-label="Sync key"]', { timeout: 4000 });
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
   the drawn centre on each side. Then it taps 1px outside each side of that
   element and checks that no neighbour takes the tap. Serialised by Playwright,
   so self-contained. */
const measureTouch = ({ selector, half }) => {
  const isPinned = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "sticky" || p === "fixed") return true;
    }
    return false;
  };
  /* position: fixed only (claim 11, owner ruling 2026-10-14 08:10 CDT). A sticky
     control is not fixed, so its pairs are still checked. */
  const isFixed = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (getComputedStyle(n).position === "fixed") return true;
    }
    return false;
  };
  /* The control a hit belongs to. A label hands its tap to its field, so a
     label that grows its own hit area grows the field's (inputs take no
     pseudo-elements, so the label is the place to grow). */
  const ownerOf = (h) => {
    if (!h) return null;
    const own = h.closest(selector);
    if (own) return own;
    const lab = h.closest("label");
    return (lab && lab.control) || null;
  };
  const hitsTarget = (el, x, y) => ownerOf(document.elementFromPoint(x, y)) === el;
  /* A painted element is drawn by its border box. Otherwise only its contents
     are drawn, and a Range over them ignores padding. */
  const drawnBox = (el) => {
    const cs = getComputedStyle(el);
    const paints =
      cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      cs.backgroundImage !== "none" ||
      (cs.borderTopStyle !== "none" && parseFloat(cs.borderTopWidth) > 0) ||
      cs.boxShadow !== "none";
    let box = el.getBoundingClientRect();
    if (!paints) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rr = range.getBoundingClientRect();
      if (rr.width > 0 && rr.height > 0) box = rr;
    }
    return box;
  };
  /* Distance from a point to a box; 0 when the point is inside it. */
  const gapTo = (r, x, y) =>
    Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  const label = (el) =>
    `"${(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40)}" (${el.tagName.toLowerCase()})`;
  const els = [...document.querySelectorAll(selector)].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  });
  const overlaps = [];
  let probed = 0;
  const items = els.map((el, i) => {
    el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    /* every drawn box is read again after this scroll, for the overlap probe */
    const boxes = els.map((e) => drawnBox(e));
    const box = boxes[i];
    const pinned = isPinned(el);
    const elFixed = isFixed(el);
    const ex = el.getBoundingClientRect();
    /* whole-pixel centre and steps: a fractional sample just outside a box's top
       or left edge hits the box in this browser, which reads one px extra */
    const cx = Math.floor(ex.left + ex.width / 2);
    const cy = Math.floor(ex.top + ex.height / 2);
    const ext = { l: 0, r: 0, u: 0, d: 0 };
    /* the centre sample is the origin of both walks; it counts as one px only
       when the element itself is hit there */
    const centre = hitsTarget(el, cx, cy) ? 1 : 0;
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
    /* Overlap probe: a tap 1px outside any point of a side, corner to corner.
       It counts only when this element is strictly the nearest control to it,
       so the walk along a side stops at the gap midpoint. A tap inside another
       control's own border box counts for that control; only a tap a neighbour
       takes with a pseudo-element, outside its border box, is a finding. */
    const sideTaps = (side) => {
      const pts = [];
      const span = (a, b) => {
        const out = [];
        for (let t = a; t < b; t += 1) out.push(t);
        out.push(b);
        return out;
      };
      if (side === "top") for (const x of span(box.left, box.right)) pts.push([x, box.top - 1]);
      if (side === "bottom") for (const x of span(box.left, box.right)) pts.push([x, box.bottom + 1]);
      if (side === "left") for (const y of span(box.top, box.bottom)) pts.push([box.left - 1, y]);
      if (side === "right") for (const y of span(box.top, box.bottom)) pts.push([box.right + 1, y]);
      return pts;
    };
    const seen = new Set();
    for (const side of ["top", "bottom", "left", "right"]) {
      for (const [px, py] of sideTaps(side)) {
        if (px < 0 || py < 0 || px > window.innerWidth || py > window.innerHeight) continue;
        const d = gapTo(box, px, py);
        if (els.some((_, j) => j !== i && gapTo(boxes[j], px, py) <= d)) continue;
        const owner = ownerOf(document.elementFromPoint(px, py));
        /* claim 11 skips a pair where exactly one control is fixed: a fixed
           control's edge tap that lands on scrolling content, or the reverse.
           A skipped tap tests nothing, so it does not count toward probed. */
        if (owner && owner !== el && elFixed !== isFixed(owner)) continue;
        probed++;
        if (!owner || owner === el) continue;
        const lb = owner.getBoundingClientRect();
        if (px >= lb.left && px <= lb.right && py >= lb.top && py <= lb.bottom) continue;
        /* one line per side and neighbour, so a long edge does not flood the report */
        const k = `${side}|${owner.tagName}|${label(owner)}`;
        if (seen.has(k)) continue;
        seen.add(k);
        /* the neighbour's layout box and its drawn box, so a failure shows
           whether its padding or a pseudo-element took the tap */
        const db = drawnBox(owner);
        overlaps.push({
          side,
          of: label(el),
          hit: label(owner),
          x: Math.round(px * 10) / 10,
          y: Math.round(py * 10) / 10,
          layout: `${Math.round(lb.top * 10) / 10}-${Math.round(lb.bottom * 10) / 10}`,
          drawn: `${Math.round(db.top * 10) / 10}-${Math.round(db.bottom * 10) / 10}`,
        });
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
      hitX: ext.l + ext.r + centre,
      hitY: ext.u + ext.d + centre,
      offscreen,
    };
  });
  return { items, overlaps, probed };
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
      const { items, overlaps, probed } = await page.evaluate(measureTouch, {
        selector: TOUCH_SELECTOR,
        half: TOUCH_HALF_PX,
      });
      const measured = items.filter((it) => !it.offscreen);
      if (measured.length < items.length)
        console.log(`note ${stateName}: ${items.length - measured.length} target(s) at the viewport edge not measured`);
      const small = measured.filter((it) => it.hitX < 2 * TOUCH_HALF_PX || it.hitY < 2 * TOUCH_HALF_PX);
      if (small.length) {
        const list = small.map((it) => `"${it.text}" (${it.key.split("|")[1]}) ${it.hitX}x${it.hitY}px`);
        fail(stateName, `${small.length} of ${measured.length} targets under 44px: ${list.join("; ")}`);
      }
      if (!probed) fail(stateName, "the overlap probe tested no tap, so this state proves nothing about neighbours");
      if (overlaps.length) {
        const list = overlaps.slice(0, 4).map(
          (o) =>
            `${o.side} edge of ${o.of} at (${o.x}, ${o.y}) lands on ${o.hit} (its layout ${o.layout}, drawn ${o.drawn})`
        );
        fail(stateName, `${overlaps.length} tap(s) 1px outside a control land on a neighbour: ${list.join("; ")}`);
      }
      if (RECORD) {
        recorded[state] = {};
        for (const it of items) recorded[state][it.key] = { x: it.x, y: it.y, w: it.w, h: it.h, pinned: it.pinned };
        continue;
      }
      const want = base && base[state];
      if (!want) {
        fail(stateName, "no base boxes for this state; re-record with A11Y_RECORD=1 on the grid lane head (claim 10)");
        continue;
      }
      const wantByKey = Object.fromEntries(Object.entries(want).map(([k, v]) => [keyMasked(k), v]));
      if (Object.keys(wantByKey).length !== items.length) {
        fail(stateName, `${items.length} interactive elements, the base has ${Object.keys(wantByKey).length}`);
        continue;
      }
      const moved = [];
      for (const it of items) {
        const b = wantByKey[keyMasked(it.key)];
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
        fail(stateName, `${moved.length} drawn box(es) changed from the base; first: ${moved.slice(0, 3).join("; ")}`);
    }
    if (RECORD) {
      /* A11Y_RECORD_ONLY="<state>" writes that state alone and keeps the rest of
         the file, so one state can be re-recorded without moving the others. */
      const only = process.env.A11Y_RECORD_ONLY || "";
      if (only && !recorded[only]) fail(name, `A11Y_RECORD_ONLY names no state: "${only}"`);
      const prior = existsSync(BASE_BOXES) ? JSON.parse(readFileSync(BASE_BOXES, "utf8")) : {};
      const keep = { ...(prior["375"] || {}) };
      for (const [state, boxes] of Object.entries(recorded)) if (!only || state === only) keep[state] = boxes;
      writeFileSync(BASE_BOXES, JSON.stringify({ 375: keep }, null, 1) + "\n");
      const n = Object.entries(recorded).reduce((c, [s, b]) => (!only || s === only ? c + Object.keys(b).length : c), 0);
      console.log(`recorded ${n} base boxes to test/a11y-base-boxes.json`);
    }
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Claim 12 (L6): the six stamp kind chips at 375px touch. Runs in the page.
   Each chip's reach is walked from its drawn box in 0.25px steps, up and down
   the chip's centre column, stopping at the first point another control owns.
   Neighbours are the chips that share a horizontal span and sit directly above
   or below. The span, centring and midpoint checks allow a 0.25px tolerance
   (STAMP_TOL_PX). Measured cause: chip rows sit at fractional offsets (the
   chip at y=388.875), and Chromium rounds hit-tests near the gap midpoint, so
   up to 0.25px past the midpoint can return the farther chip (689 of 55,161
   samples at 0.125px steps). No CSS removes it, and a finger cannot aim that
   fine. Owner ruling 2026-10-13 22:20 CDT. */
const STAMP_CHIPS = 6;
const STAMP_TOL_PX = 0.25;
const CHIP_MIN_PX = 44;
const chipReach = (chipIndex) => {
  const chips = [...document.querySelectorAll("button.mdl-chip")];
  const c = chips[chipIndex];
  c.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  const rects = chips.map((el) => el.getBoundingClientRect());
  const r = rects[chipIndex];
  const cx = r.left + r.width / 2;
  const walk = (dir) => {
    let last = 0;
    for (let t = 0.25; t <= 40; t += 0.25) {
      const y = dir < 0 ? r.top - t : r.bottom + t;
      const h = document.elementFromPoint(cx, y);
      if (!h || h.closest("button") !== c) break;
      last = t;
    }
    return last;
  };
  const across = (o) => o.left < r.right && o.right > r.left;
  let above = null;
  let below = null;
  rects.forEach((o, j) => {
    if (j === chipIndex || !across(o)) return;
    if (o.bottom <= r.top + 0.5 && (above === null || o.bottom > rects[above].bottom)) above = j;
    if (o.top >= r.bottom - 0.5 && (below === null || o.top < rects[below].top)) below = j;
  });
  return {
    label: c.textContent.trim(),
    height: r.height,
    up: walk(-1),
    down: walk(1),
    gapUp: above === null ? null : r.top - rects[above].bottom,
    gapDown: below === null ? null : rects[below].top - r.bottom,
  };
};

async function stampChipCheck(browser) {
  const name = "stamp chips 375px";
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, 375, { touch: true });
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    if (!(await openScreenState(page, "Stamp editor open"))) {
      fail(name, "the Stamp editor did not open, so its chips cannot be measured");
      return;
    }
    await page.waitForTimeout(150);
    const count = await page.evaluate(() => document.querySelectorAll("button.mdl-chip").length);
    if (count !== STAMP_CHIPS) {
      fail(name, `${count} stamp chips, want ${STAMP_CHIPS}`);
      return;
    }
    /* a 0.25px tolerance, measured cause in the claim 12 header */
    const tol = STAMP_TOL_PX;
    for (let i = 0; i < STAMP_CHIPS; i++) {
      const c = await page.evaluate(chipReach, i);
      const span = c.height + c.up + c.down;
      if (span < CHIP_MIN_PX - tol)
        fail(name, `"${c.label}" hit is ${span.toFixed(1)}px tall, under ${CHIP_MIN_PX}px`);
      if (Math.abs(c.up - c.down) > tol)
        fail(name, `"${c.label}" hit is off centre: ${c.up.toFixed(1)}px up, ${c.down.toFixed(1)}px down`);
      if (c.gapUp !== null && c.up > c.gapUp / 2 + tol)
        fail(name, `"${c.label}" reaches ${c.up.toFixed(1)}px up, past the gap midpoint at ${(c.gapUp / 2).toFixed(1)}px`);
      if (c.gapDown !== null && c.down > c.gapDown / 2 + tol)
        fail(name, `"${c.label}" reaches ${c.down.toFixed(1)}px down, past the gap midpoint at ${(c.gapDown / 2).toFixed(1)}px`);
    }
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Claim 13 (L6, Sorted by top rule): on the Ledger tab at 375px touch, each tap on the
   painted 1px top rule of "Sorted by" lands on "Sorted by". Sampled every 0.25px
   down the rule and every 4px across the row, inset 2px from each end. */
async function ledgerRuleCheck(browser) {
  const name = "ledger rule 375px";
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, 375, { touch: true });
  try {
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    if (!(await showView(page, "Ledger"))) {
      fail(name, "the Ledger tab did not open");
      return;
    }
    await page.waitForTimeout(150);
    const res = await page.evaluate(() => {
      const row = [...document.querySelectorAll("button.mdl-lrow")].find((b) =>
        b.textContent.trim().startsWith("Sorted by")
      );
      if (!row) return { missing: true, taps: 0, misses: [] };
      row.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      const r = row.getBoundingClientRect();
      const misses = [];
      let taps = 0;
      for (let y = r.top; y < r.top + 1; y += 0.25) {
        for (let x = r.left + 2; x <= r.right - 2; x += 4) {
          taps++;
          const h = document.elementFromPoint(x, y);
          const b = h && h.closest("button");
          if (b !== row) misses.push(`(${x.toFixed(1)}, ${y.toFixed(2)}) lands on ${b ? b.textContent.trim().slice(0, 20) : "nothing"}`);
        }
      }
      return { missing: false, taps, misses };
    });
    if (res.missing) fail(name, 'no "Sorted by" row on the Ledger tab');
    else if (res.misses.length)
      fail(name, `${res.misses.length} of ${res.taps} taps on the "Sorted by" top rule go elsewhere; first: ${res.misses[0]}`);
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Claim 17 (owner ruling 2026-10-21 00:10 CDT, lane web/order-id-copy): the package
   header of Alpha's order A1 in a real browser, where jsdom has no layout, no mouse
   and no key that turns into a click.
     a. (orderIdTapSweep, 320px and 375px touch) the id link must not take a tap meant
        for something else. A real tap is a Chromium touch, and Chromium moves a tap
        that lands near a link onto the link (touch adjustment). elementFromPoint
        cannot see that move, so the round-2 probe of this claim read 0px while real
        taps 9px to 11px up the date line, and 6px under the header, opened
        TCGplayer (finding R2). So the sweep sends real touches through the DevTools
        protocol, with a 1px and a 12px contact radius, on a 1px grid (8px apart more
        than 32px from the link's area). It runs on Alpha stamped (a Stamp band under
        the header) and unstamped (the action row's Stamp and Mark all received
        buttons under it). The grid covers the drawn boxes of the seller name, the
        date line, the chevron and that row, less the link's own 45px touch area.
        Header whitespace is not swept: a tap there, within the contact radius of
        the link, is as likely meant for the link as for the header. Any swept tap
        whose click lands on the link fails. Clicks are stopped at the window so no
        tap changes the card, and any request to tcgplayer.com is aborted.
     b. (orderIdCheck, 375px touch and 760px) the chevron toggles while header text
        is selected (round-1 finding F1): a click (a tap at 375px) and Enter, each on
        an open and on a collapsed card, each flips the card once. The selection at
        the moment of the click is read by a capture listener. A click that arrives
        with no selection proves nothing about F1: that prints a `note`, and the case
        is reported unknown, not clear.
     c. (orderIdCheck, 760px) the Mac case: a mouse drag from the seller name into
        the date line selects text that holds "Alpha Cards" and leaves the card open.
        A plain click still collapses the card, and the next opens it.
   Nothing here clicks the id link on purpose: its click is group 75. The touch area
   of the link and of the chevron is claim 9's, and their overlap is claim 11's. Phone
   long-press selection and a Mac double-click or triple-click are unmeasured: no
   device in this run (debt header-gestures-unmeasured). */

/* Runs in the page. The seller name's text, selected. */
const selectSeller = () => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode())
    if (n.textContent.includes("Alpha Cards") && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) {
      const r = document.createRange();
      r.selectNodeContents(n);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      return String(getSelection());
    }
  return "";
};

/* Runs in the page. Where to press for the drag: the left edge of the seller
   name's text, and a point on the date line a little way in. Also the centre of
   the seller name, for the plain click. */
const headerDragPoints = () => {
  const textOf = (needle) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode())
      if (n.textContent.includes(needle) && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) return n;
    return null;
  };
  const rectOf = (n) => {
    const r = document.createRange();
    r.selectNodeContents(n);
    return r.getBoundingClientRect();
  };
  const seller = textOf("Alpha Cards");
  const meta = textOf("2026-07-01");
  if (!seller || !meta) return null;
  seller.parentElement.scrollIntoView({ block: "center", behavior: "instant" });
  const s = rectOf(seller);
  const m = rectOf(meta);
  return {
    x0: s.left + 1,
    y0: s.top + s.height / 2,
    x1: m.left + Math.min(40, m.width / 2),
    y1: m.top + m.height / 2,
    cx: s.left + Math.min(s.width / 2, 30),
    cy: s.top + s.height / 2,
  };
};

/* Runs in the page. Where Alpha's header parts are, for the tap sweep, and a window
   capture listener that notes every click as 1 (it landed on the id link) or 0, then
   stops it, so no tap toggles the card or opens the stamp editor and moves the
   layout under the next tap. The listener is on the window, not on an element, so it
   gives no element a click handler for Chromium's touch adjustment to find. The id
   link's touch area is the larger of its box and 45px, as claim 9's CSS grows it. */
const idTapGeometry = (stamped) => {
  const textOf = (needle) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode())
      if (n.textContent.includes(needle) && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) return n;
    return null;
  };
  const link = [...document.querySelectorAll("a")].find(
    (a) => /tcgplayer\.com/i.test(a.href) && a.textContent.trim() === "A1"
  );
  const seller = textOf("Alpha Cards")?.parentElement;
  const date = textOf("2026-07-01")?.parentElement;
  /* the control right under the header: the stamp band of a stamped order, else
     the Stamp button of the card's action row (the first one after the link) */
  const band = stamped
    ? document.querySelector('button[aria-label^="Edit stamp on Alpha Cards"]')
    : link &&
      [...document.querySelectorAll("button")].find(
        (b) => link.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING && b.textContent.trim() === "Stamp"
      );
  const chevron = document.querySelector('button[aria-expanded][aria-label*="Alpha Cards"]');
  if (!link || !seller || !date || !band || !chevron) return null;
  link.scrollIntoView({ block: "center", behavior: "instant" });
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  };
  const l = box(link);
  const w = Math.max(l.r - l.l, 45);
  const h = Math.max(l.b - l.t, 45);
  const cx = (l.l + l.r) / 2;
  const cy = (l.t + l.b) / 2;
  window.__idClicks = [];
  window.addEventListener(
    "click",
    (e) => {
      window.__idClicks.push(link.contains(e.target) ? 1 : 0);
      e.stopPropagation();
      e.preventDefault();
    },
    true
  );
  return {
    centre: [cx, cy],
    zone: { l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2 },
    seller: box(seller),
    date: box(date),
    band: box(band),
    chevron: box(chevron),
    vw: innerWidth,
  };
};

/* Claim 17a. Real touches, because Chromium moves a tap near a link onto the link
   and only a real tap shows it. Per contact radius, one batch of taps sent down the
   DevTools protocol without waiting for each (a tap costs a frame when awaited, and
   a 1px grid is some ten thousand taps). Every tap makes one click, in order, so the
   Nth click belongs to the Nth tap; a count or a control that does not match is
   reported as unknown, not clear. Control taps, on the middle of the link (its
   click must land on it) and at the far end of the control under the header (its
   click must not), sit among the sweep to show the clicks still line up with the
   taps. */
const ID_TAP_WIDTHS = [320, 375];
const ID_TAP_RADII = [1, 12];
/* a tap this near the link's area (or nearer) is probed at every px; farther out,
   every ID_TAP_FAR_PX, since a 12px contact reaches about 12px and the rest is slack */
const ID_TAP_NEAR_PX = 32;
const ID_TAP_FAR_PX = 8;
const ID_TAP_SENTINEL_EVERY = 250;
const STAMPED_LEDGER = { ...LEDGER, stamps: AXE_LEDGER.stamps };

async function orderIdTapSweep(browser, width, stamped) {
  const name = `order id taps ${width}px ${stamped ? "stamped" : "unstamped"}`;
  const below = stamped ? "Stamp band" : "action row";
  const { ctx, page, pageErrors } = await openSeeded(browser, width, { touch: true, ledger: stamped ? STAMPED_LEDGER : LEDGER });
  try {
    await ctx.route(/tcgplayer\.com/i, (route) => route.abort());
    if (!(await loadedOk(page))) {
      checks++;
      fail(name, "seeded ledger did not render");
      return;
    }
    if (!(await showView(page, "Packages"))) {
      checks++;
      fail(name, "the Packages tab did not open");
      return;
    }
    await page.waitForTimeout(250);
    const g = await page.evaluate(idTapGeometry, stamped);
    if (!g) {
      checks++;
      fail(name, `the id link, the seller name, the date line, the chevron or the ${below} of Alpha's header was not found`);
      return;
    }
    const cdp = await ctx.newCDPSession(page);
    const dispatch = (points, radius) =>
      Promise.all(
        points.flatMap(([x, y]) => [
          cdp.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x, y, radiusX: radius, radiusY: radius, force: 1, id: 1 }],
          }),
          cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }),
        ])
      );
    const { zone } = g;
    /* The drawn boxes of what a tap can mean other than the link: the seller name,
       the date line, the chevron, and the row under the header (the whole card
       width: the stamp band, or the action row's buttons). The whitespace of the
       header is not a box of its own, and a tap in it within the contact radius of
       the link is as likely meant for the link, so it is left out. */
    const boxes = [
      ["seller name", g.seller],
      ["date line", g.date],
      ["chevron", g.chevron],
      [below, { l: g.chevron.l, r: g.vw - g.chevron.l, t: g.band.t, b: g.band.b }],
    ];

    for (const radius of ID_TAP_RADII) {
      checks++;
      const label = `${radius}px contact radius`;
      /* a tap sits at (x + 0.5, y + 0.5), so each box keeps that point inside it */
      const sweep = [];
      for (const [region, b] of boxes)
        for (let y = Math.ceil(b.t - 0.5); y + 0.5 <= b.b; y++)
          for (let x = Math.ceil(b.l - 0.5); x + 0.5 <= b.r; ) {
            const inZone = x + 0.5 >= zone.l && x + 0.5 <= zone.r && y + 0.5 >= zone.t && y + 0.5 <= zone.b;
            if (!inZone) sweep.push({ pt: [x + 0.5, y + 0.5], region });
            x += x >= zone.l - ID_TAP_NEAR_PX && x <= zone.r + ID_TAP_NEAR_PX ? 1 : ID_TAP_FAR_PX;
          }
      /* sentinels: every ID_TAP_SENTINEL_EVERY taps, one on the middle of the link
         (its click must land on the link) and then one at the far end of the row under
         the header (its click must not). They show that clicks still line up with taps. */
      const farEnd = [g.vw - g.chevron.l - 6, (g.band.t + g.band.b) / 2];
      const sent = [];
      sweep.forEach((t, i) => {
        if (i % ID_TAP_SENTINEL_EVERY === 0) {
          const onLink = i % (2 * ID_TAP_SENTINEL_EVERY) === 0;
          sent.push({ pt: onLink ? g.centre : farEnd, want: onLink ? 1 : 0 });
        }
        sent.push({ pt: t.pt, want: null, region: t.region });
      });
      sent.push({ pt: g.centre, want: 1 });
      const t0 = Date.now();
      await dispatch(sent.map((t) => t.pt), radius);
      let settled = true;
      try {
        await page.waitForFunction((n) => window.__idClicks.length >= n, sent.length, { timeout: 20000 + 2 * sent.length });
      } catch {
        settled = false;
      }
      await page.waitForTimeout(100);
      const clicks = await page.evaluate(() => window.__idClicks.splice(0));
      if (!settled || clicks.length !== sent.length) {
        fail(name, `${label}: sent ${sent.length} taps and got ${clicks.length} clicks, so no click can be matched to its tap (unknown, not clear)`);
        continue;
      }
      const drift = sent.findIndex((t, i) => t.want !== null && clicks[i] !== t.want);
      if (drift >= 0) {
        fail(name, `${label}: the ${sent[drift].want ? "link-centre" : "far-end"} control tap ${drift} of ${sent.length} got click ${clicks[drift]}, want ${sent[drift].want}, so the clicks do not line up with the taps (unknown, not clear)`);
        continue;
      }
      const bad = sent.filter((t, i) => t.want === null && clicks[i]);
      console.log(
        `note ${name}: ${label}: ${bad.length} of ${sweep.length} taps meant for another control opened TCGplayer (${((Date.now() - t0) / 1000).toFixed(1)}s)`
      );
      if (bad.length) {
        const by = new Map();
        for (const { pt: [x, y], region } of bad) {
          const o = by.get(region) || { n: 0, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
          by.set(region, { n: o.n + 1, x0: Math.min(o.x0, x), x1: Math.max(o.x1, x), y0: Math.min(o.y0, y), y1: Math.max(o.y1, y) });
        }
        const parts = [...by].map(([k, o]) => `${k} ${o.n} (x ${o.x0} to ${o.x1}, y ${o.y0} to ${o.y1})`);
        fail(
          name,
          `${label}: ${bad.length} of ${sweep.length} taps meant for another control opened TCGplayer: ${parts.join("; ")}; ` +
            `the link's own area is x ${zone.l.toFixed(1)} to ${zone.r.toFixed(1)}, y ${zone.t.toFixed(1)} to ${zone.b.toFixed(1)}`
        );
      }
    }
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

async function orderIdCheck(browser, width) {
  const touch = width === 375;
  const name = `order id ${width}px`;
  checks++;
  const { ctx, page, pageErrors } = await openSeeded(browser, width, { touch });
  try {
    await ctx.route(/tcgplayer\.com/i, (route) => route.abort());
    if (!(await loadedOk(page))) {
      fail(name, "seeded ledger did not render");
      return;
    }
    if (!(await showView(page, "Packages"))) {
      fail(name, "the Packages tab did not open");
      return;
    }
    await page.waitForTimeout(250);
    const rowsOf = async () =>
      ((await page.evaluate(measureRows, { anchorText: "Alpha Cards", radius: CARD_RADIUS_PX })) || []).length;
    if ((await rowsOf()) < 3) {
      fail(name, "Alpha's card is not open with its lines at the start");
      return;
    }

    /* the id is the one link to tcgplayer.com (the sweep below taps near it) */
    const links = page.locator("a[href*='tcgplayer.com' i]", { hasText: /^\s*A1\s*$/ });
    if ((await links.count()) !== 1)
      fail(name, `want one link to tcgplayer.com whose text is the order id A1, found ${await links.count()}`);

    /* the chevron, with header text selected. One capture listener reads the
       selection at the moment of every click. */
    await page.evaluate(() => {
      window.__selAtClick = [];
      document.addEventListener("click", () => window.__selAtClick.push(String(getSelection())), true);
    });
    const chevron = page.locator('button[aria-expanded][aria-label*="Alpha Cards"]');
    if ((await chevron.count()) !== 1) {
      fail(name, `want one chevron button for Alpha's card, found ${await chevron.count()}`);
    } else {
      const toOpen = async (want) => {
        /* by the header text, so a broken chevron cannot set up its own case */
        if (((await rowsOf()) >= 3) === want) return;
        await page.evaluate(() => getSelection().removeAllRanges());
        const pts = await page.evaluate(headerDragPoints);
        if (!pts) return;
        if (touch) await page.touchscreen.tap(pts.cx, pts.cy);
        else await page.mouse.click(pts.cx, pts.cy);
        await page.waitForTimeout(150);
      };
      const acts = [
        [
          "Enter",
          async () => {
            await chevron.focus();
            await page.keyboard.press("Enter");
          },
        ],
        touch ? ["tap", () => chevron.tap({ timeout: 3000 })] : ["click", () => chevron.click({ timeout: 3000 })],
      ];
      for (const [how, act] of acts)
        for (const start of [true, false]) {
          const state = start ? "open" : "collapsed";
          const label = `a ${how} on the chevron of a ${state} card with the seller name selected`;
          await toOpen(start);
          if (((await rowsOf()) >= 3) !== start) {
            fail(name, `could not set the card ${state} by its header text, so ${label} was not run`);
            continue;
          }
          await page.evaluate(() => window.__selAtClick.splice(0));
          const picked = await page.evaluate(selectSeller);
          if (!picked.includes("Alpha Cards")) {
            fail(name, `could not select the seller name, so ${label} was not run`);
            continue;
          }
          await act();
          await page.waitForTimeout(150);
          const seen = await page.evaluate(() => window.__selAtClick.splice(0));
          const open = (await rowsOf()) >= 3;
          if (seen.length === 0) fail(name, `${label} sent no click`);
          else if (!seen.some((s) => s.includes("Alpha Cards")))
            console.log(`note ${name}: ${label} arrived with the selection already cleared (unknown: it cannot show finding F1)`);
          if (open === start) fail(name, `${label} left the card ${state}`);
        }
      await page.evaluate(() => getSelection().removeAllRanges());
    }

    /* the Mac case: drag-select the header text. Mouse only; no touch device here. */
    if (!touch) {
      await page.evaluate(() => getSelection().removeAllRanges());
      if ((await rowsOf()) < 3) {
        const p = await page.evaluate(headerDragPoints);
        if (p) await page.mouse.click(p.cx, p.cy);
        await page.waitForTimeout(150);
      }
      const pts = await page.evaluate(headerDragPoints);
      if (!pts) {
        fail(name, "the seller name or the date line of Alpha's header was not found");
      } else {
        await page.mouse.move(pts.x0, pts.y0);
        await page.mouse.down();
        await page.mouse.move(pts.x1, pts.y1, { steps: 8 });
        await page.mouse.up();
        await page.waitForTimeout(150);
        const picked = await page.evaluate(() => String(getSelection()));
        if (!picked.includes("Alpha Cards"))
          fail(name, `a mouse drag across Alpha's header selected ${JSON.stringify(picked.slice(0, 40))}, want text that holds "Alpha Cards"`);
        if ((await rowsOf()) < 3) fail(name, "a mouse drag that selected text in the header collapsed the card");
        /* each step starts from the state it needs, so one red step does not turn the next */
        const plainClick = async () => {
          await page.evaluate(() => getSelection().removeAllRanges());
          await page.mouse.click(pts.cx, pts.cy);
          await page.waitForTimeout(150);
        };
        if ((await rowsOf()) < 3) await plainClick();
        await plainClick();
        if ((await rowsOf()) !== 0) fail(name, "a plain click on the header no longer collapses the card");
        await plainClick();
        if ((await rowsOf()) < 3) fail(name, "a second plain click on the header does not open the card again");
      }
    }
    for (const e of pageErrors) fail(name, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Claim 14 (decision spacing-on-4px-grid): the grid and the 8px card corner.
   The card surface is C.card (#FCF6EA). GRID_EXEMPT names each element the
   brief puts out of scope, with its reason. It is empty: no offender at the
   lane head is out of scope, and none is a UA default. */
const CARD_BG = "rgb(252, 246, 234)";
const GRID_STEP_PX = 4;
const CARD_RADIUS_PX = 8;
const GRID_EXEMPT = [];

/* Runs in the page. Reads each visible element's spacing as used px, so margin
   and padding come back as px, and "auto" is read from the computed style map. */
const gridProbe = ({ exempt, cardBg, step, radius }) => {
  const EPS = 0.01;
  const SPACING = [
    "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding-top", "padding-right", "padding-bottom", "padding-left",
    "row-gap", "column-gap",
  ];
  const CORNERS = [
    "border-top-left-radius", "border-top-right-radius",
    "border-bottom-right-radius", "border-bottom-left-radius",
  ];
  const describe = (el) => {
    const cls = [...el.classList].map((c) => "." + c).join("");
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return el.tagName.toLowerCase() + cls + (text ? ` "${text}"` : "");
  };
  const out = {
    visible: 0,
    cards: 0,
    coarse: matchMedia("(pointer: coarse)").matches,
    offenders: [],
    badRadius: [],
  };
  for (const el of [document.body, ...document.body.querySelectorAll("*")]) {
    if (!el.checkVisibility({ visibilityProperty: true })) continue;
    out.visible++;
    const cs = getComputedStyle(el);
    const map = el.computedStyleMap();
    if (el.tagName === "DIV" && cs.backgroundColor === cardBg && parseFloat(cs.borderTopWidth) === 1) {
      out.cards++;
      const bad = CORNERS.map((p) => cs.getPropertyValue(p)).filter(
        (v) => Math.abs(parseFloat(v) - radius) > EPS
      );
      if (bad.length) out.badRadius.push(`${describe(el)} corners ${bad.join("/")}`);
    }
    if (exempt.some((sel) => el.matches(sel))) continue;
    for (const prop of SPACING) {
      const kw = map.get(prop);
      if (kw && kw.value === "auto") continue;
      const raw = cs.getPropertyValue(prop);
      const v = raw === "normal" ? 0 : parseFloat(raw);
      const onGrid = !Number.isNaN(v) && Math.abs(v - Math.round(v / step) * step) <= EPS;
      if (!onGrid) out.offenders.push(`${describe(el)} ${prop} ${raw}`);
    }
  }
  return out;
};

/* 375px and 760px, plus 375px touch: the pointer: coarse block in the stylesheet
   sets its own spacing, so a plain pass would miss it. */
async function gridCheck(browser, { width, touch = false }) {
  const tag = `${width}px${touch ? " touch" : ""}`;
  const { ctx, page, pageErrors } = await openSeeded(browser, width, { touch, ledger: AXE_LEDGER });
  try {
    if (!(await loadedOk(page))) {
      fail(`grid ${tag}`, "seeded ledger did not render; no state can be measured");
      return;
    }
    const exempt = GRID_EXEMPT.map((e) => e.sel);
    for (const state of SCREEN_STATES) {
      const name = `grid ${tag} ${state}`;
      checks++;
      if (!(await openScreenState(page, state))) {
        fail(name, "the state did not open, so it cannot be measured");
        continue;
      }
      await page.waitForTimeout(150);
      const res = await page.evaluate(gridProbe, {
        exempt,
        cardBg: CARD_BG,
        step: GRID_STEP_PX,
        radius: CARD_RADIUS_PX,
      });
      if (touch && !res.coarse) fail(name, "the touch context does not match (pointer: coarse)");
      if (res.cards === 0) fail(name, "no card found, so the radius half cannot pass");
      const offenders = [...new Set(res.offenders)];
      if (res.offenders.length)
        fail(
          name,
          `${res.offenders.length} off-grid spacing values, ${offenders.length} distinct: ${offenders.slice(0, 8).join("; ")}`
        );
      if (res.badRadius.length)
        fail(
          name,
          `${res.badRadius.length} of ${res.cards} cards not ${CARD_RADIUS_PX}px: ${res.badRadius.slice(0, 4).join("; ")}`
        );
    }
    for (const e of pageErrors) fail(`grid ${tag}`, `page error: ${e}`);
  } finally {
    await ctx.close();
  }
}

/* Claim 16 (invariant no-layout-shift-under-pointer; owner ruling 2026-10-20 23:36 CDT). The
   ledger is lean (no archive) so the page loads fast. The server copy adds two Omega orders that
   sort above every existing row in both views (Packages by $ remaining, Tally by position), dated
   inside the fixture's custom range, so the rows the owner looks at are pushed down unless the
   page corrects for it. The row the pointer is on is Counterspell in Epsilon's package, and the
   Path to Exile header in Tally. */
const SYNC16_LEDGER = { ...LEDGER, items: ITEMS };
const SYNC16_SERVER = {
  ...SYNC16_LEDGER,
  items: [
    ...ITEMS,
    ...mk("X1", "Omega Trading", "2026-08-15", "with tracking", [
      ["Sol Ring Prime", 2, 450],
      ["Mana Crypt Prime", 1, 600],
    ]),
    ...mk("X2", "Omega Outlet", "2026-08-16", "without tracking", [["Sol Ring Prime", 1, 450]]),
  ],
};
const SYNC16_LANDED_MS = 1500; /* "within about a second", plus the mocked round trips */
const SYNC16_LATE_MS = 13000; /* long enough for the ten-second wait to end, so 16b can still measure */
const SYNC16_CASES = [
  ...WIDTHS.flatMap((width) => [
    { view: "Packages", width, touch: false, card: "Epsilon Cards", title: "Counterspell", fresh: "Omega Trading" },
    { view: "Tally", width, touch: false, title: "Path to Exile", fresh: "Sol Ring Prime" },
  ]),
  { view: "Packages", width: 375, touch: true, card: "Epsilon Cards", title: "Counterspell", fresh: "Omega Trading" },
  { view: "Tally", width: 375, touch: true, title: "Path to Exile", fresh: "Sol Ring Prime" },
];

/* Runs in the page. Finds the target row by its words, never by an attribute the build might add,
   and reports where it is. `point`, when given, is the pointer: does the row still sit under it? */
const syncRowProbe = ({ view, card, title, point, scroll }) => {
  let el = null;
  if (view === "Packages") {
    let c = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(card));
    while (c && !/border-radius:\s*8px/.test(c.getAttribute("style") || "")) c = c.parentElement;
    el =
      c &&
      [...c.querySelectorAll('div[style*="--i"][style*="border-top"]')].find(
        (r) => (r.querySelector('div[style*="font-weight: 600"]') || r).textContent.trim() === title
      );
  } else {
    el = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(title));
  }
  if (!el) return null;
  if (scroll) el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  const hit = point ? document.elementFromPoint(point.x, point.y) : null;
  return { top: r.top, cx: r.left + r.width / 2, cy: r.top + r.height / 2, underPointer: !!(hit && el.contains(hit)) };
};

async function syncApplyCheck(browser, { view, width, touch, card, title, fresh }) {
  const name = `syncapply ${view} ${width}px${touch ? " touch" : " mouse"}`;
  const live = { ledger: null, rev: 1, sockets: [] };
  const { ctx, page, pageErrors } = await openSeeded(browser, width, { touch, ledger: SYNC16_LEDGER });
  try {
    await mockWorker(ctx, [], live);
    await page.evaluate(
      ([k, key]) => localStorage.setItem(k, key),
      [SYNC_KEY_STORAGE, LOST_DEVICE_KEY]
    );
    await page.reload();
    if (!(await loadedOk(page))) {
      fail(name, "the seeded ledger did not render, so nothing can be measured");
      return;
    }
    /* Chromium keeps the row still by itself; whether the owner's WebKit does is unmeasured. Off, so
       what is measured is the page's own correction. */
    await page.addStyleTag({ content: "*, *::before, *::after { overflow-anchor: none !important; }" });
    if (view !== "Packages" && !(await showView(page, view))) {
      fail(name, `no tab opens ${view}`);
      return;
    }
    /* the cold open's GET, POST and photo survey all settle first, so nothing but the push moves the page */
    await page.waitForTimeout(2500);
    for (let i = 0; i < 20 && !live.sockets.length; i++) await page.waitForTimeout(100);
    checks++;
    if (!live.sockets.length) {
      fail(name, "the page never opened its socket, so no rev can be pushed");
      return;
    }
    const spec = { view, card, title };
    const seen = await page.evaluate(syncRowProbe, { ...spec, scroll: true });
    if (!seen) {
      fail(name, `no "${title}" row to look at before the push`);
      return;
    }
    await page.waitForTimeout(200);
    const at = await page.evaluate(syncRowProbe, spec);
    if (!touch) {
      await page.mouse.move(at.cx - 20, at.cy - 10);
      await page.mouse.move(at.cx, at.cy, { steps: 4 });
      await page.waitForTimeout(150);
    }
    const point = { x: at.cx, y: at.cy };
    const before = await page.evaluate(syncRowProbe, { ...spec, point });
    if (!before?.underPointer) {
      fail(name, `the "${title}" row is not under the probe point before the push, so the fixture cannot test it`);
      return;
    }
    live.ledger = SYNC16_SERVER;
    live.rev = 2;
    live.sockets[0].send(JSON.stringify({ rev: 2 }));
    const landedBy = (ms) =>
      page
        .waitForFunction((t) => document.body.textContent.includes(t), fresh, { timeout: ms })
        .then(() => true, () => false);
    checks++;
    const quick = await landedBy(SYNC16_LANDED_MS);
    if (!quick) fail(`${name} 16a`, `the reply was not applied within ${SYNC16_LANDED_MS} ms with the ${touch ? "page untouched" : "mouse at rest"}`);
    if (!quick && !(await landedBy(SYNC16_LATE_MS - SYNC16_LANDED_MS))) {
      fail(`${name} 16b`, `the reply was not applied within ${SYNC16_LATE_MS} ms, so the row cannot be measured`);
      return;
    }
    await page.waitForTimeout(400);
    const after = await page.evaluate(syncRowProbe, { ...spec, point });
    checks++;
    if (!after) fail(`${name} 16b`, `the "${title}" row is gone after the apply`);
    else {
      const shift = after.top - before.top;
      if (Math.abs(shift) > TAP_TOLERANCE_PX)
        fail(`${name} 16b`, `the "${title}" row moved ${shift.toFixed(1)}px when the reply landed`);
      else if (!touch && !after.underPointer)
        fail(`${name} 16b`, `the "${title}" row is no longer under the pointer after the reply landed`);
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
    const syncApplyPhases = SYNC16_CASES.map((c) => () => syncApplyCheck(browser, c));
    const phases = process.env.SCREENS_ONLY === "16"
      ? syncApplyPhases
      : RECORD
      ? [() => touchCheck(browser)]
      : [
      () => overflowChecks(browser),
      ...WIDTHS.map((width) => () => lostTileOverflow(browser, width)),
      ...WIDTHS.map((width) => () => lostTileSize(browser, width)),
      ...WIDTHS.map((width) => () => axeCheck(browser, width)),
      () => touchCheck(browser),
      () => stampChipCheck(browser),
      () => ledgerRuleCheck(browser),
      ...WIDTHS.map((width) => () => barCheck(browser, width)),
      ...WIDTHS.map((width) => () => ledgerCheck(browser, width)),
      ...WIDTHS.map((width) => () => syncPanelCheck(browser, width)),
      ...WIDTHS.map((width) => () => gridCheck(browser, { width })),
      () => gridCheck(browser, { width: 375, touch: true }),
      ...WIDTHS.map((width) => () => orderIdCheck(browser, width)),
      ...ID_TAP_WIDTHS.flatMap((width) =>
        [false, true].map((stamped) => () => orderIdTapSweep(browser, width, stamped))
      ),
      ...ROW_SHIFT_CARDS.flatMap((card) =>
        WIDTHS.map((width) => () => rowShiftCheck(browser, { ...card, width }))
      ),
      () => discardArmCheck(browser),
      ...RESET_VIEWS.map((view) => () => resetAskCheck(browser, view)),
      () => freshVisitorCheck(browser),
      ...syncApplyPhases,
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
