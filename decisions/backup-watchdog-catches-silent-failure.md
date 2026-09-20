# A scheduled watchdog checks the backup, not the phone

A daily scheduled workflow reads the data branch's own history and opens an issue if nothing has landed in four days. This alarm has fired for real once, on a deliberate test dispatch, and the resulting issue was verified and closed. A green run only proves the watchdog stayed quiet, so the fired test proves the other half too. The phone's own status line is only as honest as the phone. A device with an expired token, unreadable storage, or one that never opens, cannot report its own failure. The watchdog cannot be fooled by anything happening on a device.

## The argument, as recorded

```
   `backup-watchdog.yml` is the check the app cannot do for itself: it reads the
   `data` branch's own history on a daily schedule and opens an issue if nothing
   has landed in four days. **Its alarm has been seen to fire** — dispatched
   once with `threshold=0`, which opened issue #4, since verified and closed. A
   green run proves only that it stayed quiet; that input exists so the other
   half can be proven too, and both sides of the comparison go through
   `fromJSON` because step outputs are strings and a string/number compare that
   silently evaluates false is exactly how an alarm ends up never going off. The phone's "Backed up" line is only as honest as
   the phone — a device whose token expired, whose storage is unreadable, or
   that simply never gets opened has no way to tell you it stopped. This one
   cannot be fooled by anything happening on a device.
```
