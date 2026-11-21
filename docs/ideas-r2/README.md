# Feature directions for MANIFEST, round 2

**Status:** ideas only. Nothing here is built, planned for a lane, or ruled on. Each row is a direction for the owner to keep, cull or send to a plan.

Round 1 (branch `ideas/feature-directions`, folder `docs/ideas/`) used ten lenses: money, sellers, loss and claims, mail day, collection, ingestion, trust, access, delight, and a wild card. Round 2 used 28 new lenses, in three waves. Each planner worked blind from one lens and a one-paragraph description of the app. None saw the screens, the code or round 1. Together they proposed 138 directions. 12 of them were sent back for a fuller pass, and each of those 12 has an interactive mockup. **The unit ranked here is a direction, not a planner.**

## Shortlist, ranked

Rank is the orchestrator's judgment: the owner's outcome first, then how small the first slice is. Gold standard for each row: a first slice that adds no saved field and keeps every invariant.

| # | Direction | Lens | One-line pitch | Gap to gold standard | Plan | Mockup |
|---|---|---|---|---|---|---|
| 1 | Claim clock | What no competitor copies | Each late order counts down to its last day to claim. One weekly "claim day" lists what to file, with the claim text drafted. | Meets it: badges and the claim-day sheet use the existing stamps. "Let go" (written off) needs a field shared with round 1's recovery ledger. | [plan](plans/moat.md#phase-2-claim-clock-fleshed-out) | [mockup](mockups/claim-clock.html) |
| 2 | The starting line | First hour | A new user answers "since when are you checking mail?" and 300 cards already in binders are marked arrived in one step. | Meets it: the marks are plain check-ins. A ledger-level start date comes later and needs a ruling. | [plan](plans/first-hour.md#phase-2-the-starting-line-fleshed-out) | [mockup](mockups/starting-line.html) |
| 3 | Already coming | Before the cart | Paste a cart before you pay: each line says in transit, already here, or new, with what you paid last time. | Meets it: read-only, nothing stored. Playset targets come later. | [plan](plans/before-cart.md#phase-2-already-coming-fleshed-out) | [mockup](mockups/already-coming.html) |
| 4 | Original receipts | Ten years on | An export whose format changed is held for a column map instead of being parsed into wrong prices. Later, keep every file byte for byte. | Slice 1 (drift guard) meets it. Keeping the files needs a storage key, and row pointers need a shape ruling. | [plan](plans/long-horizon.md#phase-2-original-receipts-fleshed-out) | [mockup](mockups/original-receipts.html) |
| 5 | Doorstep pass, then bench pass | Ten times the volume | Log 40 envelopes at the door in two minutes, then open them at the bench later. Lost-mail depends only on the fast step. | Slice 0 (search-first finder) meets it. The one-tap arrival needs an `arrivedAt` field. | [plan](plans/scale.md#phase-2-doorstep-pass-then-bench-pass-fleshed-out) | [mockup](mockups/doorstep-bench.html) |
| 6 | Trip mode | Away from home | Say "away Nov 3 to 17": late mail reads "held", not lost; claim deadlines stay live; return day starts with an envelope count. | Needs one `trips` field. | [plan](plans/away.md#phase-2-trip-mode-fleshed-out) | [mockup](mockups/trip-mode.html) |
| 7 | Leak-proof edges | Discretion | The app switcher, tab title, outer screen and a shared screen never show money or seller names. Safe by default. | Meets it: slice 1 stores nothing. A per-device preference later needs a key. | [plan](plans/discretion.md#phase-2-leak-proof-edges-fleshed-out) | [mockup](mockups/leak-proof-edges.html) |
| 8 | Orphan clues | What envelopes leave | Packing, postmark, label and handwriting, learned from normal mail, rank who likely sent an orphaned envelope. A human still picks. | Needs one `clues` field. Never assigns (`orphaned-mail-never-decides`). | [plan](plans/packaging.md#phase-2-orphan-clues-fleshed-out) | [mockup](mockups/orphan-clues.html) |
| 9 | Need-by dates | Deck due Friday | Tag the cards a Thursday league needs. A strip reads "5 days, 22 of 26 in hand, 1 at risk". | Needs `events` and `needs` fields. | [plan](plans/deck-deadline.md#phase-2-need-by-dates-fleshed-out) | [mockup](mockups/need-by-dates.html) |
| 10 | Ask box | Asking the ledger | "Did the Ember Drake from Tuesday come?" Shows how it read the question, answers with a receipt, and refuses by name. | Meets it: slice 1 is read-only and on the device. A model is an optional later slice. | [plan](plans/ask-ledger.md#phase-2-ask-box-fleshed-out) | [mockup](mockups/ask-box.html) |
| 11 | Mailbox check-ins | Waiting calmly | One tap records each trip to the mailbox, empty days too, so lateness counts mail days and each trip ends with a calm sentence. | Slice 1 (closing sentence from existing check-ins) meets it. Empty days need a `mailChecks` field. | [plan](plans/waiting.md#phase-2-mailbox-check-ins-fleshed-out) | [mockup](mockups/mailbox-check-ins.html) |
| 12 | Box mode | When the ground moves | If the marketplace starts shipping one box from many sellers, a shipment layer lets you check off 50 cards from 30 sellers in one session. | Slice 1 (batch check-in across sellers) meets it. Saved boxes need `boxId` and `boxes[]`; no migration of old check-ins. | [plan](plans/platform-shift.md#phase-2-box-mode-fleshed-out) | [mockup](mockups/box-mode.html) |

## Where blind planners agreed

Planners who never saw each other's work kept landing on the same few ideas. That is a signal, and it is also why the waves stopped at 28 lenses.

- **Claim deadline** (claim clock, claim-window nudge, one deadline per worry, claim deadlines in the household calendar, trip mode's departure sheet): 6 lenses. Ranked first.
- **Lateness from your own history** (seller rhythm, your own postal clock, seasonal patience, learned seller transit, late is not lost, mail-day clock): 6 lenses. Round 1 has calibrated lateness and the seller record card; these add mail days, seasons and trips.
- **Per-card landed cost** (landed cost, envelope tax, landed-cost splitter, envelope math, where the dollar went): 5 lenses. Round 1 already shortlists landed cost.
- **The envelope identifies the sender** (packing signature, postmark memory, return-address memory, seller memory): 4 lenses. Merged into orphan clues.
- **Keep the raw export** (original receipts, sealed year packet, raw vault and replay, import dialects): 4 lenses. Merged into original receipts.
- **Already coming / double buy** (already coming twice, one ledger catches the double buy, deck-list coverage): 4 lenses.
- **Arrived vs opened** (doorstep then bench, hand-off slip): 2 lenses. Merged into doorstep pass.

## Also proposed

Not shortlisted. Each links to its planner's first pass. Several overlap a shortlisted direction or round 1, as the section above says.

| Direction | Lens | Plan |
|---|---|---|
| A model translates, the ledger answers | Asking the ledger | [plan](plans/ask-ledger.md#a-model-translates-the-ledger-answers) |
| Answers carry receipts and named refusals | Asking the ledger | [plan](plans/ask-ledger.md#answers-carry-receipts-and-named-refusals) |
| Seller loss league that shows its definition | Asking the ledger | [plan](plans/ask-ledger.md#seller-loss-league-that-shows-its-definition) |
| Say it at the mailbox | Asking the ledger | [plan](plans/ask-ledger.md#say-it-at-the-mailbox) |
| Neighbour tally | Away from home | [plan](plans/away.md#neighbour-tally) |
| Envelope count first | Away from home | [plan](plans/away.md#envelope-count-first) |
| Arrival windows, not arrival days | Away from home | [plan](plans/away.md#arrival-windows-not-arrival-days) |
| Travel copy | Away from home | [plan](plans/away.md#travel-copy) |
| Salvage Count | The bad day | [plan](plans/bad-day.md#salvage-count) |
| Claim Packet | The bad day | [plan](plans/bad-day.md#claim-packet) |
| Box Numbers | The bad day | [plan](plans/bad-day.md#box-numbers) |
| Sub-limit Watch | The bad day | [plan](plans/bad-day.md#sub-limit-watch) |
| Copy Outside the House | The bad day | [plan](plans/bad-day.md#copy-outside-the-house) |
| Seller report card | Before the cart | [plan](plans/before-cart.md#seller-report-card) |
| Landed-cost splitter | Before the cart | [plan](plans/before-cart.md#landed-cost-splitter) |
| Money in the mail | Before the cart | [plan](plans/before-cart.md#money-in-the-mail) |
| Price memory | Before the cart | [plan](plans/before-cart.md#price-memory) |
| Split Box (pooled orders with a handoff slip) | Circle outside the house | [plan](plans/circle.md#split-box-pooled-orders-with-a-handoff-slip) |
| Mail Weather (is it me, or the post office?) | Circle outside the house | [plan](plans/circle.md#mail-weather-is-it-me-or-the-post-office) |
| Seller Word-of-Mouth | Circle outside the house | [plan](plans/circle.md#seller-word-of-mouth) |
| Spares and Wants | Circle outside the house | [plan](plans/circle.md#spares-and-wants) |
| House-Sitter Check-In | Circle outside the house | [plan](plans/circle.md#house-sitter-check-in) |
| Learned seller transit: "who ships fast" | Deck due Friday | [plan](plans/deck-deadline.md#learned-seller-transit-who-ships-fast) |
| Last safe re-buy day | Deck due Friday | [plan](plans/deck-deadline.md#last-safe-re-buy-day) |
| Deck-list coverage check | Deck due Friday | [plan](plans/deck-deadline.md#deck-list-coverage-check) |
| Mail-day routing and the proxy sheet | Deck due Friday | [plan](plans/deck-deadline.md#mail-day-routing-and-the-proxy-sheet) |
| Counter mode | Discretion | [plan](plans/discretion.md#counter-mode) |
| Clean brag image | Discretion | [plan](plans/discretion.md#clean-brag-image) |
| Helper mode for a child | Discretion | [plan](plans/discretion.md#helper-mode-for-a-child) |
| Spending fog | Discretion | [plan](plans/discretion.md#spending-fog) |
| Envelopes before data | First hour | [plan](plans/first-hour.md#b-envelopes-before-data) |
| The export coach and the import receipt | First hour | [plan](plans/first-hour.md#c-the-export-coach-and-the-import-receipt) |
| Tomorrow's mail | First hour | [plan](plans/first-hour.md#d-tomorrows-mail) |
| Phone at the mailbox, key in the drawer | First hour | [plan](plans/first-hour.md#e-phone-at-the-mailbox-key-in-the-drawer) |
| Mail forecast tile | Two-second glance | [plan](plans/glance.md#mail-forecast-tile) |
| Claim-window nudge | Two-second glance | [plan](plans/glance.md#claim-window-nudge) |
| Sorting-session live activity | Two-second glance | [plan](plans/glance.md#sorting-session-live-activity) |
| Share-to-manifest bridge | Two-second glance | [plan](plans/glance.md#share-to-manifest-bridge) |
| Morning mail-preview reader | Two-second glance | [plan](plans/glance.md#morning-mail-preview-reader) |
| Patience Clock: ask the seller before you claim | Good buyer | [plan](plans/good-buyer.md#patience-clock-ask-the-seller-before-you-claim) |
| Make It Right: an envelope that arrives after a refund | Good buyer | [plan](plans/good-buyer.md#make-it-right-an-envelope-that-arrives-after-a-refund) |
| Two-Tone Damage Heads-up | Good buyer | [plan](plans/good-buyer.md#two-tone-damage-heads-up) |
| Ready-to-Rate Queue | Good buyer | [plan](plans/good-buyer.md#ready-to-rate-queue) |
| Envelope Mirror: what my buying costs the seller | Good buyer | [plan](plans/good-buyer.md#envelope-mirror-what-my-buying-costs-the-seller) |
| Ask the house before "lost" | Several buyers, one mailbox | [plan](plans/household.md#ask-the-house-before-lost) |
| Twin envelopes: seller collision warning | Several buyers, one mailbox | [plan](plans/household.md#twin-envelopes-seller-collision-warning) |
| Hand-off slip: arrived vs opened | Several buyers, one mailbox | [plan](plans/household.md#hand-off-slip-arrived-vs-opened) |
| Sealed gift orders | Several buyers, one mailbox | [plan](plans/household.md#sealed-gift-orders) |
| Settle up: who owns vs who paid | Several buyers, one mailbox | [plan](plans/household.md#settle-up-who-owns-vs-who-paid) |
| Card identity that survives renames | Ten years on | [plan](plans/long-horizon.md#card-identity-that-survives-renames) |
| Closing a year | Ten years on | [plan](plans/long-horizon.md#closing-a-year) |
| Seller record that outlives the seller | Ten years on | [plan](plans/long-horizon.md#seller-record-that-outlives-the-seller) |
| A copy anyone can read without MANIFEST | Ten years on | [plan](plans/long-horizon.md#a-copy-anyone-can-read-without-manifest) |
| Share-to-ledger capture | Beyond one marketplace | [plan](plans/many-marketplaces.md#share-to-ledger-capture) |
| Lots with unsplit cost | Beyond one marketplace | [plan](plans/many-marketplaces.md#lots-with-unsplit-cost) |
| Tender, not just price | Beyond one marketplace | [plan](plans/many-marketplaces.md#tender-not-just-price) |
| Hand-carried promises | Beyond one marketplace | [plan](plans/many-marketplaces.md#hand-carried-promises) |
| One ledger catches the double buy | Beyond one marketplace | [plan](plans/many-marketplaces.md#one-ledger-catches-the-double-buy) |
| Your Own Postal Clock | What no competitor copies | [plan](plans/moat.md#your-own-postal-clock) |
| Envelope Tax | What no competitor copies | [plan](plans/moat.md#envelope-tax) |
| Already Coming | What no competitor copies | [plan](plans/moat.md#already-coming) |
| Seller Memory | What no competitor copies | [plan](plans/moat.md#seller-memory) |
| Received, but wrong | Not as ordered | [plan](plans/not-as-ordered.md#received-but-wrong) |
| Printings in the pooled count | Not as ordered | [plan](plans/not-as-ordered.md#printings-in-the-pooled-count) |
| Expected-card card | Not as ordered | [plan](plans/not-as-ordered.md#expected-card-card) |
| Seller reliability ledger | Not as ordered | [plan](plans/not-as-ordered.md#seller-reliability-ledger) |
| Spot-check for cards worth faking | Not as ordered | [plan](plans/not-as-ordered.md#spot-check-for-cards-worth-faking) |
| Packing Grade: one tap on how it arrived | What envelopes leave | [plan](plans/packaging.md#packing-grade-one-tap-on-how-it-arrived) |
| Supply Bin: what the mail gives back | What envelopes leave | [plan](plans/packaging.md#supply-bin-what-the-mail-gives-back) |
| Envelope Math: the cost of one card at a time | What envelopes leave | [plan](plans/packaging.md#envelope-math-the-cost-of-one-card-at-a-time) |
| Door clipboard: the Mail Day sheet | Paper and objects | [plan](plans/paper.md#door-clipboard-the-mail-day-sheet) |
| Return-address memory | Paper and objects | [plan](plans/paper.md#return-address-memory) |
| Provenance labels on the sleeve | Paper and objects | [plan](plans/paper.md#provenance-labels-on-the-sleeve) |
| Orphan tray tickets | Paper and objects | [plan](plans/paper.md#orphan-tray-tickets) |
| Import dialects with an overlap proof | When the ground moves | [plan](plans/platform-shift.md#import-dialects-with-an-overlap-proof) |
| Delivered, not received | When the ground moves | [plan](plans/platform-shift.md#delivered-not-received) |
| Policy calendar | When the ground moves | [plan](plans/platform-shift.md#policy-calendar) |
| Raw vault and replay | When the ground moves | [plan](plans/platform-shift.md#raw-vault-and-replay) |
| Walkaway Archive | Data that can leave | [plan](plans/portability.md#walkaway-archive) |
| Arrivals Feed for Collection Tools | Data that can leave | [plan](plans/portability.md#arrivals-feed-for-collection-tools) |
| Share Slice Page | Data that can leave | [plan](plans/portability.md#share-slice-page) |
| Lost-Mail Claim Packet | Data that can leave | [plan](plans/portability.md#lost-mail-claim-packet) |
| Cost-Basis Ledger | Data that can leave | [plan](plans/portability.md#cost-basis-ledger) |
| Mail-day call | Tool you rarely open | [plan](plans/quiet-auto.md#1-mail-day-call) |
| Claim clock | Tool you rarely open | [plan](plans/quiet-auto.md#2-claim-clock) |
| Import that closes its own loops | Tool you rarely open | [plan](plans/quiet-auto.md#3-import-that-closes-its-own-loops) |
| Quiet receipt | Tool you rarely open | [plan](plans/quiet-auto.md#4-quiet-receipt) |
| Postmark memory | Tool you rarely open | [plan](plans/quiet-auto.md#5-postmark-memory) |
| Seasonal patience | Rhythm of the hobby | [plan](plans/release-calendar.md#seasonal-patience) |
| Preorder parking | Rhythm of the hobby | [plan](plans/release-calendar.md#preorder-parking) |
| Release-week premium mirror | Rhythm of the hobby | [plan](plans/release-calendar.md#release-week-premium-mirror) |
| Claim-deadline countdown | Rhythm of the hobby | [plan](plans/release-calendar.md#claim-deadline-countdown) |
| Slow-month close-out | Rhythm of the hobby | [plan](plans/release-calendar.md#slow-month-close-out) |
| Seller rhythm | Ten times the volume | [plan](plans/scale.md#seller-rhythm) |
| Count, then spot-check | Ten times the volume | [plan](plans/scale.md#count-then-spot-check) |
| Claim clock | Ten times the volume | [plan](plans/scale.md#claim-clock) |
| Close the month | Ten times the volume | [plan](plans/scale.md#close-the-month) |
| Arrival-day condition note | Card's second life | [plan](plans/second-life.md#arrival-day-condition-note) |
| Exit ledger, with cost carried out | Card's second life | [plan](plans/second-life.md#exit-ledger-with-cost-carried-out) |
| Promised before it lands | Card's second life | [plan](plans/second-life.md#promised-before-it-lands) |
| Game-night pull list | Card's second life | [plan](plans/second-life.md#game-night-pull-list) |
| Bulk lot builder | Card's second life | [plan](plans/second-life.md#bulk-lot-builder) |
| Mail-day verdict | Buying with intent | [plan](plans/self-control.md#mail-day-verdict) |
| Landed cost | Buying with intent | [plan](plans/self-control.md#landed-cost) |
| Hold shelf (a self-chosen cooling-off) | Buying with intent | [plan](plans/self-control.md#hold-shelf-a-self-chosen-cooling-off) |
| Envelopes in flight | Buying with intent | [plan](plans/self-control.md#envelopes-in-flight) |
| Pattern mirror | Buying with intent | [plan](plans/self-control.md#pattern-mirror) |
| Mail-preview forecast | The house already knows | [plan](plans/smart-home.md#mail-preview-forecast) |
| Mail-day clock | The house already knows | [plan](plans/smart-home.md#mail-day-clock) |
| Carrier-at-the-door nudge | The house already knows | [plan](plans/smart-home.md#carrier-at-the-door-nudge) |
| Hands-full voice check-in | The house already knows | [plan](plans/smart-home.md#hands-full-voice-check-in) |
| Claim deadlines in the household calendar | The house already knows | [plan](plans/smart-home.md#claim-deadlines-in-the-household-calendar) |
| Basis that travels with the copy | Tax year | [plan](plans/tax-year.md#basis-that-travels-with-the-copy) |
| Intent at the mailbox | Tax year | [plan](plans/tax-year.md#intent-at-the-mailbox) |
| Lost-mail resolution trail | Tax year | [plan](plans/tax-year.md#lost-mail-resolution-trail) |
| Sealed year packet | Tax year | [plan](plans/tax-year.md#sealed-year-packet) |
| Use-tax watch | Tax year | [plan](plans/tax-year.md#use-tax-watch) |
| Not yet due, so not shown | Waiting calmly | [plan](plans/waiting.md#not-yet-due-so-not-shown) |
| Late is not lost: worry from the collector's own history | Waiting calmly | [plan](plans/waiting.md#late-is-not-lost-worry-from-the-collectors-own-history) |
| One deadline per worry | Waiting calmly | [plan](plans/waiting.md#one-deadline-per-worry) |
| One calm sentence first, numbers on request | Waiting calmly | [plan](plans/waiting.md#one-calm-sentence-first-numbers-on-request) |
| Where the Dollar Went | Young collector | [plan](plans/young-collector.md#where-the-dollar-went) |
| Two Collectors, One Doorstep | Young collector | [plan](plans/young-collector.md#two-collectors-one-doorstep) |
| Don't Worry Until | Young collector | [plan](plans/young-collector.md#dont-worry-until) |
| First Look | Young collector | [plan](plans/young-collector.md#first-look) |
| Set Builder | Young collector | [plan](plans/young-collector.md#set-builder) |

## How this was made

- One planner per lens, in three waves: 16 lenses, then 8, then 4. Each planner got the lens and one paragraph about the app, and nothing else. Each proposed 3 to 5 directions.
- The orchestrator picked 12 directions, about a third of the planners. Each went back to its own planner for a "Phase 2" section: the flow, the screen states, the data and the rule each field touches, the smallest first slice, risks, and the owner's decisions, each with a recommended answer. Phase 2 told planners which features already exist and what round 1 covers, so they could build on it.
- Then one designer per shortlisted direction drew its mockup from the Phase 2 section.
- Planners ran as the read-only Plan role. The guard on agent models refused the Opus model for a planner that writes files, and the Plan role runs Opus, so each planner returned its text and the orchestrator committed it word for word.
- All names, prices and order ids are invented.
- Designers may write only in `docs/design/` (guard designer-scope). The orchestrator moved each mockup into `mockups/` when merging it.
- Designers flagged plan gaps they had to settle to draw: trip mode's return-day counts did not add up (the mockup uses 25 counted, 31 expected, 22 checked, 3 to Orphaned, 9 not here); need-by dates says both "refunded counts as not coming" and "at risk"; the ask box resolves "last Tuesday" to two different dates. A choice a mockup made that the plan did not is labelled "Needs an owner grant" on the page.
- Each mockup is one self-contained HTML page: the phone, then the two-screen folding pose, with a state picker, in light and dark (`#t=dark`). Frame sizes and colours are the designers' own picks, not the app's tokens.
- The waves stopped when new lenses kept returning ideas already proposed (see "Where blind planners agreed"). The session could not read its own usage, so usage did not set the stop.
