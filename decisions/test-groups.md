# What each test group covers

This file is the coverage map. It lists what each numbered test group proves, and the mutants confirmed to turn the suite red for it. Read it before you change a behaviour on purpose, to find which assertion to update.

## Groups 42, 43, 45 and 44 (motion and layout mechanics)

```
New in group 42 (the save indicator's reserved slot). It is the smallest group
here and the one with the least it can prove, which is the point of writing
down what it is for: the defect is a **layout shift**, jsdom has no layout, and
no assertion in this suite will ever catch one. The measurement lives in
"The masthead"; what 42 pins is the mechanism underneath it, in each of the
places it can regress without looking wrong. 42.2 is the one that was got
wrong on the first attempt — reserving the slot's *width* while leaving it
empty, which fixes nothing, because an empty flex item is zero pixels *tall*
and a line holding only that item collapses. 42.3 is the one that keeps working
as the app changes: it drives the store into failure to reach the longest of
the three messages and asserts it fits the reserved width, counted in the `ch`
the reservation is written in — so lengthening that copy without widening the
slot turns the suite red rather than quietly reintroducing the shift. Nothing
here asserts the reservation's *size* is right; only a viewport can say that.

New in group 43 (the joy pass). It is deliberately **six assertions, not
sixty**: almost nothing about motion is assertable here — jsdom has no layout
and no compositor, so durations, easing, distances and the no-reflow claim were
settled by measuring a real 375px viewport instead, and a test that pretended
otherwise would be decoration. What is left is the two claims that are
*behaviour*, and both fail silently. 43.1–43.2 pin `data-view` on the switch,
which is now the only thing saying which segment is active — the buttons stopped
painting their own fill when the sliding thumb took it over, so losing the
attribute leaves the app with no active-view indicator at all while every button
still looks correct in a DOM dump. 43.3–43.6 pin the `useJustBecame` gate, and
**43.4 and 43.6 are a pair**: a mutant that classes the stamp on `done` alone
passes the first (completing a package does land the stamp) and dies on the
second (so does every finished order, on every re-render). Both confirmed to
turn the suite red. One fixture note worth keeping — the first draft checked the
package in under the default Showing, where a completed package correctly leaves
the list, so the element under assertion left the page; the group toggles to
Everything first.

New in group 45 (a device that only merges is still backed up). Three
assertions, and the method note is worth more than the count. **The first draft
could not fail**: it aged `remote.pushedAt`, called `foreground()` and asserted
— but `foreground()` re-peeks and never re-reads `status()`, so the component
kept the timestamp from the push above and the mutant survived all of it.
`remoteInfo` is refreshed by an effect keyed on `[loaded, syncOpen]`, so the
test has to toggle the panel to make the device record land. Watch for this
shape generally: **after changing a value the adapter owns, check that anything
actually re-reads it.** Mutation-confirmed — staleness measured off `pushedAt`
alone kills 45.1 and 45.2.
`test/harness.mjs` needed the same correction to be able to prove it:
`acceptPull` set `pulledAt` to the frozen `REMOTE_NOW`, exactly the hole the
comment two functions below already warns about for `pushedAt`. It was left
frozen because nothing read it; the day `syncBroken` did, every merged device
would have been permanently stale and the healthy state unreachable from a
test. **When a mock's field stops being decorative, re-read the comment next to
the field that already wasn't.**

New in group 44 (the card stops moving under the thumb). Same shape as 42, and
the same honest limit: the defect is a **layout shift**, jsdom has no layout,
and no assertion here will ever catch one — the numbers live in "The card's
reserved geometry" and were taken in a real viewport. What 44 pins is the
mechanism, in each place it can regress without looking wrong in a DOM dump: the
bar is out of flow (44.4a), cannot eat the header tap it now lies across
(44.4b), and both cards are containing blocks for it (44.2, 44.7) — without one
it draws somewhere else on the page entirely. The row's reservation exists
(44.3) and does not vary with the row's membership (44.4c) or with `done`
(44.6).

**44.5 is the one to keep if the group is ever trimmed**, and it is not really
a layout assertion at all: it says completing a package still *unmounts* the
bar. That gate is the whole reason the bar was taken out of flow instead of
being reserved a slot, because a slot has to stay mounted at 100% and the bar
would then sheen its own completion beside `.mdl-gild`. Read a 44.5 failure as
"someone changed the motion design", not as a broken refactor.

Eight mutants, all confirmed to turn the suite red, and note that three of them
needed a *pair* to die properly: the bar back in flow (44.4a); the bar allowed
to take pointer events (44.4b); either card losing `position: relative` (44.2,
44.7); the reservation dropped altogether (44.3); the bar surviving completion,
i.e. a reserved slot by another name (44.5); a reservation that varies by
membership (44.4c) — which 44.3 cannot catch, because a mutant that reserves
*something* different in each state still reserves something; and one that
varies only on the `done` branch (44.6), which 44.4c in turn cannot catch,
because it compares against a rest value the same mutant moved. Each of 44.3,
44.4c and 44.6 is alive only against the mutant the other two miss.
```

