# Disclosure panels carry no fill

The disclosure panels hold only padding and a top hairline, never a background fill. A filled panel created edges that clashed with the app's own rounded-card surfaces, and it contradicted the ruled region's own thesis. The option grids still read as raised, because their own cells paint a surface over the panel's rule.

## The argument, as recorded

```
**The disclosure panels carry no fill.** `panelWrap` is padding plus a top
hairline and nothing else. It used to set `background: C.card`, which painted a
beige rectangle ruled top and bottom whose left and right edges simply stopped —
square-cornered and full-bleed to the column, in an app where every other filled
surface is a rounded inset card. The fill was the only thing creating an edge to
resolve, and it contradicted the region's own thesis. Don't reintroduce it: the
option grids still read, because `optGrid` paints `line` and each `optCell`
paints `card` over it, so the cells sit slightly raised against the page.
```
