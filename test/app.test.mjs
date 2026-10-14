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
  openHistory,
  versionMetas,
  versionText,
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
  reachFor,
  showingText,
  onLedger,
  backTo,
  pushes,
  peeks,
  background,
  drain,
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
  savedText,
  versionStore,
  sleep,
  setSyncNetFail,
  setSyncTooBig,
  setSyncBadShape,
  syncBadShapeCount,
  setSyncKeyRefused,
  syncCalls,
  syncCloseCount,
  syncRev,
  fireSyncRev,
  fireSyncRevOnly,
  holdSyncPosts,
  releaseSyncGet,
  unmountApp,
  clearSyncStore,
  holdRemotePushes,
  installClock,
  uninstallClock,
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
  RETENTION,
  dayKey,
  dayAnchors,
  hourAnchors,
  keptIds,
  prunePlan,
  shouldSnapshot,
} from "../src/version-rules.mjs";
import {
  mergeItems,
  mergeReceived,
  mergeEnvelopes,
  mergeStamps,
  mergeLedger,
  mergeSummary,
} from "../src/merge-rules.mjs";
/* group 60 reads the palette from the built bundle and from the files on disk */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const fresh = () => boot({ items: ITEMS, received: {} });

/* The bottom bar's tabs (decision phone-nav-is-bottom-bar). Found by the nav's
   name, never by position. A tab's count badge is stripped from its name. The
   current tab is the one with a non-"false" aria-current (contract: "page"). */
const viewTabs = () =>
  [...(document.querySelector('nav[aria-label="Views"]')?.querySelectorAll("button") ?? [])];
const tabName = (b) => b.textContent.replace(/\d+$/, "").trim();
const currentTab = () =>
  viewTabs()
    .filter((b) => b.getAttribute("aria-current") && b.getAttribute("aria-current") !== "false")
    .map(tabName);

/* ── 65. owner ruling 2026-10-12: no GitHub verbs on screen ────────────────
   "i thought we are eliminating push and pull". Pull, Push anyway and the
   GitHub key line leave the rendered text, so no state a user can reach may
   show them. Placed before group 1 so a later crash in the suite cannot hide
   these reds. Records: ledger-tab-holds-options, sync-revamp-cloudflare. */

