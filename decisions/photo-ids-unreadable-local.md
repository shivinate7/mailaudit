# An unreadable local photo store keeps ids

When the local photo store cannot answer, the app must keep every photo id rather than treat silence as an empty store. Reading silence as empty once stripped every id not already backed up remotely. The next debounced save then wrote that stripped ledger. The photo id logic is three-valued now, so an unreadable store never plans a sync it cannot see clearly.

## See also

- `photo-ids-restore-keep-when-known` — the remote half of the same rule.
- `listphotos-is-three-valued` — the same three-valued reasoning applied locally.
