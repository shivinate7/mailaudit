# Envelope photos, directed designer 1: notes

Designer kind: directed. Direction: camera-first: the camera opens first; everything else follows the shot.

Mockup: `envelope-photos-directed-1.html`. Screen: the native Orphaned tab, with the envelope camera, the photo strip and the viewer (debts `native-envelope-has-no-photos`, `native-photo-screens-unwired`). Devices: iPhone Duo folded (466 x 678 pt), the folded Duo at AX5, the open Duo (951 x 669 pt), and the large phone (402 pt wide). Light theme only: the native app is held to light (`design-parchment-ledger`).

Each item: what it is, the gain, the loss, and my pick. Each option has a Hide control on the page.

## The two options

1. **Shutter first.** A shutter bar sits above the tab bar on Orphaned (a tab bar accessory, HIG tab bars). One press opens a full-screen camera. Each shot drops into a tray; Done goes to the cards and the note, with the newest shot on top. Each pile row leads with its first photo (56 pt), or a dashed Add photo square. On the open Duo the camera holds the left page and the composer fills the right page as you shoot.
   - Gain: one press from the pile to the camera, several shots in one go, and the pile shows at a glance which envelopes have a photo. The camera runs only when asked. Closest to today's list, so the smallest build.
   - Loss: one press more than Live viewfinder. The bar takes 64 pt above the tab bar.
   - Pick: **Shutter first.**
2. **Live viewfinder.** The Orphaned tab opens on a live camera docked above the tab bar (216 pt folded). The pile above it is a contact sheet: each envelope is a print, a stacked print when it has several photos, a manila blank when it has none. A shot opens a sheet (Cancel leading, Save trailing, HIG sheets) for the cards and the note. A print opens the envelope's page, photos first. Hide shrinks the camera to a 60 pt bar.
   - Gain: no press at all to the camera, and the strongest "what did it look like" view: the pile is pictures.
   - Loss: the camera runs whenever the tab is open (battery, the green camera dot, a permission ask on the first visit to the tab). On the folded Duo the dock leaves room for about one row of prints. Prints break the 56 pt tile rule.
   - Pick: keep as the bolder alternative; not my pick.

## Choices inside both options

3. **The record control opens the camera, not the card-name field.** Owner grant: yes.
   - Departs from: `orphan-entry-takes-one-input` (the input is autofocused when the view opens; photos never block the fast path). Today: `OrphanedView.list`, "+ Record an envelope" opens `ComposerView` with `focused = .name`.
   - The fast path stays one press: "Type" beside the shutter, "No photo" in the camera, "Type the cards instead" when camera access is off.
   - Gain: the direction. Loss: a person who never photographs pays one press more than today on the open path ("Type"). Pick: open the camera.
4. **An in-app camera, not the system picker.** Today the web uses a file input with `capture="environment"` (`EnvelopeComposer`, `src/app.jsx`), which is the system camera, one shot per press.
   - Gain: the shot tray, several shots per envelope, the camera on one Duo page beside the composer. Loss: more code (a capture session), and the app must declare `NSCameraUsageDescription`, which Info.plist lacks (debt `native-photo-screens-unwired`). Pick: in-app.
5. **The photo leads the composer.** The newest shot is a 180 pt banner at the top of the composer, the 56 pt strip under it, then today's card field, suggestions, steppers, note and Save (`ComposerView`). No photo shows a dashed "No photo of this envelope yet" line with "Photograph it".
   - Gain: you type the cards while looking at the envelope you shot. Loss: 180 pt more before the card field on the folded Duo. Pick: keep.
6. **The viewer zooms, swipes and removes.** Owner grant: yes.
   - Departs from: `photo-thumbnails-and-viewer` (a tap anywhere dismisses; the picture is the only thing to reach). Today: `PhotoViewer` in `PhotoViews.swift` and `src/app.jsx`.
   - At 1x a tap still closes, and Escape closes. Double-tap or pinch zooms to 2.5x (up to 4x); when zoomed, a drag pans and a tap does nothing. A sideways drag at 1x turns to the next photo. A Close control, a "2 of 3" count and a Remove control are added, so the viewer has more than the picture to reach.
   - Gain: you can read a smudged postmark. Loss: a modal with three controls, and the tap-to-close waits about a quarter second to tell a tap from a double-tap. Pick: keep.
7. **Remove a photo from a saved envelope, in the viewer.** Owner grant: yes.
   - Today the web removes a photo only in the composer, at once, with no ask (`PhotoStrip` `onRemove`, `EnvelopeComposer`). Native has no remove.
   - The label is "Remove from envelope", never "Delete": a photo already pushed stays in git and in the Worker (`photos-in-git-are-permanent`), so "Delete" would claim more than the app does. The sweep then drops the local blob (`orphan-sweep-drops-unused-photos`). Red per `orphaned-colours-by-meaning`.
   - Pick: allow it in the viewer, for saved and new envelopes alike.
