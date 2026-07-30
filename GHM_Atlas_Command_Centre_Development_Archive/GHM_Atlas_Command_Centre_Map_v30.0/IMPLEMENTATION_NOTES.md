# v30.0 Implementation Notes

## Scope change

The review package revealed issues beyond navigation. v30.0 therefore combines the previously separate responsive-navigation, map-control, inner-page and command-centre polish phases into one larger milestone.

## Review findings addressed

### 1366×768
- top-right navigation/status styling
- heading focus-outline regression
- Overview map-stage gap
- Waffle alignment and icon scale
- Milestone view redesign
- Register Export CSV scale
- Dependencies, Evidence and Decisions visual system
- drawer and modal white-background regressions

### Tablet
- drawer top clipping and styling
- map-mode spacing and active underline
- logo and burger treatment
- status-line colour corrections
- larger territory imagery
- Block Map white-card regressions
- responsive filter/search controls
- right drawer and modal styling

### 390px mobile
- mobile hero emblem visibility
- top-banner spacing
- full-screen menu and two-column command links
- consistent stacked action buttons
- larger territory imagery
- green/health-aware progression treatment
- mobile map dock and quick controls
- better initial map fill
- territory overview restyling
- filter containment
- larger replacement Ethos banner

## Block Map model

The default Block Map now presents every visible item in one project-wide field. Blocks are:
1. grouped by workstream
2. ordered by state: Blocked, Review, Active, Later, Completed
3. coloured by the shared Atlas status palette
4. selectable for item details

A second view separates blocks by territory. Territory headers and footer links open the main territory overview.

## Typography

External fonts are permitted, so v30.0 uses:
- Cormorant Garamond: display headings and high-level hierarchy
- Inter: interface labels, buttons, filters, tables and long-form UI copy

Fallbacks are included for restricted or offline environments.

## Deferred content task

Working titles and subtitles have not been rewritten as final marketing copy. A dedicated copywriter handoff is included in `COPYWRITER_HANDOFF.md`.