const AHEAD65 = JSON.stringify({
  mailday: 1,
  items: ITEMS.slice(0, 3),
  received: {},
  envelopes: [],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
const FORBIDDEN_WORDS = [/\bPull/, /push anyway/i, /Add a GitHub key/];
const forbiddenIn = () => FORBIDDEN_WORDS.filter((re) => re.test(text())).map(String);

await fresh();
eq(forbiddenIn(), [], "65.1 no rendered text mentions Pull, push anyway or Add a GitHub key (Ledger tab)");

await goTo("orphaned");
eq(forbiddenIn(), [], "65.2 nor on the Orphaned tab");

await boot({ items: ITEMS, received: {} }, null, { remote: AHEAD65, remoteKey: "github_pat_testtoken" });
await openSync();
eq(forbiddenIn(), [], "65.3 nor in the open Sync panel, with GitHub ahead and a key set");

await boot({ items: [], received: {} }, null, { remote: AHEAD65 });
await openSync();
eq(forbiddenIn(), [], "65.4 nor on an empty ledger with no key, where recovery is needed");

/* the ledger tab button is named by its visible label, and nothing else */
await fresh();
const ledgerTab = viewTabs().find((b) => tabName(b) === "Ledger");
eq(
  ledgerTab?.textContent.trim(),
  "Ledger",
  "65.5 the Ledger tab button has the accessible name Ledger"
);

/* owner default 5 (orchestrator, 2026-10-12): a GitHub state shows nothing to
   the user. The mirror resolves a behind or conflicted copy itself, and a
   missing GitHub token only stops the mirror. The advisory and remoteMsg speak
   only of the Worker. */
const GITHUB_STATE_TEXT = /newer lines|pushed newer|changed since you last pulled|can’t see the backup|tap to add its key/;
await boot({ items: ITEMS, received: {} }, null, { remote: AHEAD65, remoteKey: "github_pat_testtoken" });
await goTo("orphaned");
ok(!GITHUB_STATE_TEXT.test(text()), "65.6 a GitHub copy ahead of this device shows no line to the user");
await boot({ items: ITEMS, received: {} }, null, { remote: AHEAD65 });
await goTo("orphaned");
ok(!GITHUB_STATE_TEXT.test(text()), "65.7 a keyless device whose GitHub copy is unreachable shows no GitHub line");

const cancelBtn0 = () => buttons().find((b) => b.textContent.trim() === "Cancel");
/* owner default 6: an armed Reset must not move its own label. Cancel sits
   after it, never before, so the second tap lands where the first did. */
await fresh();
await onLedger();
await click(btn(/^Reset$/), "arm reset for the order check");
const armedAt = buttons().findIndex((b) => /Tap again to clear/.test(b.textContent));
const cancelAt = buttons().findIndex((b) => b.textContent.trim() === "Cancel");
ok(armedAt >= 0 && cancelAt > armedAt, "65.8 an armed Reset keeps its place, and Cancel sits after it");
await click(cancelBtn0(), "cancel");

/* GitHub replies the user never sees (owner ruling 2026-10-12, default 5). The
   mirror retries a refused GitHub write quietly, so a refusal must not reach the
   screen: no GitHub, no key and no "Needs attention". Each refusal is one push
   GitHub turns away, then the Sync panel opened from its row. The helpers here
   sit above group 1, so they use no helper defined further down. */
const GH_COPY65 = /GitHub|\bkey\b|Needs attention/i;
const BACKUP_UNKNOWN65 = /backup.*(could not|couldn.t) be checked/i;
for (const [code, label] of [
  ["auth", "401"],
  ["forbidden", "403"],
  ["rate-limit", "rate-limit"],
  ["server", "server"],
]) {
  await boot({ items: ITEMS, received: {} }, null, { remoteKey: "github_pat_testtoken" });
  await background();
  remote.fail = code;
  await background();
  await foreground();
  await openSync();
  remote.fail = null;
  ok(
    !GH_COPY65.test(text()),
    `65.${{ auth: 9, forbidden: 10, "rate-limit": 11, server: 12 }[code]} a GitHub ${label} reply shows no GitHub, key or Needs attention copy`
  );
}
/* the control for the four above: a healthy device with the same key shows none
   of it, and the panel is really open, so the regex is not a constant red */
await boot({ items: ITEMS, received: {} }, null, { remoteKey: "github_pat_testtoken" });
await background();
await openSync();
ok(
  /Last sync/.test(text()) && !GH_COPY65.test(text()),
  "65.13 a healthy device with the same key shows none of it either (the control)"
);

/* a GitHub peek that cannot read: the write is held, and no line tells the user */
for (const [path, look] of [
  ["foreground peek", foreground],
  ["autoPush", background],
]) {
  await boot({ items: ITEMS, received: {} }, null, { remoteKey: "github_pat_testtoken" });
  await background(); /* a healthy write first, so "never synced" is not the reason */
  remote.peekUnknown = "offline";
  await look();
  remote.peekUnknown = null;
  ok(
    !BACKUP_UNKNOWN65.test(text()) && !/Needs attention/.test(text()),
    `65.14 a GitHub peek that cannot read sets no visible backup-unknown line (${path})`
  );
}

/* the Ledger tab is the gear: a hub circle inside a toothed outline (L11b). The
   outline is the path of 24 points, so a plain circle or a bar would fail. */
const ledgerIcon65 = viewTabs().find((b) => tabName(b) === "Ledger")?.querySelector("svg");
const ledgerPath65 = ledgerIcon65?.querySelector("path")?.getAttribute("d") ?? "";
ok(
  !!ledgerIcon65?.querySelector("circle") && (ledgerPath65.match(/L/g) ?? []).length >= 16,
  "65.15 the Ledger tab icon is a gear: a hub circle and a toothed outline"
);

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
await openHistory(); // Backup moved from the Sync panel to History
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

/* ── 3. candidates rank, they never decide (invariant orphaned-mail-never-decides) ───────────────── */

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
eq(
  saved().envelopes.filter((e) => !e.deletedAt).length,
  0,
  "4.5 fully-consumed envelope left the pile (no live envelope; a tombstone is kept)"
);
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
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "reset");
await click(btn(/Tap again to clear \d+ cards?/), "confirm reset");
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
ok(/Unreceived/.test((await showingText())), "12.4 Showing starts on Unreceived");
await toggleShowing();
ok(/Everything/.test((await showingText())), "12.5 one tap brings received rows back");
await toggleShowing();
ok(/Unreceived/.test((await showingText())), "12.6 and toggles back");
/* and the choice does not survive a reload. Switching to Everything is a
   session choice, not a preference: reopening the app lands on the
   outstanding list again. hideDone is deliberately absent from the saved
   shape, so this is guaranteed by there being nothing to load. */
await toggleShowing();
await fresh();
ok(
  /Unreceived/.test((await showingText())),
  "12.7 Everything doesn't survive a reload"
);

/* On iOS a home-screen app is usually backgrounded, not closed, so a remount
   is not what reopening looks like — coming back after a real absence has to
   count too. But a hop out to read a tracking number and straight back is the
   same session, and flipping the list under a thumb mid-check-in is the
   mis-tap invariant no-layout-shift-under-pointer exists to prevent. So the gap decides. */
await toggleShowing();
await backgroundFor(5_000);
ok(
  /Everything/.test((await showingText())),
  "12.8 a glance away is the same session"
);
await backgroundFor(5 * 60_000);
ok(
  /Unreceived/.test((await showingText())),
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

await openHistory();
await click(btn(/^Backup$/), "backup");
const plainText = await captured.text();
const plain = JSON.parse(plainText);
eq(plain.envelopes.length, 1, "13.1 backup carries the envelope");
eq(plain.envelopes[0].entries.length, 2, "13.2 with both entries");
eq(plain.envelopes[0].note, "backup me", "13.3 and the note");

await fresh();
await reachFor(/Re-import CSV/);
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("mailday-backup.json", plainText);
await goTo("orphaned");
ok(/Envelope ·/.test(text()), "13.4 restore brings the envelope back");
ok(/backup me/.test(text()), "13.5 including its note");

/* restoring over a pending envelope is a silent data loss unless we say so */
await fresh();
await goTo("orphaned");
await record(["Brainstorm"]);
await reachFor(/Re-import CSV/);
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
ok(!/Tap again to check in/.test(text()), "16.2 assign is not armed: one tap checks in");
/* 16.3 was decoration once assign became one tap: the envelope left the pile,
   so its armed Discard left with it. Now it asserts that no two-tap ask is
   still armed after the tap. */
ok(!/Tap again to discard/.test(text()), "16.3 no two-tap ask is left armed after the tap");
/* 16.4 re-pointed (ux-claims-are-true): assign is one tap now, so the card
   must land on that tap. The old count-of-envelopes check also passed when the
   tap fired nothing, which is why the card count is asserted too. */
eq(text().match(/cards\s*(\d+)\/14/)?.[1], "1", "16.4 one tap checked the card in");
eq(envelopeCount(), 0, "16.4b and the envelope left the pile on that tap");

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

await reachFor(/^Reset$/);

await click(btn(/^Reset$/), "reset");
await click(btn(/Tap again to clear \d+ cards?/), "confirm reset");
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
await openHistory();
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
await reachFor(/Re-import CSV/);
await click(btn(/Re-import CSV/), "show upload zone");
await dropFile("plain.json", smallText);
await sleep(SAVE_WAIT);
eq(saved().envelopes[0].photos, [], "19.6 photo-less restore strips the ids");

/* the migration path: land on a fresh origin, get the photos back */
await fresh(); // empty photo store
await reachFor(/Re-import CSV/);
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
await reachFor(/Re-import CSV/);
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
eq(
  saved().envelopes.filter((e) => !e.deletedAt).length,
  0,
  "20.3 the envelope is fully consumed (no live envelope; a tombstone is kept)"
);

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

/* order matters: Ledger sits leftmost, then Orphaned, Tally, Packages. The
   bottom bar replaces the top switch on phone (phone-nav-is-bottom-bar). */
eq(
  viewTabs().map(tabName),
  ["Ledger", "Orphaned", "Tally", "Packages"],
  "21.4 bottom bar tab order, Ledger first"
);

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

await pickSort("Cost basis");
ok(
  text().indexOf("Brainstorm") < text().indexOf("Ponder"),
  "22.1 by cost basis, Brainstorm outranks Ponder"
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

await openHistory();
ok(!!btn(/^Backup$/), "23.1 Backup survives an empty item list");
ok(!!btn(/Re-import/), "23.2 so does Re-import");
/* ...and it now controls something. The zone used to be forced open by an
   empty item list alone, so with a pending envelope this cell flipped
   aria-expanded over a panel that was open either way. */
ok(!document.querySelector('div[style*="dashed"]'), "23.2b the zone starts shut here");
await click(btn(/Re-import/), "open the zone");
ok(!!document.querySelector('div[style*="dashed"]'), "23.2c and the cell opens it");
await click(btn(/Re-import/), "and shuts it again");
ok(!document.querySelector('div[style*="dashed"]'), "23.2d and shuts it");
ok(!!btn(/^Reset$/), "23.3 and Reset");
/* but the filters describe a list that doesn't exist, so they must stay away */
ok(
  !document.querySelector('input[aria-label^="Search cards"]'),
  "23.4 search stays hidden with no items"
);
ok(!cell(/^Sorted by/), "23.5 so does sort");

/* The date range is one of three ruled cells now. It reports the active range
   AND how many lines are in it, and opens the full option set beneath the head
   rather than as a wrapping chip row. The cells live on the Ledger tab, and a
   fresh load opens on Packages (view state starts at "packages"), so the test
   visits the Ledger tab first (ledger-tab-holds-options). */
await fresh();
await onLedger();

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

/* ── 25. the ledger reaches GitHub on its own ──────────────────────────── */

/* Push left the UI (owner ruling 2026-10-12). GitHub is written by autoPush,
   which a hidden page runs at once, so these cases reach the write through
   background() and assert on pushes(). Retired here: 25.3's Push button, 25.5's
   "Add a GitHub key first" text, and 25.18 to 25.20, the Push anyway two-tap. */

/* A platform with no remote must lose nothing: the file backups stay on the
   toolbar rather than hiding behind a disclosure that isn't there. */
await boot({ items: ITEMS, received: {} }, null, { noRemote: true });
ok(!btn(/^Sync/), "25.1 no Sync control when the platform has no remote");
/* Backup lives in History now, and History is gated on the versions adapter
   rather than on the remote — so a platform with no remote loses nothing. */
await openHistory();
ok(!!btn(/^Backup$/), "25.2 and Backup is still reachable in that case");

await fresh();
await openSync();
/* 25.3 retired: the Sync panel no longer opens onto a GitHub key field (group 64) */
await background();
await drain();
eq(pushes().length, 0, "25.4 with no key, the page never reaches GitHub");
/* 25.5 and 25.6 retired: the GitHub key field and its "Add a GitHub key first"
   line left the UI (owner ruling 2026-10-12, group 64). */

await saveGitHubKey();
await background();
await drain();
eq(pushes().length, 1, "25.7 with a key it goes");
const pushed = JSON.parse(pushes()[0].text);
eq(pushed.mailday, 1, "25.8 the payload is a Mail Day backup");
eq(pushed.items.length, ITEMS.length, "25.9 carrying every line");
for (const k of ["received", "envelopes", "stamps", "dateFilter", "sortBy", "itemSort"])
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
await background();
await drain();
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

/* A remote this device never pulled is ahead of it. GitHub then holds its
   copy: the page neither overwrites it nor says so (the mirror resolves a
   conflict itself, and no GitHub state is shown). */
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
await background();
await drain();
eq(
  JSON.parse(remoteText()).items.length,
  3,
  "25.17 and the other device's copy is still there"
);

/* the failures the user will actually meet */
await fresh();
await openSync();
await saveGitHubKey();
remote.fail = "auth";
await background();
await drain();
/* Re-pointed (owner ruling 2026-10-12, default 5): an expired GitHub key is a
   mirror failure, and the user sees no GitHub copy. The backup watchdog catches
   a stopped mirror instead (watchdog-catches-silent-failure). */
ok(
  !/expired or been revoked/.test(text()) && !GITHUB_STATE_TEXT.test(text()),
  "25.21 an expired key shows the user no GitHub copy (default 5)"
);
/* 25.22 retired with the GitHub key field (owner ruling 2026-10-12, group 64) */

await fresh();
await openSync();
await saveGitHubKey();
remote.fail = "offline";
await background();
await drain();
/* Re-pointed (owner ruling 2026-10-12): an offline mirror is a GitHub state,
   so the user sees no line for it. The local ledger must still be whole. */
await sleep(SAVE_WAIT);
ok(
  !/safe on this device/.test(text()) && !GITHUB_STATE_TEXT.test(text()),
  "25.23 an offline mirror shows the user no GitHub line (default 5)"
);
eq(saved().items.length, ITEMS.length, "25.23b and nothing was lost locally");

/* The token is a credential, not ledger data. It must not be in the saved
   ledger, in a backup file, in the pushed payload, or anywhere the app's own
   storage namespace can be enumerated. */
await fresh();
await openSync();
await saveGitHubKey("github_pat_SECRETVALUE");
await background();
await drain();
await openHistory();
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

/* ── 26. a remote ledger reaches this device on a fresh resume ─────────── */

/* Pull from GitHub left the UI (owner ruling 2026-10-12). Its arm, replace and
   notice cases are retired: 26.1 to 26.7 (the button, its sentence and its
   notice), 26.8 and 26.9 (its refusal of a non-ledger), 26.10 (its replace
   warning), 26.14 to 26.16 (a pull that unblocks a push), 26.18 and 26.19 (the
   Pull arm disarming Reset). The photo rules still hold on the automatic merge:
   a fresh resume that finds GitHub ahead merges it in (autoMerge), and that
   merge keeps the ids the same as the old pull did. These cases re-point there. */

/* Re-pointed to the restore path (owner ruling 2026-10-12): a file restore runs
   parseLedger's whole-check, so a payload that is not a ledger is refused and
   nothing local moves (a-restore-is-not-local). Ids 26.20 and 26.21 replace the
   retired 26.8 and 26.9. */
await boot({ items: ITEMS, received: {} });
await reachFor(/Re-import CSV/);
if (cell(/^Re-import CSV/)?.getAttribute("aria-expanded") !== "true")
  await click(btn(/Re-import CSV/), "open the upload zone");
await dropFile("backup.json", JSON.stringify({ hello: "world" }));
await act(async () => await sleep(0));
ok(/isn’t a Mail Day backup/.test(text()), "26.20 a non-ledger JSON is refused on the restore path");
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "26.21 and nothing local moved");

const freshResume = async () => {
  await backgroundFor(5 * 60_000);
  await sleep(SAVE_WAIT);
};

/* THE landmine: a pushed payload never carries photos, so a merge must not
   strip ids whose blobs are sitting right here — and the sweep must not then
   collect them. Push from the phone, merge on the same phone, photos gone. */
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
await freshResume();
eq(
  saved().envelopes[0].photos,
  ["pho-9"],
  "26.11 a merge keeps ids whose blob is on this device"
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
await freshResume();
eq(
  saved().envelopes[0].photos,
  [],
  "26.13 an id the photo store was read and found not to hold is stripped"
);

/* and the case that used to be conflated with it */
await boot({ items: ITEMS, received: {} }, null, { remote: GONE_LEDGER });
await openSync();
await freshResume();
eq(
  saved().envelopes[0].photos,
  ["pho-gone"],
  "26.13b but with no key the store is unreadable, so the id is KEPT, not lost"
);
/* Re-pointed (owner ruling 2026-10-12, default 5): the copy may not say "your key"
   or name a repo. Group 66 guards the words, so this asserts only that the line
   says photos need something, not what that something is named. */
ok(
  /Photos need/i.test(text()),
  "26.13c and it says so rather than reporting them lost"
);

/* Reset and the other destructive ask stay one at a time */
await fresh();
await openSync();
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm reset");
ok(/Tap again to clear \d+ cards?/.test(text()), "26.17 Reset arms");

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

/* ── 28. an empty ledger must still be able to recover ─────────────────── */

/* The whole point of the feature: a new phone, or one ITP has cleared, opens
   the app holding nothing and needs to recover. Gated on data alone — as the
   rest of the toolbar rightly is — the one control that recovers from having
   no data was unreachable exactly when it was needed. Caught on the live site,
   not by this suite, which is why the assertion exists now. */
await boot({ items: [], received: {}, envelopes: [] }, null, {
  remote: OTHER_DEVICE,
});
/* The Sync chip is gone — on the happy path there is no sync vocabulary on
   screen at all. The claim survives unchanged, and it is the one that matters:
   an empty ledger is EXACTLY when recovery is needed, so the way in must still
   be there. It is the broken-line now, which on a keyless device says so
   honestly rather than waiting for a failure to happen. */
/* Re-pointed (owner ruling 2026-10-12, default 5): a keyless GitHub mirror
   shows no line, so the repair kit no longer answers on an empty ledger. The
   way in that remains is the upload zone, which opens on an empty ledger. */
ok(
  !!document.querySelector('div[style*="dashed"]'),
  "28.1 the upload zone is on screen on a completely empty ledger, so recovery is reachable"
);

await openSync();
/* Re-pointed (orchestrator default 2, 2026-10-12): Reset shows on an empty
   ledger, so a stray arm can always be cleared from the row. */
ok(!!btn(/^Reset$/), "28.3 Reset shows on an empty ledger (default 2)");
/* Re-pointed (decision ledger-tab-holds-options, L11b): the Ledger tab holds
   its own Re-import CSV row, and on an empty ledger that row is already open,
   so the recovery path is reachable from the tab that holds the options. */
ok(
  cell(/^Re-import CSV/)?.getAttribute("aria-expanded") === "true",
  "28.4 and Re-import CSV is open on the Ledger tab — the upload zone is already on screen"
);
/* 28.2 and 28.5 re-pointed: Pull from GitHub left the UI (owner ruling
   2026-10-12). Recovery is the mirror's own merge on a fresh resume, which
   needs the GitHub key set before the mount, as the owner's devices have it. */
await boot({ items: [], received: {}, envelopes: [] }, null, {
  remote: OTHER_DEVICE,
  remoteKey: "github_pat_testtoken",
});
await backgroundFor(5 * 60_000);
await sleep(SAVE_WAIT);
eq(saved().items.length, 3, "28.5 and a fresh resume recovers the empty ledger from GitHub");

/* with no remote there is nothing to offer, so the toolbar stays away */
await boot({ items: [], received: {}, envelopes: [] }, null, { noRemote: true });
ok(!btn(/^Sync/), "28.6 no remote, no toolbar on an empty ledger");
/* History is the exception, and deliberately: it is the one control that
   RECOVERS state, so it must not be gated on that state existing. Backup is
   inside it rather than on the row. */
ok(!btn(/^Backup$/), "28.7 and no file action sitting on the row itself");

/* It shipped once as a one-way door: the line opened the panel and nothing
   closed it, because removing the Sync cell took the only control that could.
   Worse, fixing the very thing it complained about made `syncBroken` null, the
   line vanish, and the panel strand open with no control at all. A disclosure
   has to be its own way back out.

   Re-pointed (owner ruling 2026-10-12): the line speaks of the Worker only, so
   the fixture is a Worker that cannot be reached, not a GitHub mirror that is
   behind. The Worker answers again before the last check. */
await boot({ items: ITEMS.slice(0, 2), received: {} }, null, {
  syncKey: "device-28-key",
});
setSyncNetFail(true);
await backgroundFor(5 * 60_000);
await sleep(SAVE_WAIT);
await click(btn(/tap to/), "open the repair kit");
ok(cell(/^Sync/)?.getAttribute("aria-expanded") === "true", "28.8 tapping the line opens the repair kit");
await click(cell(/^Sync/), "and tap it again");
ok(cell(/^Sync/)?.getAttribute("aria-expanded") !== "true", "28.9 tapping it again closes it — not a one-way door");
await click(cell(/^Sync/), "reopen");
/* the Worker answers again and this device is healthy */
setSyncNetFail(false);
await backgroundFor(5 * 60_000);
await drain();
ok(
  !!btn(/tap to close/),
  "28.10 once the sync is healthy the header stays, so the panel is not stranded"
);
ok(
  !/Not backed up/.test(text()),
  "28.11 but it stops claiming a problem it no longer has"
);
await click(btn(/tap to close/), "close it from the healthy header");
ok(cell(/^Sync/)?.getAttribute("aria-expanded") !== "true", "28.12 and that closes it too");

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

/* ── 30. photos push and pull ────────────────────────────────────────
   Photo files are immutable and addressed by id, so the whole algorithm is a
   set difference — nothing merges, nothing overwrites, and the same tap can be
   repeated safely. What these protect is the ORDER of a merge from GitHub
   (download before replace, or every id is stripped) and the strict separation
   of the photo error channel from the ledger's, since the ledger's `conflict`
   used to arm a button that force-overwrote another device's check-ins.

   Push and Pull left the UI (owner ruling 2026-10-12). The push leg runs as the
   mirror does: a hidden page writes through autoPush (background). The pull leg
   runs as a fresh resume that finds GitHub ahead (autoMerge), so each case
   below sets the GitHub key at boot and resumes. The retired Pull asks are
   30.10's "not on GitHub" reading through the button, which the merge reports
   the same way, and 30.5 to 30.10 re-point rather than delete. */

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
const GH30 = "github_pat_testtoken";
/* a fresh resume: the page was away, and on return GitHub is read and merged */
const resume30 = async () => {
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
};

/* a ledger with no photos in it at all */
await boot({ items: ITEMS, received: {} }, null, { remoteKey: GH30 });
await background();
await drain();
eq(photoCalls().length, 0, "30.1 a ledger with no photos makes no photo requests");

/* one photo, held locally, absent from the remote */
await boot(withPhoto(["pho-a"]), [["pho-a", jpegOf(1)]], { remoteKey: GH30 });
await background();
await drain();
await sleep(60);
eq(remotePhotoIds(), ["pho-a"], "30.2 a push sends a photo the remote lacks");

/* pushing again must send NOTHING: the set difference is what makes a repeat
   tap cheap, and what makes a partial upload resumable */
const sentSoFar = photoCalls().filter((c) => c.op === "pushPhoto").length;
await background();
await drain();
await sleep(60);
eq(
  photoCalls().filter((c) => c.op === "pushPhoto").length,
  sentSoFar,
  "30.3 pushing again sends nothing — only new bytes ever move"
);

/* a blob left behind by a discarded envelope is not ours to publish */
await boot({ items: ITEMS, received: {} }, [["pho-orphan", jpegOf(2)]], { remoteKey: GH30 });
await background();
await drain();
await sleep(60);
ok(
  !remotePhotoIds().includes("pho-orphan"),
  "30.4 a blob no envelope references is never pushed"
);

/* ---- the merge from GitHub, and the ordering it depends on ---- */
const PHOTO_LEDGER = JSON.stringify({
  mailday: 1,
  ...withPhoto(["pho-a"]),
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

await boot({ items: ITEMS, received: {} }, null, {
  remote: PHOTO_LEDGER,
  remoteKey: GH30,
  remotePhotos: [["pho-a.jpg", await blobToBase64(jpegOf(1))]],
});
await resume30();
eq(
  saved().envelopes[0].photos,
  ["pho-a"],
  "30.5 a merge onto a device with no blobs KEEPS the id"
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
await boot({ items: ITEMS, received: {} }, null, { remote: PHOTO_LEDGER, remoteKey: GH30 });
await resume30();
/* Re-pointed: the Pull ask is gone, and a GitHub copy is not shown to the user
   (owner ruling 2026-10-12, default 5). The merge still drops the id, because
   no store holds the bytes. Whether that loss is reported to the user is an
   open question, see the report. */
eq(saved().envelopes[0].photos, [], "30.10 a photo missing everywhere is dropped from the envelope");
/* Re-pointed (pull-warns-on-what-it-drops, owner ruling 2026-10-12): the warning
   is the claim. The photo's loss is shown in the Sync panel, with no GitHub word. */
await openSync();
ok(
  /photo/i.test(text()) && /gone|lost|no other copy|only copy/i.test(text()) && !/GitHub/.test(text()),
  "30.10b a photo with no copy left is warned about, and no GitHub word is on screen"
);

/* ---- the one that guards the worst bug in the feature ---- */
await boot(withPhoto(["pho-a"]), [["pho-a", jpegOf(1)]], { remoteKey: GH30 });
remote.photoFail = "conflict"; /* GitHub 409s rapid writes to one repo */
await background();
await drain();
await sleep(60);
/* Re-pointed: Push anyway is gone (owner ruling 2026-10-12). What must still
   hold is that a photo conflict puts no ask on screen at all. */
/* Re-pointed: "Push anyway" can no longer appear, so the old check could never
   fail. The live way a conflict could reach the user is an armed two-tap or a
   GitHub line, and either one is what this now catches. */
/* Re-pointed: the Sync panel is where a photo conflict would surface, so it is
   opened and read. "Push" is a verb the UI no longer carries. */
await openSync();
ok(
  !btn(/^Tap again to/) && !/\bPush\b/.test(text()) && forbiddenIn().length === 0 && !GITHUB_STATE_TEXT.test(text()),
  "30.11 a photo conflict arms no two-tap and puts no Push verb or GitHub state on screen"
);
eq(remoteText() && JSON.parse(remoteText()).items.length, ITEMS.length,
  "30.12 and the ledger push itself still landed");
remote.photoFail = null;

/* ---- the store we cannot see ---- */
await boot({ items: ITEMS, received: {} }, null, {
  remote: PHOTO_LEDGER,
  photosUnknown: "no-access",
  remoteKey: GH30,
});
await resume30();
eq(
  saved().envelopes[0].photos,
  ["pho-a"],
  "30.13 an unreadable photo store keeps every id — it is not evidence of loss"
);
eq(saved().items.length, ITEMS.length, "30.14 and the ledger still applied");
ok(!/not on GitHub/i.test(text()), "30.15 and nothing is reported as lost");

/* The sweep race, which is the reason the photo phase holds it off at all. A
   merge writes blobs while `envelopes` still holds the OLD list, so nothing
   re-runs the sweep effect and a timer armed before the merge started is still
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
  remoteKey: GH30,
  remotePhotos: [
    ["pho-a.jpg", await blobToBase64(jpegOf(1))],
    ["pho-b.jpg", await blobToBase64(jpegOf(2))],
  ],
});
remote.photoDelay = 1200; /* first lands ~1.2s, second ~2.4s — the sweep is due at 2s */
await backgroundFor(5 * 60_000);
/* two 1.2s downloads, then the replace, then the debounced save — and past the
   2s mark where the pre-merge sweep was armed to fire */
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

/* The "gone" warning, both ways round. A merge that replaces the ledger makes a
   photo the CURRENT ledger references and the incoming one does not about to
   stop existing — and if it was never pushed, that was the last copy. But a
   photo BOTH ledgers reference survives untouched, and saying otherwise is a
   false alarm at the exact moment nothing is wrong. */
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
  { remote: PHOTO_LEDGER, remoteKey: GH30 } /* incoming references pho-a, never pho-local */
);
await resume30();
/* Re-pointed like 30.10: "never pushed" is a GitHub copy the user is no longer
   shown (owner ruling 2026-10-12, default 5). Whether a last-copy loss is
   reported at all is an open question, see the report. */
/* Re-pointed like 30.10: the last-copy warning must appear, and carry no GitHub
   word (default 5). Read in the Sync panel, where the warning is rendered. */
await openSync();
ok(
  /photo/i.test(text()) && /gone|lost|no other copy|only copy/i.test(text()) && !/GitHub|never pushed/i.test(text()),
  "30.18 a photo the incoming ledger doesn't know about gets a GitHub-free last-copy warning (default 5)"
);

/* the inverse: both ledgers reference it and the blob is here, so it survives
   the merge completely — warning here would be a false alarm */
await boot(withPhoto(["pho-a"]), [["pho-a", jpegOf(1)]], { remote: PHOTO_LEDGER, remoteKey: GH30 });
await resume30();
eq(
  saved().envelopes[0].photos,
  ["pho-a"],
  "30.19 a photo both ledgers reference survives the merge"
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
eq(currentTab(), ["Packages"], "32.10 which lands in Packages");
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
   a data write from a navigation gesture, which is the mis-tap invariant no-layout-shift-under-pointer
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
   migrated (invariant saved-state-shape: new keys optional and defaulted) */
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
   else, and invariant orphaned-mail-never-decides means a stray one decides nothing on its own */
const other = mergeEnvelopes([], [ASSIGNED]);
eq(other.envelopes.length, 1, "33.18 an envelope only the other device has is adopted");
eq(other.added, 1, "33.19 and counted");

eq(
  mergeItems(ITEMS.slice(0, 2), []).items.length,
  2,
  "33.20 merging nothing in drops nothing"
);
ok(
  /nothing new/.test(
    mergeSummary({ itemsAdded: 0, checkInsAdded: 0, envelopesAdded: 0, stampsAdded: 0 })
  ),
  "33.21 a merge that changed nothing says so rather than claiming a win"
);
ok(
  /35 new lines/.test(
    mergeSummary({ itemsAdded: 35, checkInsAdded: 0, envelopesAdded: 0, stampsAdded: 0 })
  ),
  "33.22 and one that did says what arrived"
);

/* a key a newer build writes must survive an older build's merge. Otherwise the
   older build drops it, applies the result as a full replace, and pushes the
   loss back (saved-state-shape). Rule for lane web/merge-unknown-keys, owner to
   confirm: a key on one side only is kept; a key on both sides with different
   values keeps the side with the later savedAt; a tie keeps incoming. */
const UNK_NOTE = { note: "from a newer build" };
const UNK_LOCAL_ONLY = { ...PHONE, futureKey: UNK_NOTE };
eq(
  mergeLedger(UNK_LOCAL_ONLY, LAPTOP).merged.futureKey,
  UNK_NOTE,
  "33.23 a key only the local side holds survives the merge"
);
eq(
  mergeLedger(LAPTOP, UNK_LOCAL_ONLY).merged.futureKey,
  UNK_NOTE,
  "33.24 and a key only the incoming side holds survives it too"
);
eq(
  mergeLedger(mergeLedger(UNK_LOCAL_ONLY, LAPTOP).merged, LAPTOP).merged.futureKey,
  UNK_NOTE,
  "33.25 and it survives the next merge, so the older build cannot push the loss back"
);
const UNK_OLDER = { ...PHONE, futureKey: "older", savedAt: 100 };
const UNK_NEWER = { ...LAPTOP, futureKey: "newer", savedAt: 200 };
eq(
  mergeLedger(UNK_OLDER, UNK_NEWER).merged.futureKey,
  "newer",
  "33.26 on both sides and different, the later savedAt wins when it is incoming"
);
eq(
  mergeLedger(UNK_NEWER, UNK_OLDER).merged.futureKey,
  "newer",
  "33.27 and the later savedAt wins when it is local"
);
const UNK_TIE_LOCAL = { ...PHONE, futureKey: "local", savedAt: 300 };
const UNK_TIE_INCOMING = { ...LAPTOP, futureKey: "incoming", savedAt: 300 };
eq(
  mergeLedger(UNK_TIE_LOCAL, UNK_TIE_INCOMING).merged.futureKey,
  "incoming",
  "33.28 a tie on savedAt keeps incoming"
);
eq(
  mergeLedger(UNK_TIE_INCOMING, UNK_TIE_LOCAL).merged.futureKey,
  "local",
  "33.29 and in the other order the value passed second is the one kept"
);
/* the known keys are the same whether or not an unknown key rides along */
const unkKnownOf = (m) => ({
  mailday: m.mailday,
  items: m.items,
  received: m.received,
  receivedAt: m.receivedAt,
  envelopes: m.envelopes,
  stamps: m.stamps,
  dateFilter: m.dateFilter,
  sortBy: m.sortBy,
  itemSort: m.itemSort,
});
eq(
  unkKnownOf(
    mergeLedger({ ...PHONE, futureKey: "x", savedAt: 1 }, { ...LAPTOP, futureKey: "y", savedAt: 2 })
      .merged
  ),
  unkKnownOf(m33.merged),
  "33.30 the known keys merge exactly as they do with no unknown key"
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
/* Re-pointed (owner ruling 2026-10-12): Push and Merge & push left the UI. The
   stale copy is merged by the mirror on its own, on a fresh resume that finds
   GitHub ahead. The user is shown no GitHub copy (default 5). Old 34.1 (the
   blocked Push) and 34.2 (the Merge & push button) guarded removed controls and
   are retired; the check below carries what they protected. */
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
/* The merge applied, and the auto-push that follows it is the next background,
   which fires it at once. AUTO_PUSH_MS is the wait a device without a switch
   to background would take. */
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "34.3 the laptop's imported lines arrive");
eq(
  saved().received[ITEMS[0].key],
  1,
  "34.4 and this device's check-ins are still here"
);
ok(
  !GITHUB_STATE_TEXT.test(text()) && forbiddenIn().length === 0,
  "34.5 and the user is shown no GitHub copy or verb (default 5)"
);
/* Re-pointed (owner ruling 2026-10-12): the old check compared the remote's
   lines with ITEMS, which LAPTOP_PUSHED already holds, so it passed with no
   push at all. The claim is the push itself. */
ok(
  pushes().length > 0,
  "34.6 the merged ledger was pushed to GitHub, so the conflict is cleared"
);
eq(
  JSON.parse(remoteText()).received[ITEMS[0].key],
  1,
  "34.7 carrying the check-ins the remote had never seen"
);

/* In a merge the later change wins, and a merge is not a destructive act, so
   arming it would say the opposite of what it does — and invariant
   no-native-dialogs's two-tap pattern is for destructive actions specifically. */
await boot(
  { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } },
  null,
  { remote: LAPTOP_PUSHED }
);
/* Re-pointed: the automatic merge takes the place of the Merge & push button,
   so the armed Reset is the one that must be disarmed by it. */
await saveGitHubKey();
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm reset");
ok(/Tap again to clear \d+ cards?/.test(text()), "34.8 Reset arms");
await backgroundFor(5 * 60_000);
await drain();
/* Re-pointed (rulings armed-reset-takes-the-row and milestones-taken-before-risk,
   2026-10-12): the gate holds. A merge does not run while Reset is armed, so
   the armed Reset stays armed and the device's own ledger is not overwritten.
   The gate itself is unchanged. */
ok(/Tap again to clear \d+ cards?/.test(text()), "34.9 a merge waits while Reset is armed, so Reset stays armed");
await sleep(SAVE_WAIT);
eq(saved().items.length, 3, "34.10 and the device keeps its own ledger, not the merged one");

/* the notice, and the merge that only brings in */
/* Re-pointed: Merge left the UI (owner ruling 2026-10-12). A device that is
   behind is merged by the mirror on its own, and shows no GitHub copy. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: LAPTOP_PUSHED });
await saveGitHubKey();
await settle();
ok(!GITHUB_STATE_TEXT.test(text()), "34.11 a device that is behind is shown no GitHub copy");
eq(peeks().length > 0, true, "34.12 which it learned from one cheap read, not a pull");
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "34.13 the mirror brings the new lines in on its own");
ok(!GITHUB_STATE_TEXT.test(text()), "34.14 and still no GitHub copy after the merge");

/* ---- auto-push ----
   The reason the merge had to come first: automating pushes without it turns
   the trap above from occasional into the normal way two devices meet. */

await fresh();
await openSync();
await saveGitHubKey();
/* There is no toggle any more, and its absence is the claim: sync is not
   something you turn on. A per-device switch for "does this work" made the
   thing the app is supposed to do quietly into a thing you had to opt into,
   and an off toggle on the other device is a silent way to be unbacked-up for
   months. */
ok(!btn(/Auto-push/), "34.15 there is no toggle — sync is not opt-in");
eq(
  saved().auto,
  undefined,
  "34.17 and nothing about it leaked into the ledger on its way out"
);

/* Backgrounding runs auto-push straight away rather than after the 90s idle
   debounce, so these drive that path — which is also a real one: switching away
   mid-mail-day is the last chance to catch a session that never went idle. */

/* THE safety property. "I could not look" must never be read as "all clear":
   pushing on an unknown remote state is exactly how one device overwrites the
   other, and it is the reason peek() is three-valued at all. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: LAPTOP_PUSHED });
await saveGitHubKey();
await settle();
remote.peekUnknown = "offline";
const unseen = pushes().length;
await background();
eq(pushes().length, unseen, "34.18 auto-push refuses to write when it could not look");
remote.peekUnknown = null;

/* and when it CAN look and the other device is ahead, it merges before it
   writes, so the other device's lines are never overwritten. Re-pointed: a
   stale write no longer waits for a button (owner ruling 2026-10-12). */
await background();
eq(
  JSON.parse(remoteText()).items.length,
  ITEMS.length,
  "34.19 an ahead copy is never overwritten with fewer lines"
);
await foreground();
ok(!GITHUB_STATE_TEXT.test(text()), "34.20 and the user is shown no GitHub copy");

/* the ordinary case: nobody is ahead, so it goes */
await boot({ items: ITEMS, received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();
await settle();
const quiet = pushes().length;
await background();
ok(pushes().length > quiet, "34.21 with the remote in step, auto-push pushes");
ok(
  peeks().length > 0,
  "34.22 and it looked first — the peek is what makes the push safe"
);

/* a conflict opening between the look and the write must leave no ask on a
   screen nobody is watching. Re-pointed: Push anyway is retired (owner ruling
   2026-10-12), so the check is that no GitHub verb is shown. */
await boot(
  { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } },
  null,
  { remote: LAPTOP_PUSHED }
);
await openSync();
await saveGitHubKey();
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
eq(forbiddenIn(), [], "34.24b and no GitHub verb is on screen after it");

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
/* Re-pointed: Push and Merge & push left the UI; the mirror merges on resume */
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
eq(
  saved().envelopes?.[0]?.entries?.length ?? null,
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
/* Re-pointed: the mirror merges on a fresh resume, then the next background
   pushes the merged ledger, and the photo follows that push */
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
await backgroundFor(5 * 60_000);
await drain();
await sleep(SWEEP_WAIT);
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
/* Re-pointed: the mirror's fresh-resume merge replaces the Merge & push button */
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
await sleep(SWEEP_WAIT);
eq(
  saved().envelopes?.[0]?.photos ?? null,
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
/* Re-pointed: a conflict during the mirror's merged write is resolved by
   merging again, with no button to press (owner ruling 2026-10-12). */
await saveGitHubKey();
remote.pushFailOnce = "conflict";
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
ok(
  saved().items.length === ITEMS.length && forbiddenIn().length === 0,
  "34.30 a conflict during the merged push resolves by merging, with no GitHub verb shown"
);

/* No toggle means no "off", so the remaining refusal is the one that matters:
   a device with no key cannot push, and must not pretend otherwise. */
await boot({ items: ITEMS, received: {} }, null, { remote: null });
await openSync();
const off = pushes().length;
await background();
eq(
  pushes().length,
  off,
  "34.25 with no key on this device, backgrounding pushes nothing"
);

/* ── 35. a pull that didn't land must not license a push ──────────────────
   Found in the wild on day one, and it cost a real check-in.

   The stored sha is this device's claim to be holding the remote's bytes. The
   adapter used to write it the instant they arrived — before the app had
   applied anything. When the apply then didn't happen, the device sat on a
   CURRENT sha over STALE data, and its next push carried that sha and was
   ACCEPTED: no conflict, and the other device's work gone. Auto-push made that
   automatic and unattended.

   `git log origin/data` has the receipt: a push whose blob is byte-identical to
   a ledger six days old, landing on top of a newer one without a conflict. */

/* anything the app will fetch but refuse to apply */
const UNAPPLIABLE = JSON.stringify({ notALedger: true, items: [] });

await boot({ items: ITEMS, received: { [ITEMS[0].key]: 1 } }, null, {
  remote: UNAPPLIABLE,
});
/* Re-pointed (owner ruling 2026-10-12): Merge left the UI. The fresh resume
   fetches the unappliable payload and the mirror refuses it on its own. */
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
ok(
  !/isn’t a Mail Day ledger/.test(text()) && !GITHUB_STATE_TEXT.test(text()),
  "35.1 the refused payload shows the user no GitHub copy (default 5)"
);
eq(
  remote.deviceSha,
  null,
  "35.2 and a refused payload does NOT advance this device's sha"
);

/* the half that actually lost the data: with the sha advanced, this push would
   have been accepted rather than blocked */
await background();
ok(
  /notALedger/.test(remoteText()),
  "35.3 so auto-push cannot overwrite the other device with stale data"
);

/* the same guard must not break the ordinary case: a pull that DID land is
   exactly what earns the right to push */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  remote: LAPTOP_PUSHED,
});
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
ok(remote.deviceSha !== null, "35.4 a merge that landed does advance the sha");
await background();
await drain();
eq(
  JSON.parse(remoteText()).items.length,
  ITEMS.length,
  "35.5 and the following push is accepted rather than conflicting"
);

/* A FORCE that did not land must not advance the sha either. This was the last
   place in the codebase still recording the claim before writing the bytes:
   pushForce looked the remote up, saved that sha, and only then PUT. When the
   PUT failed the device sat on a current sha over stale data — and its next
   auto-push was ACCEPTED, no conflict raised, the other device's work gone.
   Verbatim the incident this group exists for, through the force door.

   The mock could never catch it, because it cleared `remote.fail` on the way
   in, so the force could not fail. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  remote: LAPTOP_PUSHED,
});
/* Re-pointed: Push anyway is retired (owner ruling 2026-10-12). The mirror's
   own merged write is the one that can fail, so that is the write under test. */
await saveGitHubKey();
/* the resume's merge may land and advance the sha legitimately; the claim is
   about the write that FAILS after it, so the baseline is taken after the merge */
await backgroundFor(5 * 60_000);
await drain();
const shaBeforeWrite = remote.deviceSha;
const remoteBeforeWrite = remoteText();
remote.pushFailOnce = "offline";
await background();
await drain();
eq(
  remote.deviceSha,
  shaBeforeWrite,
  "35.6 a write whose PUT failed does not advance the sha"
);
eq(
  remoteText(),
  remoteBeforeWrite,
  "35.7 so the other device's ledger is still standing"
);


/* ── 36. the action row ───────────────────────────────────────────────────

   The file actions became a row of ruled cells in the head's own vocabulary
   (CLAUDE.md, "The ruled head"). What can be pinned here is behaviour; the
   layout it exists for — equal cells, the 375px fit, nothing right-aligned
   over a void — is re-measured in a real viewport like the rest of the
   region, because jsdom has none. */
/* The SYNC cell is gone entirely — sync has no presence on the happy path —
   so the third cell is HISTORY, and the row is still the three equal cells
   this design was measured at. */
await boot({ items: ITEMS, received: {} }, null, { remote: OTHER_DEVICE });
await openSync();
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm reset");
ok(!!btn(/Tap again to clear \d+ cards?/), "36.1 an armed Reset takes the row");
/* Retired (decision armed-reset-takes-the-row, owner ruling 2026-10-11, "Fix
   both"): the arm no longer steps the two neighbouring cells out. It arms in
   place, so the row does not move under a press. */
ok(
  !!btn(/Re-import CSV/) && !!cell(/^History/),
  "36.2 and the other two cells stay in place under the arm"
);
/* 36.3 retired: it guarded the Push button, which left the UI (owner ruling
   2026-10-12). The open Sync panel is what must stay put under the arm. */
ok(
  cell(/^Sync/)?.getAttribute("aria-expanded") === "true",
  "36.3 while the open Sync panel stays put underneath"
);
/* Re-pointed: Pull from GitHub left the UI, so the arm is disarmed by Cancel. */
await click(
  buttons().find((b) => b.textContent.trim() === "Cancel"),
  "cancel the armed reset"
);
ok(
  !!btn(/Re-import CSV/) && !!btn(/^History/) && !!btn(/^Reset$/),
  "36.4 disarming brings them back"
);
/* Re-pointed (ledger-tab-holds-options, owner ruling 2026-10-12): the Sync row
   is on the Ledger tab whenever a remote exists, so it is never removed. What
   the cell must do is stay in place after the arm is cancelled. */
ok(!!cell(/^Sync/), "36.4b and the Sync cell stays on the Ledger tab once the arm is cancelled");

/* the option grid paints its rule colour through the 1px gap, so an odd count
   has to give the last cell the whole row or the empty half shows as a slab.
   The History grid is where this reads most plainly now: Backup alone is one
   cell, and a device with photos makes two. */
/* Re-pointed: History lists its actions as ruled rows now, so the odd-cell rule
   lives on the Ledger tab's option grid. Seven ranges in four columns leave the
   last cell alone on its row, and it spans two. */
await boot({ items: ITEMS, received: {} });
await openRange();
eq(
  opt("By month").style?.gridColumn,
  "span 2",
  "36.5 an odd last cell in the option grid spans the row"
);
await openHistory();
await boot(withPhoto(["pho-g"]), [["pho-g", jpeg()]]);
await openHistory();
ok(!!btn(/Backup \+ photos/), "36.6 photos add the second cell, making two");
eq(
  btn(/^Backup$/).style.gridColumn,
  "",
  "36.7 and an even count leaves every cell its own half"
);
/* Re-pointed: the GitHub token field left the UI (owner ruling 2026-10-12). The
   16px rule still binds the one text field the Sync panel keeps, the Worker's
   sync key. Not layout: iOS zooms the page on focusing any input under 16px. */
await boot({ items: ITEMS, received: {} }, null, { syncAdapter: true });
await openSync();
await settle();
eq(
  document.querySelector('input[aria-label="Sync key"]')?.style.fontSize ?? null,
  "16px",
  "36.8 the sync key field is 16px so focusing it does not zoom the page on iOS"
);

/* ── 37. a stamp is the order's status, and a refund leaves the ledger ────
   One stamp per package, set by hand — claim filed, refunded, seller
   contacted, reshipped, partial refund — dated the day it was set, with a
   free line. The two refund kinds take the package out of every count and the
   normal list exactly as a canceled order is, and the "N stamped" cell is
   then the one place the order can still be found. The stamp is a persisted
   key, so invariant saved-state-shape's five sites and the merge builder's sixth all carry
   it; the last of those fails by silently dropping every stamp on every
   merge and pushing the loss, which is why 37.62–37.69 exist. */

const GK_A = "A1::Alpha Cards";
const GK_C = "C1::Gamma Cards";
const GK_D = "D1::Delta Cards";
const inCard = (c, re) =>
  c ? [...c.querySelectorAll("button")].find((b) => re.test(b.textContent)) : undefined;
const bandOf = (c) => c?.querySelector('button[aria-label^="Edit stamp"]');
const noteInput = (c) => c?.querySelector('input[aria-label="Stamp note"]');
const stampedCell = () => cell(/stamped/);
/* the two entrances: the Stamp button on an unstamped card, the band on a
   stamped one. `label` null keeps the kind already there; `note` undefined
   keeps the note. */
const stampPkg = async (re, label, note) => {
  await click(inCard(card(re), /^Stamp$/) || bandOf(card(re)), `open stamp editor`);
  if (label) await click(inCard(card(re), new RegExp(`^${label}$`)), `pick ${label}`);
  if (note !== undefined) await type(noteInput(card(re)), note);
  await click(inCard(card(re), /^Save$/), "save stamp");
};
const S = (kind, updatedAt, note = "") => ({ kind, at: "2026-08-01", note, updatedAt });
const TOMB = (updatedAt) => ({ kind: "", at: "", note: "", updatedAt });
const sortedEntries = (o) => Object.keys(o).sort().map((k) => [k, o[k]]);

await fresh();
ok(!!inCard(card(/Alpha Cards/), /^Stamp$/), "37.1 an unstamped package offers a Stamp button");
ok(!stampedCell(), "37.2 and with nothing stamped there is no stamped cell");
await click(inCard(card(/Alpha Cards/), /^Stamp$/), "open the stamp editor");
{
  const c = card(/Alpha Cards/);
  eq(
    ["Claim filed", "Refunded", "Seller contacted", "Reshipped", "Partial refund", "Other"].filter(
      (l) => !!inCard(c, new RegExp(`^${l}$`))
    ).length,
    6,
    "37.3 the editor offers the six stamps, Other included"
  );
  ok(inCard(c, /^Save$/).disabled, "37.4 and Save waits for a kind to be picked");
  ok(!inCard(c, /Remove stamp/), "37.5 with nothing to remove yet");
  await click(inCard(c, /^Claim filed$/), "pick Claim filed");
  await type(noteInput(c), "case 123, they said ten days");
  await click(inCard(c, /^Save$/), "save");
}
ok(
  /CLAIM FILED · \d\d-\d\d/.test(card(/Alpha Cards/).textContent),
  "37.6 the band shows the stamp, dated the day it was set"
);
ok(/case 123/.test(card(/Alpha Cards/).textContent), "37.7 and the note beside it");
ok(
  !inCard(card(/Alpha Cards/), /^Stamp$/) && !!bandOf(card(/Alpha Cards/)),
  "37.8 the Stamp button is gone — the band itself is now the control"
);
await sleep(SAVE_WAIT);
{
  const st = saved().stamps?.[GK_A];
  ok(
    st && st.kind === "claim" && /case 123/.test(st.note) &&
      /^\d{4}-\d\d-\d\d$/.test(st.at) && typeof st.updatedAt === "number",
    "37.9 and it is in the saved blob, keyed by the package, dated and time-stamped"
  );
}
const firstUpdated = saved().stamps[GK_A].updatedAt;
ok(
  /0\/14/.test(text()) && /4 packages/.test(text()),
  "37.10 a claim changes no count — the cards are still out there"
);
ok(
  !/refund window closing|may be lost/.test(card(/Alpha Cards/).textContent),
  "37.11 the lost-mail warning is gone on a stamped order — it is being handled"
);
ok(
  /refund window closing|may be lost/.test(card(/Beta Games/).textContent),
  "37.12 and still there on one that isn't"
);
await stampPkg(/Alpha Cards/, "Other", "package split — one box short");
ok(
  /OTHER · \d\d-\d\d/.test(card(/Alpha Cards/).textContent) &&
    /package split/.test(card(/Alpha Cards/).textContent),
  "37.12b Other is a stamp like any other — labelled, dated, notable"
);
ok(
  /0\/14/.test(text()) && /4 packages/.test(text()),
  "37.12c and unlike the two refund kinds, it changes no count"
);
await goTo("tally");
await click(btn(/Lightning Bolt/), "expand Lightning Bolt");
ok(
  !/⚠/.test(orderBtn("A1").parentElement.textContent) &&
    /⚠/.test(orderBtn("B1").parentElement.textContent),
  "37.13 the Tally source row agrees: no warning on the stamped order's copy, warning on the other"
);
ok(!stampedCell(), "37.14 no stamped cell under Tally — a stamp belongs to a package");
await goTo("packages");
ok(
  !!stampedCell() && /1 stamped/.test((stampedCell()?.textContent ?? "")),
  "37.15 back in Packages the cell counts it"
);

/* a refund is the stamp that changes the numbers */
await sleep(5);
await stampPkg(/Alpha Cards/, "Refunded");
ok(!card(/Alpha Cards/), "37.16 a refunded package leaves the list");
ok(
  /0\/10/.test(text()) && /3 packages/.test(text()),
  "37.17 and the counts — the money is back, so nothing is outstanding"
);
ok(!cell(/canceled/), "37.18 without being mistaken for a canceled order");
ok(
  /1 stamped/.test((stampedCell()?.textContent ?? "")),
  "37.19 the stamped cell still counts it, which is the way back to it"
);
await click(stampedCell(), "filter to stamped");
ok(
  !!card(/Alpha Cards/) &&
    /REFUNDED ·/.test(card(/Alpha Cards/).textContent) &&
    !/CLAIM FILED/.test(card(/Alpha Cards/).textContent),
  "37.20 under the filter it is there, the new stamp in place of the old — one stamp per order"
);
ok(
  /4 left · refunded/.test(card(/Alpha Cards/).textContent) &&
    !/\$4\.00/.test(card(/Alpha Cards/).textContent),
  "37.21 wearing a manila 'refunded' pill rather than a red figure"
);
ok(
  /0\/10/.test(text()) && /3 packages/.test(text()),
  "37.22 the masthead does not change with the filter"
);
ok(!card(/Beta Games/), "37.23 and unstamped packages are filtered out");
await sleep(SAVE_WAIT);
ok(
  (saved().stamps?.[GK_A]?.updatedAt ?? 0) > firstUpdated,
  "37.24 replacing the stamp re-stamps updatedAt, so the merge knows which copy is newer"
);
await click(stampedCell(), "filter off");
ok(!card(/Alpha Cards/) && !!card(/Beta Games/), "37.25 the filter comes off the same way");

/* the filter sits ON TOP of Showing, not beside it */
await fresh();
await stampPkg(/Beta Games/, "Seller contacted", "asked for tracking");
await click(inCard(card(/Beta Games/), /^Mark all received$/), "receive all of Beta");
ok(!card(/Beta Games/), "37.26 a fully received package hides under Unreceived, stamped or not");
ok(/1 stamped/.test((stampedCell()?.textContent ?? "")), "37.27 the cell still counts it");
await click(stampedCell(), "filter on");
ok(
  !card(/Beta Games/),
  "37.28 the filter does not bring a received package back — Showing still applies"
);
await toggleShowing();
ok(
  !!card(/Beta Games/) && /SELLER CONTACTED/.test(card(/Beta Games/).textContent),
  "37.29 Everything does"
);

/* and on top of Find, which now reads the stamp too */
await fresh();
await stampPkg(/Alpha Cards/, "Claim filed", "usps 9400");
await click(stampedCell(), "filter on");
await type(search(), "Gamma");
ok(!card(/Alpha Cards/), "37.30 Find still narrows the stamped list");
await type(search(), "");
await click(stampedCell(), "filter off");
await type(search(), "9400");
{
  const c = card(/Alpha Cards/);
  ok(
    c && /Lightning Bolt/.test(c.textContent) && /Counterspell/.test(c.textContent) &&
      /Brainstorm/.test(c.textContent),
    "37.31 a note match finds the order and shows every line of it"
  );
  ok(!/more lines? in this order/.test(c.textContent), "37.32 with nothing for the search to be hiding");
  ok(!card(/Beta Games/), "37.33 and only that order");
}
await stampPkg(/Alpha Cards/, null, "fedex 7700");
ok(
  !card(/Alpha Cards/),
  "37.34 editing the note under a live search re-runs the search — the hit is gone"
);
await type(search(), "claim");
ok(!!card(/Alpha Cards/), "37.35 the stamp's label is searchable too");
await type(search(), "");

/* and on top of the date range, count and list alike */
await stampPkg(/Gamma Cards/, "Reshipped", "");
ok(/2 stamped/.test((stampedCell()?.textContent ?? "")), "37.36 two stamped orders");
await openRange();
await click(opt("By month"), "by month");
await click(monthChips().find((b) => /Jul/.test(b.textContent)), "pick July");
/* Re-pointed route: the date range is picked on the Ledger tab, and it filters
   the Packages view too (date-filter-spans-ledger-views). The stamped cell and
   the cards are read back on Packages. */
await goTo("packages");
ok(
  /1 stamped/.test((stampedCell()?.textContent ?? "")),
  "37.37 the count follows the date range — Gamma is a June order"
);
await click(stampedCell(), "filter on");
ok(!!card(/Alpha Cards/) && !card(/Gamma Cards/), "37.38 and so does the list");
await openRange();
await click(opt("All time"), "all time");
await goTo("packages");
ok(
  /2 stamped/.test((stampedCell()?.textContent ?? "")) && !!card(/Gamma Cards/),
  "37.39 widen the range and both are back"
);
await stampPkg(/Alpha Cards/, "Refunded");
{
  const t = text();
  ok(
    t.indexOf("Alpha Cards") !== -1 && t.indexOf("Alpha Cards") < t.indexOf("Gamma Cards"),
    "37.40 under Newest the refunded July order still sorts ahead of the June one — the frozen order ranks the stamped list, not the list it left"
  );
}

/* removal: two-tap, and a tombstone rather than a hole */
await click(bandOf(card(/Alpha Cards/)), "open Alpha's stamp");
await click(inCard(card(/Alpha Cards/), /^Remove stamp$/), "remove, first tap");
ok(
  !!inCard(card(/Alpha Cards/), /Tap again to remove/),
  "37.41 Remove is two-tap, like every other destructive control"
);
await sleep(SAVE_WAIT);
eq(saved().stamps?.[GK_A]?.kind, "refunded", "37.42 and one tap changes nothing");
await click(inCard(card(/Alpha Cards/), /Tap again to remove/), "remove, second tap");
ok(!card(/Alpha Cards/), "37.43 un-stamped, Alpha drops out of the stamped list");
ok(/1 stamped/.test((stampedCell()?.textContent ?? "")), "37.44 and the cell counts one fewer");
await sleep(SAVE_WAIT);
ok(
  GK_A in (saved().stamps || {}) && saved().stamps[GK_A].kind === "",
  "37.45 the removal is a tombstone in the blob, not a missing key — so it can travel to the other device"
);
await click(stampedCell(), "filter off");
ok(
  !!card(/Alpha Cards/) && !!inCard(card(/Alpha Cards/), /^Stamp$/) && /0\/14/.test(text()),
  "37.46 Alpha is back in the normal list, un-refunded, offering a fresh Stamp"
);
await click(stampedCell(), "filter on again");
await click(bandOf(card(/Gamma Cards/)), "open Gamma's stamp");
await click(inCard(card(/Gamma Cards/), /^Remove stamp$/), "first tap");
await click(inCard(card(/Gamma Cards/), /Tap again to remove/), "second tap");
ok(
  !stampedCell() &&
    [/Alpha Cards/, /Beta Games/, /Gamma Cards/, /Delta Cards/].every((re) => !!card(re)),
  "37.47 removing the last stamp drops the filter rather than stranding an empty list"
);

/* the five sites of invariant saved-state-shape */
await fresh();
await stampPkg(/Alpha Cards/, "Claim filed", "reload me");
await sleep(SAVE_WAIT);
await boot(saved());
ok(
  /CLAIM FILED/.test(card(/Alpha Cards/).textContent) && /reload me/.test(text()),
  "37.48 stamps survive a reload"
);
await boot({
  items: ITEMS,
  received: {},
  envelopes: [],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
ok(
  !/undefined/.test(text()) && !stampedCell() && !!inCard(card(/Alpha Cards/), /^Stamp$/),
  "37.49 a blob written before stamps shipped loads clean, with nothing stamped"
);
await stampPkg(/Alpha Cards/, "Claim filed", "");
await sleep(SAVE_WAIT);
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "reset");
await click(btn(/Tap again to clear \d+ cards?/), "confirm reset");
await sleep(800); // past the debounce, which is when a stale value would reappear
eq(saved().stamps ?? {}, {}, "37.50 Reset clears stamps and the debounce does not write them back");

await fresh();
await stampPkg(/Alpha Cards/, "Claim filed", "pushed");
await openSync();
await saveGitHubKey();
/* Re-pointed: Push left the UI (owner ruling 2026-10-12); the hidden page's
   auto-push writes the payload instead. */
await background();
await drain();
ok(
  pushes()[0] && JSON.parse(pushes()[0].text).stamps?.[GK_A]?.kind === "claim",
  "37.51 the pushed payload carries the stamps"
);

/* Re-pointed to the History path (the retired 37.53 drove Pull from GitHub):
   a version restore is a full replace, and the version carries the stamps. */
await fresh();
await stampPkg(/Alpha Cards/, "Claim filed", "keep me");
await sleep(SAVE_WAIT);
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm reset");
await click(btn(/Tap again to clear \d+ cards?/), "confirm reset");
await sleep(SAVE_WAIT);
await openHistory();
await click(btn(/before reset/), "expand that version");
await click(btn(/Restore this version/), "arm restore");
await click(btn(/Tap again to replace \d+ cards?/), "confirm restore");
await settle();
await sleep(SAVE_WAIT);
await goTo("packages");
ok(
  /CLAIM FILED/.test(card(/Alpha Cards/)?.textContent ?? "") && /keep me/.test(text()),
  "37.53 a History restore brings the version's stamps and notes back, as a full replace"
);

const REMOTE_STAMPED = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [],
  stamps: { [GK_C]: S("reshipped", 5, "second copy on its way") },
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
await boot(
  { items: ITEMS, received: {}, stamps: { [GK_A]: { ...S("claim", 10), at: "2026-08-20" } } },
  null,
  { remote: REMOTE_STAMPED }
);
ok(
  /CLAIM FILED · 08-20/.test(card(/Alpha Cards/).textContent),
  "37.52 (setup) the local stamp renders straight from the blob, dated as stored"
);
/* 37.53 retired: it drove "Pull from GitHub" and its confirm, both removed
   (owner ruling 2026-10-12). The mirror only merges, so a stamp is never
   replaced wholesale from GitHub; 37.65 to 37.68 carry the merge rule. */

/* the merge rule, pure — the sixth site */
eq(
  mergeStamps({ a: S("claim", 10) }, { a: S("refunded", 20) }).stamps.a.kind,
  "refunded",
  "37.54 the fresher stamp wins"
);
eq(
  mergeStamps({ a: S("claim", 10) }, { a: S("refunded", 10) }).stamps.a.kind,
  "claim",
  "37.55 a tie goes to the device running the merge"
);
eq(
  mergeStamps({ a: S("claim", 10) }, { a: TOMB(20) }).stamps.a.kind,
  "",
  "37.56 a newer tombstone removes — the removal travels"
);
eq(
  mergeStamps({ a: TOMB(10) }, { a: S("claim", 20) }).stamps.a.kind,
  "claim",
  "37.57 an older tombstone loses — re-stamping after a removal elsewhere works"
);
eq(
  mergeStamps({ a: S("claim", 10) }, { a: { kind: "reshipped" } }).stamps.a.kind,
  "claim",
  "37.58 a copy with no timestamp reads as oldest, without crashing"
);
{
  const ab = mergeStamps(
    { a: S("claim", 10), b: S("contacted", 30) },
    { a: S("refunded", 20), c: S("reshipped", 5) }
  );
  const ba = mergeStamps(
    { a: S("refunded", 20), c: S("reshipped", 5) },
    { a: S("claim", 10), b: S("contacted", 30) }
  );
  eq(
    sortedEntries(ab.stamps),
    sortedEntries(ba.stamps),
    "37.59 merging either way round gives the same stamps — it cannot pick a loser"
  );
  eq(mergeStamps(ab.stamps, ab.stamps).added, 0, "37.60 merging the same thing twice adds nothing");
}
eq(
  mergeStamps({}, { a: S("claim", 1), b: TOMB(2) }).added,
  1,
  "37.61 `added` counts stamps, not tombstones — a removal is not 'a stamp from the other device'"
);
eq(
  mergeLedger(PHONE, LAPTOP).merged.stamps,
  {},
  "37.62 a merged ledger always carries a stamps key, even when neither side had any"
);
{
  const m = mergeLedger(
    { ...PHONE, stamps: { a: S("claim", 10) } },
    { ...LAPTOP, stamps: { b: S("reshipped", 5) } }
  );
  ok(
    m.merged.stamps?.a?.kind === "claim" && m.merged.stamps?.b?.kind === "reshipped" &&
      m.stats.stampsAdded === 1,
    "37.63 and carries both devices' stamps — the merge builder names the key"
  );
}
ok(
  /1 stamp\b/.test(
    mergeSummary({ itemsAdded: 0, checkInsAdded: 0, envelopesAdded: 0, stampsAdded: 1 })
  ) &&
    /2 stamps/.test(
      mergeSummary({ itemsAdded: 0, checkInsAdded: 0, envelopesAdded: 0, stampsAdded: 2 })
    ),
  "37.64 the notice says so"
);

/* and driven through the app, group 34's shape: a stale copy on GitHub, merged
   by the mirror on a fresh resume (Push and Merge & push left the UI, owner
   ruling 2026-10-12) — with a removal on the other side */
const LAPTOP_STAMPED = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [],
  stamps: { [GK_A]: TOMB(20), [GK_D]: S("reshipped", 5, "laptop's") },
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
await boot(
  {
    items: ITEMS.slice(0, 8),
    received: {},
    stamps: { [GK_A]: S("claim", 10), [GK_C]: S("contacted", 10, "phone's") },
  },
  null,
  { remote: LAPTOP_STAMPED }
);
await saveGitHubKey();
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
/* the auto-push that follows the merge is the next background (see 34.6) */
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
{
  const st = saved().stamps || {};
  ok(st[GK_C]?.kind === "contacted", "37.65 this device's stamp survives the merge");
  ok(st[GK_D]?.kind === "reshipped", "37.66 the other device's arrives");
  ok(
    st[GK_A]?.kind === "",
    "37.67 and its newer removal takes this device's older stamp with it"
  );
  const up = JSON.parse(remoteText()).stamps || {};
  ok(
    up[GK_A]?.kind === "" && up[GK_C]?.kind === "contacted" && up[GK_D]?.kind === "reshipped",
    "37.68 the merged stamps reach GitHub"
  );
  /* Re-pointed (default 5, sync-revamp-cloudflare): the merge notice stays, and
     a merge that removes something says so. The notice names no GitHub. The
     count itself is pinned by the pure mergeSummary case, 37.64. */
  await onLedger();
ok(
    /Merged — .*1 stamp from the other device/.test(text()) &&
      /Removed by the other device's later changes: 1 stamp/.test(text()) &&
      !/GitHub/.test(text()),
    "37.69 the merge notice stays, says what the merge removed, and names no GitHub"
  );
}

/* The Orphaned view hangs off the same chokepoint. This is the assertion that
   caught a mutant the counts could not: with the refund exclusion dropped from
   `liveItems` alone, every masthead figure still came out right (they derive
   from `rangedItems`, which excludes refunds on its own) — only the envelope
   candidates went wrong, offering a package nothing is expected from. */
await fresh();
await stampPkg(/Delta Cards/, "Partial refund", "$50 back");
await goTo("orphaned");
await record(["Urza's Saga"]);
ok(
  /No outstanding package accounts/.test(text()),
  "37.70 a refunded order's cards are not candidates for an orphaned envelope — nothing is expected from it any more"
);
ok(/no outstanding copy/.test(text()), "37.71 and the entry is tagged as unexplained");

/* ── 38. which saved versions survive ─────────────────────────────────────
   Pure, imported directly, same rationale as 27, 31 and 33: a pruning bug
   deletes the one version the user was reaching for and leaves a list that
   looks perfectly healthy. There is nothing to notice until the moment it
   matters, which is the moment it can't be fixed. */

const DAY = 86_400_000;
const NOW = Date.parse("2026-09-05T14:00:00");
/* built with local-midnight offsets, because dayKey reads local calendar days
   and a UTC-built fixture would land on the wrong side of the boundary for
   anyone behind UTC — the same trap test 23.16 pins on the date filter */
const atDay = (daysAgo, hour = 12) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};
const ver = (id, at, kind = "recent") => ({ id, at, kind });

/* the recent ring, and the only thing it promises: the newest N */
const manyRecents = Array.from({ length: 30 }, (_, i) =>
  ver(`r${i}`, NOW - i * 30_000)
);
{
  const keep = keptIds(manyRecents, NOW);
  ok(keep.has("r0"), "38.1 the newest check-in snapshot survives");
  /* r29 is the oldest AND today's earliest, so the anchor rule keeps it —
     which is the union working, not the ring failing. r25 is out of the top
     20 and is nobody's anchor, so it is what the ring's promise rests on. */
  ok(!keep.has("r25"), "38.2 and the ring really does drop what falls out of it");
  /* r0 is also today's earliest? No — r29 is, so the anchor rule keeps it too
     if they share a day. These are 30s apart, so they do. Assert the COUNT
     rather than a membership, which is what a ring is actually claiming. */
  eq(
    manyRecents.filter((r) => keptIds(manyRecents, NOW).has(r.id)).length,
    RETENTION.recentKeep + 1,
    "38.3 the ring keeps exactly its quota, plus the day's anchor"
  );
}

/* Milestones do NOT compete with the ring. This is the union-not-intersection
   property: thirty ordinary check-ins must not be able to evict the snapshot
   taken in front of an import. */
{
  const mixed = [
    ...Array.from({ length: 40 }, (_, i) => ver(`r${i}`, NOW - i * 30_000)),
    ver("m1", NOW - 60_000, "milestone"),
  ];
  ok(keptIds(mixed, NOW).has("m1"), "38.4 a milestone outlives the recent ring");
}

/* The tier that closes the real gap. The ring holds ten to thirty minutes of
   dense work; the day anchor holds this morning. Without an hourly tier the
   honest answer to "put it back to how it was at 11am" was "you can't". */
{
  const atHoursAgo = (h, min = 0) => NOW - h * 3_600_000 + min * 60_000;
  /* Every other tier deliberately neutralised, or this proves nothing. The ring
     is saturated with the last few minutes so nothing survives by being recent,
     and `dawn` is today's earliest record so it — not h3early — is the DAY
     anchor. Without dawn, h3early is kept by the day tier and the whole block
     passes with the hourly tier deleted; that mutant survived the first run.

     This is the fourth time in this group the same shape has bitten: when
     asserting that one tier keeps or drops something, make sure no other tier
     is quietly deciding it for you. */
  const day = [
    ...Array.from({ length: RETENTION.recentKeep }, (_, i) =>
      ver(`now${i}`, NOW - i * 30_000)
    ),
    ver("dawn", atHoursAgo(9)),
    ver("h3early", atHoursAgo(3, 2)),
    ver("h3late", atHoursAgo(3, 55)),
    /* h34 exists so h30 is NOT its day's anchor — otherwise h30 survives via
       the DAY tier and proves nothing about the hourly one. Third time this
       exact shape has bitten in this group: when asserting that a tier drops
       something, make sure no other tier is quietly keeping it. */
    ver("h34", atHoursAgo(34)),
    ver("h30", atHoursAgo(30)),
  ];
  const keep = keptIds(day, NOW);
  ok(keep.has("h3early"), "38.5b three hours ago is still reachable");
  ok(
    !keep.has("h3late"),
    "38.5c but only the hour's first — the rest of it is not an anchor"
  );
  ok(
    !keep.has("h30"),
    "38.5d and the hourly reach ends at a day, or it would never stop"
  );
  eq(
    [...hourAnchors([ver("late", atHoursAgo(5, 50)), ver("early", atHoursAgo(5, 1))])],
    ["early"],
    "38.5e the hour's anchor is its earliest, like the day's"
  );
}

/* the reach: an old day's first version is what "restore last Tuesday" means */
{
  /* the ring is saturated with today's work on purpose: with only a handful
     of records it keeps everything, and every assertion below would pass for
     the wrong reason */
  const spread = [
    ...Array.from({ length: RETENTION.recentKeep }, (_, i) =>
      ver(`fill${i}`, NOW - i * 30_000)
    ),
    ver("d90a", atDay(90, 9)),
    ver("d90b", atDay(90, 17)),
    ver("d200", atDay(200)),
  ];
  const keep = keptIds(spread, NOW);
  ok(keep.has("d90a"), "38.5 the first version of an old day is kept");
  ok(
    !keep.has("d90b"),
    "38.6 but only the first — the rest of that day is not an anchor"
  );
  ok(!keep.has("d200"), "38.7 and reach really does end, rather than growing forever");
}

/* Earliest, not latest, and this is the whole point of a day anchor: you are
   reaching for how things stood BEFORE the day that went wrong. Keeping the
   day's last version would preserve the damage and drop the thing you wanted. */
{
  const oneDay = [ver("late", atDay(3, 20)), ver("early", atDay(3, 7))];
  eq([...dayAnchors(oneDay)], ["early"], "38.8 the day's anchor is its earliest");
}

/* The first draft of this asserted dayKey("2026-05-01T00:30") === "2026-05-01",
   which is true under the UTC reading too and so could not fail — the exact
   decoration shape this file's notes warn about. The boundary has to be
   derived from the runner's own offset instead: an instant one minute the
   right side of local midnight is on a DIFFERENT UTC day wherever this runs,
   and in UTC itself no such instant exists, so there is nothing to claim. */
{
  const off = new Date(NOW).getTimezoneOffset();
  if (off !== 0) {
    const d = new Date(NOW);
    d.setHours(off > 0 ? 23 : 0, off > 0 ? 59 : 1, 0, 0);
    ok(
      dayKey(d.getTime()) !== d.toISOString().slice(0, 10),
      "38.9 days are local — an instant on another UTC day still reads as its own"
    );
  }
}

/* prunePlan is the complement of keptIds and must stay that way — two
   independent rule sets is how a record ends up both kept and dropped */
{
  const all = [
    ...Array.from({ length: 25 }, (_, i) => ver(`r${i}`, NOW - i * 30_000)),
    ver("old", atDay(400)),
  ];
  const dropped = new Set(prunePlan(all, NOW));
  const kept = keptIds(all, NOW);
  ok(
    all.every((r) => dropped.has(r.id) !== kept.has(r.id)),
    "38.10 every record is either kept or dropped, never both and never neither"
  );
  ok(dropped.has("old"), "38.11 and a version past every window is dropped");
}

/* the write gate: a mail day is hundreds of taps on a 500ms save debounce, so
   snapshotting every save would spend the entire ring on one package */
ok(!shouldSnapshot("recent", NOW - 5_000, NOW), "38.12 check-ins don't each earn a version");
ok(shouldSnapshot("recent", NOW - 45_000, NOW), "38.13 but a real gap in the work does");
ok(
  shouldSnapshot("milestone", NOW - 1, NOW),
  "38.14 a milestone always writes — it is standing in front of a bulk operation"
);
ok(shouldSnapshot("recent", null, NOW), "38.15 and the very first version always writes");


/* ── 38b. the two silences the audit found ───────────────────────────────
   Both are the same failure: a promise the app keeps making after it has
   stopped being able to keep it. Neither had any surface at all. */

/* Being BEHIND is broken. auto-push declines while `ahead`, and the merge only
   fires on a fresh session — so a device that goes behind mid-session stops
   backing up entirely, for the rest of that session. The old manila notice
   used to cover that; removing it left the stall invisible, and the 24h
   staleness backstop cannot rescue it because the memo never recomputes. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();
/* Re-pointed: Push left the UI (owner ruling 2026-10-12). A hidden page's
   auto-push puts the device in step instead. */
await background();
await drain();
ok(!/tap to fix/.test(text()), "38b.1 in step, the line says nothing is wrong");
/* the other device pushes while we sit here — no resume, so no auto-merge */
remote.content = utf8ToBase64(LAPTOP_PUSHED);
remote.sha = "sha-behind";
await foreground();
await settle();
/* Re-pointed (owner ruling 2026-10-12, default 5): a GitHub copy that is ahead
   is a mirror state, so the user is shown no line for it. The stall itself is
   still real, and the backup watchdog is what catches it
   (watchdog-catches-silent-failure). */
ok(
  !GITHUB_STATE_TEXT.test(text()) && !btn(/newer lines/),
  "38b.2 going behind mid-session shows the user no GitHub line (default 5)"
);
const stalled = pushes().length;
await background();
eq(pushes().length, stalled, "38b.3 and it really has stopped backing up");

/* An undo survives a trip to Packages by design (group 14), and it used to
   block auto-push for the whole session as a side effect — invisibly, because
   there is no undo control outside Orphaned. The merge still guards on it
   (applying nulls it); the push does not, because a push changes nothing here
   and the check-in it would publish genuinely happened. */
await boot({ items: ITEMS, received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();
await goTo("orphaned");
await record(["Ponder"]);
await assign(0);
await goTo("packages");
const withUndo = pushes().length;
await background();
ok(
  pushes().length > withUndo,
  "38b.3b a pending undo does not stop the backup — only the merge guards on it"
);

/* A version store that cannot write makes "Reset is recoverable" false. It
   used to fail into an empty catch, and History then said "No versions saved
   on this device yet" — affirmatively wrong rather than merely unhelpful. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: null });
/* the mock's methods live on one shared object, so this must be put back or it
   leaks into every group after this one */
const realPut = win.versions.put;
win.versions.put = async () => {
  throw new Error("QuotaExceededError");
};
await click(btn(/Mark all received/), "a change the store cannot save");
await settle();
await openHistory();
ok(
  /would not be undoable/.test(text()),
  "38b.4 a store that cannot write says so, instead of failing silently"
);
ok(
  !/No versions saved on this device yet/.test(text()),
  "38b.5 and never claims an empty list it has not actually read"
);
win.versions.put = realPut;

/* ── 38c. a private ledger repo ───────────────────────────────────────────
   GitHub hides a repo you cannot see behind a 404 rather than admitting a 403,
   so on a private ledger "nothing has been pushed yet" and "you need a key"
   arrive identically. Told the first when the second is true, a device would
   report a backup that never worked — over a ledger sitting safely on a branch
   it simply cannot read. The photo repo has always had this shape; the ledger
   inherited it the day it stopped being public. */

await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: null });
remote.private = true;
await openSync();
/* Re-pointed: Pull from GitHub left the UI, and "can't see the backup" is a
   GitHub state the user is no longer shown (owner ruling 2026-10-12, default 5). */
await settle();
ok(
  !/can’t see the backup/.test(text()) && !GITHUB_STATE_TEXT.test(text()),
  "38c.1 a keyless device on a private ledger shows no GitHub copy (default 5)"
);
ok(
  !/pushed yet/.test(text()),
  "38c.2 and never that nothing has been pushed — which would be a lie"
);
eq(saved().items?.length ?? 3, 3, "38c.3 and nothing on this device changed");
remote.private = false;

/* ── 38d. the public seed ─────────────────────────────────────────────────
   The site is public and the ledger repo is not, and those are separate
   artifacts — Pages serves `main` root and has never served `data`. So sharing
   the URL used to hand someone the app with nothing in it. A snapshot baked
   into index.html closes that without reopening the repo: a visitor lands on a
   populated app, fiddles with it locally, and cannot push because pushing needs
   a token they do not have. */

const SEED = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: { [ITEMS[0].key]: 1 },
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

/* a stranger: nothing saved, no key */
await boot(null, null, { remote: null, seed: SEED });
await settle();
ok(/Lightning Bolt/.test(text()), "38d.1 a visitor lands on a populated app");
ok(
  /someone else’s ledger/.test(text()),
  "38d.2 and is told whose it is, and that their changes stay put"
);
ok(
  !/tap to set it up/.test(text()),
  "38d.3 not told to set up a backup — there is nothing of theirs to back up"
);

/* it is a real working copy, not a read-only display */
await toggleShowing();
await click(btn(/Mark all received/), "a visitor ticks something off");
await settle();
await sleep(SAVE_WAIT);
ok(saved().items.length > 0, "38d.4 their edits land in their OWN storage");
eq(pushes().length, 0, "38d.5 and nothing was pushed anywhere");

/* THE guard. A device with a key is the owner's, and the seed is a build-time
   snapshot — hydrating it over cleared owner-storage would put stale data under
   a live sha, and auto-push would then publish it. */
await boot(null, null, {
  remote: null,
  seed: SEED,
  remoteKey: "github_pat_testtoken",
});
await settle();
ok(
  !/Lightning Bolt/.test(text()),
  "38d.6 a device WITH a key is never seeded — it pulls instead"
);
eq(saved().items?.length ?? 0, 0, "38d.7 so no stale snapshot can be published from it");

/* and a device that already has a ledger keeps it */
await boot({ items: ITEMS.slice(0, 2), received: {} }, null, {
  remote: null,
  seed: SEED,
});
await settle();
/* the DOM first, because `saved()` alone cannot fail here: the debounced save
   is 500ms away, so without the wait below it returns the boot fixture whether
   or not the seed overwrote state. The overwrite mutant survived on exactly
   that — the same shape 34.10 records. */
ok(
  !/Urza/.test(text()),
  "38d.8 an existing ledger is not replaced by the seed"
);
await sleep(SAVE_WAIT);
eq(saved().items.length, 2, "38d.9 and that is what persists");

/* ── 39. the rollback list ────────────────────────────────────────────────
   Driving the app, unlike group 36 which drives the rules. The claim is
   narrower and more useful: a version stands in front of each operation that
   can lose data in bulk, it holds the world as it was BEFORE that operation,
   and restoring one is itself undoable. */

await boot({ items: ITEMS.slice(0, 3), received: {} });
/* History is gated on the versions ADAPTER, not on there being versions —
   Backup lives inside it now, so it has to be reachable before the first one
   exists. What is empty at this point is the list itself. */
await openHistory();
ok(
  /No versions saved on this device yet/.test(text()),
  "39.1 nothing saved yet, and the panel says so"
);
/* Showing defaults to Unreceived, and a fully-received package hides — which
   would take the very button the next few steps need with it */
await toggleShowing();
/* Re-pointed route: openHistory and toggleShowing leave the app on the Ledger
   tab, and the per-package bulk buttons live on Packages. */
await goTo("packages");

await click(btn(/Mark all received/), "check the package in");
await settle();
ok(
  !/No versions saved on this device yet/.test(text()),
  "39.2 and the first real change earns one"
);

/* the gate: a mail day is hundreds of taps on a 500ms save debounce, and with
   no throttle the ring would be spent on a single package */
const afterOne = versionMetas().filter((m) => m.kind !== "milestone").length;
await click(btn(/Clear check-ins/), "clear them");
await settle();
await click(btn(/Mark all received/), "and check them in again");
await settle();
eq(
  versionMetas().filter((m) => m.kind !== "milestone").length,
  afterOne,
  "39.3 but further changes inside the gate don't each earn one"
);

/* ---- a milestone stands in front of an import ---- */
await reachFor(/Re-import CSV/);
await click(btn(/Re-import CSV/), "open the upload zone");
await dropFile(
  "more.csv",
  csv([
    { "Order Id": "NEW1", Party: "New Seller", "Product Name": "Lightning Bolt" },
    { "Order Id": "NEW1", Party: "New Seller", "Product Name": "Counterspell" },
  ])
);
await settle();
const beforeImport = versionText("before import");
ok(!!beforeImport, "39.4 an import takes a milestone in front of it");
/* guarded, deliberately: a milestone that was never taken makes this null, and
   an assertion that THROWS aborts a top-to-bottom suite with no isolation —
   masking every group after it. Fail, don't explode. */
eq(
  beforeImport && JSON.parse(beforeImport).items.length,
  3,
  "39.5 holding the ledger as it was BEFORE the import, not after"
);

/* ---- and in front of a Reset, which is the one that matters most ---- */
/* an envelope first, so the milestone has something in it that ONLY snapshot()
   carries — items alone would pass just as well under a version builder that
   quietly dropped envelopes, which is the whole reason takeVersion is a third
   reader of snapshot() rather than a fourth builder */
await goTo("orphaned");
await record(["Lightning Bolt"]);
await settle();
/* Reset is reachable from Orphaned by design, so there is no need to come
   back — and staying here proves it */
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm reset");
await click(btn(/Tap again to clear \d+ cards?/), "confirm reset");
await settle();
await sleep(SAVE_WAIT);
eq(saved().items?.length ?? 0, 0, "39.6 the Reset really did clear the ledger");
const beforeReset = versionText("before reset");
ok(!!beforeReset, "39.7 a Reset takes a milestone in front of it");
eq(
  beforeReset && JSON.parse(beforeReset).items.length,
  5,
  "39.8 holding the imported ledger the Reset destroyed"
);
eq(
  beforeReset && JSON.parse(beforeReset).envelopes?.length,
  1,
  "39.8b and the hand-typed envelope too — a version is the WHOLE saved shape"
);
ok(
  versionMetas().length > 0,
  "39.9 and versions survive resetAll — clearing them would destroy the escape hatch"
);

/* ---- restoring, which is the whole point ---- */
ok(!!btn(/^History/), "39.10 History is reachable on the ledger a Reset emptied");
await openHistory();
await click(btn(/before reset/), "expand that version");
await click(btn(/Restore this version/), "arm restore");
await settle();
eq(
  saved().items?.length ?? 0,
  0,
  "39.11 one tap does not restore — invariant no-native-dialogs, it is a full replace"
);
await click(btn(/Tap again to replace \d+ cards?/), "confirm restore");
await settle();
await sleep(SAVE_WAIT);
eq(saved().items.length, 5, "39.12 two taps bring the destroyed ledger back");
ok(
  !!versionText("before restore"),
  "39.13 and the restore took its own milestone, so the wrong row is survivable"
);

/* arming a restore has to disarm Reset — two primed destructive buttons side
   by side is the exact mis-tap invariant no-native-dialogs exists to prevent */
/* Driven restore-first, because that is the only order the UI now allows: an
   armed Reset takes the row AND closes the panels the other cells control, so
   there is no Restore button on screen to reach while it is primed. That gate
   is itself the no-native-dialogs property — nothing beside the armed control to
   mis-tap — so the pair is tested in the direction it can actually happen. */
await openHistory();
await click(btn(/before reset/), "expand a version");
await click(btn(/Restore this version/), "arm restore");
ok(
  /Tap again to replace \d+ cards?/.test(text()),
  "39.14 a restore arms"
);
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm Reset instead");
ok(
  /Tap again to clear \d+ cards?/.test(text()),
  "39.15 Reset arms, and takes the row"
);
ok(
  !/Tap again to replace \d+ cards?/.test(text()),
  "39.16 disarming the restore with it — never two primed at once"
);

/* ── 40. coming back to the app catches it up ─────────────────────────────
   The merge was always the safe resolution, but it needed a tap — on a panel
   you had to know to open. So two devices met at the conflict rather than at
   the merge. This runs the same doMerge on the same threshold the Showing
   reset already uses: a real absence is a new session, and a new session starts
   by catching up.

   The threshold is the whole design. Applying forty imported lines into the
   package list mid-check-in is the cascading mis-tap invariant no-layout-shift-under-pointer exists to
   prevent; coming back after a minute away is not mid-check-in. */

const PHONE_STATE = { items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } };

/* boot's `remote` option seeds AFTER the mount and glances at the page, so the
   app knows the remote moved but has not been away — exactly the state a
   resume test needs to start from */
await boot(PHONE_STATE, null, { remote: LAPTOP_PUSHED });
await settle();
eq(remote.deviceSha, null, "40.1 a glance at the phone merges nothing");

/* "I could not look" is not "all clear" — the same property that stops
   auto-push writing, applied to reading. Note `ahead` is already true here, so
   an implementation that merges off the cached flag instead of a fresh peek
   merges anyway: that is the bug this pins. */
remote.peekUnknown = "offline";
await backgroundFor(5 * 60_000);
await settle();
eq(remote.deviceSha, null, "40.2 a remote it could not read is not merged");
remote.peekUnknown = null;

/* half the threshold: a hop out to read a tracking number is the same session,
   and replacing the ledger under a thumb is the mis-tap invariant no-layout-shift-under-pointer prevents */
await backgroundFor(5_000);
await settle();
eq(remote.deviceSha, null, "40.3 a glance away is still the same session");

/* and the other half, which is the whole feature */
await backgroundFor(5 * 60_000);
await settle();
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "40.4 a real absence merges without a tap");
eq(
  saved().received[ITEMS[0].key],
  1,
  "40.5 keeping this device's check-in through it — the later change wins"
);
/* group 35's rule: after a merge the payloads match either way, so payload
   equality proves nothing. The sha advancing is the only thing that says the
   pull LANDED, and it is what stops the next push conflicting. */
ok(
  remote.deviceSha !== null && remote.deviceSha === remote.sha,
  "40.6 and the merge accepted the remote's sha"
);

/* in step, a resume looks and stops there */
const pulled = remote.calls.filter((c) => c.op === "pull").length;
await backgroundFor(5 * 60_000);
await settle();
eq(
  remote.calls.filter((c) => c.op === "pull").length,
  pulled,
  "40.7 with the two ends in step, a resume pulls nothing"
);

/* An unpaired "visible" event is not a fresh session. iOS fires more of these
   than you would like, and reading "no absence recorded" as an infinite one
   would pull on every single foreground. */
remote.content = utf8ToBase64(LAPTOP_PUSHED);
remote.sha = "sha-laptop-2";
await foreground();
await settle();
ok(
  remote.deviceSha !== remote.sha,
  "40.8 a foreground with no absence behind it is not a new session"
);

/* ---- never mid-thought ----
   applyBackup calls setComposing(null), so a merge landing under a half-built
   envelope does not merely interrupt the thought — it deletes entries that are
   hand-typed, in no CSV and on no remote. And "start the envelope, duck out to
   read the label, come back two minutes later" is this feature's own workflow,
   over the threshold by construction. */
await boot(PHONE_STATE, null, { remote: LAPTOP_PUSHED });
await goTo("orphaned");
await click(btn(/Record an envelope/), "start an envelope");
await type(cardInput(), "Lightning");
await backgroundFor(5 * 60_000);
await settle();
eq(remote.deviceSha, null, "40.9 a half-built envelope holds the merge off");
ok(!!btn(/Save envelope/), "40.10 and the envelope is still on screen, not swept away");

/* the guard is the only thing holding it: finish the thought and the very next
   resume catches up. Without this, 38.9 would pass just as well if the merge
   were broken outright. */
await click(btn(/^Cancel$/), "abandon the envelope");
await backgroundFor(5 * 60_000);
await settle();
ok(
  remote.deviceSha !== null && remote.deviceSha === remote.sha,
  "40.11 once the thought is finished, the next resume merges"
);

/* ---- and a mid-session sync is not a resume ----
   `check()` re-runs on every `syncBusy` flip, not only on a visibility event,
   and a merge flips it twice. So the fresh-session signal has to be consumed
   the first time it is read, or the merge re-triggers itself — or worse, fires
   here: the laptop pushing while you are sitting in the app, mid-check-in, with
   no resume anywhere in sight. That is precisely the list-under-the-thumb
   reshape the threshold exists to prevent.

   This is the assertion the first draft of the group was missing: every other
   test here ends with the two ends in step, where no further merge is possible
   and a signal left standing costs nothing. */
await boot(PHONE_STATE, null, { remote: null });
await openSync();
await saveGitHubKey();
remote.content = utf8ToBase64(LAPTOP_PUSHED);
remote.sha = "sha-mid-session";
/* Re-pointed: Push left the UI (owner ruling 2026-10-12). A hidden page's
   auto-push is the mid-session sync that runs now. */
await background();
await drain();
eq(
  remote.deviceSha,
  null,
  "40.12 a sync mid-session does not merge — only a resume does"
);
ok(
  !GITHUB_STATE_TEXT.test(text()) && forbiddenIn().length === 0,
  "40.13 and the user is shown no GitHub copy or verb while it waits (default 5)"
);

/* ---- a cold mount is a fresh session too ----
   On iOS reopening is usually a resume, which is everything above — but
   sometimes the page really was discarded, and that is the same boundary. It
   is also the more valuable half: a fresh phone should come back already
   reconciled rather than needing someone to go looking for a control. */
await boot(PHONE_STATE, null, { remoteAtBoot: LAPTOP_PUSHED });
await settle();
await sleep(SAVE_WAIT);
eq(saved().items.length, ITEMS.length, "40.14 opening the app to an ahead remote merges");
eq(
  saved().received[ITEMS[0].key],
  1,
  "40.15 keeping this device's check-ins through the cold start"
);

/* ---- and it says nothing when it did nothing ----
   peek reports "ahead" on any new blob sha, and a push writes one whenever the
   ledger is re-saved — so an empty-data commit on the other device would
   otherwise greet the user with a notice about a merge they never asked for
   that changed nothing. */
const SAME = JSON.stringify({
  mailday: 1,
  ...PHONE_STATE,
  envelopes: [],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});
await boot(PHONE_STATE, null, { remoteAtBoot: SAME });
await settle();
ok(
  remote.deviceSha !== null && remote.deviceSha === remote.sha,
  "40.16 it still merges, so the silence below is a choice and not a no-op"
);
ok(!/Merged/.test(text()), "40.17 but says nothing, because it added nothing");

/* ── 41. older versions, read off the branch's own history ────────────────
   The archive is not something the remote grew — every push has always been a
   commit, so the branch already WAS a version history. This only makes it
   reachable from the phone, which is the half that was missing: `git show
   data~5:ledger.json` needs a laptop that is rarely in the room.

   Both calls are reads, so nothing here spends from the content-write budget
   the push and the photos share. */

await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();

/* two pushes, so the branch holds a genuinely older ledger than the current one.
   Re-pointed: Push left the UI (owner ruling 2026-10-12); a hidden page's
   auto-push writes each commit. */
await background();
await drain();
await settle();
const OLD_COUNT = saved().items.length;
await reachFor(/Re-import CSV/);
await click(btn(/Re-import CSV/), "open the upload zone");
await dropFile(
  "more.csv",
  csv([
    { "Order Id": "V1", Party: "Later Seller", "Product Name": "Ponder" },
    { "Order Id": "V1", Party: "Later Seller", "Product Name": "Preordain" },
  ])
);
await settle();
await sleep(SAVE_WAIT);
await background();
await drain();
await settle();
eq(saved().items.length, 5, "41.1 the ledger grew, and both states are on the branch");

/* nothing is fetched until asked: two round trips for something wanted rarely,
   and the local list already answers "undo what I just did" */
await openHistory();
eq(
  remote.calls.filter((c) => c.op === "listVersions").length,
  0,
  "41.2 the branch history is not fetched just because the panel opened"
);
ok(!!btn(/Load older versions/), "41.3 but there is a way to ask for it");

await click(btn(/Load older versions/), "ask for it");
await settle();
eq(
  remote.calls.filter((c) => c.op === "listVersions").length,
  1,
  "41.4 and asking fetches the branch's commits"
);

/* the older of the two commits is the 3-line ledger */
/* Matched on the FULL message, not its first word: every push message starts
   with "ledger", so a looser match silently picks the newest row and the test
   restores the version it already had — passing while proving nothing. */
const older = remote.history[0];
await click(
  buttons().find((b) => b.textContent.includes(older.message)),
  "expand the older commit"
);
await click(btn(/Restore this version/), "arm restore");
await settle();
eq(
  saved().items.length,
  5,
  "41.5 one tap does not restore — invariant no-native-dialogs applies to a remote version too"
);
await click(btn(/Tap again to replace \d+ cards?/), "confirm");
await settle();
await sleep(SAVE_WAIT);
eq(saved().items.length, OLD_COUNT, "41.6 two taps roll the ledger back to that commit");
ok(
  !!versionText("before restore"),
  "41.7 and it took a local milestone on the way in, so the rollback is undoable"
);


/* The Push button left the UI (owner ruling 2026-10-12). The GitHub write it
   used to start is autoPush, and backgrounding the app runs autoPush at once,
   so a test that needs the write on disk backgrounds instead of clicking. */
const mirrorPush = async () => {
  await background();
  await settle();
};

/* ── 42. the save indicator does not move the list ────────────────────────
   `.mdl-foot` is a wrapping flex row, so an indicator that exists only while
   a save is in flight can add a whole LINE to it — and by the time a card is
   being tapped the masthead has scrolled away, so what that actually moves is
   the package list, under the thumb, twice per check-in. Invariant no-layout-shift-under-pointer, from
   the one element in the app that changes on every single tap.

   jsdom has no layout, so the shift itself is unassertable here; it was
   measured in a real viewport instead (12–14px on 4 of 10 realistic figure
   pairs before the fix, 0 after, at 320 / 375 / 390 / 430 / 760px, with
   horizontal overflow 0 throughout). What IS assertable is the mechanism the
   fix rests on, and every part of it can regress without looking wrong.

   42.2 is the half that was got wrong first: reserving the WIDTH is not
   enough, because an empty flex item is zero pixels TALL, so a line holding
   only the empty slot collapses and the shift comes straight back — measured
   at 14px idle against 26px saving with the width already reserved. The slot
   therefore always carries content.
   42.3 keeps the reservation honest as the copy changes: the longest message
   the app can put in that slot has to fit the width the slot reserves, which
   is counted in the same monospace `ch` the reservation is written in. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: null });
const saveSlot = () => document.querySelector(".mdl-foot").lastElementChild;
const reservedCh = () => parseFloat(saveSlot().style.minWidth);
ok(
  /ch$/.test(saveSlot().style.minWidth) && reservedCh() > 0,
  "42.1 the indicator's slot reserves its width instead of being sized by its content"
);
eq(
  saveSlot().textContent,
  "\u00a0",
  "42.2 and is never empty at rest, so its line box cannot collapse"
);

/* the widest of the three messages, reached the only way it can be */
const realSet = win.storage.set;
win.storage.set = async () => {
  throw new Error("QuotaExceededError");
};
await click(btn(/Mark all received/), "a change the store cannot save");
await sleep(SAVE_WAIT);
await settle();
const worst = saveSlot().textContent;
win.storage.set = realSet;
ok(
  worst.length > 1 && worst.length <= reservedCh(),
  `42.3 the longest message ("${worst}", ${worst.length}) fits the reserved ${reservedCh()}ch`
);


/* ── 43. the joy pass: the two claims that are not about layout ─────────
   Almost nothing in the motion pass is assertable here — jsdom has no layout
   and no compositor, so durations, easing, distances and the fact that nothing
   reflows were all settled by measuring a real 375px viewport instead. Two
   claims are behaviour, though, and both fail silently.

   The first is the active-view indicator. The bottom bar replaces the switch
   (phone-nav-is-bottom-bar), and that record rules no motion for the bar, so
   the claim is the aria-current on the current tab. It is the only thing that
   says which tab is current. Lose it and the app has no active-view indicator
   at all, and every tab still looks exactly right in a DOM dump.

   The second is the gate under every celebration in the app. A plain CSS class
   replays its animation each time React rebuilds the tree, so leaving the
   stamp permanently classed would restamp every finished order on the page on
   a view switch, a re-sort or a filter change. useJustBecame ties the motion
   to the ACT of completing a package. It is also the more honest reading: the
   moment worth marking is the check-in, not the fact of having been checked
   in. */

await fresh();
eq(currentTab(), ["Packages"], "43.1 the bar says which tab is current");
await goTo("tally");
eq(currentTab(), ["Tally"], "43.2 and it follows the view");
await goTo("packages");

/* Showing starts on Unreceived, and a package that completes leaves that list
   — correct, and it would take the very element under assertion off the page.
   Everything keeps it there. */
await toggleShowing();
const alpha = card(/Alpha Cards/);
ok(!alpha.querySelector(".mdl-land"), "43.3 nothing has landed yet");
await click(inCard(alpha, /^Mark all received$/), "complete Alpha");
ok(
  !!card(/Alpha Cards/).querySelector(".mdl-land"),
  "43.4 completing a package lands its stamp"
);

/* the whole point of the gate: leave and come back, and the stamp is simply
   there. A mutant that classes the stamp on `done` alone passes 43.4 and dies
   here, which is the pair that matters. */
await goTo("tally");
await goTo("packages");
const alphaAgain = card(/Alpha Cards/);
ok(/RECEIVED/.test(alphaAgain.textContent), "43.5 the stamp survives the round trip");
ok(
  !alphaAgain.querySelector(".mdl-land"),
  "43.6 but a re-render does not restamp four hundred finished orders"
);


/* ── 44. the card does not change height on the tap that checks a card in ──
   The same defect group 42 fixed in the masthead, one level down and twice
   the size: measured at 375px against the seeded ledger, the FIRST check-in
   in a package grew its card by 28px and pushed every remaining row in it
   down by 28px — inside the card, directly under the thumb that had just
   tapped one of them. Invariant no-layout-shift-under-pointer, on the most common gesture in the app.
   Two independent causes, and both had to go:
     · a 15px progress bar mounting between the header and the item rows;
     · the contextual action row growing 39px -> 52px, because "Clear
       check-ins" joins it on that tap and three buttons want 350px of the
       313px a card gives them at 375px, so both bulk labels wrap.

   jsdom has no layout, so — exactly as in 42 — the shift itself is not
   assertable here and never will be. It was measured in a real 375px viewport
   instead: card height constant at 347.09px and every item row displaced
   0.00px across rest -> first check-in -> second -> the tap that COMPLETES
   the package (which shrank the row by the same 13px before this), with
   horizontal overflow 0 in every state; the Tally card likewise 496.09px
   constant. What is pinned below is the mechanism each of those numbers rests
   on, in the places it can regress without looking wrong in a DOM dump.

   44.5 is the one to keep if this group is ever trimmed. The bar is out of
   FLOW rather than reserved a slot, and the whole reason that route was taken
   is that it lets the `gotQty > 0 && !done` gate stand — so the bar still
   cannot render at 100%, and .mdl-gild remains the sole marker of a package
   completing (see the Motion section). Reserve the bar a permanent slot
   instead and 44.5 dies, which is the intended reading: that is a change to
   the motion design, not a refactor. */

await fresh();
await toggleShowing(); /* Everything, so a completed package stays on the page */

/* found by its own structure — a wrapper whose ProgressBar fill is sized in
   `%` — so that "is it out of flow" stays a real claim about it rather than
   the thing we used to find it */
const bar = (c) =>
  [...c.children].find(
    (k) =>
      k.tagName === "DIV" &&
      /%$/.test(k.firstElementChild?.firstElementChild?.style.width || "")
  );
const bulkRow = (c) =>
  [...c.children].find((k) =>
    /Mark all received|Clear check-ins/.test(k.textContent)
  );

const alphaCard = () => card(/Alpha Cards/);
ok(!bar(alphaCard()), "44.1 an untouched package has no progress bar");
eq(
  alphaCard().style.position,
  "relative",
  "44.2 and the card is the containing block the bar will need"
);
const restRow = bulkRow(alphaCard()).style.minHeight;
ok(!!restRow, "44.3 its action row reserves a height rather than taking its own");

await click(
  alphaCard().querySelector('button[aria-label="Mark as received"]'),
  "check one card in"
);
const partBar = bar(alphaCard());
ok(!!partBar, "44.4 checking one card in mounts the bar");
eq(
  partBar.style.position,
  "absolute",
  "44.4a out of flow, so mounting it displaces none of the rows below"
);
eq(
  partBar.style.pointerEvents,
  "none",
  "44.4b and it cannot eat the header tap it now lies across"
);
eq(
  bulkRow(alphaCard()).style.minHeight,
  restRow,
  "44.4c the row's reservation does not move when Clear check-ins joins it"
);

/* the gate, and the reason for taking the bar out of flow rather than
   reserving it a slot */
await click(inCard(alphaCard(), /^Mark all received$/), "complete Alpha");
ok(
  !bar(alphaCard()),
  "44.5 completing the package unmounts the bar, so it never renders at 100%"
);
ok(
  !!alphaCard().querySelector(".mdl-land"),
  "44.5a and the stamp is still what marks the completion"
);
eq(
  bulkRow(alphaCard()).style.minHeight,
  restRow,
  "44.6 the reservation holds through the completing tap too, where the row shrinks"
);

/* the Tally card carries the same bar, and had to be given a containing block
   of its own for it — without one it escapes to the nearest positioned
   ancestor and draws somewhere else on the page entirely */
await goTo("tally");
const bolt = () => card(/Lightning Bolt/);
eq(
  bolt().style.position,
  "relative",
  "44.7 the Tally card is a containing block too"
);
ok(!!bar(bolt()), "44.8 and carries the bar for a partly-received item");

/* ---- 45. a device that only ever MERGES is still backed up ----------------
   Reported from the phone: "hasn't been backed up since 09-16" on a device
   whose data was demonstrably current, with no such line on the laptop. Both
   halves of that were true at once, which is the tell — `syncBroken` measured
   `pushedAt` alone, so it was asking "did I write recently?" when the line it
   renders claims "are my bytes on GitHub?".

   Those come apart as soon as the two devices have different jobs. The laptop
   is where the editing happens, so it pushes and never goes stale; the phone
   mostly merges what the laptop sent, and `acceptPull` records `pulledAt`, not
   `pushedAt`. A phone in perfect step reported itself unbacked-up for as long
   as it went without writing.

   Taking the later of the two cannot hide a real problem, because every branch
   above this one outranks it — which is what 45.3 pins. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { remote: null });
await openSync();
await saveGitHubKey();
await mirrorPush();

/* Age the write past the 24h threshold while the READ stays fresh — a phone
   that merged this morning and has not edited anything since.

   Closing the panel is what makes this land, and it is not test noise:
   `remoteInfo` is refreshed by an effect keyed on `[loaded, syncOpen]`, so
   nothing else in the app re-reads the device record. The first draft set the
   timestamps and called foreground(), which re-peeks but never re-reads
   status — the component kept the pushedAt from the push above and the mutant
   survived every assertion. */
remote.pushedAt = Date.now() - 3 * 86400000;
remote.pulledAt = Date.now();
/* the Sync row shuts the panel: the advisory line is absent on a healthy device */
await onLedger();
await click(cell(/^Sync/), "close the panel, refreshing status on the way");
await settle();
ok(
  !/tap to fix/.test(text()),
  "45.1 pulled today, pushed three days ago — not stale"
);
ok(
  !btn(/Not backed up since/),
  "45.2 and it does not accuse a device that is holding the remote's bytes"
);

/* The guard that makes 45.1 safe. A fresh pulledAt must never mask a device
   that is genuinely behind — staleness is the LAST branch for this reason. */
remote.content = utf8ToBase64(LAPTOP_PUSHED);
remote.sha = "sha-45-behind";
/* The "newer lines" copy left the UI with the GitHub verbs (owner ruling
   2026-10-12, default 5), so the guard is the live behaviour it protected: a
   device behind GitHub does not write over it, however fresh its pulledAt. */
const pushesBefore45 = pushes().length;
await foreground();
await mirrorPush();
eq(
  pushes().length,
  pushesBefore45,
  "45.3 a fresh pulledAt never masks being behind: a behind device does not write over GitHub"
);

/* ── 46. the parser keeps only TCG purchases ───────────────────────────────
   Invariant parser-filters: a row enters the checklist only when Type is
   purchase (or blank) AND Vendor starts with TCG. The real exports carry eBay
   and seller-side rows, and nothing downstream can tell one from an order once
   it is in the list. One CSV, one row per way in or out. Each rejected row
   fails a different assertion, so a mutant that drops only the vendor filter
   and a mutant that drops only the type filter each turn a different id red:
   the eBay row is a purchase (only the vendor filter rejects it), and the sale
   row is TCG (only the type filter rejects it). A blank Vendor is kept, per the
   owner's ruling in invariants/parser-filters.md. */

const KEPT = "Kept TCG Card";
const BLANK = "Kept Blank Vendor Card";
const EBAY = "Rejected eBay Card";
const SALE = "Rejected Sale Card";
const OTHER = "Rejected Other Vendor Card";

await boot({ items: [], received: {} });
await dropFile(
  "orders.csv",
  csv([
    { "Order Id": "P1", "Product Name": KEPT, Price: "2.00" },
    { "Order Id": "P2", Vendor: "", "Product Name": BLANK, Price: "2.50" },
    { "Order Id": "P3", Vendor: "eBay", "Product Name": EBAY, Price: "3.00" },
    { "Order Id": "P4", Type: "sale", "Product Name": SALE, Price: "4.00" },
    { "Order Id": "P5", Vendor: "CardMarket", "Product Name": OTHER, Price: "5.00" },
  ])
);
ok(/Imported 2 lines/.test(text()), "46.1 the TCG and blank-vendor purchases are imported, nothing else");
ok(text().includes(KEPT), "46.2 the TCG purchase is on the page");
await sleep(SAVE_WAIT);
eq(
  saved().items.map((it) => it.name).sort(),
  [KEPT, BLANK].sort(),
  "46.3 the persisted ledger holds exactly the two kept purchases"
);
ok(
  text().includes(BLANK),
  "46.4 a purchase with a blank Vendor is kept, per the owner's ruling"
);
ok(
  !text().includes(EBAY) && !saved().items.some((it) => it.name === EBAY),
  "46.5 the eBay purchase is rejected (vendor filter only)"
);
ok(
  !text().includes(OTHER) && !saved().items.some((it) => it.name === OTHER),
  "46.6 the non-TCG vendor is rejected (vendor filter only)"
);
ok(
  !text().includes(SALE) && !saved().items.some((it) => it.name === SALE),
  "46.7 the TCG sale row is rejected (type filter only)"
);

/* ── 47. a store that will not answer, and an odd sync grid ────────────────
   Records photo-ids-unreadable-local and sync-panel-is-two-column-grid.

   An unreadable LOCAL photo store keeps every id on a file restore. applyBackup
   used to read a failed keys() as "this device holds nothing", so the envelope's
   ids were stripped and the debounced save published the stripped ledger. The
   keys() call rejects for this one restore only, and is put back after.

   The Sync panel is a two-column option grid. An odd last cell spans the row so
   the rule colour does not show through the empty half. The expected spans are
   literal: the last cell must be one of FULL_ROW, and every other cell must
   carry no span. The parity is part of the compared value, so a fixture that
   drifts to the other parity fails here rather than passing vacuously. */

const KEYS_DOWN_LEDGER = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  envelopes: [
    {
      id: "env-k",
      createdAt: 1,
      note: "",
      entries: [{ name: "Ponder", qty: 1 }],
      photos: ["pho-k"],
    },
  ],
  dateFilter: { preset: "all", from: "", to: "" },
  sortBy: "newest",
  itemSort: "missing",
});

await boot({ items: ITEMS, received: {}, envelopes: [] }, []);
await goTo("orphaned");
await reachFor(/Re-import CSV/);
await click(btn(/Re-import CSV/), "show upload zone");
const realKeys = win.photos.keys;
win.photos.keys = async () => {
  throw new Error("local photo store unreadable");
};
try {
  await dropFile("ledger.json", KEYS_DOWN_LEDGER);
  /* Re-import CSV now lives on the Ledger tab (L11b), so the drop lands there;
     the pile's footer is read back on the Orphaned tab that shows it */
  await goTo("orphaned");
  /* the Orphaned pile's photo footer: a leaf div, since the count and its copy
     are text nodes with no element between them. The lookup takes the FIRST
     leaf div in DOM order whose text starts "N photo" or "N photos". The
     anchor fixes only the start of the text, so it does not pin the pile: a
     leaf reading "1 photo too" that comes earlier in DOM order is the one
     checked. Read with ?. so a missing footer fails the assertion instead of
     throwing. */
  const pileFooter = [...document.querySelectorAll("div")].find(
    (d) => d.children.length === 0 && /^\d+ photos?\b/.test(d.textContent)
  );
  ok(
    /^1 photo(?!s)/.test(pileFooter?.textContent ?? ""),
    "47.1 an unreadable local store keeps the envelope's photo id on screen"
  );
  await sleep(SAVE_WAIT);
  eq(
    saved().envelopes[0].photos,
    ["pho-k"],
    "47.2 and the saved ledger keeps the id, so the next push cannot publish it stripped"
  );
} finally {
  win.photos.keys = realKeys;
}

/* 47.3, 47.4 and 47.7 retired: they measured the Sync panel's option grid
   (Push, Merge, Pull cells, odd last cell spanning the row), and that grid left
   the UI with the verbs (owner ruling 2026-10-12). Nothing renders a span now. */

/* The unreadable copy in PHOTO_SAYS. Module scope: 47.5 and group 48 both use it. */
const PHOTO_UNREADABLE = /photos.*(could not|couldn.t) be read/i;

/* ---- an unreadable LOCAL photo store, during a push ----
   surveyPhotos bails when keys() rejects, so a push sends nothing and must say
   so. The blob is real and referenced, so a READABLE store
   would upload it, which is what makes "nothing uploaded" a real claim.
   GUARDS, not kills: read-as-empty also sends nothing on a push, because push
   only sends what it finds locally, and push never reports `lost`. The pull
   case below is the one that kills that mutant. */
{
  await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]]);
  await openSync();
  await saveGitHubKey();
  const keysBefore = win.photos.keys;
  win.photos.keys = async () => {
    throw new Error("local photo store unreadable");
  };
  const pushesBefore47 = pushes().length;
  try {
    await mirrorPush();
    await sleep(60);
  } finally {
    win.photos.keys = keysBefore;
  }
  /* every PHOTO_SAYS copy except `unreadable`, plus the pull's lost/gone notes */
  const PHOTO_LINE =
    /Photos need|photo repo|photos didn’t sync|photo uploads|to finish the photos|trouble with the photos|can’t write photos|photos sent|still to go|not on GitHub|never pushed|now gone/i;
  const pushed = remoteText() ? JSON.parse(remoteText()) : {};
  ok(pushes().length > pushesBefore47, "47.5 the push still finishes, with the ledger on GitHub");
  eq(
    pushed.envelopes?.[0]?.photos,
    ["pho-k"],
    "47.5 and the pushed ledger still references the id"
  );
  eq(remotePhotoIds(), [], "47.5 and nothing is uploaded to the photo repo");
  /* Inverted when 48.1 landed. The unreadable line must show, and no other
     photo copy may: the push says the right thing, not a server or repo error. */
  eq(
    { shown: PHOTO_UNREADABLE.test(text()), otherCopy: PHOTO_LINE.test(text()) },
    { shown: true, otherCopy: false },
    "47.5 the unreadable-photos line is shown, and no other photo copy is"
  );
}

