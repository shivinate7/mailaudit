# Remote Sync Never Touches The Save Indicator

The local save runs on its own debounced path with its own saved or saving indicator. Remote sync sits deliberately outside that path. No remote error, of any kind, ever touches the local saving state.

## The argument, as recorded

```
- Persistence auto-saves debounced 500ms with saved/saving indicator. The remote
  is deliberately *not* on that path — no error there ever touches `saving`.
```
