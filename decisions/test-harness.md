# How to drive the behaviour suite

This record holds the harness mechanics. It covers how `test/harness.mjs` mocks each platform API, and the gotchas to know. Read it before you write or fix a test.

## The suite and the harness, in outline

`npm test` runs 548 assertions. It has no test framework, and it takes about 60s. Groups 30–31 spend a few seconds in real timers, on purpose. The sweep race can only be reached by letting the clock run.

`test/app.test.mjs` runs top to bottom. It either prints "all green" or exits 1. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture.

The harness bundles `app.jsx` with esbuild (platform=node, format=cjs). It boots the app in jsdom against mocked `window.storage`, `window.photos`, `window.versions`, and `window.remote`. It drives the app with real DOM events, and it asserts on rendered text. The app has no exports except the component. That is fine. Every behaviour worth protecting is visible, so the assertions read the DOM the way the user does.

Three earlier harnesses were improvised and thrown away. The same assertions were rewritten from scratch each time. So this harness is committed. `jsdom` is a real devDependency.

## The versions mock

`test/harness.mjs` mocks `window.versions` with a `Map`. It prunes through the **real** `prunePlan`. This follows the same reasoning as the remote mock, which encodes through the real b64. The mock stores text uncompressed on purpose. Gzip is the platform layer's job. `app.jsx` never learns whether gzip ran. jsdom has no `CompressionStream`.

## The remote (ledger) mock

Groups 25–27 added the GitHub backup. `test/harness.mjs` mocks `window.remote` the same way it mocks `window.photos`. It makes two deliberate choices.

- The mock encodes and decodes through the **real** `src/b64.mjs`. So an app-level push→pull round trip runs the actual codec. The non-ASCII test is meaningful for that reason. Every item in `ITEMS` is pure ASCII. A `btoa` regression would otherwise pass. The test drives the round trip through an *envelope entry*, not the fixture. iOS smart punctuation enters the app there, and it changes no counts.
- The mock enforces the sha check **for real**. It does not fake a conflict. `remote.sha` is what the remote holds. `remote.deviceSha` is what this device last saw. A stale push is rejected, exactly as GitHub would reject it. Seeding a remote without a pull *is* the second-device case.

## The remote photo store mock

Groups 30–31 added photo sync. `harness.mjs` grows a remote photo store alongside the ledger mock. It has three choices worth keeping.

- It encodes through the **real** `blobToBase64`. So an app-level push→pull round trip runs the actual codec. Test 30.7 asserts that the bytes come back identical. Swapping in the text encoder turns it red.
- **`listPhotos` refuses to answer without a key.** The photo repo is private, and GitHub hides a private repo behind a 404. If the mock allowed keyless reads, the suite would be blind to the entire `no-access` bug class. The suite was in fact blind to that class. That blindness forced 26.13 to split.
- `remote.photoDelay` makes a download slow. It is the only way to put the 2s sweep between two arriving photos (30.16).

## Gotchas worth remembering

