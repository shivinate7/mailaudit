# Trust in the data: five directions

Lens: would the owner believe the list if it disagreed with their memory? Premises, all unchecked because the planner worked blind:
- Ticks sync between the web page and the phone through the sync server. Source: brief.
- The owner fears silent loss more than a visible conflict. Source: brief lens.
- Someone else in the household may need to recover the record. Source: brief.

All order ids below are invented.

## tick-journal
- **Idea:** Record every tick, untick and bulk action as an entry that says which device made it, when, and how (a single tap, a bulk "mark all", an import). The checklist becomes a view of that journal, not the only copy of the record.
- **Who and why now:** The owner, whenever the list disagrees with their memory. After months of ticks, "I'm sure that came" against a blank box breaks trust unless the app can show the history.
- **Shape:** Tap "Why?" on any card to see its trail, for example: "Ticked on the phone, Tue 14:02. Unticked on the web page, Tue 21:40 (bulk: Clear order A-48213)." Each entry has a one-tap undo.
- **Risks:** The journal grows without limit. Showing the full trail may confuse more than it helps. Undoing one old entry may clash with later ones.
- **Owner decisions:** How long to keep entries. Whether undo works on any entry or only the latest. Whether the journal itself syncs or stays on each device.

## import-receipt
- **Idea:** Before an import commits, show what it will do: "Adds 112 cards, merges 9 with existing ones, skips 4 that look like duplicates (same order, same card, same price)." One undo then reverses the whole import.
- **Who and why now:** Anyone who imports the same export twice, or an overlapping date range. A doubled list quietly inflates both the cost and the outstanding count.
- **Shape:** A preview sheet with three counts that open into lists. Each skipped item says why ("same as order B-90317, line 3"). Afterwards, a card reads "Imported Nov 18, 112 added, Undo."
- **Risks:** The duplicate rule may be wrong both ways. Two genuine copies of one card bought on the same order may look like a double. Undoing an import after ticks were made on its cards needs a clear rule.
- **Owner decisions:** What counts as a duplicate. Whether an undo keeps or drops ticks made since the import. How long the undo stays offered.

## visible-disagreement
- **Idea:** When two devices were offline and changed the same card differently, show both versions and let the person choose, rather than letting the later change win silently. Give bulk actions a short undo window and a plain summary.
- **Who and why now:** A household where one person ticks on the phone at the mailbox while another works on the web page. Two offline devices are the likeliest way to lose a tick without anyone noticing.
- **Shape:** A small "2 cards disagree" banner. Each row shows "Phone: received Tue. Web page: not received." with "Keep phone", "Keep web page" and "Look later" buttons. After a bulk action: "Marked 38 cards received. Undo (10 s)."
- **Risks:** Prompts get tiresome if conflicts are frequent, and people learn to tap through them. "Look later" can pile up.
- **Owner decisions:** Which conflicts are safe to resolve automatically (a tick on both devices) and which must ask (tick against untick). The length of the undo window.

## household-recovery-kit
- **Idea:** A recovery route that a second person can follow without the owner. Pair it with an always-visible "last safe copy" indicator, so a wiped phone or cleared browser is an inconvenience, not a loss.
- **Who and why now:** A partner or relative, on the day the phone resets or the owner is away. Today that fear is quiet, and it surfaces only once the data is gone.
- **Shape:** A one-page printable sheet: what the app is, where the copy lives, and the steps to restore, with any secret shown as `XXXX-XXXX` and kept somewhere physical. Plus a dated export file. The header reads "Last safe copy: 3 days ago" and turns amber after a set age.
- **Risks:** A printed secret is a credential lying in a drawer. Steps written for a non-technical reader go stale when the app changes. An export can become a second, diverging copy.
- **Owner decisions:** Who may recover. Where the secret lives. Whether exports can be re-imported as a merge. The age at which the indicator warns.

