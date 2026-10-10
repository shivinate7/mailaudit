# What each test group covers

This file is the coverage map. It lists what each numbered test group proves, and the mutants confirmed to turn the suite red for it. Read it before you change a behaviour on purpose, to find which assertion to update.

**Holds while:** `npm test` runs `test/app.test.mjs`, which labels its assertions with their group number, such as `42.3` or `38b.4`.

## Groups 42, 43, 45 and 44 (motion and layout mechanics)

Group 42 covers the save indicator's reserved slot. It is the smallest group, and it can prove the least. The defect is a layout shift. jsdom has no layout, so no assertion in this suite can catch one. The measurements are in `masthead-the-save-slot-is-reserved`. Group 42 pins the mechanism underneath. It checks each place where that mechanism could regress without looking wrong.

42.2 covers a mistake made on the first attempt. That attempt reserved the slot's width and left the slot empty. That fixes nothing. An empty flex item is zero pixels tall. A line that holds only that item collapses. 42.3 keeps working as the app changes. It drives the store into failure, to reach the longest of the three messages. It asserts that the message fits the reserved width, counted in the `ch` that the reservation uses. So lengthening that copy without widening the slot turns the suite red, rather than quietly reintroducing the shift. Nothing here asserts that the reservation's size is right. Only a viewport can say that.

Group 43 is the joy pass. It has six assertions, not sixty, by design. Almost nothing about motion is assertable here. jsdom has no layout and no compositor. Durations, easing, distances and the no-reflow claim were settled by measuring a real 375px viewport. A test that pretended otherwise would be decoration. What remains is two claims that are behaviour. Both fail silently.

43.1–43.2 pin `data-view` on the switch. It is now the only thing that says which segment is active. The buttons stopped painting their own fill when the sliding thumb took it over. Losing the attribute leaves the app with no active-view indicator. Every button still looks correct in a DOM dump.

43.3–43.6 pin the `useJustBecame` gate. **43.4 and 43.6 are a pair.** A mutant that classes the stamp on `done` alone passes 43.4, because completing a package does land the stamp. The same mutant dies on 43.6. Every finished order would also get the stamp on every re-render. Both were confirmed to turn the suite red.

Fixture note. The first draft checked the package in under the default Showing. A completed package correctly leaves the list there. So the element under assertion left the page. The group now toggles to Everything first.

Group 45 covers a device that only merges. That device is still backed up. It has three assertions. The method note matters more than the count.

The first draft could not fail. It aged `remote.pushedAt`, called `foreground()`, and asserted. But `foreground()` re-peeks and never re-reads `status()`. So the component kept the timestamp from the earlier push, and the mutant survived all of it. `remoteInfo` is refreshed by an effect keyed on `[loaded, syncOpen]`. So the test must toggle the panel to make the device record land.

Watch for this shape in general. After you change a value the adapter owns, check that something re-reads it. Staleness measured off `pushedAt` alone kills 45.1 and 45.2. Both were mutation-confirmed.

`test/harness.mjs` needed the same correction, to prove it. `acceptPull` set `pulledAt` to the frozen `REMOTE_NOW`. That is the hole the comment two functions below already warns about for `pushedAt`. It stayed frozen because nothing read it. The day `syncBroken` read it, every merged device would have been permanently stale. The healthy state would then be unreachable from a test. When a mock's field stops being decorative, re-read the comment next to the field that already was not.

Group 44 covers the card that stops moving under the thumb. It has the same shape as group 42, and the same limit. The defect is a layout shift. jsdom has no layout, so no assertion here catches one. The numbers are in `card-the-bar-is-out-of-flow` and `card-the-action-row-is-reserved`. They were taken in a real viewport.

Group 44 pins the mechanism in each place it can regress without looking wrong in a DOM dump:

- The bar is out of flow (44.4a).
- The bar cannot take a pointer event, so it cannot eat the header tap it lies across (44.4b).
- Both cards are containing blocks for the bar (44.2, 44.7). Without one, the bar draws somewhere else on the page entirely.
- The row keeps a reservation (44.3). That reservation does not vary with the row's membership (44.4c). It does not vary with `done` either (44.6).

