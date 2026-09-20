# A completed package is gilded, not badged

Finishing a package draws one pass of gold across the card, and this gild is the only thing that marks completion. The progress bar cannot show that moment itself, because it unmounts before it can ever reach 100 percent.

## The argument, as recorded

```
- **A completed package is gilded.** One pass of gold across the card, on the
  same beat as the stamp. This is where the completion moment actually lives:
  the per-package progress bar is mounted only while `gotQty > 0 && !done`, so
  it is *gone before it can ever render at 100%* — the bar cannot mark its own
  completion because it does not survive it. The card does. The band is the
  ornamental gold, which is never allowed to carry information, and here it
  carries none.
  That gate is now load-bearing in a second direction, and the reason is worth
  knowing before anyone touches the bar: it survived the fix for the 28px card
  shift **only because the bar was taken out of flow rather than reserved a
  slot**. A reserved slot would have to stay mounted at 100%, and the bar would
  then sheen its own completion next to the gild. See "The card's reserved
  geometry"; test 44.5 is what fails if it is put back.
```

## See also

- `card-the-bar-is-out-of-flow` — the reason the progress bar cannot mark its own completion.
- `motion-use-just-became` — the gate that keeps this gild from replaying on every render.
