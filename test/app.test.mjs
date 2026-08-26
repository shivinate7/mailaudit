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
  backgroundFor,
  cell,
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
  openRange,
  openSync,
  pickSort,
  pushes,
  peeks,
  background,
  foreground,
  record,
  remote,
  remotePhotos,
  remotePhotoIds,
  setPhotosUnknown,
  jpegOf,
  bytesOf,
  remoteText,
  report,
  saveGitHubKey,
  saved,
  sleep,
  text,
  toggleShowing,
  type,
  win,
} from "./harness.mjs";
/* the adapter's pure rules — see group 27 for why these are imported directly */
import { classifyStatus, pushBody } from "../src/remote-rules.mjs";
import {
  photoName,
  photoIdFromName,
  mimeFromName,
  isAlreadyThere,
  photoPlan,
} from "../src/photo-rules.mjs";
import { utf8ToBase64, bytesToBase64, blobToBase64 } from "../src/b64.mjs";
import {
  mergeItems,
  mergeReceived,
  mergeEnvelopes,
  mergeLedger,
  mergeSummary,
} from "../src/merge-rules.mjs";

const fresh = () => boot({ items: ITEMS, received: {} });

/* ── 1. mystery mail hides what doesn't apply, keeps what does ─────────── */

await fresh();
await goTo("orphaned");
ok(/Nothing waiting/.test(text()), "1.1 empty pile shows its empty state");
ok(!!btn(/Record an envelope/), "1.2 record button present");
ok(!/Orders from/.test(text()), "1.3 date filter hidden — it applies to nothing here");
ok(
  !document.querySelector('input[aria-label^="Search cards"]'),
  "1.4 search hidden"
);
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
/* Showing starts on Unreceived: the app is opened with mail in hand, so the
   outstanding list is the one worth landing on. It still toggles both ways —
   it's a session control, not a persisted preference. */
ok(/Unreceived/.test(cell(/^Showing/).textContent), "12.4 Showing starts on Unreceived");
await toggleShowing();
ok(/Everything/.test(cell(/^Showing/).textContent), "12.5 one tap brings received rows back");
await toggleShowing();
ok(/Unreceived/.test(cell(/^Showing/).textContent), "12.6 and toggles back");
/* and the choice does not survive a reload. Switching to Everything is a
   session choice, not a preference: reopening the app lands on the
   outstanding list again. hideDone is deliberately absent from the saved
   shape, so this is guaranteed by there being nothing to load. */
await toggleShowing();
await fresh();
ok(
  /Unreceived/.test(cell(/^Showing/).textContent),
  "12.7 Everything doesn't survive a reload"
);

/* On iOS a home-screen app is usually backgrounded, not closed, so a remount
   is not what reopening looks like — coming back after a real absence has to
   count too. But a hop out to read a tracking number and straight back is the
   same session, and flipping the list under a thumb mid-check-in is the
   mis-tap invariant 5 exists to prevent. So the gap decides. */
await toggleShowing();
await backgroundFor(5_000);
ok(
  /Everything/.test(cell(/^Showing/).textContent),
  "12.8 a glance away is the same session"
);
await backgroundFor(5 * 60_000);
ok(
  /Unreceived/.test(cell(/^Showing/).textContent),
  "12.9 coming back after a real absence starts fresh"
);

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

await pickSort("Biggest position");
ok(
  text().indexOf("Brainstorm") < text().indexOf("Ponder"),
  "22.1 by biggest position, Brainstorm outranks Ponder"
);

await pickSort("Unit rate");
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
ok(!cell(/^Sorted by/), "23.5 so does sort");

/* The date range is one of three ruled cells now. It reports the active range
   AND how many lines are in it, and opens the full option set beneath the head
   rather than as a wrapping chip row. */
await fresh();

const opts = () =>
  buttons().filter((b) =>
    /^(All time|30 days|45 days|60 days|90 days|Last…|By month)$/.test(
      b.textContent.trim()
    )
  );
/* stand in for a missing option so a broken panel reports as failed assertions
   rather than taking the whole run down with a TypeError */
const opt = (label) =>
  opts().find((c) => c.textContent.trim() === label) || {
    getAttribute: () => null,
  };
const rangeCell = () =>
  cell(/^Orders from/) || { textContent: "", getAttribute: () => null };

eq(opts().length, 0, "23.6 the option set is collapsed on load");
ok(/All time/.test(rangeCell().textContent), "23.7 the cell reports the active range");
ok(/12 lines/.test(rangeCell().textContent), "23.8 and how many lines are in it");
eq(rangeCell().getAttribute("aria-expanded"), "false", "23.9 shut on load");

await openRange();
eq(opts().length, 7, "23.10 opening reveals every range, including the free one");
eq(rangeCell().getAttribute("aria-expanded"), "true", "23.11 and reports it open");

/* state conveyed by colour alone is invisible to a screen reader; the view
   switch already sets aria-pressed, so these match it */
eq(
  opt("All time").getAttribute("aria-pressed"),
  "true",
  "23.12 the active range is marked pressed"
);
eq(
  opt("30 days").getAttribute("aria-pressed"),
  "false",
  "23.13 and the inactive ones are not"
);