**44.5 is the one to keep if the group is trimmed.** It is not really a layout assertion. It says that completing a package still unmounts the bar. That gate is the whole reason the bar is out of flow, and not reserved a slot. A slot would have to stay mounted at 100%. The bar would then sheen its own completion beside `.mdl-gild`. Read a 44.5 failure as a change to the motion design. It is not a broken refactor.

Eight mutants were confirmed to turn the suite red. Three of them needed a pair to die properly:

- the bar back in flow (44.4a);
- the bar allowed to take pointer events (44.4b);
- either card losing `position: relative` (44.2, 44.7).

The other mutants are these:

- the reservation dropped altogether (44.3);
- the bar surviving completion, which is a reserved slot by another name (44.5);
- a reservation that varies by membership (44.4c);
- a reservation that varies only on the `done` branch (44.6).

44.3 cannot catch the membership mutant. A mutant that reserves *something* different in each state still reserves something. 44.4c cannot catch the `done` mutant. It compares against a rest value that the same mutant moved. So each of 44.3, 44.4c and 44.6 is alive only against the mutant that the other two miss.

## Groups 38 to 41 (saved versions, and sync running itself)

Group 38 is pure, like groups 27, 31 and 33. It imports `version-rules.mjs` directly. A pruning bug deletes the one version the user was reaching for. It leaves a list that looks healthy. Group 39 drives the app. It asserts on what a milestone holds: the ledger as it was before the operation, envelopes included. Group 40 is the resume merge. It is the behaviour with the least margin for error, because it applies a remote change with nobody watching. Group 41 reads older versions off the branch's own history. The remote mock records every push as a commit. That is the claim the feature rests on.

`test/harness.mjs` mocks `window.versions` with a `Map`. It prunes through the **real** `prunePlan`. The reason is the same as for the remote mock, which encodes through the real b64. It stores text uncompressed on purpose. Gzip is the platform layer's business. `app.jsx` never learns whether it happened. jsdom has no `CompressionStream`.

Mutation-tested, all confirmed to turn the suite red:

- the hourly tier deleted, reaching forever, or treating every record as an anchor;
- the day anchor taking a day's latest instead of its earliest;
- the recent ring keeping everything;
- day anchors reaching forever;
- `dayKey` reading UTC;
- every save earning a version;
- milestones never surviving;
- a version built from its own payload rather than `snapshot()`;
- restore firing on one tap, local or remote;
- a restore bypassing `applyBackup`;
- the History cell gated on `items.length`;
- Reset taking no milestone, or tidying the versions away;
- the resume handler reading the shared `hiddenAt`;
- the threshold dropped to 0;
- the signal never consumed;
- an unknown remote read as ahead;
- the mid-thought guard removed;
- `acceptPull` dropped from `doMerge`;
- the quiet merge announcing itself;
- `freshSession` starting false;
- the load control fetching nothing.

Four method notes are worth keeping. Each one was learned the hard way. Three of them have their own records, linked here.

- `testing-one-tier-must-not-decide-another`: group 38's own assertions were wrong four separate times, always the same way.
- **38.9's first draft could not fail at all.** `dayKey("2026-05-01T00:30")` is `"2026-05-01"` under the UTC reading too. The test now derives the boundary from the runner's own `getTimezoneOffset()`. It skips itself in UTC, where there is nothing to claim.
- `testing-an-assertion-that-throws-is-a-worse-kill`: three of group 39's mutants died by `JSON.parse(null)`. The reads are guarded now as `beforeReset && JSON.parse(...)`.
- `testing-when-a-mutant-survives-find-the-unreached-state`: group 40's mutant, "the signal is never consumed", survived the first draft. 40.12–40.13 pin it. Group 41's first draft matched `message.split(" ")[0]`.

## Groups 37, 36, 35, 33 to 34, 20, 21, 25 to 27 (feature and adapter groups)

