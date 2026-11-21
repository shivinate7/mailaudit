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
