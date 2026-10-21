/* Contract tests for src/view-rules.mjs, the pure view rules that lane S2 moves
   out of src/app.jsx. Run: npm run test:view-rules. Exits 1 on any failure.

   No DOM and no harness: every case is a direct call, so JavaScriptCore can
   run the same module later (rules-run-in-javascriptcore). Each case is taken
   from behaviour test/app.test.mjs already proves. The case notes name the
   group. Ids are V<group>.<case>.

   The module is loaded dynamically. A missing or broken module fails every
   case on an assertion, never on an import error that stops the file.

   Lane S3 (groups V7 to V12) pins these exports. Each takes its state and
   clock as arguments, and none reads React, the DOM or Date.now:
     tallyGroups(items) -> [{name, items, sets, qty, basis, avg, sellerCount, orderCount}]
     sortTally(groups, key, received) -> sorted copy; keys missing|basis|ordered|value|rate|name,
                                         any other key falls back to missing
     sortPackages(pkgs, key, received) -> sorted copy; keys newest|oldest|value|rate|seller,
                                          any other key falls back to newest
     filterPackages(pkgs, opts) / filterTally(groups, opts) -> filtered copy, input order.
       opts {query, hideDone, received, sticky: Set, revealed: Set, stampText(gk) -> string}.
       Packages: a package in full drops under hideDone even when a line is sticky.
       Tally: a row in full stays while a copy is sticky.
     dateRange(filter, now) -> {from, to} | null
     inRange(items, range) / dropCanceled(items) / dropGks(items, gks: Set)
     canceledPackagesOf(items) -> newest first; stampedPackagesOf(items, gks: Set)
     totalsOf(items, received) -> {total, got, missingVal, val}
     outstandingOf(items, received) -> {left, value}
     outstandingNames(items, received) -> [{nk, name, qty, sellerCount}]
     packagesDone(pkgs, received) -> count of packages with every line in

   Lane N5 pins two more (the native Packages rows call them through RulesEngine,
   so JavaScriptCore and the web app share one home):
     toggleCount(got, qty) -> the count a check-in writes: 0 when the line is
                              already in (got >= qty), else qty
     countLabel(got, qty) -> "N of M" with N clamped to M, so "3 of 2" never shows
     isDone(got, qty) -> true when got >= qty, the done state a row shows

   Lane N6 pins one more (the native Tally row writes its dollar figures through
   RulesEngine, and the web's money() in src/app.jsx calls the same rule, so the
   two clients cannot round differently):
     money(n) -> "$" + n with exactly two decimals, the thousands grouped, rounded
                 half up on the decimal value the way toLocaleString does it:
                 0.125 -> "$0.13", 1.005 -> "$1.01" */

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
const dateRange = fn("dateRange");
const inRange = fn("inRange");
const dropCanceled = fn("dropCanceled");
const dropGks = fn("dropGks");
const canceledPackagesOf = fn("canceledPackagesOf");
const stampedPackagesOf = fn("stampedPackagesOf");
const tallyGroups = fn("tallyGroups");
const sortTally = fn("sortTally");
const sortPackages = fn("sortPackages");
const filterPackages = fn("filterPackages");
const filterTally = fn("filterTally");
const totalsOf = fn("totalsOf");
const outstandingOf = fn("outstandingOf");
const outstandingNames = fn("outstandingNames");
const packagesDone = fn("packagesDone");
const toggleCount = fn("toggleCount");
const countLabel = fn("countLabel");
const isDone = fn("isDone");
const money = fn("money");

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

/* explicit clock: lostMail takes "now" as its fourth argument, in ms since the
   epoch (the shape dateRange takes), and reads Date.now only when it is absent.
   The fixed instant is 14 days after 2026-07-01, so the answer is "maybe".
   With the wall clock (2026-10-11 or later) the same order is the deadline tier,
   so the two answers differ for any run made after 2026-08-01. */
const FIXED_NOW = Date.parse("2026-07-15T00:00:00Z");
eq(
  lostMail("2026-07-01", "without tracking", false, FIXED_NOW),
  { tier: "maybe", days: 14 },
  "V2.17 an explicit clock sets the day count, not Date.now"
);
ok(
  JSON.stringify(lostMail("2026-07-01", "without tracking", false, FIXED_NOW)) !==
    JSON.stringify(lostMail("2026-07-01", "without tracking", false)),
  "V2.18 the explicit clock gives a different result from the Date.now default"
);
eq(isUntracked({}), false, "V2.19 a package with no tracking field is not untracked");

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

/* render order below the tie: the sort puts untracked first (src/view-rules.mjs:184),
   then date, older first (:185), then gk. Read raw, not gksOf, because gksOf
   sorts and would hide the order. V6.15 gives the older order the later gk, so
   only the date key can put it first. */