## Groups 38 to 41 (saved versions, and sync running itself)

```
New in groups 38–41 (saved versions, and sync running itself).

Group 38 is pure, like 27, 31 and 33: it imports `version-rules.mjs` directly,
because a pruning bug deletes the one version the user was reaching for and
leaves a list that looks healthy. Group 39 drives the app and asserts on what a
milestone actually *holds* — the ledger as it was BEFORE the operation,
envelopes included. Group 40 is the resume merge, the behaviour in this app with
the least margin for error, because it applies a remote change with nobody
watching. Group 41 reads older versions off the branch's own history; the remote
mock records every push as a commit, which is not a convenience but the actual
claim the feature rests on.

`test/harness.mjs` mocks `window.versions` with a `Map` and prunes through the
**real** `prunePlan` — same reasoning as the remote mock encoding through the
real b64. It stores text uncompressed on purpose: gzip is the platform layer's
business, `app.jsx` never learns whether it happened, and jsdom has no
`CompressionStream`.

Mutation-tested, all confirmed to turn the suite red: the hourly tier deleted,
reaching forever, or treating every record as an anchor; the day anchor taking a
day's latest instead of its earliest; the recent ring keeping everything; day
anchors reaching forever; `dayKey` reading UTC; every save earning a version;
milestones never surviving; a version built from its own payload rather than
`snapshot()`; restore firing on one tap (local and remote); a restore bypassing
`applyBackup`; the History cell gated on `items.length`; Reset taking no
milestone or tidying the versions away; the resume handler reading the shared
`hiddenAt`; the threshold dropped to 0; the signal never consumed; an unknown
remote read as ahead; the mid-thought guard removed; `acceptPull` dropped from
`doMerge`; the quiet merge announcing itself; `freshSession` starting false; and
the load control fetching nothing.

Four method notes worth keeping, all learned the hard way here:

- **38.9's first draft could not fail at all**: `dayKey("2026-05-01T00:30")` is
  `"2026-05-01"` under the UTC reading too. It derives the boundary from the
  runner's own `getTimezoneOffset()` now, and skips itself in UTC where there is
  nothing to claim.
```

## Groups 37, 36, 35, 33 to 34, 20, 21, 25 to 27 (feature and adapter groups)

