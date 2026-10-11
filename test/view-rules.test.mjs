/* Contract tests for src/view-rules.mjs, the pure view rules that lane S2 moves
   out of src/app.jsx. Run: npm run test:view-rules. Exits 1 on any failure.

   No DOM and no harness: every case is a direct call, so JavaScriptCore can
   run the same module later (rules-run-in-javascriptcore). Each case is taken
   from behaviour test/app.test.mjs already proves. The case notes name the
   group. Ids are V<group>.<case>.

   The module is loaded dynamically. A missing or broken module fails every
   case on an assertion, never on an import error that stops the file. */

const DAY = 86400000;
const loaded = await import("../src/view-rules.mjs").then(
  (m) => m,
  (e) => {
    console.log(`module did not load: ${e.message.split("\n")[0]}`);
    return {};
  }
);
const fn = (name) => (typeof loaded[name] === "function" ? loaded[name] : () => undefined);
const parseItems = fn("parseItems");
const lostMail = fn("lostMail");
const normName = fn("normName");
const groupPackages = fn("groupPackages");
const matchEnvelope = fn("matchEnvelope");
const rankCandidates = fn("rankCandidates");
const isUntracked = fn("isUntracked");

/* ---------- assertion helpers ---------- */

let pass = 0;
const fails = [];

/* key order does not matter; Sets are compared as sorted arrays */
function norm(v) {
  if (v instanceof Set) return [...v].sort();
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, norm(v[k])]));
  return v;
}
const show = (v) => JSON.stringify(norm(v)) ?? "undefined";

function eq(actual, expected, id) {
  if (show(actual) === show(expected)) pass++;
  else fails.push(`${id}\n     expected ${show(expected)}\n     actual   ${show(actual)}`);
}
function ok(cond, id) {
  if (cond) pass++;
  else fails.push(`${id}\n     expected true\n     actual   false`);
}

/* ---------- fixtures, shaped as parseItems returns them ---------- */

const item = (orderId, seller, name, qty, date, tracking, n) => ({
  key: `${orderId}|${n}|p${name}`,
  orderId,
  seller,
  name,
  set: "Test Set",
  condition: "Near Mint",
  finish: "",
  qty,
  price: 1,
  date,
  tracking,
  line: "Magic",
});
/* the same shape as test/harness.mjs ITEMS: item keys are orderId|index|p<name> */
const group = (orderId, seller, date, tracking, rows) =>
  rows.map(([name, qty], n) => item(orderId, seller, name, qty, date, tracking, n));
const FIX = [
  ...group("A1", "Alpha Cards", "2026-07-01", "without tracking", [
    ["Lightning Bolt", 1],
    ["Counterspell", 1],
    ["Brainstorm", 2],
  ]),
  ...group("B1", "Beta Games", "2026-07-02", "without tracking", [
    ["Lightning Bolt", 1],
    ["Counterspell", 1],
    ["Brainstorm", 2],
  ]),
  ...group("C1", "Gamma Cards", "2026-06-01", "with tracking", [
    ["Lightning Bolt", 1],
    ["Path to Exile", 1],
    ["Swords to Plowshares", 1],
    ["Ponder", 1],
    ["Preordain", 1],
  ]),
  ...group("D1", "Delta Cards", "2026-05-01", "without tracking", [["Urza's Saga", 1]]),
];

/* a package literal, built here so the match tests do not depend on groupPackages */
const pkgOf = (orderId) => {
  const items = FIX.filter((i) => i.orderId === orderId);
  const h = items[0];
  return {
    gk: `${h.orderId}::${h.seller}`,
    orderId: h.orderId,
    seller: h.seller,
    date: h.date,
    tracking: h.tracking,
    items,
  };
};
const ALPHA = pkgOf("A1");
const BETA = pkgOf("B1");
const GAMMA = pkgOf("C1");
const DELTA = pkgOf("D1");
const ALL = [ALPHA, BETA, GAMMA, DELTA];

const env = (...pairs) => pairs.map(([name, qty]) => ({ name, qty }));
const gksOf = (r) => (Array.isArray(r?.list) ? r.list.map((c) => c.pkg.gk).sort() : r);
const planOf = (m) =>
  Array.isArray(m?.plan) ? m.plan.map((p) => `${p.itemKey}=${p.take}`).sort() : m?.plan;
const ago = (days) => new Date(Date.now() - days * DAY).toISOString();

/* ── V1. the CSV parser keeps only TCG purchases (invariant parser-filters) ─ */
/* source: test/app.test.mjs groups 46 and 29 */

