# Data that can leave

Premises (all from the brief; I could not check them, because the brief is blind):
- One collector buys hundreds of low-cost cards a month from many small sellers. (brief) unknown
- Each seller ships separately, usually in a plain envelope. (brief) unknown
- Order history comes in as marketplace CSV exports. (brief) unknown
- The app runs on the web and as a native phone app, and copies sync through a small private server. (brief) unknown
- Today no data leaves the tool except through sync. (inferred from the brief's silence) unknown
None of these is known to fail. No glossary term clashes with the names below.

## Walkaway Archive
- **Idea:** One button makes a zip of everything: orders, line items, each check-in with its time, orphaned-mail notes, and photos. It holds plain CSV and JSON, a README that describes the schema, and one offline HTML viewer that opens with no server.
- **Who, why now:** The collector, for the day the server goes down, phone storage is cleared, or they stop using the tool. A tool whose data outlives it is easier to trust with months of check-ins.
- **Shape:** Settings > "Take everything with me". A monthly reminder offers a fresh archive. A round-trip test proves that importing the archive into an empty install restores the same state.
- **Risks:** The device key and any stored tokens must never go into the archive. Photos make the zip large. A schema version is needed so an old archive still imports.
- **Owner decides:** Photos in or out by default. Whether import goes through the same merge path as the CSV import, so it adds to the data and never replaces it.

## Arrivals Feed for Collection Tools
- **Idea:** Export only cards that have arrived, since the last export. Formats: a plain decklist (`2 Ember Wisp (KTH) 114`) and a generic CSV with name, set, number, finish, condition, quantity, price paid and date received.
- **Who, why now:** A collector who also keeps a collection tracker or a deck builder. A card counts as owned when it arrives, not when it is ordered, and this tool is the one place that knows the arrival date.
- **Shape:** Tally view > "Send arrivals" shows "38 new since 14 Nov", with a format picker and copy or download. A per-target marker records what was last sent.
- **Risks:** The CSV product name may not split cleanly into set, number and finish, so unmatched lines need a review step, not a guess. If the marker is lost or two devices disagree, cards are counted twice, so the marker must sync.
- **Owner decides:** Which two target formats come first. Whether a card later marked missing is sent as a removal line.

## Share Slice Page
- **Idea:** A revocable, read-only link to one chosen slice, such as "still in transit" for a trade partner, or a "have" or "want" list. The link expires by default.
- **Who, why now:** Friends who split a bulk buy ("did my four arrive yet?"), and trade partners. Today the collector sends screenshots.
- **Shape:** Pick a view and filters, then "Share read-only". The page shows card names and states. Prices, seller names, order ids and addresses are hidden unless the collector turns each one on.
- **Risks:** This is the first public endpoint on a private server, and it opens a new attack surface. Seller names are other people's data. One wrong toggle publishes what the collector paid.
- **Owner decides:** Host it on the sync server or as a static snapshot file. The default expiry. Whether price can ever be shown.

## Lost-Mail Claim Packet
- **Idea:** For an order flagged as possibly lost, build a packet for a marketplace claim or a polite note to the seller. It holds the order id, items, ship date and days elapsed, and the evidence that other mail from that week arrived.
- **Who, why now:** The collector getting money back. A claim window closes, so the tool should say "file by 3 Dec" before it is too late.
- **Shape:** On a flagged package: "Prepare claim" gives a text to copy and a one-page PDF. The collector sends it; the tool never sends anything. A claim status (filed, refunded, arrived late) comes back as a note on the order.
- **Risks:** Claim windows are marketplace rules that the tool does not know (unknown). If an orphaned package was the "lost" one, the claim is false, so the packet must warn while unmatched orphans exist.
- **Owner decides:** Whether to track claim status at all. The window length to warn on, or whether to warn at all.

## Cost-Basis Ledger
- **Idea:** A per-card cost that includes a share of each order's shipping and tax, with the date received. Export it as CSV for a resale spreadsheet, an insurance schedule, or a year-end summary.
- **Who, why now:** A collector who resells duplicates or insures the collection. The tool already holds the paid prices, which other tools do not.
- **Shape:** Tally > "Cost basis" shows the allocation method and lets the collector export a year or an "everything I own" snapshot.
- **Risks:** Spreading shipping by item count gives different numbers than spreading by price, and either can be read as tax advice. Cards that never arrived must not be counted.
- **Owner decides:** The allocation method, or let the collector pick. Whether to label the export "not tax advice".

Strongest: Walkaway Archive. It covers the hardest day this lens names, the day the tool or its server is gone, and every other export can reuse its schema.
