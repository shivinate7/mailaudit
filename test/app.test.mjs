/* Behaviour tests for the Mail Day Ledger. Run with `npm test`.

   Grouped by the thing that would hurt if it broke, not by code structure.
   Every group name is a claim CLAUDE.md makes about the app; if you change one
   deliberately, change the assertion and the prose in the same commit. */
import {
  ITEMS,
  SAVE_WAIT,
  SWEEP_WAIT,
  act,
  allBtns,
  assign,
  boot,
  btn,
  buttons,
  choose,
  cardInput,
  click,
  csv,
  dropFile,
  envelopeCount,
  eq,
  getPhoto,
  goTo,
  jpeg,
  observers,
  ok,
  photoKeys,
  openSync,
  pushes,
  record,
  remote,
  remoteText,
  report,
  saveGitHubKey,
  saved,
  sleep,
  text,
  type,
  win,
} from "./harness.mjs";
/* the adapter's pure rules — see group 27 for why these are imported directly */
import { classifyStatus, pushBody } from "../src/remote-rules.mjs";

const fresh = () => boot({ items: ITEMS, received: {} });

/* ── 1. mystery mail hides what doesn't apply, keeps what does ─────────── */

await fresh();
await goTo("orphaned");
ok(/Nothing waiting/.test(text()), "1.1 empty pile shows its empty state");
ok(!!btn(/Record an envelope/), "1.2 record button present");
ok(!/Orders from/.test(text()), "1.3 date filter hidden — it applies to nothing here");
ok(!document.querySelector('input[placeholder^="Search card"]'), "1.4 search hidden");
await openSync(); // the file actions moved behind the Sync disclosure
ok(!!btn(/^Backup$/), "1.5 Backup still reachable");
ok(!!btn(/^Reset$/), "1.6 Reset still reachable");

/* ── 2. recording an envelope must not move the ledger ─────────────────── */

await record(["Path to Exile", "Swords to Plowshares", "Ponder", "Lightning Bolt"]);
ok(/Envelope ·/.test(text()), "2.1 envelope card rendered");
ok(/4 cards/.test(text()), "2.2 envelope card count");
ok(/cards\s*0\/14/.test(text()), "2.3 ledger untouched by recording");
await sleep(SAVE_WAIT);
eq(saved().envelopes?.length, 1, "2.4 envelope persisted");
eq(saved().envelopes[0].entries.length, 4, "2.5 four entries persisted");
eq(saved().received, {}, "2.6 no check-ins written");

/* ── 3. candidates rank, they never decide (invariant 7) ───────────────── */

const cands = allBtns(/^This one$/);
ok(cands.length >= 1, "3.1 at least one candidate offered");
const best = cands[0].parentElement.textContent;
ok(/Gamma Cards/.test(best), "3.2 best candidate is the 4-of-4 package");
ok(/4 of 4 cards/.test(best), "3.3 explains 4 of 4");
ok(/1 more still owed/.test(best), "3.4 reports the package's own leftover");
ok(!/fit these cards equally well/.test(text()), "3.5 no false ambiguity warning");
eq(cands.length, 3, "3.6 the weaker 1-card candidates are offered too, ranked below");

/* ── 4. assigning checks in EXACTLY what was recorded ──────────────────── */

await assign(0);
ok(/cards\s*4\/14/.test(text()), "4.1 exactly 4 cards checked in");
await sleep(SAVE_WAIT);
const rec = saved().received;
eq(Object.keys(rec).length, 4, "4.2 four keys written");
ok(
  !Object.keys(rec).some((k) => /Preordain/.test(k)),
  "4.3 the package's 5th card is NOT checked in — only what was entered"
);
ok(Object.values(rec).every((v) => v > 0), "4.4 no zero counts stored (key-absent means zero)");
eq(saved().envelopes.length, 0, "4.5 fully-consumed envelope left the pile");
ok(/Checked in 4 cards against Gamma Cards/.test(text()), "4.6 undo notice shown");

/* ── 5. undo restores the exact prior state ────────────────────────────── */

await click(btn(/^Undo$/), "undo");
ok(/cards\s*0\/14/.test(text()), "5.1 check-ins reversed");
await sleep(SAVE_WAIT);
eq(saved().received, {}, "5.2 keys deleted, not zeroed");
eq(saved().envelopes.length, 1, "5.3 envelope came back");
eq(saved().envelopes[0].entries.length, 4, "5.4 with its entries intact");
ok(!/Checked in 4 cards/.test(text()), "5.5 undo notice cleared");

/* ── 6. near-duplicate packages surface as a tie ───────────────────────── */

await fresh();
await goTo("orphaned");
await record(["Brainstorm", "Brainstorm"]); // only Alpha/Beta carry it, identically
ok(/×2 Brainstorm/.test(text()), "6.1 re-tapping the same card bumps qty");
ok(/2 packages fit these cards equally well/.test(text()), "6.2 the tie is surfaced");
const tied = allBtns(/^This one$/);
eq(tied.length, 2, "6.3 both tied packages offered");
ok(/2 of 2 cards/.test(tied[0].parentElement.textContent), "6.4 each explains the whole envelope");
ok(/2 more still owed/.test(tied[0].parentElement.textContent), "6.5 and reports its own leftover");

