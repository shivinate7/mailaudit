# Storage keys are frozen

The app reads and writes the ledger under a fixed localStorage key. Real users hold months of check-in data under this key today. A schema change must never break that data. Any schema change must ship together with an in-place migration in the load path.
