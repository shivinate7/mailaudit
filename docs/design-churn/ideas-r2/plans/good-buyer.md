# A buyer sellers are glad to have

Premises (blind brief, so no repo code was read; checked only against the repo CLAUDE.md index already in context):
- The order data names a seller for each order (brief). Holds: the index says Packages pairs each order with a seller.
- The tool records when each card arrived (brief: "checks off as mail arrives"). Unknown: a stored arrival date was not verified.
- The marketplace has no write API, so messages, feedback and claims all happen outside the tool (assumed). Unknown.
- Every direction below adds saved fields. Risk: invariant `saved-state-shape` (the saved-state shape is fixed) means each new field needs a ruled shape change. Invariant `imports-merge-never-replace` is not affected.
- Glossary: no feature name below uses a workflow term. "Note", "review", "page", "check" and "feedback log" are avoided as names.

## Patience Clock: ask the seller before you claim
- **Idea:** Each overdue order shows two dates: when a kind "nothing yet, no rush" message makes sense, and the last safe day to file a claim. The claim button is quiet until the message has gone out or the deadline is close.
- **Who/why:** Hobby sellers lose real money and standing on a claim over a slow $0.30 envelope. A message first usually ends with "it's in the mail, thanks for asking". Most claims are filed in the week the collector feels anxious, so the nudge has to come at that moment.
- **Shape:** The outstanding list gets a "Day 9 of ~12 typical" bar for each order. Tapping it copies a short, friendly message ("Hi Marisol, order #MW-4471 hasn't shown up yet. No worries, just checking it went out"). The tool stores "asked on". The typical day comes from this seller's past transit times, or from all sellers when this one has too little history.
- **Risks:** A late reminder could cost a claim, so the deadline must fail safe and stay visible. Per-seller transit times are noisy when a seller has only a few orders.
- **Owner decides:** The default wait before asking. Whether the tool may show a claim deadline the marketplace never states. The message wording.

## Make It Right: an envelope that arrives after a refund
- **Idea:** When an order is marked refunded or claimed and a card from it is then checked in, the tool raises a gentle flag: "Paid back by Oakhollow Cards on Oct 3. It arrived after all."
- **Who/why:** It is honest, and it protects the collector's name as a buyer. Late envelopes at this volume are normal, so this will happen often and quietly. The owner probably has not thought about it.
- **Shape:** Each order gets one field: refunded or claimed, with a date and amount. At check-in, a matching card shows a banner with three choices: "pay back", "return card", or "seller said keep it". It also gives a ready message to send. The open items roll up into one "owed" line in the cost view.
- **Risks:** The refund field is entered by hand and will be missed. A banner at check-in must not move the row under the thumb (invariant `no-layout-shift-under-pointer`, no layout shift under the pointer).
- **Owner decides:** Whether "owed back" counts in the cost basis. Whether settling it stays a manual step.

## Two-Tone Damage Heads-up
- **Idea:** A one-tap "arrived rough" at check-in that splits two cases. **Envelope rough, card fine** becomes a thank-you that praises the packing. **Card damaged** becomes a calm report with a photo and a suggested fix (partial refund, replacement, or let it go).
- **Who/why:** Sellers want to know when the post office mangles their mail, and they rarely hear it unless it comes as a complaint. The first case is pure goodwill and costs nothing.
- **Shape:** Tap the card's row, pick a reason (bent, wet, torn sleeve, no toploader), add a photo if you like, and get a message to copy. The seller's history gains a packing score.
- **Risks:** Photos may be kept permanently once synced. That is an open thread, `photos-in-git-are-permanent`. One more tap on the busy check-in path slows the mail-day flow.
- **Owner decides:** Whether to keep photos or only send them. Whether a damage mark pauses feedback for that order (see below).

## Ready-to-Rate Queue
- **Idea:** Feedback is offered only once an order is complete: every card in, no damage still open. The tool drafts fair wording from facts: "All 6 arrived in 8 days, well packed".
- **Who/why:** Fair, prompt feedback is the main thing a small seller gets back from a buyer, and it is easy to forget across hundreds of orders. Waiting for completeness stops a too-early negative rating.
- **Shape:** A short queue of "complete, not yet rated" sellers. Each opens the marketplace's feedback page and has a copy button. Marking one "rated" clears it. A small counter shows how far behind the collector is.
- **Risks:** Text built only from facts can read cold, so the owner edits it. Tracking "rated" adds yet another manual flag.
- **Owner decides:** Whether to suggest a rating at all or only the words. How long to wait after completion.

## Envelope Mirror: what my buying costs the seller
- **Idea:** For each seller, count the separate envelopes the collector made them send in one week. Example: "Pinebrook Games mailed you 4 envelopes this week for $1.90 of cards."
- **Who/why:** A buyer who places four one-card orders makes a kitchen-table seller pay four stamps and pack four envelopes. Seeing that changes buying habits: fewer, larger orders per seller. It also cuts the collector's lost-mail risk.
- **Shape:** A small seller-side panel lists repeat envelopes per week, the estimated postage the seller paid, and a running "envelopes saved" figure once habits change. Data needed: order dates and seller (already present), plus one postage estimate the owner sets.
- **Risks:** It can read as scolding, so it must stay an observation, never an alert. The postage estimate is a guess and must say so.
- **Owner decides:** Whether this belongs in a check-in tool at all. The postage figure. Whether it stays a weekly summary or appears on each order.

Strongest: Make It Right — it is the only direction that catches a real, frequent, silent harm to a seller (paid twice for one card), it fits the existing check-in moment, and it needs one hand-entered field.
