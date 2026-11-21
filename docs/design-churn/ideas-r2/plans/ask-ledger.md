# Asking the ledger

Premises (source kind, verdict). All are unknown: the brief bars reading the repo, so I could not check any of them against decisions, debts or code.
- The ledger holds per-card rows with seller, order date, price and a received mark (brief). Unknown.
- Copies sync through a private server, so a question could run on any device (brief). Unknown.
- The CSV export may carry no set or edition field (inferred). Unknown. Direction 3's "spend per set" depends on it.
- No language model is wired in today (inferred). Unknown.
Glossary: not checked. The feature names below are product names, not workflow terms.

## Ask box that shows its reading (no model)
- **Idea:** a typed box with a small fixed grammar that runs entirely on the device. Before it answers, it restates the question as editable chips: `Card: Ember Drake` · `Ordered: Tue 10 Nov 2026` · `Asking: arrived?`. A tap on a chip fixes a misread.
- **Who/why:** the collector at the mailbox. Scrolling hundreds of rows to find one card is slower than typing four words.
- **Shape:** about eight question types: did X arrive, what is still out from seller S, spend in a date range, oldest open order, and similar. Fuzzy name match against names in the ledger only. "Last Tuesday" always resolves to a date shown on screen.
- **Refuses:** when two rows fit (an Ember Drake from Hollow Oak Cards and another from Grimfang Games, both that week), it lists both and asks the collector to pick. It never picks.
- **Risk:** the grammar covers too little and feels stiff. Each refusal says which word it did not understand.
- **Owner decides:** the first question types to ship, and whether a saved question can sit on the home screen.

## A model translates, the ledger answers
- **Idea:** an optional language model turns free wording into the same chip query as above. The device runs the query. The model never sees a row, a price or the answer.
- **Who/why:** questions the grammar cannot parse, such as "which of the dragon cards from October are still missing".
- **Shape:** the device sends the question text and the field names. Card and seller names in the question are swapped for placeholders (`CARD_1`, `SELLER_2`) before sending. The model returns a structured query, which is checked against the schema. The user sees the chips before anything runs.
- **Refuses:** when the model names a field that does not exist, such as rarity or set, the app says "your records don't hold that" and does not make one up.
- **Risks:** the question text itself can leak intent. The placeholder swap can miss misspelled names. Each provider has its own retention rules.
- **Owner decides:** whether to add a model at all, which provider, and whether it is off by default with an opt-in per question or per device.

## Answers carry receipts and named refusals
- **Idea:** every answer shows its basis: the rows counted, the date of the newest import, and how many cards are checked in. A short fixed list names the refusals.
- **Refusal list:**
  - "Not marked received" is not "not arrived". The answer says the card is unmarked, never that it is missing.
  - An order newer than the last import is invisible: "your newest import ends 14 Nov".
  - Spend per set needs a set field the CSV may lack. The app refuses, or offers a local name-to-set table the collector fills in. It does no web lookup that sends card names out.
  - Unattributed packages are mentioned and never matched to an order.
- **Who/why:** this guards every other direction. A wrong "yes, it came" costs a refund claim the collector can no longer file.
- **Owner decides:** the refusal wording, and whether a refusal may suggest a next step, such as "import newer orders".

## Seller loss league that shows its definition
- **Idea:** "Which seller do I lose the most mail from?" has no answer until someone defines lost. The answer screen puts that definition up front: a day threshold (21 / 30 / 45). Each seller row reads "3 of 41 packages", never a bare percentage.
- **Refuses:** a seller with fewer than about 8 packages is listed as "too few to rank". Packages still within the threshold are left out of both the count and the total.
- **Who/why:** this decides which sellers to stop buying from. That act moves money, so the number must hold up under a second look.
- **Data:** order date, seller and received date per package. No new storage.
- **Owner decides:** the default threshold, the minimum sample, and whether the per-seller median days to arrive also shows here.

## Say it at the mailbox
- **Idea:** with both hands holding envelopes, the collector says "Got two Forest Sprites and the Ember Drake from Hollow Oak". The phone transcribes on the device, finds candidate rows, and shows them for one tap to confirm. A spoken question ("anything else from Hollow Oak still out?") goes to the ask box.
- **Refuses:** it never marks a card received from speech alone. Every match needs a tap. When the seller cannot be heard clearly, it asks instead of guessing.
- **Risks:** an on-device speech model is needed to keep audio off servers, and support differs by phone. Card names are made-up words, so speech recognition may struggle. Biasing the match toward names in the ledger helps.
- **Owner decides:** phone only or web too, and whether a spoken check-in is allowed on a device with no network.

