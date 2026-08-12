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
  dropFile,
  envelopeCount,
  eq,
  getPhoto,
  goTo,
  jpeg,
  observers,
  ok,
  photoKeys,
  record,
  report,
  saved,
  sleep,
  text,
  type,
  win,
} from "./harness.mjs";

const fresh = () => boot({ items: ITEMS, received: {} });

/* ── 1. mystery mail hides what doesn't apply, keeps what does ─────────── */

await fresh();
await goTo("orphaned");
ok(/Nothing waiting/.test(text()), "1.1 empty pile shows its empty state");
ok(!!btn(/Record an envelope/), "1.2 record button present");
ok(!/Orders from/.test(text()), "1.3 date filter hidden — it applies to nothing here");
ok(!document.querySelector('input[placeholder^="Search card"]'), "1.4 search hidden");
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

report();
