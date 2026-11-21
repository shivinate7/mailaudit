# What a competitor would never copy

Premises (from the brief; the brief kept me out of the repo, so I could not check them against the code or records):
- P1 (brief) The CSV gives order id, seller, item, price and order date per card. Status: unknown.
- P2 (brief) The CSV gives shipping cost per order. Status: unknown. Envelope Tax depends on it.
- P3 (brief) The tool stores the date each card is checked in. Status: unknown. Postal Clock and Claim Clock depend on it.
- P4 (inferred) The tool knows no seller's location and no marketplace claim terms. Status: unknown.

## Claim Clock
- Idea: every outstanding envelope shows how long is left to file a "not received" claim. When the window is nearly closed, it builds a claim pack: order id (e.g. 4417-B2), seller, items, amount, days waited, and one plain paragraph ready to paste into the claim form.
- Who and why: the collector loses money in silence on $0.40 cards because no single envelope seems worth a claim. A marketplace gains when a claim window passes unused. Taking the buyer's side is the point.
- Shape: on Packages, a small days-left badge on each late order. A "Claims due" list sorted by deadline. A "Filed" toggle, then the outcome (refunded / denied / arrived after all). Data: order date, check-in state, a window length that the owner enters.
- Risks: the real claim terms are unknown and may change, so the owner sets the window and the tool never quotes a policy. Claims on envelopes that then arrive are a nuisance, so the tool waits until the collector's own late threshold (see Postal Clock) has passed.
- Owner decides: the window length, whether to batch small claims per seller, and whether the outcome feeds Seller Memory.

## Your Own Postal Clock
- Idea: the tool flags lost mail by the collector's own history, not by the marketplace's delivery promise. "Usual: 6–11 days. This one: day 19, past 95% of your envelopes."
- Who and why: a marketplace's estimate is set to sell. The collector's own check-in dates are the truth for their own mailbox, and only a private tool holds them.
- Shape: the late flag uses the median and 95th-percentile days to arrive from past check-ins, optionally per seller. It skips days with no mail delivery that the owner lists (Sundays, holidays). On a quiet panel: "Mail is running slow this month (+3 days)."
- Risks: little history at first, so it falls back to a fixed number of days until about 50 envelopes have arrived. A check-in made a few days late skews the figures, so it may need an "arrived earlier" edit.
- Owner decides: the threshold percentile, and whether a holiday-season slowdown resets the baseline.

## Envelope Tax
- Idea: show what each envelope really cost per card, and in hindsight what fewer envelopes would have saved. "You paid $1.27 to ship one $0.15 card from Lantern Hollow Cards. Last month 9 one-card envelopes cost $8.40 in shipping."
- Who and why: a marketplace wants more sellers and more carts. This tool argues for buying less often and in bigger lots from the same seller.
- Shape: on Tally, each card's cost basis includes its share of the shipping. A monthly "envelope tax" figure. A list of sellers who shipped you one card more than once. Data: shipping per order (P2) and items per order.
- Risks: if the CSV has no shipping column, the feature needs the owner to type it in, or it dies. Splitting shipping across the cards in an order is a choice the owner must rule on.
- Owner decides: how to split shipping (evenly or by price), and whether this cost basis replaces the current one or sits beside it.

## Already Coming
- Idea: a check to run before buying. Paste or type a wish list, and the tool marks each card as already arrived, still in the mail (with seller and day), or new. An optional brake: "142 cards still in the mail; the last time it was this high, 6 went missing."
- Who and why: with hundreds of small orders in transit, buying the same card twice is easy. Every seller-side app profits from that mistake.
- Shape: a plain text box. Matching by product name uses the same pooling as Tally. Results in three groups. No notifications, no nagging. The brake is one line, and only when the in-mail count passes a number the owner sets.
- Risks: name matching (printings, foils, languages) gives false "already owned" marks. Show the matched line and let the collector overrule it.
- Owner decides: whether the brake exists at all, and how strictly names match.

## Seller Memory
- Idea: a private notebook per seller that no seller can see or answer back to. It holds arrival record, lost count, claim outcomes, condition notes, and an envelope fingerprint (postmark city, handwriting, sleeve style). The fingerprint narrows down who sent orphaned mail.
- Who and why: a marketplace's public ratings are inflated and soften the bad ones. The collector's own "never again" list is honest because nobody else reads it. The postmark helps match mail that arrives with no return address.
- Shape: open a seller's name to see the card: "11 envelopes, 1 lost, 1 late claim refunded. Postmark: Dayton. Note: no toploader." A quiet "avoid" mark that the Already Coming results show. When the collector enters an orphan's postmark city, the matching outstanding sellers rise to the top.
- Risks: notes about sellers are personal data about third parties. Keep them on the device and in the private sync only, and never export them in shareable form. The postmark city must be entered by hand.
- Owner decides: whether seller notes sync or stay on one device, and whether an avoid mark changes any view or only labels it.

Strongest: Claim Clock — it turns lost $0.40 envelopes into recovered money, using data the tool already holds, and no marketplace will ever build it.

## Phase 2: Claim Clock (fleshed out)

**Premises.** All come from the coordinator's message. I did not read the repo.
- P1: the order date is stored for each order. Status: unknown. Every deadline counts from it.
- P2: "claim filed" and "refunded" are dated stamps on an order. Status: holds (coordinator).
- P3: the marketplace's real claim window is not in the data. Status: unknown. The owner supplies it and the tool never quotes a policy.
- P4: the recovery ledger's "written off" state exists. Status: unknown. It is round 1's proposal and may not have landed.

