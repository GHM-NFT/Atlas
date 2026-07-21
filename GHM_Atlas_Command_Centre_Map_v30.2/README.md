# GHM Atlas Command Centre v30.2

Final visual-system completion pass before the audited data and revised copy arrive.

## Included

- Refined v20-inspired loader with the approved navy/bronze gradient and subtle slow-moving light shift.
- Roboto Slab editorial typography with Inter retained for compact operational UI.
- Praetoria-ready display stack using a local-font check and safe Roboto Slab fallback.
- Approved `header-1300x330.webp` used as restrained branded texture on page and territory headers.
- Completed styling for every current page, card, filter, table, empty state, drawer, modal, toast and tooltip.
- One consistent primary, secondary, filter and compact action-button language.
- Complete styling of Overview, Bird's-eye, Structured, Block, Waffle, Command Index, Territory detail, Milestones, Register, Dependencies, Evidence and Decisions.
- Full styling of the mobile menu, quick territory chamber, item-detail modal and prototype-input modal.
- Improved overlay keyboard behaviour: focus entry, focus trapping, Escape closing and focus restoration.
- Responsive completion rules through 320px and short-height desktop handling.
- Existing routes, data, map gestures, status colours and v30.1 Block Map functionality preserved.
- No generated imagery.

## Typography note

The package does not redistribute the licensed Praetoria font file. CSS checks for a locally available Praetoria installation and otherwise uses Roboto Slab. The licensed webfont can later be hosted by the project owner and connected to the existing `--font-brand` stack without changing component styling.

## Entry point

`index.html`

# GHM Atlas Command Centre v30.1

Cross-application styling consistency and Block Map refinement.

## v30.1 changes

- Applies the successful Overview typography hierarchy throughout Atlas.
- Keeps micro labels, filters, metadata and dense tables in the small UI sans-serif.
- Uses the editorial serif consistently for page headings, card headings, metrics and large numbers.
- Rebuilds the Block Map status controls to the same detail and quality level as the Overview current-state bar.
- Adds status descriptions and clear colour accents without adding wax seals to dense block controls.
- Adds accessible custom hover and keyboard-focus tooltips to every coloured block.
- Unifies action buttons, filter controls, cards, metrics, forms, tables, drawers and modal surfaces.
- Keeps the Whole Project / By Territory Block Map switch and working territory drill-down.
- Preserves the v30.0 responsive work, navigation, data, routes, map gestures and existing functionality.
- Does not yet introduce Praetoria; the dedicated typography-branding pass remains separate.
- Uses no generated imagery.

## Entry point

`index.html`

# GHM Atlas Command Centre v30.0

## Responsive & Command-Centre Consolidation

This build expands the approved v29.4 navigation shell into a broader responsive and inner-page refinement pass. It preserves the existing Atlas data, routes and information architecture while correcting the issues documented in the 1366×768, tablet and 390px mobile review package.

### Major changes

- Re-labels **Timeline** as **Command Index** in desktop and mobile navigation and routes it to the existing Territory Index.
- Retains the Milestone Horizon as an internal operational view and redesigns it into useful milestone groups, dated actions and programme-level summaries.
- Introduces a whole-project Block Map with all 248 coloured blocks in one field, plus a switchable by-territory view.
- Refines Waffle filtering with search, quick status controls and a responsive card layout.
- Refines Dependencies, Evidence and Decisions into distinct but consistent command-centre views.
- Restyles territory index cards and territory overview pages, adds section emblems, consistent action buttons and health-colour treatment.
- Repairs drawers, item modals and white-background component regressions.
- Adds a branded loader using the supplied GHM command-centre emblem.
- Adds animated mobile burger states and a full-screen responsive navigation panel.
- Adds mobile two-column Command Centre links.
- Improves Bird’s-eye controls, adds quick map actions and supports wheel, drag and pinch gestures on the map.
- Uses the supplied replacement `Ethos-banner.jpg` at a larger size across desktop, tablet and mobile.
- Adds external typography with resilient fallbacks:
  - Cormorant Garamond for display headings
  - Inter for interface copy, controls and tables
- Removes visible route-focus outlines from headings while preserving strong focus treatment for interactive controls.
- Fixes dynamic link binding so generated back links and route buttons remain live.

### Entry point

`index.html`

### Deployment

Upload the complete `GHM_Atlas_Command_Centre_Map_v30.0` folder to the Atlas repository without changing its internal structure.

Expected GitHub Pages route:

`https://ghm-nft.github.io/Atlas/GHM_Atlas_Command_Centre_Map_v30.0/index.html#overview`

### Important

This build uses supplied artwork only. No image generation was used.
