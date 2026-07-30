# GHM Atlas Command Centre Map v25

v25 is a controlled visual and usability refinement of the approved v23 baseline. It preserves the complete product structure, data, status model and drill-down behaviour while simplifying navigation and improving consistency across the interface.

## Navigation

Top navigation:
- Overview
- Bird’s-eye
- Structured
- Block
- Waffle
- Timeline
- Register
- Dependencies
- Evidence
- Decisions

Evidence remains a dedicated top-level project-control view.

Left navigation:
- five enlarged core map controls
- a column divider
- direct quick links to all 11 territories in a two-column grid

Project-control shortcuts have been removed from the left rail. They remain available in the top navigation.

## Territory icons

The previous small territory PNGs have been replaced by a consistent, lightweight SVG set designed for clear display at navigation size.

The SVG mapping preserves the workstream meanings:
- WS001 White Paper — scroll
- WS002 Website — globe
- WS003 Pipeline / Technical — cog
- WS004 Video Production — theatre masks
- WS005 Metadata / Manifest — inscribed tablet
- WS006 Launch / Market Readiness — torch and wreath
- WS007 Atlas / Story / Portal — Atlas figure
- WS008 Artwork / Collections — classical profile
- WS009 QA / Review / Decisions — scales
- WS010 Sources / Library — closed scroll
- WS011 Prints / Fulfilment — layered print

## UI/UX refinement

- simplified top-navigation shell and clearer active states
- larger map controls and denser two-column territory access
- consistent focus-visible treatment for keyboard navigation
- improved page spacing, headings, cards, filters and controls
- sticky register headers and improved table scanning
- refined map controls, drawers, modals and scrollbars
- responsive rail behaviour retained for tablet and mobile
- reduced-motion support
- active navigation now exposes `aria-current`

## Product areas retained

- live Overview landing page
- full Bird’s-eye map with four modes
- Structured, Block and Waffle views
- Territory Index and complete Territory Overview
- command chamber and item detail
- Timeline, Register, Dependencies, Evidence and Decisions
- CSV export

## Data

- 11 workstreams
- 248 complete project items
- existing owners, reviewers, status, risk, priority, progress, dates, evidence, decisions, next actions and dependencies retained

## GitHub Pages

Upload the complete `GHM_Atlas_Command_Centre_Map_v25` folder.

Expected URL:

`https://ghm-nft.github.io/Atlas/GHM_Atlas_Command_Centre_Map_v25/index.html`


## v25 mobile navigation
On screens up to 700px, the five map views remain visible as icon-only controls in the top bar. The hamburger opens a touch-friendly drawer containing SVG territory icons with words plus Timeline, Register, Dependencies, Evidence and Decisions.
