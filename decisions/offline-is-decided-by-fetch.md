# Offline is decided by a failed fetch

The app decides offline only from an actual failed network request, never from the browser's own online flag. That flag can get stuck reporting false after a sleep, a wake, or a network change. It once hid a real five-day sync outage behind a wrong offline message. A device that is genuinely offline still fails in the same request, one round trip later.

## See also

- `peek-is-three-valued` — the same three-valued rule applied to the sha read.
- `listphotos-is-three-valued` — the same rule applied to the photo list.
