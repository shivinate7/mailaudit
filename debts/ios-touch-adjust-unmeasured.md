# iOS touch adjustment near the order id link is unmeasured

**What.** Claim 17a of `check:screens` sweeps real touches in Chromium. The header spacing was set from that run. iOS Safari uses WebKit, which moves a tap near a link by its own rule. No iPhone and no WebKit run has tapped near the order id link. So the 13.5px of clear header on each side of the link's area is unmeasured against WebKit's reach (`order-id-button-stops-propagate`). The gap closes when a tap sweep runs on an iPhone, or in WebKit on the iOS Simulator, and its figures land in that decision.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
