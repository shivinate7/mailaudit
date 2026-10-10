# Parser keeps only TCG purchases

The CSV parser keeps only rows where Type is `purchase` (or blank) and Vendor starts with `TCG`. The user's OrderWand exports now include eBay and seller-side rows. Those rows must never enter the checklist. Loosening this to a vendor toggle is a known possible future feature. Ask the user first.