await click(opt("30 days"), "pick 30 days");
ok(/30 days/.test(rangeCell().textContent), "23.14 picking a range updates the cell");

/* The custom range is picked from the months the ledger actually contains —
   no typing, because iOS's numeric keypad has no hyphen key, and no way to
   express 2026-02-31. */
await openRange();
await click(opt("By month"), "by month");
const monthChips = () =>
  buttons().filter((b) => /^[A-Z][a-z]{2}( ’\d\d)?$/.test(b.textContent.trim()));
ok(monthChips().length > 0, "23.15 months are offered, derived from the orders present");
ok(
  monthChips().every((b) => /Jul|Jun|May/.test(b.textContent)),
  "23.16 and only months the ledger actually has"
);
await click(monthChips()[0], "pick the newest month");
ok(/Jul/.test(rangeCell().textContent), "23.17 which reads back as that month, not 'Custom'");
ok(
  !document.querySelector('input[type="date"]'),
  "23.18 and needs no native date field to do it"
);

/* ── 24. Packages sort by unit rate ────────────────────────────────────── */

/* The option was added to BOTH sort dropdowns by a replace() without a count,
   but only the Tally view implemented it — picking it under Packages silently
   fell through to "newest". Delta is the discriminator: one $50 card, so it is
   LAST by date and FIRST by unit rate. If this ever falls through again, 24.1
   inverts. */
await fresh();
await goTo("packages");
await pickSort("Unit rate");

const t24 = text();
ok(
  t24.indexOf("Delta Cards") < t24.indexOf("Gamma Cards"),
  "24.1 the $50 single package leads on unit rate"
);
ok(
  t24.indexOf("Gamma Cards") < t24.indexOf("Alpha Cards"),
  "24.2 and a pricier basket outranks a cheap one"
);

await pickSort("Newest");
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

/* The other half of the same rule — but "nowhere" now has to be established
   rather than assumed. Photos live in a private repo, so a device with no key
   cannot tell an empty store from one it isn't allowed to look at, and GitHub
   answers both with a 404. Stripping on that reading would destroy the link to
   a photo sitting safe on GitHub; keeping it costs a blank tile until the next
   pull. So the rule splits: strip only when the store was READ and genuinely
   didn't have it. */
const GONE_LEDGER = JSON.stringify({
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
});

await boot({ items: ITEMS, received: {} }, null, { remote: GONE_LEDGER });
await openSync();
await saveGitHubKey(); /* the key is what makes the photo store readable */
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  [],
  "26.13 an id the photo store was read and found not to hold is stripped"
);

/* and the case that used to be conflated with it */
await boot({ items: ITEMS, received: {} }, null, { remote: GONE_LEDGER });
await openSync();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-gone"],
  "26.13b but with no key the store is unreadable, so the id is KEPT, not lost"
);
ok(
  /photos need your key/i.test(text()),
  "26.13c and it says so rather than reporting them lost"
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

/* ── 30. photos push and pull ──────────────────────────────────────────────
   Photo files are immutable and addressed by id, so the whole algorithm is a
   set difference — nothing merges, nothing overwrites, and the same tap can be
   repeated safely. What these protect is the ORDER of a pull (download before
   replace, or every id is stripped) and the strict separation of the photo
   error channel from the ledger's, since the ledger's `conflict` arms a button
   that force-overwrites another device's check-ins. */

const withPhoto = (ids) => ({
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-p",
      createdAt: 1,
      note: "",
      entries: [{ name: "Ponder", qty: 1 }],
      photos: ids,
    },
  ],
});
const photoCalls = () => remote.calls.filter((c) => /Photo/.test(c.op));

/* a ledger with no photos in it at all */
await boot({ items: ITEMS, received: {} });
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "push a photoless ledger");
eq(photoCalls().length, 0, "30.1 a ledger with no photos makes no photo requests");

/* one photo, held locally, absent from the remote */
await boot(withPhoto(["pho-a"]), [["pho-a", jpegOf(1)]]);
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "first push");
await sleep(60);
eq(remotePhotoIds(), ["pho-a"], "30.2 a push sends a photo the remote lacks");

/* pushing again must send NOTHING: the set difference is what makes a repeat
   tap cheap, and what makes a partial upload resumable */
const sentSoFar = photoCalls().filter((c) => c.op === "pushPhoto").length;
/* the button reads "Pushed ✓" for 2.5s after a success — and that flash now
   starts AFTER the photo phase, not before it */
await click(btn(/^Push(ed ✓)?$/), "second push");
await sleep(60);
eq(
  photoCalls().filter((c) => c.op === "pushPhoto").length,
  sentSoFar,
  "30.3 pushing again sends nothing — only new bytes ever move"
);

/* a blob left behind by a discarded envelope is not ours to publish */
await boot({ items: ITEMS, received: {} }, [["pho-orphan", jpegOf(2)]]);
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "push with an unreferenced blob");
await sleep(60);
ok(
  !remotePhotoIds().includes("pho-orphan"),
  "30.4 a blob no envelope references is never pushed"
);

