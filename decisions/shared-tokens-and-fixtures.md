# Both clients read one token file and one fixture set

**Status:** ruled. The owner ruled on 2026-10-11 to follow Degen's D32 rule that the palette tokens and the test fixtures are shared files. Lane S1 landed in PR #62. Lane S4 landed in PR #65.

The palette and the test data have one home each. The web build and the Swift client both read them, so neither client can drift from the other.

**Holds while:** `shared/tokens.json` holds the palette, and the Swift client needs the same values.

## Tokens

- The file shared/tokens.json replaces the literal `C` in `src/app.jsx`.
- esbuild imports the JSON. Swift decodes it at launch. No Style Dictionary is used.
- Test group 60 of `npm test` checks that the built `C` deep-equals the file (60.4). A drifted value goes red (60.5 and 60.6).
- The palette rules still apply to the values, see `design-parchment-ledger` and `palette-tokens-contrast-floor`.

## Fixtures and golden files

- The folder shared/fixtures holds ledger.json, orderwand.csv and the golden files.
- `test/harness.mjs` reads its `ITEMS` from shared/fixtures/ledger.json. The native app reads the same file.
- The script scripts/gen-golden.mjs writes the golden files from src/view-rules.mjs, on a fixed clock of 2026-08-12T14:03:00Z. The lost-mail and date-range files therefore do not change with the wall clock. Given a folder argument, it writes there instead.
- The golden set is these eight files: parse-items, packages, tally, totals, lost-mail, date-range, sort-packages and sort-tally.
- Swift tests assert that the rules engine output equals the golden files, see `rules-run-in-javascriptcore`.
- `npm run check:golden` runs the generator into a temp folder and diffs the result against shared/fixtures/golden, in both directions. It goes red on a hand-edited golden file, and on a generator that writes nothing. Its output reads `golden ok (N files)` when they match. `npm run test:golden` holds its own tests. CI runs both.
- A change to view-rules output needs `node scripts/gen-golden.mjs` and the golden diff in the same commit, or CI goes red.

## See also

- `native-build-lanes` — lanes S1 and S4.
- `rules-run-in-javascriptcore` — the output that the golden files pin.
- `design-parchment-ledger` — the palette that the tokens carry.
