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
