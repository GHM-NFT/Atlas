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
