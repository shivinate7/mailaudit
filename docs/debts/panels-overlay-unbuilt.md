# Disclosure panels still push the list

**What.** Today a panel takes layout space and pushes the list down. On native, the Sync panel (`syncRow` in `LedgerTab.swift`) and the History list (`history`) mount in flow inside the Data card and push the rows below them. The owner ruled on 2026-10-11 that a disclosure panel overlays the list. The gap closes when `.mdl-panel` overlays the list and a check proves the list does not move, on the web and on native.

**Status:** open. Ruled 2026-10-11, not built.

**Decision:** `motion-disclosure-panels-arrive`.
