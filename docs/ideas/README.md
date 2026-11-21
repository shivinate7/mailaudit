# Feature directions for MANIFEST

**Status:** ideas only. Nothing here is built, planned for a lane, or ruled on. Each row is a direction for the owner to keep, cull or send to a plan.

Ten planners each worked blind from one lens and a one-paragraph description of the app. None was shown the screens or the code. They proposed 53 directions in all (the access planner sent two passes). 14 of them, about a quarter, were sent back for a second, fuller pass, and each of those 14 has an interactive mockup. **The unit ranked here is a direction, not a planner.** One plan file can hold several directions.

## Shortlist, ranked

Rank is the orchestrator's judgment: the owner's outcome first, then how small the first slice is. Gold standard for each row: a first slice that needs no new data source and changes no invariant.

| # | Direction | Lens | One-line pitch | Gap to gold standard | Plan | Mockup |
|---|---|---|---|---|---|---|
| 1 | Card speaks for itself | Mail day | Match by the card in hand, not the envelope. It works when both the slip and the return address are missing. | First slice (type-ahead, no camera) meets it. The camera is a second slice. | [plan](plans/mail-day.md#phase-2-card-speaks-for-itself-fleshed-out) | [mockup](mockups/card-speaks-for-itself.html) |
| 2 | Import receipt | Trust | Before an import merges, see "112 new, 12 already here, 4 look doubled", then undo the whole import in one step. | Undo needs an import tag on each card, which touches `saved-state-shape`. | [plan](plans/trust.md#phase-2-import-receipt-fleshed-out) | [mockup](mockups/import-receipt.html) |
| 3 | Landed cost | Money | A $0.25 card from a one-card order really cost $0.71. Spread postage, tax and fees per card. | Meets it if the CSV carries shipping per order. Fee split unknown. | [plan](plans/money.md#landed-cost-phase-2) | [mockup](mockups/landed-cost.html) |
| 4 | Proof at the door | Loss | Record *wrong / damaged / missing / empty* and a timed photo the moment the envelope opens. That evidence cannot be had later. | New outcome field per card. | [plan](plans/loss-and-claims.md#proof-at-the-door-phase-2) | [mockup](mockups/proof-at-the-door.html) |
| 5 | Mail drop | Ingestion | Forward marketplace emails to a private address. Orders, shipped dates and refunds then arrive on their own. | Needs inbound mail on the Worker, which is unknown. Overlaps the orders extension in flight. | [plan](plans/ingestion.md#mail-drop-phase-2) | [mockup](mockups/mail-drop.html) |
| 6 | Seller record card | Sellers | Tap a seller and see your own history with them: cards arrived, median days, stamps. Nothing new is stored. | Meets it. | [plan](plans/sellers.md#phase-2-seller-record-card-fleshed-out) | [mockup](mockups/seller-record-card.html) |
| 7 | Recovery ledger | Loss | Every at-risk dollar in one strip: at risk, claimed, recovered, written off. It also handles mail that arrives after a refund. | First slice is derived from existing stamps. A refund amount and a "written off" stamp are new. | [plan](plans/loss-and-claims.md#recovery-ledger-phase-2) | [mockup](mockups/recovery-ledger.html) |
| 8 | Tomorrow's envelopes | Ingestion | Read the postal service's daily preview of letter mail. Know which envelopes land today before they do. | Depends on mail drop. Envelope images are household data. | [plan](plans/ingestion.md#tomorrows-envelopes-phase-2) | [mockup](mockups/tomorrows-envelopes.html) |
| 9 | Say it back | Access | Each check-in is spoken and captioned in a clean form ("Aether Bound Wanderer, return side"). Voice check-in comes later. | First slice meets it. Voice input raises a no-native-dialogs question (mic prompt). | [plan](plans/access.md#phase-2-say-it-back-fleshed-out-with-speakable-names-as-its-base) | [mockup](mockups/say-it-back.html) |
| 10 | The reveal | Delight | The tick flips the card face-up in place, then a "today's pulls" tray. "Found its way home" for mail once flagged lost. | Meets it. Must hold `no-layout-shift-under-pointer`. | [plan](plans/delight.md#the-reveal-phase-2) | [mockup](mockups/the-reveal.html) |
| 11 | Mail forecast | Delight | A seven-day strip of the envelopes likely to land, shown as ranges and learned from your own arrivals. | Meets it once about 20 deliveries exist. Ship dates in the CSV unknown. | [plan](plans/delight.md#mail-forecast-phase-2) | [mockup](mockups/mail-forecast.html) |
| 12 | Shelf at check-in | Collection | The tick also records where the card goes (Binder B, Trade box), so "where is my Ember Drake?" has an answer. | Needs a shelf field, which touches `saved-state-shape`. | [plan](plans/collection.md#phase-2-shelf-at-check-in-fleshed-out) | [mockup](mockups/shelf-at-check-in.html) |
| 13 | Shipping drag | Money | "41 orders this year paid more to ship than to buy: $38.10." Ranked by postage ratio. | Meets it. | [plan](plans/money.md#shipping-drag-phase-2) | [mockup](mockups/shipping-drag.html) |
| 14 | Mailbox deputy | Wild card | Whoever brings the mail in scans a fridge QR and logs "4 envelopes". They see no prices and hold no device key. | A second credential kind on the Worker (`the-token-is-a-credential`). | [plan](plans/wild-card.md#phase-2-mailbox-deputy-fleshed-out) | [mockup](mockups/mailbox-deputy.html) |

## Also proposed

These are not shortlisted. A note marks each one that overlaps something that already exists or a shortlisted direction.

| Direction | Lens | Note | Plan |
|---|---|---|---|
| Refund chase | Money | Overlaps the existing "claim filed" and "refunded" stamps, and recovery ledger. | [plan](plans/money.md#refund-chase) |
| Spend drift | Money | Monthly split of cards, shipping, tax and fees. | [plan](plans/money.md#spend-drift) |
| Spend statement | Money | A yearly statement for a chosen date range. | [plan](plans/money.md#spend-statement) |
| Buy-again check | Sellers | Private favourite and avoid lists, checked before buying. | [plan](plans/sellers.md#buy-again-check) |
| Seller-aware lost alarm | Sellers | Same idea as calibrated lateness and the silence clock. | [plan](plans/sellers.md#seller-aware-lost-alarm) |
| Trouble-handling record | Sellers | Overlaps the stamps, and claim packet. | [plan](plans/sellers.md#trouble-handling-record) |
| Shipping and loyalty | Sellers | Overlaps shipping drag. | [plan](plans/sellers.md#shipping-and-loyalty) |
| Claim clock | Loss | Partly exists as the dated "claim filed" stamp. | [plan](plans/loss-and-claims.md#claim-clock) |
| Claim packet | Loss | Needs proof at the door first. | [plan](plans/loss-and-claims.md#claim-packet) |
| Calibrated lateness | Loss | Retunes the existing lost-mail warning. | [plan](plans/loss-and-claims.md#calibrated-lateness) |
| Outside-in | Mail day | Envelope camera. Same idea as "the envelope reads itself" and slip scan. | [plan](plans/mail-day.md#outside-in) |
| Hands-off loop | Mail day | Overlaps say it back and counter mode. | [plan](plans/mail-day.md#hands-off-loop) |
| Pile sorter | Mail day | Overlaps shelf at check-in. | [plan](plans/mail-day.md#pile-sorter) |
| Problem tray | Mail day | Overlaps proof at the door and the orphaned pile. | [plan](plans/mail-day.md#problem-tray) |
| Paid vs worth now | Collection | Needs an outside price source. | [plan](plans/collection.md#paid-vs-worth-now) |
| Surplus out | Collection | A sell-or-trade list for duplicates. | [plan](plans/collection.md#surplus-out) |
| Set within reach | Collection | Set-completion goals. | [plan](plans/collection.md#set-within-reach) |
| Grab this page | Ingestion | Overlaps the orders extension in flight. | [plan](plans/ingestion.md#grab-this-page) |
| Who said what, and when | Ingestion | Rules for when sources disagree. Needed once more than one source exists. | [plan](plans/ingestion.md#who-said-what) |
| Slip scan | Ingestion | Read the packing slip's order id. | [plan](plans/ingestion.md#slip-scan) |
| Tick journal | Trust | Partly exists as the recent-checks log. | [plan](plans/trust.md#tick-journal) |
| Visible disagreement | Trust | Touches the accepted risk `merge-later-change-wins`. | [plan](plans/trust.md#visible-disagreement) |
| Household recovery kit | Trust | Touches `nothing-recovers-without-the-key`. | [plan](plans/trust.md#household-recovery-kit) |
| Self-audit | Trust | Checks that the three copies agree. | [plan](plans/trust.md#self-audit) |
| One thumb, bottom half | Access | Thumb-zone layout. | [plan](plans/access.md#one-thumb-bottom-half) |
| Readable in any light | Access | State shown by shape and word, not by colour alone. | [plan](plans/access.md#readable-in-any-light) |
| Feel it, hear it | Access | Haptic and sound palette. | [plan](plans/access.md#feel-it-hear-it) |
| Forgive everything | Access | Partly exists as the recent-checks undo. | [plan](plans/access.md#forgive-everything) |
| Envelope in hand | Access | A one-thumb mode for one open package. | [plan](plans/access.md#envelope-in-hand) |
| Speakable names | Access | Folded into say it back. | [plan](plans/access.md#speakable-names) |
| Counter mode on the fold | Access | The Duo half-folded on the counter. | [plan](plans/access.md#counter-mode-on-the-fold) |
| Readable in the dark | Access | Overlaps readable in any light. | [plan](plans/access.md#readable-in-the-dark) |
| The envelope reads itself | Access | Overlaps outside-in. | [plan](plans/access.md#the-envelope-reads-itself) |
| Postmark book | Delight | A habit record with no streak to break. | [plan](plans/delight.md#postmark-book) |
| Year in cards | Delight | A month-end and year-end almanac. | [plan](plans/delight.md#year-in-cards) |
| Haul postcard | Delight | Share a day's haul as an image, with no prices. | [plan](plans/delight.md#haul-postcard) |
| Mail weather | Wild card | Overlaps mail forecast. Adds "last day to order before a trip". | [plan](plans/wild-card.md#mail-weather) |
| Postmark atlas | Wild card | A pooled, opt-in transit map. Speculative. | [plan](plans/wild-card.md#postmark-atlas) |
| Many small envelopes | Wild card | Keep a seam between "mail" and "cards". | [plan](plans/wild-card.md#many-small-envelopes) |

## How this was made

- One planner per lens: money, sellers, loss and claims, mail day, collection, ingestion, trust, access, delight, and a wild card told to avoid the other nine.
- Each plan file starts with the planner's first pass. Shortlisted directions add a "Phase 2" section: the flow, the screen states, the data, the smallest first slice, and the owner's decisions, each with a recommended answer.
- Phase 2 told planners which features already exist, so they could build on them rather than reinvent them.
- All names, prices and order ids are invented.
- Each mockup is one self-contained HTML page. It shows the folded phone, then the two-screen pose, in light and dark (`#…&t=dark`). Frame sizes and colours are the designers' own picks, not the app's tokens.
- Blindness was partial. Planners were told not to read the repo, but some phase-2 answers name the app's views (Packages, Tally), so the project file may have reached them.