Group 37 covers order stamps. It drives the whole feature through the DOM. It checks the two entrances, the replace-not-stack rule, and a refund leaving every count. It checks the stamped filter, which obeys Showing, Find and the range. It checks the tombstone and the five persistence sites. It imports `mergeStamps` directly for the merge rule. It ends on group 34's shape, with a removal on the other side.

Three assertions are the ones to keep if the group is trimmed.

- 37.34 edits a note under a live search. It is the only shape that catches `stamps` missing from `visible`'s dependency array. A query change re-runs the fresh closure anyway.
- 37.40 sorts a *refunded* package under Newest. Under Oldest, the `packageOrder`-from-`packages` mutant gives the right order by coincidence.
- 37.62 asserts that `merged.stamps` deep-equals `{}`, not merely that it is truthy. `undefined` is what the builder produces when it forgets the key.

Group 36 covers the action row. It has four claims. All are behaviour, not layout. jsdom has no layout, and the layout is what the row exists for.

- An armed Reset takes the row. The other two cells step out (36.1–36.4). The open Sync panel underneath stays put.
- An odd cell count in the Sync grid spans its last cell (36.5–36.7). The first draft booted against a seeded remote. That makes this device behind. It adds a Merge cell, and turns three cells into four. Read the count off the screen, not off the fixture.
- The token field is 16px (36.8). This is the one style assertion in the suite. It pins an iOS behaviour: focusing anything smaller zooms the page. It is not a look.

Confirmed to turn the suite red: the row keeping its other cells while Reset is armed, and the span dropped.

Group 35 exists to enforce one rule. A pull that did not land must not license a push. The suite was green. The merge logic was provably correct against the user's real ledgers. The feature still destroyed data on day one. Nothing asserted on what the *sha* did when an apply failed. So when a sync bug is reported, check what the sha did. Do not check only what the merge computed.

Groups 33–34 cover the two-device merge and auto-push. Group 33 is pure, like groups 27 and 31. It imports `merge-rules.mjs` directly. A merge that drops lines produces a plausible ledger, not an error. The symmetry assertions are the ones to keep. Merging A into B and B into A must give the same counts. Merging twice must add nothing. Those assertions show that the merge cannot pick a loser. They also show that a retry after a half-failed sync is harmless.

Group 34 drives the app. Its fixture is the real 08-22 state from `git log origin/data`. A phone holds unpushed check-ins and a stale item list. The remote holds the laptop's fresh import.

**The suite is mutation-tested.** Breaking a behaviour on purpose must turn it red. Verified for these cases:

- assignment checking in more than the user recorded;
- `resetAll` forgetting to clear envelopes;
- undo restoring a snapshot instead of subtracting its own delta.

Do the same when you add a claim. An assertion that cannot fail is decoration.

The GitHub backup added ten more mutants. All were confirmed to turn the suite red:

- `snapshot()` dropping `envelopes`;
- `utf8ToBase64` replaced by `btoa`;
- `applyBackup` skipping the `mailday` validation;
- the pull reusing the old all-or-nothing photo predicate;
- Pull firing on one tap;
- a push treating every failure as success;
- arming Pull no longer disarming Reset;
- a pull that does not refresh the sha;
- `pushBody` always sending a sha;
- a 403 always reading as a permission problem.

Three of those tests were wrong in ways that looked fine. They are worth remembering as method.

- **34.10 asserted `saved().items === undefined ? 0 : 1`.** That is 1 whether the ledger survived or was wiped. Tightening it to a real count showed that the test also read before the 500ms debounce had written. That made two bugs behind one assertion that could not fail.
- **`doMerge` was genuinely broken.** Only 34.29 found it. `applyBackup` increments `syncGen`, so that work in flight against the pre-restore world cannot land. `doPull` never noticed, because applying is the last thing it does. A merge pushes afterwards. So every gen-guarded step after the apply silently did nothing. That includes the whole photo phase, and the `Pushed ✓` flash.
- Every assignment in groups 1–19 takes a card's full quantity. So the mutation "assign marks the whole line received" passed all 101 of them. Group 20 catches it. It records one copy of a qty-2 line, and it checks that exactly one copy lands. Do not delete group 20.

