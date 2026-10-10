# Gold is ornament only, never text

The `gold` token is ornament only. At 2.2:1 on `card`, it fails the contrast floor for text by a wide margin. It exists only for the masthead rules, and for nothing else. The measured ratio is in the `palette-contrast` record.

**Holds while:** `gold` is `#C9A961` in `C` in `src/app.jsx`, and no text uses it. Its two uses are backgrounds in the `<style>` block.

## See also

- `palette-contrast` — the measured ratio behind this ruling.
- `palette-token-table-and-contrast-floor` — the full token table this token belongs to.
