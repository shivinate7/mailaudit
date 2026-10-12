# Overlay panels take the paper fill

**Status:** orchestrator default, 2026-10-11, not built. It is not an owner ruling, and the owner may overrule it. It follows the owner's "Fix both" on press movement, which made disclosure panels overlay the list (`motion-disclosure-panels-arrive`). An overlay with no fill shows the list rows through it.

An overlay panel takes the paper fill. `paper` is the page colour in `shared/tokens.json`. A paper fill is opaque, so the list rows do not show through it. The option grids still read as raised, because their own cells paint a surface over the panel's rule.

**Holds while:** `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. The paper fill is not built.

## The earlier no-fill rule

Until the overlay default, the disclosure panels held only padding and a top hairline. They never carried a background fill.

The reason for that rule: `panelWrap` is padding plus a top hairline and nothing else. Do not set `background: C.card` on it. A fill would paint a beige rectangle, ruled top and bottom. Its left and right edges would simply stop. The edges would be square-cornered and full-bleed to the column. In this app every other filled surface is a rounded inset card. The fill would be the only thing creating an edge to resolve. It would contradict the ruled region's own thesis.

The default uses `paper`, not `card`. It does not answer the edge point. Whether the square edges show with `paper` is unmeasured. The owner should check it on a screen.

The option grids still read, because `optGrid` paints `line` and each `optCell` paints `card` over it. The cells sit slightly raised against the page. The rule "do not reintroduce the fill" is superseded for overlay panels by the default above.

## See also

- `ruled-head-masthead-vocabulary` — the region thesis this rule protects.
- `ruled-head-range-picked` — a disclosure panel that the default now covers.
- `motion-disclosure-panels-arrive` — the overlay ruling that makes the fill needed.
