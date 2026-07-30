# RC3.8 amendment matrix

**Date:** 30 July 2026  
**Baseline:** v31+ RC3.7 Final Amends  
**Status:** Internal review build; owner Chrome sign-off still required.

| Area | Owner amendment | RC3.8 implementation |
|---|---|---|
| Navigation | Smaller-resolution top bar did not occupy/align across the full width; logo was offset | Corrected the existing `.atlas-topbar`, `.atlas-wordmark` and `.atlas-logo-button` grid/width/alignment rules at 1440, 1180 and mobile breakpoints. |
| Dropdowns | Gold strokes and option affordance were insufficient | Strengthened the existing `select`, `.command-tools select` and `.filters select` borders and added a CSS option chevron without changing native selection behaviour. |
| Dependencies / Evidence / Decisions | Background behind paired action buttons looked split/striped | Removed the action-cell backing from the actual table/action selectors; retained explicit individual button surfaces and side-by-side layout. |
| Mobile Overview / Territory | Main icon, gauge and percentage were not centred | Centred the existing hero side/icon/progress containers and constrained the gauge to a centred responsive width. |
| Typography | Praetoria was not consistently applied to approved headings | Applied the existing local Praetoria font stack to the agreed Overview, Territory, panoramic, Command Index and map headings. |
| Back navigation | Back control sat inside the panoramic panel on mobile and too far below the desktop top bar | Updated `installRouteBackButtons()` to create a dedicated `.route-back-row` immediately before each `.shared-command-banner`; compact spacing is shared across desktop, iPad and mobile. |
| Panoramic headers | Header panels were oversized after the Back treatment | Reduced the existing `.shared-command-banner` minimum height/padding and set controlled responsive heading sizes. |
| Block > By Territory | Official icon overlapped the Territory copy | Rebuilt the existing `.territory-block-grid .block-head` layout with reserved icon/copy/arrow grid columns and responsive icon bounds. |
| Overview / Command Index | Heading copy crowded the Open Command Index button | Added explicit separation, top/bottom breathing room and a single-column mobile arrangement using the existing `.rc2-condensed-territories` selectors. |

No data, artwork, icons, labels or approved functional behaviour was changed.