/* ── 7. a partial match leaves a smaller envelope behind ───────────────── */

await fresh();
await goTo("orphaned");
await record(["Lightning Bolt", "Counterspell", "Sol Ring"], "USPS 9400 test");
ok(/no outstanding copy/.test(text()), "7.1 an entry nothing can explain is flagged");
await sleep(SAVE_WAIT);
const before = saved().envelopes[0];
await assign(0);
ok(/cards\s*2\/14/.test(text()), "7.2 only the two matched cards checked in");
ok(/1 card still in the envelope/.test(text()), "7.3 leftover reported in the notice");
await sleep(SAVE_WAIT);
const after = saved().envelopes[0];
eq(after.entries.length, 1, "7.4 leftover keeps just the unmatched card");
eq(after.entries[0].name, "Sol Ring", "7.5 the right card stayed behind");
eq(after.id, before.id, "7.6 leftover keeps its id");
eq(after.createdAt, before.createdAt, "7.7 keeps its createdAt");
eq(after.note, "USPS 9400 test", "7.8 keeps its note");

/* ── 8. iOS smart punctuation vs the CSV's straight apostrophe ─────────── */

await fresh();
await goTo("orphaned");
await click(btn(/Record an envelope/));
await type(cardInput(), "Urza’s Sag"); // curly, as an iPhone produces
ok(
  buttons().some((b) => /Urza/.test(b.textContent) && /out ·/.test(b.textContent)),
  "8.1 curly-apostrophe query finds the straight-apostrophe card"
);
await type(cardInput(), "Urza’s Saga");
ok(!btn(/^Add “/), "8.2 no duplicate 'as typed' row when it already matches");

await boot({
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-curly",
      createdAt: Date.parse("2026-08-01"),
      note: "",
      entries: [{ name: "Urza’s Saga", qty: 1 }],
    },
  ],
});
await goTo("orphaned");
const curly = allBtns(/^This one$/);
eq(curly.length, 1, "8.3 an entry STORED with the curly form still matches");
ok(/Delta Cards/.test(curly[0].parentElement.textContent), "8.4 the right package");
ok(!/no outstanding copy/.test(text()), "8.5 not treated as unmatched");

/* ── 9. persistence and migration ──────────────────────────────────────── */

await sleep(SAVE_WAIT);
const carried = saved(); // exactly what the app wrote
await boot(carried);
await goTo("orphaned");
ok(/Envelope ·/.test(text()), "9.1 envelopes survive a reload");
ok(/Urza/.test(text()), "9.2 with their entries");
ok(Array.isArray(carried.envelopes), "9.3 envelopes present in the saved blob");

