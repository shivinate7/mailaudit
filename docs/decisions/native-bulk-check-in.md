# Native Mark all received and Clear check-ins

The iOS Packages card and the open Tally row carry Mark all received and Clear check-ins, as the web's do (`src/app.jsx` `bulkSet`). Both controls share the card's action row with Stamp, as on the web.

**Holds while:** the web's card carries both controls beside Stamp, and the native card has no other home for them (the Packages head and the Ledger tab carry none, as on the web).

A control that cannot apply, such as Mark all once every card is in, keeps its slot, hidden, so the other control never moves under the thumb (`no-layout-shift-under-pointer`). The web removes it and lets the row reflow. The invariant answers this, so it was not put to the owner (orchestrator, 2026-10-29 00:27 CDT).

**Status:** open on the guard each control takes. The web runs both on one tap, with no ask and no Undo. Pick (a), Clear asks with two taps and Mark all offers Undo, is built meanwhile. Waiting item 41, `stamp-bulk-guard`.
