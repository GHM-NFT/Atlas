# RC3.8 amendment matrix

**Date:** 30 July 2026  
**Baseline:** v31+ RC3.7 Final Amends  
**Status:** Internal review build; owner Chrome sign-off still required.

| Area | Owner amendment | RC3.8 implementation |
|---|---|---|
| Navigation | Smaller-resolution top bar did not occupy/align across the full width; logo was offset | Set the existing `.atlas-topbar` to the full viewport at every breakpoint, aligned the ATLAS wordmark to the left edge, and moved the permanent desktop rail below the top bar so it no longer creates a blank left gap. |
| Dropdowns | Gold strokes and option affordance were insufficient | Strengthened the existing `select`, `.command-tools select` and `.filters select` borders and added a CSS option chevron without changing native selection behaviour. |
| Dependencies / Evidence / Decisions | Background behind paired action buttons looked split/striped | Restored a continuous dark backing across each Actions cell, reduced the ID/Owner/Target Date/Approval allocations, enlarged the Actions column and kept both buttons wholly inside the cell at desktop, iPad and mobile scroll positions. |
| Mobile Overview / Territory | Main icon, gauge and percentage were not centred | Centred the existing hero side/icon/progress containers and constrained the gauge to a centred responsive width. |
| Typography | Praetoria was not consistently applied to approved headings | Applied the existing local Praetoria font stack to the agreed Overview, Territory, panoramic, Command Index and map headings. |
| Back navigation | Back control sat inside the panoramic panel on mobile and too far below the desktop top bar | Updated `installRouteBackButtons()` to mark the containing page and retain a dedicated `.route-back-row` immediately before each `.shared-command-banner`; removed the inherited banner top margin so the complete Back band is 37px on desktop, iPad and mobile. |
| Panoramic headers | Header panels were oversized after the Back treatment | Reduced the existing `.shared-command-banner` minimum height/padding and set controlled responsive heading sizes. |
| Block > By Territory | Official icon overlapped the Territory copy | Rebuilt the existing `.territory-block-grid .block-head` layout with reserved icon/copy/arrow grid columns and responsive icon bounds. |
| Overview / Command Index | Heading copy crowded the Open Command Index button | Added explicit separation, top/bottom breathing room and a single-column mobile arrangement using the existing `.rc2-condensed-territories` selectors. |

No data, artwork, icons, labels or approved functional behaviour was changed.