```
New in group 37 (order stamps). It drives the whole feature through the DOM —
the two entrances, the replace-not-stack rule, a refund leaving every count,
the stamped filter obeying Showing, Find and the range, the tombstone, the
five persistence sites — and then imports `mergeStamps` directly for the
merge rule and ends on group 34's shape with a removal on the other side.
Three of its assertions are the ones to keep if the group is ever trimmed:
37.34 (editing a note under a live search) is the only shape that catches
`stamps` missing from `visible`'s dep array, since a query change re-runs the
fresh closure anyway; 37.40 sorts a *refunded* package under Newest, because
under Oldest the `packageOrder`-from-`packages` mutant coincidentally produces
the right order; and 37.62 asserts `merged.stamps` deep-equals `{}` rather
than merely truthy, because `undefined` is exactly what the builder produces
when it forgets the key.

New in group 36 (the action row). Four claims, all behaviour rather than
layout, because jsdom has none and the layout is what the row exists for: an
armed Reset takes the row and the other two cells step out (36.1–36.4, and
the open Sync panel underneath stays put); an odd cell count in the Sync grid
spans its last cell (36.5–36.7 — the first draft booted against a seeded
remote, which makes this device *behind*, adds a Merge cell, and turns three
into four: read the count off the screen, not off the fixture); and the token
field is 16px (36.8), which is the one style assertion in the suite, kept
because it pins an iOS behaviour — focusing anything smaller zooms the page —
and not a look. Confirmed to turn the suite red: the row keeping its other
cells while Reset is armed, and the span dropped.

New in group 35 (a pull that didn't land must not license a push). The whole
group exists because the suite was green, the merge logic was provably correct
against the user's real ledgers, and the feature still destroyed data on day
one — because nothing asserted on what the *sha* did when an apply failed. When
a sync bug is reported, check what the sha did, not just what the merge
computed.

New in groups 33–34 (two-device merge and auto-push). Group 33 is pure, like 27
and 31: it imports `merge-rules.mjs` directly, because a merge that drops lines
produces a plausible ledger rather than an error. The assertions worth keeping
are the *symmetry* ones — merging A into B and B into A must yield the same
counts, and merging twice must add nothing — since those are what say "this
cannot pick a loser" and "a retry after a half-failed sync is harmless".

Group 34 drives the app. Its fixture is the real 08-22 state from
`git log origin/data`: a phone holding unpushed check-ins and a stale item list
against a remote carrying the laptop's fresh import.

**The suite is mutation-tested.** Breaking a behaviour on purpose must turn it
red — verified for: assignment checking in more than was recorded, `resetAll`
forgetting to clear envelopes, and undo restoring a snapshot instead of
subtracting its own delta. Do the same when you add a claim; an assertion that
can't fail is decoration.

The GitHub backup added ten more, all confirmed to turn the suite red:
`snapshot()` dropping `envelopes`; `utf8ToBase64` replaced by `btoa`;
`applyBackup` skipping the `mailday` validation; the pull reusing the old
all-or-nothing photo predicate; Pull firing on one tap; a push treating every
failure as success; arming Pull no longer disarming Reset; a pull that doesn't
refresh the sha; `pushBody` always sending a sha; and a 403 always reading as a
permission problem.

Three of those are worth remembering as method, because the first drafts of
these tests were all wrong in ways that looked fine:

- **34.10 asserted `saved().items === undefined ? 0 : 1`** — which is 1 whether
  the ledger survived or was wiped. Tightening it to a real count immediately
  showed the test was *also* reading before the 500ms debounce had written.
  Two bugs behind one assertion that could not fail.

- **`doMerge` genuinely was broken**, and only 34.29 found it: `applyBackup`
  increments `syncGen` so that work in flight against the pre-restore world
  can't land. `doPull` never noticed because applying is the last thing it does.
  A merge *pushes* afterwards, so every gen-guarded step after the apply — the
  whole photo phase, and the `Pushed ✓` flash — silently did nothing.

That exercise already earned its keep once. Every assignment in groups 1–19
happens to take a card's *full* quantity, so the mutation "assign marks the
whole line received" passed all 101 of them. Group 20 exists to catch it:
record **one** copy of a qty-2 line and check exactly one copy lands. Don't
delete it.

New in group 21 (the masthead): `test/harness.mjs` stubs
`IntersectionObserver` and exports `observers`, so a test can hand the callback
an entry and assert the running head reacts. jsdom has no layout and no real
scrolling, so this verifies the *wiring* — that the observer attaches after the
loading shell, and that the stuck/unstuck condition is right — which is exactly
the part that can silently never fire. Whether a real scroller produces those
entries is the browser's job.

New in groups 25–27 (the GitHub backup). `test/harness.mjs` mocks
`window.remote` the same way it mocks `window.photos`, with two deliberate
choices:

- The mock encodes and decodes through the **real** `src/b64.mjs`, so an
  app-level push→pull round trip exercises the actual codec. That's why the
  non-ASCII test is meaningful: every item in `ITEMS` is pure ASCII, and a
  `btoa` regression would otherwise pass. The test drives it through an
  *envelope entry* rather than the fixture — that's where iOS smart punctuation
  actually enters, and it perturbs no counts.
- The mock enforces the sha check **for real** rather than faking a conflict:
  `remote.sha` is what the remote holds, `remote.deviceSha` is what this device
  last saw, and a stale push is rejected exactly as GitHub would. Seeding a
  remote without pulling *is* the second-device case.

Group 27 is different in kind: it imports `src/remote-rules.mjs` directly and
asserts on pure functions. That exists because `entry.jsx` mounts React on
import and is unreachable from the harness — the same gap the localStorage and
IndexedDB adapters have. Fetch plumbing is fine to leave uncovered; the status
mapping and the sha-omission rule are not, because both fail *quietly*. **Still
uncovered: the HTTP round trip itself.**
```

