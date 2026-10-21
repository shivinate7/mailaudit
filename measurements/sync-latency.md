# Sync delay from a tap on one device to the row on the other

This record holds the time from a check-in on device A to the row changing on device B, and what held it up. Re-measure with the probe after a change to the sync timers, the apply guard or the Worker socket.

**Status:** measured on 2026-10-20 on a build of main at `3997ee9`, before lane `web/sync-latency`, three runs per case. The build differs from main in one line: `SYNC_URL` in `src/entry.jsx` points at the local Worker. Not measured with the lane's fix, see `sync-latency-after-fix-unmeasured`. A hidden or frozen tab is not measured, see `hidden-tab-apply-delay-unmeasured`.

## How to re-measure

Run the probe. The probe is not in the repo yet, see `sync-latency-after-fix-unmeasured`. It drives two headless Chromium pages through Playwright at 1000 by 800: A is the phone, B is the Mac. Both use one key against a local Worker (`wrangler dev`, port 18787). Both load a built page from `dev-server.mjs` (port 18788), and `SYNC_URL` in `src/entry.jsx` points that build at the local Worker. The probe never calls the live Worker.

A seed script POSTs 80 one-card packages. Both pages wait 13 s so the cold applies land and B is idle. The probe taps the first "Mark as received" on A. It polls B's DOM from Node every 100 ms until the count of unreceived buttons drops. Times come from Node's clock, with the tap as zero.

The probe wraps `WebSocket` in the pages. A case can drop B's socket, block its reconnect, or drop its frames. Stop the Worker and the dev server by the pid each launch printed.

## Reader

None. Group 75 pins the guard on a virtual clock in jsdom. Claim 16 of `check:screens` pins the reply in Chromium against a mocked Worker. Neither one measures a delay through a real Worker.

## Figures

All times count from the tap on A. Each range is the lowest and highest of three runs.

- **Idle (c1):** B changed at 3.1 to 3.3 s. A sent its POST at 3.0 to 3.1 s. B heard the rev within 0.2 s and applied within 0.1 s after that. The delay is the sender's `SYNC_POST_MS` timer, 3000 ms. B added nothing, because it had been idle for 10 s.
- **Mouse moving over B (c2):** the mouse moved every 2 s for 30 s. B changed at 39.0 to 39.1 s, which is 10.0 to 10.1 s after its last move.
- **Ten taps, 2 s apart (c5burst):** B first changed at 21.2 to 21.5 s. A sent one POST, at 21.2 to 21.3 s. Each tap re-armed the 3 s timer, so the POST left 3 s after the tenth tap.
- **Import notice open on B (c5notice):** B did not apply within 45 s. B changed 10.1 to 10.2 s after the probe clicked Dismiss. The probe's own flag for the open notice read false. Its click Dismiss worked.
- **Socket dropped across the rev (c3drop):** the probe dropped B's socket 0.5 s after the tap and blocked reconnects for 20 s. B reopened at 34.0 to 34.1 s. B showed nothing within 60 s. It changed at 63.6 to 63.8 s, which is 3.1 to 3.2 s after a second tap on A.
- **Socket dropped before the tap (c3pre, control):** B reopened 1.0 s after the drop. B changed 3.1 s after the tap.
- **Socket open, frames lost (c3half):** the probe dropped 1 to 3 frames on B's open socket. B did not apply within 60 s. B changed 0.1 s after the probe fired `visibilitychange` on B, the app's resume GET.
- **Hidden or frozen tab (c4, c5freezeA):** the probe could not make a tab hidden or frozen. After a minimize, B reported `visibilityState` visible, and ten chained 10 ms timers took 113 ms. B "frozen" through `Page.setWebLifecycleState` for 30 s still changed at 3.1 to 3.2 s, which is 26.9 s before the unfreeze. A "frozen" the same way fired no freeze event and still sent its POST at 3.0 s. These runs show nothing about a real hidden tab.

The floor from a tap on A to the row on B is `SYNC_POST_MS` plus under 0.3 s. Every other figure above is a hold on top of that floor.