**Flow**
1. Every order that is late and not fully checked in gets two derived dates: **opens** (the first day a claim may be filed) and **closes** (the last day). Both count from the order date using the window the owner set. Neither is stored.
2. On Packages, a late order shows a countdown badge, "closes in 6d", next to the existing lost-mail warning.
3. Once a week, on **Claim day** (a weekday the owner picks), a strip at the top of Packages reads "Claim day: 5 orders, $3.86. 3 close before next Saturday." Tapping it opens the Claim day sheet.
4. The sheet sorts orders into three groups:
   - **File this week**: the claim closes before the next Claim day.
   - **Can wait**: the claim is open but closes later.
   - **Not open yet**.
5. Each row has three actions:
   - **Copy claim**: copies the drafted text and shows "Copied" inline.
   - **Mark filed**: applies the existing "claim filed" stamp, dated today.
   - **Let go**: writes the order off.
6. Before a row is filed, the tool shows a hint if orphaned mail arrived after this order was placed: "2 orphans arrived since 2 Nov. Look before filing." The hint only informs. It never clears the order or files for the collector.
7. The collector pastes the text into the marketplace's claim form. That form is outside the tool, and the tool never opens it automatically.
8. When the refund comes, the existing "refunded" stamp records it, and the recovery ledger moves the amount from "claimed" to "recovered".
9. If cards arrive after the claim was filed, the row reads "Arrived after claim" and offers a second draft: "It arrived after all. Please cancel my claim." The tool sides with the buyer, but stays honest.

**Drafted text** (one template, built from stored order data, with no buyer name or address):
> Order 4417-B2 from Lantern Hollow Cards, placed 2 Nov 2026, has not arrived after 19 days. Missing: Ashen Wyrm ×1 ($0.35), Tidecall Sigil ×2 ($0.44). Order total $1.12 with shipping. Please refund the missing items.

If only some cards of an order arrived, the draft lists only the missing ones and totals only them.

**Screen states**
- **Empty**: Packages shows no strip. The sheet, opened from its menu entry, reads "Nothing to claim. Next deadline: none." No celebration and no nudge.
- **Normal**: the strip appears on Claim day. On other days, Packages shows only the badges. The sheet groups as in step 4 and totals each group: "File this week: 3 orders, $2.71."
- **Edge cases**:
  - Window already closed: the row is greyed, reads "Closed 2d ago", and offers only "Let go".
  - Claim filed but no refund after N days: the row reads "Filed 12d ago, no refund" and stays in the sheet.
  - One seller with several late orders: one row per order, under a seller subheading.
  - An order worth $0.08: no special treatment. See decision 4.
  - Re-import of a CSV: stamps survive, because imports merge. A deadline only moves if the merged order date changes.
  - Unlike the deadline, Claim day and the countdown use the device's local date, never UTC.
- **Error cases**:
  - Order date missing or unreadable: the row reads "No order date; can't count a deadline" and offers filing by hand.
  - Clipboard refused (on iOS or in a private window): the draft appears in a selectable box with the text pre-selected, and no native dialog.
  - Two devices set the stamp at once: the sync's existing later-change-wins merge applies, and the newer stamp shows.

**Layout rules**
- No layout shift under the pointer:
  - The badge has a fixed width and tabular numerals.
  - "Copied" takes the button's own width.
  - The strip only appears when Packages loads, never while the collector is touching the screen. When there is no strip, a row of the same height holds its place, so rows never move.
- "Let go" asks for no confirmation. It goes into the recent-checks log with undo, so no native dialog is needed.

**Data**

| Item | Stored? | Rule it touches |
|---|---|---|
| opens / closes dates | No, derived | none |
| drafted text | No, derived | none |
| "claim filed" and "refunded" stamps | Existing | none |
| claim window (days) and Claim day (weekday) | Slice 1: code constants. Later: a saved setting | the saved-state shape is fixed, and storage keys are frozen. A new setting needs an owner ruling, and possibly a new key. |
| written off (date) | New per order, unless round 1's ledger supplies it | the saved-state shape is fixed. One ruling should cover both features. |
| orphan hint | No, read only | orphaned mail never decides anything. The hint has no write path. |
| draft content | — | the device key is a credential. The draft is built only from order fields, never from sync or settings data. |

The parser keeps only card purchases, so refund rows in a CSV are never read. The refund is known only through the stamp.

**Smallest first slice (ships alone, with no new stored field)**
1. Badges on Packages from a constant window.
2. The Claim day sheet, with the three groups, from a constant weekday.
3. "Copy claim" with the selectable-box fallback.
4. "Mark filed", which applies the existing stamp.

"Let go", the orphan hint and the arrived-after-claim draft follow in a second slice, after the write-off ruling.

**Risks**
- A wrong window means missed claims or claims refused as too early. The sheet's footer always shows "Window: 30 days from order date (set by you)".
- The marketplace's claim terms can change unseen. The tool never states them.
- If the clipboard fails in the native app, the copy flow breaks. Whether that happens is unknown, which is why the selectable-box fallback ships in slice 1.
- Claiming mail that later arrives harms sellers. Step 9 covers this.
- Several claims at once might mark the buyer as a problem account. This is unknown, and the tool should not guess at it.

**Owner decisions** (each with a recommendation)
1. **The window and what it counts from.** Recommend: the order date, with a number of days the owner reads from the marketplace's current terms.
2. **Claim day.** Recommend Saturday, after the mail has come.
3. **Where "written off" lives.** Recommend one saved-state ruling shared with round 1's recovery ledger. Do not add a second field.
4. **A minimum order value before the tool suggests a claim.** Recommend none: the draft makes a claim a 30-second act, and small amounts add up.
5. **What the draft asks for.** Recommend a refund, not a reship. A reship restarts the wait on the same seller.
6. **Should the arrived-after-claim draft be offered?** Recommend yes. It keeps the collector honest at no cost.
7. **Push notifications on Claim day.** Recommend none. The strip is enough, and the tool stays quiet.
