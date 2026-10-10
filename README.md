# Mail Day Ledger

Mail Day Ledger tracks which TCGplayer card orders have arrived, using OrderWand CSV exports.

The app presents itself as MANIFEST.

**Live site:** https://shivinate7.github.io/mailaudit/

## Build and test

Run these commands from the repository root.

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run check:screens
```

CI runs these commands in [`.github/workflows/test.yml`](.github/workflows/test.yml). Read that file for the full list of checks.

`npm run build` rewrites the committed `index.html`. For the design, the data rules and the seed that the build embeds, see [CLAUDE.md](CLAUDE.md).
