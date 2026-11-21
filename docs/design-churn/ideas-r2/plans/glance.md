# The two-second glance

Premises (blind brief, so none checked against code or records):
- The CSV holds order date, seller, card, price, and possibly a ship date (brief, inferred). Unknown.
- The native apps can host widgets and local notifications (brief: iPhone and folding Android). Unknown.
- The sync server can push (brief: "small private server"). Unknown. No direction below needs it.

## Mail forecast tile
- Idea: a home-screen and lock-screen widget that answers "how many envelopes should be in the box today?" Example: "Today ~4 · 3 likely: Ridgeway Cards, Owl & Anvil, PaperMint".
- Who and why now: the owner walks to the mailbox every day. Today the app only says what is outstanding. The tile says what is due, so a short day reads as a signal and not as noise.
- Shape: for each seller, keep the days from order to check-in that the app already records. Learn a median per seller, with a fallback for all sellers. The widget shows a count and up to three seller names. Tap opens check-in with those packages already filtered.
- Data: order date, check-in date, seller. Optional ship date. No server.
- Risks: a new seller has no history, so the forecast is a guess. Mark it "~". Widgets refresh on the OS's schedule, so the count can lag an import.
- Owner decides: lock-screen detail (count only, or seller names too). Whether a weekend or holiday shows "no mail day".

## Claim-window nudge
- Idea: the only notification the app sends. It fires when a lost-mail flag is about to become money lost. Example: "2 packages ($6.85) pass your claim cutoff Friday. Report now?"
- Who and why now: the app already flags late mail, but a flag only helps while the marketplace still accepts a non-delivery claim. Low-cost cards make each claim feel too small to chase, so a batch that adds them up is worth a tap.
- Shape: at import and at each check-in, schedule local notifications. No push server. Group them: at most one a week, and only when the total passes a threshold. The action opens a list ready to copy into a claim form.
- Must never interrupt: an arrival, a finished sync, an import, an orphaned envelope, or a single late card under the threshold.
- Risks: the claim window is invented here (for example 30 days after the estimated delivery date). If the real rule differs, the nudge lies. Local notifications go stale after a check-in on another device, so reschedule on each sync.
- Owner decides: the window length and the dollar threshold. Weekly or only on a deadline.

## Sorting-session live activity
- Idea: when the owner sits down with today's pile, a Live Activity (iPhone) or the cover screen of the folding Android phone shows a running count. Example: "7 of ~11 in · $23.40 arrived · 1 orphan".
- Who and why now: check-in happens with both hands full of envelopes. Looking at a glanceable count is faster than scrolling back through a list. A finished set can show for a moment: "Lightning Bolt 4/4 complete".
- Shape: the first check-in starts it. It ends after 10 idle minutes. It reads data in the app only.
- Risks: the Live Activity budget and battery cost. The folding phone's cover-screen APIs vary by vendor. Watch the clutter: one line, no buttons.
- Owner decides: whether a completed set earns a mention at all, or only a count.

## Share-to-manifest bridge
- Idea: a share-sheet action. The owner shares a marketplace "your order shipped" email, or a photo of an envelope's return address, to MANIFEST. The app matches it to an outstanding package, or holds it as a pending order until the next CSV export.
- Who and why now: CSV exports come in batches. Mail for orders placed since the last export arrives with nothing to match, so it looks orphaned. The bridge closes that gap without opening the app.
- Shape: parse the seller name, order id (for example "ORD-48213-K") and total from shared text, or read the return address from a photo with on-device text recognition. Show one confirm sheet: "Match to Owl & Anvil, 3 cards?" Never match without that tap.
- Risks: email formats drift. A pending order must merge cleanly with the CSV row that later describes it, without making a duplicate. A misread address must not mark the wrong package.
- Owner decides: whether shared emails are kept or dropped after the parse. Whether a pending order counts toward money outstanding.

## Morning mail-preview reader
- Idea: some postal services email a daily preview of scanned envelopes. If the owner gets one, the app reads it and updates the forecast tile: "Preview: 5 envelopes, 3 look like card mail".
- Who and why now: it turns a forecast into a near-fact before the mail comes, and it catches a missing envelope on the day it goes missing.
- Shape: forward the email to the private server, or share it on the phone. Count the scans, and match the sender text to known sellers.
- Risks: the highest privacy load of all five, because it exposes all household mail and not just card mail. It depends on the format of a third-party email. It may simply not exist where the owner lives.
- Owner decides: whether household mail may reach the server at all. On-phone only is the safer default.

Strongest: Claim-window nudge — it is the one glance that turns an existing lost-mail flag into recovered money, and local scheduling means it needs no server and no new watcher.