const TCG = {
  "Order Id": "P1",
  Type: "purchase",
  Vendor: "TCGplayer",
  "Product Name": "Kept TCG Card",
  Party: "Alpha Cards",
  "Item Number": "7",
  "Vendor Product Id": "pK",
  "Set Name": "Test Set",
  Condition: "Near Mint",
  Finish: "Foil",
  Quantity: "2",
  Price: "2.00",
  "Ordered At": "2026-07-01",
  "Shipping Status": "without tracking",
  "Product Line": "Magic",
};
const BLANK = { "Order Id": "P2", Vendor: "", "Product Name": "Kept Blank Vendor Card", Price: "2.50" };
/* no Type column, so only the vendor filter can reject it */
const EBAY = { "Order Id": "P3", Vendor: "eBay", "Product Name": "Rejected eBay Card", Price: "3.00" };
const OTHER = { "Order Id": "P5", Vendor: "CardMarket", "Product Name": "Rejected Other Vendor Card", Price: "5.00" };
/* a TCG row, so only the type filter can reject it */
const SALE = { "Order Id": "P4", Type: "sale", Vendor: "TCGplayer", "Product Name": "Rejected Sale Card", Price: "4.00" };
const ENTITY = { "Order Id": "E1", Party: "LT's Hobbies&amp;Games2", "Product Name": "Mox Diamond", Price: "5.00" };

const names = (rows) => (Array.isArray(rows) ? rows.map((r) => r.name) : rows);

eq(
  names(parseItems([TCG, BLANK, EBAY, SALE, OTHER, ENTITY])),
  ["Kept TCG Card", "Kept Blank Vendor Card", "Mox Diamond"],
  "V1.1 of five rows only the TCG, blank-vendor and entity rows are kept"
);
eq(names(parseItems([EBAY])), [], "V1.2 an eBay row is rejected by the vendor filter alone");
eq(names(parseItems([OTHER])), [], "V1.3 a non-TCG vendor is rejected");
eq(names(parseItems([SALE])), [], "V1.4 a sale row is rejected by the type filter alone");
eq(names(parseItems([BLANK])), ["Kept Blank Vendor Card"], "V1.5 a blank Vendor is kept, per the owner's ruling");
eq(
  parseItems([TCG])?.[0],
  {
    key: "P1|7|pK",
    orderId: "P1",
    seller: "Alpha Cards",
    name: "Kept TCG Card",
    set: "Test Set",
    condition: "Near Mint",
    finish: "Foil",
    qty: 2,
    price: 2,
    date: "2026-07-01",
    tracking: "without tracking",
    line: "Magic",
  },
  "V1.6 a TCG purchase keeps every field, with qty read as a number"
);
eq(
  parseItems([ENTITY])?.[0]?.seller,
  "LT's Hobbies&Games2",
  "V1.7 an entity in the seller name is decoded before it is kept"
);
/* blank-name rule: a row with no product name is dropped, whatever its vendor */
eq(
  names(parseItems([{ ...TCG, "Product Name": "   " }, { ...TCG, "Product Name": undefined }])),
  [],
  "V1.8 a row whose product name is blank or missing is dropped"
);
/* TCGplayer Direct quirk: "Sold by X" in Set Name is blanked. Only that prefix. */
eq(parseItems([{ ...TCG, "Set Name": "Sold by Alpha Cards" }])?.[0]?.set, "", "V1.9 a Sold by set name is blanked");
eq(parseItems([{ ...TCG, "Set Name": "SOLD BY beta" }])?.[0]?.set, "", "V1.10 the Sold by match ignores case");
eq(parseItems([{ ...TCG, "Set Name": "Sold Out Edition" }])?.[0]?.set, "Sold Out Edition", "V1.11 a set name that only starts with sold is kept");

/* ── V2. lost-mail flags count from the order date (lost-mail-flags-use-order-date) ─ */
/* source: test/app.test.mjs group 37 (37.11, 37.12) and the untracked-only rule */

eq(lostMail(ago(30.5), "without tracking", false), { tier: "deadline", days: 30 }, "V2.1 thirty days untracked and unreceived is the deadline tier");
eq(lostMail(ago(20.5), "without tracking", false), { tier: "maybe", days: 20 }, "V2.2 twenty days is the maybe tier");
eq(lostMail(ago(13.5), "without tracking", false), null, "V2.3 under fourteen days raises nothing");
eq(lostMail(ago(35), "without tracking", true), null, "V2.4 a received or stamped order raises nothing");
eq(lostMail(ago(35), "with tracking", false), null, "V2.5 a tracked package raises nothing");
eq(lostMail("not a date", "without tracking", false), null, "V2.6 an unreadable order date raises nothing");