## Photo sync, sha safety, order stamps and merge mutant inventories

```
The sweep is protected by **two** guards — `syncBusy` in the effect's condition
and `syncingRef.current` inside the timeout callback — and they are genuinely
redundant: removing either alone leaves 30.16 green, removing both turns it red.
That is deliberate (the ref is set synchronously; the state behind it commits on
React's schedule, which jsdom will not reliably reproduce), but it does mean no
test pins either one individually. Don't read a surviving single mutant here as
dead code.

One bug this exercise actually caught, worth keeping as a cautionary tale: the
pull's "these photos are about to be gone" warning was measured off
`plan.toPush`, which is keyed on the **incoming** ledger's ids — precisely the
set that survives a pull untouched. It fired when photos were safe and stayed
silent when they were genuinely destroyed. It is now measured against what the
replace actually drops (referenced here, absent from the incoming copy, absent
from the remote). Tests 30.18–30.20 pin both directions, because the first
version got both of them backwards.

Mutation-tested, all confirmed to turn the suite red: a pull applying the backup
*before* downloading (ids stripped); photo bytes through the text encoder; a
push that doesn't subtract what is already remote; an unreadable store read as
empty; both sweep guards removed; and — the most valuable assertion in the
feature — **a photo error escaping into the ledger's error path**, which makes
`Push anyway` appear and would let a slow upload arm a button that overwrites
another device's ledger (30.11).

Group 35 added three, all confirmed to turn the suite red: the adapter
advancing the sha inside `pull()` again; `doMerge` never accepting it; and
`doPull` never accepting it.

Group 37 (order stamps) added **nine**, all confirmed to turn the suite red:
`mergeLedger` not naming `stamps` (37.62–37.68); `snapshot()` dropping them
(25.10, 37.51, 37.68); `canceledCount` measured off `liveItems` instead of
`activeItems` (37.18); `packageOrder` built from `packages` rather than the
live source (37.40); removal as a `delete` rather than a tombstone (37.45);
`mergeStamps` letting the incoming copy take a tie (37.55); `stamps` missing
from `visible`'s deps (37.34); the refund exclusion dropped from `liveItems`
(37.70); and the warning ignoring the stamp (37.11).
That seventh one is the cautionary tale of this group: with the exclusion
dropped from `liveItems` alone, **every masthead figure still came out right**
— they derive from `rangedItems`, which excludes refunds on its own — and the
first draft of the group, all counts and lists, let the mutant live. Only the
Orphaned candidates read `liveItems`, so only an envelope test could see it.
When a chokepoint has two branches, assert on both.

Groups 33–34 (two-device merge and auto-push) added **twelve**, all confirmed
to turn the suite red: `mergeReceived` using incoming-wins instead of `max`;
`mergeItems` replacing instead of unioning; the envelope collision preferring
the bigger copy; `mergeLedger` letting the remote's view preferences win; a
merge applying the ledger *before* downloading photos; auto-push reading an
unreadable remote as all clear; auto-push leaving a conflict rather than
merging; a merge that stops disarming the other confirms; assignment no longer
stamping `updatedAt`; the photo phase surveying the pre-merge reference list;
`doMerge` not re-adopting the generation `applyBackup` bumps; and a conflict
during the merged push leaving no button.

Group 12's Showing assertions added five, all confirmed to turn the suite red:
the default flipped back to Everything; the choice surviving a remount (a
module-level cache, standing in for anyone who "helpfully" persists it), which
kills 12.7 while leaving 12.4 green, so the pair isolates the reload from the
default; the threshold dropped, so a five-second glance away resets the list;
the resume never resetting; and the hidden branch not stamping the clock. That
last pair is why 12.8 and 12.9 both exist — either one alone leaves half the
threshold unpinned.

Group 32 (getting from a search hit to the whole order) added four, all
confirmed to turn the suite red: the order-id button losing its
`stopPropagation`, which turns a look into a check-in; `revealed` missing from
`visible`'s dep array, so the reveal renders one commit late or never; the
reveal-clearing effect also keyed on `view`, which wipes the reveal the Tally
jump just set and lands you on a still-filtered card; and a reveal that
bypasses the query but not `hideDone`, which quietly shows less than "the whole
order" and strands the jump on a fully-received package.
```

