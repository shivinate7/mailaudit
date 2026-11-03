# The universal-link key fallback is not built

**What.** Neither the link handler nor the Worker route that serves the apple-app-site-association file exists. The owner ruled on 2026-10-11 that a universal link takes over if the iPhone Camera does not open the custom scheme. The lane N11 Camera check passed on 2026-10-22 19:50 CDT, see `native-build-lanes`, so neither is built. Both are built only if the Camera stops opening the custom scheme.

**Status:** open. The Camera check passed on 2026-10-22 19:50 CDT. Nothing builds the fallback unless the Camera stops opening the scheme.

**Decision:** `native-key-via-url-scheme`.