/* fixed clock: lostMail reads Date.now, so the boundary is set, not raced.
   CSV dates are date-only, which Date.parse reads as UTC midnight. */
const withClock = (iso, run) => {
  const real = Date.now;
  Date.now = () => Date.parse(iso);
  try {
    return run();
  } finally {
    Date.now = real;
  }
};
const at = (iso, date, tracking = "without tracking", done = false) =>
  withClock(iso, () => lostMail(date, tracking, done));
const NOON_CLOCK = "2026-07-15T00:00:00Z";
eq(at(NOON_CLOCK, "2026-07-02"), null, "V2.7 thirteen days raises nothing");
eq(at(NOON_CLOCK, "2026-07-01"), { tier: "maybe", days: 14 }, "V2.8 exactly fourteen days is the maybe tier");
eq(at(NOON_CLOCK, "2026-06-16"), { tier: "maybe", days: 29 }, "V2.9 twenty-nine days is still the maybe tier");
eq(at(NOON_CLOCK, "2026-06-15"), { tier: "deadline", days: 30 }, "V2.10 exactly thirty days is the deadline tier");
eq(
  at("2026-07-15T12:00:00Z", "2026-07-01"),
  { tier: "maybe", days: 14 },
  "V2.11 a partial day counts down, so 14.5 days reads as 14"
);
/* isUntracked is the same rule lostMail reads: untracked means exactly "without tracking" */
eq(isUntracked({ tracking: "without tracking" }), true, "V2.12 without tracking is untracked");
eq(isUntracked({ tracking: "Without Tracking" }), true, "V2.13 the untracked match ignores case");
eq(isUntracked({ tracking: "with tracking" }), false, "V2.14 with tracking is not untracked");
eq(isUntracked({ tracking: "unknown" }), false, "V2.15 an unknown status is not untracked");
eq(isUntracked({ tracking: "canceled" }), false, "V2.16 a canceled status is not untracked");
eq(isUntracked({}), false, "V2.17 a package with no tracking field is not untracked");

/* ── V3. names match loosely (envelope-names-match-normname) ───────────── */
/* source: test/app.test.mjs group 8 (smart apostrophe) and group 25 (Æther, Séance) */

eq(normName("Urza’s Saga"), "urza s saga", "V3.1 a curly apostrophe folds to a space");
eq(normName("Urza's Saga"), "urza s saga", "V3.2 the straight apostrophe folds to the same name");
eq(normName("Séance"), "seance", "V3.3 an accent is removed");
eq(normName("Jötun"), "jotun", "V3.4 a diaeresis is removed");
eq(normName("Fire // Ice"), "fire ice", "V3.5 a split card name collapses");
eq(normName(null), "", "V3.6 a missing name is an empty string");

/* ── V4. packages group by order and seller (packages-group-by-order-seller) ─ */
/* source: test/app.test.mjs groups 3, 37 and the Packages view order */

const pk = groupPackages(FIX);
eq(
  Array.isArray(pk) ? pk.map((p) => p.gk) : pk,
  ["B1::Beta Games", "A1::Alpha Cards", "C1::Gamma Cards", "D1::Delta Cards"],
  "V4.1 packages sort by date, newest first"
);
eq(
  pk?.[1]?.items?.map((i) => i.name),
  ["Brainstorm", "Counterspell", "Lightning Bolt"],
  "V4.2 the items in a package sort by name"
);
eq(
  pk?.[2],
  {
    gk: "C1::Gamma Cards",
    orderId: "C1",
    seller: "Gamma Cards",
    date: "2026-06-01",
    tracking: "with tracking",
    items: [...GAMMA.items].sort((a, b) => a.name.localeCompare(b.name)),
  },
  "V4.3 a package carries its order, seller, date and tracking"
);
eq(
  groupPackages([
    item("X1", "Seller One", "Ponder", 1, "2026-07-01", "without tracking", 0),
    item("X1", "Seller Two", "Ponder", 1, "2026-07-01", "without tracking", 0),
  ])?.map((p) => p.gk),
  ["X1::Seller One", "X1::Seller Two"],
  "V4.4 one order from two sellers is two packages"
);
/* same order date: the seller name breaks the tie, whatever the input order */
eq(
  groupPackages([
    item("S2", "Seller Two", "Ponder", 1, "2026-07-01", "without tracking", 0),
    item("S1", "Seller One", "Ponder", 1, "2026-07-01", "without tracking", 0),
  ])?.map((p) => p.gk),
  ["S1::Seller One", "S2::Seller Two"],
  "V4.5 packages on one order date sort by seller name"
);

