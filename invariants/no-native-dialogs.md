# No native browser dialogs

This is the rule `no-native-dialogs`. The app never uses `window.confirm`/`alert`. These dialogs block the whole page, and they look wrong in a home-screen app. Every destructive action uses an inline two-tap confirm instead. Those actions are Reset, Discard, Remove stamp, and Restore. Assign checks in on one tap. Pull and Push anyway left the UI on 2026-10-12. Keep this pattern. It started as a sandbox limit, and it is now a UI choice.

The main component has two armable controls, Reset and Restore. Arming one **disarms the others**. The shared `arm`/`disarm` pair does this. Two primed destructive buttons side by side are the exact mis-tap that the pattern prevents. `disarm` still clears `confirmForce`, which nothing sets now.

`arm` takes a value, and it does not always set `true`. **Restore** has one button per version on screen at once. So "which one is primed" has to be an id. Disarming is still a single call. Tests 26.17 and 39.14–39.15 cover this.

`PackageCard` has its own local pair for Remove stamp. `EnvelopeCard` has its own local pair for Discard. Each card runs one timer and has one armed control. The timer clears on unmount.

**Pinned by:** 16.1–16.3 (group 16: only one two-tap confirm is armed at a time), 26.17 (Reset arms), 39.14–39.15 (a restore arms; Reset arms and takes the row), 41.5 (one tap does not restore a remote version). Nothing pins the ban on `window.confirm` and `alert` itself.

Mutants confirmed red: Restore firing on one tap, local or remote (39.14 and 41.5). The Pull mutants (Pull firing on one tap, and arming Pull no longer disarming Reset) left with the Pull control.
