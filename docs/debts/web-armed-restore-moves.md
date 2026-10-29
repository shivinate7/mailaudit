# The web armed Restore moves under the pointer

**What.** In the web History panel (`src/app.jsx`, the armed version row), arming Restore inserts Cancel before it, so Restore's leading part moves right and a second tap there lands on Cancel. `armed-reset-takes-the-row` and `no-layout-shift-under-pointer` say an armed control does not move. The native row keeps Cancel in a slot after Restore, kept free all along. The safe side fails: the stray tap cancels, it does not restore. The gap closes when the web row reserves Cancel's slot as the native row does, and a screens claim pins it.

**Status:** open. No lane yet.

**Decision:** `armed-reset-takes-the-row`.
