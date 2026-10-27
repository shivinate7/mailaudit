# Overlay panels take the paper fill

**Status:** orchestrator default, 2026-10-11, not built. Debt: `panel-paper-fill-unbuilt`. It is not an owner ruling, and the owner may overrule it. It follows the owner's "Fix both" on press movement, which made disclosure panels overlay the list (`motion-disclosure-panels-arrive`). An overlay with no fill shows the list rows through it.

An overlay panel takes the paper fill. `paper` is the page colour in `shared/tokens.json`. A paper fill is opaque, so the list rows do not show through it. The option grids still read as raised, because their own cells paint a surface over the panel's rule.

Kind: build

Plan: docs/decisions/ruled-head-panels-carry-no-fill.md#the-open-edge-question (web)

**Holds while:** `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. The paper fill is not built.

## The open edge question

The old no-fill rule kept panels free of square, full-bleed edges, because every other filled surface here is a rounded inset card. The default uses `paper`, not `card`. It does not answer the edge point. Whether the square edges show with `paper` is unmeasured. The owner should check it on a screen. Build the fill once the owner rules.

The option grids still read, because `optGrid` paints `line` and each `optCell` paints `card` over it. The cells sit slightly raised against the page. The rule "do not reintroduce the fill" is superseded for overlay panels by the default above.

## See also

- `ruled-head-masthead-vocabulary` — the region thesis this rule protects.
- `ruled-head-range-picked` — a disclosure panel that the default now covers.
- `motion-disclosure-panels-arrive` — the overlay ruling that makes the fill needed.
