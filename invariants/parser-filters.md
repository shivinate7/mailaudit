# Parser keeps only TCG purchases

The CSV parser keeps only rows where Type is `purchase` (or blank) and Vendor starts with `TCG` (or is blank). The user's OrderWand exports now include eBay and seller-side rows. Those rows must never enter the checklist. A blank Type or Vendor is kept because older exports may not carry those columns. No eBay row has ever been seen without a Vendor. The owner ruled the blank Vendor in on 2026-10-10. Loosening this to a vendor toggle is a known possible future feature. Ask the user first.

**Pinned by:** group 46 (46.1–46.7: the eBay, sale and other-vendor rows are each rejected by one filter, and a blank Vendor is kept).