/* ---- the pull, and the ordering it depends on ---- */
const PHOTO_LEDGER = JSON.stringify({
  mailday: 1,
  ...withPhoto(["pho-a"]),
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

await boot({ items: ITEMS, received: {} }, null, {
  remote: PHOTO_LEDGER,
  remotePhotos: [["pho-a.jpg", await blobToBase64(jpegOf(1))]],
});
await openSync();
await saveGitHubKey();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-a"],
  "30.5 a pull onto a device with no blobs KEEPS the id"
);
eq(photoKeys(), ["pho-a"], "30.6 because it downloaded the blob first");
eq(
  await bytesOf(getPhoto("pho-a")),
  [...(await bytesOf(jpegOf(1)))],
  "30.7 and the bytes survived the round trip exactly"
);
eq(getPhoto("pho-a").type, "image/jpeg", "30.8 with its own type, not GitHub's");
await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-a"], "30.9 and the sweep leaves the downloaded blob alone");

/* the store is there but genuinely lacks it — the only case where dropping the
   id is right, and it must still say so rather than fail silently */
await boot({ items: ITEMS, received: {} }, null, { remote: PHOTO_LEDGER });
await openSync();
await saveGitHubKey();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
ok(/not on GitHub/i.test(text()), "30.10 a photo missing everywhere is reported");

/* ---- the one that guards the worst bug in the feature ---- */
await boot(withPhoto(["pho-a"]), [["pho-a", jpegOf(1)]]);
await openSync();
await saveGitHubKey();
remote.photoFail = "conflict"; /* GitHub 409s rapid writes to one repo */
await click(btn(/^Push$/), "push where the photo leg 409s");
await sleep(60);
ok(
  !btn(/Push anyway/),
  "30.11 a photo conflict NEVER arms Push anyway — that button overwrites the ledger"
);
eq(remoteText() && JSON.parse(remoteText()).items.length, ITEMS.length,
  "30.12 and the ledger push itself still landed");
remote.photoFail = null;

/* ---- the store we cannot see ---- */
await boot({ items: ITEMS, received: {} }, null, {
  remote: PHOTO_LEDGER,
  photosUnknown: "no-access",
});
await openSync();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-a"],
  "30.13 an unreadable photo store keeps every id — it is not evidence of loss"
);
eq(saved().items.length, ITEMS.length, "30.14 and the ledger still applied");
ok(!/not on GitHub/i.test(text()), "30.15 and nothing is reported as lost");


/* The sweep race, which is the reason the photo phase holds it off at all. A
   pull writes blobs while `envelopes` still holds the OLD list, so nothing
   re-runs the sweep effect and a timer armed before the pull started is still
   counting down against a keep-set that knows nothing about what is arriving.
   Two photos and a slow wire put a download on each side of that 2s timer. */
const TWO_PHOTO_LEDGER = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-p",
      createdAt: 1,
      note: "",
      entries: [{ name: "Ponder", qty: 1 }],
      photos: ["pho-a", "pho-b"],
    },
  ],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
await boot({ items: ITEMS, received: {} }, null, {
  remote: TWO_PHOTO_LEDGER,
  remotePhotos: [
    ["pho-a.jpg", await blobToBase64(jpegOf(1))],
    ["pho-b.jpg", await blobToBase64(jpegOf(2))],
  ],
});
remote.photoDelay = 1200; /* first lands ~1.2s, second ~2.4s — the sweep is due at 2s */
await openSync();
await saveGitHubKey();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
/* two 1.2s downloads, then the replace, then the debounced save — and past the
   2s mark where the pre-pull sweep was armed to fire */
await sleep(2400 + SWEEP_WAIT);
remote.photoDelay = 0;
eq(
  photoKeys().sort(),
  ["pho-a", "pho-b"],
  "30.16 a sweep falling due mid-download does not eat what just arrived"
);
eq(
  saved().envelopes[0].photos.sort(),
  ["pho-a", "pho-b"],
  "30.17 and both ids survive into the saved ledger"
);

/* The "gone" warning, both ways round. A pull is a full replace, so a photo the
   CURRENT ledger references and the incoming one does not is about to stop
   existing — and if it was never pushed, that was the last copy. But a photo
   BOTH ledgers reference survives untouched, and saying otherwise is a false
   alarm at the exact moment nothing is wrong. The first draft measured the
   wrong set and got both cases backwards. */
await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-local",
        createdAt: 1,
        note: "",
        entries: [{ name: "Ponder", qty: 1 }],
        photos: ["pho-local"],
      },
    ],
  },
  [["pho-local", jpegOf(7)]],
  { remote: PHOTO_LEDGER } /* incoming references pho-a, never pho-local */
);
await openSync();
await saveGitHubKey();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
ok(
  /never pushed/i.test(text()),
  "30.18 a photo the incoming ledger doesn't know about is reported as lost"
);

/* the inverse: both ledgers reference it and the blob is here, so it survives
   the pull completely — warning here would be a false alarm */
