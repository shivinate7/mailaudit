# Fold strip, keyboard frame and outer screen on the iPhone Duo simulator

This record holds the fold strip, the system keyboard frame and the outer screen's safe content on the iPhone Duo simulator. Re-measure after a change to the fold reading or the keyboard layout. The decision that uses these figures is `duo-card-in-hand`.

**Status:** measured 2026-10-27 at 14:03 CDT on the iPhone Duo simulator, iOS 27.1. The fold strip is one reading, taken after a close. The keyboard figures rest on the frame only.

## How to re-measure

Fold the simulator, take the two screenshots, and read the two APIs in a probe app. Run these by hand.

```
~/.local/bin/hinge -d <udid> open|half|close
simctl io <udid> screenshot --display=LCD-1    # inner screen
simctl io <udid> screenshot --display=LCD      # outer screen
```

In the probe app, read the reservedRegions call with kind division and options includeInactive, and the keyboard frame notifications.

```
reservedRegions(kind: .division, options: .includeInactive)
```

Never drive Device Hub.

## Reader

No test reads these figures. The build re-reads the fold at run time, so the build is the check. See `duo-card-in-hand`.

## Figures

- Outer screen: 382 by 644 pt of safe content. Insets: bottom 34, trailing 84.
- Fold strip: 40 pt, centred on the inner screen's 951 pt edge, at 455.5 to 495.5 pt. One reading, taken after a close. No fold was reported while open. Re-read it in the build.
- System keyboard frame: open 951 by 263 pt. Half-open 801 by 263 pt. Outer screen 466 pt wide by 250 to 289 pt tall; two heights were read, likely with and without the suggestion bar.
- Keyboard panel, drawn: on the open Duo with the keys up, the panel draws from about y=405 pt, while the reported frame starts at 449 pt, a 44 pt strip. Source: one simulator screenshot, the open-hand shot of wave 3, 2026-10-28. Content that must clear the keys is placed against 405 pt, not 449 pt.
- The frame is full width on the open screen, so it spans the fold. The keys never showed in screenshots, likely because a hardware keyboard was attached. So the spanning rests on the frame only.
