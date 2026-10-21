# The native masthead shows on Packages only

**What.** `PackagesView` draws the masthead. Ledger, Orphaned and Tally render without it, where the web masthead sits above every view (`masthead-is-one-letterhead`). The count line has the Packages form only, `N packages · autosaves`. The web line also reads the envelopes waiting and the unique items by view, and adds "in range" under a date filter. The gap closes when each native view shows the masthead with its own count line, and a test pins each one.

**Status:** open.

**Decision:** `masthead-is-one-letterhead`.