await boot(withPhoto(["pho-a"]), [["pho-a", jpegOf(1)]], { remote: PHOTO_LEDGER });
await openSync();
await saveGitHubKey();
await click(btn(/Pull from GitHub/), "arm");
await click(btn(/Tap again to replace/), "confirm");
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-a"],
  "30.19 a photo both ledgers reference survives the pull"
);
ok(
  !/never pushed/i.test(text()),
  "30.20 and is NOT reported as gone — that was the false alarm"
);

/* ── 31. the photo rules, asserted directly ────────────────────────────────
   Same reasoning as group 27: entry.jsx mounts React on import and is
   unreachable from here, so anything living there is untested by construction.
   Fetch plumbing is a fine thing to leave uncovered. These are not, because
   every one of them fails quietly — a wrong extension loses the image type, a
   mis-read 422 either re-uploads forever or calls a throttle a success, and a
   codec that treats a JPEG as text produces plausible corrupted bytes. */

eq(photoName("pho-a-1", "image/jpeg"), "pho-a-1.jpg", "31.1 jpeg names");
eq(photoName("pho-a-1", "image/png"), "pho-a-1.png", "31.2 png keeps its type");
eq(
  photoName("pho-a-1", ""),
  "pho-a-1.bin",
  "31.3 an unknown type still round-trips rather than guessing jpeg"
);
for (const mime of ["image/jpeg", "image/png", "image/heic", ""])
  eq(
    photoIdFromName(photoName("pho-mabc-3f9a", mime)),
    "pho-mabc-3f9a",
    `31.4 name/id round trip survives ${mime || "an unknown type"}`
  );
eq(photoIdFromName("README.md"), null, "31.5 a stray repo file is not a photo");
eq(
  photoIdFromName("ledger.json"),
  null,
  "31.6 nor is anything else that isn't ours"
);
eq(mimeFromName("pho-a-1.png"), "image/png", "31.7 the type comes back off the name");
eq(
  mimeFromName("pho-a-1.bin"),
  "application/octet-stream",
  "31.8 and falls back rather than lying about being an image"
);

const GH_422 = 'Invalid request.\n\n"sha" wasn\'t supplied.';
ok(isAlreadyThere(422, GH_422), "31.9 a sha-less PUT onto an existing path is 'already there'");
ok(
  !isAlreadyThere(409, "Conflict"),
  "31.10 but a 409 is GitHub throttling — calling that success loses the photo"
);
ok(!isAlreadyThere(422, "something else"), "31.11 and an unrelated 422 is not");
eq(
  classifyStatus(422, GH_422),
  "conflict",
  "31.12 which is why this cannot be read off the classified code — both are 'conflict'"
);

const plan = photoPlan({
  referenced: ["a", "b", "c"],
  local: ["a", "d"],
  remote: { known: true, ids: ["b"] },
});
eq(plan.toPush, ["a"], "31.13 push what is referenced and held but not remote");
eq(plan.toPull, ["b"], "31.14 pull what is referenced and remote but not held");
eq(plan.lost, ["c"], "31.15 report what is referenced and nowhere");
ok(!plan.toPush.includes("d"), "31.16 an unreferenced blob is never published");

const blind = photoPlan({
  referenced: ["a", "b"],
  local: ["a"],
  remote: { known: false, reason: "no-access" },
});
eq(blind.lost, [], "31.17 an unreadable store reports NOTHING lost");
eq(blind.toPush, [], "31.18 and pushes nothing, since it cannot know what is there");
ok(!blind.known, "31.19 it says it does not know, rather than guessing empty");

/* the codec: a JPEG is not text, and the text encoder mangles it */
const raw = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x80, 0xfe]);
const asBytes = bytesToBase64(raw);
eq(
  [...Buffer.from(asBytes, "base64")],
  [...raw],
  "31.20 bytesToBase64 round-trips arbitrary bytes exactly"
);
ok(
  utf8ToBase64(new TextDecoder().decode(raw)) !== asBytes,
  "31.21 and the text encoder does NOT — which is why photos need their own"
);
eq(
  await blobToBase64(jpegOf(3)),
  bytesToBase64(new Uint8Array(await jpegOf(3).arrayBuffer())),
  "31.22 blobToBase64 is that same core, over a blob"
);
eq(
  utf8ToBase64("LT's Hobbies&Games2 · Æther ’x’"),
  bytesToBase64(new TextEncoder().encode("LT's Hobbies&Games2 · Æther ’x’")),
  "31.23 and the ledger path is observably unchanged by sharing it"
);


/* ── 32. getting from a search hit to the whole order ──────────────────
   Search filters *inside* a package, so one matching line draws a card that
   looks like a complete one-line order — exactly the wrong thing to believe
   with the envelope in your hand. Until now there was no way out of it: the
   rest of that order was unreachable without clearing the search and hunting
   the seller down by hand, which on an iOS keyboard costs enough that nobody
   does it. Two entrances, one idea — `revealed`, the set of packages that
   ignore the filters and render the whole order. */

const search = () =>
  document.querySelector(
    'input[aria-label="Search cards, sets, sellers and order ids"]'
  );
