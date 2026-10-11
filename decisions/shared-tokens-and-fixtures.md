# Both clients read one token file and one fixture set

**Status:** ruled. The owner ruled on 2026-10-11 to follow Degen's D32 rule that the palette tokens and the test fixtures are shared files. Lanes S1 and S4 build them. Neither has landed.

The palette and the test data have one home each. The web build and the Swift client both read them, so neither client can drift from the other.

**Holds while:** `src/app.jsx` holds the palette as the literal `C`, and the Swift client needs the same values.

## Tokens

- The file shared/tokens.json replaces the literal `C` in `src/app.jsx`.
- esbuild imports the JSON. Swift decodes it at launch. No Style Dictionary is used.
- Lane S1 tests that the built `C` deep-equals the file. A drifted value goes red.
- The palette rules still apply to the values, see `design-parchment-ledger` and `palette-tokens-contrast-floor`.

## Fixtures and golden files

- The folder shared/fixtures holds ledger.json (from the harness fixture), orderwand.csv and the golden files.
- The script scripts/gen-golden.mjs writes the golden files from the view rules module.
- Swift tests assert that the rules engine output equals the golden files, see `rules-run-in-javascriptcore`.
- Lane S4 adds `check:golden`. It goes red on a hand-edited golden file.

## See also

- `native-build-lanes` — lanes S1 and S4.
- `rules-run-in-javascriptcore` — the output that the golden files pin.
- `design-parchment-ledger` — the palette that the tokens carry.
