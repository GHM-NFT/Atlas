# QA report — GHM Atlas Command Centre v31+ RC3.3 Chrome Pass

**Date:** 29 July 2026  
**Scope:** Static validation of the local Mac review build  
**Result:** 31 of 31 checks passed

## Passed checks

- JavaScript syntax validated with `node --check`.
- Both launch scripts passed `bash -n` and retain executable permissions.
- The Mac application plist is valid and reports version 31.3.3.
- HTML contains 67 unique IDs with no duplicates.
- All 66 local references from the HTML resolve.
- All stylesheet braces and local CSS asset references resolve.
- The embedded data snapshot retains the approved counts:
  - 877 physical rows
  - 873 unique node IDs
  - 201 work items
  - 63 milestones
  - 56 dependencies
  - 111 evidence records
  - 95 decisions
  - 47 risks/blockers
  - 210 validation findings
- RC3.3 implementation markers were confirmed for the Overview rebuild, estimated progress, Bird’s-eye animation and nodes, Waffle borders, 1440px navigation breakpoint, responsive summaries, route scroll reset, Milestone wax seals, blocked chambers and tooltip cleanup.
- The supplied Command Centre Map assets and orange/turquoise wax seals are present with expected dimensions.
- The current build manifest is present.

## Browser review

A scripted Chrome visual run could not be completed in this execution environment because local browser navigation is restricted. No claim is made that the visual amendments are signed off.

Please perform the next visual pass in Chrome at:

- 1920 × 1080
- 1366 × 768
- iPad portrait and landscape
- 390 × 844

Priority review points are the redesigned Overview, return-route icon position, 1440px navigation behaviour, Bird’s-eye interaction, condensed Territory gauges, Quick Chamber evidence typography, Milestone cards and record-action controls.

## Data authority

The dataset was not changed. Estimated percentages remain non-authoritative visual placeholders and are labelled `est.`.