const card = (re) => btn(re)?.parentElement;
const revealBtn = (c) =>
  [...c.querySelectorAll("button")].find((b) =>
    /in this order|whole order/.test(b.textContent)
  );
const orderBtn = (id) =>
  document.querySelector(`button[aria-label="Show the whole order ${id}"]`);
/* the jump scrolls on a frame, and the frame lands outside the click's act() */
const settle = () => act(async () => await sleep(0));

await fresh();
await type(search(), "Lightning Bolt");
eq(
  allBtns(/more lines? in this order/).length,
  3,
  "32.1 every filtered card says how much of itself the search is hiding"
);
ok(
  /\+4 more lines in this order/.test(card(/Gamma Cards/).textContent) &&
    /\+2 more lines in this order/.test(card(/Alpha Cards/).textContent),
  "32.2 and the count is that package's own, not the page's"
);
ok(
  /1 left · \$1\.00/.test(card(/Alpha Cards/).textContent),
  "32.3 the header still describes the matching line while filtered"
);

await click(revealBtn(card(/Alpha Cards/)), "show all of Alpha's order");
ok(
  /Counterspell/.test(card(/Alpha Cards/).textContent) &&
    /Brainstorm/.test(card(/Alpha Cards/).textContent),
  "32.4 revealing shows the rest of that order"
);
ok(
  !/Counterspell/.test(card(/Beta Games/).textContent),
  "32.5 and only that one — the other candidates stay filtered for comparison"
);
ok(
  /4 left · \$4\.00/.test(card(/Alpha Cards/).textContent),
  "32.6 the header now covers the whole order, which is what 'show all' means"
);

await click(revealBtn(card(/Alpha Cards/)), "back to matches");
ok(
  !/Counterspell/.test(card(/Alpha Cards/).textContent),
  "32.7 and it toggles back"
);

await type(search(), "");
eq(
  allBtns(/in this order/).length,
  0,
  "32.8 nothing hidden, nothing offered — the control is the search's, not the card's"
);

/* the Tally view has no card to expand, so its way in is the order id */
await fresh();
await type(search(), "Lightning Bolt");
await goTo("tally");
await click(btn(/Lightning Bolt/), "expand the tally row");
ok(!!orderBtn("C1"), "32.9 each source copy carries a way into its order");
await click(orderBtn("C1"), "open Gamma's order");
await settle();
eq(
  buttons()
    .find((b) => /^Packages/.test(b.textContent))
    .getAttribute("aria-pressed"),
  "true",
  "32.10 which lands in Packages"
);
ok(
  /Ponder/.test(card(/Gamma Cards/).textContent) &&
    /Swords to Plowshares/.test(card(/Gamma Cards/).textContent),
  "32.11 on the whole order, not the one line that matched"
);
ok(
  !/Counterspell/.test(card(/Alpha Cards/).textContent),
  "32.12 leaving every other result exactly as it was"
);
eq(
  search().value,
  "Lightning Bolt",
  "32.13 and the search survives the trip — one tap gets you back to Tally"
);

await type(search(), "Lightning");
ok(
  !/Ponder/.test(card(/Gamma Cards/).textContent),
  "32.14 a new query is a new question, so the reveals go with it"
);

/* the hideDone bypass. Ponder is already checked in, so a reveal that only
   ignored the query would show four lines and call it the whole order — and
   a package with every line received would drop out of the list entirely,
   landing the jump on nothing at all. */
await boot({ items: ITEMS, received: { "C1|3|pPonder": 1 } });
/* Showing defaults to Unreceived, so hideDone is already on here — don't
   toggle it, or this stops testing the bypass and passes for free. */
await type(search(), "Lightning Bolt");
await goTo("tally");
await click(btn(/Lightning Bolt/), "expand the tally row");
await click(orderBtn("C1"), "open Gamma's order");
await settle();
ok(
  /Ponder/.test(card(/Gamma Cards/).textContent),
  "32.15 the whole order means whole — Hide received is bypassed too"
);

/* The order id sits inside a row whose whole surface checks a card in. Without
   stopPropagation, a tap that meant to look would quietly mark it received:
   a data write from a navigation gesture, which is the mis-tap invariant 5
   exists to prevent. */
await fresh();
await goTo("tally");
await click(btn(/Lightning Bolt/), "expand the tally row");
await click(orderBtn("A1"), "open Alpha's order");
await settle();
ok(
  /cards\s*0\/14/.test(text()),
  "32.16 opening an order checks nothing in"
);

/* ── 33. merging two devices' ledgers ─────────────────────────────────────
   Pure, imported directly, same rationale as groups 27 and 31: this is the
   piece of the sync that fails by producing a plausible WRONG ledger rather
   than an error, and a merge that quietly drops 35 imported lines is
   indistinguishable from one that worked. The branch history records that
   exact loss happening for real (752 items -> 717 -> 752). */

