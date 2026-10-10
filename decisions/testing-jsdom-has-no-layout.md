# jsdom has no layout

A jsdom suite cannot see width, shift, or truncation. jsdom has no layout engine at all. The truncation fix in the ruled head uses `minmax(0,1fr)` / `min-width:0`. No test can protect it. It was found by measuring a real 375px viewport. A real viewport measurement is the only way such a regression will be found again. That measurement lives in `ruled-head-heights`.

**Holds while:** `jsdom` is a devDependency in `package.json`. `test/harness.mjs` boots the app inside it.

jsdom implements no scrolling. So `scrollIntoView` does not exist, and calling it throws. `test/harness.mjs` stubs it. Group 32's jump therefore asserts on what renders. It does not assert on where the page ends up.

## See also

- `favicon-is-a-different-drawing` — a rendering claim this limit applies to
- `icon-paths-and-export-gotchas` — an export claim this limit applies to
