# Hands-off intake: five ways the list fills itself

Lens: getting data in and keeping it current with no effort. Premises from the brief, unchecked because the planner worked blind:
- The owner loads CSVs exported by a third-party helper.
- The tool merges them into one tick-off list shared between browser and phone.
- Anything manual gets skipped. Unmeasured.
- Emails, tracking, carrier notices, a daily postal scan and marketplace pages exist for these orders. Unknown for each order.
- Planner's own assumption: most low-cost card orders ship as untracked letter mail. Unmeasured; mail-drop's partner directions rest on it.

All seller names and order ids are invented.

## mail-drop
- **Idea:** the owner sets one forwarding rule. Marketplace emails go to a private address the tool owns. Order confirmations create order lines. Shipping notices mark them shipped and record any tracking. Refund and cancel emails close them.
- **Who and why now:** the owner. Every order already sends these emails, so new orders appear within minutes with no export step. The CSV becomes a backfill and a cross-check.
- **Shape:** a one-time setup card shows the address and a "send a test" button. After that, a new order shows up as "Seller Gravel Owl, 4 cards, confirmed 09:12". A small "from email" mark shows where each line came from.
- **Risks:**
  - Emails carry the owner's home address and the seller's name. Strip and store only line items, prices and dates. Delete the raw email after parsing.
  - Email layouts change without notice. An email that fails to parse goes to a "could not read" list, never dropped.
  - The tool must dedupe against lines from CSV imports by order id, never by matching names.
  - Forwarding your own receipts is low risk under the marketplace's terms of service.
- **Decisions:**
  - Forwarding rule (no stored mail login) or read-only mail API access (a token to guard).
  - Whether parsing runs on a server, which then holds the content, or on the device.
  - How long to keep raw mail: none, or 7 days for re-parsing.

## tomorrows-envelopes
- **Idea:** read the postal service's daily preview email of incoming letter mail. Count the envelopes, read the return addresses, and match each one to an open shipped order before it arrives.
- **Who and why now:** this suits untracked mail best. It also gives the earliest warning: an order 9 days past shipping that has never appeared in a preview is a lost-mail suspect.
- **Shape:** the morning view reads "Expected today: 5 envelopes, 3 matched (Seller Gravel Owl, Seller Tin Lantern, Seller North Pike), 2 unknown". At check-in, unknown envelopes become pre-filled orphans that carry their scan image.
- **Risks:**
  - The preview includes other household members' mail. Filter at read time and keep no unmatched images.
  - Reading text from envelope images makes mistakes. A match is only a suggestion and never ticks a card.
  - The postal service may object to reading previews automatically. Use only the owner's own preview email, never its website.
- **Decisions:**
  - Keep matched envelope images or discard them.
  - Whether a match may promote an order to "expected today".

## grab-this-page
- **Idea:** replace the third-party helper with a capture the owner starts. A bookmark button (browser) or a share-sheet action (phone) reads the marketplace order-history page already on screen, in the owner's own signed-in session, and merges it.
- **Who and why now:** this removes a dependency on an outside helper that could break or vanish. One tap while browsing orders already.
- **Shape:** on the order-history page, tap "Send to list". A toast reads "12 orders, 3 new, 1 changed". There is no server-side scraping and no stored marketplace login.
- **Risks:**
  - Terms of service usually forbid automated scraping. Reading one page on the owner's tap is greyer and lower risk. Moving through pages automatically raises the risk.
  - Page structure changes break the capture without warning, so it needs a "0 orders found" alarm.
- **Decisions:**
  - Single-page capture only, or allow multi-page.
  - Keep CSV import as the fallback (recommended: yes).

## who-said-what
- **Idea:** cross-cutting rules for sources that disagree or go quiet. Each line keeps every claim with its source and time. A fixed trust order decides what shows: the owner's own tick beats a carrier delivery scan, which beats a postal preview, then email, then CSV.
- **Silence clock:** the tool learns each seller's usual ship-to-arrive days, counting only mail-delivery days. Lines past that window go "late". Lines near the marketplace's claim deadline go "file now", with the deadline shown.
- **Who and why now:** every automatic source adds a new way to disagree. Without these rules, automation erodes trust in the list.
- **Shape:** a quiet "2 sources disagree" marker that opens a timeline, such as "email: shipped 11-03; carrier: delivered 11-08; you: not ticked". A weekly "sources went silent" line covers a broken forwarding rule or no previews for 3 days.
- **Risks:**
  - Learned windows are thin for new sellers. Use a default window until there are 3 arrivals.
  - Claim-deadline rules are the marketplace's own and can change.
- **Decisions:**
  - May any automatic source ever tick a card? (Recommended: no, only suggest.)
  - The default late and lost thresholds.
  - Whether "file now" links to the claim page.

## slip-scan
- **Idea:** at check-in, the owner photographs the packing slip. The tool reads the printed order id and opens that order with its cards pre-listed. A slip found later moves an orphan to its order.
- **Who and why now:** check-in is the one moment the owner is already acting. This makes it one photo plus ticks, and it cuts orphans.
- **Shape:** tap the camera, then "Order ORD-EXAMPLE-0001, Seller Tin Lantern, 6 cards, tick all / tick some".
- **Risks:**
  - Slips show the owner's name and address. Read them on the device and keep no image.
  - Some sellers include no slip.
