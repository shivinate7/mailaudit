# The browser chrome colour must track the paper token

The `theme-color` value in `build.mjs` and the `<style>` page background both track the `paper` token (`#F2E9DA`). If `paper` changes, change both in the same commit. Otherwise, Safari's chrome sits as a mismatched band above the page.

**Holds while:** the built `index.html` sets the theme colour and page background to `#F2E9DA`, the `paper` token value in `shared/tokens.json`.

The icon was designed against this palette first. The interface followed from it. See `icon/gen-icon.py` for the icon side.

## See also

- `design-parchment-ledger` — the palette this browser chrome color must track.
- `palette-tokens-contrast-floor` — the token table `paper` belongs to.
