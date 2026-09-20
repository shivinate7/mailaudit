# The browser chrome colour must track the paper token

The `theme-color` value in the build and the page background both track the `paper` token. The icon was designed against this palette first, and the interface followed from it.

## The argument, as recorded

```
`theme-color` in `build.mjs` and the `<style>` page background both track
`paper` (`#F2E9DA`). If `paper` changes, change them in the same commit or
Safari's chrome sits as a mismatched band above the page.

The icon was designed against this palette first and the UI followed; see
`icon/gen-icon.py` for that side of it.
```

## See also

- `design-parchment-ledger` — the palette this browser chrome color must track.
- `palette-token-table-and-contrast-floor` — the token table `paper` belongs to.