/* ---- the same store, on a pull ----
   The pull's twin of the push case, on 30.10's fixture: the store is there and
   lacks the blob, so a READABLE store would report pho-a as lost. Unreadable,
   the pull must skip its photo phase and say nothing about photos. applyBackup's
   own keys() read is unreadable too, so it keeps the pulled id. Read as empty,
   the survey calls pho-a lost and the line shows: this is the kill for the
   read-as-empty mutant. */
{
  /* Re-pointed: Pull left the UI (owner ruling 2026-10-12). A cold mount is a
     fresh session, so the ahead remote merges with no tap, and the photo store
     is made unreadable before the mount so that merge meets it. The key is what
     makes the photo store readable. */
  const keysBefore = win.photos.keys;
  win.photos.keys = async () => {
    throw new Error("local photo store unreadable");
  };
  try {
    await boot({ items: ITEMS, received: {} }, null, {
      remoteAtBoot: PHOTO_LEDGER,
      remoteKey: "github_pat_testtoken",
    });
    await settle();
    await sleep(SAVE_WAIT);
  } finally {
    win.photos.keys = keysBefore;
  }
  eq(
    saved().envelopes?.[0]?.photos,
    ["pho-a"],
    "47.6 an unreadable local store keeps the pulled photo id"
  );
  ok(!/not on GitHub/i.test(text()), "47.6 and reports no photo as lost");
}

