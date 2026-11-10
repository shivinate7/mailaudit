# Each TestFlight run from CI may make a new Apple Development certificate.

**What.** The `testflight` workflow signs on a fresh hosted runner with automatic signing and the App Store Connect key. Upload run 42750597378 (2026-11-09) started with 0 signing identities in the runner keychain and ended with 1. So the run most likely made a new Apple Development certificate on the team. Apple caps the number of development certificates per team. Once the cap is reached, automatic signing fails, and an upload stops before the archive. The home repo saw the same 0 to 1 count.

Each of these closes the gap:

- A run proves that it reuses a team certificate.
- The workflow imports one certificate from a repo secret.
- A cleanup step revokes the run's certificate after the upload.

**Status:** open. The count per run is measured once. The team's current certificate count and Apple's cap for it are unmeasured.

**Decision:** `native-ships-via-testflight`.
