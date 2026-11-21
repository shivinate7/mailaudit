# Buying with intent

Premises (blind run, so I checked none of them against the code):
- The tool sees a purchase only after a CSV import, never as it happens (source: brief). Holds by the brief.
- Purchases happen on the marketplace, not in the tool (source: brief). Holds by the brief.
- The CSV carries order time of day and per-order shipping (source: my assumption). Unknown. Directions 2 and 5 depend on it.
- One collector, with copies synced through a private server (source: brief). Holds by the brief.
Glossary: none of the new names below clash with `GLOSSARY.md`.

## Mail-day verdict
- Idea: when a card is checked in, offer one optional tap: "glad", "fine" or "wouldn't again". Arrival is the moment of joy the tool already owns. This builds the collector's own evidence and needs no rules.
- Who and why now: the collector, every mail day. Hundreds of check-ins a month add up to a large sample quickly.
- Shape: three small marks on the checked row. Skipping is the default. After a month, one line such as "Cards you marked 'wouldn't again': 22, $9.40, 15 of them ordered after 11 pm." Data: one optional field per card, joined to order time, price and seller.
- Risks: an extra tap slows the fast check-in flow. The marks must not move the row under the thumb. Prompt fatigue.
- Owner decides: two or three values; prompt on every card or a sample (say 1 in 5); whether verdicts sync.

## Landed cost
- Idea: show what a cheap card really cost. Example: a $0.25 card with $1.31 postage costs $1.56. Then "this month 34% of spend was postage, and 19 envelopes held one card each."
- Who and why now: a collector who buys from many sellers pays a hidden tax per envelope. This surfaces it without judging the cards.
- Shape: a landed-cost column in Tally and a monthly postage share. Optionally, "sellers you bought one card from 3+ times" as a hint to bundle orders. Data: per-order shipping and tax, split across the items in the order.
- Risks: how to split shipping across a multi-card order. The CSV may lack the field (unknown). Tax and refunds.
- Owner decides: the split rule (even or by price); whether landed cost replaces or sits beside the price paid.

## Hold shelf (a self-chosen cooling-off)
- Idea: the collector parks a card they are tempted by and picks a wait (1 day, 3 days or a week). When the wait ends, the shelf asks "still want it?" The next import matches bought items against the shelf and tags each one "planned" or "unplanned".
- Who and why now: the collector at the moment of temptation. Nothing in the tool serves that moment today.
- Shape: add a name to the shelf, see the countdown, answer keep or let go. A monthly line, such as "61% planned", carries no colour judgment. Data: shelf items (name, added, wait, outcome) and a name match on import.
- Risks: buying happens elsewhere, so the shelf works only if the collector opens it first. Product names may match loosely. A reminder needs phone notification permission.
- Owner decides: in-app reminders only, or push notifications; how strict the name match is; whether "let go" items stay visible as a small win.

## Envelopes in flight
- Idea: a budget in the collector's own units. Besides dollars per month, it can count envelopes still on the way. The outstanding backlog already exists, and it falls as mail arrives, so the brake releases itself through joy.
- Who and why now: a collector who buys faster than mail arrives. Example: "38 envelopes on the way. Your line is 30."
- Shape: a quiet gauge beside the outstanding count, with lines the collector sets and a reset day they choose. Crossing a line changes words, never a red alarm. Data: counts the tool already has, plus the collector's lines.
- Risks: import lag means the gauge reads the past. Lost mail inflates the count unless flagged mail is left out.
- Owner decides: which units to offer (dollars, envelopes, cards); whether lost-flagged mail counts.

## Pattern mirror
- Idea: an opt-in monthly page of plain facts:
  - when orders happen (an hour-of-day strip);
  - bursts (5+ orders within 30 minutes count as one session);
  - chases (one product bought from 3+ sellers, or beyond a copy count the collector sets, such as 4).
- Who and why now: patterns hide inside hundreds of small orders. Tally already pools names, so chases are nearly free to find.
- Shape: no advice. The collector pins a pattern to watch, and a pinned pattern can feed Envelopes in flight. Data: order timestamps and Tally pools.
- Risks: the CSV may lack time of day or a timezone (unknown). It can feel like surveillance, which argues for opt-in.
- Owner decides: opt-in or default; which patterns to show; the copy count that counts as a chase.

Strongest: Mail-day verdict — it uses the one moment the tool already owns (arrival, when buying feels good), costs one optional tap, and gives every other direction the collector's own evidence instead of the tool's opinion.
