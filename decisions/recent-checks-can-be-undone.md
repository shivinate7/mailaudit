# Recent check-ins can be undone by tap

**Status:** open. The owner asked for it on 2026-10-11. Nothing is built.

**Holds while:** the app has no list of recent check-ins, and its only undo covers an envelope assignment.

## The problem

A mis-tap checks the wrong card. In the unreceived view, a checked card leaves the list at once. So the owner cannot see which card it was, and cannot put it back.

## What the owner wants

A short history of recent check-ins and un-checks, opened by taps. Each row names the card and the change. One tap reverses that one change.

## A lead, not yet a design

`receivedAt` already stores the time of each card's last change. Sorted by time, it gives the most recent changes for free. An un-check from that list is a normal later change, so it syncs by `merge-later-change-wins`.

## See also

- `sync-revamp-cloudflare`, the sync this change must travel through.
- `no-layout-shift-under-pointer`, which any new list must keep.
