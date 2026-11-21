# Loss, disputes and getting money back: five directions

Lens: the arc from "this is late" to "I was refunded", and the evidence the buyer wishes they had kept. Premises, unchecked because the planner worked blind:
- P1, brief: the buyer imports order exports from a marketplace.
- P2, brief: the app tracks arrival per card, synced across web and phone.
- P3, brief: marketplaces have claim windows and evidence rules. True in general; the exact windows are unknown, so no direction should hardcode them.
- P4, brief: the app raises some kind of alert for missing mail.

All order ids (DEMO-…) and shop names are invented.

## proof-at-the-door
- **Idea:** "Received" stops being a yes/no tick. Each check-in records an outcome: *Got it*, *Wrong card*, *Damaged*, *Empty envelope*, *Short*. Any outcome other than *Got it* prompts for a photo of the envelope (postmark, label, seal) and of what was inside.
- **Who gains, why now:** the buyer. The evidence only exists at the moment the envelope is opened. Once it is thrown away, no feature can bring it back.
- **Shape:** the happy path stays one tap. A long press, or a second row of buttons, opens the outcomes. Example: "DEMO-0042 · Owl Lantern Cards · Wrong card → photo 1 of 2". Each photo gets an "opened at" time stamp.
- **Risks:** extra friction across hundreds of cards a month. Photo storage and sync cost. Address labels show the home address, which is a privacy problem if photos ever leave the device.
- **Owner decides:** whether photos are optional or required for a problem outcome; where photos are stored; whether labels are blurred by default.

## claim-clock
- **Idea:** each order gets dates: expected by, earliest day to file, last day to file. Each order also gets a stage: *late → seller messaged → claim filed → resolved*.
- **Who gains, why now:** the buyer who loses refunds because a window closes unnoticed. With many small orders, nobody tracks this in their head.
- **Shape:** a "Clock" list sorted by days left on the claim window, for example "3 days to file · DEMO-0107 · $0.89". One tap records "messaged seller" with the date.
- **Risks:** wrong window numbers give false confidence, and marketplace rules change. So the windows must be rules the owner can edit, never constants buried in code.
- **Owner decides:** where window values come from (presets or owner-entered); whether the phone sends push reminders; whether orders under some value skip the clock.

## claim-packet
- **Idea:** one press per problem order gathers the case: order line, seller, ordered/shipped/expected/opened dates, outcome, photos, message log, and a short neutral summary ready to paste into a claim form.
- **Who gains, why now:** it saves the buyer about 15 minutes of digging per claim (unmeasured), and claims become consistent. This only works once proof-at-the-door and claim-clock have collected the data.
- **Shape:** "Copy claim text" and "Download packet" buttons. Each fact is marked either *logged at the time* or *entered later*. Plain wording, no marketplace branding.
- **Risks:** device clock skew weakens the timestamps. Backdated entries hurt the buyer's credibility. The packet must never look like an official marketplace form.
- **Owner decides:** format (text, PDF, or zip of photos); whether "entered later" facts are shown or left out; the wording of the summary.

## recovery-ledger
- **Idea:** every outstanding dollar sits in one state: *in transit*, *at risk*, *claimed*, *refunded*, *written off*, *arrived after refund*. That last state handles the reverse case: the envelope turns up after the claim was paid.
- **Who gains, why now:** it gives the buyer an honest cost basis (a refunded card that is kept costs $0) and a clean conscience: the app prompts "arrived after refund: repay seller / keep, noted / undo claim".
- **Shape:** a strip of money totals, for example "At risk $14.20 · Claimed $6.75 · Recovered $31.10 · Lost $2.40". Tapping a total lists its orders. A package arriving with no traceable sender can be offered as a possible match to an open claim, but never matched automatically.
- **Risks:** money totals invite trust, so double counting across partial refunds is a real danger. The state model gets more complex than a checkbox.
- **Owner decides:** the list of states; whether "keep, noted" is offered at all; how partial refunds split per card.

## calibrated-lateness
- **Idea:** "late" comes from the buyer's own arrival history (per seller and per ship-from region: median and 90th-percentile days), not from a fixed number. Alerts fire only past the buyer's own normal range.
- **Who gains, why now:** it cuts false alarms. An alert that fires too often teaches the buyer to ignore it, and then real losses get missed. Once a few months of history exist, it is enough to compute from.
- **Shape:** each order shows "usually 4–9 days; day 11 now". The alert carries a confidence: *few data points* or *well known*. During owner-marked peak periods, the threshold widens.
- **Risks:** small samples for new sellers; no data at first use; weekend and holiday effects. A threshold that is too lax can push a filing past the claim window.
- **Owner decides:** the fallback threshold for new sellers; whether the claim window caps the threshold; whether peak periods are marked by the owner or inferred.

Top pick: proof-at-the-door — it is the only direction whose data is lost for good if it isn't captured at the moment the envelope is opened, and the claim packet and the recovery ledger both depend on the outcomes it records.

---

# Phase 2: proof-at-the-door and recovery-ledger, fleshed out

## proof-at-the-door (phase 2)

