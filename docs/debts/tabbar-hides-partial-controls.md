# The tab-bar skip never checks a control partly under the bar

**What.** The native accessibility audit skips every finding whose element shares any area with the iOS tab bar, or lies wholly below the window (`isUnderTabBar` in `native/ManifestUITests`). The skip takes any element, not only text. So a control that is partly hidden by the bar, such as a button the masthead pushes down, is never checked in that state. A real defect on that control, such as a missing label or low contrast, passes the audit while the control sits there. It is checked again only in a state where it clears the bar.

**Status:** named limit. The owner accepted it on 2026-11-06 (owner page item 148, pick b, "Any element"), so that the Packages and masthead findings the bar causes clear and the milestone run's audit can go green. It reopens only on a new owner ruling.

**Decision:** `audit-skips-measured-flags`.
