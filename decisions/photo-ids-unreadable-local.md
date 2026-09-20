# An Unreadable Local Photo Store Keeps Ids

When the local photo store cannot answer, the app must keep every photo id rather than treat silence as an empty store. Reading silence as empty once stripped every id not already backed up remotely. The next debounced save then wrote that stripped ledger. The photo id logic is three-valued now, so an unreadable store never plans a sync it cannot see clearly.

## The argument, as recorded

```
- **An unreadable LOCAL photo store keeps every id, exactly as an unreadable
remote one does.** `applyBackup` and `surveyPhotos` both used
`photos.keys().catch(() => [])`, which reads "I could not look" as "this device
holds nothing" — so with IndexedDB unavailable every id not already on the photo
remote was stripped, the debounced save wrote the stripped ledger, and the next
push published it. The remote half of this rule is argued at length below and
pinned by 26.13b; the local read never got the same treatment. It is
three-valued now: `applyBackup` keeps every id when the store will not answer,
and `surveyPhotos` returns `null` rather than planning a sync it cannot survey
honestly.
```

## See also

- `photo-ids-restore-keep-when-known` — the remote half of the same rule.
- `listphotos-is-three-valued` — the same three-valued reasoning applied locally.