/* the shape of the actual bug: each device holds what the other is missing */
const PHONE = {
  items: ITEMS.slice(0, 3),
  received: { [ITEMS[0].key]: 1, [ITEMS[1].key]: 1 },
  envelopes: [],
  sortBy: "newest",
  itemSort: "missing",
  dateFilter: { preset: "all", from: "", to: "" },
};
const LAPTOP = {
  items: ITEMS, /* the same three plus everything a fresh CSV added */
  received: { [ITEMS[0].key]: 1 },
  envelopes: [],
  sortBy: "value",
  itemSort: "basis",
  dateFilter: { preset: "days", from: "", to: "", days: "30" },
};

const m33 = mergeLedger(PHONE, LAPTOP);
eq(m33.merged.items.length, ITEMS.length, "33.1 the laptop's imported lines survive");
eq(
  m33.merged.received[ITEMS[1].key],
  1,
  "33.2 and so do the check-ins the laptop had never seen"
);
eq(m33.stats.itemsAdded, ITEMS.length - 3, "33.3 the count of what arrived is reported");

/* the property the whole feature rests on: neither direction loses anything */
const back = mergeLedger(LAPTOP, PHONE);
eq(
  back.merged.items.length,
  m33.merged.items.length,
  "33.4 merging the other way round gives the same line count"
);
eq(
  Object.keys(back.merged.received).length,
  Object.keys(m33.merged.received).length,
  "33.5 and the same check-ins — the merge cannot pick a loser"
);

/* idempotence, which is what makes a retry after a half-failed sync harmless */
const again = mergeLedger(m33.merged, LAPTOP);
eq(again.stats.itemsAdded, 0, "33.6 merging the same thing twice adds nothing");
eq(again.merged.items.length, ITEMS.length, "33.7 and changes nothing");

/* counts take the max, so a partially-received line keeps the further count */
eq(
  mergeReceived({ k: 1 }, { k: 3 }).received.k,
  3,
  "33.8 the further-along count wins"
);
eq(
  mergeReceived({ k: 3 }, { k: 1 }).received.k,
  3,
  "33.9 in either direction — this is a max, not a last-writer-wins"
);
eq(mergeReceived({ k: 3 }, { k: 1 }).added, 0, "33.10 and nothing is reported added");

/* view preferences are per-device: syncing them makes the phone's sort jump
   because the laptop happened to be sorted differently */
eq(m33.merged.sortBy, "newest", "33.11 the local sort survives a merge");
eq(m33.merged.itemSort, "missing", "33.12 and so does the local item sort");
eq(m33.merged.dateFilter.preset, "all", "33.13 and the local date range");

/* the collision rule. Assignment SHRINKS an envelope, so "prefer the bigger
   one" would resurrect the entries just checked in — while mergeReceived also
   keeps the check-ins they produced, leaving the same cards both received and
   still sitting in the envelope. */
const ASSIGNED = {
  id: "env-1",
  createdAt: 10,
  updatedAt: 200,
  note: "",
  entries: [{ name: "Ponder", qty: 1 }],
  photos: [],
};
const STALE = {
  id: "env-1",
  createdAt: 10,
  updatedAt: 100,
  note: "",
  entries: [
    { name: "Ponder", qty: 1 },
    { name: "Lightning Bolt", qty: 1 },
    { name: "Counterspell", qty: 1 },
  ],
  photos: [],
};
eq(
  mergeEnvelopes([ASSIGNED], [STALE]).envelopes[0].entries.length,
  1,
  "33.14 the freshest write wins, so an assigned-away entry stays away"
);
eq(
  mergeEnvelopes([STALE], [ASSIGNED]).envelopes[0].entries.length,
  1,
  "33.15 and it wins from the other side too"
);
/* absent on everything written before this shipped — has to be handled, not
   migrated (invariant 2: new keys optional and defaulted) */
const NOSTAMP = { id: "env-1", createdAt: 10, entries: [{ name: "X", qty: 9 }] };
eq(
  mergeEnvelopes([ASSIGNED], [NOSTAMP]).envelopes[0].entries[0].name,
  "Ponder",
  "33.16 an unstamped copy loses to a stamped one rather than crashing"
);
eq(
  mergeEnvelopes([NOSTAMP], [{ ...NOSTAMP, entries: [] }]).envelopes[0].entries.length,
  1,
  "33.17 and two unstamped copies tie to the local one"
);

/* the deliberate bias: an envelope's entries are hand-typed and exist nowhere
   else, and invariant 7 means a stray one decides nothing on its own */
const other = mergeEnvelopes([], [ASSIGNED]);
eq(other.envelopes.length, 1, "33.18 an envelope only the other device has is adopted");
eq(other.added, 1, "33.19 and counted");

eq(
  mergeItems(ITEMS.slice(0, 2), []).items.length,
  2,
  "33.20 merging nothing in drops nothing"
);
ok(
  /nothing new/.test(mergeSummary({ itemsAdded: 0, checkInsAdded: 0, envelopesAdded: 0 })),
  "33.21 a merge that changed nothing says so rather than claiming a win"
);
ok(
  /35 new lines/.test(mergeSummary({ itemsAdded: 35, checkInsAdded: 0, envelopesAdded: 0 })),
  "33.22 and one that did says what arrived"
);