/* ── V5. what an envelope explains about one package (matchEnvelope) ───── */
/* source: test/app.test.mjs groups 3, 4, 6, 7 and 33 (counts take the max) */

const gammaFour = matchEnvelope(
  env(["Path to Exile", 1], ["Swords to Plowshares", 1], ["Ponder", 1], ["Lightning Bolt", 1]),
  GAMMA,
  {}
);
eq(gammaFour?.matchedQty, 4, "V5.1 four envelope cards explain four of Gamma's cards");
eq(gammaFour?.entriesTotal, 4, "V5.2 the envelope holds four cards");
eq(gammaFour?.poolTotal, 5, "V5.3 Gamma still owes five cards before the match");
eq(
  gammaFour?.perEntry,
  { "path to exile": 1, "swords to plowshares": 1, ponder: 1, "lightning bolt": 1 },
  "V5.4 perEntry is keyed by normName"
);
eq(
  planOf(gammaFour),
  [
    "C1|0|pLightning Bolt=1",
    "C1|1|pPath to Exile=1",
    "C1|2|pSwords to Plowshares=1",
    "C1|3|pPonder=1",
  ],
  "V5.5 the plan names the exact item keys and takes"
);

const alphaPartial = matchEnvelope(env(["Lightning Bolt", 1], ["Counterspell", 1], ["Sol Ring", 1]), ALPHA, {});
eq(alphaPartial?.matchedQty, 2, "V5.6 a partial envelope matches only what Alpha holds");
eq(alphaPartial?.entriesTotal, 3, "V5.7 the entries total still counts the unmatched card");
eq(alphaPartial?.perEntry, { "lightning bolt": 1, counterspell: 1 }, "V5.8 an unmatched name is not in perEntry");

eq(
  matchEnvelope(env(["Lightning Bolt", 1]), ALPHA, { "A1|0|pLightning Bolt": 1 })?.matchedQty,
  0,
  "V5.9 a copy already checked in is not outstanding"
);
eq(
  matchEnvelope(env(["Brainstorm", 2]), ALPHA, {})?.matchedQty,
  2,
  "V5.10 two lines of one name pool into one match of two"
);
eq(
  matchEnvelope(env(["Brainstorm", 2]), ALPHA, { "A1|2|pBrainstorm": 1 })?.matchedQty,
  1,
  "V5.11 a partly received line keeps its rest outstanding"
);

/* ── V6. candidates rank and never decide (rankCandidates) ─────────────── */
/* source: test/app.test.mjs groups 3, 6, 7, 11, 15 and 37.70 */

const E1 = env(["Path to Exile", 1], ["Swords to Plowshares", 1], ["Ponder", 1], ["Lightning Bolt", 1]);
const r1 = rankCandidates(E1, ALL, {});
eq(
  gksOf(r1),
  ["A1::Alpha Cards", "B1::Beta Games", "C1::Gamma Cards"],
  "V6.1 the four-card envelope offers Gamma, Alpha and Beta, and never Delta"
);
eq(r1?.list?.[0]?.pkg?.gk, "C1::Gamma Cards", "V6.2 the package explaining the most ranks first");
eq(
  r1?.list?.[0] && {
    matchedQty: r1.list[0].matchedQty,
    pkgLeft: r1.list[0].pkgLeft,
    envLeft: r1.list[0].envLeft,
    exact: r1.list[0].exact,
  },
  { matchedQty: 4, pkgLeft: 1, envLeft: 0, exact: false },
  "V6.3 Gamma explains 4 of 4, owes 1 more, and is not an exact fit"
);
eq(r1?.tied, 1, "V6.4 a unique top candidate is not a tie");
eq(
  r1?.explainable,
  new Set(["path to exile", "swords to plowshares", "ponder", "lightning bolt"]),
  "V6.5 every envelope name some candidate can explain"
);

const E2 = env(["Lightning Bolt", 1], ["Sol Ring", 1]);
const r2 = rankCandidates(E2, ALL, {});
eq(r2?.tied, 2, "V6.6 Alpha and Beta fit equally well, so the tie is reported");
eq(r2?.explainable, new Set(["lightning bolt"]), "V6.7 Sol Ring has no outstanding copy and is not explainable");