## The full coverage summary

```
Test groups map to the claims this file makes, so if you change a behaviour
deliberately, change the assertion and the prose in the same commit. What's
covered: orphaned mail hiding controls that don't apply; recording moving no
counts; candidates ranking without deciding; assignment checking in *only* what
was recorded (including partial quantities); undo composing with a later hand
edit; ties from near-duplicate packages; leftovers keeping id/createdAt/note;
smart-punctuation name matching; migration from pre-feature saves; `resetAll`
surviving the debounce; candidates self-correcting when a package is received
elsewhere; both backups and both restore paths; the photo sweep; the GitHub
push and pull (payload shape, non-ASCII round trip, conflict + force, expired
key, offline, the token never leaking, pull as a full replace, photo ids kept
vs stripped, arming one control disarming the other); entity decoding on
seller names, through a real CSV import; Showing starting on Unreceived and
not surviving a reload, and both sides of the resume threshold (a glance away
keeps your choice, a real absence starts fresh); getting from a search hit to the whole
order (per-package reveal, the Tally jump, the search surviving it, the hideDone
bypass, and a navigation tap writing nothing); the two-device merge (both
devices' work surviving a conflict, symmetry, idempotence, view preferences
staying local, an assigned-away envelope not resurrecting, and the merged
ledger reaching GitHub); auto-push (looking before it writes, refusing on an
unreadable *or* an ahead remote, merging rather than forcing when a conflict
opens mid-write, and the toggle living outside the ledger); the mechanism under
a package card that does not change height on a check-in (the bar out of flow
and unable to take a tap, both cards being containing blocks for it, the bar
still unmounting on completion, and the action row's reservation not varying
with its membership); and the older package/Tally views still working.
```

## See also

- `suite-size`, the assertion count and run time cited across these groups.
- `testing-when-a-mutant-dies-check-the-cause`, the method lesson group 34 taught.
- `testing-when-a-chokepoint-has-two-branches`, the lesson group 37 taught.
- `merge-rules-only-add`, the design groups 33 to 34 protect.
- `sha-accepted-only-after-apply`, the rule group 35 exists to pin.