const OLD_Z = mkPkg("Z7", "Zulu", [["Brainstorm", 2]], "2026-07-01", "without tracking");
const NEW_A = mkPkg("A2", "Alpha", [["Brainstorm", 2]], "2026-07-02", "without tracking");
eq(
  rawGks(rankCandidates(env(["Brainstorm", 2]), [NEW_A, OLD_Z], {})),
  ["Z7::Zulu", "A2::Alpha"],
  "V6.15 equal candidates list the older order first"
);
/* untracked outranks date: the newer untracked order lists before the older tracked one */
const OLD_T = mkPkg("T8", "Tango", [["Brainstorm", 2]], "2026-06-01", "with tracking");
const NEW_U = mkPkg("U7", "Uniform", [["Brainstorm", 2]], "2026-07-01", "without tracking");
eq(
  rawGks(rankCandidates(env(["Brainstorm", 2]), [OLD_T, NEW_U], {})),
  ["U7::Uniform", "T8::Tango"],
  "V6.18 an untracked order lists before an older tracked one, so untracked outranks date"
);
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

/* ── fixtures for V7 to V12: priced lines in the harness ITEMS shape ────── */
/* the prices and copies match test/harness.mjs ITEMS, so the app suite's
   figures (basis 2.00 for Brainstorm, 0.75 for Ponder) hold here too */

const priced = (orderId, seller, name, qty, price, date, tracking, n, set = "Test Set") => ({
  key: `${orderId}|${n}|p${name}`,
  orderId,
  seller,
  name,
  set,
  condition: "Near Mint",
  finish: "",
  qty,
  price,
  date,
  tracking,
  line: "Magic",
});
const PITEMS = [
  priced("A1", "Alpha Cards", "Lightning Bolt", 1, 1.0, "2026-07-01", "without tracking", 0),
  priced("A1", "Alpha Cards", "Counterspell", 1, 2.0, "2026-07-01", "without tracking", 1),
  priced("A1", "Alpha Cards", "Brainstorm", 2, 0.5, "2026-07-01", "without tracking", 2),
  priced("B1", "Beta Games", "Lightning Bolt", 1, 1.0, "2026-07-02", "without tracking", 0),
  priced("B1", "Beta Games", "Counterspell", 1, 2.0, "2026-07-02", "without tracking", 1),
  priced("B1", "Beta Games", "Brainstorm", 2, 0.5, "2026-07-02", "without tracking", 2),
  priced("C1", "Gamma Cards", "Lightning Bolt", 1, 1.0, "2026-06-01", "with tracking", 0),
  priced("C1", "Gamma Cards", "Path to Exile", 1, 3.0, "2026-06-01", "with tracking", 1),
  priced("C1", "Gamma Cards", "Swords to Plowshares", 1, 4.0, "2026-06-01", "with tracking", 2),
  priced("C1", "Gamma Cards", "Ponder", 1, 0.75, "2026-06-01", "with tracking", 3),
  priced("C1", "Gamma Cards", "Preordain", 1, 0.75, "2026-06-01", "with tracking", 4),
  priced("D1", "Delta Cards", "Urza's Saga", 1, 50.0, "2026-05-01", "without tracking", 0),
];
const TALLY_IN = [
  "Lightning Bolt",
  "Counterspell",
  "Brainstorm",
  "Path to Exile",
  "Swords to Plowshares",
  "Ponder",
  "Preordain",
  "Urza's Saga",
];
/* a Tally group literal, built here so the sort and filter cases do not
   depend on tallyGroups. Its arithmetic is plain sums, not the rule under test. */
