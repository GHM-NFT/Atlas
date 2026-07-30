# QA report — GHM Atlas Command Centre v31+ RC3.8

**Date:** 30 July 2026  
**Baseline:** RC3.7 Final Amends  
**Release status:** Internal review candidate; final owner Chrome acceptance is still required.

## Controlled scope

RC3.8 is a surgical correction pass based on the RC3.7 Internal Local Mac source. It preserves the approved 21 July 2026 embedded snapshot, owner-supplied artwork, all 11 Territory icons, labels and application behaviour.

The amendment work was applied against the existing implementation selectors and functions rather than through generic catch-all overrides:

- navigation: `.atlas-topbar`, `.atlas-wordmark`, `.atlas-logo-button`, `.atlas-rail` and responsive rail variable `--rail`;
- dropdowns: existing `select`, `.command-tools select`, `.filters select`;
- paired actions: the real Dependency/Evidence/Decision `colgroup` definitions, `.rc2-record-table td:last-child` and `.rc2-record-actions`;
- mobile hero: `.rc2-territory-hero-side`, `.territory-icon-progress`, existing progress elements;
- headings: the approved Overview, Territory, panoramic and map heading selectors with the existing Praetoria stack;
- Back control: existing `installRouteBackButtons()`, the page-level `.has-route-back` marker and dedicated `.route-back-row` immediately before `.shared-command-banner`;
- panoramic headers: `.shared-command-banner` and its existing title/copy structure;
- Block Territory cards: `.territory-block-grid .block-head`;
- Open Command Index: `.rc2-condensed-territories .overview-section-title` and `.panel-expand`.

## Visual amendment matrix

| Viewport | Navigation / shell | Amendment checks | Result |
|---:|---|---|---|
| 1440 | Full-width desktop top bar; rail begins below it | ATLAS aligned to viewport edge; no blank left header gap | Pass |
| 1366 | Full-width small-laptop shell | ATLAS, primary navigation and rail/top-bar junction inspected | Pass |
| 1180 | Five visual controls plus burger | Full-width top bar; no page-level overflow | Pass |
| 768 | Tablet / iPad portrait | Five controls plus burger; compact Back row and panoramic header | Pass |
| 430 | Mobile | Centred Territory icon/gauge; responsive shell and menu | Pass |
| 390 | Mobile | Back placement, header sizing, dropdown stroke, paired actions, Block overlap and Command Index spacing | Pass |

## Automated visual results

- The previous broader RC3.8 pass remains recorded at **35 / 35** for both local and combined-CSS editions.
- The final owner visual-QA Issue 2 pass completed **102 / 102 targeted assertions** across 1440, 1366, 1180, 768, 430 and 390 widths, with **0 page errors**.
- Assertions cover full-width top-bar geometry, correct responsive navigation mode, compact Back-band geometry, non-transparent Actions backing, narrower ID columns, and both paired buttons remaining fully inside the Actions cell after horizontal scrolling.
- Visual renders were inspected at 1440, 1180, 768 and 390 widths, including a right-scrolled iPad register view.


## Final owner visual-QA Issue 2 result

The four reported defects were corrected without changing the approved data or supplied artwork:

1. `.atlas-topbar` now starts at `x = 0` and ends at the viewport edge at all six target widths. On desktop, `.atlas-rail` starts below the top bar instead of occupying the header's left strip.
2. Dependency, Evidence and Decision registers now use rebalanced real `colgroup` widths. The ID column is reduced and the Actions column receives the recovered space.
3. Actions cells and `.rc2-record-actions` have a continuous dark backing. Both buttons remain wholly inside the Actions cell at the rightmost horizontal-scroll position.
4. The Back control remains outside the panoramic header. The inherited banner top margin is removed and the complete top-bar-to-banner band is 37px at desktop, iPad and mobile widths.

Targeted geometry report: `102 / 102` passed, `0` page errors.

## Route and functionality smoke test

The principal routes were opened at 1366 and 390 widths:

Overview, Bird’s-eye, Structured, Block, Waffle, Command Index, Milestones, Register, Dependencies, Evidence, Decisions, Internal audit and Territory/WS001.

For both packages:

- **7 / 7 smoke assertions passed**;
- all principal routes rendered;
- no page-level horizontal overflow;
- responsive navigation opened and closed;
- the Back control returned to the prior route;
- 0 page errors, 0 relevant console errors and 0 failed local responses.

## Static and data integrity

- All JavaScript files pass `node --check`.
- HTML local references resolve.
- CSS braces are balanced and local CSS asset URLs resolve.
- Explicit runtime asset references resolve.
- The RC3.8 `js/data.js` SHA-256 is unchanged from RC3.7:  
  `60aa2ed41afb5d29c02f371d96a72c374f5fc5f256fcbd68e23dc41eb01fb4e3`
- Approved manifest counts remain: 877 physical rows, 873 unique Node IDs, 201 work items, 11 Territories, 63 milestones, 56 dependencies, 111 evidence records, 95 decisions, 47 risks/blockers and 210 validation findings.
- No live Google Sheets connection was introduced.
- The GitHub edition contains the RC3.8 correction layer inside `css/atlas-combined.css` and remains below the 100-file browser-upload ceiling.

## Review boundary

This QA demonstrates controlled implementation and browser rendering in the execution environment. It does not replace the owner’s final visual review in Chrome on the target Mac/iPad/mobile hardware. No GitHub deployment or public-release approval is implied by this package.

## Final responsive navigation close-control check

The final owner-reported defect was corrected on the existing `#mobileMenu`, `.burger-lines` and expanded-state selectors. No replacement image or new navigation component was introduced.

- The control is a 44 × 44px square at 1440–768 widths and 42 × 42px at 430–390 widths.
- The expanded X is centred horizontally and vertically.
- Effective inner spacing is 13px on every side at all six target widths.
- Both diagonal strokes remain wholly inside the control.
- The middle burger stroke becomes fully transparent in the expanded state.
- Local Mac and GitHub combined-CSS editions passed **12 / 12** targeted checks with **0 page errors**.