**What exists and what changes.** Photos on a package already exist. This adds a moment (the envelope being opened), a reason (the outcome) and a time to each photo. Outcomes go into the recent-checks log, so the existing undo covers them. A card is no longer just received or not; a problem gets a named outcome. The lost-mail warning stays, but "Empty envelope" stops it, because the envelope did arrive.

**Flow**
1. Envelope in hand. Open its package in Packages, as today.
2. Optional, before opening: "Envelope photo" of the front (postmark, label, seal), tagged *before opening* with the time.
3. Open it. For each card line, a tap means *Got it*, as today.
4. For a problem, tap "Problem" and pick *Wrong card*, *Damaged* or *Missing*. For the whole package there is *Empty envelope*.
5. A problem outcome prompts "Photo what arrived". Skippable; a skip is marked *no photo*.
6. Optional one-line note, such as "got Moonlit Heron, ordered Glass Wyvern".
7. Done. The package shows a problem badge, the log holds the outcome, undo reverts it.
8. The problem card now shows in the recovery ledger as *At risk*, ready for the existing "claim filed" stamp.

**Screen states**
- Package open: "DEMO-0042 · Owl Lantern Cards · 3 cards · $2.15". Two lines ticked; the third shows chips: Wrong card / Damaged / Missing.
- Photo prompt after *Wrong card*: "Photo what arrived · expected Glass Wyvern · Take photo / Skip".
- Package done with a problem: badge "1 problem · Wrong card · 2 photos · opened 21 Nov 18:44".
- Folding phone: card list on the left pane, camera and photo strip on the right.

**Data**
- Outcome and time per card: new, entered at check-in, synced like check-ins.
- Photo tag (*envelope before opening* or *contents*) and capture time: new fields on existing package photos.
- Expected card name and price: the order import.
- Note: the existing stamp note, or a new outcome note.

**Smallest first slice.** Outcome chips only, with time, badge, log and undo. Photos keep the existing button; a photo taken while a problem outcome is open is tagged automatically.

**Owner decisions**
- Does a problem card count as received? Recommend: the package counts as arrived (stops the lost-mail warning); the card stays outstanding in Tally until resolved.
- Photo required for a problem? Recommend: optional, with a visible *no photo* mark.
- Outcome per card or per package? Recommend: per card, plus *Empty envelope* per package.
- Does undo delete photos? Recommend: no.
- Blur the address label? Recommend: not in slice 1; warn whenever a photo leaves the app.

## recovery-ledger (phase 2)

**What exists and what changes.** It reads the existing dated stamps ("claim filed", "refunded"), the lost-mail warning and the check-ins, and adds no parallel set of states: each state is derived. The per-product cost total gains a refunded amount and a net cost. The orphaned pile may be offered as a possible match for an open claim, never assigned automatically.

**States, all derived:** *In transit* (not arrived, no warning) · *At risk* (lost-mail warning, or a problem outcome) · *Claimed* ("claim filed" and no "refunded") · *Recovered* ("refunded") · *Written off* (a new stamp) · *Arrived after refund* (a check-in later than the "refunded" date).

**Flow**
1. A totals strip sits on top of Packages. Tap "At risk".
2. The at-risk list opens, oldest first.
3. Pick one, file with the marketplace, set the existing "claim filed" stamp.
4. When the refund lands, set "refunded"; its amount pre-fills with the order value and can be edited.
5. Totals move from Claimed to Recovered; Tally's net cost drops.
6. Reverse case: a card on a refunded package is checked in. An in-app sheet asks: Repay seller / Keep, noted / Refund was wrong. Saved as a dated stamp with a note.
7. Done when nothing sits in *Claimed* past the owner's chosen age, or it moves to *Written off*.

**Screen states**
- Strip: "At risk $14.20 (6) · Claimed $6.75 (3) · Recovered $31.10 (12) · Written off $2.40 (2)".
- At-risk row: "DEMO-0107 · Quiet Harbor Games · $0.89 · day 19 · warned 5 days ago".
- Arrived-after-refund sheet: "Refunded $1.25 on 9 Nov · arrived 21 Nov · Repay seller / Keep, noted / Refund was wrong".
- Tally row: "Glass Wyvern ×4 · paid $3.60 · refunded $0.90 · net $2.70".

**Data**
- Stamps, dates, notes, warning state, check-in times: already exist.
- Prices per card: the order import.
- Refund amount: new, optional on "refunded", defaulting to the price of the cards claimed.
- *Written off* stamp: new.
- Problem outcomes: from proof-at-the-door when shipped.

**Smallest first slice.** The strip and lists, read-only, derived from existing stamps and warnings, every refund counted as full. *Arrived after refund* as a badge only.

**Owner decisions**
- Refund amount full or entered? Recommend: full by default, editable.
- Add a *Written off* stamp? Recommend: yes, or *At risk* grows forever.
- Offer "Keep, noted" after a refund? Recommend: yes, no default choice, note required.
- Money per package or per card? Recommend: per card.
- Orphaned mail and open claims? Recommend: suggest, never assign.
- Where does it live? Recommend: a strip on Packages; list in the fold's second pane, full screen on iPhone.
