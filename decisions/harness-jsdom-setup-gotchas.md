# The harness supplies what jsdom lacks

The harness boots the app inside jsdom. jsdom lacks several browser parts, so the harness supplies them before the app loads. Several setup rules matter for any new test. Each rule below is a point where a test can fail for the wrong reason.

**Holds while:** `test/harness.mjs` writes its bundle to `node_modules/.mailday-test/app.bundle.cjs`, sets `navigator` with `Object.defineProperty`, calls `win.close()`, and mocks `window.versions` as a `Map`.

- `navigator` cannot be assigned onto Node's `global`. Use `Object.defineProperty`.
- Write the esbuild output under the project, in `node_modules/.mailday-test/`. A bundle written elsewhere resolves its own `require("react")`. That gives a second React copy, and the hooks fail.
- `boot()` unmounts the previous root before it calls `createRoot` on the same container again.
- jsdom holds the process open unless the harness calls `win.close()`, the jsdom form of `window.close()`.
- jsdom has no IndexedDB. Mock `window.photos` directly, and do not polyfill it. The app sees only that API. A `Map` of Blobs matches its contract exactly.
- `window.versions` is mocked the same way, as a `Map`. It prunes through the real `prunePlan`. So a take-a-version test runs the real retention rules. It stores text uncompressed. Gzip belongs to the platform layer, and `CompressionStream` does not exist in jsdom.

## See also

- `testing-jsdom-has-no-layout`, the wider limit of jsdom.
- `suite-size`, the suite that runs in this setup.
- `testing-mock-is-test-below-seam`, why the mocks must stay honest.
