# Storage keys are frozen

The app reads and writes the ledger under a fixed localStorage key. Real users hold months of check-in data under this key today. A schema change must never break that data. Any schema change must ship together with an in-place migration in the load path.

## The argument, as recorded

```
1. **Storage keys are frozen.** App-level key `mailday:v1` (see STORAGE_KEY),
   shimmed under localStorage namespace `mailday:` → literal key
   `mailday:mailday:v1`. Real users have months of check-in data under these
   keys. Any schema change must ship with in-place migration in the load path.
```
