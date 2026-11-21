# Tracking checker, directed 2: notes

Designer kind: directed. Direction: timeline, the carrier's own steps as a readable timeline.
Mockup: `tracking-checker-directed-2.html`. Debt: `tracking-checker-unbuilt`. Ruled and kept: tracked packages stay out of the lost-mail flags (`duo-card-in-hand`, "Tracked late packages"; `lostMail` in `src/view-rules.mjs` returns null unless the line is `without tracking`).

Every figure on the page is sample. Sample clock: Saturday, November 21, 9:30 am.

## Deep links

`#c=slip`, `#c=board`, `#c=alert`. States: `#s=loaded`, `#s=checking`, `#s=unreachable`, `#s=notfound`, `#s=allwell`, `#s=empty`. Text: `#z=default`, `#z=ax5`. Step order: `#o=new`, `#o=old`. They combine, as in `#c=board&s=unreachable&z=ax5`. The Cull row hides each option with one press.

## Items

1. **Route slip (option).** A 52 pt slip under each tracked card's header: carrier, a one-line verdict, the latest step's time, and a track of five carrier stations plus your own. A press opens a sheet (folded, phone) or the right page (open Duo).
   - Gain: the verdict sits on the card where you check in. No new page.
   - Loss: the packages that need you are spread through the list in today's sort. Each tracked card grows, so measurement `card-reserved-geometry` must be taken again. The open Duo must spread Packages.
   - Departs from: `PackagesView.PackageRow` (header, then `StampSection`), and `DuoSpread.spreads(tab:)`, where `.packages` keeps one page.
   - Pick: no. Keep only if the owner wants no new page.

2. **Route board (option, pick).** A Tracked mail box on Packages (the `HandScreen.transitBox` pattern: a line, a red count, Open) opens a page of tracked packages not yet in hand. Groups in this order: Delivered, not here; Returned; Stuck; Not found; Not read yet; On its way. Each row draws its route on one time axis that every row shares. A press opens the timeline: a pushed page folded, the right page open.
   - Gain: what needs you is first and counted before you open it. Each verdict word shows once, as a group head (`ux-label-once`). A stall reads as the longest dashed tail. The card does not change.
   - Loss: one more press than the slip. A second place lists a package. Check-in still happens on the card.
   - Departs from: `PastTransitPage` adds no `DuoTab`; this adds one that spreads, as `.cardInHand` does.
   - Pick: yes.

3. **Phone alert (option, adds to either).** An iOS notification when a package turns Stuck or Returned, and at 7 pm on a day the carrier said Delivered and nothing from it is checked in. The alert opens that timeline.
   - Gain: "If it says delivered and it isn't here, I want to know today" holds with the app shut.
   - Loss: the checks must run with the app closed (the Worker polls, then a push), plus a permission ask. The app sends no notification today.
   - Pick: yes, if item 12 gives the Worker a carrier feed.
   - Owner grant: yes.

4. **Stuck.** No new carrier step in 3 days, counted from the last step's time. A label with no scan for 3 days is Stuck too ("Not handed to USPS in 7 days"). A number not found for 3 days counts as Stuck.
   - Gain: a warning days before the 30-day claim line.
   - Loss: USPS Ground often goes 2 to 3 days between scans, so 3 days may alarm on a package that is fine. Unmeasured: no scan-gap figures exist for this owner's mail.
   - Pick: 3 days (`STALL_H` in the mockup). Owner grant: yes.

5. **Delivered, not here.** Red at once in the app when the carrier's latest step is Delivered and the package has copies left. The phone alert (item 3) waits until 7 pm that day.
   - Gain: in-app it shows the moment the carrier says so. The alert does not fire while the mail is still in the box.
   - Loss: 7 pm is a guess.
   - Pick: as drawn. Owner grant: yes (the hour).

6. **Step order.** Newest first: your own step at the top, then the carrier's latest. Oldest first reads as a route, seller to you.
   - Gain: the answer to "where is it now" is the first line on every screen size, AX5 included.
   - Loss: it reads bottom-up as a story. Carrier sites use newest first too, so it matches what the person knows.
   - Pick: newest first. The Steps control shows both.

7. **Gaps drawn to time.** The gap between two steps grows with the hours between them, compressed (`8 + 12 * log2(1 + hours / 6)`, snapped to 4 pt). A gap of 3 days or more is dashed in the verdict colour and labelled ("5 days, no new scan", "19 hours since delivery").
   - Gain: a stall is a shape you see before you read. The label carries the true figure, so the compression does not mislead.
   - Loss: not to scale; two gaps can look alike at different lengths.
   - Pick: yes.

8. **Your step.** The timeline ends (or starts, newest first) with a node of your own from the check-ins: an empty ring until checked in, red when the carrier says Delivered, green when every copy is in.
   - Gain: the carrier's story and the ledger meet on one line; that is the delivered-not-here case.
   - Loss: check-ins hold counts, not times (`received` in the saved state), so this node shows no time.
   - Pick: yes.

9. **Claim by.** Order date plus 30 days, as the lost-mail flags count (`lost-mail-flags-use-order-date`). The carrier's own expected date is shown as "Due", apart.
   - Gain: no new rule; the conservative date.
   - Loss: TCGplayer counts 30 days from its delivery estimate, so the real window can close later. Whether TCGplayer's estimate equals the carrier's is unmeasured.
   - Pick: keep the order date. Owner grant: yes, only to count from the carrier's date instead.

