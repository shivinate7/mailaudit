# Unit rate and position differ on purpose

The collapsed Tally row shows the **unit rate**, not the basis. The unit rate is `avg`, which equals the basis divided by the copies. The average per copy is the more useful number at a glance, when most rows hold a single cheap card. Expanding the row shows the whole position: "$X across N copies · $Y avg".

**Holds while:** the collapsed Tally row shows `item.avg` in `src/app.jsx`, and `sortTally` in `src/view-rules.mjs` orders the "Cost basis" sort by `basis` (V8.3).

The "Cost basis" sort still ranks by total basis. That order is deliberately different from "unit rate". A cheap card bought in bulk has a large position and a small rate.

The unit rate is `basis / qty`. The row shows it as "$X / copy". In Tally, the value is `g.avg`. For a package, the unit rate is that package's basis over its own copies. `sortPackages` in `src/view-rules.mjs` computes it (V9.5 and V9.6).

## See also

- `tally-pools-on-the-exact-name` — the grouping this rate is computed over.
- `cost-basis-excludes-ship-and-tax` — the basis this rate divides.