- **Decision:** whether slip photos may be kept as evidence for claims.

Top pick: mail-drop. It covers every order (new, shipped, refunded) after one setup step. It needs no stored login and no scraping. It also feeds tomorrows-envelopes and who-said-what: the shipped dates it records start the silence clock and set which orders each morning preview is matched against.

---

# Phase 2: mail-drop and tomorrows-envelopes, fleshed out

## mail-drop (phase 2)

**How it builds on what exists.**
- The browser extension being built pulls orders when clicked. Mail drop works on its own, including orders placed on the phone. Both feed the same merge, matched on the marketplace order id; whichever arrives first creates the line, the other fills gaps.
- Each automatic change is its own recent-checks log entry, with undo.
- A refund or cancel email proposes the existing "refunded" stamp; it never sets it.
- Shipping emails give the lost-mail warning a real shipped date instead of the order date.

**Flow**
1. Settings > Mail drop shows a private forwarding address (invented: `drop-7k2q@example.invalid`), a copy button, and two lines on making a filter rule.
2. The owner adds the rule in their mail app and taps "Send test". The card changes to "Test received 14:02".
3. The owner forwards one past confirmation, sees the parsed order, taps "Looks right".
4. From then on the sync server receives each email, parses it, removes the recipient name and address, stores the line items, and syncs them.
5. New packages show a small "from email" mark.
6. An email the server cannot parse becomes "1 email could not be read". Nothing is dropped silently.

**Screen states**
1. Setup card: the address with copy, "Waiting for test…", then "Test received 14:02 · 1 order · 3 cards".
2. Packages list: "Seller Gravel Owl · 4 cards · $3.18 · confirmed 11-19 · from email".
3. Log: "Email: Seller Tin Lantern marked shipped, 11-20 08:41 · Undo".
4. Attention card: "Refund email: Seller North Pike, 1 card, $0.42. Stamp refunded? [Stamp] [Ignore]", with "1 email could not be read" below.

**Data**
- Confirmation: order id, seller, items, condition, quantity, price, shipping, tax, date.
- Shipping: shipped date, carrier, tracking if any.
- Refund or cancel: amount and lines.
- Delivery path: an inbound-mail receiver on the sync server's domain. Unknown whether the server can take inbound mail today.
- Never stored: recipient name and address; the raw email after the keep window.

**Smallest first slice.** Confirmation emails only: create or merge lines by order id, with the "from email" mark and an undoable log entry.

**Owner decisions**
- Forwarding rule or read-only mailbox access? Recommend: forwarding; no mail login stored.
- Where does parsing run? Recommend: the sync server, stripping personal fields before storing.
- Keep raw emails? Recommend: 7 days, then delete.
- May a refund email set "refunded"? Recommend: no; propose it.
- Extension and email disagree on a price? Recommend: newer source wins, disagreement shown in the log.
- The address leaks? Recommend: a rotate button, and accept only the marketplace's sender domains.

## tomorrows-envelopes (phase 2)

**How it builds on what exists.**
- The lost-mail warning reasons from elapsed time. This adds earlier evidence: "not seen in any preview since shipped".
- An unmatched envelope that arrives goes to the orphaned pile with its preview image attached. A match is only a suggestion.
- A matched preview image attaches to that package's photos.
- It depends on mail-drop: the preview email arrives through the same forwarding address with a second rule.

**Flow**
1. On the mail-drop card, add a second rule for the postal service's daily preview email.
2. Each morning the server receives the preview: one image per envelope front.
3. The server reads return-address text and suggests matches against open shipped orders, by seller, learned return address and a mail-days-only ship window.
4. The morning view shows what is expected today.
5. When mail comes, open a matched package, see the envelope image, tick as today.
6. An unmatched envelope that arrives goes to orphaned in one tap, image attached.
7. Each mail day with no sighting adds evidence to that order's lost-mail warning.

**Screen states**
1. Morning card: "Expected today: 5 envelopes · 3 matched · 2 unknown", with thumbnails.
2. Package detail: "Seller Tin Lantern · 6 cards · seen in preview 11-21", with the envelope image.
3. Unknown-envelope sheet: the image, text read as "R. Ellery, Fairhaven", then "Possible: Seller Brass Heron (shipped 11-17)? [Yes] [Not sure] [Orphan it when it arrives]".
4. Warning: "Seller North Pike · shipped 11-06 · 0 sightings in 11 mail days".

**Data**
- Preview images and text: the forwarded preview.
- Seller return addresses: learned from confirmed matches.
- Shipped dates: mail-drop's shipping emails.
- A mail-day calendar: a built-in table.
- Known gap: the preview covers machine-scanned letter mail only.

**Smallest first slice.** No text reading. Show today's count and thumbnails; the owner taps one and picks the seller; the tool records the sighting and learns that return address.

**Owner decisions**
- Keep images of unmatched mail? Recommend: no; delete within 24 hours (the preview includes other household members).
- What may a match change? Recommend: only "expected today" and "sighted"; never a tick, never an orphan move.
- Where does text reading run? Recommend: the server, images deleted once matched or after 24 hours.
- Does "not sighted" move the lost-mail warning? Recommend: evidence line only, until a month of data measures it.
- How is the preview reached? Recommend: the forwarded email only, never the postal website.
