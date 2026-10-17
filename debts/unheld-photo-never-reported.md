# A lost photo is never reported

**What.** The app never names a lost photo to the owner. `photoPlan` in `src/photo-rules.mjs` returns `lost` for a photo that this device and the Worker both lack. Nothing in `src/` reads that list. Test 31.15 checks the list, not a report. A restore can cause a loss: the restoring device drops its id, and the other device may sweep its blob.

**Status:** ruled 2026-10-17; build pending

**Decision:** `pull-warns-on-what-it-drops`.
