# A young collector

Premises: blind by brief. I used only the product paragraph, and every premise about code or data is unknown. I checked the titles against GLOSSARY.md and avoided "mailbox", which is a workflow term there.

## Where the Dollar Went
- **Idea:** Each order gets one plain bar that splits card money from postage. Example: "Maple Corner Cards, order TX-4471: card $0.25, postage $1.02, so this card really cost $1.27." A monthly line adds it up: "postage was 61% of what you spent."
- **Who and why now:** A kid finds out that five cheap cards from five sellers cost more than five from one seller. The adult buyer, who buys hundreds of low-cost cards from many sellers, gets the same insight. Nothing in the product shows it today.
- **Shape:** A read-only strip on each order, plus a month total. A "bundle hint" lists sellers the person bought from more than once in a week. It needs only the imported CSV fields and stores nothing new.
- **Risks:** Unknown whether the export splits postage from card price per order. If it does not, the split is a guess and has to be labelled as one. A kid may also read the postage share as "I did it wrong," so the tone must stay neutral.
- **Owner decides:** Show it only when the export carries a real postage figure, or estimate it? Is the month line on for everyone, or only in a kid view?

## Two Collectors, One Doorstep
- **Idea:** Tag each card as the parent's or the child's. Then the child gets their own checklist and their own allowance balance. Example: "Ari's cards: 7 arrived, 3 on the way, $4.10 of $5.00 used this month."
- **Who and why now:** A parent who buys for a child on their own account. Today the child's cards are lost among hundreds of the adult's, and the parent repays the child in their head.
- **Shape:** A one-tap "whose card" switch at import or check-in. A kid view shows only their own cards, their own envelopes and a simple allowance balance. The parent sets the monthly amount. This adds a per-card field and a small allowance setting.
- **Risks:** It adds stored data, so the owner checks whether stored data can grow and sync safely. If the switch is skipped, the books are wrong, so cards should default to "parent". A child could see the adult's spending unless the kid view hides it.
- **Owner decides:** Does the kid view hide the adult's totals completely? Is it one child or several? Does the allowance roll over?

## Don't Worry Until
- **Idea:** Each envelope still in the mail gets a calm date: "Don't worry until Dec 3." The date comes from how long that seller, or sellers like it, took before. Before the date, the screen reads "on its way" and gives no alarm. After it, a "tell a grown-up" step appears. That step writes a polite message for the parent to send the seller. The child never contacts the seller.
- **Who and why now:** A kid who checks the porch every day. A parent who wants to step in once, not hear about it daily. The adult also gets a firmer basis for what counts as late.
- **Shape:** Each envelope shows a date chip and a soft progress line. A past-date envelope moves to a short "needs a grown-up" list with a copyable note. Data: order dates, past arrival dates per seller, and today.
- **Risks:** It can look like a copy of the existing lost-mail flag. It earns its place through the calm wording and the hand-off to the parent. With little history the date is a guess, so it should state the uncertainty, e.g. "usually 6 to 10 days."
- **Owner decides:** Does it replace the lost-mail wording or sit beside it? Does the parent write their own default note?

## First Look
- **Idea:** A received card gets a short opening step: "Is it the right card? Is it bent or scuffed?" The answers go into a small first-collection diary, with an optional photo and a star for "favourite pull".
- **Who and why now:** A kid learns to check goods before the return window closes. Opening the envelope also becomes the exciting moment, and the excitement does not depend on buying more. The parent sees any card marked wrong or damaged.
- **Shape:** Check-in offers two taps (right card yes or no, condition fine or not) and a star. A "First Look" page lists the starred cards and flags any problem along with the days left to report it. It adds per-card answers and maybe a photo.
- **Risks:** Each check-in gets slower for the adult, so the step must be optional or limited to the kid view. Photos add storage and privacy weight. The return window is unknown and probably varies.
- **Owner decides:** Is it on only for the child's cards? Are photos allowed? Is there a fixed report window or none?

## Set Builder
- **Idea:** The child names a goal, such as "all 4 copies of Ember Fox" or a 20-card starter list. A board then fills in, but only from cards that have arrived. Cards still in the mail show as faint outlines. Example: "Ember Fox 3 of 4, 1 on its way."
- **Who and why now:** It turns the wait into visible progress and teaches the child to finish a plan instead of buying at random. The parent sees a goal, not open-ended spending.
- **Shape:** The child types or picks names from cards already imported. Tiles fill in when a card is checked in. It adds a small goal list.
- **Risks:** It could drift into a store. To prevent that, it shows no buy links and no prices for cards the child does not own, and it never suggests what to buy. Name matching across sellers may be messy.
- **Owner decides:** Free-typed goals, or only names already in the imports? Is it kid-only, or useful for the adult's set-building too?

Strongest: Where the Dollar Went — it teaches the biggest money lesson in cheap-card buying, helps the adult just as much, and works from the CSV alone with no new stored data, if the export carries postage.
