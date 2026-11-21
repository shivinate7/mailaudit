# When the ground moves

**Premises** (I could not check any of them, because the brief told me not to read the repo): the CSV comes from a browser extension (source: brief), unknown · each seller ships separately in a plain envelope (brief), unknown · the export fields are stable (implied), unknown · copies sync through a private server (brief), unknown. No failing premise found. Simpler route: none seen.

## Import dialects with an overlap proof
- **Idea:** treat each CSV source as a named dialect: the extension's export, the marketplace's own order page saved as CSV, or a hand-made sheet. When an import's headers don't match a known dialect, the tool shows a one-time column-mapping screen and saves the mapping. Before it trusts a new or changed dialect, it re-imports a month it already knows and shows whether the two agree.
- **Who, why now:** the collector, on the day the extension breaks. Today that day stops the tool cold. Every new card goes unrecorded until someone writes a fix.
- **Shape:** the drop zone reads the header row and either names the dialect it matched or says "new format". On a new format, the mapping screen shows each column next to 3 sample rows (for example `Order #TX-48213`, `Lightning Imp`, `$0.27`). Then comes the agreement panel: "March 2026: 212 cards, $61.40 in both sources, 0 differences" or "4 differences" with the rows listed. Data needed: a header fingerprint per dialect, a mapping per dialect, and an order-key rule that matches across sources.
- **Risks:** a wrong mapping corrupts cost data without any sign, which is why the agreement panel is required, not optional. Two sources may key orders differently, which makes duplicates.
- **Owner decides:** may an import go ahead with zero overlap months? Which fields are required (order id, seller, card, price)?

## Box mode: shipments sit above orders
- **Idea:** split "what I bought" (order) from "what arrived" (shipment). Today each package is one seller. If the marketplace starts sending one box with cards from many sellers, the collector opens that box and checks off cards from 30 sellers at once.
- **Who, why now:** the collector during a consolidation trial. Packages-per-seller stops matching the mailbox, and checking in card by card across 30 seller rows is slow.
- **Shape:** "Open a box" starts a session. Typing part of a card name narrows the list to cards still outstanding from any seller. A tick stamps that box's id and arrival date on the card. When the session closes, it shows "48 of 51 expected. Missing: 3 cards from 2 sellers". Data needed: a shipment record (id, date, optional tracking number) and a link from each card line to a shipment. Envelopes become one-seller shipments, so nothing old changes meaning.
- **Risks:** existing saved check-ins must migrate with no loss. A box with no packing slip leaves the expected count unknown.
- **Owner decides:** build this now as a dormant layer, or only once a consolidated box actually arrives? Is an unexpected card in a box an orphan or a surplus?

## Delivered, not received
- **Idea:** once some orders carry tracking (for example the marketplace requires it above $20), the lost-mail flag splits in two. An untracked order keeps the age clock. A tracked order shows the carrier's status. The sharpest flag is "carrier says delivered 3 days ago, nothing checked in", which points to misdelivery or theft and gives evidence for a claim.
- **Who, why now:** the collector, as more of the mail becomes tracked. A delivery scan turns "maybe lost" into a fact that can be acted on.
- **Shape:** a tracking column, filled from the CSV when present or pasted by hand. A badge on each package: in transit / delivered / delivered-not-received. Carrier transit times also feed the untracked clock with real per-route medians ("this seller's envelopes take 6 days, flag at 14"). Data needed: tracking number, carrier, last status and its date.
- **Risks:** fetching status automatically means carrier API keys, rate limits and a poller on the server. Tracking numbers plus an address history are sensitive.
- **Owner decides:** pasted status only, or a server fetch that runs once each time the app opens (no standing timer)? How long to keep tracking numbers?

## Policy calendar
- **Idea:** one dated table of marketplace rules: claim window (for example 45 days), fee percent, free-shipping threshold, tracking threshold. Deadlines and cost figures read the row whose dates cover the order. When the platform changes a rule, the collector adds a row. No code changes.
- **Who, why now:** the collector, every time terms change. A hard-coded rule quietly goes wrong. A dated row keeps old orders correct and new orders correct.
- **Shape:** the lost-mail flag gains an "act by" date from the claim window ("report by Dec 3, 9 days left"), and those orders sort to the top. The cost view splits each card's landed cost into price, shipping share and fees ("$0.25 card, $1.31 landed"), and compares months under different rows. Data needed: the policy rows, plus the shipping and fee fields if the CSV has them.
- **Risks:** a row typed wrong moves every deadline. If the CSV lacks a fee split, the derived numbers are estimates and must say so.
- **Owner decides:** may the tool give buying hints ("orders under $5 cost 3x in shipping"), or only report?

## Raw vault and replay
- **Idea:** keep every imported file exactly as it arrived (hash, date, dialect) and keep check-ins apart from parsed rows. When the parser improves or a dialect mapping is fixed, the tool re-parses every stored file and shows what would change before it changes anything. A one-button export writes the whole ledger to a documented plain format, so the collector keeps a record if the export or the marketplace goes away.
- **Who, why now:** the collector years from now. An import parsed with yesterday's rules may hide errors that only a replay finds.
- **Shape:** an "Imports" list (file, date, dialect, rows kept and dropped). "Replay all" shows a difference preview: "+2 cards found, 1 price corrected, 0 check-ins lost". Data needed: raw file bytes in the private store.
- **Risks:** storage grows, which is small for CSV. Raw files hold order history, so they need the same protection as the synced copies.
- **Owner decides:** keep raw files forever, or for N months? May a replay ever change a past cost, or only add?

Strongest: Import dialects with an overlap proof — the browser extension is the most fragile thing the tool depends on, and this change turns its failure from a full stop into a 5-minute column mapping with proof that the new source agrees.
