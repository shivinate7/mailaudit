# The house already knows

Premises (source: brief; all **unknown**, because the brief says plan blind and I did not check them against code, decisions or debts):
- One collector, hundreds of cheap cards a month, each seller ships separately in a plain envelope. (brief)
- Orders come in only through CSV import. Check-in is manual today. (brief)
- There is a web app, a native phone app, and a small private sync server. (brief)
Glossary: in the workflow glossary, "mailbox" means the git message store. I do not use it as a feature name here. "Mailbox" below means the physical one only.

One rule runs through all five directions. A signal can **forecast** (mail is coming), show **presence** (something happened at the door), or be an **act** (the owner said so). Only an act may change a check-in. Forecasts and presence only stage, sort or nudge.

## Mail-preview forecast
- Idea: many postal services email a daily scan of letter-size mail due that day. Plain seller envelopes appear in it with a return address. Turn that email into an "Expected today" list before the carrier comes.
- Who / why now: the collector opens 10–30 envelopes at once. Knowing which 6 sellers to expect turns a hunt through 400 open orders into a short list. No hardware needed. The email already arrives every day.
- Shape: forward the email to the private server, or share it to the phone app. Text recognition reads each return address and fuzzy-matches it to sellers with open orders. The Packages view gets an "Expected today (6)" band. Each row shows the scan thumbnail and a confidence dot. Tapping still does the check-in.
- Data: scan images, recognized text, and a seller-to-sender alias table. The alias table grows from confirmed matches, because small sellers often ship under a personal name, not the shop name.
- Risks: the images show all the household's mail, not only cards. Handwritten addresses read badly. The scan skips large flat envelopes. An expected letter that never shows up must not count as lost.
- Owner decides: keep scan images or keep only the matched seller ids, and for how long. Does an "expected but did not arrive" day speed up the lost-mail flag?

## Mail-day clock
- Idea: count lateness in delivery days the house actually saw, not calendar days. A mailbox door sensor, or the doorbell camera's "carrier detected" event, marks each day mail came.
- Who / why now: lost-mail flags go off falsely after holidays, a vacation mail hold, or snow days. A fair clock makes each flag worth acting on.
- Shape: each order shows "9 mail days" instead of "14 days". A calendar entry like "Mail hold Dec 20–27" (from the shared household calendar) pauses the clock and warns that a burst of mail is coming.
- Data: one row per day (date, mail seen: yes/no/unknown, source). It comes in through a webhook on the sync server.
- Risks: a dead sensor battery reads as "no mail" and hides lost mail. So after 2 unknown weekdays, fall back to calendar days. The webhook is a new way into the server and needs its own secret.
- Owner decides: which sources count as presence (sensor, camera, tapping "mail came" by hand), and whether the clock may ever lengthen a deadline the marketplace sets.

## Carrier-at-the-door nudge
- Idea: the door sensor or doorbell camera sends one phone notification: "Mail's here — 4 likely from your orders." Tapping it opens Packages already sorted with the likely sellers first.
- Who / why now: the app is used in the moment the mail comes. Today the collector opens it and scrolls. This shortens that moment.
- Shape: one notification a day at most. It works from the forecast above if there is one, otherwise from the oldest open orders. It never checks anything in.
- Data: the event time only. No camera images go to the server.
- Risks: wind, kids and neighbours open the mailbox door, so too many alerts get ignored. Add a quiet window and one alert a day.
- Owner decides: the quiet hours, and whether a parcel-size camera event should be treated differently from a letter.

## Hands-full voice check-in
- Idea: a phone automation or smart speaker phrase: "Check in Lantern Hollow Cards." It is an act by the owner, so it may decide something, but it goes through a holding step.
- Who / why now: at the mailbox, both hands hold envelopes. Saying the seller name while sorting replaces unlocking the phone 12 times.
- Shape: the spoken seller name is matched against open sellers. One open order: it is marked received with a 10-second undo toast. Two or more open orders, or a fuzzy match: it lands in a "Spoken, needs a look" tray for review in the app.
- Data: seller names sent to the phone's voice-command vocabulary, and a log of spoken check-ins with what was heard.
- Risks: a misheard name marks the wrong order. Sending seller names to the speaker vendor's cloud is a privacy cost.
- Owner decides: should voice go straight through on a single exact match, or always land in the tray? Phone only, or the speaker too?

## Claim deadlines in the household calendar
- Idea: the sync server publishes a private calendar subscription link. Events read like "Claim window closes — 3 orders, $4.85" on the right day. The calendar the owner already checks then becomes the reminder.
- Who / why now: a lost $0.40 card only matters if a claim is filed before the marketplace window closes. Nobody opens a tracker just to watch for that day.
- Shape: subscribe once. One event per day at most, listing order ids (e.g. TX-4471) and their cost. It deep-links into the app filtered to those orders. Read-only, nothing to keep in sync.
- Data: order date, the claim-window rule, and open status. The feed is built when it is requested. No timer is needed.
- Risks: the link is a credential. Anyone who has it sees the order history. A wrong window rule gives false comfort.
- Owner decides: the window length per marketplace rule, the smallest dollar amount worth an event, and whether the feed link can be rotated from the app.

Strongest: Mail-preview forecast — it uses a signal the house already gets every day with no new hardware, and it turns check-in from searching 400 open orders into confirming a short list.