const grpOf = (name) => {
  const items = PITEMS.filter((i) => i.name === name);
  const qty = items.reduce((s, i) => s + i.qty, 0);
  const basis = items.reduce((s, i) => s + i.price * i.qty, 0);
  return { name, items, sets: ["Test Set"], qty, basis, avg: qty ? basis / qty : 0 };
};
const TALLY = TALLY_IN.map(grpOf);
/* a package literal, one per order, in the order the orders appear */
const pkgLit = (orderId) => {
  const items = PITEMS.filter((i) => i.orderId === orderId);
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
const PKGS = ["A1", "B1", "C1", "D1"].map(pkgLit);
const A1_FULL = { "A1|0|pLightning Bolt": 1, "A1|1|pCounterspell": 1, "A1|2|pBrainstorm": 2 };
const B1_LB = { "B1|0|pLightning Bolt": 1 };
const NOW = Date.parse("2026-07-15T00:00:00Z");

const vopts = (o = {}) => ({
  query: "",
  hideDone: false,
  received: {},
  sticky: new Set(),
  revealed: new Set(),
  stampText: () => "",
  ...o,
});
const gkList = (r) => (Array.isArray(r) ? r.map((p) => p?.gk) : r);
const nameList = (r) => (Array.isArray(r) ? r.map((g) => g?.name) : r);
const oids = (r) => (Array.isArray(r) ? [...new Set(r.map((i) => i?.orderId))] : r);
const pickNames = (p) => (Array.isArray(p?.items) ? p.items.map((i) => i.name) : undefined);
const fPkg = (o, gk) => {
  const r = filterPackages(PKGS, vopts(o));
  return Array.isArray(r) ? r.find((p) => p?.gk === gk) : undefined;
};
const tRow = (o, name) => {
  const r = filterTally(TALLY, vopts(o));
  return Array.isArray(r) ? r.find((g) => g?.name === name) : undefined;
};
const tView = (o, name) => {
  const g = tRow(o, name);
  if (!g) return undefined;
  return {
    shown: Array.isArray(g.shown) ? g.shown.map((i) => i?.orderId) : g.shown,
    qty: g.qty,
    basis: g.basis,
  };
};
/* the clock must be an argument: a rule that reads Date.now throws here */
const clockFree = (run) => {
  const real = Date.now;
  Date.now = () => {
    throw new Error("clock read");
  };
  try {
    return run();
  } catch (e) {
    return `threw: ${e.message}`;
  } finally {
    Date.now = real;
  }
};

/* ── V7. Tally pools copies on the exact name (tallyGroups) ────────────── */
/* source: test/app.test.mjs group 22 (the Brainstorm and Ponder pair);
   decisions tally-pools-on-the-exact-name, tally-row-lists-its-copies,
   cost-basis-excludes-ship-and-tax */

const tg = tallyGroups(PITEMS);
const byName = (r, n) => (Array.isArray(r) ? r.find((g) => g?.name === n) : undefined);
const LB = byName(tg, "Lightning Bolt");
const BS = byName(tg, "Brainstorm");
eq(nameList(tg)?.length, 8, "V7.1 eight distinct names make eight Tally rows");
eq(
  nameList(tallyGroups([...PITEMS, priced("E1", "Echo Cards", "Urza’s Saga", 1, 50.0, "2026-07-03", "without tracking", 0)]))?.length,
  9,
  "V7.2 a curly-apostrophe name is its own row: names pool on the exact Product Name"
);
eq(
  LB && { qty: LB.qty, basis: LB.basis, avg: LB.avg, sellerCount: LB.sellerCount, orderCount: LB.orderCount },
  { qty: 3, basis: 3, avg: 1, sellerCount: 3, orderCount: 3 },
  "V7.3 Lightning Bolt pools three copies from three orders: qty 3, basis 3, avg 1"
);
eq(
  BS && { qty: BS.qty, basis: BS.basis, avg: BS.avg, sellerCount: BS.sellerCount, orderCount: BS.orderCount, sets: BS.sets },
  { qty: 4, basis: 2, avg: 0.5, sellerCount: 2, orderCount: 2, sets: ["Test Set"] },
  "V7.4 Brainstorm pools four copies: basis is price times qty, avg is basis over copies"
);
eq(
  byName(tallyGroups([...PITEMS, priced("Y9", "Abel Cards", "Brainstorm", 1, 0.5, "2026-07-02", "without tracking", 0)]), "Brainstorm")?.items?.map((i) => i.orderId),
  ["Y9", "B1", "A1"],
  "V7.5 every copy is listed, newest first, and a date tie lists the seller A to Z"
);
eq(
  byName(tallyGroups([...PITEMS, priced("Q1", "Quartz Cards", "Lightning Bolt", 1, 1.0, "2026-07-04", "without tracking", 0, "")]), "Lightning Bolt")?.sets,
  ["Test Set"],
  "V7.6 a blank set name is not listed as a set"
);
eq(
  byName(tallyGroups([priced("Z1", "Zed Cards", "Ponder", 0, 1.0, "2026-07-01", "without tracking", 0)]), "Ponder")?.avg,
  0,
  "V7.7 a row with no copies reads an average of 0, not NaN"
);
eq(
  byName(tallyGroups([{ ...PITEMS[0], shipping: 9, tax: 9 }]), "Lightning Bolt")?.basis,
  1,
  "V7.8 basis is price times qty only; shipping and tax are not in it"
);

/* ── V8. Tally sorts on six keys, as a pure function (sortTally) ───────── */
/* source: test/app.test.mjs group 22 (22.1 biggest position, 22.2 unit rate);
   decision tally-sort-keys-are-six. Keys: missing, basis, ordered, value, rate, name. */

const MISSING_ORDER = [
  "Brainstorm",
  "Lightning Bolt",
  "Counterspell",
  "Urza's Saga",
  "Swords to Plowshares",
  "Path to Exile",
  "Ponder",
  "Preordain",
];
const tNames = (k, rec = {}) => nameList(sortTally(TALLY, k, rec));
eq(tNames("missing"), MISSING_ORDER, "V8.1 Most missing: copies still owed, then dollars owed, then name");
eq(
  tNames("missing", { "A1|2|pBrainstorm": 2, "B1|2|pBrainstorm": 2 }),
  ["Lightning Bolt", "Counterspell", "Urza's Saga", "Swords to Plowshares", "Path to Exile", "Ponder", "Preordain", "Brainstorm"],
  "V8.2 a fully received row sinks to the bottom of Most missing"
);
eq(
  tNames("basis"),
  ["Urza's Saga", "Counterspell", "Swords to Plowshares", "Lightning Bolt", "Path to Exile", "Brainstorm", "Ponder", "Preordain"],
  "V8.3 Biggest position by basis, so Brainstorm (2.00) outranks Ponder (0.75), as app 22.1"
);
eq(
  tNames("ordered"),
  ["Brainstorm", "Lightning Bolt", "Counterspell", "Path to Exile", "Ponder", "Preordain", "Swords to Plowshares", "Urza's Saga"],
  "V8.4 Most ordered: copies, then name"
);
eq(
  tNames("value"),
  ["Urza's Saga", "Counterspell", "Swords to Plowshares", "Lightning Bolt", "Path to Exile", "Brainstorm", "Ponder", "Preordain"],
  "V8.5 $ remaining with nothing received follows the owed dollars"
);
eq(
  tNames("value", { "D1|0|pUrza's Saga": 1 }),
  ["Counterspell", "Swords to Plowshares", "Lightning Bolt", "Path to Exile", "Brainstorm", "Ponder", "Preordain", "Urza's Saga"],
  "V8.6 $ remaining reads the received map passed in, and a paid row sinks"
);
eq(
  tNames("rate"),
  ["Urza's Saga", "Swords to Plowshares", "Path to Exile", "Counterspell", "Lightning Bolt", "Ponder", "Preordain", "Brainstorm"],
  "V8.7 Unit rate by avg, so Ponder (0.75) outranks Brainstorm (0.50), as app 22.2"
);
eq(
  tNames("name"),
  ["Brainstorm", "Counterspell", "Lightning Bolt", "Path to Exile", "Ponder", "Preordain", "Swords to Plowshares", "Urza's Saga"],
  "V8.8 Name A to Z"
);
eq(tNames("nonsense"), MISSING_ORDER, "V8.9 an unknown key falls back to Most missing");
const sortedOut = sortTally(TALLY, "name", {});
ok(
  Array.isArray(sortedOut) && sortedOut !== TALLY && JSON.stringify(nameList(TALLY)) === JSON.stringify(TALLY_IN),
  "V8.10 the sort returns a new array and does not reorder its input"
);

/* ── V9. Packages sort on five keys (sortPackages) ─────────────────────── */
/* source: test/app.test.mjs group 24 (24.1 the $50 single leads on unit rate);
   decision package-sort-swaps-with-view. Keys: newest, oldest, value, rate, seller. */

const pOrder = (k, rec = {}) => gkList(sortPackages(PKGS, k, rec));
const NEWEST = ["B1::Beta Games", "A1::Alpha Cards", "C1::Gamma Cards", "D1::Delta Cards"];
eq(pOrder("newest"), NEWEST, "V9.1 Newest: order date, newest first");
eq(
  pOrder("oldest"),
  ["D1::Delta Cards", "C1::Gamma Cards", "A1::Alpha Cards", "B1::Beta Games"],
  "V9.2 Oldest: order date, oldest first"
);
eq(
  pOrder("value"),
  ["D1::Delta Cards", "C1::Gamma Cards", "B1::Beta Games", "A1::Alpha Cards"],
  "V9.3 $ remaining: the $50 single first, then a tie with the newer order first"
);
eq(
  pOrder("value", { "D1|0|pUrza's Saga": 1 }),
  ["C1::Gamma Cards", "B1::Beta Games", "A1::Alpha Cards", "D1::Delta Cards"],
  "V9.4 a package in full owes nothing and sinks under $ remaining"
);
eq(
  pOrder("rate"),
  ["D1::Delta Cards", "C1::Gamma Cards", "B1::Beta Games", "A1::Alpha Cards"],
  "V9.5 Unit rate: the $50 single leads, as app 24.1"
);
eq(
  pOrder("rate", { "D1|0|pUrza's Saga": 1 }),
  ["D1::Delta Cards", "C1::Gamma Cards", "B1::Beta Games", "A1::Alpha Cards"],
  "V9.6 Unit rate ignores what is received"
);
eq(pOrder("seller"), ["A1::Alpha Cards", "B1::Beta Games", "D1::Delta Cards", "C1::Gamma Cards"], "V9.7 Seller A to Z");
eq(pOrder("basis"), NEWEST, "V9.8 a Tally key is no package key, so the order falls back to newest");
eq(pOrder("missing"), NEWEST, "V9.9 the Tally key Most missing falls back to newest too");

/* ── V10. Search and Hide received narrow lines, never the counts ──────── */
/* source: test/app.test.mjs group 32 (32.3 header while filtered, 32.15
   reveal bypasses hideDone), group 37.30 (Find narrows the stamped list);
   decisions search-hide-keep-tally-counts, a-reveal-ignores-hidedone-too,
   stamped-filter-on-the-pipeline. The package filter reads a stamp only
   through opts.stampText, so the label constant stays in src/app.jsx. */

eq(
  gkList(filterPackages(PKGS, vopts({}))),
  ["A1::Alpha Cards", "B1::Beta Games", "C1::Gamma Cards", "D1::Delta Cards"],
  "V10.1 with no filter every package stays, in input order"
);
eq(gkList(filterPackages(PKGS, vopts({ query: "gamma" }))), ["C1::Gamma Cards"], "V10.2 a search for a seller keeps that package");
eq(pickNames(fPkg({ query: "lightning" }, "A1::Alpha Cards")), ["Lightning Bolt"], "V10.3 a search narrows the lines to the match");
eq(fPkg({ query: "lightning" }, "A1::Alpha Cards")?.hiddenByFilters, 2, "V10.4 and counts the lines it hid");
eq(gkList(filterPackages(PKGS, vopts({ query: "zzz" }))), [], "V10.5 a search that matches nothing removes every package");
eq(
  gkList(filterPackages(PKGS, vopts({ hideDone: true, received: A1_FULL }))),
  ["B1::Beta Games", "C1::Gamma Cards", "D1::Delta Cards"],
  "V10.6 Hide received drops a package whose every line is in"
);
eq(pickNames(fPkg({ hideDone: true, received: B1_LB }, "B1::Beta Games")), ["Counterspell", "Brainstorm"], "V10.7 and drops only the checked lines of a part-received package");
eq(fPkg({ hideDone: true, received: B1_LB }, "B1::Beta Games")?.hiddenByFilters, 1, "V10.8 and counts that line as hidden");
eq(
  gkList(filterPackages(PKGS, vopts({ hideDone: true, received: A1_FULL, sticky: new Set(["A1|2|pBrainstorm"]) }))),
  ["B1::Beta Games", "C1::Gamma Cards", "D1::Delta Cards"],
  "V10.9 a package in full drops at once, even with a sticky line"
);
eq(
  gkList(filterPackages(PKGS, vopts({ query: "zzz", hideDone: true, received: A1_FULL, revealed: new Set(["A1::Alpha Cards"]) }))),
  ["A1::Alpha Cards"],
  "V10.10 a revealed package ignores the search and Hide received"
);
eq(
  pickNames(fPkg({ query: "zzz", hideDone: true, received: A1_FULL, revealed: new Set(["A1::Alpha Cards"]) }, "A1::Alpha Cards")),
  ["Lightning Bolt", "Counterspell", "Brainstorm"],
  "V10.11 and shows every line of it"
);
const RUSH = (gk) => (gk === "A1::Alpha Cards" ? "Claim filed rush" : "");
eq(gkList(filterPackages(PKGS, vopts({ query: "rush", stampText: RUSH }))), ["A1::Alpha Cards"], "V10.12 a search that hits a stamp label keeps the package");
eq(
  pickNames(fPkg({ query: "rush", stampText: RUSH }, "A1::Alpha Cards")),
  ["Lightning Bolt", "Counterspell", "Brainstorm"],
  "V10.13 and keeps every line, since the stamp belongs to the package"
);
eq(
  tView({ query: "gamma" }, "Lightning Bolt"),
  { shown: ["C1"], qty: 3, basis: 3 },
  "V10.14 a search narrows the copies under a Tally row, and the row keeps its counts"
);
eq(nameList(filterTally(TALLY, vopts({ query: "zzz" }))), [], "V10.15 a search that matches no copy removes the Tally row");
eq(
  tView({ hideDone: true, received: { "A1|0|pLightning Bolt": 1 } }, "Lightning Bolt"),
  { shown: ["B1", "C1"], qty: 3, basis: 3 },
  "V10.16 Hide received hides one copy, and the row still counts all three"
);
eq(
  nameList(filterTally(TALLY, vopts({ hideDone: true, received: { "D1|0|pUrza's Saga": 1 } }))),
  TALLY_IN.filter((n) => n !== "Urza's Saga"),
  "V10.17 a Tally row with every copy in is hidden under Hide received"
);
eq(
  nameList(filterTally(TALLY, vopts({ hideDone: true, received: { "D1|0|pUrza's Saga": 1 }, sticky: new Set(["D1|0|pUrza's Saga"]) }))),
  TALLY_IN,
  "V10.18 but a just-checked copy keeps its row, so the row does not jump under the finger"
);

/* ── V11. Totals and what is outstanding per level ─────────────────────── */
/* source: test/app.test.mjs group 3 and group 37 (the masthead, "still
   missing"); decisions outstanding-value-per-level, cost-basis-excludes-ship-and-tax */

eq(
  totalsOf(PITEMS, {}),
  { total: 14, got: 0, missingVal: 67.5, val: 67.5 },
  "V11.1 the ledger holds 14 copies and $67.50 before any check-in; basis is price times qty"
);
eq(
  totalsOf(PITEMS, { "A1|0|pLightning Bolt": 1, "D1|0|pUrza's Saga": 1 }),
  { total: 14, got: 2, missingVal: 16.5, val: 67.5 },
  "V11.2 a check-in lowers what is missing, never the cost"
);
eq(
  totalsOf(PITEMS, { "D1|0|pUrza's Saga": 5 }),
  { total: 14, got: 1, missingVal: 17.5, val: 67.5 },
  "V11.3 a count over the copies ordered is clamped to the copies ordered"
);
eq(outstandingOf(PKGS[0].items, {}), { left: 4, value: 4 }, "V11.4 Alpha owes 4 copies, $4.00");
eq(
  outstandingOf(PKGS[0].items, { "A1|0|pLightning Bolt": 1 }),
  { left: 3, value: 3 },
  "V11.5 a received copy leaves the left count and its price"
);
eq(
  outstandingOf(PKGS[0].items, { "A1|2|pBrainstorm": 9 }),
  { left: 2, value: 3 },
  "V11.6 a received count over the copies ordered owes nothing more"
);
eq(outstandingOf([], {}), { left: 0, value: 0 }, "V11.7 an empty level owes nothing");

const onames = (rec) => {
  const r = outstandingNames(PITEMS, rec);
  return Array.isArray(r) ? [...r].sort((a, b) => (a.nk < b.nk ? -1 : a.nk > b.nk ? 1 : 0)) : r;
};
const oneN = (r, nk) => (Array.isArray(r) ? r.find((x) => x?.nk === nk) : undefined);
const EXPECTED_NAMES = [
  { nk: "brainstorm", name: "Brainstorm", qty: 4, sellerCount: 2 },
  { nk: "counterspell", name: "Counterspell", qty: 2, sellerCount: 2 },
  { nk: "lightning bolt", name: "Lightning Bolt", qty: 3, sellerCount: 3 },
  { nk: "path to exile", name: "Path to Exile", qty: 1, sellerCount: 1 },
  { nk: "ponder", name: "Ponder", qty: 1, sellerCount: 1 },
  { nk: "preordain", name: "Preordain", qty: 1, sellerCount: 1 },
  { nk: "swords to plowshares", name: "Swords to Plowshares", qty: 1, sellerCount: 1 },
  { nk: "urza s saga", name: "Urza's Saga", qty: 1, sellerCount: 1 },
];
eq(onames({}), EXPECTED_NAMES, "V11.8 outstanding names pool the copies still owed, with the sellers that owe them");
eq(
  onames({ "A1|0|pLightning Bolt": 1, "B1|0|pLightning Bolt": 1, "C1|0|pLightning Bolt": 1 }),
  EXPECTED_NAMES.filter((x) => x.nk !== "lightning bolt"),
  "V11.9 a name with no copy owed leaves the list"
);
eq(
  oneN(outstandingNames([...PITEMS, priced("E1", "Echo Cards", "Urza’s Saga", 2, 50.0, "2026-07-03", "without tracking", 0)], {}), "urza s saga"),
  { nk: "urza s saga", name: "Urza's Saga", qty: 3, sellerCount: 2 },
  "V11.10 a curly and a straight apostrophe fold into one name; the first name seen is kept"
);
eq(packagesDone(PKGS, {}), 0, "V11.11 with nothing received no package is done");
eq(packagesDone(PKGS, A1_FULL), 1, "V11.12 a package with every line in counts as done");

/* ── V12. The date range, canceled and refund exclusions, the stamped source */
/* source: test/app.test.mjs group 37 (37.16 a refund leaves the list, 37.18
   canceled count, 37.70 a refund is not a candidate); decisions
   date-filter-spans-ledger-views, canceled-orders-leave-the-list,
   a-refund-leaves-every-count, stamped-filter-on-the-pipeline */

eq(dateRange({ preset: "all" }, NOW), null, "V12.1 All time is no range");
eq(
  dateRange({ preset: "custom", from: "2026-07-01", to: "2026-07-02" }, NOW),
  { from: Date.parse("2026-07-01"), to: Date.parse("2026-07-02") + 86399999 },
  "V12.2 a picked custom range runs from the start of its first day to the end of its last"
);
eq(dateRange({ preset: "custom", from: "", to: "" }, NOW), null, "V12.3 a custom range with no dates is no range");
eq(
  dateRange({ preset: "custom", from: "2026-07-01", to: "" }, NOW),
  { from: Date.parse("2026-07-01"), to: null },
  "V12.4 an open-ended custom range has no end"
);
eq(dateRange({ preset: "days", days: "10" }, NOW), { from: NOW - 10 * DAY, to: null }, "V12.5 Last N days counts back from now");
eq(dateRange({ preset: "days", days: "" }, NOW), null, "V12.6 Last with no day count is no range");
eq(dateRange({ preset: 30 }, NOW), { from: NOW - 30 * DAY, to: null }, "V12.7 a fixed preset counts back from now");
eq(dateRange({ preset: "30" }, NOW), { from: NOW - 30 * DAY, to: null }, "V12.8 a preset read as a string counts the same");
eq(
  clockFree(() => dateRange({ preset: 30 }, NOW)),
  { from: NOW - 30 * DAY, to: null },
  "V12.9 the range reads the clock only through its now argument"
);

eq(oids(inRange(PITEMS, { from: Date.parse("2026-06-15"), to: null })), ["A1", "B1"], "V12.10 a range from a start date drops the older orders");
eq(
  oids(inRange(PITEMS, { from: null, to: Date.parse("2026-07-01") + 86399999 })),
  ["A1", "C1", "D1"],
  "V12.11 a range to a date keeps that whole day and drops the later orders"
);
eq(
  oids(inRange([...PITEMS, priced("U1", "Undated Co", "Ponder", 1, 0.75, "not a date", "without tracking", 0)], { from: Date.parse("2026-06-15"), to: null })),
  ["A1", "B1", "U1"],
  "V12.12 an undated row stays visible in a range"
);
eq(inRange(PITEMS, null)?.length, 12, "V12.13 no range keeps every line");

const X_CANCEL = [
  priced("X1", "Xray", "Ponder", 3, 2.0, "2026-07-01", "Canceled", 0),
  priced("X2", "Xray", "Ponder", 1, 1.0, "2026-07-01", "Cancelled by seller", 0),
  priced("X3", "Xray", "Ponder", 1, 1.0, "2026-07-01", "CANCEL", 0),
];
eq(oids(dropCanceled([...PITEMS, ...X_CANCEL])), ["A1", "B1", "C1", "D1"], "V12.14 a canceled order leaves the list, whatever the case of its status");
eq(
  totalsOf(dropCanceled([...PITEMS, ...X_CANCEL]), {}),
  { total: 14, got: 0, missingVal: 67.5, val: 67.5 },
  "V12.15 and leaves every count: a canceled order adds nothing to the totals"
);
const CANCEL_PAIR = [
  priced("E1", "Echo", "Ponder", 1, 0.75, "2026-07-03", "Canceled", 0),
  priced("F1", "Foxtrot", "Ponder", 1, 0.75, "2026-07-05", "Canceled", 0),
];
eq(gkList(canceledPackagesOf([...PITEMS, ...CANCEL_PAIR])), ["F1::Foxtrot", "E1::Echo"], "V12.16 canceled packages are listed newest first");
eq(
  Object.keys(canceledPackagesOf([...PITEMS, ...CANCEL_PAIR])?.[0] || {}).sort(),
  ["date", "gk", "items", "orderId", "seller"],
  "V12.17 a canceled package carries its order, seller, date and lines"
);

eq(oids(dropGks(PITEMS, new Set(["A1::Alpha Cards"]))), ["B1", "C1", "D1"], "V12.18 a refunded package leaves the live list");
eq(totalsOf(dropGks(PITEMS, new Set(["A1::Alpha Cards"])), {})?.total, 10, "V12.19 and leaves every count: 14 copies less Alpha's 4");
eq(dropGks(PITEMS, new Set())?.length, 12, "V12.20 an empty refund set removes nothing");
eq(
  gkList(stampedPackagesOf(PITEMS, new Set(["A1::Alpha Cards"]))),
  ["A1::Alpha Cards"],
  "V12.21 the stamped list holds only the stamped package"
);

/* ── V13. Gaps the S3 builder found. Green on main; each names its mutant. ─ */
/* V13.1 mutant: drop the `q ? ... : 0` guard in the rate key, so a package with no copies rates NaN */
const ZERO = {
  gk: "Z1::Zed Cards",
  orderId: "Z1",
  seller: "Zed Cards",
  date: "2026-07-03",
  tracking: "without tracking",
  items: [priced("Z1", "Zed Cards", "Nothing Card", 0, 9.0, "2026-07-03", "without tracking", 0)],
};
eq(
  gkList(sortPackages([ZERO, ...PKGS], "rate", {})),
  ["D1::Delta Cards", "C1::Gamma Cards", "B1::Beta Games", "A1::Alpha Cards", "Z1::Zed Cards"],
  "V13.1 Unit rate: a package with no copies rates 0 and sinks to the bottom, never NaN"
);

/* V13.2 mutant: drop `|| sticky.has(it.key)` from the line filter, so a sticky line in a part-received package is hidden */
eq(
  pickNames(fPkg({ hideDone: true, received: B1_LB, sticky: new Set(["B1|0|pLightning Bolt"]) }, "B1::Beta Games")),
  ["Lightning Bolt", "Counterspell", "Brainstorm"],
  "V13.2 Hide received keeps a sticky line in a part-received package"
);
eq(
  fPkg({ hideDone: true, received: B1_LB, sticky: new Set(["B1|0|pLightning Bolt"]) }, "B1::Beta Games")?.hiddenByFilters,
  0,
  "V13.3 and hides nothing, since the sticky line keeps every line of it"
);

/* V13.4 mutant: drop `hideDone &&` from the whole-row gate in filterTally, so a fully received row vanishes with Hide received off */
const URZA_IN = { "D1|0|pUrza's Saga": 1 };
eq(
  nameList(filterTally(TALLY, vopts({ received: URZA_IN }))),
  TALLY_IN,
  "V13.4 with Hide received off, a Tally row with every copy in still shows"
);
eq(
  tView({ received: URZA_IN }, "Urza's Saga"),
  { shown: ["D1"], qty: 1, basis: 50 },
  "V13.5 and shows its copy, with its counts"
);

/* V13.6 mutant: drop `n <= 0` from the days branch, so a negative count reads as a range starting in the future */
eq(dateRange({ preset: "days", days: "-5" }, NOW), null, "V13.6 Last with a negative day count is no range");

/* V13.7 mutant: `t >= range.to` in inRange, so the exact upper bound drops its own day */
const EDGE = [
  priced("G0", "Golf Cards", "Ponder", 1, 0.75, "2026-06-30", "without tracking", 0),
  priced("G1", "Golf Cards", "Ponder", 1, 0.75, "2026-07-01", "without tracking", 0),
  priced("G2", "Golf Cards", "Ponder", 1, 0.75, "2026-07-02", "without tracking", 0),
];
eq(
  oids(inRange(EDGE, { from: null, to: Date.parse("2026-07-01") })),
  ["G0", "G1"],
  "V13.7 a row dated exactly on the upper bound stays; the day after drops"
);

/* V13.8 mutant: count orderIds, not sellers, in sellerCount */
const TWO_ORDERS = [
  priced("H1", "Hotel Cards", "Ponder", 1, 0.75, "2026-07-01", "without tracking", 0),
  priced("H2", "Hotel Cards", "Ponder", 1, 0.75, "2026-07-02", "without tracking", 0),
  priced("I1", "India Cards", "Ponder", 1, 0.75, "2026-07-03", "without tracking", 0),
];
eq(
  oneN(outstandingNames(TWO_ORDERS, {}), "ponder"),
  { nk: "ponder", name: "Ponder", qty: 3, sellerCount: 2 },
  "V13.8 three orders from two sellers: sellerCount is 2, not the order count of 3"
);

/* V13.9 mutant: `some` for `every` in packagesDone, so a part-received package counts */
eq(packagesDone(PKGS, B1_LB), 0, "V13.9 a part-received package is not done");
eq(
  packagesDone(PKGS, { ...A1_FULL, ...B1_LB }),
  1,
  "V13.10 one done package and one part-received package count as one"
);

/* ---------- N5: check-in toggle and "N of M" clamp ---------- */

/* V14.1 a line with nothing in toggles to its full quantity */
eq(toggleCount(0, 1), 1, "V14.1a nothing in, one copy: check in the one copy");
eq(toggleCount(0, 3), 3, "V14.1b nothing in, three copies: check in all three");

/* V14.2 a full line toggles back to zero */
eq(toggleCount(1, 1), 0, "V14.2a full line: un-check to zero");
eq(toggleCount(2, 2), 0, "V14.2b full multi-copy line: un-check to zero");

/* V14.3 a partial line is not done, so a tap checks the whole line in */
eq(toggleCount(1, 3), 3, "V14.3 partial line: a tap checks in the full quantity");

/* V14.4 an over-count is still done, so it toggles to zero, not to qty */
eq(toggleCount(3, 2), 0, "V14.4 over-count (3 of 2) is done: toggle to zero");

/* V14.5 the label reads "N of M" for in-range counts */
eq(countLabel(0, 1), "0 of 1", "V14.5a none in");
eq(countLabel(1, 3), "1 of 3", "V14.5b partial");
eq(countLabel(3, 3), "3 of 3", "V14.5c full");

/* V14.6 mutant: the label prints the raw count, so an over-count reads "3 of 2" */
eq(countLabel(3, 2), "2 of 2", "V14.6 an over-count clamps to the quantity, never 3 of 2");

/* V14.7 isDone is true exactly when the count is in: the done state the rows show */
eq(isDone(0, 1), false, "V14.7a nothing in is not done");
eq(isDone(1, 1), true, "V14.7b a full line is done");
eq(isDone(1, 3), false, "V14.7c a partial line is not done");
eq(isDone(3, 2), true, "V14.7d an over-count is done");
/* V14.8 mutant: done as `got > qty` would leave a full line not done */
eq(isDone(2, 2), true, "V14.8 a full multi-copy line is done, not only an over-count");

/* ---------- N6: one money format for both clients ---------- */

/* V15.1 a half-cent tie rounds up. 0.125 is exact in binary, so half-even
   rounding (Swift's formatted(), Intl with roundingMode halfEven) gives "$0.12" */
eq(money(0.125), "$0.13", "V15.1 a half-cent tie rounds up: 0.125 is $0.13, not $0.12");

/* V15.2 the decimal value decides, not the binary one. 1.005 is stored a hair
   under 1.005, so toFixed(2) and a Math.round(n * 100) port both give "$1.00" */
eq(money(1.005), "$1.01", "V15.2 1.005 is $1.01: round on the decimal value, not the binary one");

/* V15.3 mutant: no padding, so a whole figure loses its cents */
eq(money(2.5), "$2.50", "V15.3a one decimal pads to two");
eq(money(50), "$50.00", "V15.3b a whole figure shows .00");
eq(money(0), "$0.00", "V15.3c zero shows $0.00");

/* V15.4 mutant: toFixed(2), which drops the thousands grouping */
eq(money(1234567.891), "$1,234,567.89", "V15.4 thousands are grouped, cents kept");

/* V15.5 the Tally row's own figure: two copies at $0.10 and $0.15 average
   $0.125, the tie the native row got wrong. The rule must round what tallyGroups hands it. */
const tieGroup = tallyGroups([
  priced("T1", "Tie Cards", "Tie Card", 1, 0.1, "2026-07-01", "without tracking", 0),
  priced("T2", "Tie Games", "Tie Card", 1, 0.15, "2026-07-02", "without tracking", 0),
])?.[0];
eq(tieGroup?.avg, 0.125, "V15.5a control: the pooled average is exactly 0.125");
eq(money(tieGroup?.avg), "$0.13", "V15.5b the Tally unit rate for $0.10 and $0.15 reads $0.13");

/* ---------- report ---------- */

console.log(`\n${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (fails.length) process.exit(1);
console.log("all green");
