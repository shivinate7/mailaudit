# Disclosure panels carry no fill

The disclosure panels hold only padding and a top hairline. They never carry a background fill. The option grids still read as raised, because their own cells paint a surface over the panel's rule.

## The reason

`panelWrap` is padding plus a top hairline and nothing else. Do not set `background: C.card` on it. A fill would paint a beige rectangle, ruled top and bottom. Its left and right edges would simply stop. The edges would be square-cornered and full-bleed to the column. In this app every other filled surface is a rounded inset card. The fill would be the only thing creating an edge to resolve. It would contradict the ruled region's own thesis.

Do not reintroduce the fill. The option grids still read, because `optGrid` paints `line` and each `optCell` paints `card` over it. The cells sit slightly raised against the page.

## See also

- `ruled-head-is-the-mastheads-vocabulary` — the region thesis this rule protects.
- `ruled-head-the-range-is-picked-not-typed` — a panel that keeps this rule.