/* a blob written before mystery mail shipped */
await boot({
  items: ITEMS,
  received: {},
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
await goTo("orphaned");
ok(/Nothing waiting/.test(text()), "9.4 pre-feature save migrates to an empty pile");
ok(!/undefined/.test(text()), "9.5 nothing undefined leaked into the UI");

/* ── 10. reset clears envelopes, and the debounce can't resurrect them ─── */

await fresh();
await goTo("orphaned");
await record(["Ponder"]);
await sleep(SAVE_WAIT);
eq(saved().envelopes.length, 1, "10.1 envelope saved before reset");
await click(btn(/^Reset$/), "reset");
await click(btn(/Tap again to clear everything/), "confirm reset");
await sleep(800); // past the debounce, which is when a stale value would reappear
eq(saved().envelopes ?? [], [], "10.2 envelopes gone and NOT rewritten by the debounce");
eq(saved().items ?? [], [], "10.3 items gone");

/* ── 11. candidates are derived, so they self-correct ──────────────────── */

await fresh();
await goTo("orphaned");
await record(["Ponder"]);
eq(allBtns(/^This one$/).length, 1, "11.1 Ponder's package offered");
/* check that package off by hand elsewhere; packages render expanded, so reach
   into the right card rather than grabbing the first button on the page */
await goTo("packages");
const gamma = btn(/Gamma Cards/).parentElement;
await click(
  [...gamma.querySelectorAll("button")].find((b) => /Mark all received/.test(b.textContent)),
  "mark Gamma received"
);
await goTo("orphaned");
eq(allBtns(/^This one$/).length, 0, "11.2 no longer offered once received elsewhere");
ok(/No outstanding package accounts/.test(text()), "11.3 says so plainly");
ok(/no outstanding copy/.test(text()), "11.4 and flags the entry");

/* ── 12. the older views still work ────────────────────────────────────── */

await fresh();
ok(/cards\s*0\/14/.test(text()), "12.1 totals unchanged by the feature");
await goTo("tally");
ok(/unique item/.test(text()), "12.2 by-item view still renders");
await goTo("packages");
ok(/4 packages/.test(text()), "12.3 package count unchanged");
await click(btn(/Hide received/), "hide received");
ok(/Showing remaining only/.test(text()), "12.4 hide-received still toggles");

/* ── 13. backup and restore carry envelopes ────────────────────────────── */

await fresh();
await goTo("orphaned");
await record(["Ponder", "Preordain"], "backup me");

let captured = null;
win.URL.createObjectURL = (b) => {
  captured = b;
  return "blob:test";
};
win.URL.revokeObjectURL = () => {};

await openSync();
await click(btn(/^Backup$/), "backup");
const plainText = await captured.text();
const plain = JSON.parse(plainText);
eq(plain.envelopes.length, 1, "13.1 backup carries the envelope");
eq(plain.envelopes[0].entries.length, 2, "13.2 with both entries");
eq(plain.envelopes[0].note, "backup me", "13.3 and the note");

await fresh();
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("mailday-backup.json", plainText);
await goTo("orphaned");
ok(/Envelope ·/.test(text()), "13.4 restore brings the envelope back");
ok(/backup me/.test(text()), "13.5 including its note");

/* restoring over a pending envelope is a silent data loss unless we say so */
await fresh();
await goTo("orphaned");
await record(["Brainstorm"]);
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("mailday-backup.json", plainText);
ok(/pending envelope was replaced/.test(text()), "13.6 restore warns about replaced envelopes");

/* ── 14. undo composes with a later hand edit ──────────────────────────── */

await fresh();
await goTo("orphaned");
await record(["Ponder"]);
await assign(0);
await sleep(SAVE_WAIT);
const ponderKey = Object.keys(saved().received)[0];
ok(/Ponder/.test(ponderKey), "14.1 the envelope checked in Ponder");

await goTo("packages");
const gamma2 = btn(/Gamma Cards/).parentElement;
await click(
  [...gamma2.querySelectorAll("button")].find((b) => /Mark all received/.test(b.textContent)),
  "mark Gamma received by hand"
);
ok(/cards\s*5\/14/.test(text()), "14.2 hand edit applied on top of the assignment");

await goTo("orphaned");
await click(btn(/^Undo$/), "undo after hand edit");
ok(/cards\s*4\/14/.test(text()), "14.3 undo removes only its own delta");
await sleep(SAVE_WAIT);
ok(!(ponderKey in saved().received), "14.4 the envelope's card is outstanding again");
eq(Object.keys(saved().received).length, 4, "14.5 the hand edit survived");

/* ── 15. two envelopes contending for one package ──────────────────────── */

await fresh();
await goTo("orphaned");
await record(["Brainstorm", "Brainstorm"]);
await record(["Brainstorm", "Brainstorm"]);
eq(envelopeCount(), 2, "15.1 two envelopes pending");
ok(/2 packages fit these cards equally well/.test(text()), "15.2 both ambiguous");
await assign(0);
ok(!/fit these cards equally well/.test(text()), "15.3 the survivor is no longer ambiguous");
eq(allBtns(/^This one$/).length, 1, "15.4 exactly one candidate left for it");

/* ── 16. only one two-tap confirm can be armed at a time ───────────────── */

await fresh();
await goTo("orphaned");
await record(["Ponder"]);
await click(btn(/^Discard$/), "arm discard");
ok(/Tap again to discard/.test(text()), "16.1 discard armed");
await click(btn(/^This one$/), "arm assign");
ok(/Tap again to check in/.test(text()), "16.2 assign armed");
ok(!/Tap again to discard/.test(text()), "16.3 arming one disarms the other");
eq(envelopeCount(), 1, "16.4 nothing actually fired");

/* ── 17. photos live outside the ledger and get swept when orphaned ────── */

await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-p",
        createdAt: Date.parse("2026-08-01"),
        note: "",
        photos: ["pho-1"],
        entries: [{ name: "Ponder", qty: 1 }],
      },
    ],
  },
  [
    ["pho-1", jpeg()],
    ["pho-orphan", jpeg()], // referenced by nothing
  ]
);
await goTo("orphaned");
ok(/1 photo stored/.test(text()), "17.1 photo count reported");
ok(/used on this device/.test(text()), "17.2 real quota line rendered");
await sleep(SAVE_WAIT);
ok(
  !JSON.stringify(saved()).includes("fake-jpeg-bytes"),
  "17.3 no image data anywhere in the ledger JSON"
);
eq(saved().envelopes[0].photos, ["pho-1"], "17.4 the envelope carries only the id");

await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-1"], "17.5 orphan swept, referenced blob kept");

await click(btn(/^Discard$/), "arm discard");
await click(btn(/Tap again to discard/), "confirm discard");
await sleep(SWEEP_WAIT);
eq(photoKeys(), [], "17.6 discarding an envelope frees its photo");

/* ── 18. photos survive an edit; reset clears them ─────────────────────── */

await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-q",
        createdAt: Date.parse("2026-08-01"),
        note: "keep me",
        photos: ["pho-2"],
        entries: [{ name: "Ponder", qty: 1 }],
      },
    ],
  },
  [["pho-2", jpeg()]]
);
await goTo("orphaned");
await click(btn(/^Edit$/), "edit envelope");
await click(btn(/Save changes/), "save unchanged");
await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-2"], "18.1 a round-trip through Edit keeps the photo");
eq(saved().envelopes[0].photos, ["pho-2"], "18.2 and its id");

await click(btn(/^Reset$/), "reset");
await click(btn(/Tap again to clear everything/), "confirm reset");
await sleep(800);
eq(photoKeys(), [], "18.3 reset clears the photo store too");

/* ── 19. the two backups, and what each restore does to photo ids ──────── */

