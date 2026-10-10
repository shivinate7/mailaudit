# A completed package is gilded, not badged

Finishing a package draws one pass of gold across the card. The gild runs on the same beat as the stamp. The gild is the only thing that marks completion. The progress bar cannot show that moment itself. It is mounted only while `gotQty > 0 && !done`, so it is gone before it can ever render at 100 percent. The bar cannot mark its own completion, because it does not survive it. The card does.

The gold band is ornamental, and it never carries information. Here, it carries none.

The gate has a second reason. It survived the fix for the 28px card shift only because the bar was taken out of flow rather than given a reserved slot. A reserved slot would have to stay mounted at 100%. The bar would then sheen its own completion next to the gild. See `card-reserved-geometry`. Test 44.5 fails if the gate is removed.

## See also

- `card-the-bar-is-out-of-flow` — the reason the progress bar cannot mark its own completion.
- `motion-use-just-became` — the gate that keeps this gild from replaying on every render.
