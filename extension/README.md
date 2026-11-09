# MANIFEST orders (Chrome extension)

Reads your TCGplayer order history from a signed-in tab and sends it to the ledger Worker. Plan: `docs/plans/orders-extension.md`.

## Load it

1. Open `chrome://extensions` and enable Developer mode.
2. Press Load unpacked and pick this `extension/` folder.
3. Press the extension's icon. The options page opens.
4. Paste the extension's device key and press Save key. The page says whether the server accepted it.
5. Sign in to TCGplayer. The next store page that finishes loading pulls, if the last pull is over 12 hours old. Pull now on the options page pulls at once, in an open `store.tcgplayer.com` tab.

The icon shows the number of new lines, `in` when you are signed out, `!` on any other failure, and `…` while a pull runs. Its title says which state it is.

## Change it

- `npm run build:extension` rebuilds `pull.js`, `tokens.css` and `badge-colors.mjs`. Commit the result. Do not edit those three by hand.
- `npm run build:extension-icons` rebuilds `icons/` from `favicon_svg()` in `icon/gen-icon.py`.
- `npm run test:extension` tests the pure logic in `core.mjs`.