await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-r",
        createdAt: Date.parse("2026-08-01"),
        note: "",
        photos: ["pho-3"],
        entries: [{ name: "Ponder", qty: 1 }],
      },
    ],
  },
  [["pho-3", jpeg()]]
);
await goTo("orphaned");
await openSync();
ok(!!btn(/Backup \+ photos/), "19.1 photo backup offered only when photos exist");

await click(btn(/^Backup$/), "plain backup");
const smallText = await captured.text();
const small = JSON.parse(smallText);
ok(!small.photos, "19.2 plain backup carries no images");
eq(small.envelopes[0].photos, ["pho-3"], "19.3 but keeps the ids");

await click(btn(/Backup \+ photos/), "photo backup");
await act(async () => {
  await sleep(60);
});
const bigText = await captured.text();
const big = JSON.parse(bigText);
ok(!!big.photos?.["pho-3"], "19.4 photo backup inlines the image");
ok(/^data:/.test(big.photos["pho-3"]), "19.5 as a data URL");

/* a photo-less restore must not leave ids pointing at blobs that exist nowhere */
await fresh();
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("plain.json", smallText);
await sleep(SAVE_WAIT);
eq(saved().envelopes[0].photos, [], "19.6 photo-less restore strips the ids");

/* the migration path: land on a fresh origin, get the photos back */
await fresh(); // empty photo store
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("photos.json", bigText);
ok(/1 photo too/.test(text()), "19.7 restore notice counts the photos");
eq(photoKeys(), ["pho-3"], "19.8 the blob is back in the photo store");
await sleep(SAVE_WAIT);
eq(saved().envelopes[0].photos, ["pho-3"], "19.9 and the envelope still points at it");
eq(await getPhoto("pho-3").text(), "fake-jpeg-bytes", "19.10 image survived byte-for-byte");

/* ...but on a device that STILL HOLDS the blob, the id must survive. The rule
   used to be all-or-nothing on the payload's photo map, so restoring a plain
   backup onto the very device that took the photo stripped the id and the
   sweep deleted the JPEG two seconds later — silent loss on a round trip that
   should have been a no-op. Same failure the pull path would have had. */
await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-r",
        createdAt: Date.parse("2026-08-01"),
        note: "",
        photos: ["pho-3"],
        entries: [{ name: "Ponder", qty: 1 }],
      },
    ],
  },
  [["pho-3", jpeg()]]
);
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("plain.json", smallText);
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-3"],
  "19.11 a photo-less restore keeps ids whose blob is on this device"
);
await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-3"], "19.12 so the sweep leaves the blob alone");

/* ── 20. a partial quantity checks in ONE copy, not the whole line ─────── */

/* Alpha and Beta each hold Brainstorm ×2. Recording a single copy must check in
   exactly one, leaving the other outstanding. Everything above happens to take
   a card's full quantity, so without this the mutation
   `next[itemKey] = qtyOf[itemKey]` — assign marks the whole line — passes the
   entire suite. Found by mutation testing; don't delete it. */
await fresh();
await goTo("orphaned");
await record(["Brainstorm"]); // one copy, of a line that has two
await assign(0);
ok(/cards\s*1\/14/.test(text()), "20.1 one copy checked in, not the pair");
await sleep(SAVE_WAIT);
eq(Object.values(saved().received), [1], "20.2 the line is at 1, not its full qty of 2");
eq(saved().envelopes.length, 0, "20.3 the envelope is fully consumed");

await goTo("packages");
ok(/1\/2/.test(text()), "20.4 the package shows the line half received");

/* ── 21. the masthead ──────────────────────────────────────────────────── */

/* The running head is what makes the tall masthead affordable: it collapses to
   a slim bar on scroll. Its whole risk is that the observer silently never
   attaches — the first commit renders the loading shell, so an effect that ran
   only on mount would bind to a sentinel that doesn't exist yet and the bar
   would stay invisible forever. Nothing about the page would look broken. */

await fresh();

ok(/MANIFEST|Manifest/.test(text()), "21.1 title renders");
ok(/C\.H Postal Company/.test(text()), "21.2 house line renders");
ok(/cards/i.test(text()) && /packages/i.test(text()) && /value/i.test(text()),
  "21.3 all three tallies render");

/* order matters: Orphaned sits left, Packages right, so the daily-driver view
   lands under the thumb */
const segs = buttons()
  .slice(0, 3)
  .map((b) => b.textContent.replace(/\d+$/, ""));
eq(segs, ["Orphaned", "Tally", "Packages"], "21.4 switch order, swapped");

const headBar = () => document.querySelector(".mdl-sticky");
ok(!!headBar(), "21.5 running head is in the DOM");
eq(headBar().getAttribute("data-stuck"), "no", "21.6 not pinned at rest");

/* the observer must have attached despite the loading shell on first commit */
ok(observers.length > 0, "21.7 observer attached after the ledger loaded");

/* stand in for a missing observer so the rest of the group still reports as
   failed assertions rather than taking the whole run down with a TypeError */
const io = observers[observers.length - 1] || { fire() {} };

await act(async () => {
  io.fire(false, -120); // sentinel scrolled off top
});
eq(headBar().getAttribute("data-stuck"), "yes", "21.8 pins once scrolled past");