8. **Remove style: Undo, or Tap again.** ux-ask-or-undo allows one, never both. Both are drawn (Remove asks row; each has a Hide control).
   - Remove, then Undo: one press, and an Undo line where the press was. Gain: fast. Loss: an Undo line to dismiss.
   - Tap again to remove: arms in place for 4 s, like Discard (`EnvelopeCard`). Gain: matches Discard. Loss: two presses.
   - Pick: **Remove, then Undo.** When the last photo goes, the viewer closes and the Undo line shows at the top of the envelope's row or page.
9. **The pile shows which envelopes have photos.** Shutter first: a 56 pt tile with a count badge, or a dashed Add photo square that opens the camera for that envelope. Live viewfinder: a print, a stacked print, or a manila blank. The Lost tile stays as today (manila, not a button, `LOST_PHOTO_SAYS`). Pick: per option.
10. **Camera access is off.** The camera shows one sentence, "Open Settings" and "Type the cards instead" (ux-no-dead-end). The shutter dims. Pick: keep.
11. **A photo was not saved.** The answer shows in the tray, where the shot lands: "This photo was not saved: the phone is out of space. The envelope still saves without it." with Try again (ux-answer-at-press, ux-unknown-is-not-empty). Today the web drops the error silently (`addPhoto` catch, `src/app.jsx`). Pick: keep.
12. **Cancel keeps the draft and its photos** (ux-keep-what-was-made, `orphan-entry-takes-one-input` The composer's draft). The shutter bar then reads "Resume envelope, 2 photos, 1 card kept". Pick: keep.
13. **The open Duo.** Shutter first: the pile left, the chosen envelope's page right, photos first; while shooting, the camera left and the composer right. Live viewfinder: the contact sheet and the dock left, the page or the composer right. The viewer shows the photo on the right page and the envelope's photos as a grid on the left page. Only the scrim spans the fold strip. Pick: per option.
14. **The largest text size.** At AX5 the pile rows stack the tile above the text and the composer footer stacks, as `ComposerView` does today. The shutter bar's label, the camera chrome and the viewer chrome stop growing at xxxLarge, like a tab bar, and a long press would show the Large Content Viewer. Owner grant: yes, since it caps text below the 200 percent the HIG asks for (HIG accessibility).
   - Gain: the camera keeps its viewfinder at AX5. Loss: those labels stay at 135 percent. Pick: cap.
15. **Candidates are unchanged.** "Could have come from", its rows and This one keep today's look (`CandidateRow`), drawn as a dashed placeholder. Assigning an envelope does not change.

## Sizes and sources

- Duo folded 466 x 678 pt; tab bar from y 595, 83 pt with the inset (measurement `duo-fold-and-keyboard`, 2026-11-08). Open Duo 951 x 669 pt, fold strip 455.5 to 495.5 pt (same record). The open Duo's tab bar is the spine pill: 64 pt, 24 pt in, 12 pt up (`DuoBarMetrics`).
- Large phone: 402 pt wide, the window logged in `TallyUITests` (measured 2026-10-28). Its height, status bar and tab bar are not written; the frame is drawn at 874 pt as a placeholder.
- `layout.py devices` prints `unknown` for this repo, so the device sizes come from the brief and the records above.
- Status bar foot: unmeasured, drawn at 20 pt. The keyboard is not drawn.
- Apple pages read 2026-11-21, each answered 200: layout, typography (Dynamic Type sizes: Large Body 17, Footnote 13, Caption 1 12; AX5 Body 53, Footnote 44, Caption 1 43; xxxLarge Body 23), accessibility (44x44 pt controls; text to 200 percent), buttons, sheets (Cancel leading, Done trailing), tab-bars (navigation, not actions; an accessory such as the MiniPlayer may attach), toolbars.
- Fonts: Cochin for words and Menlo for numbers, per `typography-cochin-and-mono`; the system font for the camera, viewer, sheet and tab bar chrome.

## Self-check

- `check_ios_mockup.py`: one fault, `system-font`, because content is set in Cochin as the repo rules. Every older mockup in `docs/design` gets the same fault. House `tokens.md` allows a brand font in content. Possibly a false alarm in the check.
- Mockup set check (skill `design-review`), my own read: both options `new` (a camera as the first act, a pile that leads with photos, and in Live viewfinder a camera on the tab's first screen and a contact sheet). Native or web-like: both `native` in structure (tab bar with accessory, full-screen camera, sheet with Cancel and Save, a pushed page with a back control); the Edit, Discard and Save labels are today's mono `MiniLabel`, not system buttons.
- impeccable critique (Assessment A only, a native target), findings: (a) the zoomed deep link framed a blank corner, fixed to frame the address; (b) the composer kept the shutter bar over Save, fixed by hiding the bar while composing; (c) the open Duo composer drew Cancel and Save twice, fixed; (d) the camera surround showed the pile through it, fixed to opaque; (e) the Live viewfinder dock leaves about one row of prints on the folded Duo, not fixed, it is the option's cost; (f) at AX5 the envelope header wraps inside the date, not fixed, today's header does the same.
