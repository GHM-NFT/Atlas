# QA Notes — v30.1 Styling Consistency

## Block Map

- Confirm Whole project and By territory controls share the approved premium button language.
- Confirm all six status controls show a colour marker, micro label, serif title/number and supporting description.
- Confirm All blocks uses white and Blocked uses red.
- Hover and keyboard-focus every coloured block and confirm the custom tooltip shows ID, title, status and progress.
- Confirm tooltips remain inside the viewport near all four edges.
- Confirm selecting a coloured block still opens its item detail.
- Confirm By territory cards still link to the correct territory page.
- Test 1366px, tablet, 390px and 320px widths.

## Typography

- Confirm page and card headings, major metrics and large counts use the editorial serif.
- Confirm micro labels, filters, metadata, form controls, tables and dense operational copy use the UI sans-serif.
- Confirm no large metric falls back to the UI sans-serif.
- Confirm the approved Overview typography remains visually unchanged.

## Shared components

- Confirm action buttons, link buttons, filters, forms, tables, cards, drawers and modal panels use the same border, radius, surface and hover language.
- Confirm no white or unstyled surfaces reappear in drawers, modal cards or Block Map territory cards.
- Confirm Export CSV remains compact.
- Confirm keyboard focus remains visible.

## Regression

- Verify all five map views, Command Index, Register, Dependencies, Evidence and Decisions.
- Verify all 11 territory pages and their drawers.
- Verify browser history, mobile navigation, map zoom/pan and CSV export.
- Verify reduced-motion mode.

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
