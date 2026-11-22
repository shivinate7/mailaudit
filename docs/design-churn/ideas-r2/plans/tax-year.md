# Tax year

Premises (blind by brief, so none checked against code or records):
- The CSV export carries a per-order subtotal, shipping and sales tax. Source: assumed by this plan. Status: unknown.
- Arrival is logged per card with a date. Source: brief ("checks off each card"). Status: unknown.
- One collector, US tax context, with an accountant at year end. Source: lens. Status: unknown.
- Nothing here gives tax advice. The tool keeps records, and the accountant classifies them.

## Basis that travels with the copy
- **Idea:** Give each received copy a lot ID and a landed cost: card price, plus its share of the order's shipping and tax. When a copy is later sold, traded or gifted, the user picks that exact copy (specific identification), and the tool reports its basis and holding period.
- **Who and why now:** The accountant. Four copies of one card bought from four sellers have four different bases. If a copy can't be identified at sale, the basis gets guessed, and a guessed basis is the first thing scrutiny breaks. Tally already pools copies by product name, so it is one step from this.
- **Shape:** Tally rows expand to show copies, for example "Lot 26-0412-C · $0.31 + $0.07 ship/tax · acquired 2026-04-12". A "Dispose" sheet records date, proceeds, fees and the buyer platform. The year view lists gain or loss per copy, and flags held over a year and "collectible".
- **Data:** order-level shipping and tax, an allocation rule, and a new disposal record per copy.
- **Risks:** Allocation rounding has to sum back to the order total to the cent. Disposal is a new record kind, so it must not touch the check-in data.
- **Owner decides:** split shipping by price share or equally per card. Also, whether acquisition date is the order date (likely correct) or the arrival date.

## Intent at the mailbox
- **Idea:** At check-in, one optional tap tags each card Keep, Flip or Undecided. The tag is timestamped and never rewritten; a later change is added as a dated entry.
- **Who and why now:** The hobby-or-business question and the inventory-or-capital-asset question both turn on intent at the time of purchase. Today intent is rebuilt from memory every April. Check-in is the one cheap moment to capture it.
- **Shape:** a small three-state control on the Packages row, off by default, with no layout shift. The year view shows the share of buys tagged Flip, and how many Flip cards were actually sold.
- **Data:** an append-only list of intent entries per copy.
- **Risks:** A stale "Flip" tag on cards never sold could argue against the user. An unenforced tag is just noise. It must not slow the mail-day pass.
- **Owner decides:** whether the tag exists at all, and whether the accountant may see the history or only the current value.

## Lost-mail resolution trail
- **Idea:** Every flagged-lost package must end in one of: Refunded, Reshipped, Claim denied, or Written off. Each outcome carries a date, an amount and a marketplace case reference (invented example: "Case 7Q-4412").
- **Who and why now:** Refunded cards must leave the basis, or the cost is counted twice. An unrefunded loss is treated differently for a personal collection than for a business, and only the accountant should judge that. Today a "lost" flag has no ending.
- **Shape:** a Resolution drawer on the lost flag. The year view has an "Unresolved losses" count that must reach zero before close (see the sealed packet below).
- **Data:** a resolution record per package, and refund amounts matched against order totals.
- **Risks:** Orphaned mail that later matches a "lost" package must reopen it. Under `orphaned-mail-never-decides` it can only propose that match, never apply it.
- **Owner decides:** whether a partial refund splits the basis or reduces it.

## Sealed year packet
- **Idea:** "Close 2026" freezes the year into a packet: the original CSV files, unchanged and hashed; a per-copy ledger CSV; a one-page PDF summary; and a manifest of SHA-256 hashes. A change after close is an amendment with a reason. It is listed as a change set and never edits the packet.
- **Who and why now:** A stranger, such as an examiner or a new accountant, trusts a file they can check against the source export. Today an edit made in June could quietly change last year's numbers.
- **Shape:** a Year menu with Close, Amend and Download packet. Each amendment shows "after close" with a before and after value.
- **Data:** each import stored as raw bytes plus hash and import date, plus the amendment log. The packet syncs through the existing private server.
- **Risks:** Storing raw imports grows storage. It also touches `imports-merge-never-replace`, since a merge must keep the raw file, not only the parsed rows.
- **Owner decides:** calendar year or a fiscal year, and where packets live long-term.

## Use-tax watch
- **Idea:** Flag orders where the export shows $0 sales tax, or tax at an odd rate. Total them per year as "possible use tax". Also total tax actually paid, in case it is useful for an itemized sales-tax deduction.
- **Who and why now:** Marketplaces usually collect sales tax, but an off-platform direct buy or an exempt-coded order may not. Nobody looks at hundreds of $0.25 orders one by one, but the yearly sum can matter.
- **Shape:** one line in the year view, "3 orders, $14.20, no tax collected", which opens to the orders.
- **Data:** the per-order tax field, and the buyer's ship-to state taken from the CSV.
- **Risks:** Rules differ by state. The tool must word this as "check with your accountant", never as "you owe".
- **Owner decides:** whether to show it at all, and whether the yearly total enters the year packet.

Strongest: Basis that travels with the copy — every other tax record (losses, disposals, the year packet) needs a per-copy landed cost, and only the tool can build one at the moment of purchase.
