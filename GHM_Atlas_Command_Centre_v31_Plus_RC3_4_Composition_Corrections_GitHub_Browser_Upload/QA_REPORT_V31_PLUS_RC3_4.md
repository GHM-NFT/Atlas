# QA report — GHM Atlas Command Centre v31+ RC3.4 GitHub Browser Upload

**Date:** 29 July 2026  
**Scope:** Static validation of the GitHub browser-upload build  
**Result:** 21 of 21 checks passed

## Passed checks

- JavaScript syntax validated with `node --check`.
- HTML contains 67 unique IDs with no duplicates.
- All 44 local HTML references resolve.
- The ordered CSS stack is compiled into `css/atlas-combined.css`.
- Combined CSS parses without top-level errors and all local asset references resolve.
- RC3.4 implementation markers and the approved dataset counts were confirmed.
- The browser-upload folder contains 90 files, below GitHub’s 100-file browser-upload limit.

## Browser review

A scripted Chrome visual run could not be completed in this execution environment because Chromium navigation is blocked by administrator policy. No visual sign-off is claimed.

Review the deployed GitHub Pages URL at 1920 × 1080, 1366 × 768, iPad portrait/landscape and 390 × 844.

## Data notice

This package embeds the internal 21 July 2026 snapshot. Publish it only where browser access to that data is approved.
