# Paper and objects

Premises (source: brief; I could not check them, because the brief says work blind):
- The envelopes are plain and often carry no order number. Unknown.
- The CSV names the seller for each order, but maybe not the seller's city or address. Unknown.
- The phone app can use the camera. Unknown.
- Copies sync through a small private server. Stated in the brief, not checked.

## Door clipboard: the Mail Day sheet
- **Idea:** Print one sheet a week and hang it on a clipboard by the door. It has one row per expected envelope: seller, card count, days in transit, and a tick box. Each row also has a small QR code that holds a short order code, for example `K7Q-4F`.
- **Who and why:** The collector, standing at the mailbox with a stack of envelopes and no phone in hand. Ticking a box is quicker than unlocking an app, and a sheet that stays up all week shows the backlog without anyone opening anything.
- **Shape:** The app prints the sheet, sorted by oldest expected first. Rows past the lost-mail threshold are shaded. Later the collector scans each ticked row's QR once and the app marks the order received. The paper only records intent. The scan is what writes the data.
- **Data:** Open orders, each with a short code. Each sheet gets a print stamp, for example "printed Sat 14 Nov, 38 open".
- **Risks:** Two sources of truth. A ticked box that never gets scanned is not recorded. To catch this, the app could ask "sheet from 14 Nov has rows you never scanned?" when the next sheet prints.
- **Owner decides:** Does a scan mark the whole order received, or only open a card-level check-in? Weekly sheet or a sheet on demand? Letter paper or a narrow receipt printer?

## Return-address memory
- **Idea:** Photograph the front of an envelope. The app reads the return address and the postmark city, then suggests which seller sent it. The first envelope from a seller is matched by hand. After that, the app remembers what that seller's envelopes look like.
- **Who and why:** The envelope with no packing slip, which today goes straight to Orphaned. Small sellers reuse the same address label every time, so the envelope is the most reliable clue the collector has.
- **Shape:** "Who sent this?" brings up the camera. The app reads the text on the device. It offers the top three open orders, ranked by seller match, postmark date against ship date, and card count by weight or thickness. One tap confirms. If a packing slip shows an order number, the app reads that too.
- **Data:** For each seller, the address text from past envelopes, stored as a normalized or hashed form. Postmark city, if it can be read.
- **Risks:** Seller addresses are often private homes, so they are personal data and must not sync in plain text. Text reading on handwriting is weak. A wrong suggestion must never mark anything by itself: orphaned mail stays a human decision.
- **Owner decides:** Keep the address text on the device only, or store a hash? Delete the photos after matching? Is a slower on-device text reader acceptable?

## Provenance labels on the sleeve
- **Idea:** At check-in, print a small thermal label for each card or order. It shows the card name, the price paid, the seller's initials, the arrival date and a QR code. The label goes on the team bag or the top loader, so the cost basis stays with the card in storage.
- **Who and why:** The collector a year later, when selling, trading or valuing the collection. The ledger knows the cost of each card, but the card in the box does not. A scan answers "what did I pay, and is this the copy from the seller who sent damaged cards?"
- **Shape:** After "received", the app shows "Print label". It prints one label per card, or one per order for a bulk lot. Scanning a label opens that card's record. A second, optional label type for boxes and binders lets the collector scan a card label and then a box label to record where the card went.
- **Data:** Card line, price, order, arrival date, and optionally a box id.
- **Risks:** Label stock costs money and needs a printer. A Bluetooth label printer may be hard to drive from a web app (unknown). The box feature could turn MANIFEST into an inventory app.
- **Owner decides:** Is storage location in scope? Should the label show the price in plain text when the card might be sold or shown to others?

## Orphan tray tickets
- **Idea:** Give mail with no known sender a physical home. Print a sheet of numbered tickets (O-001, O-002, and so on), each with a QR code. Bag the unknown cards with a ticket and put the bag in one tray. The ticket number is also the orphan record in the app.
- **Who and why:** Today an orphan record and the loose cards can drift apart: the record exists but the cards are lost in a pile. When a late match finally comes, the collector needs to find the physical bag.
- **Shape:** "New orphan" takes the next ticket number and an optional photo. When the orphan is later matched to an order, the app says "pull bag O-014 from the tray". The tray count on paper should equal the open orphans in the app, and a quick monthly count against a printed list shows any gap.
- **Data:** Ticket number on each orphan record, plus a pre-printed number range.
- **Risks:** Low. The ticket links but decides nothing, so it fits the rule that orphaned mail never decides. Pre-printed numbers can be skipped or used twice, so the app must allow gaps.
- **Owner decides:** Pre-printed sheets or one ticket printed on demand? Should a monthly tray count be a habit the app prompts for?

Strongest: Return-address memory — it turns the envelope itself, the one object that always arrives, into the identifier the Orphaned view currently lacks, and it gets better with every envelope.