await act(async () => {
  io.fire(true, 40); // scrolled back to the top
});
eq(headBar().getAttribute("data-stuck"), "no", "21.9 releases back at the top");

/* A sentinel can also be un-intersecting because it is BELOW the fold — on a
   viewport shorter than the masthead, that is the state at the very top of the
   page. Without the `top < 0` guard the bar would pin while you are already
   looking at the header. */
await act(async () => {
  io.fire(false, 400); // sentinel below the fold
});
eq(headBar().getAttribute("data-stuck"), "no",
  "21.10 does not pin when the sentinel is below the viewport");

/* ── 22. Tally sorts by unit rate ──────────────────────────────────────── */

/* Unit rate is basis ÷ copies, which genuinely disagrees with total basis in
   this fixture: Brainstorm's position is worth more than Ponder's (2.00 vs
   0.75) but each individual copy is cheaper (0.50 vs 0.75). The two orderings
   are therefore opposite — if this ever quietly sorts by basis again, 22.2
   flips. That's the whole point of asserting on this pair. */
await fresh();
await goTo("tally");

await choose(/sort items/i, "basis");
ok(
  text().indexOf("Brainstorm") < text().indexOf("Ponder"),
  "22.1 by biggest position, Brainstorm outranks Ponder"
);

await choose(/sort items/i, "rate");
ok(
  text().indexOf("Ponder") < text().indexOf("Brainstorm"),
  "22.2 by unit rate, Ponder outranks Brainstorm"
);
ok(
  text().indexOf("Urza") < text().indexOf("Swords to Plowshares"),
  "22.3 the $50 single still leads on unit rate"
);

/* ── 23. the control region ────────────────────────────────────────────── */

/* The data actions used to be gated on `items.length > 0` while the view switch
   was gated on `items.length > 0 || envelopes.length > 0`. A user holding
   hand-typed orphaned envelopes with an empty item list could therefore reach
   them and have NO Backup button — the one thing protecting data that exists
   nowhere else. CLAUDE.md claimed the opposite. */
await boot({
  items: [],
  received: {},
  envelopes: [
    { id: "env-1", createdAt: 1, note: "tracking 9400",
      entries: [{ name: "Brainstorm", qty: 1 }], photos: [] },
  ],
});

await openSync();
ok(!!btn(/^Backup$/), "23.1 Backup survives an empty item list");
ok(!!btn(/Re-import/), "23.2 so does Re-import");
ok(!!btn(/^Reset$/), "23.3 and Reset");
/* but the filters describe a list that doesn't exist, so they must stay away */
ok(
  !document.querySelector('input[aria-label^="Search cards"]'),
  "23.4 search stays hidden with no items"
);
ok(!document.querySelector("select"), "23.5 so does sort");

/* The date range collapses to one control. Seven chips wrapped to two rows at
   375px, and the custom from–to pair always claimed a third. */
await fresh();

const chips = () =>
  buttons().filter((b) => /^(All time|30d|45d|60d|90d|# days|Custom…)$/.test(
    b.textContent.trim()
  ));
const disclosure = () =>
  buttons().find((b) => b.getAttribute("aria-label") === "Change date range") || {
    textContent: "",
    getAttribute: () => null,
  };
/* stand in for a missing chip so a broken disclosure reports as failed
   assertions rather than taking the whole run down with a TypeError */
const chip = (label) =>
  chips().find((c) => c.textContent.trim() === label) || { getAttribute: () => null };

eq(chips().length, 0, "23.6 chip set is collapsed on load");
ok(/All time/.test(disclosure().textContent), "23.7 collapsed control shows the active range");
eq(disclosure().getAttribute("aria-expanded"), "false", "23.8 and reports it shut");

await click(disclosure(), "open range");
eq(chips().length, 7, "23.9 opening reveals every range");
eq(disclosure().getAttribute("aria-expanded"), "true", "23.10 and reports it open");

/* state conveyed by colour alone is invisible to a screen reader; the view
   switch already sets aria-pressed, so these match it */
eq(
  chip("All time").getAttribute("aria-pressed"),
  "true",
  "23.11 the active range is marked pressed"
);
eq(
  chip("30d").getAttribute("aria-pressed"),
  "false",
  "23.12 and the inactive ones are not"
);

const d30 = chips().find((c) => c.textContent.trim() === "30d");
if (d30) await click(d30, "pick 30d");
ok(/30d/.test(disclosure().textContent), "23.13 picking a range updates the collapsed label");

/* ── 24. Packages sort by unit rate ────────────────────────────────────── */

/* The option was added to BOTH sort dropdowns by a replace() without a count,
   but only the Tally view implemented it — picking it under Packages silently
   fell through to "newest". Delta is the discriminator: one $50 card, so it is
   LAST by date and FIRST by unit rate. If this ever falls through again, 24.1
   inverts. */
await fresh();
await goTo("packages");
await choose(/sort packages/i, "rate");

const t24 = text();
ok(
  t24.indexOf("Delta Cards") < t24.indexOf("Gamma Cards"),
  "24.1 the $50 single package leads on unit rate"
);
ok(
  t24.indexOf("Gamma Cards") < t24.indexOf("Alpha Cards"),
  "24.2 and a pricier basket outranks a cheap one"
);