/* ── 34. the conflict stops being a trap ──────────────────────────────────
   Group 25 proves a stale push is BLOCKED. This proves it can now be resolved
   without either device losing work — which is the entire point, because both
   previous resolutions were lossy and the history shows the lossy one being
   taken. */

/* the laptop pushed an import; this phone has unpushed check-ins and a stale
   item list — precisely the 08-22 state in the branch history */
const LAPTOP_PUSHED = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

await boot(
  { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } },
  null,
  { remote: LAPTOP_PUSHED }
);
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
ok(/changed since you last pulled/.test(text()), "34.1 the push is blocked, as before");
ok(!!btn(/Merge & push/), "34.2 but now there is a way out that isn't lossy");

await click(btn(/Merge & push/), "merge");
await settle();
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "34.3 the laptop's imported lines arrive");
eq(
  saved().received[ITEMS[0].key],
  1,
  "34.4 and this device's check-ins are still here"
);
ok(
  /Merged/.test(text()),
  "34.5 and it says what happened"
);
eq(
  JSON.parse(remoteText()).items.length,
  ITEMS.length,
  "34.6 the merged ledger reached GitHub, so the conflict is cleared"
);
eq(
  JSON.parse(remoteText()).received[ITEMS[0].key],
  1,
  "34.7 carrying the check-ins the remote had never seen"
);

/* Merge destroys nothing, so arming it would say the opposite of what it does
   — and invariant 6's two-tap pattern is for destructive actions specifically. */
await boot(
  { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } },
  null,
  { remote: LAPTOP_PUSHED }
);
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
await click(btn(/^Reset$/), "arm reset");
ok(/Tap again to clear everything/.test(text()), "34.8 Reset arms");
await click(btn(/Merge & push/), "merge while reset is armed");
await settle();
ok(!/Tap again to clear everything/.test(text()), "34.9 merging disarms Reset");
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "34.10 and did not clear the ledger");

/* the notice, and the merge that only brings in */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: LAPTOP_PUSHED });
await openSync();
await settle();
ok(
  /pushed newer lines/.test(text()),
  "34.11 a device that is behind is told so without being made to pull"
);
eq(peeks().length > 0, true, "34.12 which it learned from one cheap read, not a pull");
await click(btn(/^Merge$/), "merge in");
await settle();
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "34.13 merging brings the new lines in");
ok(!/pushed newer lines/.test(text()), "34.14 and the notice clears");

/* ---- auto-push ----
   The reason the merge had to come first: automating pushes without it turns
   the trap above from occasional into the normal way two devices meet. */

await fresh();
await openSync();
await saveGitHubKey();
ok(!!btn(/Auto-push/), "34.15 the toggle appears once there is a key");
await click(btn(/○ Auto-push/), "turn it on");
await settle();
eq(remote.auto, true, "34.16 and it is remembered by the transport layer");
eq(
  saved().auto,
  undefined,
  "34.17 NOT in the ledger — it is a device setting, like the token"
);

/* Backgrounding runs auto-push straight away rather than after the 90s idle
   debounce, so these drive that path — which is also a real one: switching away
   mid-mail-day is the last chance to catch a session that never went idle. */

/* THE safety property. "I could not look" must never be read as "all clear":
   pushing on an unknown remote state is exactly how one device overwrites the
   other, and it is the reason peek() is three-valued at all. */
await boot({ items: ITEMS, received: {} }, null, { remote: LAPTOP_PUSHED });
await openSync();
await saveGitHubKey();
await click(btn(/○ Auto-push/), "arm auto-push");
await settle();
remote.peekUnknown = "offline";
const unseen = pushes().length;
await background();
eq(pushes().length, unseen, "34.18 auto-push refuses to write when it could not look");
remote.peekUnknown = null;

/* and when it CAN look and the other device is ahead, it still doesn't push —
   it says so instead, which is the whole point of not automating the pull */
const behind = pushes().length;
await background();
eq(pushes().length, behind, "34.19 nor when the other device is ahead");
await foreground();
ok(/pushed newer lines/.test(text()), "34.20 it reports it rather than overwriting");

