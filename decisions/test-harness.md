# How to drive the behaviour suite

This file holds the harness mechanics. It covers how `test/harness.mjs` mocks each platform API, and the list of gotchas. Read it before you write or fix a test.

## The suite and the harness, in outline

```
`npm test` — 541 assertions, no test framework, ~60s (groups 30–31 spend a few
seconds in real timers, deliberately: the sweep race can only be reached by
letting the clock run). `test/app.test.mjs` runs
top to bottom and either prints "all green" or exits 1; `test/harness.mjs` holds
the jsdom setup, storage mocks, DOM helpers and the fixture.

It bundles `app.jsx` with esbuild (platform=node, format=cjs), boots it in jsdom
against mocked `window.storage` / `window.photos` / `window.versions` /
`window.remote`, and drives
it with real DOM events, asserting on rendered text. The app has no exports but
the component and that's fine — every behaviour worth protecting is one you can
see, so the assertions read the DOM the way the user does.

(Three previous harnesses were written ad hoc and thrown away, which is why the
same assertions kept being rewritten from scratch. Hence this one is committed
and `jsdom` is a real devDependency.)
```

## The versions mock

```
`test/harness.mjs` mocks `window.versions` with a `Map` and prunes through the
**real** `prunePlan` — same reasoning as the remote mock encoding through the
real b64. It stores text uncompressed on purpose: gzip is the platform layer's
business, `app.jsx` never learns whether it happened, and jsdom has no
`CompressionStream`.
```

## The remote (ledger) mock

```
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
```

## The remote photo store mock

```
New in groups 30–31 (photo sync). `harness.mjs` grows a remote photo store
alongside the ledger mock, with three choices worth keeping:

- It encodes through the **real** `blobToBase64`, so an app-level push→pull
  round trip exercises the actual codec — 30.7 asserts the bytes come back
  identical, and swapping the encoder for the text one turns it red.
- **`listPhotos` refuses to answer without a key**, because the photo repo is
  private and GitHub hides a private repo behind a 404. Modelling it as readable
  keylessly would make the suite blind to the entire `no-access` bug class — and
  in fact it did: this is what forced 26.13 to split.
- `remote.photoDelay` makes a download slow, which is the only way to put the
  2s sweep between two arriving photos (30.16).
```

## Gotchas worth remembering

