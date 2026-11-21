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