/* ── 48. "I could not look" is always visible ─────────────────────────────
   Records photo-ids-unreadable-local, photo-errors-never-hit-pushstate and
   ruled-head-one-advisory-entrance. Stage 1 of the sync revamp.

   Each path below is silent today. Once fixed, the builder must put the photo
   words on screen. The tests match the regexes, not exact copy. Any wording
   that matches is accepted. Examples that match:

     photo store unreadable (48.1, 48.2, 48.3, 48.5): PHOTO_UNREADABLE
       "This device’s photos could not be read, so they were not backed up."
     remote unknown: BACKUP_UNKNOWN, retired from the UI by 48.4 (default 5)

   The photo words may sit in the photo box (48.1, 48.3) or on the advisory
   line (48.2). The advisory line is the one disclosure button, so `onLine`
   looks only there.

   A photo error never sets pushState, so no conflict is armed (48.1, 48.3).
   The ledger write still finishes. "Push anyway" and "Pushed ✓" left the UI
   (owner ruling 2026-10-12), so the write itself is what the cases count.

   Each fixture carries exactly one reason for the line. A healthy push first
   clears "never synced", so the reason under test is the only one left. The
   priority order inside syncBroken is not pinned here. */
const BACKUP_UNKNOWN = /backup.*(could not|couldn.t) be checked/i;
const onLine = (re) =>
  buttons().some((b) => b.hasAttribute("aria-expanded") && re.test(b.textContent));
const KEY = { remoteKey: "github_pat_testtoken" };
const unreadable = async () => {
  throw new Error("local photo store unreadable");
};

/* ---- 48.1 a push whose photo phase cannot read the local store ---- */
await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]], KEY);
await openSync();
const keysBefore481 = win.photos.keys;
const pushes481 = pushes().length;
win.photos.keys = unreadable;
try {
  await mirrorPush();
  await sleep(60);
} finally {
  win.photos.keys = keysBefore481;
}
eq(
  {
    words: PHOTO_UNREADABLE.test(text()),
    ran: pushes().length > pushes481,
  },
  { words: true, ran: true },
  "48.1 an unreadable local store is said so, and the ledger still lands"
);

/* ---- 48.2 the same store, read by the unattended push, panel shut ---- */
await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]], KEY);
await background(); /* a healthy push first, so "never synced" is not the reason */
await settle();
const keysBefore482 = win.photos.keys;
const pushesBefore482 = pushes().length;
win.photos.keys = unreadable;
try {
  await background();
  await sleep(60);
} finally {
  win.photos.keys = keysBefore482;
}
eq(
  {
    ran: pushes().length > pushesBefore482,
    onLine: onLine(PHOTO_UNREADABLE),
  },
  { ran: true, onLine: true },
  "48.2 an unreadable local store shows on the advisory line with the panel shut"
);

/* ---- 48.3 the upload loop cannot read a blob it was told to send ---- */
await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]], KEY);
await openSync();
const getBefore483 = win.photos.get;
const pushes483 = pushes().length;
win.photos.get = unreadable;
try {
  await mirrorPush();
  await sleep(60);
} finally {
  win.photos.get = getBefore483;
}
eq(
  {
    ran: pushes().length > pushes483,
    words: PHOTO_UNREADABLE.test(text()),
    sent: remotePhotoIds(),
  },
  { ran: true, words: true, sent: [] },
  "48.3 a blob that cannot be read is said so, not skipped as if swept"
);

/* ---- 48.4 a remote it cannot look at, on the foreground and unattended ----
   Two boots, one per path, so a fix on one path cannot pass the other.
   Re-pointed (owner ruling 2026-10-12, default 5): the GitHub peek's
   "could not be checked" line is GitHub copy, so the user sees nothing. What
   stays is the write guard: a look that cannot read writes nothing. */
for (const [path, look] of [
  ["foreground peek", foreground],
  ["autoPush", background],
]) {
  await boot({ items: ITEMS, received: {} }, null, KEY);
  await background(); /* a healthy push first, so "never synced" is not the reason */
  await settle();
  remote.peekUnknown = "offline";
  const peeksBefore = peeks().length;
  const pushesBefore = pushes().length;
  await look();
  await sleep(60);
  remote.peekUnknown = null;
  eq(
    {
      looked: peeks().length > peeksBefore,
      wrote: pushes().length > pushesBefore,
      copy: BACKUP_UNKNOWN.test(text()),
    },
    { looked: true, wrote: false, copy: false },
    `48.4 a remote it could not look at writes nothing and shows no GitHub line (${path})`
  );
}

/* ---- 48.5 the healthy case stays quiet, so a fix that always shows fails ---- */
await boot({ items: ITEMS, received: {} }, null, KEY);
await openSync();
const pushes485a = pushes().length;
await mirrorPush();
eq(
  {
    ran: pushes().length > pushes485a,
    words: PHOTO_UNREADABLE.test(text()) || BACKUP_UNKNOWN.test(text()),
  },
  { ran: true, words: false },
  "48.5 a ledger with no photos and a readable store says nothing about photos"
);

await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]], KEY);
await openSync();
await mirrorPush();
const peeksBefore485 = peeks().length;
await foreground();
await sleep(60);
eq(
  {
    landed: remotePhotoIds(),
    looked: peeks().length > peeksBefore485,
    words: PHOTO_UNREADABLE.test(text()) || BACKUP_UNKNOWN.test(text()),
  },
  { landed: ["pho-k"], looked: true, words: false },
  "48.5 a readable store and a known remote show neither line, and the photo really went up"
);

/* the line clears once the store reads again, or it latches */
await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]], KEY);
await openSync();
const keysBefore485 = win.photos.keys;
win.photos.keys = unreadable;
try {
  await mirrorPush();
  await sleep(60);
} finally {
  win.photos.keys = keysBefore485;
}
await mirrorPush(); /* the store reads again: the next write sends the photo */
await sleep(60);
eq(
  { words: PHOTO_UNREADABLE.test(text()), landed: remotePhotoIds() },
  { words: false, landed: ["pho-k"] },
  "48.5 once the store reads again the words clear and the photo goes up"
);

/* ---- 48.6 a keyless cold start on the private ledger ----
   The 38c device opened cold: the private ledger is seeded before the mount, so
   the mount's own look is the only remote read, and it is refused. No pull runs
   here. Re-pointed (owner ruling 2026-10-12, default 5): the missing GitHub key
   and the unchecked backup are GitHub copy, so the user sees neither line. The
   look itself still runs. */
await boot({ items: ITEMS, received: {} }, null, {
  remoteAtBoot: LAPTOP_PUSHED,
  remotePrivate: true,
});
await settle();
eq(
  {
    looked: peeks().length > 0,
    noKeyLine: onLine(/tap to (set it up|add its key)/),
    unknownWords: BACKUP_UNKNOWN.test(text()),
  },
  { looked: true, noKeyLine: false, unknownWords: false },
  "48.6 a keyless cold start on the private ledger shows no GitHub line (default 5)"
);

/* ---- 48.7 an unreadable photo push, then a readable merge ----
   The manual pull that used to clear the words left the UI with Pull. The
   unattended merge below is the path that remains, so it is the one kept.
   The incoming ledger references pho-k, so the readable survey really runs. */
const photoListCalls = () => remote.calls.filter((c) => c.op === "listPhotos").length;
const brokenLine = () => onLine(/tap to (?!close)/);

/* the unattended merge: the other device is ahead, and the device is away long
   enough to be a fresh session, so autoMerge runs with alsoPush false */
await boot(withPhoto(["pho-k"]), [["pho-k", jpegOf(3)]], KEY);
await openSync();
const keysBefore487b = win.photos.keys;
win.photos.keys = unreadable;
try {
  await mirrorPush();
  await sleep(60);
} finally {
  win.photos.keys = keysBefore487b;
}
remote.sha = "sha-other"; /* the other device pushed since: peek says ahead */
const before487b = PHOTO_UNREADABLE.test(text());
const pushes487b = pushes().length;
const lists487b = photoListCalls();
await backgroundFor(5 * 60_000);
await settle();
await sleep(60);
eq(
  {
    before: before487b,
    listed: photoListCalls() > lists487b,
    applied: remote.deviceSha === remote.sha,
    pushed: pushes().length - pushes487b,
    words: PHOTO_UNREADABLE.test(text()),
    line: brokenLine(),
  },
  { before: true, listed: true, applied: true, pushed: 0, words: false, line: false },
  "48.7 a readable unattended merge clears the unreadable-photos words (autoMerge)"
);

/* ---- 48.8 one look fails, the next succeeds, inside one check ----
   A single transient {known:false} must not raise the line. The look is retried
   once before the line is raised. Both looks, the foreground check and the
   unattended autoPush, take the same path as 48.4. */
for (const [path, look] of [
  ["foreground peek", foreground],
  ["autoPush", background],
]) {
  await boot({ items: ITEMS, received: {} }, null, KEY);
  await background(); /* a healthy push first, so "never synced" is not the reason */
  await settle();
  remote.peekUnknownOnce = "offline";
  const peeksBefore = peeks().length;
  await look();
  await sleep(60);
  const consumed = remote.peekUnknownOnce === null;
  remote.peekUnknownOnce = null;
  eq(
    {
      looked: peeks().length > peeksBefore,
      consumed,
      words: BACKUP_UNKNOWN.test(text()),
    },
    { looked: true, consumed: true, words: false },
    `48.8 one transient unknown look does not raise the line (${path})`
  );
}

/* ---- 48.9 a look that stays unknown on both tries holds the write ----
   The other side of the retry. Re-pointed (owner ruling 2026-10-12, default
   5): no line is shown either way. What the case still guards is that a
   device which could not look does not write, and that a later known look
   lets the write through again. */
for (const [path, look] of [
  ["foreground peek", foreground],
  ["autoPush", background],
]) {
  await boot({ items: ITEMS, received: {} }, null, KEY);
  await background(); /* a healthy push first, so "never synced" is not the reason */
  await settle();
  remote.peekUnknown = "offline";
  const pushesBefore = pushes().length;
  await look();
  await sleep(60);
  remote.peekUnknown = null;
  const held = pushes().length === pushesBefore;
  /* the write resumes on the unattended path, the only one that writes */
  await background();
  await sleep(60);
  eq(
    { held, resumed: pushes().length > pushesBefore },
    { held: true, resumed: true },
    `48.9 a remote unknown on both tries holds the write, and a later known look resumes it (${path})`
  );
}

/* ── 49. un-checks and deletes travel between devices ─────────────────────
   The merge used to only ADD. A check-in could never be undone across two
   devices, and a discarded envelope came back. Two fixes are pinned here. A
   `receivedAt` map gives each check-in key the time of its last change, and the
   later change wins. A discarded envelope leaves a tombstone, `deletedAt`, that
   every reader skips. The pure cases import src/merge-rules.mjs directly, as in
   groups 27, 31 and 33. Cases marked "holds today" pass on the per-key max
   too. They pin what the new rule must keep. */
{
  const K = "A1|0|pLightningBolt";
  const pick = (o) => ({ received: o.received, receivedAt: o.receivedAt });
  const sorted = (o) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(o || {}).sort(([a], [b]) => (a < b ? -1 : 1))
      )
    );

  /* an un-check beats an older check, whichever side it arrives on */
  eq(
    mergeReceived({ [K]: 1 }, {}, { [K]: 100 }, { [K]: 200 }).received,
    {},
    "49.1a an un-check at 200 beats a check at 100 when the un-check arrives"
  );
  eq(
    mergeReceived({}, { [K]: 1 }, { [K]: 200 }, { [K]: 100 }).received,
    {},
    "49.1b and when the un-check is already here"
  );

  /* a newer check beats an older un-check (holds today) */
  eq(
    mergeReceived({}, { [K]: 1 }, { [K]: 100 }, { [K]: 200 }).received,
    { [K]: 1 },
    "49.2a a newer check beats an older un-check (holds today)"
  );
  eq(
    mergeReceived({ [K]: 1 }, {}, { [K]: 200 }, { [K]: 100 }).received,
    { [K]: 1 },
    "49.2b in either direction (holds today)"
  );

  /* equal times take the max count, and the shared time is kept */
  eq(
    mergeReceived({ [K]: 1 }, { [K]: 3 }, { [K]: 100 }, { [K]: 100 }).received,
    { [K]: 3 },
    "49.3a equal times take the max count (holds today)"
  );
  eq(
    mergeReceived({ [K]: 3 }, { [K]: 1 }, { [K]: 100 }, { [K]: 100 }).received,
    { [K]: 3 },
    "49.3b in either direction (holds today)"
  );
  eq(
    mergeReceived({ [K]: 3 }, { [K]: 1 }, { [K]: 100 }, { [K]: 100 }).receivedAt,
    { [K]: 100 },
    "49.3c and the shared time is kept"
  );

  /* a side with no time for the key falls back to today's per-key max */
  eq(
    mergeReceived({ [K]: 1 }, { [K]: 3 }, { [K]: 100 }).received,
    { [K]: 3 },
    "49.4a a missing time falls back to the max (holds today)"
  );
  eq(
    mergeReceived({ [K]: 3 }, { [K]: 1 }, undefined, { [K]: 100 }).received,
    { [K]: 3 },
    "49.4b in the other direction (holds today)"
  );
  eq(
    mergeReceived({ [K]: 1 }, { [K]: 3 }, { [K]: 100 }).receivedAt,
    { [K]: 100 },
    "49.4c the merged time is the one that exists"
  );
  eq(
    mergeReceived({ [K]: 1 }, { [K]: 3 }).receivedAt,
    {},
    "49.4d with no time on either side, receivedAt is an empty map"
  );

  /* symmetry holds (holds today; the new rule must keep it) */
  const CASES = [
    [{ [K]: 1 }, {}, { [K]: 100 }, { [K]: 200 }],
    [{ [K]: 1 }, { [K]: 3 }, { [K]: 100 }, { [K]: 100 }],
    [{ [K]: 3 }, { [K]: 1 }, undefined, { [K]: 100 }],
    [{ a: 2, [K]: 1 }, { a: 1 }, { a: 50, [K]: 90 }, { a: 10, [K]: 120 }],
  ];
  for (const [i, [a, b, ta, tb]] of CASES.entries()) {
    const ab = mergeReceived(a, b, ta, tb);
    const ba = mergeReceived(b, a, tb, ta);
    ok(
      sorted(ab.received) === sorted(ba.received) &&
        sorted(ab.receivedAt) === sorted(ba.receivedAt),
      `49.5.${i} the merge is symmetric (holds today)`
    );
  }

  /* idempotence: replaying a stale check does not bring the card back */
  const m49 = mergeReceived({ [K]: 1 }, {}, { [K]: 100 }, { [K]: 200 });
  eq(m49.received, {}, "49.6a the un-check holds after the merge");
  eq(
    mergeReceived(m49.received, { [K]: 1 }, m49.receivedAt, { [K]: 100 }).received,
    {},
    "49.6b and merging the stale check again does not check the card"
  );

  /* tombstones. The freshest updatedAt already wins (holds today) */
  const LIVE49 = {
    id: "e1",
    createdAt: 10,
    updatedAt: 100,
    note: "",
    entries: [{ name: "Ponder", qty: 1 }],
    photos: [],
  };
  const TOMB49 = {
    id: "e1",
    createdAt: 10,
    updatedAt: 200,
    deletedAt: 200,
    note: "",
    entries: [],
    photos: [],
  };
  const LIVE49_NEWER = { ...LIVE49, updatedAt: 300 };
  const shape = (list) =>
    list.map((e) => ({ deletedAt: e.deletedAt ?? null, entries: e.entries }));
  const TOMBED = [{ deletedAt: 200, entries: [] }];
  const LIVED = [{ deletedAt: null, entries: [{ name: "Ponder", qty: 1 }] }];
  eq(
    shape(mergeEnvelopes([LIVE49], [TOMB49]).envelopes),
    TOMBED,
    "49.7a a tombstone beats an older live envelope (holds today)"
  );
  eq(
    shape(mergeEnvelopes([TOMB49], [LIVE49]).envelopes),
    TOMBED,
    "49.7b in either direction (holds today)"
  );
  eq(
    shape(mergeEnvelopes([TOMB49], [LIVE49_NEWER]).envelopes),
    LIVED,
    "49.7c a newer live edit beats an older tombstone (holds today)"
  );
  eq(
    shape(mergeEnvelopes([LIVE49_NEWER], [TOMB49]).envelopes),
    LIVED,
    "49.7d in either direction (holds today)"
  );

  /* mergeLedger names receivedAt, so it survives the merge (saved-state-shape) */
  const L8 = { items: ITEMS, received: { [K]: 1 }, receivedAt: { [K]: 100 }, envelopes: [] };
  const I8 = { items: ITEMS, received: {}, receivedAt: { [K]: 200 }, envelopes: [] };
  eq(mergeLedger(L8, I8).merged.received, {}, "49.8a the merged ledger keeps the un-check");
  eq(
    mergeLedger(L8, I8).merged.receivedAt,
    { [K]: 200 },
    "49.8b and carries receivedAt"
  );
  eq(
    mergeLedger(
      { items: ITEMS, received: {}, envelopes: [] },
      { items: ITEMS, received: {}, envelopes: [] }
    ).merged.receivedAt,
    {},
    "49.8c a merged ledger always carries receivedAt, even when neither side had one"
  );
  eq(
    pick(mergeReceived({}, {}, {}, {})),
    { received: {}, receivedAt: {} },
    "49.8d an empty merge carries an empty receivedAt"
  );
}

/* ---- 49 through the app: a stale copy on the other device ---- */
{
  const K = ITEMS[0].key; /* Lightning Bolt, in Alpha Cards */
  /* a line row's check button. Its row holds the name, so match on it */
  const lineRow = (pkgRe, name) =>
    [...card(pkgRe).querySelectorAll('button[aria-label^="Mark as"]')].find((b) =>
      b.parentElement?.textContent.includes(name)
    );
  /* what GitHub holds: the push format, which carries mailday (parseLedger needs it) */
  const asRemote = (s) => JSON.stringify({ mailday: 1, ...s });

  /* an un-check outlives a stale copy that still has the card checked */
  await fresh();
  await click(lineRow(/Alpha Cards/, "Lightning Bolt"), "check Lightning Bolt in");
  await sleep(SAVE_WAIT);
  const checkedCopy = saved(); /* what the other device holds */
  await sleep(5); /* a later change has to read a later time */
  await click(lineRow(/Alpha Cards/, "Lightning Bolt"), "un-check Lightning Bolt");
  await sleep(SAVE_WAIT);
  ok(typeof saved().receivedAt?.[K] === "number", "49.A1 an un-check writes its time");
  remote.content = utf8ToBase64(asRemote(checkedCopy));
  remote.sha = "sha-0";
  await saveGitHubKey();
  /* Re-pointed: Push and Merge & push left the UI (owner ruling 2026-10-12).
     The stale copy is ahead, and a fresh session is what merges it. The
     mirror write after the merge is what carries the merged copy to GitHub. */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  await mirrorPush();
  eq(saved().received ?? {}, {}, "49.A2 a merge with the stale copy keeps the card un-checked");
  ok(/cards\s*0\/14/.test(text()), "49.A3 and the screen shows nothing checked");
  eq(
    JSON.parse(remoteText()).received ?? {},
    {},
    "49.A4 and the merged copy on GitHub has no check either"
  );
}

{
  /* a discarded envelope stays gone when the old copy comes back */
  const liveEnvs = (s) => (s.envelopes || []).filter((e) => !e.deletedAt);
  const asRemote = (s) => JSON.stringify({ mailday: 1, ...s });
  await fresh();
  await goTo("orphaned");
  await record(["Ponder", "Preordain"], "discard me");
  await sleep(SAVE_WAIT);
  const liveCopy = saved(); /* the other device still holds the envelope */
  await click(btn(/^Discard$/), "discard");
  await click(btn(/Tap again to discard/), "confirm discard");
  await sleep(SAVE_WAIT);
  ok(
    (saved().envelopes || []).some(
      (e) => typeof e.deletedAt === "number" && e.entries.length === 0
    ),
    "49.B1 a discard leaves a tombstone with its time"
  );
  remote.content = utf8ToBase64(asRemote(liveCopy));
  remote.sha = "sha-0";
  await saveGitHubKey();
  /* Re-pointed: Push and Merge & push left the UI (owner ruling 2026-10-12).
     A fresh session merges the stale copy in, with no tap. */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  await goTo("orphaned");
  eq(envelopeCount(), 0, "49.B2 a merge with the old copy keeps the envelope gone");
  ok(/Nothing waiting/.test(text()), "49.B3 and the pile says so");
  eq(
    btn(/^Orphaned/)?.textContent.trim(),
    "Orphaned",
    "49.B4 and the tab shows no count"
  );
  eq(liveEnvs(saved()).length, 0, "49.B5 and the saved ledger holds no live envelope");
}

{
  /* receivedAt survives a reload, reaches the pushed payload and the Backup
     file, and Reset clears it */
  const K = ITEMS[0].key;
  const lineRow = (pkgRe, name) =>
    [...card(pkgRe).querySelectorAll('button[aria-label^="Mark as"]')].find((b) =>
      b.parentElement?.textContent.includes(name)
    );
  await fresh();
  await click(lineRow(/Alpha Cards/, "Lightning Bolt"), "check Lightning Bolt in");
  await sleep(SAVE_WAIT);
  ok(typeof saved().receivedAt?.[K] === "number", "49.C1 a check-in writes its time");
  await boot(saved());

  await openSync();
  await saveGitHubKey();
  await mirrorPush();
  const pushed = pushes()[0] ? JSON.parse(pushes()[0].text) : {};
  ok(typeof pushed.receivedAt?.[K] === "number", "49.C2 the pushed payload carries it");

  let backupBlob = null;
  win.URL.createObjectURL = (b) => {
    backupBlob = b;
    return "blob:49";
  };
  await openHistory();
  await click(btn(/^Backup$/), "backup");
  const backedUp = backupBlob ? JSON.parse(await backupBlob.text()) : {};
  ok(typeof backedUp.receivedAt?.[K] === "number", "49.C3 it survives a reload into the Backup file");

  await openHistory();
  await reachFor(/^Reset$/);
  await click(btn(/^Reset$/), "reset");
  await click(btn(/Tap again to clear \d+ cards?/), "confirm reset");
  await sleep(800); /* past the debounce, when a stale value would come back */
  eq(saved().receivedAt ?? {}, {}, "49.C4 Reset clears receivedAt, and the debounce does not write it back");
}

/* ---- 50. timed absences, reported removals, and the write sites ----
   A1 and A2 are red on 69fcf67 by ruling: a timed absence beats an untimed
   count, and a merge that lowers, clears or discards is reported as a removal,
   never as "nothing new". B pins write sites that already work. Each one goes
   red under a mutant in a scratch copy, not in this tree. */
{
  const K = ITEMS[0].key; /* Lightning Bolt, in Alpha Cards */
  const REMOVED = /\bremov(ed|al)\b/i;
  const NOTHING = /had nothing new|Nothing of yours was lost/;
  const noticeNamesRemoval = () => REMOVED.test(text()) && !NOTHING.test(text());
  /* a check-in removal is copy in cards: one card, never "check-ins" */
  const uncheckedOne = () => /un-checked 1 card(?!s)/.test(text()) && !NOTHING.test(text());
  const lineRow = (pkgRe, name) =>
    [...card(pkgRe).querySelectorAll('button[aria-label^="Mark as"]')].find((b) =>
      b.parentElement?.textContent.includes(name)
    );
  const asRemote = (s) => JSON.stringify({ mailday: 1, ...s });
  const led = (received, receivedAt, envelopes) => ({
    items: ITEMS,
    received,
    receivedAt,
    envelopes,
  });
  const LIVE50 = {
    id: "e50",
    createdAt: 1,
    updatedAt: 100,
    note: "",
    entries: [{ name: "Ponder", qty: 1 }],
    photos: [],
  };
  const TOMB50 = { ...LIVE50, updatedAt: 200, deletedAt: 200, entries: [], photos: [] };

  /* A1: a timed absence beats an untimed count, in either direction */
  const a1 = mergeReceived({ [K]: 1 }, {}, {}, { [K]: 200 });
  eq(
    { count: a1.received[K] ?? null, at: a1.receivedAt[K] },
    { count: null, at: 200 },
    "50.A1a a timed un-check beats an untimed count"
  );
  const a2 = mergeReceived({}, { [K]: 1 }, { [K]: 200 }, {});
  eq(
    { count: a2.received[K] ?? null, at: a2.receivedAt[K] },
    { count: null, at: 200 },
    "50.A1b in the other direction"
  );
  eq(
    mergeReceived({ [K]: 1 }, {}, { [K]: 200 }, {}).received[K],
    1,
    "50.A1c a timed count beats an untimed absence (holds today)"
  );
  eq(
    mergeReceived({}, { [K]: 1 }, {}, { [K]: 200 }).received[K],
    1,
    "50.A1d in the other direction (holds today)"
  );

  /* A2: a removal is counted, so the notice cannot say "nothing new" */
  eq(
    mergeReceived({ [K]: 1 }, {}, { [K]: 100 }, { [K]: 200 }).removed,
    1,
    "50.A2a an un-check is reported as one removal"
  );
  eq(
    mergeReceived({ [K]: 3 }, { [K]: 1 }, { [K]: 100 }, { [K]: 200 }).removed,
    1,
    "50.A2b a count lowered by a later change is a removal"
  );
  eq(
    mergeReceived({ [K]: 1 }, { [K]: 3 }, { [K]: 100 }, { [K]: 200 }).removed,
    0,
    "50.A2c a later increase removes nothing"
  );
  eq(
    mergeLedger(led({ [K]: 1 }, { [K]: 100 }, []), led({}, { [K]: 200 }, [])).stats
      .checkInsRemoved,
    1,
    "50.A2d mergeLedger stats count the check-in removed"
  );
  eq(
    mergeLedger(led({}, {}, [LIVE50]), led({}, {}, [TOMB50])).stats.envelopesRemoved,
    1,
    "50.A2e an incoming tombstone counts as an envelope removed"
  );
  eq(
    mergeLedger(led({}, {}, [TOMB50]), led({}, {}, [{ ...LIVE50, updatedAt: 300 }])).stats
      .envelopesRemoved,
    0,
    "50.A2f a live edit that beats a tombstone removes nothing"
  );
  eq(
    mergeLedger(led({}, {}, []), led({}, {}, [TOMB50])).stats.envelopesRemoved,
    0,
    "50.A2g a tombstone for an envelope never held here removes nothing"
  );
  const quiet = { itemsAdded: 0, checkInsAdded: 0, envelopesAdded: 0, stampsAdded: 0 };
  for (const field of ["checkInsRemoved", "envelopesRemoved", "stampsRemoved"]) {
    const s = mergeSummary({ ...quiet, [field]: 1 });
    ok(
      REMOVED.test(s) && !NOTHING.test(s),
      `50.A2h a merge that only removes says so (${field})`
    );
  }

  /* A3: removed counts keys, so the copy counts cards, not units. Un-checking
     three copies of one card is one key, and the notice says one card. */
  const three = mergeLedger(led({ [K]: 3 }, { [K]: 100 }, []), led({}, { [K]: 200 }, []));
  eq(three.stats.checkInsRemoved, 1, "50.A3a un-checking 3 copies of one card counts one key");
  ok(
    mergeSummary(three.stats).includes("un-checked 1 card") &&
      !/check-in/.test(mergeSummary(three.stats)),
    "50.A3b and the notice reads 'un-checked 1 card', not check-ins"
  );
  ok(
    mergeSummary({ ...quiet, checkInsRemoved: 2 }).includes("un-checked 2 cards"),
    "50.A3c two cards read 'un-checked 2 cards'"
  );

  /* A4: a newer stamp tombstone removes a stamp, and the merge reports it */
  const STAMPED50 = { [GK_A]: S("claim", 100) };
  const STAMP_GONE50 = { [GK_A]: { kind: "", at: "", note: "", updatedAt: 200 } };
  const withStamps = (stamps) => ({ ...led({}, {}, []), stamps });
  eq(
    mergeLedger(withStamps(STAMPED50), withStamps(STAMP_GONE50)).stats.stampsRemoved,
    1,
    "50.A4a a newer stamp tombstone counts one stamp removed"
  );
  eq(
    mergeLedger(withStamps(STAMP_GONE50), withStamps(STAMPED50)).stats.stampsRemoved,
    0,
    "50.A4b an older stamp does not undo a removal, and removes nothing"
  );
  /* A5: a tombstone with no live local stamp removes nothing. A mutant that
     counts every winning tombstone reports a removal here, and the notice lies. */
  const TOMB_ALONE = { a: { kind: "", at: "", note: "", updatedAt: 200 } };
  eq(
    mergeStamps({}, TOMB_ALONE).removed,
    0,
    "50.A5a a tombstone with no local stamp removes nothing"
  );
  eq(
    mergeStamps(undefined, TOMB_ALONE).removed,
    0,
    "50.A5b and the same with no local stamps at all"
  );

  /* A2 through the app: the other device un-checked later, and this device
     still holds the check. The manual merge applies the removal. */
  await fresh();
  await click(lineRow(/Alpha Cards/, "Lightning Bolt"), "check Lightning Bolt in");
  await sleep(SAVE_WAIT);
  const checkedAt = saved().receivedAt[K];
  remote.content = utf8ToBase64(
    asRemote({ ...saved(), received: {}, receivedAt: { [K]: checkedAt + 1000 } })
  );
  remote.sha = "sha-0";
  await saveGitHubKey();
  /* Re-pointed: Push and Merge & push left the UI (owner ruling 2026-10-12). A
     fresh session merges the stale copy in, with no tap. */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  eq(saved().received[K], undefined, "50.A2i the merge applies the other device's un-check");
  ok(uncheckedOne(), "50.A2j and the notice says un-checked 1 card, not 'nothing new'");

  /* the other device discarded an envelope this device still holds live */
  await fresh();
  await goTo("orphaned");
  await record(["Ponder", "Preordain"], "kept");
  await sleep(SAVE_WAIT);
  const live = saved().envelopes.find((e) => !e.deletedAt);
  const discardedAt = (live.updatedAt || 0) + 1000;
  remote.content = utf8ToBase64(
    asRemote({
      ...saved(),
      envelopes: [
        { ...live, entries: [], photos: [], deletedAt: discardedAt, updatedAt: discardedAt },
      ],
    })
  );
  remote.sha = "sha-0";
  await saveGitHubKey();
  /* Re-pointed: Push and Merge & push left the UI (owner ruling 2026-10-12). A
     fresh session merges the stale copy in, with no tap. */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  eq(
    saved().envelopes.filter((e) => !e.deletedAt).length,
    0,
    "50.A2k the merge applies the other device's discard"
  );
  ok(noticeNamesRemoval(), "50.A2l and the notice names the removal");

  /* the quiet unattended merge: a removal alone must still leave a notice */
  /* seeded checked, not checked in here: a check-in leaves an Undo notice, and
     autoMerge stands down while one is open */
  await boot({ items: ITEMS, received: { [K]: 1 }, receivedAt: { [K]: 100 } }, null, KEY);
  await openSync();
  await mirrorPush();
  await sleep(60);
  const local = saved();
  remote.content = utf8ToBase64(
    asRemote({ ...local, received: {}, receivedAt: { [K]: 1100 } })
  );
  remote.sha = "sha-other"; /* the other device pushed since: peek says ahead */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT); /* the merged state is saved on a debounce */
  eq(saved().received[K], undefined, "50.A2m a quiet merge applies the un-check");
  ok(uncheckedOne(), "50.A2n and the quiet merge still leaves a notice saying un-checked 1 card");

  /* A4 through the app: the other device removed a stamp this device still holds */
  await boot({ items: ITEMS, received: {}, stamps: STAMPED50 });
  remote.content = utf8ToBase64(
    asRemote({ items: ITEMS, received: {}, receivedAt: {}, envelopes: [], stamps: STAMP_GONE50 })
  );
  remote.sha = "sha-0";
  await saveGitHubKey();
  /* Re-pointed: Push and Merge & push left the UI (owner ruling 2026-10-12). A
     fresh session merges the stale copy in, with no tap. */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  eq(saved().stamps?.[GK_A]?.kind ?? "", "", "50.A4c the merge applies the other device's stamp removal");
  ok(noticeNamesRemoval(), "50.A4d and the notice names the removal");

  /* the quiet unattended merge, whose only change is that stamp removal */
  await boot({ items: ITEMS, received: {}, stamps: STAMPED50 }, null, KEY);
  await openSync();
  await mirrorPush();
  await sleep(60);
  remote.content = utf8ToBase64(
    asRemote({ items: ITEMS, received: {}, receivedAt: {}, envelopes: [], stamps: STAMP_GONE50 })
  );
  remote.sha = "sha-other"; /* the other device pushed since: peek says ahead */
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  eq(saved().stamps?.[GK_A]?.kind ?? "", "", "50.A4e a quiet merge applies the stamp removal");
  ok(noticeNamesRemoval(), "50.A4f and the quiet merge still leaves a notice naming it");

  /* A5 through the app: an incoming tombstone for a stamp this device never
     had. The quiet merge takes it, and leaves no notice. */
  await boot({ items: ITEMS, received: {} }, null, KEY);
  await openSync();
  await mirrorPush();
  await sleep(60);
  remote.content = utf8ToBase64(
    asRemote({ items: ITEMS, received: {}, receivedAt: {}, envelopes: [], stamps: STAMP_GONE50 })
  );
  remote.sha = "sha-other";
  await backgroundFor(5 * 60_000);
  await settle();
  await sleep(SAVE_WAIT);
  ok(typeof saved().stamps?.[GK_A] === "object", "50.A5c the quiet merge takes the tombstone");
  ok(!REMOVED.test(text()) && !/Merged/.test(text()), "50.A5d and leaves no notice");

  /* B: write sites that already stamp receivedAt */
  await fresh();
  await goTo("packages");
  await click(allBtns(/^Mark all received$/)[0], "mark a package all received");
  await sleep(SAVE_WAIT);
  const bulkKeys = Object.keys(saved().received);
  ok(
    bulkKeys.length > 0 && bulkKeys.every((k) => typeof saved().receivedAt?.[k] === "number"),
    "50.B1 a bulk check-in writes a time for each key it sets"
  );

  await fresh();
  await goTo("orphaned");
  await record(["Brainstorm"]);
  await assign(0);
  await sleep(SAVE_WAIT);
  const key = Object.keys(saved().received)[0];
  ok(
    typeof key === "string" && typeof saved().receivedAt?.[key] === "number",
    "50.B2 an assign writes a time for each key it sets"
  );
  const tAssign = saved().receivedAt?.[key];
  await click(btn(/^Undo$/), "undo the assign");
  await sleep(SAVE_WAIT);
  eq(saved().received[key], undefined, "50.B3a undo deletes the key");
  ok(saved().receivedAt?.[key] > tAssign, "50.B3b and undo writes a later time, so the un-check travels");

  await fresh();
  await reachFor(/Re-import CSV/);
  await click(btn(/Re-import CSV/), "show upload zone");
  await dropFile(
    "mailday-backup.json",
    JSON.stringify({
      mailday: 1,
      items: ITEMS,
      received: { [K]: 1 },
      receivedAt: { [K]: 1234567 },
      envelopes: [],
      stamps: {},
    })
  );
  await sleep(SAVE_WAIT);
  eq(saved().receivedAt?.[K], 1234567, "50.B4 a restore brings each key's time back");

  await fresh();
  await goTo("orphaned");
  await record(["Path to Exile", "Swords to Plowshares", "Ponder", "Lightning Bolt"]);
  await assign(0);
  await sleep(SAVE_WAIT);
  const tombs = (saved().envelopes || []).filter((e) => typeof e.deletedAt === "number");
  eq(
    { n: tombs.length, entries: tombs[0]?.entries.length },
    { n: 1, entries: 0 },
    "50.B5 a full assign saves a tombstone with its time, not a removed envelope"
  );
}

/* ── 51. the Stage 4b rules, as pure functions ─────────────────────────────
   src/sync-rules.mjs is written in stage 4b (L2). It is loaded with a dynamic
   import, not a static one, so a missing module fails these cases one by one
   instead of stopping the whole file. Every case compares with eq(), and a
   missing export returns the sentinel "MISSING", which equals no expected value.
   A thrown error comes back as {threw}, for the same reason. */

const SR = await import("../src/sync-rules.mjs").catch(() => null);
const sr = (name, ...args) => {
  if (!SR || typeof SR[name] !== "function") return "MISSING";
  try {
    return SR[name](...args);
  } catch (e) {
    return { threw: String(e?.message || e) };
  }
};

/* the device key rides in the fragment: #k=<key> */
eq(sr("keyFromHash", "#k=abc123"), "abc123", "51.1 the key is read from #k=");
eq(
  sr("keyFromHash", "#k=abc_DEF-09"),
  "abc_DEF-09",
  "51.2 letters, digits, underscore and hyphen are all valid"
);
eq(sr("keyFromHash", ""), null, "51.3 no fragment means no key");
eq(sr("keyFromHash", "#x=abc123"), null, "51.4 a fragment without k means no key");
eq(sr("keyFromHash", "#k="), null, "51.5 an empty k means no key");
eq(sr("keyFromHash", "#mk=abc123"), null, "51.6 a parameter that ends in k is not k");
for (const [hash, why] of [
  ["#k=ab+cd", "a plus sign"],
  ["#k=ab/cd", "a slash"],
  ["#k=ab=cd", "an equals sign"],
  ["#k=ab%20cd", "a percent-encoded space"],
  ["#k=ab.cd", "a dot"],
]) {
  eq(sr("keyFromHash", hash), null, `51.7 a key with ${why} is refused`);
}

/* the Worker's answer, reduced to what the app shows */
eq(sr("syncStatus", 200), "ok", "51.8 200 is ok");
eq(sr("syncStatus", 401), "no-access", "51.9 401 is no-access");
eq(sr("syncStatus", 413), "too-big", "51.10 413 is too-big");
eq(sr("syncStatus", 500), "unknown", "51.11 a 5xx is unknown, not ok");
eq(sr("syncStatus", null), "unknown", "51.12 a network failure (null) is unknown");
eq(sr("syncStatus", 0), "unknown", "51.13 a status of 0 is unknown");
/* worker/core.mjs answers GET with 404 {error:"empty"} while the store is
   empty. The first upload seeds it, so this is not an error. */
