# Parser keeps only TCG purchases

The CSV parser keeps only rows where Type is purchase or blank, and Vendor starts with TCG. The user's exports now include eBay and seller-side rows, and those rows must never enter the checklist. Loosening this to a vendor toggle is a known possible feature. It needs the user's decision first.

## The argument, as recorded

```
4. **Parser filters:** keep only rows where Type is `purchase` (or blank) AND
   Vendor starts with `TCG`. The user's OrderWand exports now include eBay and
   seller-side rows; those must never enter the checklist. (Loosening to a
   vendor toggle is a known possible future feature — ask the user first.)
```