10. **Stamps on the timeline.** The six kinds from `STAMP_KINDS`, split as `PastTransitRowView` splits them: Claim filed, Refunded, then More. A stamp quiets the package's colour and shows "Stamped <kind>" with Undo in the same slot. The row keeps its place until reload, as past-transit rows do.
   - Gain: the act sits where the warning is; no new stamp kind (item 25 of `duo-card-in-hand` stays deferred).
   - Loss: for Delivered, not here, the first useful kind is often Seller contacted, behind More.
   - Departs from: `stamped-package-hides-lost-flag` covers the lost-mail flag only; this extends "a stamp hides the warning" to tracked warnings. Owner grant: yes.

11. **Check now.** Passive checks (the Worker) with a Check now button on the timeline and Try again on a failed read. The answer shows in the line beside the button ("Checking USPS...", "Checked just now"), and nothing moves.
    - Gain: a direct answer when the person stands at the mailbox.
    - Loss: each press costs a carrier call; carrier APIs limit calls. The passive interval is unset.
    - Pick: keep, with a cool-down. Owner grant: yes (the interval and the limit).

12. **Where numbers and steps come from.** Not drawn: the OrderWand export holds no tracking number and no carrier (`orderwand-csv`). Two routes: the orders extension reads the number from the order page, or the person pastes it. The steps need a carrier API or an aggregator, called from the Worker, with a key that is a credential (`the-token-is-a-credential`).
    - Pick: none; the empty state's copy ("A tracking number comes in with the order import") assumes the extension route.
    - Owner grant: yes.

## Drawing notes

- Unknown is not empty (`ux-unknown-is-not-empty`). First read: rows grouped "Not read yet", no track, no Stuck. Carrier did not answer: rows keep the last answer with "as of 3:20 am"; a notice names the carrier and has Try again, with the raw reply behind "What the server said" (`ux-machine-text-hidden`). Not found: its own group, the number shown. Nothing tracked: one sentence and one control. Nothing needs you: "All is well." (`ux-all-is-well`).
- Open Duo. List on the left page, timeline on the right page, the tab bar under the right page (`duo-card-in-hand`, item 23 a). The lock screen puts its alerts on the left page. Nothing sits across the fold (455.5 to 495.5 pt).
- Large phone. Its size is not written (`layout.py devices` gives null; the brief names none; the HIG layout page read 2026-11-21 holds no device table). The frame takes the column, can be dragged, and its height follows the window. Compact width, so it draws the folded layout.
- AX5. Drawn on the folded pose from the iOS Dynamic Type table. Text wraps; the track (10 pt) and the strip (16 pt) keep their height. The tab bar labels stop at the default size (`duo-card-in-hand`, Tab bar text).
- Type and colour. Cochin sets words and Menlo sets numbers (`typography-cochin-and-mono`); the chrome uses the system font. Colour by meaning: red needs you now, amber soon, accent on its way, green in hand, inkSoft unknown or stamped. Gold stays ornament (the masthead rule only). One theme: the app is held to light (`design-parchment-ledger`).
- Nothing moves under a press. A stamp, Undo, More, Check now and Try again keep the scroll and the place of the pressed control (measured: the stamp row's top read 428 px before and after the press). More opens a floating menu; Open on the site and Go to the import answer in a bubble under the control. Neither enters the flow.
- Drawn short. The masthead and the card body are drawn short and tagged Today; the card's stamp slot, bulk row and item lines are one placeholder line.

## Apple pages read (2026-11-21, each answered 200, through the `.json` path)

- Layout: safe areas; size classes. No device size table on the page now.
- Typography: Dynamic Type table, default (Large) and AX5 rows used.
- Accessibility and Buttons: 44 x 44 pt default hit region; text to at least 200 percent.
- Sheets: Close on the leading edge of the top toolbar.
- Tab bars: navigation, not actions; floats at the bottom.
- Toolbars: large title behaviour. Lists and tables: text in lists.
- The SwiftUI pages (NavigationStack, TabView, List) were not read: unknown.

## Checks run on this mockup

- `check_ios_mockup.py`: one fault, `system-font: a font declaration starts with cochin`. The page's own headings use the system font; the fault comes from the in-frame app text, which the repo sets in Cochin (`typography-cochin-and-mono`). The existing `duo-hand-held-box.html` gets the same fault. Possible false alarm, reported, not routed around.
- Verdict per screen (light theme, the only one): Route slip folded pass, AX5 pass, open pass, phone pass. Route board Packages pass, board folded pass, AX5 pass, open pass, phone pass. Phone alert folded, open and phone pass. Each is `native`: system tab bar, sheet with Close on the leading edge, pushed page with a back button, system menu for More, iOS lock-screen alerts; the app's own content keeps the repo's Cochin and MiniLabel buttons, as built screens do. Not seen: a real device, press feel, VoiceOver.
- `label_once.py` on the rendered open frames: one hit, the seller name on the card and on the timeline title. It is data, not a label.
- Headless Chrome at 1100 px and 390 px: no script error; no page scroll sideways at 390 px.

## Critique pass (impeccable critique, design review only, native platform)

Fixed: the meta line broke "claim by Dec / 10" mid-phrase; the stuck timeline's own node said "now" with no meaning; the unreachable notice claimed rows could not turn Stuck while two were; the board carried no New tag; the AX5 slip frame opened on an untracked card with no slip; a press re-drew the frame and jumped it to the top; a header line added on a stamp moved the stamp row down 29 px under the finger (removed: the answer stays at the press); More, Open on the site and Go to the import answered off-screen; the tracking number ran past the frame at AX5; the Phone alert had no open pose and no phone frame.

Kept, for the owner: the track's stations carry no visible labels (the slip's spoken label names them); Seller contacted sits behind More (item 10); the oldest-first order puts your own node below the fold at every size (item 6).
