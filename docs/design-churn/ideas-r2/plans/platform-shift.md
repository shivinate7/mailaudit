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

## Phase 2: Box mode (fleshed out)

**Idea.** Today every check-in is assumed to come in its own seller's envelope. Box mode adds an optional shipment layer for a box that holds cards from many sellers. The layer stays dormant: it writes nothing until the collector opens a first box, and existing check-ins never change. Card matching reuses *card speaks for itself*. Logging the box at the door reuses *doorstep pass then bench pass*. *Original receipts* spots a shipment column if the export ever adds one. *Claim clock* owns claim deadlines.

### Flow
1. **Door.** A box arrives. Through the doorstep pass the collector logs it as one item, "Box B-07, Nov 21", and leaves it closed.
2. **Bench.** On Packages, the collector picks "Open a box" from the view's overflow menu. A box session panel opens over the list and shows the box label, today's date, and a tick counter at 0.
3. **Match.** The collector types part of a card name, for example "lightn". Results list every *outstanding* line from every seller: `Lightning Imp · Hollowpine Cards · TX-48213 · $0.27`.
4. **Tick.** A tap checks that line in, stamps the box's date, and adds it to the recent-checks log. The ticked row stays where it is, dimmed with a check, so nothing moves under the pointer. Rows only reflow when the search text changes.
5. **Repeat** until the box is empty. The counter reads "48 ticked · 19 sellers · $22.85".
6. **Close.** The summary shows what came in, any surplus cards, and, when the box has a known expected list, "3 expected cards still outstanding from 2 sellers". Closing writes one "Box B-07 closed" log entry with "Undo box".
7. **After.** Each seller's package shows partly or fully received as it does today, with a small "via B-07" tag. Tally is unchanged except for an optional "arrived in" column.

### Screen states
- **Empty, no outstanding cards:** "Nothing is outstanding, so there is nothing to match." Open is disabled with that reason shown inline.
- **Empty, box just opened:** "Type a card name from the box." The counter is at 0. Closing at 0 discards the box and writes nothing.
- **Normal:** search field, result rows, tick, live counter. Ticked rows stay in place until the next keystroke.
- **Edge, one name with two sellers outstanding:** the row expands inline into two choices. The older order is preselected. One tap confirms, another switches. No native dialog.
- **Edge, quantity split:** an order of 4x `Moss Wyrm` with 3 in the box. Ticks count up as "3 of 4", and the 4th stays outstanding with its lost-mail clock still running.
- **Edge, already received:** "Checked in Nov 12 (Hollowpine). Duplicate purchase?" Offers "Count as surplus". It never ticks a second time.
- **Edge, matches no order:** "Not on any order." Offers "Set aside as surplus", which lists the card in the box summary only. It attaches to no order and decides nothing.
- **Edge, seller split across box and envelope:** a seller's 5 cards, 3 in B-07 and 2 by envelope next week. The package shows "3 via B-07, 2 outstanding".
- **Error, save fails** (storage blocked, quota): an inline banner says "Not saved. Your 12 ticks are held here." with Retry. The session cannot close until a save succeeds.
- **Error, sync conflict** (the same box edited on phone and web): ticks merge as a union. A tick undone on one device and kept on the other shows inline as "B-07: 1 tick differs", with both versions listed.
- **Error, interrupted** (app killed mid-session): the box stays open. The next launch shows "B-07 is still open, 17 ticked: Resume / Close".

### Data
| Field | Where | Rule it touches |
|---|---|---|
| `boxId` (optional) on a check-in | the existing check-in record | `saved-state-shape` (needs an owner ruling) |
| `boxes[]`: `id`, `label`, `openedOn`, `closedOn`, `surplus[]`, optional `expected[]`, optional `tracking` | inside the existing saved-state object | `saved-state-shape` (ruling); `storage-keys-are-frozen` (no new key: nest inside the existing state) |
| `expected[]` from a future shipment column in the CSV | `boxes[]` | `imports-merge-never-replace`: an import may add expected lines, but never overwrites a hand-set date or tick |

- **Migration: none.** A check-in without `boxId` reads as "own envelope", as it does today. No rewrite and no backfill. Nothing is written until the first box is opened, which is what keeps the layer dormant in the data.
- **Old clients:** a phone app built before this change may drop unknown fields when it saves (unknown; it must be tested). So the first release only *preserves* unknown fields, and writing them is turned on in a later release.
- **Orphaned:** untouched. Surplus cards are not orphans, because their sender (the box) is known. They never check off an order (`orphaned-mail-never-decides` stays intact).
- **Parser:** untouched in slices 1 and 2 (`parser-filters`). Slice 3 reads a shipment column only if *original receipts* detects one.
- **Lost-mail warning:** still runs per order. A box never clears the warning for a card it did not contain.
- **Device key:** not touched.

### Smallest first slice (ships alone, needs no ruling)
**Batch check-in.** The session panel searches outstanding lines across all sellers, ticks them with one shared arrival date, keeps ticked rows in place, and ends with a summary. Each tick is an ordinary check-in plus an ordinary log entry, so it writes **only existing fields**. The box exists only for the length of the session. The slice proves the matcher works on a real mixed box before any change to the saved data is asked for. Its check: on a 50-card mixed fixture, every tick lands on the right order, the saved state is byte-identical in shape to before, and undo reverses each tick.

The later slices, in order: **Slice 2**, boxes saved (`boxId`, `boxes[]`, Undo box, the "via B-07" tag), after the ruling. **Slice 3**, expected list from the CSV and the "still outstanding" line.

### Risks
- An old client strips the new fields on save, so box links are lost without any sign. The preserve-first release order above prevents this.
- A wrong tick on the ambiguous-match default credits the wrong seller and hides a real loss. The choice is shown inline, and undo covers it.
- Rows dimming in place may hide progress on a small phone. The live counter carries progress, not the list.
- A box with no expected list can't say what is missing. The summary says "expected unknown" rather than implying the box is complete.
- If consolidation never comes, slices 2 and 3 are wasted. Slice 1 still pays off for any big mail day.

### Owner decisions
1. **Approve `boxId` and `boxes[]` in the saved state?** Recommend: yes, but only after slice 1 has handled one real box.
2. **Ambiguous match default?** Recommend: the older order, preselected inline and changeable.
3. **Where do surplus cards go?** Recommend: the box summary only, not Orphaned, and never attached to an order.
4. **Undo granularity?** Recommend: per tick, as today, plus one "Undo box" entry that reverses every tick in the session.
5. **How visible while dormant?** Recommend: an overflow-menu entry on Packages always. It moves to the header only while a box is open.
6. **Seller split across box and envelope: one lost-mail clock or two?** Recommend: one per order, unchanged. The box never resets it.