eq(sr("syncStatus", 404), "empty", "51.13a 404 is empty, the store has not been seeded yet");

/* a revision is new only when it is ahead of the one this device saw */
eq(sr("isNewRev", 3, 4), true, "51.14 a later revision is new");
eq(sr("isNewRev", 4, 4), false, "51.15 the same revision is not new");
eq(sr("isNewRev", 5, 4), false, "51.16 an older revision is not new");

/* the apply waits for ten seconds without input */
eq(sr("idleReady", 1000, 10999), false, "51.17 9,999 ms idle is not ready");
eq(sr("idleReady", 1000, 11000), true, "51.18 10,000 ms idle is ready");
eq(SR?.IDLE_APPLY_MS ?? "MISSING", 10000, "51.19 IDLE_APPLY_MS is 10000");

/* backoff: the first wait is 1,000 ms (attempt 0), it doubles, and it caps at
   60,000 ms. Attempt 0 is a choice, not a fact in the code yet. See Input Needed. */
eq(sr("backoffMs", 0), 1000, "51.20 the first attempt waits 1,000 ms");
eq(sr("backoffMs", 1), 2000, "51.21 the wait doubles");
eq(sr("backoffMs", 2), 4000, "51.22 and doubles again");
eq(sr("backoffMs", 5), 32000, "51.23 attempt 5 waits 32,000 ms");
eq(sr("backoffMs", 6), 60000, "51.24 attempt 6 would be 64,000 and caps at 60,000");
eq(sr("backoffMs", 30), 60000, "51.25 a long retry stays at the cap");

/* one home for the device-key name. entry.jsx must import it from here, so the
   key stays outside the mailday: namespace by a single constant. */
eq(SR?.SYNC_KEY_STORAGE ?? "MISSING", "mailday-sync:v1", "51.26 the device key is stored at mailday-sync:v1");
eq(
  typeof SR?.SYNC_KEY_STORAGE === "string" && !SR.SYNC_KEY_STORAGE.startsWith("mailday:"),
  true,
  "51.27 and that key sits outside the mailday: namespace"
);

/* ── 52. the device key stays out of the ledger (harness contract only) ──
   The mock win.sync holds the key outside the mock store, the way the real
   adapter holds it outside the mailday: namespace. These cases prove the mock
   and the isolation claim that the app sees. They cannot reach entry.jsx. */

const SYNC_KEY = "sync_SECRETVALUE-42";
const SYNC_LEAK = /sync_SECRET/;
/* this group tests the adapter itself, so it boots with the adapter installed */
const freshSync = () => boot({ items: ITEMS, received: {} }, null, { syncAdapter: true });

await freshSync();
eq(await win.sync.hasKey(), false, "52.1 a fresh device has no sync key");
await win.sync.setKey(SYNC_KEY);
eq(await win.sync.hasKey(), true, "52.2 setKey makes hasKey true");
let badCode = null;
try {
  await win.sync.setKey("bad key.value");
} catch (e) {
  badCode = e.code;
}
eq(badCode, "bad-key", "52.3 a key outside the Worker's alphabet is refused");

/* the same three-place check as 25.24 to 25.27, for the sync key */
await freshSync();
await win.sync.setKey(SYNC_KEY);
await openSync();
await saveGitHubKey("github_pat_SECRETVALUE");
/* with a Worker key GitHub is a mirror that writes only what changed, so one
   check-in gives the mirror something to write */
await goTo("packages");
await click(btn(/Mark all received/), "check in a card for the mirror to write");
await mirrorPush();
await openHistory();
await click(btn(/^Backup$/), "backup with a sync key set");
await sleep(SAVE_WAIT);
ok(pushes().length > 0, "52.4a the push happened, so the next check means something");
ok(!!captured, "52.4b the backup happened, so the next check means something");
ok(!SYNC_LEAK.test(JSON.stringify(saved())), "52.4 the sync key is not in the saved ledger");
ok(!SYNC_LEAK.test(pushes()[0]?.text ?? ""), "52.5 nor in the pushed payload");
ok(!SYNC_LEAK.test(await captured.text()), "52.6 nor in a backup file");
eq(
  (await win.storage.list()).keys,
  ["mailday:v1"],
  "52.7 and the ledger namespace still holds only the ledger"
);

/* the mock's own contract, as route() in worker/core.mjs states it */
await freshSync();
const unkeyed = await win.sync.post({ mailday: 1, items: [] });
eq(unkeyed.status, 401, "52.8 a post with no key is refused");
await win.sync.setKey(SYNC_KEY);
const first = await win.sync.post({ mailday: 1, items: [] });
const second = await win.sync.post({ mailday: 1, items: [] });
eq([first.status, second.status, second.body?.rev], [200, 200, 2], "52.9 each keyed post merges and advances rev");
ok(
  syncCalls().every((c) => !SYNC_LEAK.test(c.body ?? "")),
  "52.10 the mock's own post record never carries the key"
);

/* The virtual clock covers groups 53 to 61, then 67 to 69 (see harness.mjs).
   Installed here, removed after group 61, and installed again before group 67.
   Groups 1 to 52 and 62 to 66 keep real timers. */
installClock();

/* ── 53. the Stage 4b sync path, through the app (harness contract only) ──
   Stage 4b moves sync from the GitHub adapter to window.sync. These cases pin
   what the app does with that adapter, through the harness mock. The mock is
   the contract, not entry.jsx, which is not bundled here.

   There are no fake timers. Only case 1 waits for the POST deadline. The other
   cases fire pageshow, then wait out the idle apply gate (IDLE_APPLY_MS, group
   51.19) where a live apply is claimed. */

const KEY53 = "device-53-key";
const K0 = ITEMS[0].key;
const POST_MS = SR?.SYNC_POST_MS ?? 3000;
const IDLE_MS = SR?.IDLE_APPLY_MS ?? 10000;
const POST_TOL = POST_MS + 1000;
const POST_WAIT = POST_MS + 300;
const APPLY_WAIT = IDLE_MS + 500;

/* 53.0 the deadline is one exported constant, read through the same dynamic
   import as group 51 */
eq(SR?.SYNC_POST_MS ?? "MISSING", 3000, "53.0 SYNC_POST_MS is 3000, exported from sync-rules");

const postCount = () => syncCalls().filter((c) => c.op === "post").length;
const milestoneCount = () => versionMetas().filter((m) => m.kind === "milestone").length;
const newestMilestone = () => versionMetas().find((m) => m.kind === "milestone") ?? null;
/* the advisory line is whichever button carries a sync sentence */
const ADVISORY_RE =
  /tap to|^Backed up|^Not backed up|^Nothing has been backed up|newer lines|can’t see|could not be checked|needs attention|snapshot of someone|refused this ledger/i;
const advisory = () => buttons().map((b) => b.textContent).find((t) => ADVISORY_RE.test(t)) ?? "";
const ERROR_COPY_RE = /server|could not|needs attention/i;
const pageshow = () =>
  act(async () => {
    win.dispatchEvent(new win.Event("pageshow"));
    await sleep(0);
  });

/* 1. a check-in POSTs the snapshot within SYNC_POST_MS. The only case that waits
   for the deadline itself. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY53 });
await settle();
{
  const real = win.sync.post;
  const stamps = [];
  win.sync.post = async (ledger) => {
    stamps.push(Date.now());
    return real(ledger);
  };
  try {
    await click(btn(/Mark all received/), "check in with a sync key");
    /* the clock starts just after the click, so the debounce is timed from the
       moment the user's tap has landed. The tolerance is one second over the
       deadline, and the wait covers the whole tolerance so a POST inside it is
       seen. A POST that never comes, or lands after 2 x SYNC_POST_MS, fails. */
    const t1 = Date.now();
    await sleep(POST_TOL + 300);
    ok(stamps.length >= 1, "53.1a a check-in POSTs to window.sync");
    ok(
      stamps.length >= 1 && stamps[0] - t1 <= POST_TOL,
      "53.1b and the POST starts within SYNC_POST_MS + 1000 ms of the check-in"
    );
    const posted = syncCalls().find((c) => c.op === "post");
    const body = posted?.body ? JSON.parse(posted.body) : null;
    eq(
      [body?.mailday, body?.items?.length, Object.keys(body?.received ?? {}).length],
      [1, 3, 3],
      "53.1c the body is the snapshot: the ledger, with all three check-ins"
    );
  } finally {
    win.sync.post = real;
  }
}

/* 2. the POST also fires on a foreground, on pageshow and on online */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY53 });
await settle();
const triggers = [
  ["53.2a a foreground (visibilitychange to visible)", () => foreground()],
  ["53.2b pageshow", () => pageshow()],
  [
    "53.2c online",
    () =>
      act(async () => {
        win.dispatchEvent(new win.Event("online"));
        await sleep(0);
      }),
  ],
];
for (const [label, fire] of triggers) {
  const before = postCount();
  await fire();
  await sleep(POST_WAIT);
  ok(postCount() > before, `${label} POSTs the snapshot`);
}

/* 3. the reply is applied as mergeLedger(snapshot(), reply). The other device's
   fourth line arrives, and the local view preferences do not change. The guard
   is the arrival: without it, the preference check could pass on an unapplied
   reply. */
const LOCAL_PREFS = {
  sortBy: "oldest",
  itemSort: "basis",
  dateFilter: { preset: "all", from: "", to: "" },
};
await boot({ items: ITEMS.slice(0, 3), received: {}, ...LOCAL_PREFS }, null, {
  noRemote: true,
  syncKey: KEY53,
  syncLedger: {
    mailday: 1,
    items: ITEMS.slice(0, 4),
    received: {},
    envelopes: [],
    sortBy: "seller",
    itemSort: "value",
    dateFilter: { preset: "all", from: "2026-01-01", to: "" },
  },
});
await settle();
await pageshow();
await sleep(APPLY_WAIT);
eq(saved().items?.length ?? 0, 4, "53.3a the server's fourth line arrived, so the reply was applied");
eq(
  [saved().sortBy, saved().itemSort, saved().dateFilter],
  [LOCAL_PREFS.sortBy, LOCAL_PREFS.itemSort, LOCAL_PREFS.dateFilter],
  "53.3b and the local view preferences held, not the server's"
);

/* 4. a reply that changes nothing takes no milestone and calls no apply. The
   guard is that a POST happened. Without it, "no milestone" passes on code that
   never POSTs at all. */
await boot({ items: ITEMS.slice(0, 3), received: { [K0]: 1 } }, null, {
  noRemote: true,
  syncKey: KEY53,
  syncLedger: { mailday: 1, items: ITEMS.slice(0, 3), received: { [K0]: 1 }, envelopes: [] },
});
await settle();
const msBefore = milestoneCount();
const postsBefore = postCount();
await pageshow();
await sleep(APPLY_WAIT);
ok(postCount() > postsBefore, "53.4a the POST happened, so the milestone check means something");
eq(milestoneCount(), msBefore, "53.4 a reply that changes nothing takes no milestone");

/* 5. a reply that removes something (an un-check from the other device) takes a
   milestone first, and that milestone holds the check-in as it stood before the
   apply. The server's later timestamp on K0 wins the merge. */
await boot(
  { items: ITEMS.slice(0, 3), received: { [K0]: 1 }, receivedAt: { [K0]: 1000 } },
  null,
  {
    noRemote: true,
    syncKey: KEY53,
    syncLedger: {
      mailday: 1,
      items: ITEMS.slice(0, 3),
      received: {},
      receivedAt: { [K0]: 2000 },
      envelopes: [],
    },
  }
);
await settle();
await pageshow();
await sleep(APPLY_WAIT);
const ms = newestMilestone();
ok(!!ms, "53.5a the removal took a milestone in front of the apply");
const held = ms ? versionText(ms.label) : null;
const heldRec = held ? JSON.parse(held).received : null;
eq(heldRec?.[K0] ?? null, 1, "53.5b holding the check-in the other device removed, as it stood before");
eq(saved().received?.[K0] ?? null, null, "53.5c and the apply took that check-in away");

/* 6. a 404 from an empty store is not an error. The first POST seeds the store.
   No window.remote here: syncBroken is null without it, so the no-error check
   would pass as decoration. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { syncKey: KEY53 });
await settle();
eq((await win.sync.get()).code, "empty", "53.6a the store is empty before the first POST");
ok(!ERROR_COPY_RE.test(advisory()), "53.6b and the advisory line shows no sync error on an empty store");
await click(btn(/Mark all received/), "the first check-in seeds the store");
await sleep(POST_WAIT);
eq((await win.sync.get()).code, "ok", "53.6c the first POST seeds the store");
ok(!ERROR_COPY_RE.test(advisory()), "53.6d and the advisory line still shows no sync error");

/* 7. with no sync key, nothing calls sync.post, and today's GitHub push runs
   unchanged. Green on today's code by design: this is a guard, not a red case. */
await boot({ items: ITEMS.slice(0, 3), received: {} });
await settle();
await click(btn(/Mark all received/), "check in with no sync key");
await sleep(POST_WAIT);
ok(Object.keys(saved().received ?? {}).length === 3, "53.7a0 the check-in happened, so the next check means something");
eq(postCount(), 0, "53.7a with no sync key, a check-in makes no POST");
await saveGitHubKey();
await mirrorPush();
await sleep(SAVE_WAIT);
ok(pushes().length > 0, "53.7b the GitHub push still runs with no sync key");

/* 8. a POST that fails as unknown (the network) falls back to today's GitHub
   merge for that cycle, and the advisory line says the server failed. The
   fallback is decided on code === "unknown". Green on today's code for the pull
   alone, since a fresh foreground already merges over GitHub: 53.8b is the red
   claim. */
await boot(PHONE_STATE, null, { remote: LAPTOP_PUSHED, syncKey: KEY53 });
await settle();
setSyncNetFail(true);
const remoteBefore = remote.calls.length;
try {
  await backgroundFor(5 * 60_000);
  await sleep(POST_WAIT);
  ok(postCount() > 0, "53.8a0 a POST was attempted, so the fallback check means something");
  eq((await win.sync.get()).code, "unknown", "53.8a1 a network failure answers code unknown");
} finally {
  setSyncNetFail(false);
}
await settle();
ok(remote.calls.slice(remoteBefore).some((c) => c.op === "pull"), "53.8a the failed cycle falls back to the GitHub merge");
ok(/server/i.test(advisory()), "53.8b and the advisory line says the server failed");

/* ── 54. with a Worker key, GitHub is a mirror (harness contract only) ──
   Stage 4b, decision sync-revamp-cloudflare: the Worker holds the truth, and
   GitHub gets the merged snapshot on the mirror timer. With a key, GitHub
   decides nothing. No peek, no auto-merge, no "behind" line, and a stale sha
   is a merged write, never a two-tap.

   The mirror timer is AUTO_PUSH_MS (90s) in src/app.jsx. This suite has no
   fake timers, so only a delay of exactly 90000 is caught here, and the test
   fires it on demand. sleep() and the save debounce pass through untouched.

   Case 54.4 (no key) needs no case of its own. Today's behaviour is pinned by
   groups 34 (34.11 to 34.23: the behind line, the peek, the conflict merge),
   38b.2 (the behind line), and 40.4 (a fresh absence merges without a tap).

   Case 54.5 is a suspected bug, not a ruling: the autoPush effect's deps
   (src/app.jsx, near line 4729) are [items, received, envelopes, loaded], and
   they omit stamps. */
const KEY54 = "device-54-key";
const GH54 = "github_pat_testtoken";
const AUTO_MS = 90000; // AUTO_PUSH_MS in src/app.jsx
let autoLive54 = null; // null = not catching; else the armed timers not yet run or cleared
let autoArmed54 = 0; // every AUTO_PUSH_MS timer armed while catching
const realSetTimeout54 = globalThis.setTimeout;
const realClearTimeout54 = globalThis.clearTimeout;
const catchAutoTimers = () => {
  autoLive54 = [];
  autoArmed54 = 0;
  globalThis.setTimeout = (fn, ms, ...rest) => {
    if (ms !== AUTO_MS) return realSetTimeout54(fn, ms, ...rest);
    const h = { fn };
    autoLive54.push(h);
    autoArmed54 += 1;
    return h;
  };
  globalThis.clearTimeout = (h) => {
    if (autoLive54) autoLive54 = autoLive54.filter((x) => x !== h);
    return realClearTimeout54(h);
  };
};
const releaseAutoTimers = () => {
  autoLive54 = null;
  globalThis.setTimeout = realSetTimeout54;
  globalThis.clearTimeout = realClearTimeout54;
};
/* runs the newest live mirror timer, as the 90s wait would. false if none */
const fireAutoTimer = async () => {
  const h = autoLive54?.pop();
  if (!h) return false;
  await act(async () => {
    await h.fn();
    await sleep(0);
  });
  return true;
};

/* 54.1 with a key, GitHub is not read at all. A remote that holds a sha this
   device never saw is ahead, and with a key it raises no "behind" line. Red
   today: the foreground peek reads it as ahead, and the resume merges it. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  remote: LAPTOP_PUSHED,
  remoteKey: GH54,
  syncKey: KEY54,
});
await settle();
/* read before the resume, which would merge the remote away and make the
   line's absence mean nothing */
ok(!btn(/newer lines/), "54.1c a remote that is ahead raises no behind line");
await backgroundFor(5 * 60_000);
await settle();
eq(peeks().length, 0, "54.1a with a key, nothing peeks at GitHub");
eq(
  remote.calls.filter((c) => c.op === "pull").length,
  0,
  "54.1b and a resume after an absence merges nothing from GitHub"
);

/* 54.2 with a key, the mirror push runs on AUTO_PUSH_MS, and what it pushes is
   the merged snapshot: the four lines the Worker reply carried, not the three
   this device held. Red today: no reply is applied, so the mirror holds three,
   and nothing arms the timer. */
catchAutoTimers();
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    remoteKey: GH54,
    syncKey: KEY54,
    syncLedger: { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] },
  });
  await settle();
  await pageshow();
  await sleep(APPLY_WAIT);
  ok(autoArmed54 > 0, "54.2a the merged lines arm the mirror timer, which is AUTO_PUSH_MS");
  ok(await fireAutoTimer(), "54.2b and the timer is live, so the mirror push can run");
  await settle();
  const sent = pushes();
  const last = sent[sent.length - 1];
  eq(
    last ? JSON.parse(last.text).items.length : 0,
    4,
    "54.2c the mirror pushes the merged snapshot, four lines"
  );
} finally {
  releaseAutoTimers();
}

/* 54.3 with a key, a mirror push that meets a stale sha re-reads the sha, merges
   GitHub's ledger in, and writes the merge under the fresh sha. It arms no two-tap and shows no conflict
   line. Red today: autoPush peeks first, reads the remote as ahead, and never
   pushes at all. */
catchAutoTimers();
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    remote: LAPTOP_PUSHED,
    remoteKey: GH54,
    syncKey: KEY54,
  });
  await settle();
  await click(btn(/Mark all received/), "check in with a key");
  await fireAutoTimer();
  await settle();
  eq(
    pushes().map((p) => p.sha),
    [null, "sha-0"],
    "54.3a the stale write goes first, then one merged write under the sha the remote holds"
  );
  eq(
    remote.history.map((h) => JSON.parse(h.text).items.length),
    [ITEMS.length],
    "54.3b the merged write carries this device and GitHub, not this device's copy alone"
  );
  /* Re-pointed (owner ruling 2026-10-12): "Push anyway" left the UI, so it could
     never fail. A two-tap copy on screen is the live way to arm a stale sha. */
  ok(!btn(/^Tap again to/), "54.3c a stale sha arms no two-tap");
  ok(
    !buttons().some((b) => /needs attention/.test(b.textContent)) &&
      !/remote copy changed/.test(text()),
    "54.3d and no conflict line shows"
  );
} finally {
  releaseAutoTimers();
}

/* 54.5 (suspected bug, no sync key on this device) a stamp alone arms the
   mirror push. The autoPush effect omits stamps from its deps, so a stamp-only
   change arms no timer and no push follows. Red on today's code if the omission
   is real. */
catchAutoTimers();
try {
  await boot({ items: ITEMS, received: {} }, null, { remoteKey: GH54 });
  await settle();
  const armedBefore = autoArmed54;
  await stampPkg(/Alpha Cards/, "Other", "package split");
  await sleep(SAVE_WAIT);
  eq(
    Object.keys(saved().stamps ?? {}).length,
    1,
    "54.5a the stamp is saved, so the next check means something"
  );
  ok(autoArmed54 > armedBefore, "54.5b a stamp alone arms the mirror timer");
  ok(await fireAutoTimer(), "54.5c and the timer is live, so a push can follow");
  await settle();
  ok(pushes().length > 0, "54.5d and the timer pushes the stamped ledger to GitHub");
} finally {
  releaseAutoTimers();
}

/* ── 55. live updates: connect, a rev-gated GET, a held apply (harness contract only) ──
   Stage 4b lane L5, decision sync-revamp-cloudflare (Stage 4b rulings). The
   Worker's rev channel reports that another device moved the server. A rev
   above the last one seen triggers one GET. The GET reply is held, and applied
   only after IDLE_APPLY_MS with no input and no armed guard. While a reply is
   held, nothing on screen says so: no advisory line, no reserved slot. The
   orchestrator dropped the "updates waiting" line (it cost 40px at rest).

   There are no fake timers. The timed cases wait real time, as group 53 does.
   The rev channel is fired by fireSyncRev(), which the mock keeps alongside
   connect(). */

const KEY55 = "device-55-key";
const LEDGER55 = { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] };
const getCount = () => syncCalls().filter((c) => c.op === "get").length;
const connectCount = () => syncCalls().filter((c) => c.op === "connect").length;
const input55 = () => win.dispatchEvent(new win.Event("pointerdown"));
const slot55 = () => document.querySelector("[data-advisory-slot]");
const dismiss55 = () => [...document.querySelectorAll('button[aria-label="Dismiss"]')][0] ?? null;

/* 55.1 with a key, the app connects once on mount, and the close function
   runs on unmount. boot() unmounts the previous root before it resets the mock,
   so the second boot is the unmount. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY55 });
await settle();
eq(connectCount(), 1, "55.1a with a key, the app calls sync.connect once on mount");
const closesBefore55 = syncCloseCount();
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true });
eq(syncCloseCount() - closesBefore55, 1, "55.1b and the close function runs on unmount");

/* 55.2 a rev above the last one seen triggers one GET. The echo of the device's
   own POST, at or below the last rev seen, triggers none. The last rev seen
   comes from the POST reply, so the device POSTs first. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY55 });
await settle();
const posts55 = postCount();
await pageshow();
await sleep(300);
ok(postCount() > posts55, "55.2a0 the POST happened, so the last rev seen is known");
const seen55 = syncRev();
const get55a = getCount();
await fireSyncRev(seen55);
await sleep(600);
eq(getCount() - get55a, 0, "55.2a the echo of the device's own POST triggers no GET");
const get55b = getCount();
await fireSyncRev(seen55 - 1);
await sleep(600);
eq(getCount() - get55b, 0, "55.2b a rev below the last one seen triggers no GET");
const get55c = getCount();
await fireSyncRev(seen55 + 1, LEDGER55);
await sleep(600);
eq(getCount() - get55c, 1, "55.2c a rev above the last one seen triggers one GET");
const get55d = getCount();
await fireSyncRev(seen55 + 1);
await sleep(600);
eq(getCount() - get55d, 0, "55.2d the echo of that GET's rev triggers no GET");

/* 55.3 a GET reply is held, and applied only after IDLE_APPLY_MS with no input.
   Input at 9 s restarts the wait, so nothing applies at 10 s, and the reply is
   applied by 20.5 s: the 10 s gate after the input at 9 s, plus the 500 ms
   debounced save. While it is held, no advisory line shows and no
   data-advisory-slot element exists (55.5). The device POSTs once to seed the
   empty store, then waits out the idle gate, so the seed reply is applied
   before the timing starts. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY55 });
await settle();
await pageshow();
await sleep(APPLY_WAIT);
input55();
const t055 = Date.now();
const until55 = (ms) => sleep(Math.max(0, t055 + ms - Date.now()));
await fireSyncRev(2, LEDGER55);
await until55(1000);
eq(saved().items?.length ?? 0, 3, "55.3a a GET reply is held, not applied");
eq([advisory(), !!slot55()], ["", false], "55.5 while the reply is held, no advisory line shows and no data-advisory-slot element exists");
await until55(9000);
input55();
await until55(10000);
eq(saved().items?.length ?? 0, 3, "55.3b no apply at 10 s, because input at 9 s restarted the wait");
await until55(20500);
eq(saved().items?.length ?? 0, 4, "55.3c the held reply is applied by 20.5 s");

/* 55.4 an armed Reset holds the apply. The apply runs once the hold clears, and
   the idle wait has already passed. The wait is past before the arm, so only
   the armed Reset can hold the apply. Reset disarms itself after 4 s. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY55 });
await settle();
await pageshow();
await sleep(APPLY_WAIT);
await reachFor(/^Reset$/);
await click(btn(/^Reset$/), "arm reset while the wait is past");
ok(/Tap again to clear \d+ cards?/.test(text()), "55.4 0 Reset is armed, so the hold means something");
await fireSyncRev(2, LEDGER55);
await sleep(1000);
eq(saved().items?.length ?? 0, 3, "55.4a an armed Reset holds the apply");
await sleep(5000);
ok(!/Tap again to clear \d+ cards?/.test(text()), "55.4b Reset has disarmed itself");
eq(saved().items?.length ?? 0, 4, "55.4c and the apply runs once the hold clears");

/* 55.4d an open notice holds the apply, as an armed Reset does. The notice is a
   backup import with the same lines, so it changes nothing else. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true, syncKey: KEY55 });
await settle();
await pageshow();
await sleep(APPLY_WAIT);
await reachFor(/Re-import CSV/);
await click(btn(/Re-import CSV/), "show upload zone for the notice");
await dropFile(
  "mailday-backup.json",
  JSON.stringify({ mailday: 1, items: ITEMS.slice(0, 3), received: {}, envelopes: [] })
);
ok(!!dismiss55(), "55.4d0 an import notice is open, so the hold means something");
await fireSyncRev(2, LEDGER55);
await sleep(1000);
eq(saved().items?.length ?? 0, 3, "55.4d an open notice holds the apply");
await click(dismiss55(), "dismiss the notice");
await sleep(1500);
eq(saved().items?.length ?? 0, 4, "55.4e and the apply runs once the notice is dismissed");

/* 55.8 a POST the server refuses as too big (413) must not go quiet. As unknown
   does, that cycle falls back to the GitHub merge, and the advisory line names
   the size problem. Pattern from 53.8. */
const bigLine55 = () => buttons().map((b) => b.textContent).find((t) => /too big/i.test(t)) ?? "";
await boot(PHONE_STATE, null, { remote: LAPTOP_PUSHED, syncKey: KEY55 });
await settle();
setSyncTooBig(true);
const remoteBefore55 = remote.calls.length;
const posts55b = postCount();
try {
  await backgroundFor(5 * 60_000);
  await sleep(POST_WAIT);
  ok(postCount() > posts55b, "55.8a0 a POST was attempted, so the too-big check means something");
} finally {
  setSyncTooBig(false);
}
await settle();
ok(remote.calls.slice(remoteBefore55).some((c) => c.op === "pull"), "55.8a the too-big cycle falls back to the GitHub merge");
ok(/too big/i.test(bigLine55()), "55.8b and the advisory line says the data is too big");
ok(/tap to/i.test(bigLine55()), "55.8c and the advisory line says tap to, as group 53's helper expects");

/* 55.7 with no key, sync.connect is never called */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { noRemote: true });
await settle();
eq(connectCount(), 0, "55.7 with no key, sync.connect is never called");

/* ── 56. PR 54 review round (harness contract only) ──
   Orchestrator ruling: mirror mode turns on only after a Worker POST or GET
   returns ok in this session, and turns off on any failure. While it is off,
   the device runs today's GitHub path. B1 to B3 are the review's blocking
   findings. S1 to S3 and S6 are its should-fix findings. S4 is not written:
   entry.jsx is not bundled by the harness, so the #k= fragment is out of reach
   from here. S5 is in test/send-key.test.mjs.

   There are no fake timers. The timed cases wait real time, as group 53 does. */

const KEY56 = "device-56-key";
const GH56 = "github_pat_testtoken";
const pullCount56 = () => remote.calls.filter((c) => c.op === "pull").length;
const backoff56 = (k) => SR?.backoffMs?.(k) ?? 1000 * 2 ** k;
const pick56 = (x) => ({
  items: x.items,
  received: x.received,
  receivedAt: x.receivedAt,
  envelopes: x.envelopes,
});
/* a JSON string with object keys sorted, so two equal ledgers compare equal */
const canon56 = (x) =>
  JSON.stringify(x, (k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((key) => [key, v[key]]))
      : v
  );
const advisoryWith56 = (re) => buttons().map((b) => b.textContent).find((t) => re.test(t)) ?? "";
const CARDS56 = [/Alpha Cards/, /Beta Games/, /Gamma Cards/, /Delta Cards/];

/* 56.1 B1. The Worker POST fails (unknown, then too-big) and saves keep coming.
   Over 20 s there is at most one GitHub pull, no milestone unless something was
   removed, and retries follow backoffMs: the wait after failed attempt k is at
   least backoffMs(k). Four check-ins, 3.5 s apart, so the Worker is tried after
   each one. Ungated, the retry gaps would be 3.5 s, which is too short by the
   third gap. */
for (const [label, setFail] of [
  ["unknown", setSyncNetFail],
  ["too-big", setSyncTooBig],
]) {
  await boot({ items: ITEMS, received: {} }, null, { remote: LAPTOP_PUSHED, syncKey: KEY56 });
  await settle();
  const pulls0 = pullCount56();
  const ms0 = milestoneCount();
  const attempts = [];
  const realPost56 = win.sync.post;
  win.sync.post = async (ledger) => {
    attempts.push(Date.now());
    return realPost56(ledger);
  };
  setFail(true);
  try {
    for (const re of CARDS56) {
      await click(inCard(card(re), /^Mark all received$/), `check in ${re} (${label})`);
      await sleep(3500);
    }
    await sleep(6000); // the window closes 20 s after the first check-in
  } finally {
    setFail(false);
    win.sync.post = realPost56;
  }
  ok(attempts.length >= 2, `56.1${label[0]}0 the Worker was tried more than once, so the retry check means something`);
  ok(
    attempts.every((t, k) => k === 0 || t - attempts[k - 1] >= backoff56(k - 1) - 200),
    `56.1${label[0]}a retries to the Worker follow backoffMs, not every save (${label})`
  );
  ok(pullCount56() - pulls0 <= 1, `56.1${label[0]}b at most one GitHub pull in 20 s (${label})`);
  eq(milestoneCount() - ms0, 0, `56.1${label[0]}c no milestone, since nothing was removed (${label})`);
}

/* 56.2 B2. The Worker answers 401 to this device's key. The advisory line says
   the key was refused, and tap to. The GitHub peek and merge still run, as they
   do on a device with no Worker key. */
await boot(PHONE_STATE, null, { remote: LAPTOP_PUSHED, syncKey: KEY56 });
await settle();
const posts56b = postCount();
const peeks56b = peeks().length;
const pulls56b = pullCount56();
setSyncKeyRefused(true);
try {
  await backgroundFor(5 * 60_000);
  await sleep(POST_WAIT);
} finally {
  setSyncKeyRefused(false);
}
await settle();
ok(postCount() > posts56b, "56.2a0 the POST was refused, so the key check means something");
const keyLine56 = advisoryWith56(/key/i);
ok(/key/i.test(keyLine56), "56.2b the advisory line says the device's sync key was refused");
ok(/tap to/i.test(keyLine56), "56.2b2 and the advisory line says tap to");
ok(peeks().length > peeks56b, "56.2c the GitHub peek still runs");
ok(pullCount56() > pulls56b, "56.2d and the GitHub merge still runs");

/* 56.3 B3. A healthy Worker holds 12 lines, and this device holds 3. The mirror
   push must never write fewer than 12 lines to GitHub: it pushes the merge of
   the local snapshot with the last server ledger, never the raw snapshot. The
   POST reply arrives first, so mirror mode is on before the push. */
catchAutoTimers();
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    remoteKey: GH56,
    syncKey: KEY56,
    syncLedger: { mailday: 1, items: ITEMS, received: {}, envelopes: [] },
  });
  await settle();
  await click(inCard(card(/Alpha Cards/), /^Mark all received$/), "a change that arms the mirror timer");
  await settle();
  await pageshow();
  await sleep(POST_WAIT);
  ok(await fireAutoTimer(), "56.3a0 the mirror timer is live, so the push can run");
  await settle();
  ok(pushes().length > 0, "56.3a1 a mirror push reached GitHub, so the line count means something");
  let lines56 = 0;
  try {
    lines56 = JSON.parse(remoteText() ?? "null")?.items?.length ?? 0;
  } catch {
    lines56 = 0;
  }
  ok(lines56 >= 12, `56.3b the mirror push wrote ${lines56} lines to GitHub, never fewer than the server's 12`);
} finally {
  releaseAutoTimers();
}

/* 56.4 S1. A reply that differs only in an envelope note, an envelope photo id
   or receivedAt is applied. Each difference alone is a case, and the local ends
   equal to the merge, compared canonically, not by counts. The reply is a GET,
   so the merge is mergeLedger(local, reply), as the app runs it. */
const LOCAL56 = {
  mailday: 1,
  items: ITEMS.slice(0, 3),
  received: { [K0]: 1 },
  receivedAt: { [K0]: 1000 },
  envelopes: [
    { id: "E1", createdAt: 1000, updatedAt: 1, note: "old note", entries: [], photos: [] },
    { id: "E2", createdAt: 900, updatedAt: 1, note: "", entries: [], photos: [{ id: "p1" }] },
  ],
};
const SERVER56 = {
  mailday: 1,
  items: ITEMS.slice(0, 3),
  received: { [K0]: 1 },
  receivedAt: { [K0]: 2000 },
  envelopes: [
    { id: "E1", createdAt: 1000, updatedAt: 2, note: "new note", entries: [], photos: [] },
    { id: "E2", createdAt: 900, updatedAt: 2, note: "", entries: [], photos: [{ id: "p2" }] },
  ],
};
await boot({ items: LOCAL56.items, received: LOCAL56.received, receivedAt: LOCAL56.receivedAt, envelopes: LOCAL56.envelopes }, null, {
  noRemote: true,
  syncKey: KEY56,
});
await settle();
const expected56 = mergeLedger(LOCAL56, SERVER56).merged;
await fireSyncRev(2, SERVER56);
await sleep(APPLY_WAIT + 1000);
eq(saved().envelopes?.find((e) => e.id === "E1")?.note ?? null, "new note", "56.4a an envelope note that differs alone is applied");
eq(saved().envelopes?.find((e) => e.id === "E2")?.photos?.[0]?.id ?? null, "p2", "56.4b an envelope photo id that differs alone is applied");
eq(saved().receivedAt?.[K0] ?? null, 2000, "56.4c a receivedAt that differs alone is applied");
eq(canon56(pick56(saved())), canon56(pick56(expected56)), "56.4d and the local ends equal to the merge, compared canonically");

/* 56.5 S2. A cold open with a key calls the Worker within about 1 s, and applies
   a server ledger with more lines once the idle gate has passed. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  noRemote: true,
  syncKey: KEY56,
  syncLedger: { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] },
});
await settle();
await sleep(1000);
ok(
  syncCalls().some((c) => c.op === "get" || c.op === "post"),
  "56.5a a cold open with a key calls the Worker within about 1 s"
);
await sleep(APPLY_WAIT - 1000);
eq(saved().items?.length ?? 0, 4, "56.5b and the server's fourth line is applied after the idle gate");

/* 56.6 S3. A second held reply applies after the idle gate, although the first
   apply's notice is still open. The first apply must leave a notice; that is
   checked first, so the second check means something. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  noRemote: true,
  syncKey: KEY56,
  syncLedger: { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] },
});
await settle();
await fireSyncRev(2, { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] });
await sleep(APPLY_WAIT + 1000);
eq(saved().items?.length ?? 0, 4, "56.6a0 the first reply is applied");
ok(!!dismiss55(), "56.6a1 the first apply left its notice open, so the second check means something");
await fireSyncRev(3, { mailday: 1, items: ITEMS, received: {}, envelopes: [] });
await sleep(2500);
eq(saved().items?.length ?? 0, 12, "56.6b a second held reply applies after idle, though the first notice is open");

/* 56.7 S6. A late GET reply with a lower rev never replaces a newer held reply.
   The first GET is held back, the rev-3 GET lands and is held, then the rev-2
   reply arrives. The rev-3 reply (12 lines) must be the one applied. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  noRemote: true,
  syncKey: KEY56,
  syncLedger: { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] },
});
await settle();
const realGet56 = win.sync.get;
let releaseLate56 = null;
let getCalls56 = 0;
win.sync.get = (...args) => {
  getCalls56 += 1;
  if (getCalls56 === 1) return new Promise((r) => (releaseLate56 = r));
  return realGet56(...args);
};
try {
  await fireSyncRev(2, { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] });
  await fireSyncRev(3, { mailday: 1, items: ITEMS, received: {}, envelopes: [] });
  await sleep(300);
  releaseLate56({ status: 200, body: { ledger: { mailday: 1, items: ITEMS.slice(0, 4), received: {}, envelopes: [] }, rev: 2 }, code: "ok" });
  await sleep(APPLY_WAIT + 1000);
} finally {
  win.sync.get = realGet56;
}
eq(saved().items?.length ?? 0, 12, "56.7 a late GET reply with a lower rev never replaces the newer held reply");

/* ---- 57. the Worker probe: keys and the seed, own writes, the 401 stop, copy ----
   Red on sync/s4b by design: each case is a claim the probe found false. The
   mock keeps the Worker key in sync.key, apart from the GitHub token. */
{
  const KEY57 = "device-57-key";
  const SEED57 = JSON.stringify({ mailday: 1, items: ITEMS, received: {}, envelopes: [], stamps: {} });
  const POST57 = (SR?.SYNC_POST_MS ?? 3000) + 300;
  const count57 = (op) => syncCalls().filter((c) => c.op === op).length;
  const line57 = () => buttons().map((b) => b.textContent).find((t) => /tap to/i.test(t)) ?? "";

  /* N1a. A device with a Worker key and no GitHub token, starting empty, is
     keyed, like a GitHub token, so it must not load the public seed. */
  await boot(null, null, { seed: SEED57, syncKey: KEY57 });
  await settle();
  await sleep(SAVE_WAIT);
  ok(!/snapshot of someone/i.test(text()), "57.N1a a device with a Worker key gets no seed banner");
  ok(!(saved().items?.length), "57.N1b and no seeded items are saved");

  /* N2. The rev for this device's own POST can arrive before the POST reply.
     The device must not answer its own write with a GET. */
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { syncKey: KEY57 });
  await settle();
  const release57 = holdSyncPosts();
  try {
    await click(btn(/Mark all received/), "check in, so a POST goes out");
    await sleep(POST57);
    ok(count57("post") > 0, "57.N2a0 the POST is in flight, so the own-rev check means something");
    const gets57 = count57("get");
    await fireSyncRevOnly(syncRev() + 1); /* the rev this POST will be given */
    await sleep(100);
    release57();
    await sleep(300);
    eq(count57("get") - gets57, 0, "57.N2a no GET follows this device's own write");
  } finally {
    release57();
  }

  /* N3. After a 401 the device stops calling sync.post until the key changes or
     the page reloads. No retry follows the backoff window. */
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { syncKey: KEY57 });
  await settle();
  setSyncKeyRefused(true);
  try {
    await click(btn(/Mark all received/), "check in, so a POST is refused");
    await sleep(POST57);
    ok(count57("post") > 0, "57.N3a0 the POST was refused, so the stop means something");
    const posts57 = count57("post");
    const connects57 = count57("connect");
    await sleep(4500); /* the first two backoff waits, 1 s and 2 s, both fall inside */
    eq(count57("post") - posts57, 0, "57.N3a no POST follows a 401 over the backoff window");
    eq(count57("connect") - connects57, 0, "57.N3b and no connect follows it");
  } finally {
    setSyncKeyRefused(false);
  }

  /* N4. The server lines drop the GitHub claim. */
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { syncKey: KEY57 });
  await settle();
  setSyncNetFail(true);
  try {
    await click(btn(/Mark all received/), "check in, so a POST fails");
    await sleep(POST57);
  } finally {
    setSyncNetFail(false);
  }
  await settle();
  ok(count57("post") > 0, "57.N4a0 the POST failed, so the copy check means something");
  eq(
    line57().trim(),
    "The sync server could not be reached — tap to fix",
    "57.N4a the unreachable line drops the GitHub claim"
  );

  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { syncKey: KEY57 });
  await settle();
  setSyncTooBig(true);
  try {
    await click(btn(/Mark all received/), "check in, so a POST is too big");
    await sleep(POST57);
  } finally {
    setSyncTooBig(false);
  }
  await settle();
  eq(
    line57().trim(),
    "The ledger is too big for the sync server — tap to fix",
    "57.N4b the too-big line drops the GitHub claim"
  );
}

