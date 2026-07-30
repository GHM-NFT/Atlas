# QA Notes — v30.0

## Priority deployment checks

### Navigation
- Confirm Command Index appears in place of Timeline on desktop and mobile.
- Confirm Command Index opens the existing Territory Index.
- Confirm the animated burger changes to an X state while the full-screen mobile menu is open.
- Confirm all generated links, back links, quick chambers and territory buttons navigate correctly.
- Confirm no page heading receives a visible browser focus rectangle after navigation.
- Confirm keyboard focus remains visible on actual controls.

### Responsive breakpoints
Test at:
- 1366×768
- 1024×768
- 832×1112
- 768×1024
- 430×932
- 390×844
- 360×800
- 320×568

Check:
- no page-level horizontal overflow
- no clipped drawers or modal headings
- map icons remain centred and the active underline sits beneath the active icon
- mobile logo and hero emblem remain visible
- action buttons remain equal width where stacked
- territory status filters remain fully reachable

### Block Map
- Default view shows the whole project in one coloured block field.
- Whole Project and By Territory switching works.
- Status filters work in both modes.
- Every block opens the correct item.
- Every territory section links to the main territory page.
- Block colours match the status legend.
- No wax seals are used inside the block matrix.

### Bird’s-eye map
- Mouse wheel zooms toward the pointer.
- One-pointer drag pans the map.
- Two-finger pinch zooms the map rather than the whole browser page.
- Fit restores the complete map.
- Quick All and Blocked controls update the status view.
- Connections and Labels toggles remain functional.
- Mobile controls form a compact two-row dock near the bottom.

### Waffle
- Search filters by ID, title, owner, workstream and status.
- Quick status buttons and workstream selector combine correctly.
- Cards remain aligned at all target widths.
- Territory emblems remain legible.

### Territory pages
- Correct territory emblem appears in the hero.
- Command Index back link works.
- Quick Chamber and Locate in Bird’s-eye buttons work.
- Progress and health colours remain consistent.
- Status filters fit on mobile.
- Blocker counts use the red emphasis treatment.

### Command-centre views
- Register Export CSV uses the compact approved action-button style.
- Dependencies, Evidence and Decisions cards open the correct item.
- Milestone Horizon remains functional even though it is no longer a primary navigation label.

### Drawers and modals
- No white cards or white dependency rows appear.
- Drawer top content is present and not clipped.
- Open Full Territory and Open Territory actions use the approved button language.
- Drawer and modal content remain scrollable on short devices.

### Loader and fonts
- Branded loader appears briefly and always clears.
- External fonts load where available.
- Georgia/Arial fallbacks maintain a usable layout if font services are blocked.

### Footer
- Replacement Ethos banner includes both left and right border details.
- Banner is visibly larger at all breakpoints.