await choose(/sort packages/i, "newest");
const t24b = text();
ok(
  t24b.indexOf("Delta Cards") > t24b.indexOf("Alpha Cards"),
  "24.3 by date that ordering inverts, so the two sorts really differ"
);

/* ── 25. pushing the ledger to GitHub ──────────────────────────────────── */

/* A platform with no remote must lose nothing: the file backups stay on the
   toolbar rather than hiding behind a disclosure that isn't there. */
await boot({ items: ITEMS, received: {} }, null, { noRemote: true });
ok(!btn(/^Sync/), "25.1 no Sync control when the platform has no remote");
ok(!!btn(/^Backup$/), "25.2 and Backup stays on the toolbar in that case");

await fresh();
await openSync();
ok(!!btn(/^Push$/), "25.3 Sync opens onto Push");
await click(btn(/^Push$/), "push with no key");
eq(pushes().length, 0, "25.4 a push with no key never reaches GitHub");
ok(/Add a GitHub key first/.test(text()), "25.5 and says why");
ok(
  !!document.querySelector('input[aria-label="GitHub access token"]'),
  "25.6 opening the key field rather than just complaining"
);

await saveGitHubKey();
await click(btn(/^Push$/), "push");
eq(pushes().length, 1, "25.7 with a key it goes");
const pushed = JSON.parse(pushes()[0].text);
eq(pushed.mailday, 1, "25.8 the payload is a Mail Day backup");
eq(pushed.items.length, ITEMS.length, "25.9 carrying every line");
for (const k of ["received", "envelopes", "dateFilter", "sortBy", "itemSort"])
  ok(k in pushed, `25.10 and the ${k} key`);
ok(
  !("savedAt" in pushed),
  "25.11 but no timestamp — the payload shape stays frozen"
);
ok(
  /^ledger \d{4}-\d\d-\d\d/.test(pushes()[0].message) &&
    new RegExp(`${ITEMS.length} lines`).test(pushes()[0].message),
  "25.12 the commit message carries the date and the counts instead"
);
eq(
  pushes()[0].sha,
  null,
  "25.13 the first push sends no sha — nothing is there to overwrite"
);

/* Non-ASCII is the reason the codec exists: btoa throws above U+00FF, card
   names carry Æ/ö/é and iOS smart punctuation turns a typed ' into ’. The
   harness encodes through the real utf8ToBase64, so this round trip is the
   thing that would break. */
await fresh();
await goTo("orphaned");
await record(["Æther Vial’s Jötun"], "Séance");
await goTo("packages");
await saveGitHubKey();
await click(btn(/^Push$/), "push non-ASCII");
/* named rather than left to crash on JSON.parse(null): with btoa in place of
   the codec this is the assertion that should point at the problem */
ok(!!remoteText(), "25.13b the non-ASCII payload encodes at all");
const trip = JSON.parse(remoteText() || "{}");
eq(
  trip.envelopes[0].entries[0].name,
  "Æther Vial’s Jötun",
  "25.14 a non-ASCII envelope entry survives the push byte-for-byte"
);
eq(trip.envelopes[0].note, "Séance", "25.15 and so does the note");

/* A stale push must be refused rather than silently overwriting the other
   device — and the force has to exist, or a device holding the copy worth
   keeping is stuck. */