Group 21 covers the masthead. `test/harness.mjs` stubs `IntersectionObserver` and exports `observers`. So a test can hand the callback an entry, and assert that the running head reacts. jsdom has no layout and no real scrolling. So this verifies the wiring only. It checks that the observer attaches after the loading shell. It checks that the stuck and unstuck condition is right. That is the part that can silently never fire. Whether a real scroller produces those entries is the browser's job.

Groups 25–27 cover the GitHub backup. `test/harness.mjs` mocks `window.remote` the same way it mocks `window.photos`. It makes two deliberate choices.

- The mock encodes and decodes through the **real** `src/b64.mjs`. So an app-level push and pull round trip exercises the actual codec. The non-ASCII test is meaningful. Every item in `ITEMS` is pure ASCII, so a `btoa` regression would otherwise pass. The test drives non-ASCII text through an *envelope entry*, not through the fixture. That is where iOS smart punctuation enters. It changes no counts.
- The mock enforces the sha check **for real**. It does not fake a conflict. `remote.sha` is what the remote holds. `remote.deviceSha` is what this device last saw. A stale push is rejected, exactly as GitHub would reject it. Seeding a remote without a pull *is* the second-device case.

Group 27 is different in kind. It imports `src/remote-rules.mjs` directly, and it asserts on pure functions. This is necessary because `entry.jsx` mounts React on import, so the harness cannot reach it. The localStorage and IndexedDB adapters have the same gap. Fetch plumbing can stay uncovered. The status mapping and the sha-omission rule must be covered, because both fail quietly. **The HTTP round trip itself is still uncovered.**

## Photo sync, sha safety, order stamps and merge mutant inventories

The sweep is protected by **two** guards. The first is `syncBusy` in the effect's condition. The second is `syncingRef.current` inside the timeout callback. The two guards are genuinely redundant. Removing either one alone leaves 30.16 green. Removing both turns it red. This is deliberate. The ref is set synchronously. The state behind it commits on React's schedule, which jsdom will not reliably reproduce. So no test pins either guard alone. Do not read a surviving single mutant here as dead code.

One bug taught a lesson worth keeping. The pull's warning that "these photos are about to be gone" was measured off `plan.toPush`. That list is keyed on the **incoming** ledger's ids. It is the set that survives a pull untouched. So the warning fired when photos were safe, and stayed silent when they were really destroyed. The warning now measures what the replace actually drops. Those are ids that are referenced here, absent from the incoming copy, and absent from the remote. Tests 30.18–30.20 pin both directions. The first version got both of them backwards.

Mutation-tested, all confirmed to turn the suite red:

- a pull applying the backup *before* downloading, which strips the ids;
- photo bytes through the text encoder;
- a push that does not subtract what is already remote;
- an unreadable store read as empty;
- both sweep guards removed;
- a photo error escaping into the ledger's error path.

The last one is the most valuable assertion in the feature. It makes `Push anyway` appear. It would let a slow upload arm a button that overwrites another device's ledger (30.11).

Group 35 added three mutants. All were confirmed to turn the suite red. The adapter advancing the sha inside `pull()` again is one. `doMerge` never accepting it is another. `doPull` never accepting it is the third.

Group 37 (order stamps) added **nine** mutants. All were confirmed to turn the suite red.

- `mergeLedger` not naming `stamps` (37.62–37.68).
- `snapshot()` dropping them (25.10, 37.51, 37.68).
- `canceledCount` measured off `liveItems` instead of `activeItems` (37.18).
- `packageOrder` built from `packages` rather than the live source (37.40).
- Removal as a `delete` rather than a tombstone (37.45).
- `mergeStamps` letting the incoming copy take a tie (37.55).
- `stamps` missing from `visible`'s deps (37.34).
- The refund exclusion dropped from `liveItems` (37.70).
- The warning ignoring the stamp (37.11).

The refund-exclusion mutant is the cautionary case in this group. With the exclusion dropped from `liveItems` alone, every masthead figure still came out right. Those figures derive from `rangedItems`, which excludes refunds on its own. The first draft of the group checked counts and lists only, so it let the mutant live. Only the Orphaned candidates read `liveItems`. So only an envelope test could see the mutant. When a chokepoint has two branches, assert on both.

