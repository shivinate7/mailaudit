# Discretion

Premises (from the brief, source: brief; all unknown, since this plan is blind and was not checked against code): one collector; web app plus native phone app; CSV import of order history; copies sync through a private server.

## Leak-proof edges
- **Idea:** The phone shows money and seller names before anyone opens the app. Close those places: the app-switcher thumbnail, lock-screen notification text, home-screen widgets, and link previews.
- **Who, why now:** Anyone whose phone lies face-up on a table or gets passed around. The native app is where these surfaces appear, so building it opened this gap.
- **Shape:** When the app goes to the background, a plain cover card replaces the screen ("MANIFEST — 3 due"). Notifications default to "A package may be late". The text "Envelope from Copperleaf Cards, $4.12, order #MW-55821" shows only when an opt-in is set. The web tab title stays neutral, never "$612 outstanding". Data: none new, only a per-device setting.
- **Risks:** Vaguer notifications are less useful. The owner may tap through more often.
- **Owner decides:** The default notification wording. Whether the cover card shows any count at all.

## Counter mode
- **Idea:** A per-device presentation for the shared kitchen tablet. It shows only what to watch for: "Expect 4 plain envelopes this week". No prices, no seller names, no totals.
- **Who, why now:** A partner or housemate who brings in the mail and can tell the collector "one came". The collector doesn't have to explain the spending.
- **Shape:** One big count and a "mail came" button that logs an unmatched arrival for the collector to sort later. Leaving the mode needs a hold-and-confirm, and the button sits away from the main controls. Data: a device-local mode flag. Arrivals go through the normal sync as unmatched items.
- **Risks:** An unmatched arrival must never auto-assign itself to an order, and every tap must be undoable. A mode that leaks money on its first sync is worse than having none.
- **Owner decides:** Does the mode sync? Recommend no: the tablet keeps it, and the phone never inherits it. Does exit need a PIN or only a deliberate gesture?

## Clean brag image
- **Idea:** A built-in export for forum posts like "all 40 arrived from the Duskhollow set". It replaces cropping screenshots by hand.
- **Who, why now:** The collector posting to a hobby forum or Discord. Today a cropped screenshot can still show a total, an order id or a seller's name at the edge.
- **Shape:** "Share progress" makes an image of card names and checkmarks only. Sellers become "Seller A, B, C". Prices, order ids, dates and addresses are dropped, and the image carries no metadata. A preview shows exactly what will post. Data: the existing card list, filtered at render.
- **Risks:** Card names plus counts may still be enough for someone to tell who the buyer is. Users may still screenshot the full view out of habit.
- **Owner decides:** Is the seller always tokenized, or kept when the user chooses? Should a small "via MANIFEST" mark appear?

## Helper mode for a child
- **Idea:** A child opens envelopes and taps "got it". This should feel like a game and show no money.
- **Who, why now:** A collector with a kid who loves opening mail. Today the only choices are to hand over the full ledger or do it alone.
- **Shape:** Big card pictures or names, one tap to mark received, and a star counter. No prices, no import, no delete, no settings. The collector reviews a list of today's helper ticks and can reverse any of them. Data: a device-local mode flag and a "marked by helper" tag on each tick.
- **Risks:** Wrong ticks hide mail that really is lost, so the review step matters. The way out of the mode must be easy for the collector and hard for a child.
- **Owner decides:** Do helper ticks count as final, or wait for review? Do they sync before review?

## Spending fog
- **Idea:** By default, money shows as bands ("under $5", "$50–100 this month"). Exact figures appear only on press-and-hold, and only while the finger stays down.
- **Who, why now:** A screen shared on a video call, or a partner glancing over. It stops the monthly total from becoming a conversation the collector didn't choose.
- **Shape:** A global toggle. Totals, per-card cost and outstanding value all go through one display function. Data: none new. Exact cents stay stored. The fog only changes what is drawn.
- **Risks:** It must stay display-only. Rounded values must never reach exports, cost basis or sync. A total that changes when you hold it could shift the layout under your finger, so the field needs a fixed width.
- **Owner decides:** The band edges. Does fog follow the device or the account? Do CSV exports respect it?

Strongest: Leak-proof edges — they leak on every phone without the collector doing anything, and no in-app mode can cover a screen the app never draws.

## Phase 2: Leak-proof edges (fleshed out)

**Goal:** Money, seller names and order ids stay off every surface the app does not draw itself: the app-switcher thumbnail, the browser tab, OS search, a shared screen, the outer display of a folded phone. The collector turns on nothing for this. The safe behaviour is the default.

Premises, from the coordinator's message, not checked against code (blind): a web app plus native iPhone and dual-screen folding Android apps. The app has a recent-checks log with undo and a lost-mail warning. Whether the app sends OS notifications today is unknown. Whether it puts order ids in URLs is unknown.

