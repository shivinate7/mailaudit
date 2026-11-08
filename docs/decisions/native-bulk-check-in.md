# Native Mark all received and Clear check-ins

The iOS Packages card and the open Tally row carry Mark all received and Clear check-ins, as the web's do (`src/app.jsx` `bulkSet`). They sit in their own row under the card's 48pt Stamp-or-band slot. Departs from: the web puts them beside Stamp, but there a stamp's Save adds the band and moves Save under the thumb, which `no-layout-shift-under-pointer` forbids. The invariant answers it, so it was not put to the owner.

**Holds while:** the web's card carries both controls beside Stamp, and the native card has no other home for them (the Packages head and the Ledger tab carry none, as on the web).

Departs from: `TallyModel.bulk(name:on:)` (`native/ManifestKit/Sources/ManifestKit/Tally.swift`) marks the product's copies sticky on a Mark all, and the web's `bulkSet` (`src/app.jsx`) leaves `sticky` alone. Under Hide received the web drops the row, and its Undo with it, from under the pointer. The native row and its Undo stay in place, which `no-layout-shift-under-pointer` requires.

The Clear ask names one card in the singular ("Tap again to clear 1 check-in"), as the stamp ask does.

A control that cannot apply, such as Mark all once every card is in, keeps its slot, hidden, so the other control never moves under the thumb (`no-layout-shift-under-pointer`). The web removes it and lets the row reflow. The invariant answers this, so it was not put to the owner (orchestrator, 2026-10-29 00:27 CDT).

**Status:** open on the guard each control takes. The web runs both on one tap, with no ask and no Undo. Pick (a), Clear asks with two taps and Mark all offers Undo, is built meanwhile. Waiting item 41, `stamp-bulk-guard`.