const OTHER_DEVICE = JSON.stringify({
  mailday: 1,
  items: ITEMS.slice(0, 3),
  received: { [ITEMS[0].key]: 1 },
  envelopes: [],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

await boot({ items: ITEMS, received: {} }, null, { remote: OTHER_DEVICE });
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
ok(
  /changed since you last pulled/.test(text()),
  "25.16 pushing over a remote this device never pulled conflicts"
);
eq(
  JSON.parse(remoteText()).items.length,
  3,
  "25.17 and the other device's copy is still there"
);
ok(!!btn(/Push anyway/), "25.18 the force is offered");
await click(btn(/Push anyway/), "arm force");
eq(
  JSON.parse(remoteText()).items.length,
  3,
  "25.19 one tap on the force still overwrites nothing"
);
await click(btn(/Tap again to overwrite/), "confirm force");
eq(
  JSON.parse(remoteText()).items.length,
  ITEMS.length,
  "25.20 two taps overwrite deliberately"
);

/* the failures the user will actually meet */
await fresh();
await openSync();
await saveGitHubKey();
remote.fail = "auth";
await click(btn(/^Push$/), "expired key");
ok(/expired or been revoked/.test(text()), "25.21 an expired key says so plainly");
ok(
  !!document.querySelector('input[aria-label="GitHub access token"]'),
  "25.22 and reopens the field"
);

await fresh();
await openSync();
await saveGitHubKey();
remote.fail = "offline";
await click(btn(/^Push$/), "offline push");
ok(
  /safe on this device/.test(text()),
  "25.23 offline reassures rather than alarms — nothing was lost"
);

/* The token is a credential, not ledger data. It must not be in the saved
   ledger, in a backup file, in the pushed payload, or anywhere the app's own
   storage namespace can be enumerated. */
await fresh();
await openSync();
await saveGitHubKey("github_pat_SECRETVALUE");
await click(btn(/^Push$/), "push after saving a key");
await click(btn(/^Backup$/), "backup after saving a key");
const LEAK = /github_pat_|ghp_/;
await sleep(SAVE_WAIT);
ok(!LEAK.test(JSON.stringify(saved())), "25.24 the key is not in the saved ledger");
ok(!LEAK.test(pushes()[0].text), "25.25 nor in the pushed payload");
ok(!LEAK.test(await captured.text()), "25.26 nor in a backup file");
eq(
  (await win.storage.list()).keys,
  ["mailday:v1"],
  "25.27 and the ledger namespace holds only the ledger"
);

/* ── 26. pulling the ledger back ───────────────────────────────────────── */

await boot({ items: ITEMS, received: {} }, null, { remote: OTHER_DEVICE });
await openSync();
await click(btn(/Pull from GitHub/), "arm pull");
eq(
  remote.calls.filter((c) => c.op === "pull").length,
  0,
  "26.1 one tap arms and fetches nothing"
);
ok(/Tap again to replace/.test(text()), "26.2 and the button says what is next");
ok(
  /replaces every item, check-in and pending envelope/.test(text()),
  "26.3 with the full sentence where it can wrap"
);
await click(btn(/Tap again to replace/), "confirm pull");
await sleep(SAVE_WAIT);
eq(saved().items.length, 3, "26.4 the second tap replaces the ledger");
eq(saved().received[ITEMS[0].key], 1, "26.5 check-ins come with it");
ok(/Pulled from GitHub/.test(text()), "26.6 and the notice names the source");
ok(!remote.key, "26.7 none of which needed a key");

/* a pull that isn't a ledger must change nothing */
await boot({ items: ITEMS, received: {} }, null, {
  remote: JSON.stringify({ hello: "world" }),
});
await openSync();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
ok(/isn.t a Mail Day ledger/.test(text()), "26.8 a non-ledger payload is refused");
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "26.9 and nothing local moved");

/* the same warning a file restore gives, on the path where it matters more */
await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-p",
        createdAt: 1,
        note: "hand typed",
        entries: [{ name: "Ponder", qty: 1 }],
        photos: [],
      },
    ],
  },
  null,
  { remote: OTHER_DEVICE }
);
await openSync();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
ok(
  /pending envelope was replaced/.test(text()),
  "26.10 a pull warns about replaced envelopes, exactly like a file restore"
);

/* THE landmine: a pushed payload never carries photos, so a pull must not
   strip ids whose blobs are sitting right here — and the sweep must not then
   collect them. Push from the phone, pull on the same phone, photos gone. */
const PHOTO_STATE = {
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-ph",
      createdAt: 1,
      note: "",
      entries: [{ name: "Ponder", qty: 1 }],
      photos: ["pho-9"],
    },
  ],
};
await boot(PHOTO_STATE, [["pho-9", jpeg()]], {
  remote: JSON.stringify({
    mailday: 1,
    ...PHOTO_STATE,
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  }),
});
await openSync();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-9"],
  "26.11 a pull keeps ids whose blob is on this device"
);
await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-9"], "26.12 and the sweep leaves the blob alone");

/* the other half of the same rule: an id with no blob anywhere is dropped */
await boot({ items: ITEMS, received: {} }, null, {
  remote: JSON.stringify({
    mailday: 1,
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-x",
        createdAt: 1,
        note: "",
        entries: [{ name: "Ponder", qty: 1 }],
        photos: ["pho-gone"],
      },
    ],
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  }),
});
await openSync();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  [],
  "26.13 but an id whose blob is nowhere is still stripped"
);

/* a pull is how a device catches up, so the push it was blocked on now lands */
await boot({ items: ITEMS, received: {} }, null, { remote: OTHER_DEVICE });
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "blocked push");
ok(/changed since you last pulled/.test(text()), "26.14 blocked, as in group 25");
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await click(btn(/^Push$/), "push after pulling");
/* NB assert on the sha, not on the payload: a pull makes this device's ledger
   identical to the remote's, so "the remote holds 3 items" is true whether the
   push landed or not. The sha advancing is the only thing that distinguishes
   them — which is exactly the bookkeeping under test. */
ok(
  !/changed since you last pulled/.test(text()),
  "26.15 the following push is not blocked"
);
ok(
  remote.sha !== "sha-0",
  "26.16 because pulling refreshed the sha, so the push actually landed"
);

/* arming one destructive control disarms the other — two primed buttons side
   by side is the mis-tap the two-tap pattern exists to prevent */
await fresh();
await openSync();
await click(btn(/^Reset$/), "arm reset");
ok(/Tap again to clear everything/.test(text()), "26.17 Reset arms");
await click(btn(/Pull from GitHub/), "arm pull");
ok(/Tap again to replace/.test(text()), "26.18 Pull arms");
ok(!/Tap again to clear everything/.test(text()), "26.19 and Reset disarms itself");

/* ── 27. the adapter's two load-bearing decisions ──────────────────────── */

/* Everything above drives window.remote through the harness mock, which is the
   right level for "does the UI react correctly to a conflict". It does NOT
   cover the adapter's own rules, because entry.jsx mounts React on import and
   can't be loaded here — the same gap the localStorage and IndexedDB adapters
   have. So the two rules that fail quietly are pure functions, and this group
   asserts them directly. What is still uncovered: the fetch round trip itself. */

