# No native browser dialogs

The app never uses window.confirm or window.alert. These dialogs block the whole page and look wrong in a home-screen app. Every destructive action uses an inline two-tap confirm instead. Arming one destructive control disarms every other one, so two primed destructive buttons never sit side by side.

## The argument, as recorded

```
6. **No native browser dialogs.** `window.confirm`/`alert` block the whole page
   and look wrong in a home-screen app; every destructive action uses an inline
   two-tap confirm instead (Reset, Discard, Assign, **Pull**, **Push anyway**,
   **Remove stamp**, **Restore**). Keep that pattern. (This started as a sandbox limitation
   and outlived it — it's now a UI choice.) With four armable controls in the
   main component, arming one **disarms the others** via the shared
   `arm`/`disarm` pair: two primed destructive buttons side by side is the
   exact mis-tap the pattern exists to prevent. `arm` takes a *value* rather
   than always setting `true`, because **Restore** has one button per version on
   screen at once, so "which one is primed" has to be an id; disarming is still
   a single call. Tests 26.17–26.19, 39.14–39.15. `PackageCard`
   carries its own local pair for Remove stamp, as `EnvelopeCard` does for
   Discard and Assign — one timer, one armed control, cleared on unmount.
```