### Flow, step by step
1. Mail day at the kitchen counter. The collector checks in "Ashgrove Holo, $3.40" from Packages. The undo toast shows.
2. A text arrives and they swipe to Messages. Before the OS takes its snapshot, the app paints a **cover card** over the whole window: masthead only, flat background.
3. Their nephew swipes through open apps. MANIFEST shows the cover card, not "$612.40 outstanding".
4. They come back. The cover lifts as an overlay fade: nothing under it moves, and the undo toast is still there with its timer paused while hidden.
5. Later they share their screen on a video call to show a binder. On iPhone the app sees screen capture start. Every money figure fogs in place ("$3.40" becomes "$▒▒▒"), and a small fixed badge reads "Amounts hidden while screen is shared".
6. The call ends, capture stops, and the figures return. No dialog either way.
7. On the folding Android phone, the collector folds it with the app open. If the app carries on to the outer screen, the outer screen shows the cover card until they tap it.

### Surfaces and their states
| Surface | Empty (no orders) | Normal | Edge | Error / fallback |
|---|---|---|---|---|
| iPhone app switcher | Masthead | Masthead, flat | Backgrounded mid-press: the press is dropped, nothing gets marked | The cover paints after the snapshot (slow device): fall back to a full-window blur, set the same frame |
| Android recents | Masthead | Recents thumbnail off (API 33+ recents-only flag) | Split-screen beside another app: no cover, because the collector is looking at it | Older Android: in-app cover on pause, best effort |
| Web tab title | "MANIFEST" | "MANIFEST", never a count or total | Several tabs open: all show the same title | none |
| Web, hidden tab | n/a | Cover on `visibilitychange` | Browser tab hover previews may be captured before the cover: documented as best effort | none |
| Shared screen (iOS capture flag; Android 15+ recording callback) | No figures to fog | Figures fog in place, badge shown | Capture starts during a press-and-hold: the figure fogs anyway, and the press continues | No capture API (web, older Android): no auto-fog; the manual fog toggle (slice 2) is the answer |
| Fold or outer display | Masthead | Cover until tapped | Tent or flipped posture with one screen facing outward: treat as shared and fog figures | No posture API: cover on fold only |
| OS search, Siri, history | n/a | The app donates no seller or card names to search | Deep links or URLs carry no order id (e.g. never `#MW-55821`) | none |
| OS notifications (if any) | n/a | "A package may be running late" | Several late: "3 packages may be late" | A detailed preview, e.g. "Copperleaf Cards, $4.12", shows only with opt-in |

**Layout rule.** A fogged figure takes exactly the width of the real one: tabular numerals, the same character count, and "▒" sized to a digit. The badge sits in a slot that is always reserved, so nothing moves under the pointer (`no-layout-shift-under-pointer`). Any confirm, such as "show amounts while sharing?", is an in-app sheet (`no-native-dialogs`).

### Data
- **Slice 1 stores nothing.** The cover, the neutral title, the recents flag and the search opt-out are fixed behaviour. No setting, no field, no key.
- **Slice 2 and later need one per-device preference** (notification detail on or off, auto-fog on or off). It must never enter the synced saved state, because a phone's choice must not follow it to the kitchen tablet. On native it lives in the OS preference store, outside web storage. On web it would need a new local key. That key touches `storage-keys-are-frozen` (owner ruling needed). Adding it to synced state would touch `saved-state-shape` (avoid).
- No change to import, the parser, orphaned mail, or the device key. The cover card must not show sync status or anything derived from the key (`the-token-is-a-credential`).

### Smallest first slice (ships alone)
The cover card on background for iPhone and Android, the Android recents-only flag, and a fixed "MANIFEST" web title. That is about three small native hooks plus one title constant. No data. Check: background the app on each device, open the app switcher, and confirm no figure or seller name is visible. Return with an undo toast open and confirm the toast survived and no row moved.

**Slice 2:** auto-fog on screen capture (iOS first), with the fixed badge slot. **Slice 3:** notification wording, the search and history audit, fold posture. Spending fog's manual toggle would join here and use the same fog renderer: one home for "draw this figure hidden".

### Risks
- **iOS snapshot timing.** If the cover is drawn too late, the leak survives. Test on the slowest supported device, not the simulator.
- **Over-reach on Android.** The full secure flag blocks the collector's own screenshots too, and those are proof for claims and posts. Use the recents-only flag.
- **A badge that cries wolf.** If capture detection fires during AirPlay to the collector's own TV, they learn to ignore it. That is acceptable, because fogging costs little.
- **Undo inside a cover.** The undo timer must pause while hidden, or a check-in becomes final unseen.
- **Web is best effort.** Browser tab previews are outside the app's control. Say so in the spec rather than claim it.

### Owner decisions (recommended answer first)
1. **What does the cover card show?** Recommend: the masthead only. A count like "3 due" can come later as an opt-in.
2. **Android: recents-only flag or the full secure flag?** Recommend: recents-only. The full flag kills the collector's own screenshots.
3. **Auto-fog on screen capture on by default?** Recommend: yes, with the badge and no prompt.
4. **May a press-and-hold reveal a figure while sharing?** Recommend: no while capture is on. The collector who wants to show a figure can stop sharing.
5. **Where does the per-device preference live on web?** Recommend: one new device-local key, never synced, by explicit ruling under `storage-keys-are-frozen`. Native uses OS preferences.
6. **Notification detail?** Recommend: generic text always. Seller and price only with an opt-in per device.
7. **Should a detected screenshot nudge toward a clean share?** Recommend: not yet. Ship nothing that fires on every screenshot until there is a clean-share feature to point at.
