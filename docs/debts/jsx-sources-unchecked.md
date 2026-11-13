# The two JSX source files get no type check or bug lint

**What.** The shared `code-check` standard has no row for `.jsx`, and its remedy for a language with no row is to list the path in `.code-check.json`. `src/app.jsx` and `src/entry.jsx` (the page's only JSX, 8,179 lines) are listed there, so `code-check` reads neither. The comment check skips them too. The build and the test suite still run them.

**Status:** open. A `.jsx` row in the shared standard closes it. The repo changes to fit the shared tool, so no check here is a stand-in.

**Decision:** none.
