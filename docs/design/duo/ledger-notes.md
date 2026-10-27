# Ledger on the open Duo: notes

Mockup: `ledger.html`. Deep links `#s=a`, `#s=b`, `#s=c`. Open, flat, 951×669 pt, light theme only.

1. **Option A: Ledger on the left, the last working view on the right.** Gain: a filter change shows its effect at once. Loss: Sync and History still push the rows below. Pick: no. Owner word: yes.
2. **Option B: groups left, the open panel right.** Gain: a panel never pushes the list, so `panels-overlay-unbuilt` has no Duo case. History and Sync already close each other. Loss: the right page needs a default, Sync. Pick: B. Owner word: yes.
3. **Option C: View group left, Data group right.** Gain: every option at one glance. Loss: panels still need a place, and Reset sits far from the bar. Pick: no. Owner word: yes.
4. **Native rows only.** Re-import CSV and the key paste field are web-only (`native-parity-table`), so they are not drawn. The Sync panel shows status, last sync and the key's presence. Owner word: no.
5. **Constants.** Same masthead, rows, scale and tab bar.