- `navigator` cannot be assigned onto Node's `global`. Use `Object.defineProperty`.
- Unless you call `window.close()` at the end, jsdom holds the process open.
- Write the esbuild output under the project, for example in `node_modules/.mailday-harness/`. Otherwise its own `require("react")` resolves to a second React copy, and the hooks fail.
- `boot()` must unmount the previous root before it calls `createRoot` on the same container again.
- **jsdom has no IndexedDB.** Mock `window.photos` directly instead of polyfilling it. The app only sees that API. A `Map` of Blobs matches its contract exactly.
- Drive file restore through the drop handler. Build an `Event("drop")`, and add a `dataTransfer` to it with `Object.defineProperty`. Setting `input.files` is not practical. The same helper carries a CSV. `csv()` builds an OrderWand-shaped file. papaparse reads it as a real Blob through jsdom's `FileReader`. So the file's MIME type must match its extension, even though the app routes by name.
- The photo sweep runs on a 2s timer. The ledger save is debounced 500ms. Tests must wait past both: `SWEEP_WAIT` and `SAVE_WAIT`.
- Packages render expanded. So "Mark all received" matches several buttons. Reach into the specific card, not the first match on the page.
- Push, Pull, and Merge are the repair kit. Its only entrance is the broken line. So `openSync()` clicks `/tap to/`, not a `Sync` cell. Backup moved to History, so `openHistory()` is its counterpart. Both calls are idempotent. Just call them. `openSync()` works because every fresh fixture starts with no key. That is a broken state.
- **`boot()` seeds `opts.remote` after the mount, then glances at the page.** It runs `foreground()` with the away-clock untouched. Most fixtures mean exactly this: the other device pushed at some point since. This changed when resumes began to merge. A cold mount counts as a fresh session. A remote seeded before the mount would auto-merge away the conflict that the fixture was written to produce. `opts.remoteAtBoot` is the explicit before-mount form, for the cold-start assertions in group 40. This was one harness change, with no call sites touched. It is also a more faithful model of the wire.
- The `Pushed ✓` flash starts after the photo phase, not after the ledger leg. Showing it while a dozen uploads are queued would be a lie. It would also re-enable the button into a second concurrent loop. So a test that pushes twice must match `/^Push(ed ✓)?$/`. Both buttons are disabled on `syncBusy` for the whole operation, not on `pushState` or `pullState`.
- The ruled head replaced a Hide-received button, a native `<select>`, and a chip disclosure. So `harness.mjs` exports `cell(re)`, `toggleShowing()`, `openRange()`, and `pickSort(label)`. No `<select>` is left to drive with `choose()`. Pick sort by its visible label.
- **Anything about width cannot be asserted here.** jsdom has no layout. So the `minmax(0,1fr)` and `min-width:0` truncation fix in the head cannot be protected by a test. The fix was found by measuring a real 375px viewport. Only that method will find a regression again.
- The key field is uncontrolled by design. So `el.value = "…"` is enough. Do not route it through `type()`, which exists for React-tracked inputs.
- **jsdom implements no scrolling.** So `scrollIntoView` does not exist, and calling it throws. `harness.mjs` stubs it. There is no layout to move, so the final page position cannot be asserted here. Group 32's jump asserts on what renders instead. That is the part that can be wrong.
- A successful push shows `Pushed ✓` for 2.5s. So `btn(/^Push$/)` does not match during the flash. Assert on state, or wait for the flash to end.
- **Auto-push's 90s idle debounce is not something to wait out.** Drive it with `background()` instead. That dispatches `visibilitychange` with `visibilityState` stubbed to `hidden`. The handler calls `autoPush()` at once. That is a fast seam, and also a real path. Switching away in the middle of a mail day is the last chance to catch a session that never went idle. So the test does not reach for a private hook. `foreground()` is the inverse, and it also re-runs the `peek`.
- `backgroundFor(ms)` is that pair with `Date.now` frozen across it. It serves the resume reset on Showing. The elapsed time is the argument, not the wall clock. The threshold is 60s, and no test can wait that long. It is deliberately not a remount. On iOS a resume is not a remount, and that distinction is the whole point of the reset. All three visibility listeners read `document.visibilityState`, never `document.hidden`. So stubbing the one is enough.
  A test that waits about 200ms and asserts nothing was pushed proves nothing. The debounce is 90s, so that assertion cannot fail. Test 34.18 was drafted in that shape. Watch for it.
- **`background()` restores `visibilityState` to visible when it returns.** A hidden document makes the foreground peek return early. Without that restore, the Merge button never appears. An unrelated later test then fails while it looks for that button. The symptom points away from the cause.
- **`remote.fail` cannot express "the push conflicts".** It rejects the pull as well. So the merge that recovers from the conflict never gets its payload. `remote.pushFailOnce` is the one-shot, push-only version. It models the real race, in which the remote moves between the `peek` and the `PUT`.

## See also

- `suite-size`, the assertion count and run time for `npm test`.
- `testing-a-mock-is-the-test-below-the-seam`, why the mocks must stay honest.
- `remote-rules-fail-quietly`, why the remote mock enforces the sha check for real.
- `photo-sync-cannot-conflict`, the design the photo mock exercises.