/* ---- 58. PR 54 round 3: the mirror conflict, the timeout, the 413 line, overlapping POSTs ----
   Red on sync/s4b by design. F3 is not here: the virtual clock cannot fire a
   timer early. The mock holds POSTs with holdSyncPosts(), set AFTER boot, since
   boot() swaps in a fresh sync mock. */
{
  const KEY58 = "device-58-key";
  const GH58 = "github_pat_testtoken";
  const AUTO58 = 90000; /* AUTO_PUSH_MS in src/app.jsx */
  const POST58 = (SR?.SYNC_POST_MS ?? 3000) + 300;
  const count58 = (op) => syncCalls().filter((c) => c.op === op).length;
  const asRemote58 = (items) =>
    JSON.stringify({
      mailday: 1,
      items,
      received: {},
      envelopes: [],
      dateFilter: { preset: "all", from: "", to: "" },
      sortBy: "newest",
      itemSort: "missing",
    });
  const LOCAL58 = ITEMS.slice(0, 3);
  /* GitHub holds 12 lines this device has never seen, so the union is 15 */
  const REMOTE58 = ITEMS.map((it) => ({ ...it, orderId: `R${it.orderId}`, key: `R${it.key}` }));

  /* F1. On a mirror push conflict the device reads GitHub, merges it in, writes
     with the fresh sha, and POSTs the merge. It never writes its own copy alone. */
  await boot({ items: LOCAL58, received: {} }, null, {
    remote: asRemote58(REMOTE58),
    remoteKey: GH58,
    syncKey: KEY58,
  });
  await settle();
  await click(btn(/Mark all received/), "check in, so a POST and a mirror push go out");
  await sleep(AUTO58 + 1000);
  await settle();
  eq(
    new Set(JSON.parse(remoteText()).items.map((i) => i.key)).size,
    15,
    "58.F1a GitHub ends with the union, all 15 lines"
  );
  ok(
    remote.history.length > 0 &&
      remote.history.every((h) => JSON.parse(h.text).items.length >= 12),
    "58.F1b no GitHub write ever holds fewer than 12 lines"
  );
  eq(
    new Set(((await win.sync.get()).body?.ledger?.items ?? []).map((i) => i.key)).size,
    15,
    "58.F1c the Worker store also ends with the union"
  );

  /* F2. A Worker call that never answers times out at SYNC_TIMEOUT_MS, and the
     GitHub peek and push go ahead. */
  eq(SR?.SYNC_TIMEOUT_MS ?? "MISSING", 10000, "58.F2a SYNC_TIMEOUT_MS is 10000, exported from sync-rules");
  await boot({ items: LOCAL58, received: {} }, null, { remoteKey: GH58, syncKey: KEY58 });
  await settle();
  const release58 = holdSyncPosts();
  try {
    await click(btn(/Mark all received/), "check in, and the POST never answers");
    await sleep(AUTO58 + 1000);
    await settle();
    ok(pushes().length > 0, "58.F2b a GitHub push goes ahead after the Worker times out");
  } finally {
    release58();
  }

  /* F4. After a 413, a successful GET must not clear the too-big line. Only a
     successful POST does. */
  await boot({ items: LOCAL58, received: {} }, null, { syncKey: KEY58 });
  await settle();
  setSyncTooBig(true);
  try {
    await click(btn(/Mark all received/), "check in, so a POST is too big");
    await sleep(POST58);
  } finally {
    setSyncTooBig(false);
  }
  await settle();
  ok(/too big/i.test(advisory()), "58.F4a0 the POST was refused as too big, so the line means something");
  await fireSyncRev(syncRev() + 1, { mailday: 1, items: LOCAL58, received: {}, envelopes: [] });
  await sleep(100);
  await settle();
  ok(/too big/i.test(advisory()), "58.F4a a successful GET does not clear the too-big line");

  /* F5. A rev heard while two POSTs overlap is held, and released after the
     second reply lands: one GET follows when the rev is above both replies. */
  await boot({ items: ITEMS.slice(0, 6), received: {} }, null, { syncKey: KEY58 });
  await settle();
  const release58b = holdSyncPosts();
  try {
    await click(allBtns(/^Mark all received$/)[0], "first check-in, POST 1 goes out");
    await sleep(POST58);
    /* the first package is complete and leaves the unreceived view, so Beta is now first */
    await click(allBtns(/^Mark all received$/)[0], "second check-in, POST 2 goes out");
    await sleep(POST58);
    eq(count58("post"), 2, "58.F5a0 two POSTs are in flight, so the overlap means something");
    await fireSyncRevOnly(syncRev() + 3); /* above both replies, which give rev+1 and rev+2 */
    const gets58 = count58("get");
    release58b();
    await sleep(300);
    eq(count58("get") - gets58, 1, "58.F5a one GET follows once both replies land, since the rev is above both");
  } finally {
    release58b();
  }

  /* F-A. A check-in made while a mirror push is in flight is not lost: a second
     mirror push follows the release, and it carries the check-in. */
  await boot({ items: ITEMS.slice(0, 6), received: {} }, null, { remoteKey: GH58, syncKey: KEY58 });
  await settle();
  const releaseA = holdRemotePushes();
  try {
    await click(allBtns(/^Mark all received$/)[0], "first check-in, the mirror push goes out and is held");
    await sleep(AUTO58 + 1000);
    await settle();
    eq(pushes().length, 1, "58.FA0 one mirror push is in flight, so the check-in during it means something");
    await click(allBtns(/^Mark all received$/)[0], "a check-in while the push is in flight");
    releaseA();
    await sleep(AUTO58 + 1000);
    await settle();
    ok(pushes().length >= 2, "58.FA1 a second mirror push follows the release");
    eq(
      Object.keys(JSON.parse(pushes().at(-1).text).received ?? {}).length,
      6,
      "58.FA2 and it carries the check-in made in flight"
    );
  } finally {
    releaseA();
  }

  /* F-B. On a mirror conflict the merge POST to the Worker fails (unknown). Mirror
     mode turns off, and the next push takes the GitHub path. GitHub keeps its
     own lines: it is never written with fewer than it held. */
  await boot({ items: LOCAL58, received: {} }, null, {
    remote: asRemote58(REMOTE58),
    remoteKey: GH58,
    syncKey: KEY58,
  });
  await settle();
  await click(btn(/Mark all received/), "check in, so the Worker holds this device's copy");
  await sleep(POST58);
  await settle();
  ok(count58("post") > 0, "58.FB0 the Worker holds this device's copy, so mirror mode is on");
  setSyncNetFail(true);
  try {
    await sleep(AUTO58 + 1000); /* the push meets the stale sha, merges, and the merge POST fails */
    await settle();
    const peeks0 = peeks().length;
    setSyncNetFail(false); /* the Worker answers again; mirror mode stays off until a reply */
    await sleep(AUTO58 + 1000); /* mirror mode is off, so this push takes the GitHub path */
    await settle();
    ok(pushes().length >= 2, "58.FB1a the device reaches a second push, so the line check means something");
    ok(
      remote.history.every((h) => JSON.parse(h.text).items.length >= 12),
      "58.FB1 a failed merge POST never leaves GitHub with fewer than its 12 lines"
    );
    ok(peeks().length > peeks0, "58.FB2 with mirror mode off, the next push takes the GitHub path, which peeks");
  } finally {
    setSyncNetFail(false);
  }

  /* G1 (F-B gap). A mirror conflict, then the merge POST fails, and the page hides
     at once. The GitHub push that follows must carry the merged ledger: 3 local
     lines and 12 GitHub lines, 15 in all. Never fewer than GitHub held. */
  await boot({ items: LOCAL58, received: {} }, null, {
    remote: asRemote58(REMOTE58),
    remoteKey: GH58,
    syncKey: KEY58,
  });
  await settle();
  await click(btn(/Mark all received/), "check in, so the Worker holds this device's copy");
  await sleep(POST58);
  await settle();
  setSyncNetFail(true);
  try {
    await sleep(AUTO58 + 1000); /* the conflict, then the merge POST fails */
    await settle();
    await background(); /* the page hides at once, before any held apply runs */
    setSyncNetFail(false);
    await sleep(AUTO58 + 1000);
    await settle();
  } finally {
    setSyncNetFail(false);
  }
  const lastG1 = remote.history.at(-1);
  eq(
    lastG1 ? JSON.parse(lastG1.text).items.length : 0,
    15,
    "58.G1 the GitHub push after a failed merge POST carries the merged ledger, 15 lines"
  );

  /* E3. Empty store on cold open. Local holds data, the first GET answers 404
     empty, and the device POSTs its ledger within about 1 s (ledger-v3 starts empty). */
  {
    const K3 = ITEMS[0].key;
    await boot({ items: ITEMS.slice(0, 3), received: { [K3]: 1 }, receivedAt: { [K3]: 100 } }, null, {
      syncKey: KEY58,
    });
    await settle();
    ok(count58("get") > 0, "58.E3a0 the cold GET was made, so the empty reply means something");
    await sleep(1000);
    await settle();
    ok(count58("post") > 0, "58.E3a the device POSTs its ledger within about 1 s of an empty reply");
    eq((await win.sync.get()).body?.ledger?.received?.[K3], 1, "58.E3b and the store holds the check-in");
  }

  /* N5w. From just before a remote apply to 10 s after it, no POST: the snapshot
     equals the server ledger. Deleting the gate in the save effect makes every
     apply POST, and this window sees it. */
  {
    const K5w = ITEMS[0].key;
    await boot({ items: ITEMS.slice(0, 3), received: { [K5w]: 1 }, receivedAt: { [K5w]: 100 } }, null, {
      noRemote: true,
      syncKey: KEY58,
    });
    await settle();
    await sleep(SAVE_WAIT);
    const SERVER5w = { mailday: 1, ...saved() };
    const LOCAL5w = { items: ITEMS.slice(0, 3), received: {}, envelopes: [] };
    await boot(LOCAL5w, null, { noRemote: true, syncKey: KEY58, syncLedger: LOCAL5w });
    await settle();
    await pageshow();
    await sleep(APPLY_WAIT);
    const postsW = count58("post");
    await fireSyncRev(syncRev() + 1, SERVER5w);
    await sleep(APPLY_WAIT);
    await settle();
    await sleep(SAVE_WAIT);
    ok(saved().received?.[K5w] === 1, "58.N5w0 the remote change is applied and saved");
    await sleep(10000);
    await settle();
    eq(count58("post") - postsW, 0, "58.N5w no POST from the apply to 10 s after it");
  }

  /* Step 8. A cold open with a key, where this device holds a check-in the server
     lacks. After the first GET reply the device POSTs its merge within about 1 s,
     and the server ends with the check-in. */
  {
    const K8 = ITEMS[0].key;
    await boot({ items: ITEMS.slice(0, 3), received: { [K8]: 1 }, receivedAt: { [K8]: 100 } }, null, {
      syncKey: KEY58,
      syncLedger: { mailday: 1, items: ITEMS.slice(0, 3), received: {}, envelopes: [] },
    });
    await settle();
    ok(count58("get") > 0, "58.S8a0 the cold GET was made, so the reply means something");
    const posts8 = count58("post");
    await sleep(1000);
    await settle();
    ok(count58("post") > posts8, "58.S8a the device POSTs within about 1 s of the first GET reply");
    eq((await win.sync.get()).body?.ledger?.received?.[K8], 1, "58.S8b and the server ends with the check-in");
  }

  /* N5. After a device applies a remote change and saves, it sends no POST when
     its snapshot equals the last server ledger. A cold open on a store equal to
     local sends none either. */
  {
    const K5 = ITEMS[0].key;
    await boot({ items: ITEMS.slice(0, 3), received: { [K5]: 1 }, receivedAt: { [K5]: 100 } }, null, {
      noRemote: true,
      syncKey: KEY58,
    });
    await settle();
    await sleep(SAVE_WAIT);
    /* what another device would have pushed: a Worker ledger carries mailday, or parseLedger refuses it */
    const SERVER5 = { mailday: 1, ...saved() };
    /* the store exists and matches this device, so the cold GET is not an empty seed */
    const LOCAL5 = { items: ITEMS.slice(0, 3), received: {}, envelopes: [] };
    await boot(LOCAL5, null, { noRemote: true, syncKey: KEY58, syncLedger: LOCAL5 });
    await settle();
    await pageshow();
    await sleep(APPLY_WAIT); /* idle, so the reply that follows can apply */
    await fireSyncRev(syncRev() + 1, SERVER5); /* the other device's push arrives */
    await sleep(APPLY_WAIT);
    await settle();
    await sleep(SAVE_WAIT);
    ok(saved().received?.[K5] === 1, "58.N5pre the remote change is applied and saved");
    await sleep(10000);
    await settle();

    await boot(SERVER5, null, { noRemote: true, syncKey: KEY58, syncLedger: SERVER5 });
    await settle();
    ok(count58("get") > 0, "58.N5b0 the cold GET was made, so the equal-store check means something");
    const posts5b = count58("post");
    await sleep(10000);
    await settle();
    eq(count58("post") - posts5b, 0, "58.N5b a cold open on a store equal to local sends no POST");
  }

  /* P1, a port of the reviewer's probe. 6 local lines meet 12 remote ones, so the
     union is 18. A touch 6 s before the conflict holds the apply, the merge POST
     fails, nothing hides, and the net comes back. A second check-in then makes
     the retry reply older than the held merge. GitHub never holds fewer lines
     than before: the head wrote 18, then 6. */
  {
    const touchP1 = () => act(async () => { win.dispatchEvent(new win.Event("pointerdown")); await sleep(0); });
    const lensP1 = () => remote.history.map((h) => JSON.parse(h.text).items.length);
    await boot({ items: ITEMS.slice(0, 6), received: {} }, null, { remote: asRemote58(REMOTE58), remoteKey: GH58, syncKey: KEY58 });
    await settle();
    await click(btn(/Mark all received/), "check in, so the Worker holds this device's copy");
    await sleep(POST58);
    await settle();
    setSyncNetFail(true);
    try {
      await sleep(AUTO58 - POST58 - 5000);
      await touchP1();
      await sleep(6000);
      await settle();
    } finally {
      setSyncNetFail(false);
    }
    await sleep(15000);
    await settle();
    await sleep(1000);
    await settle();
    await click(allBtns(/^Mark all received$/)[0], "second change");
    await sleep(AUTO58 + 1000);
    await settle();
    await sleep(AUTO58 + 1000);
    await settle();
    const LP1 = lensP1();
    ok(LP1.length > 0, "58.P1a0 GitHub was written, so the shrink check means something");
    ok(
      LP1.every((n, i) => i === 0 || n >= LP1[i - 1]),
      `58.P1a GitHub never holds fewer lines than before (writes: ${JSON.stringify(LP1)})`
    );
    eq(saved().items?.length, 18, "58.P1c the local copy ends with the union, 18 lines");
    eq((await win.sync.get()).body?.ledger?.items?.length, 18, "58.P1d and the Worker ends with the union, 18 lines");
  }

  /* P4, a port of the reviewer's probe. 3 local lines meet 12 remote ones, so the
     union is 15. A touch 6 s before the conflict holds the apply, the merge POST
     fails, the page hides, and the net comes back. No write to GitHub holds fewer
     than before: a mutant that gates the merged text on mirror mode wrote 15, then 3. */
  {
    const touchP4 = () => act(async () => { win.dispatchEvent(new win.Event("pointerdown")); await sleep(0); });
    const lensP4 = () => remote.history.map((h) => JSON.parse(h.text).items.length);
    await boot({ items: LOCAL58, received: {} }, null, { remote: asRemote58(REMOTE58), remoteKey: GH58, syncKey: KEY58 });
    await settle();
    await click(btn(/Mark all received/), "check in, so the Worker holds this device's copy");
    await sleep(POST58);
    await settle();
    setSyncNetFail(true);
    try {
      await sleep(AUTO58 - POST58 - 5000);
      await touchP4();
      await sleep(6000);
      await settle();
      await background();
      await settle();
    } finally {
      setSyncNetFail(false);
    }
    await sleep(AUTO58 + 1000);
    await settle();
    const LP4 = lensP4();
    ok(LP4.length > 0, "58.P4a0 GitHub was written, so the no-short-write check means something");
    ok(
      LP4.every((n, i) => i === 0 || n >= LP4[i - 1]),
      `58.P4a GitHub never holds fewer lines than before (writes: ${JSON.stringify(LP4)})`
    );
    eq(LP4.at(-1), 15, "58.P4b and the last write holds the union, 15 lines");
  }

  /* P5. Two Worker replies arrive while a recent touch holds the apply: the
     bigger first, then one that lacks its lines. The mirror push that runs while
     they are held carries the bigger one's lines too, since the server copy only
     grows. A copy that took the later reply alone would write 8 lines, not 18. */
  {
    const touchP5 = () => act(async () => { win.dispatchEvent(new win.Event("pointerdown")); await sleep(0); });
    const ledgerP5 = (items) => ({ mailday: 1, items, received: {}, envelopes: [] });
    await boot({ items: ITEMS.slice(0, 6), received: {} }, null, { remoteKey: GH58, syncKey: KEY58 });
    await settle();
    await click(btn(/Mark all received/), "check in, so the mirror push is due");
    await sleep(POST58);
    await settle();
    await sleep(AUTO58 - POST58 - 5000);
    await touchP5();
    await fireSyncRev(syncRev() + 1, ledgerP5(REMOTE58)); /* the newer reply: 12 lines */
    await fireSyncRev(syncRev() + 1, ledgerP5(REMOTE58.slice(0, 2))); /* the older one: 2 of them */
    eq(saved().items?.length, 6, "58.P5a0 both replies are held by the touch, so the local copy still has 6 lines");
    await sleep(6000);
    await settle();
    ok(pushes().length > 0, "58.P5a1 a mirror push ran while the replies were held");
    eq(
      JSON.parse(pushes().at(-1).text).items.length,
      18,
      "58.P5a the push carries the newer reply's lines: 6 local and 12 from the Worker"
    );
  }
}

/* ---- 59. the Worker sync key, pasted on this device ----
   The home-screen app keeps its own storage, apart from Safari, so a key that
   arrives by the QR link reaches Safari only. These cases pin a paste entry.
   Red on main by design: the entry does not exist yet. The entry is the sync
   line, which must offer it for a keyless Worker device (see
   ruled-head-one-advisory-entrance: the one line is the only entrance). */
{
  const GH59 = "github_pat_testtoken";
  const KEY59 = "k59-" + "A".repeat(39); /* 43 characters, the Worker's alphabet */
  const BAD59 = "abc123&x";
  const REFUSED59 = "That is not a valid sync key. Paste it again.";
  const STORE59 = "This device could not save the sync key. Try again.";
  const SEED59 = {
    items: ITEMS.slice(0, 3),
    received: { [ITEMS[0].key]: 1 },
    receivedAt: { [ITEMS[0].key]: 100 },
  };
  const count59 = (op) => syncCalls().filter((c) => c.op === op).length;
  const entry59 = () =>
    buttons().find((b) => /sync key/i.test(b.textContent) && /tap to/i.test(b.textContent)) ?? null;
  const field59 = () => document.querySelector('input[aria-label="Sync key"]');
  /* Re-pointed: the advisory line is not always on screen (a healthy device has
     none), so the panel opens and shuts from the Sync row on the Ledger tab,
     which is the one entrance that is always there (ledger-tab-holds-options). */
  const openPanel59 = async () => {
    await openSync();
    await settle();
  };
  const closePanel59 = async () => {
    await onLedger();
    const row = cell(/^Sync/);
    if (row?.getAttribute("aria-expanded") === "true") await click(row, "close the sync panel");
    await settle();
  };
  const pasteKey59 = async (key) => {
    if (field59()) await type(field59(), key);
    if (btn(/^Save sync key$/)) await click(btn(/^Save sync key$/), "save the pasted key");
    await sleep(1000);
    await settle();
  };
  const spySetKey59 = () => {
    const real = win.sync.setKey;
    const calls = { n: 0 };
    win.sync.setKey = (k) => {
      calls.n += 1;
      return real(k);
    };
    return { calls, restore: () => (win.sync.setKey = real) };
  };

  /* 59.1. A keyless Worker device, with GitHub healthy, still has an entrance. The
     sync line offers it, since the line is the one entrance, and a keyless device
     is not on the new path. No new control was added beside it. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true });
  await settle();
  ok(!!entry59(), "59.1 a keyless Worker device offers a sync key entry, though sync is healthy");

  /* 59.2. A valid key, pasted and saved, calls setKey, then runs the cold-open path. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true });
  await settle();
  const spy2 = spySetKey59();
  try {
    if (entry59()) await click(entry59(), "open the sync key entry");
    await settle();
    ok(!!field59(), "59.2a0 the sync key field opens from the entry");
    if (field59()) await type(field59(), KEY59);
    if (btn(/^Save sync key$/)) await click(btn(/^Save sync key$/), "save the pasted key");
    await sleep(1000);
    await settle();
    eq(spy2.calls.n, 1, "59.2a the valid key is passed to window.sync.setKey once");
    ok(await win.sync.hasKey(), "59.2b and the device now holds a Worker key");
    ok(count59("get") > 0, "59.2c saving runs the cold-open path: a GET");
    ok(count59("post") > 0, "59.2d and a POST, since local holds a check-in the server lacks");
    /* 59.4. After saving, the field stays, cleared and masked. innerHTML does not
       serialise an input's value, so the clear is checked on the element itself. */
    const f4 = field59();
    ok(!!f4 && f4.value === "" && f4.type === "password", "59.4 the field stays, cleared and masked, after a good save");
  } finally {
    spy2.restore();
  }

  /* 59.3. A key with characters outside the alphabet is refused with a plain message.
     setKey is not called, and no native dialog opens (no-native-dialogs). */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true });
  await settle();
  const spy3 = spySetKey59();
  let dialogs59 = 0;
  const realAlert = win.alert;
  const realConfirm = win.confirm;
  const realPrompt = win.prompt;
  win.alert = win.confirm = win.prompt = () => {
    dialogs59 += 1;
  };
  try {
    if (entry59()) await click(entry59(), "open the sync key entry");
    await settle();
    ok(!!field59(), "59.3pre the field is reachable, so the refusal case means something");
    if (field59()) await type(field59(), BAD59);
    if (btn(/^Save sync key$/)) await click(btn(/^Save sync key$/), "save a bad key");
    await sleep(1000);
    await settle();
    ok(!!field59() && spy3.calls.n === 0, "59.3a a key outside the alphabet is refused, and setKey is not called");
    ok(text().includes(REFUSED59), "59.3b and the refusal is the plain message, exactly");
    ok(!!field59() && dialogs59 === 0, "59.3c and no native dialog opens");
  } finally {
    win.alert = realAlert;
    win.confirm = realConfirm;
    win.prompt = realPrompt;
    spy3.restore();
  }

  /* 59.5. With a Worker key already set, the field stays reachable through the
     panel, so the key can be replaced. The line's tail copy is not pinned here. */
  await boot(SEED59, null, { remoteKey: GH59, syncKey: KEY59 });
  await settle();
  await openPanel59();
  ok(!!field59(), "59.5a with a Worker key set, the sync key field stays reachable through the panel");
  const spy5 = spySetKey59();
  try {
    await pasteKey59("k59-" + "B".repeat(39));
    ok(spy5.calls.n > 0, "59.5b and a replacement key is passed to setKey");
  } finally {
    spy5.restore();
  }

  /* 59.6. A keyless Worker device still offers the paste line. Its own boot, with
     the panel closed: an open panel shows the line on its own, which would prove
     nothing. A device that has a GitHub token but no Worker key is the owner's
     iPhone, so the line must show, never be suppressed. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true, remote: null });
  /* the GitHub push comes first. It is a mirror now and sets no Worker agreement
     (owner ruling 2026-10-12, default 5), so the Sync row must not read Backed up. */
  await mirrorPush();
  await openPanel59();
  await onLedger();
  await settle();
  const row59 = cell(/^Sync/);
  const lastSync59 = [...document.querySelectorAll("span")]
    .find((s) => s.textContent.trim() === "Last sync")
    ?.nextElementSibling?.textContent.trim();
  ok(row59?.getAttribute("aria-expanded") === "true", "59.6pre0 the Sync row is open on the Ledger tab, so its sentence shows");
  eq(lastSync59, "Not yet", "59.6pre1 with no Worker agreement, Last sync reads Not yet");
  ok(!/Backed up/.test(row59?.textContent ?? ""), "59.6pre the Sync row does not read Backed up, since no Worker agreement is on record");
  await closePanel59();
  ok(!/tap to fix/.test(text()), "59.6a in step, no fault line is shown");
  /* the advisory line is for the working tabs; the Ledger tab says it in the Sync row */
  await goTo("packages");
  ok(!!entry59(), "59.6b a keyless device in step with GitHub still shows the sync key paste line");

  /* 59.7. False alarm. A Worker-keyed device with the panel closed shows no
     "no sync key" line. Mutant: app.jsx workerKeySet !== null (~3393). */
  await boot(SEED59, null, { remoteKey: GH59, syncKey: KEY59 });
  await settle();
  ok(!/no sync key/.test(text()), "59.7a a Worker-keyed device with the panel closed shows no 'no sync key' line");

  /* 59.7b. A good save, then a panel close, leaves no paste line. Mutant: remove
     setWorkerKeySet(true) (~4863); the line then survives the close. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  ok(await win.sync.hasKey(), "59.7b the good key is saved");
  await closePanel59();
  ok(!/no sync key/.test(text()), "59.7c after a good save and a panel close, no 'no sync key' line remains");

  /* 59.8. A device that shows the public seed holds no key of its own. A pasted key
     must not POST the seed's ledger to the Worker. Read seed-load-guards. */
  await boot(null, null, { remote: null, seed: SEED, syncAdapter: true });
  await settle();
  ok(/someone else’s ledger/.test(text()), "59.8pre the device shows the public seed");
  await openPanel59();
  ok(!!field59(), "59.8pre2 the sync key field is reachable on the seeded device");
  await pasteKey59(KEY59);
  eq(count59("post"), 0, "59.8a a pasted key on a seeded device POSTs nothing to the Worker");

  /* 59.9. When setKey throws, the field is cleared anyway, and the refusal shows.
     The real adapter's throw path in entry.jsx has no seam here: see the report. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true });
  await settle();
  await openPanel59();
  const realSet9 = win.sync.setKey;
  win.sync.setKey = async () => {
    throw Object.assign(new Error("storage"), { code: "storage" });
  };
  try {
    await pasteKey59(KEY59);
    ok(!!field59() && field59().value === "", "59.9a a failed setKey still clears the field");
    ok(text().includes(STORE59) && !text().includes(REFUSED59), "59.9b a storage failure shows its own copy, not the refusal");
  } finally {
    win.sync.setKey = realSet9;
  }

  /* 59.10. A seeded page with a server ledger present. A pasted good key GETs the
     ledger and merges it. The "someone else's ledger" line goes, and a later
     check-in POSTs a ledger that carries it. */
  const SERVER59 = {
    mailday: 1,
    items: ITEMS.slice(0, 3),
    received: {},
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  };
  await boot(null, null, { remote: null, seed: SEED, syncAdapter: true, syncLedger: SERVER59 });
  await settle();
  ok(/someone else’s ledger/.test(text()), "59.10pre the device shows the public seed");
  await openPanel59();
  await pasteKey59(KEY59);
  ok(count59("get") > 0, "59.10a a pasted key on a seeded page with a server ledger GETs it");
  ok(!/someone else’s ledger/.test(text()), "59.10b and the seed line is gone once the ledger merges");
  const posts10 = count59("post");
  const lastPost10 = syncCalls().filter((c) => c.op === "post").pop();
  const checkins10 = (c) => Object.keys(JSON.parse(c?.body ?? "{}").received ?? {}).length;
  await toggleShowing();
  /* Mark all received is a package button: it lives on Packages, not the Ledger */
  await goTo("packages");
  await click(btn(/Mark all received/), "check in the cards");
  await settle();
  /* the change POST waits SYNC_POST_MS after the last change (53.0 pins it), so
     the virtual clock runs past the deadline before the POST is read */
  await sleep(SR.SYNC_POST_MS + 300);
  await settle();
  const last10 = syncCalls().filter((c) => c.op === "post").pop();
  ok(
    count59("post") > posts10 && checkins10(last10) > checkins10(lastPost10),
    "59.10c the check-in POSTs a ledger with more check-ins than the POST before it"
  );

  /* 59.12. Replacing the key while a socket is open closes that socket, and a new
     connect runs with the new key. */
  const NEW12 = "k59-" + "C".repeat(39);
  await boot(SEED59, null, { remoteKey: GH59, syncKey: KEY59 });
  await settle();
  const closes12 = syncCloseCount();
  await openPanel59();
  await pasteKey59(NEW12);
  ok(syncCloseCount() > closes12, "59.12a replacing the key closes the open socket");
  ok(
    syncCalls().some((c) => c.op === "connect" && c.key === NEW12),
    "59.12b and a new connect runs with the new key"
  );

  /* 59.13. Items and no check-ins, the server empty (404), a key pasted. The 404
     answers no reply, so nothing clears applyNow. Another device's rev then waits
     for the idle gate after the last tap, and does not apply at once. Red on head:
     applyNow is cleared only by a reply that applies, so it stays set. */
  const OTHER13 = {
    mailday: 1,
    items: ITEMS.slice(0, 3),
    received: { [ITEMS[2].key]: 1 },
    receivedAt: { [ITEMS[2].key]: 400 },
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  };
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    remoteKey: GH59,
    syncAdapter: true,
    remote: null,
  });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  await fireSyncRev(1, OTHER13);
  await sleep(SAVE_WAIT);
  ok(!saved().received?.[ITEMS[2].key], "59.13a after a 404 and a key, another device's rev does not apply at once");
  await sleep(APPLY_WAIT);
  ok(saved().received?.[ITEMS[2].key] === 1, "59.13b and it applies once the idle gate opens");

  /* 59.14. Gap 1: a seeded page and a server ledger that holds a check-in the seed
     lacks. The paste applies that ledger, so the seed line goes (the clear on the
     applied path, app.jsx ~4544), and a later check-in POSTs. */
  const SERVER14 = {
    mailday: 1,
    items: ITEMS.slice(0, 3),
    received: { [ITEMS[1].key]: 1 },
    receivedAt: { [ITEMS[1].key]: 200 },
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  };
  await boot(null, null, { remote: null, seed: SEED, syncAdapter: true, syncLedger: SERVER14 });
  await settle();
  ok(/someone else’s ledger/.test(text()), "59.14pre the device shows the public seed");
  await openPanel59();
  await pasteKey59(KEY59);
  ok(!/someone else’s ledger/.test(text()), "59.14a a server ledger with check-ins applies, and the seed line goes");
  const posts14 = count59("post");
  await toggleShowing();
  /* Mark all received is a package button: it lives on Packages, not the Ledger */
  await goTo("packages");
  await click(btn(/Mark all received/), "check in the cards");
  await settle();
  await sleep(SR.SYNC_POST_MS + 300);
  await settle();
  ok(count59("post") > posts14, "59.14b and a later check-in POSTs");

  /* 59.15. Gap 2: the first reply after a saved key applies at once. A second reply
     from another device waits for the idle gate after the last tap. Red on head with
     applyNow.current = false removed (app.jsx ~4700). */
  const FIRST15 = {
    mailday: 1,
    items: ITEMS.slice(0, 3),
    received: { [ITEMS[1].key]: 1 },
    receivedAt: { [ITEMS[1].key]: 300 },
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  };
  const SECOND15 = {
    ...FIRST15,
    received: { ...FIRST15.received, [ITEMS[2].key]: 1 },
    receivedAt: { ...FIRST15.receivedAt, [ITEMS[2].key]: 400 },
  };
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    remoteKey: GH59,
    syncAdapter: true,
    remote: null,
    syncLedger: FIRST15,
  });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  ok(saved().received?.[ITEMS[1].key] === 1, "59.15a the first reply after a saved key applies at once");
  await fireSyncRev(2, SECOND15);
  await sleep(SAVE_WAIT);
  ok(!saved().received?.[ITEMS[2].key], "59.15b a second reply from another device does not apply at once");
  await sleep(APPLY_WAIT);
  ok(saved().received?.[ITEMS[2].key] === 1, "59.15c and it applies once the idle gate opens");

  /* 59.16. The owner's path on the home-screen app: keyless with a GitHub token, the
     panel opened to paste, a good save, and the panel still open. The line must not
     read "no sync key" after the save, with the panel open, after a close, or after a
     foreground. The owner saw it read so until a force-quit. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true, remote: null });
  await settle();
  ok(!!entry59(), "59.16pre a keyless device shows the paste line first");
  await openPanel59();
  await pasteKey59(KEY59);
  ok(await win.sync.hasKey(), "59.16a the key is saved");
  ok(!/no sync key/.test(text()), "59.16b with the panel still open after the save, no 'no sync key' line");
  await closePanel59();
  ok(!/no sync key/.test(text()), "59.16c after a close, no 'no sync key' line");
  await foreground();
  await settle();
  ok(!/no sync key/.test(text()), "59.16d after a foreground, no 'no sync key' line");

  /* 59.17. The owner's full order: a keyless home-screen device with check-ins and a
     server ledger that holds a check-in. The save applies that ledger. The owner then
     checks in, another device's rev arrives, and the line is read at each step. */
  const SERVER17 = {
    mailday: 1,
    items: ITEMS.slice(0, 3),
    received: { [ITEMS[1].key]: 1 },
    receivedAt: { [ITEMS[1].key]: 500 },
    dateFilter: { preset: "all", from: "", to: "" },
    sortBy: "newest",
    itemSort: "missing",
  };
  await boot({ items: ITEMS.slice(0, 3), received: { [ITEMS[0].key]: 1 } }, null, {
    remoteKey: GH59,
    syncAdapter: true,
    remote: null,
    syncLedger: SERVER17,
  });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  ok(!/no sync key/.test(text()), "59.17a with the panel open after the save, no 'no sync key' line");
  await closePanel59();
  ok(!/no sync key/.test(text()), "59.17b after the apply and a close, no 'no sync key' line");
  await toggleShowing();
  /* Mark all received is a package button: it lives on Packages, not the Ledger */
  await goTo("packages");
  await click(btn(/Mark all received/), "check in the cards");
  await sleep(SR.SYNC_POST_MS + 300);
  await settle();
  ok(!/no sync key/.test(text()), "59.17c after a check-in POSTs, no 'no sync key' line");
  await fireSyncRev(2, { ...SERVER17, received: { ...SERVER17.received, [ITEMS[2].key]: 1 } });
  await sleep(APPLY_WAIT);
  await settle();
  ok(!/no sync key/.test(text()), "59.17d after another device's rev applies, no 'no sync key' line");
  await foreground();
  await settle();
  ok(!/no sync key/.test(text()), "59.17e after a foreground, no 'no sync key' line");

  /* 59.18. A good save confirms itself beside the field: the panel stays open with
     the field empty and masked, and "Sync key saved." says the key was taken. A later
     failed save replaces that confirmation with the refusal. Red on main: no
     confirmation exists, so the owner saw an empty field and no answer. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true, remote: null });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  ok(text().includes("Sync key saved."), "59.18a after a good save the panel says 'Sync key saved.' beside the field");
  const f18 = field59();
  ok(!!f18 && f18.value === "" && f18.type === "password", "59.18b and the field is still empty and masked");
  await pasteKey59("bad key!");
  ok(!text().includes("Sync key saved."), "59.18c a later failed save removes the confirmation");
  ok(text().includes(REFUSED59), "59.18d and shows the refusal in its place");

  /* 59.19. The message slot is reserved: an element sits after the save button even
     when it holds no text, on its own line, with a minimum height. jsdom has no
     layout, so this asserts the structure and the inline geometry only. The geometry
     itself is proven by a headless measure, not by this case. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true, remote: null });
  await settle();
  await openPanel59();
  const slot19 = btn(/^Save sync key$/)?.nextElementSibling ?? null;
  ok(!!slot19, "59.19a the message slot exists beside the save button while the message is empty");
  eq(slot19?.textContent ?? null, "", "59.19b and holds no text");
  ok(slot19?.style.flexBasis === "100%", "59.19c and takes its own line");
  ok(!!slot19?.style.minHeight, "59.19d and reserves a minimum height");

  /* 59.20. A good save says so, and closing and reopening the panel clears the message. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true, remote: null });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  ok(text().includes("Sync key saved."), "59.20pre the good save says so");
  await closePanel59();
  await openPanel59();
  ok(!text().includes("Sync key saved."), "59.20 closing and reopening the panel clears the save message");

  /* 59.21. A good save says so, and a later 401 from the Worker clears it. */
  await boot(SEED59, null, { remoteKey: GH59, syncAdapter: true, remote: null });
  await settle();
  await openPanel59();
  await pasteKey59(KEY59);
  ok(text().includes("Sync key saved."), "59.21pre the good save says so");
  setSyncKeyRefused(true);
  await foreground();
  await settle();
  await sleep(1000);
  await settle();
  ok(!text().includes("Sync key saved."), "59.21 a later 401 removes the save message");
  setSyncKeyRefused(false);
}

