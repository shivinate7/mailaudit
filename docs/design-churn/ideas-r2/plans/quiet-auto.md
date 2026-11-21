# The tool you rarely open

Premises. I worked blind, so I could not check any of these against the code. Each one is **unknown**.
- P1 (brief): the collector exports CSVs by hand. Only Direction 3 depends on it.
- P2 (inferred): the native app can show a local notification. Direction 1 depends on it.
- P3 (inferred): the private server can run a small daily job. Directions 1, 2 and 4 depend on it.
- P4 (inferred): the export carries order status, such as cancelled, refunded or shipped. If it does not, Direction 3 shrinks to the staleness alarm.
- P5 (inferred): the marketplace has a lost-mail claim window. The owner enters its length. I assumed no real policy.
- Possible clash: CLAUDE.md, loaded in context, holds the invariant `orphaned-mail-never-decides` (orphaned mail never decides anything). Direction 5 proposes a match only, and its decision sits with the owner.

## 1. Mail-day call
**Idea:** the tool learns from past check-ins how long each seller takes to arrive. On a mail day it sends one notification at the usual mail time: "Expecting 3 today: Bramblecard Co., Owlfeather TCG, Tidepool Cards." Tapping it opens a check-in sheet with only those envelopes. Each gets one big "came" button. A "something else came" link opens the full list.
**Who / why now:** with hundreds of cards from dozens of sellers, the full checklist is the cost. Showing the five likely envelopes instead of 140 open lines turns check-in into a ten-second task.
**Shape:** per seller, a typical and a slow arrival window, from order date to check-in date. Fall back to an overall average until a seller has three arrivals. One notification per mail day, and none when nothing is expected.
**Risks:** a wrong forecast teaches the collector to ignore the call. A seller that ships late but arrives fast throws the window off. Notifications may need permissions the app lacks today (P2).
**Owner decides:** notification time, fixed or learned. Whether weekends and holidays count. Whether the full list stays one tap away or becomes the default again.

## 2. Claim clock
**Idea:** the one moment that truly needs a human is deciding whether to report an envelope as lost. Everything else feeds that decision. Once a week, at most one card appears: "OW-48213, 4 cards, $3.12, from Duskmoor Games. 11 days past its slow window. The claim window closes Thursday." It has two buttons, File and Wait a week, plus a claim message drafted for the collector to copy. The tool never sends anything.
**Who / why now:** small losses add up only when deadlines pass unnoticed. A late flag is not the payoff. Acting before the window closes is.
**Shape:** inputs are lateness against the seller's slow window, order value and the claim deadline (owner-set length from P5). Orders below a value floor drop from the card and go into a "written off" line in the totals.
**Risks:** pushing the collector to file early hurts relations with honest sellers. A wrong deadline length gives false urgency.
**Owner decides:** the claim window length, the value floor, and whether Wait snoozes for one week or until the deadline.

## 3. Import that closes its own loops
**Idea:** each new export is compared with the one before it. Cancelled and refunded orders leave the outstanding list on their own. A partial shipment splits into two expected envelopes. Duplicate rows are dropped. The tool also notices when it has gone blind: "Your newest order is 19 days old. Orders since then are invisible to me."
**Who / why now:** outstanding counts go stale when the marketplace has already settled an order, and the collector should not have to clear it by hand. The staleness alarm is the only input the tool cannot make for itself.
**Shape:** per-order status history across imports, and a list of "changed since last import" lines for the weekly receipt. Nothing already checked off is ever unchecked by an import.
**Risks:** depends on P4. A refunded order whose mail still arrives later must show as received anyway, not vanish.
**Owner decides:** whether refunded-but-arrived counts in cost basis at $0 or at its original price. How many days without a new export before the alarm fires.

## 4. Quiet receipt
**Idea:** the tool earns trust by showing its work, not by asking. A short weekly receipt lists every act it took on its own, each with an undo:
- merged 2 imports;
- retired 3 refunded orders;
- 9 envelopes in flight, all within their normal window.
It also runs a self-audit: rebuild the totals from the raw imports and the check-ins, and compare them across devices through the server. A match prints "All 212 cards accounted for, 3 devices agree." A mismatch is the only alarm.
**Who / why now:** any feature that acts unseen (1 to 3) needs this, or the collector reopens the full list to check. The receipt is what makes thirty seconds feel safe.
**Shape:** an action log kept only for the receipt, which is its named reader, trimmed to eight weeks. One count signature per device per day. The receipt is a screen, plus an optional single weekly notification.
**Risks:** a receipt nobody reads is noise. Keep it to five lines, and send nothing when nothing happened.
**Owner decides:** in-app only or notified. How long the undo lasts.

## 5. Postmark memory
**Idea:** sellers ship from the same post office every time. When an attributed envelope arrives, the collector can type its postmark ZIP or city, or snap it. The tool learns where each seller ships from. When an unlabelled envelope arrives later, its postmark and arrival date rank the candidates: "Likely Tidepool Cards (same ZIP 3 times, due this week)."
**Who / why now:** orphaned envelopes are the one item that never resolves itself. Postmark plus forecast is a strong signal the owner has likely not tracked.
**Shape:** an optional postmark field at check-in. A per-seller set of origin ZIPs. A ranked candidate list on each orphan. A human confirms every match.
**Risks:** a seller's ZIP is semi-personal data, so it stays private to the ledger. A stored postmark photo stays in history forever. A suggestion can slide into an automatic decision, so a human must confirm each match.
**Owner decides:** whether a suggestion is allowed at all under the invariant `orphaned-mail-never-decides`. Typed ZIP or photo.

Strongest: Claim clock — it reduces the whole tool to the one weekly decision only the collector can make, and it moves money that would otherwise be lost quietly.
