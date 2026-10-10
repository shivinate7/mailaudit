# jsdom has no layout

A jsdom suite cannot see width, shift, or truncation, because jsdom has no layout engine at all. A truncation fix in the ruled head was protected only by a real viewport measurement. That measurement lives in `ruled-head-heights`, the only way such a regression will ever be found again.

## See also

- `favicon-is-a-different-drawing` — a rendering claim this limit applies to
- `icon-paths-and-export-gotchas` — an export claim this limit applies to