Strongest: A model translates, the ledger answers. It reaches free wording while rows, prices and answers stay on the device, and the collector can check every answer against chips they see.

## Phase 2: Ask box (fleshed out)

**Premises.** All are marked unknown: the brief bars reading the repo, so none was checked against the code.
- The three views (Packages, Tally, Orphaned), the lost-mail warning, the claim-filed and refunded stamps, and the recent-checks log already exist (source: coordinator brief). Unknown.
- Tally's cost basis has one fixed definition that an answer can reuse (inferred). Unknown. Decision 4 depends on it.
- The CSV holds no set field (inferred from phase 1). Unknown.

**What it is.** A question box that reads the ledger and never writes to it. It shows how it read the question before it answers, says what each answer rests on, and refuses by name when the records cannot settle a question. Slice 1 runs on the device only. Slice 2 adds an optional model that turns free wording into the same reading.

### Flow
1. **Open.** An "Ask" button in the header opens a sheet over the current view. The view underneath does not move (`no-layout-shift-under-pointer`). The input is focused, with four example chips the collector can tap to fill it.
2. **Ask.** The collector types or dictates through the phone keyboard; this feature builds no speech input of its own (spoken check-ins belong to "say it back"). Pressing Enter parses. Nothing answers while the collector is still typing, so no panel jumps.
3. **Reading.** The parse shows as chips, for example `Card: Ember Drake` · `Ordered: Tue 10 Nov 2026` · `Asking: arrived?`. A tap on a chip opens an in-app picker of ledger values, never a native dialog (`no-native-dialogs`).
4. **Answer.** A headline, then up to 8 matching rows, then a receipt line. A tap on a row closes the sheet and scrolls to that row in Packages or Tally.
5. **Done.** The sheet closes. The question and answer are not kept anywhere.

### Question types, slice 1
| Type | Example input | Example answer |
|---|---|---|
| Arrived? | "did the ember drake from last tuesday come" | "Ember Drake ×1, Hollow Oak Cards, ordered Tue 10 Nov. Not marked received. 11 days out; no lost-mail warning yet." |
| All of N? | "did all four forest sprites arrive" | "3 of 4. Open: 1 from Pebble Post Games, ordered 2 Nov, claim filed 18 Nov." |
| Still out from seller | "what's still out from grimfang" | "2 orders, 5 cards, $3.85. Oldest: 29 Oct (lost-mail warning)." |
| Spend in a range | "what did I spend in october" | "$84.12, 63 cards, 19 orders, using Tally's cost basis. Less $3.40 refunded (1 order)." |
| What's late | "what's late" / "which claims are open" | The same list the lost-mail warning shows, plus claims filed without a refund. |
| Already coming? | "is a moss golem coming" | "Yes: 1 from Lantern Row, ordered 15 Nov, open." Pasting a whole cart is the "already coming" feature. |

Dates resolve on the device in the device's own time zone. "Last Tuesday" asked on a Tuesday means 7 days ago, and the chip shows the date it resolved to.

### Screen states
- **Empty.** With no import yet, the sheet says "Import an order CSV first" and links to import. The example chips stay greyed out.
- **Normal.** Chips, headline, rows and receipt. Every number on the screen can be traced to rows the collector can open.
- **Edge, many matches.** Over 8 matching rows: the first 8 plus "Show all 23 in Packages", which applies a filter. The rows never stream into the sheet.
- **Edge, stale.** The receipt reads "Synced 2 h ago; another device may have checked in since." The answer still shows.
- **Error.** If the ledger cannot be read, the sheet says "Couldn't read your ledger" and offers Retry. It does not fall back to cached answers.
- **Refusal.** Same layout, with the headline in a muted tone, the reason, and at most one next step. The reasons:
  - **R1, two rows fit.** Both rows are listed and the collector picks one. The app never picks.
  - **R2, no such name.** "No 'Ember Drak' in your ledger. Closest: Ember Drake, Ember Dragoon." The suggestions come from ledger names only.
  - **R3, unmarked is not missing.** The answer always says "not marked received" and never "didn't arrive".
  - **R4, after the newest import.** "Your newest import ends 14 Nov. Orders after that aren't here." The next step offered is import.
  - **R5, field not held.** "Your records don't hold set or rarity."
  - **R6, unknown sender.** "Who sent the 14 Nov envelope?" gets "Orphaned mail isn't matched to orders" and a link to Orphaned (`orphaned-mail-never-decides`).
  - **R7, unknown question type.** The sheet lists the six question types it can answer.
  - **R8, seller ranking.** "Which seller loses the most?" links to the seller record card and does not rank sellers itself.
  - **R9, vague time.** "In the fall" asks for a date range.