Groups 33–34 added **twelve** mutants. All were confirmed to turn the suite red.

- `mergeReceived` using incoming-wins instead of `max`.
- `mergeItems` replacing instead of unioning.
- The envelope collision preferring the bigger copy.
- `mergeLedger` letting the remote's view preferences win.
- A merge applying the ledger *before* downloading photos.
- Auto-push reading an unreadable remote as all clear.
- Auto-push leaving a conflict rather than merging.
- A merge that stops disarming the other confirms.
- Assignment no longer stamping `updatedAt`.
- The photo phase surveying the pre-merge reference list.
- `doMerge` not re-adopting the generation that `applyBackup` bumps.
- A conflict during the merged push leaving no button.

Group 12's Showing assertions added five mutants. All were confirmed to turn the suite red.

- The default flipped back to Everything.
- The choice surviving a remount. A module-level cache stands in for anyone who "helpfully" persists it. That kills 12.7 and leaves 12.4 green. So the pair isolates the reload from the default.
- The threshold dropped, so a five-second glance away resets the list.
- The resume never resetting.
- The hidden branch not stamping the clock.

That last pair is why 12.8 and 12.9 both exist. Either one alone leaves half the threshold unpinned.

Group 32 (getting from a search hit to the whole order) added four mutants. All were confirmed to turn the suite red.

- The order-id button losing its `stopPropagation`, which turns a look into a check-in.
- `revealed` missing from `visible`'s dep array, so the reveal renders one commit late or never.
- The reveal-clearing effect also keyed on `view`. That wipes the reveal the Tally jump just set, and lands you on a still-filtered card.
- A reveal that bypasses the query but not `hideDone`. That quietly shows less than "the whole order", and strands the jump on a fully received package.

## The full coverage summary

Test groups map to the claims this file makes. So if you change a behaviour on purpose, change the assertion and the prose in the same commit. The groups cover these claims.

- Orphaned mail hides controls that do not apply. Recording moves no counts. Candidates rank without deciding. Assignment checks in *only* what the user recorded, including partial quantities. Undo composes with a later hand edit. Ties come from near-duplicate packages. Leftovers keep id, createdAt and note. Smart-punctuation name matching works. Migration from pre-feature saves works. `resetAll` survives the debounce. Candidates self-correct when a package is received elsewhere.
- Both backups and both restore paths. The photo sweep.
- The GitHub push and pull. The tests cover the payload shape and the non-ASCII round trip. They cover conflict and force. They cover an expired key and offline use. They cover the token never leaking. They cover a pull as a full replace. They cover photo ids kept or stripped. They cover arming one control disarming the other.
- Entity decoding on seller names, through a real CSV import.
- Showing starts on Unreceived and does not survive a reload. Both sides of the resume threshold are covered. A glance away keeps your choice. A real absence starts fresh.
- Getting from a search hit to the whole order. This covers the per-package reveal, the Tally jump, the search surviving it, the hideDone bypass, and a navigation tap writing nothing.
- The two-device merge. Both devices' work survives a conflict. The merge is symmetric and idempotent. View preferences stay local. An assigned-away envelope does not resurrect. The merged ledger reaches GitHub.
- Auto-push. It looks before it writes. It refuses on an unreadable or an ahead remote. It merges rather than forces when a conflict opens mid-write. The toggle lives outside the ledger.
- The mechanism under a package card that does not change height on a check-in. The bar is out of flow and cannot take a tap. Both cards are containing blocks for it. The bar still unmounts on completion. The action row's reservation does not vary with its membership.
- The older package and Tally views still work.

## See also

- `suite-size`, the assertion count and run time cited across these groups.
- `testing-when-a-mutant-dies-check-the-cause`, the method lesson group 34 taught.
- `testing-when-a-chokepoint-has-two-branches`, the lesson group 37 taught.
- `merge-rules-only-add`, the design groups 33 to 34 protect.
- `sha-accepted-only-after-apply`, the rule group 35 exists to pin.