/* ---------- 60. shared palette tokens ----------
   The palette has one home, shared/tokens.json, and the built C must equal it.
   app.jsx does not export C, and this suite needs no product change to read it.
   The probe bundles src/app.jsx in memory with a plugin that appends one named
   export, __probeC. A drift plugin swaps the JSON the bundle imports, so the drift
   case shows that C reads the file and holds no copy. Every file read is guarded,
   so a missing tokens.json fails an assertion and never throws. */
{
  const ROOT60 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const APP60 = path.join(ROOT60, "src/app.jsx");
  const TOKENS60 = path.join(ROOT60, "shared/tokens.json");
  const esbuild60 = createRequire(path.join(ROOT60, "package.json"))("esbuild");
  const readOr60 = (p) => {
    try {
      return readFileSync(p, "utf8");
    } catch {
      return "";
    }
  };

  /* The scanner. esbuild drops comments and keeps string, template and JSX text, so a
     comment opener inside a string or template cannot hide the code after it. */
  const codeOnly60 = (src) => esbuild60.transformSync(src, { loader: "jsx", legalComments: "none" }).code;
  const COLOUR60 = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\(/g;
  const colourLiterals60 = (src) => {
    try {
      return codeOnly60(src).match(COLOUR60) ?? [];
    } catch {
      return null;
    }
  };

  /* 60.1 */
  let tokens60 = null;
  try {
    tokens60 = JSON.parse(readOr60(TOKENS60));
  } catch {
    tokens60 = null;
  }
  ok(
    tokens60 !== null && typeof tokens60 === "object" && !Array.isArray(tokens60),
    "60.1 shared/tokens.json exists and parses to an object"
  );

  /* 60.2, 60.3: the source reads the file and holds no literal C */
  let appCode60 = "";
  try {
    appCode60 = codeOnly60(readOr60(APP60));
  } catch {
    appCode60 = "";
  }
  ok(
    /\bimport\b[^;]*\bfrom\s*["']\.\.\/shared\/tokens\.json["']/.test(appCode60),
    "60.2 src/app.jsx imports ../shared/tokens.json"
  );
  ok(!/\bconst\s+C\s*=\s*\{/.test(appCode60), "60.3 src/app.jsx holds no literal `const C = {`");

  /* the probe: the built C, optionally with the JSON the bundle imports replaced */
  const probeC60 = async (tokensOverride) => {
    try {
      const built = await esbuild60.build({
        entryPoints: [APP60],
        bundle: true,
        write: false,
        format: "esm",
        platform: "node",
        loader: { ".jsx": "jsx" },
        logLevel: "silent",
        plugins: [
          {
            name: "palette-probe",
            setup(b) {
              b.onLoad({ filter: /src[\\/]app\.jsx$/ }, (args) => ({
                contents: readFileSync(args.path, "utf8") + "\nexport { C as __probeC };\n",
                loader: "jsx",
              }));
              if (tokensOverride)
                b.onLoad({ filter: /shared[\\/]tokens\.json$/ }, () => ({
                  contents: JSON.stringify(tokensOverride),
                  loader: "json",
                }));
            },
          },
        ],
      });
      const mod = await import(
        "data:text/javascript;base64," + Buffer.from(built.outputFiles[0].text).toString("base64")
      );
      return mod.__probeC ?? null;
    } catch {
      return null;
    }
  };
  /* top-level keys that differ, sorted; a missing side reads as one difference */
  const diff60 = (a, b) => {
    if (!a || !b) return ["(no value)"];
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
      .sort();
  };

  /* 60.4: the built C deep-equals the file */
  const built60 = await probeC60(null);
  const d60 = diff60(built60, tokens60);
  ok(d60.length === 0, `60.4 the built C deep-equals shared/tokens.json (differs: ${d60.join(", ")})`);

  /* 60.5, 60.6: drift. One value changed in the JSON the bundle reads must reach C,
     and the comparator must name it. */
  const DRIFT60 = "#00FF00"; // no real paper is this green, so a paper edit cannot match it
  const drifted60 = await probeC60({ ...(tokens60 ?? {}), paper: DRIFT60 });
  ok(drifted60?.paper === DRIFT60, "60.5 a drifted tokens file moves the built C.paper, so C reads the JSON");
  ok(diff60(drifted60, tokens60).includes("paper"), "60.6 the comparator names paper when the build drifts");

  /* 60.7 to 60.10: the palette rules, read from the built C. These hold before and after
     the move, so they are guards, not red-first cases. */
  const C60 = built60 ?? {};
  const hexOk60 = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
  const lum60 = (hex) =>
    [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio60 = (a, b) => {
    if (!hexOk60(a) || !hexOk60(b)) return 0;
    const [hi, lo] = [lum60(a), lum60(b)].sort((p, q) => q - p);
    return (hi + 0.05) / (lo + 0.05);
  };
  const PAIRS60 = [
    ["ink", "paper", 4.5],
    ["inkSoft", "card", 4.5],
    ["accent", "card", 4.5],
    ["ink", "greenSoft", 4.5],
    ["red", "redSoft", 4.5],
    ["manilaInk", "manila", 4.5],
    ["amber", "card", 4.5],
    ["accent", "silver", 3],
  ];
  for (const [fg, bg, floor] of PAIRS60) {
    const r = ratio60(C60[fg], C60[bg]);
    ok(r >= floor, `60.7 ${fg} on ${bg} clears ${floor}:1 (measured ${r.toFixed(2)})`);
  }

  const tableRows60 = [...readOr60(path.join(ROOT60, "decisions/palette-tokens-contrast-floor.md")).matchAll(
    /^\| `(\w+)` \| `([^`]+)` \|/gm
  )].map((m) => [m[1], m[2]]);
  ok(tableRows60.length >= 15, "60.8a the contrast record holds its token table");
  for (const [name, value] of tableRows60)
    ok(
      String(C60[name] ?? "").toUpperCase() === value.toUpperCase(),
      `60.8 ${name} is ${value}, as the contrast record states (built: ${C60[name]})`
    );

  const page60 = readOr60(path.join(ROOT60, "index.html"));
  const theme60 = page60.match(/<meta name="theme-color" content="([^"]+)"/)?.[1] ?? "";
  const bodyBg60 = page60.match(/<style>html,body,#root\{[^}]*?background:\s*([^;}]+)/)?.[1]?.trim() ?? "";
  ok(theme60.toUpperCase() === String(C60.paper).toUpperCase(), `60.9a theme-color (${theme60}) tracks paper`);
  ok(bodyBg60.toUpperCase() === String(C60.paper).toUpperCase(), `60.9b page background (${bodyBg60}) tracks paper`);

  let outsideC60 = null;
  try {
    outsideC60 = codeOnly60(readOr60(APP60));
  } catch {
    outsideC60 = null;
  }
  const stray60 = outsideC60 === null ? ["(unreadable)"] : outsideC60.match(COLOUR60) ?? [];
  ok(stray60.length === 0, `60.10 no colour literal in src/app.jsx code (found: ${stray60.join(" ")})`);

  /* 60.11: the scanner respects strings, template literals and JSX text. A regex that
     strips comments first would fail these. */
  eq(
    colourLiterals60('const s = "/*", hex = "#abc123"; /* end */ const k = "#654321";\nconst u = "//x";\n'),
    ["#abc123", "#654321"],
    "60.11a a comment opener inside a string does not hide the literal after it"
  );
  eq(
    colourLiterals60(
      "const css = `\n// not a comment #aabbcc\n/* open\n.x { color: #fedcba; }\n`;\nconst after = \"#123abc\";\n"
    ),
    ["#aabbcc", "#fedcba", "#123abc"],
    "60.11b a multi-line template keeps its comment-like text and its colours"
  );
  eq(
    colourLiterals60("const el = <p>Don't</p>;\n/* #111111 */\nconst hex = \"#222222\";\nconst q = 'x';\n"),
    ["#222222"],
    "60.11c a lone quote in JSX text opens no string, and a colour in a comment is ignored"
  );
  eq(
    colourLiterals60("// #333333\nconst a = 1; /* #444444 */\n"),
    [],
    "60.11d a colour that sits only in comments is not a literal"
  );
  eq(
    colourLiterals60('const sep = "// not a comment", hex = "#abc123";\n'),
    ["#abc123"],
    "60.11e a line-comment opener inside a string does not hide the colour after it"
  );
  eq(
    colourLiterals60('const tag = "# note", hex = "#fedcba";\n'),
    ["#fedcba"],
    "60.11f a hash opener inside a string does not hide the colour after it"
  );
}

/* ── 61. the house UX rules, lanes L1 and L2 (decision ux-house-rules-govern) ──
   Each block names the rule it checks. An ask names the count it removes or
   replaces, and its first focus lands on Cancel (ux-ask-or-undo). A missing
   control is a failed case, never a crash: `tapL1` records the miss and goes
   on, so one red case cannot hide the cases after it. */
const tapL1 = async (re, label) => {
  const el = btn(re);
  ok(!!el, `${label}: the control is on screen`);
  if (el) await click(el, label);
};
const focusedL1 = () => document.activeElement?.textContent.trim() || "";
/* a text leaf: an element whose own text is the whole of its content */
const leafL1 = (re) =>
  [...document.querySelectorAll("div")].find(
    (d) => d.childElementCount === 0 && re.test(d.textContent.trim())
  );
/* the 10px floor: an element with its own text, styled under 10px */
const underFloorL1 = () =>
  [...document.querySelectorAll("body *")]
    .filter(
      (el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
        parseFloat(win.getComputedStyle(el).fontSize) < 10
    )
    .map((el) => el.textContent.trim().slice(0, 24));

/* A1, ux-claims-are-true: the merge copy says what a merge does. Where both
   devices changed the same card, the later change wins (merge-rules.mjs). */
/* Re-pointed (owner ruling 2026-10-12): "pushed newer lines" is GitHub copy and
   left the UI with the verbs. A cold open against a newer remote is the merge
   that is left, and its notice names what it took. The "later change to the
   same card wins" copy went with the Merge button; the rule itself is pinned
   by 49.1 to 49.4 and 50.A1. */
await boot(PHONE_STATE, null, {
  remoteAtBoot: LAPTOP_PUSHED,
  remoteKey: "github_pat_testtoken",
});
await settle();
await sleep(SAVE_WAIT);
ok(/Merged/.test(text()), "61.1 a cold open against a newer remote says what the merge took");
ok(!GITHUB_STATE_TEXT.test(text()), "61.2 and shows no GitHub copy for the same state");
ok(!/nothing here is replaced/.test(text()), "61.3 and it no longer says nothing here is replaced");

/* A2, ask: Reset names the 14 cards it clears, and first focus lands on Cancel */
await fresh();
await onLedger(); /* Reset is a Ledger-tab control (L11b) */
await tapL1(/^Reset$/, "arm reset");
ok(!!btn(/Tap again to clear 14 cards/), "61.4 the Reset ask names the 14 cards it clears");
ok(focusedL1() === "Cancel", "61.5 Reset puts first focus on Cancel");
await tapL1(/^Cancel$/, "cancel the reset");
ok(!!btn(/^Reset$/), "61.6 Cancel returns Reset to its rest label");
ok(/cards\s*0\/14/.test(text()), "61.7 and the ledger is untouched");

/* A2, ask: Discard names the 4 cards in the envelope, and Cancel keeps it */
await fresh();
await goTo("orphaned");
await record(["Path to Exile", "Swords to Plowshares", "Ponder", "Lightning Bolt"]);
await tapL1(/^Discard$/, "arm discard");
ok(!!btn(/Tap again to discard 4 cards/), "61.8 the Discard ask names the 4 cards it drops");
ok(focusedL1() === "Cancel", "61.9 Discard puts first focus on Cancel");
await tapL1(/^Cancel$/, "cancel the discard");
ok(/Envelope · .* 4 cards/.test(text()), "61.10 Cancel keeps the envelope, still 4 cards");

/* A2, ask: Remove stamp names the cards the package holds, and Cancel keeps the stamp */
await fresh();
await stampPkg(/Alpha Cards/, "Reshipped");
await click(bandOf(card(/Alpha Cards/)), "open Alpha's stamp");
await click(inCard(card(/Alpha Cards/), /^Remove stamp$/), "remove, first tap");
const removeAskL1 = inCard(card(/Alpha Cards/), /Tap again to remove/);
ok(!!removeAskL1 && /\d+ cards?/.test(removeAskL1.textContent), "61.11 the Remove ask names the cards the package holds");
ok(focusedL1() === "Cancel", "61.12 Remove puts first focus on Cancel");
await tapL1(/^Cancel$/, "cancel the removal");
await sleep(SAVE_WAIT);
ok(!!saved().stamps?.[GK_A]?.kind, "61.13 Cancel keeps the stamp");

/* A2, ask: Restore names the 14 cards it replaces, and Cancel leaves the version */
const VER_L1 = "v-l1-restore";
const versionL1 = (text) => [
  [VER_L1, { meta: { id: VER_L1, at: Date.now() - 3600_000, label: "before reset", kind: "milestone", lines: 3, checked: 0, bytes: 10 }, text }],
];
const openVersionL1 = () =>
  click(
    buttons().find((b) => b.textContent.includes("before reset") && b.getAttribute("aria-expanded") !== null),
    "expand the version"
  );
await boot({ items: ITEMS, received: {} }, null, { versions: versionL1("{}") });
await openHistory();
await openVersionL1();
await tapL1(/^Restore this version$/, "arm restore");
ok(!!btn(/Tap again to replace 14 cards/), "61.14 the Restore ask names the 14 cards it replaces");
ok(focusedL1() === "Cancel", "61.15 Restore puts first focus on Cancel");
await tapL1(/^Cancel$/, "cancel the restore");
ok(!!btn(/^Restore this version$/) && !btn(/Tap again to replace \d+ cards?/), "61.16 Cancel returns Restore to rest");

/* A2, assign: one tap checks the envelope in, and Undo is the way back */
await fresh();
await goTo("orphaned");
await record(["Ponder"]);
await tapL1(/^This one$/, "check the candidate in, one tap");
ok(!btn(/Tap again to check in/), "61.17 one tap checks in, with no second tap");
ok(!!btn(/^Undo$/), "61.17b the one tap offers Undo");
await tapL1(/^Undo$/, "undo the check-in");
eq(envelopeCount(), 1, "61.18 Undo puts the envelope back");

/* P4, ux-empty-one-action: the no-match state has one Clear search control */
await fresh();
await goTo("packages");
await type(document.querySelector('input[aria-label^="Search cards"]'), "zzz no such card");
ok(/No cards match that search\./.test(text()), "61.19 the no-match state shows its sentence");
eq(allBtns(/^Clear search$/).length, 1, "61.20 and exactly one Clear search control");
await tapL1(/^Clear search$/, "clear the search");
eq(document.querySelector('input[aria-label^="Search cards"]')?.value, "", "61.21 Clear search empties the Find box");
ok(!/No cards match that search/.test(text()) && !!card(/Alpha Cards/), "61.22 and the cards come back");

/* P4: no party emoji in the all-checked message */
await boot({ items: ITEMS, received: Object.fromEntries(ITEMS.map((it) => [it.key, it.qty])) });
await goTo("packages");
const doneL1 = leafL1(/^Everything here/);
ok(!!doneL1, "61.23 the all-checked message is on screen");
ok(!/\p{Extended_Pictographic}/u.test(doneL1?.textContent || ""), "61.24 and it carries no emoji");

/* P4, ux-empty-one-action: the Orphaned empty state is one sentence */
await fresh();
await goTo("orphaned");
const pileL1 = leafL1(/^Nothing waiting/);
ok(!!pileL1, "61.25 the Orphaned empty state is on screen");
eq((pileL1?.textContent.match(/[.!?](?=\s|$)/g) || []).length, 1, "61.26 and it is one sentence");

/* P7: every Tally sort label fits the 375px cell. "Most missing", the default,
   is 12 characters and shows whole; "Biggest po..." was cut after 10. */
await fresh();
await goTo("tally");
/* the sort row lives on the Ledger tab and offers the view's own sorts (63.8) */
await onLedger();
await click(cell(/^Sorted by/), "open the Tally sort");
const sortLabelsL1 = [...document.querySelectorAll(".mdl-panel button")].map((b) => b.textContent.trim());
eq(sortLabelsL1.length, 6, "61.27 the Tally sort panel lists its six keys (tally-sort-keys-are-six)");
eq(sortLabelsL1.filter((l) => l.length > 12), [], "61.28 every Tally sort label is 12 characters or fewer");

/* the 10px label floor (typography-cochin-and-mono), on the views a person reads */
await fresh();
await goTo("tally");
eq(underFloorL1(), [], "61.29 no Tally label is under 10px");
await goTo("packages");
eq(underFloorL1(), [], "61.30 no Packages label is under 10px");
await goTo("orphaned");
eq(underFloorL1(), [], "61.31 no Orphaned label is under 10px");
await openHistory();
eq(underFloorL1(), [], "61.32 no History label is under 10px");

/* A3, ux-keep-what-was-made: the composer's draft survives a change of tab */
await fresh();
await goTo("orphaned");
await tapL1(/Record an envelope/, "open the composer");
await type(cardInput(), "Zyzzyva");
await tapL1(/^Add “/, "add the card as typed");
await type(document.querySelector('input[aria-label="Envelope note"]'), "keep this note");
await goTo("packages");
await goTo("orphaned");
ok(!!btn(/Save envelope/), "61.33 the composer is still open after a tab change");
eq(document.querySelector('input[aria-label="Envelope note"]')?.value, "keep this note", "61.34 and its note survives");
ok(/Zyzzyva/.test(text()), "61.35 and so does the card it holds");
await sleep(SAVE_WAIT);
eq(saved().envelopes?.length ?? 0, 0, "61.36 a draft is not written to the ledger");

/* P6, ux-answer-at-press: a failed version restore shows in the row pressed */
await boot({ items: ITEMS, received: {} }, null, { versions: versionL1("") });
await openHistory();
await openVersionL1();
const restoreBtnL1 = btn(/^Restore this version$/);
const restoreRowL1 = restoreBtnL1?.parentElement.parentElement;
await tapL1(/^Restore this version$/, "arm restore");
await tapL1(/Tap again to replace/, "confirm restore");
await settle();
const restoreErrL1 = leafL1(/could not be read from this device/);
ok(!!restoreErrL1, "61.37 the version error is on screen");
ok(!!restoreErrL1 && !!restoreRowL1 && restoreRowL1.contains(restoreErrL1), "61.38 and it sits in the row of the version that failed");

/* P6: a failed Load older shows beside the control pressed */
await boot({ items: ITEMS, received: {} });
await openHistory();
const beforeL1 = new Set(
  [...document.querySelectorAll("div")].filter((d) => d.childElementCount === 0).map((d) => d.textContent)
);
remote.fail = "offline";
await tapL1(/Load older versions/, "ask for the older versions");
await settle();
const loadErrL1 = [...document.querySelectorAll("div")].find(
  (d) => d.childElementCount === 0 && !beforeL1.has(d.textContent) && /No connection/.test(d.textContent)
);
ok(!!loadErrL1, "61.39 the Load older error is on screen");
const loadBtnL1 = btn(/Load older versions/);
ok(
  !!loadErrL1 && !!loadBtnL1 && loadBtnL1.parentElement !== loadBtnL1.closest(".mdl-panel") && loadBtnL1.parentElement.contains(loadErrL1),
  "61.40 and it shares a row with the control that failed"
);
remote.fail = null;

/* ── 61.41+ (orchestrator defaults, 2026-10-11 — defaults, not owner rulings) ──
   Reset's count and the Discard arm's structure, and drafts held per composer.
   Geometry (no shrink, no move) is jsdom-blind: it is measured headless in
   check:screens, and these cases assert only the DOM that would change it. */

/* Reset counts every card it clears, envelope cards included (ux-ask-or-undo). */
await boot({
  items: [],
  received: {},
  envelopes: [
    {
      id: "env-reset-only",
      createdAt: Date.parse("2026-08-01"),
      note: "",
      photos: [],
      entries: [{ name: "Ponder", qty: 1 }],
    },
  ],
});
await onLedger(); /* Reset is a Ledger-tab control (L11b) */
await tapL1(/^Reset$/, "arm reset with one envelope card and no ledger cards");
eq(btn(/^Tap again to clear/)?.textContent.trim(), "Tap again to clear 1 card", "61.41 Reset counts the envelope card: exactly 1 card");
await tapL1(/^Cancel$/, "cancel the reset");

await fresh();
await goTo("orphaned");
await record(["Ponder"]);
await onLedger(); /* Reset is a Ledger-tab control (L11b) */
await tapL1(/^Reset$/, "arm reset with ledger cards and one envelope card");
eq(btn(/^Tap again to clear/)?.textContent.trim(), "Tap again to clear 15 cards", "61.42 Reset counts the 14 ledger cards and the 1 envelope card");
await tapL1(/^Cancel$/, "cancel the reset");

/* Discard arm: the arm changes its own label in place. It adds no element to
   the envelope header row, and the header label and Edit keep their nodes. */
await fresh();
await goTo("orphaned");
await record(["Ponder"]);
const headLabelL1 = () =>
  [...document.querySelectorAll("span")].find((s) => /^Envelope ·/.test(s.textContent.trim()));
const headRowL1 = headLabelL1()?.parentElement;
const headLabelBefore = headLabelL1();
const headEditBefore = [...(headRowL1?.children ?? [])].find((b) => b.textContent.trim() === "Edit");
const headKidsBefore = headRowL1?.childElementCount;
await tapL1(/^Discard$/, "arm discard");
const headRowAfterL1 = headLabelL1()?.parentElement;
ok(headRowAfterL1 === headRowL1, "61.43 the arm keeps the envelope header row's node");
ok(headLabelL1() === headLabelBefore, "61.44 the arm keeps the envelope label's node");
ok(
  !!headEditBefore && [...(headRowAfterL1?.children ?? [])].includes(headEditBefore),
  "61.45 the arm keeps the Edit control's node in the header row"
);
eq(headRowAfterL1?.childElementCount, headKidsBefore, "61.46 the arm adds no element to the header row");

/* Cancel closes the composer and keeps its draft (ux-keep-what-was-made).
   Only Discard or Save ends a draft. */
await fresh();
await goTo("orphaned");
await tapL1(/Record an envelope/, "open the composer");
await type(cardInput(), "Zyzzyva");
await tapL1(/^Add “/, "add the card as typed");
await type(document.querySelector('input[aria-label="Envelope note"]'), "cancel keeps this");
const composerFootL1 = () => btn(/Save envelope/)?.parentElement;
const composerCancelL1 = [...(composerFootL1()?.querySelectorAll("button") ?? [])].find(
  (b) => b.textContent.trim() === "Cancel"
);
ok(!!composerCancelL1, "61.47 the composer has its own Cancel");
await click(composerCancelL1, "cancel the composer");
ok(!btn(/Save envelope/), "61.48 Cancel closes the composer");
await tapL1(/Record an envelope/, "reopen the composer");
eq(document.querySelector('input[aria-label="Envelope note"]')?.value, "cancel keeps this", "61.49 the reopened composer keeps its note");
ok(/Zyzzyva/.test(text()), "61.50 and the card it held");
await sleep(SAVE_WAIT);
eq(saved().envelopes?.length ?? 0, 0, "61.51 Cancel wrote no envelope");

/* Drafts are held per composer: opening a second composer never loses the
   first composer's draft (ux-keep-what-was-made). */
await fresh();
await goTo("orphaned");
await record(["Lightning Bolt"]);
await tapL1(/Record an envelope/, "open the first composer, the new record");
await type(cardInput(), "Zyzzyva");
await tapL1(/^Add “/, "add a card to the first composer");
await type(document.querySelector('input[aria-label="Envelope note"]'), "first draft note");
await tapL1(/^Edit$/, "open a second composer on the saved envelope");
await type(document.querySelector('input[aria-label="Envelope note"]'), "second draft note");
await tapL1(/Record an envelope/, "return to the first composer");
eq(document.querySelector('input[aria-label="Envelope note"]')?.value, "first draft note", "61.52 the first composer's note is kept");
await tapL1(/^Edit$/, "return to the second composer");
eq(document.querySelector('input[aria-label="Envelope note"]')?.value, "second draft note", "61.53 and the second composer's note is kept");

/* Owner ruling (sweep holds only for live work): a closed composer draft holds
   the photos it references, and nothing else. A draft holding photo A does not
   freeze the sweep: A survives and an unused photo B is swept. An open composer
   still holds the sweep off (61.57). The control runs first: with no draft, the
   unreferenced blob is swept, so the held case is not vacuous. */
await boot({ items: ITEMS, received: {} }, [["pho-draft", jpeg()]]);
await goTo("orphaned");
await sleep(SWEEP_WAIT);
eq(photoKeys(), [], "61.54 control: with no draft open, the sweep removes an unreferenced blob");

/* Photo A is referenced only by the draft: the envelope that first carried it
   is discarded after the draft is closed, so no live envelope holds A. */
await boot(
  {
    items: ITEMS,
    received: {},
    envelopes: [
      {
        id: "env-h",
        createdAt: Date.parse("2026-08-01"),
        note: "",
        photos: ["pho-held"],
        entries: [{ name: "Ponder", qty: 1 }],
      },
    ],
  },
  [
    ["pho-held", jpeg()], // photo A: the closed draft holds it
    ["pho-loose", jpeg()], // photo B: referenced by nothing
  ]
);
await goTo("orphaned");
await tapL1(/^Edit$/, "open the composer on the envelope that holds photo A");
await type(document.querySelector('input[aria-label="Envelope note"]'), "draft holds photo A");
const heldFootL1 = btn(/Save changes/)?.parentElement;
const heldCancelL1 = [...(heldFootL1?.querySelectorAll("button") ?? [])].find(
  (b) => b.textContent.trim() === "Cancel"
);
await click(heldCancelL1, "cancel the composer, keeping its draft");
ok(!btn(/Save changes/), "61.55 the composer is closed, its draft is not");
await click(btn(/^Discard$/), "discard the envelope, so only the draft holds photo A");
await click(btn(/Tap again to discard/), "confirm the discard");
await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-held"], "61.56 a closed draft keeps its photo A; unused photo B is swept");

/* An open composer still holds the sweep off, even with no photo at all. */
await boot({ items: ITEMS, received: {} }, [["pho-loose", jpeg()]]);
await goTo("orphaned");
await tapL1(/Record an envelope/, "open a composer and leave it open");
await type(document.querySelector('input[aria-label="Envelope note"]'), "composer stays open");
await sleep(SWEEP_WAIT);
eq(photoKeys(), ["pho-loose"], "61.57 an open composer holds the sweep off an unreferenced blob");

uninstallClock();

/* ── 62. the bottom bar, lane L11a (decision phone-nav-is-bottom-bar) ──────
   The bar replaces the in-page view switch. It holds four tabs, Ledger,
   Orphaned, Tally and Packages, and a floating search pill sits above it.
   Ledger is an empty placeholder until L11b. The tab order is asserted in 21.4.
   Geometry (44px targets, clearance over the last row, the 480px cap, the
   safe-area inset) is asserted in test/screens.mjs, because jsdom has no
   layout. */

const pillInput = () =>
  document.querySelector('[role="search"] input[aria-label^="Search cards"]');
const tabEl = (name) => viewTabs().find((b) => tabName(b) === name);

await fresh();
ok(!!document.querySelector('nav[aria-label="Views"]'), "62.1 the tabs sit in a nav landmark");
eq(currentTab(), ["Packages"], "62.2 Packages is current on load, and only one tab is");

await click(tabEl("Ledger"), "Ledger tab");
eq(currentTab(), ["Ledger"], "62.3 Ledger becomes the current tab");
ok(!/Alpha Cards/.test(text()), "62.4 the Ledger placeholder shows no package");
ok(
  !document.querySelector('input[aria-label^="Search cards"]'),
  "62.5 the search pill is not on the Ledger tab"
);

await click(tabEl("Packages"), "Packages tab");
ok(!!pillInput(), "62.6 the search pill is a search landmark on Packages");
eq(pillInput()?.style.fontSize, "16px", "62.7 the pill input is 16px, so iOS does not zoom");
ok(!document.querySelector(".mdl-switch"), "62.8 the in-page view switch is retired");

/* The bar shows on an empty ledger, so Re-import and Reset stay reachable
   (recovery-control-not-state-gated). Whether the bar shows with nothing at
   all is an open question for the owner; see the report. */
await boot({ items: [], received: {} });
eq(
  viewTabs().map(tabName),
  ["Ledger", "Orphaned", "Tally", "Packages"],
  "62.9 the bar holds its four tabs on an empty ledger"
);

/* A pending envelope puts its count on the Orphaned tab. */
await boot({ items: ITEMS, received: {} });
await goTo("orphaned");
await record(["Lightning Bolt"], "bar count");
eq(
  tabEl("Orphaned")?.textContent.replace(/\D+/g, ""),
  "1",
  "62.10 the Orphaned tab carries its envelope count"
);

/* ── 63. the Ledger tab holds the options, lane L11b (decision ledger-tab-holds-options) ──
   The working screens lose their control rows. The Ledger tab holds the View
   cells (Showing, Sorted by, Orders from), Sync, History, the Data cells
   (Re-import CSV, Backup), and Reset last, in red. An armed Reset arms in
   place. Sync and History open inside the tab. The tab is reachable on an
   empty ledger. The advisory line stays on the working screen.
   Group 64 carries the 2026-10-12 ruling that GitHub leaves the Sync panel. */

const focusIsCancel = () =>
  document.activeElement?.textContent.trim() === "Cancel";
const cancelBtn = () =>
  buttons().find((b) => b.textContent.trim() === "Cancel");
const namesOnLedger = () =>
  buttons()
    .filter((b) => !b.closest("nav") && !b.closest('[role="search"]'))
    .map((b) => b.textContent.trim());
/* The Sync panel's marker. Push is gone (owner ruling 2026-10-12, GitHub leaves
   the UI), so the panel is open when its Sync key field is on screen. That field
   exists only on a device with the Worker adapter, so these fixtures boot with
   syncAdapter. */
const syncOpenNow = () => !!document.querySelector('input[aria-label="Sync key"]');

/* the working screen keeps none of the moved controls */
await fresh();
ok(!!headBar(), "63.1 the masthead stays on the working screen");
ok(
  !cell(/^Showing/) && !cell(/^Sorted by/) && !cell(/^Orders from/),
  "63.2 Packages holds no View cell"
);
ok(
  !cell(/^Sync/) && !cell(/^History/) && !btn(/^Re-import CSV/) && !btn(/^Backup$/) && !btn(/^Reset$/),
  "63.3 nor Sync, History, the Data cells or Reset"
);

/* the Ledger tab, in the ruled order, with Reset last and in red */
await onLedger();
const seq = [
  /^Showing/,
  /^Sorted by/,
  /^Orders from/,
  /^Sync/,
  /^History/,
  /^Re-import CSV/,
  /^Backup$/,
  /^Reset$/,
];
const at = (re) => namesOnLedger().findIndex((n) => re.test(n));
const idx = seq.map(at);
ok(
  idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]),
  "63.4 the Ledger tab holds the options in the ruled order"
);
ok(
  /^Reset$/.test(namesOnLedger().at(-1) ?? ""),
  "63.5 Reset is the last control on the Ledger tab"
);
ok(/danger/.test(btn(/^Reset$/)?.className ?? ""), "63.6 and it is the red, danger control");

/* the working screen is current when Ledger is not, and Ledger is current
   after a visit (decision phone-nav-is-bottom-bar) */
eq(currentTab(), ["Ledger"], "63.7 the Ledger tab is current after the visit");

/* Sorted by offers the options of the working view it came from. This is an
   inference from ruled sort behaviour (package-sort-swaps-with-view), not an
   owner ruling. */
await fresh();
await goTo("tally");
await onLedger();
await click(cell(/^Sorted by/), "open sort from Ledger");
ok(
  buttons().some((b) => b.textContent.trim() === "Name A–Z") &&
    !buttons().some((b) => b.textContent.trim() === "Seller A–Z"),
  "63.8 Sorted by on the Ledger tab offers the Tally sorts after Tally"
);
await goTo("packages");
await onLedger();
await click(cell(/^Sorted by/), "open sort from Ledger");
ok(
  buttons().some((b) => b.textContent.trim() === "Seller A–Z"),
  "63.9 and offers the Packages sorts after Packages"
);

/* Sync and History open inside the Ledger tab, and close each other */
await boot({ items: ITEMS, received: {} }, null, { syncAdapter: true });
await settle();
await onLedger();
await click(cell(/^Sync/), "open Sync on the Ledger tab");
ok(syncOpenNow(), "63.10 Sync opens its panel inside the Ledger tab");
eq(currentTab(), ["Ledger"], "63.11 and the tab stays current");
const syncWasOpen = syncOpenNow();
await click(cell(/^History/), "open History");
ok(syncWasOpen && !syncOpenNow(), "63.12 opening History closes an open Sync");
ok(cell(/^History/)?.getAttribute("aria-expanded") === "true", "63.13 and History is open");

/* the advisory line on the working screen is the other way into Sync. Where
   it lands is inferred, not ruled: it opens the Ledger tab with Sync open. */
await boot({ items: ITEMS, received: {} }, null, { syncAdapter: true });
await settle();
await click(btn(/tap to/), "advisory line on Packages");
eq(currentTab(), ["Ledger"], "63.14 the advisory line takes the tab to Ledger (inferred)");
ok(syncOpenNow(), "63.15 and opens the Sync panel there");

/* reachable on an empty ledger (recovery-control-not-state-gated) */
await boot({ items: [], received: {} });
await onLedger();
ok(!!cell(/^Sync/), "63.16 an empty ledger still reaches Sync");
ok(!!cell(/^History/), "63.17 and History");
ok(!!btn(/^Re-import CSV/), "63.18 and Re-import CSV");
ok(!!btn(/^Backup$/), "63.19 and Backup");
ok(!!btn(/^Reset$/), "63.20 and Reset");

/* Reset arms in place on the Ledger tab */
await boot({ items: ITEMS, received: {} });
await onLedger();
await click(btn(/^Reset$/), "arm reset in place");
ok(!!btn(/Tap again to clear 14 cards/), "63.21 an armed Reset names the 14 ledger cards");
ok(
  !!btn(/Re-import CSV/) && !!cell(/^History/) && !!cell(/^Sync/),
  "63.22 and the other cells stay where they are"
);
ok(focusIsCancel(), "63.23 Cancel takes first focus");
await click(cancelBtn(), "cancel the reset");
ok(!btn(/Tap again to clear/) && !!btn(/^Reset$/), "63.24 Cancel disarms, and nothing is cleared");
ok(!!cell(/^Showing/) && /Unreceived/.test(cell(/^Showing/).textContent), "63.25 the Showing cell is unchanged");

/* History stays open under an armed Reset (history-sync-close-each-other) */
await openHistory();
await click(btn(/^Reset$/), "arm reset with History open");
eq(
  cell(/^History/)?.getAttribute("aria-expanded"),
  "true",
  "63.26 an armed Reset leaves History open"
);
await click(cancelBtn(), "cancel");

/* ── 64. GitHub leaves the UI; the Sync group keeps the server (owner ruling 2026-10-12) ──
   "i thought we are eliminating push and pull" (2026-10-12), after "Cloudflare
   does it all" (2026-10-11). Pull from GitHub, Push, Push anyway and Merge & push
   leave the UI, with their armed states. The Sync group shows the Cloudflare
   server status, the device key paste box and the last sync time. The GitHub
   mirror keeps pushing in the background until worker-keeps-snapshots replaces
   it. Records: ledger-tab-holds-options, sync-revamp-cloudflare,
   worker-keeps-snapshots, stale-push-conflict-pull-two-tap.
   Retired here: 63.27 to 63.33, which counted the Pull and Push anyway asks. */
const GITHUB_ASK_NAMES = [
  /Pull from GitHub/,
  /^Push$/,
  /^Pushed ✓$/,
  /Push anyway/,
  /Merge & push/,
  /Tap again to replace/,
  /Tap again to overwrite/,
];
const hasAction = (re) => buttons().some((b) => re.test(b.textContent.trim()));

await boot({ items: ITEMS, received: {} }, null, { syncAdapter: true, remote: OTHER_DEVICE });
await settle();
await openSync();
await settle();
ok(syncOpenNow(), "64.1 the Sync panel opens with the device key paste box");
ok(!!btn(/Save sync key/), "64.2 and its Save sync key button");
ok(!hasAction(/Pull from GitHub/), "64.3 the Sync panel offers no Pull from GitHub");
ok(!hasAction(/^Push$/) && !hasAction(/^Pushed ✓$/), "64.4 nor Push");
ok(!hasAction(/Merge & push/), "64.5 nor Merge & push, though the remote is ahead");
ok(!GITHUB_ASK_NAMES.some((re) => hasAction(re)), "64.6 no GitHub control or armed ask is on screen");

/* a fresh phone reaches the device key paste box, with no GitHub control in the way */
await boot({ items: [], received: {} }, null, { syncAdapter: true });
await settle();
await openSync();
await settle();
ok(syncOpenNow(), "64.7 an empty ledger still reaches the device key paste box");
ok(!hasAction(/Pull from GitHub/), "64.8 and offers no Pull from GitHub to recover with");

/* ── 66. the Worker is the only voice (owner ruling 2026-10-12, default 5) ──
   The sync line, the Sync panel status, "Last sync" and the staleness clock
   read the Worker. GitHub is a mirror that runs itself, so no GitHub state may
   reach the rendered text, and the last Worker agreement survives a reload. */
const WORKER_VOICE66 = /GitHub|Needs attention|Nothing has been backed up yet/;
const lastSyncVal66 = () => {
  const lab = [...document.querySelectorAll("span")].find(
    (s) => s.textContent.trim() === "Last sync"
  );
  return lab?.nextElementSibling?.textContent.trim() ?? "";
};

await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  remote: AHEAD65,
  remoteKey: "github_pat_testtoken",
});
await openSync();
await settle();
ok(
  !WORKER_VOICE66.test(text()),
  "66.1 with GitHub ahead and a key set, no rendered text names GitHub, Needs attention or Nothing has been backed up yet"
);

await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  remote: OTHER_DEVICE,
  syncAdapter: true,
  syncKey: "device-66-key",
});
await openSync();
await settle();
ok(
  !/GitHub|Nothing has been backed up yet/.test(text()),
  "66.2 a Worker key that has never agreed shows no GitHub word and no Nothing has been backed up yet"
);

/* 66a. Rendered text, not textContent: each text node is joined with a space, so
   two labels side by side cannot run together and hide a word. STYLE and SCRIPT
   are not rendered. The words are the owner's list, exactly as ruled. "Merges"
   is not on the list, so a local verb passes. */
const NO_GITHUB_WORDS66 = /\bgithub\b|\bpush(es|ed|ing)?\b|\bpull(s|ed|ing)?\b|\brepo(s|sitor(y|ies))?\b|\btokens?\b|your key/i;
/* the guard must catch every word form, and must let a local verb through */
for (const w of ["repo", "repos", "repository", "repositories"])
  ok(NO_GITHUB_WORDS66.test(w), `66a.0 the guard catches "${w}"`);