eq(classifyStatus(401, "Bad credentials"), "auth", "27.1 401 is an expired key");
eq(
  classifyStatus(403, "API rate limit exceeded", { remaining: "0" }),
  "rate-limit",
  "27.2 a 403 with the budget spent is throttling"
);
eq(
  classifyStatus(403, "You have exceeded a secondary rate limit", {
    retryAfter: 60,
  }),
  "rate-limit",
  "27.3 so is one carrying retry-after"
);
eq(
  classifyStatus(403, "Resource not accessible by personal access token"),
  "forbidden",
  "27.4 but a plain 403 is a permission problem, not throttling"
);
eq(classifyStatus(409, "is at abc but expected def"), "conflict", "27.5 409 conflicts");
eq(
  classifyStatus(422, 'Invalid request. "sha" wasn’t supplied.'),
  "conflict",
  "27.6 and so does a 422 about a missing sha — the second-device case"
);
eq(
  classifyStatus(422, "Invalid request. branch is not valid."),
  "server",
  "27.7 while an unrelated 422 does not"
);
eq(classifyStatus(404, "Not Found"), "missing", "27.8 404 means nothing pushed yet");
eq(
  classifyStatus(404, "No commit found for the ref data"),
  "no-branch",
  "27.9 unless it is the branch that is missing"
);
eq(classifyStatus(500, ""), "server", "27.10 5xx is GitHub's problem");

/* the sha rule: omitted only when there is nothing to overwrite */
const enc = (s) => `b64(${s})`;
const created = pushBody({
  text: "x",
  branch: "data",
  sha: null,
  message: "m",
  encode: enc,
});
ok(!("sha" in created), "27.11 the first push omits the sha — it is a create");
eq(created.branch, "data", "27.12 and targets the data branch, never main");
eq(created.content, "b64(x)", "27.13 encoding the payload on the way out");
const updated = pushBody({
  text: "x",
  branch: "data",
  sha: "abc123",
  message: "m",
  encode: enc,
});
eq(
  updated.sha,
  "abc123",
  "27.14 every later push sends the sha this device last saw"
);

/* ── 28. an empty ledger must still be able to Pull ────────────────────── */

/* The whole point of the feature: a new phone, or one ITP has cleared, opens
   the app holding nothing and needs to recover. Gated on data alone — as the
   rest of the toolbar rightly is — the one control that recovers from having
   no data was unreachable exactly when it was needed. Caught on the live site,
   not by this suite, which is why the assertion exists now. */
await boot({ items: [], received: {}, envelopes: [] }, null, {
  remote: OTHER_DEVICE,
});
ok(!!btn(/^Sync/), "28.1 Sync is reachable on a completely empty ledger");
await openSync();
ok(!!btn(/Pull from GitHub/), "28.2 and Pull with it");
ok(!btn(/^Reset$/), "28.3 but Reset is hidden — there is nothing to clear");
ok(
  !btn(/Re-import CSV/),
  "28.4 and so is Re-import — the upload zone is already on screen"
);
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(saved().items.length, 3, "28.5 and pulling actually recovers the ledger");

/* with no remote there is nothing to offer, so the toolbar stays away */
await boot({ items: [], received: {}, envelopes: [] }, null, { noRemote: true });
ok(!btn(/^Sync/), "28.6 no remote, no toolbar on an empty ledger");
ok(!btn(/^Backup$/), "28.7 and nothing else either");

/* ── 29. the parser decodes entities in seller names too ───────────────── */

/* The user's real export contains the seller "LT's Hobbies&amp;Games2". Product
   and set names went through decodeEntities from the start; the seller didn't,
   so the raw entity leaked into the package header, the Tally view's source
   rows and — worse, because it makes a sane search silently fail — the search
   haystack. This is the first test to drive a CSV through the parser at all;
   ITEMS is pre-parsed, which is exactly why the gap survived. */
const SELLER = "LT's Hobbies&amp;Games2";
const DECODED = "LT's Hobbies&Games2";

await boot({ items: [], received: {} });
await dropFile(
  "orders.csv",
  csv([
    { "Order Id": "E1", Party: SELLER, "Product Name": "Mox Diamond", Price: "5.00" },
    { "Order Id": "E1", Party: SELLER, "Product Name": "Sylvan Library", Price: "9.00" },
  ])
);
ok(/Imported 2 lines/.test(text()), "29.1 the CSV actually imported");
ok(text().includes(DECODED), "29.2 package header shows the decoded seller");
ok(!/&amp;/.test(text()), "29.3 and no raw entity anywhere on the page");
await sleep(SAVE_WAIT);
eq(saved().items[0].seller, DECODED, "29.4 the decoded name is what persists");

await type(
  document.querySelector('input[aria-label="Search cards, sets, sellers and order ids"]'),
  "Hobbies&Games2"
);
ok(/Mox Diamond/.test(text()), "29.5 searching the seller as displayed matches");
await type(
  document.querySelector('input[aria-label="Search cards, sets, sellers and order ids"]'),
  ""
);

await goTo("tally");
await click(btn(/Mox Diamond/), "expand the tally row");
ok(text().includes(DECODED), "29.6 Tally's source rows show it decoded too");

report();
