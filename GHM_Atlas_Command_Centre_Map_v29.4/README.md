# GHM Atlas Command Centre v29.4

Navigation QA hardening build based on the approved v29.3 visual shell.

## v29.4 changes

- Extends the compact hamburger and drawer navigation through 970px so tablet users retain access to Timeline, Register, Dependencies, Evidence and Decisions.
- Makes the closed mobile drawer inert, hidden from keyboard navigation and unavailable to pointer input.
- Adds modal drawer focus management: initial focus, Tab containment, Escape closing and focus restoration.
- Makes the background interface inert while the mobile navigation is open.
- Adds browser Back/Forward support with `pushState`, `popstate` and route restoration.
- Adds territory-specific deep links such as `#territory/WS007`.
- Adds a skip-to-content link, route-heading focus and an assistive live-region announcement.
- Adds sticky-header focus offsets so focused content is not obscured.
- Adds a short-height desktop rail fallback with controlled vertical scrolling.
- Removes the conflicting generated mobile “A” and uses one explicit mobile Atlas logo treatment.
- Corrects dynamic browser titles to v29.4.
- Preserves the approved v29.3 desktop navigation proportions, map-state styling, wax mappings and application functionality.
- Uses supplied artwork only; no image generation.

## Entry point

`index.html`

# GHM Atlas Command Centre v29.3

Final proportional adjustment to the desktop navigation using supplied artwork only; no image generation.

## v29.3 changes
- Reduces the Atlas wordmark to the approved proportion instead of allowing it to dominate the header.
- Keeps the wordmark at or below its native source width for a sharper result.
- Adds a clearer visual pause after the five primary map buttons.
- Shifts the centre decorative column slightly right without changing button order or functionality.
- Preserves the v29.2 map-icon sizing, active glow, wax mappings, responsive behaviour and all existing application features.

# GHM Atlas Command Centre v29.2

Navigation finishing pass based on the approved desktop review. Uses supplied artwork only; no image generation.

## v29.2 changes
- Uses the tightly cropped Atlas wordmark and substantially increases its visible scale.
- Increases the five left-rail map icons by 20% with more vertical breathing room.
- Improves the active map state with a layered gold halo, white label, luminous underline and subtle settle/glow animation.
- Keeps inactive map modes at approximately 50% prominence.
- Reduces both top-navigation columns by approximately 30%.
- Places the far-right column after the Command Centre Map / visible-items typography block.
- Adds a fine horizontal rule and extra space around the left-rail column divider.
- Preserves routes, state, territory shortcuts, labelled wax mappings, mobile navigation and reduced-motion behaviour.

# GHM Atlas Command Centre v29

Navigation correction based on the approved v29 mockup. Uses supplied artwork only; no image generation.

# GHM Atlas Command Centre v28.1

Navigation review build based on the optimised v28 branch.

## Included
- Enlarged Atlas logo and a 122px architectural header
- Five map-view icons restored to the desktop top navigation
- Permanent labels below each map icon
- Frameless active treatment using a gold underline, restrained glow and subtle settle animation
- Full capital/shaft/base column divider in the top navigation
- Matching architectural divider between map views and territory shortcuts
- Brighter top stroke plus restrained navy gradient and texture
- Clickable bottom-flush Atlas figure returning to Overview
- Responsive tablet handling and reduced-motion support
- Existing routes, data, mobile drawer, wheel zoom and information architecture retained

Open `index.html` directly or publish the folder through GitHub Pages.


## v29.1 cleanup

Refines navigation proportions and spacing against the approved mock-up, reduces both top-bar columns, and corrects wax-seal mappings using the supplied labelled artwork.
