# Parser keeps only TCG purchases

The CSV parser keeps only rows where Type is purchase or blank, and Vendor starts with TCG. The user's exports now include eBay and seller-side rows, and those rows must never enter the checklist. Loosening this to a vendor toggle is a known possible feature. It needs the user's decision first.
