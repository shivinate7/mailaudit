# Nothing pins the device key in the backup export or SwiftUI view state

Nothing yet pins the native device key in the backup export or in SwiftUI view state. Lane N8 owns the export, see `native-build-lanes`, and `native-lanes-n6-to-n9-unbuilt` tracks that lane. The gap closes when a test pins that the device key stays out of the backup export and out of SwiftUI view state.

**Status:** open.

**Decision:** `the-token-is-a-credential`.