/* the ordinary case: nobody is ahead, so it goes */
await boot({ items: ITEMS, received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();
await click(btn(/○ Auto-push/), "arm auto-push");
await settle();
const quiet = pushes().length;
await background();
ok(pushes().length > quiet, "34.21 with the remote in step, auto-push pushes");
ok(
  peeks().length > 0,
  "34.22 and it looked first — the peek is what makes the push safe"
);

/* a conflict opening between the look and the write must not leave "Push
   anyway" armed on a screen nobody is watching */
await boot(
  { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } },
  null,
  { remote: LAPTOP_PUSHED }
);
await openSync();
await saveGitHubKey();
await click(btn(/○ Auto-push/), "arm auto-push");
await settle();
/* peek reports all clear, but the remote moves before the PUT lands — the race
   the optimistic sha check exists to catch */
remote.peekUnknown = null;
remote.deviceSha = remote.sha; /* so peek says all clear */
remote.pushFailOnce = "conflict"; /* ...and the write disagrees */
await background();
await settle();
await sleep(SAVE_WAIT);
eq(
  saved().items.length,
  ITEMS.length,
  "34.23 a conflict during an unattended push resolves by merging, not by forcing"
);
eq(
  saved().received[ITEMS[0].key],
  1,
  "34.24 keeping this device's check-ins through it"
);

/* Two gaps the mutation pass found: group 33 proves mergeEnvelopes prefers the
   freshest write, but nothing proved the APP stamps one when an assignment
   shrinks an envelope — and with both stamps equal, local wins a tie anyway, so
   the bug hid. The stamp only earns its keep when the remote copy was touched
   more recently than this device's last *save*, which is what this sets up. */
const ENV_LOCAL = {
  id: "env-s",
  createdAt: 5,
  updatedAt: 1,
  note: "",
  entries: [
    { name: "Ponder", qty: 1 },
    { name: "Zzz Unmatched", qty: 1 },
  ],
  photos: [],
};
const REMOTE_HAS_BOTH = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  /* the pre-assignment copy, stamped LATER than this device's stored envelope */
  envelopes: [{ ...ENV_LOCAL, updatedAt: 2 }],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

await boot({ items: ITEMS, received: {}, envelopes: [ENV_LOCAL] }, null, {
  remote: REMOTE_HAS_BOTH,
});
await goTo("orphaned");
await assign(0); /* checks Ponder in; "Zzz Unmatched" stays as a leftover */
eq(envelopeCount(), 1, "34.26 a partial assignment leaves the envelope behind");
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
await click(btn(/Merge & push/), "merge");
await settle();
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].entries.length,
  1,
  "34.27 the assignment stamps the envelope, so the remote's stale copy loses"
);
ok(
  !/Ponder/.test(JSON.stringify(saved().envelopes)),
  "34.28 the entry that was checked in does not come back"
);

/* And the other survivor: a merge adopts the remote's envelopes, so the photo
   phase has to survey the MERGED reference list. Reading the hook's value gives
   the pre-merge list — React has not committed — and a photo this device holds
   for an envelope only the remote knew about is silently never uploaded. The
   real shape of this is a ledger push that landed while its photo upload was
   rate-limited. */
const REMOTE_WANTS_PHOTO = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-p",
      createdAt: 7,
      updatedAt: 7,
      note: "",
      entries: [{ name: "Ponder", qty: 1 }],
      photos: ["pho-9"],
    },
  ],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
/* the blob is HERE; the photo repo does not have it; no local envelope
   references it until the merge adopts the remote's */
await boot({ items: ITEMS, received: {}, envelopes: [] }, [["pho-9", jpegOf(3)]], {
  remote: REMOTE_WANTS_PHOTO,
});
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
await click(btn(/Merge & push/), "merge");
await settle();
ok(
  remotePhotoIds().includes("pho-9"),
  "34.29 a photo the merge adopts is uploaded, not skipped"
);

/* THE ordering the whole feature rests on, and the one the pull path already
   pins at 30.5-30.9: a merge adopts the other device's envelopes, so their
   photo ids arrive with no blob here yet. Apply the ledger before downloading
   and applyBackup's present-set strips every one of them — the debounced save
   then writes the stripped ledger and the next push publishes it over the good
   copy. The blob below is deliberately ONLY on the remote; a local copy would
   put the id in `present` anyway and the test would pass either way. */
const MERGE_PHOTO_LEDGER = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-r",
      createdAt: 9,
      updatedAt: 9,
      note: "",
      entries: [{ name: "Ponder", qty: 1 }],
      photos: ["pho-7"],
    },
  ],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
await boot({ items: ITEMS.slice(0, 3), received: {}, envelopes: [] }, null, {
  remote: MERGE_PHOTO_LEDGER,
  remotePhotos: [["pho-7.jpg", await blobToBase64(jpegOf(7))]],
});
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
await click(btn(/Merge & push/), "merge");
await settle();
await sleep(SAVE_WAIT);
eq(
  saved().envelopes[0].photos,
  ["pho-7"],
  "34.31 a merge downloads photos BEFORE it applies, so adopted ids survive"
);
ok(photoKeys().includes("pho-7"), "34.32 and the blob really landed on this device");

/* A third writer landing between the merge's pull and its push. Leaving a bare
   message and no button here would strand the user on a screen whose only
   remaining options are the two lossy ones — and merging again is both the
   right next move and convergent. */
await boot(
  { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } },
  null,
  { remote: LAPTOP_PUSHED }
);
await openSync();
await saveGitHubKey();
await click(btn(/^Push$/), "stale push");
remote.pushFailOnce = "conflict";
await click(btn(/Merge & push/), "merge into a moving remote");
await settle();
ok(
  !!btn(/Merge & push/),
  "34.30 a conflict during the merged push still offers the safe way out"
);

/* auto-push off is off */
await boot({ items: ITEMS, received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();
const off = pushes().length;
await background();
eq(pushes().length, off, "34.25 with the toggle off, backgrounding pushes nothing");

report();
