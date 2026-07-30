# Changelog — v31+ RC3.8 Internal Review

Derived from RC3.7 Final Amends on 30 July 2026.

- Corrected full-width responsive top-navigation alignment and left-aligned the Atlas wordmark.
- Strengthened dropdown strokes and added a visible CSS option affordance.
- Removed split/striped backing behind paired record-action buttons.
- Centred mobile Overview and Territory icons, gauges and percentage values.
- Applied Praetoria consistently to approved display headings.
- Moved shared Back controls into a compact row above panoramic headers.
- Reduced panoramic header height and responsive title scale.
- Removed Block > By Territory icon/title overlap by reserving grid columns.
- Added deliberate spacing around Open Command Index.
- Preserved the approved 21 July 2026 embedded data snapshot and all supplied assets.

## Owner visual QA — Issue 2 corrections

- Made `.atlas-topbar` span the full viewport at 1440, 1366, 1180, 768, 430 and 390 widths.
- Moved the permanent desktop `.atlas-rail` below the full-width top bar, eliminating the blank left header gap without removing the rail.
- Rebalanced the real Dependency, Evidence and Decision `colgroup` definitions: narrower ID and utility columns, wider Actions columns.
- Removed the inherited 220px action-container minimum and kept both paired buttons inside the Actions cell.
- Restored a continuous dark Actions-cell/action-group backing, including alternate-row treatment.
- Added `.has-route-back` through `installRouteBackButtons()` and removed the inherited panoramic-banner top margin.
- Standardised the shell-to-banner Back band at 37px while preserving visible top and bottom padding.
- Re-ran six-width Chromium geometry/visual QA: 102/102 targeted assertions passed with no page errors.

## Final responsive navigation close correction

- Rebuilt the existing responsive `.mobile-menu` burger-to-X geometry so the close mark is fully visible, optically centred and evenly padded inside its square border.
- Preserved the existing button, event handling, menu behaviour, colours and responsive navigation modes.
- Verified the open-menu close state at 1440, 1366, 1180, 768, 430 and 390 widths in both packages: 12/12 targeted package/viewport checks passed with no page errors.