ok(!NO_GITHUB_WORDS66.test("Merges"), "66a.0b the guard lets Merges through");
const renderedText66 = () => {
  const walker = document.createTreeWalker(document.body, win.NodeFilter.SHOW_TEXT);
  const parts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const tag = n.parentElement?.tagName;
    if (tag !== "STYLE" && tag !== "SCRIPT") parts.push(n.nodeValue);
  }
  return parts.join(" ");
};
const guardWords66 = (label) => {
  const hit = renderedText66().match(NO_GITHUB_WORDS66);
  eq(hit ? hit[0] : null, null, `${label}: no rendered text names GitHub, Push, Pull, a repo or your key`);
};
const panelOpen66 = () => cell(/^Sync/)?.getAttribute("aria-expanded") === "true";
/* the same options the Last sync row formats with */
const fmt66 = (t) =>
  new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const GH66 = "github_pat_testtoken";
const KEY66 = "device-66-key";

/* 66.5 keyless: no GitHub key, no Worker key. The sync-key line is the entrance. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, { syncAdapter: true, remote: AHEAD65 });
ok(/no sync key/.test(text()), "66.5pre a keyless device shows the sync-key line");
await openSync();
await settle();
ok(panelOpen66(), "66.5pre2 the Sync panel is open");
guardWords66("66.5 keyless");

/* 66.6 Worker-keyed and healthy: the Worker has agreed, GitHub is ahead */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  remote: AHEAD65,
  remoteKey: GH66,
  syncAdapter: true,
  syncKey: KEY66,
});
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
await openSync();
await settle();
ok(panelOpen66(), "66.6pre the Sync panel is open");
ok(/Connected/.test(text()), "66.6pre2 the Worker reads Connected");
ok(lastSyncVal66() !== "" && lastSyncVal66() !== "Not yet", "66.6pre3 and the Worker has agreed");
guardWords66("66.6 Worker-keyed healthy");

/* 66.7 Worker failing: the cold-open reply never arrives */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  syncAdapter: true,
  syncKey: KEY66,
  syncNetFail: true,
});
await openSync();
await settle();
ok(panelOpen66(), "66.7pre the Sync panel is open");
ok(/could not be reached/i.test(text()), "66.7pre2 the Worker cannot be reached, and the page says so");
guardWords66("66.7 Worker failing");

/* 66.8 photos: 26 queued, one batch of 25 per tap (PHOTO_BATCH) */
const MANY66 = Array.from({ length: 26 }, (_, i) => `pho-m${i}`);
await boot(withPhoto(MANY66), MANY66.map((id, i) => [id, jpegOf(i + 1)]), { remoteKey: GH66 });
await background();
await drain();
await sleep(60);
eq(
  remote.calls.filter((c) => c.op === "pushPhoto").length,
  25,
  "66.8pre one tap sends a batch of 25 while 26 are queued"
);
await openSync();
await settle();
ok(panelOpen66(), "66.8pre2 the Sync panel is open");
guardWords66("66.8 over 25 photos queued");

/* 66.9 photo key missing: the photo repo cannot be read without a key */
await boot(withPhoto(["pho-nk"]), [["pho-nk", jpegOf(1)]], {
  remoteKey: GH66,
  photosUnknown: "no-access",
});
await background();
await drain();
await sleep(60);
await openSync();
await settle();
ok(panelOpen66(), "66.9pre the Sync panel is open");
/* The photo copy is read from the leaf elements that mention photos. A 404 on
   the photo path is not a missing key, so the line must not name one. */
const photoLeaves66 = () =>
  [...document.querySelectorAll("body *")]
    .filter((el) => el.children.length === 0 && /photo/i.test(el.textContent))
    .map((el) => el.textContent)
    .join(" | ");
ok(photoLeaves66() !== "", "66.9pre3 a photo line is rendered");
ok(
  /photos?[^|]*(could not|couldn.t|didn.t) sync/i.test(photoLeaves66()),
  "66.9pre2 the photo line says photos could not sync"
);
ok(
  !/\b(keys?|tokens?|credentials?|passwords?|sign.?in)\b/i.test(photoLeaves66()),
  "66.9 and the photo line names no credential"
);
guardWords66("66.9 photo path 404");

/* 66.4 the last Worker agreement survives a reload, and a boot-time reply that
   fails cannot replace it. The agreement is written by a real session first. */
await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
  syncAdapter: true,
  syncKey: KEY66,
});
await backgroundFor(5 * 60_000);
await drain();
await sleep(SAVE_WAIT);
await openSync();
await settle();
const agreedBefore = lastSyncVal66();
ok(agreedBefore !== "", "66.3 the Sync panel shows Last sync once the Worker has agreed");
ok(typeof saved().workerSyncedAt === "number", "66.4pre the saved ledger holds the Worker agreement time");

/* A distinct, older time. Had the boot re-agreed, Last sync would show today's
   date, and a same-minute match could not tell the two apart. */
const OLD66 = Date.parse("2026-10-09T08:15:00Z");
await boot({ ...saved(), workerSyncedAt: OLD66 }, null, {
  syncAdapter: true,
  syncKey: KEY66,
  syncNetFail: true,
});
await openSync();
await settle();
eq(
  lastSyncVal66(),
  fmt66(OLD66),
  "66.4 after a reload whose Worker reply fails, Last sync still shows the saved Worker agreement"
);

/* Groups 67 to 69 wait out the idle apply gate, the retry backoff and the cold-open POST
   delay, so they run on the virtual clock too. Removed after group 69. */
installClock();

/* ── 67. owner ruling 2026-10-12 ("Keep a copy, then go on"): a damaged list is mended
   and kept, never refused. Refused only when the saved text is not JSON or the copy
   cannot be written (the orchestrator defaults of 2026-10-12, not owner rulings). ──
   Damage is a received, receivedAt, stamps or envelopes value of the wrong shape. It is
   entry-level (one entry that is not the right kind) or whole-field (the field itself is
   not an object, or not a list for envelopes). JSON null counts as damaged. An absent
   field is not damage.
   On every path the data comes in (load, Re-import, a sync reply):
     1. the data as it came in is saved to History as a milestone, before any save;
     2. every entry that can be read is kept, and only the broken ones are dropped;
     3. one plain line says how many entries could not be read, and where the original is.
   The app keeps working: a check-in can be made and saved.
   Records: native-ledger-is-raw-json, saved-state-shape, milestones-taken-before-risk,
   every-restore-passes-applybackup, recovery-control-not-state-gated. */
const NOTICE67 = /(?:(\d+) entr(?:y|ies) )?could not be read; the original is in History/;
const FALLBACK67 = /Your saved ledger is damaged and was not loaded/;
const KEY67 = "device-67-key";
const GH67 = "github_pat_testtoken";
const MILESTONE67 = "before reset";
const VER67_TEXT = JSON.stringify({
  mailday: 1,
  items: ITEMS,
  received: {},
  receivedAt: {},
  envelopes: [],
  stamps: {},
});
const VERS67 = () => [
  [
    "ver-67",
    {
      meta: {
        id: "ver-67",
        at: Date.now() - 3600_000,
        label: MILESTONE67,
        kind: "milestone",
        lines: 3,
        checked: 0,
        bytes: VER67_TEXT.length,
      },
      text: VER67_TEXT,
    },
  ],
];
const GOOD67 = { mailday: 1, items: ITEMS, received: {}, receivedAt: {}, envelopes: [], stamps: {} };
const FIELDS67 = ["received", "receivedAt", "stamps", "envelopes"];
/* Item keys by position. Alpha Cards holds 0 to 2, so the check-in below (Alpha's
   "Mark all received") leaves the broken keys in Gamma (9, 10) and the good key in
   Delta (11) alone. */
const K67 = ITEMS.map((it) => it.key);
const GK67_C = "C1::Gamma Cards";
const GK67_D = "D1::Delta Cards";
const STAMP67 = { kind: "claim", at: "2026-10-01", note: "", updatedAt: 1 };
const ENV67 = (id) => ({
  id,
  createdAt: 1,
  note: "",
  entries: [{ name: "Brainstorm", qty: 1 }],
  photos: [],
  updatedAt: 1,
});
const RAW67 = '{"mailday":1,"items":[';
const isObj67 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
/* canonical JSON, so key order does not decide whether two copies are the same */
const canon67 = (v) =>
  JSON.stringify(v, (_, x) =>
    isObj67(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x
  );
/* a version of kind milestone whose text is `want` once parsed */
const milestoneHolds67 = (want) =>
  [...versionStore.values()].some((v) => {
    if (v.meta.kind !== "milestone") return false;
    try {
      return canon67(JSON.parse(v.text)) === canon67(want);
    } catch {
      return false;
    }
  });
const noticeMatch67 = () => text().match(NOTICE67);
const noticeLines67 = () => (text().match(/could not be read/g) || []).length;
const numbersOnly67 = (m) => Object.values(m || {}).every((v) => typeof v === "number");
/* the saved ledger is whole after a save: the right shapes, and every item still there */
const sane67 = (s) =>
  s.items?.length === ITEMS.length &&
  numbersOnly67(s.received) &&
  numbersOnly67(s.receivedAt) &&
  isObj67(s.stamps) &&
  Object.values(s.stamps).every(isObj67) &&
  Array.isArray(s.envelopes) &&
  /* an envelope is an object with a string id: a string or a list coerced into an object is junk */
  s.envelopes.every((e) => isObj67(e) && typeof e.id === "string");
/* the check-in a mail day makes: Alpha Cards, the first package */
const checkInAlpha67 = async () => {
  await goTo("packages");
  await click(inCard(card(/Alpha Cards/), /^Mark all received$/), "check the Alpha Cards package in");
  await settle();
  await sleep(SAVE_WAIT);
};
/* the broken entries, per field, and what the good ones must still say after a save */
const ENTRY67 = [
  {
    field: "received",
    value: { [K67[11]]: 1, [K67[9]]: null, [K67[10]]: "x" },
    n: 2,
    kept: (s) => s.received?.[K67[11]] === 1,
  },
  {
    field: "receivedAt",
    value: { [K67[11]]: 1000, [K67[10]]: "x" },
    n: 1,
    kept: (s) => s.receivedAt?.[K67[11]] === 1000,
  },
  {
    field: "stamps",
    value: { [GK67_D]: STAMP67, [GK67_C]: "x" },
    n: 1,
    kept: (s) => canon67(s.stamps?.[GK67_D]) === canon67(STAMP67),
  },
  {
    field: "envelopes",
    value: [ENV67("env-keep"), "x", [1], null],
    n: 3,
    kept: (s) => s.envelopes?.length === 1 && s.envelopes[0].id === "env-keep",
  },
];
/* whole-field damage: the field itself has the wrong shape, so no entry is kept from it */
const WHOLE67 = [
  ["received", ["x"]],
  ["received", null],
  ["receivedAt", 7],
  ["stamps", []],
  ["envelopes", {}],
  ["envelopes", null],
];
/* the field value as the saved text holds it, with one good and one broken entry */
const withField67 = (field, value) => ({ ...GOOD67, [field]: value });

/* ---- load: the saved text is read at mount ---- */
const loadCase67 = async (label, seeded, n, kept) => {
  await boot(seeded, null, { versions: VERS67(), syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  /* the background cycles that could write the damaged text back run here, as group 66 drives them */
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  const m = noticeMatch67();
  ok(!!m, `${label}: one plain line says entries could not be read, and the original is in History`);
  if (n != null) eq(m?.[1], String(n), `${label}: the line counts the entries it dropped`);
  eq(noticeLines67(), 1, `${label}: the notice is one line`);
  ok(milestoneHolds67(seeded), `${label}: the original is held in History as a milestone`);
  ok(!FALLBACK67.test(text()), `${label}: the page is not refused`);
  await checkInAlpha67();
  ok(kept(saved()) && sane67(saved()), `${label}: after a check-in the good entries are kept, the broken ones are gone`);
};

for (const c of ENTRY67) {
  const label = `67 load ${c.field} with broken entries`;
  try {
    await loadCase67(label, withField67(c.field, c.value), c.n, c.kept);
  } catch (e) {
    ok(false, `${label} threw: ${e.message}`);
  }
}
for (const [field, value] of WHOLE67) {
  const label = `67 load ${field}=${JSON.stringify(value)} (whole field)`;
  try {
    await loadCase67(label, withField67(field, value), null, sane67);
  } catch (e) {
    ok(false, `${label} threw: ${e.message}`);
  }
}

/* An absent field is not damage. Each one, and all four together, loads with no notice. */
for (const field of [...FIELDS67, "all four"]) {
  const label = `67 ${field} absent`;
  const state = { ...GOOD67 };
  if (field === "all four") for (const k of FIELDS67) delete state[k];
  else delete state[field];
  try {
    await boot(state, null, { versions: VERS67() });
    await sleep(SAVE_WAIT);
    ok(!/could not be read|damaged/.test(text()), `${label}: loads with no notice and no refusal`);
    ok(text().includes(ITEMS[0].name), `${label}: the items still show`);
  } catch (e) {
    ok(false, `${label} threw: ${e.message}`);
  }
}

/* ---- Re-import: a backup file goes through applyBackup ---- */
const reimport67 = async (label, payload, n) => {
  await boot({ ...GOOD67, items: ITEMS.slice(0, 3) }, null, {
    versions: VERS67(),
    syncAdapter: true,
    syncKey: KEY67,
    remoteKey: GH67,
  });
  await sleep(SAVE_WAIT);
  await reachFor(/Re-import CSV/);
  await click(btn(/Re-import CSV/), "show upload zone");
  await dropFile("mailday-backup.json", JSON.stringify(payload));
  await sleep(SAVE_WAIT);
  const m = noticeMatch67();
  ok(!!m, `${label}: one plain line says entries could not be read, and the original is in History`);
  if (n != null) eq(m?.[1], String(n), `${label}: the line counts the entries it dropped`);
  eq(noticeLines67(), 1, `${label}: the notice is one line`);
  ok(milestoneHolds67(payload), `${label}: the file as it came in is held in History as a milestone`);
  eq(saved().items?.length, ITEMS.length, `${label}: the Re-import lands its items`);
  await checkInAlpha67();
  ok(sane67(saved()), `${label}: after a check-in the saved ledger is whole`);
};
for (const c of ENTRY67) {
  const label = `67 Re-import ${c.field} with broken entries`;
  try {
    await reimport67(label, { ...withField67(c.field, c.value), items: ITEMS }, c.n);
  } catch (e) {
    ok(false, `${label} threw: ${e.message}`);
  }
}
try {
  await reimport67("67 Re-import received=null (whole field)", { ...withField67("received", null), items: ITEMS }, null);
} catch (e) {
  ok(false, `67 Re-import received=null threw: ${e.message}`);
}

/* ---- a sync reply: the Worker's GET is applied after the idle wait ---- */
const sync67 = async (label, incoming, n) => {
  await boot({ ...GOOD67, items: ITEMS.slice(0, 3) }, null, { noRemote: true, syncKey: KEY67 });
  await settle();
  await pageshow();
  await sleep(APPLY_WAIT);
  await fireSyncRev(2, incoming);
  await sleep(APPLY_WAIT + 1000);
  const m = noticeMatch67();
  ok(!!m, `${label}: one plain line says entries could not be read, and the original is in History`);
  if (n != null) eq(m?.[1], String(n), `${label}: the line counts the entries it dropped`);
  eq(noticeLines67(), 1, `${label}: the notice is one line`);
  ok(milestoneHolds67(incoming), `${label}: the reply as it came in is held in History as a milestone`);
  eq(saved().items?.length, ITEMS.length, `${label}: the reply's items merge in`);
  await checkInAlpha67();
  ok(sane67(saved()), `${label}: after a check-in the saved ledger is whole`);
};
for (const c of ENTRY67.filter((c) => c.field === "received" || c.field === "envelopes")) {
  const label = `67 sync reply ${c.field} with broken entries`;
  try {
    await sync67(label, { ...withField67(c.field, c.value), items: ITEMS }, c.n);
  } catch (e) {
    ok(false, `${label} threw: ${e.message}`);
  }
}

/* ---- fallback 1: the milestone cannot be written, so the load is refused as before ---- */
try {
  const seeded = withField67("received", { [K67[11]]: 1, [K67[10]]: "x" });
  await boot(seeded, null, { versions: VERS67(), failPut: true, syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  ok(FALLBACK67.test(text()), "67.F1 a milestone that cannot be written refuses the load and says the data is damaged");
  eq(savedText(), JSON.stringify(seeded), "67.F1a the saved text is not changed");
  eq(postCount(), 0, "67.F1b no Worker push starts");
  eq(pushes().length, 0, "67.F1c no GitHub push starts");
  await openHistory();
  ok(!!btn(/^Backup$/), "67.F1d History opens and Backup is reachable");
} catch (e) {
  ok(false, `67.F1 threw: ${e.message}`);
}

/* ---- fallback 2: the saved text is not JSON, so the load is refused and nothing is overwritten ---- */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  ok(FALLBACK67.test(text()), "67.F2 a saved text that is not JSON refuses the load and says the data is damaged");
  eq(savedText(), RAW67, "67.F2a the raw text is kept byte for byte");
  eq(postCount(), 0, "67.F2b no Worker push starts");
  eq(pushes().length, 0, "67.F2c no GitHub push starts");
  await openHistory();
  ok(!!btn(/^Backup$/), "67.F2d History opens and Backup is reachable");
} catch (e) {
  ok(false, `67.F2 threw: ${e.message}`);
}

/* ---- fallback 2 across the sync rev: a reply that arrives and then idles must not overwrite the refused text ---- */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), syncAdapter: true, syncKey: KEY67 });
  await settle();
  await pageshow();
  await sleep(APPLY_WAIT);
  await fireSyncRev(2, { ...GOOD67, items: ITEMS.slice(0, 4) });
  await sleep(APPLY_WAIT + 1000);
  eq(savedText(), RAW67, "67.F3 a sync reply that arrives and then idles does not overwrite the refused text");
  ok(FALLBACK67.test(text()), "67.F3a the refusal still shows");
} catch (e) {
  ok(false, `67.F3 threw: ${e.message}`);
}

/* ---- a History restore from a refused load lands, and clears the refusal ---- */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), syncAdapter: true, syncKey: KEY67 });
  await sleep(SAVE_WAIT);
  await openHistory();
  await click(btn(new RegExp(MILESTONE67)), "expand the milestone");
  await click(btn(/Restore this version/), "arm restore");
  if (btn(/Tap again to replace/)) await click(btn(/Tap again to replace/), "confirm restore");
  await settle();
  await sleep(SAVE_WAIT);
  eq(saved().items?.length, ITEMS.length, "67.7 a History restore from a refused load brings the version's items back");
  ok(!FALLBACK67.test(text()), "67.7a and the refusal clears");
} catch (e) {
  ok(false, `67.7 threw: ${e.message}`);
}

/* ── 68. Refused loads, and the copy that comes before a refusal changes anything ──
   Owner ruling 2026-10-12, "Keep a copy, then go on". Four gaps the build left open.
   Each case is red on the head it was written against. Records: saved-state-shape,
   native-ledger-is-raw-json, milestones-taken-before-risk. */
const KEY68 = "device-68-key";
const COPY68 = /A copy of that file could not be saved to History, so nothing was changed\./;
const NOT_BACKUP68 = /isn[’']t a Mail Day backup/;

/* 68.1 a file restore from a refused load: when the raw text cannot be copied, the restore changes nothing. */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), failPut: true, syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await sleep(SAVE_WAIT);
  ok(FALLBACK67.test(text()), "68.1pre the load is refused, so the restore case means something");
  await reachFor(/Re-import CSV/);
  await click(btn(/Re-import CSV/), "show upload zone on a refused load");
  ok(!!document.querySelector('div[style*="dashed"]'), "68.1pre2 the upload zone is open on a refused load");
  await dropFile("mailday-backup.json", JSON.stringify({ ...GOOD67, items: ITEMS.slice(0, 3) }));
  await sleep(SAVE_WAIT);
  eq(savedText(), RAW67, "68.1 a file restore whose copy of the refused text fails changes nothing: the raw text is kept byte for byte");
  ok(FALLBACK67.test(text()), "68.1a and the refusal still holds");
} catch (e) {
  ok(false, `68.1 threw: ${e.message}`);
}

/* 68.1b a History restore from a refused load: the same rule. */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), failPut: true, syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await sleep(SAVE_WAIT);
  ok(FALLBACK67.test(text()), "68.1bpre the load is refused, so the History case means something");
  await openHistory();
  await click(btn(new RegExp(MILESTONE67)), "expand the milestone");
  await click(btn(/Restore this version/), "arm restore on a refused load");
  if (btn(/Tap again to replace/)) await click(btn(/Tap again to replace/), "confirm restore");
  await settle();
  await sleep(SAVE_WAIT);
  eq(savedText(), RAW67, "68.1b a History restore whose copy of the refused text fails changes nothing");
  ok(FALLBACK67.test(text()), "68.1c and the refusal still holds");
} catch (e) {
  ok(false, `68.1b threw: ${e.message}`);
}

/* 68.2 a re-import of a damaged file whose copy cannot be saved: the message is the copy's, not "not a backup". */
try {
  const before68 = { ...GOOD67, items: ITEMS.slice(0, 3) };
  await boot(before68, null, { versions: VERS67(), failPut: true, syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await sleep(SAVE_WAIT);
  const savedBefore68 = savedText();
  await reachFor(/Re-import CSV/);
  await click(btn(/Re-import CSV/), "show upload zone");
  await dropFile("mailday-backup.json", JSON.stringify({ ...withField67("received", "x"), items: ITEMS }));
  await sleep(SAVE_WAIT);
  ok(!NOT_BACKUP68.test(text()), "68.2 a damaged file whose copy cannot be saved is not called “not a Mail Day backup”");
  ok(COPY68.test(text()), "68.2a the line says a copy could not be saved, and nothing was changed");
  eq(savedText(), savedBefore68, "68.2b the saved text is unchanged");
} catch (e) {
  ok(false, `68.2 threw: ${e.message}`);
}

/* 68.3 saved text that is valid JSON but not an object is not usable: refuse, keep it as it is. */
for (const raw of ["null", "5", "[]"]) {
  const label = `68.3 saved text ${raw}`;
  try {
    await boot(null, null, { raw, versions: VERS67(), syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
    await backgroundFor(5 * 60_000);
    await drain();
    await sleep(SAVE_WAIT);
    ok(FALLBACK67.test(text()), `${label}: is refused and says the data is damaged`);
    eq(savedText(), raw, `${label}: the saved text is kept as it is`);
    eq(postCount(), 0, `${label}: no Worker push starts`);
    await openHistory();
    ok(!!btn(/^Backup$/), `${label}: History opens and Backup is reachable`);
  } catch (e) {
    ok(false, `${label} threw: ${e.message}`);
  }
}

/* 68.4 the rules: a 400 is its own status, not unknown and not ok. */
ok(sr("syncStatus", 400) !== "unknown" && sr("syncStatus", 400) !== "ok", "68.4 a 400 is its own status, not unknown and not ok");

/* 68.5 a 400 from the Worker is a bad shape: no retry on backoff, and one plain line. A 5xx still retries (56.1). */
try {
  await boot({ items: ITEMS, received: {} }, null, { syncKey: KEY68 });
  await settle();
  setSyncBadShape(true);
  try {
    await click(btn(/Mark all received/), "check in, so a POST is refused as a bad shape");
    await sleep(POST_WAIT);
    ok(syncBadShapeCount() > 0, "68.5pre a POST was refused with a 400, so the rest means something");
    const posts68 = postCount();
    await sleep(8000);
    eq(postCount(), posts68, "68.5a no retry follows a 400: the POST count does not grow while the device waits");
    const line68 = advisory();
    eq(line68, "The sync server refused this ledger’s shape, so it is not backed up.", "68.5b the 400 shows its exact line: it names the refusal and offers no fix it does not have");
  } finally {
    setSyncBadShape(false);
  }
} catch (e) {
  ok(false, `68.5 threw: ${e.message}`);
}

/* 68.6 F1: a sync reply that holds damage, whose copy cannot be written to History. The damaged
   reply is not applied, and sends go on: the Worker keeps its own copy of the damaged original,
   and its clean reply to the send is what applies. */
try {
  const local68 = { ...GOOD67, items: ITEMS.slice(0, 3) };
  await boot(local68, null, {
    versions: VERS67(),
    failPut: true,
    syncAdapter: true,
    syncKey: KEY68,
    syncLedger: withField67("received", ["x"]),
  });
  await sleep(SAVE_WAIT);
  const saved68 = savedText();
  ok(syncCalls().some((c) => c.op === "get"), "68.6pre the device read the damaged reply, so the rest means something");
  ok(JSON.parse(saved68).items.length === 3, "68.6pre the damaged reply was not applied before its copy: the saved text still holds the local three items");
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  ok(postCount() > 0, "68.6 a damaged reply whose copy cannot be saved does not stop sends: the device POSTs, and the Worker keeps its own copy");
  const after68 = JSON.parse(savedText());
  ok(after68.received !== null && typeof after68.received === "object" && !Array.isArray(after68.received), "68.6a the Worker's reply is clean: the saved received is an object, not the damaged array");
  ok(after68.items.length > 3, "68.6a the clean merged reply applies: the saved text carries the Worker's items, not only the local three");
} catch (e) {
  ok(false, `68.6 threw: ${e.message}`);
}

/* 68.6b the same damaged reply, then a check-in: the check-in still POSTs while the copy is
   missing. No send path is gated on the copy. */
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    versions: VERS67(),
    failPut: true,
    syncAdapter: true,
    syncKey: KEY68,
    syncLedger: withField67("received", ["x"]),
  });
  await sleep(SAVE_WAIT);
  const posts68b0 = postCount();
  await click(btn(/Mark all received/), "check in while the damaged copy is missing");
  await sleep(POST_WAIT);
  await foreground();
  await drain();
  await sleep(POST_WAIT);
  ok(postCount() > posts68b0, "68.6b a check-in while the copy of a damaged reply is missing still POSTs");
} catch (e) {
  ok(false, `68.6b threw: ${e.message}`);
}

/* 68.7 F3: a History restore from a refused load whose copy cannot be written says the copy
   failed, the same line Re-import gives, and does not call the version corrupt. */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), failPut: true, syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await sleep(SAVE_WAIT);
  ok(FALLBACK67.test(text()), "68.7pre the load is refused, so the restore case means something");
  await openHistory();
  await click(btn(new RegExp(MILESTONE67)), "expand the milestone");
  await click(btn(/Restore this version/), "arm restore on a refused load");
  if (btn(/Tap again to replace/)) await click(btn(/Tap again to replace/), "confirm restore");
  await settle();
  await sleep(SAVE_WAIT);
  ok(COPY68.test(text()), "68.7 a History restore whose copy cannot be saved shows the copy-failed line");
  ok(!/looks corrupt/.test(text()), "68.7a the restore does not call the version corrupt");
  eq(savedText(), RAW67, "68.7b a History restore whose copy fails changes nothing");
} catch (e) {
  ok(false, `68.7 threw: ${e.message}`);
}

/* 68.8 F3, the branch's own history: an older version restored from a refused load whose
   copy cannot be written says the copy failed, not that the version is corrupt. */
try {
  await boot(null, null, { raw: RAW67, versions: VERS67(), failPut: true, syncAdapter: true, syncKey: KEY67, remoteKey: GH67 });
  await sleep(SAVE_WAIT);
  ok(FALLBACK67.test(text()), "68.8pre the load is refused, so the branch restore case means something");
  const H68 = "ledger: good version, from the branch";
  remote.history.push({ sha: "sha-68-branch", at: Date.now() - 3600_000, message: H68, text: VER67_TEXT });
  await openHistory();
  await click(btn(/Load older versions/), "ask for the branch's versions");
  await settle();
  await click(buttons().find((b) => b.textContent.includes(H68)), "expand the branch version");
  await click(btn(/Restore this version/), "arm restore of the branch version");
  if (btn(/Tap again to replace/)) await click(btn(/Tap again to replace/), "confirm restore");
  await settle();
  await sleep(SAVE_WAIT);
  ok(COPY68.test(text()), "68.8 a branch restore whose copy cannot be saved shows the copy-failed line");
  ok(!/looks corrupt/.test(text()), "68.8a the branch restore does not call the version corrupt");
  eq(savedText(), RAW67, "68.8b a branch restore whose copy fails changes nothing");
} catch (e) {
  ok(false, `68.8 threw: ${e.message}`);
}

/* 68.9 F1: a Worker copy that cannot be saved, then the device retries with a POST. A GitHub
   conflict on a mirror push merges, then calls the Worker directly. That call goes: a copy that
   cannot be saved never holds the send. */
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    versions: VERS67(),
    failPut: true,
    syncAdapter: true,
    syncKey: KEY68,
    remoteKey: GH67,
    remote: VER67_TEXT,
    syncLedger: withField67("received", ["x"]),
  });
  await sleep(SAVE_WAIT);
  clearSyncStore();
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  ok(postCount() > 0, "68.9pre the retry after the failed copy was a POST, not a read: the copy gate is past");
  const posts68b = postCount();
  const pushes68b = remote.calls.filter((c) => c.op === "push").length;
  await click(btn(/Mark all received/), "check in on the mirror");
  await sleep(POST_WAIT);
  await background();
  await drain();
  await sleep(POST_WAIT);
  ok(remote.calls.filter((c) => c.op === "push").length > pushes68b, "68.9pre the mirror pushed to GitHub, so the conflict path runs");
  ok(postCount() > posts68b, "68.9 a GitHub conflict on a mirror push still POSTs to the Worker while the copy is missing");
} catch (e) {
  ok(false, `68.9 threw: ${e.message}`);
}

/* 68.10a F3: a Worker copy that cannot be saved, then the Worker store is emptied. An empty
   store is healthy, so the next edit POSTs. A copy that cannot be saved never holds sends. */
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    versions: VERS67(),
    failPut: true,
    syncAdapter: true,
    syncKey: KEY68,
    syncLedger: withField67("received", ["x"]),
  });
  await sleep(SAVE_WAIT);
  clearSyncStore();
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  ok(postCount() > 0, "68.10pre the retry after the failed copy was a POST, not a read: the copy gate is past");
  const posts10a = postCount();
  await click(btn(/Mark all received/), "check in with the store emptied");
  await sleep(POST_WAIT);
  ok(postCount() > posts10a, "68.10a with the store emptied, the next edit POSTs: a failed copy never holds sends");
} catch (e) {
  ok(false, `68.10a threw: ${e.message}`);
}

/* 68.10b F3: a Worker copy that cannot be saved, then a new sync key is saved while the Worker
   cannot be read. The next retry POSTs: a failed copy never holds sends, with or without a key save. */
const KEY68B = "device-68-key-b";
try {
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    versions: VERS67(),
    failPut: true,
    syncAdapter: true,
    syncKey: KEY68,
    syncLedger: withField67("received", ["x"]),
  });
  await sleep(SAVE_WAIT);
  ok(syncCalls().some((c) => c.op === "get"), "68.10bpre the cold read was made, so the copy failure is in place");
  setSyncNetFail(true);
  await openSync();
  await settle();
  const gets10b = syncCalls().filter((c) => c.op === "get").length;
  await type(document.querySelector('input[aria-label="Sync key"]'), KEY68B);
  await click(btn(/^Save sync key$/), "save a new sync key");
  await sleep(SAVE_WAIT);
  ok(syncCalls().filter((c) => c.op === "get").length > gets10b, "68.10bpre the save read the Worker again");
  const posts10b = postCount();
  await backgroundFor(5 * 60_000);
  await drain();
  await sleep(SAVE_WAIT);
  setSyncNetFail(false);
  ok(postCount() > posts10b, "68.10b after a new sync key is saved, the retry POSTs: a failed copy never holds sends");
} catch (e) {
  ok(false, `68.10b threw: ${e.message}`);
}

/* 69.1 P2. A cold open that owes the Worker its check-ins arms a POST for
   SYNC_COLD_POST_MS. An unmount before that moment cancels it. The control
   shows the POST fires when nothing unmounts, so the unmounted case means something. */
const KEY69 = "device-69-key";
const COLD69 = { mailday: 1, items: ITEMS.slice(0, 3), received: {}, envelopes: [] };
const HELD69 = { "C1|3|pPonder": 1 };
try {
  await boot({ items: ITEMS.slice(0, 3), received: HELD69 }, null, {
    noRemote: true,
    syncKey: KEY69,
    syncLedger: COLD69,
  });
  await sleep(SR.SYNC_COLD_POST_MS + 500);
  ok(postCount() > 0, "69.1a0 the control: with no unmount, the cold open POSTs the check-ins it holds");
} catch (e) {
  ok(false, `69.1a0 threw: ${e.message}`);
}
try {
  await boot({ items: ITEMS.slice(0, 3), received: HELD69 }, null, {
    noRemote: true,
    syncKey: KEY69,
    syncLedger: COLD69,
  });
  await sleep(50);
  ok(syncCalls().some((c) => c.op === "get"), "69.1b0 the cold GET was made, so the POST timer is armed");
  /* the next mount holds the same key and nothing the server lacks, so it sends
     nothing of its own: any POST it sees came from the first mount's timer */
  await boot({ items: ITEMS.slice(0, 3), received: {} }, null, {
    noRemote: true,
    syncKey: KEY69,
    syncLedger: COLD69,
  });
  await sleep(SR.SYNC_COLD_POST_MS + 500);
  eq(postCount(), 0, "69.1b an unmount before the cold-open POST is due cancels it");
} catch (e) {
  ok(false, `69.1b threw: ${e.message}`);
}

/* 69.2 P2. The cold-open GET is still out when the app unmounts. The cleanup has already
   run, so there is no POST timer for it to clear. When the GET settles, the cold path
   arms one anyway, and that POST fires from an unmounted app. The control holds the same
   GET with no unmount: its release arms the POST, so the held GET is a real cold open. */
try {
  await boot({ items: ITEMS.slice(0, 3), received: HELD69 }, null, {
    noRemote: true,
    syncKey: KEY69,
    syncLedger: COLD69,
    holdGet: true,
  });
  await sleep(50);
  ok(syncCalls().some((c) => c.op === "get"), "69.2a0 the cold GET is out and held");
  releaseSyncGet();
  await sleep(SR.SYNC_COLD_POST_MS + 500);
  ok(postCount() > 0, "69.2a0 the control: a held GET released with no unmount still POSTs");
} catch (e) {
  ok(false, `69.2a0 threw: ${e.message}`);
}
try {
  await boot({ items: ITEMS.slice(0, 3), received: HELD69 }, null, {
    noRemote: true,
    syncKey: KEY69,
    syncLedger: COLD69,
    holdGet: true,
  });
  await sleep(50);
  ok(syncCalls().some((c) => c.op === "get"), "69.2a0b the cold GET is out and held before the unmount");
  await unmountApp();
  releaseSyncGet();
  await sleep(SR.SYNC_COLD_POST_MS + 500);
  eq(postCount(), 0, "69.2a an unmount while the cold GET is out arms no POST when the reply lands");
} catch (e) {
  ok(false, `69.2a threw: ${e.message}`);
}

/* ── 70. L7 semantics (ux-house-rules-govern, L7). A control's accessible name reads
   as its visible label does, the photo viewer is a modal dialog that focus enters and
   Escape leaves, and a disabled control says why, through aria-describedby. ── */
const navTab = (re) =>
  [...document.querySelectorAll('nav[aria-label="Views"] button')].find((b) =>
    re.test(b.textContent.trim())
  );
/* the accessible name, approximated: aria-label when set, else the text in reading order */
const accName = (el) => (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();

try {
  await boot({
    items: ITEMS,
    received: {},
    envelopes: [
      { id: "env-70", createdAt: Date.parse("2026-08-01"), note: "", photos: [], entries: [{ name: "Ponder", qty: 1 }] },
    ],
  });
  await sleep(50);
  const tabs = [...document.querySelectorAll('nav[aria-label="Views"] button')];
  eq(tabs.length, 4, "70.1a the bar holds four tabs");
  for (const t of tabs) {
    const label = [...t.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join("")
      .trim();
    const badge = t.querySelector("b")?.textContent.trim() || "";
    /* the count is a visible badge, so its name is a word of its own after the label */
    const want = badge ? `${label} ${badge}` : label;
    eq(accName(t), want, `70.1 the ${label} tab is named as it reads, a count as its own word`);
  }
  await click(navTab(/^Ledger/), "Ledger tab");
  const rows = [...document.querySelectorAll("button.mdl-lrow")];
  ok(rows.length > 0, "70.2a the Ledger tab has rows to name");
  for (const r of rows) {
    const label = (r.querySelector(".t")?.textContent || "").trim();
    ok(label && accName(r).startsWith(label), `70.2 the Ledger row "${label}" is named by its label`);
  }
} catch (e) {
  ok(false, `70.1 threw: ${e.message}`);
}

try {
  await boot(
    {
      items: ITEMS,
      received: {},
      envelopes: [
        { id: "env-70p", createdAt: Date.parse("2026-08-01"), note: "", photos: ["pho-70"], entries: [{ name: "Ponder", qty: 1 }] },
      ],
    },
    [["pho-70", jpeg()]]
  );
  await goTo("orphaned");
  await sleep(60);
  const thumb = document.querySelector('button[aria-label="View photo"]');
  ok(!!thumb, "70.3a0 the envelope shows its photo thumbnail");
  thumb?.focus();
  await click(thumb, "View photo");
  await sleep(60);
  const img = document.querySelector('img[alt="Envelope photo"]');
  ok(!!img, "70.3a0 a tap on the thumbnail opens the photo");
  const dlg = img?.closest('[role="dialog"]');
  ok(!!dlg, "70.3a the photo viewer is a role dialog");
  ok(dlg?.getAttribute("aria-modal") === "true", "70.3b and it is aria-modal");
  ok(!!dlg && dlg.contains(document.activeElement), "70.3c focus moves into the viewer when it opens");
  await act(async () => {
    (document.activeElement || document.body).dispatchEvent(
      new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
  });
  await sleep(30);
  ok(!document.querySelector('img[alt="Envelope photo"]'), "70.3d Escape closes the viewer");
  ok(
    !document.querySelector('img[alt="Envelope photo"]') && document.activeElement === thumb,
    "70.3e and focus returns to the thumbnail that opened it"
  );
} catch (e) {
  ok(false, `70.3 threw: ${e.message}`);
}

/* a disabled control's reason: aria-describedby names an element with text */
const reasonOf = (b) =>
  (b.getAttribute("aria-describedby") || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent.trim() || "")
    .join(" ")
    .trim();
const sweepDisabled = (state) => {
  const dis = [...document.querySelectorAll("button:disabled")];
  ok(dis.length > 0, `70.4 ${state}: a disabled control is on screen to check`);
  for (const b of dis) ok(reasonOf(b).length > 0, `70.4 ${state}: the disabled "${b.textContent.trim()}" says why`);
};
try {
  await boot({ items: ITEMS, received: {}, envelopes: [] });
  await goTo("orphaned");
  await click(btn(/Record an envelope/), "new envelope");
  sweepDisabled("the envelope composer with no card");
  await goTo("packages");
  await click(btn(/^Stamp$/), "stamp the first package");
  sweepDisabled("the stamp editor with no kind");
} catch (e) {
  ok(false, `70.4 threw: ${e.message}`);
}

uninstallClock();
report();
