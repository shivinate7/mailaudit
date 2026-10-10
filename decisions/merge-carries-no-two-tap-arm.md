# Merge never needs a two-tap arm

Merge and push pulls, unions, applies, and pushes in one step, and it destroys nothing from either device. Because of that, it skips the two-tap confirm pattern reserved for destructive actions. Arming a control that destroys nothing would say the opposite of what the action does.

## See also

- `a-stale-push-conflicts-pull-gets-two-tap` — the confirm pattern this control skips.
- `sha-accepted-only-after-apply` — the rule merge still depends on.
