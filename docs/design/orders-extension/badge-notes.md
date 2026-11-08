# Orders extension, toolbar badge: design notes

Mockup: `badge.html` beside this file. Open it from disk. Plan: `orders-extension`, section Badge.

Size: Chrome's toolbar end at real size, and the same drawing at three times to read the overlap. The toolbar greys and the badge's size and font are Chrome's, drawn approximately; the extension sets only the badge text, the fill, the text colour and the icon title. No device list applies.

Themes: a light and a dark Chrome toolbar. Deep links: `#t=both`, `#t=light`, `#t=dark`. Add `&hide=nokey,pulling` to drop the extra states.

## Choices

1. **Plan states.** As the plan's table: a success shows the `added` count, a success with 0 shows no badge, `signed-out` shows `in`, any other failure shows `!`. A success that dropped unreadable lines is still a success: it shows the count, not `!`. The options page carries the dropped lines.

2. **Fills.** Count: `accent` `#6F5CA6`, the app's progress colour. Not `green`, which means "received" in the app; new order lines are not received cards. `in`: `amber` `#846008`, the app's warning that waits on the owner. `!`: `red` `#A8443C`. Text on all three: `card` `#FCF6EA`, the theme's white (`setBadgeTextColor`). Ratios: 5.19, 5.33 and 5.48. Gain: each colour keeps its app meaning. Loss: none found.

3. **One fill set for both toolbars.** The background service worker has no `matchMedia`, so it cannot tell Chrome's theme. The badge text keeps over 5:1 inside the badge on both toolbars. The badge's edge against Chrome's dark toolbar measures about 1.9:1 to 2.0:1, under the 3:1 a non-text shape asks for. Gain: no theme detection. Loss: on the dark toolbar the badge reads by its text, not its shape. Pick: one set. Theme detection through an offscreen document is the alternative; it was not drawn.

4. **The title tells the empty states apart. Builder must follow.** Pulled with 0 new lines, never run and no key all show no badge. Only the icon's title (`chrome.action.setTitle`) separates them (`ux-unknown-is-not-empty`). Set the title in every state:

   | state | title |
   |---|---|
   | count | MANIFEST orders: 12 new lines. Pulled Sun, Nov 8, 9:14 AM. |
   | 0 | MANIFEST orders: no new lines. Pulled Sun, Nov 8, 9:14 AM. |
   | `in` | MANIFEST orders: signed out of TCGplayer. Sign in, then load any store page. |
   | `!` | MANIFEST orders: the last pull failed. Open Options for the fix. |
   | no key | MANIFEST orders: no device key. Open Options to paste one. |

   Times in the title use the owner's local time, in the options page's format.

5. **Long counts.** Chrome fits about four characters. A count over 999 shows `999+`. A first run may add hundreds of lines. Unmeasured: the badge width at four characters.

6. **How long the count stays.** Until the next run sets a new badge. The plan is silent. Gain: the owner sees the last result whenever they look. Loss: a count from yesterday looks like news. Pick: keep it until the next run; the title carries the time.

7. **A press on the icon.** Opens the options page (`chrome.runtime.openOptionsPage` from `action.onClicked`), with no popup. The plan is silent. Gain: one page holds every state and fix. Loss: none found.

8. **Extra states** (`#strip-light`, cells `light-nokey`, `light-pulling`, each with a × that hides it). No key: no badge, with its own title. Pulling: `…` on the accent fill while pages load. Gain: the toolbar says why nothing happens, and that a run is under way. Loss: two more states to build and test.
   Departs from: the plan's Badge table, which names three states. Not blocking. Owner grant: yes.

9. **Icon.** The favicon drawing (`favicon_svg()`, record `assets-and-icons`). The badge covers its lower right lobes and part of the ring; the emerald centre stays clear in every state.
