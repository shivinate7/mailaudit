# No native browser dialogs

The app never uses window.confirm or window.alert. These dialogs block the whole page and look wrong in a home-screen app. Every destructive action uses an inline two-tap confirm instead. Arming one destructive control disarms every other one, so two primed destructive buttons never sit side by side.
