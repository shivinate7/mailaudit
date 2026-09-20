# jsdom has no layout

A jsdom suite cannot see width, shift, or truncation, because jsdom has no layout engine at all. A truncation fix in the ruled head was protected only by a real viewport measurement. That measurement lives in `ruled-head-heights`, the only way such a regression will ever be found again.

## The argument, as recorded

```
- **Anything about width is unassertable here.** jsdom has no layout, so the
  `minmax(0,1fr)` / `min-width:0` truncation fix in the head cannot be
  protected by a test — it was found by measuring a real 375px viewport and
  that is the only way it will be found again.
```

## See also

- `favicon-is-a-different-drawing` — a rendering claim this limit applies to
- `icon-paths-and-export-gotchas` — an export claim this limit applies to