## self-audit
- **Idea:** A periodic check that the phone, the web page and the sync server hold the same record, plus a warning when the browser or phone looks likely to clear stored data.
- **Who and why now:** The owner, before trust erodes rather than after. A check that passes makes "is this right?" answerable in one glance.
- **Shape:** An "In agreement: 1,204 cards on all 3 copies, checked today" line. On a mismatch, a short list ("Phone is missing 6 ticks from Nov 12") with "Send these to the server". A note when storage has gone unused for several days.
- **Risks:** False alarms teach the owner to ignore the warning. The check costs battery and data if it runs too often. A storage-risk warning may be guesswork on some browsers.
- **Owner decisions:** How often the check runs, or whether it runs only on demand. Which copy is the reference when all three differ. Whether to warn or to repair automatically.

Top pick: tick-journal. The other four read from it. An import undo reverses journal entries, a disagreement is two journal entries that clash, a recovery replays the journal, and an audit compares journals. It also answers "why does it say this" directly, and that answer is what makes the owner believe the list over their memory.

---

# Phase 2: import-receipt, fleshed out

**How it relates to what exists.** Every import still only merges (invariant `imports-merge-never-replace`). The receipt adds a step before the merge commits: it shows what the merge will do. Undo reuses the recent-checks log; a whole import becomes one entry there. The receipt is an in-app sheet, never a native dialog. File and extension imports go through the same receipt, each labelled with its source. The tick journal idea partly exists already as the recent-checks log.

**Flow**
1. Pick a CSV, or the extension delivers orders. An extension import adds nothing yet; it shows a badge: "3 new orders ready to add".
2. The app compares every incoming line with what is held and opens the receipt sheet. Nothing is written yet.
3. Four counts: New, Already here, Looks doubled, Differs. Each opens into its lines.
4. If needed, flip "Add anyway" on a doubled line, for a genuine second copy.
5. Tap "Add 112". The merge commits; the recent-checks log gets one entry, "Import Nov 18, 112 cards".
6. A banner offers "Undo import". Undo removes only cards this import added that nobody has touched since; ticked, photographed or stamped cards stay and are listed.
7. A clean import (all new, nothing doubled or different) skips the sheet: "Added 112, nothing doubled. Undo".

**Screen states for a mockup**
- Receipt sheet: "From orders-nov.csv · 41 orders · 128 lines". New 112, Already here 12, Looks doubled 4, Differs 0. "Add 112" and "Cancel".
- Doubled list open: "A-48213 · Riverbend Cards · Storm Wyvern (NM) · $0.25 — already here from the Nov 3 import, line 2", with "Add anyway".
- Done with undo: "Added 112 cards from 41 orders · Undo import", the new log entry on top.
- Undo with touched cards: "Undo removes 104 cards. 8 stay because you ticked or photographed them since: Moss Golem, Tide Oracle, +6".
- Two-screen phone: counts on the left, the open list on the right.

**Data**
- A fingerprint per line: order number, seller, product, condition, unit price, quantity — from the import rows.
- Fingerprints of cards held: worked out from saved data; nothing new stored.
- An import tag on each added card (import id, source, time): new data. If the saved-state shape cannot gain a field, a separate import ledger keyed by fingerprint can hold it. Status: unknown; check against invariant `saved-state-shape` first.
- "Touched since import": the recent-checks log plus any photo or stamp.
- The import tag must sync, so undo on the phone matches the web.

**Smallest first slice.** CSV only. The receipt sheet with New and Already here counts before anything commits, plus Cancel. No undo, no Differs, no extension source yet.

**Owner decisions**
- What counts as a double? Recommend: same order number, product, condition and price as a line already held; only quantity above what is held counts as new.
- Should extension imports add themselves? Recommend: no; they wait behind the badge.
- Undo and cards touched since? Recommend: keep them and name them.
- How long is undo offered? Recommend: until the next import, or 7 days.
- An incoming line differs from what is held? Recommend: keep existing data, show it under Differs, overwrite nothing.
- A clean import skips the sheet? Recommend: yes.
- Where does import undo live? Recommend: the recent-checks log.
