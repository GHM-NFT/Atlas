# Implementation Notes — v30.2

`css/v30-2-finish.css` is the final styling authority for this revision.

The file is intentionally comprehensive. It covers the complete visible component inventory, including static pages and JavaScript-generated content.

## Typography

- `--font-brand`: local Praetoria when available, otherwise Roboto Slab.
- `--font-display`: Roboto Slab.
- `--font-ui`: Inter.

The Praetoria font binaries are not included in this package. The project owner can later host the licensed WOFF2 file and add a URL source to the existing `@font-face` rule.

## Overlay behaviour

The territory drawer, item modal and prototype form now use:

- focus entry
- Tab containment
- Escape close
- background inert state
- scroll lock
- focus restoration

The mobile navigation retains its existing independent modal focus behaviour.

# Implementation Notes — v30.1

The final CSS authority for this revision is `css/v30-1-consistency.css`.

The pass intentionally preserves the current font pairing:
- Cormorant Garamond for editorial headings and large data
- Inter for compact operational UI

Praetoria and the supplied White Paper webfonts are not bundled in this revision. They remain candidates for a later controlled branding pass after licensing and casing behaviour are confirmed.

The Block Map now exposes text through both an accessible `aria-label` and a custom role=`tooltip` element on hover or keyboard focus.

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