### Receipt (on every answer)
`Counted 4 rows · newest import ends 14 Nov · synced 3 min ago · 412 of 450 cards checked in`. On a spend answer it adds: "cost basis as Tally".

### Data
- **Slice 1 adds no saved field and no storage key.** It reads the existing check-in state, the stamps and the import dates. `saved-state-shape` and `storage-keys-are-frozen` stay untouched.
- **Kept in memory only:** the parse, the matches, and the open sheet.
- **Deferred, each needs an owner ruling under `saved-state-shape`:**
  - nickname aliases ("drake" means Ember Drake);
  - a local name-to-set table for spend per set;
  - a list of recent questions, which would also need a new storage key (`storage-keys-are-frozen`).
- **Parser:** unchanged (`parser-filters`). The ask box never imports anything.
- **Imports:** untouched (`imports-merge-never-replace`).

### Slice 2: exactly what leaves the device
- **Sent from the phone to the private Worker.** The question text with every ledger card and seller name swapped for a placeholder, for example "did CARD_1 from SELLER_1 come on DATE_1". Dates are resolved on the device first. The device key goes along, but only to authenticate to the Worker.
- **Sent from the Worker to the model provider.** That placeholder text plus the fixed schema: the six question types and their slot names, which are public in the source anyway. The provider key lives only as a Worker secret, never on the device and never in the public repo (`the-token-is-a-credential`).
- **Never sent:** rows, prices, the list of sellers or cards, check-in state, stamps, the answer, or the device key.
- **What comes back.** One question type with slots, validated against the schema. Anything outside the schema is refused under R5 or R7. The model cannot add a question type and never produces an answer.
- **Leak guard.** A misspelled name slips past the placeholder swap and would be sent as typed. So the sheet shows the exact outgoing text with a Send button before every call. The Worker logs no question text.

### Smallest first slice that ships alone
- The three most-asked types: arrived?, all of N?, and still out from seller.
- Chips, receipt, and refusals R1 to R4, R6 and R7.
- The same component on web and phone. No new data, no model, read-only.
- Spend, late and already-coming follow as small additions to the grammar.

### Risks
- **Fuzzy match picks the wrong card.** Every match shows as a chip, and two candidates always trigger R1.
- **Stale answers across devices.** The receipt shows the sync age; the app does not block on sync.
- **Spend that disagrees with Tally.** Spend reuses Tally's cost basis; it is not computed a second time.
- **Scope creep toward write actions.** The sheet has no write path and its tests assert that.
- **Test fixtures in a public repo.** Fixtures use invented names only, never a real export.
- **Dictation garbles made-up card names.** R2's "closest" suggestions catch most of it.

### Owner decisions (recommended answer first)
1. **Where it lives.** A sheet over any view (recommended), or a bar above Packages that moves the list.
2. **Can it check cards in?** No, read-only (recommended). Check-ins stay in the views and in "say it back".
3. **Keep recent questions?** No for now (recommended), so there is no new key. Revisit if the owner repeats questions often.
4. **Spend basis.** Tally's existing cost basis exactly (recommended). Refunds show as a separate "less" line.
5. **Does a claim-filed order count as outstanding?** Yes, until it is stamped refunded (recommended). This follows the lost-mail warning's current rule.
6. **Build slice 2?** Not yet (recommended). Build it only if the owner finds slice 1 refusing questions they really ask. If built: opt-in, routed through the Worker, with the outgoing-text preview on every send.
7. **Match strictness.** Never auto-pick between two candidates (recommended); one close match still shows as an editable chip.
