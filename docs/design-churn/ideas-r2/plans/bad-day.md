# The bad day

Premises (source kind: brief or inferred). All are unknown, because the brief forbids reading the repo.
- The tool keeps cost, seller, order id and arrival date for each card (brief). unknown
- Copies sync through a small private server (brief). unknown
- Received does not mean still owned. I know of no "left the collection" status (inferred). unknown
- The devices that hold the record are in the same house as the cards (inferred). unknown

## Salvage Count
- **Idea:** check-in run backwards. After a pipe bursts, every received card is "expected" again. The collector marks each one survived, damaged or gone. The cards marked gone, with their cost, are the loss list.
- **Who, why now:** the collector, in the week after the event, while the claim is open. The check-in mechanic already exists, so this is the cheapest loss tool to build.
- **Shape:** "Start salvage" takes a date and a scope (everything, or one box). Cards pool by name with a count stepper: "Lightning Imp x4: 3 survived, 1 damaged". The end screen reads "Gone: 318 cards, $604.20 paid. Damaged: 41, $77.10." It exports three lists. Data: received cards and their cost, plus one salvage state per card.
- **Risks:** cards that were sold, traded or given away count as gone, which overstates the loss to an insurer. A salvage run that writes into check-in state would wreck months of records.
- **Owner decides:** track exits, or put a caveat on the export. Keep salvage as its own layer (recommended) or make it a mode of check-in.

## Claim Packet
- **Idea:** one export that an adjuster accepts without a phone call. The arrival date proves the collector had the card, which no receipt does.
- **Who, why now:** the insurer, and the collector who must prove purchase and possession together.
- **Shape:** "Export claim packet" gives a PDF and a CSV. A row reads `TX-48812 · Paper Moon Cards · Lightning Imp · $1.35 · ordered 2026-08-02 · arrived 2026-08-09`. The cover page reads "1,940 cards, $3,812 paid, Jan to Nov 2026". Scope: everything, or only the salvage losses. Data: what the tool already holds.
- **Risks:** cost basis proves purchase, not replacement value. A card bought for $0.40 may now sell for $30. A full-history file sent by email is personal data stored somewhere else.
- **Owner decides:** add a current-value column (this needs a price source), or print "documented cost only".

## Box Numbers
- **Idea:** each received card gets a home, a box or binder number. A house move then becomes a check-in, with boxes in place of packages.
- **Who, why now:** the collector on moving day, and the mover who asks what was in box 12.
- **Shape:** check-in shows a chip that stays set, "Into: Box 7". The collector sets it once per mail run, so no card needs an extra tap. The box view reads "Box 7: 212 cards, $391 paid". On moving day every box shows as outstanding, and the collector ticks each one as it comes off the truck. One tap sends a missing box to Salvage Count as gone.
- **Risks:** the printed label must carry the box number only. A label that lists contents or value is a shopping list for a thief. Cards move between boxes, so the record drifts. At hundreds of cards a month, any extra tap per card is abandoned by week two.
- **Owner decides:** a box per card or per order, and whether to add a re-box step.

## Sub-limit Watch
- **Idea:** many home policies cap collectibles unless the collection is listed separately. The collector types in the limit from their own policy, and the tool warns as documented cost nears it.
- **Who, why now:** the collector, before the bad day, with no taps needed. Cheap cards add up without anyone noticing: 300 a month at $1.50 is $5,400 a year.
- **Shape:** a setting reads "Collectibles limit: $2,500 (your policy's number)". At 80% a banner reads "$2,040 paid of $2,500. List the collection with your insurer or raise the limit." Per box: "Box 3 holds 41% of total cost."
- **Risks:** an out-of-date limit makes the collector think they are covered. The tool cannot read the policy, and it must not sound like insurance advice.
- **Owner decides:** whether the tool mentions insurance at all, and whether the warning is a banner or a monthly note.

## Copy Outside the House
- **Idea:** a fire takes the phone, the laptop and the cards together. So a sealed monthly copy leaves the house, along with a paper recovery sheet.
- **Who, why now:** the collector after the fire, with no device left. Whether the server copy alone can restore a new phone today is unknown.
- **Shape:** a monthly prompt, "Send this month's copy", sends an encrypted export to a place the owner picks (their own email, a cloud drive, a relative). The sheet prints the restore steps.
- **Risks:** a recovery secret on paper is a credential. A copy in email is data stored somewhere else. A prompt ignored after month two protects nothing.
- **Owner decides:** where the copy goes, whether the sheet holds the secret or only the steps, and how often the copy goes out.

Strongest: Salvage Count — it turns the tool's one proven mechanic into the loss list an insurer asks for, and it needs only one new state per card.
