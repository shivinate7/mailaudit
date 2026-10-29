# No test folds the Duo while the app runs

**What.** The shell UI tests launch MANIFEST in one pose and check the tab bar. No test folds or unfolds the Duo while the app is open. So nothing pins that the bar moves between the custom bar and the system bar at runtime. Nothing pins either that a fold to closed drops a stale flat hinge state before the inactive fold frames can split the outer screen. The hinge state also starts empty for one layout pass at launch.

**Status:** open. Add a test that changes the pose with ~/.local/bin/hinge mid-run, once the Duo slot allows a longer run.

**Decision:** `duo-card-in-hand`.
