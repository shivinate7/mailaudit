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
