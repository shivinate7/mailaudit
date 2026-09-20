# Disclosure panels fade in, their space does not

A disclosure panel arrives with an opacity and position fade. The layout space it takes is never animated, because it is the same push-down the page has always had.

## The argument, as recorded

```
- **The disclosure panels arrive** (220ms, opacity and 4px). The space they
  take is *not* animated and must not be — it is the same layout they have
  always pushed down, one commit after the tap.
```
