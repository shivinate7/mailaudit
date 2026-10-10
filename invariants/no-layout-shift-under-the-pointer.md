# No layout shift under the pointer

Hiding a row under the user's tap once caused cascading mis-taps on mobile. So a checked row stays visible until its package is fully received, or until the filters change. Sort order stays frozen while checking, and packages never auto-collapse mid-interaction. A card must also not change height on a tap. A row moving under the thumb is the same failure this rule exists to stop.
