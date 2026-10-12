# The Swift client runs the view rules in JavaScriptCore

**Status:** ruled. The owner ruled on 2026-10-11: "Run the JS in Swift". S2 landed in PR #63 and moved the first view rules to `src/view-rules.mjs`. S3 landed in PR #64 and moved the rest of the pure view rules there. N1 landed in PR #75. Its bridge runs the rules bundle in JavaScriptCore.

JavaScriptCore runs the same JavaScript rules module that the web app uses, so the view logic has one home. The Swift client holds no copy of a view rule. Lanes S2, S3 and N1 (all landed) build this.

**Holds while:** the view rules are JavaScript under `src/`, and the native client must run them offline on the device.

## Why MANIFEST differs from Degen

Degen did a full Swift rewrite with server-side parsing. MANIFEST cannot copy that. Its view logic must run offline on the device, so a server cannot hold it.

## How it works

- S2 and S3 moved the pure rules out of `src/app.jsx` into `src/view-rules.mjs`. These are the helper functions at the top of the component, and the logic behind the memoized lists for Packages, Tally and the date range. The memos stay in the component and call the module. V1 to V12 in `test/view-rules.test.mjs` pin the moved rules.
- `build.mjs` adds a second esbuild IIFE. The build writes the rules bundle at native/ManifestKit/Resources/rules.js. The bundle carries the view rules, `src/sync-rules.mjs`, `src/version-rules.mjs` and `src/photo-rules.mjs`.
- Swift loads the bundle into a JSContext that lives in an actor. Data crosses as JSON strings.
- The bundle exports the sync constants: `SYNC_TIMEOUT_MS`, `IDLE_APPLY_MS`, `backoffMs` and `KEY_RE`. Native sync (lane N4a, not built) reads them from there.
- The merge stays on the Worker. Native never loads `src/merge-rules.mjs`, so the merge has one home.
- Sticky rows and the frozen sort stay in the component. They hold the no-layout-shift state, see `no-layout-shift-under-pointer`.

## Proof

- Swift tests assert that the rules engine output equals the golden files, except parse-items.json, see `shared-tokens-and-fixtures`. By orchestrator default of 2026-10-12, parse-items.json has no native test, because native never parses CSV, see `csv-import-stays-web`.
- `check:rules` goes red when the committed bundle is stale.

## Rejected

A Swift port of the view rules, pinned by golden files. It gives two homes one shared proof. It replaces the bridge in lane N1 with a lane of about 400 lines. The owner chose the bridge.

## See also

- `native-swift-rebuild` — the rebuild and Degen's rule that nothing is built twice.
- `shared-tokens-and-fixtures` — the golden files that pin the output.
- `native-reply-waits-generation` — the sync client that uses the sync constants.
