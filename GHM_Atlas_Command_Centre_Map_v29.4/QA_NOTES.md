# QA Notes — v29.4 Navigation QA Hardening

## Responsive shell

- Verify the desktop rail and complete top navigation remain unchanged above 970px.
- Verify the compact header, five map controls and hamburger appear from 970px down to 320px.
- Verify Timeline, Register, Dependencies, Evidence and Decisions remain reachable from the drawer at tablet widths.
- Test at 1024×768, 970×768, 768×1024, 430px, 390px, 360px and 320px.
- Verify no page-level horizontal overflow appears.

## Mobile and tablet drawer

- With the drawer closed, Tab must never enter its controls.
- Opening the drawer should focus the Close button.
- Tab and Shift+Tab should remain inside the open drawer.
- Escape, the scrim and the Close button should close the drawer.
- Closing without navigation should return focus to the hamburger button.
- Selecting a destination should close the drawer and focus the destination page heading.
- The underlying page must not scroll or receive focus while the drawer is open.
- Resizing above 970px should safely close an open drawer.

## Routing and browser history

- Navigate through several views and confirm browser Back and Forward restore each view.
- Confirm the browser title uses `GHM Atlas Command Centre v29.4`.
- Open at least two territory routes and confirm the URL includes the correct code, for example `#territory/WS001`.
- Reload a territory deep link and confirm the same territory is restored.
- Confirm unknown hashes do not break the current view.

## Keyboard and focus

- Confirm the skip link appears when focused and moves focus to the active page heading.
- Confirm route changes focus the new `<h1>` and announce the loaded view.
- Confirm focused controls and headings remain visible below the sticky header.
- Confirm every navigation control has a visible focus indicator.
- Verify reduced-motion mode disables non-essential transitions.

## Short-height desktop

- Test 1366×768 and 1280×720.
- Confirm every rail control remains reachable with controlled rail scrolling.
- Confirm the bottom artwork does not prevent access to territory shortcuts.

## Regression

- Verify all five map views.
- Verify all eleven territory shortcuts.
- Verify Timeline, Register, Dependencies, Evidence and Decisions.
- Verify the Bird’s-eye wheel zoom and map controls.
- Verify drawers, modals, wax mappings and item interactions remain functional.

# QA Notes — v29.3 Wordmark and Top-Nav Spacing

## Desktop navigation
- Confirm the Atlas logo matches the approved reference proportion and no longer dominates the header.
- Confirm the logo remains sharp with no clipping, stretching or soft enlargement.
- Confirm there is more space between the Waffle button and the centre decorative column.
- Confirm the five primary buttons remain aligned and unchanged in order.
- Confirm the centre column, secondary links, status typography and far-right column remain correctly positioned.
- Confirm all existing routes and navigation interactions still work.

## Responsive
- Confirm the smaller logo scales cleanly across large, mid-width and compact desktop layouts.
- Confirm the additional column spacing does not cause clipping before responsive hiding rules apply.
- Confirm mobile navigation remains unchanged.

# QA Notes — v29.2 Navigation Finishing Pass

## Desktop navigation
- Confirm the cropped Atlas logo is visibly about twice the previous on-screen size and is not clipped.
- Confirm all five left-rail map icons are approximately 20% larger and have increased spacing.
- Confirm inactive map modes sit near 50% prominence.
- Confirm the active map mode has white text, layered glow, luminous underline and a restrained animation.
- Confirm both top-nav columns are approximately 30% smaller than v29.1.
- Confirm the far-right column appears after the Command Centre Map / visible-items typography.
- Confirm the left-rail divider has a fine rule on both sides and clear breathing room above and below.
- Confirm every top-nav button and all eleven territory shortcuts still work.

## Responsive and accessibility
- Confirm short desktop screens retain access to every rail control.
- Confirm tablet layouts hide status/secondary elements before clipping.
- Confirm the mobile drawer and hamburger remain unchanged and functional.
- Confirm `prefers-reduced-motion` disables active-state motion.

## Regression
- Verify all routes, drawers, browser history, map wheel zoom, zoom controls and wax-seal filters.

# GHM Atlas Command Centre v29

Priority QA: verify five left-rail map modes, 50% inactive fade, active white label/glow/animation, both top-nav columns, all top-nav buttons, mobile menu, and all existing routes.

# QA Notes — v28.1 Navigation Review

## Desktop
- Confirm the five map icons and permanent labels appear in the top navigation.
- Confirm no box/frame appears around active map items.
- Confirm active state uses underline, glow and a single subtle settle animation.
- Confirm the Atlas logo is enlarged without clipping.
- Confirm the header height matches the 122px left rail width.
- Confirm the top divider shows capital, shaft and base.
- Confirm the left-rail divider has breathing room above and below.
- Confirm the eleven territory shortcut boxes remain unchanged.
- Confirm the bottom Atlas figure touches the viewport bottom and links to Overview.
- Confirm all tooltips and keyboard focus states remain available.

## Responsive
- At 1180px and below, confirm status information hides without overflow.
- At 930px and below, confirm command-centre links simplify without clipping.
- At 700px and below, confirm the existing mobile header and drawer remain functional.
- Confirm reduced-motion disables the activation animation.

## Regression
- Verify all routes, territory drawers and browser back/forward behaviour.
- Verify Bird's-eye wheel zoom and zoom controls.


## v29.1 checks

- Confirm five map modes have even vertical rhythm and permanent labels.
- Confirm inactive map modes are approximately 50% prominence; active mode has white text, glow, underline and subtle motion.
- Confirm both top-nav columns are visually secondary and fully visible.
- Confirm wax mapping: All items=all-items, Active=gold, At risk=silver, Blocked=red, Review=blue, Completed=green.
- Confirm reduced-motion disables active animation.
