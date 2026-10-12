# Phone navigation waits for a mockup

The top view switch stays on every layout until the owner decides. On 2026-10-11 the owner remarked that a bottom tab bar is "technically right". That is a remark, not a ruling. The owner also needs a mockup first, and remarked: "our fronthead is so pretty atm".

**Status:** open. The owner must review a mockup before any decision. No lane changes the top switch until then.

**Holds while:** `src/app.jsx` has no bottom navigation bar, and no mockup of one has been accepted.

## Options for the owner

- Keep the top switch on every layout.
- Add a bottom bar to the native client only, in lane N5 of `native-build-lanes`.
- Add a bottom bar to the web app and the native client.

The house default for a phone is a bottom tab bar. See `ux-house-rules-govern`.

## See also

- `three-views-share-one-switch` — the top switch that stays for now.
- `masthead-is-one-letterhead` — the head the switch sits in.
- `ux-house-rules-govern` — the house default that names a bottom bar.