```
Gotchas worth remembering:

- `navigator` can't be assigned onto Node's `global` — use `Object.defineProperty`.
- jsdom holds the process open unless you `window.close()` at the end.
- Write the esbuild output *under the project* (e.g.
  `node_modules/.mailday-harness/`) or its own `require("react")` resolves to a
  second React copy and hooks blow up.
- `boot()` must unmount the previous root before calling `createRoot` on the
  same container again.
- **jsdom has no IndexedDB.** Mock `window.photos` directly rather than trying
  to polyfill — the app only ever sees that API, and a `Map` of Blobs matches
  its contract exactly.
- Drive file restore through the drop handler: build an `Event("drop")` and
  `Object.defineProperty` a `dataTransfer` onto it. Setting `input.files` isn't
  practical. The same helper carries a CSV (`csv()` builds an OrderWand-shaped
  one) — papaparse reads it as a real Blob through jsdom's `FileReader`, so the
  file's MIME type has to track its extension even though the app routes on the
  name.
- The photo sweep is on a 2s timer and the ledger save is debounced 500ms;
  tests must wait past them (`SWEEP_WAIT`, `SAVE_WAIT`).
- Packages render expanded, so "Mark all received" matches several buttons —
  reach into the specific card, not the first hit on the page.
- Push, Pull and Merge are the repair kit, whose only entrance is the
  broken-line, so `openSync()` clicks `/tap to/` rather than a `Sync` cell.
  Backup moved to History, so `openHistory()` is its counterpart. Both
  idempotent; just call them. `openSync()` works because every fresh fixture
  starts with no key, which *is* a broken state.
- **`boot()` seeds `opts.remote` AFTER the mount and then glances at the page**
  (a `foreground()` with the away-clock untouched). That is what almost every
  fixture actually means — the other device pushed at some point since — and it
  had to change when resumes began merging, because a cold mount counts as a
  fresh session and a remote seeded *before* the mount would auto-merge away the
  very conflict the fixture was written to produce. `opts.remoteAtBoot` is the
  explicit before-mount form, for the cold-start assertions in group 40. One
  harness change, no call sites touched, and a more faithful model of the wire.
- The `Pushed ✓` flash now starts **after** the photo phase, not after the
  ledger leg — showing it while a dozen uploads are queued is a lie, and it
  re-enabled the button into a second concurrent loop. So a test that pushes
  twice must match `/^Push(ed ✓)?$/`, and both buttons are disabled on
  `syncBusy` for the whole operation rather than on `pushState`/`pullState`.
- The ruled head replaced a Hide-received button, a native `<select>` and a chip
  disclosure, so `harness.mjs` exports `cell(re)`, `toggleShowing()`,
  `openRange()` and `pickSort(label)`. There is no `<select>` left to drive with
  `choose()`; pick sort by its visible label.
- **Anything about width is unassertable here.** jsdom has no layout, so the
  `minmax(0,1fr)` / `min-width:0` truncation fix in the head cannot be
  protected by a test — it was found by measuring a real 375px viewport and
  that is the only way it will be found again.
- The key field is uncontrolled by design, so `el.value = "…"` is enough — don't
  route it through `type()`, which exists for React-tracked inputs.
- **jsdom implements no scrolling**, so `scrollIntoView` simply isn't there and
  calling it throws. `harness.mjs` stubs it. There is no layout to move, so
  where the page ends up is not assertable here — group 32's jump asserts on
  *what renders* instead, which is the part that can actually be wrong.
- A successful push shows `Pushed ✓` for 2.5s, so `btn(/^Push$/)` won't match
  during the flash. Assert on state, or wait it out.
- **Auto-push's 90s idle debounce is not something to wait out.** Drive it with
  `background()` instead, which dispatches `visibilitychange` with
  `visibilityState` stubbed to `hidden` — the handler calls `autoPush()`
  immediately. That is a fast seam *and* a real path (switching away mid-mail-day
  is the last chance to catch a session that never went idle), so the test isn't
  reaching for a private hook. `foreground()` is the inverse and is also what
  re-runs the `peek`.
- `backgroundFor(ms)` is that pair with `Date.now` frozen across it, for the
  resume reset on Showing — the elapsed time is the argument rather than the
  wall clock, since the threshold is 60s and no test can wait it out. It is
  deliberately not a remount: on iOS a resume isn't one, and that is the whole
  distinction the reset exists to handle. Note all three visibility listeners
  read `document.visibilityState`, never `document.hidden`, so stubbing the
  one is enough.
  A test that merely waits ~200ms and asserts nothing was pushed proves nothing,
  because the debounce is 90s — that assertion cannot fail. The first draft of
  34.18 was exactly that shape; watch for it.
- **`background()` restores `visibilityState` to visible when it returns.** It
  did not at first, and a hidden document makes the foreground peek return
  early — so the Merge button never appears and an unrelated later test fails
  looking for it. The symptom points nowhere near the cause.
- **`remote.fail` cannot express "the push conflicts".** It rejects the pull as
  well, so the merge that recovers from the conflict never gets its payload.
  `remote.pushFailOnce` is the one-shot, push-only version, and it models the
  real race: the remote moves between the `peek` and the `PUT`.
```

## See also

- `suite-size`, the assertion count and run time for `npm test`.
- `testing-a-mock-is-the-test-below-the-seam`, why the mocks must stay honest.
- `remote-rules-fail-quietly`, why the remote mock enforces the sha check for real.
- `photo-sync-cannot-conflict`, the design the photo mock exercises.
