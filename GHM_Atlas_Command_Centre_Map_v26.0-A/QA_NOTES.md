# v24 QA notes

Validated on 2026-07-19:

- 5 core map controls in the left rail
- 11 direct territory shortcuts in a two-column grid
- no project-control shortcuts in the left rail
- Timeline, Register, Dependencies, Evidence and Decisions retained in the top navigation
- 11 workstreams retained
- 248 project items retained
- all local HTML, CSS, JavaScript and image references resolve
- all SVG files parse successfully
- all PNG, JPEG and WebP assets verify successfully
- JavaScript syntax checks pass for `app.js` and `data.js`
- CSS parser reports no syntax errors in `v24-refinement.css`
- no duplicate HTML IDs


## v26.0-A checks
- Confirm all five map-view buttons retain their existing routes.
- Confirm all eleven territory shortcuts open the correct territory.
- Confirm keyboard focus is visible on every rail control.
- Confirm the bottom Atlas figure does not overlap controls at common desktop heights.
- Confirm the rail remains scrollable on short desktop viewports.
- Confirm the desktop rail remains hidden at the existing mobile breakpoint.
