# The 13-minute hang after the suite summary is unexplained

At `f956873` the New York run printed its summary and "all green". It then stayed alive with no CPU use for 13 minutes, until it was killed by hand. The UTC and machine-zone runs were stopped by hand just after their summaries. Their exit codes and the cause of the hang are unmeasured. The gap closes when both are measured and recorded.

**Status:** open.

**Decision:** `suite-size`.
