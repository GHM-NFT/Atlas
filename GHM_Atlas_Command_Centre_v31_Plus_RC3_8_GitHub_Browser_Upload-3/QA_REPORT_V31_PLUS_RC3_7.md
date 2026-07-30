# QA report — v31+ RC3.7 Final Amends

**Date:** 30 July 2026  
**Build:** Internal Local Mac  
**Result:** 16/16 static checks passed; scripted Chromium interaction checks passed at all five test widths.

## Static validation

- JavaScript syntax passed for all four runtime scripts.
- Index and runtime asset references resolve locally.
- CSS brace validation passed across all stylesheet layers.
- Approved snapshot counts are unchanged: 11 Territories, 201 work items, 877 physical records, 56 dependencies, 111 evidence records, 95 decisions, 47 risks/blockers and 210 validation findings.
- RC3.7 implementation markers passed for the programme-wide register, clickable internal rows, map pulse rings, 65% overlay, responsive menu, Evidence columns and tooltip suppression.

## Scripted Chromium checks

Tested at **1920**, **1440**, **1366**, **1180** and **390px** widths.

- Overview rendered 6 status signals, 201 full programme blocks, 201 panel blocks, 11 condensed Territory cards and 201 register rows.
- Responsive burger opened and closed at 1440px and below.
- At 1180px and below, primary text navigation was hidden and the five visual map controls remained.
- Evidence used two columns on desktop/tablet and one column at 390px.
- Milestone dropdowns measured 42px on desktop/tablet and 44px on mobile.
- Grey wax was selected for Not Started/Not Recorded milestone records.
- Dependencies rendered 56 whole-row record controls with paired action columns.
- Territory mini maps rendered clickable artwork and 28 sharp pulse rings for WS001.
- Opening a mini-map item opened the Quick Chamber, closed the drawer and hid transient tooltips.
- Full Bird’s-eye rendered 11 clickable Territory anchors and 201 clickable work-item nodes.
- No JavaScript page errors were recorded.

## Release checks still required

A fresh human Chrome visual pass is required at the agreed desktop, tablet and mobile viewports. This report does not claim pixel-level visual sign-off.

## Data integrity

No data was updated or inferred. The approved 21 July 2026 embedded snapshot remains unchanged. Percentage values remain estimated visual placeholders marked `est.`.
