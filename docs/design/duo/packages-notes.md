# Packages on the open Duo: notes

Mockup: `packages.html`. Deep links `#s=a`, `#s=b`, `#s=c`. Open, flat, 951×669 pt, light theme only.

1. **Option A: index left, open package right.** Gain: the open package stays put while you check it, and a left tap adds no Back step. Loss: a new one-line index row. Pick: A. Owner word: yes.
2. **Option B: two fixed columns of cards.** Gain: no new component, and the most open cards on screen. Loss: reading order crosses the fold, and the columns go uneven. Pick: no. Owner word: yes.
3. **Option C: masthead page, list page.** Gain: the tallies never scroll away. Loss: about 300 pt of the left page is empty. Pick: no. Owner word: yes.
4. **A check on the right page updates the left index row.** The row keeps its place and stays visible until the filters change, as `no-layout-shift-under-pointer` requires. Gain: no row moves under either thumb. Loss: a finished package lingers in the index. Pick: keep it. Owner word: no.
5. **The right page shows every row of the open package, received rows too.** Gain: you see the whole envelope's contents. Loss: it differs from Showing: Unreceived on the left. It follows `a-reveal-ignores-hidedone-too`. Pick: show all. Owner word: no.
6. **Constants.** Same data, scale and masthead in every option. The tab bar sits under the left page. Find sits over the page whose list it filters. The advisory line is not drawn.
