# QA report — GHM Atlas Command Centre v31+ RC3.8

**Date:** 30 July 2026  
**Baseline:** RC3.7 Final Amends  
**Release status:** Internal review candidate; final owner Chrome acceptance is still required.

## Controlled scope

RC3.8 is a surgical correction pass based on the RC3.7 Internal Local Mac source. It preserves the approved 21 July 2026 embedded snapshot, owner-supplied artwork, all 11 Territory icons, labels and application behaviour.

The amendment work was applied against the existing implementation selectors and functions rather than through generic catch-all overrides:

- navigation: `.atlas-topbar`, `.atlas-wordmark`, `.atlas-logo-button`, responsive rail variable `--rail`;
- dropdowns: existing `select`, `.command-tools select`, `.filters select`;
- paired actions: `.dependencies-page`, `.evidence-page`, `.decisions-page` and `.rc2-record-actions`;
- mobile hero: `.rc2-territory-hero-side`, `.territory-icon-progress`, existing progress elements;
- headings: the approved Overview, Territory, panoramic and map heading selectors with the existing Praetoria stack;
- Back control: existing `installRouteBackButtons()` and new dedicated `.route-back-row` immediately before `.shared-command-banner`;
- panoramic headers: `.shared-command-banner` and its existing title/copy structure;
- Block Territory cards: `.territory-block-grid .block-head`;
- Open Command Index: `.rc2-condensed-territories .overview-section-title` and `.panel-expand`.

## Visual amendment matrix

| Viewport | Navigation / shell | Amendment checks | Result |
|---:|---|---|---|
| 1440 | Desktop top bar aligned after permanent rail | Atlas wordmark clear of rail; no shell overflow | Pass |
| 1366 | Small-laptop desktop shell | Atlas wordmark, primary navigation and hero composition inspected | Pass |
| 1180 | Five visual controls plus burger | Rail-aware top bar; no page-level overflow | Pass |
| 768 | Tablet / iPad portrait | Five controls plus burger; compact Back row and panoramic header | Pass |
| 430 | Mobile | Centred Territory icon/gauge; responsive shell and menu | Pass |
| 390 | Mobile | Back placement, header sizing, dropdown stroke, paired actions, Block overlap and Command Index spacing | Pass |

## Automated visual results

- Local Mac package: **35 / 35 passed**, with **0 page errors**.
- Combined-CSS GitHub browser package: **35 / 35 passed**, with **0 page errors**.
- The 1366 desktop render is pixel-identical between the layered local CSS build and the combined GitHub CSS build.

Checks include top-bar/rail geometry, left wordmark clearance, five-control responsive navigation, Back row placement, panoramic-header height, mobile hero centring, Praetoria heading stack, Block Territory icon/copy collision, Open Command Index spacing, dropdown stroke/chevron and transparent paired-action backing.

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