const E3 = env(["Brainstorm", 2]);
const r3 = rankCandidates(E3, ALL, {});
eq(gksOf(r3), ["A1::Alpha Cards", "B1::Beta Games"], "V6.8 two identical packages are both offered");
eq(r3?.tied, 2, "V6.9 the two identical packages are one tie");
eq(
  r3?.list?.[0] && { matchedQty: r3.list[0].matchedQty, pkgLeft: r3.list[0].pkgLeft },
  { matchedQty: 2, pkgLeft: 2 },
  "V6.10 each tied package explains the whole envelope and reports its leftover"
);

const E4 = env(["Lightning Bolt", 1]);
eq(
  gksOf(rankCandidates(E4, ALL, { "C1|0|pLightning Bolt": 1 })),
  ["A1::Alpha Cards", "B1::Beta Games"],
  "V6.11 a copy Gamma already checked in removes Gamma from the candidates"
);

const E5 = env(["Brainstorm", 2], ["Counterspell", 1], ["Lightning Bolt", 1]);
const r5 = rankCandidates(E5, ALL, {});
ok(r5?.list?.[0]?.exact === true, "V6.12 an envelope that fills a package exactly is marked exact");

/* tie count: a tie needs the same matchedQty AND the same pkgLeft. envLeft is
   not a separate key: entriesTotal is fixed per envelope, so envLeft is a
   function of matchedQty and can never split a tie on its own. */
const mkPkg = (orderId, seller, rows, date = "2026-07-01", tracking = "without tracking") => ({
  gk: `${orderId}::${seller}`,
  orderId,
  seller,
  date,
  tracking,
  items: rows.map(([name, qty], n) => item(orderId, seller, name, qty, date, tracking, n)),
});
const rawGks = (r) => (Array.isArray(r?.list) ? r.list.map((c) => c.pkg.gk) : r);

const TIE_X = mkPkg("T1", "Xray", [["Lightning Bolt", 1], ["Ponder", 1]]);
const TIE_Z = mkPkg("T2", "Zulu", [["Lightning Bolt", 1]]);
const r13 = rankCandidates(env(["Lightning Bolt", 1], ["Ponder", 1]), [TIE_Z, TIE_X], {});
eq(r13?.tied, 1, "V6.13 a candidate that matches fewer cards is not a tie, though its pkgLeft is equal");
eq(rawGks(r13), ["T1::Xray", "T2::Zulu"], "V6.13b the candidate matching more cards ranks first");

const TIE_P = mkPkg("T3", "Papa", [["Lightning Bolt", 1]]);
const TIE_Q = mkPkg("T4", "Quebec", [["Lightning Bolt", 1], ["Ponder", 1]]);
const r14 = rankCandidates(env(["Lightning Bolt", 1]), [TIE_Q, TIE_P], {});
eq(r14?.tied, 1, "V6.14 two candidates that match equally but owe different leftovers are not a tie");
eq(rawGks(r14), ["T3::Papa", "T4::Quebec"], "V6.14b the candidate that owes less ranks first");

/* render order below the tie: date (older first), then untracked, then gk.
   Read raw, not gksOf, because gksOf sorts and would hide the order. */
eq(rawGks(rankCandidates(E3, ALL, {})), ["A1::Alpha Cards", "B1::Beta Games"], "V6.15 equal candidates list the older order first");
const T_TRACKED = mkPkg("T5", "Tango", [["Lightning Bolt", 1]], "2026-07-01", "with tracking");
const T_UNTRACKED = mkPkg("U6", "Uniform", [["Lightning Bolt", 1]], "2026-07-01", "without tracking");
eq(
  rawGks(rankCandidates(env(["Lightning Bolt", 1]), [T_TRACKED, T_UNTRACKED], {})),
  ["U6::Uniform", "T5::Tango"],
  "V6.16 on a full tie an untracked package lists before a tracked one"
);
const T_WOLF = mkPkg("W9", "Wolf", [["Lightning Bolt", 1]], "2026-07-01", "without tracking");
const T_ANT = mkPkg("W8", "Ant", [["Lightning Bolt", 1]], "2026-07-01", "without tracking");
eq(
  rawGks(rankCandidates(env(["Lightning Bolt", 1]), [T_WOLF, T_ANT], {})),
  ["W8::Ant", "W9::Wolf"],
  "V6.17 on a full tie the package key orders the list, not the input"
);

/* ---------- report ---------- */

console.log(`\n${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (fails.length) process.exit(1);
console.log("all green");
